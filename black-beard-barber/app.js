/* ==========================================================================
   APP.JS - BLACK BEARD BARBER ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Navigation
    initNavigation();

    // Initialize Booking Engine
    initBookingEngine();
});

/* ==========================================================================
   NAVIGATION ENGINE
   ========================================================================== */
function initNavigation() {
    const header = document.querySelector('header');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-drawer .nav-link');

    // Scroll Effect (Sticky Header)
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Navigation Drawer Toggle
    function toggleMobileNav() {
        mobileMenuToggle.classList.toggle('open');
        mobileNavDrawer.classList.toggle('open');
        mobileNavOverlay.classList.toggle('open');
        document.body.classList.toggle('mobile-nav-active');
    }

    mobileMenuToggle.addEventListener('click', toggleMobileNav);
    mobileNavOverlay.addEventListener('click', toggleMobileNav);

    // Smooth Scroll & Drawer Close
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (mobileNavDrawer.classList.contains('open')) {
                toggleMobileNav();
            }

            if (targetSection) {
                const headerOffset = 80;
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ==========================================================================
   BOOKING SYSTEM STATE & LOGIC
   ========================================================================== */
function initBookingEngine() {
    // Services Database
    const services = {
        'corte': { name: 'Corte Masculino', price: 35.00, emoji: '✂️' },
        'barba': { name: 'Barba', price: 25.00, emoji: '🧔' },
        'corte-barba': { name: 'Corte + Barba', price: 55.00, emoji: '🔥' },
        'sobrancelha': { name: 'Sobrancelha', price: 15.00, emoji: '💈' },
        'combo-premium': { name: 'Corte + Barba + Sobrancelha', price: 65.00, emoji: '👑' }
    };

    // Barbers Database
    const barbers = {
        'joao': { name: 'João Silva', role: 'Cortes Modernos' },
        'lucas': { name: 'Lucas Santos', role: 'Barba' },
        'matheus': { name: 'Matheus Oliveira', role: 'Degradê' }
    };

    // Wizard State
    let bookingState = {
        currentStep: 1,
        service: null,
        barber: null,
        date: null,     // Date object
        time: null,     // String (HH:MM)
        name: '',
        whatsapp: ''
    };

    // DOM Selectors
    const stepScreens = document.querySelectorAll('.booking-step-screen');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const serviceItems = document.querySelectorAll('.booking-service-item');
    const barberCards = document.querySelectorAll('.booking-barber-card');
    const timeSlotsGrid = document.getElementById('time-slots-grid');
    const daysListContainer = document.getElementById('booking-days-list');
    const inputName = document.getElementById('client-name');
    const inputPhone = document.getElementById('client-whatsapp');

    // Phone mask (auto format while typing: (XX) XXXXX-XXXX)
    inputPhone.addEventListener('input', (e) => {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    // Service Select Handling (Inside Booking Widget)
    serviceItems.forEach(item => {
        item.addEventListener('click', () => {
            serviceItems.forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            bookingState.service = item.dataset.service;
            validateStep();
        });
    });

    // Barber Select Handling
    barberCards.forEach(card => {
        card.addEventListener('click', () => {
            barberCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            bookingState.barber = card.dataset.barber;
            validateStep();
        });
    });

    // Quick Book Buttons (From Landing Page Services cards and Hero CTAs)
    const quickBookBtn = document.querySelectorAll('.quick-book');
    quickBookBtn.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceKey = btn.dataset.service;
            
            // Scroll to Booking Section
            const bookingSection = document.getElementById('agendamento');
            const headerOffset = 80;
            const elementPosition = bookingSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });

            // Reset Wizard to Step 1
            goToStep(1);

            // Select Service
            if (serviceKey && services[serviceKey]) {
                const targetServiceItem = document.querySelector(`.booking-service-item[data-service="${serviceKey}"]`);
                if (targetServiceItem) {
                    targetServiceItem.click();
                    // Auto-advance to Step 2 for better premium user experience
                    setTimeout(() => {
                        goToStep(2);
                    }, 300);
                }
            }
        });
    });

    // Helper: Generate Next 7 Valid Working Days (Excluding Sunday)
    function generateDays() {
        daysListContainer.innerHTML = '';
        const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        let daysGenerated = 0;
        let currentDate = new Date();

        while (daysGenerated < 7) {
            // Check day of week
            const dayOfWeek = currentDate.getDay();
            
            // Skip Sunday
            if (dayOfWeek !== 0) {
                const dayCard = document.createElement('div');
                dayCard.className = 'day-card';
                // Store date details
                const dateCopy = new Date(currentDate);
                
                dayCard.innerHTML = `
                    <span class="day-week">${weekdays[dayOfWeek]}</span>
                    <span class="day-month">${String(dateCopy.getDate()).padStart(2, '0')}</span>
                `;

                // If this is the currently selected date, highlight it
                if (bookingState.date && bookingState.date.toDateString() === dateCopy.toDateString()) {
                    dayCard.classList.add('selected');
                }

                dayCard.addEventListener('click', () => {
                    document.querySelectorAll('.day-card').forEach(d => d.classList.remove('selected'));
                    dayCard.classList.add('selected');
                    bookingState.date = dateCopy;
                    validateStep();
                });

                daysListContainer.appendChild(dayCard);
                daysGenerated++;
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    // Custom Time Slots Handler
    function initTimeSlots() {
        const timeSlots = [
            '09:00', '09:30', '10:00', '10:30', '11:00', 
            '14:00', '14:30', '15:00', '15:30', '16:00', '17:00', '18:00'
        ];
        
        timeSlotsGrid.innerHTML = '';
        timeSlots.forEach(time => {
            const slot = document.createElement('div');
            slot.className = 'time-slot';
            slot.textContent = time;

            if (bookingState.time === time) {
                slot.classList.add('selected');
            }

            slot.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
                slot.classList.add('selected');
                bookingState.time = time;
                validateStep();
            });

            timeSlotsGrid.appendChild(slot);
        });
    }

    // Step Nav Button Event Listeners
    btnPrev.addEventListener('click', () => {
        if (bookingState.currentStep > 1) {
            goToStep(bookingState.currentStep - 1);
        }
    });

    btnNext.addEventListener('click', () => {
        if (bookingState.currentStep < 5) {
            if (validateStep(true)) {
                if (bookingState.currentStep === 4) {
                    // Save form fields
                    bookingState.name = inputName.value.trim();
                    bookingState.whatsapp = inputPhone.value.trim();
                    // Generate final summary
                    renderReceipt();
                }
                goToStep(bookingState.currentStep + 1);
            }
        }
    });

    // Handle wizard step changing
    function goToStep(stepNum) {
        // Toggle active screen
        stepScreens.forEach(screen => screen.classList.remove('active'));
        document.getElementById(`step-${stepNum}`).classList.add('active');

        // Update Stepper Headers
        stepIndicators.forEach((indicator, index) => {
            const indicatorStep = index + 1;
            indicator.classList.remove('active', 'completed');
            
            if (indicatorStep === stepNum) {
                indicator.classList.add('active');
            } else if (indicatorStep < stepNum) {
                indicator.classList.add('completed');
            }
        });

        bookingState.currentStep = stepNum;

        // Perform layout adjustments depending on step
        if (stepNum === 3) {
            generateDays();
            initTimeSlots();
        }

        // Show/Hide buttons
        if (stepNum === 1) {
            btnPrev.style.visibility = 'hidden';
        } else {
            btnPrev.style.visibility = 'visible';
        }

        if (stepNum === 5) {
            btnNext.style.display = 'none';
        } else {
            btnNext.style.display = 'inline-flex';
        }

        validateStep();
    }

    // Step Validations
    function validateStep(showAlert = false) {
        let isValid = false;

        switch (bookingState.currentStep) {
            case 1:
                isValid = bookingState.service !== null;
                break;
            case 2:
                isValid = bookingState.barber !== null;
                break;
            case 3:
                isValid = bookingState.date !== null && bookingState.time !== null;
                break;
            case 4:
                const nameOk = inputName.value.trim().length >= 3;
                const phoneDigits = inputPhone.value.replace(/\D/g, '');
                const phoneOk = phoneDigits.length >= 10;
                isValid = nameOk && phoneOk;
                
                if (!isValid && showAlert) {
                    if (!nameOk) alert('Por favor, informe seu nome completo.');
                    else if (!phoneOk) alert('Por favor, informe um número de WhatsApp válido.');
                }
                break;
            case 5:
                isValid = true;
                break;
        }

        btnNext.disabled = !isValid;
        return isValid;
    }

    // Inputs focus validation trigger
    inputName.addEventListener('keyup', () => validateStep());
    inputPhone.addEventListener('keyup', () => validateStep());

    // Generate summary card contents (Receipt Layout)
    function renderReceipt() {
        const selectedService = services[bookingState.service];
        const selectedBarber = barbers[bookingState.barber];
        
        // Format Date
        const day = String(bookingState.date.getDate()).padStart(2, '0');
        const month = String(bookingState.date.getMonth() + 1).padStart(2, '0');
        const year = bookingState.date.getFullYear();
        const dateStr = `${day}/${month}/${year}`;

        // Format Price
        const priceStr = `R$ ${selectedService.price.toFixed(2).replace('.', ',')}`;

        // Update elements
        document.getElementById('receipt-service').textContent = `${selectedService.emoji} ${selectedService.name}`;
        document.getElementById('receipt-barber').textContent = selectedBarber.name;
        document.getElementById('receipt-date').textContent = dateStr;
        document.getElementById('receipt-time').textContent = bookingState.time; // highlighted time
        document.getElementById('receipt-price').textContent = priceStr;
        document.getElementById('receipt-client').textContent = bookingState.name;

        // WhatsApp Confirmation Handler
        const btnWhatsapp = document.getElementById('btn-whatsapp-confirm');
        
        btnWhatsapp.addEventListener('click', () => {
            const phoneNumber = '557998248239'; // Demo number
            
            // Format message
            const message = `Olá Black Beard Barber! Gostaria de confirmar meu agendamento:

✂️ *SERVIÇO*: ${selectedService.name}
🧔 *BARBEIRO*: ${selectedBarber.name}
📅 *DATA*: ${dateStr}
⏰ *HORÁRIO*: ${bookingState.time}
💵 *VALOR*: ${priceStr}

👤 *CLIENTE*: ${bookingState.name}
📱 *WHATSAPP*: ${bookingState.whatsapp}

_Enviado pelo sistema de agendamento online._`;

            const encodedText = encodeURIComponent(message);
            const waUrl = `https://wa.me/${phoneNumber}?text=${encodedText}`;
            
            // Open Link
            window.open(waUrl, '_blank');
        });
    }

    // Set initial layout state
    goToStep(1);
}
