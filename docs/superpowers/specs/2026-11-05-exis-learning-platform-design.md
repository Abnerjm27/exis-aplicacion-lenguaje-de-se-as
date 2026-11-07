# Especificación de Diseño — EXIS Plataforma de Aprendizaje LSC, Rutas IA y Modo Examen Sin Video

**Fecha:** 2026-11-05
**Autor:** Antigravity (Diseño para ejecución de Flash)
**Estado:** Pendiente de aprobación del usuario antes de generar el plan paso a paso (`writing-plans`)

---

## 1. Intención y Propósito (The Why)

Transformar **EXIS** de un practicador aislado de señas en una **Academia Interactiva Completa de Lengua de Señas Colombiana (LSC)** impulsada por Visión Artificial (MediaPipe Hands) e Inteligencia Artificial Local (`qwen2.5:3b` en Ollama).

El usuario debe poder:
1. **Crear su cuenta o iniciar sesión** (con perfiles persistentes para llevar su racha, nivel de XP, señas dominadas y planes guardados).
2. **Aprender con Planes Estructurados o Creados a Medida:**
   - **Plan IA "Desde Cero" (`qwen2.5:3b`):** Si el usuario no sabe nada o pide ayuda en lenguaje natural (*"No sé nada, enséñame lo básico"* o *"Quiero aprender a presentarme"*), la IA local diseña un plan pedagógico progresivo con las 20 señas oficiales del catálogo LSC70.
   - **Planes Predefinidos:** *Dominio del Abecedario Dactilológico* (`A, B, C, D, E, I, L, O, U, V`) y *Palabras y Saludos LSC* (`HOLA, YO, BUENOS, DIAS, TARDES, NOCHES, GUSTAR, NOMBRE, ANNOS, LICOR`).
   - **Constructor de Plan Propio:** El usuario elige libremente qué señas quiere practicar y en qué orden.
3. **Visualizar su Ruta en un Mapa Hexagonal Interactivo (Skill Tree):** Conectado en tiempo real con la Cabina de Práctica (Video + Cámara).
4. **Ponerse a Prueba en el "Modo Examen Sin Video" (Evaluación Ciega):** Un modo de certificación donde **el reproductor de video de demostración y las pistas visuales se ocultan**, mostrándole únicamente el reto (*"Realiza la seña: BUENOS"* o una secuencia de examen) y un cronómetro por seña para comprobar con la cámara web si realmente memorizó y aprendió la seña sin copiar el video.

---

## 2. Metas, No-Metas y Anti-Metas

### Metas (Goals)
- **Interfaz Híbrida de 3 Zonas (Fusión Bento + Mapa Hexagonal + Cabina Cyber-Academy):**
  - **Zona Perfil & Progreso:** Tarjeta de usuario (Login/Registro/Cambio rápido), barra de XP, racha diaria y progreso de maestría.
  - **Zona Arquitecta IA ("Sol") + Mapa Hexagonal de Ruta:** Input conversacional para crear rutas con `qwen2.5:3b`, selector manual de señas y visualización de nodos hexagonales conectados (`SVG` + `CSS`).
  - **Zona Cabina de Práctica / Modo Examen:** El escenario dual (Video Interactivo + Webcam HUD) que alterna entre **Modo Aprendizaje** (con video guía) y **Modo Examen Sin Video** (video oculto bajo escudo de evaluación ciega + puntaje final).
- **Cumplimiento impecable de las 9 Reglas Duras (`AGENTS.md`):**
  - Ningún archivo supera las **1,100 líneas**.
  - **Cero `<style>` y cero `<script>` inline** en `app/index.html`.
  - Puerto único `8000` en `server.py`.
  - Paleta oscuro/ámbar WCAG AAA (`#0a0e17`, `#121824`, `#f59e0b`), botones $\ge 44\text{px}$, cero desbordamiento horizontal (`scrollWidth == clientWidth`) en `390x844` y `1280x850`.
  - **POO Estricta (Clases ES6 con estado privado `#` o `_` y ciclo de vida `init()`, `start()`, `update()`, `reset()`, `destroy()`).**

### No-Metas (Non-Goals)
- No usar avatares 3D ni librerías externas pesadas por CDN (todo sigue funcionando 100% offline/local con Tailwind local y MediaPipe local).
- No requerir servidores de bases de datos externos (PostgreSQL/Firebase); toda la persistencia vive en `server.py` (`app/data/users_db.json`) sincronizada con `localStorage`.

### Anti-Metas (Anti-Goals — Qué haría fallar el diseño aunque funcione)
- **Violaciones de `impeccable` (`craft-floor.md`):**
  - Prohibido usar emojis como iconos del sistema en los nuevos componentes (usar SVGs limpios con `stroke-width` consistente).
  - Prohibido texto en gradiente, sombras duras sin difuminado o `border-left` gruesos de colores.
  - Prohibido usar "eyebrows/kickers" redundantes encima de cada título.
- **Violaciones de `Emil Kowalski / motion-doctrine`:**
  - Prohibido animar `width`, `height`, `top` o `left` provocando *layout thrashing*.
  - Todas las transiciones de interfaz (abrir modal de Login, activar Modo Examen, desbloquear nodo hexagonal) deben usar `transform` y `opacity` con curva de desaceleración natural `cubic-bezier(0.16, 1, 0.3, 1)` (150ms–300ms) y soporte obligatorio para `@media (prefers-reduced-motion: reduce)`.
- **Romper selectores existentes:** Todos los IDs actuales (`#signList`, `#catWordsBtn`, `#catLettersBtn`, `#btnToggleChat`, `#btnStartCam`, `#mainVideo`, `#outputCanvas`, etc.) deben conservarse intactos para que ninguna prueba Playwright existente se rompa.

---

## 3. Enfoques Evaluados (Approaches)

| Enfoque | Descripción | Ventajas / Desventajas | Decisión |
|---|---|---|---|
| **Enfoque A: SPA Modular POO con Persistencia Híbrida (Seleccionado)** | Extiende `app/index.html` con un sistema de vistas/paneles sin recargar la página, respaldado por 3 nuevas clases ES6 (`AuthProfileManager`, `LearningPlanManager`, `BlindExamController`) y endpoints REST en `server.py` (`/api/auth`, `/api/plan`). | **Ventaja:** No reinicia MediaPipe ni la cámara web al cambiar entre creación de plan, práctica guiada y examen sin video. Cumple el límite de líneas dividiendo responsabilidades en módulos pequeños. | **ELEGIDO** |
| **Enfoque B: Múltiples Páginas HTML (`login.html`, `plans.html`, `exam.html`)** | Separar cada flujo en documentos HTML distintos. | **Desventaja:** Recarga los 15 MB de MediaPipe WASM en cada clic y corta el stream de cámara web. | Descartado |

---

## 4. Arquitectura de Componentes y Módulos (POO)

Para respetar el límite de **1,100 líneas por archivo** y el principio de **Responsabilidad Única (SRP)**:

1. **`app/js/auth-profile-manager.js` (`class AuthProfileManager`)**:
   - Gestiona el modal de **Inicio de Sesión / Registro / Modo Invitado** y la tarjeta lateral del estudiante.
   - Guarda y sincroniza con `localStorage` y `POST /api/users` en `server.py`: `username`, `levelLabel` (*Principiante*, *Intermedio*), `xp`, `streakDays`, `masteredSigns[]`, `customPlans[]` y `examHistory[]`.
   - Expone ciclo de vida estándar: `init()`, `start()`, `update()`, `reset()`, `destroy()`.

2. **`app/js/learning-plan-manager.js` (`class LearningPlanManager`)**:
   - Gestiona los **Planes de Aprendizaje** y renderiza el **Mapa Hexagonal Interactivo (Skill Tree)** y el **Constructor Manual de Planes**.
   - **Planes incluidos de fábrica:**
     - `plan_zero_ai`: *"Empezar desde Cero (Básico IA)"* → `['HOLA', 'YO', 'A', 'E', 'O', 'BUENOS', 'DIAS', 'NOMBRE']`.
     - `plan_alphabet`: *"Dominio del Abecedario LSC"* → `['A', 'B', 'C', 'D', 'E', 'I', 'L', 'O', 'U', 'V']`.
     - `plan_words`: *"Palabras y Conversación LSC"* → `['HOLA', 'BUENOS', 'DIAS', 'TARDES', 'NOCHES', 'YO', 'NOMBRE', 'GUSTAR', 'ANNOS', 'LICOR']`.
   - **Generador con IA Local (`/api/plan` en `server.py`):** Envía el objetivo del usuario a `qwen2.5:3b` en Ollama (con fallback determinista instantáneo si Ollama está apagado) y recibe una ruta ordenada de IDs válidos del catálogo con una breve explicación pedagógica de **Sol**.
   - Cuando el usuario completa una seña al 100% en `VisionEvaluator`, el nodo hexagonal se ilumina en esmeralda y avanza al siguiente nodo del plan.

3. **`app/js/blind-exam-controller.js` (`class BlindExamController`)**:
   - Implementa el **Modo Examen Sin Video (Evaluación Ciega)**.
   - Al iniciar un examen (sobre el plan actual, sobre el abecedario, sobre palabras o mixto de 5 señas):
     1. **Oculta el video de referencia** colocando sobre `#videoStageContainer` una cubierta de **"Modo Examen Activo — Demostración Oculta"** (sin reproducir pistas visuales ni instrucciones paso a paso).
     2. Muestra claramente la seña solicitada (ej. *"Reto 2 de 5: Realiza la seña «BUENOS»"*), una barra de tiempo (ej. 20 segundos por seña) y un botón de *"Saltar seña"* o *"Rendirse / Ver pista (-50% pts)"*.
     3. Escucha el evento de éxito de `VisionEvaluator` (`onSignMastered` / `100%` hold). Si el usuario logra la seña con la cámara antes de que acabe el tiempo, suma puntos y pasa automáticamente a la siguiente pregunta.
     4. Al finalizar, muestra el **Certificado / Resumen de Examen** con calificación (ej. `4/5 — 80% Aprobado`), XP ganada y botón para repasar las señas falladas.

4. **Extensión limpia en `server.py` (`LSCHandler`)**:
   - `POST /api/plan`: Recibe `{ "goal": "No sé nada, enséñame desde cero", "level": "beginner" }`, consulta a Ollama `qwen2.5:3b` restringido estrictamente a las 20 claves de `AVAILABLE_SIGNS` (o aplica un clasificador pedagógico local si Ollama no responde en `< 4s`) y devuelve `{ "title": "...", "rationale": "...", "signs": ["HOLA", "YO", "A", ...] }`.
   - `GET /api/users` y `POST /api/users`: Persistencia ligera en `app/data/users_db.json` para que los perfiles y planes sobrevivan reinicios del navegador.

---

## 5. Directrices de Calidad Visual y Pruebas (`impeccable` + `Emil Kowalski` + `Playwright`)

1. **Estética y Tokens (`impeccable` + `ui-ux-pro-max`):**
   - Superficies en `#0a0e17` y `#121824`, acentos primarios en `#f59e0b` (ámbar) y estados completados en `#10b981` (esmeralda).
   - Uso de `font-variant-numeric: tabular-nums` en todos los contadores de XP, cronómetro de examen, porcentajes de precisión y rachas.
   - Scrollbars, selección de texto y anillos `:focus-visible` estilizados con el tema ámbar.
2. **Ingeniería de Movimiento (`Emil Kowalski / motion-doctrine`):**
   - Curva maestra: `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`.
   - Transición entre Modo Práctica y Modo Examen mediante `transform: scale(0.98) -> scale(1)` y `opacity` en `220ms`, bloqueando el video sin saltos de layout (`CLS = 0`).
3. **Verificación Automatizada con Playwright (`tests/`):**
   - Nueva suite `tests/learning_platform_and_exam.spec.js` que valida:
     - Registro/Login de usuario y persistencia de perfil.
     - Generación de plan con IA (`/api/plan`) y creación de plan personalizado manual.
     - Renderizado de nodos en el Mapa Hexagonal y cambio de seña al hacer clic en un nodo.
     - Activación del **Modo Examen Sin Video**, verificando que el reproductor de video quede oculto al usuario durante la evaluación y que al aprobar las señas se muestre el resumen de calificación.
     - Cero errores de consola (`window.__consoleErrors == []`) y cero overflow horizontal en `390x844` y `1280x850`.
   - Actualización final del grafo de conocimiento (`python -m graphify extract . --code-only`).
