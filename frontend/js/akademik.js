document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-academic')) {
        return;
    }

    // Global variable to store achievements temporarily while editing
    window.tempAchievements = [];

    // Global variable to track deleted achievement IDs
    window.deletedAchievementIds = [];

    // Variabel ini untuk melacak apakah gambar utama ditandai untuk dihapus.
    let isAcademicHeroImageMarkedForDeletion = false;

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

        // 2. Keep Submenu Open & Highlight
        const pagesSubmenu = document.getElementById('pages-submenu');
        const pagesToggleBtn = document.getElementById('btn-pages-toggle');
        const pagesSubmenuIcon = document.getElementById('pages-submenu-icon');
        
        if (pagesSubmenu) {
        pagesSubmenu.classList.remove('hidden');
        pagesSubmenu.classList.add('flex');
        }
        if (pagesSubmenuIcon) pagesSubmenuIcon.classList.add('rotate-180');
        // Jangan highlight menu parent "Akademik", biarkan default.
        if (pagesToggleBtn) {
            pagesToggleBtn.classList.remove('bg-white/10');
        }

        // Highlight submenu item yang aktif
        const btnTk = document.getElementById('btn-academic-tk');
        const btnMi = document.getElementById('btn-academic-mi');

        // Reset keduanya ke state tidak aktif
        if(btnTk) btnTk.classList.remove('bg-white/10', 'text-white', 'font-bold');
        if(btnMi) btnMi.classList.remove('bg-white/10', 'text-white', 'font-bold');

        // Terapkan style aktif ke link yang sesuai dengan halaman
        const activeBtn = document.getElementById(`btn-academic-${key}`);
        if(activeBtn) {
            activeBtn.classList.add('bg-white/10', 'text-white', 'font-bold');
        }

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

    // Logika spesifik untuk halaman akademik yang sebelumnya ada di HTML
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page');

    if (page === 'tk' || page === 'mi') {
      const title = page === 'tk' ? 'TK Islam' : 'Madrasah Ibtidaiyah';
      // Panggil fungsi untuk memuat editor
      openAcademicEditor(page, title);
    } else {
      // Default atau fallback jika parameter tidak valid
      document.getElementById('view-academic').innerHTML = '<p class="text-center text-slate-500 py-10">Pilih halaman akademik dari menu sidebar untuk mulai mengedit.</p>';
      document.querySelector('h2.text-xl.font-bold').textContent = 'Akademik';
      document.getElementById('academic-title').textContent = 'Pilih Halaman';
    }
});