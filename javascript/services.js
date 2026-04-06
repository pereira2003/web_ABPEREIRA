document.addEventListener('DOMContentLoaded', function () {
    const servicesGrid = document.querySelector('.services-grid');
    const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;

    // ── Like buttons ──
    const likeButtons = document.querySelectorAll('.like-button');
    likeButtons.forEach(function (button) {
        button.liked = false;
        button.count = 0;

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            button.liked = !button.liked;
            button.count = button.liked ? button.count + 1 : Math.max(button.count - 1, 0);
            button.classList.toggle('liked', button.liked);
            button.setAttribute('aria-pressed', String(button.liked));
            button.querySelector('.like-count').textContent = button.count;
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
    document.querySelectorAll('.service-image').forEach(function (img) {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('fetchpriority', 'low');
        img.setAttribute('decoding', 'async');

        if (img.complete) {
            img.classList.add('is-loaded');
        } else {
            img.addEventListener('load', function () {
                img.classList.add('is-loaded');
            }, { once: true });
        }

        const serviceCard = img.closest('.service-card');
        const serviceDescription = serviceCard?.querySelector('.service-description')?.textContent?.trim() || '';
        const wrap = document.createElement('div');
        wrap.className = 'service-image-wrap';
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'View ' + img.alt + ' full size');

        const zoomHint = document.createElement('span');
        zoomHint.className = 'service-zoom-hint';
        zoomHint.setAttribute('aria-hidden', 'true');
        zoomHint.textContent = isTouchDevice ? 'Toca para zoom' : 'Click para zoom';

        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);
        wrap.appendChild(zoomHint);

        wrap.addEventListener('click', function (e) {
            e.stopPropagation();
            openLightbox(img.src, img.alt, serviceDescription);
        });

        wrap.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                openLightbox(img.src, img.alt, serviceDescription);
            }
        });
    });

    // ── Pagination (6 desktop, 4 phone) ──
    const MOBILE_QUERY = '(max-width: 640px)';
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
        if (!img) {
            return;
        }

        if (highPriority) {
            img.setAttribute('loading', 'eager');
            img.setAttribute('fetchpriority', 'high');
        } else {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('fetchpriority', 'low');
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
