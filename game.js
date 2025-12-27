import { db, ref, set, onValue, onDisconnect } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const settingsBtn = document.getElementById("settingsBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

const settingsMenu = document.getElementById("settingsMenu");
const settingsClose = document.getElementById("settingsClose");
const skinSelect = document.getElementById("skinSelect");
const colorPicker = document.getElementById("colorPicker");

/* BOTÕES */
const left = document.getElementById("left");
const right = document.getElementById("right");
const jump = document.getElementById("jump");
const attack = document.getElementById("attack");

/* AQUÁTICO */
const aquaticUp = document.getElementById("aquaticUp");
const aquaticDown = document.getElementById("aquaticDown");
const aquaticLeft = document.getElementById("aquaticLeft");
const aquaticRight = document.getElementById("aquaticRight");

/* EMOTES */
const emoteBtn = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

/* ONLINE */
const room = "salas_online_1";
const playerId = "p_" + Math.floor(Math.random() * 99999);
let onlineEnabled = false;
const onlinePlayers = {};

/* CONFIGURAÇÕES */
let selectedSkin = "rikcat";
let selectedColor = "#FFB000";

/* RESIZE */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation() {
  rotate.style.display = innerHeight > innerWidth ? "flex" : "none";
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
let playing = false;
let aquatic = false; // se está na fase aquática

function startGame(online) {
  onlineEnabled = online;
  titleScreen.style.display = "none";
  settingsMenu.style.display = "none";
  gameDiv.style.display = "block";
  playing = true;
  aquatic = false;
}
soloBtn.onclick = () => startGame(false);
multiBtn.onclick = () => startGame(true);

/* CONFIGURAÇÕES */
settingsBtn.onclick = () => {
  titleScreen.style.display = "none";
  settingsMenu.style.display = "flex";
};
settingsClose.onclick = () => {
  selectedSkin = skinSelect.value;
  selectedColor = colorPicker.value;
  settingsMenu.style.display = "none";
  titleScreen.style.display = "flex";
};

/* PLAYER */
const rikcat = {
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
  skin: selectedSkin,
  color: selectedColor
};

/* FIREBASE */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
onDisconnect(myRef).remove();

onValue(ref(db, `rooms/${room}/players`), snap => {
  Object.keys(onlinePlayers).forEach(k => delete onlinePlayers[k]);
  if (snap.val()) Object.assign(onlinePlayers, snap.val());
});

/* CONTROLES */
function updateControls() {
  if (!aquatic) {
    left.ontouchstart = () => rikcat.vx = -4;
    right.ontouchstart = () => rikcat.vx = 4;
    jump.ontouchstart = () => { if (rikcat.onGround) { rikcat.vy = -12; rikcat.onGround = false; } };
    attack.ontouchstart = () => rikcat.attacking = true;
    [left, right, jump, attack].forEach(b => b.ontouchend = () => { rikcat.vx = 0; rikcat.attacking = false; });
  } else {
    aquaticUp.ontouchstart = () => rikcat.vy = -4;
    aquaticDown.ontouchstart = () => rikcat.vy = 4;
    aquaticLeft.ontouchstart = () => rikcat.vx = -4;
    aquaticRight.ontouchstart = () => rikcat.vx = 4;
    [aquaticUp, aquaticDown, aquaticLeft, aquaticRight].forEach(b => b.ontouchend = () => { rikcat.vx = 0; rikcat.vy = 0; });
  }
}
updateControls();

/* EMOTES */
if (emoteBtn && emoteMenu) {
  emoteBtn.onclick = () => {
    emoteMenu.style.display = emoteMenu.style.display === "flex" ? "none" : "flex";
  };
  document.querySelectorAll(".emote").forEach(btn => {
    btn.onclick = () => {
      rikcat.emote = btn.textContent;
      emoteMenu.style.display = "none";
    };
  });
}

/* PLATAFORMAS */
const platforms = [
  { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
  { x: 200, y: () => canvas.height - 120, w: 140, h: 20 },
  { x: 420, y: () => canvas.height - 200, w: 140, h: 20 },
  { x: 650, y: () => canvas.height - 260, w: 140, h: 20 },
];

/* CANOS */
const pipeEntrance = { x: 800, y: canvas.height - 40, w: 40, h: 40, target: "aquatic" };
const pipeExit = { x: 1200, y: canvas.height - 40, w: 40, h: 40, target: "normal" };

/* CAMERA */
let camX = 0;
let camY = 0;

/* INIMIGOS */
const enemies = [
  { x: 300, y: canvas.height - 70, w: 32, h: 32, vx: 2 },
  { x: 500, y: canvas.height - 70, w: 32, h: 32, vx: -2 },
];

/* DESENHO RIKCAT/POLVO */
function drawCharacter(x, y, scale = 1, skin = "rikcat", color = "#FFB000", emote = null) {
  ctx.save();
  ctx.translate(x - camX, y - camY);
  ctx.scale(scale, scale);

  if (skin === "rikcat") {
    // ORELHAS
    ctx.fillStyle = color; ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(-18, -2); ctx.lineTo(-40, -28); ctx.lineTo(-8, -22); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FF2FA3";
    ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-32, -22); ctx.lineTo(-14, -18); ctx.closePath();
    ctx.fill();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(18, -2); ctx.lineTo(40, -28); ctx.lineTo(8, -22); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#FF2FA3";
    ctx.beginPath(); ctx.moveTo(20, -8); ctx.lineTo(32, -22); ctx.lineTo(14, -18); ctx.closePath();
    ctx.fill();

    // CABEÇA
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 6, 26, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // OLHOS
    ctx.fillStyle = "#000"; ctx.fillRect(-8, 0, 4, 14); ctx.fillRect(4, 0, 4, 14);
    // NARIZ
    ctx.fillStyle = "#FF2FA3"; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(-6, 22); ctx.lineTo(6, 22); ctx.closePath(); ctx.fill();
    // BOCA
    ctx.beginPath(); ctx.moveTo(0, 22); ctx.lineTo(0, 28); ctx.quadraticCurveTo(-4, 30, -6, 28); ctx.moveTo(0, 28); ctx.quadraticCurveTo(4, 30, 6, 28); ctx.stroke();
  } else if (skin === "octopus") {
    ctx.font = "48px sans-serif";
    ctx.fillText("🐙", -24, 24);
  }

  // EMOTE
  if (emote) {
    ctx.font = "24px sans-serif";
    ctx.fillText(emote, -10, -35);
  }
  ctx.restore();
}

/* LOOP PRINCIPAL */
function update() {
  requestAnimationFrame(update);
  if (!playing) return;

  // ATUALIZA POSIÇÃO
  rikcat.vy += aquatic ? 0 : 0.6; // gravidade normal só na fase normal
  rikcat.x += rikcat.vx;
  rikcat.y += rikcat.vy;

  rikcat.onGround = false;
  platforms.forEach(p => {
    const py = p.y();
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(p.x - camX, py - camY, p.w, p.h);
    if (!aquatic && rikcat.x < p.x + p.w && rikcat.x + rikcat.w > p.x &&
      rikcat.y + rikcat.h > py && rikcat.y + rikcat.h < py + p.h &&
      rikcat.vy > 0) {
      rikcat.y = py - rikcat.h;
      rikcat.vy = 0;
      rikcat.onGround = true;
    }
  });

  // CANOS
  if (!aquatic && rikcat.attacking &&
      rikcat.x + rikcat.w > pipeEntrance.x && rikcat.x < pipeEntrance.x + pipeEntrance.w &&
      rikcat.y + rikcat.h > pipeEntrance.y && rikcat.y < pipeEntrance.y + pipeEntrance.h) {
    aquatic = true;
    updateControls();
  }
  if (aquatic &&
      rikcat.x + rikcat.w > pipeExit.x && rikcat.x < pipeExit.x + pipeExit.w &&
      rikcat.y + rikcat.h > pipeExit.y && rikcat.y < pipeExit.y + pipeExit.h &&
      rikcat.attacking) {
    aquatic = false;
    updateControls();
  }

  // FUNDO
  ctx.fillStyle = aquatic ? "#6aa5ff" : "#a3d977";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // INIMIGOS
  enemies.forEach(e => {
    e.x += e.vx;
    if (e.x < 0 || e.x + e.w > 1000) e.vx *= -1;
    ctx.fillStyle = "red";
    ctx.fillRect(e.x - camX, e.y - camY, e.w, e.h);
  });

  // CAMERA
  camX = rikcat.x - canvas.width / 2 + rikcat.w / 2;
  camY = rikcat.y - canvas.height / 2 + rikcat.h / 2;

  // DESENHO PLAYER
  drawCharacter(rikcat.x, rikcat.y, 1, selectedSkin, selectedColor, rikcat.emote);

  // MULTIPLAYER
  if (onlineEnabled) {
    set(myRef, { x: rikcat.x, y: rikcat.y, emote: rikcat.emote, skin: selectedSkin, color: selectedColor });
    for (const id in onlinePlayers) {
      if (id === playerId) continue;
      const p = onlinePlayers[id];
      drawCharacter(p.x, p.y, 1, p.skin || "rikcat", p.color || "#FFB000", p.emote);
    }
  }
}
update();
