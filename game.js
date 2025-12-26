/* ================== CANVAS ================== */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

/* ================== TELAS ================== */
const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* ================== BOTÕES ================== */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const jump  = document.getElementById("jump");
const attack = document.getElementById("attack");

const left2  = document.getElementById("left2");
const right2 = document.getElementById("right2");
const jump2  = document.getElementById("jump2");
const attack2 = document.getElementById("attack2");

let gameStarted=false;
let playing=false;
let multiplayer=false;

/* ================== RESIZE ================== */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ================== ORIENTAÇÃO ================== */
function checkOrientation(){
  const portrait = innerHeight > innerWidth;
  rotate.style.display = portrait ? "flex" : "none";
  playing = !portrait && gameStarted;
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* ================== START ================== */
function startGame(isMulti){
  multiplayer = isMulti;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  gameStarted=true;
  playing=true;

  left2.style.display =
  right2.style.display =
  jump2.style.display =
  attack2.style.display = multiplayer ? "block" : "none";
}

soloBtn.onclick  = ()=>startGame(false);
multiBtn.onclick = ()=>startGame(true);

/* ================== PLAYERS ================== */
const players = [
  {
    name:"Rikcat",
    color:"orange",
    x:80,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    facing:1,
    attackCooldown:0,
    invincible:0,
    controls:{left:false,right:false,jump:false,attack:false}
  },
  {
    name:"EduKat",
    color:"purple",
    x:140,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    facing:1,
    attackCooldown:0,
    invincible:0,
    controls:{left:false,right:false,jump:false,attack:false}
  }
];

/* ================== CONTROLES ================== */
left.ontouchstart = ()=>players[0].controls.left=true;
left.ontouchend   = ()=>players[0].controls.left=false;
right.ontouchstart= ()=>players[0].controls.right=true;
right.ontouchend  = ()=>players[0].controls.right=false;
jump.ontouchstart = ()=>players[0].controls.jump=true;
jump.ontouchend   = ()=>players[0].controls.jump=false;
attack.ontouchstart=()=>players[0].controls.attack=true;
attack.ontouchend  =()=>players[0].controls.attack=false;

left2.ontouchstart = ()=>players[1].controls.left=true;
left2.ontouchend   = ()=>players[1].controls.left=false;
right2.ontouchstart= ()=>players[1].controls.right=true;
right2.ontouchend  = ()=>players[1].controls.right=false;
jump2.ontouchstart = ()=>players[1].controls.jump=true;
jump2.ontouchend   = ()=>players[1].controls.jump=false;
attack2.ontouchstart=()=>players[1].controls.attack=true;
attack2.ontouchend  =()=>players[1].controls.attack=false;

/* ================== MAPA ================== */
const platforms = [
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
  {x:650,y:()=>canvas.height-260,w:140,h:20},
  {x:900,y:()=>canvas.height-320,w:140,h:20}
];

/* ================== INIMIGOS ================== */
const enemies = [
  {x:400,y:0,w:26,h:26,vx:1.2,vy:0,onGround:false,alive:true},
  {x:700,y:0,w:26,h:26,vx:-1.2,vy:0,onGround:false,alive:true},
  {x:1000,y:0,w:26,h:26,vx:1.4,vy:0,onGround:false,alive:true}
];

/* ================== UPDATE ================== */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  /* PLATAFORMAS */
  ctx.fillStyle="#8B4513";
  platforms.forEach(p=>{
    ctx.fillRect(p.x,p.y(),p.w,p.h);
  });

  /* INIMIGOS */
  enemies.forEach(e=>{
    if(!e.alive) return;

    e.x+=e.vx;
    e.vy+=0.6;
    e.y+=e.vy;
    e.onGround=false;

    platforms.forEach(pl=>{
      const py=pl.y();
      if(
        e.x<pl.x+pl.w &&
        e.x+e.w>pl.x &&
        e.y<py+pl.h &&
        e.y+e.h>py &&
        e.vy>0
      ){
        e.y=py-e.h;
        e.vy=0;
        e.onGround=true;
      }
    });

    if(e.x<0||e.x+e.w>3000) e.vx*=-1;

    ctx.fillStyle="red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
  });

  /* PLAYERS */
  players.forEach((p,i)=>{
    if(i===1&&!multiplayer) return;

    p.vx=0;
    if(p.controls.left) p.vx=-4;
    if(p.controls.right) p.vx=4;
    if(p.vx!==0) p.facing=Math.sign(p.vx);

    if(p.controls.jump&&p.onGround){
      p.vy=-12;
      p.onGround=false;
    }

    p.vy+=0.6;
    p.x+=p.vx;
    p.y+=p.vy;

    p.onGround=false;
    platforms.forEach(pl=>{
      const py=pl.y();
      if(
        p.x<pl.x+pl.w &&
        p.x+p.w>pl.x &&
        p.y<py+pl.h &&
        p.y+p.h>py &&
        p.vy>0
      ){
        p.y=py-p.h;
        p.vy=0;
        p.onGround=true;
      }
    });

    /* ATAQUE */
    if(p.attackCooldown>0) p.attackCooldown--;
    if(p.controls.attack && p.attackCooldown===0){
      p.attackCooldown=25;
      const hit={
        x:p.facing>0?p.x+p.w:p.x-20,
        y:p.y+8,w:20,h:p.h-16
      };
      ctx.fillStyle="white";
      ctx.fillRect(hit.x,hit.y,hit.w,hit.h);

      enemies.forEach(e=>{
        if(!e.alive) return;
        if(
          hit.x<e.x+e.w &&
          hit.x+hit.w>e.x &&
          hit.y<e.y+e.h &&
          hit.y+hit.h>e.y
        ){
          e.alive=false;
        }
      });
    }

    /* DANO */
    if(p.invincible>0) p.invincible--;
    enemies.forEach(e=>{
      if(!e.alive||p.invincible>0) return;
      if(
        p.x<e.x+e.w &&
        p.x+p.w>e.x &&
        p.y<e.y+e.h &&
        p.y+p.h>e.y
      ){
        p.invincible=60;
        p.vy=-8;
      }
    });

    /* DESENHO */
    if(p.invincible%10<5){
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle="black";
    ctx.font="12px sans-serif";
    ctx.textAlign="center";
    ctx.fillText(p.name,p.x+p.w/2,p.y-5);
  });
}
update();
