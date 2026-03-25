document.addEventListener('DOMContentLoaded', function () {
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

    const cards = document.querySelectorAll('.service-card');
    cards.forEach(function (card) {
        const popover = card.querySelector('.popover');

        card.addEventListener('click', function () {
            document.querySelectorAll('.popover.visible').forEach(function (item) {
                if (item !== popover) {
                    item.classList.remove('visible');
                }
            });

            popover.classList.toggle('visible');
        });

        card.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                popover.classList.remove('visible');
                card.focus();
            }
        });
    });

    document.addEventListener('click', function (event) {
        cards.forEach(function (card) {
            const popover = card.querySelector('.popover');
            if (!card.contains(event.target)) {
                popover.classList.remove('visible');
            }
        });
    });
});
