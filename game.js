import { drawRikcat } from "./rikcat.js";

console.log("GAME.JS CARREGOU");

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = innerWidth;
canvas.height = innerHeight;

/* CONFIG */
const GRAVITY = 0.7;
const JUMP = -14;
const SPEED = 5;
const GROUND = canvas.height - 80;

/* PLAYER */
const player = {
  x:100,
  y:GROUND,
  vx:0,
  vy:0,
  w:40,
  h:40,
  onGround:true,
  facing:1,
  nick:"Convidado",
  skin:"rikcat",
  color:"#FFB000"
};

let playing = false;

/* INPUT */
const keys = {};

addEventListener("keydown",e=>keys[e.key]=true);
addEventListener("keyup",e=>keys[e.key]=false);

function bindBtn(id,key){
  const el = document.getElementById(id);
  el.addEventListener("touchstart",e=>{e.preventDefault();keys[key]=true});
  el.addEventListener("touchend",e=>{e.preventDefault();keys[key]=false});
}
bindBtn("left","ArrowLeft");
bindBtn("right","ArrowRight");
bindBtn("jump"," ");

/* MENU */
window.startSolo = ()=>{
  playing=true;
  document.getElementById("menu").style.display="none";
  document.getElementById("chat").style.display="block";
};
window.startMulti = ()=>startSolo();

/* CONFIG */
window.openConfig = ()=>{
  document.getElementById("configScreen").style.display="flex";
};
window.saveConfig = ()=>{
  player.nick = nickInput.value || player.nick;
  player.skin = skinSelect.value;
  player.color = colorSelect.value;
  configScreen.style.display="none";
};
window.openAdmin = ()=>{
  alert("Sistema ADM será ativado depois");
};

/* LOOP */
function loop(){
  requestAnimationFrame(loop);
  if(!playing) return;

  if(keys["ArrowLeft"]){player.vx=-SPEED;player.facing=-1;}
  else if(keys["ArrowRight"]){player.vx=SPEED;player.facing=1;}
  else player.vx*=0.8;

  if((keys[" "]||keys["ArrowUp"]) && player.onGround){
    player.vy=JUMP;
    player.onGround=false;
  }

  player.vy+=GRAVITY;
  player.x+=player.vx;
  player.y+=player.vy;

  if(player.y>=GROUND){
    player.y=GROUND;
    player.vy=0;
    player.onGround=true;
  }

  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle="#6aa5ff";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  drawRikcat(ctx, player, 0);
}

loop();
