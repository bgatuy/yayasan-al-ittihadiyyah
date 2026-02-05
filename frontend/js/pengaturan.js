document.addEventListener('DOMContentLoaded', () => {
    // Guard clause: Hanya jalankan jika elemen-elemen untuk halaman ini ada.
    if (!document.getElementById('view-settings')) {
        return;
    }

    // Helper: Format Text untuk Editor Halaman
    window.formatPageDoc = function(cmd, value = null) {
        document.execCommand(cmd, false, value);
        document.getElementById('page-content-editor').focus();
    }
});