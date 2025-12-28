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
    emote: null,
    stretchY: 1 // Variável para a animação de impacto
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

/* FUNÇÃO DE DESENHO COM ANIMAÇÃO DE IMPACTO */
function drawPlayer(p) {
    const x = p.x - cameraX + 16;
    const y = p.y + 16;
    ctx.save();
    ctx.translate(x, y);
    
    // Aplica o espelhamento e o efeito de achatar/esticar (Squash/Stretch)
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

        // Cabeça (Ajustada para ficar levemente acima do chão)
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(0, 4, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // Olhos
        ctx.strokeStyle = outline; ctx.lineWidth = 4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-10, -2); ctx.lineTo(-10, 10); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(10, 10); ctx.stroke();

        // Nariz e Boca
        ctx.fillStyle = noseColor; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-5, 18); ctx.lineTo(5, 18); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = outline; ctx.lineWidth = 2; ctx.beginPath();
        ctx.moveTo(-6, 22); ctx.bezierCurveTo(-6, 28, -1, 28, 0, 22); ctx.bezierCurveTo(1, 28, 6, 28, 6, 22); ctx.stroke();
    } else {
        ctx.font = "40px Arial"; ctx.textAlign = "center"; ctx.fillText("🐙", 0, 10);
    }

    // Texto (Nick) - Desfazemos o scale para o texto não distorcer
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reseta transformações para texto limpo
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
            rikcat.vy = JUMP_FORCE; 
            rikcat.onGround = false;
            rikcat.stretchY = 1.3; // Estica ao pular
        }
    }

    rikcat.vy += GRAVITY;
    rikcat.x += rikcat.vx;
    rikcat.y += rikcat.vy;

    // Suaviza a animação de volta ao normal (Elasticidade)
    rikcat.stretchY += (1 - rikcat.stretchY) * 0.15;

    let hitPlatform = false;
    platforms.forEach(p => {
        const py = p.y();
        if (rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
            rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h && rikcat.vy > 0) {
            
            // Se ele acabou de cair no chão (estava no ar)
            if(!rikcat.onGround) {
                rikcat.stretchY = 0.7; // Achata no impacto (charme)
            }
            
            rikcat.y = py - (rikcat.h - 4); 
            rikcat.vy = 0;
            rikcat.onGround = true;
            hitPlatform = true;
        }
    });
    if(!hitPlatform) rikcat.onGround = false;

    if (rikcat.y > canvas.height + 150) { rikcat.x = 100; rikcat.y = 100; rikcat.vy = 0; }

    cameraX = rikcat.x - canvas.width / 2;
    if(cameraX < 0) cameraX = 0;

    // Desenho
    ctx.fillStyle = "#6AA5FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8B4513";
    platforms.forEach(p => ctx.fillRect(p.x - cameraX, p.y(), p.w, p.h));

    if (onlineEnabled) {
        set(myRef, { 
            x: rikcat.x, y: rikcat.y, skin: rikcat.skin, color: rikcat.color, 
            facing: rikcat.facing, nick: rikcat.nick, stretchY: rikcat.stretchY
        });
        for (let id in onlinePlayers) if (id !== playerId) drawPlayer(onlinePlayers[id]);
    }
    drawPlayer(rikcat);
}

// ... Restante das funções (startGame, resize, etc) se mantêm iguais ...
function startGame(online) {
    onlineEnabled = online;
    screens.title.style.display = "none";
    screens.game.style.display = "block";
    playing = true;
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
