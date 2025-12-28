import { db, ref, set, onValue, onDisconnect, push } from "./firebase.js";

/* =====================
   CANVAS
===================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

/* =====================
   PLAYER LOCAL
===================== */
const playerId = push(ref(db, "players")).key;

const localPlayer = {
  x: 100,
  y: 100,
  vx: 0,
  vy: 0,
  dir: 1,
  skin: "rikcat", // "rikcat" ou "polvo"
  nick: "Player"
};

/* =====================
   FÍSICA
===================== */
const GRAVITY = 0.6;
const FLOOR = canvas.height - 80;

/* =====================
   INPUT
===================== */
const keys = {};

window.addEventListener("keydown", e => keys[e.key] = true);
window.addEventListener("keyup", e => keys[e.key] = false);

/* =====================
   FIREBASE SETUP
===================== */
const playerRef = ref(db, "players/" + playerId);

onDisconnect(playerRef).remove();

set(playerRef, localPlayer);

const players = {};

onValue(ref(db, "players"), snapshot => {
  Object.keys(players).forEach(id => delete players[id]);
  snapshot.forEach(child => {
    players[child.key] = child.val();
  });
});

/* =====================
   UPDATE
===================== */
function update() {
  // Movimento
  if (keys["ArrowLeft"]) {
    localPlayer.vx = -4;
    localPlayer.dir = -1;
  } else if (keys["ArrowRight"]) {
    localPlayer.vx = 4;
    localPlayer.dir = 1;
  } else {
    localPlayer.vx = 0;
  }

  if (keys["ArrowUp"] && localPlayer.y >= FLOOR) {
    localPlayer.vy = -12;
  }

  // Gravidade
  localPlayer.vy += GRAVITY;

  localPlayer.x += localPlayer.vx;
  localPlayer.y += localPlayer.vy;

  // Chão
  if (localPlayer.y > FLOOR) {
    localPlayer.y = FLOOR;
    localPlayer.vy = 0;
  }

  set(playerRef, localPlayer);
}

/* =====================
   DRAW SKINS
===================== */
function drawRikcat(p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.dir, 1);

  // corpo
  ctx.fillStyle = "#ffcc99";
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();

  // orelhas atrás
  ctx.fillStyle = "#ffcc99";
  ctx.beginPath();
  ctx.arc(-12, -18, 6, 0, Math.PI * 2);
  ctx.arc(12, -18, 6, 0, Math.PI * 2);
  ctx.fill();

  // olhos
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-5, -3, 2, 0, Math.PI * 2);
  ctx.arc(5, -3, 2, 0, Math.PI * 2);
  ctx.fill();

  // nariz
  ctx.fillStyle = "#ff7777";
  ctx.beginPath();
  ctx.arc(0, 3, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPolvo(p) {
  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.font = "40px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐙", 0, 0);

  ctx.restore();
}

/* =====================
   RENDER
===================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // chão
  ctx.fillStyle = "#4b8b3b";
  ctx.fillRect(0, FLOOR + 20, canvas.width, 60);

  Object.values(players).forEach(p => {
    if (p.skin === "polvo") {
      drawPolvo(p);
    } else {
      drawRikcat(p);
    }
  });
}

/* =====================
   LOOP
===================== */
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

loop();
