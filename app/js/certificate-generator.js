/**
 * Manitas · Proyecto EXIS
 * certificate-generator.js - Generador local de Certificados de Dactilología LSC en Canvas (POO ES6)
 */

const LSC_ALPHABET_24 = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Z'
];

class CertificateGenerator {
  #initialized = false;
  #width = 1400;
  #height = 920;
  #lastDataUrl = null;
  #lastPayload = null;
  #assets = { logo: null, mascot: null, loaded: false };

  init() {
    if (this.#initialized) return this;
    this.#initialized = true;
    return this;
  }

  start() {
    return this.init();
  }

  update(options = {}) {
    if (!this.#initialized) this.init();
    this.#lastPayload = this.buildPayload(options);
    return this.#lastPayload;
  }

  reset() {
    this.#lastDataUrl = null;
    this.#lastPayload = null;
  }

  destroy() {
    this.reset();
    this.#assets = { logo: null, mascot: null, loaded: false };
    this.#initialized = false;
  }

  getLastResult() {
    return {
      dataUrl: this.#lastDataUrl,
      payload: this.#lastPayload ? { ...this.#lastPayload } : null
    };
  }

  buildPayload(options = {}) {
    const profile = (
      typeof window !== 'undefined' &&
      window.AuthProfileManager &&
      typeof window.AuthProfileManager.getCurrentProfile === 'function'
    )
      ? window.AuthProfileManager.getCurrentProfile()
      : null;

    const rawName = options.studentName || (profile && profile.name) || 'Estudiante LSC';
    const studentName = this.#cleanText(rawName, 'Estudiante LSC', 46);
    const title = this.#cleanText(options.title, 'Certificado del Abecedario LSC', 52);
    const subtitle = this.#cleanText(
      options.subtitle,
      'Por completar el aprendizaje práctico de las 24 letras en Lengua de Señas Colombiana',
      130
    );
    const badgeLabel = this.#cleanText(options.badgeLabel, '24 LETRAS · LSC70', 28);
    const highlightWord = options.highlightWord
      ? this.#cleanText(options.highlightWord, '', 32).toUpperCase()
      : '';
    const accuracyLabel = options.accuracyLabel
      ? this.#cleanText(options.accuracyLabel, '', 40)
      : '';

    const letters = Array.isArray(options.letters) && options.letters.length > 0
      ? options.letters.map(ch => String(ch).trim().toUpperCase()).filter(Boolean).slice(0, 24)
      : [...LSC_ALPHABET_24];

    const now = options.date instanceof Date ? options.date : new Date();
    const dateLabel = this.#cleanText(options.dateLabel, this.#formatDateLabel(now), 40);
    const code = this.#cleanText(options.code, this.#buildVerificationCode(now, studentName, title), 28);
    const slugSource = options.slug || `${studentName}-${title}`;
    const filename = `manitas-abecedario-${this.#slugify(slugSource)}.png`;

    return {
      studentName,
      title,
      subtitle,
      badgeLabel,
      highlightWord,
      accuracyLabel,
      letters,
      dateLabel,
      code,
      filename
    };
  }

  async generateDataUrl(options = {}) {
    if (!this.#initialized) this.init();
    if (typeof document === 'undefined') {
      throw new Error('CertificateGenerator requires a browser document to render Canvas.');
    }
    const payload = this.buildPayload(options);
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch (e) {}
    }
    const assets = await this.#loadBrandAssets();

    const canvas = document.createElement('canvas');
    canvas.width = this.#width;
    canvas.height = this.#height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2D canvas context available.');
    }

    this.#paintDiploma(ctx, payload, assets);
    const dataUrl = canvas.toDataURL('image/png');
    this.#lastPayload = payload;
    this.#lastDataUrl = dataUrl;
    return dataUrl;
  }

  async downloadCertificate(options = {}) {
    const payload = this.buildPayload(options);
    if (typeof document === 'undefined') {
      return { ok: false, filename: payload.filename, payload };
    }
    const dataUrl = await this.generateDataUrl({ ...options, dateLabel: payload.dateLabel, code: payload.code });
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = payload.filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { ok: true, filename: payload.filename, payload, dataUrl };
  }

  async #loadBrandAssets() {
    if (this.#assets.loaded) return this.#assets;
    const loadImg = (src) => new Promise((resolve) => {
      if (typeof Image === 'undefined') return resolve(null);
      const img = new Image();
      img.onload = () => resolve(img.naturalWidth > 0 ? img : null);
      img.onerror = () => resolve(null);
      img.src = src;
    });
    const [logo, mascot] = await Promise.all([
      loadImg('img/manitas-simbolo.svg'),
      loadImg('img/zorrito/svg/zorrito_celebracion.svg')
    ]);
    this.#assets = { logo, mascot, loaded: true };
    return this.#assets;
  }

  #paintDiploma(ctx, payload, assets) {
    const w = this.#width;
    const h = this.#height;

    // 1. Marco exterior oscuro editorial (#0F172A)
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(0, 0, w, h);

    // 2. Bisel metálico dorado exterior
    const goldGrad = ctx.createLinearGradient(0, 0, w, h);
    goldGrad.addColorStop(0, '#B45309');
    goldGrad.addColorStop(0.35, '#F59E0B');
    goldGrad.addColorStop(0.65, '#FDE68A');
    goldGrad.addColorStop(1, '#D97706');
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    // 3. Superficie pergamino cálido diagonal (#FDFBF7 -> #F5EFE4)
    const paperGrad = ctx.createLinearGradient(32, 32, w - 32, h - 32);
    paperGrad.addColorStop(0, '#FDFBF7');
    paperGrad.addColorStop(1, '#F5EFE4');
    ctx.fillStyle = paperGrad;
    ctx.fillRect(34, 34, w - 68, h - 68);

    // 4. Sello de agua geométrico guilloché en zona editorial
    const contentLeft = 324;
    const contentRight = w - 34;
    const centerX = (contentLeft + contentRight) / 2;
    this.#drawGuillocheWatermark(ctx, centerX, 455);

    // 5. Franja arquitectónica izquierda (Petrol profundo + filete oro)
    this.#drawLeftBrandRibbon(ctx, h, goldGrad, assets);

    // 6. Marco fino interior en zona derecha
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(contentLeft + 24, 54, (contentRight - contentLeft) - 48, h - 108);
    this.#drawCornerFlourishes(ctx, contentLeft + 34, 64, contentRight - 34, h - 64);

    // 7. Encabezado institucional y título serif
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0E7490';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText('CONSTANCIA DE DACTILOLOGÍA · LENGUA DE SEÑAS COLOMBIANA', centerX, 114);

    ctx.fillStyle = '#0F172A';
    ctx.font = '700 44px Georgia, "Times New Roman", serif';
    ctx.fillText(payload.title, centerX, 174);

    // Ornamento dorado con rombo central
    this.#drawDiamondDivider(ctx, centerX, 222, 160, goldGrad);

    // Lead-in y nombre protagonista
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 19px Georgia, "Times New Roman", serif';
    ctx.fillText('Se otorga con orgullo a', centerX, 268);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 56px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText(payload.studentName, centerX, 332);

    ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 240, 372);
    ctx.lineTo(centerX + 240, 372);
    ctx.stroke();

    // Subtítulo descriptivo con ajuste limpio de líneas
    ctx.fillStyle = '#334155';
    ctx.font = '500 18px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    const nextY = this.#drawWrappedText(ctx, payload.subtitle, centerX, 412, 780, 26);

    // 8. Reto a Ciegas pill (si aplica) + Cinta de las 24 letras LSC70
    let ribbonStartY = Math.max(nextY + 26, 466);
    if (payload.highlightWord) {
      const pillText = payload.accuracyLabel
        ? `RETO A CIEGAS: «${payload.highlightWord}» · ${payload.accuracyLabel}`
        : `RETO A CIEGAS: «${payload.highlightWord}»`;
      const pillW = Math.min(680, Math.max(360, ctx.measureText(pillText).width + 52));
      ctx.fillStyle = '#FFF7ED';
      this.#drawRoundedRect(ctx, centerX - pillW / 2, ribbonStartY - 12, pillW, 34, 17);
      ctx.fill();
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#9A3412';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText(pillText, centerX, ribbonStartY + 5);
      ribbonStartY += 42;
    }

    this.#drawAlphabetRibbon(ctx, payload.letters, centerX, ribbonStartY);

    // 9. Pie editorial: firma, roseta dorada con cintas y metadatos
    const footerY = 746;
    const sigX = contentLeft + 185;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'italic 700 28px Georgia, "Times New Roman", serif';
    ctx.fillText('Manitas LSC', sigX, footerY - 10);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigX - 115, footerY + 14);
    ctx.lineTo(sigX + 115, footerY + 14);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '700 12px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Academia Interactiva LSC', sigX, footerY + 34);
    ctx.fillStyle = '#64748B';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('Proyecto EXIS · Cámara Local', sigX, footerY + 52);

    // Roseta oficial dorada al centro-derecha
    const sealX = centerX + 55;
    const sealY = footerY + 6;
    this.#drawGoldRosetteSeal(ctx, sealX, sealY, payload.badgeLabel, goldGrad);

    // Metadatos a la derecha
    const metaX = contentRight - 72;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(payload.dateLabel.toUpperCase(), metaX, footerY - 6);
    ctx.fillStyle = '#64748B';
    ctx.font = '600 12px "JetBrains Mono", monospace';
    ctx.fillText(`CÓD. ${payload.code}`, metaX, footerY + 16);
    ctx.fillStyle = '#0E7490';
    ctx.font = '700 11px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Corpus LSC70 · Unicauca', metaX, footerY + 38);
    ctx.fillStyle = '#64748B';
    ctx.font = '500 11px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Grupo SIDICO', metaX, footerY + 55);
  }

  #drawLeftBrandRibbon(ctx, h, goldGrad, assets) {
    const ribbonX = 34;
    const ribbonW = 286;
    const ribbonH = h - 68;

    const petrolGrad = ctx.createLinearGradient(ribbonX, 34, ribbonX, 34 + ribbonH);
    petrolGrad.addColorStop(0, '#0C3B4E');
    petrolGrad.addColorStop(0.55, '#0E7490');
    petrolGrad.addColorStop(1, '#0F4C5C');
    ctx.fillStyle = petrolGrad;
    ctx.fillRect(ribbonX, 34, ribbonW, ribbonH);

    // Textura sutil de líneas diagonales en la franja
    ctx.save();
    ctx.beginPath();
    ctx.rect(ribbonX, 34, ribbonW, ribbonH);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let d = -ribbonH; d < ribbonW + ribbonH; d += 18) {
      ctx.beginPath();
      ctx.moveTo(ribbonX + d, 34);
      ctx.lineTo(ribbonX + d - 180, 34 + ribbonH);
      ctx.stroke();
    }
    ctx.restore();

    // Filete vertical metálico dorado separando la franja
    ctx.fillStyle = goldGrad;
    ctx.fillRect(ribbonX + ribbonW, 34, 6, ribbonH);

    const cx = ribbonX + ribbonW / 2;

    // Medallón superior marfil con logo de Manitas
    ctx.beginPath();
    ctx.arc(cx, 178, 62, 0, Math.PI * 2);
    ctx.fillStyle = '#FDFBF7';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = goldGrad;
    ctx.stroke();

    if (assets.logo) {
      this.#drawContainedImage(ctx, assets.logo, cx - 42, 136, 84, 84, 940 / 700);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 28px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('MANITAS', cx, 280);

    ctx.fillStyle = '#FDE68A';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText('DACTILOLOGÍA LSC', cx, 308);

    // Divisor dorado en la franja
    ctx.fillStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.fillRect(cx - 54, 344, 108, 2);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('CORPUS LSC70', cx, 386);
    ctx.fillStyle = '#FDE68A';
    ctx.font = '800 16px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('24 LETRAS OFICIALES', cx, 414);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '500 12px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Visión 100% local en navegador', cx, 444);

    // Halo cálido inferior con mascota Tito
    ctx.beginPath();
    ctx.arc(cx, 668, 92, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(253, 251, 247, 0.14)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.stroke();

    if (assets.mascot) {
      this.#drawContainedImage(ctx, assets.mascot, cx - 76, 592, 152, 152, 783 / 795);
    }

    ctx.fillStyle = 'rgba(253, 230, 138, 0.9)';
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillText('TUTOR TITO · LSC', cx, 804);
  }

  #drawGuillocheWatermark(ctx, cx, cy) {
    ctx.save();
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.055)';
    ctx.lineWidth = 1.2;
    [130, 185, 240, 295].forEach((r) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();
  }

  #drawCornerFlourishes(ctx, left, top, right, bottom) {
    const len = 24;
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 2.5;
    const corners = [
      [[left, top + len], [left, top], [left + len, top]],
      [[right - len, top], [right, top], [right, top + len]],
      [[right, bottom - len], [right, bottom], [right - len, bottom]],
      [[left + len, bottom], [left, bottom], [left, bottom - len]]
    ];
    corners.forEach(([p1, p2, p3]) => {
      ctx.beginPath();
      ctx.moveTo(p1[0], p1[1]);
      ctx.lineTo(p2[0], p2[1]);
      ctx.lineTo(p3[0], p3[1]);
      ctx.stroke();
    });
  }

  #drawDiamondDivider(ctx, cx, cy, halfSpan, goldGrad) {
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - halfSpan, cy);
    ctx.lineTo(cx - 14, cy);
    ctx.moveTo(cx + 14, cy);
    ctx.lineTo(cx + halfSpan, cy);
    ctx.stroke();

    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 7);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
  }

  #drawAlphabetRibbon(ctx, letters, centerX, startY) {
    const list = letters && letters.length ? letters : LSC_ALPHABET_24;
    const perRow = 12;
    const tileW = 46;
    const tileH = 44;
    const gapX = 12;
    const gapY = 12;

    const rows = [];
    for (let i = 0; i < list.length; i += perRow) {
      rows.push(list.slice(i, i + perRow));
    }

    rows.forEach((row, rIdx) => {
      const rowWidth = row.length * tileW + (row.length - 1) * gapX;
      const startX = centerX - rowWidth / 2;
      const y = startY + rIdx * (tileH + gapY);

      row.forEach((ch, cIdx) => {
        const x = startX + cIdx * (tileW + gapX);
        ctx.fillStyle = '#FFFBEB';
        this.#drawRoundedRect(ctx, x, y, tileW, tileH, 10);
        ctx.fill();

        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#92400E';
        ctx.font = '800 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, x + tileW / 2, y + tileH / 2 + 1);
      });
    });
  }

  #drawGoldRosetteSeal(ctx, cx, cy, badgeLabel, goldGrad) {
    ctx.save();
    // Cintas inferiores petrol
    ctx.fillStyle = '#0E7490';
    ctx.beginPath();
    ctx.moveTo(cx - 24, cy + 28);
    ctx.lineTo(cx - 34, cy + 78);
    ctx.lineTo(cx - 16, cy + 68);
    ctx.lineTo(cx - 4, cy + 80);
    ctx.lineTo(cx - 2, cy + 28);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0C4A6E';
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy + 28);
    ctx.lineTo(cx + 6, cy + 80);
    ctx.lineTo(cx + 18, cy + 68);
    ctx.lineTo(cx + 36, cy + 78);
    ctx.lineTo(cx + 24, cy + 28);
    ctx.closePath();
    ctx.fill();

    // Roseta festoneada de 20 puntas
    const points = 20;
    const outerR = 46;
    const innerR = 39;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = goldGrad;
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Anillo interno del sello
    ctx.beginPath();
    ctx.arc(cx, cy, 31, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFBEB';
    ctx.fill();
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#92400E';
    ctx.font = '800 10px "JetBrains Mono", monospace';
    const parts = badgeLabel.split('·').map(s => s.trim()).filter(Boolean);
    ctx.fillText(parts[0] || '24 LETRAS', cx, cy - 6);
    ctx.fillStyle = '#0E7490';
    ctx.font = '800 10px "JetBrains Mono", monospace';
    ctx.fillText(parts[1] || 'LSC70', cx, cy + 8);
    ctx.restore();
  }

  #drawContainedImage(ctx, img, boxX, boxY, boxW, boxH, fallbackAspect = 1) {
    const iw = img.naturalWidth || 0;
    const ih = img.naturalHeight || 0;
    const aspect = (iw > 0 && ih > 0) ? iw / ih : fallbackAspect;
    let drawW = boxW;
    let drawH = boxW / aspect;
    if (drawH > boxH) {
      drawH = boxH;
      drawW = boxH * aspect;
    }
    const dx = boxX + (boxW - drawW) / 2;
    const dy = boxY + (boxH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
  }

  #drawWrappedText(ctx, text, centerX, startY, maxWidth, lineHeight) {
    const words = String(text || '').split(' ').filter(Boolean);
    const lines = [];
    let current = '';
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    });
    if (current) lines.push(current);

    lines.slice(0, 2).forEach((line, idx) => {
      ctx.fillText(line, centerX, startY + idx * lineHeight);
    });
    return startY + (Math.min(lines.length, 2) - 1) * lineHeight;
  }

  #drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  #formatDateLabel(date) {
    try {
      return date.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      });
    } catch (e) {
      return date.toISOString().slice(0, 10);
    }
  }

  #buildVerificationCode(date, studentName, title) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const seed = `${studentName}|${title}|${y}${m}${d}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = ((hash * 31) + seed.charCodeAt(i)) >>> 0;
    }
    const suffix = hash.toString(16).toUpperCase().padStart(4, '0').slice(-4);
    return `MNT-${y}${m}${d}-${suffix}`;
  }

  #cleanText(value, fallback, maxLen) {
    const str = String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    const chosen = str || fallback;
    return chosen.length > maxLen ? `${chosen.slice(0, maxLen - 1)}…` : chosen;
  }

  #slugify(text) {
    const base = String(text || 'lsc')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return base.slice(0, 44) || 'lsc';
  }
}

if (typeof window !== 'undefined') {
  window.CertificateGenerator = new CertificateGenerator();
  window.CertificateGeneratorClass = CertificateGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CertificateGenerator;
}
