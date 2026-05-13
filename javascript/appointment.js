// Calendar and Appointment Booking Script
document.addEventListener('DOMContentLoaded', function() {
    const calendarDaysElement = document.getElementById('calendarDays');
    const currentMonthElement = document.getElementById('currentMonth');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const selectedDateInput = document.getElementById('selected-date');
    const appointmentForm = document.querySelector('.appointment-form');
    const formStatus = document.getElementById('form-status');

    let bookedDates = [];

    // Local storage for keeping track of appointments in the current browser
    const LOCAL_STORAGE_KEY = 'abp_booked_dates';
    const LOCAL_DETAILS_KEY = 'abp_booked_details'; // Full info for Admin

    function getLocalBookedDates() {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function saveLocalBookedDate(date, fullData) {
        // Save date for calendar blocking
        const dates = getLocalBookedDates();
        if (!dates.includes(date)) {
            dates.push(date);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dates));
        }

        // Save full details for Admin Dashboard
        const details = JSON.parse(localStorage.getItem(LOCAL_DETAILS_KEY) || '[]');
        details.push({
            ...fullData,
            dateDB: date, // Keep original format for deletion
            created_at: new Date().toISOString(),
            status: 'pending' // Default status
        });
        localStorage.setItem(LOCAL_DETAILS_KEY, JSON.stringify(details));
        console.log('Saved appointment details to localStorage:', LOCAL_DETAILS_KEY);
    }

    // Initialize booked dates from local storage
    function fetchBookedDates() {
        bookedDates = getLocalBookedDates();

        // FORCED CLEANUP: Ensure 12-15 are available (Run once)
        const datesToFree = ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15'];
        if (bookedDates.some(d => datesToFree.includes(d))) {
            bookedDates = bookedDates.filter(d => !datesToFree.includes(d));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(bookedDates));
            
            let details = JSON.parse(localStorage.getItem(LOCAL_DETAILS_KEY) || '[]');
            details = details.filter(app => !datesToFree.includes(app.dateDB));
            localStorage.setItem(LOCAL_DETAILS_KEY, JSON.stringify(details));
        }

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
        const todayDate = new Date();
        return date.getDate() === todayDate.getDate() &&
               date.getMonth() === todayDate.getMonth() &&
               date.getFullYear() === todayDate.getFullYear();
    }

    // Check if date is in the past
    function isPast(date) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        date.setHours(0, 0, 0, 0);
        return date < todayDate;
    }

    // Check if date is already booked
    function isBooked(date) {
        const dateStr = formatDateDB(date);
        return bookedDates.includes(dateStr);
    }

    // Generate calendar for current month
    function generateCalendar() {
        calendarDaysElement.innerHTML = '';

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

            // Check if it's past date or already booked
            if (isPast(date) || isBooked(date)) {
                dayDiv.classList.add('disabled');
                dayDiv.setAttribute('data-disabled', 'true');
                if (isBooked(date)) {
                    dayDiv.title = 'Already booked';
                    dayDiv.classList.add('booked');
                }
            } else {
                // Check if it's today
                if (isToday(date)) {
                    dayDiv.classList.add('today');
                }

                // Add click handler for available dates
                dayDiv.addEventListener('click', function() {
                    // Remove previous selection
                    document.querySelectorAll('.calendar-day.selected').forEach(el => {
                        el.classList.remove('selected');
                    });

                    // Add selection to clicked day
                    dayDiv.classList.add('selected');

                    // Update input with selected date
                    selectedDateInput.value = formatDate(date);
                    selectedDateInput.dataset.dbDate = formatDateDB(date);

                    // Trigger change event for form validation
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
                // 1. Check local availability
                const localDates = getLocalBookedDates();
                if (localDates.includes(dateDB)) {
                    alert('Sorry, this date is already booked. Please select another date.');
                    submitBtn.disabled = false;
                    submitBtn.value = 'Confirm Appointment';
                    return;
                }

                // 2. Save locally
                saveLocalBookedDate(dateDB, data);

                // 3. Send emails via Web3Forms (Professional)
                console.log('Sending emails via Web3Forms...');
                
                // Clean data for Web3Forms
                const web3Data = {
                    access_key: "0e8b41ce-71f9-492a-a031-14d33271f723",
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

                // 4. Success!
                alert(`this date and this reservation: ${data.date} at ${data.time}`);
                
                // 5. Automatic Calendar Actions (without confirmation)
                // Open Google Calendar in new tab
                window.open(getGoogleCalendarLink(data, dateDB), '_blank');
                // Download ICS for Apple/iCal
                downloadICS(data, dateDB);

                // 6. Redirect to Home immediately after the alert is closed
                window.location.href = 'index.html';

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
