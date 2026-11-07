# EXIS Learning Platform, AI Paths & Blind Exam Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar EXIS en una plataforma interactiva completa de Lengua de Señas Colombiana (LSC) con Login/Registro de perfiles, Rutas de Aprendizaje creadas con IA Local (`qwen2.5:3b`) o manualmente, Mapa Hexagonal Interactivo (Skill Tree) y un **Modo Examen Sin Video (Evaluación Ciega)** probado con Playwright.

**Architecture:** Extender la aplicación web de página única (SPA) sobre `app/index.html` y `server.py` mediante 3 clases POO ES6 independientes (`AuthProfileManager`, `LearningPlanManager`, `BlindExamController`) con ciclo de vida estandarizado (`init()`, `start()`, `update()`, `reset()`, `destroy()`) y estado encapsulado (`#`), preservando el 100% de los selectores DOM actuales y las reglas de `impeccable` y Emil Kowalski (`motion-doctrine`).

**Tech Stack:** HTML5 semántico, Tailwind CSS local, CSS Custom Properties (`app/css/styles.css`), JavaScript ES6+ POO modular, Google MediaPipe Hands local, Python 3 `http.server` + Proxy Ollama (`qwen2.5:3b` en puerto `8000`), Playwright (`^1.64.1`).

**Spec:** `docs/superpowers/specs/2026-11-05-exis-learning-platform-design.md`

## Global Constraints

- **Límite duro de líneas (`AGENTS.md` Regla 1):** Ningún archivo de código puede superar las **1,100 líneas**.
- **Cero CSS y Cero JS Embebido (`AGENTS.md` Regla 2):** En `app/index.html` está estrictamente prohibido usar etiquetas `<style>` o código inline dentro de `<script>`. Solo `<link rel="stylesheet">` y `<script src="..." defer>`.
- **Puerto Único (`AGENTS.md` Regla 3):** El servidor corre exclusivamente en `http://localhost:8000/`.
- **Accesibilidad WCAG AAA y Responsive (`AGENTS.md` Regla 6 + `ui-ux-pro-max`):** Paleta `#0a0e17`, `#121824`, `#f59e0b`; botones táctiles $\ge 44\text{px}$; cero desbordamiento horizontal (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`) en `390x844` (móvil) y `1280x850` (escritorio).
- **Cero Errores de Consola (`AGENTS.md` Regla 7):** `window.__consoleErrors` debe permanecer vacío (`[]`) durante toda la navegación, creación de planes y evaluación de examen.
- **POO Estricta (`AGENTS.md` Regla 8):** Cada nuevo módulo JS debe ser una clase ES6 con campos privados (`#`), responsabilidad única (SRP) y métodos `init()`, `start()`, `update()`, `reset()`, `destroy()`.
- **Reglas de Diseño `impeccable` (`craft-floor.md`) & Emil Kowalski (`motion-doctrine`):**
  - Prohibido usar emojis como iconos en los nuevos componentes (usar SVGs limpios con `stroke="currentColor"`).
  - Prohibido usar texto en gradiente, sombras duras sin blur o `border-left` > 1px.
  - Usar `font-variant-numeric: tabular-nums` en cronómetros de examen, barras de XP, rachas y porcentajes.
  - Todas las animaciones de UI usan `transform` y `opacity` con `--spring-easing: cubic-bezier(0.16, 1, 0.3, 1)` (150ms–250ms), feedback táctil `:active` en `50ms` y soporte obligatorio en `@media (prefers-reduced-motion: reduce)`.
- **Grafo de Conocimiento (`AGENTS.md` Regla 9):** Ejecutar actualización del grafo al finalizar los cambios de código.

## Review Focus

1. **Ollama apagado o lento al pedir un Plan con IA (`/api/plan`):** Si `localhost:11434` no responde en 2.5 segundos o devuelve texto libre sin IDs válidos, `server.py` debe devolver sin error HTTP 200 un plan pedagógico determinista basado en la intención del prompt (*"desde cero"*, *"abecedario"*, *"saludos"*, *"presentarme"*) usando únicamente los 20 IDs oficiales (`HOLA`, `YO`, `BUENOS`, `DIAS`, `TARDES`, `NOCHES`, `GUSTAR`, `NOMBRE`, `ANNOS`, `LICOR`, `A`, `B`, `C`, `D`, `E`, `I`, `L`, `O`, `U`, `V`).
2. **Plan personalizado vacío o con 1 sola seña:** Si el usuario intenta guardar un plan manual sin seleccionar ninguna seña, la UI debe mostrar un mensaje de validación accesible junto al selector (`#customPlanError`) y no crear un plan vacío.
3. **Activación del Modo Examen Sin Video mientras el modal de felicitación está abierto:** `BlindExamController.start()` debe cerrar `#successPopup`, despausar `VisionEvaluator`, ocultar `#signVideo` y `#signAnimatedWebp` bajo el escudo `#blindExamOverlay` y ocultar la pista `#targetSignTip` para evitar trampas.
4. **Avance de pregunta en Modo Examen vs Modo Práctica:** Cuando `window.onSignMastered(sign, score)` se dispara con un examen activo (`window.blindExamController.isExamActive() === true`), NO debe abrirse el `#successPopup` normal; en su lugar, `BlindExamController` registra el acierto, avanza inmediatamente al siguiente reto del examen o abre el modal de calificación final `#examSummaryModal`.
5. **Layout responsive en móvil (`390x844`) con el Mapa Hexagonal y los paneles Bento:** Los nodos hexagonales y las tarjetas de planes deben fluir con `flex-wrap` / `grid-cols-1` sin provocar `scrollWidth > clientWidth`.

---

## Mapa de Archivos a Crear y Modificar

- **Modificar:** `server.py` (Añadir endpoints `POST /api/plan`, `GET /api/users`, `POST /api/users` y persistencia en `app/data/users_db.json`).
- **Crear:** `app/js/auth-profile-manager.js` (`class AuthProfileManager` — Login, Registro, cambio rápido de perfil, XP, racha y anillos de maestría).
- **Crear:** `app/js/learning-plan-manager.js` (`class LearningPlanManager` — Planes predefinidos, Arquitecta IA "Sol" conectada a `/api/plan`, Constructor Manual de Planes y Mapa Hexagonal Interactivo SVG/DOM).
- **Crear:** `app/js/blind-exam-controller.js` (`class BlindExamController` — Evaluación Ciega Sin Video con escudo sobre el reproductor, temporizador tabular por seña, avance automático por cámara o salto manual, y Certificado de Calificación).
- **Modificar:** `app/index.html` (Integrar barra superior de Perfil/Login, sección Bento de Arquitecta IA + Mapa Hexagonal + Constructor Manual + Botón Modo Examen, Escudo `#blindExamOverlay` en `#videoPlayerStage`, modales de Login y Resumen de Examen, y etiquetas `<script defer>` para los 3 nuevos módulos; cero `<style>` o `<script>` inline).
- **Modificar:** `app/css/styles.css` (Añadir estilos para Bento Glassmorphism, nodos del Mapa Hexagonal `.hex-node`, escudo `.blind-exam-shield`, `tabular-nums` y reglas `@media (prefers-reduced-motion: reduce)`).
- **Modificar:** `app/js/main.js` (Inicializar `AuthProfileManager`, `LearningPlanManager`, `BlindExamController` y enrutar `window.onSignMastered` hacia el examen o hacia el progreso del plan activo).
- **Crear:** `tests/learning_platform_and_exam.spec.js` (Suite E2E Playwright verificando API, Login/Registro, Plan IA, Plan Manual, Mapa Hexagonal, Modo Examen Sin Video, responsive `390x844` / `1280x850` y `0` errores de consola).

---

### Task 1: Endpoints Backend de Planes IA (`/api/plan`) y Perfiles (`/api/users`) en `server.py`

**Files:**
- Modify: `server.py`
- Create: `tests/backend_api_plan_users.js` (script de verificación rápida en Node)

**Interfaces:**
- Produces:
  - `POST http://localhost:8000/api/plan`
    - Request JSON: `{ "goal": string, "level": "beginner" | "intermediate" | "custom" }`
    - Response JSON (200): `{ "id": string, "title": string, "rationale": string, "signs": string[], "source": "ollama" | "curated_fallback" }`
  - `GET http://localhost:8000/api/users`
    - Response JSON (200): `{ "users": Array<{ "username": string, "displayName": string, "level": string, "xp": number, "streak": number, "masteredSigns": string[], "customPlans": Array<object>, "examHistory": Array<object> }> }`
  - `POST http://localhost:8000/api/users`
    - Request JSON: `{ "username": string, "displayName": string, "level": string, "xp": number, "streak": number, "masteredSigns": string[], "customPlans": Array<object>, "examHistory": Array<object> }`
    - Response JSON (200): `{ "status": "ok", "user": object }`

- [ ] **Step 1: Escribir el test de verificación de API (`tests/backend_api_plan_users.js`)**

```javascript
const http = require('http');
const assert = require('assert');

function requestJSON(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body), 'utf-8') : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8000,
      path,
      method,
      headers: data ? { 'Content-Type': 'application/json', 'Content-Length': data.length } : {}
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => resolve({ status: res.statusCode, json: JSON.parse(raw) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const planRes = await requestJSON('POST', '/api/plan', {
    goal: 'No sé nada, enséñame desde cero lo básico',
    level: 'beginner'
  });
  assert.strictEqual(planRes.status, 200);
  assert.ok(Array.isArray(planRes.json.signs) && planRes.json.signs.length >= 4);
  assert.ok(planRes.json.title && planRes.json.rationale);

  const userRes = await requestJSON('POST', '/api/users', {
    username: 'estudiante_test',
    displayName: 'Estudiante Test',
    level: 'Principiante',
    xp: 120,
    streak: 3,
    masteredSigns: ['HOLA', 'A'],
    customPlans: [],
    examHistory: []
  });
  assert.strictEqual(userRes.status, 200);
  assert.strictEqual(userRes.json.user.username, 'estudiante_test');

  const getRes = await requestJSON('GET', '/api/users');
  assert.strictEqual(getRes.status, 200);
  assert.ok(getRes.json.users.some(u => u.username === 'estudiante_test'));
  console.log('PASS: backend_api_plan_users');
})();
```

- [ ] **Step 2: Ejecutar el test contra el servidor actual para verificar que falla**

Run: `node tests/backend_api_plan_users.js`
Expected: FAIL (HTTP 404 en `/api/plan` o conexión rechazada si el servidor no se ha reiniciado).

- [ ] **Step 3: Implementar `build_pedagogical_plan(goal, level)`, `GET /api/users` y `POST /api/plan` + `POST /api/users` en `server.py`**

En `server.py`, agregar la constante `VALID_SIGN_IDS = ["HOLA", "YO", "BUENOS", "DIAS", "TARDES", "NOCHES", "GUSTAR", "NOMBRE", "ANNOS", "LICOR", "A", "B", "C", "D", "E", "I", "L", "O", "U", "V"]` y `USERS_DB_PATH = os.path.join(DIRECTORY, "data", "users_db.json")`.
Implementar `build_pedagogical_plan(goal: str, level: str) -> dict` que:
1. Intente consultar a Ollama (`qwen2.5:3b`, timeout `2.2s`) pidiendo un JSON con `title`, `rationale` y `signs` (filtrando solo IDs dentro de `VALID_SIGN_IDS`).
2. Si Ollama no está activo o devuelve menos de 3 señas válidas, aplique el clasificador pedagógico determinista según palabras clave en `goal` (`"abecedario"/"letra"` → vocales y consonantes; `"saludo"/"presentar"` → `["HOLA", "YO", "NOMBRE", "BUENOS", "DIAS", "GUSTAR"]`; `"cero"/"básico"/"nada"` o default → `["HOLA", "YO", "A", "E", "O", "BUENOS", "DIAS", "NOMBRE"]`).
3. Añadir soporte `do_GET` para `/api/users` (antes de `super().do_GET()`) y ramas en `do_POST` para `/api/plan` y `/api/users`. Mantener `server.py` por debajo de 600 líneas.

- [ ] **Step 4: Reiniciar `server.py` en puerto 8000 y ejecutar el test de API**

Run: `node tests/backend_api_plan_users.js`
Expected: `PASS: backend_api_plan_users`

- [ ] **Step 5: Commit de Task 1**

```bash
git add server.py tests/backend_api_plan_users.js
git commit -m "feat(server): add /api/plan AI path generator and /api/users persistence"
```

---

### Task 2: Clase POO `AuthProfileManager` (`app/js/auth-profile-manager.js`)

**Files:**
- Create: `app/js/auth-profile-manager.js`

**Interfaces:**
- Produces `window.AuthProfileManager` (instancia de `class AuthProfileManager`):
  - `init(onProfileChangeCallback: (profile: object) => void): void`
  - `start(): void`
  - `update(partialProfile: object): object`
  - `reset(): void`
  - `destroy(): void`
  - `getCurrentProfile(): { username: string, displayName: string, level: string, xp: number, streak: number, masteredSigns: string[], customPlans: object[], examHistory: object[] }`
  - `loginOrRegister(username: string, displayName: string, level: string): Promise<object>`
  - `recordSignMastered(signId: string, earnedXp?: number): object`
  - `recordExamResult(examSummary: { planTitle: string, scorePct: number, correct: number, total: number, dateIso: string }): object`
  - `saveCustomPlan(planObj: { id: string, title: string, rationale: string, signs: string[] }): object`
  - `openAuthModal(): void`
  - `closeAuthModal(): void`

- [ ] **Step 1: Crear `app/js/auth-profile-manager.js` con encapsulación `#` y sincronización híbrida (`localStorage` + `/api/users`)**

Implementar `class AuthProfileManager` con:
- Clave de `localStorage`: `'exis_active_profile_v1'` y `'exis_profiles_Map_v1'`.
- Perfil por defecto inicial si no hay sesión previa: `{ username: 'invitado', displayName: 'Estudiante LSC', level: 'Principiante', xp: 0, streak: 1, masteredSigns: [], customPlans: [], examHistory: [] }`.
- Actualización automática de los elementos DOM:
  - `#userDisplayName`, `#userLevelBadge`, `#userXpValue`, `#userXpBar`, `#userStreakCount`, `#masteryLettersPct`, `#masteryWordsPct`, `#masteryTotalCount`.
  - Formulario del modal `#authModal`: validación de `#authUsernameInput` (mínimo 2 caracteres; si está vacío muestra error en `#authFormError` sin cerrar el modal), selector de nivel inicial (`#authLevelSelect`: `"Desde Cero"`, `"Básico - Abecedario"`, `"Conversación LSC"`) y botón de acceso rápido.

- [ ] **Step 2: Verificar sintaxis de `app/js/auth-profile-manager.js` con Node**

Run: `node --check app/js/auth-profile-manager.js`
Expected: Exit code 0 sin errores de sintaxis.

- [ ] **Step 3: Commit de Task 2**

```bash
git add app/js/auth-profile-manager.js
git commit -m "feat(auth): add POO AuthProfileManager class with hybrid persistence"
```

---

### Task 3: Clase POO `LearningPlanManager` y Mapa Hexagonal (`app/js/learning-plan-manager.js`)

**Files:**
- Create: `app/js/learning-plan-manager.js`

**Interfaces:**
- Consumes:
  - `window.SIGNS_DATA` (`words` y `letters`)
  - `window.AuthProfileManager.getCurrentProfile()`, `window.AuthProfileManager.saveCustomPlan(plan)`
  - `window.selectSignById(signId)`
- Produces `window.LearningPlanManager` (instancia de `class LearningPlanManager`):
  - `init(options: { onSelectSign: (signId: string) => void, onStartExamRequest: (plan: object) => void }): void`
  - `start(): void`
  - `update(): void`
  - `reset(): void`
  - `destroy(): void`
  - `getActivePlan(): { id: string, title: string, rationale: string, signs: string[], currentIndex: number }`
  - `selectPresetPlan(planId: 'plan_zero_ai' | 'plan_alphabet' | 'plan_words' | string): void`
  - `generateAIPlanFromPrompt(goalText: string): Promise<object>`
  - `createCustomPlan(title: string, selectedSignIds: string[]): { ok: boolean, error?: string, plan?: object }`
  - `markSignCompletedInPlan(signId: string): { nextSignId: string | null, planCompleted: boolean }`

- [ ] **Step 1: Implementar `class LearningPlanManager` en `app/js/learning-plan-manager.js`**

Debe incluir:
1. Los 3 planes oficiales de fábrica:
   - `plan_zero_ai`: `{ id: 'plan_zero_ai', title: 'Desde Cero: Ruta Básica IA', rationale: 'Secuencia diseñada para principiantes absolutos: empieza con el saludo fundamental, vocales de una sola mano y presentación personal.', signs: ['HOLA', 'YO', 'A', 'E', 'O', 'BUENOS', 'DIAS', 'NOMBRE'] }`
   - `plan_alphabet`: `{ id: 'plan_alphabet', title: 'Dominio del Abecedario LSC', rationale: 'Entrenamiento progresivo de las 10 configuraciones dactilológicas esenciales del corpus LSC70.', signs: ['A', 'B', 'C', 'D', 'E', 'I', 'L', 'O', 'U', 'V'] }`
   - `plan_words`: `{ id: 'plan_words', title: 'Palabras y Conversación LSC', rationale: 'Vocabulario cotidiano, saludos por franja horaria y verbos de interacción social en LSC.', signs: ['HOLA', 'BUENOS', 'DIAS', 'TARDES', 'NOCHES', 'YO', 'NOMBRE', 'GUSTAR', 'ANNOS', 'LICOR'] }`
2. **Renderizado del Mapa Hexagonal (`#hexSkillTreeContainer`):**
   - Por cada `signId` en `activePlan.signs`, renderizar un botón nodo hexagonal accesible (`button.hex-node` con `id="hex-node-${signId}"`, `data-sign-id="${signId}"`) con SVG hexagonal de borde luminoso, número de paso, nombre de la seña e indicador de estado (`completado` en esmeralda, `actual` en ámbar pulsante, `pendiente` en pizarra).
   - Al hacer clic en un nodo hexagonal, invocar `selectSignById(signId)` y actualizar `currentIndex`.
3. **Generador IA ("Sol - Arquitecta de Rutas IA"):**
   - Toma el texto de `#aiPlanPromptInput`, llama a `POST /api/plan`, muestra el razonamiento pedagógico en `#aiPlanRationaleText`, activa el nuevo plan en el Mapa Hexagonal y selecciona automáticamente la primera seña.
4. **Constructor Manual de Plan Propio (`#customPlanModal` / panel):**
   - Muestra los 20 chips seleccionables de señas (`data-custom-sign="${sign.id}"`).
   - Si el usuario intenta guardar con `0` señas seleccionadas, escribe `"Selecciona al menos 1 seña para armar tu plan."` en `#customPlanError` y retorna `{ ok: false }`.
   - Si selecciona $\ge 1$ seña, guarda el plan en `AuthProfileManager.saveCustomPlan()`, lo agrega al selector de planes y lo activa en el Mapa Hexagonal.

- [ ] **Step 2: Verificar sintaxis de `app/js/learning-plan-manager.js` con Node**

Run: `node --check app/js/learning-plan-manager.js`
Expected: Exit code 0 sin errores de sintaxis.

- [ ] **Step 3: Commit de Task 3**

```bash
git add app/js/learning-plan-manager.js
git commit -m "feat(plans): add POO LearningPlanManager with AI route builder and Hex Skill Tree"
```

---

### Task 4: Clase POO `BlindExamController` — Modo Examen Sin Video (`app/js/blind-exam-controller.js`)

**Files:**
- Create: `app/js/blind-exam-controller.js`

**Interfaces:**
- Consumes:
  - `window.VisionEvaluator` (`setTargetSign`, `setPaused`)
  - `window.AuthProfileManager` (`recordExamResult`, `recordSignMastered`)
  - `window.selectSignById(signId)`
- Produces `window.BlindExamController` (instancia de `class BlindExamController`):
  - `init(): void`
  - `start(planOrSigns?: { title: string, signs: string[] }, secondsPerQuestion?: number): void`
  - `update(): void`
  - `reset(): void`
  - `destroy(): void`
  - `isExamActive(): boolean`
  - `handleSignMasteredInExam(signObj: object, accuracyScore: number): void`
  - `skipCurrentQuestion(): void`
  - `stopExam(): void`

- [ ] **Step 1: Implementar `class BlindExamController` en `app/js/blind-exam-controller.js`**

Comportamiento exacto:
1. `start(planObj, secondsPerQuestion = 25)`:
   - Toma hasta 5 señas del plan activo (o las señas del plan si tiene $\le 5$).
   - Activa `#isActive = true`, oculta el `#successPopup` si estaba abierto y muestra el escudo `#blindExamOverlay` encima de `#videoPlayerStage` (ocultando completamente el video `#signVideo` y `#signAnimatedWebp`, y pausando el `<video>`).
   - Oculta `#targetSignTip` y `#targetSignDesc` reemplazándolos visualmente por el estado `"Modo Examen Activo: Demuestra la seña de memoria frente a la cámara sin guía de video."` para que el usuario no tenga chuleta de texto ni de video.
   - Muestra la barra superior de examen (`#examActiveBanner`) con el progreso (`Pregunta 1 de N`), el nombre de la seña objetivo en grande (`#examPromptSignName`), el cronómetro en `tabular-nums` (`#examTimerText`), botón `#btnSkipExamSign` (*"Saltar seña"*) y botón `#btnExitExam` (*"Salir del examen"*).
2. `handleSignMasteredInExam(signObj, accuracyScore)`:
   - Registra la pregunta actual como aprobada (`passed: true, score: accuracyScore`), suma `+35 XP` mediante `AuthProfileManager.recordSignMastered(signObj.id, 35)`, y tras `450ms` pasa a la siguiente seña del examen sin abrir `#successPopup`.
3. Si el temporizador de la pregunta llega a `0` o el usuario pulsa `#btnSkipExamSign`, registra la seña como pendiente de repaso (`passed: false, score: 0`) y avanza a la siguiente.
4. Al terminar todas las preguntas, restaura la visibilidad normal del reproductor de video, llama a `AuthProfileManager.recordExamResult(...)` y abre `#examSummaryModal` mostrando:
   - Calificación en porcentaje (`#examFinalScorePct`, ej. `80%`), aciertos (`#examFinalFraction`, ej. `4 / 5 señas`), lista de señas aprobadas vs señas por repasar (`#examBreakdownList`) y botón `#btnCloseExamSummary` / `#btnRetryFailedSigns`.

- [ ] **Step 2: Verificar sintaxis de `app/js/blind-exam-controller.js` con Node**

Run: `node --check app/js/blind-exam-controller.js`
Expected: Exit code 0 sin errores de sintaxis.

- [ ] **Step 3: Commit de Task 4**

```bash
git add app/js/blind-exam-controller.js
git commit -m "feat(exam): add POO BlindExamController for no-video sign assessment"
```

---

### Task 5: Integración UI Híbrida en `app/index.html`, Estilos en `app/css/styles.css` y Orquestación en `app/js/main.js`

**Files:**
- Modify: `app/index.html`
- Modify: `app/css/styles.css`
- Modify: `app/js/main.js`

**Interfaces:**
- Consumes: `window.AuthProfileManager`, `window.LearningPlanManager`, `window.BlindExamController`
- Preserves all existing DOM IDs: `#catWordsBtn`, `#catLettersBtn`, `#signList`, `#btnExplainVoice`, `#btnModeReal`, `#btnModeAnime`, `#videoPlayerStage`, `#signVideo`, `#signAnimatedWebp`, `#btnViewBody`, `#btnViewHand`, `#btnPlayPause`, `#videoTimeline`, `#btnSpeed05`, `#btnSpeed10`, `#targetSignBadge`, `#targetSignDesc`, `#targetSignTip`, `#toggleCameraBtn`, `#webcamVideo`, `#outputCanvas`, `#successPopup`, `#btnKeepPracticing`, `#btnNextSign`, `#btnToggleChat`, `#chatDrawer`.

- [ ] **Step 1: Actualizar `app/index.html` respetando Cero `<style>` y Cero `<script>` inline**

En `app/index.html`:
1. En `<head>`, agregar antes de `main.js`:
   ```html
   <script src="js/auth-profile-manager.js?v=20261105_v1" defer></script>
   <script src="js/learning-plan-manager.js?v=20261105_v1" defer></script>
   <script src="js/blind-exam-controller.js?v=20261105_v1" defer></script>
   ```
2. En el `<header>`, añadir el botón de perfil/login `#btnOpenAuthModal` que muestra `#userDisplayName`, `#userLevelBadge`, `#userXpValue` y racha `#userStreakCount`, más el botón directo `#btnStartBlindExam` (*"Modo Examen Sin Video"*).
3. Justo encima del selector de señas en `<main>`, insertar el **Hub Bento de Aprendizaje y Mapa Hexagonal (`#learningHubSection`)**:
   - **Tarjeta Izquierda (Perfil & Maestría):** Resumen del estudiante, barra de XP (`#userXpBar`), contadores tabulares (`#masteryLettersPct`, `#masteryWordsPct`) y botón para cambiar/crear cuenta (`#btnSwitchProfile`).
   - **Tarjeta Central (Sol · Arquitecta de Rutas IA + Planes):** Input `#aiPlanPromptInput` (*"Ej: No sé nada, enséñame desde cero"*), botón `#btnGenerateAiPlan`, chips de planes (`#btnPlanZeroAi`, `#btnPlanAlphabet`, `#btnPlanWords`, `#btnOpenCustomPlanModal`), explicación `#aiPlanRationaleText` y el **Mapa Hexagonal Interactivo** (`#hexSkillTreeContainer`) con indicador de progreso del plan (`#activePlanTitle`, `#activePlanProgressText`).
4. Dentro de `#videoPlayerStage`, añadir el escudo `#blindExamOverlay` (oculto por defecto con `.hidden`) que cubre el video durante el Modo Examen Sin Video mostrando `#examPromptSignName`, `#examQuestionCounter`, `#examTimerText` y botones `#btnSkipExamSign` / `#btnExitExam`.
5. Al final del `<body>`, añadir los 3 modales accesibles (`role="dialog"`, `aria-modal="true"`):
   - `#authModal` (Login / Registro con `#authUsernameInput`, `#authDisplayNameInput`, `#authLevelSelect`, `#authFormError`, `#btnSubmitAuth`, `#btnCloseAuthModal`).
   - `#customPlanModal` (Constructor de Plan Propio con `#customPlanTitleInput`, contenedor de chips `#customPlanSignsGrid`, `#customPlanError`, `#btnSaveCustomPlan`, `#btnCloseCustomPlanModal`).
   - `#examSummaryModal` (Certificado de Examen con `#examFinalScorePct`, `#examFinalFraction`, `#examBreakdownList`, `#btnRetryFailedSigns`, `#btnCloseExamSummary`).

- [ ] **Step 2: Añadir tokens y clases de estilo en `app/css/styles.css`**

Agregar al final de `app/css/styles.css` (manteniendo el archivo por debajo de 750 líneas):
- `.tabular-nums { font-variant-numeric: tabular-nums; }`
- `.bento-card`: superficie `#121824` con borde sutil `rgba(245, 158, 11, 0.18)` y sombra suave con offset.
- `.hex-skill-tree`: contenedor flexible con conectores entre nodos.
- `.hex-node`, `.hex-node-active`, `.hex-node-completed`, `.hex-node-locked`: nodos táctiles $\ge 44\text{px}$ con transición `transform 0.2s var(--spring-easing)` y clip/borde hexagonal limpio.
- `.blind-exam-shield`: cubierta opaca `#0a0e17` sobre el escenario de video durante el examen para garantizar que el video no sea visible.
- Bloque `@media (prefers-reduced-motion: reduce)` que desactiva desplazamientos espaciales preservando cambios de opacidad y color.

- [ ] **Step 3: Conectar los 3 controladores POO en `app/js/main.js`**

En `app/js/main.js`:
- En `DOMContentLoaded`: inicializar `window.AuthProfileManager.init(...)`, `window.LearningPlanManager.init(...)` y `window.BlindExamController.init()`.
- En `window.onSignMastered(sign, score)`:
  - Si `window.BlindExamController && window.BlindExamController.isExamActive()` es `true`, delegar exclusivamente a `window.BlindExamController.handleSignMasteredInExam(sign, score)` y retornar.
  - En modo normal, registrar la seña dominada en `window.AuthProfileManager.recordSignMastered(sign.id, 25)` y actualizar el nodo en `window.LearningPlanManager.markSignCompletedInPlan(sign.id)`.
- En `dismissSuccessModal(goToNext)`: si hay un plan activo, avanzar a la siguiente seña del plan hexagonal.

- [ ] **Step 4: Verificar límites de líneas y cero estilos/scripts inline**

Run: `powershell -NoProfile -Command "Get-Content app/index.html, app/css/styles.css, app/js/*.js, server.py | Measure-Object -Line; Select-String -Path app/index.html -Pattern '<style|<script[^>]*>[^<]+'"`
Expected: Ningún archivo supera 1,100 líneas y `Select-String` no devuelve ningún `<style>` ni `<script>` con código inline.

- [ ] **Step 5: Commit de Task 5**

```bash
git add app/index.html app/css/styles.css app/js/main.js
git commit -m "feat(ui): integrate Bento Learning Hub, Hex Skill Tree, and Blind Exam overlay"
```

---

### Task 6: Suite de Pruebas End-to-End en Playwright (`tests/learning_platform_and_exam.spec.js`) y Actualización de Graphify

**Files:**
- Create: `tests/learning_platform_and_exam.spec.js`
- Modify: `graphify-out/graph.json` (vía CLI de Graphify)

**Interfaces:**
- Verifica de extremo a extremo todas las funciones del Spec y los 5 puntos de `Review Focus` en un navegador Chromium real contra `http://localhost:8000/`.

- [ ] **Step 1: Crear `tests/learning_platform_and_exam.spec.js`**

Escribir un script ejecutable con Playwright (`node tests/learning_platform_and_exam.spec.js`) que verifique:
1. **Cero errores de consola y cero desbordamiento horizontal** tanto en `1280x850` como en `390x844` (`scrollWidth <= clientWidth`).
2. **Flujo de Login y Registro (`AuthProfileManager`):**
   - Abrir `#authModal` con `#btnOpenAuthModal`.
   - Intentar enviar vacío y comprobar que aparece el mensaje de error en `#authFormError` (Review Focus #2).
   - Registrar el usuario `"abner_lsc"` con nombre `"Abner LSC"` y verificar que `#userDisplayName` muestra `"Abner LSC"` y persiste tras `page.reload()`.
3. **Generador de Plan con IA Local (`LearningPlanManager` + `/api/plan`):**
   - Escribir `"No sé nada, enséñame desde cero"` en `#aiPlanPromptInput` y pulsar `#btnGenerateAiPlan`.
   - Verificar que `#hexSkillTreeContainer` renderiza los nodos hexagonales `.hex-node` y que al hacer clic en un nodo cambia `#targetSignBadge`.
4. **Constructor de Plan Propio Manual:**
   - Abrir `#customPlanModal`, intentar guardar con 0 señas y verificar el error en `#customPlanError`.
   - Seleccionar `HOLA`, `A`, `B`, guardar con título `"Mi Ruta Personal"`, y verificar que el Mapa Hexagonal ahora tiene exactamente 3 nodos (`HOLA`, `A`, `B`).
5. **Modo Examen Sin Video (`BlindExamController`):**
   - Hacer clic en `#btnStartBlindExam`.
   - Verificar que `#blindExamOverlay` está visible, que el video de demostración no es visible para el usuario y que la pista `#targetSignTip` está oculta/bloqueada (Review Focus #3).
   - Simular la aprobación de las 3 señas invocando `window.onSignMastered({ id: 'HOLA', name: 'HOLA' }, 96)` etc., verificando que NO se abre `#successPopup` a mitad del examen (Review Focus #4) y que al completar las 3 preguntas se abre `#examSummaryModal` con `100%` (`3 / 3`) y el XP del usuario aumenta.

- [ ] **Step 2: Ejecutar `node tests/learning_platform_and_exam.spec.js` y la suite existente**

Run: `node tests/learning_platform_and_exam.spec.js && node tests/test_console_check.js`
Expected: Ambos scripts terminan con `PASS` y `0` errores de consola.

- [ ] **Step 3: Actualizar el Grafo de Conocimiento (`AGENTS.md` Regla 9)**

Run: `python -m graphify extract . --code-only`
Expected: `graphify-out/graph.json` y `graphify-out/GRAPH_REPORT.md` actualizados con los nuevos nodos `AuthProfileManager`, `LearningPlanManager` y `BlindExamController`.

- [ ] **Step 4: Commit final**

```bash
git add tests/learning_platform_and_exam.spec.js graphify-out/
git commit -m "test(e2e): add Playwright suite for learning paths, blind exam, and update graphify"
```
