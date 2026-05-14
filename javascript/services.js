document.addEventListener('DOMContentLoaded', function () {
    const servicesGrid = document.querySelector('.services-grid');
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

    // ── Like buttons ──
    const likeButtons = document.querySelectorAll('.like-button');
    
    // Load local likes (to know if THIS user liked it)
    const localLikes = JSON.parse(localStorage.getItem('serviceLikes') || '{}');

    likeButtons.forEach(function (button) {
        const serviceCard = button.closest('.service-card');
        const serviceTitle = serviceCard.querySelector('.service-title').textContent.trim();
        const serviceKey = getServiceKey(serviceTitle);
        const serviceImage = serviceCard.querySelector('.service-image')?.src || 
                           serviceCard.querySelector('.slideshow-image')?.src;
        const countDisplay = button.querySelector('.like-count');
        
        // 1. Initial UI state from Local Storage (only for the heart color)
        button.liked = !!localLikes[serviceKey] || !!localLikes[serviceTitle]; 
        if (button.liked) {
            button.classList.add('liked');
            button.setAttribute('aria-pressed', 'true');
        }

        // 2. Real-time Synchronization with Firebase
        if (db) {
            const serviceRef = db.ref('likes/' + serviceKey);
            serviceRef.on('value', (snapshot) => {
                const val = snapshot.val();
                let count = 0;
                
                if (typeof val === 'number') {
                    count = val;
                } else if (val && typeof val.count === 'number') {
                    count = val.count;
                } else if (val && val.count !== undefined) {
                    count = parseInt(val.count) || 0;
                }
                
                button.totalCount = count;
                countDisplay.textContent = count;
                
                // Visual feedback when count changes
                countDisplay.style.transition = 'transform 0.2s ease, color 0.2s ease';
                countDisplay.style.transform = 'scale(1.3)';
                countDisplay.style.color = '#d35252';
                setTimeout(() => {
                    countDisplay.style.transform = 'scale(1)';
                    countDisplay.style.color = '';
                }, 300);
            });
        }

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            if (!db) return;

            button.liked = !button.liked;
            const serviceRef = db.ref('likes/' + serviceKey);

            if (button.liked) {
                // Increment in Firebase
                serviceRef.transaction((currentData) => {
                    if (currentData === null) return { count: 1 };
                    if (typeof currentData === 'number') return { count: currentData + 1 };
                    if (currentData && typeof currentData === 'object') {
                        return { count: (parseInt(currentData.count) || 0) + 1 };
                    }
                    return { count: 1 };
                });
                
                // Save locally
                localLikes[serviceKey] = {
                    title: serviceTitle,
                    image: serviceImage
                };
            } else {
                // Decrement in Firebase
                serviceRef.transaction((currentData) => {
                    if (currentData === null) return null;
                    let currentCount = 0;
                    if (typeof currentData === 'number') currentCount = currentData;
                    else if (currentData && typeof currentData === 'object') currentCount = parseInt(currentData.count) || 0;
                    
                    return { count: Math.max(0, currentCount - 1) };
                });
                
                // Remove locally
                delete localLikes[serviceKey];
                delete localLikes[serviceTitle];
            }
            
            button.classList.toggle('liked', button.liked);
            button.setAttribute('aria-pressed', String(button.liked));
            localStorage.setItem('serviceLikes', JSON.stringify(localLikes));
        });
    });

    // ── Popover on card click ──
    const cards = document.querySelectorAll('.service-card');
    const cardsArray = Array.from(cards);
    let activePopover = null;
    cards.forEach(function (card) {
        const popover = card.querySelector('.popover');

        card.addEventListener('click', function () {
            if (activePopover && activePopover !== popover) {
                activePopover.classList.remove('visible');
            }

            popover.classList.toggle('visible');
            activePopover = popover.classList.contains('visible') ? popover : null;
        });

        card.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                popover.classList.remove('visible');
                card.focus();
            }
        });
    });

    document.addEventListener('click', function (event) {
        if (!activePopover) {
            return;
        }

        const card = activePopover.closest('.service-card');
        if (card && !card.contains(event.target)) {
            activePopover.classList.remove('visible');
            activePopover = null;
        }
    });

    // ── Lightbox ──
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Image preview');
    overlay.innerHTML =
        '<div class="lightbox-stage" role="document">' +
        '<div class="lightbox-media">' +
        '<button class="lightbox-close" aria-label="Close image preview"></button>' +
        '<img class="lightbox-img" src="" alt="">' +
        '</div>' +
        '<p class="lightbox-caption"></p>' +
        '<p class="lightbox-hint">Press Esc or tap image to close</p>' +
        '</div>';
    document.body.appendChild(overlay);

    const lbStage = overlay.querySelector('.lightbox-stage');
    const lbImg = overlay.querySelector('.lightbox-img');
    const lbClose = overlay.querySelector('.lightbox-close');
    const lbCaption = overlay.querySelector('.lightbox-caption');
    let closeTimer;

    function openLightbox(src, alt, description) {
        clearTimeout(closeTimer);
        lbImg.src = src;
        lbImg.alt = alt;
        lbCaption.textContent = description || alt || 'Selected service image';
        overlay.classList.add('open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        lbClose.focus();
    }

    function closeLightbox() {
        overlay.classList.remove('open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        closeTimer = window.setTimeout(function () {
            lbImg.src = '';
            lbImg.alt = '';
        }, 220);
    }

    lbClose.addEventListener('click', closeLightbox);

    lbImg.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
            closeLightbox();
        }
    });

    lbStage.addEventListener('click', function (e) {
        if (e.target === lbStage) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
    });

    // ── Wrap each service image for lightbox click ──
    const imageSelectors = ['.service-image', '.slideshow-container'];
    imageSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(function (element, idx) {
            const isSlideshow = element.classList.contains('slideshow-container');
            const img = isSlideshow ? element.querySelector('.slideshow-image.active') : element;
            
            if (!img && !isSlideshow) return;

            // Handle regular image loading
            if (!isSlideshow) {
                if (idx < 4) {
                    img.setAttribute('loading', 'eager');
                    img.setAttribute('fetchpriority', 'high');
                } else {
                    img.setAttribute('loading', 'lazy');
                    img.setAttribute('fetchpriority', 'low');
                }
                img.setAttribute('decoding', 'async');

                if (img.complete) {
                    img.classList.add('is-loaded');
                } else {
                    img.addEventListener('load', function () {
                        img.classList.add('is-loaded');
                    }, { once: true });
                }
            }

            const serviceCard = element.closest('.service-card');
            const serviceDescription = serviceCard?.querySelector('.service-description')?.textContent?.trim() || '';
            const wrap = document.createElement('div');
            wrap.className = 'service-image-wrap';
            wrap.setAttribute('role', 'button');
            wrap.setAttribute('tabindex', '0');
            wrap.setAttribute('aria-label', 'View ' + (isSlideshow ? 'gallery' : img.alt) + ' full size');

            const zoomHint = document.createElement('span');
            zoomHint.className = 'service-zoom-hint';
            zoomHint.setAttribute('aria-hidden', 'true');
            zoomHint.textContent = isTouchDevice ? 'Toca para zoom' : 'Click para zoom';

            element.parentNode.insertBefore(wrap, element);
            wrap.appendChild(element);
            wrap.appendChild(zoomHint);

            wrap.addEventListener('click', function (e) {
                e.stopPropagation();
                const currentImg = isSlideshow ? element.querySelector('.slideshow-image.active') : element;
                openLightbox(currentImg.src, currentImg.alt, serviceDescription);
            });

            wrap.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    const currentImg = isSlideshow ? element.querySelector('.slideshow-image.active') : element;
                    openLightbox(currentImg.src, currentImg.alt, serviceDescription);
                }
            });
        });
    });

    // ── Pagination (6 desktop, 4 phone) ──
    const MOBILE_QUERY = '(max-width: 640px)';

    // ── Animated Slideshow for "And More" ──
    function initSlideshow() {
        const animatedCard = document.querySelector('.service-card-animated');
        if (!animatedCard) return;

        const images = animatedCard.querySelectorAll('.slideshow-image');
        if (images.length <= 1) return;

        let currentIndex = 0;

        setInterval(() => {
            images[currentIndex].classList.remove('active');
            currentIndex = (currentIndex + 1) % images.length;
            images[currentIndex].classList.add('active');
        }, 2000); // Cambiado a 2 segundos para que se aprecien más imágenes
    }

    initSlideshow();

    const getCardsPerPage = function () {
        return window.matchMedia(MOBILE_QUERY).matches ? 4 : 6;
    };

    let cardsPerPage = getCardsPerPage();
    let totalPages = Math.ceil(cardsArray.length / cardsPerPage);
    let currentPage = 1;
    let pagination;
    let pageStatus;
    let paginationButtons = [];

    function setCardImagePriority(card, highPriority) {
        const img = card.querySelector('.service-image');
        const slideshowImages = card.querySelectorAll('.slideshow-image');

        if (img) {
            if (highPriority) {
                img.setAttribute('loading', 'eager');
                img.setAttribute('fetchpriority', 'high');
            } else {
                img.setAttribute('loading', 'lazy');
                img.setAttribute('fetchpriority', 'low');
            }
        }

        if (slideshowImages.length > 0) {
            slideshowImages.forEach((sImg, sIdx) => {
                if (highPriority && sIdx < 2) {
                    sImg.setAttribute('loading', 'eager');
                    sImg.setAttribute('fetchpriority', 'high');
                } else {
                    sImg.setAttribute('loading', 'lazy');
                    sImg.setAttribute('fetchpriority', 'low');
                }
            });
        }
    }

    function renderPage(page) {
        cardsPerPage = getCardsPerPage();
        totalPages = Math.ceil(cardsArray.length / cardsPerPage);
        currentPage = Math.min(Math.max(page, 1), totalPages);
        const start = (currentPage - 1) * cardsPerPage;
        const end = start + cardsPerPage;

        let visibleOrder = 0;
        cardsArray.forEach(function (card, index) {
            const isVisible = index >= start && index < end;

            card.classList.toggle('service-card-hidden', !isVisible);
            card.classList.remove('service-card-entering');
            card.setAttribute('aria-hidden', String(!isVisible));
            card.setAttribute('tabindex', isVisible ? '0' : '-1');

            if (!isVisible) {
                const popover = card.querySelector('.popover');
                popover?.classList.remove('visible');
                card.style.animationDelay = '0ms';
            } else {
                card.style.animationDelay = String(visibleOrder * 70) + 'ms';
                card.classList.add('service-card-entering');
                visibleOrder += 1;
            }

            setCardImagePriority(card, isVisible && index < start + 2);
        });

        if (activePopover && activePopover.classList.contains('visible')) {
            const hostCard = activePopover.closest('.service-card');
            if (hostCard && hostCard.classList.contains('service-card-hidden')) {
                activePopover.classList.remove('visible');
                activePopover = null;
            }
        }

        paginationButtons.forEach(function (button) {
            const isActive = Number(button.dataset.page) === currentPage;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        const from = start + 1;
        const to = Math.min(end, cardsArray.length);
        pageStatus.textContent = 'Showing ' + from + '-' + to + ' of ' + cardsArray.length;
    }

    function buildPagination() {
        if (!pagination) {
            return;
        }

        cardsPerPage = getCardsPerPage();
        totalPages = Math.ceil(cardsArray.length / cardsPerPage);
        pagination.innerHTML = '';
        paginationButtons = [];

        for (let page = 1; page <= totalPages; page += 1) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'services-page-btn';
            button.dataset.page = String(page);
            button.textContent = String(page);
            button.setAttribute('aria-label', 'Go to page ' + page);
            button.addEventListener('click', function () {
                renderPage(page);
                servicesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });

            paginationButtons.push(button);
            pagination.appendChild(button);
        }
    }

    if (servicesGrid && cardsArray.length > cardsPerPage) {
        pagination = document.createElement('nav');
        pagination.className = 'services-pagination';
        pagination.setAttribute('aria-label', 'Services pagination');

        pageStatus = document.createElement('p');
        pageStatus.className = 'services-page-status';

        servicesGrid.insertAdjacentElement('afterend', pagination);
        pagination.insertAdjacentElement('afterend', pageStatus);

        buildPagination();
        renderPage(1);

        let wasMobile = window.matchMedia(MOBILE_QUERY).matches;
        window.addEventListener('resize', function () {
            const isMobile = window.matchMedia(MOBILE_QUERY).matches;
            if (isMobile !== wasMobile) {
                wasMobile = isMobile;
                buildPagination();
                renderPage(1);
            }
        });
    } else {
        cardsArray.forEach(function (card, index) {
            setCardImagePriority(card, index < 2);
        });
    }
});
