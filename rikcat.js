// rikcat.js — Drawn Rikcat (idle/walk bob + jump stretch + nick)
export function drawRikcat(ctx, p, camX) {
  if (!p._rk) p._rk = { t:0, prevOnGround:!!p.onGround, landTimer:0, walkCounter:0 };
  const s = p._rk;
  s.t++;

  // landing detection
  if (!s.prevOnGround && !!p.onGround) s.landTimer = 12;
  s.prevOnGround = !!p.onGround;

  const walking = Math.abs(p.vx || 0) > 0.5 && p.onGround;
  if (walking) s.walkCounter++; else s.walkCounter = 0;

  // bob
  let bob = walking ? Math.sin(s.walkCounter * 0.3) * 3 : Math.sin(s.t * 0.05) * 1.2;

  // stretch/squash
  let stretchY = 1, stretchX = 1;
  if (!p.onGround) {
    const t = Math.min(Math.abs(p.vy || 0) / 20, 0.45);
    stretchY = 1 + t;
    stretchX = 1 / stretchY;
  } else if (s.landTimer > 0) {
    s.landTimer = Math.max(0, s.landTimer - 1);
    const prog = 1 - (s.landTimer / 12);
    stretchY = 0.75 + 0.25 * prog;
    stretchX = 1 / stretchY;
  }

  const cx = (p.x - (camX || 0)) + (p.w / 2 || 16);
  const baseY = p.y + (p.h / 2 || 16) - bob;

  ctx.save();
  const facing = p.facing === -1 ? -1 : 1;
  ctx.translate(cx, baseY);
  if (walking) ctx.rotate(0.08 * (p.facing || 1)); // slight tilt
  ctx.scale(facing * stretchX, stretchY);

  const bodyColor = p.color || "#FFB000";
  const inner = "#FF2FA3";
  const outline = "#000";

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = outline;

  // ears (left)
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.moveTo(-14, -18); ctx.lineTo(-30, -38); ctx.lineTo(-6, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(-18, -22); ctx.lineTo(-26, -32); ctx.lineTo(-12, -26); ctx.closePath(); ctx.fill();

  // ears (right)
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.moveTo(14, -18); ctx.lineTo(30, -38); ctx.lineTo(6, -28); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(18, -22); ctx.lineTo(26, -32); ctx.lineTo(12, -26); ctx.closePath(); ctx.fill();

  // body
  ctx.fillStyle = bodyColor;
  ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // eyes
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(-6, -8, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -8, 2.2, 0, Math.PI * 2); ctx.fill();

  // nose
  ctx.fillStyle = inner;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, 4); ctx.lineTo(3, 4); ctx.closePath(); ctx.fill();

  // mouth
  ctx.strokeStyle = outline; ctx.lineWidth = 1.8;
  ctx.beginPath(); ctx.moveTo(-3, 8); ctx.quadraticCurveTo(0, 12, 3, 8); ctx.stroke();

  ctx.restore();

  // nickname
  ctx.fillStyle = "white"; ctx.font = "bold 12px Arial"; ctx.textAlign = "center";
  ctx.strokeStyle = "black"; ctx.lineWidth = 2; ctx.strokeText(p.nick || "Player", cx, p.y - 18);
  ctx.fillText(p.nick || "Player", cx, p.y - 18);
}
