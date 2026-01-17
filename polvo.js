// polvo.js — desenho simples do polvo (non-pixel)
export function drawPolvo(ctx, p) {
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const color = p.color || "#B84CFF";

  ctx.save();
  const cx = x + 20;
  const cy = y + 20;
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -6, 20, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.stroke();

  // eyes
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-7, -12, 5, 0, Math.PI*2); ctx.arc(7, -12, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(-7, -12, 2, 0, Math.PI*2); ctx.arc(7, -12, 2, 0, Math.PI*2); ctx.fill();

  ctx.restore();

  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Player", cx, y - 10);
}
