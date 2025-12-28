import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const screens = {
    title: document.getElementById("titleScreen"),
    config: document.getElementById("configScreen"),
    game: document.getElementById("game")
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

const rikcat = {
    x: 100, y: 100, w: 32, h: 32,
    vx: 0, vy: 0, 
    onGround: false,
    skin: "rikcat", // rikcat ou polvo
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

/* DESENHO DO PERSONAGEM */
function drawPlayer(p) {
    const cx = p.x - cameraX + 16;
    const by = p.y + 32;
    ctx.save();
    ctx.translate(cx, by);
    ctx.scale(p.facing || 1, p.stretchY || 1);

    if (p.skin === "rikcat") {
        // ORELHAS (Voltaram!)
        ctx.lineWidth = 3; ctx.strokeStyle = "#000"; ctx.fillStyle = p.color;
        [-1, 1].forEach(side => {
            ctx.save(); ctx.scale(side, 1);
            ctx.beginPath(); ctx.moveTo(-22, -24); ctx.lineTo(-24, -51); ctx.lineTo(-5, -36); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.restore();
        });
        // CABEÇA
        ctx.beginPath(); ctx.arc(0, -22, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        // OLHOS
        ctx.fillStyle = "#000"; ctx.fillRect(-10, -28, 4, 12); ctx.fillRect(6, -28, 4, 12);
    } else if (p.skin === "polvo") {
        // ESTILO POLVO (O que você gostou)
        ctx.font = "40px Arial"; ctx.textAlign = "center";
        ctx.fillText("🐙", 0, -10);
    }

    // NICKNAME
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "white"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center";
    ctx.fillText(p.nick || "Convidado", p.x - cameraX + 16, p.y - 25);
    ctx.restore();
}

/* LOOP PRINCIPAL */
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

    // COLISÃO
    let ground = false;
    platforms.forEach(p => {
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > p.realY && rikcat.y + rikcat.h < p.realY + p.h && rikcat.vy > 0) {
            rikcat.y = p.realY - rikcat.h; rikcat.vy = 0; ground = true;
        }
    });
    rikcat.onGround = ground;

    // CÂMERA (Travada para não sair do mapa)
    cameraX = rikcat.x - canvas.width / 2;
    if (cameraX < 0) cameraX = 0;

    // RENDERIZAÇÃO
    ctx.fillStyle = "#6AA5FF"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513"; 
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.realY, p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, facing: rikcat.facing, nick: rikcat.nick, stretchY: rikcat.stretchY });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

/* FUNÇÕES DOS BOTÕES */
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    document.getElementById("game").style.display = "block";
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

// BOTAO SOLO E MULTI
document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);

// CONFIGURAÇÕES
document.getElementById("configBtn").onclick = () => screens.config.style.display = "flex";
document.getElementById("closeConfig").onclick = () => {
    rikcat.nick = document.getElementById("nickInput").value || "Gato";
    rikcat.skin = document.getElementById("skinSelect").value;
    rikcat.color = document.getElementById("colorSelect").value;
    screens.config.style.display = "none";
};

// CONTROLES MOBILE (CONSERTADOS)
const bindTouch = (id, key) => {
    const btn = document.getElementById(id);
    btn.ontouchstart = (e) => { e.preventDefault(); keys[key] = true; };
    btn.ontouchend = (e) => { e.preventDefault(); keys[key] = false; };
};
bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

// REDIMENSIONAR
window.onresize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
window.onresize();
