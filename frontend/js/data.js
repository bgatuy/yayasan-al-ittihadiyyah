(function() {
  'use strict';

  // --- CORE API REQUEST FUNCTION ---
  // Fungsi pusat untuk semua komunikasi API.
  // Secara otomatis menambahkan header otentikasi untuk rute admin.
  async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    let url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;
    
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
        const isLoginPage = window.location.pathname.endsWith('/login.html');

        // Handle 401 untuk token yang kedaluwarsa di halaman mana pun KECUALI halaman login itu sendiri.
        // 401 di halaman login berarti kredensial salah, yang harus ditangani oleh alur error normal di bawah.
        if (!isLoginPage) {
            const isAnAdminPage = window.location.pathname.includes('/admin/');

            // Untuk halaman admin mana pun, 401 yang tidak terduga berarti sesi telah berakhir. Logout.
            if (isAnAdminPage) {
                if (window.Auth) {
                    window.Auth.logout(); // Fungsi ini menangani redirect.
                }
                // Hentikan eksekusi lebih lanjut.
                return new Promise(() => {});
            }

            // Untuk halaman publik, cukup catat error dan berhenti.
            console.error(`Unauthorized access attempt from a public page to ${endpoint}.`);
            return null;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        const err = new Error(data.message || 'Terjadi kesalahan pada server.');

        // 🔥 teruskan retry_after kalau ada (untuk throttle login)
        if (data.retry_after) {
          err.retry_after = data.retry_after;
        }

        throw err;
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
        // The backend route for update is POST /admin/guru/{id}, not PUT.
        // We ensure the _method field is not sent, following the pattern from updatePpdb.
        if (formData.has('_method')) formData.delete('_method');
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