// rikcat.js — OE5 original + stretch on jump & landing
// Export função drawRikcat(ctx, p, camX)

export function drawRikcat(ctx, p, camX) {
  // centro do desenho baseado na câmera
  const cx = (p.x - (camX || 0)) + (p.w / 2 || 16);
  const baseY = p.y + (p.h / 2 || 16);

  // inicializa estados internos no objeto p (persistem entre frames)
  if (p._prevOnGround === undefined) p._prevOnGround = !!p.onGround;
  if (p._landTimer === undefined) p._landTimer = 0;

  // detectar aterrissagem (transição false -> true)
  if (!p._prevOnGround && !!p.onGround) {
    p._landTimer = 12; // duração da squash em frames
  }
  p._prevOnGround = !!p.onGround;

  // calcular stretch
  let stretchY = 1; // padrão (sem stretch)
  let scaleX = 1;

  // Se estiver no ar -> alongar vertical (jump)
  if (!p.onGround) {
    const vy = Math.abs(p.vy || 0);
    // mais vy -> mais alongamento, limitada
    const t = Math.min(vy / 20, 0.45); // t em [0,0.45]
    stretchY = 1 + t; // entre 1 e ~1.45
    scaleX = 1 / stretchY; // manter aparência proporcional
  }
  // Se aterrissagem: aplicar squash temporário (stretchY < 1)
  else if (p._landTimer > 0) {
    // decrementa timer (faz progressão suave)
    p._landTimer = Math.max(0, p._landTimer - 1);
    const progress = 1 - (p._landTimer / 12); // 0 -> 1 ao longo dos frames
    // squash de início mais forte, depois volta ao normal
    // vamos de 0.72 -> 1.0 (quando progress=0 => 0.72? invert logic)
    // simpler: start squash 0.72 then interpolate to 1.0
    stretchY = 0.72 + 0.28 * progress; // 0.72..1.0
    scaleX = 1 / stretchY;
  } else {
    stretchY = 1;
    scaleX = 1;
  }

  // NOTA: não aplicamos stretch durante caminhadas quando no chão
  // (a lógica acima só aplica stretch quando no ar ou durante landTimer)

  // agora desenhamos tendo em conta facing e stretch
  ctx.save();

  // mover para o centro e aplicar transformação: espelhar pela facing e aplicar escala
  // multiplicamos scaleX por facing para manter espelhamento
  const facing = p.facing === -1 ? -1 : 1;
  ctx.translate(cx, baseY);
  ctx.scale(facing * scaleX, stretchY);

  // estilos
  const bodyColor = p.color || "#FFB000";
  const outline = "#000";
  const earInner = "#FF2FA3";

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = outline;
  ctx.fillStyle = bodyColor;

  // CORPO (ellipse abaixo)
  ctx.beginPath();
  // desenhamos numa coordenada local; corpo centrado ligeiramente abaixo (y = +10)
  ctx.ellipse(0, 10, 20, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // CABEÇA (acima do corpo)
  ctx.beginPath();
  ctx.ellipse(0, -12, 16, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // ORELHAS — desenho simples (usar coordenadas locais)
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = outline;

  // orelha esquerda (local -12, -8 ..)
  ctx.beginPath();
  ctx.moveTo(-12, -8);
  ctx.lineTo(-36, -8);
  ctx.lineTo(-12, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // interior esquerda
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(-20, -12);
  ctx.lineTo(-30, -12);
  ctx.lineTo(-20, -24);
  ctx.closePath();
  ctx.fill();

  // orelha direita
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.moveTo(12, -8);
  ctx.lineTo(36, -8);
  ctx.lineTo(12, -30);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // interior direita
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(20, -12);
  ctx.lineTo(30, -12);
  ctx.lineTo(20, -24);
  ctx.closePath();
  ctx.fill();

  // ROSTO: olhos
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.fillRect(-6, -14, 3, 10); // olho esquerdo
  ctx.fillRect(4, -14, 3, 10);  // olho direito

  // NARIZ
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-4, 0);
  ctx.lineTo(4, 0);
  ctx.closePath();
  ctx.fill();

  // BOCA (garantir stroke por cima)
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, 2);
  ctx.quadraticCurveTo(0, 6, 3, 2);
  ctx.moveTo(-1, 2);
  ctx.quadraticCurveTo(0, 5, 1, 2);
  ctx.stroke();

  ctx.restore();

  // NICK (fora de transform para manter legibilidade)
  ctx.fillStyle = "white";
  ctx.font = "bold 12px Arial";
  ctx.textAlign = "center";
  ctx.fillText(p.nick || "Convidado", cx, baseY - 28);
}
