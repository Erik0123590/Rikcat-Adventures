import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Elementos
const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.createElement("button");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

// Controles
const left = document.getElementById("left");
const right = document.getElementById("right");
const jump = document.getElementById("jump");
const attack = document.getElementById("attack");

// Emotes
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

// Multiplayer
const room = "salas_online_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
let onlineEnabled = false;

// Configurações do jogador
let playerConfig = {
    skin: "rikcat", // "rikcat" ou "polvo"
    color: "#FFB000"
};

// Canvas resize
function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
}
window.addEventListener("resize", resize);
resize();

// Orientação
function checkOrientation() {
    rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
window.addEventListener("resize", checkOrientation);
checkOrientation();

// Estado do jogo
let playing = false;
let currentLevel = "main"; // "main" ou "water"

// Jogador principal
const player = {
    x: 80,
    y: 0,
    w: 32,
    h: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    life: 3,
    attacking: false,
    emote: null,
    skin: playerConfig.skin,
    color: playerConfig.color
};

// Física
const gravity = 0.6;

// Plataformas
const levels = {
    main: [
        { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
        { x: 200, y: () => canvas.height - 120, w: 140, h: 20 },
        { x: 420, y: () => canvas.height - 200, w: 140, h: 20 },
        { x: 650, y: () => canvas.height - 260, w: 140, h: 20 },
    ],
    water: [
        { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
        { x: 150, y: () => canvas.height - 100, w: 140, h: 20 },
        { x: 400, y: () => canvas.height - 180, w: 140, h: 20 },
        { x: 650, y: () => canvas.height - 220, w: 140, h: 20 },
    ]
};

// Câmera
const camera = { x: 0, y: 0, scale: 1 };

// Firebase
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db, `rooms/${room}/players`), snap => {
    Object.keys(onlinePlayers).forEach(k => delete onlinePlayers[k]);
    if (snap.val()) Object.assign(onlinePlayers, snap.val());
});

// Funções
function startGame(online) {
    onlineEnabled = online;
    titleScreen.style.display = "none";
    gameDiv.style.display = "block";
    playing = true;
}

// Controles de toque
left.ontouchstart = () => player.vx = -4;
right.ontouchstart = () => player.vx = 4;
jump.ontouchstart = () => { if (player.onGround) { player.vy = -12; player.onGround = false; } };
attack.ontouchstart = () => player.attacking = true;
[left, right, jump, attack].forEach(b => b.ontouchend = () => { player.vx = 0; player.attacking = false; });

// Emotes
if (emoteBtn && emoteMenu) {
    emoteBtn.onclick = () => {
        emoteMenu.style.display = emoteMenu.style.display === "flex" ? "none" : "flex";
    };
    document.querySelectorAll(".emote").forEach(btn => {
        btn.onclick = () => {
            player.emote = btn.textContent;
            emoteMenu.style.display = "none";
        };
    });
}

// Função para desenhar Rikcat ou Polvo
function drawCharacter(x, y, scale, color, skin, emote) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const outline = "#000";
    const earInside = "#FF2FA3";
    const noseColor = "#FF2FA3";

    if (skin === "rikcat") {
        // Orelhas
        ctx.fillStyle = color; ctx.strokeStyle = outline;
        ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(-40, -28); ctx.lineTo(-8, -22);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = earInside;
        ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-32, -22); ctx.lineTo(-14, -18);
        ctx.closePath(); ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(18, -2); ctx.lineTo(40, -28); ctx.lineTo(8, -22);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = earInside;
        ctx.beginPath(); ctx.moveTo(20, -8); ctx.lineTo(32, -22); ctx.lineTo(14, -18);
        ctx.closePath(); ctx.fill();

        // Cabeça
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 6, 26, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Olhos
        ctx.fillStyle = "#000";
        ctx.fillRect(-8, 0, 4, 14);
        ctx.fillRect(4, 0, 4, 14);

        // Nariz
        ctx.fillStyle = noseColor;
        ctx.beginPath();
        ctx.moveTo(0, 14); ctx.lineTo(-6, 22); ctx.lineTo(6, 22);
        ctx.closePath(); ctx.fill();

        // Boca
        ctx.beginPath();
        ctx.moveTo(0, 22); ctx.lineTo(0, 28);
        ctx.quadraticCurveTo(-4, 30, -6, 28);
        ctx.moveTo(0, 28);
        ctx.quadraticCurveTo(4, 30, 6, 28);
        ctx.stroke();
    } else if (skin === "polvo") {
        ctx.font = "48px sans-serif";
        ctx.fillText("🐙", -24, 24);
    }

    if (emote) {
        ctx.font = "24px sans-serif";
        ctx.fillText(emote, -10, -35);
    }

    ctx.restore();
}

// Loop principal
function update() {
    requestAnimationFrame(update);
    if (!playing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar gravidade
    player.vy += gravity;
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;

    // Selecionar plataformas
    const platforms = levels[currentLevel];

    // Colisões
    platforms.forEach(p => {
        const py = p.y();
        ctx.fillStyle = currentLevel === "water" ? "#3aa" : "#8B4513";
        ctx.fillRect(p.x, py, p.w, p.h);
        if (
            player.x < p.x + p.w &&
            player.x + player.w > p.x &&
            player.y + player.h > py &&
            player.y + player.h < py + p.h &&
            player.vy > 0
        ) {
            player.y = py - player.h;
            player.vy = 0;
            player.onGround = true;
        }
    });

    // Atualizar câmera
    camera.x = player.x - canvas.width / 2;
    camera.y = player.y - canvas.height / 2;
    ctx.save();
    ctx.translate(-camera.x, -camera.y);

    // Desenhar jogador
    drawCharacter(player.x, player.y, 1, player.color, player.skin, player.emote);

    // Multiplayer
    if (onlineEnabled) {
        set(myRef, {
            x: player.x,
            y: player.y,
            skin: player.skin,
            color: player.color,
            emote: player.emote,
            level: currentLevel
        });

        for (const id in onlinePlayers) {
            if (id === playerId) continue;
            const p = onlinePlayers[id];
            drawCharacter(p.x, p.y, 1, p.color || "#A020F0", p.skin || "rikcat", p.emote);
        }
    }

    ctx.restore();
}

soloBtn.onclick = () => startGame(false);
multiBtn.onclick = () => startGame(true);

update();
