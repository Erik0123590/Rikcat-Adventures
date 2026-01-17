// game.js — FO1 Base Estável (Solo + Multiplayer)

import {
  db,
  ref,
  set,
  push,
  onValue,
  onDisconnect
} from "./firebase.js";

import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";

/* ================== CANVAS ================== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ================== CONSTANTES ================== */
const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

/* ================== PLAYER ================== */
const player = {
  x: 100,
  y: 0,
  w: 40,
  h: 40,
  vx: 0,
  vy: 0,
  onGround: false,
  skin: "rikcat",
  color: "#FFB000"
};

/* ================== MULTIPLAYER ================== */
let modo = "solo";
let playerRef = null;
let outrosPlayers = {};

/* ================== INPUT ================== */
const keys = {};
addEventListener("keydown", e => keys[e.key] = true);
addEventListener("keyup", e => keys[e.key] = false);

/* ================== CHÃO ================== */
function groundY(){
  return canvas.height - 80;
}

/* ================== MENU ================== */
window.startSolo = () => {
  modo = "solo";
};

window.startMulti = () => {
  conectarMultiplayer();
};

/* ================== CONFIG ================== */
window.saveConfig = () => {
  player.skin = skinSelect.value;
  player.color = colorSelect.value;
  configScreen.style.display = "none";
};

/* ================== MULTIPLAYER FUNÇÃO ================== */
function conectarMultiplayer(){
  modo = "multi";

  playerRef = push(ref(db, "players"));
  set(playerRef, player);

  onDisconnect(playerRef).remove();

  onValue(ref(db, "players"), snap => {
    outrosPlayers = {};
    snap.forEach(p => {
      if (p.key !== playerRef.key) {
        outrosPlayers[p.key] = p.val();
      }
    });
  });

  setInterval(() => {
    if (playerRef) {
      set(playerRef, player);
    }
  }, 100);
}

/* ================== LOOP PRINCIPAL ================== */
function update(){

  /* ---- Movimento ---- */
  if(keys["ArrowLeft"]) player.vx = -SPEED;
  else if(keys["ArrowRight"]) player.vx = SPEED;
  else player.vx *= 0.8;

  if((keys[" "] || keys["Space"]) && player.onGround){
    player.vy = JUMP;
    player.onGround = false;
  }

  /* ---- Física ---- */
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  const g = groundY();
  if(player.y + player.h >= g){
    player.y = g - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  /* ---- Desenho ---- */
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // chão
  ctx.fillStyle = "#654321";
  ctx.fillRect(0, g, canvas.width, 80);

  // player local
  if(player.skin === "polvo"){
    drawPolvo(ctx, player);
  } else {
    drawRikcat(ctx, player);
  }

  // outros jogadores
  if(modo === "multi"){
    for(const id in outrosPlayers){
      const p = outrosPlayers[id];
      if(p.skin === "polvo"){
        drawPolvo(ctx, p);
      } else {
        drawRikcat(ctx, p);
      }
    }
  }

  requestAnimationFrame(update);
}

update();
