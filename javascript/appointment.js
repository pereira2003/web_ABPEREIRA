// Calendar and Appointment Booking Script
document.addEventListener('DOMContentLoaded', function() {
    const calendarDaysElement = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateInput = document.getElementById('selected-date');
    const appointmentForm = document.querySelector('.appointment-form');
    const formStatus = document.getElementById('form-status');

    // --- Firebase Configuration (Shared Database) ---
    // You need to create a project in Firebase Console (https://console.firebase.google.com/)
    // and paste your configuration here.
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Initialize Firebase if config is provided
    let db = null;
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        console.log("✅ Firebase connected for shared reservations.");
    } else {
        console.warn("⚠️ Firebase not configured. Reservations will be LOCAL ONLY to this browser.");
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
            status: 'pending' // Initial status is pending, so date is NOT blocked yet
        });
        localStorage.setItem(LOCAL_DETAILS_KEY, JSON.stringify(details));
    }

    // Initialize booked dates from shared database or local storage
    async function fetchBookedDates() {
        bookedDates = await getSharedBookedDates();
        console.log("Booked dates loaded:", bookedDates);
        generateCalendar();
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

    // Handle form submission
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = appointmentForm.querySelector('input[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.value = 'Scheduling...';
            
            const formData = new FormData(appointmentForm);
            const data = Object.fromEntries(formData.entries());
            const dateDB = selectedDateInput.dataset.dbDate;

            if (!dateDB) {
                alert('Please select a date on the calendar first.');
                submitBtn.disabled = false;
                submitBtn.value = 'Confirm Appointment';
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
                
                // Clean data for Web3Forms
                const web3Data = {
                    access_key: "26d957c0-69d5-496c-8225-5085582dfd35",
                    from_name: "A+Pereira Company",
                    subject: `🛠️ NEW APPOINTMENT: ${data.name} - ${data.date}`,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    service: data.service,
                    date: data.date,
                    time: data.time,
                    address: data.address,
                    description: data.description
                };

                const response = await fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(web3Data)
                });

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || 'Unknown Web3Forms error');
                }

                console.log('Email sent successfully via Web3Forms');

                // 4. Show Custom Success Modal
                const modal = document.getElementById('confirmationModal');
                const modalMsg = document.getElementById('modalMessage');
                const closeBtn = document.getElementById('closeModalBtn');
                const googleBtn = document.getElementById('googleCalBtn');
                const appleBtn = document.getElementById('appleCalBtn');

                if (modal && modalMsg) {
                    modalMsg.innerHTML = `<strong>this date and this reservation:</strong><br>${data.date} at ${data.time}<br><br><span style="color: #2e7d32; font-weight: 600;">Su cita ya fue agendada, recibirá una verificación a su correo.</span>`;
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
                    alert(`this date and this reservation: ${data.date} at ${data.time}\n\nSu cita ya fue agendada, recibirá una verificación a su correo.`);
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

    // Add smooth scrolling for form on mobile when date is selected
    selectedDateInput.addEventListener('change', function() {
        if (window.innerWidth <= 768) {
            setTimeout(function() {
                document.querySelector('.appointment-form-wrapper').scrollIntoView({ behavior: 'smooth' });
            }, 200);
        }
    });
});
