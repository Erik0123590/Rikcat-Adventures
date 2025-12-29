alert("GAME.JS CARREGOU");
import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* ===== CONFIG ===== */
const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 5;
const room = "online_salas_1";
const playerId = "p_" + Math.floor(Math.random() * 999999);

/* ===== PLAYER ===== */
const me = {
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  w: 32,
  h: 32,
  onGround: false,
  facing: 1,
  nick: "Convidado",
  skin: "rikcat",
  color: "#00ff00"
};

let playing = false;
let online = false;
let camX = 0;
const others = {};

const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const chatRef = ref(db, `rooms/${room}/chat`);

/* ===== INPUT ===== */
const keys = {};
const btnLeft = document.getElementById("left");
const btnRight = document.getElementById("right");
const btnJump = document.getElementById("jump");

btnLeft.addEventListener("touchstart", () => keys["ArrowLeft"] = true);
btnLeft.addEventListener("touchend", () => keys["ArrowLeft"] = false);
btnRight.addEventListener("touchstart", () => keys["ArrowRight"] = true);
btnRight.addEventListener("touchend", () => keys["ArrowRight"] = false);
btnJump.addEventListener("touchstart", () => keys["Space"] = true);
btnJump.addEventListener("touchend", () => keys["Space"] = false);

window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

/* ===== CHAT ===== */
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");
const chatBtn = document.getElementById("openChatBtn");
let chatOpen = false;

chatBtn.onclick = () => {
  chatOpen = !chatOpen;
  document.getElementById("chatContainer").style.display = chatOpen ? "flex" : "none";
  if (chatOpen) chatInput.focus();
};

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    push(chatRef, {
      sender: me.nick,
      text: chatInput.value,
      time: Date.now()
    });
    chatInput.value = "";
  }
});

onValue(chatRef, snap => {
  chatBox.innerHTML = "";
  const data = snap.val();
  if (!data) return;
  Object.values(data).slice(-25).forEach(m => {
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    chatBox.appendChild(d);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ===== PLATAFORMAS ===== */
const platforms = [
  { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
  { x: 250, y: () => canvas.height - 120, w: 140, h: 20 },
  { x: 500, y: () => canvas.height - 200, w: 140, h: 20 }
];

/* ===== DRAW ===== */
// Substitua sua drawPlayer por esta versão (idle >>> imóvel; walk >>> bob tocando o chão)
function drawPlayer(p) {
  // coordenadas levando em conta a câmera (mantém seu padrão atual)
  const x = p.x - camX + 16;   // centro horizontal aproximado
  const baseY = p.y + 16;      // base vertical aproximada

  // estado de movimento (andando só quando tiver velocidade perceptível e estiver no chão)
  const moving = Math.abs(p.vx || 0) > 0.3 && !!p.onGround;

  // contador interno para animação (cria se não existir)
  if (p._walkCounter === undefined) p._walkCounter = 0;
  if (moving) p._walkCounter += 1;
  else p._walkCounter = 0;

  // 2 frames de caminhada (alternam a cada 8 ticks)
  const walkFrame = Math.floor(p._walkCounter / 8) % 2;

  // bob: quando andando alterna entre "encostar no chão" (valor positivo -> desce)
  // e "flutuar" (valor negativo -> sobe). Ajuste os valores se quiser maior/menor efeito.
  const bob = moving ? (walkFrame === 0 ? 4 : -2) : 0;

  ctx.save();
  // aplica translação para o ponto onde desenharemos (com bob)
  ctx.translate(x, baseY + bob);

  // somente espelha quando estiver andando (você pediu rosto central no idle)
  if (moving) ctx.scale(p.facing || 1, 1);
  // (removi alongamento/air conforme pediu)

  const bodyColor = p.color || "#FFB000";
  const outline = "#000";
  const earInner = "#FF2FA3";

  ctx.lineWidth = 3;
  ctx.strokeStyle = outline;
  ctx.fillStyle = bodyColor;

  // --- CABEÇA / CORPO (círculo) ---
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- ORELHAS ---
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;

  if (!moving) {
    // IDLE: orelhas mais abertas/laterais (rosto central)
    // orelha esquerda
    ctx.beginPath();
    ctx.moveTo(-18, -2);
    ctx.lineTo(-36, -2);
    ctx.lineTo(-18, -26);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(-24, -6);
    ctx.lineTo(-32, -6);
    ctx.lineTo(-22, -18);
    ctx.closePath();
    ctx.fill();

    // orelha direita
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(18, -2);
    ctx.lineTo(36, -2);
    ctx.lineTo(18, -26);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(24, -6);
    ctx.lineTo(32, -6);
    ctx.lineTo(22, -18);
    ctx.closePath();
    ctx.fill();
  } else {
    // WALK: orelhas mais apontadas/diagonais (dinâmica)
    ctx.beginPath();
    ctx.moveTo(-12, -12);
    ctx.lineTo(-30, -28);
    ctx.lineTo(-4, -30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(-18, -14);
    ctx.lineTo(-24, -26);
    ctx.lineTo(-6, -26);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(12, -12);
    ctx.lineTo(30, -28);
    ctx.lineTo(4, -30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = earInner;
    ctx.beginPath();
    ctx.moveTo(18, -14);
    ctx.lineTo(24, -26);
    ctx.lineTo(6, -26);
    ctx.closePath();
    ctx.fill();
  }

  // --- OLHOS ---
  ctx.fillStyle = "#000";
  if (moving) {
    // alterna dois "frames" de olhos para dar movimento simples
    if (walkFrame === 0) {
      ctx.fillRect(-8, -6, 4, 12);
      ctx.fillRect(4, -6, 4, 12);
    } else {
      ctx.fillRect(-8, -2, 4, 8);
      ctx.fillRect(4, -2, 4, 8);
    }
  } else {
    // idle: olhos verticais
    ctx.fillRect(-8, -6, 4, 12);
    ctx.fillRect(4, -6, 4, 12);
  }

  // --- NARIZ ---
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(-5, 10);
  ctx.lineTo(5, 10);
  ctx.closePath();
  ctx.fill();

  // --- BOCA ---
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  if (moving) {
    // boca simples sorridente em movimento
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(0, 18, 6, 14);
    ctx.stroke();
  } else {
    // idle: boca "w" fofa
    ctx.beginPath();
    ctx.moveTo(-4, 12);
    ctx.quadraticCurveTo(0, 16, 4, 12);
    ctx.moveTo(-1, 12);
    ctx.quadraticCurveTo(0, 15, 1, 12);
    ctx.stroke();
  }

  ctx.restore();

  // --- NICK (fora do transform) ---
  ctx.fillStyle = "white";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", x, p.y - 8);
}

/* ===== START ===== */
function start(isOnline) {
  online = isOnline;
  playing = true;

  document.getElementById("titleScreen").style.display = "none";
  document.getElementById("game").style.display = "block";

  if (online) {
    chatBtn.style.display = "flex";
    onDisconnect(myRef).remove();

    onValue(ref(db, `rooms/${room}/players`), snap => {
      Object.assign(others, snap.val() || {});
    });
  }

  loop();
}

/* ===== BUTTONS ===== */
document.getElementById("soloBtn").onclick = () => start(false);
document.getElementById("multiBtn").onclick = () => start(true);

document.getElementById("closeConfig").onclick = () => {
  const n = document.getElementById("nickInput").value.trim();
  if (n) me.nick = n;
  me.skin = document.getElementById("skinSelect").value;
  me.color = document.getElementById("colorSelect").value;
  document.getElementById("configScreen").style.display = "none";
};

/* ===== RESIZE ===== */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.onresize = resize;
resize();
