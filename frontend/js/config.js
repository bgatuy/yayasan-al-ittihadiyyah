/**
 * Konfigurasi Global Aplikasi
 * PENTING: File ini harus dimuat (script src) SEBELUM data.js di file HTML Anda.
 */
(function() {
  // Deteksi apakah sedang berjalan di localhost (Development)
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' ||
                  window.location.hostname.includes('192.168.'); // Opsional: untuk testing di HP via WiFi lokal

  const apiBaseUrl = isLocal 
    ? `http://${window.location.hostname}:8000/api`
    : 'https://api.yayasanalittihadiyyah.com/api';

  // Buat URL dasar untuk file storage, misal: http://localhost:8000/storage
  const storageBaseUrl = apiBaseUrl.replace('/api', '/storage');

  window.APP_CONFIG = {
    // Logika otomatis: Jika di localhost pakai port 8000, jika online pakai domain yayasan
    API_BASE_URL: apiBaseUrl,
    STORAGE_BASE_URL: storageBaseUrl,
  };

  console.log('Environment:', isLocal ? 'Development (Local)' : 'Production');
  console.log('API Base URL:', window.APP_CONFIG.API_BASE_URL);
  console.log('Storage Base URL:', window.APP_CONFIG.STORAGE_BASE_URL);
})();