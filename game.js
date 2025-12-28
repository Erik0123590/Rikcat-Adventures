import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screens = {
    title: document.getElementById("titleScreen"),
    config: document.getElementById("configScreen"),
    game: document.getElementById("game")
};

/* CONFIGURAÇÕES DE FÍSICA */
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

/* FUNÇÃO DE DESENHO (SPRITES FOTO 1 E 2) */
function drawPlayer(p) {
    const cx = p.x - cameraX + 16;
    const by = p.y + 32; // Base exata do chão
    
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if (p.skin === "rikcat") {
        // --- RIKCAT (ESTILO FOTO 2) ---
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#000";
        
        // Orelhas Pontudas com Interior Rosa
        ctx.fillStyle = p.color;
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.scale(side, 1);
            ctx.beginPath();
            ctx.moveTo(-22, -24); 
            ctx.lineTo(-26, -52); 
            ctx.lineTo(-6, -38);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.fillStyle = "#FFB6C1"; // Interior rosa
            ctx.beginPath();
            ctx.moveTo(-18, -28); ctx.lineTo(-22, -45); ctx.lineTo(-10, -35);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        });

        // Cabeça
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, -22, 28, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Olhos e Nariz
        ctx.fillStyle = "#000";
        ctx.fillRect(-12, -30, 5, 12); ctx.fillRect(7, -30, 5, 12);
        ctx.fillStyle = "#FFB6C1";
        ctx.beginPath(); ctx.arc(0, -16, 4, 0, Math.PI * 2); ctx.fill();

    } else if (p.skin === "polvo") {
        // --- POLVO (ESTILO FOTO 1) ---
        ctx.lineWidth = 2; ctx.strokeStyle = "#000"; ctx.fillStyle = "#FF69B4";
        
        // Corpo/Cabeça Oval
        ctx.beginPath(); ctx.ellipse(0, -25, 22, 26, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Olhos Grandes
        ctx.fillStyle = "#FFF";
        ctx.beginPath(); ctx.arc(-8, -28, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(8, -28, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-8, -28, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -28, 3, 0, Math.PI * 2); ctx.fill();

        // Tentáculos
        ctx.fillStyle = "#FF69B4";
        [-15, -5, 5, 15].forEach(tx => {
            ctx.beginPath(); ctx.arc(tx, -4, 6, 0, Math.PI, false);
            ctx.fill(); ctx.stroke();
        });
    }

    // NICKNAME
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.shadowColor = "black"; ctx.shadowBlur = 4;
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 28);
    ctx.restore();
}

/* ATUALIZAÇÃO E LOGICA */
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

    rikcat.vy += GRAVITY; rikcat.x += rikcat.vx; rikcat.y += rikcat.vy;
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let ground = false;
    platforms.forEach(p => {
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > p.realY && rikcat.y + rikcat.h < p.realY + p.h && rikcat.vy > 0) {
            rikcat.y = p.realY - rikcat.h; rikcat.vy = 0; ground = true;
        }
    });
    rikcat.onGround = ground;

    // Câmera limitada
    cameraX = rikcat.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

    // Desenho do Cenário
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

/* CONTROLE DE TELAS */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;
    if(online) {
        onDisconnect(myRef).remove();
        onValue(ref(db, `rooms/${room}/players`), snap => {
            Object.assign(onlinePlayers, snap.val() || {});
        });
        document.getElementById("openChatBtn").style.display = "flex";
    }
    update();
}

document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    rikcat.nick = document.getElementById("nickInput").value || "Gato";
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

/* CONTROLES MOBILE */
const bindTouch = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener("touchstart", (e) => { e.preventDefault(); keys[key] = true; }, {passive: false});
    el.addEventListener("touchend", (e) => { e.preventDefault(); keys[key] = false; }, {passive: false});
};
bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
