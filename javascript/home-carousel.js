document.addEventListener('DOMContentLoaded', function () {
    const track = document.getElementById('showcaseTrack');
    const slides = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
    const prevButton = document.getElementById('carouselPrev');
    const nextButton = document.getElementById('carouselNext');
    const dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const carousel = document.querySelector('.showcase-carousel');

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
            currentIndex = getMaxIndex();
        } else if (index > getMaxIndex()) {
            currentIndex = 0;
        } else {
            currentIndex = index;
        }

        const targetSlide = slides[currentIndex];
        const offset = targetSlide ? targetSlide.offsetLeft : 0;
        track.style.transform = 'translate3d(-' + offset + 'px, 0, 0)';

        slides.forEach(function (slide, slideIndex) {
            const isActive = slideIndex >= currentIndex && slideIndex < currentIndex + visibleSlides;
            slide.classList.toggle('active', isActive);
            slide.setAttribute('aria-hidden', String(slideIndex < currentIndex || slideIndex >= currentIndex + visibleSlides));
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
