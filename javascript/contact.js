document.addEventListener('DOMContentLoaded', function () {
    const redirectHome = document.getElementById('redirect-home');
    const serviceSelect = document.getElementById('service');

    if (!redirectHome || !serviceSelect) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');

    redirectHome.value = new URL('index.html', window.location.href).href;

    if (serviceParam) {
        const matchingOption = Array.from(serviceSelect.options).find(function (option) {
            return option.value === serviceParam;
        });

        if (matchingOption) {
            serviceSelect.value = serviceParam;
        }
    }
});
