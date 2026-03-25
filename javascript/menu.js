/**
 * Modern Navigation Menu Controller
 * Handles mobile menu toggle, overlay management, and accessibility
 */

(function() {
    'use strict';

    const menuToggle = document.getElementById('menuToggle');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = navOverlay?.querySelectorAll('a') || [];
    const body = document.body;

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

})();
