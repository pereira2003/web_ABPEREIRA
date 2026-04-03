document.addEventListener('DOMContentLoaded', function () {
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
        '<button class="lightbox-close" aria-label="Close image preview">&#x2715;</button>' +
        '<img class="lightbox-img" src="" alt="">' +
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
    document.querySelectorAll('.service-image').forEach(function (img, index) {
        if (index < 2) {
            img.setAttribute('loading', 'eager');
            img.setAttribute('fetchpriority', 'high');
        } else {
            img.setAttribute('loading', 'lazy');
            img.setAttribute('fetchpriority', 'low');
        }
        img.setAttribute('decoding', 'async');

        const serviceCard = img.closest('.service-card');
        const serviceDescription = serviceCard?.querySelector('.service-description')?.textContent?.trim() || '';
        const wrap = document.createElement('div');
        wrap.className = 'service-image-wrap';
        wrap.setAttribute('role', 'button');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', 'View ' + img.alt + ' full size');
        img.parentNode.insertBefore(wrap, img);
        wrap.appendChild(img);

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
});
