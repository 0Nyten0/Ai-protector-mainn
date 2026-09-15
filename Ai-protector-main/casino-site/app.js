let balance = localStorage.getItem('grand_palace_balance') ? parseFloat(localStorage.getItem('grand_palace_balance')) : 150000.00;

const mainBalanceEl = document.getElementById('mainBalance');
const ingameBalanceEl = document.getElementById('ingameBalance');
const recentWinsFeed = document.getElementById('recentWinsFeed');
const depositModal = document.getElementById('globalDepositModal');

const fakeNames = ["Alisher***", "Qazaq_777", "VIP_Max", "CryptoT", "User_8192", "Lucky_Kz", "Deka99", "Aruzhan_W"];
const fakeGames = ["Sweet Bonanza", "Gates of Olympus", "Aviator", "Space XY", "Book of Dead", "The Dog House"];

function updateBalance(amount) {
    balance = amount;
    localStorage.setItem('grand_palace_balance', balance.toFixed(2));
    mainBalanceEl.innerText = balance.toFixed(2);
    ingameBalanceEl.innerText = balance.toFixed(2);
}

function generateLiveFeed() {
    const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
    const game = fakeGames[Math.floor(Math.random() * fakeGames.length)];
    const winAmount = (Math.random() * 50000 + 1000).toFixed(0);

    const feedItem = document.createElement('div');
    feedItem.className = 'feed-item';
    feedItem.innerHTML = `
        <span class="feed-user">${name}</span>
        <span class="feed-game">в ${game}</span>
        <span class="feed-amount">+${winAmount} ₸</span>
    `;

    recentWinsFeed.prepend(feedItem);

    if (recentWinsFeed.children.length > 5) {
        recentWinsFeed.removeChild(recentWinsFeed.lastChild);
    }

    const nextTime = Math.random() * 3000 + 1000;
    setTimeout(generateLiveFeed, nextTime);
}

document.querySelectorAll('.nav-item').forEach(navBtn => {
    navBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        navBtn.classList.add('active');

        const targetPage = navBtn.getAttribute('data-page');
        document.querySelectorAll('.page-view').forEach(page => {
            page.style.display = 'none';
            page.classList.remove('active');
        });

        const activePage = document.getElementById(`page-${targetPage}`);
        if (activePage) {
            activePage.style.display = 'block';
            setTimeout(() => activePage.classList.add('active'), 10);
        } else {
            const homePage = document.getElementById('page-home');
            homePage.style.display = 'block';
            setTimeout(() => homePage.classList.add('active'), 10);
        }
    });
});

document.getElementById('headerDepositBtn').addEventListener('click', () => {
    depositModal.style.display = 'flex';
});

document.querySelector('.close-modal').addEventListener('click', () => {
    depositModal.style.display = 'none';
});

document.querySelectorAll('.deposit-amounts button').forEach(btn => {
    btn.addEventListener('click', () => {
        const val = parseFloat(btn.getAttribute('data-val'));
        updateBalance(balance + val);
        depositModal.style.display = 'none';
    });
});

document.getElementById('confirmDeposit').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('customDeposit').value);
    if (!isNaN(val) && val > 0) {
        updateBalance(balance + val);
        document.getElementById('customDeposit').value = '';
        depositModal.style.display = 'none';
    }
});

document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const gameName = card.querySelector('.game-name').innerText;
        
        document.querySelectorAll('.page-view').forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });
        
        const gameInterface = document.getElementById('game-interface');
        gameInterface.style.display = 'block';
        setTimeout(() => gameInterface.classList.add('active'), 10);
        
        document.getElementById('currentGameTitle').innerText = gameName;
        initGameEngine();
    });
});

document.getElementById('backToLobby').addEventListener('click', () => {
    document.querySelectorAll('.page-view').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    const homePage = document.getElementById('page-home');
    homePage.style.display = 'block';
    setTimeout(() => homePage.classList.add('active'), 10);
    
    document.querySelector('[data-page="home"]').click();
});

function initGameEngine() {
    const engineArea = document.getElementById('gameEngineArea');
    engineArea.innerHTML = `
        <div id="gameDisplay" style="font-size: 80px; margin-bottom: 30px; transition: transform 0.1s;">🎰</div>
        <div id="winMsg" style="color: #00e700; font-size: 24px; font-weight: bold; height: 35px; margin-bottom: 20px;"></div>
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <button id="btnHalf" style="padding: 10px 20px; background: #1a242d; color: #fff; border: 1px solid #2a3746; border-radius: 8px; cursor: pointer;">1/2</button>
            <input type="number" id="gameBetInput" value="1000" style="background: #1a242d; border: 1px solid #14ffec; color: #fff; padding: 10px 20px; font-size: 20px; border-radius: 8px; width: 150px; text-align: center; outline: none;">
            <button id="btnDouble" style="padding: 10px 20px; background: #1a242d; color: #fff; border: 1px solid #2a3746; border-radius: 8px; cursor: pointer;">x2</button>
        </div>
        <button id="actionPlay" style="background: #14ffec; color: #000; font-size: 24px; font-weight: 800; padding: 15px 60px; border: none; border-radius: 12px; cursor: pointer; text-transform: uppercase;">ИГРАТЬ</button>
    `;

    const betInput = document.getElementById('gameBetInput');
    const playBtn = document.getElementById('actionPlay');
    const display = document.getElementById('gameDisplay');
    const winMsg = document.getElementById('winMsg');

    document.getElementById('btnHalf').addEventListener('click', () => {
        let val = parseFloat(betInput.value);
        if (val > 10) betInput.value = Math.max(10, Math.floor(val / 2));
    });

    document.getElementById('btnDouble').addEventListener('click', () => {
        let val = parseFloat(betInput.value);
        if (val * 2 <= balance) betInput.value = Math.floor(val * 2);
    });

    let isPlaying = false;

    playBtn.addEventListener('click', () => {
        const bet = parseFloat(betInput.value);
        if (isNaN(bet) || bet <= 0 || bet > balance || isPlaying) return;

        isPlaying = true;
        updateBalance(balance - bet);
        winMsg.innerText = '';
        display.style.transform = 'scale(0.9)';
        playBtn.style.opacity = '0.5';
        
        const symbols = ['🍒', '🍋', '⭐', '💎', '🔔', '🚀', '🎡', '💰'];
        
        let spins = 0;
        const spinInterval = setInterval(() => {
            display.innerText = symbols[Math.floor(Math.random() * symbols.length)] + 
                                symbols[Math.floor(Math.random() * symbols.length)] + 
                                symbols[Math.floor(Math.random() * symbols.length)];
            spins++;
            
            if (spins > 10) {
                clearInterval(spinInterval);
                display.style.transform = 'scale(1)';
                
                const isWin = Math.random() < 0.35;
                
                if (isWin) {
                    const multiplier = Math.random() < 0.1 ? (Math.floor(Math.random() * 5) + 2) : 2;
                    const winAmount = bet * multiplier;
                    updateBalance(balance + winAmount);
                    display.innerText = '💰💰💰';
                    winMsg.innerText = `+${winAmount} KZT (${multiplier}x)`;
                } else {
                    display.innerText = '💀💀💀';
                }
                
                isPlaying = false;
                playBtn.style.opacity = '1';
            }
        }, 50);
    });
}

updateBalance(balance);
generateLiveFeed();