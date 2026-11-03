# Expansión de 5 Nuevas Señas LSC (AÑOS, LICOR, D, E, U) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar 5 nuevas señas oficiales de LSC (AÑOS, LICOR, D, E, U) con 20 videos fluidos (MP4+WebP a 25 fps), fichas pedagógicas en `signs-data.js`, evaluación en tiempo real en `vision-evaluator.js` y prompts para Anime IA, asegurando máxima fidelidad con el dataset LSC70.

**Architecture:** Generación multimedia offline mediante interpolación de flujo óptico DIS (`cv2.DISOpticalFlow`) con OpenCV y Pillow desde las secuencias de fotogramas originales de LSC70; estructuración de metadatos pedagógicos y puntos de trayectoria en `signs-data.js`; implementación de reglas cinemáticas y geométricas de landmarks en `vision-evaluator.js` con MediaPipe Hands.

**Tech Stack:** Python 3.11 (OpenCV, NumPy, Pillow, MediaPipe Tasks), HTML5/Canvas, JavaScript ES6+, MediaPipe Hands WebGL.

**Spec:** `docs/superpowers/specs/2026-11-02-expansion-5-senas-design.md`

## Global Constraints
- Límite de líneas: Ningún archivo puede superar las 1,100 líneas (Regla 1 AGENTS.md).
- Cero CSS/JS embebido en `app/index.html` (Regla 2 AGENTS.md).
- Servidor y puerto único: `http://localhost:8000/` (Regla 3 AGENTS.md).
- Doble salida multimedia: Cada seña debe tener `.mp4` y `.webp` continuo a 25 fps para `_body` y `_hand` (Regla 4 AGENTS.md).
- Paradigma POO y modularidad estricta (Regla 8 AGENTS.md).
- Consola limpia sin errores (`window.__consoleErrors == []`) (Regla 7 AGENTS.md).

## Review Focus
- **Fidelidad al Dataset LSC70:** Verificar que la postura de manos, ángulos de dedos y puntos de trayectoria repliquen fielmente las muestras originales de LSC70 (`LSC70W` y `LSC70AN`).
- **Diferenciación estricta entre Letra U y Letra V:** La letra U requiere dedos índice y medio erguidos y unidos (`dist(lm[8], lm[12]) < 0.09`), mientras que la letra V requiere apertura en ángulo (`dist(lm[8], lm[12]) >= 0.10`).
- **Diferenciación estricta entre Letra D y Letra O:** La letra D requiere índice completamente extendido vertical hacia arriba (`isIndexExt == true`), mientras que en la letra O el índice debe estar curvado hacia el pulgar (`!isIndexExt`).
- **Tolerancia en evaluación de AÑOS y LICOR:** Soportar tanto la detección de 2 manos como el fallback de 1 mano en la zona correcta del torso/rostro para evitar falsos negativos en webcams con campo visual estrecho.
- **Reproducción continua sin cortes:** Los 20 videos (`.mp4` y `.webp`) deben generarse con bucle suave y sin artefactos en el fotograma de cierre.

---

### Task 1: Generación y Verificación de Videos y Muestras Multimedia (`app/tools/generate_batch_5_signs.py`)

**Files:**
- Create: `app/tools/generate_batch_5_signs.py`
- Output: 
  - `app/videos/real/ANNOS_body.mp4`, `app/videos/real/ANNOS_body.webp`, `app/videos/real/ANNOS_hand.mp4`, `app/videos/real/ANNOS_hand.webp`
  - `app/videos/real/LICOR_body.mp4`, `app/videos/real/LICOR_body.webp`, `app/videos/real/LICOR_hand.mp4`, `app/videos/real/LICOR_hand.webp`
  - `app/videos/real/D_body.mp4`, `app/videos/real/D_body.webp`, `app/videos/real/D_hand.mp4`, `app/videos/real/D_hand.webp`
  - `app/videos/real/E_body.mp4`, `app/videos/real/E_body.webp`, `app/videos/real/E_hand.mp4`, `app/videos/real/E_hand.webp`
  - `app/videos/real/U_body.mp4`, `app/videos/real/U_body.webp`, `app/videos/real/U_hand.mp4`, `app/videos/real/U_hand.webp`
  - `app/dataset_samples/ANNOS.jpg`, `app/dataset_samples/LICOR.jpg`, `app/dataset_samples/D.jpg`, `app/dataset_samples/E.jpg`, `app/dataset_samples/U.jpg`
  - `referencias_para_gemini/fotos/ANNOS_ref.jpg`, `referencias_para_gemini/fotos/LICOR_ref.jpg`, `referencias_para_gemini/fotos/D_ref.jpg`, `referencias_para_gemini/fotos/E_ref.jpg`, `referencias_para_gemini/fotos/U_ref.jpg`

**Interfaces:**
- Consumes: Fotogramas originales de `LSC70/LSC70/LSC70W/Per01` y `LSC70/LSC70/LSC70AN/Per01` / `LSC70ANH/Per01`.
- Produces: 20 archivos multimedia en `app/videos/real/` y 10 imágenes de referencia.

- [ ] **Step 1: Crear el script de generación `app/tools/generate_batch_5_signs.py`**
  Implementar el pipeline con flujo óptico `cv2.DISOpticalFlow`, 50 frames a 25 fps, soporte para crops óptimos (`ANNOS`: `(170, 90, 390, 390)`, `LICOR`: `(180, 90, 380, 380)`) y exportación simultánea de `.mp4` y `.webp` animado.
- [ ] **Step 2: Ejecutar el script de generación**
  Ejecutar `python app/tools/generate_batch_5_signs.py` y registrar tiempos y resultados.
- [ ] **Step 3: Verificar la existencia y tamaño de los 20 videos y 10 imágenes**
  Comprobar mediante script que todos los 20 videos existen, tienen tamaño mayor a 10 KB, y que las imágenes canónicas se hayan guardado correctamente.
- [ ] **Step 4: Commit de assets generados y script de procesamiento**
  ```bash
  git add app/tools/generate_batch_5_signs.py app/videos/real/ app/dataset_samples/ referencias_para_gemini/fotos/
  git commit -m "feat(media): generate videos and samples for ANNOS, LICOR, D, E, U from LSC70"
  ```

---

### Task 2: Actualización del Catálogo Oficial (`app/js/signs-data.js`)

**Files:**
- Modify: `app/js/signs-data.js`

**Interfaces:**
- Consumes: Nuevas señas generadas en Task 1.
- Produces: Estructura ampliada de `window.SIGNS_DATA.words` (10 palabras) y `window.SIGNS_DATA.letters` (10 letras).

- [ ] **Step 1: Escribir prueba de validación sintáctica y estructural**
  Verificar con Node.js que `app/js/signs-data.js` sea sintácticamente válido y exporte `SIGNS_DATA`.
- [ ] **Step 2: Agregar fichas de `ANNOS` y `LICOR` en `SIGNS_DATA.words`**
  - `ANNOS`: Categoría 'words', descripción oficial de movimiento circular/frotamiento en torso, tip pedagógico, reglas `{ type: 'rubbing_hands_chest', height: 'mid' }`, y trayectoria de 3 puntos en torso `[{ id: 1, x: 0.55, y: 0.65, label: 'Inicio' }, { id: 2, x: 0.65, y: 0.72, label: 'Giro' }, { id: 3, x: 0.55, y: 0.70, label: 'Retorno' }]`.
  - `LICOR`: Categoría 'words', descripción de mano en copa/'Y' hacia barbilla/boca, tip pedagógico, reglas `{ type: 'cup_to_mouth', height: 'high' }`, y trayectoria de 2 puntos `[{ id: 1, x: 0.50, y: 0.65, label: 'Pecho' }, { id: 2, x: 0.52, y: 0.48, label: 'Boca / Barbilla' }]`.
- [ ] **Step 3: Agregar fichas de `D`, `E`, y `U` en `SIGNS_DATA.letters`**
  - `D`: Letra Dactilológica, descripción de índice erguido y aro de pulgar con medio, tip, reglas `{ type: 'd_shape', height: 'any' }`.
  - `E`: Letra Dactilológica, descripción de 4 dedos curvados plegados sobre el pulgar, tip, reglas `{ type: 'e_shape', height: 'any' }`.
  - `U`: Letra Dactilológica, descripción de índice y medio erguidos y unidos sin apertura en V, tip, reglas `{ type: 'u_shape', height: 'any' }`.
- [ ] **Step 4: Ejecutar verificación de Node.js**
  Ejecutar: `node -e "const fs = require('fs'); eval(fs.readFileSync('app/js/signs-data.js','utf8')); console.log('Words:', SIGNS_DATA.words.length, 'Letters:', SIGNS_DATA.letters.length);"`
  Esperado: `Words: 10 Letters: 10`.
- [ ] **Step 5: Commit de catálogo actualizado**
  ```bash
  git add app/js/signs-data.js
  git commit -m "feat(catalog): register ANNOS, LICOR, D, E, U in SIGNS_DATA"
  ```

---

### Task 3: Implementación de Reglas de Evaluación MediaPipe (`app/js/vision-evaluator.js`)

**Files:**
- Modify: `app/js/vision-evaluator.js`

**Interfaces:**
- Consumes: `signId` desde `setTargetSign(sign)` y landmarks de MediaPipe Hands (`lm`, `lm2`).
- Produces: `score`, `hint`, y `diag` en tiempo real para las 5 nuevas señas.

- [ ] **Step 1: Implementar evaluador para `ANNOS`**
  Detectar posición de ambas manos o mano principal a nivel del torso (`wrist.y` entre 0.40 y 0.90) y movimiento circular en torso con feedback amigable ("¡Excelente seña de AÑOS! Movimiento circular en torso...").
- [ ] **Step 2: Implementar evaluador para `LICOR`**
  Detectar mano ascendiendo hacia la barbilla/boca (`wrist.y` entre 0.35 y 0.65) con pulgar extendido y/o meñique erguido (configuración de copa/'Y') y orientación hacia el rostro.
- [ ] **Step 3: Implementar evaluador para `D`**
  Verificar `isIndexExt` (índice erguido), `isMiddleCurled && isRingCurled && isPinkyCurled`, y proximidad entre pulgar y medio `dist(lm[4], lm[12]) < 0.18`.
- [ ] **Step 4: Implementar evaluador para `E`**
  Verificar que los 4 dedos estén curvados hacia abajo (`isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled`) y alineados sobre la palma/pulgar.
- [ ] **Step 5: Implementar evaluador para `U`**
  Verificar `isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled`, con distancia cerrada entre índice y medio `dist(lm[8], lm[12]) < 0.09` (distinguiéndola nítidamente de la letra V).
- [ ] **Step 6: Verificar que `app/js/vision-evaluator.js` permanezca bajo 1,100 líneas**
  Ejecutar script para confirmar recuento de líneas (máximo 1,100).
- [ ] **Step 7: Commit de evaluador de visión**
  ```bash
  git add app/js/vision-evaluator.js
  git commit -m "feat(vision): implement evaluation rules for ANNOS, LICOR, D, E, U"
  ```

---

### Task 4: Documentación de Prompts Oficiales Anime IA (`referencias_para_gemini/PROMPTS_GEMINI.md`)

**Files:**
- Modify: `referencias_para_gemini/PROMPTS_GEMINI.md`

**Interfaces:**
- Consumes: Referencias de keyframes canónicos de las 5 nuevas señas.
- Produces: Tabla actualizada de 20 señas oficiales y 5 pares de prompts detallados (Español e Inglés) para el personaje "Sol".

- [ ] **Step 1: Actualizar la tabla resumen de señas oficiales**
  Agregar las filas para `ANNOS`, `LICOR`, `D`, `E` y `U` con sus gestos clave y archivos destino.
- [ ] **Step 2: Redactar los prompts bilingües detallados**
  Incluir la especificación cinemática en bucle perfecto de 2.5s, anatomía de manos y referencias a `fotos/<SEÑA>_ref.jpg`.
- [ ] **Step 3: Commit de documentación de prompts**
  ```bash
  git add referencias_para_gemini/PROMPTS_GEMINI.md
  git commit -m "docs(prompts): add anime generation prompts for ANNOS, LICOR, D, E, U"
  ```

---

### Task 5: Verificación Integral del Sistema en Servidor Local

**Files:**
- Test: Script de verificación headless / consola.

- [ ] **Step 1: Verificar que el servidor `server.py` responde en puerto 8000**
  Ejecutar petición HTTP a `http://localhost:8000/`.
- [ ] **Step 2: Cargar la aplicación y verificar ausencia de errores en consola**
  Ejecutar verificación con headless browser o script de prueba comprobando que `window.__consoleErrors` esté vacío.
- [ ] **Step 3: Verificar que el catálogo muestra las 10 palabras y 10 letras**
  Confirmar que la interfaz renderiza los 20 botones de seña y que al seleccionar cualquiera de las 5 nuevas señas carga su video correspondiente.
- [ ] **Step 4: Limpiar archivos scratch temporales**
  Eliminar archivos auxiliares creados en raíz (`scratch_*.jpg`).
