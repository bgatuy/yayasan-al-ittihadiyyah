(function() {
  'use strict';

  // --- CORE API REQUEST FUNCTION ---
  // Fungsi pusat untuk semua komunikasi API.
  // Secara otomatis menambahkan header otentikasi untuk rute admin.
  async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    let url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;
    
    // --- CACHE BUSTING ---
    // Menambahkan parameter unik ke setiap GET request untuk memaksa browser
    // mengambil data terbaru dari server, bukan dari cache. Ini sangat penting
    // untuk memastikan perubahan di admin langsung terlihat di halaman publik.
    if (method === 'GET') {
      url += (url.includes('?') ? '&' : '?') + `_=${new Date().getTime()}`;
    }
    
    // Ambil token dari localStorage (atau di mana pun auth.js menyimpannya)
    const token = window.Auth ? window.Auth.getAuthToken() : null;

    const headers = {
      'Accept': 'application/json',
    };

    // Tambahkan header Authorization jika token ada.
    // Ini adalah kunci untuk mengakses rute admin yang dilindungi.
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body) {
      if (isFormData) {
        // Untuk FormData, browser akan mengatur 'Content-Type' secara otomatis.
        options.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    try {
      const response = await fetch(url, options);

      if (response.status === 401) {
        const isAnAdminPage = window.location.pathname.includes('/admin/');
        
        // Selalu hapus token jika ada error 401, menandakan sesi tidak valid.
        if (window.Auth) {
            window.Auth.logout();
        }

        // Jika pengguna berada di halaman admin, redirect paksa ke halaman login.
        if (isAnAdminPage) {
            window.location.href = '/admin/login.html';
            // Mengembalikan promise yang tidak pernah resolve untuk menghentikan eksekusi lebih lanjut.
            return new Promise(() => {});
        }

        // Jika di halaman publik, jangan lempar error fatal. Ini mencegah crash
        // jika ada skrip di halaman publik yang salah memanggil endpoint admin.
        console.error(`Unauthorized access attempt from a public page to ${endpoint}.`);
        // Kembalikan null agar promise resolve dan tidak menyebabkan error "Uncaught".
        return null;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan pada server.');
      }

      return data;
    } catch (error) {
      console.error(`Gagal ${method} request ke ${endpoint}. Error: ${error.message}`);
      throw error; // Lemparkan kembali error agar bisa ditangani oleh fungsi pemanggil.
    }
  }

  // --- DATA STORE OBJECT ---
  // Objek ini menyediakan API yang bersih untuk digunakan oleh bagian lain dari aplikasi.
  window.DataStore = {
    // --- AUTHENTICATION ---
    login: (credentials) => apiRequest('/login', 'POST', credentials),

    // --- PUBLIC ENDPOINTS ---
    getPpdbPageSettings: () => apiRequest('/ppdb-page'),
    getNews: (page = 1, search = '') => apiRequest(`/news?page=${page}&search=${search}`),
    getNewsById: (id) => apiRequest(`/news/${id}`),
    getNewsDetail: (slug) => apiRequest(`/news/${slug}`), // Kept for potential future use by slug
    getGallery: () => apiRequest('/galeri'),
    getTeachers: () => apiRequest('/guru'),
    getAcademicPage: (jenjang) => apiRequest(`/akademik/${jenjang}`),
    // Wrappers for specific pages, used in multiple places
    getAcademicTK: () => apiRequest('/akademik/tk'),
    getAcademicMI: () => apiRequest('/akademik/mi'),
    
    // PPDB Public
    registerPpdb: (formData) => apiRequest('/ppdb', 'POST', formData, true),
    checkPpdbStatus: (id) => apiRequest(`/ppdb/status/${id.toUpperCase()}`),
    uploadPaymentProof: (id, formData) => apiRequest(`/ppdb/${id.toUpperCase()}/payment`, 'POST', formData, true),

    // --- ADMIN ENDPOINTS (akan otomatis menggunakan token) ---
    getDashboardStats: () => apiRequest('/admin/dashboard'),
    
    // Admin PPDB
    getPpdb: () => apiRequest('/admin/ppdb'),
    getPpdbDetail: (id) => apiRequest(`/admin/ppdb/${id}`),
    updatePpdb: (id, formData) => {
      // Backend route didefinisikan sebagai POST, jadi kita harus menghapus _method=PUT jika ada
      if (formData instanceof FormData && formData.has('_method')) {
        formData.delete('_method');
      }
      return apiRequest(`/admin/ppdb/${id}`, 'POST', formData, true);
    },
    deletePpdb: (id) => apiRequest(`/admin/ppdb/${id}`, 'DELETE'),

    // Admin News
    saveNews: (formData) => {
      const id = formData.get('id');
      if (id) {
        // Laravel needs a _method field to handle PUT/PATCH via POST
        formData.append('_method', 'PUT');
        return apiRequest(`/admin/news/${id}`, 'POST', formData, true);
      }
      return apiRequest('/admin/news', 'POST',formData, true);
    },
    deleteNews: (id) => apiRequest(`/admin/news/${id}`, 'DELETE'),

    // Admin Gallery, Teachers, Settings, etc.
    saveGallery: (formData) => apiRequest('/admin/galeri', 'POST', formData, true),
    deleteGallery: (id) => apiRequest(`/admin/galeri/${id}`, 'DELETE'),
    saveTeacher: (formData) => {
      const id = formData.get('id');
      if (id) {
        // admin.js already adds _method: 'PUT', but we ensure it here.
        if (!formData.has('_method')) formData.append('_method', 'PUT');
        return apiRequest(`/admin/guru/${id}`, 'POST', formData, true);
      }
      return apiRequest('/admin/guru', 'POST', formData, true);
    },
    deleteTeacher: (id) => apiRequest(`/admin/guru/${id}`, 'DELETE'),
    savePpdbPageSettings: (settingsData) => {
      // Deteksi otomatis jika data yang dikirim adalah FormData (untuk file upload)
      const isForm = settingsData instanceof FormData;
      return apiRequest('/admin/ppdb-page', 'POST', settingsData, isForm);
    },
    saveAcademicTK: (data) => apiRequest('/admin/akademik/tk', 'POST', data, true),
    saveAcademicMI: (data) => apiRequest('/admin/akademik/mi', 'POST', data, true),
  };

})();