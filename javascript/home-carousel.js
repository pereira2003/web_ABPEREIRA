document.addEventListener('DOMContentLoaded', function () {
    const track = document.getElementById('showcaseTrack');
    let slides = track ? Array.from(track.querySelectorAll('.carousel-slide')) : [];
    const prevButton = document.getElementById('carouselPrev');
    const nextButton = document.getElementById('carouselNext');
    let dots = Array.from(document.querySelectorAll('.carousel-dot'));
    const dotsContainer = document.getElementById('carouselDots');
    const carousel = document.querySelector('.showcase-carousel');

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

    // ── Add Liked Services to Carousel ──
    async function injectLikedServices() {
        if (!track || !dotsContainer || !db) return;

        try {
            // 1. Fetch ALL likes from Firebase (Global)
            const snapshot = await db.ref('likes').once('value');
            const globalLikes = snapshot.val() || {};
            
            // 2. Define threshold (20 likes)
            const LIKE_THRESHOLD = 20;

            // 3. Static mapping of services to images (for those that meet the threshold)
            // We need this because Firebase only stores the count, not the image path
            const serviceImages = {
                "Gutters": "../img/Galeria 14.png",
                "Wood PVC Trex": "../img/Galeria 8.png",
                "Decks": "../img/Galeria 17.png",
                "Windows and doors": "../img/Galeria 6.png",
                "Painting": "../img/Galeria 7.png",
                "and more": "../img/Galeria 1.png" // Default or first gallery image
            };

            Object.keys(globalLikes).forEach(serviceTitleKey => {
                const count = globalLikes[serviceTitleKey].count || 0;
                
                // Reconstruct original title from key (underscores back to spaces if needed)
                // Actually the keys were saved with underscores for Firebase compatibility
                const originalTitle = serviceTitleKey.replace(/_/g, ' ');

                if (count >= LIKE_THRESHOLD) {
                    const imagePath = serviceImages[originalTitle];
                    if (!imagePath) return;

                    // Check if already in carousel
                    const exists = slides.some(slide => {
                        const img = slide.querySelector('img');
                        return img && img.src.includes(imagePath.split('/').pop());
                    });

                    if (!exists) {
                        const newSlide = document.createElement('article');
                        newSlide.className = 'carousel-slide';
                        newSlide.setAttribute('aria-hidden', 'true');
                        newSlide.innerHTML = `
                            <img src="${imagePath}" alt="${originalTitle}" loading="lazy" decoding="async">
                            <div class="carousel-caption">
                                <span>Featured Work</span>
                                <h3>${originalTitle}</h3>
                            </div>
                        `;
                        track.appendChild(newSlide);

                        const newDot = document.createElement('button');
                        newDot.className = 'carousel-dot';
                        newDot.type = 'button';
                        newDot.setAttribute('aria-label', `Show slide ${slides.length + 1}`);
                        dotsContainer.appendChild(newDot);
                    }
                }
            });

            // Refresh UI
            slides = Array.from(track.querySelectorAll('.carousel-slide'));
            dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
            updateCarousel(0); // Restart with new slides

        } catch (error) {
            console.error("Error syncing featured services:", error);
        }
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
