// Global State Variables
window.loginedUser = JSON.parse(localStorage.getItem('user')) || null;
window.currentUser = window.loginedUser;
window.currentActiveGameId = null;

// Socket.io Connection Setup
let socket;
try {
    socket = io();
    socket.on('connect', () => {
        console.log('Real-time Socket Connected!');
    });
} catch (e) {
    console.warn('Socket initialization failed, continuing without real-time updates.');
}

// Page Load Initialization (Auto-Check Login State)
document.addEventListener('DOMContentLoaded', () => {
    checkInitialAuthState();
    loadOpenBattles();
    
    // Check active match
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    if (gameId) {
        window.currentActiveGameId = gameId;
        loadGameDetails(gameId);
    }
});

// Strict Initial Auth Check Logic
function checkInitialAuthState() {
    const savedUser = localStorage.getItem('user');
    
    if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
        try {
            window.loginedUser = JSON.parse(savedUser);
            window.currentUser = window.loginedUser;
            updateUserUI();
        } catch (e) {
            logoutUser();
        }
    } else {
        window.loginedUser = null;
        window.currentUser = null;
        updateUserUI();
    }
}

// Clean UI Render Handler
function updateUserUI() {
    const user = window.loginedUser || JSON.parse(localStorage.getItem('user'));
    const balanceElem = document.getElementById('walletBalance') || document.getElementById('user-balance');
    const userPhoneElem = document.getElementById('userPhone');
    
    const loginSection = document.getElementById('loginSection');
    const mainDashboard = document.getElementById('mainDashboard');
    const logoutBtn = document.getElementById('logout-btn');

    if (user && user.phone) {
        window.loginedUser = user;
        window.currentUser = user;
        const totalBalance = (user.depositWallet || 0) + (user.winningWallet || 0) + (user.bonusWallet || 0);
        
        if (balanceElem) balanceElem.innerText = totalBalance;
        if (userPhoneElem) userPhoneElem.innerText = user.phone;

        if (loginSection) loginSection.style.display = 'none';
        if (mainDashboard) mainDashboard.style.display = 'block';
        if (logoutBtn) logoutBtn.classList.remove('hidden'); // Logout button dikhayega
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (mainDashboard) mainDashboard.style.display = 'none';
        if (logoutBtn) logoutBtn.classList.add('hidden'); // Logout button chhupayega
    }
}

// LOGOUT FUNCTION (Proper Cache Clear & Reset)
function logoutUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.clear();
    window.loginedUser = null;
    window.currentUser = null;
    
    updateUserUI();
    window.location.reload();
}

// 1. LOGIN FUNCTION
async function loginUser() {
    const phoneInput = document.getElementById('phoneInput') || document.querySelector('input[type="tel"]') || document.querySelector('input[type="number"]');
    if (!phoneInput) return alert('Phone input field missing!');

    const phone = phoneInput.value.trim();

    if (!phone || phone.length < 10) {
        return alert('Kripya sahi 10-digit mobile number darj karein.');
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phone })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            window.loginedUser = data.user; 
            window.currentUser = data.user;

            alert('Login Successful!');
            location.reload();
        } else {
            alert(data.message || 'Login Failed!');
        }
    } catch (error) {
        console.error('Login Error:', error);
        alert('Server connection error!');
    }
}

// 2. CREATE BATTLE FUNCTION
async function createBattle() {
    const user = window.loginedUser;
    if (!user) return alert('Pehle Login Karein!');

    const amountInput = document.getElementById('battleAmountInput') || document.getElementById('battleAmount');
    if (!amountInput) return alert('Battle Amount Input Missing!');

    const amount = Number(amountInput.value);
    if (!amount || amount < 10) return alert('Minimum battle amount is ₹10');

    try {
        const res = await fetch('/api/game/create-battle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, amount })
        });

        const data = await res.json();
        if (data.success) {
            // LocalStorage balance sync
            user.depositWallet = (user.depositWallet || 0) - amount;
            localStorage.setItem('user', JSON.stringify(user));
            
            alert('Battle Created Successfully!');
            location.reload();
        } else {
            alert(data.message || 'Battle Create Nahi Ho Paya!');
        }
    } catch (err) {
        alert('Server Connection Error while creating battle!');
    }
}

// 3. JOIN BATTLE FUNCTION
async function joinBattle(gameId) {
    const user = window.loginedUser;
    if (!user) return alert('Pehle Login Karein!');

    try {
        const res = await fetch('/api/game/join-battle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, userId: user._id })
        });

        const data = await res.json();
        if (data.success) {
            alert('Battle Joined Successfully!');
            window.location.href = `/match.html?id=${gameId}`;
        } else {
            alert(data.message || 'Battle Join Nahi Ho Paya!');
        }
    } catch (err) {
        alert('Server Error joining battle!');
    }
}

// 4. LOAD OPEN BATTLES LIST
async function loadOpenBattles() {
    const container = document.getElementById('openBattlesContainer');
    if (!container) return;

    try {
        const res = await fetch('/api/game/open-battles');
        const data = await res.json();

        if (data.success && data.battles.length > 0) {
            container.innerHTML = data.battles.map(battle => `
                <div class="battle-card border p-3 my-2 d-flex justify-content-between align-items-center">
                    <div>
                        <h5>Entry: ₹${battle.amount} | Win: ₹${battle.prize}</h5>
                        <small>Created By: ${battle.creatorPhone}</small>
                    </div>
                    <button onclick="joinBattle('${battle._id}')" class="btn btn-primary btn-sm">Play</button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-center">No Open Battles Available!</p>';
        }
    } catch (err) {
        console.error('Error fetching battles:', err);
    }
}

// 5. UPDATE ROOM CODE FUNCTION
async function submitRoomCode() {
    const roomCodeInput = document.getElementById('roomCodeInput');
    if (!roomCodeInput) return alert('Room Code Input Missing!');

    const roomCode = roomCodeInput.value.trim();
    const gameId = window.currentActiveGameId;

    if (!roomCode) return alert('Room code darj karein!');
    if (!gameId) return alert('Match ID missing!');

    try {
        const res = await fetch('/api/game/update-roomcode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, roomCode })
        });

        const data = await res.json();
        if (data.success) {
            alert('Room Code Updated Successfully!');
            location.reload();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error updating room code!');
    }
}

// 6. SUBMIT MATCH RESULT HANDLER (Fixing Screen Crash & Compression)
async function submitResult(status) {
    const fileInput = document.getElementById('screenshotInput') || document.querySelector('input[type="file"]');
    let screenshotBase64 = '';

    if (fileInput && fileInput.files[0]) {
        screenshotBase64 = await convertToBase64(fileInput.files[0]);
    }

    const gameId = new URLSearchParams(window.location.search).get('id') || window.currentActiveGameId;

    if (!gameId) {
        return alert('Game ID Missing!');
    }

    try {
        const res = await fetch('/api/game/submit-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, status, screenshot: screenshotBase64 })
        });

        const data = await res.json();
        alert(data.message);
        if (data.success) {
            window.location.href = '/index.html';
        }
    } catch (err) {
        alert('Submission failed. Check network!');
    }
}

// Helper to convert Image File to Base64
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 7. HANDLE WITHDRAW SUBMISSION
async function submitWithdrawal() {
    const user = JSON.parse(localStorage.getItem('user')) || window.loginedUser;
    const amountInput = document.getElementById('withdrawAmount');
    const upiInput = document.getElementById('upiIdInput') || document.getElementById('upiId');

    if (!user || !user._id) return alert('Pehle Login Karein!');
    if (!amountInput) return alert('Amount input missing!');

    const amount = amountInput.value;
    const upiId = upiInput ? upiInput.value : 'N/A';

    const res = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, amount, upiId })
    });

    const data = await res.json();
    alert(data.message);
    if (data.success) location.reload();
}