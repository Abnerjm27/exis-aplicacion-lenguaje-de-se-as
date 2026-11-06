# Task 3 Brief: Estructura HTML del Contenedor de Lección en `app/index.html`

## Objetivo
Agregar el contenedor HTML accesible de la lección `#lessonSessionModal` en `app/index.html`, junto con la importación de `css/lesson.css` y `js/lesson-session.js`.

## Restricciones Duras
- Cero estilos `<style>` y cero código inline `<script>`.
- Menos de 1,100 líneas en `app/index.html` (actualmente tiene 789 líneas; este modal añadirá ~90 líneas, quedando en ~880 líneas).
- Respetar todos los IDs y elementos existentes para no romper ninguna funcionalidad.

## Estructura Semántica Requerida
```html
<div id="lessonSessionModal" class="hidden fixed inset-0 z-50 modal-backdrop-blur flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true" aria-labelledby="lessonModalTitle">
  <div class="lesson-modal-card w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl relative">
    
    <!-- Header: Salir, Barra de Progreso y Vidas/Paso -->
    <header class="lesson-header px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-[#2A3B63] bg-[#14213D]/95">
      <button id="btnCloseLesson" class="text-slate-400 hover:text-white p-2 rounded-xl text-lg font-bold" aria-label="Salir de la lección">✕</button>
      <div class="flex-1 max-w-md mx-4">
        <div class="w-full h-3 rounded-full bg-[#1B2B4D] overflow-hidden border border-[#2A3B63]">
          <div id="lessonProgressBar" class="h-full bg-[#00B8A9] transition-all duration-300 w-1/3"></div>
        </div>
      </div>
      <div id="lessonPhaseBadge" class="text-xs font-mono font-bold text-[#FFC857] px-2.5 py-1 rounded-lg bg-[#FFC857]/15 border border-[#FFC857]/30">
        1/3 · MIRA
      </div>
    </header>

    <!-- Contenido Dinámico según la Fase -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center">
      <!-- Fase 1: Demostración -->
      <section id="phaseDemo" class="lesson-phase-pane flex flex-col items-center gap-4 w-full max-w-xl text-center">
        <!-- Video + Tips del Zorrito Tutor -->
      </section>

      <!-- Fase 2: Pregunta Tipo Test -->
      <section id="phaseQuiz" class="lesson-phase-pane hidden flex flex-col items-center gap-5 w-full max-w-2xl text-center">
        <!-- Video sin título + 4 Opciones de respuesta -->
      </section>

      <!-- Fase 3: Práctica con Cámara -->
      <section id="phasePractice" class="lesson-phase-pane hidden flex flex-col items-center gap-4 w-full max-w-3xl">
        <!-- Split view: Video espejo + Cámara con MediaPipe -->
      </section>

      <!-- Fase 4: Resumen de Victoria -->
      <section id="phaseSummary" class="lesson-phase-pane hidden flex flex-col items-center gap-4 w-full max-w-md text-center">
        <!-- Zorrito celebración + XP ganada + botón de continuar ruta -->
      </section>
    </main>

    <!-- Franja de Retroalimentación Inferior (Tipo Duolingo) -->
    <footer id="lessonFeedbackSheet" class="lesson-feedback-sheet hidden px-4 sm:px-8 py-4 border-t flex items-center justify-between gap-4">
      <!-- Feedback dinámico del zorrito + Botón Continuar -->
    </footer>

  </div>
</div>
```
