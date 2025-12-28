import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Referências das telas
const titleScreen = document.getElementById("titleScreen");
const configScreen = document.getElementById("configScreen");
const gameScreen = document.getElementById("game");

/* FÍSICA E ESTADO */
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

const platforms = [
    {x: 0, y: 0, h: 40, w: 5000, offset: 40},
    {x: 200, y: 0, h: 20, w: 140, offset: 130},
    {x: 450, y: 0, h: 20, w: 140, offset: 220},
    {x: 700, y: 0, h: 20, w: 140, offset: 300}
];

function updatePlatforms() {
    platforms.forEach(p => p.realY = canvas.height - p.offset);
}

/* INPUTS */
const keys = {};
window.onkeydown = e => { if(!chatActive) keys[e.code] = true; };
window.onkeyup = e => keys[e.code] = false;

/* CHAT SIMPLES */
const chatInput = document.getElementById("chatInput");
const openChatBtn = document.getElementById("openChatBtn");
const chatBox = document.getElementById("chatBox");

if(openChatBtn) {
    openChatBtn.onclick = () => {
        chatActive = !chatActive;
        const container = document.getElementById("chatContainer");
        if(container) container.style.display = chatActive ? "flex" : "none";
        if(chatActive && chatInput) chatInput.focus();
    };
}

if(chatInput) {
    chatInput.onkeydown = (e) => {
        if(e.key === "Enter" && chatInput.value.trim() !== "") {
            push(ref(db, `rooms/${room}/chat`), {
                sender: rikcat.nick,
                text: chatInput.value
            });
            chatInput.value = "";
        }
    };
}

onValue(ref(db, `rooms/${room}/chat`), snap => {
    if(!chatBox) return;
    const msgs = snap.val();
    chatBox.innerHTML = "";
    if(msgs) {
        Object.values(msgs).slice(-20).forEach(m => {
            chatBox.innerHTML += `<div><b>${m.sender}:</b> ${m.text}</div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* DESENHO E LOOP */
function drawPlayer(p) {
    const cx = p.x - cameraX + 16;
    const by = p.y + 32;
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(p.facing || 1, p.stretchY || 1);
    
    // Desenho do Rikcat (Base ajustada para não atravessar)
    ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(0, -22, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#000"; ctx.fillRect(-10, -28, 4, 12); ctx.fillRect(6, -28, 4, 12);
    
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white"; ctx.textAlign = "center";
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 15);
    ctx.restore();
}

function update() {
    if(!playing) return;
    requestAnimationFrame(update);
    updatePlatforms();

    if(!chatActive) {
        if (keys["ArrowLeft"]) { rikcat.vx = -SPEED; rikcat.facing = -1; }
        else if (keys["ArrowRight"]) { rikcat.vx = SPEED; rikcat.facing = 1; }
        else rikcat.vx *= FRICTION;
        if (keys["Space"] && rikcat.onGround) { rikcat.vy = JUMP_FORCE; rikcat.onGround = false; rikcat.stretchY = 1.3; }
    }

    rikcat.vy += GRAVITY; rikcat.x += rikcat.vx; rikcat.y += rikcat.vy;
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let ground = false;
    platforms.forEach(p => {
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > p.realY && rikcat.y + rikcat.h < p.realY + p.h && rikcat.vy > 0) {
            if(!rikcat.onGround) rikcat.stretchY = 0.7;
            rikcat.y = p.realY - rikcat.h; rikcat.vy = 0; ground = true;
        }
    });
    rikcat.onGround = ground;

    cameraX = rikcat.x - canvas.width / 2;
    ctx.fillStyle = "#6AA5FF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513"; 
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.realY, p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, facing: rikcat.facing, nick: rikcat.nick, stretchY: rikcat.stretchY });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* INICIALIZAÇÃO DOS BOTÕES */
function startGame(online) {
    onlineEnabled = online;
    titleScreen.style.display = "none";
    gameScreen.style.display = "block";
    playing = true;
    if(online) {
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            Object.assign(onlinePlayers, snap.val() || {});
        });
        if(openChatBtn) openChatBtn.style.display = "flex";
    }
    update();
}

// Vincula os botões manualmente para evitar erros
document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);
document.getElementById("configBtn").onclick = () => configScreen.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    rikcat.nick = document.getElementById("nickInput").value || "Gato";
    rikcat.color = document.getElementById("colorSelect").value;
    configScreen.style.display = "none";
};

// Ajuste de tela
window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
