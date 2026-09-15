import { score } from './model.js';

let isProcessing = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'ANALYZE_DATA') {
        const payload = request.payload;
        
        // payload = [hour, clicks, rage_clicks, mouse_dist, mouse_area, ibi, bbr, loss_streak, loss_chasing, game_switches]
        
        
        const probabilities = score(payload);
        const tiltProbability = probabilities[1]; 

        console.log(`[AI Analytics] Tilt Probability: ${(tiltProbability * 100).toFixed(1)}%`);

        if (!isProcessing) {
            if (tiltProbability > 0.75) {
                triggerIntervention(sender.tab.id, 'high', payload);
            } else if (tiltProbability > 0.55) {
                triggerIntervention(sender.tab.id, 'low', payload);
            }
        }
    }
});

async function triggerIntervention(tabId, level, payload) {
    isProcessing = true;
    
    const hour = payload[0];
    const lossStreak = payload[7];
    const lossChasing = payload[8] === 1;

    let contextStr = `Время: ${hour}:00. `;
    if (lossStreak > 0) contextStr += `Игрок проиграл ${lossStreak} раз подряд. `;
    if (lossChasing) contextStr += `Он совершает ошибку 'Loss Chasing' (повысил ставку сразу после проигрыша в попытке отыграться). `;

    const systemPrompt = `Ты ИИ-психотерапевт, специализирующийся на лечении лудомании (игровой зависимости). 
Контекст текущей сессии: ${contextStr}
Уровень угрозы: ${level === 'high' ? 'КРИТИЧЕСКИЙ (агрессивный тильт)' : 'СРЕДНИЙ (потеря фокуса)'}.

Твоя задача: Напиши ОДНО короткое, жесткое, но эмпатичное предложение (максимум 15 слов) на русском языке, чтобы вырвать человека из состояния азартного транса. Используй когнитивно-поведенческий подход. Без приветствий, сразу к делу. Упомяни его текущие действия, если они есть в контексте.`;

    try {
        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "qwen2.5:1.5b", 
                prompt: systemPrompt,
                stream: false
            })
        });

        const data = await response.json();
        const aiText = data.response;

        chrome.tabs.sendMessage(tabId, {
            type: 'SHOW_WARNING',
            text: aiText,
            level: level
        });

    } catch (error) {
        console.error("Ollama connection failed:", error);
        let fallbackText = level === 'high' 
            ? "ОСТАНОВИСЬ. Ты в состоянии аффекта и пытаешься отыграться. Система заморожена для твоей безопасности."
            : "Замечены признаки потери контроля. Сделай глубокий вдох и оцени свои действия.";
            
        chrome.tabs.sendMessage(tabId, {
            type: 'SHOW_WARNING',
            text: fallbackText,
            level: level
        });
    } finally {
        const cooldown = level === 'high' ? 60000 : 30000;
        setTimeout(() => { isProcessing = false; }, cooldown);
    }
}