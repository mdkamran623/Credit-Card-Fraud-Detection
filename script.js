// ========== CREDIT CARD FRAUD DETECTION - COMPLETE SCRIPT ==========
// ========== WITH 3 TYPES OF SOUND (LOW, MEDIUM, HIGH) ==========

// ========== API CONFIGURATION ==========
const API_URL = 'https://credit-card-fraud-detection-221d.onrender.com';

// ========== GLOBAL VARIABLES ==========
let transactionHistory = [];
let fraudChart = null;
let soundEnabled = true;
let audioContext = null;

// ========== LOAD SETTINGS ON PAGE LOAD ==========
window.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    updateStatistics();
    createSoundToggleButton();
});

// ========== CREATE SOUND TOGGLE BUTTON ==========
function createSoundToggleButton() {
    if (!document.getElementById('soundToggle')) {
        const btn = document.createElement('button');
        btn.id = 'soundToggle';
        btn.className = 'sound-control';
        btn.innerHTML = '🔊 Sound ON';
        btn.onclick = toggleSound;
        btn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 10px 20px;
            background: #1a1f3a;
            border: 1px solid #00d4ff;
            border-radius: 25px;
            color: #00d4ff;
            cursor: pointer;
            font-size: 0.9rem;
            z-index: 1000;
        `;
        document.body.appendChild(btn);
    }
}

// ========== TRANSACTION ANALYSIS ==========
async function analyzeTransaction() {
    const btn = document.querySelector('.btn-analyze');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    if (progressContainer) progressContainer.style.display = 'block';
    if (btn) {
        btn.classList.add('loading');
        btn.textContent = '⏳ ANALYZING...';
    }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        if (progressBar) progressBar.style.width = progress + '%';
        if (progress >= 100) clearInterval(interval);
    }, 100);
    
    try {
        const amount = parseFloat(document.getElementById('amount').value);
        const hour = parseInt(document.getElementById('hour').value);
        const merchant_type = document.getElementById('merchant_type').value;
        const country_match = document.getElementById('country_match').checked;
        
        const response = await fetch(`${API_URL}/api/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, hour, merchant_type, country_match })
        });
        
        if (!response.ok) throw new Error('Server error');
        
        const result = await response.json();
        result.amount = amount;
        displayResults(result);
        addToHistory(result);
        updateStatistics();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Cannot connect to server! Make sure backend is running.', 'error');
    } finally {
        clearInterval(interval);
        if (progressBar) progressBar.style.width = '100%';
        setTimeout(() => {
            if (progressContainer) progressContainer.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
        }, 500);
        if (btn) {
            btn.classList.remove('loading');
            btn.textContent = '🚀 ANALYZE NOW';
        }
    }
}

// ========== DISPLAY RESULTS ==========
function displayResults(result) {
    const placeholder = document.getElementById('results-placeholder');
    const content = document.getElementById('results-content');
    const historySection = document.getElementById('historySection');
    const statsSection = document.getElementById('statsSection');
    
    if (placeholder) placeholder.style.display = 'none';
    if (content) content.style.display = 'block';
    if (historySection) historySection.style.display = 'block';
    if (statsSection) statsSection.style.display = 'block';
    
    const score = result.fraud_score;
    const riskLevel = result.risk_level;
    const isFraud = result.is_fraud;
    
    const scoreCircle = document.getElementById('score-circle');
    const riskLabel = document.getElementById('risk-label');
    const riskDesc = document.getElementById('risk-desc');
    
    if (scoreCircle) {
        scoreCircle.textContent = score;
        scoreCircle.className = 'score-circle ' + riskLevel.toLowerCase();
    }
    if (riskLabel) riskLabel.textContent = riskLevel + ' RISK';
    
    if (riskDesc) {
        if (riskLevel === 'HIGH') {
            riskDesc.textContent = '🚨 Transaction flagged for immediate review';
        } else if (riskLevel === 'MEDIUM') {
            riskDesc.textContent = '⚠️ Requires additional verification';
        } else {
            riskDesc.textContent = '✅ Transaction appears legitimate';
        }
    }
    
    const reasonsSection = document.getElementById('reasons-section');
    if (reasonsSection) {
        if (result.reasons && result.reasons.length > 0) {
            reasonsSection.innerHTML = `<div class="reasons-list"><h3>⚠️ Detection Factors</h3>${result.reasons.map(r => `<div class="reason-item">${r}</div>`).join('')}</div>`;
        } else {
            reasonsSection.innerHTML = '';
        }
    }
    
    const verdict = document.getElementById('verdict');
    if (verdict) {
        if (isFraud) {
            verdict.className = 'verdict fraud';
            verdict.textContent = '🚨 SUSPICIOUS ACTIVITY DETECTED - Transaction Blocked';
        } else {
            verdict.className = 'verdict safe';
            verdict.textContent = '✅ TRANSACTION APPROVED - No Fraud Detected';
        }
    }
    
    const timestamp = document.getElementById('timestamp');
    if (timestamp) {
        timestamp.textContent = `Analyzed: ${new Date(result.timestamp).toLocaleString()}`;
    }
    
    const statusBadge = document.getElementById('status-badge');
    if (statusBadge) {
        statusBadge.className = 'status-badge online';
        statusBadge.textContent = '🟢 Backend Connected | Real-time Analysis';
    }
    
    // ========== PLAY SOUND BASED ON RISK LEVEL ==========
    playSoundByRisk(riskLevel);
}

// ========== SOUND SYSTEM - 3 TYPES (LOW, MEDIUM, HIGH) ==========
function getAudioContext() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        return audioContext;
    } catch(e) {
        console.log('Audio error:', e);
        return null;
    }
}

// LOW RISK SOUND - Single Soft Beep (एक बार "टुक")
function playLowRiskSound() {
    if (!soundEnabled) return;
    
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.value = 440;  // Soft pitch
        gainNode.gain.value = 0.2;          // Low volume
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.2);
        
        console.log('🔊 LOW RISK SOUND - Single beep');
    } catch(e) {
        console.log('Low risk sound error:', e);
    }
}

// MEDIUM RISK SOUND - Double Beep (दो बार "टुक टुक")
function playMediumRiskSound() {
    if (!soundEnabled) return;
    
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // First beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.value = 660;
        gain1.gain.value = 0.25;
        osc1.start();
        osc1.stop(ctx.currentTime + 0.15);
        
        // Second beep after 200ms
        setTimeout(() => {
            try {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.type = 'sine';
                osc2.frequency.value = 660;
                gain2.gain.value = 0.25;
                osc2.start();
                osc2.stop(ctx.currentTime + 0.15);
            } catch(e) {}
        }, 200);
        
        console.log('🔊 MEDIUM RISK SOUND - Double beep');
    } catch(e) {
        console.log('Medium risk sound error:', e);
    }
}

// HIGH RISK SOUND - Triple Beep (तीन बार "टुक टुक टुक")
function playHighRiskSound() {
    if (!soundEnabled) return;
    
    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        
        // Three beeps with 200ms gap
        for(let i = 0; i < 3; i++) {
            setTimeout(() => {
                try {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.type = 'sine';
                    osc.frequency.value = 880;
                    gain.gain.value = 0.3;
                    osc.start();
                    osc.stop(ctx.currentTime + 0.15);
                } catch(e) {}
            }, i * 250);
        }
        
        console.log('🔊 HIGH RISK SOUND - Triple beep');
    } catch(e) {
        console.log('High risk sound error:', e);
    }
}

// Main function to play sound based on risk level
function playSoundByRisk(riskLevel) {
    if (!soundEnabled) {
        console.log('Sound is disabled');
        return;
    }
    
    console.log('Playing sound for risk level:', riskLevel);
    
    if (riskLevel === 'HIGH') {
        playHighRiskSound();
    } else if (riskLevel === 'MEDIUM') {
        playMediumRiskSound();
    } else {
        playLowRiskSound();
    }
}

// Toggle sound on/off
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');
    if (btn) {
        btn.innerHTML = soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        btn.style.color = soundEnabled ? '#00ff88' : '#ff006e';
    }
    localStorage.setItem('soundEnabled', soundEnabled);
    showNotification(soundEnabled ? '🔊 Sound Enabled' : '🔇 Sound Disabled', 'info');
}

// Resume audio on first user click (browser policy)
document.body.addEventListener('click', function initAudio() {
    try {
        const ctx = getAudioContext();
        if (ctx && ctx.state === 'suspended') {
            ctx.resume();
            console.log('🎵 Audio context resumed successfully');
            showNotification('🔊 Sound is now active!', 'success');
        }
    } catch(e) {}
    document.body.removeEventListener('click', initAudio);
}, { once: true });

// ========== TRANSACTION HISTORY ==========
function addToHistory(transaction) {
    const newTransaction = {
        id: Date.now(),
        amount: transaction.amount,
        score: transaction.fraud_score,
        risk: transaction.risk_level,
        isFraud: transaction.is_fraud,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        timestamp: transaction.timestamp
    };
    
    transactionHistory.unshift(newTransaction);
    if (transactionHistory.length > 20) transactionHistory.pop();
    
    saveHistory();
    updateHistoryTable();
}

function updateHistoryTable() {
    const tbody = document.getElementById('historyBody');
    if (!tbody) return;
    
    if (transactionHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No transactions yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactionHistory.map(tx => `
        <tr>
            <td>${tx.time}</td>
            <td>$${tx.amount.toFixed(2)}</td>
            <td>${tx.score}%</td>
            <td>${tx.risk}</td>
            <td class="${tx.isFraud ? 'fraud-text' : 'safe-text'}">${tx.isFraud ? '🚨 FRAUD' : '✅ SAFE'}</td>
        </tr>
    `).join('');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all transaction history?')) {
        transactionHistory = [];
        saveHistory();
        updateHistoryTable();
        updateStatistics();
        showNotification('History cleared successfully!', 'success');
    }
}

function exportToCSV() {
    if (transactionHistory.length === 0) {
        showNotification('No transactions to export!', 'warning');
        return;
    }
    
    let csvContent = "Time,Amount,Score,Risk,Status\n";
    transactionHistory.forEach(tx => {
        csvContent += `${tx.time},$${tx.amount},${tx.score}%,${tx.risk},${tx.isFraud ? 'FRAUD' : 'SAFE'}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud_report_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Report exported successfully!', 'success');
}

// ========== STATISTICS ==========
function updateStatistics() {
    const total = transactionHistory.length;
    const fraud = transactionHistory.filter(tx => tx.isFraud).length;
    const fraudRate = total > 0 ? ((fraud / total) * 100).toFixed(1) : 0;
    
    const totalElem = document.getElementById('totalTransactions');
    const fraudElem = document.getElementById('fraudCount');
    const rateElem = document.getElementById('fraudRate');
    
    if (totalElem) totalElem.textContent = total;
    if (fraudElem) fraudElem.textContent = fraud;
    if (rateElem) rateElem.textContent = fraudRate + '%';
    
    updateChart();
}

function updateChart() {
    const canvas = document.getElementById('fraudChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const fraud = transactionHistory.filter(tx => tx.isFraud).length;
    const safe = transactionHistory.length - fraud;
    
    if (fraudChart) fraudChart.destroy();
    
    fraudChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Safe Transactions', 'Fraud Detected'],
            datasets: [{
                data: [safe, fraud],
                backgroundColor: ['#00ff88', '#ff006e'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#e0e0ff' }
                }
            }
        }
    });
}

// ========== COPY REPORT ==========
function copyReport() {
    const scoreElem = document.getElementById('score-circle');
    const riskElem = document.getElementById('risk-label');
    const verdictElem = document.getElementById('verdict');
    
    const score = scoreElem ? scoreElem.textContent : 'N/A';
    const risk = riskElem ? riskElem.textContent : 'N/A';
    const verdict = verdictElem ? verdictElem.textContent : 'N/A';
    
    const report = `
🔐 FRAUD DETECTION REPORT
━━━━━━━━━━━━━━━━━━━━━
📊 Fraud Score: ${score}
⚠️ Risk Level: ${risk}
🎯 Verdict: ${verdict}
━━━━━━━━━━━━━━━━━━━━━
Report generated: ${new Date().toLocaleString()}
    `;
    
    navigator.clipboard.writeText(report).then(() => {
        showNotification('📋 Report copied to clipboard!', 'success');
    });
}

// ========== DARK/LIGHT MODE ==========
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = isLight ? '☀️ Light' : '🌙 Dark';
    }
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    if (fraudChart) updateChart();
}

// ========== LOCAL STORAGE ==========
function saveHistory() {
    localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('transactionHistory');
    if (saved) {
        transactionHistory = JSON.parse(saved);
        updateHistoryTable();
        updateStatistics();
        if (transactionHistory.length > 0) {
            const historySection = document.getElementById('historySection');
            const statsSection = document.getElementById('statsSection');
            if (historySection) historySection.style.display = 'block';
            if (statsSection) statsSection.style.display = 'block';
        }
    }
}

function loadSettings() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.textContent = '☀️ Light';
    }
    
    const savedSound = localStorage.getItem('soundEnabled');
    if (savedSound !== null) {
        soundEnabled = savedSound === 'true';
        const soundBtn = document.getElementById('soundToggle');
        if (soundBtn) {
            soundBtn.innerHTML = soundEnabled ? '🔊 Sound ON' : '🔇 Sound OFF';
        }
    }
    
    const lastAmount = localStorage.getItem('lastAmount');
    const lastHour = localStorage.getItem('lastHour');
    const amountInput = document.getElementById('amount');
    const hourInput = document.getElementById('hour');
    
    if (lastAmount && amountInput) amountInput.value = lastAmount;
    if (lastHour && hourInput) hourInput.value = lastHour;
}

// Save form values on change
const amountInput = document.getElementById('amount');
const hourInput = document.getElementById('hour');

if (amountInput) {
    amountInput.addEventListener('change', (e) => {
        localStorage.setItem('lastAmount', e.target.value);
    });
}
if (hourInput) {
    hourInput.addEventListener('change', (e) => {
        localStorage.setItem('lastHour', e.target.value);
    });
}

// ========== NOTIFICATION ==========
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff006e' : '#00d4ff'};
        color: ${type === 'success' ? '#0a0e27' : 'white'};
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        cursor: pointer;
        font-weight: bold;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    notification.onclick = () => notification.remove();
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ========== KEYBOARD SHORTCUT ==========
document.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && document.activeElement.tagName !== 'BUTTON') {
        analyzeTransaction();
    }
});

// ========== CHECK SERVER ==========
async function checkServer() {
    try {
        const response = await fetch(`${API_URL}/api/health`);
        if (response.ok) {
            console.log('✅ Server connected');
            showNotification('✅ Backend Connected!', 'success');
        }
    } catch (error) {
        console.log('⚠️ Server not running');
        showNotification('⚠️ Backend not running! Run python app.py', 'error');
    }
}
setTimeout(checkServer, 1000);

console.log('✅ Script loaded successfully!');
console.log('🔊 Sound System Ready - LOW (1 beep), MEDIUM (2 beeps), HIGH (3 beeps)');
