const enemies = [
  { x:400, y:0, w:30, h:30, vx:2, vy:0, onGround:false },
  { x:900, y:0, w:30, h:30, vx:-2, vy:0, onGround:false }
];

function updateEnemies(platforms, players){
  enemies.forEach(e=>{
    e.vy += 0.6;
    e.x += e.vx;
    e.y += e.vy;
    e.onGround = false;

    platforms.forEach(pl=>{
      const py = pl.y();
      if(
        e.x < pl.x+pl.w &&
        e.x+e.w > pl.x &&
        e.y < py+pl.h &&
        e.y+e.h > py &&
        e.vy > 0
      ){
        e.y = py - e.h;
        e.vy = 0;
        e.onGround = true;
      }
    });

    if(e.onGround){
      let support=false;
      platforms.forEach(pl=>{
        if(e.x+e.w/2>pl.x && e.x+e.w/2<pl.x+pl.w && e.y+e.h===pl.y())
          support=true;
      });
      if(!support) e.vx*=-1;
    }

    players.forEach(p=>{
      if(
        p.x < e.x+e.w &&
        p.x+p.w > e.x &&
        p.y < e.y+e.h &&
        p.y+p.h > e.y
      ){
        p.vx = p.x<e.x?-6:6;
        p.vy = -8;
      }
    });

    ctx.fillStyle="red";
    ctx.fillRect(e.x,e.y,e.w,e.h);
  });
}
