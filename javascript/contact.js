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
                'Roof Repair': {
                    subject: `🏠 ROOF: ${clientName} needs a repair`,
                    emoji: '⛈️',
                    priority: 'HIGH'
                },
                'Painting and Finishes': {
                    subject: `🎨 AESTHETICS: ${clientName} looking to renovate`,
                    emoji: '🖌️',
                    priority: 'MEDIUM'
                },
                'Electrical Installation': {
                    subject: `⚡ ELECTRICAL: ${clientName} requests installation`,
                    emoji: '🔌',
                    priority: 'HIGH'
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
            formData.append("email", clientEmail); // THIS IS CRITICAL FOR CLIENT TO RECEIVE IT
            formData.append("_replyto", clientEmail);
            formData.append("_from", "A+Pereira Web Platform");
            formData.append(greeting, "thank you for contacting us."); // Usamos el saludo como clave para que no aparezca "MENSAJE"
            formData.append(messageText, ""); // El texto largo va como clave vacía
            formData.append("PRIORITY", config.priority);
            formData.append("PROJECT_DETAILS", "");
            formData.append("Service", `${config.emoji} ${selectedService}`);
            formData.append("Topic", requestTopic);
            formData.append("EXTRA_INFORMATION", "");
            
            // Logic based on email domain
            if (clientEmail.endsWith('.edu')) {
                formData.append("Note", "🎓 Client from the educational sector.");
            } else if (clientEmail.endsWith('.gov')) {
                formData.append("Note", "🏛️ Possible government project.");
            } else if (clientEmail.includes('business') || clientEmail.includes('corp')) {
                formData.append("Note", "💼 Corporate contact detected.");
            }

            formData.append("Sent_from", "Web Contact Form");

            // --- Switch to Web3Forms for better reliability and Autoresponder ---
            const web3ContactData = {
                access_key: "26d957c0-69d5-496c-8225-5085582dfd35",
                from_name: "A+Pereira Contact System",
                subject: config.subject,
                email: clientEmail,
                _replyto: clientEmail,
                _cc: clientEmail, // FORZAR COPIA AL CLIENTE
                _autoresponder: `Hello ${clientName}! Thank you for contacting us.\n\nWe have received your message regarding "${selectedService}". We will get back to you as soon as possible.\n\nMessage Summary:\n${userComments}\n\nSincerely,\nA+Pereira Company Team`,
                "Name": clientName,
                "Email": clientEmail,
                "Phone": phoneInput ? phoneInput.value : 'N/A',
                "Service": selectedService,
                "Topic": requestTopic,
                "Message": userComments
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
                    setStatus('Your request was sent successfully. Opening iMessage...', 'success');
                    
                    // Construct iMessage / SMS content
                    const smsBody = `New Contact Inquiry - A+Pereira Company\n\n` +
                                    `Name: ${clientName}\n` +
                                    `Email: ${clientEmail}\n` +
                                    `Phone: ${phoneInput ? phoneInput.value : 'N/A'}\n` +
                                    `Service: ${selectedService}\n` +
                                    `Subject: ${requestTopic}\n` +
                                    `Message: ${userComments}`;
                    
                    // The owner's phone number
                    const ownerPhone = "+16319601989";
                    
                    // Detect iOS for specific sms: syntax
                    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                    const smsUrl = isIOS 
                        ? `sms:${ownerPhone}&body=${encodeURIComponent(smsBody)}` 
                        : `sms:${ownerPhone}?body=${encodeURIComponent(smsBody)}`;

                    if (window.ContactAlerts && typeof window.ContactAlerts.markSuccessForHome === 'function') {
                        window.ContactAlerts.markSuccessForHome('Form submitted. Redirecting to Messages...');
                    }
                    
                    form.reset();

                    // Open iMessage and redirect
                    window.setTimeout(function () {
                        window.location.href = smsUrl;
                        
                        // Small delay before returning home to allow the protocol to trigger
                        window.setTimeout(function() {
                            window.location.href = './index.html';
                        }, 2000);
                    }, 1000);
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
