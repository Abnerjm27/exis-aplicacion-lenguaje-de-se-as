/**
 * Manitas · Proyecto EXIS
 * certificate-generator.js - Generador local de Certificados PNG en Canvas (POO ES6)
 */

class CertificateGenerator {
  #initialized = false;
  #width = 1200;
  #height = 800;
  #lastDataUrl = null;
  #lastPayload = null;

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
    const studentName = this.#cleanText(rawName, 'Estudiante LSC', 48);
    const title = this.#cleanText(options.title, 'Certificado de Maestría LSC', 56);
    const subtitle = this.#cleanText(
      options.subtitle,
      'Por su dedicación y práctica verificada en Lengua de Señas Colombiana',
      92
    );
    const metricPrimary = this.#cleanText(options.metricPrimary, '100% Progreso', 36);
    const metricSecondary = this.#cleanText(options.metricSecondary, 'Corpus LSC70', 36);
    const level = this.#cleanText(
      options.level || (profile && profile.level),
      'Principiante',
      32
    );

    const now = options.date instanceof Date ? options.date : new Date();
    const dateLabel = this.#cleanText(options.dateLabel, this.#formatDateLabel(now), 40);
    const code = this.#cleanText(options.code, this.#buildVerificationCode(now, studentName, title), 28);
    const slugSource = options.slug || `${studentName}-${title}`;
    const filename = `manitas-certificado-${this.#slugify(slugSource)}.png`;

    return {
      studentName,
      title,
      subtitle,
      metricPrimary,
      metricSecondary,
      level,
      dateLabel,
      code,
      filename
    };
  }

  generateDataUrl(options = {}) {
    if (!this.#initialized) this.init();
    if (typeof document === 'undefined') {
      throw new Error('CertificateGenerator requires a browser document to render Canvas.');
    }
    const payload = this.buildPayload(options);
    const canvas = document.createElement('canvas');
    canvas.width = this.#width;
    canvas.height = this.#height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('No 2D canvas context available.');
    }

    this.#paintDiploma(ctx, payload);
    const dataUrl = canvas.toDataURL('image/png');
    this.#lastPayload = payload;
    this.#lastDataUrl = dataUrl;
    return dataUrl;
  }

  downloadCertificate(options = {}) {
    const payload = this.buildPayload(options);
    if (typeof document === 'undefined') {
      return { ok: false, filename: payload.filename, payload };
    }
    const dataUrl = this.generateDataUrl({ ...options, dateLabel: payload.dateLabel, code: payload.code });
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

  #paintDiploma(ctx, payload) {
    const w = this.#width;
    const h = this.#height;

    // Fondo papel marfil cálido (60%)
    ctx.fillStyle = '#FAF8F5';
    ctx.fillRect(0, 0, w, h);

    // Resplandor radial suave
    const radial = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h * 0.45, 560);
    radial.addColorStop(0, 'rgba(245, 158, 11, 0.10)');
    radial.addColorStop(1, 'rgba(250, 248, 245, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    // Marco exterior ámbar (10% acento) e interior pizarra (30%)
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, w - 48, h - 48);

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.strokeRect(42, 42, w - 84, h - 84);

    // Esquinas ornamentales petrol (#0E7490)
    ctx.strokeStyle = '#0E7490';
    ctx.lineWidth = 3;
    this.#drawCornerAccents(ctx, 56, 56, w - 56, h - 56, 28);

    // Banda superior de marca
    ctx.fillStyle = '#0E7490';
    this.#drawRoundedRect(ctx, w / 2 - 220, 74, 440, 34, 17);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 13px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MANITAS · ACADEMIA INTERACTIVA LSC', w / 2, 91);

    // Título principal
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 42px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText(payload.title, w / 2, 165);

    // Línea divisora ámbar
    ctx.fillStyle = '#F59E0B';
    this.#drawRoundedRect(ctx, w / 2 - 90, 200, 180, 4, 2);
    ctx.fill();

    // Etiqueta Otorgado a
    ctx.fillStyle = '#475569';
    ctx.font = '600 18px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('OTORGADO CON HONORES A', w / 2, 245);

    // Nombre del estudiante
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 50px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText(payload.studentName, w / 2, 312);

    // Subrayado sutil del nombre
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 280, 350);
    ctx.lineTo(w / 2 + 280, 350);
    ctx.stroke();

    // Subtítulo descriptivo
    ctx.fillStyle = '#334155';
    ctx.font = '500 20px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText(payload.subtitle, w / 2, 396);

    // Tres tarjetas métricas redondeadas
    const cards = [
      { label: 'DESEMPEÑO', value: payload.metricPrimary, color: '#0E7490' },
      { label: 'ALCANCE', value: payload.metricSecondary, color: '#B45309' },
      { label: 'NIVEL', value: payload.level, color: '#0F172A' }
    ];
    const cardW = 290;
    const cardH = 112;
    const gap = 28;
    const startX = (w - (cards.length * cardW + (cards.length - 1) * gap)) / 2;
    const cardY = 452;

    cards.forEach((card, idx) => {
      const cx = startX + idx * (cardW + gap);
      ctx.fillStyle = '#FFFFFF';
      this.#drawRoundedRect(ctx, cx, cardY, cardW, cardH, 16);
      ctx.fill();

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      this.#drawRoundedRect(ctx, cx, cardY, cardW, cardH, 16);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '700 12px "JetBrains Mono", monospace';
      ctx.fillText(card.label, cx + cardW / 2, cardY + 34);

      ctx.fillStyle = card.color;
      ctx.font = '800 24px "Plus Jakarta Sans", "Segoe UI", sans-serif';
      ctx.fillText(card.value, cx + cardW / 2, cardY + 72);
    });

    // Sello inferior: fecha y código
    ctx.fillStyle = '#475569';
    ctx.font = '600 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Fecha: ${payload.dateLabel}`, 88, 646);

    ctx.textAlign = 'right';
    ctx.fillText(`Código: ${payload.code}`, w - 88, 646);

    // Sello oficial central y pie institucional
    ctx.textAlign = 'center';
    ctx.fillStyle = '#B45309';
    ctx.font = '700 13px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('SELLO VERIFICADO EN CAMARA LOCAL · SIN VIDEO EN LA NUBE', w / 2, 688);

    ctx.fillStyle = '#64748B';
    ctx.font = '500 13px "Plus Jakarta Sans", "Segoe UI", sans-serif';
    ctx.fillText('Corpus LSC70 · Universidad del Cauca (Grupo SIDICO) · Proyecto EXIS', w / 2, 718);
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

  #drawCornerAccents(ctx, left, top, right, bottom, len) {
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
    return base.slice(0, 40) || 'lsc';
  }
}

if (typeof window !== 'undefined') {
  window.CertificateGenerator = new CertificateGenerator();
  window.CertificateGeneratorClass = CertificateGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CertificateGenerator;
}
