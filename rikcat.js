// rikcat.js
// Desenho e animação do Rikcat (idle + walk)
// Compatível com seu game.js atual

export function drawRikcat(ctx, p, camX) {
  const cx = (p.x - camX) + (p.w / 2 || 16);
  const baseY = p.y + (p.h / 2 || 16);

  const moving = Math.abs(p.vx || 0) > 0.5 && p.onGround;

  if (p._walkCounter === undefined) p._walkCounter = 0;
  if (moving) p._walkCounter++;
  else p._walkCounter = 0;

  const frame = Math.floor(p._walkCounter / 8) % 2;
  const bob = moving ? (frame === 0 ? 4 : -2) : 0;

  const color = p.color || "#FFB000"; // laranja padrão
  const outline = "#000";
  const pink = "#FF2FA3";

  ctx.save();
  ctx.translate(cx, baseY + bob);

  if (moving) ctx.scale(p.facing || 1, 1);

  ctx.lineWidth = 3;
  ctx.strokeStyle = outline;

  /* ===== CORPO ===== */
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 10, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, -10, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  /* ===== ORELHAS ===== */
  ctx.fillStyle = color;

  if (!moving) {
    // idle: orelhas para os lados
    drawEar(-1);
    drawEar(1);
  } else {
    // walk: orelhas inclinadas
    drawEarWalk(-1);
    drawEarWalk(1);
  }

  /* ===== ROSTO ===== */
  ctx.fillStyle = "#000";

  if (moving && frame === 1) {
    ctx.fillRect(-6, -10, 3, 6);
    ctx.fillRect(4, -10, 3, 6);
  } else {
    ctx.fillRect(-6, -14, 3, 10);
    ctx.fillRect(4, -14, 3, 10);
  }

  // nariz
  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.closePath();
  ctx.fill();

  // boca
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (moving) {
    ctx.moveTo(-6, 4);
    ctx.quadraticCurveTo(0, 8, 6, 4);
  } else {
    ctx.moveTo(-3, 2);
    ctx.quadraticCurveTo(0, 6, 3, 2);
    ctx.moveTo(-1, 2);
    ctx.quadraticCurveTo(0, 5, 1, 2);
  }
  ctx.stroke();

  ctx.restore();

  // nick
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", cx, baseY - 28);

  /* ===== FUNÇÕES INTERNAS ===== */
  function drawEar(side) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(12 * side, -8);
    ctx.lineTo(36 * side, -8);
    ctx.lineTo(12 * side, -30);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.moveTo(20 * side, -12);
    ctx.lineTo(30 * side, -12);
    ctx.lineTo(20 * side, -24);
    ctx.closePath();
    ctx.fill();
  }

  function drawEarWalk(side) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(10 * side, -18);
    ctx.lineTo(28 * side, -34);
    ctx.lineTo(6 * side, -36);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = pink;
    ctx.beginPath();
    ctx.moveTo(16 * side, -20);
    ctx.lineTo(24 * side, -32);
    ctx.lineTo(10 * side, -30);
    ctx.closePath();
    ctx.fill();
  }
      }
