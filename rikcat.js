// rikcat.js — Desenho do Rikcat (versão visual base)

export function drawRikcat(ctx, x, y) {
  ctx.save();

  // Centraliza
  const cx = x + 20;
  const cy = y + 20;

  ctx.translate(cx, cy);

  // CORES
  const bodyColor = "#FFB000"; // laranja
  const pink = "#FF5FA2";
  const outline = "#000";

  ctx.lineWidth = 2;
  ctx.strokeStyle = outline;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // === ORELHA ESQUERDA ===
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(-8, -18);
  ctx.lineTo(-26, -40);
  ctx.lineTo(-2, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.moveTo(-10, -22);
  ctx.lineTo(-20, -34);
  ctx.lineTo(-6, -28);
  ctx.closePath();
  ctx.fill();

  // === ORELHA DIREITA ===
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(8, -18);
  ctx.lineTo(26, -40);
  ctx.lineTo(2, -28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.moveTo(10, -22);
  ctx.lineTo(20, -34);
  ctx.lineTo(6, -28);
  ctx.closePath();
  ctx.fill();

  // === CORPO ===
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // === OLHOS ===
  ctx.fillStyle = outline;
  ctx.beginPath();
  ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // === NARIZ (triângulo rosa) ===
  ctx.fillStyle = pink;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-3, 5);
  ctx.lineTo(3, 5);
  ctx.closePath();
  ctx.fill();

  // === BOCA ===
  ctx.strokeStyle = outline;
  ctx.beginPath();
  ctx.moveTo(-4, 9);
  ctx.lineTo(4, 9);
  ctx.stroke();

  ctx.restore();
}
