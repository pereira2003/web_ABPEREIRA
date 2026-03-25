document.addEventListener('DOMContentLoaded', function () {
    const redirectHome = document.getElementById('redirect-home');
    const serviceSelect = document.getElementById('service');
    const form = document.querySelector('.contact-form');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const commentsInput = document.getElementById('comments');
    const phoneInput = document.getElementById('phone');

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

    // Format email submission with elegant structure
    if (form) {
        form.addEventListener('submit', function (e) {
            // Collect all form data
            const clientName = nameInput.value || 'Not provided';
            const clientEmail = emailInput.value || 'Not provided';
            const clientPhone = phoneInput.value || 'Not provided';
            const selectedService = serviceSelect.value || 'Not specified';
            const requestSubject = subjectInput.value || 'Service Request';
            const clientComments = commentsInput.value || 'No additional details provided';

            // Create formatted message with clean structure
            const formattedMessage = `
═══════════════════════════════════
       NEW SERVICE REQUEST
═══════════════════════════════════

CLIENT INFORMATION
─────────────────────────────────────
Name:              ${clientName}
Email:             ${clientEmail}
Phone:             ${clientPhone}

REQUEST DETAILS
─────────────────────────────────────
Service:           ${selectedService}
Subject:           ${requestSubject}

MESSAGE
─────────────────────────────────────
${clientComments}

═══════════════════════════════════
Sent from AB Pereira Company Contact Form
===════════════════════════════════`;

            // Replace comments with formatted message
            commentsInput.value = formattedMessage;
        });
    }
});
