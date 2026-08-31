const socket = io(window.location.origin);
let currentUser = null;
let currentActiveGameId = localStorage.getItem('activeGameId') || null;

// Page Load Handling
window.onload = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    } else {
        showLoginPage();
    }
};

function showLoginPage() {
    document.getElementById('auth-card')?.classList.remove('hidden');
    document.getElementById('main-nav')?.classList.add('hidden');
    document.getElementById('lobby-card')?.classList.add('hidden');
    document.getElementById('room-card')?.classList.add('hidden');
    document.getElementById('withdraw-card')?.classList.add('hidden');
    document.getElementById('history-card')?.classList.add('hidden');
    document.getElementById('logout-btn')?.classList.add('hidden');
}

function showMainApp() {
    document.getElementById('auth-card')?.classList.add('hidden');
    document.getElementById('main-nav')?.classList.remove('hidden');
    document.getElementById('lobby-card')?.classList.remove('hidden');
    document.getElementById('logout-btn')?.classList.remove('hidden');
    
    if (currentUser) {
        const totalBal = (currentUser.depositWallet || 0) + (currentUser.winningWallet || 0) + (currentUser.bonusWallet || 0);
        document.getElementById('user-balance').innerText = currentUser.balance !== undefined ? currentUser.balance : totalBal;
    }
    loadBattles();
}

async function loginUser() {
    const phoneInput = document.getElementById('phone-input');
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (phone.length !== 10) {
        return alert('Please enter a valid 10-digit phone number!');
    }

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            localStorage.setItem('userId', currentUser._id);
            showMainApp();
        } else {
            alert(data.message || 'Login failed!');
        }
    } catch (err) {
        console.error('Login Error:', err);
        alert('Server Error during login!');
    }
}

function logoutUser() {
    localStorage.clear();
    currentUser = null;
    currentActiveGameId = null;
    showLoginPage();
}

function showSection(sectionName) {
    document.getElementById('lobby-card')?.classList.add('hidden');
    document.getElementById('withdraw-card')?.classList.add('hidden');
    document.getElementById('history-card')?.classList.add('hidden');

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (sectionName === 'lobby') {
        document.getElementById('lobby-card')?.classList.remove('hidden');
        if (tabs[0]) tabs[0].classList.add('active');
        loadBattles();
    } else if (sectionName === 'withdraw') {
        document.getElementById('withdraw-card')?.classList.remove('hidden');
        if (tabs[1]) tabs[1].classList.add('active');
    } else if (sectionName === 'history') {
        document.getElementById('history-card')?.classList.remove('hidden');
        if (tabs[2]) tabs[2].classList.add('active');
    }
}

async function loadBattles() {
    try {
        const res = await fetch('/api/game/open-battles');
        const battles = await res.json();
        const listContainer = document.getElementById('battles-list');
        if (!listContainer) return;
        
        listContainer.innerHTML = '';

        if (!battles || battles.length === 0) {
            listContainer.innerHTML = '<p style="color: #9ca3af; font-size: 14px;">No open battles right now.</p>';
            return;
        }

        battles.forEach(game => {
            const item = document.createElement('div');
            item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 12px; background: #f9fafb; margin-bottom: 10px; border-radius: 10px; border: 1px solid #f3f4f6;';
            item.innerHTML = `
                <div>
                    <strong style="font-size: 15px;">Entry: ₹${game.amount}</strong><br>
                    <small style="color: #6b7280; font-size: 12px;">Created by: ${game.creatorPhone || 'Player'}</small>
                </div>
                <button style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 600; cursor: pointer;" onclick="joinBattle('${game._id}')">Play</button>
            `;
            listContainer.appendChild(item);
        });
    } catch (err) {
        console.error('Error loading battles:', err);
    }
}

async function createBattle() {
    const amountInput = document.getElementById('battle-amount');
    const amount = amountInput ? amountInput.value.trim() : '';

    if (!amount || amount < 10) return alert('Minimum battle amount is ₹10');

    try {
        const res = await fetch('/api/game/create-battle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, userId: currentUser._id })
        });
        const data = await res.json();

        if (data.success) {
            alert('Battle created successfully!');
            amountInput.value = '';
            
            if (data.game && data.game._id) {
                currentActiveGameId = data.game._id;
                localStorage.setItem('activeGameId', data.game._id);

                document.getElementById('lobby-card')?.classList.add('hidden');
                document.getElementById('room-card')?.classList.remove('hidden');
                if (document.getElementById('match-amount')) {
                    document.getElementById('match-amount').innerText = data.game.amount;
                }
            }

            if (data.updatedBalance !== undefined) {
                currentUser.balance = data.updatedBalance;
                document.getElementById('user-balance').innerText = data.updatedBalance;
            }
            loadBattles();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error creating battle!');
    }
}

async function joinBattle(gameId) {
    if (!currentUser || !currentUser._id) return alert('Please login again!');

    try {
        const res = await fetch('/api/game/join-battle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, userId: currentUser._id })
        });

        const data = await res.json();
        if (data.success) {
            currentActiveGameId = data.game._id;
            localStorage.setItem('activeGameId', data.game._id);

            if (data.updatedBalance !== undefined) {
                currentUser.balance = data.updatedBalance;
                document.getElementById('user-balance').innerText = data.updatedBalance;
            }
            alert('Match successfully joined!');
            document.getElementById('lobby-card')?.classList.add('hidden');
            document.getElementById('room-card')?.classList.remove('hidden');
            if (document.getElementById('match-amount')) {
                document.getElementById('match-amount').innerText = data.game.amount;
            }
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Error accepting battle!');
    }
}

async function submitResult(event, status) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }

    const activeId = currentActiveGameId || localStorage.getItem('activeGameId');
    if (!activeId) {
        return alert('No active match found to submit proof!');
    }

    let screenshotBase64 = "";

    if (status === 'win') {
        const fileInput = document.getElementById('screenshot-file');
        if (!fileInput || !fileInput.files[0]) {
            return alert('Please select a win screenshot proof!');
        }

        const file = fileInput.files[0];
        screenshotBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    try {
        const res = await fetch('/api/game/submit-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: activeId,
                status: status,
                screenshot: screenshotBase64
            })
        });

        const data = await res.json();
        if (data.success) {
            alert('Result submitted successfully!');
            localStorage.removeItem('activeGameId');
            currentActiveGameId = null;
            location.reload();
        } else {
            alert(data.message || 'Error submitting result!');
        }
    } catch (err) {
        console.error('Submit error:', err);
        alert('Server connection error while submitting!');
    }
}

function cancelMatch() {
    if (confirm('Are you sure you want to cancel?')) {
        localStorage.removeItem('activeGameId');
        currentActiveGameId = null;
        if (document.getElementById('screenshot-file')) document.getElementById('screenshot-file').value = '';
        if (document.getElementById('room-code-input')) document.getElementById('room-code-input').value = '';
        showSection('lobby');
    }
}