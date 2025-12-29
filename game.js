alert("GAME.JS CARREGOU");
import { db, ref, set, onValue, onDisconnect, push, remove } from "./firebase.js";

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
  color: "#FFB000"
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
function drawPlayer(p) {
  const x = p.x - camX + 16;
  const y = p.y + 16;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.facing, 1);

  if (p.skin === "rikcat") {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.font = "32px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🐙", 0, 12);
  }

  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick, x, p.y - 8);
}

/* ===== LOOP ===== */
function loop() {
  if (!playing) return;
  requestAnimationFrame(loop);

  if (!(chatOpen && document.activeElement === chatInput)) {
    if (keys["ArrowLeft"]) { me.vx = -SPEED; me.facing = -1; }
    else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
    else me.vx *= 0.8;

    if (keys["Space"] && me.onGround) {
      me.vy = JUMP;
      me.onGround = false;
    }
  }

  me.vy += GRAVITY;
  me.x += me.vx;
  me.y += me.vy;

  me.onGround = false;
  platforms.forEach(p => {
    const py = p.y();
    if (
      me.x < p.x + p.w &&
      me.x + me.w > p.x &&
      me.y + me.h > py &&
      me.y + me.h < py + p.h &&
      me.vy > 0
    ) {
      me.y = py - me.h;
      me.vy = 0;
      me.onGround = true;
    }
  });

  camX = Math.max(0, me.x - canvas.width / 2);

  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#8b4513";
  platforms.forEach(p => ctx.fillRect(p.x - camX, p.y(), p.w, p.h));

  if (online) {
    set(myRef, me);
    for (let id in others) if (id !== playerId) drawPlayer(others[id]);
  }

  drawPlayer(me);
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
      const data = snap.val() || {};
      Object.assign(others, data);
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
