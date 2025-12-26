/* ========= ESTADO DO JOGO ========= */
let gameState = "menu"; // "menu" ou "game"
let multiplayer = false;
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
}

soloBtn.onclick  = ()=>startGame(false);
multiBtn.onclick = ()=>startGame(true);

/* PLAYERS */
const players = [
  {
    name:"Rikcat",
    color:"orange",
    x:80, y:0, w:32, h:32,
    vx:0, vy:0, onGround:false,
    controls:{left:false,right:false,jump:false}
  },
  {
    name:"EduKat",
    color:"purple",
    x:140, y:0, w:32, h:32,
    vx:0, vy:0, onGround:false,
    controls:{left:false,right:false,jump:false}
  }
];
function drawMenu(){
  ctx.fillStyle = "#5c94fc";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle = "white";
  ctx.textAlign = "center";

  ctx.font = "bold 48px Arial";
  ctx.fillText("Rikcat Adventure", canvas.width/2, canvas.height/2 - 120);

  ctx.font = "28px Arial";
  ctx.fillText("Toque para jogar SOLO", canvas.width/2, canvas.height/2 - 20);
  ctx.fillText("Toque com dois dedos para MULTIPLAYER", canvas.width/2, canvas.height/2 + 40);
}
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

/* UPDATE */
function update(){
  
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(gameState === "menu"){
    drawMenu();
    requestAnimationFrame(update);
    return;
  }
  
  /* PLATAFORMAS */
  ctx.fillStyle="#8B4513";
  platforms.forEach(p=>{
    ctx.fillRect(p.x,p.y(),p.w,p.h);
  });

  canvas.addEventListener("touchstart", e=>{
  if(gameState !== "menu") return;

  if(e.touches.length >= 2){
    multiplayer = true;
  }else{
    multiplayer = false;
  }

  gameState = "game";

  // esconde controles do P2 se for solo
  document.querySelectorAll(".leftP2,.rightP2,.jumpP2")
    .forEach(b=>b.style.display = multiplayer ? "block" : "none");
});
  
  /* PLAYERS */
  players.forEach((p,i)=>{
    if(i===1 && !multiplayer) return;

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

    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="black";
    ctx.font="12px sans-serif";
    ctx.textAlign="center";
    ctx.fillText(p.name,p.x+p.w/2,p.y-5);
  });
}
update();
