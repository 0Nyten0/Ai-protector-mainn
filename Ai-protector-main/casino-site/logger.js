let isRecording = false;
let currentLabel = 0; 
let logs = [];
let intervalId = null;

let windowClicks = 0;
let windowRageClicks = 0;
let mouseDist = 0;
let mousePoints = []; 
let gameSwitches = 0;
let lastClickTime = 0;

let lastBet = 0;
let lastBalance = parseFloat(localStorage.getItem('grand_palace_balance')) || 150000;
let lossStreak = 0;
let lastPlayTime = Date.now();
let isChasingLoss = 0; 

const loggerUI = document.createElement('div');
loggerUI.style.cssText = `
    position: fixed; bottom: 15px; right: 15px; background: rgba(15, 25, 35, 0.95); 
    padding: 15px; border: 2px solid #14ffec; color: #fff; z-index: 9999;
    font-family: monospace; border-radius: 12px; display: flex; flex-direction: column; gap: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.8); width: 280px;
`;
loggerUI.innerHTML = `
    <div id="riskIndicator" style="
    margin-top:10px;
    padding:10px;
    border-radius:8px;
    font-size:13px;
    font-weight:bold;
    text-align:center;
    color:#fff;
    background:#555;">Риск: -</div>
<div id="betSuggestion" style="
    margin-top:5px;
    font-size:12px;
    color:#8b9eb7;
    text-align:center;">Рекомендации по ставкам появятся здесь</div>
    <div style="font-size:12px; margin-top:5px;">Recommendation: <span id="betRecommendation">-</span></div>
    <div style="font-size:12px; margin-top:5px;">Player Type: <span id="playerType">-</span></div>
    <h3 style="margin:0; color: #14ffec; font-size: 14px;">🧠 AI RESEARCH DATASET</h3>
    <div style="font-size: 12px; color: #8b9eb7;">Status: <span id="recStatus" style="color:#ff4444; font-weight:bold;">STOPPED</span></div>
    <div style="font-size: 12px; color: #8b9eb7;">Samples: <span id="sampleCount" style="color:#fff;">0</span></div>
    <div style="font-size:12px; color:#fff;">Phase: <span id="currentPhase">-</span></div>
    <div style="margin-top:8px;">
    <canvas id="phaseChart" width="260" height="50" style="border:1px solid #14ffec; border-radius:6px;"></canvas>
    <canvas id="bbrChart" width="600" height="50" style="border-radius:12px; display:block; margin-top:5px;"></canvas>

    <div style="margin-top: 10px;">
   </div>
</div>
    <div style="display:flex; gap:5px; margin-top: 5px;">

        <button id="btnRecNorm" style="flex:1; background:#00e700; color:#000; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">[0] НОРМА</button>
        <button id="btnRecTilt" style="flex:1; background:#ff4444; color:#fff; padding:8px; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">[1] ТИЛЬТ</button>
    </div>

    <button id="btnDownloadCsv" style="background:#2a3746; color:#14ffec; padding:8px; border:1px solid #14ffec; border-radius:6px; cursor:pointer; margin-top:5px;">📥 СКАЧАТЬ .CSV</button>
`;
document.body.appendChild(loggerUI);

document.addEventListener('mousemove', (e) => {
    if (!isRecording) return;
    if (mousePoints.length > 0) {
        const lastP = mousePoints[mousePoints.length - 1];
        mouseDist += Math.sqrt(Math.pow(e.clientX - lastP.x, 2) + Math.pow(e.clientY - lastP.y, 2));
    }
    if (Math.random() > 0.8) mousePoints.push({x: e.clientX, y: e.clientY});
});

document.addEventListener('click', (e) => {
    if (!isRecording) return;
    windowClicks++;
    
    const now = Date.now();
    if (now - lastClickTime < 300) windowRageClicks++;
    lastClickTime = now;
});

document.querySelectorAll('.nav-item, .game-card').forEach(btn => {
    btn.addEventListener('click', () => { if (isRecording) gameSwitches++; });
});

document.body.addEventListener('click', (e) => {
    if (e.target.id === 'actionPlay' && isRecording) {
        const currentBet = parseFloat(document.getElementById('gameBetInput').value) || 0;
        const currentBalance = parseFloat(document.getElementById('ingameBalance').innerText) || 0;
        
        const ibi = Date.now() - lastPlayTime;
        lastPlayTime = Date.now();

        if (currentBalance < lastBalance) {
            lossStreak++;

            if (currentBet > lastBet) isChasingLoss = 1;
            else isChasingLoss = 0;
        } else if (currentBalance > lastBalance) {
            lossStreak = 0;
            isChasingLoss = 0;
        }

        lastBet = currentBet;
        lastBalance = currentBalance;
    }
});

function captureSnapshot() {

    // 🟢 Вычисляем площадь движения мыши
    let area = 0;
    if (mousePoints.length > 2) {
        const xs = mousePoints.map(p => p.x);
        const ys = mousePoints.map(p => p.y);
        const width = Math.max(...xs) - Math.min(...xs);
        const height = Math.max(...ys) - Math.min(...ys);
        area = Math.round(width * height);
    }

    // 🟢 Получаем текущие ставки и баланс
    const balanceEl = document.getElementById('ingameBalance');
    const betEl = document.getElementById('gameBetInput');

    const currentBalance = balanceEl ? parseFloat(balanceEl.innerText) : lastBalance;
    const currentBet = betEl ? parseFloat(betEl.value) : lastBet;

    const safeBalance = isNaN(currentBalance) ? lastBalance : currentBalance;
    const safeBet = isNaN(currentBet) ? lastBet : currentBet;

    const bbr = safeBalance > 0 ? (safeBet / safeBalance).toFixed(4) : 0;
    const hour = new Date().getHours();

    // 🟢 Определяем фазу поведения
    const phase = getBehaviorPhase(
        safeBet,
        safeBalance,
        lastBalance,
        windowRageClicks,
        lossStreak
    );

    // 🟢 Создаём снимок
    const snapshot = {
        hour: hour,
        clicks: windowClicks,
        rage_clicks: windowRageClicks,
        mouse_dist: Math.round(mouseDist),
        mouse_area: area,
        ibi: Math.min(Date.now() - lastPlayTime, 10000),
        bbr: bbr,
        loss_streak: lossStreak,
        loss_chasing: isChasingLoss,
        game_switches: gameSwitches,
        label: currentLabel,
        phase: phase
    };

    logs.push(snapshot);

    const recommendation = getBetRecommendation(snapshot);
const recEl = document.getElementById('betRecommendation');
if (recEl) {
    recEl.innerText = recommendation.message;
    recEl.style.color = recommendation.color;
}

    const playerType = classifyPlayerBehavior(snapshot);
const typeEl = document.getElementById('playerType');
if (typeEl) {
    typeEl.innerText = playerType;
    // Цветовая индикация
    typeEl.style.color = playerType === "Cautious" ? "#00e700" :
                         playerType === "Aggressive" ? "#ffcc00" :
                         "#ff4444";
}
    // 🟢 Обновляем UI
    document.getElementById('sampleCount').innerText = logs.length;

    const phaseEl = document.getElementById('currentPhase');
    if (phaseEl) phaseEl.innerText = phase;

    // 🟢 Обновляем графики
    drawPhaseChart();
    drawBBRChart();

    // 🟢 Новый блок: индикатор риска и рекомендации
    updateRiskAndSuggestion(snapshot);

    // 🟢 Сбрасываем счётчики
    windowClicks = 0;
    windowRageClicks = 0;
    mouseDist = 0;
    mousePoints = [];
    gameSwitches = 0;

    // 🟢 Анимация рамки
    loggerUI.style.borderColor = currentLabel === 0 ? '#00e700' : '#ff4444';
    setTimeout(() => loggerUI.style.borderColor = '#14ffec', 200);

    // 🟢 Обновляем последние значения
    lastBet = safeBet;
    lastBalance = safeBalance;
}

function startRecording(label) {
    if (isRecording) stopRecording();
    isRecording = true;
    currentLabel = label;
    
    const statusEl = document.getElementById('recStatus');
    statusEl.innerText = label === 0 ? "RECORDING (NORMAL)" : "RECORDING (TILT)";
    statusEl.style.color = label === 0 ? "#00e700" : "#ff4444";
    
    intervalId = setInterval(captureSnapshot, 5000); 
}

function getBehaviorPhase(currentBet, currentBalance, lastBalance, windowRageClicks, lossStreak) {
    // Exploration: мелкие ставки, нет потерь
    if (currentBet < 0.01 * currentBalance && lossStreak === 0) return "exploration";

    // Engagement: средние ставки, без резких кликов
    if (windowRageClicks < 5 && currentBet >= 0.01 * currentBalance && currentBet <= 0.05 * currentBalance) return "engagement";

    // Escalation: рост ставок, возможно первые потери
    if (currentBet > 0.05 * currentBalance && lossStreak > 0) return "escalation";

    // Loss Chasing: пытается отыграть проигрыши
    if (lossStreak >= 2 && currentBet > lastBalance * 0.05) return "loss_chasing";

    // Breakdown: много кликов, резкие ставки, потеря контроля
    if (windowRageClicks >= 5 && lossStreak >= 3) return "breakdown";

    return "engagement"; // по умолчанию
}

    const phaseColors = {
    exploration: "#00e700",
    engagement: "#00aaff",
    escalation: "#ff9a00",
    loss_chasing: "#ff4444",
    breakdown: "#9b00ff"
};

function classifyPlayerBehavior(snapshot) {
    let type = "Cautious"; // по умолчанию осторожный

    // Tilt-prone: серия проигрышей + резкие клики
    if (snapshot.loss_streak >= 2 && snapshot.rage_clicks >= 5) {
        type = "Tilt-prone";
    }
    // Aggressive: крупные ставки + escalation
    else if (snapshot.bbr > 0.05 && (snapshot.phase === "escalation" || snapshot.phase === "loss_chasing")) {
        type = "Aggressive";
    }
    // Осторожный: мелкие ставки и стабильная фаза
    else if (snapshot.bbr <= 0.02 && snapshot.phase === "exploration") {
        type = "Cautious";
    }

    return type;
}

function drawPhaseChart() {
    const canvas = document.getElementById('phaseChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // фон
    ctx.fillStyle = "#0f1923";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = 6;
    const gap = 2;
    const fullWidth = barWidth + gap;

    const maxBars = Math.floor(canvas.width / fullWidth);
    const startIndex = Math.max(0, logs.length - maxBars);

    for (let i = 0; i < maxBars && (startIndex + i) < logs.length; i++) {

        const snapshot = logs[startIndex + i];
        const color = phaseColors[snapshot.phase] || "#ffffff";

        const x = i * fullWidth;
        const y = 5;
        const height = canvas.height - 10;

        ctx.fillStyle = color;

        // Скруглённая палочка
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, height, 3);
        ctx.fill();

        // Glow эффект
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function updateRiskAndSuggestion(snapshot) {
    const riskEl = document.getElementById('riskIndicator');
    const suggestionEl = document.getElementById('betSuggestion');

    if (!riskEl || !suggestionEl) return;

    const { phase, bbr, loss_streak, currentLabel } = snapshot;

    let risk = "LOW";
    let color = "#00e700"; // green
    let suggestion = "Ставки в норме";

    // Определяем риск по фазе
    if (phase === "exploration") {
        risk = "LOW";
        color = "#00e700";
        suggestion = "Можно играть спокойно, ставки небольшие";
    }
    else if (phase === "engagement") {
        risk = "MEDIUM";
        color = "#ffaa00";
        suggestion = "Ставки умеренные, контролируйте баланс";
    }
    else if (phase === "escalation") {
        risk = "HIGH";
        color = "#ff4444";
        suggestion = "Ставки растут, будьте осторожны";
    }
    else if (phase === "loss_chasing") {
        risk = "VERY HIGH";
        color = "#ff0000";
        suggestion = "Попытка отыграть проигрыш — высокие риски";
    }
    else if (phase === "breakdown") {
        risk = "EXTREME";
        color = "#9b00ff";
        suggestion = "Потеря контроля! Рекомендуем остановиться";
    }

    // Дополнительная проверка BBR
    if (parseFloat(bbr) > 0.1 && loss_streak >= 2) {
        risk = "EXTREME";
        color = "#ff0066";
        suggestion = "Ставки слишком высоки, возможно стоит снизить";
    }

    // Обновляем UI
    riskEl.innerText = `Риск: ${risk}`;
    riskEl.style.background = color;
    suggestionEl.innerText = suggestion;
}

function drawBBRChart() {
    const canvas = document.getElementById('bbrChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // фон
    ctx.fillStyle = "#0f1923";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const maxPoints = canvas.width; // по одному пикселю на точку
    const startIndex = Math.max(0, logs.length - maxPoints);

    if (logs.length === 0) return;

    // Создаём путь для линии
    ctx.beginPath();
    for (let i = 0; i < maxPoints && (startIndex + i) < logs.length; i++) {
        const snapshot = logs[startIndex + i];
        const value = parseFloat(snapshot.bbr) || 0;

        const x = i;
        const y = canvas.height - value * canvas.height; // масштабируем по высоте

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }

    // Настройки линии
    ctx.strokeStyle = "#14ffec";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#14ffec";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function getBetRecommendation(snapshot) {
    const safeBBR = 0.05;  // верхняя граница безопасной ставки
    const cautionBBR = 0.1; // рискованная ставка

    let message = "✅ Ставка в норме";
    let color = "#00e700"; // зелёный по умолчанию

    if (snapshot.loss_streak >= 2 || snapshot.phase === "loss_chasing") {
        message = "⚠️ Рекомендуется снизить ставку (серия проигрышей)";
        color = "#ffcc00"; // жёлтый
    }

    if (snapshot.bbr > cautionBBR) {
        message = "🔥 Высокий риск! Уменьшите ставку";
        color = "#ff4444"; // красный
    }

    return { message, color };
}

function stopRecording() {
    isRecording = false;
    clearInterval(intervalId);
    document.getElementById('recStatus').innerText = "STOPPED";
    document.getElementById('recStatus').style.color = "#ff4444";
}

document.getElementById('btnRecNorm').onclick = () => startRecording(0);
document.getElementById('btnRecTilt').onclick = () => startRecording(1);

document.getElementById('btnDownloadCsv').onclick = () => {
    stopRecording();
    if (logs.length === 0) return alert("Нет данных для скачивания!");
    
    const headers = Object.keys(logs[0]).join(",");
    const rows = logs.map(obj => Object.values(obj).join(",")).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `casino_ai_dataset_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
};