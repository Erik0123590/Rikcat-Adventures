import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Elementos da Interface
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

/* PLAYER PRINCIPAL */
const rikcat = {
    x: 100, y: 100, w: 32, h: 32,
    vx: 0, vy: 0, 
    onGround: false,
    skin: "rikcat",
    color: "#FFB000",
    emote: null
};

/* MULTIPLAYER */
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);

/* MAPA */
const platforms = [
    {x: 0, y: () => canvas.height - 40, w: 3000, h: 40},
    {x: 200, y: () => canvas.height - 130, w: 140, h: 20},
    {x: 450, y: () => canvas.height - 220, w: 140, h: 20},
    {x: 700, y: () => canvas.height - 300, w: 140, h: 20}
];

/* CONTROLES */
const keys = {};
window.onkeydown = e => keys[e.code] = true;
window.onkeyup = e => keys[e.code] = false;

const bindTouch = (id, code) => {
    const el = document.getElementById(id);
    el.ontouchstart = (e) => { e.preventDefault(); keys[code] = true; };
    el.ontouchend = (e) => { e.preventDefault(); keys[code] = false; };
};
bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

/* LÓGICA DE EMOTES COM PÁGINAS */
const allEmotes = ["😀", "😡", "😴", "💎", "🔥", "⭐", "🤡", "👑", "🍕", "👻"];
let currentEmotePage = 0;
const emotesPerPage = 5;

function renderEmoteMenu() {
    const grid = document.getElementById("emoteGrid");
    grid.innerHTML = "";
    const start = currentEmotePage * emotesPerPage;
    const pageItems = allEmotes.slice(start, start + emotesPerPage);

    pageItems.forEach(emoji => {
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
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

/* INÍCIO DO JOGO */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;
    if(online) {
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            if(snap.val()) Object.assign(onlinePlayers, snap.val());
        });
    }
    update();
}
document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);

/* ARTE ORIGINAL */
function drawPlayer(p) {
    const x = p.x - cameraX + 16;
    const y = p.y + 16;
    ctx.save();
    ctx.translate(x, y);

    if(p.skin === "rikcat"){
        // Orelhas
        ctx.fillStyle=p.color; ctx.strokeStyle="#000"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(-18,-2); ctx.lineTo(-40,-28); ctx.lineTo(-8,-22); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18,-2); ctx.lineTo(40,-28); ctx.lineTo(8,-22); ctx.fill(); ctx.stroke();
        // Cabeça
        ctx.beginPath(); ctx.arc(0,6,26,0,Math.PI*2); ctx.fill(); ctx.stroke();
        // Olhos e Rosto
        ctx.fillStyle="#000"; ctx.fillRect(-8,0,4,14); ctx.fillRect(4,0,4,14);
        ctx.fillStyle="#FF2FA3"; ctx.beginPath(); ctx.moveTo(0,14); ctx.lineTo(-6,22); ctx.lineTo(6,22); ctx.fill();
    } else {
        ctx.font = "40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("🐙", 0, 20);
    }
    if(p.emote) { ctx.font="24px sans-serif"; ctx.textAlign="center"; ctx.fillText(p.emote, 0, -40); }
    ctx.restore();
}

/* LOOP PRINCIPAL */
function update() {
    if(!playing) return;
    requestAnimationFrame(update);

    // Física Lateral
    if (keys["ArrowLeft"]) rikcat.vx = -SPEED;
    else if (keys["ArrowRight"]) rikcat.vx = SPEED;
    else rikcat.vx *= FRICTION;

    // Pulo
    if (keys["Space"] && rikcat.onGround) {
        rikcat.vy = JUMP_FORCE;
        rikcat.onGround = false;
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;
    rikcat.onGround = false;

    // Colisão
    platforms.forEach(p => {
        const py = p.y();
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h && rikcat.vy > 0) {
            rikcat.y = py - rikcat.h;
            rikcat.vy = 0;
            rikcat.onGround = true;
        }
    });

    // Respawn
    if (rikcat.y > canvas.height + 100) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }

    // Câmera
    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    // Desenho
    ctx.fillStyle = "#6AA5FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "#8B4513";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y(), p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, emote: rikcat.emote });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    screens.rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
window.onresize = resize;
resize();
