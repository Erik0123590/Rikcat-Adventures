const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

/* ========= MAPA ========= */
const platforms = [
  { x:0, y:()=>canvas.height-40, w:2000, h:40 },
  { x:200, y:()=>canvas.height-140, w:200, h:20 },
  { x:500, y:()=>canvas.height-220, w:200, h:20 },
  { x:800, y:()=>canvas.height-300, w:200, h:20 },
  { x:1100, y:()=>canvas.height-220, w:200, h:20 },
  { x:1400, y:()=>canvas.height-140, w:200, h:20 }
];

/* ========= PLAYERS ========= */
const players = [
  { x:100, y:0, w:40, h:40, vx:0, vy:0, color:"#FFA500", onGround:false, left:false, right:false },
  { x:200, y:0, w:40, h:40, vx:0, vy:0, color:"#8A2BE2", onGround:false, left:false, right:false }
];

/* ========= CONTROLES ========= */
function bind(btn, prop, player, val){
  btn.ontouchstart = ()=>player[prop]=val;
  btn.ontouchend = ()=>player[prop]=false;
}
bind(p1_left,"left",players[0],true);
bind(p1_right,"right",players[0],true);
bind(p1_jump,"jump",players[0],true);

bind(p2_left,"left",players[1],true);
bind(p2_right,"right",players[1],true);
bind(p2_jump,"jump",players[1],true);

/* ========= DESENHO DO RIKCAT ========= */
function drawRikcat(p){
  const cx = p.x+p.w/2, cy = p.y+p.h/2;
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(cx,cy,p.w/2,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle="black";
  ctx.lineWidth=4;
  ctx.stroke();
}

/* ========= LOOP ========= */
function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // mapa
  ctx.fillStyle="#6b3e26";
  platforms.forEach(pl=>{
    ctx.fillRect(pl.x,pl.y(),pl.w,pl.h);
  });

  // players
  players.forEach(p=>{
    p.vy += 0.6;
    p.vx = p.left?-4:p.right?4:0;

    if(p.jump && p.onGround){
      p.vy = -14;
      p.onGround = false;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.onGround = false;

    platforms.forEach(pl=>{
      const py = pl.y();
      if(
        p.x < pl.x+pl.w &&
        p.x+p.w > pl.x &&
        p.y < py+pl.h &&
        p.y+p.h > py &&
        p.vy > 0
      ){
        p.y = py - p.h;
        p.vy = 0;
        p.onGround = true;
      }
    });

    drawRikcat(p);
  });

  // inimigos
  updateEnemies(platforms, players);

  requestAnimationFrame(update);
}
update();
