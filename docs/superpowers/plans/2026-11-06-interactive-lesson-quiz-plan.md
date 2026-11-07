# Sistema de Lección Interactiva Tipo Test y Práctica con Cámara (Plan de Implementación)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar la ruta Duolingo en un flujo pedagógico gamificado tipo test (comprensión + réplica motriz con cámara) donde cada nodo ejecuta una lección guiada de 3 fases: Demostración con Zorrito Tutor, Pregunta de Selección Múltiple y Práctica Activa con Cámara (MediaPipe), finalizando con desbloqueo progresivo de nodos en el mapa.

**Architecture:** Módulo POO desacoplado `LessonSessionController` en `app/js/lesson-session.js` con ciclo de vida estandarizado (`init()`, `start()`, `update()`, `reset()`, `destroy()`), interfaz de lección accesible en `app/css/lesson.css` y contenedor modal/vista en `app/index.html`. Se comunica con `LearningPlanManager` para el avance del mapa y con `VisionEvaluator` / `VideoPlayer` para la validación biomecánica y reproducción dual (Real + Anime).

**Tech Stack:** HTML5 Semántico, Tailwind CSS (CDN/Local), CSS Custom Properties (`tokens.css`), JavaScript ES6+ (Clases POO con campos privados `#`), Google MediaPipe Hands, Playwright para pruebas E2E.

**Spec:** Pedagógico estilo Lingvano / Duolingo adaptado a Lengua de Señas Colombiana (LSC70).

## Global Constraints

- **Límite de líneas:** Ningún archivo puede superar las 1,100 líneas (`AGENTS.md` Regla 1). Se crea `app/css/lesson.css` para no saturar `styles.css`.
- **Cero CSS/JS embebido:** Prohibido `<style>` y código dentro de `<script>` en `app/index.html` (`AGENTS.md` Regla 2).
- **Servidor puerto 8000:** `http://localhost:8000/` (`AGENTS.md` Regla 3).
- **Paleta oficial Manitas:** Azul Noche `#14213D`, Turquesa `#00B8A9`, Amarillo Sol `#FFC857`, Coral `#FF6B5B`, Blanco Hueso `#F8F5EF`, Verde Acierto `#3DDC97`, Rojo Intento `#E5484D`.
- **Tipografía Impeccable:** `Plus Jakarta Sans` para cuerpo y controles, `Lexend` para display/títulos, `tabular-nums` para cronómetros y XP.
- **POO Estricta:** Clase `class LessonSessionController` con estado encapsulado (`#`) y métodos de ciclo de vida (`AGENTS.md` Regla 8).
- **Ergonomía táctil:** Botones y opciones de respuesta $\ge 44\text{px}$, cero desbordamiento horizontal en 390×844 y 1280×850.

## Review Focus

1. **Reconocimiento visual sin pistas:** La fase de pregunta tipo test no debe revelar el nombre de la seña en el video ni en subtítulos antes de que el usuario responda.
2. **Reutilización de stream de cámara:** Al pasar de la pregunta a la práctica con cámara, la cámara web no debe reinicializarse bruscamente ni bloquear el hilo de MediaPipe.
3. **Persistencia en el mapa:** Al completar con éxito la lección, el nodo debe cambiar inmediatamente a completado (verde) en el mapa y desbloquear el siguiente nodo en `localStorage` / `AuthProfileManager`.
4. **Respuesta a fallos en el test:** Si el usuario elige una opción incorrecta en la pregunta, la franja inferior debe mostrar feedback correctivo pedagógico del zorrito sin bloquear el avance.
5. **Cierre o salida de la lección:** Si el usuario pulsa la "✕" para salir a mitad de lección, el estado se cancela de forma segura (`destroy()`) sin dejar timers huérfanos ni loops de cámara activos.

---

### Task 1: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)

**Files:**
- Create: `app/js/lesson-session.js`
- Test: `tests/test_lesson_session_unit.js`

**Interfaces:**
- Consumes: `SIGNS_DATA` (`app/js/signs-data.js`), `AuthProfileManager` (`app/js/auth-profile-manager.js`), `VisionEvaluator` (`app/js/vision-evaluator.js`).
- Produces: `window.LessonSessionController` con métodos públicos `init(options)`, `startLesson(signId, planContext)`, `nextPhase()`, `reset()`, `destroy()`.

- [ ] **Step 1: Escribir prueba unitaria básica de ciclo de vida**
  - Crear `tests/test_lesson_session_unit.js` validando inicialización, cambio de fases (Demo -> Test -> Cámara -> Resumen) y cálculo de opciones falsas (distractores).
- [ ] **Step 2: Ejecutar prueba unitaria para verificar que falle (TDD)**
  - Correr `node tests/test_lesson_session_unit.js`.
- [ ] **Step 3: Implementar `class LessonSessionController` en `app/js/lesson-session.js`**
  - Estado privado: `#currentSignId`, `#currentPhase` (`'demo' | 'quiz' | 'practice' | 'summary'`), `#score`, `#selectedOption`, `#cameraActive`, `#planContext`.
  - Generador de opciones múltiples: Toma la seña correcta y elige 3 distractores aleatorios de la misma categoría en `SIGNS_DATA`.
  - Integración con MediaPipe: Escucha el evento de coincidencia $\ge 90\%$ mantenido por 1.2s para otorgar victoria en la fase de práctica.
- [ ] **Step 4: Ejecutar prueba unitaria y verificar pase**
  - Correr `node tests/test_lesson_session_unit.js`.

---

### Task 2: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

**Files:**
- Create: `app/css/lesson.css`
- Modify: `app/index.html` (referencia externa en `<head>`)

**Interfaces:**
- Consumes: Variables de diseño en `app/css/tokens.css` (`--manitas-*`, `--color-*`, `--font-*`).
- Produces: Clases `.lesson-overlay`, `.lesson-progress-bar`, `.quiz-choice-btn`, `.practice-split-view`, `.lesson-feedback-sheet`.

- [ ] **Step 1: Diseñar los estilos de la experiencia de lección tipo test**
  - Pantalla completa inmersiva con fondo Azul Noche `#14213D` o modal centrado en escritorio (`max-w-3xl`).
  - Barra de progreso segmentada en la parte superior: `[Paso 1: Mira] -> [Paso 2: Responde] -> [Paso 3: Práctica]`.
  - Tarjetas de opción múltiple con efecto hover, estado seleccionado y tamaño táctil $\ge 48\text{px}$.
  - Franja de feedback inferior tipo Duolingo: franja verde para acierto (`#3DDC97` / `#00B8A9`) y franja coral para reintento (`#FF6B5B`), con botón "Continuar".
  - Split view en fase de cámara: Video guía en miniatura superior/lateral + Espejo de webcam con radar MediaPipe.
- [ ] **Step 2: Vincular `app/css/lesson.css` en `app/index.html`**
  - Añadir `<link rel="stylesheet" href="css/lesson.css">` en `<head>` respetando la Regla 2 (`AGENTS.md`).

---

### Task 3: Estructura HTML del Contenedor de Lección en `app/index.html`

**Files:**
- Modify: `app/index.html` (agregar contenedor `#lessonSessionModal`)
- Modify: `app/index.html` (agregar `<script src="js/lesson-session.js" defer></script>`)

**Interfaces:**
- Produces: Elemento `#lessonSessionModal` con submódulos:
  - `#lessonHeader`: Botón cerrar `✕`, barra `#lessonProgressBar`, contador de XP.
  - `#phaseDemoContainer`: Video grande en loop, descripción pedagógica y tip del zorrito tutor.
  - `#phaseQuizContainer`: Video sin texto de seña + grilla de 4 botones de opción `#quizOptionsGrid`.
  - `#phasePracticeContainer`: Video guía espejo + video de cámara web `#lessonCameraVideo` y canvas de tracking `#lessonLandmarkCanvas`.
  - `#lessonFeedbackSheet`: Franja inferior de retroalimentación con el zorrito feliz o de apoyo y botón `#btnLessonContinue`.
  - `#phaseSummaryContainer`: Pantalla de felicitación, confeti, XP ganada y botón de regreso a la ruta.

- [ ] **Step 1: Añadir marcado semántico accesible de la lección en `app/index.html`**
- [ ] **Step 2: Verificar que no haya estilos embebidos ni scripts inline** (Regla 2 `AGENTS.md`).

---

### Task 4: Integración con la Ruta Duolingo (`app/js/learning-plan-manager.js` y `app/js/main.js`)

**Files:**
- Modify: `app/js/learning-plan-manager.js`
- Modify: `app/js/main.js`

**Interfaces:**
- Consumes: `LessonSessionController.startLesson(signId, planContext)`.
- Produces: Cuando el usuario hace clic en un nodo de la ruta (`.duolingo-node` o "¡EMPEZAR!"), se lanza la lección interactiva de ese nodo.
- Al finalizar con éxito: Se llama a `LearningPlanManager.markSignCompleted(signId)` y se avanza la posición en la ruta.

- [ ] **Step 1: Modificar el listener de clic en los nodos de la ruta**
  - Reemplazar el salto directo al estudio por la invocación de `window.LessonSessionController.startLesson(signId, { planId, stepIndex })`.
- [ ] **Step 2: Conectar evento de lección completada**
  - Actualizar `masteredSigns` en el perfil, sumar XP (+50 XP), actualizar la racha y redibujar el mapa hexagonal con el nuevo nodo activo.

---

### Task 5: Pruebas E2E Automatizadas con Playwright y Verificación

**Files:**
- Create: `tests/test_interactive_lesson_flow.spec.js`

- [ ] **Step 1: Escribir test Playwright completo**
  - Abrir la ruta Duolingo en `http://localhost:8000/index.html?screen=path`.
  - Hacer clic en el nodo "¡EMPEZAR!" (seña `HOLA`).
  - Verificar que se abra la lección interactiva (Fase 1: Demostración).
  - Avanzar a Fase 2 (Pregunta tipo test): Probar selección de respuesta correcta y verificar feedback verde.
  - Avanzar a Fase 3 (Práctica con cámara): Simular acierto o avanzar a victoria.
  - Verificar que el resumen de la lección se muestre y al volver al mapa el nodo esté completado con check verde.
  - Validar cero errores en consola (`window.__consoleErrors == []`) y cero desbordamientos horizontales.
- [ ] **Step 2: Ejecutar test E2E y comprobar 100% PASS**
- [ ] **Step 3: Actualizar grafo de conocimiento Graphify**
  - Correr `python -m graphify extract . --code-only`.
- [ ] **Step 4: Commit en git**
