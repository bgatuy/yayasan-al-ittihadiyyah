(function() {
  'use strict';

  // --- CORE API REQUEST FUNCTION ---
  // Fungsi pusat untuk semua komunikasi API.
  // Secara otomatis menambahkan header otentikasi jika token tersedia.
  // Untuk mode cookie HttpOnly, autentikasi dilakukan via cookie.
  async function apiRequest(endpoint, method = 'GET', body = null, isFormData = false) {
    let url = `${window.APP_CONFIG.API_BASE_URL}${endpoint}`;
    
    // Ambil token jika ada (fallback, tidak digunakan saat cookie HttpOnly aktif)
    const token = (window.Auth && typeof window.Auth.getAuthToken === 'function')
      ? window.Auth.getAuthToken()
      : null;

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
      credentials: 'include', // Kirim cookie HttpOnly untuk autentikasi
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
        const isLogoutEndpoint = endpoint.startsWith('/admin/logout');
        const isMeEndpoint = endpoint.startsWith('/admin/me');

        // Handle 401 untuk token yang kedaluwarsa di halaman mana pun KECUALI halaman login itu sendiri.
        // 401 di halaman login berarti kredensial salah, yang harus ditangani oleh alur error normal di bawah.
        if (!isLoginPage) {
            const isAnAdminPage = window.location.pathname.includes('/admin/');

            // Untuk halaman admin mana pun, 401 yang tidak terduga berarti sesi telah berakhir. Logout.
            if (isAnAdminPage) {
                if (isLogoutEndpoint) {
                    return null;
                }
                if (isMeEndpoint) {
                    throw new Error('Unauthorized');
                }
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
    getMe: () => apiRequest('/admin/me'),
    logout: () => apiRequest('/admin/logout', 'POST'),

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
    // Modified to accept academicYear and other filters for flexibility
    // Backend should handle defaulting to current active year if academicYear is null
    getPpdb: (academicYear = null, search = '', jenjang = '', status = '', wave = '', page = 1, itemsPerPage = 5) => { 
      let endpoint = '/admin/ppdb';
      const params = new URLSearchParams();

      // If academicYear is not explicitly provided, and we are in an admin context,
      // we might want to fetch the current active year from settings.
      // However, it's cleaner to let the backend handle the default for /admin/ppdb
      // and explicitly pass academicYear for archive pages.
      // So, for this frontend DataStore, we just pass what's given.
      // The backend logic for /admin/ppdb should be:
      // - If tahun_ajaran param is present, filter by it.
      // - If tahun_ajaran param is NOT present, filter by the system's current_active_academic_year.
      // This makes getPpdb versatile for both active and archive views.

      // For the purpose of this diff, I'm assuming the backend will handle the default
      // if academicYear is null. If the backend requires it, you'd fetch settings here
      // and set academicYear if it's null.
      // Example:
      // if (!academicYear && window.location.pathname.includes('/admin/data-ppdb.html')) {
      //    const settings = await window.DataStore.getPpdbPageSettings();
      //    academicYear = settings.tahun_ajaran_aktif;
      // }

      if (academicYear) params.append('tahun_ajaran', academicYear);
      if (search) params.append('search', search);
      if (jenjang) params.append('jenjang', jenjang);
      if (status) params.append('status', status);
      if (wave) params.append('gelombang', wave);
      params.append('page', page);
      params.append('per_page', itemsPerPage); // Assuming backend supports pagination parameters

      if (params.toString()) {
          endpoint += `?${params.toString()}`;
      }
      return apiRequest(endpoint);
    },
    getPpdbDetail: (id, academicYear = null) => { // Modified to accept academicYear
      let endpoint = `/admin/ppdb/${id}`;
      if (academicYear) endpoint += `?tahun_ajaran=${academicYear}`;
      return apiRequest(endpoint);
    },
    // Modified to accept academicYear for targeted updates if needed by backend
    updatePpdb: (id, formData, academicYear = null) => { 
      // Backend route didefinisikan sebagai POST, jadi kita harus menghapus _method=PUT jika ada
      if (formData instanceof FormData && formData.has('_method')) {
        formData.delete('_method');
      }
      return apiRequest(`/admin/ppdb/${id}`, 'POST', formData, true);
    },
    getAcademicYears: () => apiRequest('/admin/ppdb-academic-years'), // New endpoint to get all available academic years
    getPpdbPageSettings: () => apiRequest('/ppdb-page'), // Ensure this is accessible for admin
    // If you need a separate endpoint for deleting archived PPDB, you'd add it here.
    // For now, assuming deletePpdb can handle academicYear if passed, or ID is unique enough.
    // deletePpdb: (id, academicYear = null) => {
    //   let endpoint = `/admin/ppdb/${id}`;
    //   if (academicYear) endpoint += `?tahun_ajaran=${academicYear}`;
    //   return apiRequest(endpoint, 'DELETE');
    // },
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
