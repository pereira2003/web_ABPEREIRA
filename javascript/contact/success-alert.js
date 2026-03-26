(function () {
    var STORAGE_KEY = 'abp_contact_success_message';

    function markSuccessForHome(message) {
        try {
            window.sessionStorage.setItem(STORAGE_KEY, message || 'Formulario enviado correctamente.');
        } catch (error) {
            // Ignore storage errors (private mode/restricted storage).
        }
    }

    function consumeSuccessMessage() {
        try {
            var message = window.sessionStorage.getItem(STORAGE_KEY);
            if (!message) {
                return '';
            }

            window.sessionStorage.removeItem(STORAGE_KEY);
            return message;
        } catch (error) {
            return '';
        }
    }

    function showHomeToast(message) {
        if (!message) {
            return;
        }

        var toast = document.createElement('div');
        toast.className = 'home-toast home-toast-visible';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.innerHTML = '<span class="home-toast-badge">Success</span><p>' + message + '</p>';

        document.body.appendChild(toast);

        window.setTimeout(function () {
            toast.classList.remove('home-toast-visible');
        }, 2800);

        window.setTimeout(function () {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3400);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var message = consumeSuccessMessage();
        showHomeToast(message);
    });

    window.ContactAlerts = window.ContactAlerts || {};
    window.ContactAlerts.markSuccessForHome = markSuccessForHome;
})();
