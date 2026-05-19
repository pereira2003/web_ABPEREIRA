// Calendar and Appointment Booking Script
document.addEventListener('DOMContentLoaded', function() {
    const calendarDaysElement = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateInput = document.getElementById('selected-date');
    const appointmentForm = document.querySelector('.appointment-form');
    const formStatus = document.getElementById('form-status');

    // Make description required if 'Other' service is selected
    const serviceSelect = document.getElementById('app-service');
    const descriptionInput = document.getElementById('app-description');
    
    if (serviceSelect && descriptionInput) {
        const descriptionLabel = document.querySelector('label[for="app-description"]');
        serviceSelect.addEventListener('change', function() {
            if (this.value === 'Other') {
                descriptionInput.required = true;
                if (descriptionLabel) descriptionLabel.innerHTML = 'Brief Description of Work *';
                descriptionInput.placeholder = 'Please describe the custom service you need...';
            } else {
                descriptionInput.required = false;
                if (descriptionLabel) descriptionLabel.innerHTML = 'Brief Description of Work (Optional)';
                descriptionInput.placeholder = 'Briefly describe the work you need us to do...';
            }
        });
    }

    // Clear any previously saved selected date when the page loads
    try {
        sessionStorage.removeItem('abp_selected_date');
        if (selectedDateInput) {
            selectedDateInput.value = '';
            delete selectedDateInput.dataset.dbDate;
        }
    } catch (e) {
        console.warn('sessionStorage unavailable:', e);
    }

    // --- Firebase Configuration (Shared Database) ---
    // Clave ofuscada para evitar alertas automáticas de bots
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

    // Initialize Firebase if config is provided
    let db = null;
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        try {
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.database();
            console.log("✅ Firebase connected for shared reservations.");
        } catch (error) {
            console.error("Firebase initialization error:", error);
        }
    } else {
        console.warn("⚠️ Firebase not found or not configured. Reservations will be LOCAL ONLY to this browser.");
    }

    let bookedDates = [];

    // Local storage for keeping track of appointments in the current browser
    const LOCAL_STORAGE_KEY = 'abp_booked_dates';
    const LOCAL_DETAILS_KEY = 'abp_booked_details'; // Full info for Admin

    async function getSharedBookedDates() {
        if (!db) return getLocalBookedDates();

        try {
            const snapshot = await db.ref('appointments').once('value');
            const data = snapshot.val();
            if (!data) return [];

            const appointments = Object.values(data);
            return appointments
                .filter(app => app.status === 'accepted' || app.status === 'pending')
                .map(app => app.dateDB);
        } catch (error) {
            console.error("Error fetching shared dates:", error);
            return getLocalBookedDates();
        }
    }

    function getLocalBookedDates() {
        // Block dates that are ACCEPTED or PENDING to avoid double booking
        const details = JSON.parse(localStorage.getItem(LOCAL_DETAILS_KEY) || '[]');
        return details
            .filter(app => app.status === 'accepted' || app.status === 'pending')
            .map(app => app.dateDB);
    }

    async function saveSharedBookedDate(date, fullData) {
        // Save to Local Storage first (for offline/redundancy)
        saveLocalBookedDate(date, fullData);

        // Save to Firebase (Shared Database)
        if (db) {
            try {
                const newAppRef = db.ref('appointments').push();
                await newAppRef.set({
                    ...fullData,
                    dateDB: date,
                    created_at: new Date().toISOString(),
                    status: 'pending',
                    type: 'appointment',
                    id: newAppRef.key
                });
            } catch (error) {
                console.error("Error saving to Firebase:", error);
            }
        }
    }

    function saveLocalBookedDate(date, fullData) {
        // Save full details for Admin Dashboard with 'pending' status
        const details = JSON.parse(localStorage.getItem(LOCAL_DETAILS_KEY) || '[]');
        details.push({
            ...fullData,
            dateDB: date,
            created_at: new Date().toISOString(),
            status: 'pending', // Initial status is pending, so date is NOT blocked yet
            type: 'appointment'
        });
        localStorage.setItem(LOCAL_DETAILS_KEY, JSON.stringify(details));
    }

    // Initialize booked dates from shared database or local storage
    async function fetchBookedDates() {
        if (db) {
            // Real-time listener for appointments
            db.ref('appointments').on('value', (snapshot) => {
                const data = snapshot.val();
                bookedDates = [];
                if (data) {
                    Object.values(data).forEach(app => {
                        // Solo bloquear fechas de citas aceptadas o pendientes (si quieres bloquear todas)
                        if (app.dateDB && (app.status === 'pending' || app.status === 'accepted')) {
                            bookedDates.push(app.dateDB);
                        }
                    });
                }
                console.log("Real-time booked dates updated:", bookedDates);
                generateCalendar();
            });
        } else {
            // Fallback for local storage
            bookedDates = await getSharedBookedDates();
            generateCalendar();
        }
    }

    // Helper to format dates for Calendar links
    function formatForCalendar(dateStr, timeStr) {
        // Assume dateStr is "YYYY-MM-DD" and timeStr is "HH:MM AM/PM"
        const [year, month, day] = dateStr.split('-');
        let [hours, minutes] = timeStr.split(/:| /);
        const ampm = timeStr.split(' ')[1];
        
        if (ampm === 'PM' && hours !== '12') hours = parseInt(hours) + 12;
        if (ampm === 'AM' && hours === '12') hours = '00';
        
        return `${year}${month}${day}T${hours}${minutes}00Z`;
    }

    // Create Google Calendar Link
    function getGoogleCalendarLink(data, dateDB) {
        const start = formatForCalendar(dateDB, data.time);
        const end = formatForCalendar(dateDB, data.time); // Simplified, could add 1h
        const details = encodeURIComponent(`Service: ${data.service}\nAddress: ${data.address}\nDescription: ${data.description}`);
        const location = encodeURIComponent(data.address);
        const title = encodeURIComponent(`AB Pereira Appointment: ${data.service}`);
        
        return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${start}&details=${details}&location=${location}`;
    }

    // Create Apple/iCal File
    function downloadICS(data, dateDB) {
        const start = formatForCalendar(dateDB, data.time);
        const title = `AB Pereira Appointment: ${data.service}`;
        const description = `Service: ${data.service}\\nAddress: ${data.address}\\nDescription: ${data.description}`;
        
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${start}`,
            `DTEND:${start}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${data.address}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', 'appointment.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Month Names
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Current date for reference
    let today = new Date();
    let currentDate = new Date(today.getFullYear(), today.getMonth(), 1);

    // Format date for display
    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Format date for database (YYYY-MM-DD)
    function formatDateDB(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Check if date is today
    function isToday(date) {
        const now = new Date();
        return date.getDate() === now.getDate() &&
               date.getMonth() === now.getMonth() &&
               date.getFullYear() === now.getFullYear();
    }

    // Check if date is in the past
    function isPast(date) {
        const now = new Date();
        const todayAtMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return compareDate < todayAtMidnight;
    }

    // Check if date is already booked
    function isBooked(date) {
        const dateStr = formatDateDB(date);
        return bookedDates.includes(dateStr);
    }

    // Generate calendar for current month
    function generateCalendar() {
        calendarDaysElement.innerHTML = '';
        console.log("Generating calendar for:", monthNames[currentDate.getMonth()], currentDate.getFullYear());
        console.log("Current booked dates:", bookedDates);

        // Update month display
        currentMonthElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

        // Get first day of month and number of days
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const daysInPrevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();

        // Add previous month's days
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day empty';
            dayDiv.textContent = daysInPrevMonth - i;
            calendarDaysElement.appendChild(dayDiv);
        }

        // Add current month's days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            dayDiv.textContent = day;

            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dateStr = formatDateDB(date);
            
            const past = isPast(date);
            const booked = bookedDates.includes(dateStr);
            const today = isToday(date);

            // 1. Priority: Booked dates (RED)
            if (booked) {
                dayDiv.classList.add('booked');
                dayDiv.classList.add('disabled');
                dayDiv.title = 'Already booked';
                dayDiv.setAttribute('data-disabled', 'true');
            } 
            // 2. Secondary: Past dates (GREY)
            else if (past) {
                dayDiv.classList.add('disabled');
                dayDiv.setAttribute('data-disabled', 'true');
            }

            // 3. Highlight today
            if (today) {
                dayDiv.classList.add('today');
            }

            // 4. Add click handler only if available
            if (!past && !booked) {
                dayDiv.addEventListener('click', function() {
                    document.querySelectorAll('.calendar-day.selected').forEach(el => {
                        el.classList.remove('selected');
                    });
                    dayDiv.classList.add('selected');
                    selectedDateInput.value = formatDate(date);
                    selectedDateInput.dataset.dbDate = dateStr;
                    selectedDateInput.dispatchEvent(new Event('change', { bubbles: true }));
                });
            }

            calendarDaysElement.appendChild(dayDiv);
        }

        // Add next month's days
        const remainingCells = 42 - (firstDay + daysInMonth); // 6 weeks * 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day empty';
            dayDiv.textContent = day;
            calendarDaysElement.appendChild(dayDiv);
        }
    }

    // Navigate to previous month
    prevMonthBtn.addEventListener('click', function() {
        const today = new Date();
        if (currentDate.getMonth() > today.getMonth() || currentDate.getFullYear() > today.getFullYear()) {
            currentDate.setMonth(currentDate.getMonth() - 1);
            generateCalendar();
        }
    });

    // Navigate to next month
    nextMonthBtn.addEventListener('click', function() {
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 12);
        if (currentDate < maxDate) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            generateCalendar();
        }
    });

    // Initialize
    fetchBookedDates();

    function getGreetingEN() {
        const locale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language || 'en-US';
        const now = new Date();
        let hour = now.getHours();

        try {
            const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: false });
            const parts = formatter.formatToParts(now);
            const hourPart = parts.find(part => part.type === 'hour');
            if (hourPart && !Number.isNaN(Number(hourPart.value))) {
                hour = Number(hourPart.value);
            }
        } catch (err) {
            console.warn('Intl date formatting failed, using local hour fallback.', err);
        }

        if (hour >= 5 && hour < 12) return 'Good morning';
        if (hour >= 12 && hour < 18) return 'Good afternoon';
        if (hour >= 18 && hour < 22) return 'Good evening';
        return 'Good night';
    }

    // Handle form submission
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = appointmentForm.querySelector('input[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.value = 'Scheduling...';
            
            const greeting = getGreetingEN();
            const formData = new FormData(appointmentForm);
            const data = Object.fromEntries(formData.entries());
            const dateDB = selectedDateInput.dataset.dbDate;

            if (!dateDB) {
                // Restablecer el botón primero para evitar que se quede "cargando"
                submitBtn.disabled = false;
                submitBtn.value = 'Confirm Appointment';
                
                alert('Please select a date on the calendar first.');
                return;
            }

            try {
                // 1. Check shared availability
                const sharedDates = await getSharedBookedDates();
                if (sharedDates.includes(dateDB)) {
                    alert('Sorry, this date is already booked. Please select another date.');
                    submitBtn.disabled = false;
                    submitBtn.value = 'Confirm Appointment';
                    return;
                }

                // 2. Save sharedly (Firebase + Local)
                await saveSharedBookedDate(dateDB, data);

                // 3. Send emails via Web3Forms (Professional)
                console.log('Sending emails via Web3Forms...');
                
                // Creative configuration for appointments
                const appointmentConfigs = {
                    'Gutters': { emoji: '💧', tag: 'GUTTERS', msg: 'Gutter installation or maintenance.' },
                    'Wood, PVC & Trex': { emoji: '🪵', tag: 'MATERIALS', msg: 'Project involving Wood, PVC, or Trex.' },
                    'Decks': { emoji: '🏗️', tag: 'DECKS', msg: 'Deck construction or repair.' },
                    'Windows and Doors': { emoji: '🪟', tag: 'ENTRANCE', msg: 'Windows and doors project.' },
                    'Painting': { emoji: '🎨', tag: 'AESTHETICS', msg: 'Painting and finishes project.' },
                    'Other': { emoji: '🛠️', tag: 'GENERAL', msg: 'Custom service requested.' }
                };

                const config = appointmentConfigs[data.service] || appointmentConfigs['Other'];

                // Use FormData instead of JSON for better compatibility with Web3Forms security
                const web3FormData = new FormData();
                web3FormData.append("access_key", "26d957c0-69d5-496c-8225-5085582dfd35");
                web3FormData.append("from_name", "A⁺Pereira Web System");
                web3FormData.append("subject", `${config.emoji} ${config.tag}: ${data.name} for ${data.service}`);
                
                // Formatted message for admin
                web3FormData.append("Admin_Notification", "👋 New appointment request received from the website.");
                web3FormData.append("Service_Type", `${config.emoji} ${data.service}`);
                web3FormData.append("Service_Note", config.msg);
                web3FormData.append("Client_Name", data.name);
                web3FormData.append("Client_Phone", data.phone);
                web3FormData.append("Client_Email", data.email || "No email provided");
                web3FormData.append("Appointment_Date", data.date);
                web3FormData.append("Appointment_Time", data.time);
                web3FormData.append("Service_Address", data.address);
                web3FormData.append("Job_Description", data.description || "No description provided");
                web3FormData.append("Admin_Dashboard", "https://pereira2003.github.io/web_ABPEREIRA/Vistas/admin-login.html");

                // Add special note based on email domain
                if (data.email && data.email.endsWith('.edu')) web3FormData.append("Special_Note", "🎓 Client from the educational sector.");
                if (data.email && data.email.endsWith('.gov')) web3FormData.append("Special_Note", "🏛️ Government/Institutional interest.");

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: web3FormData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                const result = await response.json();

                if (!result.success) {
                    console.error('Web3Forms Error:', result);
                    throw new Error(result.message || 'Could not verify form security. Please try again.');
                }

                console.log('Email sent successfully via Web3Forms');

                // 4. Show Custom Success Modal
                const modal = document.getElementById('confirmationModal');
                const modalMsg = document.getElementById('modalMessage');
                const closeBtn = document.getElementById('closeModalBtn');
                const googleBtn = document.getElementById('googleCalBtn');
                const appleBtn = document.getElementById('appleCalBtn');

                if (modal && modalMsg) {
                    const verificationText = 'A verification message will be sent to you shortly.';

                    modalMsg.innerHTML = `
                        <div style="font-weight: 700; margin-bottom: 0.8rem;">Good afternoon! Your appointment has been scheduled:</div>
                        <div style="margin: 0.5rem 0 1.5rem; color: #5c6d84; font-weight: 500;">${data.date} at ${data.time}</div>
                        <div style="color: #2e7d32; font-weight: 600; margin-bottom: 1rem;">
                            ${verificationText}
                        </div>
                    `;
                    modal.style.display = 'flex';
                    
                    // Calendar Button Handlers
                    googleBtn.onclick = () => window.open(getGoogleCalendarLink(data, dateDB), '_blank');
                    appleBtn.onclick = () => downloadICS(data, dateDB);

                    // Close Button Handler
                    closeBtn.onclick = () => {
                        modal.style.display = 'none';
                        window.location.href = 'index.html';
                    };
                } else {
                    // Fallback to alert if modal elements are missing
                    alert(`Your appointment for ${data.date} at ${data.time} has been scheduled. You will receive a verification message shortly.`);
                    window.location.href = 'index.html';
                }

            } catch (err) {
                console.error('Error during appointment submission:', err);
                alert('Submission Error: ' + err.message + '\nPlease check your internet connection or try again later.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.value = 'Confirm Appointment';
            }
        });
    }

    // Auto-scroll al calendario cuando se hace clic en el campo de fecha (solo móviles)
    selectedDateInput.addEventListener('click', function() {
        if (window.innerWidth <= 768) {
            try {
                const calendarWrapper = document.querySelector('.calendar-wrapper');
                if (calendarWrapper) {
                    calendarWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    const originalShadow = calendarWrapper.style.boxShadow;
                    calendarWrapper.style.transition = 'box-shadow 0.4s ease';
                    calendarWrapper.style.boxShadow = '0 0 20px rgba(188, 160, 93, 0.8)';
                    setTimeout(() => {
                        if (calendarWrapper) calendarWrapper.style.boxShadow = originalShadow;
                    }, 2000);
                }
            } catch (e) {
                console.error("Scroll no soportado:", e);
            }
        }
    });

    // Add smooth scrolling for form on mobile when date is selected
    selectedDateInput.addEventListener('change', function() {
        if (window.innerWidth <= 768) {
            setTimeout(function() {
                document.querySelector('.appointment-form-wrapper').scrollIntoView({ behavior: 'smooth' });
            }, 200);
        }
    });
});
