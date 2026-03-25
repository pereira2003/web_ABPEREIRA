document.addEventListener('DOMContentLoaded', function () {
    const redirectHome = document.getElementById('redirect-home');
    const serviceSelect = document.getElementById('service');
    const emailSubject = document.getElementById('email-subject');
    const requestDate = document.getElementById('request-date');
    const form = document.querySelector('.contact-form');
    const nameInput = document.getElementById('name');
    const subjectInput = document.getElementById('subject');

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

    if (requestDate) {
        requestDate.value = new Date().toLocaleString();
    }

    // Keep all form fields intact and generate a professional subject line.
    if (form) {
        form.addEventListener('submit', function () {
            if (!emailSubject) {
                return;
            }

            const clientName = nameInput && nameInput.value ? nameInput.value.trim() : 'Client';
            const selectedService = serviceSelect && serviceSelect.value ? serviceSelect.value : 'General Inquiry';
            const requestTopic = subjectInput && subjectInput.value ? subjectInput.value.trim() : 'Service Request';

            emailSubject.value = 'New ' + selectedService + ' request | ' + clientName + ' | ' + requestTopic;
        });
    }
});
