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
  #assets = { template: null, logo: null, loaded: false };

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
    this.#assets = { template: null, logo: null, loaded: false };
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
    const [template, logo] = await Promise.all([
      loadImg('img/certificado_template_lsc.png'),
      loadImg('img/manitas-simbolo.svg')
    ]);
    this.#assets = { template, logo, loaded: true };
    return this.#assets;
  }

  #paintDiploma(ctx, payload, assets) {
    const w = this.#width;
    const h = this.#height;
    const centerX = w / 2;

    // 1. Plantilla artística de fondo (full-bleed 1400x920) o fallback marfil/oro
    if (assets.template) {
      ctx.drawImage(assets.template, 0, 0, w, h);
    } else {
      ctx.fillStyle = '#FCF9F2';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.strokeRect(44, 44, w - 88, h - 88);
    }

    // 2. Símbolo Manitas y encabezado institucional centrado
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (assets.logo) {
      this.#drawContainedImage(ctx, assets.logo, centerX - 28, 108, 56, 42, 940 / 700);
    }

    ctx.fillStyle = '#0E7490';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText('MANITAS · ACADEMIA DE DACTILOLOGÍA LSC', centerX, 174);

    // 3. Título principal editorial
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 48px Georgia, "Times New Roman", serif';
    ctx.fillText(payload.title, centerX, 240);

    // 4. Ornamento dorado sutil con rombo central
    this.#drawHairlineDivider(ctx, centerX, 294, 150);

    // 5. Otorgado a + Nombre protagonista del estudiante
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 20px Georgia, "Times New Roman", serif';
    ctx.fillText('Se otorga el presente reconocimiento a', centerX, 344);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 64px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText(payload.studentName, centerX, 416);

    ctx.strokeStyle = 'rgba(212, 175, 55, 0.72)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - 230, 464);
    ctx.lineTo(centerX + 230, 464);
    ctx.stroke();

    // 6. Subtítulo descriptivo espacioso
    ctx.fillStyle = '#334155';
    ctx.font = '500 19px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    const nextY = this.#drawWrappedText(ctx, payload.subtitle, centerX, 508, 760, 28);

    // Píldora discreta solo cuando proviene de Reto a Ciegas aprobado
    if (payload.highlightWord) {
      const pillY = nextY + 44;
      const pillText = payload.accuracyLabel
        ? `RETO A CIEGAS: «${payload.highlightWord}» · ${payload.accuracyLabel}`
        : `RETO A CIEGAS: «${payload.highlightWord}»`;
      ctx.font = '700 13px "JetBrains Mono", monospace';
      const pillW = Math.min(680, Math.max(340, ctx.measureText(pillText).width + 52));
      ctx.fillStyle = 'rgba(255, 251, 235, 0.94)';
      this.#drawRoundedRect(ctx, centerX - pillW / 2, pillY - 17, pillW, 34, 17);
      ctx.fill();
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#92400E';
      ctx.fillText(pillText, centerX, pillY);
    }

    // 7. Pie editorial alineado a la izquierda-centro (despejando el sello dorado inferior derecho)
    const footerY = 716;
    const sigX = 336;
    ctx.fillStyle = '#0F172A';
    ctx.font = 'italic 700 30px Georgia, "Times New Roman", serif';
    ctx.fillText('Manitas LSC', sigX, footerY);

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigX - 116, footerY + 26);
    ctx.lineTo(sigX + 116, footerY + 26);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '700 12px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Academia Interactiva LSC', sigX, footerY + 46);
    ctx.fillStyle = '#64748B';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.fillText('Proyecto EXIS · Cámara Local', sigX, footerY + 65);

    const metaX = 720;
    ctx.fillStyle = '#0E7490';
    ctx.font = '700 13px "JetBrains Mono", monospace';
    ctx.fillText(payload.badgeLabel, metaX, footerY + 2);

    ctx.fillStyle = '#0F172A';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(`${payload.dateLabel.toUpperCase()} · ${payload.code}`, metaX, footerY + 26);

    ctx.fillStyle = '#475569';
    ctx.font = '600 12px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Corpus LSC70 · Universidad del Cauca (Grupo SIDICO)', metaX, footerY + 52);
  }

  #drawHairlineDivider(ctx, cx, cy, halfSpan) {
    const grad = ctx.createLinearGradient(cx - halfSpan, cy, cx + halfSpan, cy);
    grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
    grad.addColorStop(0.5, '#D4AF37');
    grad.addColorStop(1, 'rgba(212, 175, 55, 0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(cx - halfSpan, cy);
    ctx.lineTo(cx - 12, cy);
    ctx.moveTo(cx + 12, cy);
    ctx.lineTo(cx + halfSpan, cy);
    ctx.stroke();

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 6);
    ctx.lineTo(cx - 7, cy);
    ctx.closePath();
    ctx.fill();
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
