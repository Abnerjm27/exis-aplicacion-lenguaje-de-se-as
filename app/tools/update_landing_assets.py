with open('app/landing.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('\r\n', '\n')

# 1. Add floating mascot in Hero
hero_old = """            <!-- Tarjeta Flotante Inferior -->
            <div class="floating-hud-Tag bottom-3 left-3 right-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true"></span>
                <span class="text-xs font-bold text-white">Sol · Arquitecta de Rutas LSC</span>
              </div>
              <span class="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">IA Activa</span>
            </div>
          </div>

        </div>"""

hero_new = """            <!-- Tarjeta Flotante Inferior -->
            <div class="floating-hud-Tag bottom-3 left-3 right-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true"></span>
                <span class="text-xs font-bold text-white">Sol · Arquitecta de Rutas LSC</span>
              </div>
              <span class="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">IA Activa</span>
            </div>
          </div>

          <!-- Mascota Zorrito Tutor Flotante -->
          <div class="absolute -bottom-6 -left-3 sm:-bottom-7 sm:-left-5 z-20 flex items-center gap-3 bg-[#1B2B4D]/95 backdrop-blur-md border border-[#00B8A9]/50 p-2.5 sm:p-3 pr-4 rounded-2xl shadow-2xl">
            <img src="img/zorrito/svg/zorrito_saludo.svg" alt="Zorrito tutor de Manitas saludando" class="w-12 h-12 sm:w-14 sm:h-14 object-contain shrink-0 anim-wave">
            <div>
              <span class="text-[10px] font-bold text-[#FFC857] uppercase tracking-wider block">¡Hola, bienvenido!</span>
              <p class="text-xs font-extrabold text-white leading-tight">Tu tutor personal de LSC</p>
            </div>
          </div>

        </div>"""

assert hero_old in c, "hero_old not found"
c = c.replace(hero_old, hero_new)

# 2. Add mascot pose thumbnails in Scrollytelling Chapters
ch1_old = """            <h3 class="text-lg sm:text-xl font-extrabold text-white">Cuestionario Inteligente + Rutas Estilo Duolingo</h3>"""
ch1_new = """            <div class="flex items-center gap-3">
              <img src="img/zorrito/svg/zorrito_pensando.svg" alt="" class="w-9 h-9 shrink-0 drop-shadow">
              <h3 class="text-lg sm:text-xl font-extrabold text-white">Cuestionario Inteligente + Rutas Estilo Duolingo</h3>
            </div>"""
assert ch1_old in c, "ch1_old not found"
c = c.replace(ch1_old, ch1_new)

ch2_old = """            <h3 class="text-lg sm:text-xl font-extrabold text-white">Espejo Biomecánico y Video Dual (Real + Anime)</h3>"""
ch2_new = """            <div class="flex items-center gap-3">
              <img src="img/zorrito/svg/zorrito_explicando.svg" alt="" class="w-9 h-9 shrink-0 drop-shadow">
              <h3 class="text-lg sm:text-xl font-extrabold text-white">Espejo Biomecánico y Video Dual (Real + Anime)</h3>
            </div>"""
assert ch2_old in c, "ch2_old not found"
c = c.replace(ch2_old, ch2_new)

ch3_old = """            <h3 class="text-lg sm:text-xl font-extrabold text-white">Modo Examen Sin Video para Comprobar tu Memoria</h3>"""
ch3_new = """            <div class="flex items-center gap-3">
              <img src="img/zorrito/svg/zorrito_celebracion.svg" alt="" class="w-9 h-9 shrink-0 drop-shadow">
              <h3 class="text-lg sm:text-xl font-extrabold text-white">Modo Examen Sin Video para Comprobar tu Memoria</h3>
            </div>"""
assert ch3_old in c, "ch3_old not found"
c = c.replace(ch3_old, ch3_new)

# 3. Final CTA fox
cta_old = """<img src="img/manitas-fox.jpg" alt="Zorro mascota de Manitas haciendo una seña" class="auth-fox">"""
cta_new = """<img src="img/zorrito/svg/zorrito_celebracion.svg" alt="Zorrito tutor de Manitas celebrando victoria con aplauso sordo" class="auth-fox w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto anim-bounce">"""
assert cta_old in c, "cta_old not found"
c = c.replace(cta_old, cta_new)

with open('app/landing.html', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS: landing.html enriched with mascot and typography!")
