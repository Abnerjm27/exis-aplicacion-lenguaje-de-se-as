const assert = require('assert');
const CertificateGenerator = require('../app/js/certificate-generator.js');

function runTests() {
  console.log('Running CertificateGenerator Unit Tests...');

  const cert = new CertificateGenerator();
  assert.strictEqual(cert.init(), cert, 'init() debe retornar la instancia');
  assert.strictEqual(cert.start(), cert, 'start() debe retornar la instancia');

  const fixedDate = new Date('2026-11-26T12:00:00Z');
  const defaultPayload = cert.buildPayload({ date: fixedDate });
  assert.strictEqual(defaultPayload.studentName, 'Estudiante LSC');
  assert.strictEqual(defaultPayload.title, 'Certificado de Maestría LSC');
  assert.ok(/^MNT-20261126-[0-9A-F]{4}$/.test(defaultPayload.code), 'Código de verificación inválido');
  assert.ok(defaultPayload.filename.endsWith('.png'), 'Debe generar extensión .png');

  // Reto a ciegas payload & slugification with accents
  const blindPayload = cert.buildPayload({
    studentName: 'María José Pérez',
    title: 'Certificado · Reto a Ciegas',
    subtitle: 'Deletreo sin pistas visuales de "MANITAS"',
    metricPrimary: '100% Precisión',
    metricSecondary: '7/7 Letras',
    level: 'Reto Superado',
    date: fixedDate
  });
  assert.strictEqual(blindPayload.studentName, 'María José Pérez');
  assert.strictEqual(blindPayload.metricPrimary, '100% Precisión');
  assert.strictEqual(blindPayload.metricSecondary, '7/7 Letras');
  assert.strictEqual(blindPayload.level, 'Reto Superado');
  assert.ok(!/[áéíóúÁÉÍÓÚ\s]/.test(blindPayload.filename), 'Filename debe ser slug ASCII sin espacios');
  assert.ok(blindPayload.filename.includes('maria-jose-perez'), 'Filename debe incluir el slug del estudiante');

  // Achievements / Logros payload truncation check
  const longName = 'Estudiante Con Un Nombre Extremadamente Largo Para Probar Truncamiento Seguro';
  const achPayload = cert.update({
    studentName: longName,
    title: 'Vitrina de Logros · Manitas LSC',
    metricPrimary: '8/12 Medallas',
    metricSecondary: '1250 XP',
    level: 'Intermedio',
    date: fixedDate
  });
  assert.ok(achPayload.studentName.length <= 48, 'Nombre largo debe truncarse a <= 48 caracteres');
  assert.strictEqual(cert.getLastResult().payload.metricSecondary, '1250 XP');

  // Exam payload
  const examPayload = cert.buildPayload({
    studentName: 'Abner',
    title: 'Certificado · Evaluación Ciega LSC',
    subtitle: 'Plan Básico · Solo Cámara',
    metricPrimary: '92% Calificación',
    metricSecondary: '5/5 Señas',
    level: 'Avanzado LSC',
    date: fixedDate
  });
  assert.strictEqual(examPayload.metricPrimary, '92% Calificación');

  // Node environment graceful handling on downloadCertificate
  const nodeDownload = cert.downloadCertificate({ studentName: 'Test Node', date: fixedDate });
  assert.strictEqual(nodeDownload.ok, false, 'Sin DOM debe retornar ok=false sin lanzar excepción');
  assert.ok(nodeDownload.filename.includes('test-node'), 'Debe incluir filename en Node');

  cert.reset();
  assert.strictEqual(cert.getLastResult().payload, null, 'reset() debe limpiar último payload');
  cert.destroy();

  console.log('ALL CertificateGenerator TESTS PASSED');
}

runTests();
