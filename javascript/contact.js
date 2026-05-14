document.addEventListener('DOMContentLoaded', function () {
    const redirectHome = document.getElementById('redirect-home');
    const serviceSelect = document.getElementById('service');
    const emailSubject = document.getElementById('email-subject');
    const form = document.querySelector('.contact-form');
    const nameInput = document.getElementById('name');
    const subjectInput = document.getElementById('subject');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('comments');
    const submitButton = form ? form.querySelector('input[type="submit"], button[type="submit"]') : null;
    const statusMessage = document.getElementById('form-status');

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
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            db = firebase.database();
            console.log("✅ Firebase connected for contact messages.");
        }
    } catch (error) {
        console.error("Firebase initialization error:", error);
    }

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

    function getGreetingEN() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Good morning";
        if (hour >= 12 && hour < 18) return "Good afternoon";
        return "Good evening";
    }

    // Make comments required if 'Other' service is selected
    if (serviceSelect && messageInput) {
        const commentsLabel = document.querySelector('label[for="comments"]');
        serviceSelect.addEventListener('change', function() {
            if (this.value === 'Other') {
                messageInput.required = true;
                if (commentsLabel) commentsLabel.innerHTML = 'Comments *';
                messageInput.placeholder = 'Please describe the custom service you need...';
            } else {
                messageInput.required = false;
                if (commentsLabel) commentsLabel.innerHTML = 'Comments (Optional)';
                messageInput.placeholder = 'Write a brief description of the job or service you need';
            }
        });
    }

    // Keep all form fields intact and generate a professional subject line.
    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            if (!emailSubject) {
                return;
            }

            const greeting = getGreetingEN();
            const clientName = nameInput && nameInput.value ? nameInput.value.trim() : 'Client';
            const selectedService = serviceSelect && serviceSelect.value ? serviceSelect.value : 'General Inquiry';
            const requestTopic = subjectInput && subjectInput.value ? subjectInput.value.trim() : 'Interest in services';
            const clientEmail = document.getElementById('email') ? document.getElementById('email').value : '';

            // Creative message configuration based on service
            const serviceConfigs = {
                'Gutters': {
                    subject: `💧 GUTTERS: ${clientName} needs maintenance`,
                    emoji: '💧',
                    priority: 'MEDIUM'
                },
                'Wood, PVC & Trex': {
                    subject: `🪵 MATERIALS: ${clientName} project inquiry`,
                    emoji: '🪵',
                    priority: 'MEDIUM'
                },
                'Decks': {
                    subject: `🏗️ DECKS: ${clientName} wants a deck project`,
                    emoji: '🏗️',
                    priority: 'HIGH'
                },
                'Windows and Doors': {
                    subject: `🪟 ENTRANCE: ${clientName} project inquiry`,
                    emoji: '🪟',
                    priority: 'MEDIUM'
                },
                'Painting': {
                    subject: `🎨 AESTHETICS: ${clientName} looking to renovate`,
                    emoji: '🎨',
                    priority: 'MEDIUM'
                },
                'Other': {
                    subject: `📩 INQUIRY: ${clientName} has a question`,
                    emoji: '🔍',
                    priority: 'MEDIUM'
                }
            };

            const config = serviceConfigs[selectedService] || serviceConfigs['Other'];
            const messageText = `${greeting}! Your message has been received. We will follow up with your request shortly.`;
            
            const userComments = messageInput && messageInput.value ? messageInput.value.trim() : 'No additional comments';

            // --- Save to Firebase ---
            if (db) {
                try {
                    const newContactRef = db.ref('appointments').push(); // We use 'appointments' node to keep it simple for the dashboard, but we mark it as type 'contact'
                    await newContactRef.set({
                        name: clientName,
                        email: clientEmail,
                        phone: phoneInput ? phoneInput.value : 'N/A',
                        service: selectedService,
                        subject: requestTopic,
                        description: userComments,
                        created_at: new Date().toISOString(),
                        status: 'pending',
                        type: 'contact', // Distinguish from appointment
                        id: newContactRef.key
                    });
                    console.log("✅ Contact message saved to Firebase");
                } catch (error) {
                    console.error("❌ Error saving to Firebase:", error);
                }
            }

            // Personalize subject
            emailSubject.value = config.subject;

            setSubmitting(true);
            setStatus('Sending your request...', 'pending');

            const formData = new FormData(form);
            
            // Clean up and add creative fields
            formData.append("email", clientEmail || "contact.abpereira@gmail.com"); // THIS IS CRITICAL FOR CLIENT TO RECEIVE IT
            formData.append("_replyto", clientEmail || "contact.abpereira@gmail.com");
            formData.append("_from", "A+Pereira Web Platform");
            formData.append(greeting, "thank you for contacting us."); // Usamos el saludo como clave para que no aparezca "MENSAJE"
            formData.append(messageText, ""); // El texto largo va como clave vacía
            formData.append("PRIORITY", config.priority);
            formData.append("PROJECT_DETAILS", "");
            formData.append("Service", `${config.emoji} ${selectedService}`);
            formData.append("Topic", requestTopic);
            formData.append("EXTRA_INFORMATION", "");
            
            // Logic based on email domain
            if (clientEmail && clientEmail.endsWith('.edu')) {
                formData.append("Note", "🎓 Client from the educational sector.");
            } else if (clientEmail && clientEmail.endsWith('.gov')) {
                formData.append("Note", "🏛️ Possible government project.");
            } else if (clientEmail && (clientEmail.includes('business') || clientEmail.includes('corp'))) {
                formData.append("Note", "💼 Corporate contact detected.");
            }

            formData.append("Sent_from", "Web Contact Form");

            // --- Switch to Web3Forms for better reliability and Autoresponder ---
            const web3ContactData = {
                access_key: "26d957c0-69d5-496c-8225-5085582dfd35",
                from_name: "A⁺Pereira Contact System",
                subject: config.subject,
                "MENSAJE_PARA_ADMIN": "👋 ¡Hola Admin! Has recibido una nueva consulta de contacto desde la web.",
                "Name": clientName,
                "Email": clientEmail || "contact.abpereira@gmail.com",
                "Phone": phoneInput ? phoneInput.value : 'N/A',
                "Service": selectedService,
                "Topic": requestTopic,
                "Message": userComments,
                "ACCESO_ADMIN": "⚙️ Link para gestionar solicitud ⬇️",
                "ENLACE_LOGIN": "https://pereira2003.github.io/web_ABPEREIRA/Vistas/admin-login.html"
            };

            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(web3ContactData)
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
                        window.ContactAlerts.markSuccessForHome('Form submitted successfully.');
                    }
                    
                    form.reset();

                    // Redirect to home
                    window.setTimeout(function () {
                        window.location.href = './index.html';
                    }, 1500);
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
