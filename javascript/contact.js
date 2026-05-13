document.addEventListener('DOMContentLoaded', function () {
    const redirectHome = document.getElementById('redirect-home');
    const serviceSelect = document.getElementById('service');
    const emailSubject = document.getElementById('email-subject');
    const form = document.querySelector('.contact-form');
    const nameInput = document.getElementById('name');
    const subjectInput = document.getElementById('subject');
    const submitButton = form ? form.querySelector('input[type="submit"], button[type="submit"]') : null;
    const statusMessage = document.getElementById('form-status');

    if (!redirectHome || !serviceSelect) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');

    redirectHome.value = './index.html';

    if (serviceParam) {
        const matchingOption = Array.from(serviceSelect.options).find(function (option) {
            return option.value === serviceParam;
        });

        if (matchingOption) {
            serviceSelect.value = serviceParam;
        }
    }

    function setStatus(message, state) {
        if (!statusMessage) {
            return;
        }

        statusMessage.textContent = message;
        statusMessage.className = 'form-status ' + (state || '');
    }

    function setSubmitting(isSubmitting) {
        if (!submitButton) {
            return;
        }

        submitButton.disabled = isSubmitting;
        submitButton.value = isSubmitting ? 'Sending...' : 'Send Message';
    }

    // Keep all form fields intact and generate a professional subject line.
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (!emailSubject) {
                return;
            }

            const clientName = nameInput && nameInput.value ? nameInput.value.trim() : 'Cliente';
            const selectedService = serviceSelect && serviceSelect.value ? serviceSelect.value : 'Consulta General';
            const requestTopic = subjectInput && subjectInput.value ? subjectInput.value.trim() : 'Interés en servicios';

            emailSubject.value = `✨ NUEVO CONTACTO: ${clientName} interesado en ${selectedService}`;

            setSubmitting(true);
            setStatus('Sending your request...', 'pending');

            const formData = new FormData(form);
            // Add custom fields for a cleaner email body
            formData.append("--- TIPO DE SOLICITUD ---", selectedService);
            formData.append("Asunto", requestTopic);
            formData.append("--- MENSAJE ---", "");
            formData.append("_from", "A+Pereira Web");

            fetch('https://formsubmit.co/ajax/a90011410@gmail.com', {
                method: 'POST',
                headers: {
                    Accept: 'application/json'
                },
                body: formData
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Request failed');
                    }

                    return response.json();
                })
                .then(function () {
                    setStatus('Your request was sent successfully. Redirecting...', 'success');
                    if (window.ContactAlerts && typeof window.ContactAlerts.markSuccessForHome === 'function') {
                        window.ContactAlerts.markSuccessForHome('Formulario enviado correctamente.');
                    }
                    form.reset();

                    window.setTimeout(function () {
                        window.location.href = './index.html';
                    }, 1200);
                })
                .catch(function () {
                    setStatus('We could not send the form right now. Please check your connection and try again.', 'error');
                })
                .finally(function () {
                    setSubmitting(false);
                });
        });
    }
});
