// rikcat.js — Rikcat Adventures (PNG + camadas + cores)

const IMG_PATH = "./pngs/Rikcat/";
const SIZE = 40; // tamanho FINAL do Rikcat no jogo

const images = {};
const files = [
  "face-idle", "body-idle", "ears-idle",
  "face-walk1", "body-walk1", "ears-walk1",
  "face-walk2", "body-walk2", "ears-walk2"
];

// carregar imagens
files.forEach(name => {
  const img = new Image();
  img.src = `${IMG_PATH}Rikcat-${name}.png`;
  images[name] = img;
});

let walkFrame = 1;
let walkTimer = 0;

export function drawRikcat(ctx, p){
  // detectar estado
  const andando = Math.abs(p.vx || 0) > 0.5;
  let state = "idle";

  if(andando){
    walkTimer++;
    if(walkTimer > 12){
      walkFrame = walkFrame === 1 ? 2 : 1;
      walkTimer = 0;
    }
    state = `walk${walkFrame}`;
  } else {
    walkFrame = 1;
    walkTimer = 0;
  }

  // bounce leve ao andar
  const bounce = andando ? Math.sin(walkTimer * 0.4) * 2 : 0;

  const x = Math.round(p.x);
  const y = Math.round(p.y + bounce);

  ctx.save();
  ctx.translate(x, y);

  // BODY
  drawLayer(ctx, images[`body-${state}`], p.bodyColor);

  // EARS
  drawLayer(ctx, images[`ears-${state}`], p.earsColor);

  // FACE
  drawLayer(ctx, images[`face-${state}`], p.faceColor);

  ctx.restore();

  // Nick
  if(p.nick){
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeText(p.nick, x + SIZE/2, y - 6);
    ctx.fillText(p.nick, x + SIZE/2, y - 6);
  }
}

function drawLayer(ctx, img, color){
  if(!img || !img.complete) return;

  // desenha sprite base
  ctx.drawImage(img, 0, 0, SIZE, SIZE);

  // aplica cor
  if(color){
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.globalCompositeOperation = "source-over";
  }
}
