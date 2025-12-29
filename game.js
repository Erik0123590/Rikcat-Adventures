// game.js
alert("GAME.JS CARREGOU – FO1 BASE");

import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

/* ===== CANVAS ===== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* ===== CONFIG ===== */
const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 5;
const room = "fogo_online_1";
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
  nick: "Convidado"
};

let playing = false;
let online = false;
let camX = 0;
const others = {};

/* ===== FIREBASE ===== */
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const chatRef = ref(db, `rooms/${room}/chat`);

/* ===== INPUT ===== */
const keys = {};
const btnLeft  = document.getElementById("left");
const btnRight = document.getElementById("right");
const btnJump  = document.getElementById("jump");

btnLeft.ontouchstart  = () => keys["ArrowLeft"] = true;
btnLeft.ontouchend    = () => keys["ArrowLeft"] = false;
btnRight.ontouchstart = () => keys["ArrowRight"] = true;
btnRight.ontouchend   = () => keys["ArrowRight"] = false;
btnJump.ontouchstart  = () => keys["Space"] = true;
btnJump.ontouchend    = () => keys["Space"] = false;

window.onkeydown = e => keys[e.code] = true;
window.onkeyup   = e => keys[e.code] = false;

/* ===== CHAT ===== */
const chatBtn   = document.getElementById("openChatBtn");
const chatWrap  = document.getElementById("chatBoxWrap");
const chatBox   = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");

let chatOpen = false;

chatBtn.onclick = () => {
  chatOpen = !chatOpen;
  chatWrap.style.display = chatOpen ? "flex" : "none";
  if (chatOpen) chatInput.focus();
};

chatInput.onkeydown = e => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    push(chatRef, {
      sender: me.nick,
      text: chatInput.value,
      time: Date.now()
    });
    chatInput.value = "";
  }
};

onValue(chatRef, snap => {
  chatBox.innerHTML = "";
  const data = snap.val();
  if (!data) return;

  Object.values(data).slice(-20).forEach(m => {
    const d = document.createElement("div");
    d.innerHTML = `<b>${m.sender}:</b> ${m.text}`;
    chatBox.appendChild(d);
  });

  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ===== MAPA ===== */
const platforms = [
  { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 }
];

/* ===== DRAW ===== */
function drawPlayer(p) {
  const x = p.x - camX;
  const y = p.y;

  ctx.fillStyle = "#ff9800";
  ctx.fillRect(x, y, p.w, p.h);

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick, x + p.w / 2, y - 6);
}

/* ===== LOOP ===== */
function loop() {
  if (!playing) return;
  requestAnimationFrame(loop);

  if (keys["ArrowLeft"])  { me.vx = -SPEED; me.facing = -1; }
  else if (keys["ArrowRight"]) { me.vx = SPEED; me.facing = 1; }
  else me.vx *= 0.8;

  if (keys["Space"] && me.onGround) {
    me.vy = JUMP;
    me.onGround = false;
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
  platforms.forEach(p =>
    ctx.fillRect(p.x - camX, p.y(), p.w, p.h)
  );

  if (online) {
    set(myRef, me);
    Object.values(others).forEach(p => drawPlayer(p));
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
      delete data[playerId];
      Object.assign(others, data);
    });
  }

  loop();
}

/* ===== BOTÕES ===== */
document.getElementById("soloBtn").onclick  = () => start(false);
document.getElementById("multiBtn").onclick = () => start(true);

/* ===== RESIZE ===== */
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
window.onresize = resize;
resize();
