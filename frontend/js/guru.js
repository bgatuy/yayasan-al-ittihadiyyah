window.saveTeacher = async function() {
    const id = document.getElementById('teacher-id-hidden').value;
    const nama = document.getElementById('teacher-name').value;
    const jabatan = document.getElementById('teacher-position').value;
    const pendidikan = document.getElementById('teacher-education').value;
    const mata_pelajaran = document.getElementById('teacher-subject').value;
    const masa_bakti = document.getElementById('teacher-masa-bakti').value;
    const quote = document.getElementById('teacher-quote').value;
    const fileInput = document.getElementById('teacher-image-input');

    if (!nama || !jabatan) {
        document.getElementById('alert-title').textContent = 'Data Belum Lengkap';
        document.getElementById('alert-message').textContent = 'Nama dan Jabatan wajib diisi!';
        window.utils.toggleModal('modal-alert');
        return;
    }

    const formData = new FormData();
    formData.append('nama', nama);
    formData.append('jabatan', jabatan);
    formData.append('pendidikan', pendidikan);
    formData.append('mata_pelajaran', mata_pelajaran);
    formData.append('masa_bakti', masa_bakti);
    formData.append('quote', quote);
    if (id) {
        formData.append('id', id);
    }

    if (fileInput.files && fileInput.files[0]) {
        try {
            const compressed = await window.utils.compressImageAdaptive(fileInput.files[0], { maxSizeKB: 200 });
            if (compressed.size > 200 * 1024) {
                document.getElementById('alert-title').textContent = 'Ukuran Terlalu Besar';
                document.getElementById('alert-message').textContent = 'Ukuran gambar guru maksimal 200KB.';
                window.utils.toggleModal('modal-alert');
                return;
            }
            formData.append('image', compressed.blob, 'teacher.jpg');
        } catch (e) {
            document.getElementById('alert-title').textContent = 'Gagal Memproses Gambar';
            document.getElementById('alert-message').textContent = 'Silakan coba gambar lain.';
            window.utils.toggleModal('modal-alert');
            return;
        }
    }

    try {
        await window.DataStore.saveTeacher(formData);
        
        // Panggil renderAdminTeachers yang ada di dalam scope DOMContentLoaded
        if (typeof window.renderAdminTeachers === 'function') {
            await window.renderAdminTeachers();
        }
        
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

// Fungsi ini akan dijalankan setelah modal dimuat
function initializeTeacherModalListeners() {
    // Drag and drop for teacher modal
    const teacherDropzone = document.getElementById('teacher-image-dropzone');
    const teacherFileInput = document.getElementById('teacher-image-input');
    const teacherPreviewContainer = document.getElementById('teacher-image-preview-container');
    const teacherPreviewImageEl = document.getElementById('teacher-image-preview');
    const teacherUploadPrompt = document.getElementById('teacher-upload-prompt');

    if (teacherDropzone) {
        const previewTeacherImage = (input) => {
            if (input.files && input.files[0]) {
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
}

document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-teachers')) {
        return;
    }

    window.renderAdminTeachers = async function() {
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

    // Initial render
    renderAdminTeachers();

    // Fitur Tambah Guru
    const btnAddTeacher = document.getElementById('btn-add-teacher');
    if (btnAddTeacher) {
        btnAddTeacher.addEventListener('click', () => {
            document.getElementById('teacher-id-hidden').value = '';
            document.getElementById('teacher-name').value = '';
            document.getElementById('teacher-position').value = '';
            document.getElementById('teacher-education').value = '';
            document.getElementById('teacher-subject').value = '';
            document.getElementById('teacher-masa-bakti').value = '';
            document.getElementById('teacher-quote').value = '';
            document.getElementById('teacher-image-input').value = '';
            document.getElementById('teacher-image-preview-container').classList.add('hidden');
            document.getElementById('teacher-upload-prompt').classList.remove('hidden');
            document.getElementById('teacher-image-preview').src = '';
            window.utils.toggleModal('modal-teacher');
        });
    }

    // Fitur Hapus & Edit (Event Delegation)
    document.addEventListener('click', async (e) => {
        const deleteTeacherBtn = e.target.closest('.btn-delete-teacher');
        if (deleteTeacherBtn) {
            itemToDelete = { type: 'teacher', id: parseInt(deleteTeacherBtn.dataset.id) };
            window.utils.toggleModal('modal-confirm');
        }

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
                document.getElementById('teacher-masa-bakti').value = item.masa_bakti || '';
                document.getElementById('teacher-quote').value = item.quote || '';
                
                document.getElementById('teacher-image-preview').src = window.utils.getStorageUrl(item.foto);
                document.getElementById('teacher-image-preview-container').classList.remove('hidden');
                document.getElementById('teacher-upload-prompt').classList.add('hidden');
                document.getElementById('teacher-image-input').value = '';
                
                window.utils.toggleModal('modal-teacher');
            }
        }
    });

});

// Dengarkan sinyal 'modalsReady' sebelum menginisialisasi listener modal
document.addEventListener('modalsReady', initializeTeacherModalListeners);
