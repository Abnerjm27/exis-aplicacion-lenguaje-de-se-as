# 🤟 EXIS · Tutor Interactivo de Lengua de Señas Colombiana (LSC)

Aplicación web educativa interactiva basada en el dataset oficial **LSC70** (Universidad Tecnológica de Pereira), diseñada para la enseñanza y práctica de la Lengua de Señas Colombiana con **Demostración en Video**, **Evaluación Anatómica en Tiempo Real por Visión Artificial** y **Tutor Inteligente con IA Local**.

![Vista Previa de la Aplicación](app_preview_desktop_1280.png)

---

## 🌟 Características Principales

1. **Reproductor de Video Interactivo Pedagógico:**
   - Visualización fluida a **25 fps** en bucle continuo de personas reales ejecutando las señas.
   - **Vista Dual:** Alternancia instantánea entre *Vista Cuerpo Completo* y *Primer Plano Mano* (zoom enfocado en dedos y articulaciones).
   - **Control de Velocidad:** `0.5x Lento` para análisis paso a paso y `1.0x Normal`.
   - **Modo Híbrido:** Botón para alternar entre *Persona Real LSC* y *Anime IA* (con degradación elegante a video real si el clip anime está en preparación).
   - **Máxima Compatibilidad:** Salida sincronizada en video HTML5 MP4 y gemelos WebP animados.

2. **Evaluador en Vivo por Cámara Web (MediaPipe Hands):**
   - Rastreo en tiempo real de 21 puntos clave por mano.
   - Comparación angular y geométrica de la postura del estudiante contra la seña objetivo.
   - Barra de similitud en vivo (0% - 100%) y felicitación automática con confeti y síntesis de voz al alcanzar la meta.

3. **Tutor Inteligente Local con IA (Ollama):**
   - Asistente conversacional pedagógico impulsado por **Ollama** con el modelo `qwen2.5:3b`.
   - Sincronización bidireccional: Si le dices *"Quiero aprender DÍAS"* o *"Enséñame la letra B"*, el reproductor y la cámara cambian automáticamente a esa seña.
   - Funciona 100% offline sin necesidad de enviar datos a servidores externos.

---

## 🗂️ Catálogo de Señas Disponibles

| Categoría | Señas Incluidas |
| :--- | :--- |
| **Palabras LSC** | `HOLA`, `YO`, `BUENOS`, `DIAS`, `NOCHES`, `NOMBRE` |
| **Alfabeto Dactilológico** | Letras `A`, `B`, `C`, `L`, `V` |

---

## 🚀 Guía de Instalación Rápida (Para ti y tu compañero)

### 1. Requisitos Previos
- **Sistema Operativo:** Windows 10 / 11.
- **Python 3.10 o superior:** [python.org](https://www.python.org/)
- **Ollama (Para el Tutor IA):** [ollama.com](https://ollama.com/)
- **Navegador Web:** Google Chrome, Microsoft Edge o Brave con acceso a webcam.

### 2. Puesta en Marcha en 3 Pasos
1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd exis-lenguaje-senas
   ```

2. **Instalar el modelo de IA en Ollama:**
   Abre una terminal y ejecuta:
   ```bash
   ollama pull qwen2.5:3b
   ```
   *(En computadores con GPU como la NVIDIA RTX 4050, este modelo corre a más de 100 tokens/segundo consumiendo menos de 2 GB de VRAM).*

3. **Iniciar la aplicación:**
   Haz doble clic en:
   ```text
   iniciar_aplicacion.bat
   ```
   O desde la terminal:
   ```bash
   python server.py
   ```
   Abre tu navegador en: **`http://localhost:8000/`**

---

## 👥 Guía de Colaboración en Pareja (Git Workflow)

Para colaborar sin generar conflictos de código (*merge conflicts*):

1. **Ramas de Trabajo:**
   - La rama `main` contiene el código funcional y verificado.
   - Cada desarrollador debe trabajar en su propia rama:
     ```bash
     # Para Abner:
     git checkout -b feature/abner-<tarea>

     # Para tu compañero:
     git checkout -b feature/amigo-<tarea>
     ```
2. **Sincronización:**
   Antes de empezar a trabajar cada día, actualiza tu copia local con:
   ```bash
   git checkout main
   git pull origin main
   ```
3. **División de Responsabilidades:**
   - Consulta el archivo [`AGENTS.md`](file:///AGENTS.md) para ver la separación de módulos y las 6 reglas duras del proyecto (archivos < 1,100 líneas, cero CSS/JS embebido en HTML, puerto 8000).

---

## 🎨 Generación de Videos Anime IA (Gemini / Kling / Runway)

En la carpeta [`referencias_para_gemini/`](file:///referencias_para_gemini/) encontrarás:
- `fotos/`: Fotogramas clave de máxima expresión de las 11 señas.
- [`PROMPTS_GEMINI.md`](file:///referencias_para_gemini/PROMPTS_GEMINI.md): Prompts listos para copiar y pegar en [gemini.google.com](https://gemini.google.com).
- Para integrar un nuevo video anime generado, simplemente guarda el archivo en:
  `app/videos/anime/<SEÑA>_body.mp4`

---

## 📄 Créditos y Licencia
- **Proyecto:** EXIS — Tutor Inteligente de Lengua de Señas Colombiana.
- **Dataset:** LSC70 (Universidad Tecnológica de Pereira).
- **Visión Artificial:** Google MediaPipe Hands.
- **Modelo de Lenguaje:** Qwen 2.5 3B vía Ollama.
