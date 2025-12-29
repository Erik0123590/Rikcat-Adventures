// rikcat.js — Rikcat OE5 melhorado (idle, walk bob, stretch ao pular/aterrar)
// export function drawRikcat_update(ctx, p, camX)

export function drawRikcat_update(ctx, p, camX) {
  // ensure internal state on player object
  if (p._rk === undefined) {
    p._rk = {
      t: 0,
      prevOnGround: !!p.onGround,
      landTimer: 0,
      walkCounter: 0
    };
  }
  const s = p._rk;

  // advance time
  s.t += 1;

  // detect landing (transition false -> true)
  if (!s.prevOnGround && !!p.onGround) {
    s.landTimer = 12; // frames of squash
  }
  s.prevOnGround = !!p.onGround;

  // walking / idle detection
  const walking = Math.abs(p.vx || 0) > 0.5 && p.onGround;

  if (walking) s.walkCounter++;
  else s.walkCounter = 0;

  // compute bob for walking / idle
  let bob = 0;
  if (walking) {
    bob = Math.sin(s.walkCounter * 0.18) * 4; // step bob
  } else {
    // slight breathing bob when idle
    bob = Math.sin(s.t * 0.03) * 1.2;
  }

  // compute stretch
  let stretchY = 1;
  let stretchX = 1;
  // jump stretch (when in air) — scale with vertical speed
  if (!p.onGround) {
    const vy = Math.abs(p.vy || 0);
    const t = Math.min(vy / 22, 0.55); // clamp
    stretchY = 1 + t; // 1..~1.55
    stretchX = 1 / stretchY;
  } else if (s.landTimer > 0) {
    // landing squash
    s.landTimer = Math.max(0, s.landTimer - 1);
    const progress = 1 - (s.landTimer / 12); // 0->1
    // squash from 0.72 -> 1.0
    stretchY = 0.72 + 0.28 * progress;
    stretchX = 1 / stretchY;
  }

  // draw center coords
  const cx = (p.x - (camX || 0)) + (p.w / 2 || 16);
  const baseY = p.y + (p.h / 2 || 16) + bob;

  ctx.save();
  // translate to center and apply facing & stretch
  const facing = p.facing === -1 ? -1 : 1;
  ctx.translate(cx, baseY);
  ctx.scale(facing * (stretchX || 1), (stretchY || 1));

  // styles
  const bodyColor = p.color || "#FFB000";
  const outline = "#000";
  const earInner = "#FF2FA3";

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = outline;
  ctx.fillStyle = bodyColor;

  // body (ellipse)
  ctx.beginPath();
  ctx.ellipse(0, 8, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // head
  ctx.beginPath();
  ctx.ellipse(0, -10, 14, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ears (simple shapes, behind the head visually because we draw them first-ish)
  // left ear
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-12, -26);
  ctx.lineTo(-30, -8);
  ctx.lineTo(-8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // left inner
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(-26, -10);
  ctx.lineTo(-12, -12);
  ctx.closePath();
  ctx.fill();

  // right ear
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(12, -26);
  ctx.lineTo(30, -8);
  ctx.lineTo(8, -10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // right inner
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(16, -18);
  ctx.lineTo(26, -10);
  ctx.lineTo(12, -12);
  ctx.closePath();
  ctx.fill();

  // eyes
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-5, -12, 2.0, 0, Math.PI * 2);
  ctx.arc(5, -12, 2.0, 0, Math.PI * 2);
  ctx.fill();

  // nose (pink)
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, -2);
  ctx.lineTo(4, -2);
  ctx.closePath();
  ctx.fill();

  // mouth
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, 0);
  ctx.quadraticCurveTo(0, 4, 4, 0);
  ctx.stroke();

  ctx.restore();

  // nickname above head
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", cx, p.y - 14);
              }
