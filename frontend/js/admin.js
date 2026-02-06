function switchView(viewId) {
  // Sembunyikan semua view
  document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
  
  // Tampilkan view yang dipilih
  const targetView = document.getElementById('view-' + viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
  }
  
  // Auto refresh data saat membuka menu PPDB
  if (viewId === 'ppdb' && typeof window.refreshPpdbTable === 'function') {
    window.refreshPpdbTable();
  }

  // Auto refresh data saat membuka menu PPDB Arsip
  if (viewId === 'ppdb-arsip' && typeof window.refreshPpdbArchiveTable === 'function') {
    window.refreshPpdbArchiveTable();
  }

  // Muat data saat membuka menu Kelola Halaman PPDB
  if (viewId === 'ppdb-page') {
    loadPpdbPageSettings();
  }
  
  // Close pages submenu when switching to another view
  const pagesSubmenu = document.getElementById('pages-submenu');
  const pagesToggleBtn = document.getElementById('btn-pages-toggle');
  if (pagesSubmenu && !pagesSubmenu.classList.contains('hidden') && viewId !== 'academic') {
      pagesSubmenu.classList.add('hidden');
      pagesSubmenu.classList.remove('flex');
      document.getElementById('pages-submenu-icon').classList.remove('rotate-180');
  }
  
  // Update state tombol sidebar
  document.querySelectorAll('.nav-item').forEach(btn => {
    // Reset ke style default (inactive)
    btn.classList.remove('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/50');
    btn.classList.add('text-white/80', 'hover:bg-white/10');
  });
  // Also reset the pages toggle button style if it was active
  if (pagesToggleBtn) {
    pagesToggleBtn.classList.remove('bg-white/10');
  }

  // Set style active untuk tombol yang dipilih
  const activeBtn = document.getElementById('btn-' + viewId);
  if (activeBtn) {
    activeBtn.classList.remove('text-white/80', 'hover:bg-white/10');
    activeBtn.classList.add('bg-primary', 'text-white', 'shadow-lg', 'shadow-primary/50');
  }

  // Close sidebar on mobile after switching view
  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth < 768 && sidebar && !sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  
  // Toggle class translate untuk menampilkan/menyembunyikan sidebar
  sidebar.classList.toggle('-translate-x-full');
  
  // Toggle overlay
  overlay.classList.toggle('hidden');
}

// Fungsi untuk memuat modal secara dinamis
function loadModals() {
  fetch('/admin/modals.html')
    .then(response => response.text())
    .then(html => {
      const modalContainer = document.getElementById('modal-container');
      if (modalContainer) {
        modalContainer.innerHTML = html;
      }

      // --- PINDAHKAN LOGIKA HAPUS KE SINI ---
      // Listener untuk tombol konfirmasi hapus di modal.
      // Ditempatkan di sini untuk memastikan modal dan tombolnya sudah ada di DOM.
      const btnConfirmDelete = document.getElementById('btn-confirm-delete');
      if (btnConfirmDelete) {
        btnConfirmDelete.addEventListener('click', async () => {
          if (!itemToDelete) return;

          try {
            switch (itemToDelete.type) {
              case 'ppdb':
                await window.DataStore.deletePpdb(itemToDelete.id);
                let readNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];
                if (readNotifs.includes(itemToDelete.id)) {
                    readNotifs = readNotifs.filter(id => id !== itemToDelete.id);
                    localStorage.setItem('read_notifications', JSON.stringify(readNotifs));
                }

                // Cek view mana yang sedang aktif dan panggil fungsi refresh yang sesuai.
                const ppdbArsipView = document.getElementById('view-ppdb-arsip');

                if (ppdbArsipView && !ppdbArsipView.classList.contains('hidden')) {
                  // Jika di halaman arsip, panggil refresh untuk arsip.
                  if (typeof window.refreshPpdbArchiveTable === 'function') {
                    window.refreshPpdbArchiveTable();
                  }
                } else {
                  // Jika tidak, asumsikan di halaman PPDB aktif atau dashboard, yang keduanya perlu refresh data aktif.
                  if (typeof window.refreshPpdbTable === 'function') {
                    window.refreshPpdbTable();
                  }
                }
                break;
              case 'news':
                await window.DataStore.deleteNews(itemToDelete.id);
                if (typeof window.renderAdminNews === 'function') window.renderAdminNews();
                break;
              case 'gallery':
                await window.DataStore.deleteGallery(itemToDelete.id);
                if (typeof window.renderAdminGallery === 'function') window.renderAdminGallery();
                break;
              case 'teacher':
                await window.DataStore.deleteTeacher(itemToDelete.id);
                if (typeof window.renderAdminTeachers === 'function') window.renderAdminTeachers();
                break;
              case 'dom':
                if (itemToDelete.element) itemToDelete.element.remove();
                break;
              default:
                console.warn('Tipe item untuk dihapus tidak dikenal:', itemToDelete.type);
                break;
            }
          } catch (error) {
            console.error('Gagal menghapus item:', error);
            alert('Gagal menghapus data. Silakan coba lagi.');
          } finally {
            // Reset state
            itemToDelete = null;
            window.utils.toggleModal('modal-confirm');
          }
        });
      }
      // --- AKHIR DARI BLOK YANG DIPINDAHKAN ---

      // Panggil setupIdleTimeout HANYA SETELAH modal berhasil dimuat.
      setupIdleTimeout();
      // Kirim sinyal (event) bahwa semua modal telah siap.
      document.dispatchEvent(new Event('modalsReady'));
    })
    .catch(err => console.error('Gagal memuat modal:', err));
}

// Fungsi untuk mengisi data pengguna di topbar
function populateUserData() {
  const user = window.Auth.getUserData();
  if (user) {
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    const userInitialEl = document.getElementById('user-initial');

    if (userNameEl) userNameEl.textContent = user.name || 'Administrator';
    if (userRoleEl) userRoleEl.textContent = user.email || 'email@example.com';
    if (userInitialEl && user.name) {
      userInitialEl.textContent = user.name.charAt(0).toUpperCase();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // --- AUTHENTICATION CHECK ---
  // Redirect ke halaman login jika tidak ada token atau token tidak valid
  if (typeof window.Auth !== 'undefined' && !window.Auth.getAuthToken()) {
    window.location.href = '/admin/login.html';
    return; // Hentikan eksekusi script jika belum login
  }

  // --- INITIALIZE PAGE ---
  loadModals();
  populateUserData();

  // --- URL CLEANER ---
  // Hapus index.html dari address bar agar terlihat lebih bersih
  if (window.location.pathname.endsWith('index.html')) {
      const newPath = window.location.pathname.replace(/index\.html$/, '');
      window.history.replaceState(null, '', newPath + window.location.search + window.location.hash);
  }
  
  // Submenu for "Halaman"
  const pagesToggleBtn = document.getElementById('btn-pages-toggle');
  const pagesSubmenu = document.getElementById('pages-submenu');
  const pagesSubmenuIcon = document.getElementById('pages-submenu-icon');

  if (pagesToggleBtn && pagesSubmenu && pagesSubmenuIcon) {
      pagesToggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpening = pagesSubmenu.classList.contains('hidden');

          pagesSubmenu.classList.toggle('hidden');
          pagesSubmenu.classList.toggle('flex');
          pagesSubmenuIcon.classList.toggle('rotate-180');
      });
  }

  // Event delegation untuk fitur-fitur lain (seperti hapus) sudah ditangani di dalam file JS masing-masing (e.g., data-ppdb.js, berita.js) atau saat modal diload.

});

/**
 * Mengelola Idle Timeout untuk sesi admin.
 * Menampilkan modal setelah 30 menit tidak aktif.
 */
function setupIdleTimeout() {
    // Timeout diatur ke 30 menit.
    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; 

    let idleTimer;

    const modal = document.getElementById('modal-session-timeout');
    if (!modal) {
        console.warn('Modal session timeout tidak ditemukan. Fitur idle timeout dinonaktifkan.');
        return;
    }

    const btnOk = document.getElementById('btn-session-expired-ok');

    const forceLogout = () => {
        if (window.Auth) {
            window.Auth.logout();
        } else {
            console.error("Auth object not found. Cannot logout.");
        }
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];

    const showSessionExpiredModal = () => {
        // Hentikan timer dan listener aktivitas karena sesi sudah berakhir
        clearTimeout(idleTimer);
        activityEvents.forEach(event => {
            window.removeEventListener(event, resetIdleTimer, { passive: true });
        });

        // Tampilkan modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    };

    const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(showSessionExpiredModal, IDLE_TIMEOUT_MS);
    };

    // Event listeners untuk mendeteksi aktivitas dan mereset timer
    activityEvents.forEach(event => {
        window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    if (btnOk) btnOk.addEventListener('click', forceLogout);

    resetIdleTimer();
}

// --- LOGOUT FUNCTION ---
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => window.Auth.logout());
}

// Helper: View Full Image
window.viewFullImage = function(src) {
    const modal = document.getElementById('modal-image-viewer');
    const img = document.getElementById('full-image-source');

    if(modal && img) {
        const fullUrl = window.utils.getStorageUrl(src);
        img.src = fullUrl;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}