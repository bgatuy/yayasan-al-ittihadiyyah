document.addEventListener('DOMContentLoaded', () => {
  // Guard clause: Hanya jalankan jika kita berada di halaman Data PPDB Arsip
  if (!document.getElementById('view-ppdb-arsip')) {
    return;
  }

  let ppdbData = [];
  let paginationMeta = {}; // To store pagination info from the API
  const itemsPerPage = 10; // You can adjust this

  const tbody = document.getElementById('ppdb-tbody');
  const paginationInfo = document.getElementById('pagination-info');
  const paginationControls = document.getElementById('pagination-controls');
  const searchInput = document.getElementById('search-ppdb');
  const filterAcademicYearSelect = document.getElementById('filter-academic-year');

  // State for current filters
  let currentFilters = {
    academicYear: '',
    search: '',
    jenjang: '',
    status: '',
    wave: ''
  };

  // --- MAIN DATA FETCHING AND RENDERING LOGIC ---
  const initializePage = async () => {
    if (filterAcademicYearSelect.options.length <= 1) { // Only populate if not already populated
      const academicYears = await window.DataStore.getAcademicYears();
      filterAcademicYearSelect.innerHTML = '<option value="">Pilih Tahun Ajaran</option>';
      academicYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        filterAcademicYearSelect.appendChild(option);
      });
      // Select the latest year by default if available
      if (academicYears.length > 0) {
        currentFilters.academicYear = academicYears[0]; // Default to the newest year
        filterAcademicYearSelect.value = currentFilters.academicYear;
      }
    }

    if (currentFilters.academicYear) {
      fetchData(1);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Pilih tahun ajaran untuk melihat data arsip.</td></tr>';
      paginationInfo.textContent = 'Menampilkan 0 data';
      paginationControls.innerHTML = '';
    }
  };

  // The core function to fetch data from the server based on current filters and page
  const fetchData = async (page = 1) => {
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-slate-500">Memuat data...</td></tr>';
    paginationInfo.textContent = '';
    paginationControls.innerHTML = '';

    try {
      const response = await window.DataStore.getPpdb(
        currentFilters.academicYear,
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
      tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-8 text-center text-red-500">Gagal memuat data. Coba lagi nanti.</td></tr>';
    }
  };

  // Load awal
  initializePage();

  // Expose a refresh function to the global scope for external calls (e.g., after deletion)
  window.refreshPpdbArchiveTable = () => {
    // Re-fetch data for the current page to reflect changes.
    fetchData(paginationMeta.current_page || 1);
  };

  // --- HELPER: BUKA MODAL DETAIL ---
  const openDetailModal = async (data) => {
      if (!data) return;

      // Fetch full detail with academic year
      const fullData = await window.DataStore.getPpdbDetail(data.id, currentFilters.academicYear);
      if (!fullData) return;

      document.getElementById('detail-name').textContent = fullData.nama_lengkap;
      document.getElementById('detail-id').textContent = fullData.id;
      document.getElementById('detail-level').textContent = fullData.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'Taman Kanak-Kanak';
      // [FIX] Add a guard clause to prevent error if the element doesn't exist yet.
      const academicYearEl = document.getElementById('detail-academic-year');
      if (academicYearEl) {
        academicYearEl.textContent = fullData.tahun_ajaran; // Display academic year
      }
      document.getElementById('detail-nickname').textContent = fullData.nama_panggilan || '-';
      
      const tglLahir = fullData.tanggal_lahir ? new Date(fullData.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      document.getElementById('detail-ttl').textContent = `${fullData.tempat_lahir || ''}, ${tglLahir}`;

      document.getElementById('detail-gender').textContent = fullData.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
      document.getElementById('detail-wave').textContent = fullData.gelombang;
      document.getElementById('detail-address').textContent = fullData.alamat || '-';
      document.getElementById('detail-school').textContent = fullData.asal_sekolah || '-';
      
      document.getElementById('detail-parent').textContent = fullData.nama_orang_tua;
      document.getElementById('detail-phone').textContent = fullData.nomor_wa;
      document.getElementById('detail-email').textContent = fullData.email;
      
      // Set value select status dan simpan ID di tombol simpan
      const statusSelect = document.getElementById('detail-status-select');
      if(statusSelect) statusSelect.value = fullData.status;
      
      const saveBtn = document.getElementById('btn-save-status');
      if(saveBtn) {
        saveBtn.dataset.id = fullData.id;
        saveBtn.dataset.academicYear = fullData.tahun_ajaran; // Store academic year for update
      }
      
      // Tampilkan Bukti Pembayaran
      const paymentContainer = document.getElementById('detail-payment-container');
      if(paymentContainer) {
          paymentContainer.innerHTML = '';
          if (fullData.bukti_bayar) {
              const url = window.utils.getStorageUrl(fullData.bukti_bayar);
              const downloadUrl = `${window.APP_CONFIG.API_BASE_URL}/admin/ppdb/${fullData.id}/payment-download`;
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
                      await window.utils.downloadFile(downloadUrl, `bukti_pembayaran_${fullData.id || 'ppdb'}.jpg`);
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

  function populateWaveFilter() {
    const filterWave = document.getElementById('filter-wave');
    if (!filterWave) return;
    
    // For simplicity, we can hardcode waves or fetch them from a dedicated endpoint.
    // Here, we'll just use a simple list.
    const allWaves = ['Gelombang 1', 'Gelombang 2', 'Gelombang 3'];
    filterWave.innerHTML = '<option value="">Pilih Gelombang</option>';
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

    // Update Info from meta
    paginationInfo.textContent = `Menampilkan ${paginationMeta.from || 0} - ${paginationMeta.to || 0} dari ${paginationMeta.total || 0} data`;
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
      const term = e.target.value.toLowerCase();
      currentFilters.search = term;
      fetchData(1);
    });
  }

  // Event listener for academic year filter
  if (filterAcademicYearSelect) {
    filterAcademicYearSelect.addEventListener('change', (e) => {
      currentFilters.academicYear = e.target.value;
      fetchData(1);
    });
  }

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
      // dataset.id is always a string; API data may use numeric ids.
      const data = ppdbData.find(item => String(item.id) === String(id));
      
      if (data) {
        openDetailModal(data);
      }
    }
  });

  const btnFilter = document.getElementById('btn-filter');
  const btnExport = document.getElementById('btn-export');

  if (btnFilter) {
    btnFilter.addEventListener('click', () => {
      populateWaveFilter(); // Populate wave filter based on currently loaded data
      // Set dropdown values to match current filters before showing modal
      document.getElementById('filter-jenjang').value = currentFilters.jenjang;
      document.getElementById('filter-status').value = currentFilters.status;
      document.getElementById('filter-wave').value = currentFilters.wave;
      window.utils.toggleModal('modal-filter');
    });
  }

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      // Note: This will only export the currently visible page of data.
      // For a full export, a dedicated backend endpoint is recommended.
      if (!currentFilters.academicYear) {
        alert('Pilih tahun ajaran terlebih dahulu untuk mengekspor data.');
        return;
      }
      // Define headers
      const headers = ['ID', 'Nama Siswa', 'Gender', 'Jenjang', 'Orang Tua', 'No. HP', 'Email', 'Asal Sekolah', 'Status', 'Tahun Ajaran'];
      
      // Map data to CSV format
      const csvContent = [
        headers.join(','),
        ...ppdbData.map(item => { // Export current page data
          return [
            item.id,
            `"${item.nama_lengkap}"`,
            item.jenis_kelamin,
            item.jenjang,
            `"${item.nama_orang_tua}"`,
            `'${item.nomor_wa}`, // Force string for phone in excel
            item.email,
            `"${item.asal_sekolah}"`,
            item.status,
            item.tahun_ajaran || currentFilters.academicYear // Ensure academic year is included
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','); // Handle commas and quotes in data
        })
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `data_ppdb_arsip_${currentFilters.academicYear.replace(/\//g, '-')}_page_${paginationMeta.current_page}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }


  // Wait for modals to be loaded before attaching listeners to modal elements
  document.addEventListener('modalsReady', () => {
    // Fitur Simpan Status
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

          // Re-fetch the current page to show the update
          await fetchData(paginationMeta.current_page || 1);
          
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
        currentFilters.jenjang = document.getElementById('filter-jenjang').value;
        currentFilters.status = document.getElementById('filter-status').value;
        currentFilters.wave = document.getElementById('filter-wave').value;
        fetchData(1);
        window.utils.toggleModal('modal-filter');
      });
    }
  });
});
