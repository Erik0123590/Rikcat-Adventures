// rikcat.js — OE5 original + stretch on jump & landing
export function drawRikcat(ctx, p, camX) {
  const cx = (p.x - (camX || 0)) + (p.w / 2 || 16);
  const baseY = p.y + (p.h / 2 || 16);

  if (p._prevOnGround === undefined) p._prevOnGround = !!p.onGround;
  if (p._landTimer === undefined) p._landTimer = 0;

  if (!p._prevOnGround && !!p.onGround) {
    p._landTimer = 12;
  }
  p._prevOnGround = !!p.onGround;

  let stretchY = 1;
  let scaleX = 1;

  if (!p.onGround) {
    const vy = Math.abs(p.vy || 0);
    const t = Math.min(vy / 20, 0.45);
    stretchY = 1 + t;
    scaleX = 1 / stretchY;
  } else if (p._landTimer > 0) {
    p._landTimer = Math.max(0, p._landTimer - 1);
    const progress = 1 - (p._landTimer / 12);
    stretchY = 0.72 + 0.28 * progress;
    scaleX = 1 / stretchY;
  } else {
    stretchY = 1;
    scaleX = 1;
  }

  ctx.save();
  const facing = p.facing === -1 ? -1 : 1;
  ctx.translate(cx, baseY);
  ctx.scale(facing * scaleX, stretchY);

  const bodyColor = p.color || "#FFB000";
  const outline = "#000";
  const earInner = "#FF2FA3";

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = outline;
  ctx.fillStyle = bodyColor;

  ctx.beginPath();
  ctx.ellipse(0, 10, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -12, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;

  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(-36, -8);
  ctx.lineTo(-12, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-20, -24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(12, -8);
  ctx.lineTo(36, -8);
  ctx.lineTo(12, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(20, -12);
  ctx.lineTo(30, -12);
  ctx.lineTo(20, -24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.fillRect(-6, -14, 3, 10);
  ctx.fillRect(4, -14, 3, 10);

  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 2);
  ctx.quadraticCurveTo(0, 6, 3, 2);
  ctx.moveTo(-1, 2);
  ctx.quadraticCurveTo(0, 5, 1, 2);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", cx, baseY - 28);
}
