const enemies = [
  {x:400,y:0,w:30,h:30,vx:1,alive:true},
  {x:700,y:0,w:30,h:30,vx:-1,alive:true}
];

function updateEnemies(platforms){
  enemies.forEach(e=>{
    if(!e.alive) return;

    e.x += e.vx;
    if(Math.random()<0.01) e.vx*=-1;

    platforms.forEach(p=>{
      const py=p.y();
      if(
        e.x < p.x+p.w &&
        e.x+e.w > p.x &&
        e.y+e.h < py+10 &&
        e.y+e.h > py
      ){
        e.y = py-e.h;
      }
    });
  });
}

function drawEnemies(ctx){
  ctx.fillStyle="red";
  enemies.forEach(e=>{
    if(e.alive)
      ctx.fillRect(e.x,e.y,e.w,e.h);
  });
}
