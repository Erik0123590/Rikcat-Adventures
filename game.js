import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screens = {
    title: document.getElementById("titleScreen"),
    config: document.getElementById("configScreen"),
    game: document.getElementById("game")
};

/* FÍSICA */
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
    color: "#FFB000",
    nick: "Convidado",
    facing: 1,
    stretchY: 1
};

const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const chatDataRef = ref(db, `rooms/${room}/chat`);

const platforms = [
    {x: 0, y: 0, h: 40, w: 5000, offset: 40},
    {x: 200, y: 0, h: 20, w: 140, offset: 130},
    {x: 450, y: 0, h: 20, w: 140, offset: 220},
    {x: 700, y: 0, h: 20, w: 140, offset: 300}
];

// Atualiza a posição real Y das plataformas baseada na altura da tela
function updatePlatforms() {
    platforms.forEach(p => {
        p.realY = canvas.height - p.offset;
    });
}

/* INPUTS */
const keys = {};
window.onkeydown = e => { if(!chatActive) keys[e.code] = true; };
window.onkeyup = e => keys[e.code] = false;

/* LOGICA DO CHAT */
const chatInput = document.getElementById("chatInput");
const openChatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
const chatBox = document.getElementById("chatBox");

if(openChatBtn) {
    openChatBtn.onclick = () => {
        chatActive = !chatActive;
        if(chatContainer) chatContainer.style.display = chatActive ? "flex" : "none";
        if(chatActive && chatInput) chatInput.focus();
    };
}

if(chatInput) {
    chatInput.onkeydown = (e) => {
        if(e.key === "Enter" && chatInput.value.trim() !== "") {
            push(chatDataRef, {
                sender: rikcat.nick,
                text: chatInput.value,
                time: Date.now()
            });
            chatInput.value = "";
        }
    };
}

onValue(chatDataRef, snap => {
    if(!chatBox) return;
    chatBox.innerHTML = "";
    const msgs = snap.val();
    if(msgs) {
        Object.values(msgs).slice(-30).forEach(m => {
            const div = document.createElement("div");
            div.style.marginBottom = "4px";
            div.innerHTML = `<span style="color:#FFD700">●</span> <b>${m.sender}:</b> ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* DESENHO DO PERSONAGEM */
function drawPlayer(p) {
    const centerX = p.x - cameraX + 16;
    const baseY = p.y + 32; 
    
    ctx.save();
    ctx.translate(centerX, baseY);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if(p.skin === "rikcat"){
        ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.fillStyle = p.color;
        // Orelhas
        [-1, 1].forEach(side => {
            ctx.save(); ctx.scale(side, 1);
            ctx.beginPath(); ctx.moveTo(-22, -24); ctx.lineTo(-24, -51); ctx.lineTo(-5, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        });
        // Cabeça
        ctx.beginPath(); ctx.arc(0, -22, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // Olhos
        ctx.fillStyle = "#000"; ctx.fillRect(-10, -28, 4, 12); ctx.fillRect(6, -28, 4, 12);
    } else {
        ctx.font = "40px Arial"; ctx.textAlign = "center"; 
        ctx.fillText("🐙", 0, -15); // Ajustado para o polvo não atravessar
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.shadowColor = "black"; ctx.shadowBlur = 4;
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 25);
    ctx.restore();
}

/* LOOP PRINCIPAL */
function update() {
    if(!playing) return;
    requestAnimationFrame(update);
    updatePlatforms(); // Garante colisão precisa em qualquer redimensionamento

    if(!chatActive) {
        if (keys["ArrowLeft"] || keys["KeyA"]) { rikcat.vx = -SPEED; rikcat.facing = -1; }
        else if (keys["ArrowRight"] || keys["KeyD"]) { rikcat.vx = SPEED; rikcat.facing = 1; }
        else rikcat.vx *= FRICTION;
        
        if ((keys["Space"] || keys["ArrowUp"] || keys["KeyW"]) && rikcat.onGround) { 
            rikcat.vy = JUMP_FORCE; rikcat.onGround = false; rikcat.stretchY = 1.3; 
        }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let onGroundThisFrame = false;
    platforms.forEach(p => {
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > p.realY && rikcat.y + rikcat.h < p.realY + p.h && rikcat.vy > 0) {
            if(!rikcat.onGround) rikcat.stretchY = 0.7;
            rikcat.y = p.realY - rikcat.h; 
            rikcat.vy = 0;
            onGroundThisFrame = true;
        }
    });
    rikcat.onGround = onGroundThisFrame;

    if (rikcat.y > canvas.height + 200) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }
    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    // Renderização
    ctx.fillStyle = "#6AA5FF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513"; 
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.realY, p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { 
            x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, 
            facing: rikcat.facing, nick: rikcat.nick, stretchY: rikcat.stretchY 
        });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* START GAME */
function startGame(online) {
    onlineEnabled = online;
    if(screens.title) screens.title.style.display = "none";
    if(screens.game) screens.game.style.display = "block";
    playing = true;

    if(online) {
        if(openChatBtn) openChatBtn.style.display = "flex";
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            const data = snap.val() || {};
            // Limpa chat se entrar e estiver vazio
            if(Object.keys(data).length === 0 || (Object.keys(data).length === 1 && data[playerId])) {
                remove(chatDataRef);
            }
            for (let id in onlinePlayers) if (!data[id]) delete onlinePlayers[id];
            Object.assign(onlinePlayers, data);
        });
    } else {
        if(openChatBtn) openChatBtn.style.display = "none";
    }
    update();
}

/* EVENTOS */
document.addEventListener("DOMContentLoaded", () => {
    resize();
    document.getElementById("soloBtn").onclick = () => startGame(false);
    document.getElementById("multiBtn").onclick = () => startGame(true);
    document.getElementById("configBtn").onclick = () => { if(screens.config) screens.config.style.display = "flex"; };
    document.getElementById("closeConfig").onclick = () => {
        const n = document.getElementById("nickInput").value.trim();
        if(n) rikcat.nick = n;
        rikcat.skin = document.getElementById("skinSelect").value;
        rikcat.color = document.getElementById("colorSelect").value;
        if(screens.config) screens.config.style.display = "none";
    };
    
    // Suporte Mobile
    const bindTouch = (id, code) => {
        const el = document.getElementById(id);
        if(!el) return;
        el.addEventListener("touchstart", (e) => { e.preventDefault(); keys[code] = true; }, {passive: false});
        el.addEventListener("touchend", (e) => { e.preventDefault(); keys[code] = false; }, {passive: false});
    };
    bindTouch("left", "ArrowLeft");
    bindTouch("right", "ArrowRight");
    bindTouch("jump", "Space");
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    updatePlatforms();
}
window.onresize = resize;
