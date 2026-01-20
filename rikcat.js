// rikcat.js — Rikcat com PNG + camadas + animação

const cache = {};

function load(src){
  if(!cache[src]){
    const img = new Image();
    img.src = src;
    cache[src] = img;
  }
  return cache[src];
}

export function drawRikcat(ctx, p){
  const estado = Math.abs(p.vx) > 0.5 ? "walk" : "idle";

  // animação de andar (sobe e desce levemente)
  let bob = 0;
  let frame = 1;

  if(estado === "walk"){
    frame = Math.floor(Date.now() / 180) % 2 + 1; // 1 ou 2
    bob = frame === 1 ? -2 : 0;
  }

  const baseX = Math.round(p.x);
  const baseY = Math.round(p.y + bob);

  const body = load(`pngs/Rikcat/Rikcat-body-${estado}${estado==="walk" ? frame : ""}.png`);
  const ears = load(`pngs/Rikcat/Rikcat-ears-${estado}${estado==="walk" ? frame : ""}.png`);
  const face = load(`pngs/Rikcat/Rikcat-face-${estado}${estado==="walk" ? frame : ""}.png`);

  ctx.save();
  ctx.translate(baseX, baseY);

  // BODY (cor principal)
  ctx.drawImage(body, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = p.bodyColor || "#ffffff";
  ctx.fillRect(0,0,p.w,p.h);

  ctx.globalCompositeOperation = "source-over";

  // EARS (cor secundária)
  ctx.drawImage(ears, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = p.earsColor || "#ff9fd4";
  ctx.fillRect(0,0,p.w,p.h);

  ctx.globalCompositeOperation = "source-over";

  // FACE (sem cor)
  ctx.drawImage(face, 0, 0);

  ctx.restore();

  // Nick
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.strokeText(p.nick, baseX + p.w/2, baseY - 8);
  ctx.fillText(p.nick, baseX + p.w/2, baseY - 8);
}
