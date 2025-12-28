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

/* FUNÇÃO DE DESENHO MELHORADA */
function drawPlayer(p) {
    const cx = p.x - cameraX + 16;
    const by = p.y + 32; 
    
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if (p.skin === "rikcat") {
        // --- RIKCAT MELHORADO ---
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#000";
        
        // Orelhas Detalhadas
        ctx.fillStyle = p.color;
        [-1, 1].forEach(side => {
            ctx.save();
            ctx.scale(side, 1);
            ctx.beginPath();
            ctx.moveTo(-20, -28); 
            ctx.quadraticCurveTo(-28, -55, -26, -58); // Ponta mais fina
            ctx.lineTo(-6, -42);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            // Interior da orelha
            ctx.fillStyle = "#FFB6C1";
            ctx.beginPath();
            ctx.moveTo(-18, -32); ctx.lineTo(-22, -50); ctx.lineTo(-10, -38);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        });

        // Bochechas do Rosto (Efeito gordinho)
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(-12, -18, 12, 0, Math.PI * 2);
        ctx.arc(12, -18, 12, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça Principal
        ctx.beginPath(); ctx.arc(0, -24, 26, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Brilho nos Olhos
        ctx.fillStyle = "#000";
        ctx.fillRect(-12, -32, 6, 13); ctx.fillRect(6, -32, 6, 13);
        ctx.fillStyle = "#FFF";
        ctx.beginPath(); ctx.arc(-9, -30, 2, 0, Math.PI * 2); ctx.arc(9, -30, 2, 0, Math.PI * 2); ctx.fill();

        // Bochechas Rosadas (Blush)
        ctx.fillStyle = "rgba(255, 182, 193, 0.6)";
        ctx.beginPath(); ctx.arc(-16, -18, 5, 0, Math.PI * 2); ctx.arc(16, -18, 5, 0, Math.PI * 2); ctx.fill();

        // Narizinho
        ctx.fillStyle = "#FFB6C1";
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(-3, -14); ctx.lineTo(3, -14); ctx.closePath(); ctx.fill();

    } else if (p.skin === "polvo") {
        // --- POLVO MELHORADO (CORES DINÂMICAS) ---
        ctx.lineWidth = 2.5; ctx.strokeStyle = "#000"; ctx.fillStyle = p.color;
        
        // Cabeça com brilho
        ctx.beginPath(); ctx.ellipse(0, -25, 24, 28, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = "rgba(255,255,255,0.2)"; // Brilho na cabeça
        ctx.beginPath(); ctx.ellipse(-8, -35, 8, 10, 0.5, 0, Math.PI * 2); ctx.fill();

        // Olhos Expressivos
        ctx.fillStyle = "#FFF";
        ctx.beginPath(); ctx.arc(-10, -28, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(10, -28, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.beginPath(); ctx.arc(-10, -28, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -28, 4, 0, Math.PI * 2); ctx.fill();

        // Tentáculos com Ventosas
        ctx.fillStyle = p.color;
        [-16, -6, 6, 16].forEach(tx => {
            ctx.beginPath(); ctx.arc(tx, -4, 7, 0, Math.PI, false);
            ctx.fill(); ctx.stroke();
            // Ventosa pequena
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.beginPath(); ctx.arc(tx, -3, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = p.color;
        });
    }

    // NICKNAME
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.shadowColor = "black"; ctx.shadowBlur = 4;
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 35);
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

    cameraX = rikcat.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

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
