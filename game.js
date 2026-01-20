import { db, ref, push, set, onValue, onDisconnect } from "./firebase.js";
import { drawRikcat } from "./rikcat.js";

/* CANVAS */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ESTADO */
let estado = "menu";

/* PLAYER */
const player = {
  x: 100,
  y: 0,
  w: 48,
  h: 48,
  vx: 0,
  vy: 0,
  onGround: false,
  nick: "Rikcat",
  skin: "rikcat",
  bodyColor: "#ffffff",
  faceColor: "#ff00ff",
  earsColor: "#ffffff"
};

/* CONSTANTES */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* INPUT */
const keys = {};
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

/* MOBILE */
function bindTouch(id, key){
  const el = document.getElementById(id);
  if(!el) return;

  el.addEventListener("touchstart", e=>{
    e.preventDefault();
    keys[key] = true;
  });

  el.addEventListener("touchend", e=>{
    e.preventDefault();
    keys[key] = false;
  });
}
bindTouch("left","ArrowLeft");
bindTouch("right","ArrowRight");
bindTouch("jump"," ");

/* UI */
const menu = document.getElementById("menu");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const configBtn = document.getElementById("configBtn");
const configScreen = document.getElementById("configScreen");
const saveConfig = document.getElementById("saveConfig");

/* CONFIG */
configBtn.onclick = () => {
  configScreen.style.display = "flex";
};

saveConfig.onclick = () => {
  player.nick = document.getElementById("nickInput").value || player.nick;
  player.skin = document.getElementById("skinSelect").value;
  player.bodyColor = document.getElementById("bodyColorInput").value;
  player.faceColor = document.getElementById("faceColorInput").value;
  configScreen.style.display = "none";
};

/* SOLO */
soloBtn.onclick = () => {
  estado = "solo";
  menu.style.display = "none";
};

/* MULTIPLAYER (base, sem desenhar outros ainda) */
multiBtn.onclick = () => {
  estado = "multi";
  menu.style.display = "none";
};

/* CHÃO */
function groundY(){
  return canvas.height - 80;
}

/* LOOP */
function update(){
  if(estado !== "menu"){
    if(keys["ArrowLeft"]) player.vx = -SPEED;
    else if(keys["ArrowRight"]) player.vx = SPEED;
    else player.vx *= 0.85;

    if((keys[" "] || keys["ArrowUp"]) && player.onGround){
      player.vy = JUMP;
      player.onGround = false;
    }

    player.vy += GRAVITY;
    player.x += player.vx;
    player.y += player.vy;

    const g = groundY();
    if(player.y + player.h >= g){
      player.y = g - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  /* DRAW */
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#87CEEB";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "#654321";
  ctx.fillRect(0, groundY(), canvas.width, 80);

  drawRikcat(ctx, player);

  requestAnimationFrame(update);
}

update();
