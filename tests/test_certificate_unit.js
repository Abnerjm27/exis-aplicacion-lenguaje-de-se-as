const assert = require('assert');
const CertificateGenerator = require('../app/js/certificate-generator.js');

async function runTests() {
  console.log('Running CertificateGenerator Unit Tests...');

  const cert = new CertificateGenerator();
  assert.strictEqual(cert.init(), cert, 'init() debe retornar la instancia');
  assert.strictEqual(cert.start(), cert, 'start() debe retornar la instancia');

  const fixedDate = new Date('2026-11-26T12:00:00Z');
  const defaultPayload = cert.buildPayload({ date: fixedDate });
  assert.strictEqual(defaultPayload.studentName, 'Estudiante LSC');
  assert.strictEqual(defaultPayload.title, 'Certificado del Abecedario LSC');
  assert.strictEqual(defaultPayload.badgeLabel, '24 LETRAS · LSC70');
  assert.strictEqual(defaultPayload.letters.length, 24, 'Debe incluir las 24 letras del corpus LSC70');
  assert.strictEqual(defaultPayload.letters[0], 'A');
  assert.strictEqual(defaultPayload.letters[23], 'Z');
  assert.ok(/^MNT-20261126-[0-9A-F]{4}$/.test(defaultPayload.code), 'Código de verificación inválido');
  assert.ok(defaultPayload.filename.startsWith('manitas-abecedario-'), 'Debe usar prefijo manitas-abecedario-');
  assert.ok(defaultPayload.filename.endsWith('.png'), 'Debe generar extensión .png');

  // Reto a ciegas payload & slugification with accents
  const blindPayload = cert.buildPayload({
    studentName: 'María José Pérez',
    title: 'Certificado · Reto a Ciegas LSC',
    subtitle: 'Por superar el deletreo sin pistas visuales de "MANITAS" en cámara',
    highlightWord: 'manitas',
    accuracyLabel: '100% Precisión (7/7 letras)',
    date: fixedDate
  });
  assert.strictEqual(blindPayload.studentName, 'María José Pérez');
  assert.strictEqual(blindPayload.highlightWord, 'MANITAS');
  assert.strictEqual(blindPayload.accuracyLabel, '100% Precisión (7/7 letras)');
  assert.ok(!/[áéíóúÁÉÍÓÚ\s]/.test(blindPayload.filename), 'Filename debe ser slug ASCII sin espacios');
  assert.ok(blindPayload.filename.includes('maria-jose-perez'), 'Filename debe incluir el slug del estudiante');

  // Long student name truncation check
  const longName = 'Estudiante Con Un Nombre Extremadamente Largo Para Probar Truncamiento Seguro';
  const achPayload = cert.update({
    studentName: longName,
    title: 'Certificado del Abecedario LSC',
    date: fixedDate
  });
  assert.ok(achPayload.studentName.length <= 46, 'Nombre largo debe truncarse a <= 46 caracteres');
  assert.strictEqual(cert.getLastResult().payload.title, 'Certificado del Abecedario LSC');

  // Node environment graceful handling on downloadCertificate
  const nodeDownload = await cert.downloadCertificate({ studentName: 'Test Node', date: fixedDate });
  assert.strictEqual(nodeDownload.ok, false, 'Sin DOM debe retornar ok=false sin lanzar excepción');
  assert.ok(nodeDownload.filename.includes('test-node'), 'Debe incluir filename en Node');

  cert.reset();
  assert.strictEqual(cert.getLastResult().payload, null, 'reset() debe limpiar último payload');
  cert.destroy();

  console.log('ALL CertificateGenerator TESTS PASSED');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
