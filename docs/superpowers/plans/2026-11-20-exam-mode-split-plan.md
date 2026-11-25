# Plan de Implementación — División de Exámenes (Solo Cámara vs. Solo Adivinar Señas) y Corrección `AÑOS` en Ruta

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dividir el examen en dos modalidades independientes (`Solo Cámara` y `Solo Adivinar Señas`) mediante un selector previo dentro de `#examSessionModal`, y corregir la etiqueta `ANNOS` a `AÑOS` en el árbol de ruta de aprendizaje.

**Architecture:** `BlindExamController.start()` prepara la sesión pendiente y abre `#examPaneModeSelect` (salvo que reciba `mode: 'camera' | 'quiz'` explícito). Al elegir modalidad, `startWithMode(mode)` genera todas las preguntas del tipo elegido (`gesture` o `quiz`), oculta el selector y arranca el examen. `LearningPlanManager` resuelve el nombre legible desde `SIGNS_DATA` para mostrar `AÑOS` en la ruta manteniendo `ANNOS` como ID técnico.

**Tech Stack:** HTML5, Tailwind CSS (CDN), JavaScript ES6+ POO estricto, Node.js assert tests (`npm test`).

**Spec:** `docs/superpowers/specs/2026-11-20-exam-mode-split-design.md`

---

## Global Constraints
- POO estricta en `app/js/*.js` (campos `#` privados, métodos de ciclo de vida `init`, `start`, `update`, `reset`, `destroy`).
- Cero `<style>` o `<script>` en línea en `app/index.html`.
- Ningún archivo de código debe superar 1,100 líneas.
- Botones interactivos `>= 44px`, contraste WCAG AAA oscuro/ámbar/claro, cero scroll horizontal en `390x844` y `1280x850`.
- Actualizar `graphify` (`python -m graphify update .`) y verificar `npm test` en verde antes de finalizar.

---

### Task 1: Mostrar `AÑOS` (y nombres legibles) en los nodos de la ruta (`app/js/learning-plan-manager.js`)
- [ ] Agregar método privado `#getSignDisplayName(signId)` en `LearningPlanManager` que consulte `window.SIGNS_DATA` (`words` + `letters`) con fallback `'ANNOS' -> 'AÑOS'`.
- [ ] Usar `#getSignDisplayName(signId)` en etiqueta visible del nodo, `title`, `aria-label` y mensaje `#showLockedFeedback`, manteniendo intactos `id="hex-node-${signId}"` y `data-sign-id="${signId}"`.
- [ ] Verificar con prueba rápida / `npm test`.

### Task 2: UI del selector previo de modalidad en `app/index.html`
- [ ] Dentro de `#examSessionModal`, añadir `<section id="examPaneModeSelect">` antes de `#examPaneGesture` con:
  - Título del examen (`#examModeSelectTitle`) y subtítulo con cantidad de señas/tiempo (`#examModeSelectMeta`).
  - Dos tarjetas-botón accesibles (`>= 44px`):
    - `#btnChooseCameraExam` ("Solo Cámara" — evalúa tu ejecución frente a la webcam).
    - `#btnChooseQuizExam` ("Adivinar Señas" — identifica el video sin usar cámara).
  - Botón secundario `#btnExamExitModeSelect` ("Cancelar").
- [ ] Envolver el badge del cronómetro con `id="examTimerBadge"` para ocultarlo limpiamente mientras el usuario está en `#examPaneModeSelect`.

### Task 3: Lógica POO de modalidades en `app/js/blind-exam-controller.js` y `app/js/exam-ui-helper.js`
- [ ] Añadir `#examMode`, `#pendingExamConfig` y método público `startWithMode(mode)` + `getExamMode()` en `BlindExamController`.
- [ ] Actualizar `start(planOrSigns, secondsPerQuestion)`:
  - Preparar `signsList`, `title`, `difficultyLevel`, `secondsPerQuestion`, `returnView`.
  - Si `planOrSigns?.mode` es `'camera'` o `'quiz'`, llamar directo a `this.startWithMode(planOrSigns.mode)`.
  - Si no, abrir `#examSessionModal` mostrando `#examPaneModeSelect`, ocultando `#examPaneGesture`, `#examPaneQuiz`, `#examTimerBadge` y `#examVideoModeToggle`, sin encender cámara ni iniciar cronómetro.
- [ ] En `#bindUIEvents()`, conectar `#btnChooseCameraExam`, `#btnChooseQuizExam` y `#btnExamExitModeSelect`.
- [ ] En `ExamUIHelper.buildSummaryHtml` (o método equivalente en `exam-ui-helper.js`), mostrar la etiqueta de modalidad (`Solo Cámara` / `Adivinar Señas`).

### Task 4: Actualizar pruebas unitarias (`tests/test_blind_exam_arena_unit.js`) y verificar todo
- [ ] Actualizar `tests/test_blind_exam_arena_unit.js` para probar:
  1. `start()` sin `mode` abre `#examPaneModeSelect` sin iniciar cámara ni timer.
  2. Elegir `#btnChooseCameraExam` / `startWithMode('camera')` genera 100% preguntas `'gesture'`.
  3. Elegir `#btnChooseQuizExam` / `startWithMode('quiz')` genera 100% preguntas `'quiz'` con cámara apagada.
  4. Cancelar desde `#btnExamExitModeSelect` cierra limpiamente.
  5. Resumen final refleja la modalidad elegida.
- [ ] Ejecutar `npm test`, verificar conteo de líneas (`< 1,100`) y actualizar grafo con `python -m graphify update .`.
