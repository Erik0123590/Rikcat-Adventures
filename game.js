import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screens = {
    title: document.getElementById("titleScreen"),
    config: document.getElementById("configScreen"),
    game: document.getElementById("game")
};

/* --- 1. CONFIGURAÇÕES E VARIÁVEIS --- */
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const SPEED = 5;
const FRICTION = 0.8;

let playing = false;
let onlineEnabled = false;
let cameraX = 0;
let chatActive = false;

const rikcat = {
    x: 100, y: 100, w: 32, h: 32,
    vx: 0, vy: 0, 
    onGround: false,
    skin: "rikcat",
    color: "#FFB000", // <--- COR INICIAL
    nick: "Convidado", // <--- NICK INICIAL
    facing: 1,
    stretchY: 1
};

const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const chatRef = ref(db, `rooms/${room}/chat`); // <--- REFERÊNCIA DO CHAT

const platforms = [
    {x: 0, y: 0, h: 40, w: 5000, offset: 40},
    {x: 200, y: 0, h: 20, w: 140, offset: 130},
    {x: 450, y: 0, h: 20, w: 140, offset: 220},
    {x: 700, y: 0, h: 20, w: 140, offset: 300}
];

function updatePlatforms() {
    platforms.forEach(p => p.realY = canvas.height - p.offset);
}

/* --- 2. SISTEMA DE CHAT (ADICIONADO AQUI) --- */
const chatInput = document.getElementById("chatInput");
const chatBox = document.getElementById("chatBox");
const openChatBtn = document.getElementById("openChatBtn");

// Botão para abrir/fechar chat
if(openChatBtn) {
    openChatBtn.onclick = () => {
        chatActive = !chatActive;
        const container = document.getElementById("chatContainer");
        if(container) container.style.display = chatActive ? "flex" : "none";
        if(chatActive && chatInput) chatInput.focus();
    };
}

// Enviar mensagem ao apertar ENTER
if(chatInput) {
    chatInput.onkeydown = (e) => {
        if(e.key === "Enter" && chatInput.value.trim() !== "") {
            push(chatRef, {
                sender: rikcat.nick, // Usa o Nick escolhido
                text: chatInput.value,
                timestamp: Date.now()
            });
            chatInput.value = "";
        }
    };
}

// Receber mensagens do Firebase
onValue(chatRef, (snap) => {
    if(!chatBox) return;
    const msgs = snap.val();
    chatBox.innerHTML = "";
    if(msgs) {
        // Pega as últimas 15 mensagens para não travar
        const list = Object.values(msgs).slice(-15);
        list.forEach(m => {
            const div = document.createElement("div");
            div.style.marginBottom = "5px";
            div.innerHTML = `<b style="color:#FFD700">${m.sender}:</b> ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* --- 3. INPUTS DE MOVIMENTO --- */
const keys = {};
window.onkeydown = e => { if(!chatActive) keys[e.code] = true; };
window.onkeyup = e => keys[e.code] = false;

/* --- 4. DESENHO (COR E NICK APLICADOS) --- */
function drawPlayer(p) {
    const centerX = p.x - cameraX + 16;
    const groundY = p.y + 32; // Fix do chão
    
    ctx.save();
    ctx.translate(centerX, groundY);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if (p.skin === "rikcat") {
        // --- RIKCAT CLÁSSICO ---
        ctx.lineWidth = 3; ctx.strokeStyle = "#000"; 
        ctx.fillStyle = p.color; // <--- APLICA A COR ESCOLHIDA

        // Orelhas
        [-1, 1].forEach(side => {
            ctx.save(); ctx.scale(side, 1);
            ctx.beginPath(); 
            ctx.moveTo(-18, -25); ctx.lineTo(-24, -45); ctx.lineTo(-8, -32); 
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        });

        // Cabeça
        ctx.beginPath(); ctx.arc(0, -16, 16, 0, Math.PI * 2); 
        ctx.fill(); ctx.stroke();

        // Rosto
        ctx.fillStyle = "#000";
        ctx.fillRect(-6, -20, 4, 8); ctx.fillRect(2, -20, 4, 8); 

    } else if (p.skin === "polvo") {
        // --- POLVO ---
        ctx.lineWidth = 2; ctx.strokeStyle = "#000"; 
        ctx.fillStyle = p.color; // <--- APLICA A COR ESCOLHIDA

        // Cabeça
        ctx.beginPath(); ctx.ellipse(0, -20, 16, 20, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Tentáculos
        ctx.beginPath(); ctx.moveTo(-16, -10);
        for(let i=-16; i<=16; i+=8) ctx.quadraticCurveTo(i+4, 0, i+8, -10);
        ctx.fill(); ctx.stroke();

        // Olhos
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(-6, -22, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(6, -22, 5, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(-6, -22, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -22, 2, 0, Math.PI*2); ctx.fill();
    }

    // --- DESENHO DO NICK ---
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
    ctx.shadowColor = "black"; ctx.shadowBlur = 3;
    ctx.fillText(p.nick || "Player", p.x - cameraX + 16, p.y - 20); // <--- DESENHA O NICK
    ctx.restore();
}

/* --- 5. LOOP PRINCIPAL --- */
function update() {
    if(!playing) return;
    requestAnimationFrame(update);
    updatePlatforms();

    if(!chatActive) {
        if (keys["ArrowLeft"] || keys["KeyA"]) { rikcat.vx = -SPEED; rikcat.facing = -1; }
        else if (keys["ArrowRight"] || keys["KeyD"]) { rikcat.vx = SPEED; rikcat.facing = 1; }
        else rikcat.vx *= FRICTION;
        if ((keys["Space"] || keys["ArrowUp"]) && rikcat.onGround) { 
            rikcat.vy = JUMP_FORCE; rikcat.onGround = false; rikcat.stretchY = 1.3; 
        }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    // Colisão (Anti-atravessar chão)
    let ground = false;
    platforms.forEach(p => {
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > p.realY && rikcat.y + rikcat.h < p.realY + p.h + 5 &&
            rikcat.vy > 0) {
            rikcat.y = p.realY - rikcat.h; 
            rikcat.vy = 0;
            ground = true;
        }
    });
    rikcat.onGround = ground;

    cameraX = rikcat.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

    // Render
    ctx.fillStyle = "#6AA5FF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513"; platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.realY, p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { 
            x: rikcat.x, y: rikcat.y, skin: rikcat.skin, 
            color: rikcat.color, // Envia a cor
            facing: rikcat.facing, 
            nick: rikcat.nick, // Envia o nick
            stretchY: rikcat.stretchY 
        });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* --- 6. TELAS E BOTÕES --- */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;
    if(online) {
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            const data = snap.val() || {};
            for (let id in onlinePlayers) if (!data[id]) delete onlinePlayers[id];
            Object.assign(onlinePlayers, data);
        });
        if(openChatBtn) openChatBtn.style.display = "flex";
    }
    update();
}

document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";

// SALVAR CONFIGURAÇÕES (NICK, COR, SKIN)
document.getElementById("closeConfig").onclick = () => {
    const nick = document.getElementById("nickInput").value.trim();
    if(nick) rikcat.nick = nick;
    
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    
    screens.config.style.display = "none";
};

// Controles Mobile
const bindTouch = (id, key) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener("touchstart", (e) => { e.preventDefault(); keys[key] = true; }, {passive: false});
    el.addEventListener("touchend", (e) => { e.preventDefault(); keys[key] = false; }, {passive: false});
};
bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
