// Rikcat.js
export function drawRikcat(ctx, player) {
  const x = player.x;
  const y = player.y;
  const color = player.color || "#FFB000";

  // Corpo
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 20, 0, Math.PI * 2);
  ctx.fill();

  // Orelhas
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x - 5, y - 20);
  ctx.lineTo(x + 15, y);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 35, y);
  ctx.lineTo(x + 45, y - 20);
  ctx.lineTo(x + 25, y);
  ctx.fill();

  // Dentro das orelhas
  ctx.fillStyle = "pink";
  ctx.beginPath();
  ctx.moveTo(x + 8, y);
  ctx.lineTo(x + 2, y - 12);
  ctx.lineTo(x + 14, y);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + 32, y);
  ctx.lineTo(x + 38, y - 12);
  ctx.lineTo(x + 26, y);
  ctx.fill();

  // Olhos
  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(x + 14, y + 20, 3, 0, Math.PI * 2);
  ctx.arc(x + 26, y + 20, 3, 0, Math.PI * 2);
  ctx.fill();

  // Nariz
  ctx.fillStyle = "pink";
  ctx.beginPath();
  ctx.moveTo(x + 20, y + 24);
  ctx.lineTo(x + 17, y + 28);
  ctx.lineTo(x + 23, y + 28);
  ctx.fill();
}
