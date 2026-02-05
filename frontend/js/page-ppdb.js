document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-ppdb-page')) {
        return;
    }

    // State untuk kelola gambar hero PPDB
    let deletedPpdbHeroImagePaths = [];
    let newPpdbHeroImages = []; // Array untuk menampung file gambar baru

    // --- PENGELOLAAN HALAMAN PPDB ---
    // Helper untuk format angka
    const formatNumberInput = (value) => {
        if (!value) return '';
        // Hapus semua karakter non-digit, lalu format ulang
        const numberString = value.toString().replace(/[^0-9]/g, '');
        return new Intl.NumberFormat('id-ID').format(numberString);
    };
    const unformatNumberInput = (formattedValue) => {
        return formattedValue.replace(/\./g, '');
    };

    window.loadPpdbPageSettings = async () => {
        // Reset state saat memuat view
        deletedPpdbHeroImagePaths = [];
        // Revoke object URL lama untuk mencegah memory leak
        newPpdbHeroImages.forEach(item => URL.revokeObjectURL(item.previewUrl));
        newPpdbHeroImages = [];
        const heroFileInput = document.getElementById('setting-ppdb-hero-images');
        if (heroFileInput) heroFileInput.value = '';
        // Also clear the new image preview area
        const newPreviewContainer = document.getElementById('ppdb-new-hero-images-preview');
        if (newPreviewContainer) newPreviewContainer.innerHTML = '';

        const settings = await window.DataStore.getPpdbPageSettings();
        const existingImagesGrid = document.getElementById('ppdb-existing-hero-images-grid');
        const noImagesMessage = document.getElementById('ppdb-no-existing-images');
        
        if (settings) {
            document.getElementById('setting-ppdb-academic-year').value = settings.tahun_ajaran || '';
            document.getElementById('setting-ppdb-contact-wa').value = settings.ppdb_contact_wa || '';
            document.getElementById('setting-ppdb-notice').value = settings.ppdb_notice || '';
            document.getElementById('setting-ppdb-wave-name').value = settings.nama_gelombang || '';
            document.getElementById('setting-ppdb-wave-status').value = settings.status_ppdb || 'ditutup';
            document.getElementById('setting-ppdb-schedule-registration').value = settings.periode_pendaftaran || '';
            document.getElementById('setting-ppdb-schedule-closing').value = settings.ppdb_schedule_closing || '';
            document.getElementById('setting-ppdb-schedule-announcement').value = settings.ppdb_schedule_announcement || '';
            document.getElementById('setting-ppdb-fee-tk').value = formatNumberInput(settings.ppdb_fee_tk);
            document.getElementById('setting-ppdb-fee-mi').value = formatNumberInput(settings.ppdb_fee_mi);

            // Render existing hero images
            existingImagesGrid.innerHTML = '';
            if (settings.ppdb_hero_images && Array.isArray(settings.ppdb_hero_images) && settings.ppdb_hero_images.length > 0) {
                noImagesMessage.classList.add('hidden');
                settings.ppdb_hero_images.forEach(imagePath => {
                    const div = document.createElement('div');
                    div.className = 'ppdb-hero-image-item relative group aspect-video bg-slate-100 rounded-lg overflow-hidden shadow-sm';
                    div.innerHTML = `
                        <img src="${window.utils.getStorageUrl(imagePath)}" class="w-full h-full object-cover">
                        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" class="btn-delete-ppdb-hero-image w-10 h-10 rounded-full bg-red-600 text-white hover:bg-red-700 transition" data-path="${imagePath}" title="Hapus Foto">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                `;
                    existingImagesGrid.appendChild(div);
                });
            } else {
                // Tampilkan prompt jika tidak ada gambar
                noImagesMessage.classList.remove('hidden');
            }
        }
    };

    // Panggil fungsi untuk memuat data saat halaman pertama kali dibuka
    loadPpdbPageSettings();

    async function savePpdbPageSettings() {
        const formData = new FormData();
        formData.append('tahun_ajaran', document.getElementById('setting-ppdb-academic-year').value);
        formData.append('ppdb_contact_wa', document.getElementById('setting-ppdb-contact-wa').value);
        formData.append('ppdb_notice', document.getElementById('setting-ppdb-notice').value);
        formData.append('nama_gelombang', document.getElementById('setting-ppdb-wave-name').value);
        formData.append('status_ppdb', document.getElementById('setting-ppdb-wave-status').value);
        formData.append('periode_pendaftaran', document.getElementById('setting-ppdb-schedule-registration').value);
        formData.append('ppdb_schedule_closing', document.getElementById('setting-ppdb-schedule-closing').value);
        formData.append('ppdb_schedule_announcement', document.getElementById('setting-ppdb-schedule-announcement').value);
        formData.append('ppdb_fee_tk', unformatNumberInput(document.getElementById('setting-ppdb-fee-tk').value));
        formData.append('ppdb_fee_mi', unformatNumberInput(document.getElementById('setting-ppdb-fee-mi').value));

        // 1. Tambahkan file gambar BARU yang akan diupload
        if (newPpdbHeroImages.length > 0) {
            newPpdbHeroImages.forEach(item => {
                formData.append('ppdb_hero_images[]', item.file);
            });
        }

        // 2. Tambahkan path gambar LAMA yang akan dihapus
        if (deletedPpdbHeroImagePaths.length > 0) {
            deletedPpdbHeroImagePaths.forEach(path => {
                formData.append('deleted_hero_images[]', path); // PHP akan membacanya sebagai array
            }
            );
        }


        try {
            await window.DataStore.savePpdbPageSettings(formData);
            document.getElementById('success-title').textContent = 'Berhasil Disimpan!';
            document.getElementById('success-message').textContent = 'Pengaturan halaman PPDB telah diperbarui.';
            window.utils.toggleModal('modal-success');
            loadPpdbPageSettings(); // Muat ulang data untuk menampilkan state terbaru
        } catch (error) {
            console.error('Gagal menyimpan pengaturan:', error);
            document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
            document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan pengaturan. Silakan coba lagi.';
            window.utils.toggleModal('modal-alert');
        }
    }

    const btnSavePpdbPageSettings = document.getElementById('btn-save-ppdb-page-settings');
    if (btnSavePpdbPageSettings) {
        btnSavePpdbPageSettings.addEventListener('click', savePpdbPageSettings);
    }

    // --- Logika Interaktif untuk Input Biaya ---
    const feeTkInput = document.getElementById('setting-ppdb-fee-tk');
    const feeMiInput = document.getElementById('setting-ppdb-fee-mi');

    const handleFeeInput = (e) => {
        e.target.value = formatNumberInput(e.target.value);
    };

    if (feeTkInput) feeTkInput.addEventListener('input', handleFeeInput);
    if (feeMiInput) feeMiInput.addEventListener('input', handleFeeInput);

    // --- Logika Interaktif untuk Upload Gambar Hero PPDB (Staging) ---
    const btnAddHeroImage = document.getElementById('btn-add-ppdb-hero-image');
    const heroFileInput = document.getElementById('setting-ppdb-hero-images');
    const newHeroPreviewContainer = document.getElementById('ppdb-new-hero-images-preview');

    // Fungsi untuk render preview dari gambar yang di-staging
    function renderNewHeroPreviews() {
        if (!newHeroPreviewContainer) return;
        newHeroPreviewContainer.innerHTML = ''; // Hapus preview lama

        newPpdbHeroImages.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'new-image-preview relative group aspect-video bg-slate-100 rounded-lg overflow-hidden shadow-sm';
            div.innerHTML = `
              <img src="${item.previewUrl}" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/50 flex items-center justify-center p-2">
                  <p class="text-white text-xs font-bold text-center">BARU</p>
              </div>
              <button type="button" class="btn-remove-new-ppdb-hero-image absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition text-xs flex items-center justify-center" data-index="${index}" title="Batal Unggah">
                  <i class="fa-solid fa-xmark"></i>
              </button>
          `;
            newHeroPreviewContainer.appendChild(div);
        });
    }

    // Event listener untuk tombol "Tambah Foto"
    if (btnAddHeroImage && heroFileInput) {
        btnAddHeroImage.addEventListener('click', () => {
            heroFileInput.click();
        });
    }

    // Event listener untuk input file itu sendiri
    if (heroFileInput) {
        heroFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validasi sisi klien
            const maxFileSize = 200 * 1024; // 200KB
            if (file.size > maxFileSize) {
                document.getElementById('alert-title').textContent = 'Ukuran Gambar Terlalu Besar';
                document.getElementById('alert-message').textContent = `File "${file.name}" melebihi batas 200KB.`;
                window.utils.toggleModal('modal-alert');
                heroFileInput.value = ''; // Reset input
                return;
            }

            // Tambahkan ke array staging dan render ulang preview
            newPpdbHeroImages.push({ file: file, previewUrl: URL.createObjectURL(file) });
            renderNewHeroPreviews();

            // Reset input file agar bisa memilih file yang sama lagi jika dihapus
            heroFileInput.value = '';
        });
    }

    // Event delegation for delete/remove buttons
    document.addEventListener('click', (e) => {
        // Hapus Gambar Hero PPDB (yang sudah ada)
        const deletePpdbHeroImageBtn = e.target.closest('.btn-delete-ppdb-hero-image');
        if (deletePpdbHeroImageBtn) {
            const pathToDelete = deletePpdbHeroImageBtn.dataset.path;
            if (pathToDelete) {
                // 1. Add to the deletion list
                if (!deletedPpdbHeroImagePaths.includes(pathToDelete)) {
                    deletedPpdbHeroImagePaths.push(pathToDelete);
                }
                
                // 2. Remove the element from the DOM
                const imageItem = deletePpdbHeroImageBtn.closest('.ppdb-hero-image-item');
                if (imageItem) {
                    imageItem.remove();
                }

                // 3. Check if we need to show the upload prompt
                const existingImagesGrid = document.getElementById('ppdb-existing-hero-images-grid');
                const noImagesMessage = document.getElementById('ppdb-no-existing-images');
                if (existingImagesGrid && noImagesMessage && existingImagesGrid.childElementCount === 0) {
                    noImagesMessage.classList.remove('hidden');
                }
            }
        }

        // Hapus Gambar Hero PPDB BARU (yang belum di-upload)
        const removeNewPpdbHeroImageBtn = e.target.closest('.btn-remove-new-ppdb-hero-image');
        if (removeNewPpdbHeroImageBtn) {
            const indexToRemove = parseInt(removeNewPpdbHeroImageBtn.dataset.index, 10);
            if (!isNaN(indexToRemove) && newPpdbHeroImages[indexToRemove]) {
                // Revoke object URL untuk mencegah memory leak
                URL.revokeObjectURL(newPpdbHeroImages[indexToRemove].previewUrl);
                // Hapus dari array
                newPpdbHeroImages.splice(indexToRemove, 1);
                // Render ulang preview
                renderNewHeroPreviews();
            }
        }
    });
});