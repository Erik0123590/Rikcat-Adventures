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

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth;
  rotate.style.display = portrait ? "flex" : "none";
  playing = !portrait && gameStarted;
}
window.addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
startBtn.onclick = () => {
  titleScreen.style.display = "none";
  gameDiv.style.display = "block";
  gameStarted = true;
  playing = true;
};

/* PLAYER */
const player = {
  x: 50,
  y: 0,
  w: 32,
  h: 32,
  vx: 0,
  vy: 0,
  onGround: false
};

/* CONTROLES */
let left = false;
let right = false;
let jump = false;

leftBtn.ontouchstart = () => left = true;
leftBtn.ontouchend = () => left = false;
rightBtn.ontouchstart = () => right = true;
rightBtn.ontouchend = () => right = false;
jumpBtn.ontouchstart = () => jump = true;
jumpBtn.ontouchend = () => jump = false;

/* MAPA (PLATAFORMAS) */
const platforms = [
  {x:0, y:canvas.height-40, w:2000, h:40},
  {x:200, y:450, w:120, h:20},
  {x:380, y:380, w:120, h:20},
  {x:560, y:320, w:120, h:20},
  {x:740, y:260, w:120, h:20},
  {x:920, y:200, w:120, h:20},
];

function update() {
  requestAnimationFrame(update);
  if (!playing) return;

  /* MOVIMENTO */
  player.vx = 0;
  if (left) player.vx = -4;
  if (right) player.vx = 4;

  if (jump && player.onGround) {
    player.vy = -12;
    player.onGround = false;
  }

  player.vy += 0.6;
  player.x += player.vx;
  player.y += player.vy;

  /* COLISÃO */
  player.onGround = false;
  for (let p of platforms) {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y < p.y + p.h &&
      player.y + player.h > p.y
    ) {
      if (player.vy > 0) {
        player.y = p.y - player.h;
        player.vy = 0;
        player.onGround = true;
      }
    }
  }

  /* DESENHO */
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#8B4513";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "orange";
  ctx.beginPath();
  ctx.arc(player.x+16, player.y+16, 16, 0, Math.PI*2);
  ctx.fill();
}

update();
