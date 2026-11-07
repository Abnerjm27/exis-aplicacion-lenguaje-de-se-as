# Task 1 Brief: Controlador POO de la Sesión de Lección (`app/js/lesson-session.js`)

## Objetivo
Implementar la clase ES6 `LessonSessionController` en `app/js/lesson-session.js` con estado encapsulado (`#`) y ciclo de vida estandarizado (`init(options)`, `startLesson(signId, planContext)`, `nextPhase()`, `reset()`, `destroy()`), expuesta en `window.LessonSessionController`.

## Reglas Obligatorias (AGENTS.md)
1. Código estricto POO ES6: campos privados `#`, métodos de ciclo de vida (`init`, `start`, `update`, `reset`, `destroy`).
2. Menos de 1,100 líneas.
3. Cero estilos o scripts embebidos.
4. Integración con `SIGNS_DATA` (global de `app/js/signs-data.js`).

## Lógica y Fases de la Lección
- `startLesson(signId, planContext)`:
  - Inicializa la lección para la seña indicada.
  - Genera 4 opciones para la fase de test: 1 correcta (`signId`) + 3 distractores aleatorios de `SIGNS_DATA` (de la misma categoría si es posible, o del catálogo general).
  - Configura la fase inicial: `'demo'`.
- Fases soportadas:
  1. `'demo'`: Muestra video en loop + tarjeta del zorrito tutor con `desc` y `tip` de `signs-data.js`.
  2. `'quiz'`: Oculta el título de la seña. Muestra video y las 4 opciones de respuesta.
     - Método `submitQuizAnswer(selectedSignId)`: Comprueba si `selectedSignId === currentSignId`. Si acierta, activa feedback positivo (`#lessonFeedbackSheet.is-correct`), sonido/confeti y botón "Continuar". Si falla, activa feedback correctivo (`#lessonFeedbackSheet.is-incorrect`).
  3. `'practice'`: Muestra video guía como espejo + activa webcam con MediaPipe Hands.
     - Escucha la coincidencia de `VisionEvaluator`. Si la similitud supera 85% durante 1.2 segundos consecutivos, marca la práctica como completada con éxito.
  4. `'summary'`: Calcula el resultado, suma XP (+50 XP), actualiza `masteredSigns` en `AuthProfileManager`, y notifica a `LearningPlanManager` para actualizar el mapa.
- Eventos / Callbacks en `options`:
  - `onPhaseChange(phase, state)`
  - `onLessonComplete(summary)`
  - `onExit()`

## Pruebas
Crear `tests/test_lesson_session_unit.js` que pruebe en Node.js (con DOM simulado o mock de window) la inicialización, la generación de distractores sin duplicados, el avance de fases, la validación de respuestas y el ciclo de vida.
Reportar los resultados en `.superpowers/sdd/2026-11-06-interactive-lesson-quiz/task-1-report.md`.
