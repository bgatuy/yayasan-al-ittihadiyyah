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

    try {
        await window.DataStore.saveGallery(formData);
        // Panggil renderAdminGallery yang ada di dalam scope DOMContentLoaded
        // Kita bisa membuatnya global atau memanggilnya seperti ini jika sudah didefinisikan
        if (typeof window.renderAdminGallery === 'function') {
            await window.renderAdminGallery();
        }
        
        window.utils.toggleModal('modal-gallery');
    } catch (error) {
        console.error('Gagal menyimpan foto galeri:', error);
        document.getElementById('alert-title').textContent = 'Gagal Menyimpan';
        document.getElementById('alert-message').textContent = error.message || 'Terjadi kesalahan saat menyimpan foto. Silakan coba lagi.';
        window.utils.toggleModal('modal-alert');
    }
}

// Fungsi ini akan dijalankan setelah modal dimuat
function initializeGalleryModalListeners() {
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
}

document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-gallery')) {
        return;
    }

    window.renderAdminGallery = async function() {
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

    // Initial render
    renderAdminGallery();

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

    document.addEventListener('click', async (e) => {
        const deleteGalleryBtn = e.target.closest('.btn-delete-gallery');
        if (deleteGalleryBtn) {
            const id = parseInt(deleteGalleryBtn.dataset.id);
            itemToDelete = { type: 'gallery', id: id };
            window.utils.toggleModal('modal-confirm');
        }
    });
});

// Dengarkan sinyal 'modalsReady' sebelum menginisialisasi listener modal
document.addEventListener('modalsReady', initializeGalleryModalListeners);