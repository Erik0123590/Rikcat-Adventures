// rikcat.js — desenho do Rikcat (FO1 estilo)
export function drawRikcat(ctx, p) {
  // p: { x, y, w, h, color, nick }
  const x = Math.round(p.x);
  const y = Math.round(p.y);
  const color = p.color || "#FFB000";
  ctx.save();

  // center for drawing (use top-left x,y as sprite origin)
  const cx = x + 20;
  const cy = y + 20;

  ctx.translate(cx, cy);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#000";

  // Ears (left)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-8, -18); ctx.lineTo(-26, -40); ctx.lineTo(-2, -28); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // inner left ear
  ctx.fillStyle = "#FF5FA2";
  ctx.beginPath();
  ctx.moveTo(-10, -22); ctx.lineTo(-20, -34); ctx.lineTo(-6, -28); ctx.closePath();
  ctx.fill();

  // Ears (right)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(8, -18); ctx.lineTo(26, -40); ctx.lineTo(2, -28); ctx.closePath();
  ctx.fill(); ctx.stroke();

  // inner right ear
  ctx.fillStyle = "#FF5FA2";
  ctx.beginPath();
  ctx.moveTo(10, -22); ctx.lineTo(20, -34); ctx.lineTo(6, -28); ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Eyes
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-6, -4, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Nose (triangle)
  ctx.fillStyle = "#FF5FA2";
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-3, 5); ctx.lineTo(3, 5); ctx.closePath();
  ctx.fill();

  // Mouth
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, 9); ctx.quadraticCurveTo(0, 12, 4, 9);
  ctx.stroke();

  // Nick (draw after restore for readability)
  ctx.restore();
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.strokeStyle = "black"; ctx.lineWidth = 3;
  ctx.strokeText(p.nick || "Player", cx, y - 10);
  ctx.fillText(p.nick || "Player", cx, y - 10);
}
