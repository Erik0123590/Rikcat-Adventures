alert("GAME.JS CARREGOU");
import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

/* ===============================
   ELEMENTOS HTML
================================ */
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const configScreen = document.getElementById("configScreen");
const game = document.getElementById("game");

const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const saveConfig = document.getElementById("saveConfig");

const nickInput = document.getElementById("nickInput");
const skinSelect = document.getElementById("skinSelect");

const openChatBtn = document.getElementById("openChatBtn");
const chatBoxWrap = document.getElementById("chatBoxWrap");
const chatBox = document.getElementById("chatBox");
const chatInput = document.getElementById("chatInput");

/* ===============================
   ESTADO GLOBAL
================================ */
let mode = "solo";
let roomId = "global";
let playerId = Math.random().toString(36).slice(2);

let players = {};
let localPlayer = null;

let gravity = 0.5;
let groundY = 260;

/* ===============================
   TELAS
================================ */
function showScreen(name) {
  titleScreen.style.display = "none";
  configScreen.style.display = "none";
  game.style.display = "none";

  if (name === "title") titleScreen.style.display = "flex";
  if (name === "config") configScreen.style.display = "flex";
  if (name === "game") game.style.display = "block";
}

showScreen("title");

/* ===============================
   CONFIGURAÇÕES
================================ */
let settings = {
  nick: localStorage.getItem("nick") || "Player",
  skin: localStorage.getItem("skin") || "rikcat"
};

nickInput.value = settings.nick;
skinSelect.value = settings.skin;

saveConfig.onclick = () => {
  settings.nick = nickInput.value || "Player";
  settings.skin = skinSelect.value;

  localStorage.setItem("nick", settings.nick);
  localStorage.setItem("skin", settings.skin);

  showScreen("title");
};

/* ===============================
   BOTÕES
================================ */
configBtn.onclick = () => showScreen("config");

soloBtn.onclick = () => {
  mode = "solo";
  startGame();
};

multiBtn.onclick = () => {
  mode = "multi";
  startGame();
};

/* ===============================
   PLAYER
================================ */
function createPlayer(x = 50, y = 0) {
  return {
    x,
    y,
    w: 32,
    h: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    nick: settings.nick,
    skin: settings.skin,
    dir: 1
  };
}

/* ===============================
   DESENHO
================================ */
function drawRikcat(p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  // corpo
  ctx.fillStyle = "#f5b97a";
  ctx.fillRect(6, 10, 20, 18);

  // orelhas atrás
  ctx.fillRect(4, 2, 8, 8);
  ctx.fillRect(20, 2, 8, 8);

  // rosto
  ctx.fillStyle = "#000";
  ctx.fillRect(12, 16, 3, 3);
  ctx.fillRect(18, 16, 3, 3);

  // nariz
  ctx.fillStyle = "#d66";
  ctx.fillRect(15, 20, 3, 2);

  ctx.restore();
}

function drawPolvo(p) {
  ctx.font = "28px Arial";
  ctx.textAlign = "center";
  ctx.fillText("🐙", p.x + p.w / 2, p.y + p.h);
}

function drawNick(p) {
  ctx.font = "14px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "#000";
  ctx.fillText(p.nick, p.x + p.w / 2, p.y - 6);
}

/* ===============================
   INPUT
================================ */
const keys = {};
window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/* ===============================
   FÍSICA
================================ */
function updatePlayer(p) {
  if (keys["ArrowLeft"]) {
    p.vx = -2;
    p.dir = -1;
  } else if (keys["ArrowRight"]) {
    p.vx = 2;
    p.dir = 1;
  } else {
    p.vx = 0;
  }

  if (keys["ArrowUp"] && p.onGround) {
    p.vy = -10;
    p.onGround = false;
  }

  p.vy += gravity;

  p.x += p.vx;
  p.y += p.vy;

  if (p.y + p.h >= groundY) {
    p.y = groundY - p.h;
    p.vy = 0;
    p.onGround = true;
  }
}

/* ===============================
   MULTIPLAYER
================================ */
function syncPlayer() {
  if (mode !== "multi") return;

  set(ref(db, `rooms/${roomId}/players/${playerId}`), localPlayer);
}

function listenPlayers() {
  onValue(ref(db, `rooms/${roomId}/players`), snap => {
    players = snap.val() || {};
  });
}

function setupDisconnect() {
  onDisconnect(ref(db, `rooms/${roomId}/players/${playerId}`)).remove();
}

/* ===============================
   CHAT
================================ */
openChatBtn.onclick = () => {
  chatBoxWrap.style.display =
    chatBoxWrap.style.display === "none" ? "block" : "none";
};

chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && chatInput.value.trim()) {
    push(ref(db, `rooms/${roomId}/chat`), {
      nick: settings.nick,
      msg: chatInput.value
    });
    chatInput.value = "";
  }
});

onValue(ref(db, `rooms/${roomId}/chat`), snap => {
  chatBox.innerHTML = "";
  const msgs = Object.values(snap.val() || {}).slice(-30);
  msgs.forEach(m => {
    const div = document.createElement("div");
    div.textContent = `${m.nick}: ${m.msg}`;
    chatBox.appendChild(div);
  });
});

/* ===============================
   GAME LOOP
================================ */
function startGame() {
  showScreen("game");

  localPlayer = createPlayer();
  players[playerId] = localPlayer;

  if (mode === "multi") {
    syncPlayer();
    listenPlayers();
    setupDisconnect();
  }

  requestAnimationFrame(loop);
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#7cfc90";
  ctx.fillRect(0, groundY, canvas.width, canvas.height);

  updatePlayer(localPlayer);

  if (mode === "multi") {
    syncPlayer();
  }

  Object.values(players).forEach(p => {
    drawNick(p);
    if (p.skin === "polvo") drawPolvo(p);
    else drawRikcat(p);
  });

  requestAnimationFrame(loop);
                        }
