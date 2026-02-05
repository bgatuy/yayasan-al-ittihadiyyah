window.saveNews = async function() {
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
        await window.renderAdminNews(); // Panggil fungsi render global
        
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

// Fungsi ini akan dijalankan setelah modal dimuat
function initializeNewsModalListeners() {
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
}

document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-news')) {
        return;
    }

    window.renderAdminNews = async function() {
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

    // Helper: Format Text (Bold, Italic, etc)
    window.formatDoc = function(cmd, value = null) {
        document.execCommand(cmd, false, value);
        document.getElementById('news-content-editor').focus();
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

    // Initial render
    window.renderAdminNews();

    // Fitur Tambah Berita (Modal)
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

    // Fitur Hapus & Detail (Event Delegation)
    document.addEventListener('click', async (e) => {
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
    });

});

// Dengarkan sinyal 'modalsReady' sebelum menginisialisasi listener modal
document.addEventListener('modalsReady', initializeNewsModalListeners);