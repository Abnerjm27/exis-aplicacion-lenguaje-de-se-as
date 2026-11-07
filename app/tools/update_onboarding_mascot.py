import os

path = 'app/onboarding.html'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('\r\n', '\n')

# Step 1
old1 = """      <!-- PASO 1: ¿Cuánto sabes de Lengua de Señas Colombiana? -->
      <div id="quizStep1" class="quiz-step-pane flex flex-col gap-4">
        <div>
          <h3 id="quizModalTitle" class="text-xl sm:text-2xl font-extrabold text-white">¿Cuánto sabes actualmente de Lengua de Señas (LSC)?</h3>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">Sol IA ajustará la dificultad y el punto de partida de tu ruta.</p>
        </div>"""

new1 = """      <!-- PASO 1: ¿Cuánto sabes de Lengua de Señas Colombiana? -->
      <div id="quizStep1" class="quiz-step-pane flex flex-col gap-4">
        <div class="flex items-center gap-3.5">
          <img src="img/zorrito/svg/zorrito_pensando.svg" alt="Zorrito Pensando" class="w-14 h-14 shrink-0 drop-shadow-md">
          <div>
            <h3 id="quizModalTitle" class="text-xl sm:text-2xl font-extrabold text-white">¿Cuánto sabes de LSC?</h3>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">El zorrito tutor adaptará la dificultad a tu nivel.</p>
          </div>
        </div>"""

# Step 2
old2 = """      <!-- PASO 2: ¿Por qué quieres aprender LSC? -->
      <div id="quizStep2" class="quiz-step-pane hidden flex-col gap-4">
        <div>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white">¿Cuál es tu enfoque principal de aprendizaje?</h3>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">Priorizaremos las unidades que más te sirvan desde el primer día.</p>
        </div>"""

new2 = """      <!-- PASO 2: ¿Por qué quieres aprender LSC? -->
      <div id="quizStep2" class="quiz-step-pane hidden flex-col gap-4">
        <div class="flex items-center gap-3.5">
          <img src="img/zorrito/svg/zorrito_explicando.svg" alt="Zorrito Tutor" class="w-14 h-14 shrink-0 drop-shadow-md">
          <div>
            <h3 class="text-xl sm:text-2xl font-extrabold text-white">¿Cuál es tu enfoque principal?</h3>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">Priorizaremos las unidades que más te sirvan desde el primer día.</p>
          </div>
        </div>"""

# Step 3
old3 = """      <!-- PASO 3: Meta Diaria y Personalización con Sol IA -->
      <div id="quizStep3" class="quiz-step-pane hidden flex-col gap-4">
        <div>
          <h3 class="text-xl sm:text-2xl font-extrabold text-white">¡Todo listo! ¿Cuánto tiempo quieres practicar al día?</h3>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">También puedes escribirle a Sol IA si deseas un plan especial.</p>
        </div>"""

new3 = """      <!-- PASO 3: Meta Diaria y Personalización con Sol IA -->
      <div id="quizStep3" class="quiz-step-pane hidden flex-col gap-4">
        <div class="flex items-center gap-3.5">
          <img src="img/zorrito/svg/zorrito_pulgar.svg" alt="Zorrito Ánimo" class="w-14 h-14 shrink-0 drop-shadow-md">
          <div>
            <h3 class="text-xl sm:text-2xl font-extrabold text-white">¡Todo listo! ¿Cuánto tiempo al día?</h3>
            <p class="text-xs sm:text-sm text-slate-400 mt-0.5">El zorrito te acompañará y registrará tus rachas de estudio.</p>
          </div>
        </div>"""

assert old1 in c, "old1 not found"
assert old2 in c, "old2 not found"
assert old3 in c, "old3 not found"

c = c.replace(old1, new1)
c = c.replace(old2, new2)
c = c.replace(old3, new3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS: Onboarding steps enriched with mascot SVGs!")
