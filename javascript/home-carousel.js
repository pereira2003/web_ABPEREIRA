document.addEventListener('DOMContentLoaded', function () {
    const track = document.getElementById('showcaseTrack');
    let slides = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
    const prevButton = document.getElementById('carouselPrev');
    const nextButton = document.getElementById('carouselNext');
    let dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const dotsContainer = document.getElementById('carouselDots');
    const carousel = document.querySelector('.showcase-carousel');

    // ── Add Liked Services to Carousel ──
    function injectLikedServices() {
        if (!track || !dotsContainer) return;

        const savedLikes = JSON.parse(localStorage.getItem('serviceLikes') || '{}');
        const savedCounts = JSON.parse(localStorage.getItem('serviceCounts') || '{}');
        const likedEntries = Object.values(savedLikes);
        
        // Define what "many likes" means (e.g., at least 20 likes)
         const LIKE_THRESHOLD = 20;

        likedEntries.forEach(service => {
            const currentCount = savedCounts[service.title] || 0;
            
            // Only add if it meets the threshold
            if (currentCount >= LIKE_THRESHOLD) {
                // Check if this service image is already in the carousel
                const exists = slides.some(slide => {
                    const img = slide.querySelector('img');
                    return img && img.src.includes(service.image.split('/').pop());
                });

                if (!exists) {
                    // Create new slide
                    const newSlide = document.createElement('article');
                    newSlide.className = 'carousel-slide';
                    newSlide.setAttribute('aria-hidden', 'true');
                    newSlide.innerHTML = `
                        <img src="${service.image}" alt="${service.title}" loading="lazy" decoding="async">
                        <div class="carousel-caption">
                            <span>Featured Service</span>
                            <h3>${service.title}</h3>
                        </div>
                    `;
                    track.appendChild(newSlide);

                    // Create new dot
                    const newDot = document.createElement('button');
                    newDot.className = 'carousel-dot';
                    newDot.type = 'button';
                    newDot.setAttribute('aria-label', `Show slide ${slides.length + 1}`);
                    newDot.setAttribute('aria-pressed', 'false');
                    dotsContainer.appendChild(newDot);
                }
            }
        });

        // Refresh slides and dots arrays
        slides = Array.from(track.querySelectorAll('.carousel-slide'));
        dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
    }

    injectLikedServices();

    let currentIndex = 0;
    let autoPlayId;
    let startX = 0;
    let endX = 0;
    let visibleSlides = 1;

    if (!track || !slides.length || !prevButton || !nextButton || !dots.length || !carousel) {
        return;
    }

    const getVisibleSlides = function () {
        if (window.innerWidth <= 640) {
            return 1;
        }

        if (window.innerWidth <= 991) {
            return 2;
        }

        return 3;
    };

    const getMaxIndex = function () {
        return Math.max(slides.length - visibleSlides, 0);
    };

    const updateCarousel = function (index) {
        visibleSlides = getVisibleSlides();

        if (index < 0) {
            currentIndex = slides.length - 1;
        } else if (index >= slides.length) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }

        let visualIndex = Math.min(currentIndex, getMaxIndex());
        const targetSlide = slides[visualIndex];
        const offset = targetSlide ? targetSlide.offsetLeft : 0;
        track.style.transform = 'translate3d(-' + offset + 'px, 0, 0)';

        slides.forEach(function (slide, slideIndex) {
            const isActive = slideIndex === currentIndex;
            slide.classList.toggle('active', isActive);
            slide.setAttribute('aria-hidden', String(slideIndex < visualIndex || slideIndex >= visualIndex + visibleSlides));
        });

        dots.forEach(function (dot, dotIndex) {
            const isActive = dotIndex === currentIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-pressed', String(isActive));
        });
    };

    const stopAutoPlay = function () {
        clearInterval(autoPlayId);
    };

    const startAutoPlay = function () {
        stopAutoPlay();
        autoPlayId = setInterval(function () {
            updateCarousel(currentIndex + 1);
        }, 5000);
    };

    prevButton.addEventListener('click', function () {
        updateCarousel(currentIndex - 1);
        startAutoPlay();
    });

    nextButton.addEventListener('click', function () {
        updateCarousel(currentIndex + 1);
        startAutoPlay();
    });

    dots.forEach(function (dot, dotIndex) {
        dot.addEventListener('click', function () {
            updateCarousel(dotIndex);
            startAutoPlay();
        });
    });

    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    carousel.addEventListener('touchstart', function (event) {
        startX = event.touches[0].clientX;
        endX = startX;
        stopAutoPlay();
    }, { passive: true });

    carousel.addEventListener('touchmove', function (event) {
        endX = event.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', function () {
        const deltaX = endX - startX;
        if (Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                updateCarousel(currentIndex - 1);
            } else {
                updateCarousel(currentIndex + 1);
            }
        }
        startAutoPlay();
    });

    window.addEventListener('resize', function () {
        updateCarousel(currentIndex);
    });

    updateCarousel(0);
    startAutoPlay();
});
