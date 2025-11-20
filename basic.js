// Global variables
let currentParking = null;
let parkingTimer = null;
let parkingStartTime = null;
let hourlyRate = 2.50;
let walletBalance = 150.00;
let bookedSlots = new Set(); // Track booked slots globally

// Rental variables
let rentalSlots = new Map(); // Track rental slots globally
let selectedRentalSlot = null;
let rentalRates = {
    daily: 100,
    weekly: 600,
    monthly: 2500
};

// DOM elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const parkingGrid = document.getElementById('parkingGrid');
const timerDisplay = document.getElementById('timerDisplay');
const currentCharge = document.getElementById('currentCharge');
const walletBalanceDisplay = document.getElementById('walletBalance');
const walletDisplayBalance = document.getElementById('walletDisplayBalance');
const totalSlots = document.getElementById('totalSlots');
const availableSlots = document.getElementById('availableSlots');
const occupiedSlots = document.getElementById('occupiedSlots');
const transactionList = document.getElementById('transactionList');
const bookingsList = document.getElementById('bookingsList');
const vehiclesList = document.getElementById('vehiclesList');

// Rental DOM elements
const rentalGrid = document.getElementById('rentalGrid');
const rentalForm = document.getElementById('rentalForm');
const rentalsList = document.getElementById('rentalsList');
const rentalSlot = document.getElementById('rentalSlot');
const rentalDuration = document.getElementById('rentalDuration');
const startDate = document.getElementById('startDate');
const rentalVehicleNumber = document.getElementById('rentalVehicleNumber');
const contactNumber = document.getElementById('contactNumber');
const summarySlot = document.getElementById('summarySlot');
const summaryDuration = document.getElementById('summaryDuration');
const summaryCost = document.getElementById('summaryCost');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    generateParkingGrid();
    generateRentalGrid();
    loadSampleData();

    // Restore theme preference
    const savedTheme = localStorage.getItem('themePreference');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const toggle = document.getElementById('themeToggle');
        if (toggle) toggle.textContent = 'Light mode';
    }
});

// Initialize application
function initializeApp() {
    updateWalletDisplay();
    updateParkingStats();
    showNotification('Welcome to SmartPark!', 'success');
    
    // Setup bidirectional balance synchronization
    setupBalanceSynchronization();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = link.getAttribute('href').substring(1);
            showSection(targetSection);
            updateActiveNav(link);
        });
    });

    // Forms
    document.getElementById('bookingForm').addEventListener('submit', handleBooking);
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
    document.getElementById('addFundsForm').addEventListener('submit', handleAddFunds);
    document.getElementById('rentalForm').addEventListener('submit', handleRental);

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            const isDark = document.body.classList.contains('dark');
            localStorage.setItem('themePreference', isDark ? 'dark' : 'light');
            themeToggle.textContent = isDark ? 'Light mode' : 'Dark mode';
        });
    }

    // Vehicle filter checkboxes
    ['car', 'bike', 'ev'].forEach(id => {
        const cb = document.getElementById(id);
        if (cb) {
            cb.addEventListener('change', filterSlots);
        }
    });

    // Rental filter checkboxes
    ['rentalCar', 'rentalBike', 'rentalEv'].forEach(id => {
        const cb = document.getElementById(id);
        if (cb) {
            cb.addEventListener('change', filterRentalSlots);
        }
    });

    // Rental duration radio buttons
    document.querySelectorAll('input[name="duration"]').forEach(radio => {
        radio.addEventListener('change', updateRentalSummary);
    });

    // Rental form field listeners
    if (rentalDuration) {
        rentalDuration.addEventListener('change', updateRentalSummary);
    }

    // Autosave: Booking form
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        const bookingFields = ['location','date','startTime','duration','vehicleNumber'];
        bookingFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const key = `autosave_booking_${id}`;
                const saved = localStorage.getItem(key);
                if (saved !== null) el.value = saved;
                el.addEventListener('input', () => localStorage.setItem(key, el.value));
            }
        });
    }

    // Autosave: Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        const profileFields = ['fullName','email','phone','address'];
        profileFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const key = `autosave_profile_${id}`;
                const saved = localStorage.getItem(key);
                if (saved !== null) el.value = saved;
                el.addEventListener('input', () => localStorage.setItem(key, el.value));
            }
        });
    }

    // Autosave: Rental form
    if (rentalForm) {
        const rentalFields = ['rentalSlot','rentalDuration','startDate','rentalVehicleNumber','contactNumber'];
        rentalFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const key = `autosave_rental_${id}`;
                const saved = localStorage.getItem(key);
                if (saved !== null) el.value = saved;
                el.addEventListener('input', () => localStorage.setItem(key, el.value));
                if (el.tagName === 'SELECT') {
                    el.addEventListener('change', () => localStorage.setItem(key, el.value));
                }
            }
        });
    }
}

// Navigation functions
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}
function updateActiveNav(activeLink) {
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Parking functions
function generateParkingGrid() {
    const totalSlotsCount = 50;
    const occupiedCount = 15;
    const bookedCount = 5;
    const vehicleTypes = ['car', 'bike', 'ev'];

    parkingGrid.innerHTML = ''; // Clear existing slots if any
    bookedSlots.clear();

    for (let i = 1; i <= totalSlotsCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'parking-slot';
        slot.dataset.slotNumber = i;
        slot.textContent = `A-${i.toString().padStart(2, '0')}`;

        // Assign vehicle type class cyclically for demonstration
        const vehicleType = vehicleTypes[i % vehicleTypes.length];
        slot.classList.add(vehicleType);

        if (i <= occupiedCount) {
            slot.classList.add('occupied');
        } else if (i <= occupiedCount + bookedCount) {
            slot.classList.add('booked');
            bookedSlots.add(i); // mark booked globally
        } else {
            slot.classList.add('available');
        }

        slot.addEventListener('click', () => handleSlotClick(slot, i));
        parkingGrid.appendChild(slot);
    }

    filterSlots(); // Apply filter initially to hide booked/occupied slots or based on any selected filters
}

// Filter parking slots based on selected vehicle checkboxes and show/hide booked or occupied slots
function filterSlots() {
    const vehicleCheckboxes = ['car', 'bike', 'ev'].map(id => document.getElementById(id)).filter(Boolean);
    const selectedVehicles = vehicleCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.id);

    const slots = document.querySelectorAll('.parking-slot');

    slots.forEach(slot => {
        const slotNumber = parseInt(slot.dataset.slotNumber, 10);
        const isBooked = slot.classList.contains('booked');
        const isOccupied = slot.classList.contains('occupied');
        const vehicleType = ['car', 'bike', 'ev'].find(type => slot.classList.contains(type));

        const matchesFilter = selectedVehicles.length === 0 || selectedVehicles.includes(vehicleType);

        if (matchesFilter && !isBooked && !isOccupied) {
            slot.style.display = 'flex';
        } else {
            slot.style.display = 'none';
        }
    });
}

// Handle slot click to start parking and update dashboard/timer
function handleSlotClick(slot, slotNumber) {
    if (slot.classList.contains('occupied') || slot.classList.contains('booked')) {
        showNotification('This slot is currently unavailable', 'error');
        return;
    }

    // Start parking on this slot
    startParking(slot, slotNumber);

    // Mark slot as booked since parking started
    slot.classList.remove('available');
    slot.classList.add('booked');
    bookedSlots.add(slotNumber);

    showNotification(`Parking started at slot A-${slotNumber.toString().padStart(2, '0')}!`, 'success');

    // Update slot filter to hide booked slots after booking
    filterSlots();
}

function startParking(slot, slotNumber) {
    currentParking = {
        slot: slot,
        slotNumber: slotNumber,
        startTime: new Date()
    };

    parkingStartTime = currentParking.startTime;
    slot.classList.remove('available');
    slot.classList.add('occupied');

    // Start timer
    startParkingTimer();

    showNotification(`Parking started at slot A-${slotNumber.toString().padStart(2, '0')}`, 'success');
    showSection('dashboard');
}

function startParkingTimer() {
    if (parkingTimer) clearInterval(parkingTimer);

    parkingTimer = setInterval(() => {
        if (!parkingStartTime) return;

        const now = new Date();
        const diff = now - parkingStartTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Calculate current charge
        const currentHours = diff / (1000 * 60 * 60);
        const charge = (currentHours * hourlyRate).toFixed(2);
        currentCharge.textContent = charge;

        addStopParkingButton();
    }, 1000);
}

function stopParking() {
    if (!currentParking) return;

    const endTime = new Date();
    const duration = (endTime - parkingStartTime) / (1000 * 60 * 60);
    const totalCharge = (duration * hourlyRate).toFixed(2);

    // Update wallet
    walletBalance -= parseFloat(totalCharge);
    updateWalletDisplay();

    // Add transaction
    addTransaction('Parking Fee', -parseFloat(totalCharge), 'debit');

    // Reset parking slot classes
    currentParking.slot.classList.remove('occupied');
    currentParking.slot.classList.add('available');

    // Also remove booked mark so slot becomes bookable again
    const slotNumber = currentParking.slotNumber;
    if (bookedSlots.has(slotNumber)) {
        bookedSlots.delete(slotNumber);
        currentParking.slot.classList.remove('booked');
    }

    if (parkingTimer) {
        clearInterval(parkingTimer);
        parkingTimer = null;
    }

    timerDisplay.textContent = '00:00:00';
    currentCharge.textContent = '0.00';
    currentParking = null;
    parkingStartTime = null;

    showNotification(`Parking ended. Total charge: ₹${totalCharge}`, 'success');

    // Refresh filter to show freed slot
    filterSlots();
}

function updateWalletDisplay() {
    // Check for updated wallet balance from localStorage (set by Razorpay payment page)
    const storedBalance = localStorage.getItem('walletBalance');
    if (storedBalance) {
        walletBalance = parseFloat(storedBalance);
        // Don't remove from localStorage - keep it for sync
    }
    
    walletBalanceDisplay.textContent = walletBalance.toFixed(2);
    walletDisplayBalance.textContent = walletBalance.toFixed(2);
    
    // Store current balance in localStorage for other pages
    localStorage.setItem('walletBalance', walletBalance.toString());
}

// Setup comprehensive balance synchronization
function setupBalanceSynchronization() {
    // Listen for wallet balance updates from payment page
    window.addEventListener('message', function(event) {
        if (event.data.type === 'WALLET_UPDATED') {
            walletBalance = event.data.newBalance;
            updateWalletDisplay();
            
            // Add transaction to history if it's a payment
            if (event.data.transactionType === 'credit') {
                addTransaction('Wallet Recharge', event.data.amount, 'credit');
            }
            
            showNotification(`Balance updated: ₹${event.data.newBalance}`, 'success');
        }
    });

    // Listen for storage changes (when payment page updates localStorage)
    window.addEventListener('storage', function(event) {
        if (event.key === 'walletBalance' && event.newValue) {
            const newBalance = parseFloat(event.newValue);
            if (newBalance !== walletBalance) {
                walletBalance = newBalance;
                updateWalletDisplay();
            }
        }
    });

    // Listen for custom balance update events
    window.addEventListener('balanceUpdated', function(event) {
        const { newBalance, transactionType, amount } = event.detail;
        walletBalance = newBalance;
        updateWalletDisplay();
        
        if (transactionType === 'credit') {
            addTransaction('Wallet Recharge', amount, 'credit');
        }
    });

    // Periodic balance sync (every 3 seconds)
    setInterval(() => {
        const storedBalance = localStorage.getItem('walletBalance');
        if (storedBalance) {
            const newBalance = parseFloat(storedBalance);
            if (newBalance !== walletBalance) {
                walletBalance = newBalance;
                updateWalletDisplay();
            }
        }
    }, 3000);
}

// Enhanced addTransaction function with balance tracking
function addTransaction(description, amount, type) {
    const transaction = {
        id: Date.now(),
        description,
        amount,
        type,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        balanceAfter: walletBalance
    };

    const transactionItem = document.createElement('div');
    transactionItem.className = 'transaction-item';
    transactionItem.innerHTML = `
        <div>
            <div><strong>${description}</strong></div>
            <div style="font-size: 0.9rem; color: #666;">${transaction.date} ${transaction.time}</div>
        </div>
        <div class="transaction-amount ${type}">
            ${type === 'credit' ? '+' : ''}₹${Math.abs(amount).toFixed(2)}
        </div>
    `;

    transactionList.appendChild(transactionItem);

    // Store transaction in localStorage for persistence
    const existingTransactions = JSON.parse(localStorage.getItem('appTransactions') || '[]');
    existingTransactions.push(transaction);
    localStorage.setItem('appTransactions', JSON.stringify(existingTransactions));

    // Notify payment page if it's open
    if (window.open && window.open.location && window.open.location.href.includes('designthinking.html')) {
        window.open.postMessage({
            type: 'BALANCE_UPDATED',
            newBalance: walletBalance,
            transaction: transaction
        }, '*');
    }
}

// This function is now replaced by the enhanced version above

function showAddFundsModal() {
	window.location.href = 'designthinking.html';
}

function closeModal() {
    document.getElementById('addFundsModal').style.display = 'none';
}

function handleAddFunds(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('amount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (amount < 10) {
        showNotification('Minimum amount is ₹10', 'error');
        return;
    }

    setTimeout(() => {
        walletBalance += amount;
        updateWalletDisplay();
        addTransaction('Wallet Recharge', amount, 'credit');
        closeModal();
        document.getElementById('addFundsForm').reset();
        showNotification(`₹${amount} added to wallet successfully!`, 'success');
    }, 2000);
}

function handleBooking(e) {
    e.preventDefault();

    const location = document.getElementById('location').value;
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;
    const vehicleNumber = document.getElementById('vehicleNumber').value;

    if (!location || !date || !startTime || !duration || !vehicleNumber) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    const cost = (parseFloat(duration) * hourlyRate).toFixed(2);

    if (walletBalance < parseFloat(cost)) {
        showNotification('Insufficient wallet balance', 'error');
        return;
    }

    walletBalance -= parseFloat(cost);
    updateWalletDisplay();

    addTransaction(`Pre-booking: ${location}`, -parseFloat(cost), 'debit');
    addBookingToList({ location, date, startTime, duration, vehicleNumber, cost: parseFloat(cost) });

    document.getElementById('bookingForm').reset();
    // Clear autosave for booking
    ['location','date','startTime','duration','vehicleNumber'].forEach(id => localStorage.removeItem(`autosave_booking_${id}`));
    showNotification(`Booking confirmed! Cost: ₹${cost}`, 'success');
}

function addBookingToList(booking) {
    const bookingItem = document.createElement('div');
    bookingItem.className = 'transaction-item';
    bookingItem.innerHTML = `
        <div>
            <div><strong>${booking.location} - ${booking.vehicleNumber}</strong></div>
            <div style="font-size: 0.9rem; color: #666;">
                ${booking.date} at ${booking.startTime} (${booking.duration}h)
            </div>
        </div>
        <div style="color: #2ed573; font-weight: bold;">
            ₹${booking.cost}
        </div>
    `;
    bookingsList.appendChild(bookingItem);
}

function handleProfileUpdate(e) {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value;
    document.getElementById('userName').textContent = fullName;
    showNotification('Profile updated successfully!', 'success');
    // Clear autosave for profile after successful update
    ['fullName','email','phone','address'].forEach(id => localStorage.removeItem(`autosave_profile_${id}`));
}

function updateParkingStats() {
    const total = 50;
    const occupied = 15;
    const available = total - occupied;
    totalSlots.textContent = total;
    occupiedSlots.textContent = occupied;
    availableSlots.textContent = available;
}

function loadSampleData() {
    addTransaction('Initial Balance', 150.00, 'credit');
    addVehicleToList('ABC-1234', 'Toyota Camry', '2020');
    addVehicleToList('XYZ-5678', 'Honda Civic', '2019');
}

function addVehicleToList(number, model, year) {
    const vehicleItem = document.createElement('div');
    vehicleItem.className = 'vehicle-item';
    vehicleItem.innerHTML = `
        <div>
            <div><strong>${number}</strong></div>
            <div style="font-size: 0.9rem; color: #666;">${model} (${year})</div>
        </div>
        <button class="btn-secondary" onclick="removeVehicle(this)">Remove</button>
    `;
    vehiclesList.appendChild(vehicleItem);
}

function removeVehicle(button) {
    button.parentElement.remove();
    showNotification('Vehicle removed', 'info');
}

function addVehicle() {
    const number = prompt('Enter vehicle number:');
    const model = prompt('Enter vehicle model:');
    const year = prompt('Enter vehicle year:');
    if (number && model && year) {
        addVehicleToList(number, model, year);
        showNotification('Vehicle added successfully!', 'success');
    }
}

function findParking() {
    showSection('parking');
    showNotification('Use the parking map to find available slots', 'info');
}

function preBookSlot() {
    showSection('bookings');
    showNotification('Fill the form to pre-book a parking slot', 'info');
}

function viewHistory() {
    showNotification('Transaction history is displayed in the Wallet section', 'info');
}

function addFunds() {
	window.location.href = 'designthinking.html';
}

function showWithdrawModal() {
    showNotification('Withdrawal feature coming soon!', 'info');
}

function handleLogout() {
        window.location.href='index.html'
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function addStopParkingButton() {
    if (currentParking) {
        const dashboardCard = document.querySelector('.dashboard-grid .card:first-child');
        if (!dashboardCard.querySelector('.btn-stop-parking')) {
            const stopButton = document.createElement('button');
            stopButton.className = 'btn-primary btn-stop-parking';
            stopButton.textContent = 'Stop Parking';
            stopButton.onclick = stopParking;
            dashboardCard.appendChild(stopButton);
        }
    }
}

// Rental Functions
function generateRentalGrid() {
    const totalSlotsCount = 50;
    const occupiedCount = 15;
    const rentedCount = 5;
    const vehicleTypes = ['car', 'bike', 'ev'];

    if (!rentalGrid) return;

    rentalGrid.innerHTML = '';
    rentalSlots.clear();

    for (let i = 1; i <= totalSlotsCount; i++) {
        const slot = document.createElement('div');
        slot.className = 'rental-slot';
        slot.dataset.slotNumber = i;
        slot.textContent = `A-${i.toString().padStart(2, '0')}`;

        // Assign vehicle type class cyclically for demonstration
        const vehicleType = vehicleTypes[i % vehicleTypes.length];
        slot.classList.add(vehicleType);

        if (i <= occupiedCount) {
            slot.classList.add('occupied');
            rentalSlots.set(i, { status: 'occupied', type: vehicleType });
        } else if (i <= occupiedCount + rentedCount) {
            slot.classList.add('rented');
            rentalSlots.set(i, { status: 'rented', type: vehicleType, rentalData: generateSampleRentalData(i) });
        } else {
            slot.classList.add('available-for-rental');
            rentalSlots.set(i, { status: 'available', type: vehicleType });
        }

        slot.addEventListener('click', () => handleRentalSlotClick(slot, i));
        rentalGrid.appendChild(slot);
    }

    updateRentalStats();
    filterRentalSlots();
}

function generateSampleRentalData(slotNumber) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
    
    return {
        vehicleNumber: `ABC-${Math.floor(Math.random() * 9000) + 1000}`,
        startDate: startDate,
        duration: ['daily', 'weekly', 'monthly'][Math.floor(Math.random() * 3)],
        contactNumber: `+91-${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        cost: rentalRates['weekly'] // Default cost
    };
}

function handleRentalSlotClick(slot, slotNumber) {
    const slotData = rentalSlots.get(slotNumber);
    
    if (slotData.status === 'occupied' || slotData.status === 'rented') {
        showNotification('This slot is currently unavailable for rental', 'error');
        return;
    }

    // Remove previous selection
    if (selectedRentalSlot) {
        selectedRentalSlot.classList.remove('selected');
    }

    // Select new slot
    selectedRentalSlot = slot;
    slot.classList.add('selected');
    
    // Update form
    rentalSlot.value = `A-${slotNumber.toString().padStart(2, '0')}`;
    summarySlot.textContent = `A-${slotNumber.toString().padStart(2, '0')}`;
    
    updateRentalSummary();
    showNotification(`Slot A-${slotNumber.toString().padStart(2, '0')} selected for rental`, 'success');
}

function filterRentalSlots() {
    const vehicleCheckboxes = ['rentalCar', 'rentalBike', 'rentalEv'].map(id => document.getElementById(id)).filter(Boolean);
    const selectedVehicles = vehicleCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.id.replace('rental', '').toLowerCase());

    const slots = document.querySelectorAll('.rental-slot');

    slots.forEach(slot => {
        const slotNumber = parseInt(slot.dataset.slotNumber, 10);
        const slotData = rentalSlots.get(slotNumber);
        const vehicleType = ['car', 'bike', 'ev'].find(type => slot.classList.contains(type));

        const matchesFilter = selectedVehicles.length === 0 || selectedVehicles.includes(vehicleType);
        const isAvailable = slotData.status === 'available';

        if (matchesFilter && isAvailable) {
            slot.style.display = 'flex';
        } else {
            slot.style.display = 'none';
        }
    });
}

function updateRentalSummary() {
    if (!selectedRentalSlot) {
        summarySlot.textContent = '-';
        summaryDuration.textContent = '-';
        summaryCost.textContent = '₹0';
        return;
    }

    const duration = document.querySelector('input[name="duration"]:checked')?.value || 'daily';
    const cost = rentalRates[duration];
    
    summaryDuration.textContent = duration.charAt(0).toUpperCase() + duration.slice(1) + ` (₹${cost})`;
    summaryCost.textContent = `₹${cost}`;
}

function handleRental(e) {
    e.preventDefault();

    if (!selectedRentalSlot) {
        showNotification('Please select a slot from the map', 'error');
        return;
    }

    const slotNumber = parseInt(selectedRentalSlot.dataset.slotNumber, 10);
    const duration = document.querySelector('input[name="duration"]:checked')?.value || 'daily';
    const startDateValue = startDate.value;
    const vehicleNumber = rentalVehicleNumber.value;
    const contact = contactNumber.value;

    if (!startDateValue || !vehicleNumber || !contact) {
        showNotification('Please fill all required fields', 'error');
        return;
    }

    const cost = rentalRates[duration];

    if (walletBalance < cost) {
        showNotification('Insufficient wallet balance', 'error');
        return;
    }

    // Process rental
    walletBalance -= cost;
    updateWalletDisplay();

    // Add transaction
    addTransaction(`Slot Rental: A-${slotNumber.toString().padStart(2, '0')} (${duration})`, -cost, 'debit');

    // Update slot status
    rentalSlots.set(slotNumber, {
        status: 'rented',
        type: ['car', 'bike', 'ev'][slotNumber % 3],
        rentalData: {
            vehicleNumber,
            startDate: new Date(startDateValue),
            duration,
            contactNumber: contact,
            cost
        }
    });

    selectedRentalSlot.classList.remove('selected');
    selectedRentalSlot.classList.remove('available-for-rental');
    selectedRentalSlot.classList.add('rented');
    selectedRentalSlot = null;

    // Add to rentals list
    addRentalToList({
        slotNumber,
        vehicleNumber,
        startDate: startDateValue,
        duration,
        contact,
        cost
    });

    // Reset form
    rentalForm.reset();
    // Clear autosave
    ['rentalSlot','rentalDuration','startDate','rentalVehicleNumber','contactNumber'].forEach(id => localStorage.removeItem(`autosave_rental_${id}`));
    updateRentalSummary();
    updateRentalStats();

    showNotification(`Slot A-${slotNumber.toString().padStart(2, '0')} rented successfully!`, 'success');
}

function addRentalToList(rental) {
    const rentalItem = document.createElement('div');
    rentalItem.className = 'rental-item';
    rentalItem.innerHTML = `
        <div class="rental-details">
            <div class="slot-name">Slot A-${rental.slotNumber.toString().padStart(2, '0')}</div>
            <div class="rental-info-text">${rental.duration.charAt(0).toUpperCase() + rental.duration.slice(1)} rental starting ${rental.startDate}</div>
            <div class="vehicle-number">Vehicle: ${rental.vehicleNumber}</div>
        </div>
        <div class="rental-cost">₹${rental.cost}</div>
        <div class="rental-actions">
            <button class="btn-extend" onclick="extendRental(${rental.slotNumber})">Extend</button>
            <button class="btn-cancel-rental" onclick="cancelRental(${rental.slotNumber})">Cancel</button>
        </div>
    `;
    rentalsList.appendChild(rentalItem);
}

function extendRental(slotNumber) {
    showNotification('Extension feature coming soon!', 'info');
}

function cancelRental(slotNumber) {
    if (!confirm('Are you sure you want to cancel this rental?')) {
        return;
    }

    const slotData = rentalSlots.get(slotNumber);
    if (!slotData || slotData.status !== 'rented') {
        showNotification('Rental not found', 'error');
        return;
    }

    // Refund 50% of the cost
    const refundAmount = slotData.rentalData.cost * 0.5;
    walletBalance += refundAmount;
    updateWalletDisplay();

    // Add transaction
    addTransaction(`Rental Cancellation: A-${slotNumber.toString().padStart(2, '0')}`, refundAmount, 'credit');

    // Update slot status
    rentalSlots.set(slotNumber, {
        status: 'available',
        type: slotData.type
    });

    // Update UI
    const slotElement = document.querySelector(`.rental-slot[data-slot-number="${slotNumber}"]`);
    if (slotElement) {
        slotElement.classList.remove('rented');
        slotElement.classList.add('available-for-rental');
    }

    // Remove from rentals list
    const rentalItems = document.querySelectorAll('.rental-item');
    rentalItems.forEach(item => {
        if (item.querySelector('.slot-name').textContent.includes(`A-${slotNumber.toString().padStart(2, '0')}`)) {
            item.remove();
        }
    });

    updateRentalStats();
    showNotification(`Rental cancelled. Refund: ₹${refundAmount.toFixed(2)}`, 'success');
}

function updateRentalStats() {
    const total = 50;
    let rented = 0;
    let occupied = 0;

    rentalSlots.forEach(slotData => {
        if (slotData.status === 'rented') rented++;
        else if (slotData.status === 'occupied') occupied++;
    });

    const available = total - rented - occupied;

    document.getElementById('rentalTotalSlots').textContent = total;
    document.getElementById('rentalAvailableSlots').textContent = available;
    document.getElementById('rentedSlots').textContent = rented;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log("Service Worker registered!", reg.scope))
        .catch(err => console.log("Service Worker registration failed: ", err));
}

// Export utilities
async function exportSectionAsPNG(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section || typeof html2canvas === 'undefined') return;
    const canvas = await html2canvas(section, {backgroundColor: null, scale: 2});
    const link = document.createElement('a');
    link.download = `${sectionId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

async function exportSectionAsPDF(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section || typeof html2canvas === 'undefined' || !window.jspdf) return;
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(section, {backgroundColor: '#ffffff', scale: 2});
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = canvas.height * (imgWidth / canvas.width);
    let y = 0;
    if (imgHeight < pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    } else {
        let remaining = imgHeight;
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        const ratio = canvas.width / imgWidth;
        const pageCanvasHeight = pageHeight * ratio;
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageCanvasHeight;
        while (remaining > 0) {
            pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(canvas, 0, y * ratio, canvas.width, pageCanvasHeight, 0, 0, pageCanvas.width, pageCanvas.height);
            const pageImg = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImg, 'PNG', 0, 0, imgWidth, pageHeight);
            remaining -= pageHeight;
            y += pageHeight;
            if (remaining > 0) pdf.addPage();
        }
    }
    pdf.save(`${sectionId}.pdf`);
}

