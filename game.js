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

/* ---------- JOGADOR (1.5x MENOR) ---------- */
let player = {
  x:100,
  y:100,
  w:40,   // antes 60
  h:40,   // antes 60
  vx:0,
  vy:0,
  onGround:false
};

/* ---------- MAPA (10 PLATAFORMAS) ---------- */
let platforms = [
  {x:0,   y:0,   w:0,   h:0}, // dummy
  {x:50,  y:400, w:200, h:20},
  {x:300, y:340, w:180, h:20},
  {x:550, y:280, w:200, h:20},
  {x:100, y:220, w:160, h:20},
  {x:380, y:180, w:180, h:20},
  {x:650, y:140, w:160, h:20},
  {x:200, y:120, w:140, h:20},
  {x:500, y:90,  w:160, h:20},
  {x:320, y:60,  w:200, h:20}
];

/* ---------- CONTROLES ---------- */
let left=false, right=false;

document.getElementById("left").ontouchstart  = ()=>left=true;
document.getElementById("left").ontouchend    = ()=>left=false;
document.getElementById("right").ontouchstart = ()=>right=true;
document.getElementById("right").ontouchend   = ()=>right=false;

document.getElementById("jump").ontouchstart = ()=>{
  if(player.onGround){
    player.vy=-16;
    player.onGround=false;
  }
};

/* ---------- RIKCAT ---------- */
function drawRikcat(x,y,w,h){
  ctx.save();

  const cx = x+w/2;
  const cy = y+h/2;

  // cabeça
  ctx.fillStyle="#FFA500";
  ctx.beginPath();
  ctx.arc(cx,cy,w/2,0,Math.PI*2);
  ctx.fill();
  ctx.lineWidth=4;
  ctx.strokeStyle="black";
  ctx.stroke();

  // orelhas
  ctx.beginPath();
  ctx.moveTo(x-4,y+8);
  ctx.lineTo(x+8,y-10);
  ctx.lineTo(x+20,y+8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x+w-20,y+8);
  ctx.lineTo(x+w-8,y-10);
  ctx.lineTo(x+w+4,y+8);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // olhos
  ctx.lineWidth=4;
  ctx.beginPath();
  ctx.moveTo(cx-7,cy-4);
  ctx.lineTo(cx-7,cy+6);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx+7,cy-4);
  ctx.lineTo(cx+7,cy+6);
  ctx.stroke();

  // nariz
  ctx.fillStyle="#FF2EB8";
  ctx.beginPath();
  ctx.moveTo(cx,cy+4);
  ctx.lineTo(cx-5,cy+12);
  ctx.lineTo(cx+5,cy+12);
  ctx.fill();

  ctx.restore();
}

/* ---------- COLISÃO COM PLATAFORMAS ---------- */
function checkPlatforms(){
  player.onGround = false;

  for(let p of platforms){
    if(
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h <= p.y + 10 &&
      player.y + player.h + player.vy >= p.y
    ){
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }
}

/* ---------- LOOP ---------- */
function loop(){
  if(!running) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  // movimento
  player.vx = 0;
  if(left)  player.vx=-4;
  if(right) player.vx=4;

  player.x += player.vx;
  player.vy += 1;
  player.y += player.vy;

  // chão
  let ground = canvas.height-40;
  if(player.y+player.h>ground){
    player.y=ground-player.h;
    player.vy=0;
    player.onGround=true;
  }

  checkPlatforms();

  // desenha chão
  ctx.fillStyle="#6b3e26";
  ctx.fillRect(0,ground,canvas.width,40);

  // desenha plataformas
  ctx.fillStyle="#8b5a2b";
  for(let p of platforms){
    ctx.fillRect(p.x,p.y,p.w,p.h);
  }

  // desenha Rikcat
  drawRikcat(player.x,player.y,player.w,player.h);

  requestAnimationFrame(loop);
}
