let windowClicks = 0;
let windowRageClicks = 0;
let mouseDist = 0;
let mousePoints = [];
let gameSwitches = 0;
let lastClickTime = 0;
let lastBet = 0;
let lastBalance = 150000;
let lossStreak = 0;
let lastPlayTime = Date.now();
let isChasingLoss = 0;

document.addEventListener('mousemove', (e) => {
    if (mousePoints.length > 0) {
        const lastP = mousePoints[mousePoints.length - 1];
        mouseDist += Math.sqrt(Math.pow(e.clientX - lastP.x, 2) + Math.pow(e.clientY - lastP.y, 2));
    }
    if (Math.random() > 0.8) mousePoints.push({x: e.clientX, y: e.clientY});
});

document.addEventListener('click', (e) => {
    windowClicks++;
    const now = Date.now();
    if (now - lastClickTime < 300) windowRageClicks++;
    lastClickTime = now;

    if (e.target.closest('.nav-item') || e.target.closest('.game-card')) {
        gameSwitches++;
    }

    if (e.target.id === 'actionPlay' || e.target.closest('#actionPlay')) {
        const betInput = document.getElementById('gameBetInput');
        const balEl = document.getElementById('ingameBalance');
        const currentBet = betInput ? parseFloat(betInput.value) || 0 : 0;
        const currentBalance = balEl ? parseFloat(balEl.innerText) || 0 : 0;
        
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

setInterval(() => {
    let area = 0;
    if (mousePoints.length > 2) {
        const xs = mousePoints.map(p => p.x);
        const ys = mousePoints.map(p => p.y);
        area = Math.round((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)));
    }

    const balEl = document.getElementById('ingameBalance');
    const betInput = document.getElementById('gameBetInput');
    const currentBalance = balEl ? parseFloat(balEl.innerText) || lastBalance : lastBalance;
    const currentBet = betInput ? parseFloat(betInput.value) || lastBet : lastBet;
    const bbr = currentBalance > 0 ? parseFloat((currentBet / currentBalance).toFixed(4)) : 0;
    const hour = new Date().getHours();
    let ibi = Date.now() - lastPlayTime;
    if (ibi > 10000) ibi = 10000;

    const payload = [
        hour,
        windowClicks,
        windowRageClicks,
        Math.round(mouseDist),
        area,
        ibi,
        bbr,
        lossStreak,
        isChasingLoss,
        gameSwitches
    ];

    if (windowClicks > 0 || mouseDist > 0) {
        chrome.runtime.sendMessage({ type: 'ANALYZE_DATA', payload: payload });
    }

    windowClicks = 0;
    windowRageClicks = 0;
    mouseDist = 0;
    mousePoints = [];
    gameSwitches = 0;
}, 5000);

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SHOW_WARNING') {
        createOverlay(msg.text, msg.level);
    }
});

function createOverlay(text, level) {
    if (document.getElementById('ai-gamble-warning')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ai-gamble-warning';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.98); z-index: 2147483647;
        display: flex; flex-direction: column; justify-content: center; align-items: center;
        color: white; font-family: 'Segoe UI', sans-serif; text-align: center; padding: 20px;
        backdrop-filter: blur(10px);
    `;

    const lostAmount = 150000 - lastBalance;
    const workHours = lostAmount > 0 ? (lostAmount / 2500).toFixed(1) : 0;
    
    const isHigh = level === 'high';
    const titleColor = isHigh ? '#ff0044' : '#ffcc00';
    const titleText = isHigh ? '🚨 КРИТИЧЕСКИЙ УРОВЕНЬ ТИЛЬТА' : '⚠️ ПАУЗА ОСОЗНАННОСТИ';

    let html = `<h1 style="color: ${titleColor}; font-size: 36px; margin-bottom: 15px; text-transform: uppercase;">${titleText}</h1>`;
    html += `<p style="font-size: 22px; color: #e0e0e0; max-width: 700px; line-height: 1.5;">${text}</p>`;

    if (lostAmount > 0) {
        html += `
            <div style="background: rgba(255,0,0,0.1); padding: 25px; border-radius: 15px; margin: 30px 0; border: 1px solid #ff0044;">
                <p style="margin: 0 0 10px 0; font-size: 20px;">Текущий проигрыш: <span style="color: #ff4444; font-weight: bold; font-size: 28px;">${lostAmount} KZT</span></p>
                <p style="margin: 0; font-size: 18px; color: #aaa;">Это эквивалентно <span style="color: #14ffec; font-weight: bold;">${workHours} ч.</span> твоей реальной работы</p>
            </div>
        `;
    }

    if (isHigh) {
        html += `
            <div id="awareness-form" style="margin: 20px 0;">
                <p style="font-size: 18px; color: #fff; margin-bottom: 15px;">Почему ты повышаешь ставки и продолжаешь?</p>
                <div style="display: flex; gap: 15px; justify-content: center;">
                    <button class="reason-btn" style="padding: 15px 25px; background: #1a242d; color: white; border: 1px solid #2a3746; border-radius: 8px; cursor:pointer; font-size: 16px; transition: 0.2s;">Хочу отыграться</button>
                    <button class="reason-btn" style="padding: 15px 25px; background: #1a242d; color: white; border: 1px solid #2a3746; border-radius: 8px; cursor:pointer; font-size: 16px; transition: 0.2s;">Не могу остановиться</button>
                    <button class="reason-btn" style="padding: 15px 25px; background: #1a242d; color: white; border: 1px solid #2a3746; border-radius: 8px; cursor:pointer; font-size: 16px; transition: 0.2s;">Я злюсь</button>
                </div>
            </div>
        `;
    }

    html += `<button id="closeWarn" disabled style="margin-top: 20px; padding: 18px 50px; font-size: 18px; font-weight: bold; background: #333; color: #777; border: none; border-radius: 8px; cursor: not-allowed; text-transform: uppercase;">Система заблокирована</button>`;

    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    let timeLeft = isHigh ? 60 : 15;
    const btn = document.getElementById('closeWarn');
    
    const timer = setInterval(() => {
        timeLeft--;
        btn.innerText = `ОХЛАЖДЕНИЕ: ${timeLeft} СЕК`;
        if (timeLeft <= 0) {
            clearInterval(timer);
            btn.innerText = "Я КОНТРОЛИРУЮ СЕБЯ. ВЕРНУТЬСЯ";
            btn.style.background = "#00e700";
            btn.style.color = "#000";
            btn.style.cursor = "pointer";
            btn.disabled = false;
        }
    }, 1000);

    btn.onclick = () => { if (!btn.disabled) overlay.remove(); };

    document.querySelectorAll('.reason-btn').forEach(b => {
        b.onclick = () => {
            document.querySelectorAll('.reason-btn').forEach(btn => btn.style.background = '#1a242d');
            b.style.background = '#ff0044';
            b.style.borderColor = '#ff0044';
            const form = document.getElementById('awareness-form');
            form.innerHTML = "<p style='color: #14ffec; font-size: 20px; font-weight: bold;'>Принято. Эмоции временны, деньги — это твое время.</p>";
        };
    });
}