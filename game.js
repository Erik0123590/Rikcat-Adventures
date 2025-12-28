import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screens = {
    title: document.getElementById("titleScreen"),
    config: document.getElementById("configScreen"),
    game: document.getElementById("game"),
    rotate: document.getElementById("rotate")
};

/* CONFIGURAÇÕES DE JOGO */
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const SPEED = 5;
const FRICTION = 0.8;

let playing = false;
let onlineEnabled = false;
let cameraX = 0;
let chatActive = false;

/* PLAYER PRINCIPAL */
const rikcat = {
    x: 100, y: 100, w: 32, h: 32,
    vx: 0, vy: 0, 
    onGround: false,
    skin: "rikcat",
    color: "#FFB000",
    nick: "Convidado",
    facing: 1,
    stretchY: 1, // Para o efeito de charme
    emote: null
};

/* MULTIPLAYER CONFIG */
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);

const platforms = [
    {x: 0, y: () => canvas.height - 40, w: 3000, h: 40},
    {x: 200, y: () => canvas.height - 130, w: 140, h: 20},
    {x: 450, y: () => canvas.height - 220, w: 140, h: 20},
    {x: 700, y: () => canvas.height - 300, w: 140, h: 20}
];

/* CONTROLES */
const keys = {};
window.onkeydown = e => { if(!chatActive) keys[e.code] = true; };
window.onkeyup = e => keys[e.code] = false;

const bindTouch = (id, code) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.ontouchstart = (e) => { e.preventDefault(); if(!chatActive) keys[code] = true; };
    el.ontouchend = (e) => { e.preventDefault(); keys[code] = false; };
};
bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

/* LOGICA DO CHAT */
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
            push(ref(db, `rooms/${room}/chat`), {
                sender: rikcat.nick,
                text: chatInput.value,
                time: Date.now()
            });
            chatInput.value = "";
        }
    };
}

// Ouvir mensagens do Chat
onValue(ref(db, `rooms/${room}/chat`), snap => {
    if(!chatBox) return;
    chatBox.innerHTML = "";
    const msgs = snap.val();
    if(msgs) {
        Object.values(msgs).slice(-30).forEach(m => {
            const div = document.createElement("div");
            div.style.marginBottom = "5px";
            div.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* CONFIGURAÇÕES */
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    const n = document.getElementById("nickInput").value.trim();
    if(n) rikcat.nick = n;
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

/* FUNÇÃO DE DESENHO ÚNICA (COM CHARME E AJUSTE DE CHÃO) */
function drawPlayer(p) {
    const x = p.x - cameraX + 16;
    const y = p.y + 16;
    ctx.save();
    ctx.translate(x, y);
    
    // Efeito de Squash e Stretch (Charme)
    ctx.scale((p.facing || 1), p.stretchY || 1);

    if(p.skin === "rikcat"){
        const outline = "#000", earInside = "#FF2FA3", noseColor = "#FF2FA3";
        ctx.lineWidth = 3; ctx.strokeStyle = outline; ctx.fillStyle = p.color;

        // Orelhas
        [-1, 1].forEach(side => {
            ctx.save(); ctx.scale(side, 1);
            ctx.beginPath(); ctx.moveTo(-22, -8); ctx.lineTo(-24, -35); ctx.lineTo(-5, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = earInside; ctx.beginPath(); ctx.moveTo(-18, -12); ctx.lineTo(-20, -28); ctx.lineTo(-8, -18); ctx.fill();
            ctx.restore();
        });

        // Cabeça (Subida para não atravessar o chão)
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 4, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Olhos, Nariz e Boca (Ajustados para a nova posição da cabeça)
        ctx.fillStyle = "#000"; ctx.fillRect(-10, -2, 4, 12); ctx.fillRect(6, -2, 4, 12);
        ctx.fillStyle = noseColor; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-5, 18); ctx.lineTo(5, 18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = outline; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-6, 22); ctx.bezierCurveTo(-6, 28, -1, 28, 0, 22); ctx.bezierCurveTo(1, 28, 6, 28, 6, 22); ctx.stroke();
    } else {
        ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.fillText("🐙", 0, 10);
    }

    // Texto (Nick) - Desfazemos o scale para não distorcer o texto
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    const txtX = p.x - cameraX + 16;
    const txtY = p.y - 25;
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(p.nick || "Convidado", txtX, txtY);
    
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

        if (keys["Space"] && rikcat.onGround) { 
            rikcat.vy = JUMP_FORCE; rikcat.onGround = false; rikcat.stretchY = 1.3; 
        }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    
    // Suaviza o charme (volta ao normal)
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let onAnyPlatform = false;
    platforms.forEach(p => {
        const py = p.y();
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h && rikcat.vy > 0) {
            
            if(!rikcat.onGround) rikcat.stretchY = 0.7; // Achata ao tocar o chão
            
            rikcat.y = py - (rikcat.h - 4); // Ajuste leve para não atravessar
            rikcat.vy = 0;
            rikcat.onGround = true;
            onAnyPlatform = true;
        }
    });
    if(!onAnyPlatform) rikcat.onGround = false;

    if (rikcat.y > canvas.height + 150) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }

    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    // Fundo e Chão
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
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            const players = snap.val() || {};
            // Nome padrão Convidado se estiver vazio
            if(rikcat.nick === "Convidado") {
                rikcat.nick = "Convidado_" + (Object.keys(players).length + 1);
            }
            Object.assign(onlinePlayers, players);
        });
    }
    update();
}

document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resize;
resize();
