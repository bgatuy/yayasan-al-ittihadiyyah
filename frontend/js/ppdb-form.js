document.addEventListener('DOMContentLoaded', async () => {
  // Guard clause: Jangan jalankan skrip jika tidak di halaman PPDB atau elemen form tidak ada
  const viewRegister = document.getElementById('view-register');
  if (!viewRegister) {
    return;
  }

  // --- LOGIKA BANNER GELOMBANG & STATUS PENDAFTARAN ---
  const settings = window.DataStore ? await window.DataStore.getPpdbPageSettings() : {};
  const btnDaftar = document.getElementById('btn-daftar');

  const waveName = settings.nama_gelombang || 'Gelombang 1';
  const wavePeriod = settings.periode_pendaftaran || '1 Oktober - 31 Desember 2025';
  const waveStatus = settings.status_ppdb || 'ditutup';

  const banner = document.getElementById('info-wave-banner');
  const iconBox = document.getElementById('info-wave-icon');
  const title = document.getElementById('info-wave-title');
  const desc = document.getElementById('info-wave-desc');
  const period = document.getElementById('info-wave-period');

  if (banner && title && period) {
    if (waveStatus === 'ditutup') {
      // Tampilan jika pendaftaran DITUTUP
      banner.className = 'bg-red-50 border border-red-100 rounded-2xl p-4 mb-8 flex items-start gap-4';
      iconBox.className = 'bg-red-100 text-red-600 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0';
      title.className = 'font-bold text-red-800';
      title.textContent = 'Pendaftaran Ditutup';
      desc.className = 'text-sm text-red-600 mt-1';
      desc.textContent = 'Mohon maaf, pendaftaran saat ini sedang ditutup. Nantikan informasi gelombang berikutnya.';
      
      // Disable tombol daftar
      if (btnDaftar) {
        btnDaftar.disabled = true;
        btnDaftar.classList.add('opacity-50', 'cursor-not-allowed');
        btnDaftar.textContent = 'Pendaftaran Ditutup';
      }
    } else {
      // Tampilan jika pendaftaran DIBUKA (Default)
      title.textContent = `Pendaftaran ${waveName} Dibuka!`;
      period.textContent = wavePeriod;
    }
  }

  // --- LOGIKA FORM PENDAFTARAN ---
  if (btnDaftar) {
    btnDaftar.addEventListener('click', async () => {
      // Ambil Data Input dari form multi-step
      const jenjangValue = document.querySelector('input[name="jenjang"]:checked')?.value;
      const nameValue = document.getElementById('reg-name').value.trim();
      const nicknameValue = document.getElementById('reg-nickname').value.trim();
      const genderValue = document.querySelector('input[name="jk"]:checked')?.value;
      const birthplaceValue = document.getElementById('reg-birthplace').value.trim();
      const birthdateValue = document.getElementById('reg-birthdate').value;
      const parentValue = document.getElementById('reg-parent').value.trim();
      const phoneValue = document.getElementById('reg-phone').value.trim();
      const emailValue = document.getElementById('reg-email').value.trim();
      
      // Gabungkan alamat dari beberapa field
      const addressDetail = document.getElementById('reg-address').value.trim();
      const village = document.getElementById('reg-village').value.trim();
      const district = document.getElementById('reg-district').value.trim();
      const city = document.getElementById('reg-city').value.trim();
      const fullAddress = [addressDetail, village, district, city].filter(Boolean).join(', ');

      let schoolValue = document.getElementById('reg-school').value.trim();

      // Validasi dasar. Validasi per-field sudah ditangani oleh logika step-form di HTML.
      // Tombol submit hanya aktif jika semua valid dan checkbox konfirmasi dicentang.
      if (!jenjangValue || !nameValue || !genderValue || !birthdateValue || !parentValue || !phoneValue || !fullAddress) {
        const modalAlert = document.getElementById('modal-alert-ppdb');
        const alertMsg = document.getElementById('alert-message-ppdb');
        const msgText = "Terjadi kesalahan. Pastikan semua data telah diisi dengan benar sebelum melanjutkan.";

        if (modalAlert && alertMsg) {
            alertMsg.textContent = msgText;
            modalAlert.classList.remove('hidden');
            modalAlert.classList.add('flex');
        } else {
          alert(msgText);
        }
        return;
      }

      if (!schoolValue) schoolValue = '-'; // Default jika kosong (misal TK)

      // Buat FormData untuk dikirim ke backend
      const formData = new FormData();
      formData.append('nama_lengkap', nameValue);
      formData.append('nama_panggilan', nicknameValue);
      formData.append('jenis_kelamin', genderValue);
      formData.append('jenjang', jenjangValue);
      formData.append('tempat_lahir', birthplaceValue);
      formData.append('tanggal_lahir', birthdateValue);
      formData.append('nama_orang_tua', parentValue);
      formData.append('nomor_wa', phoneValue);
      formData.append('email', emailValue);
      formData.append('alamat', fullAddress);
      formData.append('asal_sekolah', schoolValue);
      // Menggunakan settings yang sudah diambil di atas
      formData.append('gelombang', settings.nama_gelombang || 'Gelombang 1');

      // Simpan via DataStore
      const response = await window.DataStore.registerPpdb(formData);

      // Ambil ID dari response backend
      const newId = response.data.id;
      
      // Simpan ID pendaftaran di localStorage untuk kemudahan akses
      localStorage.setItem('ppdb_current_reg_id', newId);

      // Tampilkan modal sukses pendaftaran
      const modalSuccess = document.getElementById('modal-success-ppdb');
      const successIdDisplay = document.getElementById('success-reg-id');
      if (modalSuccess && successIdDisplay) {
        successIdDisplay.textContent = newId;
        window.utils.toggleModal('modal-success-ppdb');
      }
    });
  }

  // Listener untuk tombol "Lanjutkan Pembayaran" di modal sukses pendaftaran
  document.getElementById('btn-go-to-payment')?.addEventListener('click', () => {
    const regId = localStorage.getItem('ppdb_current_reg_id');
    // goToPaymentPage adalah fungsi global yang ada di ppdb.js
    if (regId && typeof window.goToPaymentPage === 'function') {
        window.goToPaymentPage(regId);
    }
  });

  // Listener untuk tombol tutup modal alert
  document.getElementById('btn-close-alert-ppdb')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-alert-ppdb');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
  });

  // Logika: Sembunyikan Asal Sekolah jika Jenjang TK dipilih
  const radioJenjang = document.querySelectorAll('input[name="jenjang"]');
  const fieldAsalSekolah = document.getElementById('field-asal-sekolah');

  function toggleAsalSekolah() {
    if (!fieldAsalSekolah) return; // Guard clause
    const selected = document.querySelector('input[name="jenjang"]:checked');
    if (selected && selected.value === 'TK') {
      fieldAsalSekolah.classList.add('hidden');
    } else {
      fieldAsalSekolah.classList.remove('hidden');
    }
  }

  if (radioJenjang.length > 0) {
    radioJenjang.forEach(radio => radio.addEventListener('change', toggleAsalSekolah));
    toggleAsalSekolah(); // Cek status awal saat halaman dimuat
  }
});