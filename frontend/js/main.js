document.addEventListener('DOMContentLoaded', () => {
  // --- URL CLEANER ---
  // Hapus index.html dari address bar agar terlihat lebih bersih
  if (window.location.pathname.endsWith('index.html')) {
      const newPath = window.location.pathname.replace(/index\.html$/, '');
      window.history.replaceState(null, '', newPath + window.location.search + window.location.hash);
  }
});

const navbar = document.getElementById('navbar');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

window.addEventListener('scroll', () => {
  if (!navbar) return;
  if (window.scrollY > 10) {
    navbar.classList.add('bg-secondary', 'shadow-md', 'py-2');
    navbar.classList.remove('py-4');
  } else {
    navbar.classList.remove('bg-secondary', 'shadow-md', 'py-2');
    navbar.classList.add('py-4');
  }
});

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = mobileMenu.classList.contains('hidden');
    
    if (isHidden) {
      mobileMenu.classList.remove('hidden');
      mobileMenu.classList.add('flex');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    } else {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });
  
  // Close menu when clicking a link
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target) && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
      mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
  });

  // Initialize Slider Logic (Moved to function below)
  initPrestasiSlider();

  // Mobile Akademik Submenu Toggle
  const mobileAkademikBtn = document.getElementById('mobile-akademik-btn');
  const mobileAkademikMenu = document.getElementById('mobile-akademik-menu');
  const mobileAkademikIcon = document.getElementById('mobile-akademik-icon');

  if (mobileAkademikBtn && mobileAkademikMenu && mobileAkademikIcon) {
    mobileAkademikBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileAkademikMenu.classList.toggle('hidden');
      mobileAkademikMenu.classList.toggle('flex');
      mobileAkademikIcon.classList.toggle('rotate-180');
    });
  }
}

// --- PRESTASI SLIDER FUNCTION ---
function initPrestasiSlider() {
  const prestasiSlider = document.getElementById('prestasi-slider');
  const prevPrestasiBtn = document.getElementById('prev-prestasi');
  const nextPrestasiBtn = document.getElementById('next-prestasi');

  if (prestasiSlider && prevPrestasiBtn && nextPrestasiBtn) {
    // Remove old listeners to prevent duplicates (cloning element is a simple trick)
    const newNextBtn = nextPrestasiBtn.cloneNode(true);
    const newPrevBtn = prevPrestasiBtn.cloneNode(true);
    nextPrestasiBtn.parentNode.replaceChild(newNextBtn, nextPrestasiBtn);
    prevPrestasiBtn.parentNode.replaceChild(newPrevBtn, prevPrestasiBtn);

    newNextBtn.addEventListener('click', () => {
      prestasiSlider.scrollBy({ left: prestasiSlider.offsetWidth / 2, behavior: 'smooth' });
    });

    newPrevBtn.addEventListener('click', () => {
      prestasiSlider.scrollBy({ left: -prestasiSlider.offsetWidth / 2, behavior: 'smooth' });
    });
  }

  // Prestasi Indicators Logic
  const prestasiIndicatorsContainer = document.getElementById('prestasi-indicators');

  if (prestasiSlider && prestasiIndicatorsContainer) {
    const slides = prestasiSlider.children;
    const dots = [];
    
    // Clear existing dots
    prestasiIndicatorsContainer.innerHTML = '';

    // 1. Generate Bullets
    for (let i = 0; i < slides.length; i++) {
      const dot = document.createElement('button');
      // Style default: abu-abu, style aktif: hijau & lebar
      dot.className = `h-2.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-primary w-8' : 'bg-slate-300 w-2.5 hover:bg-primary/50'}`;
      dot.ariaLabel = `Lihat prestasi ke-${i + 1}`;
      
      // Klik bullet untuk scroll ke slide tersebut
      dot.addEventListener('click', () => {
        slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });

      prestasiIndicatorsContainer.appendChild(dot);
      dots.push(dot);
    }

    // 2. Update Active Bullet on Scroll
    prestasiSlider.addEventListener('scroll', () => {
      const scrollCenter = prestasiSlider.scrollLeft + (prestasiSlider.offsetWidth / 2);
      
      // Cari slide yang paling dekat dengan tengah container
      let activeIndex = 0;
      let minDistance = Infinity;

      Array.from(slides).forEach((slide, index) => {
        const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
        const distance = Math.abs(scrollCenter - slideCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          activeIndex = index;
        }
      });

      // Update kelas CSS bullet
      dots.forEach((dot, index) => {
        if (index === activeIndex) {
          dot.classList.remove('bg-slate-300', 'w-2.5');
          dot.classList.add('bg-primary', 'w-8');
        } else {
          dot.classList.remove('bg-primary', 'w-8');
          dot.classList.add('bg-slate-300', 'w-2.5');
        }
      });
    });
  }
}

// --- GLOBAL INFO PENDAFTARAN (Floating Widget) ---
// Ditampilkan di semua halaman (kecuali PPDB) jika status pendaftaran "Dibuka"
document.addEventListener('DOMContentLoaded', async () => {
  const settings = window.DataStore ? await window.DataStore.getPpdbPageSettings() : {};
  const ppdbStatus = settings.status_ppdb || 'ditutup';
  const ppdbName = settings.nama_gelombang || 'Gelombang 1';
  
  // Cek apakah kita sedang di halaman PPDB (agar tidak muncul double dengan banner statis)
  const isPPDBPage = window.location.pathname.includes('ppdb');

  if (ppdbStatus === 'dibuka' && !isPPDBPage) {
    const widget = document.createElement('div');
    widget.className = 'fixed bottom-6 right-6 z-50 animate-[fade-in_0.5s]';
    
    widget.innerHTML = `
      <div class="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4 max-w-xs relative group transition-transform hover:-translate-y-1">
        <!-- Ping Animation -->
        <span class="absolute -top-1 -right-1 flex h-3 w-3">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>

        <div class="bg-primary/10 text-primary w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
          <i class="fa-solid fa-bullhorn text-xl"></i>
        </div>
        <div>
          <h4 class="font-bold text-slate-800 text-sm">Pendaftaran Dibuka!</h4>
          <p class="text-xs text-slate-500 mb-1">${ppdbName} telah dimulai.</p>
          <a href="/ppdbonline/" class="text-xs font-bold text-primary hover:text-secondary flex items-center gap-1">
            Daftar Sekarang <i class="fa-solid fa-arrow-right"></i>
          </a>
        </div>
        <button id="close-widget" class="absolute top-2 right-2 text-slate-300 hover:text-slate-500 p-1">
          <i class="fa-solid fa-xmark text-xs"></i>
        </button>
      </div>
    `;
    
    document.body.appendChild(widget);

    document.getElementById('close-widget').addEventListener('click', () => {
      widget.remove();
    });
  }
});

// --- GLOBAL SETTINGS (Kontak WA & Tahun Ajaran) ---
document.addEventListener('DOMContentLoaded', async () => {
  const settings = window.DataStore ? await window.DataStore.getPpdbPageSettings() : {};
  const waNumber = settings.ppdb_contact_wa || '0812-3456-7890';
  const academicYear = settings.tahun_ajaran || '2025/2026';

  // Update WhatsApp Link & Text
  let cleanWaNumber = waNumber.replace(/\D/g, ''); // Hapus tanda hubung
  if (cleanWaNumber.startsWith('0')) {
    cleanWaNumber = '62' + cleanWaNumber.slice(1); // Ubah 08xx jadi 628xx
  }
  document.querySelectorAll('.dynamic-wa-link').forEach(el => el.href = `https://wa.me/${cleanWaNumber}`);
  document.querySelectorAll('.dynamic-wa-text').forEach(el => el.textContent = waNumber);

  // Update Tahun Ajaran
  document.querySelectorAll('.dynamic-academic-year').forEach(el => el.textContent = academicYear);
});

// --- FITUR PENCARIAN BERITA (Halaman Berita) ---
// Logika pencarian berita diintegrasikan ke dalam sistem pagination server-side di bawah.

// --- SISTEM KONTEN DINAMIS ---

document.addEventListener('DOMContentLoaded', async () => {
  // --- DYNAMIC GALLERY RENDER ---
  const galleryData = window.DataStore ? await window.DataStore.getGallery() : [];
  
  const gallerySlider = document.getElementById('gallery-slider');
  if (gallerySlider) {
      // Render items
      gallerySlider.innerHTML = galleryData.map(item => `
        <div class="flex-shrink-0 w-full md:w-[45%] lg:w-[30%] snap-center aspect-[4/3] rounded-2xl overflow-hidden shadow-md relative group/item">
          <img src="${window.utils.getStorageUrl(item.gambar || item.image)}" alt="Foto Galeri ${item.id}" class="w-full h-full object-cover group-hover/item:scale-110 transition duration-700">
        </div>
      `).join('');

      // Initialize slider controls and indicators
      const prevBtn = document.getElementById('prev-slide');
      const nextBtn = document.getElementById('next-slide');
      const indicatorsContainer = document.getElementById('gallery-indicators');

      if (prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {
          gallerySlider.scrollBy({ left: gallerySlider.offsetWidth / 2, behavior: 'smooth' });
        });
        prevBtn.addEventListener('click', () => {
          gallerySlider.scrollBy({ left: -gallerySlider.offsetWidth / 2, behavior: 'smooth' });
        });
      }

      if (indicatorsContainer) {
        const slides = gallerySlider.children;
        const dots = [];
        indicatorsContainer.innerHTML = ''; // Clear existing

        for (let i = 0; i < slides.length; i++) {
          const dot = document.createElement('button');
          dot.className = `h-2.5 rounded-full transition-all duration-300 ${i === 0 ? 'bg-primary w-8' : 'bg-slate-300 w-2.5 hover:bg-primary/50'}`;
          dot.addEventListener('click', () => {
            slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          });
          indicatorsContainer.appendChild(dot);
          dots.push(dot);
        }

        gallerySlider.addEventListener('scroll', () => {
          const scrollCenter = gallerySlider.scrollLeft + (gallerySlider.offsetWidth / 2);
          let activeIndex = 0;
          let minDistance = Infinity;

          Array.from(slides).forEach((slide, index) => {
            const slideCenter = slide.offsetLeft + (slide.offsetWidth / 2);
            const distance = Math.abs(scrollCenter - slideCenter);
            if (distance < minDistance) {
              minDistance = distance;
              activeIndex = index;
            }
          });

          dots.forEach((dot, index) => {
            if (index === activeIndex) {
              dot.classList.remove('bg-slate-300', 'w-2.5');
              dot.classList.add('bg-primary', 'w-8');
            } else {
              dot.classList.remove('bg-primary', 'w-8');
              dot.classList.add('bg-slate-300', 'w-2.5');
            }
          });
        });
      }
  }

  // --- SISTEM BERITA DINAMIS (REFACTORED FOR SERVER-SIDE PAGINATION) ---

  // 1. Render Berita di Homepage (Limit 3)
  const homeNewsContainer = document.getElementById('home-news-container');
  if (homeNewsContainer) {
    try {
      // Ambil halaman pertama untuk homepage, lalu slice
      const newsResponse = await (window.DataStore ? window.DataStore.getNews(1) : { data: [] });
      renderNewsCards(homeNewsContainer, newsResponse.data.slice(0, 3));
    } catch (error) {
      console.error("Gagal memuat berita homepage:", error);
      homeNewsContainer.innerHTML = '<p class="col-span-full text-center py-10 text-red-500">Gagal memuat berita.</p>';
    }
  }

  // 2. Render Halaman Berita (dengan Server-Side Pagination & Search)
  const newsPageContainer = document.getElementById('news-container');
  const newsPaginationContainer = document.getElementById('news-pagination');
  const searchNewsInput = document.getElementById('search-news');

  if (newsPageContainer && newsPaginationContainer && searchNewsInput) {
    let searchTimeout;

    const renderPaginationButtons = (meta, loadNewsPageFunction, searchTerm) => {
      newsPaginationContainer.innerHTML = '';
      if (!meta || meta.last_page <= 1) return; // Jangan render jika hanya 1 halaman

      const totalPages = meta.last_page;
      const currentPage = meta.current_page;

      // Previous Button
      const prevBtn = document.createElement('button');
      prevBtn.className = `w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
      prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      prevBtn.disabled = currentPage === 1;
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage > 1) {
          loadNewsPageFunction(currentPage - 1, searchTerm);
        }
      });
      newsPaginationContainer.appendChild(prevBtn);

      // Page Number Buttons
      for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center transition ${i === currentPage ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 hover:bg-slate-50 hover:text-primary'}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', (e) => {
          e.preventDefault();
          loadNewsPageFunction(i, searchTerm);
        });
        newsPaginationContainer.appendChild(pageBtn);
      }

      // Next Button
      const nextBtn = document.createElement('button');
      nextBtn.className = `w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-primary transition ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
      nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      nextBtn.disabled = currentPage === totalPages;
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPage < totalPages) {
          loadNewsPageFunction(currentPage + 1, searchTerm);
        }
      });
      newsPaginationContainer.appendChild(nextBtn);
    };

    const loadNewsPage = async (page, searchTerm = '') => {
      try {
        newsPageContainer.innerHTML = `<div class="col-span-full text-center py-10 text-slate-500">Memuat berita...</div>`;
        newsPaginationContainer.innerHTML = '';

        const response = await window.DataStore.getNews(page, searchTerm);
        
        if (response && response.data && response.data.length > 0) {
          renderNewsCards(newsPageContainer, response.data);
          renderPaginationButtons(response.meta, loadNewsPage, searchTerm);
        } else {
          newsPageContainer.innerHTML = '<p class="col-span-full text-center py-10 text-slate-500">Tidak ada berita yang cocok dengan pencarian Anda.</p>';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error('Gagal memuat berita:', error);
        newsPageContainer.innerHTML = '<p class="col-span-full text-center py-10 text-red-500">Gagal memuat berita. Coba lagi nanti.</p>';
      }
    };

    // Event listener untuk search input dengan debounce
    searchNewsInput.addEventListener('keyup', (e) => {
      clearTimeout(searchTimeout);
      const term = e.target.value;
      searchTimeout = setTimeout(() => {
        loadNewsPage(1, term);
      }, 300); // Tunggu 300ms setelah user berhenti mengetik
    });

    // Initial load untuk halaman berita
    const urlParams = new URLSearchParams(window.location.search);
    const initialPage = parseInt(urlParams.get('page')) || 1;
    const initialSearch = urlParams.get('search') || '';
    searchNewsInput.value = initialSearch;
    loadNewsPage(initialPage, initialSearch);
  }

  // 3. Render Detail Berita (Template)
  const detailTitle = document.getElementById('news-detail-title');
  if (detailTitle) {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));

    if (id) {
      try {
        const news = await (window.DataStore ? window.DataStore.getNewsById(id) : null);
        if (news) {
          const title = news.title || news.judul;
          const date = news.date || news.tanggal || (news.created_at ? new Date(news.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
          const image = news.image || news.gambar || news.img;
          const content = news.content || news.konten || news.desc || news.deskripsi || '';

          document.title = `${title} - Al-Ittihadiyyah`;
          document.getElementById('news-detail-title').textContent = title;
          document.getElementById('news-detail-date').innerHTML = `<i class="fa-regular fa-calendar mr-2"></i> ${date}`;
          document.getElementById('news-detail-image').src = window.utils.getStorageUrl(image);
          document.getElementById('news-detail-content').innerHTML = content;
        } else {
          throw new Error('Berita tidak ditemukan di server.');
        }
      } catch (error) {
        console.error('Gagal memuat detail berita:', error);
        const contentEl = document.getElementById('news-detail-content');
        if (contentEl) {
          contentEl.innerHTML = '<p class="text-center text-red-500 py-10">Berita tidak ditemukan atau gagal dimuat.</p>';
          document.getElementById('news-detail-title').textContent = 'Berita Tidak Ditemukan';
        }
      }
    }
  }

  // 4. Render Halaman Akademik Dinamis (TK/MI)
  let pageKey = null;
    if (window.location.pathname.includes('tamankanak-kanak')) {
      pageKey = 'tk';
    } else if (window.location.pathname.includes('madrasahibtidaiyah')) {
      pageKey = 'mi';
    }

    if (pageKey) {
      const savedData = window.DataStore ? (pageKey === 'tk' ? await window.DataStore.getAcademicTK() : await window.DataStore.getAcademicMI()) : {};
      
      if (savedData) {
        // Map backend snake_case to frontend variables
        const heroImage = savedData.gambar_utama || "";
        const schedule = savedData.jadwal_harian || "";
        const ekskul = savedData.ekstrakurikuler || "";
        const achievements = savedData.prestasi || [];
        const biayaMasuk = savedData.biaya_masuk || "";
        const biayaBulanan = savedData.biaya_bulanan || "";

        // 1. Hero Section
        const heroImgEl = document.getElementById('page-hero-image');
        if (heroImgEl && heroImage) heroImgEl.src = window.utils.getStorageUrl(heroImage);

        // 2. Jadwal
        const scheduleListEl = document.getElementById('page-schedule-list');
        if (scheduleListEl && schedule) {
            const lines = schedule.split('\n');
            scheduleListEl.innerHTML = lines.map(line => {
                const [time, activity] = line.split('|').map(s => s.trim());
                if (!time) return '';
                return `<div class="flex flex-col sm:flex-row p-4 hover:bg-slate-50 transition gap-1 sm:gap-0"><div class="w-full sm:w-32 font-bold text-primary flex-shrink-0">${time}</div><div class="text-slate-600">${activity || ''}</div></div>`;
            }).join('');
        }

        // 3. Ekskul
        const ekskulListEl = document.getElementById('page-ekskul-list');
        if (ekskulListEl && ekskul) {
            const lines = ekskul.split('\n');
            // Helper icons mapping
            const icons = { 
              'pramuka': 'fa-campground', 
              'futsal': 'fa-futbol', 
              'bola': 'fa-futbol',
              'tari': 'fa-music', 
              'drumband': 'fa-drum',
              'musik': 'fa-music',
              'renang': 'fa-person-swimming', 
              'robotik': 'fa-robot', 
              'marawis': 'fa-drum', 
              'hadroh': 'fa-drum',
              'menggambar': 'fa-palette', 
              'lukis': 'fa-palette',
              'mewarnai': 'fa-palette',
              'kaligrafi': 'fa-pen-nib',
              'tahfidz': 'fa-quran',
              'tilawah': 'fa-quran',
              'iqro': 'fa-book-open',
              'ngaji': 'fa-hands-praying',
              'komputer': 'fa-computer',
              'silat': 'fa-user-ninja',
              'karate': 'fa-user-ninja',
              'bahasa': 'fa-language'
            };
            
            ekskulListEl.innerHTML = lines.map(line => {
                const name = line.trim();
                if (!name) return '';
                // Simple icon matching logic
                let iconClass = 'fa-star';
                for (const key in icons) { if (name.toLowerCase().includes(key)) iconClass = icons[key]; }
                
                return `<div class="text-center group p-6 rounded-2xl border border-slate-50 hover:border-primary/20 hover:shadow-md transition"><div class="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center text-3xl mb-4 group-hover:bg-primary group-hover:text-white transition"><i class="fa-solid ${iconClass}"></i></div><h4 class="font-bold text-slate-700">${name}</h4></div>`;
            }).join('');
        }

        // 4. Prestasi Siswa
        const prestasiSliderEl = document.getElementById('prestasi-slider');
        if (prestasiSliderEl && achievements.length > 0) {
            const items = achievements;
            prestasiSliderEl.innerHTML = items.map(item => {
                return `<div class="flex-shrink-0 w-full md:w-[45%] lg:w-[30%] snap-center bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group/item">
                          <div class="aspect-[4/3] overflow-hidden"><img src="${window.utils.getStorageUrl(item.image)}" alt="${item.judul}" class="w-full h-full object-cover group-hover/item:scale-105 transition duration-500"></div>
                          <div class="p-6 text-center"><h4 class="font-bold text-lg text-slate-800 mb-1">${item.nama}</h4><p class="text-primary font-medium text-sm mb-3">${item.judul}</p><p class="text-slate-500 text-xs">${item.tingkat || ''}</p></div>
                        </div>`;
            }).join('');
            
            // Re-initialize slider logic for new elements
            initPrestasiSlider();
        }

        // 5. Biaya
        const renderFees = (elementId, dataString) => {
            const el = document.getElementById(elementId);
            if (el && dataString) {
                const lines = dataString.split('\n');
                el.innerHTML = lines.map(line => {
                    const [item, price] = line.split('|').map(s => s.trim());
                    if (!item) return '';
                    return `<li class="flex justify-between gap-4 border-b border-slate-200 pb-2"><span>${item}</span><span class="font-bold text-slate-800">${price || ''}</span></li>`;
                }).join('');
            }
        };
        renderFees('page-biaya-masuk', biayaMasuk);
        renderFees('page-biaya-bulanan', biayaBulanan);
      }
  }
});

function renderNewsCards(container, data) {
  container.innerHTML = data.map(item => {
    // Menambahkan fallback untuk memastikan kompatibilitas data
    const title = item.title || item.judul;
    const image = item.image || item.gambar || item.img;
    const date = item.date || item.tanggal || (item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
    const description = item.desc || item.deskripsi || (item.content ? (item.content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...') : '');
    const link = `/detailberita/?id=${item.id}`;

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition group">
        <div class="relative h-48 overflow-hidden">
          <img src="${window.utils.getStorageUrl(image)}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-slate-100">
        </div>
        <div class="p-6">
          <div class="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <i class="fa-regular fa-calendar"></i> ${date}
          </div>
          <h3 class="font-bold text-lg text-slate-800 mb-3 line-clamp-2 group-hover:text-primary transition">${title}</h3>
          <p class="text-slate-600 text-sm mb-4 line-clamp-2">${description}</p>
          <a href="${link}" class="text-primary font-semibold text-sm hover:underline flex items-center gap-1">Baca Selengkapnya <i class="fa-solid fa-arrow-right text-xs"></i></a>
        </div>
      </div>
    `;
  }).join('');
}

// --- DATA SEJARAH (Timeline) ---
const historyData = [
  {
    title: "1990 - Awal Berdiri",
    desc: "Yayasan didirikan oleh Alm. H. Ahmad Dahlan bersama tokoh masyarakat setempat. Awalnya hanya berupa Taman Pendidikan Al-Qur'an (TPA) yang beroperasi di serambi masjid dengan 15 orang santri."
  },
  {
    title: "1995 - Pendirian TK Islam",
    desc: "Melihat kebutuhan akan pendidikan pra-sekolah yang berbasis Islam, yayasan resmi membuka TK Islam Al-Ittihadiyyah. Angkatan pertama terdiri dari 30 siswa dengan 3 orang tenaga pengajar."
  },
  {
    title: "2005 - Peresmian Madrasah Ibtidaiyah",
    desc: "Atas desakan wali murid yang menginginkan kelanjutan pendidikan yang selaras, Madrasah Ibtidaiyah (MI) didirikan. Gedung baru 2 lantai dibangun berkat wakaf dan gotong royong masyarakat."
  },
  {
    title: "2015 - Akreditasi & Modernisasi",
    desc: "MI Al-Ittihadiyyah berhasil meraih Akreditasi \"B\". Yayasan mulai melakukan modernisasi fasilitas dengan membangun laboratorium komputer dan perpustakaan digital untuk menunjang pembelajaran abad 21."
  },
  {
    title: "Masa Kini",
    desc: "Kini, Al-Ittihadiyyah telah meluluskan ribuan alumni yang tersebar di berbagai jenjang pendidikan lanjutan favorit. Kami terus berkomitmen meningkatkan kualitas SDM dan sarana prasarana demi mewujudkan generasi Rabbani yang unggul."
  }
];

document.addEventListener('DOMContentLoaded', async () => {
  const historyContainer = document.getElementById('history-container');
  if (historyContainer) {
    historyContainer.innerHTML = historyData.map((item, index) => `
      <div class="relative">
        <div class="absolute -left-[38px] md:-left-[54px] top-1 w-5 h-5 bg-primary rounded-full border-4 border-white shadow-sm"></div>
        <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-2">${item.title}</h3>
        <p class="text-slate-600 leading-relaxed">${item.desc}</p>
      </div>
    `).join('');
  }

  // --- RENDER GURU & STAFF (Halaman Guru) ---
  const teacherContainer = document.getElementById('teacher-list-container');

  if (teacherContainer) {
    const teachersData = window.DataStore ? await window.DataStore.getTeachers() : [];

    if (teachersData && teachersData.length > 0) {
      teacherContainer.innerHTML = teachersData.map(item => `
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex flex-col sm:flex-row gap-6 items-start">
                <img src="${window.utils.getStorageUrl(item.foto)}" alt="${item.nama}" class="w-24 h-32 object-cover rounded-xl shadow-sm flex-shrink-0 mx-auto sm:mx-0 bg-slate-100">
                <div class="flex-1 w-full text-center sm:text-left">
                  <h4 class="text-lg font-bold text-slate-800 mb-1">${item.nama}</h4>
                  <p class="text-primary text-sm font-medium mb-4">${item.jabatan}</p>
                  <div class="bg-slate-50 rounded-xl p-3 text-sm space-y-2 text-left">
                    <div class="flex justify-between">
                      <span class="text-slate-500">Pendidikan</span>
                      <span class="font-medium">${item.pendidikan}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-500">Mata Pelajaran</span>
                      <span class="font-medium">${item.mata_pelajaran}</span>
                    </div>
                  </div>
                  <p class="text-xs text-slate-500 mt-3 italic">"${item.quote || ''}"</p>
                </div>
            </div>
        `).join('');
    } else {
      teacherContainer.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500">Belum ada data guru.</div>';
    }
  }
});