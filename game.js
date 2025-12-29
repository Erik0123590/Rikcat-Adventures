alert("GAME.JS CARREGOU");
alert("AI MEU CUH 😭");
import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

/* ===== CANVAS ===== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* ===== TELAS ===== */
const titleScreen = document.getElementById("titleScreen");
const configScreen = document.getElementById("configScreen");
const gameScreen = document.getElementById("game");

/* ===== ESTADO ===== */
let playing = false;
let online = false;
let cameraX = 0;

/* ===== PLAYER ===== */
const player = {
  x: 100,
  y: 0,
  w: 32,
  h: 32,
  vx: 0,
  vy: 0,
  onGround: false,
  nick: "Jogador",
  facing: 1
};

/* ===== FÍSICA ===== */
const GRAVITY = 0.6;
const JUMP = -12;
const SPEED = 5;

/* ===== CHÃO ===== */
const groundY = () => canvas.height - 60;

/* ===== INPUT ===== */
const keys = {};

window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

/* ===== MOBILE ===== */
function bindTouch(id, key) {
  const el = document.getElementById(id);
  el.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  }, { passive:false });
  el.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  }, { passive:false });
}

bindTouch("left", "ArrowLeft");
bindTouch("right", "ArrowRight");
bindTouch("jump", "Space");

/* ===== MULTIPLAYER ===== */
const room = "oe5_base";
const playerId = "p_" + Math.floor(Math.random() * 99999);
const myRef = ref(db, `rooms/${room}/players/${playerId}`);
const players = {};

/* ===== CHAT ===== */
const chatBtn = document.getElementById("openChatBtn");
const chatWrap = document.getElementById("chatBoxWrap");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");

chatBtn.onclick = () => {
  chatWrap.style.display =
    chatWrap.style.display === "flex" ? "none" : "flex";
};

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    push(ref(db, `rooms/${room}/chat`), {
      nick: player.nick,
      msg: chatInput.value
    });
    chatInput.value = "";
  }
});

onValue(ref(db, `rooms/${room}/chat`), snap => {
  chatBox.innerHTML = "";
  const data = snap.val() || {};
  for (let id in data) {
    const m = data[id];
    const div = document.createElement("div");
    div.textContent = `${m.nick}: ${m.msg}`;
    chatBox.appendChild(div);
  }
  chatBox.scrollTop = chatBox.scrollHeight;
});

/* ===== DESENHO ===== */
function drawPlayer(p) {
  ctx.save();
  ctx.translate(p.x - cameraX + 16, p.y + 32);
  ctx.scale(p.facing, 1);

  // Corpo
  ctx.fillStyle = "#FFB000";
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(0, -16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Orelhas
  [-1,1].forEach(s=>{
    ctx.save();
    ctx.scale(s,1);
    ctx.beginPath();
    ctx.moveTo(-10,-25);
    ctx.lineTo(-20,-45);
    ctx.lineTo(0,-30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });

  ctx.restore();

  // Nick
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick, p.x - cameraX + 16, p.y - 10);
}

/* ===== UPDATE ===== */
function update() {
  if (!playing) return;

  requestAnimationFrame(update);

  // Movimento
  if (keys["ArrowLeft"]) {
    player.vx = -SPEED;
    player.facing = -1;
  } else if (keys["ArrowRight"]) {
    player.vx = SPEED;
    player.facing = 1;
  } else {
    player.vx *= 0.8;
  }

  if (keys["Space"] && player.onGround) {
    player.vy = JUMP;
    player.onGround = false;
  }

  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  if (player.y + player.h >= groundY()) {
    player.y = groundY() - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  cameraX = player.x - canvas.width / 2;
  if (cameraX < 0) cameraX = 0;

  // Fundo
  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Chão
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(-cameraX, groundY(), 5000, 60);

  // Multiplayer sync
  if (online) {
    set(myRef, {
      x: player.x,
      y: player.y,
      nick: player.nick,
      facing: player.facing
    });

    for (let id in players) {
      if (id !== playerId) drawPlayer(players[id]);
    }
  }

  drawPlayer(player);
}

/* ===== START ===== */
function startGame(isOnline) {
  online = isOnline;
  playing = true;

  titleScreen.style.display = "none";
  gameScreen.style.display = "block";

  if (online) {
    chatBtn.style.display = "flex";

    onDisconnect(myRef).remove();

    onValue(ref(db, `rooms/${room}/players`), snap => {
      const data = snap.val() || {};
      for (let id in players) if (!data[id]) delete players[id];
      Object.assign(players, data);
    });
  }

  update();
}

/* ===== BOTÕES ===== */
document.getElementById("soloBtn").onclick = () => startGame(false);
document.getElementById("multiBtn").onclick = () => startGame(true);

document.getElementById("configBtn").onclick = () => {
  titleScreen.style.display = "none";
  configScreen.style.display = "flex";
};

document.getElementById("saveConfig").onclick = () => {
  const n = document.getElementById("nickInput").value.trim();
  if (n) player.nick = n;
  configScreen.style.display = "none";
  titleScreen.style.display = "flex";
};
