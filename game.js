const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let running = false;

/* ---------- RESIZE ---------- */
function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
window.addEventListener("orientationchange", resize);

/* ---------- START ---------- */
function startGame(){
  document.getElementById("titleScreen").style.display="none";
  document.getElementById("controls").style.display="block";
  canvas.style.display="block";
  resize();
  running = true;
  loop();
}

/* ---------- JOGADOR ---------- */
let player = {
  x:100,
  y:100,
  w:60,
  h:60,
  vx:0,
  vy:0,
  onGround:false
};

/* ---------- MAPA ---------- */
let platforms = [
  {x:0,y:0,w:0,h:0}, // dummy
];

/* ---------- CONTROLES ---------- */
let left=false, right=false;

leftBtn = document.getElementById("left");
rightBtn = document.getElementById("right");
jumpBtn = document.getElementById("jump");

leftBtn.ontouchstart = ()=>left=true;
leftBtn.ontouchend = ()=>left=false;
rightBtn.ontouchstart = ()=>right=true;
rightBtn.ontouchend = ()=>right=false;
jumpBtn.ontouchstart = ()=>{
  if(player.onGround){
    player.vy=-18;
    player.onGround=false;
  }
};

/* ---------- RIKCAT ---------- */
function drawRikcat(x,y,w,h){
  ctx.save();

  const cx = x+w/2;
  const cy = y+h/2;

  ctx.fillStyle="#FFA500";
  ctx.beginPath();
  ctx.arc(cx,cy,w/2,0,Math.PI*2);
  ctx.fill();

  ctx.lineWidth=6;
  ctx.strokeStyle="black";
  ctx.stroke();

  // orelhas
  ctx.beginPath();
  ctx.moveTo(x-5,y+10);
  ctx.lineTo(x+10,y-15);
  ctx.lineTo(x+25,y+10);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x+w-25,y+10);
  ctx.lineTo(x+w-10,y-15);
  ctx.lineTo(x+w+5,y+10);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // olhos
  ctx.lineWidth=5;
  ctx.beginPath();
  ctx.moveTo(cx-10,cy-5);
  ctx.lineTo(cx-10,cy+8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx+10,cy-5);
  ctx.lineTo(cx+10,cy+8);
  ctx.stroke();

  // nariz
  ctx.fillStyle="#FF2EB8";
  ctx.beginPath();
  ctx.moveTo(cx,cy+5);
  ctx.lineTo(cx-6,cy+15);
  ctx.lineTo(cx+6,cy+15);
  ctx.fill();

  ctx.restore();
}

/* ---------- LOOP ---------- */
function loop(){
  if(!running) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  player.vx = 0;
  if(left) player.vx=-5;
  if(right) player.vx=5;

  player.x += player.vx;
  player.vy += 1;
  player.y += player.vy;

  let ground = canvas.height-40;
  if(player.y+player.h>ground){
    player.y=ground-player.h;
    player.vy=0;
    player.onGround=true;
  }

  ctx.fillStyle="#6b3e26";
  ctx.fillRect(0,ground,canvas.width,40);

  drawRikcat(player.x,player.y,player.w,player.h);

  requestAnimationFrame(loop);
}
