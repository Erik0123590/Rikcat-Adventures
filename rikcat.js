export function drawRikcat(ctx, p, camX) {
  const x = p.x - camX + 16;
  const y = p.y + 16;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(p.facing, 1);

  ctx.fillStyle = p.color || "#FFB000";
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick, x, p.y - 8);
}
