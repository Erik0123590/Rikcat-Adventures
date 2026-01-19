/* rikcat.js */
/* Desenha o Rikcat usando PNGs (idle / walk) com leve subida e descida */

const rikcatImgs = {
  idle: new Image(),
  walk1: new Image(),
  walk2: new Image()
};

rikcatImgs.idle.src  = "pngs/Rikcat/Rikcat-idle.png";
rikcatImgs.walk1.src = "pngs/Rikcat/Rikcat-walk1.png";
rikcatImgs.walk2.src = "pngs/Rikcat/Rikcat-walk2.png";

/* controle interno de animação */
let walkFrame = 0;
let walkTimer = 0;

export function drawRikcat(ctx, player){
  const w = player.w;
  const h = player.h;

  let img = rikcatImgs.idle;
  let offsetY = 0;

  const andando = Math.abs(player.vx) > 0.5 && player.onGround;

  if(andando){
    walkTimer++;

    if(walkTimer > 10){
      walkFrame = (walkFrame + 1) % 2;
      walkTimer = 0;
    }

    img = walkFrame === 0
      ? rikcatImgs.walk1
      : rikcatImgs.walk2;

    /* efeito de subir e descer */
    offsetY = Math.sin(Date.now() / 120) * 4;
  } else {
    walkFrame = 0;
    walkTimer = 0;
  }

  ctx.save();

  /* espelhamento */
  if(player.vx < 0){
    ctx.translate(player.x + w, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(img, 0, offsetY, w, h);
  } else {
    ctx.drawImage(img, player.x, player.y + offsetY, w, h);
  }

  ctx.restore();
}
