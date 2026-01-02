// rikcat.js
export function drawRikcat(ctx, p, camX=0){
  if (!p) return;
  if (p._rk === undefined) {
    p._rk = { t:0, prevOnGround:!!p.onGround, landTimer:0, walkCounter:0 };
  }
  const s = p._rk;
  s.t++;

  if (!s.prevOnGround && !!p.onGround) s.landTimer = 12;
  s.prevOnGround = !!p.onGround;

  const walking = Math.abs(p.vx || 0) > 0.5 && p.onGround;
  if (walking) s.walkCounter++; else s.walkCounter = 0;

  // bob
  let bob = 0;
  if (walking) bob = Math.sin(s.walkCounter * 0.3) * 3;
  else bob = Math.sin(s.t * 0.05) * 1.2;

  // stretch / squash
  let stretchY = 1, stretchX = 1;
  if (!p.onGround) {
    const vy = Math.min(Math.abs(p.vy||0), 20);
    const t = Math.min(vy / 20, 0.45);
    stretchY = 1 + t;
    stretchX = 1 / stretchY;
  } else if (s.landTimer > 0) {
    s.landTimer = Math.max(0, s.landTimer - 1);
    const progress = 1 - (s.landTimer / 12);
    stretchY = 0.8 + 0.2 * progress;
    stretchX = 1 / stretchY;
  }

  // position
  const cx = (p.x - camX) + (p.w/2 || 16);
  const baseY = p.y + (p.h/2 || 16) - bob;

  ctx.save();
  ctx.translate(cx, baseY);
  const facing = p.facing === -1 ? -1 : 1;
  if (walking) ctx.rotate(0.06 * facing);
  ctx.scale(facing * stretchX, stretchY);

  const bodyColor = p.color || "#FFB000";
  const detailColor = "#FF2FA3";
  const outlineColor = "#000";

  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = outlineColor;

  // ears behind
  ctx.fillStyle = bodyColor;
  // left ear
  ctx.beginPath();
  ctx.moveTo(-15, -18); ctx.lineTo(-32, -38); ctx.lineTo(-5, -28); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = detailColor;
  ctx.beginPath(); ctx.moveTo(-18,-22); ctx.lineTo(-26,-32); ctx.lineTo(-12,-26); ctx.closePath(); ctx.fill();

  // right ear
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.moveTo(15,-18); ctx.lineTo(32,-38); ctx.lineTo(5,-28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = detailColor;
  ctx.beginPath(); ctx.moveTo(18,-22); ctx.lineTo(26,-32); ctx.lineTo(12,-26); ctx.closePath(); ctx.fill();

  // body (circle)
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.fill(); ctx.stroke();

  // eyes (vertical lines)
  ctx.fillStyle = outlineColor;
  ctx.beginPath(); ctx.roundRect(-10,-8,4,10,2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(6,-8,4,10,2); ctx.fill();

  // nose (triangle)
  ctx.fillStyle = detailColor;
  ctx.beginPath(); ctx.moveTo(-4,2); ctx.lineTo(4,2); ctx.lineTo(0,7); ctx.closePath(); ctx.fill();

  // mouth
  ctx.beginPath(); ctx.moveTo(0,7); ctx.lineTo(0,10);
  ctx.moveTo(-3,10); ctx.quadraticCurveTo(0,12,3,10);
  ctx.stroke();

  ctx.restore();

  // nickname
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "black"; ctx.lineWidth = 2;
  ctx.strokeText(p.nick || "Player", cx, p.y - 22);
  ctx.fillText(p.nick || "Player", cx, p.y - 22);
}
