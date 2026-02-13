window.utils = {
  // Toggle Modal (Show/Hide)
  toggleModal: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.toggle('hidden');
      modal.classList.toggle('flex');
    }
  },

  // Format Date to ID locale
  formatDate: (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  // Format Currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  },

  // Get full URL for a storage path
  getStorageUrl: (path) => {
    if (!path) return ''; // Return empty if path is null, undefined, or empty string
    
    // If path is already a full URL or a data URI, return it as is
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    const baseUrl = window.APP_CONFIG?.STORAGE_BASE_URL || 'http://localhost:8000/storage';
    // Remove leading slash from path if it exists to prevent double slashes
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/${cleanPath}`;
  },

  // Helper for text editors
  formatDoc: (cmd, value = null, editorId = 'news-content-editor') => {
    document.execCommand(cmd, false, value);
    const editor = document.getElementById(editorId);
    if(editor) editor.focus();
  },

  // Convert Data URL to Blob for file upload
  dataURLtoBlob: (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  },

  // Force file download (avoids opening image in new tab)
  downloadFile: async (url, filename = 'download') => {
    const headers = {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/octet-stream',
    };
    const token = (window.Auth && typeof window.Auth.getAuthToken === 'function')
      ? window.Auth.getAuthToken()
      : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      credentials: 'include',
      headers,
    });
    if (!response.ok) {
      throw new Error('Gagal mengunduh file.');
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  },

  // Adaptive image compression (target size)
  // Returns { blob, dataUrl, size } where size is bytes
  compressImageAdaptive: async (file, options = {}) => {
    const {
      maxSizeKB = 200,
      maxWidth = 1600,
      minQuality = 0.4,
      maxQuality = 0.85,
      qualityStep = 0.08,
      minScale = 0.5,
    } = options;

    const maxBytes = maxSizeKB * 1024;

    const readAsDataURL = (f) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(f);
    });

    const dataUrlSize = (dataUrl) => {
      const base64 = dataUrl.split(',')[1] || '';
      return Math.floor((base64.length * 3) / 4);
    };

    const srcDataUrl = await readAsDataURL(file);
    const img = new Image();

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = srcDataUrl;
    });

    let width = img.width;
    let height = img.height;
    if (width > maxWidth) {
      const ratio = maxWidth / width;
      width = maxWidth;
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let scale = 1;
    let bestDataUrl = null;
    let bestSize = Infinity;

    while (scale >= minScale) {
      const targetW = Math.max(1, Math.floor(width * scale));
      const targetH = Math.max(1, Math.floor(height * scale));
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      let quality = maxQuality;
      while (quality >= minQuality) {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const size = dataUrlSize(dataUrl);
        if (size < bestSize) {
          bestSize = size;
          bestDataUrl = dataUrl;
        }
        if (size <= maxBytes) {
          return {
            dataUrl,
            size,
            blob: window.utils.dataURLtoBlob(dataUrl),
          };
        }
        quality -= qualityStep;
      }

      scale -= 0.1;
    }

    // Fallback: return best effort even if still larger than target
    return {
      dataUrl: bestDataUrl || srcDataUrl,
      size: bestDataUrl ? bestSize : dataUrlSize(srcDataUrl),
      blob: window.utils.dataURLtoBlob(bestDataUrl || srcDataUrl),
    };
  },
};

// Expose toggleModal globally for HTML onclick attributes
window.toggleModal = window.utils.toggleModal;
