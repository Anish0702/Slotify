const virtualDatabase = {
    
    upiUsers: [
        { upiId: "praneeth@paytm", pin: "1234", name: "Praneeth", balance: 2500.50 },
        { upiId: "praneeth@phonepe", pin: "5678", name: "Praneeth", balance: 1800.75 },
        { upiId: "praneeth@gpay", pin: "9999", name: "Praneeth", balance: 3200.00 },
        { upiId: "praneeth_new@paytm", pin: "1111", name: "Praneeth", balance: 950.25 }
    ],
    
    cardUsers: [
        { cardNumber: "1234567890123456", expiry: "12/25", cvv: "123", name: "Praneeth", balance: 5000.00 },
        { cardNumber: "9876543210987654", expiry: "08/26", cvv: "456", name: "Praneeth", balance: 2800.50 },
        { cardNumber: "5555666677778888", expiry: "03/27", cvv: "789", name: "Praneeth", balance: 4200.75 },
        { cardNumber: "1111222233334444", expiry: "11/25", cvv: "321", name: "Praneeth", balance: 1600.00 }
    ],
    
    netBankingUsers: [
        { bank: "sbi", userId: "praneeth123", password: "password123", name: "Praneeth", balance: 7500.00 },
        { bank: "hdfc", userId: "praneeth456", password: "mypassword", name: "Praneeth", balance: 3200.25 },
        { bank: "icici", userId: "praneeth789", password: "securepass", name: "Praneeth", balance: 4800.50 },
        { bank: "axis", userId: "praneeth321", password: "pass1234", name: "Praneeth", balance: 2100.75 }
    ]
};

let currentPaymentMethod = 'upi';
let transactionHistory = [];

document.addEventListener('DOMContentLoaded', function() {
    generateQRCode();
    setupEventListeners();
    updateTransactionHistory();
    syncWalletBalanceBar();
});

function generateQRCode() {
    const bankDetails = {
        bankName: "Virtual Bank Ltd.",
        accountNumber: "1234567890123456",
        ifsc: "VBL1234567",
        accountHolder: "Your Website Name"
    };
    
    const qrData = `Bank: ${bankDetails.bankName}\nAccount: ${bankDetails.accountNumber}\nIFSC: ${bankDetails.ifsc}\nHolder: ${bankDetails.accountHolder}`;
    
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    if (typeof QRCode !== 'undefined' && QRCode.toCanvas) {
        QRCode.toCanvas(qrContainer, qrData, {
            width: 150,
            height: 150,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, function (error) {
            if (error) {
                console.error('QR Code generation failed:', error);
                qrContainer.innerHTML = '<p style="color: red;">QR Code generation failed</p>';
            }
        });
    } else {
        qrContainer.innerHTML = '<p style="color: red;">QR Code library not loaded.</p>';
    }
}

function setupEventListeners() {
    
    const methodButtons = document.querySelectorAll('.method-btn');
    methodButtons.forEach(button => {
        button.addEventListener('click', function() {
            const method = this.dataset.method;
            switchPaymentMethod(method);
        });
    });
    
    
    document.getElementById('upi-payment-form').addEventListener('submit', handlePayment);
    document.getElementById('card-payment-form').addEventListener('submit', handlePayment);
    document.getElementById('netbanking-payment-form').addEventListener('submit', handlePayment);
    
    
    setupInputFormatting();

    // Refresh synced balance
    const refreshBtn = document.getElementById('refreshBalanceBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            syncWalletBalanceBar(true);
        });
    }
}

function switchPaymentMethod(method) {
    currentPaymentMethod = method;
    
    
    document.querySelectorAll('.method-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    
    
    document.querySelectorAll('.payment-form').forEach(form => form.style.display = 'none');
    document.getElementById(`${method}-form`).style.display = 'block';
}

function setupInputFormatting() {
    
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    
    const expiryInput = document.getElementById('expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
        });
    }
}


function handlePayment(e) {
    e.preventDefault();
    const form = e.target;
    const method = form.id.replace('-payment-form', '');
    const formData = new FormData(form);
    
    let paymentData = {};
    let validationFn;
    let processFn;

    if (method === 'upi') {
        paymentData = {
            upiId: formData.get('upiId'),
            pin: formData.get('upiPin'),
            amount: parseFloat(formData.get('amount'))
        };
        validationFn = validateUPIPayment;
        processFn = processUPIPayment;
    } else if (method === 'card') {
        paymentData = {
            cardNumber: formData.get('cardNumber').replace(/\s/g, ''),
            expiry: formData.get('expiry'),
            cvv: formData.get('cvv'),
            amount: parseFloat(formData.get('amount'))
        };
        validationFn = validateCardPayment;
        processFn = processCardPayment;
    } else if (method === 'netbanking') {
        paymentData = {
            bank: formData.get('bank'),
            userId: formData.get('userId'),
            password: formData.get('password'),
            amount: parseFloat(formData.get('amount'))
        };
        validationFn = validateNetBankingPayment;
        processFn = processNetBankingPayment;
    }

    if (validationFn && processFn && validationFn(paymentData)) {
        showLoadingIndicator(true);
        setTimeout(() => {
            showLoadingIndicator(false);
            processFn(paymentData);
        }, 1500); // Simulate a network delay
    }
}


function showLoadingIndicator(show) {
    const payBtn = document.querySelector(`#${currentPaymentMethod}-form .pay-btn`);
    if (show) {
        payBtn.innerHTML = '<span class="loading"></span> Processing...';
        payBtn.disabled = true;
    } else {
        
        if (currentPaymentMethod === 'upi') payBtn.textContent = 'Pay with UPI';
        if (currentPaymentMethod === 'card') payBtn.textContent = 'Pay with Card';
        if (currentPaymentMethod === 'netbanking') payBtn.textContent = 'Pay with Net Banking';
        payBtn.disabled = false;
    }
}



function validateUPIPayment(data) {
    if (!data.upiId.includes('@')) {
        showPaymentResult(false, 'Invalid UPI ID format');
        return false;
    }
    if (data.pin.length < 4 || data.pin.length > 6) {
        showPaymentResult(false, 'Invalid UPI PIN');
        return false;
    }
    if (data.amount <= 0 || isNaN(data.amount)) {
        showPaymentResult(false, 'Invalid amount');
        return false;
    }
    return true;
}

function validateCardPayment(data) {
    if (data.cardNumber.length !== 16) {
        showPaymentResult(false, 'Invalid card number');
        return false;
    }
    if (!data.expiry.match(/^\d{2}\/\d{2}$/)) {
        showPaymentResult(false, 'Invalid expiry date');
        return false;
    }
    if (data.cvv.length !== 3) {
        showPaymentResult(false, 'Invalid CVV');
        return false;
    }
    if (data.amount <= 0 || isNaN(data.amount)) {
        showPaymentResult(false, 'Invalid amount');
        return false;
    }
    return true;
}

function validateNetBankingPayment(data) {
    if (!data.bank || !data.userId || !data.password) {
        showPaymentResult(false, 'Please fill all fields');
        return false;
    }
    if (data.amount <= 0 || isNaN(data.amount)) {
        showPaymentResult(false, 'Invalid amount');
        return false;
    }
    return true;
}

// Payment processing functions
function processUPIPayment(data) {
    const user = virtualDatabase.upiUsers.find(u => 
        u.upiId === data.upiId && u.pin === data.pin
    );
    
    if (!user) {
        showPaymentResult(false, 'Invalid UPI credentials');
        return;
    }
    
    if (user.balance < data.amount) {
        showPaymentResult(false, 'Insufficient balance');
        return;
    }
    
    // Process payment
    user.balance -= data.amount;
    const transaction = {
        id: generateTransactionId(),
        method: 'UPI',
        user: user.name,
        amount: data.amount,
        timestamp: new Date(),
        status: 'success'
    };
    
    transactionHistory.push(transaction);
    showPaymentResult(true, 'UPI payment successful', transaction, user);
}

function processCardPayment(data) {
    const user = virtualDatabase.cardUsers.find(u => 
        u.cardNumber === data.cardNumber && 
        u.expiry === data.expiry && 
        u.cvv === data.cvv
    );
    
    if (!user) {
        showPaymentResult(false, 'Invalid card details');
        return;
    }
    
    if (user.balance < data.amount) {
        showPaymentResult(false, 'Insufficient balance');
        return;
    }
    
    
    user.balance -= data.amount;
    const transaction = {
        id: generateTransactionId(),
        method: 'Card',
        user: user.name,
        amount: data.amount,
        timestamp: new Date(),
        status: 'success'
    };
    
    transactionHistory.push(transaction);
    showPaymentResult(true, 'Card payment successful', transaction, user);
}

function processNetBankingPayment(data) {
    const user = virtualDatabase.netBankingUsers.find(u => 
        u.bank === data.bank && 
        u.userId === data.userId && 
        u.password === data.password
    );
    
    if (!user) {
        showPaymentResult(false, 'Invalid banking credentials');
        return;
    }
    
    if (user.balance < data.amount) {
        showPaymentResult(false, 'Insufficient balance');
        return;
    }
    
    // Process payment
    user.balance -= data.amount;
    const transaction = {
        id: generateTransactionId(),
        method: 'Net Banking',
        user: user.name,
        amount: data.amount,
        timestamp: new Date(),
        status: 'success'
    };
    
    transactionHistory.push(transaction);
    showPaymentResult(true, 'Net banking payment successful', transaction, user);
}


function generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
}


function showPaymentResult(success, message, transaction = null, user = null) {
    const modal = document.getElementById('payment-modal');
    const modalTitle = document.getElementById('modal-title');
    const paymentStatus = document.getElementById('payment-status');
    const transactionDetails = document.getElementById('transaction-details');
    
    modalTitle.textContent = success ? 'Payment Successful! 🎉' : 'Payment Failed 😟';
    
    if (success) {
        paymentStatus.innerHTML = `
            <div class="payment-success">
                <div class="success-icon">✅</div>
                <h4>${message}</h4>
            </div>
        `;
        
        if (transaction && user) {
            transactionDetails.innerHTML = `
                <div class="transaction-details">
                    <h5>Transaction Details</h5>
                    <p><strong>Transaction ID:</strong> ${transaction.id}</p>
                    <p><strong>Payment Method:</strong> ${transaction.method}</p>
                    <p><strong>Amount:</strong> <span class="amount">₹${transaction.amount.toFixed(2)}</span></p>
                    <p><strong>Date:</strong> ${transaction.timestamp.toLocaleString()}</p>
                    <p><strong>Remaining Balance:</strong> ₹${user.balance.toFixed(2)}</p>
                </div>
            `;
        }
        
        clearAllForms();

        // Reflect credit into SmartPark wallet and notify
        const current = parseFloat(localStorage.getItem('walletBalance') || '150');
        const newBalance = current + (transaction?.amount || 0);
        localStorage.setItem('walletBalance', newBalance.toString());
        window.opener && window.opener.postMessage({
            type: 'WALLET_UPDATED',
            newBalance,
            transactionType: 'credit',
            amount: transaction?.amount || 0
        }, '*');
        // Local bar update
        syncWalletBalanceBar();
    } else {
        paymentStatus.innerHTML = `
            <div class="payment-error">
                <div class="error-icon">❌</div>
                <h4>${message}</h4>
            </div>
        `;
        transactionDetails.innerHTML = '';
    }
    
    modal.style.display = 'block';
}


function clearAllForms() {
    document.querySelectorAll('form').forEach(form => form.reset());
}

// Close modal
function closeModal() {
    document.getElementById('payment-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('payment-modal');
    if (event.target === modal) {
        closeModal();
    }
}

// Update transaction history (for demo purposes)
function updateTransactionHistory() {
    console.log('Transaction History:', transactionHistory);
    console.log('Virtual Database:', virtualDatabase);
}

function syncWalletBalanceBar(animate = false) {
    const el = document.getElementById('paymentWalletBalance');
    if (!el) return;
    const balance = parseFloat(localStorage.getItem('walletBalance') || '150');
    el.textContent = `₹${balance.toFixed(2)}`;
    if (animate) {
        el.classList.add('balance-update-animation');
        setTimeout(() => el.classList.remove('balance-update-animation'), 600);
    }
}

// Demo function to show sample accounts
function showDemoAccounts() {
    console.log('=== DEMO ACCOUNTS ===');
    console.log('UPI Accounts:');
    virtualDatabase.upiUsers.forEach(user => {
        console.log(`UPI ID: ${user.upiId}, PIN: ${user.pin}, Name: ${user.name}, Balance: ₹${user.balance}`);
    });
    
    console.log('\nCard Accounts:');
    virtualDatabase.cardUsers.forEach(user => {
        console.log(`Card: ${user.cardNumber}, Expiry: ${user.expiry}, CVV: ${user.cvv}, Name: ${user.name}, Balance: ₹${user.balance}`);
    });
    
    console.log('\nNet Banking Accounts:');
    virtualDatabase.netBankingUsers.forEach(user => {
        console.log(`Bank: ${user.bank}, User ID: ${user.userId}, Password: ${user.password}, Name: ${user.name}, Balance: ₹${user.balance}`);
    });
}


window.showDemoAccounts = showDemoAccounts;