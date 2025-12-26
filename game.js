const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const startBtn = document.getElementById("startBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

const leftBtn = document.getElementById("left");
const rightBtn = document.getElementById("right");
const jumpBtn = document.getElementById("jump");

let gameStarted = false;
let playing = false;

/* ================= RESIZE ================= */
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ================= ORIENTAÇÃO ================= */
function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth;
  rotate.style.display = portrait ? "flex" : "none";
  playing = !portrait && gameStarted;
}
window.addEventListener("resize", checkOrientation);
checkOrientation();

/* ================= START ================= */
startBtn.onclick = () => {
  titleScreen.style.display = "none";
  gameDiv.style.display = "block";
  gameStarted = true;
  playing = true;
};

/* ================= PLAYERS ================= */
const players = [
  {
    name: "Rikcat",
    color: "orange",
    x: 80,
    y: 0,
    w: 32,
    h: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    controls: { left: false, right: false, jump: false }
  },
  {
    name: "EduKat",
    color: "purple",
    x: 140,
    y: 0,
    w: 32,
    h: 32,
    vx: 0,
    vy: 0,
    onGround: false,
    controls: { left: false, right: false, jump: false }
  }
];

/* ================= CONTROLES ================= */
/* Player 1 – botões da esquerda */
leftBtn.ontouchstart = () => players[0].controls.left = true;
leftBtn.ontouchend = () => players[0].controls.left = false;

rightBtn.ontouchstart = () => players[0].controls.right = true;
rightBtn.ontouchend = () => players[0].controls.right = false;

jumpBtn.ontouchstart = () => players[0].controls.jump = true;
jumpBtn.ontouchend = () => players[0].controls.jump = false;

/* Player 2 – toques na metade direita da tela */
canvas.addEventListener("touchstart", e => {
  for (let t of e.touches) {
    if (t.clientX > canvas.width / 2) {
      players[1].controls.right = true;
      players[1].controls.jump = true;
    }
  }
});

canvas.addEventListener("touchend", () => {
  players[1].controls.right = false;
  players[1].controls.jump = false;
});

/* ================= MAPA ================= */
const platforms = [
  { x: 0, y: () => canvas.height - 40, w: 3000, h: 40 },
  { x: 200, y: () => canvas.height - 120, w: 140, h: 20 },
  { x: 420, y: () => canvas.height - 200, w: 140, h: 20 },
  { x: 650, y: () => canvas.height - 260, w: 140, h: 20 },
  { x: 900, y: () => canvas.height - 320, w: 140, h: 20 },
];

/* ================= UPDATE ================= */
function update() {
  requestAnimationFrame(update);
  if (!playing) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  /* PLATAFORMAS */
  ctx.fillStyle = "#8B4513";
  platforms.forEach(p => {
    const py = p.y();
    ctx.fillRect(p.x, py, p.w, p.h);
  });

  /* PLAYERS */
  players.forEach(p => {
    p.vx = 0;

    if (p.controls.left) p.vx = -4;
    if (p.controls.right) p.vx = 4;

    if (p.controls.jump && p.onGround) {
      p.vy = -12;
      p.onGround = false;
    }

    p.vy += 0.6;
    p.x += p.vx;
    p.y += p.vy;

    p.onGround = false;

    platforms.forEach(pl => {
      const py = pl.y();
      if (
        p.x < pl.x + pl.w &&
        p.x + p.w > pl.x &&
        p.y < py + pl.h &&
        p.y + p.h > py
      ) {
        if (p.vy > 0) {
          p.y = py - p.h;
          p.vy = 0;
          p.onGround = true;
        }
      }
    });

    /* DESENHO DO PLAYER */
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
    ctx.fill();

    /* NOME */
    ctx.fillStyle = "black";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.name, p.x + p.w / 2, p.y - 5);
  });
}

update();
