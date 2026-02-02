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

      // Hapus draft form karena sudah berhasil submit
      localStorage.removeItem('ppdb_registration_draft');

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
    const inputAsalSekolah = document.getElementById('reg-school');

    if (selected && selected.value === 'TK') {
      fieldAsalSekolah.classList.add('hidden');
      if (inputAsalSekolah) inputAsalSekolah.removeAttribute('required');
    } else {
      fieldAsalSekolah.classList.remove('hidden');
      if (inputAsalSekolah) inputAsalSekolah.setAttribute('required', 'required');
    }
  }

  if (radioJenjang.length > 0) {
    radioJenjang.forEach(radio => radio.addEventListener('change', toggleAsalSekolah));
    toggleAsalSekolah(); // Cek status awal saat halaman dimuat
  }
});

// --- LOGIKA WIZARD FORM (STEP-BY-STEP) & VALIDASI ---
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');
  if (!form) return; // Guard clause: Hentikan jika tidak ada form

  let currentStep = 1;
  const steps = document.querySelectorAll('.step-content');
  const storageKey = 'ppdb_registration_draft';

  // --- AUTO SAVE & LOAD ---
  const saveDraft = () => {
    const formData = {};
    // Simpan input text, email, tel, date, textarea, select
    form.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]), textarea, select').forEach(el => {
        if (el.id) formData[el.id] = el.value;
    });
    // Simpan Radio buttons
    form.querySelectorAll('input[type="radio"]:checked').forEach(el => {
        formData[el.name] = el.value;
    });
    // Simpan Checkboxes
    form.querySelectorAll('input[type="checkbox"]').forEach(el => {
        if (el.id) formData[el.id] = el.checked;
    });
    
    localStorage.setItem(storageKey, JSON.stringify(formData));
  };

  const loadDraft = () => {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return;
    
    try {
        const formData = JSON.parse(saved);
        
        // Restore input biasa
        for (const [key, value] of Object.entries(formData)) {
            const el = document.getElementById(key);
            if (el && el.type !== 'radio' && el.type !== 'checkbox') {
                el.value = value;
            } else if (el && el.type === 'checkbox') {
                el.checked = value;
                el.dispatchEvent(new Event('change'));
            }
        }

        // Restore Radio Buttons
        ['jenjang', 'jk'].forEach(name => {
            if (formData[name]) {
                const radio = form.querySelector(`input[name="${name}"][value="${formData[name]}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change'));
                }
            }
        });
    } catch (e) {
        console.error("Error loading draft", e);
    }
  };

  // Event listener untuk auto-save
  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);

  // --- WIZARD LOGIC ---
  const updateIndicator = () => {
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const connectors = document.querySelectorAll('.indicator-connector');

    stepIndicators.forEach((indicator) => {
        const stepNumber = parseInt(indicator.dataset.step);
        const circle = indicator.querySelector('.indicator-circle');
        const text = indicator.querySelector('.indicator-text');

        // Reset to default/inactive state
        circle.classList.remove('bg-primary', 'text-white', 'bg-green-500');
        circle.classList.add('bg-slate-200', 'text-slate-500');
        text.classList.remove('text-primary', 'text-green-600', 'font-medium');
        text.classList.add('text-slate-400');
        circle.innerHTML = stepNumber;

        if (stepNumber < currentStep) {
            // Completed state
            circle.classList.remove('bg-slate-200', 'text-slate-500');
            circle.classList.add('bg-green-500', 'text-white');
            circle.innerHTML = `<svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 12"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5.917 5.724 10.5 15 1.5"/></svg>`;
            text.classList.remove('text-slate-400');
            text.classList.add('text-green-600', 'font-medium');
        } else if (stepNumber === currentStep) {
            // Active state
            circle.classList.remove('bg-slate-200', 'text-slate-500');
            circle.classList.add('bg-primary', 'text-white');
            text.classList.remove('text-slate-400');
            text.classList.add('text-primary', 'font-medium');
        }
    });

    connectors.forEach((connector, index) => {
        if ((index + 1) < currentStep) {
            connector.classList.remove('bg-slate-200');
            connector.classList.add('bg-primary');
        } else {
            connector.classList.remove('bg-primary');
            connector.classList.add('bg-slate-200');
        }
    });
  };

  const showStep = (stepNumber) => {
    steps.forEach(step => {
      if (parseInt(step.dataset.step) === stepNumber) {
        step.classList.remove('hidden');
      } else {
        step.classList.add('hidden');
      }
    });
    currentStep = stepNumber;
    updateIndicator();
  };

  const validateStep = (stepNumber) => {
    const stepContent = document.getElementById(`step-${stepNumber}`);
    
    // Helper untuk cek visibilitas elemen
    const isVisible = (elem) => !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);

    // Filter input yang wajib diisi DAN terlihat
    const inputs = Array.from(stepContent.querySelectorAll('input, textarea, select')).filter(el => {
        return el.hasAttribute('required') && isVisible(el);
    });
    
    let isValid = true;
    let firstError = null;
    
    // Reset error styles
    stepContent.querySelectorAll('.border-red-500').forEach(el => el.classList.remove('border-red-500', 'ring-2', 'ring-red-200'));
    stepContent.querySelectorAll('.error-msg').forEach(el => el.remove());

    inputs.forEach(input => {
        let error = '';
        const val = input.value.trim();

        if (input.type === 'radio') return; // Radio divalidasi terpisah per grup

        if (!val) {
            error = 'Wajib diisi';
        } else if (input.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(val)) error = 'Format email tidak valid';
        } else if (input.type === 'tel') {
            // Regex lebih longgar: angka, spasi, strip, plus, kurung
            const phoneRegex = /^[0-9+\-\s()]+$/;
            const digitCount = val.replace(/[^0-9]/g, '').length;
            if (!phoneRegex.test(val) || digitCount < 9) error = 'Nomor telepon tidak valid (min 9 digit)';
        }

        if (error) {
            isValid = false;
            input.classList.add('border-red-500', 'ring-2', 'ring-red-200');
            
            const msg = document.createElement('p');
            msg.className = 'error-msg text-red-500 text-xs mt-1 ml-1';
            msg.textContent = error;
            input.parentNode.insertBefore(msg, input.nextSibling);

            if (!firstError) firstError = input;
        }
    });

    // Validasi Radio Groups
    const requiredRadioGroups = new Set();
    stepContent.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        if (isVisible(radio)) {
            requiredRadioGroups.add(radio.name);
        }
    });

    requiredRadioGroups.forEach(name => {
        const isChecked = stepContent.querySelector(`input[name="${name}"]:checked`);
        if (!isChecked) {
            isValid = false;
            const inputs = stepContent.querySelectorAll(`input[name="${name}"]`);
            const firstInput = inputs[0];
            const container = firstInput.closest('.grid') || firstInput.parentElement.parentElement;
            
            if (!container.querySelector('.error-msg')) {
                const msg = document.createElement('p');
                msg.className = 'error-msg text-red-500 text-xs mt-1 ml-1';
                msg.textContent = 'Pilihan ini wajib dipilih';
                container.appendChild(msg);
            }
            if (!firstError) firstError = firstInput;
        }
    });

    if (!isValid) {
        const alertModal = document.getElementById('modal-alert-ppdb');
        document.getElementById('alert-message-ppdb').textContent = 'Mohon lengkapi data yang ditandai merah dengan benar.';
        alertModal.classList.remove('hidden');
        alertModal.classList.add('flex');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstError.focus();
        }
    }
    return isValid;
  };

  const populateSummary = () => {
    const jenjang = document.querySelector('input[name="jenjang"]:checked');
    document.getElementById('summary-jenjang').textContent = jenjang ? jenjang.value : '-';
    document.getElementById('summary-name').textContent = document.getElementById('reg-name').value || '-';
    document.getElementById('summary-nickname').textContent = document.getElementById('reg-nickname').value || '-';
    const jk = document.querySelector('input[name="jk"]:checked');
    document.getElementById('summary-jk').textContent = jk ? (jk.value === 'L' ? 'Laki-laki' : 'Perempuan') : '-';
    const birthplace = document.getElementById('reg-birthplace').value;
    const birthdate = document.getElementById('reg-birthdate').value;
    document.getElementById('summary-ttl').textContent = `${birthplace || ''}, ${birthdate || ''}`;
    document.getElementById('summary-school').textContent = document.getElementById('reg-school').value || 'Tidak ada';
    document.getElementById('summary-parent').textContent = document.getElementById('reg-parent').value || '-';
    document.getElementById('summary-phone').textContent = document.getElementById('reg-phone').value || '-';
    document.getElementById('summary-email').textContent = document.getElementById('reg-email').value || '-';
    const address = `${document.getElementById('reg-address').value}, ${document.getElementById('reg-village').value}, ${document.getElementById('reg-district').value}, ${document.getElementById('reg-city').value}`;
    document.getElementById('summary-address').textContent = address;
  };

  document.querySelectorAll('.btn-next').forEach(button => {
    button.addEventListener('click', () => { 
        if (validateStep(currentStep)) { 
            if (currentStep === 2) { populateSummary(); } 
            showStep(currentStep + 1); 
            window.scrollTo(0, 0); 
        } 
    });
  });

  document.querySelectorAll('.btn-prev').forEach(button => {
    button.addEventListener('click', () => { 
        showStep(currentStep - 1); 
        window.scrollTo(0, 0); 
    });
  });

  document.getElementById('confirm-checkbox').addEventListener('change', (e) => { document.getElementById('btn-daftar').disabled = !e.target.checked; });
  
  const btnCloseAlert = document.getElementById('btnCloseAlert');
  if (btnCloseAlert) { btnCloseAlert.addEventListener('click', () => { document.getElementById('modal-alert-ppdb').classList.add('hidden'); document.getElementById('modal-alert-ppdb').classList.remove('flex'); }); }

  // Load draft data saat halaman dimuat
  setTimeout(loadDraft, 100);
});