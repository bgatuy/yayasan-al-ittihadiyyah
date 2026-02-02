document.addEventListener('DOMContentLoaded', async () => {
  // --- TAB SWITCHING LOGIC ---
  window.switchPpdbTab = function(tabName) {
    const viewRegister = document.getElementById('view-register');
    const viewCheck = document.getElementById('view-check');
    const viewPayment = document.getElementById('view-payment');
    const viewLoading = document.getElementById('view-loading');
    
    // Hide all views
    [viewRegister, viewCheck, viewPayment, viewLoading].forEach(view => {
      if (view) view.classList.add('hidden');
    });

    // Show selected view
    if (tabName === 'register') {
        if(viewRegister) viewRegister.classList.remove('hidden');
    } else if (tabName === 'check') {
        if(viewCheck) viewCheck.classList.remove('hidden');
    } else if (tabName === 'payment') {
        if(viewPayment) viewPayment.classList.remove('hidden');
    }

    // Perbarui style tombol/tab navigasi
    const tabs = document.querySelectorAll('[data-tab]');
    
    // Definisikan kelas untuk setiap state (untuk header gelap)
    const activeClasses = ['bg-primary', 'text-white', 'hover:bg-primary/90'];
    const inactiveClasses = ['text-white/70', 'hover:text-white', 'hover:bg-white/10'];

    tabs.forEach(tab => {
        // Hapus semua kelas styling yang relevan (baik yang baru maupun yang lama)
        tab.classList.remove(
            'bg-primary', 'text-white', 'hover:bg-primary/90', // Kelas aktif baru
            'text-white/70', 'hover:text-white', 'hover:bg-white/10', // Kelas inaktif baru
            'text-primary', 'bg-primary/10', // Kelas aktif lama
            'text-slate-500', 'hover:text-primary', 'hover:bg-slate-50' // Kelas inaktif lama
        );

        // Tentukan tab mana yang harus aktif secara visual.
        // Untuk view 'payment', kita ingin tab 'check' yang aktif.
        const activeTabName = (tabName === 'payment') ? 'check' : tabName;

        if (tab.dataset.tab === activeTabName) {
            tab.classList.add(...activeClasses);
        } else {
            tab.classList.add(...inactiveClasses);
        }
    });

    // Reset posisi scroll ke paling atas secara instan (seperti pindah halaman)
    window.scrollTo(0, 0);
  };

  // Fungsi untuk pindah ke halaman pembayaran
  window.goToPaymentPage = (id) => {
    if (!id) {
      const storedId = localStorage.getItem('ppdb_current_reg_id');
      if (!storedId) {
        alert('ID Pendaftaran tidak ditemukan.');
        switchPpdbTab('check');
        return;
      }
      id = storedId;
    }
    
    localStorage.setItem('ppdb_current_reg_id', id);
    // FIX: Hanya tutup modal sukses jika sedang terbuka.
    // Ini mencegah modal muncul secara tidak terduga saat berpindah ke halaman pembayaran dari 'Cek Status'.
    const successModal = document.getElementById('modal-success-ppdb');
    if (successModal && !successModal.classList.contains('hidden')) {
      // The modal is open (e.g., from new registration), so close it.
      window.utils.toggleModal('modal-success-ppdb');
    }
    switchPpdbTab('payment');
    renderPaymentView(id);
  };

  // Fungsi untuk inisialisasi Swiper.js pada hero slider
  // Dipindahkan dari index.html ke sini untuk memastikan fungsi tersedia saat dipanggil.
  function initializeHeroSlider(slideCount = 0) {
    new Swiper('.hero-slider', {
      // Aktifkan loop hanya jika ada lebih dari 1 slide untuk mencegah error.
      loop: slideCount > 1,
      effect: 'fade',
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      // Tambahkan navigasi panah
      navigation: {
        nextEl: '.hero-slider-next',
        prevEl: '.hero-slider-prev',
      },
    });
  }

  // --- RENDER KONTEN DINAMIS (HERO, JADWAL, BIAYA) ---
  // Fungsi ini dipanggil sekali saat halaman dimuat untuk mengisi konten
  // yang diatur dari panel admin, seperti gambar hero, jadwal, dan biaya.
  (async function renderDynamicPpdbContent() {
    const settings = window.DataStore ? await window.DataStore.getPpdbPageSettings() : {};
    if (!settings) return;

    // 1. Render Hero Images (Slider)
    const heroSliderWrapper = document.getElementById('ppdb-hero-slider');
    if (heroSliderWrapper && settings.ppdb_hero_images && Array.isArray(settings.ppdb_hero_images)) {
      const images = settings.ppdb_hero_images;
      if (images.length > 0) {
        heroSliderWrapper.innerHTML = images.map(imagePath => `
          <div class="swiper-slide">
            <img src="${window.utils.getStorageUrl(imagePath)}" alt="Info PPDB">
          </div>
        `).join('');
        
        // Initialize Swiper.js after slides are added to the DOM
        if (typeof initializeHeroSlider === 'function') {
          initializeHeroSlider(images.length);
        }
      }
    }

    // 2. Render Jadwal Penting
    const scheduleReg = document.getElementById('schedule-date-registration');
    const scheduleClose = document.getElementById('schedule-date-closing');
    const scheduleAnnounce = document.getElementById('schedule-date-announcement');
    
    if (scheduleReg && settings.periode_pendaftaran) scheduleReg.textContent = settings.periode_pendaftaran;
    if (scheduleClose && settings.ppdb_schedule_closing) scheduleClose.textContent = settings.ppdb_schedule_closing;
    if (scheduleAnnounce && settings.ppdb_schedule_announcement) scheduleAnnounce.textContent = settings.ppdb_schedule_announcement;

    // 3. Render Biaya Pendaftaran
    const feeTkDisplay = document.getElementById('fee-display-tk');
    const feeMiDisplay = document.getElementById('fee-display-mi');

    if (feeTkDisplay && settings.ppdb_fee_tk) {
      feeTkDisplay.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(settings.ppdb_fee_tk)}`;
    }
    if (feeMiDisplay && settings.ppdb_fee_mi) {
      feeMiDisplay.textContent = `Rp ${new Intl.NumberFormat('id-ID').format(settings.ppdb_fee_mi)}`;
    }

    // 4. Render Notice Bar
    const noticeBar = document.getElementById('notice-bar-container');
    const noticeText = document.getElementById('ppdb-announcement');
    if (noticeBar && noticeText) {
      // Tampilkan bar hanya jika status 'dibuka' dan ada teks pengumuman
      if (settings.status_ppdb === 'dibuka' && settings.ppdb_notice) {
        noticeText.textContent = settings.ppdb_notice;
        noticeBar.classList.remove('hidden');
      } else {
        // Sembunyikan jika ditutup atau tidak ada teks
        noticeBar.classList.add('hidden');
      }
    }

    // 5. Render Contact WhatsApp
    const waLink = document.getElementById('contact-wa-link');
    const waNumber = document.getElementById('contact-wa-number');
    if (waLink && waNumber && settings.ppdb_contact_wa) {
      const contactNumber = settings.ppdb_contact_wa;
      // Pastikan nomor untuk link hanya berisi angka
      const linkNumber = contactNumber.replace(/[^0-9]/g, '');
      waLink.href = `https://wa.me/${linkNumber}`;
      waNumber.textContent = contactNumber; // Tampilkan nomor sesuai yang diinput admin
    }
  })();

  // --- INITIAL VIEW LOGIC (ANTI-FLICKER) ---
  // This function determines which view to show on page load.
  (async function initializePpdbView() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    const idParam = urlParams.get('id');

    // Priority 1: Handle URL hash for deep linking
    if (hash.startsWith('#payment/')) {
      const regId = hash.split('/')[1];
      if (regId) {
        goToPaymentPage(regId);
        return;
      }
    } else if (hash === '#check') {
      switchPpdbTab('check');
      return;
    }

    // Priority 2: Direct URL parameters (legacy support)
    if (viewParam === 'payment' && idParam) {
      goToPaymentPage(idParam);
      return;
    } else if (viewParam === 'check') {
      switchPpdbTab('check');
      return;
    }
    
    // Priority 3: Resume a pending registration from localStorage
    const pendingRegId = localStorage.getItem('ppdb_current_reg_id');
    if (pendingRegId) {
      let pendingReg = null;
      try {
        // Use the public, safe endpoint
        pendingReg = await window.DataStore.checkPpdbStatus(pendingRegId);
      } catch (error) {
        console.warn(`Auto-resume check failed for ID ${pendingRegId}:`, error.message);
        // If ID is not found on server, it's stale. Remove it.
        if (error.message && error.message.toLowerCase().includes('ditemukan')) { // "tidak ditemukan"
          localStorage.removeItem('ppdb_current_reg_id');
        }
      }
      
      // If the registration is still in a payment-related state, go to payment page.
      if (pendingReg && ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Terverifikasi'].includes(pendingReg.status)) {
        goToPaymentPage(pendingRegId);
        return;
      } else {
        // If status is final (Diterima, etc.) or not found, the stored ID is no longer relevant for auto-resume.
        localStorage.removeItem('ppdb_current_reg_id');
      }
    }

    // Default Fallback: Show the main registration form.
    switchPpdbTab('register');
  })();

  // --- LOGIKA CEK STATUS ---
  const checkForm = document.getElementById('check-status-form');
  if (checkForm) {
    checkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputId = document.getElementById('check-id').value.trim().toUpperCase();
        if (!inputId) {
            alert('Silakan masukkan ID Pendaftaran.');
            return;
        }
        
        let result = null;
        let settings = {}; // Inisialisasi objek settings
        try {
            // [FIX] Gunakan endpoint publik yang aman untuk cek status, bukan endpoint admin.
            // Ini lebih aman, efisien, dan memperbaiki error 401 di halaman publik.
            // Ambil data siswa dan pengaturan PPDB secara bersamaan untuk efisiensi.
            [result, settings] = await Promise.all([
                window.DataStore.checkPpdbStatus(inputId),
                window.DataStore.getPpdbPageSettings()
            ]);
        } catch (error) {
            console.error("Error saat cek status:", error);
            result = null;
        }
        const resultCard = document.getElementById('result-card');

        if (result) {
            // Populate Data
            document.getElementById('result-name').textContent = result.nama_lengkap;
            document.getElementById('result-level').textContent = result.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'TK Islam';
            document.getElementById('result-reg-id').textContent = result.id;
            document.getElementById('result-wave').textContent = result.gelombang;

            // Styling Status
            const header = document.getElementById('result-header');
            const icon = document.getElementById('result-icon');
            const statusText = document.getElementById('result-status');
            const messageText = document.getElementById('result-message');
            const actionDiv = document.getElementById('result-action');

            // Reset Classes
            header.className = 'p-6 text-center border-b border-slate-200 transition-colors duration-300';
            icon.className = 'w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm mb-3 transition-colors duration-300';
            actionDiv.innerHTML = '';
            actionDiv.classList.add('hidden');

            if (result.status === 'Diterima') { // STATUS: DITERIMA
                header.classList.add('bg-green-50');
                icon.classList.add('bg-green-100', 'text-green-600');
                icon.innerHTML = '<i class="fa-solid fa-check"></i>';
                statusText.textContent = 'LULUS SELEKSI';
                statusText.className = 'text-xl font-bold text-green-700';
                messageText.textContent = 'Selamat! Anda dinyatakan lulus seleksi. Silakan Unduh Surat Penerimaan untuk proses Daftar Ulang.';
                
                actionDiv.classList.remove('hidden');
                actionDiv.innerHTML = `<button onclick="downloadAcceptancePDF('${result.id}', '${result.nama_lengkap}', '${result.jenjang}', '${result.gelombang}')" class="block w-full bg-primary text-white text-center font-bold py-3 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30"><i class="fa-solid fa-file-pdf mr-2"></i> Unduh Surat Penerimaan</button>`;
            } else if (result.status === 'Terverifikasi') { // STATUS: TERVERIFIKASI
                header.classList.add('bg-green-50');
                icon.classList.add('bg-green-100', 'text-green-600');
                icon.innerHTML = '<i class="fa-solid fa-clipboard-check"></i>';
                statusText.textContent = 'PEMBAYARAN TERVERIFIKASI';
                statusText.className = 'text-xl font-bold text-green-700';
                messageText.textContent = 'Data Anda sedang dalam tahap seleksi. Silakan cek pengumuman hasil seleksi di menu "Cek Status Pendaftaran" secara berkala.';
                
                actionDiv.classList.remove('hidden');
                // FIX: Evaluate the date expression within the template literal by wrapping it in ${...}
                // and adding quotes so it's passed as a string in the onclick handler.
                const dateString = new Date(result.created_at).toLocaleDateString('id-ID');
                // Tentukan biaya berdasarkan jenjang dari data settings yang sudah diambil
                const fee = result.jenjang === 'TK' ? settings.ppdb_fee_tk : settings.ppdb_fee_mi;
                const formattedFee = new Intl.NumberFormat('id-ID').format(fee || 0);
                actionDiv.innerHTML = `<button onclick="downloadReceiptPDF('${result.id}', '${result.nama_lengkap}', '${result.jenjang}', '${formattedFee}', '${dateString}')" class="block w-full bg-primary text-white text-center font-bold py-3 rounded-xl hover:bg-secondary transition shadow-lg shadow-primary/30"><i class="fa-solid fa-file-pdf mr-2"></i> Unduh Bukti Pembayaran</button>`;
            } else if (result.status === 'Tidak Diterima') { // STATUS: TIDAK DITERIMA
                header.classList.add('bg-red-50');
                icon.classList.add('bg-red-100', 'text-red-600');
                icon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                statusText.textContent = 'TIDAK DITERIMA';
                statusText.className = 'text-xl font-bold text-red-700';
                messageText.textContent = 'Mohon maaf, Anda belum lulus seleksi kali ini.';
            } else if (result.status === 'Menunggu Pembayaran') { // STATUS: MENUNGGU PEMBAYARAN
                header.classList.add('bg-orange-50');
                icon.classList.add('bg-orange-100', 'text-orange-600');
                icon.innerHTML = '<i class="fa-solid fa-wallet"></i>';
                statusText.textContent = 'MENUNGGU PEMBAYARAN';
                statusText.className = 'text-xl font-bold text-orange-700';
                messageText.textContent = 'Silakan selesaikan pembayaran pendaftaran.';
                
                actionDiv.classList.remove('hidden');
                const payBtn = document.createElement('button');
                payBtn.className = 'block w-full bg-orange-500 text-white text-center font-bold py-3 rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/30';
                payBtn.innerHTML = '<i class="fa-solid fa-credit-card mr-2"></i> Bayar Sekarang';
                payBtn.onclick = () => {
                    // Gunakan fungsi baru untuk pindah ke halaman pembayaran
                    goToPaymentPage(result.id);
                };
                actionDiv.appendChild(payBtn);
            } else { // STATUS: MENUNGGU VERIFIKASI
                header.classList.add('bg-yellow-50');
                icon.classList.add('bg-yellow-100', 'text-yellow-600');
                icon.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
                statusText.textContent = result.status.toUpperCase();
                statusText.className = 'text-xl font-bold text-yellow-700';
                messageText.textContent = 'Bukti pembayaran sedang diverifikasi. Silakan cek status pendaftaran secara berkala.';
            }

            resultCard.classList.remove('hidden');
        } else {
            alert('Data tidak ditemukan! Mohon periksa kembali ID Pendaftaran Anda.');
            resultCard.classList.add('hidden');
        }
    });
  }

  // --- LOGIKA HALAMAN PEMBAYARAN (STATE-BASED) ---

  // Fungsi untuk me-refresh halaman pembayaran setelah aksi (misal: setelah upload)
  window.refreshPaymentPage = () => {
    window.utils.toggleModal('modal-success-payment', false);
    const regId = localStorage.getItem('ppdb_current_reg_id');
    if (regId) {
      renderPaymentView(regId);
    }
  };

  // Fungsi utama yang mengatur tampilan halaman pembayaran berdasarkan status
  async function renderPaymentView(id) {
    // Ambil elemen-elemen UI
    const uploadView = document.getElementById('payment-step-upload');
    const waitingView = document.getElementById('payment-step-waiting');
    const idDisplay = document.getElementById('payment-reg-id-display');

    // Sembunyikan semua view dulu
    uploadView.classList.add('hidden');
    waitingView.classList.add('hidden');
    if (idDisplay) idDisplay.textContent = id.toUpperCase();

    try {
      // Panggil endpoint untuk cek status siswa dan pengaturan PPDB secara bersamaan
      const [data, settings] = await Promise.all([
          window.DataStore.checkPpdbStatus(id),
          window.DataStore.getPpdbPageSettings()
      ]);
      const status = data.status;

      if (status === 'Menunggu Pembayaran') {
        // Tentukan biaya pendaftaran berdasarkan jenjang siswa
        const fee = data.jenjang === 'TK' ? settings.ppdb_fee_tk : settings.ppdb_fee_mi;
        const formattedFee = new Intl.NumberFormat('id-ID').format(fee || 0);
        
        // Update tampilan biaya di halaman
        document.getElementById('payment-fee-display').textContent = `Rp ${formattedFee}`;

        // Reset form upload
        document.getElementById('payment-proof').value = '';
        document.getElementById('payment-preview-img').classList.add('hidden');
        document.getElementById('upload-placeholder').classList.remove('hidden');
        // Tampilkan view upload
        uploadView.classList.remove('hidden');
      } else if (status === 'Menunggu Verifikasi' || status === 'Terverifikasi') {
        // --- START: NEW LOGIC FOR CONSISTENT UI ---
        // Populate Data
        document.getElementById('payment-result-name').textContent = data.nama_lengkap;
        document.getElementById('payment-result-level').textContent = data.jenjang === 'MI' ? 'Madrasah Ibtidaiyah' : 'TK Islam';
        document.getElementById('payment-result-reg-id').textContent = data.id;
        document.getElementById('payment-result-wave').textContent = data.gelombang;

        // Styling Status
        const header = document.getElementById('payment-result-header');
        const icon = document.getElementById('payment-result-icon');
        const statusText = document.getElementById('payment-result-status');
        const messageText = document.getElementById('payment-result-message');
        
        // Reset classes
        header.className = 'p-6 text-center border-b border-slate-200 transition-colors duration-300';
        icon.className = 'w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm mb-3 transition-colors duration-300';

        if (status === 'Menunggu Verifikasi') {
            header.classList.add('bg-yellow-50');
            icon.classList.add('bg-yellow-100', 'text-yellow-600');
            icon.innerHTML = '<i class="fa-solid fa-hourglass-half"></i>';
            statusText.textContent = 'MENUNGGU VERIFIKASI';
            statusText.className = 'text-xl font-bold text-yellow-700';
            messageText.textContent = 'Bukti pembayaran telah diterima dan sedang diverifikasi. Silakan cek status pendaftaran secara berkala. ';
        } else { // Terverifikasi
            header.classList.add('bg-green-50');
            icon.classList.add('bg-green-100', 'text-green-600');
            icon.innerHTML = '<i class="fa-solid fa-clipboard-check"></i>';
            statusText.textContent = 'PEMBAYARAN TERVERIFIKASI';
            statusText.className = 'text-xl font-bold text-green-700';
            messageText.textContent = 'Pembayaran telah diverifikasi. Silakan unduh bukti pembayaran di menu "Cek Status Pendaftaran".';
        }

        // Setup CTA button
        const ctaButton = document.getElementById('btn-go-to-check-status');
        if (ctaButton) {
            ctaButton.onclick = () => {
                switchPpdbTab('check');
                document.getElementById('check-id').value = id;
            };
        }

        // Show the waiting view
        waitingView.classList.remove('hidden');
        // --- END: NEW LOGIC ---
      } else if (status === 'Diterima' || status === 'Tidak Diterima') {
        // Jika sudah ada hasil, arahkan ke halaman Cek Status
        switchPpdbTab('check');
        document.getElementById('check-id').value = id;
        document.getElementById('check-status-form').dispatchEvent(new Event('submit'));
      }
    } catch (error) {
      console.error("Gagal mengambil status:", error);
      alert('Gagal mengambil status pendaftaran. Pastikan ID Pendaftaran benar.');
      switchPpdbTab('check');
    }
  }

  const paymentFileInput = document.getElementById('payment-proof');
  if(paymentFileInput) {
      paymentFileInput.addEventListener('change', (e) => {
          if(e.target.files && e.target.files[0]) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                  const previewImg = document.getElementById('payment-preview-img');
                  const placeholder = document.getElementById('upload-placeholder');
                  if(previewImg) {
                      previewImg.src = ev.target.result;
                      previewImg.classList.remove('hidden');
                  }
                  if(placeholder) placeholder.classList.add('hidden');
              }
              reader.readAsDataURL(e.target.files[0]);
          }
      });
  }

  // Helper: Kompresi Gambar Agresif (Target ~50KB)
  const compressImage = (file, quality = 0.4, maxWidth = 500) => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = event => {
              const img = new Image();
              img.src = event.target.result;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  let width = img.width;
                  let height = img.height;

                  // Resize paksa ke lebar 500px agar file kecil
                  if (width > maxWidth) {
                      height = Math.round(height * (maxWidth / width));
                      width = maxWidth;
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, width, height);
                  
                  // Output: JPEG dengan kualitas 40%
                  resolve(canvas.toDataURL('image/jpeg', quality));
              };
              img.onerror = error => reject(error);
          };
          reader.onerror = error => reject(error);
      });
  };

  const btnConfirmPayment = document.getElementById('btn-confirm-payment');
  if(btnConfirmPayment) {
      btnConfirmPayment.addEventListener('click', async () => {
          const fileInput = document.getElementById('payment-proof');
          const id = document.getElementById('payment-reg-id-display').textContent;

          if(!fileInput.files[0]) {
              const modalAlert = document.getElementById('modal-alert-ppdb'); // Bisa pakai modal yang sama
              const alertMsg = document.getElementById('alert-message-ppdb');
              
              if (modalAlert) {
                  if(alertMsg) alertMsg.textContent = 'Mohon upload bukti transfer terlebih dahulu.';
                  modalAlert.classList.remove('hidden');
                  modalAlert.classList.add('flex');
              } else {
                  alert('Mohon upload bukti transfer terlebih dahulu.');
              }
              return;
          }

          // Loading state
          const originalText = btnConfirmPayment.textContent;
          btnConfirmPayment.textContent = 'Memproses...';
          btnConfirmPayment.disabled = true;

          try {
              // Kompres gambar dan konversi ke Blob
              const compressedDataUrl = await compressImage(fileInput.files[0]);
              const imageBlob = window.utils.dataURLtoBlob(compressedDataUrl);

              const formData = new FormData();
              formData.append('bukti_bayar', imageBlob, `payment_${id}.jpg`);
              
              // Panggil fungsi DataStore baru yang menargetkan endpoint upload
              const updated = await window.DataStore.uploadPaymentProof(id, formData);
              
              if(updated) {
                  // Jangan hapus ID, karena mungkin user mau cek status lagi.
                  // Cukup tampilkan modal sukses.
                  const modalSuccess = document.getElementById('modal-success-payment');
                  if(modalSuccess) {
                      modalSuccess.classList.remove('hidden');
                      modalSuccess.classList.add('flex');
                  }
              } else {
                  alert('Gagal memperbarui data pendaftaran.');
              }
          } catch (error) {
              console.error(error);
              alert('Gagal memproses gambar. Silakan coba lagi.');
          } finally {
              btnConfirmPayment.textContent = originalText;
              btnConfirmPayment.disabled = false;
          }
      });
  }

  window.copyRegistrationId = function(button) {
    const idElement = document.getElementById('success-reg-id');
    const idToCopy = idElement.textContent;

    const showSuccess = () => {
      const originalIcon = button.innerHTML;
      button.innerHTML = `<i class="fa-solid fa-check text-green-500 text-xl"></i>`;
      setTimeout(() => {
        button.innerHTML = originalIcon;
      }, 2000);
    };

    const showError = (err) => {
      console.error('Gagal menyalin ID:', err);
      alert('Gagal menyalin ID. Mohon salin secara manual.');
    };

    // Modern way: Clipboard API (only works in secure contexts - HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(idToCopy).then(showSuccess).catch(showError);
    } else {
      // Fallback for insecure contexts (HTTP) or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = idToCopy;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess();
      } catch (err) {
        showError(err);
      }
      document.body.removeChild(textArea);
    }
  }

  window.copyAccountNumber = function(button) {
    const accountNumber = '7123456789';

    const showSuccess = () => {
      const originalIcon = button.innerHTML;
      button.innerHTML = `<i class="fa-solid fa-check text-green-500 text-lg"></i>`;
      setTimeout(() => {
        button.innerHTML = originalIcon;
      }, 2000);
    };

    const showError = (err) => {
      console.error('Gagal menyalin nomor rekening:', err);
      alert('Gagal menyalin nomor rekening. Mohon salin secara manual.');
    };

    // Modern way: Clipboard API (only works in secure contexts - HTTPS)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(accountNumber).then(showSuccess).catch(showError);
    } else {
      // Fallback for insecure contexts (HTTP) or older browsers
      const textArea = document.createElement("textarea");
      textArea.value = accountNumber;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        showSuccess();
      } catch (err) {
        showError(err);
      }
      document.body.removeChild(textArea);
    }
  }

  // --- PDF DOWNLOAD FUNCTIONS ---
  window.downloadAcceptancePDF = function(id, name, level, wave) {
      // Cek ketersediaan library jsPDF
      const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
      if (!jsPDF) {
          alert("Library jsPDF tidak ditemukan. Pastikan script sudah dimuat.");
          return;
      }

      const levelName = level === 'MI' ? 'Madrasah Ibtidaiyah' : 'TK Islam';
      const academicYear = localStorage.getItem('ppdb_academic_year') || '2025/2026';
      
      const doc = new jsPDF('p', 'mm', 'a4');

      // ===== MARGIN & SETUP =====
      const marginLeft = 30;
      const marginRight = 30;
      const marginTop = 30;
      const pageWidth = 210;
      const contentWidth = pageWidth - marginLeft - marginRight;
      let y = marginTop;

      // ===== KOP SURAT =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('YAYASAN PENDIDIKAN ISLAM AL-ITTIHADIYYAH', pageWidth / 2, y, { align: 'center' });
      
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Jl. Masjid An Nur No.6, Tebet, Jakarta Selatan | Telp: (021) 12345678', pageWidth / 2, y, { align: 'center' });
      
      y += 8;
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      doc.setLineWidth(0.2); // Double line effect
      doc.line(marginLeft, y + 1, pageWidth - marginRight, y + 1);
      y += 15;

      // ===== JUDUL =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SURAT KETERANGAN DITERIMA', pageWidth / 2, y, { align: 'center' });
      doc.setLineWidth(0.2);
      doc.line((pageWidth/2) - 35, y + 1, (pageWidth/2) + 35, y + 1); // Underline judul
      y += 15;

      // ===== ISI SURAT =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      const paragraf1 = `      Panitia Penerimaan Peserta Didik Baru (PPDB) Yayasan Al-Ittihadiyyah Tahun Ajaran ${academicYear}, berdasarkan hasil seleksi administrasi dan observasi yang telah dilakukan, dengan ini menerangkan bahwa:`;
      
      doc.text(paragraf1, marginLeft, y, { maxWidth: contentWidth, align: 'justify' });
      y += 15;

      // ===== DATA SISWA (Manual Table) =====
      const labelX = marginLeft + 10;
      const colonX = marginLeft + 50;
      const valueX = marginLeft + 55;
      const rowHeight = 7;

      const dataSiswa = [
          { label: 'ID Pendaftaran', value: id },
          { label: 'Nama Siswa', value: name },
          { label: 'Jenjang', value: levelName },
          { label: 'Gelombang', value: wave }
      ];

      dataSiswa.forEach(row => {
          doc.text(row.label, labelX, y);
          doc.text(':', colonX, y);
          doc.setFont('helvetica', 'bold');
          doc.text(row.value, valueX, y);
          doc.setFont('helvetica', 'normal');
          y += rowHeight;
      });
      y += 8;

      // ===== STATUS LULUS =====
      doc.text('Dinyatakan:', marginLeft, y);
      y += 10;

      // Kotak LULUS
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect((pageWidth/2) - 30, y - 6, 60, 12); // x, y, w, h
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('LULUS / DITERIMA', pageWidth / 2, y + 2, { align: 'center' });
      y += 15;

      // ===== PENUTUP =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const paragraf2 = '      Kepada orang tua/wali murid diharapkan segera melakukan Daftar Ulang dan penyelesaian administrasi keuangan di sekretariat sekolah paling lambat 7 (tujuh) hari setelah surat ini diterbitkan.';
      doc.text(paragraf2, marginLeft, y, { maxWidth: contentWidth, align: 'justify' });

      doc.save(`Bukti_Penerimaan_${id}.pdf`);
  };

  window.downloadReceiptPDF = function(id, name, level, amount, date) {
      // Cek ketersediaan library jsPDF
      const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
      if (!jsPDF) {
          alert("Library jsPDF tidak ditemukan.");
          return;
      }

      const levelName = level === 'MI' ? 'Madrasah Ibtidaiyah' : 'TK Islam';
      const academicYear = localStorage.getItem('ppdb_academic_year') || '2025/2026';
      
      const doc = new jsPDF('p', 'mm', 'a4');

      // ===== MARGIN & SETUP =====
      const marginLeft = 30;
      const marginRight = 30;
      const marginTop = 30;
      const pageWidth = 210;
      let y = marginTop;

      // ===== KOP SURAT =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('YAYASAN PENDIDIKAN ISLAM AL-ITTIHADIYYAH', pageWidth / 2, y, { align: 'center' });
      
      y += 6;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Jl. Masjid An Nur No.6, Tebet, Jakarta Selatan', pageWidth / 2, y, { align: 'center' });
      
      y += 8;
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y, pageWidth - marginRight, y);
      doc.setLineWidth(0.2);
      doc.line(marginLeft, y + 1, pageWidth - marginRight, y + 1);
      y += 15;

      // ===== JUDUL =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('KUITANSI PEMBAYARAN', pageWidth / 2, y, { align: 'center' });
      y += 15;

      // ===== RINCIAN PEMBAYARAN =====
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      const labelX = marginLeft + 5;
      const colonX = marginLeft + 45;
      const valueX = marginLeft + 50;
      const rowHeight = 8;

      const dataBayar = [
          { label: 'No. Referensi', value: id },
          { label: 'Tanggal', value: date },
          { label: 'Telah Terima Dari', value: 'Orang Tua / Wali Calon Siswa' },
          { label: 'Nama Siswa', value: name },
          { label: 'Jenjang', value: levelName },
          { label: 'Guna Pembayaran', value: `Biaya Pendaftaran PPDB ${academicYear}` }
      ];

      dataBayar.forEach(row => {
          doc.text(row.label, labelX, y);
          doc.text(':', colonX, y);
          
          // Bold untuk Nama dan ID
          if(row.label === 'Nama Siswa' || row.label === 'No. Referensi') doc.setFont('helvetica', 'bold');
          
          // Handle text wrapping untuk deskripsi panjang
          if(row.label === 'Guna Pembayaran') {
              doc.text(row.value, valueX, y, { maxWidth: 100 });
          } else {
              doc.text(row.value, valueX, y);
          }
          
          doc.setFont('helvetica', 'normal');
          y += rowHeight;
      });
      y += 5;

      // ===== TOTAL BOX =====
      doc.setFillColor(245, 245, 245); // Light gray bg
      doc.rect(marginLeft, y, pageWidth - marginLeft - marginRight, 12, 'F'); // Filled rect
      doc.setDrawColor(200, 200, 200);
      doc.rect(marginLeft, y, pageWidth - marginLeft - marginRight, 12, 'S'); // Stroke rect
      
      doc.setFontSize(11);
      doc.text('JUMLAH DIBAYAR:', marginLeft + 5, y + 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rp ${amount}`, pageWidth - marginRight - 5, y + 8, { align: 'right' });
      y += 25;

      // ===== CAP LUNAS =====
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.rect((pageWidth/2) - 25, y - 6, 50, 12);
      doc.setFontSize(14);
      doc.text('LUNAS', pageWidth / 2, y + 2, { align: 'center' });
      y += 30;

      // ===== FOOTER =====
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100);
      // Posisi footer disesuaikan agar tidak terlalu bawah (karena konten lebih sedikit tanpa TTD)
      // Menggunakan y saat ini atau posisi fixed di bawah jika diinginkan
      doc.text('Dokumen ini adalah bukti pembayaran yang sah yang diterbitkan secara elektronik.', pageWidth / 2, y, { align: 'center' });

      doc.save(`Tanda_Terima_${id}.pdf`);
  };

});