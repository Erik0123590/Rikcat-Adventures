import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const titleScreen = document.getElementById("titleScreen");
const gameDiv = document.getElementById("game");

/* CONFIGURAÇÕES DE JOGO */
const GRAVITY = 0.5;
const FRICTION = 0.8;
const JUMP_FORCE = -11;
const SPEED = 5;

let playing = false;
let onlineEnabled = false;
let cameraX = 0;
let inWater = false;

/* PLAYER PRINCIPAL */
const player = {
    x: 100, y: 100, w: 40, h: 40,
    vx: 0, vy: 0, 
    onGround: false,
    skin: "rikcat", // rikcat ou polvo
    color: "#FFB000",
    emote: null,
    emoteTimer: 0,
    facing: 1 // 1 para direita, -1 para esquerda
};

/* MULTIPLAYER CONFIG */
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const onlinePlayers = {};
const myRef = ref(db, `rooms/${room}/players/${playerId}`);

/* MAPA E AMBIENTE */
const platforms = [
    {x: 0, y: 500, w: 2000, h: 100}, // Chão principal
    {x: 300, y: 380, w: 150, h: 20},
    {x: 550, y: 280, w: 150, h: 20},
    {x: 800, y: 200, w: 200, h: 20},
    {x: 1100, y: 350, w: 200, h: 20}
];

const pipes = [
    {x: 1400, y: 440, w: 60, h: 60, target: "water"}
];

/* INPUTS (TECLADO + MOBILE) */
const keys = {};
window.onkeydown = e => keys[e.code] = true;
window.onkeyup = e => keys[e.code] = false;

const setupMobileBtn = (id, actionStart, actionEnd) => {
    const btn = document.getElementById(id);
    btn.ontouchstart = (e) => { e.preventDefault(); actionStart(); };
    btn.ontouchend = (e) => { e.preventDefault(); actionEnd(); };
};

setupMobileBtn("left", () => keys["ArrowLeft"] = true, () => keys["ArrowLeft"] = false);
setupMobileBtn("right", () => keys["ArrowRight"] = true, () => keys["ArrowRight"] = false);
setupMobileBtn("jump", () => keys["Space"] = true, () => keys["Space"] = false);
setupMobileBtn("attack", () => { player.skin = player.skin === "rikcat" ? "polvo" : "rikcat"; }, () => {});

/* INICIAR JOGO */
function startGame(online) {
    onlineEnabled = online;
    titleScreen.style.display = "none";
    gameDiv.style.display = "block";
    playing = true;
    if(online) setupFirebase();
    animate();
}

document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);

function setupFirebase() {
    onDisconnect(myRef).remove();
    onValue(ref(db, `rooms/${room}/players`), snap => {
        const data = snap.val();
        if(data) {
            Object.keys(onlinePlayers).forEach(k => delete onlinePlayers[k]);
            Object.assign(onlinePlayers, data);
        }
    });
}

/* SISTEMA DE COLISÃO AABB */
function checkCollisions() {
    player.onGround = false;

    platforms.forEach(p => {
        // Colisão Vertical (Cima/Baixo)
        if (player.x < p.x + p.w && player.x + player.w > p.x &&
            player.y + player.h + player.vy > p.y && player.y + player.vy < p.y + p.h) {
            
            if (player.vy > 0) { // Caindo
                player.y = p.y - player.h;
                player.vy = 0;
                player.onGround = true;
            } else if (player.vy < 0) { // Pulando (bate a cabeça)
                player.y = p.y + p.h;
                player.vy = 0;
            }
        }

        // Colisão Horizontal (Laterais)
        if (player.x + player.vx < p.x + p.w && player.x + player.w + player.vx > p.x &&
            player.y < p.y + p.h && player.y + player.h > p.y) {
            player.vx = 0;
        }
    });
}

/* DESENHO DOS PERSONAGENS */
function drawEntity(p) {
    const renderX = p.x - cameraX;
    const renderY = p.y;

    ctx.save();
    if (p.skin === "rikcat") {
        // Corpo simples do Rikcat
        ctx.fillStyle = p.color || "#FFB000";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        
        // Orelhas
        ctx.beginPath();
        ctx.moveTo(renderX + 5, renderY);
        ctx.lineTo(renderX + 15, renderY - 15);
        ctx.lineTo(renderX + 20, renderY);
        ctx.fill(); ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(renderX + p.w - 5, renderY);
        ctx.lineTo(renderX + p.w - 15, renderY - 15);
        ctx.lineTo(renderX + p.w - 20, renderY);
        ctx.fill(); ctx.stroke();

        // Cabeça/Corpo
        ctx.fillRect(renderX, renderY, p.w, p.h);
        ctx.strokeRect(renderX, renderY, p.w, p.h);

        // Olhos
        ctx.fillStyle = "black";
        ctx.fillRect(renderX + 8, renderY + 12, 6, 8);
        ctx.fillRect(renderX + p.w - 14, renderY + 12, 6, 8);
    } else {
        // Desenho do Polvo
        ctx.font = `${p.w}px serif`;
        ctx.textBaseline = "top";
        ctx.fillText("🐙", renderX, renderY);
    }

    // Emote
    if (p.emote) {
        ctx.font = "20px Arial";
        ctx.fillText(p.emote, renderX + 10, renderY - 25);
    }
    ctx.restore();
}

/* LOOP PRINCIPAL */
function animate() {
    if (!playing) return;
    requestAnimationFrame(animate);

    // Reset Canvas
    ctx.fillStyle = inWater ? "#3399FF" : "#6AA5FF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Movimentação
    if (keys["ArrowLeft"]) { player.vx = -SPEED; player.facing = -1; }
    else if (keys["ArrowRight"]) { player.vx = SPEED; player.facing = 1; }
    else { player.vx *= FRICTION; }

    if ((keys["Space"] || keys["ArrowUp"]) && player.onGround) {
        player.vy = JUMP_FORCE;
        player.onGround = false;
    }

    // Aplicar Gravidade
    player.vy += GRAVITY;
    
    // Checar Colisões antes de mover
    checkCollisions();

    player.x += player.vx;
    player.y += player.vy;

    // Câmera Suave (Foco no centro)
    let targetCamX = player.x - canvas.width / 2;
    cameraX += (targetCamX - cameraX) * 0.1;
    if (cameraX < 0) cameraX = 0;

    // Desenhar Plataformas
    ctx.fillStyle = "#8B4513";
    platforms.forEach(p => {
        ctx.fillRect(p.x - cameraX, p.y, p.w, p.h);
        ctx.strokeStyle = "#5D2E0C";
        ctx.strokeRect(p.x - cameraX, p.y, p.w, p.h);
    });

    // Desenhar Canos
    ctx.fillStyle = "#2ecc71";
    pipes.forEach(pipe => {
        ctx.fillRect(pipe.x - cameraX, pipe.y, pipe.w, pipe.h);
        ctx.strokeRect(pipe.x - cameraX, pipe.y, pipe.w, pipe.h);
    });

    // Desenhar Outros Jogadores
    if (onlineEnabled) {
        // Enviar dados
        set(myRef, {
            x: player.x, y: player.y, 
            skin: player.skin, color: player.color, 
            emote: player.emote
        });

        for (let id in onlinePlayers) {
            if (id !== playerId) drawEntity(onlinePlayers[id]);
        }
    }

    // Desenhar Meu Jogador
    drawEntity(player);
}

/* EMOTES LOGIC */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");
emoteBtn.onclick = () => emoteMenu.style.display = emoteMenu.style.display === "flex" ? "none" : "flex";

document.querySelectorAll(".emote").forEach(btn => {
    btn.onclick = () => {
        player.emote = btn.textContent;
        emoteMenu.style.display = "none";
        setTimeout(() => { player.emote = null; }, 3000); // Emote some após 3s
    };
});

/* AJUSTE DE TELA */
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();
