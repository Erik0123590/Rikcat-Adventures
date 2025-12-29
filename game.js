alert("GAME.JS CARREGOU");
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
    {x: 0, y: () => canvas.height - 40, w: 3000, h: 40},
    {x: 200, y: () => canvas.height - 130, w: 140, h: 20},
    {x: 450, y: () => canvas.height - 220, w: 140, h: 20},
    {x: 700, y: () => canvas.height - 300, w: 140, h: 20}
];

/* INPUTS */
const keys = {};
window.onkeydown = e => { if(!chatActive) keys[e.code] = true; };
window.onkeyup = e => keys[e.code] = false;

/* CHAT LÓGICA */
const chatInput = document.getElementById("chatInput");
const openChatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
const chatBox = document.getElementById("chatBox");

if(openChatBtn) {
    openChatBtn.onclick = () => {
        chatActive = !chatActive;
        chatContainer.style.display = chatActive ? "flex" : "none";
        if(chatActive) chatInput.focus();
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
            div.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* DESENHO */
function drawPlayer(p) {
    const x = p.x - cameraX + 16;
    const y = p.y + 12;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if(p.skin === "rikcat"){
        ctx.fillStyle = p.color; ctx.strokeStyle = "#000"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 4, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#000"; ctx.fillRect(-10, -2, 4, 12); ctx.fillRect(6, -2, 4, 12);
    } else {
        ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.fillText("🐙", 0, 10);
    }
    
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 25);
    ctx.restore();
}

/* LOOP PRINCIPAL */
function update() {
    if(!playing) return;
    requestAnimationFrame(update);

    if(!chatActive) {
        if (keys["ArrowLeft"]) { rikcat.vx = -SPEED; rikcat.facing = -1; }
        else if (keys["ArrowRight"]) { rikcat.vx = SPEED; rikcat.facing = 1; }
        else rikcat.vx *= FRICTION;
        if (keys["Space"] && rikcat.onGround) { rikcat.vy = JUMP_FORCE; rikcat.onGround = false; rikcat.stretchY = 1.3; }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let onGroundThisFrame = false;
    platforms.forEach(p => {
        const py = p.y();
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h && rikcat.vy > 0) {
            if(!rikcat.onGround) rikcat.stretchY = 0.7;
            rikcat.y = py - rikcat.h; 
            rikcat.vy = 0;
            onGroundThisFrame = true;
        }
    });
    rikcat.onGround = onGroundThisFrame;

    if (rikcat.y > canvas.height + 150) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }
    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    ctx.fillStyle = "#6AA5FF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513"; platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y(), p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { 
            x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, 
            facing: rikcat.facing, nick: rikcat.nick, stretchY: rikcat.stretchY 
        });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* START */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;

    if(online) {
        openChatBtn.style.display = "flex"; // Mostra chat no multiplayer
        onDisconnect(myRef).remove();
        
        onValue(ref(db, `rooms/${room}/players`), snap => {
            const data = snap.val() || {};
            
            // Lógica de Limpeza: Se você for o primeiro a entrar, limpa o chat antigo
            if(Object.keys(data).length === 0) {
                remove(chatDataRef);
            }

            if(rikcat.nick === "Convidado") {
                rikcat.nick = "Convidado_" + (Object.keys(data).length + 1);
            }
            for (let id in onlinePlayers) if (!data[id]) delete onlinePlayers[id];
            Object.assign(onlinePlayers, data);
        });
    } else {
        openChatBtn.style.display = "none"; // Esconde chat no solo
    }
    update();
}

document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    const n = document.getElementById("nickInput").value.trim();
    if(n) rikcat.nick = n;
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();
