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

    // Helper to create a safe Firebase key
    function getServiceKey(title) {
        return title.toLowerCase().trim().replace(/\s+/g, '_').replace(/[.#$[\/]]/g, '');
    }

    // ── Add Liked Services to Carousel ──
    function injectLikedServices() {
        if (!track || !dotsContainer || !db) return;

        // Listen for ALL likes from Firebase (Real-time)
        db.ref('likes').on('value', (snapshot) => {
            const globalLikes = snapshot.val() || {};
            
            // Define threshold (20 likes)
            const LIKE_THRESHOLD = 20;

            // Static mapping of services to images (using normalized keys)
            const serviceImages = {
                [getServiceKey("Gutters")]: "../img/Galeria 14.png",
                [getServiceKey("Wood PVC Trex")]: "../img/Galeria 8.png",
                [getServiceKey("Decks")]: "../img/Galeria 17.png",
                [getServiceKey("Windows and doors")]: "../img/Galeria 6.png",
                [getServiceKey("Painting")]: "../img/Galeria 7.png",
                [getServiceKey("and more")]: "../img/Galeria 1.png"
            };

            let changesMade = false;

            Object.keys(globalLikes).forEach(serviceKey => {
                const val = globalLikes[serviceKey];
                let count = 0;
                if (typeof val === 'number') count = val;
                else if (val && typeof val.count === 'number') count = val.count;
                
                const imagePath = serviceImages[serviceKey];
                
                if (count >= LIKE_THRESHOLD && imagePath) {
                    // Check if already in carousel
                    const exists = slides.some(slide => {
                        const img = slide.querySelector('img');
                        return img && img.src.includes(imagePath.split('/').pop());
                    });

                    if (!exists) {
                        const originalTitle = serviceKey.replace(/_/g, ' ');
                        const newSlide = document.createElement('article');
                        newSlide.className = 'carousel-slide';
                        newSlide.setAttribute('aria-hidden', 'true');
                        newSlide.innerHTML = `
                            <img src="${imagePath}" alt="${originalTitle}" loading="lazy" decoding="async">
                            <div class="carousel-caption">
                                <div class="carousel-stats">
                                    <span>Featured Work</span>
                                    <span class="carousel-likes">
                                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:12px; height:12px; margin-right:4px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                                        <span class="count-val">${count}</span>
                                    </span>
                                </div>
                                <h3 style="text-transform: capitalize;">${originalTitle}</h3>
                            </div>
                        `;
                        track.appendChild(newSlide);

                        const newDot = document.createElement('button');
                        newDot.className = 'carousel-dot';
                        newDot.type = 'button';
                        newDot.setAttribute('aria-label', `Show slide ${slides.length + 1}`);
                        dotsContainer.appendChild(newDot);
                        changesMade = true;
                    } else {
                        // Update existing slide's count
                        const slide = slides.find(s => {
                            const img = s.querySelector('img');
                            return img && img.src.includes(imagePath.split('/').pop());
                        });
                        if (slide) {
                            const countVal = slide.querySelector('.count-val');
                            if (countVal) countVal.textContent = count;
                        }
                    }
                }
            });

            // Update STATIC slides with likes
            slides.forEach(slide => {
                const eyebrow = slide.querySelector('.carousel-caption span')?.textContent.trim();
                
                let matchedKey = null;
                if (eyebrow === "Exterior Finish" || eyebrow === "Interior Upgrade") matchedKey = getServiceKey("Painting");
                if (eyebrow === "Roofing") matchedKey = getServiceKey("Gutters");
                
                if (matchedKey && globalLikes[matchedKey]) {
                    const val = globalLikes[matchedKey];
                    const count = (typeof val === 'number') ? val : (val.count || 0);
                    
                    let statsDiv = slide.querySelector('.carousel-stats');
                    if (!statsDiv) {
                        statsDiv = document.createElement('div');
                        statsDiv.className = 'carousel-stats';
                        const eyebrowSpan = slide.querySelector('.carousel-caption span');
                        eyebrowSpan.parentNode.insertBefore(statsDiv, eyebrowSpan);
                        statsDiv.appendChild(eyebrowSpan);
                        
                        const likesSpan = document.createElement('span');
                        likesSpan.className = 'carousel-likes';
                        likesSpan.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width:12px; height:12px; margin-right:4px;"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg>
                            <span class="count-val">${count}</span>
                        `;
                        statsDiv.appendChild(likesSpan);
                    } else {
                        const countVal = statsDiv.querySelector('.count-val');
                        if (countVal) countVal.textContent = count;
                    }
                }
            });

            if (changesMade) {
                slides = Array.from(track.querySelectorAll('.carousel-slide'));
                dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
                updateCarousel(currentIndex);
            }
        });
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
