// Submit Match Result Handler (Fixing Screen Crash & Compression)
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

// Handle Withdraw Submission
async function submitWithdrawal() {
    const user = JSON.parse(localStorage.getItem('user'));
    const amount = document.getElementById('withdrawAmount').value;
    const upiId = document.getElementById('upiIdInput') ? document.getElementById('upiIdInput').value : '';

    if (!user || !user._id) return alert('Pehle Login Karein!');

    const res = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user._id, amount, upiId })
    });

    const data = await res.json();
    alert(data.message);
    if (data.success) location.reload();
}