const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* =====================
   CONTROLE DE ORIENTAÇÃO
===================== */
let playing = false;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function checkOrientation() {
  const portrait = window.innerHeight > window.innerWidth;

  document.getElementById("rotate").style.display = portrait ? "flex" : "none";
  document.getElementById("game").style.display = portrait ? "none" : "block";

  playing = !portrait;

  if (!portrait) {
    resize();
  }
}

window.addEventListener("resize", checkOrientation);
checkOrientation();

/* =====================
   PERSONAGEM (Rikcat)
===================== */
const SCALE = 0.66; // Rikcat 1.5x menor

let cat = {
  x: 120,
  y: 0,
  w: 60 * SCALE,
  h: 60 * SCALE,
  vx: 0,
  vy: 0,
  speed: 4,
  jump: -13,
  onGround: false
};

/* =====================
   FÍSICA
===================== */
const gravity = 0.7;

function ground() {
  return canvas.height - 90;
}

/* =====================
   PLATAFORMAS
===================== */
let platforms = [
  { x: 80,  y: 300, w: 160, h: 20 },
  { x: 300, y: 240, w: 160, h: 20 },
  { x: 520, y: 180, w: 160, h: 20 },
  { x: 740, y: 240, w: 160, h: 20 },
  { x: 960, y: 300, w: 160, h: 20 },

  { x: 200, y: 420, w: 160, h: 20 },
  { x: 420, y: 360, w: 160, h: 20 },
  { x: 640, y: 420, w: 160, h: 20 },
  { x: 860, y: 360, w: 160, h: 20 }
];

/* =====================
   CONTROLES TOUCH
===================== */
let left = false;
let right = false;

document.getElementById("left").ontouchstart = () => left = true;
document.getElementById("left").ontouchend   = () => left = false;

document.getElementById("right").ontouchstart = () => right = true;
document.getElementById("right").ontouchend   = () => right = false;

document.getElementById("jump").ontouchstart = () => {
  if (cat.onGround) {
    cat.vy = cat.jump;
    cat.onGround = false;
  }
};

/* =====================
   ATUALIZA JOGO
===================== */
function update() {
  if (!playing) return;

  // Movimento horizontal
  cat.vx = 0;
  if (left) cat.vx = -cat.speed;
  if (right) cat.vx = cat.speed;

  cat.x += cat.vx;

  // Gravidade
  cat.vy += gravity;
  cat.y += cat.vy;

  cat.onGround = false;

  // Colisão com chão
  if (cat.y + cat.h >= ground()) {
    cat.y = ground() - cat.h;
    cat.vy = 0;
    cat.onGround = true;
  }

  // Colisão com plataformas
  platforms.forEach(p => {
    if (
      cat.x < p.x + p.w &&
      cat.x + cat.w > p.x &&
      cat.y + cat.h > p.y &&
      cat.y + cat.h < p.y + p.h + 15 &&
      cat.vy >= 0
    ) {
      cat.y = p.y - cat.h;
      cat.vy = 0;
      cat.onGround = true;
    }
  });

  draw();
  requestAnimationFrame(update);
}

/* =====================
   DESENHO
===================== */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  ctx.fillStyle = "#6aa5ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Plataformas
  ctx.fillStyle = "#7b4a12";
  platforms.forEach(p => {
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // Chão
  ctx.fillRect(0, ground(), canvas.width, 90);

  // Rikcat (quadrado provisório)
  ctx.fillStyle = "orange";
  ctx.fillRect(cat.x, cat.y, cat.w, cat.h);
}

update();
