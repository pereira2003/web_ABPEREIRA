/**
 * Modern Navigation Menu Controller
 * Handles mobile menu toggle, overlay management, and accessibility
 */

(function() {
    'use strict';

    const body = document.body;
    const transitionLayer = createPageTransitionLayer();
    activateInitialPageLoadTransition(transitionLayer);
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

    // Communication Floating Menu Toggle
    const commMenu = document.getElementById('commMenu');
    const commToggleBtn = document.getElementById('commToggleBtn');

    if (commToggleBtn && commMenu) {
        commToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            commMenu.classList.toggle('is-active');
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!commMenu.contains(e.target)) {
                commMenu.classList.remove('is-active');
            }
        });

        // Icon Carousel Animation
        const icons = document.querySelectorAll('.carousel-icon');
        let currentIconIndex = 0;

        // Clear any existing interval to prevent duplicates
        if (window.commMenuInterval) clearInterval(window.commMenuInterval);

        if (icons.length > 0) {
            window.commMenuInterval = setInterval(() => {
                // If the menu is active (open), don't animate the carousel icons behind the close icon
                if (commMenu.classList.contains('is-active')) return;

                // Remove active class from current icon and add prev
                icons[currentIconIndex].classList.remove('active');
                icons[currentIconIndex].classList.add('prev');
                
                const prevIndex = currentIconIndex;
                
                // Move to next icon
                currentIconIndex = (currentIconIndex + 1) % icons.length;
                
                // Reset the new active icon position and add active class
                icons[currentIconIndex].classList.remove('prev');
                icons[currentIconIndex].classList.add('active');

                // Clean up the prev class after animation
                setTimeout(() => {
                    icons[prevIndex].classList.remove('prev');
                }, 600);
            }, 3000);
        }
    }

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

    // Handle smooth scroll for anchors on page load
    document.addEventListener('DOMContentLoaded', () => {
        if (window.location.hash) {
            // Function to handle the scroll
            const scrollToAnchor = () => {
                const target = document.querySelector(window.location.hash);
                if (target) {
                    const headerOffset = 100; // Increased offset to leave the form perfectly in front
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: "smooth"
                    });
                }
            };

            // Initial scroll attempt after splash
            setTimeout(scrollToAnchor, 1000);
            
            // Backup scroll attempt for slower devices
            setTimeout(scrollToAnchor, 2000);
        }

        // Floating Menu Scroll Logic
        const floatingMenu = document.getElementById('commMenu');
        if (floatingMenu) {
            // Asegurarnos de que el menú esté oculto al inicio
            floatingMenu.style.display = 'flex'; 
            
            const handleScroll = () => {
                if (window.scrollY > 200) {
                    floatingMenu.classList.add('show');
                } else {
                    floatingMenu.classList.remove('show');
                }
            };

            window.addEventListener('scroll', handleScroll, { passive: true });
            // Ejecutar una vez al cargar por si ya hay scroll
            handleScroll();
        }
    });

    function createPageTransitionLayer() {
        const layer = document.createElement('div');
        layer.className = 'page-transition';
        layer.setAttribute('aria-hidden', 'true');
        layer.innerHTML =
            '<div class="page-transition-spinner" aria-hidden="true"></div>' +
            '<p class="page-transition-brand">A⁺Pereira Company</p>' +
            '<p class="page-transition-loading">Cargando</p>';
        body.appendChild(layer);
        return layer;
    }

    function activatePageTransition(layer) {
        body.classList.add('is-page-transitioning');
        layer.classList.add('is-active');
    }

    function deactivatePageTransition(layer) {
        body.classList.remove('is-page-transitioning');
        layer.classList.remove('is-active');
    }

    function activateInitialPageLoadTransition(layer) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const minVisibleTime = prefersReducedMotion ? 80 : 460;
        const startedAt = performance.now();

        activatePageTransition(layer);

        const finishInitialTransition = () => {
            const elapsed = performance.now() - startedAt;
            const remaining = Math.max(0, minVisibleTime - elapsed);
            window.setTimeout(() => {
                deactivatePageTransition(layer);
            }, remaining);
        };

        if (document.readyState === 'complete') {
            finishInitialTransition();
            return;
        }

        window.addEventListener('load', finishInitialTransition, { once: true });
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
                // Defer to let other scripts call preventDefault() first
                setTimeout(() => {
                    if (event.defaultPrevented) {
                        return;
                    }

                    const target = form.getAttribute('target');
                    if (target && target !== '_self') {
                        return;
                    }

                    activatePageTransition(layer);
                }, 0);
            });
        });

        window.addEventListener('pageshow', () => {
            deactivatePageTransition(layer);
        });
    }

})();
