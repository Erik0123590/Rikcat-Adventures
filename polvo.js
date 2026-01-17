export function drawPolvo(ctx, player) {
  const x = player.x;
  const y = player.y;
  const color = player.color || "#b84cff";

  // Cabeça
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 18, 0, Math.PI * 2);
  ctx.fill();

  // Olhos
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(x + 14, y + 18, 5, 0, Math.PI * 2);
  ctx.arc(x + 26, y + 18, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "black";
  ctx.beginPath();
  ctx.arc(x + 14, y + 18, 2, 0, Math.PI * 2);
  ctx.arc(x + 26, y + 18, 2, 0, Math.PI * 2);
  ctx.fill();
}
