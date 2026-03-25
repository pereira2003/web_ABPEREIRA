document.addEventListener('DOMContentLoaded', function () {
    const revealGroups = [
        { selector: '.menu', step: 0 },
        { selector: '.hero-copy > *', step: 90 },
        { selector: '.page-hero > *', step: 95 },
        { selector: '.hero-panel', step: 0 },
        { selector: '.showcase .section-heading', step: 0 },
        { selector: '.showcase-carousel', step: 0 },
        { selector: '.process .section-heading', step: 0 },
        { selector: '.process-card', step: 110 },
        { selector: '.service-card', step: 110 },
        { selector: '.story-media', step: 0 },
        { selector: '.story-copy > *', step: 95 },
        { selector: '.services-note > *', step: 110 },
        { selector: '.cta-content > *', step: 105 },
        { selector: '.footer-brand', step: 0 },
        { selector: '.footer .link', step: 90 },
        { selector: '.copyright', step: 0 }
    ];

    const seen = new Set();
    const revealElements = [];

    revealGroups.forEach(function (group) {
        const elements = Array.from(document.querySelectorAll(group.selector));

        elements.forEach(function (element, index) {
            if (seen.has(element)) {
                return;
            }

            seen.add(element);
            element.classList.add('reveal-on-scroll');
            element.style.setProperty('--reveal-delay', Math.min(index * group.step, 560) + 'ms');
            revealElements.push(element);
        });
    });

    if (!revealElements.length) {
        return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach(function (element) {
            element.classList.add('is-visible');
        });
        return;
    }

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                entry.target.classList.remove('is-visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -12% 0px'
    });

    revealElements.forEach(function (element) {
        observer.observe(element);
    });
});
