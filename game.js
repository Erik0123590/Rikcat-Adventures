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
    emote: null
};

/* MULTIPLAYER */
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

/* CHAT LÓGICA */
const openChatBtn = document.getElementById("openChatBtn");
const chatContainer = document.getElementById("chatContainer");
const chatInput = document.getElementById("chatInput");
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

onValue(ref(db, `rooms/${room}/chat`), snap => {
    if(!chatBox) return;
    chatBox.innerHTML = "";
    const data = snap.val();
    if(data) {
        Object.values(data).slice(-30).forEach(m => {
            const div = document.createElement("div");
            div.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    }
});

/* EMOTES */
const allEmotes = ["😀", "😡", "😴", "💎", "🔥", "⭐", "🤡", "👑", "🍕", "👻"];
let currentEmotePage = 0;
const emotesPerPage = 5;

function renderEmoteMenu() {
    const grid = document.getElementById("emoteGrid");
    if(!grid) return;
    grid.innerHTML = "";
    const items = allEmotes.slice(currentEmotePage * emotesPerPage, (currentEmotePage + 1) * emotesPerPage);
    items.forEach(emoji => {
        const btn = document.createElement("button");
        btn.className = "emote";
        btn.textContent = emoji;
        btn.onclick = () => {
            rikcat.emote = emoji;
            document.getElementById("emoteMenu").style.display = "none";
            setTimeout(() => rikcat.emote = null, 3000);
        };
        grid.appendChild(btn);
    });
}

document.getElementById("nextEmotePage").onclick = () => {
    currentEmotePage = (currentEmotePage + 1) % Math.ceil(allEmotes.length / emotesPerPage);
    renderEmoteMenu();
};

document.getElementById("emoteBtn").onclick = () => {
    const menu = document.getElementById("emoteMenu");
    menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    renderEmoteMenu();
};

/* CONFIGURAÇÕES */
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    const nickVal = document.getElementById("nickInput").value.trim();
    if(nickVal) rikcat.nick = nickVal;
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

/* FUNÇÃO DE DESENHO ÚNICA E CORRIGIDA */
function drawPlayer(p) {
    const x = p.x - cameraX + 16;
    const y = p.y + 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(p.facing || 1, 1);

    if(p.skin === "rikcat"){
        const outline = "#000", earInside = "#FF2FA3", noseColor = "#FF2FA3";
        ctx.lineWidth = 3; ctx.strokeStyle = outline; ctx.fillStyle = p.color;

        // Orelhas
        [-1, 1].forEach(s => {
            ctx.save(); ctx.scale(s, 1);
            ctx.beginPath(); ctx.moveTo(-22, -8); ctx.lineTo(-24, -35); ctx.lineTo(-5, -20); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = earInside; ctx.beginPath(); ctx.moveTo(-18, -12); ctx.lineTo(-20, -28); ctx.lineTo(-8, -18); ctx.fill();
            ctx.restore();
        });

        // Cabeça
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 10, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Olhos
        ctx.strokeStyle = outline; ctx.lineWidth = 4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-10, 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 2); ctx.lineTo(10, 14); ctx.stroke();

        // Nariz e Boca
        ctx.fillStyle = noseColor; ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(-5, 22); ctx.lineTo(5, 22); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = outline; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-6, 26); ctx.bezierCurveTo(-6, 32, -1, 32, 0, 26); ctx.bezierCurveTo(1, 32, 6, 32, 6, 26); ctx.stroke();
    } else {
        ctx.font = "40px sans-serif"; ctx.textAlign = "center"; ctx.fillText("🐙", 0, 15);
    }

    // Texto (Nick e Emote) - Desfazemos o flip para o texto não ficar espelhado
    ctx.scale(p.facing || 1, 1);
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(p.nick || "Convidado", 0, -55);
    if(p.emote) { ctx.font="24px sans-serif"; ctx.fillText(p.emote, 0, -85); }
    
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

        if (keys["Space"] && rikcat.onGround) { rikcat.vy = JUMP_FORCE; rikcat.onGround = false; }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    rikcat.onGround = false;

    platforms.forEach(p => {
        const py = p.y();
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h && rikcat.vy > 0) {
            rikcat.y = py - rikcat.h; rikcat.vy = 0; rikcat.onGround = true;
        }
    });

    if (rikcat.y > canvas.height + 100) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }

    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    ctx.fillStyle = "#6AA5FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y(), p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { 
            x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, 
            emote: rikcat.emote, nick: rikcat.nick, facing: rikcat.facing 
        });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* INÍCIO */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;
    if(online) {
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            const players = snap.val() || {};
            if(rikcat.nick === "Convidado") rikcat.nick = "Convidado_" + (Object.keys(players).length + 1);
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
    screens.rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
window.onresize = resize;
resize();
