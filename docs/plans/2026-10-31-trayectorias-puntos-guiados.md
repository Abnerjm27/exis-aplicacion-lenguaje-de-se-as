# Plan de Implementación: Sistema de Puntos y Trayectorias de Movimiento LSC (Connect-the-Dots)

> **Para trabajadores agenticos:** SUB-SKILL REQUERIDA: Usar `superpowers:subagent-driven-development` o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Cada paso usa sintaxis de casillas (`- [ ]`).

**Meta:** Implementar un sistema de guía visual interactivo tipo "conectar puntos" en pantalla, donde el usuario debe mover la mano y conectar waypoints secuenciales para completar señas dinámicas de la Lengua de Señas Colombiana (LSC), combinando la postura anatómica de dedos con el movimiento espacial correcto.

**Arquitectura:** 
Un motor modular independiente (`trajectory-tracker.js`) gestiona los waypoints y renderizado de estelas/líneas sobre el canvas de MediaPipe (`outputCanvas`). `signs-data.js` almacena las coordenadas normalizadas de cada seña. `vision-evaluator.js` alimenta las coordenadas de los landmarks (muñeca/índice) al motor y condiciona la victoria a cumplir simultáneamente la pose anatómica y el recorrido de la trayectoria. La UI en `index.html` y `styles.css` añade toggles y badges de progreso accesibles WCAG AAA.

**Tech Stack:** JavaScript Vanilla (ES6+ modular), HTML5 Canvas 2D API, MediaPipe Hands (CDN), Tailwind CSS (CDN) + Custom CSS (`styles.css`).

**Especificación:** Documento técnico y reglas de arquitectura en [`AGENTS.md`](file:///c:/Users/abner/Desktop/exis%20aplicacion%20lenguaje%20de%20se%C3%B1as/AGENTS.md).

---

## Restricciones Globales (Hard Rules)

- **Límite de líneas:** Ningún archivo puede superar las 1,100 líneas. El nuevo motor se crea en su propio archivo `app/js/trajectory-tracker.js` (< 400 líneas).
- **Cero CSS y Cero JS embebido en HTML:** En [`app/index.html`](file:///c:/Users/abner/Desktop/exis%20aplicacion%20lenguaje%20de%20se%C3%B1as/app/index.html) está prohibido usar `<style>` o escribir scripts inline. Todo va en archivos externos.
- **Servidor y Puerto:** `http://localhost:8000/`.
- **Accesibilidad WCAG AAA:** Botones $\ge 44\text{px}$, paleta oscuro/ámbar/esmeralda con alto contraste, cero desbordamiento horizontal.
- **Verificación de consola:** La aplicación debe cargar con `0` errores de consola (`window.__consoleErrors == []`).

---

## Análisis de Agentes Necesarios

Para llevar a cabo esta funcionalidad con la máxima calidad, separación limpia de dominios y sin colisiones de código, se definen **4 roles de agentes especializados**:

| Agente / Rol | Dominio Principal | Responsabilidad Concreta |
| :--- | :--- | :--- |
| **Agente 1: Arquitecto de Trayectorias y Datos** | `app/js/signs-data.js` | Modela y calibra las secuencias cinemáticas de puntos (inicio, transición, final) para cada una de las 6 palabras dinámicas (`HOLA`, `YO`, `BUENOS`, `DIAS`, `NOCHES`, `NOMBRE`) y modo estático para letras dactilológicas. |
| **Agente 2: Ingeniero de Canvas y Renderizado** | `app/js/trajectory-tracker.js` | Desarrolla el motor gráfico 2D: renderiza los círculos numerados, halos de pulsación (glow), líneas punteadas conectoras, efectos de partículas al alcanzar un punto y cálculo de colisión euclidiana normalizada. |
| **Agente 3: Especialista en Visión y Máquina de Estados** | `app/js/vision-evaluator.js` | Conecta los landmarks de MediaPipe Hands (`results.multiHandLandmarks`) con el `TrajectoryTracker`. Controla el estado secuencial (punto 1 -> punto 2 -> meta), valida pose + cinemática y sincroniza el porcentaje de éxito. |
| **Agente 4: Frontend UI, Accesibilidad y QA** | `index.html`, `styles.css`, `main.js` | Agrega los controles de interfaz (interruptor de modo trayectoria, indicador de etapas 1/3, 2/3), sonidos/efectos táctiles y ejecuta la verificación sin errores de consola. |

---

## Tareas de Implementación

### Tarea 1: Modelado de Datos de Trayectorias en `signs-data.js`
**Archivos:**
- Modificar: `app/js/signs-data.js`

**Interfaces:**
- Produce: Cada objeto de seña en `SIGNS_DATA.words` y `SIGNS_DATA.letters` incorpora la propiedad `trajectory`:
  ```javascript
  trajectory: {
    enabled: true,
    trackingLandmark: 8, // 8 = Índice (YO, NOMBRE), 0 = Muñeca (HOLA, DIAS, NOCHES, BUENOS)
    hitRadius: 0.12,     // Radio de detección normalizado (0 a 1)
    points: [
      { id: 1, x: 0.70, y: 0.35, label: 'Inicio' },
      { id: 2, x: 0.45, y: 0.35, label: 'Movimiento' },
      { id: 3, x: 0.25, y: 0.35, label: 'Final' }
    ]
  }
  ```

- [x] **Paso 1:** Definir trayectorias realistas para:
  - `HOLA`: Movimiento lateral de sien (3 puntos de derecha a izquierda o viceversa).
  - `YO`: Trayectoria frontal que se aproxima al esternón/pecho (2 puntos: inicio externo -> pecho).
  - `BUENOS`: De mentón hacia adelante/abajo (2 puntos: mentón -> proyección al frente).
  - `DIAS`: Apertura horizontal de ambos brazos (2-3 puntos en expansión).
  - `NOCHES`: Cruce de brazos hacia el centro del torso.
  - `NOMBRE`: Encuentro y toque de dedos frente al pecho.
- [x] **Paso 2:** Para las letras dactilológicas (`A`, `B`, `C`, `L`, `V`), configurar `trajectory: { enabled: false }` o punto estático de estabilidad.
- [x] **Paso 3:** Verificar sintaxis de `signs-data.js` y confirmar que no supera las 1,100 líneas.

---

### Tarea 2: Creación del Motor `app/js/trajectory-tracker.js`
**Archivos:**
- Crear: `app/js/trajectory-tracker.js`

**Interfaces:**
- Expone globalmente `window.TrajectoryTracker`:
  ```javascript
  const TrajectoryTracker = {
    init(canvas, ctx),
    setSign(signData),
    update(landmarks, canvasWidth, canvasHeight),
    render(ctx, canvasWidth, canvasHeight),
    reset(),
    getProgress(),       // Retorna 0.0 a 1.0
    isCompleted(),       // Retorna boolean
    isTrajectoryActive() // Retorna boolean
  };
  ```

- [x] **Paso 1:** Crear estructura del módulo con variables de estado: `currentIndex`, `activePoints`, `completedPoints`, `particles`, `isCompleted`.
- [x] **Paso 2:** Implementar lógica de detección de colisión normalizada entre el landmark objetivo (`trackingLandmark`) y el punto actual:
  - Distancia euclidiana $d = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$.
  - Manejo de inversión espejo horizontal (webcam mirror).
- [x] **Paso 3:** Implementar renderizado en Canvas:
  - Línea punteada o resplandeciente entre waypoints.
  - Círculos de waypoints con números (1, 2, 3...) y color ámbar/esmeralda según si están completados, activos o pendientes.
  - Halo pulsante animado (`glow`) en el punto que el usuario debe tocar ahora.
  - Explosión de micropartículas al completar un punto con éxito.
- [x] **Paso 4:** Reset automático suave si el usuario aleja la mano por más de 2 segundos.

---

### Tarea 3: Integración en `vision-evaluator.js` y Evaluación Concurrente
**Archivos:**
- Modificar: `app/js/vision-evaluator.js`

**Interfaces:**
- Consigue landmarks de MediaPipe y los pasa a `TrajectoryTracker.update(landmarks)`.
- Combina la puntuación anatómica de dedos con el progreso de la trayectoria:
  $$\text{Score Total} = (\text{Pose Score} \times 0.6) + (\text{Trajectory Progress} \times 40)$$
- Condiciona el `window.onSignMastered`: para señas con trayectoria activa, debe tener pose correcta ($\ge 80\%$) Y trayectoria 100% completada.

- [x] **Paso 1:** Vincular `TrajectoryTracker.setSign(sign)` cuando cambia `currentTargetSign`.
- [x] **Paso 2:** En `handleHandResults`, llamar a `TrajectoryTracker.update()` y `TrajectoryTracker.render()`.
- [x] **Paso 3:** En `evaluatePose()`, fusionar la retroalimentación de texto con el siguiente punto a conectar (ej: *"¡Punto 1 conectado! Ahora desliza hacia el punto 2"*).
- [x] **Paso 4:** Verificar que al detener la cámara o pausar la evaluación, el tracker se reinicie limpiamente.

---

### Tarea 4: Actualización de UI y Accesibilidad en `index.html`, `styles.css` y `main.js`
**Archivos:**
- Modificar: `app/index.html`
- Modificar: `app/css/styles.css`
- Modificar: `app/js/main.js`

- [x] **Paso 1:** Incluir el script `<script src="js/trajectory-tracker.js"></script>` en `app/index.html` antes de `vision-evaluator.js`.
- [x] **Paso 2:** Agregar en la sección de cámara un indicador visual accesible de etapas de la trayectoria:
  - Badge: "Puntos: 1/3" o "Guía de Movimiento Activa".
  - Botón toggle opcional para activar/desactivar las líneas guía si el usuario desea practicar libremente.
- [x] **Paso 3:** Estilizar los componentes con Tailwind + CSS personalizado cumpliendo WCAG AAA (contrastes, tamaños táctiles $\ge 44\text{px}$).
- [x] **Paso 4:** En `main.js`, orquestar la actualización de la UI cuando el tracker avance de punto.

---

### Tarea 5: Verificación Funcional, Responsiva y Cero Errores
**Archivos:**
- Verificar: Navegador en `http://localhost:8000/`

- [x] **Paso 1:** Probar las 6 palabras dinámicas (`HOLA`, `YO`, `BUENOS`, `DIAS`, `NOCHES`, `NOMBRE`) en la cámara web.
- [x] **Paso 2:** Probar las letras dactilológicas (`A`, `B`, `C`, `L`, `V`) para asegurar que el modo estático no se rompa ni exija movimientos inexistentes.
- [x] **Paso 3:** Inspeccionar `window.__consoleErrors` para garantizar 0 errores en runtime (`app/tools/check_console.js`).
- [x] **Paso 4:** Validar en viewports móvil (390x844) y escritorio (1280x850) que no haya desbordamiento horizontal (`scrollWidth == clientWidth`).
