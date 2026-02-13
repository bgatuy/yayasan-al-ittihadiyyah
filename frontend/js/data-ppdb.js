document.addEventListener('DOMContentLoaded', () => {
  // Guard clause: Hanya jalankan jika kita berada di halaman Data PPDB atau Dashboard,
  // karena script ini mengelola komponen di kedua halaman tersebut.
  if (!document.getElementById('view-ppdb') && !document.getElementById('view-dashboard')) {
    return;
  }

  let ppdbData = [];
  let paginationMeta = {};
  let dashboardStats = {}; // Cache for dashboard stats
  const itemsPerPage = 10; // Match backend and data.js default

  const tbody = document.getElementById('ppdb-tbody');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const searchInput = document.getElementById('search-ppdb');
  const yearDisplayEl = document.getElementById('current-academic-year');

  // State for current filters on the main PPDB page
  let currentFilters = {
    search: '',
    jenjang: '',
    status: '',
    wave: ''
  };

  // --- MAIN DATA FETCHING AND RENDERING LOGIC ---

  // Fetches data for the active academic year with server-side pagination and filters
  const fetchData = async (page = 1) => {
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>';
    if (paginationInfo) paginationInfo.textContent = '';
    if (paginationControls) paginationControls.innerHTML = '';

    try {
      // Call getPpdb with null for academicYear to let backend use the active one.
      const response = await window.DataStore.getPpdb(
        null,
        currentFilters.search,
        currentFilters.jenjang,
        currentFilters.status,
        currentFilters.wave,
        page,
        itemsPerPage
      );

      ppdbData = response.data;
      paginationMeta = response;

      renderTable();
      renderPagination();
    } catch (error) {
      console.error("Gagal memuat data PPDB aktif:", error);
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Gagal memuat data pendaftar.</td></tr>';
    }
  };

  // Fetches all necessary data for the dashboard and active PPDB page
  const initializePage = async () => {
    // Make API calls more resilient by separating them.
    // If one fails, the others can still proceed.
    let ppdbPageSettings = {};
    try {
      ppdbPageSettings = await window.DataStore.getPpdbPageSettings();
    } catch (error) {
      console.error("Gagal memuat pengaturan halaman PPDB:", error);
    }

    try {
      dashboardStats = await window.DataStore.getDashboardStats();
    } catch (error) {
      console.error("Gagal memuat statistik dashboard:", error);
      // You can display an error on the dashboard stats widgets if you want
    }

    // Set the active academic year display
    if (yearDisplayEl) {
      yearDisplayEl.textContent = ppdbPageSettings.tahun_ajaran || 'Tidak Diatur';
    }

    // Fetch the first page of data for the active year
    await fetchData(1);

    // 3. Render Semua Komponen
    renderDashboardTable();
    updateDashboardStats();
    updateNotifications(); // Pastikan notifikasi diperbarui setelah data dimuat
  };

  // Load awal
  initializePage();

  // Expose a refresh function to the global scope for external calls (e.g., after deletion)
  window.refreshPpdbTable = () => {
    // Re-initialize the page to fetch fresh data for the table, dashboard stats, and notifications.
    // This is more comprehensive than just fetching table data.
    initializePage();
  };

  // Listener untuk update Real-time dari tab lain (Notifikasi masuk tanpa refresh)
  window.addEventListener('storage', (e) => {
    if (e.key === 'ppdb_registrations') {
      window.refreshPpdbTable();
    }
  });

  // --- HELPER: BUKA MODAL DETAIL (Refactoring) ---
  // Fungsi ini menyatukan logika detail agar konsisten antara Tabel dan Notifikasi
  const openDetailModal = (data) => {
      if (!data) return;

      document.getElementById('detail-name').textContent = data.nama_lengkap;
      document.getElementById('detail-id').textContent = data.id;
      document.getElementById('detail-level').textContent = data.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'Taman Kanak-Kanak';
      // [FIX] Add a guard clause to prevent error if the element doesn't exist yet.
      const academicYearEl = document.getElementById('detail-academic-year');
      if (academicYearEl) {
        academicYearEl.textContent = data.tahun_ajaran || 'N/A'; // Display academic year
      }
      document.getElementById('detail-nickname').textContent = data.nama_panggilan || '-';
      
      const tglLahir = data.tanggal_lahir ? new Date(data.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      document.getElementById('detail-ttl').textContent = `${data.tempat_lahir || ''}, ${tglLahir}`;

      document.getElementById('detail-gender').textContent = data.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
      document.getElementById('detail-wave').textContent = data.gelombang;
      document.getElementById('detail-address').textContent = data.alamat || '-';
      document.getElementById('detail-school').textContent = data.asal_sekolah || '-';
      
      document.getElementById('detail-parent').textContent = data.nama_orang_tua;
      document.getElementById('detail-phone').textContent = data.nomor_wa;
      document.getElementById('detail-email').textContent = data.email;
      
      // Set value select status dan simpan ID di tombol simpan
      const statusSelect = document.getElementById('detail-status-select');
      if(statusSelect) statusSelect.value = data.status;
      
      const saveBtn = document.getElementById('btn-save-status');
      if(saveBtn) saveBtn.dataset.id = data.id;
      
      // Tampilkan Bukti Pembayaran
      const paymentContainer = document.getElementById('detail-payment-container');
      if(paymentContainer) {
          paymentContainer.innerHTML = '';
          if (data.bukti_bayar) {
              const url = window.utils.getStorageUrl(data.bukti_bayar);
              const downloadUrl = `${window.APP_CONFIG.API_BASE_URL}/admin/ppdb/${data.id}/payment-download`;
              const wrapper = document.createElement('div');
              wrapper.className = 'space-y-3';
              const imgWrapper = document.createElement('div');
              imgWrapper.className = 'relative group cursor-pointer inline-block';
              imgWrapper.onclick = () => window.viewFullImage(url);
              imgWrapper.innerHTML = `
                  <img src="${url}" class="max-h-64 mx-auto rounded-lg shadow-sm border border-slate-200" alt="Bukti Transfer">
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center rounded-lg">
                      <i class="fa-solid fa-magnifying-glass-plus text-white opacity-0 group-hover:opacity-100 text-3xl drop-shadow-md transition"></i>
                  </div>
              `;
              const downloadBtn = document.createElement('button');
              downloadBtn.type = 'button';
              downloadBtn.className = 'w-full inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition text-sm';
              downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Unduh Bukti Pembayaran';
              downloadBtn.addEventListener('click', async () => {
                  try {
                      await window.utils.downloadFile(downloadUrl, `bukti_pembayaran_${data.id || 'ppdb'}.jpg`);
                  } catch (e) {
                      alert('Gagal mengunduh bukti pembayaran.');
                  }
              });
              wrapper.appendChild(imgWrapper);
              wrapper.appendChild(downloadBtn);
              paymentContainer.appendChild(wrapper);
          } else {
              paymentContainer.innerHTML = `<p class="text-slate-500 italic text-sm"><i class="fa-solid fa-circle-xmark mr-1"></i> Belum ada bukti pembayaran.</p>`;
          }
      }

      window.utils.toggleModal('modal-detail');
  };

  // Sinkronisasi Filter Gelombang dengan Data & Pengaturan
  function populateWaveFilter() {
    const filterWave = document.getElementById('filter-wave');
    if (!filterWave) return;
    
    const currentWave = localStorage.getItem('ppdb_wave_name') || 'Gelombang 1';
    const dataWaves = [...new Set(ppdbData.map(item => item.gelombang))]; // Use 'gelombang' from data
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

    if (ppdbData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Tidak ada data yang cocok dengan filter Anda.</td></tr>';
      paginationInfo.textContent = 'Menampilkan 0 data';
      paginationControls.innerHTML = '';
      return;
    }

    ppdbData.forEach(item => {
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
    paginationInfo.textContent = `Menampilkan ${paginationMeta.from || 0} - ${paginationMeta.to || 0} dari ${paginationMeta.total || 0} data`;
  }

  function renderDashboardTable() {
    const tbody = document.getElementById('dashboard-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ambil 5 data terbaru dari endpoint dashboard
    const recentItems = (dashboardStats && dashboardStats.pendaftar_terbaru) ? dashboardStats.pendaftar_terbaru.slice(0, 5) : [];

    recentItems.forEach(item => {
      let statusClass = '';
      if (item.status === 'Diterima' || item.status === 'Terverifikasi') statusClass = 'bg-green-100 text-green-800';
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
    if (!dashboardStats.statistik) return;
    
    // Update Cards
    const { total_pendaftar: total, pendaftar_tk: tk, pendaftar_mi: mi } = dashboardStats.statistik;
    const elTotal = document.getElementById('stat-total');
    const elTk = document.getElementById('stat-tk');
    const elMi = document.getElementById('stat-mi');
    
    if(elTotal) elTotal.textContent = total;
    if(elTk) elTk.textContent = tk;
    if(elMi) elMi.textContent = mi;

    // Update Progress Bars
    const acceptedPct = dashboardStats.status_penerimaan?.diterima || 0;
    const pendingPct = dashboardStats.status_penerimaan?.menunggu || 0;

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
    
    const totalPages = paginationMeta.last_page || 1;
    const currentPage = paginationMeta.current_page || 1;
    
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
      if (currentPage > 1) { fetchData(currentPage - 1); }
    }, currentPage === 1));

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
      paginationControls.appendChild(createBtn(i, () => {
        fetchData(i);
      }, false, currentPage === i));
    }

    // Next Button
    paginationControls.appendChild(createBtn('<i class="fa-solid fa-chevron-right"></i>', () => {
      if (currentPage < totalPages) { fetchData(currentPage + 1); }
    }, currentPage === totalPages));
  }

  if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
      currentFilters.search = e.target.value;
      fetchData(1); // Fetch from server with new search term
    });
  }

  populateWaveFilter(); // Panggil fungsi filter otomatis

  // 4. Fitur Hapus & Detail (Event Delegation)
  document.addEventListener('click', async (e) => {
    // Hapus PPDB
    const deletePpdbBtn = e.target.closest('.btn-delete-ppdb');
    if (deletePpdbBtn) {
      itemToDelete = { type: 'ppdb', id: deletePpdbBtn.dataset.id };
      window.utils.toggleModal('modal-confirm');
    }

    // Detail
    const detailBtn = e.target.closest('.btn-detail');
    if (detailBtn) {
      const id = detailBtn.dataset.id;
      const data = ppdbData.find(item => item.id === id);
      
      if (data) {
        openDetailModal(data);
      }
    }
  });

  // 5. Fitur Filter & Export
  const btnFilter = document.getElementById('btn-filter');
  const btnExport = document.getElementById('btn-export');

  // This function is now needed here as well.
  function populateWaveFilter() {
    const filterWave = document.getElementById('filter-wave');
    if (!filterWave) return;
    
    // For simplicity, we can hardcode waves or fetch them from a dedicated endpoint.
    const allWaves = ['Gelombang 1', 'Gelombang 2', 'Gelombang 3'];
    filterWave.innerHTML = '<option value="">Pilih Gelombang</option>';
    allWaves.forEach(wave => {
      const option = document.createElement('option');
      option.value = wave;
      option.textContent = wave;
      filterWave.appendChild(option);
    });
  }

  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      populateWaveFilter();
      // Set dropdown values to match current filters before showing modal
      document.getElementById('filter-jenjang').value = currentFilters.jenjang;
      document.getElementById('filter-status').value = currentFilters.status;
      document.getElementById('filter-wave').value = currentFilters.wave;
      window.utils.toggleModal('modal-filter');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // Define headers
      const headers = ['ID', 'Nama Siswa', 'Gender', 'Jenjang', 'Orang Tua', 'No. HP', 'Email', 'Asal Sekolah', 'Status'];
      
      // Map data to CSV format (filteredData is already for the current academic year)
      const csvContent = [
        headers.join(','),
        ...ppdbData.map(item => {
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
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Handle commas and quotes in data
        })
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob); // Use currentAcademicYear in filename
      link.setAttribute('href', url);
      link.setAttribute('download', `data_ppdb_aktif.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            
            openDetailModal(item);
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

  // Wait for modals to be loaded before attaching listeners to modal elements
  document.addEventListener('modalsReady', () => {
    // Fitur Simpan Status (Dari Modal Detail)
    const btnSaveStatus = document.getElementById('btn-save-status');
    if (btnSaveStatus) {
      btnSaveStatus.addEventListener('click', async () => {
        const id = btnSaveStatus.dataset.id;
        const newStatus = document.getElementById('detail-status-select').value;
        
        if (!id) return;

        try {
          const formData = new FormData();
          formData.append('status', newStatus);

          await window.DataStore.updatePpdb(id, formData);
          
          // Re-fetch all data to ensure UI is consistent
          await initializePage();
          
          window.utils.toggleModal('modal-detail');
          document.getElementById('success-title').textContent = 'Status Diperbarui!';
          document.getElementById('success-message').textContent = `Status pendaftar berhasil diubah menjadi ${newStatus}.`;
          window.utils.toggleModal('modal-success');
        } catch (error) {
          console.error("Gagal memperbarui status:", error);
          alert(`Gagal memperbarui status: ${error.message}`);
        }
      });
    }

    // Fitur Apply Filter
    const btnApplyFilter = document.getElementById('btn-apply-filter');
    if (btnApplyFilter) {
      btnApplyFilter.addEventListener('click', () => {
        // Check if we are on the correct view to avoid conflicts
        if (document.getElementById('view-ppdb')) {
          currentFilters.jenjang = document.getElementById('filter-jenjang').value;
          currentFilters.status = document.getElementById('filter-status').value;
          currentFilters.wave = document.getElementById('filter-wave').value;
          fetchData(1);
          window.utils.toggleModal('modal-filter');
        }
      });
    }
  });
});
