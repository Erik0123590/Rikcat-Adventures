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

/* EMOTES */
const emoteBtn  = document.getElementById("emoteBtn");
const emoteMenu = document.getElementById("emoteMenu");

let gameStarted=false, playing=false, multiplayer=false;

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
  multiplayer=isMulti;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  gameStarted=true;
  playing=true;

  left2.style.display =
  right2.style.display =
  jump2.style.display = multiplayer ? "block" : "none";
}

soloBtn.onclick = ()=>startGame(false);
multiBtn.onclick= ()=>startGame(true);

/* PLAYERS */
const players = [
  {
    name:"Rikcat",
    color:"orange",
    x:80,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    controls:{left:false,right:false,jump:false},
    emote:null, emoteTimer:0
  },
  {
    name:"EduKat",
    color:"purple",
    x:140,y:0,w:32,h:32,
    vx:0,vy:0,onGround:false,
    controls:{left:false,right:false,jump:false},
    emote:null, emoteTimer:0
  }
];

/* CONTROLES */
left.ontouchstart=()=>players[0].controls.left=true;
left.ontouchend  =()=>players[0].controls.left=false;
right.ontouchstart=()=>players[0].controls.right=true;
right.ontouchend  =()=>players[0].controls.right=false;
jump.ontouchstart=()=>players[0].controls.jump=true;
jump.ontouchend  =()=>players[0].controls.jump=false;

left2.ontouchstart=()=>players[1].controls.left=true;
left2.ontouchend  =()=>players[1].controls.left=false;
right2.ontouchstart=()=>players[1].controls.right=true;
right2.ontouchend  =()=>players[1].controls.right=false;
jump2.ontouchstart=()=>players[1].controls.jump=true;
jump2.ontouchend  =()=>players[1].controls.jump=false;

/* EMOTES */
emoteBtn.onclick=()=>{
  emoteMenu.style.display =
    emoteMenu.style.display==="block"?"none":"block";
};

document.querySelectorAll(".emote").forEach(btn=>{
  btn.onclick=()=>{
    players[0].emote = btn.textContent;
    players[0].emoteTimer = 120;
    emoteMenu.style.display="none";
    // aqui você pode enviar pro Firebase depois
  };
});

/* MAPA */
const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:200,y:()=>canvas.height-120,w:140,h:20},
  {x:420,y:()=>canvas.height-200,w:140,h:20},
];

/* UPDATE */
function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="#8B4513";
  platforms.forEach(p=>ctx.fillRect(p.x,p.y(),p.w,p.h));

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
        p.x<p.x+pl.w &&
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

    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
    ctx.fill();

    // NOME
    ctx.fillStyle="black";
    ctx.font="12px sans-serif";
    ctx.textAlign="center";
    ctx.fillText(p.name,p.x+p.w/2,p.y-5);

    // EMOTE
    if(p.emote){
      ctx.font="24px serif";
      ctx.fillText(p.emote,p.x+p.w/2,p.y-20);
      p.emoteTimer--;
      if(p.emoteTimer<=0) p.emote=null;
    }
  });
}
update();
