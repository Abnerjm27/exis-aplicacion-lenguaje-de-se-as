# AGENTS.md — Reglas y Contexto Técnico para Agentes de IA (Proyecto EXIS)

Este documento es de **lectura obligatoria para cualquier Agente de IA** (Google Antigravity, Claude Code, Cursor, Copilot, etc.) que trabaje en este repositorio. Define la arquitectura, reglas duras, contexto de hardware y protocolo de colaboración en equipo.

---

## 1. Identidad y Misión del Proyecto
- **Proyecto:** Manitas (EXIS es el nombre del concurso) — Tutor Inteligente Interactivo para Lengua de Señas Colombiana (LSC).
- **Dataset Oficial:** LSC70 (Universidad Tecnológica de Pereira - UTP).
- **Paradigma de Visualización:** **Rama de Video Interactivo (HTML5 + WebP)**.
  *(Nota crítica: NO usar avatares 3D ni armaduras Three.js/VRoid; fueron descartados porque el rigging de dedos no logra la precisión anatómica requerida en lengua de señas).*
- **Stack Técnico:**
  - **Frontend:** HTML5 semántico, Tailwind CSS (CDN), CSS customizado con variables (`app/css/styles.css`), JavaScript modular nativo ES6+.
  - **Visión Artificial:** Google MediaPipe Hands (CDN) para tracking de 21 landmarks de mano en tiempo real (30 fps) vía webcam.
  - **Tutor Inteligente:** Ollama local con modelo `qwen2.5:3b` mediante proxy HTTP en `server.py` (`/api/chat`).
  - **Servidor:** Servidor Python `server.py` con mapeo MIME (`.mp4`, `.webp`, `.webm`) en puerto 8000.

---

## 2. Reglas Duras de Desarrollo (Hard Rules)

Cualquier cambio de código debe cumplir **estrictamente** con estas 9 reglas:

1. **Límite de Líneas:** Ningún archivo de código puede superar las **1,100 líneas**. Si un módulo crece, debe subdividirse en submódulos independientes.
2. **Cero CSS y Cero JS Embebido en HTML:** En [`app/index.html`](file:///app/index.html) está estrictamente prohibido usar etiquetas `<style>` o escribir código dentro de `<script>`. Solo se permiten referencias externas `<link rel="stylesheet">` y `<script src="...">`.
3. **Servidor y Puerto Único (8000):** La aplicación corre exclusivamente en `http://localhost:8000/`. Nunca cambiar a puertos alternos (8080, 8088, 8899) sin matar primero procesos huérfanos.
4. **Doble Salida Multimedia (MP4 + WebP):** Cada seña en `app/videos/real/` y `app/videos/anime/` debe tener archivo `.mp4` y su gemelo `.webp` animado a 25 fps continuo (2.0 segundos, 50 frames). Esto asegura 100% de reproducción cruzada si el navegador bloquea autoplay de video.
5. **Curaduría y Poda Temporal de Videos Anime IA (Calidad Pedagógica LSC):** Todo video generado con IA (Gemini Veo, Kling, Runway, etc.) debe ser inspeccionado fotograma a fotograma. Es obligatorio recortar fotogramas residuales, vacilaciones de inicio, mutaciones anatómicas tardías (ej. dedos que se doblan tras la seña) y artefactos en fondo, reteniendo exclusivamente el bucle canónico limpio y exacto para LSC (típicamente 2.5s a 4.0s / 60 a 96 frames a 24 fps).
6. **Accesibilidad y Contraste WCAG AAA:** Mantener la paleta oscuro/ámbar (`#0a0e17`, `#121824`, `#f59e0b`), tamaño de botones táctiles $\ge 44\text{px}$, y cero desbordamientos horizontales (`scrollWidth == clientWidth`) en 390x844 (móvil) y 1280x850 (escritorio).
7. **Verificación Visual Antes de Commit:** Antes de declarar una tarea como finalizada, el agente debe verificar que la app cargue sin errores en la consola (`window.__consoleErrors == []`).
8. **Paradigma de Programación Orientada a Objetos (POO) y Modularidad Estricta:** Todo el código del proyecto (tanto en frontend JavaScript como en backend/herramientas Python) debe adherirse rigurosamente a los principios de la Programación Orientada a Objetos:
   - **Cohesión y Modelado de Clases:** Encapsular entidades y servicios en clases ES6 (ej. `class TrajectoryTracker`, `class VideoPlayer`) o módulos/objetos bien estructurados con API pública explícita. Queda estrictamente prohibido el código procedural espagueti, las funciones huérfanas dispersas y los scripts planos sin estructura.
   - **Encapsulación y Estado Protegido:** El estado interno de los componentes debe permanecer protegido (mediante campos privados `#`, scopes de cierre o convención `_`), previniendo mutaciones arbitrarias del estado desde el exterior.
   - **Principio de Responsabilidad Única (SRP):** Cada clase o módulo debe tener una única razón de cambio. La visión artificial (`vision-evaluator.js`), la trayectoria guiada (`trajectory-tracker.js`), la reproducción multimedia (`video-player.js`) y la tutoría con LLM (`chat-tutor.js`) deben mantenerse desacopladas, comunicándose a través de contratos e interfaces estandarizadas.
   - **Ciclo de Vida Estandarizado:** Toda clase u objeto interactivo debe exponer métodos uniformes para su ciclo de vida (`init()`, `start()`, `update()`, `reset()`, `destroy()`).
   - **Extensibilidad y Polimorfismo:** Nuevos evaluadores, fuentes de video o modelos de tutoría deben crearse extendiendo clases base o mediante composición, evitando bloques monolíticos de `if/else` procedurales.
9. **Navegación Obligatoria por Grafo de Conocimiento (Graphify / GraphRAG):** Siempre que exista `graphify-out/graph.json`, el agente DEBE consultar el grafo antes de hacer lecturas masivas de código o búsquedas dispersas. Esto asegura una reducción de tokens del 94.5% (18.4x menos tokens), previene efectos colaterales en los *God Nodes* (`CameraDeviceManager`, `VisionEvaluator`, `VideoPlayer`, `LSCHandler`), garantiza 0 ciclos de importación y respeta las comunidades semánticas establecidas. Tras modificar código, se debe actualizar el grafo (`python -m graphify extract . --code-only`).

---

## 3. Especificación de Hardware y Optimización

### Máquina de Colaboración (Nodo 2):
- **CPU:** AMD Ryzen 7 7440 (8 núcleos, 16 hilos)
- **RAM:** 16 GB DDR5
- **GPU:** NVIDIA GeForce RTX 4050 Laptop (6 GB VRAM GDDR6)

### Recomendaciones para el Agente en esta Máquina:
- **Ollama en GPU:** La RTX 4050 cuenta con 6 GB de VRAM. El modelo `qwen2.5:3b` ocupa **~1.9 GB de VRAM**, lo cual permite que corra **100% offloaded en GPU** sin saturar la RAM del sistema. Alcanza entre 90 y 130 tokens/segundo.
- **MediaPipe Hands:** Se ejecuta con aceleración por hardware WebGL/WebGPU en Chrome/Edge, consumiendo menos del 5% de CPU.
- **Generación Local de Videos con OpenCV:** Los 8 núcleos de Ryzen 7 7440 permiten generar interpolaciones ópticas (`cv2.DISOpticalFlow`) a alta velocidad.

### Comandos de Instalación para el Agente / Terminal (Windows):
Si en la máquina del compañero falta alguna herramienta, el agente o usuario puede instalarla en 1 minuto vía PowerShell:
```powershell
# 1. Instalar Git y GitHub Desktop
winget install --id Git.Git -e
winget install --id GitHub.GitHubDesktop -e

# 2. Instalar Ollama y descargar el modelo del tutor LSC
winget install Ollama.Ollama -e
ollama pull qwen2.5:3b

# 3. Instalar Python (3.11+)
winget install Python.Python.3.11 -e

# 4. Probar que Ollama esté respondiendo en GPU
curl http://localhost:11434/api/tags
```

---

## 4. Protocolo de Colaboración en Pareja (Evitar Choques)

Para trabajar en pareja sin sobreescribirse cambios ni generar conflictos de merge (*merge conflicts*):

```mermaid
flowchart TD
    Main[Rama 'main' - Estable y Protegida] --> PullMain[git pull origin main]
    PullMain --> BranchAbner[feature/abner-modulo]
    PullMain --> BranchAmigo[feature/amigo-modulo]
    
    subgraph Dominio_Abner[Abner: Front & Videos]
        BranchAbner --> TaskAbner[app/videos/anime/ o video-player.js]
    end
    
    subgraph Dominio_Amigo[Amigo: Visión & Tutor]
        BranchAmigo --> TaskAmigo[vision-evaluator.js o server.py/Ollama]
    end
    
    TaskAbner --> PR_Abner[Pull Request a main]
    TaskAmigo --> PR_Amigo[Pull Request a main]
    PR_Abner --> Main
    PR_Amigo --> Main
```

### Reglas de Oro de Colaboración:
1. **Separación de Dominios por Módulo:**
   - **Desarrollador 1 (Abner):** Interfaz visual, estilos, catálogo de señas (`signs-data.js`), reproductor (`video-player.js`) y generación de clips Anime IA (`app/videos/anime/`).
   - **Desarrollador 2 (Amigo):** Evaluador de visión (`vision-evaluator.js`), precisión angular de MediaPipe, backend / tutor de Ollama (`server.py`, `chat-tutor.js`).
2. **Ciclo de Trabajo Git:**
   - Nunca hacer commits directos sobre `main`.
   - Crear rama de trabajo: `git checkout -b feature/<nombre>-<tarea>`
   - Antes de iniciar el día: `git checkout main && git pull origin main`
   - Al terminar una función: probar localmente en `http://localhost:8000/`, verificar 0 errores y hacer push a su rama.
3. **Dataset pesado (`LSC70/` y `LSC70.zip`):**
   - El dataset original de 1 GB está en `.gitignore`.
   - Todos los videos procesados y las muestras necesarias ya están incluidos en `app/videos/` y `app/dataset_samples/`, por lo que el repositorio clona en segundos (< 35 MB) y corre inmediatamente sin instalaciones complejas.

---

## 5. Estructura de Directorios

```text
exis-lenguaje-senas/
├── AGENTS.md                  # Reglas duras (8 reglas) y contexto para agentes IA
├── README.md                  # Documentación de instalación y uso
├── server.py                  # Servidor HTTP + Proxy Ollama (puerto 8000, POO)
├── iniciar_aplicacion.bat     # Lanzador de 1-clic para Windows
├── .gitignore                 # Exclusión de dataset pesado, renders y temporales
├── requirements.txt           # Dependencias Python
├── package.json               # Configuración de pruebas automatizadas
├── app/
│   ├── index.html             # UI accesible (0 estilos/scripts en línea)
│   ├── css/
│   │   └── styles.css         # Tokens de diseño oscuro/ámbar y responsive
│   ├── js/
│   │   ├── signs-data.js      # Diccionario de 11 señas oficiales
│   │   ├── video-player.js    # Reproductor HTML5 + WebP fallback (POO/Módulo)
│   │   ├── vision-evaluator.js# MediaPipe Hands y lógica de acierto (POO/Módulo)
│   │   ├── trajectory-tracker.js # Seguimiento de trayectorias (Clase POO)
│   │   ├── chat-tutor.js      # Chat con Ollama y voz (POO/Módulo)
│   │   └── main.js            # Orquestación de eventos de la app
│   ├── dataset_samples/       # Fotos clave de referencia LSC70
│   ├── videos/
│   │   ├── real/              # 44 videos (MP4 + WebP) de persona real
│   │   └── anime/             # Destino para videos curados con IA
│   └── tools/                 # Scripts activos de generación, curaduría y verificación
│       └── legacy_processors/ # Histórico de scripts procedimentales iniciales
├── referencias_para_gemini/
│   ├── anime_character_render.png # Render canónico del personaje anime
│   ├── fotos/                 # 11 fotogramas clave de máxima expresión
│   └── PROMPTS_GEMINI.md      # Prompts bilingües para Gemini Web / Veo
└── tests/                     # Pruebas automatizadas Playwright y capturas
```

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
