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

async function renderAdminNews() {
  const grid = document.getElementById('admin-news-grid');
  if (!grid) return;
  
  const newsResponse = await window.DataStore.getNews(); // Mengambil objek respons lengkap dari API

  grid.innerHTML = newsResponse.data.map(item => `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group">
      <div class="relative h-48 overflow-hidden">
        <img src="${window.utils.getStorageUrl(item.image || item.gambar || item.img)}" alt="${item.title || item.judul}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
      </div>
      <div class="p-5">
        <h4 class="font-bold text-slate-800 mb-2 line-clamp-2 text-lg">${item.title || item.judul}</h4>
        <p class="text-slate-500 text-sm mb-4 line-clamp-2">${item.desc || item.deskripsi || item.content || item.konten}</p>
        <div class="flex justify-between items-center border-t border-slate-100 pt-4">
          <span class="text-xs text-slate-400"><i class="fa-regular fa-calendar mr-1"></i> ${item.date || item.tanggal || item.created_at}</span>
          <div class="flex gap-2">
            <button class="btn-edit-news w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center" data-id="${item.id}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-delete-news w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Tambahkan tombol "Tambah Artikel Cepat" di akhir
  const quickAddBtn = document.createElement('div');
  quickAddBtn.id = 'btn-quick-add-news';
  quickAddBtn.className = 'flex flex-col items-center justify-center h-full min-h-[300px] border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-primary hover:text-primary transition cursor-pointer';
  quickAddBtn.innerHTML = `
    <i class="fa-solid fa-plus text-4xl mb-2"></i>
    <span class="font-medium">Tambah Artikel Cepat</span>
  `;
  grid.appendChild(quickAddBtn);
}

async function renderAdminGallery() {
  const grid = document.getElementById('admin-gallery-grid');
  if (!grid) return;

  const storedGallery = await window.DataStore.getGallery();

  if (storedGallery.length === 0) {
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-500 bg-slate-50 rounded-2xl">
                        <i class="fa-solid fa-images text-4xl mb-3"></i>
                        <p>Belum ada foto di galeri.</p>
                        <p class="text-sm">Klik "Tambah Foto" untuk memulai.</p>
                      </div>`;
    return;
  }

  grid.innerHTML = storedGallery.map(item => `
    <div class="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-sm">
      <img src="${window.utils.getStorageUrl(item.gambar)}" alt="Foto Galeri" class="w-full h-full object-cover">
      <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button class="btn-delete-gallery w-10 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 transition" data-id="${item.id}" title="Hapus Foto">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');
}

async function renderAdminTeachers() {
  const grid = document.getElementById('admin-teachers-grid');
  if (!grid) return;

  const teachersData = await window.DataStore.getTeachers();

  grid.innerHTML = teachersData.map(item => `
    <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col gap-4 group relative">
      <div class="flex items-start gap-4"> 
        <img src="${window.utils.getStorageUrl(item.foto)}" alt="${item.nama}" class="w-20 h-20 object-cover rounded-xl shadow-sm flex-shrink-0 bg-slate-100">
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-slate-800 text-sm md:text-base truncate">${item.nama}</h4>
          <p class="text-primary text-xs font-medium mb-2">${item.jabatan}</p>
          <div class="text-xs text-slate-500 space-y-1">
            <p><i class="fa-solid fa-graduation-cap w-4"></i> ${item.pendidikan}</p>
            <p><i class="fa-solid fa-briefcase w-4"></i> ${item.mata_pelajaran || ''}</p>
          </div>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-50 mt-auto flex justify-between items-center">
         <span class="text-xs text-slate-400 italic truncate max-w-[60%]">"${item.quote || ''}"</span>
         <div class="flex gap-2">
            <button class="btn-edit-teacher w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center" data-id="${item.id}"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn-delete-teacher w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
         </div>
      </div>
    </div>
  `).join('');
}

window.saveTeacher = async function() {
  const id = document.getElementById('teacher-id-hidden').value;
  const nama = document.getElementById('teacher-name').value;
  const jabatan = document.getElementById('teacher-position').value;
  const pendidikan = document.getElementById('teacher-education').value;
  const mata_pelajaran = document.getElementById('teacher-subject').value;
  const quote = document.getElementById('teacher-quote').value;
  const fileInput = document.getElementById('teacher-image-input');

  if (!nama || !jabatan) {
    document.getElementById('alert-title').textContent = 'Data Belum Lengkap';
    document.getElementById('alert-message').textContent = 'Nama dan Jabatan wajib diisi!';
    window.utils.toggleModal('modal-alert');
    return;
  }

  const formData = new FormData();
  // Fix: Match backend field names (snake_case)
  formData.append('nama', nama);
  formData.append('jabatan', jabatan);
  formData.append('pendidikan', pendidikan);
  formData.append('mata_pelajaran', mata_pelajaran);
  formData.append('quote', quote);
  if (id) {
    formData.append('id', id);
    formData.append('_method', 'PUT'); // Fix: Add method spoofing for update
  }

  if (fileInput.files && fileInput.files[0]) {
    if (fileInput.files[0].size > 200 * 1024) {
      document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
      document.getElementById('alert-message').textContent = 'Ukuran gambar guru maksimal 200KB.';
      window.utils.toggleModal('modal-alert');
      return;
    }
    formData.append('image', fileInput.files[0]);
  }

  try {
    await window.DataStore.saveTeacher(formData);
    
    await renderAdminTeachers();
    window.utils.toggleModal('modal-teacher');
    document.getElementById('success-title').textContent = 'Berhasil Disimpan!';
    document.getElementById('success-message').textContent = 'Data guru berhasil disimpan.';
    window.utils.toggleModal('modal-success');
  } catch (error) {
    console.error('Gagal menyimpan data guru:', error);
    document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
    document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan data guru. Silakan coba lagi.';
    window.utils.toggleModal('modal-alert');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // --- AUTHENTICATION CHECK ---
  // Redirect ke halaman login jika tidak ada token atau token tidak valid
  if (typeof window.Auth !== 'undefined' && !window.Auth.getAuthToken()) {
    window.location.href = '/admin/login.html';
    return; // Hentikan eksekusi script jika belum login
  }

  // --- URL CLEANER ---
  // Hapus index.html dari address bar agar terlihat lebih bersih
  if (window.location.pathname.endsWith('index.html')) {
      const newPath = window.location.pathname.replace(/index\.html$/, '');
      window.history.replaceState(null, '', newPath + window.location.search + window.location.hash);
  }
  
  // --- EVENT LISTENERS FOR DYNAMIC UI (Best Practice) ---
  // 1. Sidebar Navigation (menggantikan onclick di HTML)
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const viewName = button.dataset.view;
      if (viewName) {
        switchView(viewName);
      }
    });
  });

  let ppdbData = [];
  let filteredData = []; // Akan diisi saat renderTable dipanggil atau filter
  let currentPage = 1;
  const itemsPerPage = 5;

  const tbody = document.getElementById('ppdb-tbody');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const searchInput = document.getElementById('search-ppdb');

  // Expose fungsi refresh ke global agar bisa dipanggil switchView
  window.refreshPpdbTable = async () => {
    // 1. Fetch Data Terbaru
    ppdbData = await window.DataStore.getPpdb();

    // 2. Reset filter ke data terbaru (pertahankan pencarian jika ada)
    if (searchInput && searchInput.value) {
        const term = searchInput.value.toLowerCase();
        filteredData = ppdbData.filter(item => item.nama_lengkap.toLowerCase().includes(term));
    } else {
        filteredData = [...ppdbData];
    }

    // 3. Render Semua Komponen
    renderTable();
    renderDashboardTable();
    updateDashboardStats();
    updateNotifications(); // Pastikan notifikasi diperbarui setelah data dimuat
  };

  // Load awal
  window.refreshPpdbTable();

  // Listener untuk update Real-time dari tab lain (Notifikasi masuk tanpa refresh)
  window.addEventListener('storage', (e) => {
    if (e.key === 'ppdb_registrations') {
      window.refreshPpdbTable();
    }
  });

  // Sinkronisasi Filter Gelombang dengan Data & Pengaturan
  function populateWaveFilter() {
    const filterWave = document.getElementById('filter-wave');
    if (!filterWave) return;
    
    const currentWave = localStorage.getItem('ppdb_wave_name') || 'Gelombang 1';
    const dataWaves = [...new Set(ppdbData.map(item => item.wave))];
    const allWaves = [...new Set([...dataWaves, currentWave])].sort();

    filterWave.innerHTML = '<option value="">Semua Gelombang</option>';
    allWaves.forEach(wave => {
      const option = document.createElement('option');
      option.value = wave;
      option.textContent = wave;
      filterWave.appendChild(option);
    });
  }

  function renderTable() {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (filteredData.length === 0 && !document.getElementById('search-ppdb').value) filteredData = [...ppdbData];

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = filteredData.slice(start, end);

    if (paginatedItems.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Tidak ada data ditemukan</td></tr>';
      paginationInfo.textContent = 'Menampilkan 0 data';
      paginationControls.innerHTML = '';
      return;
    }

    paginatedItems.forEach(item => {
      let statusClass = '';
      if (item.status === 'Diterima') statusClass = 'bg-green-100 text-green-800';
      else if (item.status === 'Terverifikasi') statusClass = 'bg-green-100 text-green-800';
      else if (['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi'].includes(item.status)) statusClass = 'bg-yellow-100 text-yellow-800';
      else statusClass = 'bg-red-100 text-red-800';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition';
      tr.innerHTML = `
        <td class="px-6 py-4 text-slate-400">${item.id}</td>
        <td class="px-6 py-4 font-medium">${item.nama_lengkap} <span class="text-slate-400 text-xs ml-1">(${item.jenis_kelamin})</span></td>
        <td class="px-6 py-4">${item.jenjang}</td>
        <td class="px-6 py-4"><span class="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">${item.gelombang}</span></td>
        <td class="px-6 py-4"><span class="${statusClass} px-2 py-1 rounded-full text-xs font-medium">${item.status}</span></td>
        <td class="px-6 py-4 text-right">
          <div class="flex justify-end gap-2">
            <button class="btn-detail w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition flex items-center justify-center" data-id="${item.id}" title="Detail"><i class="fa-solid fa-eye"></i></button>
            <button class="btn-delete-ppdb w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center" data-id="${item.id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Update Info
    paginationInfo.textContent = `Menampilkan ${start + 1} - ${Math.min(end, filteredData.length)} dari ${filteredData.length} data`;
    renderPagination();
  }

  function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ambil 5 data terbaru (anggap array sudah urut atau ambil 5 pertama)
    const recentItems = ppdbData.slice(0, 5);

    recentItems.forEach(item => {
      let statusClass = '';
      if (item.status === 'Diterima') statusClass = 'bg-green-100 text-green-800';
      else if (item.status === 'Terverifikasi') statusClass = 'bg-green-100 text-green-800';
      else if (['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi'].includes(item.status)) statusClass = 'bg-yellow-100 text-yellow-800';
      else statusClass = 'bg-red-100 text-red-800';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition';
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium text-slate-800">${item.nama_lengkap}</td>
        <td class="px-6 py-4"><span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">${item.jenjang}</span></td>
        <td class="px-6 py-4 text-slate-500">${new Date(item.created_at).toLocaleDateString('id-ID')}</td>
        <td class="px-6 py-4"><span class="${statusClass} px-2 py-1 rounded-full text-xs font-medium">${item.status}</span></td>
        <td class="px-6 py-4 text-right"><button class="btn-detail text-slate-400 hover:text-primary transition" data-id="${item.id}" title="Detail"><i class="fa-solid fa-eye"></i></button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function updateDashboardStats() {
    const total = ppdbData.length;
    const tk = ppdbData.filter(i => i.jenjang === 'TK').length;
    const mi = ppdbData.filter(i => i.jenjang === 'MI').length;
    
    const accepted = ppdbData.filter(i => i.status === 'Diterima').length;
    const pending = ppdbData.filter(i => ['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi', 'Terverifikasi'].includes(i.status)).length;
    
    // Update Cards
    const elTotal = document.getElementById('stat-total');
    const elTk = document.getElementById('stat-tk');
    const elMi = document.getElementById('stat-mi');
    
    if(elTotal) elTotal.textContent = total;
    if(elTk) elTk.textContent = tk;
    if(elMi) elMi.textContent = mi;

    // Update Progress Bars
    const acceptedPct = total === 0 ? 0 : Math.round((accepted / total) * 100);
    const pendingPct = total === 0 ? 0 : Math.round((pending / total) * 100);

    const elAccText = document.getElementById('stat-accepted-text');
    const elAccBar = document.getElementById('stat-accepted-bar');
    const elPendText = document.getElementById('stat-pending-text');
    const elPendBar = document.getElementById('stat-pending-bar');

    if(elAccText) elAccText.textContent = `${acceptedPct}%`;
    if(elAccBar) elAccBar.style.width = `${acceptedPct}%`;
    
    if(elPendText) elPendText.textContent = `${pendingPct}%`;
    if(elPendBar) elPendBar.style.width = `${pendingPct}%`;
  }

  function renderPagination() {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';
    
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    // Helper untuk membuat tombol
    const createBtn = (html, onClick, disabled = false, active = false) => {
      const btn = document.createElement('button');
      btn.innerHTML = html;
      btn.className = `w-8 h-8 rounded-lg flex items-center justify-center border transition ${active ? 'bg-primary text-white border-primary' : 'text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-primary'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;
      btn.disabled = disabled;
      btn.onclick = onClick;
      return btn;
    };

    // Prev Button
    paginationControls.appendChild(createBtn('<i class="fa-solid fa-chevron-left"></i>', () => {
      if (currentPage > 1) { currentPage--; renderTable(); }
    }, currentPage === 1));

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
      paginationControls.appendChild(createBtn(i, () => {
        currentPage = i; renderTable();
      }, false, currentPage === i));
    }

    // Next Button
    paginationControls.appendChild(createBtn('<i class="fa-solid fa-chevron-right"></i>', () => {
      if (currentPage < totalPages) { currentPage++; renderTable(); }
    }, currentPage === totalPages));
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      const term = e.target.value.toLowerCase();
      filteredData = ppdbData.filter(item => item.nama_lengkap.toLowerCase().includes(term));
      currentPage = 1;
      renderTable();
    });
  }

  // Initial Render
  renderTable();
  renderDashboardTable();
  updateDashboardStats();
  renderAdminNews();
  renderAdminGallery();
  renderAdminTeachers();
  populateWaveFilter(); // Panggil fungsi filter otomatis

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

  // 2. Fitur Simpan Pengaturan
  const btnSaveSettings = document.getElementById('btn-save-settings');
  
  // Load Settings saat halaman dimuat
  const inputAcademicYear = document.getElementById('setting-academic-year');
  const inputWaveName = document.getElementById('setting-wave-name');
  const inputWavePeriod = document.getElementById('setting-wave-period');
  const selectWaveStatus = document.getElementById('setting-wave-status');

  // Load Settings dari Backend
  (async () => {
      const settings = await window.DataStore.getSettings();
      if (settings) {
          if (inputAcademicYear) inputAcademicYear.value = settings.tahun_ajaran || '2025/2026';
          if (inputWaveName) inputWaveName.value = settings.nama_gelombang || 'Gelombang 1';
          if (inputWavePeriod) inputWavePeriod.value = settings.periode_pendaftaran || '1 Oktober - 31 Desember 2025';
          if (selectWaveStatus) selectWaveStatus.value = settings.status_ppdb || 'ditutup';
      }
  })();

  if (btnSaveSettings) {
    btnSaveSettings.addEventListener('click', async () => {
      const data = {
          tahun_ajaran: inputAcademicYear ? inputAcademicYear.value : '',
          nama_gelombang: inputWaveName ? inputWaveName.value : '',
          periode_pendaftaran: inputWavePeriod ? inputWavePeriod.value : '',
          status_ppdb: selectWaveStatus ? selectWaveStatus.value : ''
      };

      try {
        await window.DataStore.saveSettings(data);

        document.getElementById('success-title').textContent = 'Berhasil Disimpan!';
        document.getElementById('success-message').textContent = 'Pengaturan sistem telah berhasil diperbarui.';
        window.utils.toggleModal('modal-success');
      } catch (error) {
        console.error('Gagal menyimpan pengaturan:', error);
        document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
        document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan pengaturan. Silakan coba lagi.';
        window.utils.toggleModal('modal-alert');
      }
    });
  }

  // 3. Fitur Tambah Berita (Modal)
  const btnAddNews = document.getElementById('btn-add-news');

  if (btnAddNews) {
    btnAddNews.addEventListener('click', () => {
      document.getElementById('news-id-hidden').value = ''; // Reset ID
      document.getElementById('news-title').value = ''; // Kosongkan judul
      document.getElementById('news-content-editor').innerHTML = ''; // Kosongkan editor
      document.getElementById('news-image-input').value = ''; // Reset file input
      document.getElementById('news-image-preview-container').classList.add('hidden');
      document.getElementById('news-upload-prompt').classList.remove('hidden');
      document.getElementById('news-image-preview').src = '';
      document.getElementById('news-date').valueAsDate = new Date(); // Default hari ini
      window.utils.toggleModal('modal-news');
    });
  }

  const btnAddGallery = document.getElementById('btn-add-gallery');
  if (btnAddGallery) {
      btnAddGallery.addEventListener('click', () => {
          // Reset modal
          document.getElementById('gallery-image-input').value = '';
          document.getElementById('gallery-image-preview-container').classList.add('hidden');
          document.getElementById('gallery-upload-prompt').classList.remove('hidden');
          window.utils.toggleModal('modal-gallery');
      });
  }

  // 3b. Fitur Tambah Guru
  const btnAddTeacher = document.getElementById('btn-add-teacher');
  if (btnAddTeacher) {
    btnAddTeacher.addEventListener('click', () => {
      document.getElementById('teacher-id-hidden').value = '';
      document.getElementById('teacher-name').value = '';
      document.getElementById('teacher-position').value = '';
      document.getElementById('teacher-education').value = '';
      document.getElementById('teacher-subject').value = '';
      document.getElementById('teacher-quote').value = '';
      document.getElementById('teacher-image-input').value = '';
      document.getElementById('teacher-image-preview-container').classList.add('hidden');
      document.getElementById('teacher-upload-prompt').classList.remove('hidden');
      document.getElementById('teacher-image-preview').src = '';
      window.utils.toggleModal('modal-teacher');
    });
  }

  let itemToDelete = null;

  // 4. Fitur Hapus & Detail (Event Delegation)
  document.addEventListener('click', async (e) => {
    // Hapus PPDB
    const deletePpdbBtn = e.target.closest('.btn-delete-ppdb');
    if (deletePpdbBtn) {
      itemToDelete = { type: 'ppdb', id: deletePpdbBtn.dataset.id };
      window.utils.toggleModal('modal-confirm');
    }

    // Hapus Berita
    const deleteNewsBtn = e.target.closest('.btn-delete-news');
    if (deleteNewsBtn) {
      itemToDelete = { type: 'news', id: parseInt(deleteNewsBtn.dataset.id) };
      window.utils.toggleModal('modal-confirm');
    }

    // Quick Add News (Delegation karena elemen dibuat dinamis)
    const quickAddBtn = e.target.closest('#btn-quick-add-news');
    if (quickAddBtn) {
      document.getElementById('news-id-hidden').value = '';
      document.getElementById('news-title').value = ''; // Kosongkan judul
      document.getElementById('news-content-editor').innerHTML = ''; // Kosongkan editor
      document.getElementById('news-image-input').value = '';
      document.getElementById('news-image-preview-container').classList.add('hidden');
      document.getElementById('news-upload-prompt').classList.remove('hidden');
      document.getElementById('news-image-preview').src = '';
      document.getElementById('news-date').valueAsDate = new Date();
      window.utils.toggleModal('modal-news');
    }

    // Hapus Guru
    const deleteTeacherBtn = e.target.closest('.btn-delete-teacher');
    if (deleteTeacherBtn) {
        itemToDelete = { type: 'teacher', id: parseInt(deleteTeacherBtn.dataset.id) };
        window.utils.toggleModal('modal-confirm');
    }

    // Hapus Foto Galeri
    const deleteGalleryBtn = e.target.closest('.btn-delete-gallery');
    if (deleteGalleryBtn) {
        const id = parseInt(deleteGalleryBtn.dataset.id);
        itemToDelete = { type: 'gallery', id: id };
        window.utils.toggleModal('modal-confirm');
    }

    // Edit Berita
    const editNewsBtn = e.target.closest('.btn-edit-news');
if (editNewsBtn) {
  const id = parseInt(editNewsBtn.dataset.id);
  const newsItem = await window.DataStore.getNewsById(id); // Mengambil detail berita langsung berdasarkan ID
  if (!newsItem) return;

  document.getElementById('news-id-hidden').value = newsItem.id;
  document.getElementById('news-title').value = newsItem.title;
  document.getElementById('news-content-editor').innerHTML =
    newsItem.content || newsItem.desc || '';
  document.getElementById('news-image-preview').src = window.utils.getStorageUrl(newsItem.image || newsItem.gambar || '');
  document.getElementById('news-image-preview-container').classList.remove('hidden');
  document.getElementById('news-upload-prompt').classList.add('hidden');

  // Konversi tanggal
  const months = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04',
    Mei: '05', Jun: '06', Jul: '07', Agu: '08',
    Sep: '09', Okt: '10', Nov: '11', Des: '12'
  };

  let parts = [];
  if (newsItem.date) {
    parts = newsItem.date.split(' ');
  }

  if (parts.length === 3 && months[parts[1]]) {
    document.getElementById('news-date').value =
      `${parts[2]}-${months[parts[1]]}-${parts[0].padStart(2, '0')}`;
  }

  window.utils.toggleModal('modal-news');
}


    // Edit Guru
    const editTeacherBtn = e.target.closest('.btn-edit-teacher');
    if (editTeacherBtn) {
      const id = editTeacherBtn.dataset.id;
      const storedTeachers = await window.DataStore.getTeachers();
      const item = storedTeachers.find(i => i.id == id);
      if (item) {
        document.getElementById('teacher-id-hidden').value = item.id;
        document.getElementById('teacher-name').value = item.nama;
        document.getElementById('teacher-position').value = item.jabatan;
        document.getElementById('teacher-education').value = item.pendidikan;
        document.getElementById('teacher-subject').value = item.mata_pelajaran || '';
        document.getElementById('teacher-quote').value = item.quote || '';
        
        document.getElementById('teacher-image-preview').src = window.utils.getStorageUrl(item.foto);
        document.getElementById('teacher-image-preview-container').classList.remove('hidden');
        document.getElementById('teacher-upload-prompt').classList.add('hidden');
        document.getElementById('teacher-image-input').value = '';
        
        window.utils.toggleModal('modal-teacher');
      }
    }

    // Detail
    const detailBtn = e.target.closest('.btn-detail');
    if (detailBtn) {
      const id = detailBtn.dataset.id;
      const data = ppdbData.find(item => item.id === id);
      
      if (data) {
        document.getElementById('detail-name').textContent = data.nama_lengkap;
        document.getElementById('detail-id').textContent = data.id;
        document.getElementById('detail-level').textContent = data.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'Taman Kanak-Kanak';
        document.getElementById('detail-gender').textContent = data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
        document.getElementById('detail-wave').textContent = data.gelombang;
        document.getElementById('detail-address').textContent = data.address;
        document.getElementById('detail-school').textContent = data.asal_sekolah;
        document.getElementById('detail-parent').textContent = data.nama_orang_tua;
        document.getElementById('detail-phone').textContent = data.nomor_wa;
        document.getElementById('detail-email').textContent = data.email;
        
        // Set value select status dan simpan ID di tombol simpan
        document.getElementById('detail-status-select').value = data.status;
        document.getElementById('btn-save-status').dataset.id = data.id;
        
        // Tampilkan Bukti Pembayaran
        const paymentContainer = document.getElementById('detail-payment-container');
        paymentContainer.innerHTML = '';
        if (data.bukti_bayar) {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'relative group cursor-pointer inline-block';
            imgWrapper.onclick = () => window.viewFullImage(window.utils.getStorageUrl(data.bukti_bayar));
            imgWrapper.innerHTML = `
                <img src="${window.utils.getStorageUrl(data.bukti_bayar)}" class="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200" alt="Bukti Transfer">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center rounded-lg">
                    <i class="fa-solid fa-magnifying-glass-plus text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-md transition"></i>
                </div>
            `;
            paymentContainer.appendChild(imgWrapper);
        } else {
            paymentContainer.innerHTML = `<p class="text-slate-500 italic text-sm"><i class="fa-solid fa-circle-xmark mr-1"></i> Belum ada bukti pembayaran.</p>`;
        }

        window.utils.toggleModal('modal-detail');
      }
    }
  });

  // Listener untuk tombol konfirmasi hapus di modal
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');
  if (btnConfirmDelete) {
    btnConfirmDelete.addEventListener('click', async () => {
      if (itemToDelete) {
        if (itemToDelete.type === 'gallery') {
            await window.DataStore.deleteGallery(itemToDelete.id);
            renderAdminGallery();
        } else if (itemToDelete.type === 'teacher') {
            await window.DataStore.deleteTeacher(itemToDelete.id);
            renderAdminTeachers();
        } else if (itemToDelete.type === 'ppdb') {
            // Hapus via DataStore
            await window.DataStore.deletePpdb(itemToDelete.id);

            // Hapus dari read_notifications agar jika ID dipakai ulang (saat testing), notifikasi muncul lagi
            let readNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];
            if (readNotifs.includes(itemToDelete.id)) {
                readNotifs = readNotifs.filter(id => id !== itemToDelete.id);
                localStorage.setItem('read_notifications', JSON.stringify(readNotifs));
            }

            // 3. Re-render & Update Stats
            // Refresh data dari server
            window.refreshPpdbTable();
        } else if (itemToDelete.type === 'news') {
            await window.DataStore.deleteNews(itemToDelete.id);
            renderAdminNews();
        } else if (itemToDelete.type === 'dom' && itemToDelete.element) {
            itemToDelete.element.remove();
        }
        itemToDelete = null;
      }
      window.utils.toggleModal('modal-confirm');
    });
  }

  // 5. Fitur Filter & Export
  const btnFilter = document.getElementById('btn-filter');
  const btnExport = document.getElementById('btn-export');
  const btnApplyFilter = document.getElementById('btn-apply-filter');

  if (btnFilter) {
    btnFilter.addEventListener('click', () => window.utils.toggleModal('modal-filter'));
  }

  if (btnApplyFilter) {
    btnApplyFilter.addEventListener('click', () => {
      const jenjang = document.getElementById('filter-jenjang').value;
      const status = document.getElementById('filter-status').value;
      const wave = document.getElementById('filter-wave').value;
      
      filteredData = ppdbData.filter(item => {
        const matchJenjang = jenjang === '' || item.level === jenjang;
        const matchStatus = status === '' || item.status === status;
        const matchWave = wave === '' || item.wave === wave;
        return matchJenjang && matchStatus && matchWave;
      });
      
      currentPage = 1;
      renderTable();
      window.utils.toggleModal('modal-filter');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // Define headers
      const headers = ['ID', 'Nama Siswa', 'Gender', 'Jenjang', 'Orang Tua', 'No. HP', 'Email', 'Asal Sekolah', 'Status'];
      
      // Map data to CSV format
      const csvContent = [
        headers.join(','), // Headers: ['ID', 'Nama Siswa', 'Gender', 'Jenjang', 'Orang Tua', 'No. HP', 'Email', 'Asal Sekolah', 'Status']
        ...filteredData.map(item => {
          return [
            item.id,
            `"${item.nama_lengkap}"`,
            item.jenis_kelamin,
            item.jenjang,
            `"${item.nama_orang_tua}"`,
            `'${item.nomor_wa}`, // Force string for phone in excel
            item.email,
            `"${item.asal_sekolah}"`,
            item.status
          ].join(',');
        })
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'data_ppdb_export.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // 6. Fitur Simpan Status (Dari Modal Detail)
  const btnSaveStatus = document.getElementById('btn-save-status');
  if (btnSaveStatus) {
    btnSaveStatus.addEventListener('click', async () => {
      const id = btnSaveStatus.dataset.id;
      const newStatus = document.getElementById('detail-status-select').value;
      
      const itemIndex = ppdbData.findIndex(item => item.id === id);
      if (itemIndex !== -1) {
        // Update via DataStore
        const formData = new FormData();
        // The error "The PUT method is not supported" indicates the backend route
        // for updates is defined with POST, not PUT. We must match the backend.
        formData.append('_method', 'POST');
        formData.append('status', newStatus);

        await window.DataStore.updatePpdb(id, formData);
        
        // Update local state for immediate UI refresh
        ppdbData[itemIndex].status = newStatus;
        filteredData = [...ppdbData]; // Reset filter to show all with new status

        renderTable(); // Re-render tabel untuk melihat perubahan
        renderDashboardTable(); // Update juga tabel dashboard
        updateDashboardStats(); // Update statistik dashboard
        updateNotifications(); // Update notifikasi karena status berubah
        window.utils.toggleModal('modal-detail');
        
        document.getElementById('success-title').textContent = 'Status Diperbarui!';
        document.getElementById('success-message').textContent = `Status siswa ${ppdbData[itemIndex].nama_lengkap} berhasil diubah menjadi ${newStatus}.`;
        window.utils.toggleModal('modal-success');
      }
    });
  }

  // 7. Fitur Notifikasi
  const btnNotification = document.getElementById('btn-notification');
  const notificationDropdown = document.getElementById('notification-dropdown');
  const notificationBadge = document.getElementById('notification-badge');
  const notificationList = document.getElementById('notification-list');
  const notifCountLabel = document.getElementById('notif-count');

  function updateNotifications() {
    let readNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];
    
    // FIX: Bersihkan ID di read_notifications yang sudah tidak ada di data PPDB
    // Ini mencegah notifikasi tidak muncul jika ID dipakai ulang setelah reset data
    const currentIds = ppdbData.map(item => item.id);
    const cleanedReadNotifs = readNotifs.filter(id => currentIds.includes(id));
    if (readNotifs.length !== cleanedReadNotifs.length) {
        readNotifs = cleanedReadNotifs;
        localStorage.setItem('read_notifications', JSON.stringify(readNotifs));
    }

    // Ambil SEMUA yang statusnya pending (baik sudah dibaca maupun belum)
    const pendingItems = ppdbData.filter(item => ['Menunggu', 'Menunggu Pembayaran', 'Menunggu Verifikasi'].includes(item.status));
    
    // Urutkan: Yang BELUM DIBACA di paling atas
    pendingItems.sort((a, b) => {
        const aRead = readNotifs.includes(a.id);
        const bRead = readNotifs.includes(b.id);
        if (aRead === bRead) return 0; 
        return aRead ? 1 : -1; // False (Belum baca) duluan
    });

    // Hitung jumlah yang benar-benar baru (untuk badge)
    const unreadCount = pendingItems.filter(item => !readNotifs.includes(item.id)).length;
    
    // Update Badge
    if (unreadCount > 0) {
      notificationBadge.classList.remove('hidden');
      notifCountLabel.textContent = `${unreadCount} Baru`;
      notifCountLabel.classList.remove('hidden');
    } else {
      notificationBadge.classList.add('hidden');
      notifCountLabel.classList.add('hidden');
    }

    // Render List
    notificationList.innerHTML = '';
    if (pendingItems.length === 0) {
      notificationList.innerHTML = '<div class="p-4 text-center text-sm text-slate-500">Tidak ada notifikasi</div>';
    } else {
      pendingItems.forEach(item => {
        const isRead = readNotifs.includes(item.id);
        
        const div = document.createElement('div');
        // Styling berbeda untuk Read vs Unread
        div.className = `p-4 hover:bg-slate-50 transition cursor-pointer border-b border-slate-100 last:border-0 ${isRead ? 'opacity-75' : 'bg-blue-50/30'}`;
        
        div.innerHTML = `
          <div class="flex gap-3 items-start">
            <div class="w-8 h-8 rounded-full ${isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'} flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-user-plus text-xs"></i>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start">
                  <p class="text-sm ${isRead ? 'font-normal text-slate-600' : 'font-bold text-slate-800'}">Pendaftar Baru: ${item.nama_lengkap}</p>
                  ${!isRead ? '<span class="w-2 h-2 bg-red-500 rounded-full mt-1.5"></span>' : ''}
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${item.jenjang} • ${new Date(item.created_at).toLocaleDateString('id-ID')}</p>
            </div>
          </div>
        `;
        // Klik notifikasi langsung buka detail
        div.addEventListener('click', () => {
            notificationDropdown.classList.add('hidden');
            // switchView('ppdb'); // Hapus redirect agar tetap di halaman saat ini
            
            // Mark as read (Simpan ID ke localStorage agar tidak muncul lagi)
            let currentReadNotifs = JSON.parse(localStorage.getItem('read_notifications')) || [];
            if (!currentReadNotifs.includes(item.id)) {
                currentReadNotifs.push(item.id);
                localStorage.setItem('read_notifications', JSON.stringify(currentReadNotifs));
                updateNotifications(); // Update badge & list secara langsung
            }
            
            // Buka modal detail
            const data = item;
             if (data) {
                document.getElementById('detail-name').textContent = data.nama_lengkap;
                document.getElementById('detail-id').textContent = data.id;
                document.getElementById('detail-level').textContent = data.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'Taman Kanak-Kanak';
                document.getElementById('detail-gender').textContent = data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
                document.getElementById('detail-wave').textContent = data.gelombang;
                document.getElementById('detail-address').textContent = data.address;
                document.getElementById('detail-school').textContent = data.asal_sekolah;
                document.getElementById('detail-parent').textContent = data.nama_orang_tua;
                document.getElementById('detail-phone').textContent = data.nomor_wa;
                document.getElementById('detail-email').textContent = data.email;
                document.getElementById('detail-status-select').value = data.status;
                document.getElementById('btn-save-status').dataset.id = data.id;
                
                // Tampilkan Bukti Pembayaran
                const paymentContainer = document.getElementById('detail-payment-container');
                paymentContainer.innerHTML = '';
                if (data.bukti_bayar) {
                    const imgWrapper = document.createElement('div');
                    imgWrapper.className = 'relative group cursor-pointer inline-block';
                    imgWrapper.onclick = () => window.viewFullImage(window.utils.getStorageUrl(data.bukti_bayar));
                    imgWrapper.innerHTML = `
                        <img src="${window.utils.getStorageUrl(data.bukti_bayar)}" class="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200" alt="Bukti Transfer">
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center rounded-lg">
                            <i class="fa-solid fa-magnifying-glass-plus text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-md transition"></i>
                        </div>
                    `;
                    paymentContainer.appendChild(imgWrapper);
                } else {
                    paymentContainer.innerHTML = `<p class="text-slate-500 italic text-sm"><i class="fa-solid fa-circle-xmark mr-1"></i> Belum ada bukti pembayaran.</p>`;
                }

                window.utils.toggleModal('modal-detail');
            }
        });
        notificationList.appendChild(div);
      });
    }
  }

  if (btnNotification && notificationDropdown) {
    // Toggle Dropdown
    btnNotification.addEventListener('click', (e) => {
      e.stopPropagation();
      notificationDropdown.classList.toggle('hidden');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!notificationDropdown.contains(e.target) && !btnNotification.contains(e.target)) {
        notificationDropdown.classList.add('hidden');
      }
    });

    // Initial Load
    updateNotifications();
  }

  // Drag and drop for gallery modal
  const dropzone = document.getElementById('gallery-image-dropzone');
  const galleryFileInput = document.getElementById('gallery-image-input');
  const galleryPreviewContainer = document.getElementById('gallery-image-preview-container');
  const galleryPreviewImageEl = document.getElementById('gallery-image-preview');
  const galleryUploadPrompt = document.getElementById('gallery-upload-prompt');

  if (dropzone) {
      const previewGalleryImage = (input) => {
          if (input.files && input.files[0]) {
              if (input.files[0].size > 200 * 1024) {
                  document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
                  document.getElementById('alert-message').textContent = 'Ukuran gambar galeri maksimal 200KB.';
                  window.utils.toggleModal('modal-alert');
                  input.value = '';
                  return;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                  galleryPreviewImageEl.src = e.target.result;
                  galleryPreviewContainer.classList.remove('hidden');
                  galleryUploadPrompt.classList.add('hidden');
              }
              reader.readAsDataURL(input.files[0]);
          }
      }

      dropzone.addEventListener('click', () => galleryFileInput.click());
      dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('border-primary', 'bg-slate-50'); });
      dropzone.addEventListener('dragleave', () => { dropzone.classList.remove('border-primary', 'bg-slate-50'); });
      dropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('border-primary', 'bg-slate-50');
          const files = e.dataTransfer.files;
          if (files.length) {
              galleryFileInput.files = files;
              previewGalleryImage(galleryFileInput);
          }
      });
      galleryFileInput.addEventListener('change', () => previewGalleryImage(galleryFileInput));
  }

  // Drag and drop for teacher modal
  const teacherDropzone = document.getElementById('teacher-image-dropzone');
  const teacherFileInput = document.getElementById('teacher-image-input');
  const teacherPreviewContainer = document.getElementById('teacher-image-preview-container');
  const teacherPreviewImageEl = document.getElementById('teacher-image-preview');
  const teacherUploadPrompt = document.getElementById('teacher-upload-prompt');

  if (teacherDropzone) {
      const previewTeacherImage = (input) => {
          if (input.files && input.files[0]) {
              if (input.files[0].size > 200 * 1024) {
                  document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
                  document.getElementById('alert-message').textContent = 'Ukuran gambar guru maksimal 200KB.';
                  window.utils.toggleModal('modal-alert');
                  input.value = '';
                  return;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                  teacherPreviewImageEl.src = e.target.result;
                  teacherPreviewContainer.classList.remove('hidden');
                  teacherUploadPrompt.classList.add('hidden');
              }
              reader.readAsDataURL(input.files[0]);
          }
      }

      teacherDropzone.addEventListener('click', () => teacherFileInput.click());
      teacherDropzone.addEventListener('dragover', (e) => { e.preventDefault(); teacherDropzone.classList.add('border-primary', 'bg-slate-50'); });
      teacherDropzone.addEventListener('dragleave', () => { teacherDropzone.classList.remove('border-primary', 'bg-slate-50'); });
      teacherDropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          teacherDropzone.classList.remove('border-primary', 'bg-slate-50');
          const files = e.dataTransfer.files;
          if (files.length) {
              teacherFileInput.files = files;
              previewTeacherImage(teacherFileInput);
          }
      });
      teacherFileInput.addEventListener('change', () => previewTeacherImage(teacherFileInput));
  }

  // Drag and drop for news modal
  const newsDropzone = document.getElementById('news-image-dropzone');
  const newsFileInput = document.getElementById('news-image-input');
  const newsPreviewContainer = document.getElementById('news-image-preview-container');
  const newsPreviewImageEl = document.getElementById('news-image-preview');
  const newsUploadPrompt = document.getElementById('news-upload-prompt');

  if (newsDropzone) {
      const previewNewsImage = (input) => {
          if (input.files && input.files[0]) {
              if (input.files[0].size > 200 * 1024) {
                  document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
                  document.getElementById('alert-message').textContent = 'Ukuran gambar berita maksimal 200KB.';
                  window.utils.toggleModal('modal-alert');
                  input.value = '';
                  return;
              }
              const reader = new FileReader();
              reader.onload = (e) => {
                  newsPreviewImageEl.src = e.target.result;
                  newsPreviewContainer.classList.remove('hidden');
                  newsUploadPrompt.classList.add('hidden');
              }
              reader.readAsDataURL(input.files[0]);
          }
      }

      newsDropzone.addEventListener('click', (e) => {
          if(e.target.closest('#btn-remove-image')) return;
          newsFileInput.click();
      });
      newsDropzone.addEventListener('dragover', (e) => { e.preventDefault(); newsDropzone.classList.add('border-primary', 'bg-slate-50'); });
      newsDropzone.addEventListener('dragleave', () => { newsDropzone.classList.remove('border-primary', 'bg-slate-50'); });
      newsDropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          newsDropzone.classList.remove('border-primary', 'bg-slate-50');
          const files = e.dataTransfer.files;
          if (files.length) {
              newsFileInput.files = files;
              previewNewsImage(newsFileInput);
          }
      });
      newsFileInput.addEventListener('change', () => previewNewsImage(newsFileInput));
  }

  // Drag and drop for academic editor
  const academicDropzone = document.getElementById('academic-image-dropzone');
  const academicFileInput = document.getElementById('academic-image-input');
  
  if (academicDropzone) {
      academicDropzone.addEventListener('click', () => academicFileInput.click());
      academicDropzone.addEventListener('dragover', (e) => { e.preventDefault(); academicDropzone.classList.add('border-primary', 'bg-slate-50'); });
      academicDropzone.addEventListener('dragleave', () => { academicDropzone.classList.remove('border-primary', 'bg-slate-50'); });
      academicDropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          academicDropzone.classList.remove('border-primary', 'bg-slate-50');
          const files = e.dataTransfer.files;
          if (files.length) {
              academicFileInput.files = files;
              previewAcademicImage(academicFileInput);
          }
      });
      academicFileInput.addEventListener('change', () => previewAcademicImage(academicFileInput));
  }

  // Drag and drop for achievement (prestasi)
  const achDropzone = document.getElementById('ach-image-dropzone');
  const achFileInput = document.getElementById('ach-image');
  
  if (achDropzone) {
      achDropzone.addEventListener('click', () => achFileInput.click());
      achDropzone.addEventListener('dragover', (e) => { e.preventDefault(); achDropzone.classList.add('border-primary', 'bg-slate-50'); });
      achDropzone.addEventListener('dragleave', () => { achDropzone.classList.remove('border-primary', 'bg-slate-50'); });
      achDropzone.addEventListener('drop', (e) => {
          e.preventDefault();
          achDropzone.classList.remove('border-primary', 'bg-slate-50');
          const files = e.dataTransfer.files;
          if (files.length) {
              achFileInput.files = files;
              previewAchievementImage(achFileInput);
          }
      });
      achFileInput.addEventListener('change', () => previewAchievementImage(achFileInput));
  }
});

// --- LOGOUT FUNCTION ---
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', () => window.Auth.logout());
}

// Helper: Format Text (Bold, Italic, etc)
window.formatDoc = function(cmd, value = null) {
  document.execCommand(cmd, false, value);
  document.getElementById('news-content-editor').focus();
}

// Helper: Format Text untuk Editor Halaman
window.formatPageDoc = function(cmd, value = null) {
  document.execCommand(cmd, false, value);
  document.getElementById('page-content-editor').focus();
}

// Helper: Format Text untuk Editor Akademik
window.formatAcademicDoc = function(cmd, value = null) {
  document.execCommand(cmd, false, value);
  document.getElementById('academic-hero-desc-editor').focus();
}

// Helper: Preview Academic Page Image
window.previewAcademicImage = function(input) {
    const preview = document.getElementById('academic-image-preview');
    const container = document.getElementById('academic-image-preview-container');
    const prompt = document.getElementById('academic-upload-prompt');
    if (input.files && input.files[0]) {
        if (input.files[0].size > 200 * 1024) {
            document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
            document.getElementById('alert-message').textContent = 'Ukuran gambar header maksimal 200KB.';
            window.utils.toggleModal('modal-alert');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            if(container) container.classList.remove('hidden');
            if(prompt) prompt.classList.add('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Helper: Preview Achievement Image
window.previewAchievementImage = function(input) {
    const preview = document.getElementById('ach-image-preview');
    const container = document.getElementById('ach-image-preview-container');
    const prompt = document.getElementById('ach-upload-prompt');
    if (input.files && input.files[0]) {
        if (input.files[0].size > 200 * 1024) {
            document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
            document.getElementById('alert-message').textContent = 'Ukuran gambar prestasi maksimal 200KB.';
            window.utils.toggleModal('modal-alert');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            if(container) container.classList.remove('hidden');
            if(prompt) prompt.classList.add('hidden');
        }
        reader.readAsDataURL(input.files[0]);
    }
}

// Global variable to store achievements temporarily while editing
window.tempAchievements = [];

// Global variable to track deleted achievement IDs
window.deletedAchievementIds = [];

// Variabel ini untuk melacak apakah gambar utama ditandai untuk dihapus.
let isAcademicHeroImageMarkedForDeletion = false;

// Fungsi baru ini untuk menangani klik tombol hapus
window.removeAcademicHeroImage = function(event) {
    // Mencegah event klik menyebar ke elemen lain
    event.stopPropagation();
    
    // Tandai untuk penghapusan saat disimpan
    isAcademicHeroImageMarkedForDeletion = true;

    // Reset tampilan UI ke kondisi awal
    document.getElementById('academic-image-preview').src = '';
    document.getElementById('academic-image-input').value = '';
    document.getElementById('academic-image-preview-container').classList.add('hidden');
    document.getElementById('academic-upload-prompt').classList.remove('hidden');
}

window.openAcademicEditor = async function(key, title) {
    // Reset status "hapus" agar tidak terbawa dari sesi edit sebelumnya.
    isAcademicHeroImageMarkedForDeletion = false;

    // 1. Switch View
    switchView('academic');
    
    // 2. Keep Submenu Open & Highlight
    const pagesSubmenu = document.getElementById('pages-submenu');
    const pagesToggleBtn = document.getElementById('btn-pages-toggle');
    const pagesSubmenuIcon = document.getElementById('pages-submenu-icon');
    
    if (pagesSubmenu) {
      pagesSubmenu.classList.remove('hidden');
      pagesSubmenu.classList.add('flex');
    }
    if (pagesSubmenuIcon) pagesSubmenuIcon.classList.add('rotate-180');
    if (pagesToggleBtn) pagesToggleBtn.classList.add('bg-white/10');

    // Highlight specific child button
    document.getElementById('btn-academic-tk').classList.remove('text-white', 'font-bold');
    document.getElementById('btn-academic-mi').classList.remove('text-white', 'font-bold');
    const activeBtn = document.getElementById(`btn-academic-${key}`);
    if(activeBtn) activeBtn.classList.add('text-white', 'font-bold');

    // 3. Populate Data
    document.getElementById('academic-key').value = key;
    document.getElementById('academic-title').textContent = `Edit Halaman ${title}`;
    
    // Revoke any existing object URLs to prevent memory leaks
    window.tempAchievements.forEach(item => {
        if (item.preview) URL.revokeObjectURL(item.preview);
    });
    // Reset deleted achievements tracker for the new session
    window.deletedAchievementIds = [];

    // Load data or use defaults
    const savedData = (key === 'tk') 
        ? await window.DataStore.getAcademicTK() 
        : await window.DataStore.getAcademicMI();
    
    // Map data from backend (snake_case) to UI
    const heroImage = savedData.gambar_utama || "";
    const heroDesc = savedData.deskripsi_kurikulum || "";
    const curriculumPoints = savedData.poin_unggulan || "";
    const schedule = savedData.jadwal_harian || "";
    const ekskul = savedData.ekstrakurikuler || "";
    const biayaMasuk = savedData.biaya_masuk || "";
    const biayaBulanan = savedData.biaya_bulanan || "";
    
    // Handle Achievements
    let achievements = savedData.prestasi || [];
    window.tempAchievements = achievements.map(a => ({
        id: a.id,
        nama: a.nama,
        judul: a.judul,
        tingkat: a.tingkat,
        image: a.image, // This is a URL string from the server
        preview: null, // No preview for existing images from server
    }));

    // Set Values to UI
    document.getElementById('academic-image-preview').src = window.utils.getStorageUrl(heroImage);
    if (heroImage) {
        document.getElementById('academic-image-preview-container').classList.remove('hidden');
        document.getElementById('academic-upload-prompt').classList.add('hidden');
    } else {
        document.getElementById('academic-image-preview-container').classList.add('hidden');
        document.getElementById('academic-upload-prompt').classList.remove('hidden');
    }
    document.getElementById('academic-hero-desc-editor').innerHTML = heroDesc;
    document.getElementById('academic-curriculum-points').value = curriculumPoints;
    document.getElementById('academic-schedule').value = schedule;
    document.getElementById('academic-ekskul').value = ekskul;
    document.getElementById('academic-biaya-masuk').value = biayaMasuk;
    document.getElementById('academic-biaya-bulanan').value = biayaBulanan;
    
    renderAchievementList();

    // Reset file input
    document.getElementById('academic-image-input').value = '';
}

window.saveAcademicPage = async function() {
    const key = document.getElementById('academic-key').value;
    
    // Create FormData
    const formData = new FormData();

    // Append main page data
    formData.append('hero_desc', document.getElementById('academic-hero-desc-editor').innerHTML); // deskripsi_kurikulum
    formData.append('kurikulum', document.getElementById('academic-curriculum-points').value); // poin_unggulan
    formData.append('jadwal', document.getElementById('academic-schedule').value); // jadwal_harian
    formData.append('ekskul', document.getElementById('academic-ekskul').value); // ekstrakurikuler
    formData.append('biaya_masuk', document.getElementById('academic-biaya-masuk').value);
    formData.append('biaya_bulanan', document.getElementById('academic-biaya-bulanan').value);

    // Append hero image file if changed
    const fileInput = document.getElementById('academic-image-input');
    if (fileInput.files && fileInput.files[0]) {
        formData.append('hero_image', fileInput.files[0]); // gambar_utama
    } 
    // Jika tidak ada file baru, cek apakah gambar ditandai untuk dihapus
    else if (isAcademicHeroImageMarkedForDeletion) {
        formData.append('delete_hero_image', 'true');
    }

    // Append achievements data
    window.tempAchievements.forEach((item, index) => {
        // Append text data for each achievement
        if (item.id) { // If it's an existing achievement
            formData.append(`prestasi[${index}][id]`, item.id);
        }
        formData.append(`prestasi[${index}][nama]`, item.nama);
        formData.append(`prestasi[${index}][judul]`, item.judul);
        formData.append(`prestasi[${index}][tingkat]`, item.tingkat);

        // Handle image
        // item.image contains a File object for new/changed files
        if (item.image instanceof File) {
            formData.append(`prestasi[${index}][image]`, item.image);
        }
    });

    // Append deleted achievement IDs
    if (window.deletedAchievementIds && window.deletedAchievementIds.length > 0) {
        window.deletedAchievementIds.forEach(id => {
            // The `[]` syntax tells PHP to create an array
            formData.append('deleted_achievements[]', id);
        });
      }
    
    try {
        if (key === 'tk') await window.DataStore.saveAcademicTK(formData);
        else if (key === 'mi') await window.DataStore.saveAcademicMI(formData);

        document.getElementById('success-title').textContent = 'Berhasil Disimpan!';
        document.getElementById('success-message').textContent = 'Halaman akademik berhasil diperbarui.';
        window.utils.toggleModal('modal-success');
    } catch (error) {
        console.error('Gagal menyimpan halaman akademik:', error);
        document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
        document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan halaman. Silakan coba lagi.';
        window.utils.toggleModal('modal-alert');
    }
}

// Helper: Render Achievement List in Editor
window.renderAchievementList = function() {
    const container = document.getElementById('achievement-list-container');
    if (!container) return;
    
    container.innerHTML = window.tempAchievements.map((item, index) => {
        // Use the temporary preview URL if it exists (for new files), otherwise use the stored image URL from backend
        const imgSrc = item.preview || window.utils.getStorageUrl(item.image) || 'https://via.placeholder.com/150'; // Fallback placeholder
        return `
            <div class="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm group">
                <img src="${imgSrc}" class="w-12 h-12 rounded-lg object-cover bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h6 class="font-bold text-slate-800 text-sm truncate">${item.nama}</h6>
                    <p class="text-xs text-primary truncate">${item.judul}</p>
                    <p class="text-xs text-slate-400 truncate">${item.tingkat}</p>
                </div>
                <button onclick="removeAchievementItem(${index})" class="w-8 h-8 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition flex items-center justify-center">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
    }).join('');
}

// Helper: Add Achievement Item
window.addAchievementItem = function() {
    const nama = document.getElementById('ach-name').value;
    const judul = document.getElementById('ach-title').value;
    const tingkat = document.getElementById('ach-level').value;
    const fileInput = document.getElementById('ach-image');
    
    if (!nama || !judul) {
        alert("Nama dan Judul Prestasi wajib diisi!");
        return;
    }

    const file = (fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

    if (file && file.size > 200 * 1024) {
        document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
        document.getElementById('alert-message').textContent = 'Ukuran gambar prestasi maksimal 200KB.';
        window.utils.toggleModal('modal-alert');
        return;
    }

    // For new items, we store the File object itself and a temporary object URL for preview
    // For existing items (from API), 'image' will be a URL string.
    const achievement = {
        nama,
        judul,
        tingkat,
        image: file, // Store the file object
        preview: file ? URL.createObjectURL(file) : "" // Create a temporary URL for preview
    };

    window.tempAchievements.push(achievement);
    renderAchievementList();

    // Reset Form
    document.getElementById('ach-name').value = '';
    document.getElementById('ach-title').value = '';
    document.getElementById('ach-level').value = '';
    document.getElementById('ach-image').value = '';
    document.getElementById('ach-image-preview-container').classList.add('hidden');
    document.getElementById('ach-upload-prompt').classList.remove('hidden');
    document.getElementById('ach-image-preview').src = '';
}

window.removeAchievementItem = function(index) {
    const item = window.tempAchievements[index];
    // Revoke the object URL to free up memory
    if (item && item.id) {
        // If it's an existing item from the DB, track its ID for deletion on save
        window.deletedAchievementIds.push(item.id);
    }
    if (item && item.preview) {
        URL.revokeObjectURL(item.preview);
    }
    window.tempAchievements.splice(index, 1);
    renderAchievementList();
}

// Helper: Remove News Image
window.removeNewsImage = function(event) {
  if(event) event.stopPropagation();
  const input = document.getElementById('news-image-input');
  const previewContainer = document.getElementById('news-image-preview-container');
  const prompt = document.getElementById('news-upload-prompt');
  const previewImg = document.getElementById('news-image-preview');

  input.value = ''; // Clear the file input
  previewImg.src = '';
  previewContainer.classList.add('hidden');
  prompt.classList.remove('hidden');
}

async function saveNews() {
  const id = document.getElementById('news-id-hidden').value;
  const title = document.getElementById('news-title').value;
  const content = document.getElementById('news-content-editor').innerHTML;
  const dateInput = document.getElementById('news-date').value;
  const fileInput = document.getElementById('news-image-input');

  if (!title) {
    document.getElementById('alert-title').textContent = 'Data Belum Lengkap';
    document.getElementById('alert-message').textContent = 'Mohon isi judul berita terlebih dahulu sebelum menyimpan.';
    window.utils.toggleModal('modal-alert');
    return;
  }

  const dateObj = dateInput ? new Date(dateInput) : new Date();
  // Format to YYYY-MM-DD for backend consistency
  const dateString = dateObj.toISOString().split('T')[0];

  // Bersihkan tag HTML untuk deskripsi singkat
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;
  const plainText = tempDiv.textContent || tempDiv.innerText || "";
  const desc = plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");

  // Validasi client-side untuk konten berita
  if (!plainText.trim()) { // Memastikan konten tidak kosong setelah menghapus spasi
    document.getElementById('alert-title').textContent = 'Data Belum Lengkap';
    document.getElementById('alert-message').textContent = 'Mohon isi konten berita terlebih dahulu sebelum menyimpan.';
    window.utils.toggleModal('modal-alert');
    return;
  }

  // Create FormData
  const formData = new FormData();
  formData.append('title', title);
  formData.append('content', content);
  formData.append('desc', desc);
  formData.append('date', dateString);
  if (id) {
    formData.append('id', id);
  }
  
  // Append image file if it exists
  if (fileInput.files && fileInput.files[0]) {
    formData.append('gambar', fileInput.files[0]);
  }

  try {
    // Simpan via DataStore
    await window.DataStore.saveNews(formData);
    await renderAdminNews();
    
    window.utils.toggleModal('modal-news');
    document.getElementById('success-title').textContent = 'Berhasil Disimpan!';
    document.getElementById('success-message').textContent = 'Berita berhasil diterbitkan.';
    window.utils.toggleModal('modal-success');
  } catch (error) {
    console.error('Gagal menyimpan berita:', error);
    document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
    document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan berita. Silakan coba lagi.';
    window.utils.toggleModal('modal-alert');
  }
}

window.saveGalleryImage = async function() {
    const fileInput = document.getElementById('gallery-image-input');
    if (!fileInput.files || fileInput.files.length === 0) {
        document.getElementById('alert-title').textContent = 'Tidak Ada Gambar';
        document.getElementById('alert-message').textContent = 'Mohon pilih file gambar terlebih dahulu.';
        window.utils.toggleModal('modal-alert');
        return;
    }

    const file = fileInput.files[0];
    // Validasi Ukuran (Max 200KB)
    if (file.size > 200 * 1024) {
        document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
        document.getElementById('alert-message').textContent = 'Ukuran gambar maksimal 200KB.';
        window.utils.toggleModal('modal-alert');
        return;
    }

    const formData = new FormData();
    formData.append('gambar', file);
    // The gallery has no other fields, just the image

    try {
        await window.DataStore.saveGallery(formData);
        await renderAdminGallery();
        
        window.utils.toggleModal('modal-gallery');
    } catch (error) {
        console.error('Gagal menyimpan foto galeri:', error);
        document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
        document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan foto. Silakan coba lagi.';
        window.utils.toggleModal('modal-alert');
    }
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