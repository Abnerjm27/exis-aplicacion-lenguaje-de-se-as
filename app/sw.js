/**
 * sw.js — Service Worker de Manitas (PWA para Lengua de Señas Colombiana)
 *
 * Estrategia: Network-First con fallback a Cache para shell y assets estáticos.
 * Exclusiones: No intercepta llamadas dinámicas /api/ (Ollama / Planes) ni peticiones con rango de video.
 */

const CACHE_NAME = 'manitas-pwa-v19-camera-stop-fix';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/landing.html',
  '/login.html',
  '/register.html',
  '/onboarding.html',
  '/perfil.html',
  '/mascot_gallery.html',
  '/manifest.json',
  '/favicon.ico',
  '/css/tokens.css',
  '/css/fonts.css',
  '/css/styles.css',
  '/css/lesson.css',
  '/css/alphabet-lab.css',
  '/css/landing.css',
  '/css/landing-hero.css',
  '/css/auth.css',
  '/css/gallery.css',
  '/js/signs-data.js',
  '/js/sign-anatomy-validator.js',
  '/js/finger-feedback-engine.js',
  '/js/srs-client.js',
  '/js/gamification-manager.js',
  '/js/body-anchor-detector.js',
  '/js/trajectory-tracker.js',
  '/js/video-player.js',
  '/js/camera-manager.js',
  '/js/vision-evaluator.js',
  '/js/auth-service.js',
  '/js/auth-profile-manager.js',
  '/js/auth-page.js',
  '/js/onboarding.js',
  '/js/perfil-page.js',
  '/js/landing.js',
  '/js/learning-plan-manager.js',
  '/js/exam-ui-helper.js',
  '/js/blind-exam-controller.js',
  '/js/lesson-session.js',
  '/js/view-router.js',
  '/js/alphabet-lab-controller.js',
  '/js/pwa-manager.js',
  '/js/chat-tutor.js',
  '/js/main.js',
  '/img/manitas-icono-app-1024.png',
  '/img/icons/icon-192.png',
  '/img/icons/icon-512.png',
  '/img/icons/icon-maskable-192.png',
  '/img/icons/icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[Service Worker] No se pudo precachear asset: ${url}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar protocolos no http/https
  if (!url.protocol.startsWith('http')) return;

  // REGLA CRÍTICA: No cachear endpoints dinámicos de backend ni túneles de IA
  if (url.pathname.startsWith('/api/')) return;

  // No interceptar peticiones de rango de streaming de video (.mp4 / .webm)
  if (event.request.headers.get('range') || url.pathname.endsWith('.mp4') || url.pathname.endsWith('.webm')) {
    return;
  }

  // Estrategia Network-First con fallback a Cache
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Fallback a Cache si falla la red o estamos offline
        const cachedResponse = await caches.match(event.request, { ignoreSearch: true });
        if (cachedResponse) {
          return cachedResponse;
        }

        // Si es navegación de documento HTML, responder con el shell principal
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return (await caches.match('/index.html')) || (await caches.match('/'));
        }
      })
  );
});
