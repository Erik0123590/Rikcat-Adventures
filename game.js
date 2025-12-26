const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

/* BOTÕES */
const left  = document.getElementById("left");
const right = document.getElementById("right");
const jump  = document.getElementById("jump");

const left2  = document.getElementById("left2");
const right2 = document.getElementById("right2");
const jump2  = document.getElementById("jump2");

let gameStarted = false;
let playing = false;
let multiplayer = false;

/* RESIZE */
function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resize);
resize();

/* ORIENTAÇÃO */
function checkOrientation(){
  const portrait = innerHeight > innerWidth;
  rotate.style.display = portrait ? "flex" : "none";
  playing = !portrait && gameStarted;
}
addEventListener("resize", checkOrientation);
checkOrientation();

/* START */
function startGame(isMulti){
  multiplayer = isMulti;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  gameStarted = true;
  playing = true;

  left2.style.display =
  right2.style.display =
  jump2.style.display = multiplayer ? "block" : "none";

  resetGame();
}

soloBtn.onclick  = ()=>startGame(false);
multiBtn.onclick = ()=>startGame(true);

/* PLAYERS */
const players = [
  {
    name:"Rikcat",
    color:"orange",
    x:80, y:0, w:32, h:32,
    vx:0, vy:0,
    onGround:false,
    lives:3,
    invincible:0,
    controls:{left:false,right:false,jump:false}
  },
  {
    name:"EduKat",
    color:"purple",
    x:140, y:0, w:32, h:32,
    vx:0, vy:0,
    onGround:false,
    lives:3,
    invincible:0,
    controls:{left:false,right:false,jump:false}
  }
];

/* CONTROLES */
left.ontouchstart = ()=>players[0].controls.left=true;
left.ontouchend   = ()=>players[0].controls.left=false;
right.ontouchstart= ()=>players[0].controls.right=true;
right.ontouchend  = ()=>players[0].controls.right=false;
jump.ontouchstart = ()=>players[0].controls.jump=true;
jump.ontouchend   = ()=>players[0].controls.jump=false;

left2.ontouchstart = ()=>players[1].controls.left=true;
left2.ontouchend   = ()=>players[1].controls.left=false;
right2.ontouchstart= ()=>players[1].controls.right=true;
right2.ontouchend  = ()=>players[1].controls.right=false;
jump2.ontouchstart = ()=>players[1].controls.jump=true;
jump2.ontouchend   = ()=>players[1].controls.jump=false;

/* MAPA */
const platforms = [
  {x:0,   y:()=>canvas.height-40, w:3000, h:40},
  {x:200, y:()=>canvas.height-120, w:140, h:20},
  {x:420, y:()=>canvas.height-200, w:140, h:20},
  {x:650, y:()=>canvas.height-260, w:140, h:20},
  {x:900, y:()=>canvas.height-320, w:140, h:20},
];

/* INIMIGOS */
let enemies = [];

function resetGame(){
  players.forEach(p=>{
    p.x = 80;
    p.y = 0;
    p.vx = 0;
    p.vy = 0;
    p.lives = 3;
    p.invincible = 0;
  });

  enemies = [
    {x:300, y:0, w:30, h:30, vx:1.5, alive:true},
    {x:600, y:0, w:30, h:30, vx:-1.5, alive:true},
    {x:950, y:0, w:30, h:30, vx:1.5, alive:true}
  ];
}

/* UPDATE */
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

    e.x += e.vx;

    if(e.x < 0 || e.x + e.w > 3000){
      e.vx *= -1;
    }

    // gravidade inimigo
    e.y += 4;
    platforms.forEach(pl=>{
      const py = pl.y();
      if(
        e.x < pl.x+pl.w &&
        e.x+e.w > pl.x &&
        e.y < py+pl.h &&
        e.y+e.h > py
      ){
        e.y = py - e.h;
      }
    });

    ctx.fillStyle="red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
  });

  /* PLAYERS */
  players.forEach((p,i)=>{
    if(i===1 && !multiplayer) return;

    if(p.invincible > 0) p.invincible--;

    p.vx=0;
    if(p.controls.left) p.vx=-4;
    if(p.controls.right) p.vx=4;

    if(p.controls.jump && p.onGround){
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
        p.x < pl.x+pl.w &&
        p.x+p.w > pl.x &&
        p.y < py+pl.h &&
        p.y+p.h > py &&
        p.vy>0
      ){
        p.y = py-p.h;
        p.vy=0;
        p.onGround=true;
      }
    });

    /* COLISÃO COM INIMIGOS */
    enemies.forEach(e=>{
      if(!e.alive) return;

      const hit =
        p.x < e.x+e.w &&
        p.x+p.w > e.x &&
        p.y < e.y+e.h &&
        p.y+p.h > e.y;

      if(hit){
        // pulou em cima
        if(p.vy > 0 && p.y + p.h - e.y < 15){
          e.alive = false;
          p.vy = -8;
        }
        // dano
        else if(p.invincible === 0){
          p.lives--;
          p.invincible = 60;
          p.vy = -8;
          p.x -= 20;

          if(p.lives <= 0){
            playing = false;
            titleScreen.style.display="flex";
            gameDiv.style.display="none";
          }
        }
      }
    });

    /* DESENHO PLAYER */
    if(p.invincible % 10 < 5){
      ctx.fillStyle=p.color;
      ctx.beginPath();
      ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
      ctx.fill();
    }

    ctx.fillStyle="black";
    ctx.font="12px sans-serif";
    ctx.textAlign="center";
    ctx.fillText(`${p.name} ❤️ ${p.lives}`,p.x+p.w/2,p.y-8);
  });
}
update();
