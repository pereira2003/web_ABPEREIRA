/**
 * Modern Navigation Menu Controller
 * Handles mobile menu toggle, overlay management, and accessibility
 */

(function() {
    'use strict';

    const body = document.body;
    const transitionLayer = createPageTransitionLayer();
    wirePageTransitions(transitionLayer);

    const menuToggle = document.getElementById('menuToggle');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = navOverlay?.querySelectorAll('a') || [];

    if (!menuToggle || !navOverlay) {
        return;
    }

    function isMenuOpen() {
        return menuToggle.getAttribute('aria-expanded') === 'true';
    }

    function openMenu() {
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Close navigation menu');
        navOverlay.classList.add('open');
        navOverlay.setAttribute('aria-hidden', 'false');
        body.classList.add('menu-open');
        body.style.overflow = 'hidden';
    }

    function closeMenu() {
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Open navigation menu');
        navOverlay.classList.remove('open');
        navOverlay.setAttribute('aria-hidden', 'true');
        body.classList.remove('menu-open');
        body.style.overflow = '';
    }

    function toggleMenu() {
        if (isMenuOpen()) {
            closeMenu();
        } else {
            openMenu();
        }
    }

    menuToggle.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && isMenuOpen()) {
            closeMenu();
        }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth > 768 && isMenuOpen()) {
                closeMenu();
            }
        }, 250);
    });

    navOverlay.addEventListener('click', event => {
        if (event.target === navOverlay) {
            closeMenu();
        }
    });

    navOverlay.addEventListener('keydown', event => {
        if (event.key === 'Tab') {
            const firstLink = navLinks[0];
            const lastLink = navLinks[navLinks.length - 1];

            if (event.shiftKey && document.activeElement === firstLink) {
                event.preventDefault();
                lastLink?.focus();
            } else if (!event.shiftKey && document.activeElement === lastLink) {
                event.preventDefault();
                firstLink?.focus();
            }
        }
    });

    closeMenu();

    function createPageTransitionLayer() {
        const layer = document.createElement('div');
        layer.className = 'page-transition';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML =
            '<div class="page-transition-spinner" aria-hidden="true"></div>' +
            '<p class="page-transition-text">AB Pereira Company</p>';
        body.appendChild(layer);
        return layer;
    }

    function activatePageTransition(layer) {
        body.classList.add('is-page-transitioning');
        layer.classList.add('is-active');
    }

    function wirePageTransitions(layer) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const transitionDelay = prefersReducedMotion ? 0 : 260;

        document.querySelectorAll('a[href]').forEach(link => {
            link.addEventListener('click', event => {
                if (event.defaultPrevented) {
                    return;
                }

                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                }

                if (link.target && link.target !== '_self') {
                    return;
                }

                if (link.hasAttribute('download')) {
                    return;
                }

                const rawHref = link.getAttribute('href');
                if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) {
                    return;
                }

                let destination;
                try {
                    destination = new URL(link.href, window.location.href);
                } catch {
                    return;
                }

                if (destination.origin !== window.location.origin) {
                    return;
                }

                const current = window.location;
                if (destination.pathname === current.pathname && destination.search === current.search && destination.hash) {
                    return;
                }

                event.preventDefault();
                activatePageTransition(layer);
                window.setTimeout(() => {
                    window.location.href = destination.href;
                }, transitionDelay);
            });
        });

        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', event => {
                if (event.defaultPrevented) {
                    return;
                }

                const target = form.getAttribute('target');
                if (target && target !== '_self') {
                    return;
                }

                activatePageTransition(layer);
            });
        });

        window.addEventListener('pageshow', () => {
            body.classList.remove('is-page-transitioning');
            layer.classList.remove('is-active');
        });
    }

})();
