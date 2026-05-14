document.addEventListener('DOMContentLoaded', function () {
    const servicesGrid = document.getElementById('servicesGrid');
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // --- Firebase Configuration ---
    const _0x4a2e = ["AIzaSy", "D6h6fErJd", "-nVhvxsTy", "BdJmkqLMzzR4rOk"];
    const firebaseConfig = {
        apiKey: _0x4a2e.join(""),
        authDomain: "abpereira-web.firebaseapp.com",
        databaseURL: "https://abpereira-web-default-rtdb.firebaseio.com",
        projectId: "abpereira-web",
        storageBucket: "abpereira-web.firebasestorage.app",
        messagingSenderId: "270636168434",
        appId: "1:270636168434:web:046c7d9bc4d55aaececc6b",
        measurementId: "G-267XCN719L"
    };

    // Initialize Firebase
    let db = null;
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.database();
    }

    // Helper to create a safe Firebase key
    function getServiceKey(title) {
        return title.toLowerCase().trim().replace(/\s+/g, '_').replace(/[.#$[\/]]/g, '');
    }

    let allServices = [];
    let cardsArray = [];

    // --- LOAD SERVICES FROM FIREBASE ---
    async function loadServices() {
        if (!db) return;
        try {
            const snapshot = await db.ref('services_catalog').once('value');
            const data = snapshot.val();
            if (data) {
                allServices = Object.keys(data).map(key => ({ ...data[key], id: key }));
                renderServicesGrid();
            } else {
                servicesGrid.innerHTML = '<div class="empty-state"><p>No hay servicios disponibles en este momento.</p></div>';
            }
        } catch (error) {
            console.error("Error loading services:", error);
            servicesGrid.innerHTML = '<div class="empty-state"><p>Error al cargar los servicios. Por favor, intenta más tarde.</p></div>';
        }
    }

    function renderServicesGrid() {
        servicesGrid.innerHTML = '';
        allServices.forEach((s, index) => {
            const article = document.createElement('article');
            article.className = 'service-card';
            article.tabIndex = 0;
            article.dataset.service = index;
            article.setAttribute('aria-haspopup', 'dialog');
            
            article.innerHTML = `
                <div class="service-image-container">
                    <img class="service-image" src="${s.image}" alt="${s.title}" loading="lazy" decoding="async">
                </div>
                <div class="service-content">
                    <div>
                        <span class="service-tag">${s.tag}</span>
                        <h2 class="service-title">${s.title}</h2>
                        <p class="service-pricing-note" style="font-size: 0.85em; color: #a0a0a0; margin-top: -0.3rem; margin-bottom: 0.5rem; font-style: italic;">${s.pricing_note}</p>
                        <p class="service-description">${s.description}</p>
                    </div>
                    <div class="service-actions">
                        <button class="like-button" aria-pressed="false" aria-label="Like ${s.title}">
                            <svg class="like-icon" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                            </svg>
                            <span class="like-count">0</span>
                        </button>
                        <a href="Appointment.html" class="book-button" aria-label="Book appointment for ${s.title}">Schedule</a>
                    </div>
                </div>
                <div class="popover" role="dialog" aria-modal="false">
                    <h3>${s.title}</h3>
                    <p>${s.full_description || s.description}</p>
                </div>
            `;
            servicesGrid.appendChild(article);
        });

        cardsArray = Array.from(document.querySelectorAll('.service-card'));
        initInteractions();
        if (cardsArray.length > getCardsPerPage()) {
            buildPagination();
            renderPage(1);
        }
    }

    function initInteractions() {
        // --- LIKE BUTTONS ---
        const localLikes = JSON.parse(localStorage.getItem('serviceLikes') || '{}');
        document.querySelectorAll('.like-button').forEach(button => {
            const card = button.closest('.service-card');
            const title = card.querySelector('.service-title').textContent.trim();
            const key = getServiceKey(title);
            const countDisplay = button.querySelector('.like-count');

            // Sync with Firebase real-time
            if (db) {
                db.ref('likes/' + key).on('value', (snapshot) => {
                    const val = snapshot.val();
                    const count = (typeof val === 'number') ? val : (val?.count || 0);
                    countDisplay.textContent = count;
                });
            }

            button.liked = !!localLikes[key];
            if (button.liked) button.classList.add('liked');

            button.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!db) return;
                button.liked = !button.liked;
                const ref = db.ref('likes/' + key);
                
                ref.transaction(current => {
                    const currentCount = (typeof current === 'number') ? current : (current?.count || 0);
                    return { count: Math.max(0, button.liked ? currentCount + 1 : currentCount - 1) };
                });

                if (button.liked) localLikes[key] = true;
                else delete localLikes[key];
                
                button.classList.toggle('liked', button.liked);
                localStorage.setItem('serviceLikes', JSON.stringify(localLikes));
            });
        });

        // --- POPOVERS ---
        let activePopover = null;
        document.querySelectorAll('.service-card').forEach(card => {
            const popover = card.querySelector('.popover');
            card.addEventListener('click', () => {
                if (activePopover && activePopover !== popover) activePopover.classList.remove('visible');
                popover.classList.toggle('visible');
                activePopover = popover.classList.contains('visible') ? popover : null;
            });
        });

        // --- LIGHTBOX ---
        document.querySelectorAll('.service-image').forEach(img => {
            const card = img.closest('.service-card');
            const desc = card.querySelector('.service-description').textContent;
            
            const wrap = document.createElement('div');
            wrap.className = 'service-image-wrap';
            img.parentNode.insertBefore(wrap, img);
            wrap.appendChild(img);

            const hint = document.createElement('span');
            hint.className = 'service-zoom-hint';
            hint.textContent = isTouchDevice ? 'Toca para zoom' : 'Click para zoom';
            wrap.appendChild(hint);

            wrap.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(img.src, img.alt, desc);
            });
        });
    }

    // --- LIGHTBOX UI ---
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <div class="lightbox-stage">
            <div class="lightbox-media">
                <button class="lightbox-close"></button>
                <img class="lightbox-img" src="">
            </div>
            <p class="lightbox-caption"></p>
        </div>
    `;
    document.body.appendChild(overlay);

    const lbImg = overlay.querySelector('.lightbox-img');
    const lbCaption = overlay.querySelector('.lightbox-caption');

    function openLightbox(src, alt, desc) {
        lbImg.src = src;
        lbCaption.textContent = desc;
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    overlay.querySelector('.lightbox-close').addEventListener('click', () => {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    });

    // --- PAGINATION ---
    const MOBILE_QUERY = '(max-width: 640px)';
    const getCardsPerPage = () => window.matchMedia(MOBILE_QUERY).matches ? 4 : 6;
    let currentPage = 1;

    function renderPage(page) {
        const perPage = getCardsPerPage();
        const start = (page - 1) * perPage;
        const end = start + perPage;
        
        cardsArray.forEach((card, i) => {
            const isVisible = i >= start && i < end;
            card.style.display = isVisible ? 'flex' : 'none';
        });
        
        updatePaginationUI(page);
    }

    function buildPagination() {
        const nav = document.createElement('nav');
        nav.className = 'services-pagination';
        nav.id = 'paginationNav';
        servicesGrid.insertAdjacentElement('afterend', nav);
    }

    function updatePaginationUI(page) {
        const nav = document.getElementById('paginationNav');
        if (!nav) return;
        const totalPages = Math.ceil(cardsArray.length / getCardsPerPage());
        nav.innerHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.className = `services-page-btn ${i === page ? 'is-active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => {
                currentPage = i;
                renderPage(i);
                servicesGrid.scrollIntoView({ behavior: 'smooth' });
            };
            nav.appendChild(btn);
        }
    }

    loadServices();
});
