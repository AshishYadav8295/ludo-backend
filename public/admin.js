const socket = io(window.location.origin);

async function loadPendingResults() {
    try {
        const res = await fetch('/api/game/pending-results');
        const data = await res.json();

        const container = document.getElementById('pending-results-container') || document.body;

        if (!data.games || data.games.length === 0) {
            container.innerHTML = '<p style="padding:10px;">Koi pending review match nahi hai.</p>';
            return;
        }

        container.innerHTML = '<h3>Pending Result Reviews</h3>';
        
        data.games.forEach(game => {
            const card = document.createElement('div');
            card.style.cssText = 'border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.05);';
            
            let statusColor = '#007bff';
            if (game.resultStatus === 'WIN') statusColor = '#28a745';
            if (game.resultStatus === 'LOSE') statusColor = '#dc3545';
            if (game.resultStatus === 'CANCEL') statusColor = '#6c757d';

            let actionButtons = '';
            
            if (game.resultStatus === 'WIN') {
                actionButtons = `
                    <button onclick="approveWin('${game._id}', 'WIN')" style="background-color: #28a745; color: white; border: none; padding: 10px 16px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                        🏆 Approve Winner & Pay Balance
                    </button>
                `;
            } else if (game.resultStatus === 'LOSE') {
                actionButtons = `
                    <button onclick="approveWin('${game._id}', 'LOSE')" style="background-color: #28a745; color: white; border: none; padding: 10px 16px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                        🤝 Opponent Ko Winner Banao & Pay Karein
                    </button>
                `;
            } else if (game.resultStatus === 'CANCEL') {
                actionButtons = `
                    <button onclick="cancelMatch('${game._id}')" style="background-color: #dc3545; color: white; border: none; padding: 10px 16px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                        ⚠️ Match Cancel Karein (Refund Money)
                    </button>
                `;
            }

            // Proof Screenshot Render Block
            const screenshotHtml = (game.screenshot && game.screenshot.trim() !== '') 
                ? `<p><strong>Proof Screenshot:</strong><br>
                    <a href="${game.screenshot}" target="_blank">
                        <img src="${game.screenshot}" style="max-width: 280px; width: 100%; border-radius: 6px; margin-top: 5px; border:1px solid #ccc;" />
                    </a></p>`
                : '<p style="color:red; font-weight:bold;">No Screenshot Uploaded</p>';

            card.innerHTML = `
                <p><strong>Game ID:</strong> ${game._id}</p>
                <p><strong>Amount:</strong> ₹${game.amount}</p>
                <p><strong>Claimed Status:</strong> <span style="color:${statusColor}; font-weight:bold; font-size: 16px;">${game.resultStatus || 'N/A'}</span></p>
                <p><strong>Creator (Host):</strong> ${game.creatorPhone || (game.creator ? game.creator.phone : 'N/A')}</p>
                <p><strong>Accepter (Opponent):</strong> ${game.accepter ? game.accepter.phone : 'N/A'}</p>
                
                ${screenshotHtml}
                
                <div style="margin-top: 10px;">
                    ${actionButtons}
                </div>
            `;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Fetch Pending Results Error:', err);
    }
}

async function approveWin(gameId, status) {
    let confirmMsg = 'Kya aap is match ka result approve karke creator ko winner banana chahte hain?';
    if (status === 'LOSE') {
        confirmMsg = 'Kya aap Opponent (Accepter) ko winner banakar balance credit karna chahte hain?';
    }

    if (!confirm(confirmMsg)) return;

    try {
        const res = await fetch('/api/game/approve-win', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId, status })
        });

        const data = await res.json();
        alert(data.message);
        loadPendingResults();
    } catch (err) {
        alert('Approve karne mein error aaya!');
    }
}

async function cancelMatch(gameId) {
    if (!confirm('Kya aap is match ko cancel karke dono users ko amount refund karna chahte hain?')) return;

    try {
        const res = await fetch('/api/game/cancel-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId })
        });

        const data = await res.json();

        if (res.ok) {
            alert(data.message || 'Match successfully cancel ho gaya!');
            loadPendingResults();
        } else {
            alert(data.message || 'Cancel karne mein error aaya!');
        }
    } catch (err) {
        console.error('Cancel Fetch Error:', err);
        alert('Server connection failure!');
    }
}

socket.on('resultSubmitted', () => {
    loadPendingResults();
});

window.onload = loadPendingResults;