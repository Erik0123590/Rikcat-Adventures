import { drawRikcat } from "./rikcat.js";
import { drawPolvo } from "./polvo.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

const GRAVITY = 0.9;
const JUMP = -16;
const SPEED = 5;

const player = {
  x:100,
  y:0,
  w:40,
  h:40,
  vx:0,
  vy:0,
  onGround:false,
  skin:"rikcat",
  color:"#FFB000"
};

function groundY(){
  return canvas.height - 80;
}

const keys = {};

addEventListener("keydown",e=>keys[e.key]=true);
addEventListener("keyup",e=>keys[e.key]=false);

function update(){
  // Movimento
  if(keys["ArrowLeft"]) player.vx = -SPEED;
  else if(keys["ArrowRight"]) player.vx = SPEED;
  else player.vx *= 0.8;

  if(keys[" "] && player.onGround){
    player.vy = JUMP;
    player.onGround = false;
  }

  // Física
  player.vy += GRAVITY;
  player.x += player.vx;
  player.y += player.vy;

  const g = groundY();
  if(player.y + player.h >= g){
    player.y = g - player.h;
    player.vy = 0;
    player.onGround = true;
  }

  // Desenho
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(player.skin === "polvo"){
    drawPolvo(ctx, player);
  } else {
    drawRikcat(ctx, player);
  }

  requestAnimationFrame(update);
}

update();

// CONFIG
window.saveConfig = ()=>{
  player.skin = skinSelect.value;
  player.color = colorSelect.value;
  configScreen.style.display = "none";
};
