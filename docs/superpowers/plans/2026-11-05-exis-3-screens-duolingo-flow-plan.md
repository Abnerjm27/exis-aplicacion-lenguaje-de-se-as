# EXIS 3-Screen Flow: Futuristic Landing Page, Duolingo-Style Path View & Dedicated Practice Studio Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar la experiencia de EXIS en **3 pantallas independientes y dedicadas**: (1) una **Landing Page Futurista (`app/landing.html`)** que presenta y vende el proyecto e integra el portal de Login/Registro; (2) una **Vista Dedicada de Rutas Estilo Duolingo (`#viewLearningPath`)** donde el estudiante ve su camino vertical serpenteante de nodos y el Nodo Trofeo de Examen Sin Video sin que aparezca el estudio de cámara/video; y (3) la **Cabina Dedicada de Práctica / Examen Sin Video (`#viewPracticeStudio`)** a la que se entra al tocar un nodo del camino y que cuenta con barra de progreso de lección y botón `← Volver a Mi Ruta`.

**Architecture:**
1. Crear `app/landing.html`, `app/css/landing.css` y `app/js/landing.js` (`class LandingPortalController` POO ES6) siguiendo las reglas de `impeccable` (Modo Persuade + Operate) y Emil Kowalski (`motion-doctrine`).
2. Añadir una clase POO `ViewRouter` en `app/js/view-router.js` (`class ViewRouter`) que administra las vistas de pantalla completa dentro de `app/index.html`:
   - **Vista 1 (`path` — `#viewLearningPath`):** Pantalla dedicada al **Mapa Serpenteante Estilo Duolingo** (nodos verticales conectados con curva SVG, tarjetas de Planes IA con Sol y Constructor Manual, y el **Nodo Trofeo de Examen de Unidad Sin Video** al final del camino).
   - **Vista 2 (`studio` — `#viewPracticeStudio`):** Pantalla dedicada exclusivamente al Reproductor de Video Interactivo + Cámara MediaPipe + Escudo de Examen Sin Video, con una barra superior de sesión (`← Volver a Mi Ruta Duolingo`, título de la ruta activa y pasos `Paso X de N`).
   - Nota de retrocompatibilidad para pruebas existentes: Si la URL incluye `?view=studio`, `?sign=...` o si el usuario hace clic en un nodo o en el botón `"Ir al Estudio de Práctica"`, `ViewRouter` muestra `#viewPracticeStudio`; por defecto al venir de `landing.html` (`?screen=path`), abre directamente el Mapa Estilo Duolingo `#viewLearningPath`.

**Tech Stack:** HTML5 semántico, Tailwind CSS local, CSS Custom Properties (`app/css/styles.css`, `app/css/landing.css`), JavaScript ES6+ POO modular (`LandingPortalController`, `ViewRouter`, `AuthProfileManager`, `LearningPlanManager`, `BlindExamController`), Python `server.py` (puerto 8000), Playwright.

---

## Global Constraints (`AGENTS.md` + `impeccable` + Emil Kowalski)
1. **Límite de 1,100 líneas por archivo.**
2. **Cero `<style>` y Cero `<script>` inline** tanto en `app/landing.html` como en `app/index.html`.
3. **POO Estricta:** Clases ES6 con campos privados `#` y ciclo de vida `init()`, `start()`, `update()`, `reset()`, `destroy()`.
4. **Cero emojis como iconos** en los nuevos elementos (usar SVGs limpios).
5. **Números tabulares (`.tabular-nums`)** y transiciones `--spring-easing: cubic-bezier(0.16, 1, 0.3, 1)` con soporte `@media (prefers-reduced-motion: reduce)`.
6. **Cero errores de consola (`window.__consoleErrors == []`)** y **cero desbordamiento horizontal (`scrollWidth <= clientWidth`)** en `390x844` y `1280x850`.

---

### Task 1: Landing Page Futurista y Portal Auth (`app/landing.html`, `app/css/landing.css`, `app/js/landing.js`)

**Files:**
- Create: `app/landing.html`
- Create: `app/css/landing.css`
- Create: `app/js/landing.js`

**Interfaces:**
- Produces `window.LandingPortalController` (`class LandingPortalController`):
  - `init(): void`, `start(): void`, `update(): void`, `reset(): void`, `destroy(): void`
  - Conecta el formulario de Login/Registro (`#landingAuthForm`, `#landingUsernameInput`, `#landingDisplayNameInput`, `#landingLevelSelect`, `#landingGoalInput`, `#landingAuthError`, `#btnLandingSubmit`) con `POST /api/users` y `localStorage` (`exis_active_profile_v1`).
  - Al iniciar sesión o registrarse, redirige a `index.html?screen=path` (si el usuario escribió una meta inicial en `#landingGoalInput`, la guarda en `sessionStorage.setItem('exis_pending_ai_goal', goal)` para que Sol IA la construya automáticamente al entrar al Mapa Duolingo).

- [ ] **Step 1: Construir `app/landing.html` (Cero CSS/JS inline)**
  - **Navbar Futurista:** Logo EXIS LSC, enlaces de navegación (`#navFeatures`, `#navHowItWorks`, `#navAuthPortal`) y CTA `"Entrar a la Academia"`.
  - **Hero Futurista:**
    - Columna izquierda: Título display de alto impacto `"Domina la Lengua de Señas Colombiana con Visión Artificial e IA Local"`, subtítulo explicando el corpus LSC70 de la UTP, botones `#btnScrollToAuth` (`"Iniciar Sesión / Crear Cuenta"`) y `#btnQuickGuestPath` (`"Explorar Mapa de Rutas"`).
    - Columna derecha: **Cápsula Holográfica EXIS** con retrato de **Sol (`hoja_personaje` / `anime_character_render.png`)**, proyección SVG interactiva de los **21 Landmarks biomecánicos de MediaPipe Hands** con nodos pulsantes en ámbar/esmeralda, y 3 tarjetas flotantes de telemetría (`30 FPS Hand Tracking`, `Qwen 2.5 3B IA Local`, `20 Señas Oficiales LSC70`).
  - **Sección Showcase de 3 Pilares (`#howItWorksSection`):**
    1. *Rutas Adaptativas Estilo Duolingo con IA Local*
    2. *Evaluación Biomecánica en Tiempo Real (MediaPipe)*
    3. *Exámenes Ciegos de Certificación Sin Video*
  - **Portal Futurista de Login / Registro (`#authPortalSection`):**
    - Pestañas `"Iniciar Sesión / Crear Cuenta"` vs `"Acceso Rápido Invitado"`.
    - Inputs: Usuario (`#landingUsernameInput`), Nombre visible (`#landingDisplayNameInput`), Nivel (`#landingLevelSelect`: *Desde Cero*, *Abecedario LSC*, *Palabras y Saludos*), y campo opcional *"¿Qué quieres que Sol IA te enseñe primero?"* (`#landingGoalInput`).
    - Botón `#btnLandingSubmit` (`"Entrar a Mi Mapa de Entrenamiento ➔"`).

- [ ] **Step 2: Construir `app/css/landing.css` y `app/js/landing.js`**
  - En `app/css/landing.css`: piso de rejilla holográfica en perspectiva sutil, cápsula de cristal con iluminación volumétrica ámbar (`#f59e0b`) y cian-esmeralda (`#10b981`), animación SVG de los 21 puntos de la mano y responsive completo en `390x844` y `1280x850`.
  - En `app/js/landing.js`: clase POO `LandingPortalController` con registro de `window.__consoleErrors = []`, validación de formulario, persistencia en `/api/users` + `localStorage`, y redirección limpia a `index.html?screen=path`.

---

### Task 2: Separación en 2 Vistas de Pantalla Completa dentro de `app/index.html` (`ViewRouter` + Mapa Estilo Duolingo vs Cabina de Práctica)

**Files:**
- Create: `app/js/view-router.js`
- Modify: `app/js/learning-plan-manager.js`
- Modify: `app/index.html`
- Modify: `app/css/styles.css`
- Modify: `app/js/main.js`

**Interfaces:**
- Produces `window.ViewRouter` (`class ViewRouter`):
  - `init(): void`, `start(): void`, `update(viewName: 'path' | 'studio'): void`, `reset(): void`, `destroy(): void`
  - `switchToPathView(): void` — Muestra `#viewLearningPath` (Mapa Duolingo y Planes) y oculta `#viewPracticeStudio`, pausando `VisionEvaluator` para no evaluar en segundo plano mientras el usuario explora su mapa.
  - `switchToStudioView(signId?: string, startExam?: boolean): void` — Oculta `#viewLearningPath`, muestra `#viewPracticeStudio` con transición suave `--spring-easing`, selecciona la seña `signId` (o inicia el examen ciego si `startExam === true`) y actualiza la barra de progreso de la lección (`#studioBreadcrumbPlanTitle`, `#studioStepProgressText`).

- [ ] **Step 1: Transformar el Mapa de Nodos en un Camino Serpenteante Estilo Duolingo en `app/js/learning-plan-manager.js` y `app/css/styles.css`**
  - En lugar de una fila plana de hexágonos, diseñar `.duolingo-winding-path`: un camino vertical serpenteante (alternando desplazamientos suaves centro → izquierda → centro → derecha en escritorio y centrado limpio en móvil) donde cada paso del plan es un **Nodo Circular/Hexagonal Grande Estilo Duolingo** (`.hex-node.duolingo-node`) con:
    - Anillo de estado iluminado (Verde Esmeralda = Dominada, Ámbar con pulso = Lección Actual con etiqueta flotante `"¡EMPEZAR!"`, Pizarra = Siguiente paso).
    - Al final del camino serpenteante, renderizar siempre el **Nodo Trofeo Final (`#btnPathFinalExamNode`)**: *"Examen de Unidad Sin Video — Demuestra lo aprendido sin guía"*, que al hacer clic lleva directamente a la Cabina de Práctica con el `BlindExamController` activado.
  - Al hacer clic en cualquier nodo del camino Duolingo, invocar `window.ViewRouter.switchToStudioView(signId, false)` para abrir la pantalla de práctica de esa seña.

- [ ] **Step 2: Estructurar `#viewLearningPath` y `#viewPracticeStudio` en `app/index.html`**
  - En la barra superior (`<header>`):
    - Enlace a `landing.html` (`#btnGoToLanding`, `"Inicio / Landing"`).
    - Conmutador de vista principal: botón `#btnNavViewPath` (`"Mapa de Ruta"`) y botón `#btnNavViewStudio` (`"Estudio de Práctica"`).
  - **`#viewLearningPath` (Pantalla 2 — Mapa Duolingo & Planes):**
    - Columna izquierda: Tarjeta de Perfil del Estudiante, Racha, XP, Anillos de Maestría y selector de Planes (*Desde Cero IA*, *Abecedario*, *Palabras*, *+ Crear Mi Propio Plan*).
    - Columna central/derecha amplia: Tarjeta de **Sol · Arquitecta de Rutas IA** + **Camino Serpenteante Estilo Duolingo (`#hexSkillTreeContainer`)** culminando en el **Nodo Trofeo de Examen Sin Video**.
  - **`#viewPracticeStudio` (Pantalla 3 — Cabina de Práctica y Examen Sin Video):**
    - Barra superior de navegación de lección: botón `#btnBackToPath` (`"← Volver a Mi Ruta Duolingo"`), indicador `#studioBreadcrumbPlanTitle`, barra de pasos de la unidad y botón `#btnStartBlindExam` (`"Examen Sin Video"`).
    - Contiene intactos el selector de señas (`#signList`), el Reproductor de Video Interactivo (`#videoPlayerStage` + `#blindExamOverlay`) y la Cámara con MediaPipe (`#webcamVideo` + `#outputCanvas`).

---

### Task 3: Verificación E2E de las 3 Pantallas con Playwright y Actualización de Graphify

**Files:**
- Modify: `tests/learning_platform_and_exam.spec.js`
- Create: `tests/test_3_screens_flow.spec.js`

- [ ] **Step 1: Crear y ejecutar `tests/test_3_screens_flow.spec.js`**
  - Verificar **Pantalla 1 (`http://localhost:8000/landing.html`)**:
    - Carga con `0` errores de consola, `0` overflow horizontal en `390x844` y `1280x850`.
    - Muestra la cápsula holográfica con los 21 puntos SVG y el formulario de Login/Registro.
    - Al completar el registro y enviar `#btnLandingSubmit`, navega automáticamente a `index.html?screen=path`.
  - Verificar **Pantalla 2 (`#viewLearningPath` — Mapa Estilo Duolingo)**:
    - `#viewLearningPath` está visible y `#viewPracticeStudio` está oculto (`hidden`).
    - El camino estilo Duolingo muestra los nodos `.hex-node` y el nodo trofeo `#btnPathFinalExamNode`.
  - Verificar transición a **Pantalla 3 (`#viewPracticeStudio` — Cabina de Práctica y Examen)**:
    - Al hacer clic en un nodo del camino Duolingo, `#viewLearningPath` se oculta y `#viewPracticeStudio` se muestra con la seña seleccionada.
    - El botón `#btnBackToPath` regresa inmediatamente al Mapa Duolingo `#viewLearningPath`.
    - Al hacer clic en el Nodo Trofeo `#btnPathFinalExamNode`, entra a `#viewPracticeStudio` con el **Modo Examen Sin Video (`#blindExamOverlay`)** activo.

- [ ] **Step 2: Ejecutar todas las suites de regresión y actualizar Graphify**
  - Run: `node tests/test_3_screens_flow.spec.js && node tests/learning_platform_and_exam.spec.js && node tests/test_console_check.js && node tests/test_20_signs.js`
  - Run: `python -m graphify extract . --code-only`
