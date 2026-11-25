# Especificación de Diseño — División de Exámenes (Solo Cámara vs. Solo Adivinar Señas)

**Fecha:** 2026-11-20  
**Enfoque elegido:** Enfoque A — Selector previo de modalidad dentro de `#examSessionModal`

---

## 1. Propósito y Por qué
Actualmente `BlindExamController` mezcla en una sola sesión preguntas de cámara (`gesture`) y preguntas de opción múltiple (`quiz`) de forma alternada. Separar el examen en **dos modalidades puras** permite:
- **Solo Cámara (`camera`)**: evaluar producción motriz pura frente a la webcam sin distracciones ni pistas de video.
- **Solo Adivinar Señas (`quiz`)**: evaluar comprensión visual rápida viendo el video Real/Anime IA sin encender ni requerir webcam (ideal para móvil o práctica rápida).

---

## 2. Metas, No-Metas y Restricciones
- **Metas:**
  - Mostrar un selector previo con dos tarjetas claras dentro de `#examSessionModal` cuando el usuario pulse **Modo Examen** en el sidebar o cualquier **Checkpoint / Examen Final** en la ruta de aprendizaje.
  - Soportar parámetro opcional `mode: 'camera' | 'quiz'` en `BlindExamController.start(planOrSigns, secondsPerQuestion)` para iniciar directo sin mostrar el selector cuando se indique programáticamente.
  - En modo `quiz`, no solicitar permisos ni encender la cámara en ningún momento.
  - Mostrar la modalidad elegida en el encabezado y en el modal de resumen final.
- **No-Metas:**
  - No duplicar botones en el sidebar ni dividir los nodos del mapa estilo Duolingo.
  - No mantener el modo híbrido alternado como opción de UI (aunque `#loadQuestion` conserva ambos paneles `examPaneGesture` y `examPaneQuiz`).
- **Restricciones (`AGENTS.md`):**
  - POO estricta en JS (`#` privados, responsabilidad única, ciclo de vida).
  - Cero CSS/JS embebido en `app/index.html`; archivos `< 1,100` líneas.
  - Accesibilidad WCAG AAA: botones/tarjetas `>= 44px`, foco manejado, sin scroll horizontal en `390x844` ni `1280x850`.

---

## 3. Enfoques Evaluados
1. **Enfoque A (Elegido): Selector previo dentro de `#examSessionModal`.** Mantiene limpio el sidebar y el mapa de ruta; funciona igual para práctica libre y checkpoints; evita pedir cámara si se elige *Adivinar Señas*. Trade-off: 1 clic adicional antes de iniciar.
2. **Enfoque B (Descartado): Dos botones separados en sidebar + Checkpoints fijos.** Entrada en 1 clic desde sidebar, pero recarga la navegación móvil y bloquearía checkpoints fijos de cámara en dispositivos sin webcam.

---

## 4. Diseño de Componentes a Modificar
1. **`app/index.html` (`#examSessionModal`)**:
   - Agregar `<section id="examPaneModeSelect">` junto a `examPaneGesture` y `examPaneQuiz`, con el título del examen/plan y 2 tarjetas-botón (`#btnChooseCameraExam` y `#btnChooseQuizExam`, altura mínima `>= 44px`).
2. **`app/js/blind-exam-controller.js`**:
   - Añadir estado privado `#examMode` (`'camera' | 'quiz' | null`) y `#pendingExamConfig`.
   - En `start(planOrSigns, secondsPerQuestion)`:
     - Normalizar la lista de señas, título, tiempo y `returnView`.
     - Si `planOrSigns?.mode` es `'camera'` o `'quiz'`, llamar directo a `this.startWithMode(planOrSigns.mode)`.
     - Si no, abrir `#examSessionModal`, mostrar `examPaneModeSelect` (ocultando `examPaneGesture`, `examPaneQuiz`, el cronómetro y `examVideoModeToggle`) y esperar selección del usuario.
   - Nuevo método `startWithMode(mode)`:
     - Construye `#questions` con `type: mode === 'camera' ? 'gesture' : 'quiz'` para todas las señas.
     - Oculta `examPaneModeSelect`, restaura el cronómetro e inicia `#loadQuestion(0)`.
   - Al salir antes de elegir modalidad (`stopExam()`), restaurar el estado limpio sin registrar resultados parciales.
3. **`app/js/exam-ui-helper.js`**:
   - Incluir una etiqueta clara de la modalidad (`Solo Cámara` / `Adivinar Señas`) en el resumen final.
4. **Pruebas (`tests/test_blind_exam_arena_unit.js`)**:
   - Cubrir: apertura en pantalla de selección, inicio en modo `camera` (100% `gesture`), inicio en modo `quiz` (100% `quiz` sin activar cámara), y cancelación desde la pantalla de selección.
