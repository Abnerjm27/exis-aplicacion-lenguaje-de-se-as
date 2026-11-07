with open('app/index.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('\r\n', '\n')

# 1. Link tokens.css
link_old = """  <!-- Estilos Externos (Sin estilos embebidos) -->
  <link rel="stylesheet" href="css/styles.css?v=20261102_v1">"""

link_new = """  <!-- Tokens de Diseño Manitas e Impeccable -->
  <link rel="stylesheet" href="css/tokens.css?v=20261107">

  <!-- Estilos Externos (Sin estilos embebidos) -->
  <link rel="stylesheet" href="css/styles.css?v=20261102_v1">"""

if link_old in c:
    c = c.replace(link_old, link_new)

# 2. Top navbar Tutor IA button
chat_btn_old = """        <!-- Botón Tutor IA -->
        <button id="btnToggleChat" class="btn-spring flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm" aria-label="Abrir Tutor Virtual">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="hidden xs:inline">Tutor IA</span>
          <span class="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" aria-hidden="true"></span>
        </button>"""

chat_btn_new = """        <!-- Botón Tutor IA con Mascota Zorrito -->
        <button id="btnToggleChat" class="btn-spring flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm" aria-label="Abrir Tutor Virtual Sol IA">
          <img src="img/zorrito/svg/zorrito_saludo.svg" alt="" class="w-5 h-5 shrink-0 object-contain drop-shadow-sm">
          <span class="hidden xs:inline">Sol IA</span>
          <span class="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" aria-hidden="true"></span>
        </button>"""

if chat_btn_old in c:
    c = c.replace(chat_btn_old, chat_btn_new)

# 3. Chat Drawer Header
drawer_header_old = """          <div class="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100">Tutor Virtual LSC</h3>
            <p class="text-[10px] text-emerald-400 font-mono">Conectado a Ollama (qwen2.5:3b)</p>
          </div>"""

drawer_header_new = """          <div class="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 p-1">
            <img src="img/zorrito/svg/zorrito_explicando.svg" alt="Zorrito Sol IA" class="w-full h-full object-contain anim-float">
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-100 flex items-center gap-1.5">
              <span>Zorrito Sol IA</span>
              <span class="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">Tutor LSC</span>
            </h3>
            <p class="text-[10px] text-emerald-400 font-mono">En vivo · Ollama qwen2.5:3b</p>
          </div>"""

if drawer_header_old in c:
    c = c.replace(drawer_header_old, drawer_header_new)

# 4. Blind Exam Overlay mascot
exam_shield_old = """            <div class="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-2 shadow-lg shadow-rose-500/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>"""

exam_shield_new = """            <div class="flex items-center gap-3 mb-2">
              <img src="img/zorrito/svg/zorrito_pensando.svg" alt="Zorrito pensando" class="w-14 h-14 object-contain drop-shadow-lg anim-pulse">
              <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
            </div>"""

if exam_shield_old in c:
    c = c.replace(exam_shield_old, exam_shield_new)

# 5. Exam Summary Modal
exam_modal_old = """      <div class="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 mx-auto shadow-lg shadow-amber-500/30">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="7"></circle>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
        </svg>
      </div>"""

exam_modal_new = """      <div class="flex flex-col items-center justify-center">
        <img src="img/zorrito/svg/zorrito_celebracion.svg" alt="Zorrito celebrando" class="w-20 h-20 object-contain drop-shadow-xl anim-bounce">
      </div>"""

if exam_modal_old in c:
    c = c.replace(exam_modal_old, exam_modal_new)

with open('app/index.html', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS: index.html enriched with tokens.css and mascot integration!")
