# Especificación de Diseño: Expansión de 5 Nuevas Señas LSC (AÑOS, LICOR, D, E, U)
**Fecha:** 2026-11-02  
**Estado:** Propuesta aprobada por el usuario (Enfoque A)  
**Proyecto:** EXIS — Tutor Inteligente Interactivo para Lengua de Señas Colombiana (LSC)

---

## 1. Contexto e Intención

El objetivo de esta intervención es expandir el catálogo pedagógico de EXIS con 5 nuevas señas oficiales basadas en el dataset LSC70 (Universidad Tecnológica de Pereira):
1. **Completar las 10 palabras oficiales de LSC70W al 100%:** Añadir las dos palabras restantes del dataset: **AÑOS** (`ANNOS`) y **LICOR** (`LICOR`), sumándose a las 8 existentes (`HOLA`, `YO`, `BUENOS`, `DIAS`, `NOCHES`, `NOMBRE`, `TARDES`, `GUSTAR`).
2. **Consolidar el aprendizaje dactilológico inicial:** Añadir las letras **E**, **U** y **D** a las letras existentes (`A`, `B`, `C`, `I`, `L`, `O`, `V`). Con **E** y **U** se completa el quinteto de vocales en español (`A, E, I, O, U`), y con **D** se cierra el primer bloque continuo del alfabeto (`A, B, C, D`).

---

## 2. Metas y No-Metas

### Metas (Goals)
- **Generación Multimedia de Calidad (Regla 4 AGENTS.md):** Generar para cada una de las 5 señas los archivos `.mp4` y `.webp` continuo a 25 fps (50 frames / 2.0 s), tanto en toma de cuerpo (`_body`) como en primer plano de mano (`_hand`), totalizando 20 archivos multimedia optimizados en `app/videos/real/`.
- **Muestras y Referencias Canónicas:** Extraer y almacenar los fotogramas clave de máxima expresión en `app/dataset_samples/<SEÑA>.jpg` y `referencias_para_gemini/fotos/<SEÑA>_ref.jpg`.
- **Catálogo de Señas (`app/js/signs-data.js`):** Integrar las 5 fichas con descripciones pedagógicas de LSC, consejos de ejecución, reglas formales y coordenadas de trayectorias guiadas para las palabras dinámicas.
- **Evaluación Visual MediaPipe (`app/js/vision-evaluator.js`):** Implementar las reglas geométricas y posicionales para la detección precisa y tolerante de las 5 nuevas señas con mensajes diagnósticos claros y puntajes en tiempo real.
- **Prompts de IA Anime (`referencias_para_gemini/PROMPTS_GEMINI.md`):** Redactar y documentar los prompts oficiales bilingües (español/inglés) para la generación de videos de personaje anime en bucle fluido.
- **Cumplimiento de Reglas Duras:** Respetar el límite de 1,100 líneas por archivo, cero estilos/scripts en línea, puerto 8000, modularidad POO y 0 errores en consola.

### No-Metas (Anti-Goals)
- No modificar ni alterar las 15 señas existentes ni sus evaluadores.
- No alterar la estructura responsive del DOM en `app/index.html`.
- No introducir dependencias externas pesadas o no registradas en `package.json` / CDN.

---

## 3. Enfoques Considerados y Selección

### Enfoque A: Integración Unificada de Pipeline Completo (Seleccionado)
- **Descripción:** Procesar los videos reales interpolados con `cv2.DISOpticalFlow`, actualizar el catálogo `signs-data.js`, añadir las reglas en `vision-evaluator.js`, redactar los prompts en `PROMPTS_GEMINI.md` y verificar integralmente el sistema en un único ciclo coordinado.
- **Ventajas:** Máxima coherencia técnica, cero estados intermedios rotos y cumplimiento directo de todas las 8 reglas del proyecto.

### Enfoque B: Despliegue Escalonado en Dos Fases (Descartado)
- **Descripción:** Procesar primero las dos palabras y probarlas; luego procesar las tres letras en una segunda etapa.
- **Razón de descarte:** Duplica el esfuerzo de edición y testing sobre los mismos archivos núcleo sin ofrecer ventajas operativas.

---

## 4. Especificación Técnica de las 5 Nuevas Señas

### 1. AÑOS (`ANNOS`) — Palabra
- **Categoría:** Palabras / Tiempo y Edad.
- **Gesto Canónico LSC:** Ambas manos frente al torso a la altura del pecho/abdomen; la mano derecha realiza un movimiento circular / frotamiento sobre la mano izquierda marcando el paso del tiempo / años.
- **Tracking:** Muñeca derecha (Landmark 0) o centro de palma.
- **Trayectoria:**
  - Punto 1: Inicio en centro de torso `(x: 0.55, y: 0.65)`
  - Punto 2: Desplazamiento circular / giro `(x: 0.65, y: 0.75)`
  - Punto 3: Retorno al centro `(x: 0.55, y: 0.70)`
- **Regla MediaPipe:** Detección de ambas manos activas a nivel del pecho/abdomen (`wrist.y` entre 0.40 y 0.90) con proximidad entre muñecas menor a 0.40. Fallback tolerante para 1 mano a nivel de torso.

### 2. LICOR (`LICOR`) — Palabra
- **Categoría:** Palabras / Alimentos y Bebidas.
- **Gesto Canónico LSC:** Mano derecha configurada en 'Y' (o dedo meñique erguido / pulgar cerca de la boca), simulando el acto de beber un trago corto con inclinación suave hacia la boca.
- **Tracking:** Yema del pulgar (Landmark 4) o meñique (Landmark 20).
- **Trayectoria:**
  - Punto 1: Mano a la altura del pecho `(x: 0.50, y: 0.65)`
  - Punto 2: Elevación e inclinación hacia la barbilla/boca `(x: 0.52, y: 0.48)`
- **Regla MediaPipe:** Mano derecha elevada hacia el área facial inferior (`wrist.y` entre 0.35 y 0.65), pulgar extendido y/o meñique extendido (configuración de copa/Y), orientación orientada hacia el rostro.

### 3. Letra D (`D`) — Letra Dactilológica
- **Categoría:** Letras.
- **Gesto Canónico LSC:** Dedo índice completamente extendido vertical hacia arriba, mientras los dedos medio, anular y meñique se curvan tocando la yema del pulgar formando un círculo/aro visible (la "panza" de la letra D).
- **Regla MediaPipe:** 
  - `isIndexExt == true` (índice recto hacia arriba).
  - `isMiddleCurled == true`, `isRingCurled == true`, `isPinkyCurled == true`.
  - Distancia entre yema del pulgar (`lm[4]`) y yema del dedo medio (`lm[12]`) < 0.18 (círculo cerrado).

### 4. Letra E (`E`) — Letra Dactilológica
- **Categoría:** Letras.
- **Gesto Canónico LSC:** Los cuatro dedos (índice, medio, anular y meñique) se pliegan/curvan hacia la palma con las yemas apoyadas o enfrentadas a la punta del pulgar plegado horizontalmente en la base.
- **Regla MediaPipe:**
  - Todos los 4 dedos curvados (`curledCount == 4`).
  - Yemas de los dedos agrupadas en altura similar (`y` cercano a la línea de los nudillos PIP).
  - Pulgar descansando bajo las uñas/yemas.

### 5. Letra U (`U`) — Letra Dactilológica
- **Categoría:** Letras.
- **Gesto Canónico LSC:** Dedos índice y medio completamente extendidos hacia arriba y juntos (paralelos, pegados entre sí sin espacio en V), con anular y meñique plegados en puño sujetados por el pulgar.
- **Regla MediaPipe:**
  - `isIndexExt == true` e `isMiddleExt == true`.
  - `isRingCurled == true` e `isPinkyCurled == true`.
  - Distancia entre yemas de índice y medio `dist(lm[8], lm[12]) < 0.08` (pegados, diferenciándolo de la letra V).

---

## 5. Plan de Ejecución y Verificación

1. **Herramienta de Generación (`app/tools/generate_batch_5_signs.py`):**
   - Extraer keyframes de `LSC70/LSC70/LSC70W` (`ANNOS`, `LICOR`) y `LSC70/LSC70/LSC70AN` (`D`, `E`, `U`).
   - Aplicar interpolación por flujo óptico `cv2.DISOpticalFlow` a 25 fps (50 frames continuos).
   - Exportar los 20 videos (`_body.mp4`, `_body.webp`, `_hand.mp4`, `_hand.webp`).
   - Guardar muestras canónicas en `app/dataset_samples/` y `referencias_para_gemini/fotos/`.
2. **Actualización de Datos (`app/js/signs-data.js`):**
   - Insertar `ANNOS` y `LICOR` en `SIGNS_DATA.words`.
   - Insertar `D`, `E` y `U` en `SIGNS_DATA.letters`.
3. **Actualización del Evaluador (`app/js/vision-evaluator.js`):**
   - Añadir bloques de evaluación `else if (signId === 'ANNOS')`, `else if (signId === 'LICOR')`, `else if (signId === 'D')`, `else if (signId === 'E')` y `else if (signId === 'U')`.
4. **Documentación de Prompts Anime (`referencias_para_gemini/PROMPTS_GEMINI.md`):**
   - Agregar tabla y descripciones bilingües con el formato estándar del personaje "Sol".
5. **Verificación Automatizada:**
   - Confirmar existencia y no-vacuidad de los 20 videos generados.
   - Verificar sintaxis JavaScript de todos los módulos editados.
   - Probar que no haya errores en consola (`window.__consoleErrors == []`).
