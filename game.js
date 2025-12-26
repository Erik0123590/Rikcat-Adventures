const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const titleScreen = document.getElementById("titleScreen");
const soloBtn = document.getElementById("soloBtn");
const multiBtn = document.getElementById("multiBtn");
const gameDiv = document.getElementById("game");
const rotate = document.getElementById("rotate");

const buttons = id=>document.getElementById(id);

const controls = [
  {left:buttons("left"),right:buttons("right"),jump:buttons("jump"),attack:buttons("attack")},
  {left:buttons("left2"),right:buttons("right2"),jump:buttons("jump2"),attack:buttons("attack2")}
];

let multiplayer=false, playing=false;

function resize(){
  canvas.width=innerWidth;
  canvas.height=innerHeight;
}
addEventListener("resize",resize);
resize();

function checkOrientation(){
  rotate.style.display = innerHeight>innerWidth ? "flex":"none";
  playing = innerWidth>innerHeight;
}
addEventListener("resize",checkOrientation);
checkOrientation();

soloBtn.onclick=()=>start(false);
multiBtn.onclick=()=>start(true);

function start(multi){
  multiplayer=multi;
  titleScreen.style.display="none";
  gameDiv.style.display="block";
  playing=true;
}

const players=[
  {name:"Rikcat",color:"orange",x:80,y:0,w:32,h:32,vx:0,vy:0,onGround:false,life:5,inv:0,controls:{}},
  {name:"EduKat",color:"purple",x:140,y:0,w:32,h:32,vx:0,vy:0,onGround:false,life:5,inv:0,controls:{}}
];

controls.forEach((c,i)=>{
  c.left.ontouchstart=()=>players[i].controls.left=true;
  c.left.ontouchend=()=>players[i].controls.left=false;
  c.right.ontouchstart=()=>players[i].controls.right=true;
  c.right.ontouchend=()=>players[i].controls.right=false;
  c.jump.ontouchstart=()=>players[i].controls.jump=true;
  c.jump.ontouchend=()=>players[i].controls.jump=false;
  c.attack.ontouchstart=()=>players[i].controls.attack=true;
  c.attack.ontouchend=()=>players[i].controls.attack=false;
});

const platforms=[
  {x:0,y:()=>canvas.height-40,w:3000,h:40},
  {x:300,y:()=>canvas.height-120,w:140,h:20},
  {x:600,y:()=>canvas.height-200,w:140,h:20},
  {x:900,y:()=>canvas.height-280,w:140,h:20}
];

function update(){
  requestAnimationFrame(update);
  if(!playing) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.fillStyle="#8B4513";
  platforms.forEach(p=>ctx.fillRect(p.x,p.y(),p.w,p.h));

  updateEnemies(platforms);
  drawEnemies(ctx);

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
      if(p.x<p.x+pl.w && p.x+p.w>pl.x && p.y+p.h>py && p.vy>0){
        p.y=py-p.h;
        p.vy=0;
        p.onGround=true;
      }
    });

    enemies.forEach(e=>{
      if(!e.alive) return;

      const hit = p.x<p.x+e.w && p.x+p.w>e.x && p.y<p.y+e.h && p.y+p.h>e.y;

      if(hit){
        if(p.controls.attack){
          e.alive=false;
        }else if(p.inv<=0){
          p.life--;
          p.inv=60;
          if(p.life<=0){
            p.life=5;
            p.x=80;
            p.y=0;
          }
        }
      }
    });

    if(p.inv>0) p.inv--;

    ctx.fillStyle=p.color;
    ctx.beginPath();
    ctx.arc(p.x+p.w/2,p.y+p.h/2,p.w/2,0,Math.PI*2);
    ctx.fill();

    ctx.fillStyle="white";
    ctx.fillText(p.name+" ❤"+p.life,p.x,p.y-5);
  });
}
update();
