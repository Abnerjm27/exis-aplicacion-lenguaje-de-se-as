# Guía Oficial de Prompts y Referencias Anime IA — Proyecto EXIS (LSC)

Este documento contiene la especificación visual y la tabla completa de **11 prompts en español e inglés** optimizados para generar los videos demostrativos del personaje Anime IA en bucle fluido (*seamless loop*) utilizando **Gemini Web (`gemini.google.com`) con Veo / Imagen 3 Video**, **Kling AI**, **Runway Gen-3 Alpha**, **Pika Labs** o **Luma Dream Machine**.

---

## 1. Identidad Visual del Personaje Oficial: "Sol" (Consistencia Global)

Para mantener una consistencia visual perfecta con la **Hoja de Personaje Oficial** (`referencias_para_gemini/hoja_personaje_referencia.png` y visor web `http://localhost:8000/hoja_personaje.html`), todos los prompts comparten la misma base de personaje, vestimenta e iluminación:

- **Personaje:** "Sol", tutor anime juvenil de Lengua de Señas Colombiana (19-21 años), expresión acogedora y pedagógica, sonrisa cálida, ojos ámbar/miel directos a cámara, cabello castaño oscuro con corte limpio que despeja por completo la frente, orejas, mejillas y boca.
- **Estilo:** Anime cel-shading de alta definición (estilo producción *Makoto Shinkai / Kyoto Animation*), líneas nítidas, estética settei profesional.
- **Vestimenta Ergonómica LSC:** Camiseta interior ajustada azul carbón oscuro (`#14171F`) que crea máximo contraste con la piel de las manos; chaqueta deportiva ligera abierta color pizarra/ámbar (`#FBBF24` / `#4B5563`) con mangas recogidas hasta el codo para que antebrazos, muñecas y manos queden 100% despejados.
- **Manos (Crítico):** 5 dedos anatómicamente perfectos, bien separados, sin guantes, sin anillos.
- **Fondo e Iluminación:** Estudio fotográfico sobre fondo neutro pizarra suave (`#111827`), luz frontal difusa y luz de contorno nítida en los dedos para evitar aberraciones dactilares.
- **Encuadre:** Plano medio (*medium shot*, torso superior, pecho y ambas manos completamente dentro del encuadre).
- **Cinemática:** Bucle continuo (*seamless loop* de 2 a 3 segundos), iniciando en posición neutral relajada, ejecutando la seña con precisión dactilar, pausando 0.5 segundos en la pose clave, y retornando suavemente a la posición neutral.

---

## 2. Flujo de Trabajo Paso a Paso para Generar en Gemini Web o Kling

1. **Abrir Gemini Web / Kling:**
   - Ingresa a [gemini.google.com](https://gemini.google.com) o tu generador de video preferido ([klingai.com](https://klingai.com), [runwayml.com](https://runwayml.com)).
2. **Adjuntar Referencias:**
   - Sube la imagen del personaje: `anime_character_render.png`.
   - Sube el fotograma clave de la seña deseada desde `referencias_para_gemini/fotos/<SEÑA>_ref.jpg`.
3. **Pegar el Prompt:**
   - Copia el prompt correspondiente de la tabla a continuación (versión en español o inglés).
4. **Configurar Parámetros del Generador:**
   - **Duración:** 2.0 a 3.0 segundos.
   - **Modo:** *Loop* / Repetición continua activada.
   - **Resolución:** 1080p o 720p (relación de aspecto 16:9 o 4:3 para cuerpo, 1:1 para mano).
5. **Guardar el Video Generado en la Aplicación:**
   - Descarga el archivo de video resultante y guárdalo en:
     - `app/videos/anime/<SEÑA>_body.mp4` (para la vista de cuerpo completo)
     - `app/videos/anime/<SEÑA>_hand.mp4` (para el primer plano de la mano)
6. **Verificación Automática:**
   - Al pulsar el botón **"Anime IA"** en la interfaz de EXIS, el reproductor detectará automáticamente el archivo `.mp4` y lo reproducirá en bucle continuo.

---

## 3. Tabla Resumen de las 11 Señas Oficiales

| ID Seña | Categoría | Foto de Referencia | Gesto Clave LSC | Archivo Destino |
|:---|:---:|:---|:---|:---|
| **HOLA** | Palabra | `fotos/HOLA_ref.jpg` | Mano derecha abierta a la altura de la sien con saludo suave | `app/videos/anime/HOLA_body.mp4` |
| **YO** | Palabra | `fotos/YO_ref.jpg` | Puño cerrado con dedo índice señalando al centro del pecho | `app/videos/anime/YO_body.mp4` |
| **BUENOS** | Palabra | `fotos/BUENOS_ref.jpg` | Yemas de los dedos juntas en el mentón proyectadas al frente | `app/videos/anime/BUENOS_body.mp4` |
| **DIAS** | Palabra | `fotos/DIAS_ref.jpg` | Ambos brazos se abren hacia los lados como el amanecer | `app/videos/anime/DIAS_body.mp4` |
| **NOCHES** | Palabra | `fotos/NOCHES_ref.jpg` | Ambos brazos cruzados sobre el pecho descansando en antebrazos | `app/videos/anime/NOCHES_body.mp4` |
| **NOMBRE** | Palabra | `fotos/NOMBRE_ref.jpg` | Dedos índice y medio de la mano derecha sobre los de la izquierda | `app/videos/anime/NOMBRE_body.mp4` |
| **A** | Letra | `fotos/A_ref.jpg` | Puño cerrado con pulgar erguido al lateral del índice | `app/videos/anime/A_body.mp4` |
| **B** | Letra | `fotos/B_ref.jpg` | Cuatro dedos extendidos hacia arriba y pulgar doblado en palma | `app/videos/anime/B_body.mp4` |
| **C** | Letra | `fotos/C_ref.jpg` | Dedos y pulgar arqueados formando el semicírculo de la letra C | `app/videos/anime/C_body.mp4` |
| **L** | Letra | `fotos/L_ref.jpg` | Índice vertical y pulgar horizontal formando ángulo de 90° | `app/videos/anime/L_body.mp4` |
| **V** | Letra | `fotos/V_ref.jpg` | Índice y medio abiertos en V (victoria), anular y meñique sujetos | `app/videos/anime/V_body.mp4` |

---

## 4. Prompts Detallados para Copiar y Pegar

### 01. Seña: HOLA (Saludo)
**Español:**
```text
Video en bucle perfecto de 2 segundos. Joven tutora anime de lengua de señas (estilo 3D cel-shaded moderno, cabello castaño oscuro con flequillo, chaqueta técnica blanca y gris con detalles cian neón, fondo oscuro azul pizarra de estudio #070c18). 
Muestra el torso superior y ambas manos. La tutora levanta su mano derecha a la altura de su sien derecha con la palma mirando hacia adelante y los 5 dedos extendidos y ligeramente separados. Realiza un suave y elegante movimiento de saludo hacia el lateral (dos pequeñas oscilaciones naturales de muñeca), manteniendo una sonrisa cálida y amigable. Luego regresa suavemente al reposo inicial. 
Bucle fluido, dedos anatómicamente perfectos sin deformaciones, iluminación de estudio suave con rim light cian en bordes. 60 fps, 4k render, seamless looping animation.
```

**English:**
```text
Seamless 2-second perfect loop video. Young anime female sign language tutor (modern 3D cel-shaded style, dark brown hair with stylish bangs, white and light slate futuristic jacket with subtle neon cyan trims, studio dark slate #070c18 background). 
Medium close-up showing upper torso and hands clearly. The character raises her right hand to the height of her right temple, open palm facing forward with all five fingers cleanly extended and slightly separated. She performs a smooth, gentle sign greeting wave with two natural lateral wrist oscillations while smiling warmly and pedagogically. Smoothly returns to neutral rest pose. 
Seamless loop, perfect hand anatomy, no extra fingers, soft studio lighting with cyan rim light. 60 fps, 4k render, ultra smooth sign demonstration.
```

---

### 02. Seña: YO (Pronombre Primera Persona)
**Español:**
```text
Video en bucle perfecto de 2 segundos. Personaje anime femenino tutora de LSC (estilo anime 3D moderno, chaqueta técnica blanca con acentos cian, fondo oscuro de estudio #070c18). 
Plano medio del torso. La mano derecha parte de reposo, forma un puño cerrado dejando únicamente el dedo índice extendido y firme. Lleva la mano hacia el centro de su propio pecho/esternón, apuntando su dedo índice directamente hacia sí misma a unos 3 cm del pecho, indicando 'YO' con convicción pedagógica y mirada empática. Sostiene el gesto por 0.5 segundos y regresa suavemente al reposo inicial. 
Bucle sin cortes, dedos perfectamente dibujados, iluminación limpia con resplandor cian sutil, animación fluida y natural.
```

**English:**
```text
Seamless 2-second loop video. Young female anime sign language instructor (modern cel-shaded 3D anime aesthetic, light athletic tech jacket with cyan accents, dark navy studio background #070c18). 
Upper torso framing. The character starts from rest, forms a clean right-hand fist with only the index finger firmly extended. She gracefully brings the hand to the center of her chest, pointing the index finger directly toward her sternum indicating 'ME / I' with an engaging, polite facial expression. Pauses cleanly for half a second, then smoothly transitions back to resting pose. 
Flawless continuous loop, accurate hand anatomy, studio lighting with soft cyan rim lighting.
```

---

### 03. Seña: BUENOS / BUENAS (Cortesía)
**Español:**
```text
Video en bucle perfecto de 2 segundos. Joven tutora anime de señas LSC (estilo anime moderno 3D, cabello castaño con reflejos suaves, chaqueta blanca con ribetes cian, fondo minimalista oscuro #070c18). 
Muestra el torso y rostro. La mano derecha sube con los dedos índice, medio, anular y meñique juntos y extendidos. Apoya suavemente las yemas de los dedos sobre la barbilla/mentón, y con un movimiento elegante proyecta la mano hacia adelante y ligeramente hacia abajo en señal de bendición y cortesía ('BUENOS / AS'). Su rostro expresa amabilidad y respeto. Retorna de forma fluida a la postura inicial. 
Bucle continuo perfecto, mano y dedos perfectamente definidos, iluminación cinematográfica suave.
```

**English:**
```text
Seamless 2-second loop video. Young female anime sign tutor (clean cel-shaded anime aesthetic, dark brown hair with soft highlights, white high-tech jacket with cyan details, sleek dark background #070c18). 
Medium framing focusing on face and torso. Right hand raises with fingers straight and together; fingertips gently touch the chin and gracefully project forward and slightly downward in a polite welcoming salute for 'GOOD / BUENOS'. Friendly, welcoming facial expression. Fluidly eases back to neutral rest. 
Seamless continuous loop, crystal clear fingers and thumb, professional studio illumination with soft rim highlights.
```

---

### 04. Seña: DÍAS (Tiempo / Amanecer)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutora anime de LSC (estilo 3D anime pulido, chaqueta deportiva blanca y gris claro con líneas cian neón, fondo oscuro #070c18). 
Plano medio amplio mostrando ambos brazos y torso completo. Ambos brazos parten del centro del pecho con las manos juntas o cruzadas a la altura del corazón. Con un movimiento amplio, simétrico y luminoso, abre ambos brazos hacia los costados extendiendo los antebrazos y las palmas abiertas hacia el frente a la altura de los hombros, simulando el resplandor y la salida del sol ('DÍAS'). Expresión alegre y luminosa. Pausa en la apertura y regresa armónicamente al centro. 
Bucle perfecto, sincronización bimanual exacta, dedos detallados sin fallas, iluminación limpia.
```

**English:**
```text
Seamless 2.5-second loop video. Young anime female sign instructor (high-end 3D anime style, crisp white technical jacket with cyan accents, dark cinematic studio background #070c18). 
Medium-wide upper body framing showing both arms and torso. Both hands start together in front of the chest, then gracefully open outwards to each side at shoulder level with open palms facing forward, symbolizing sunrise and daylight ('DAYS / DÍAS'). Radiant, warm smile. Clean pause at full expansion, then fluidly returns to the starting chest position. 
Flawless seamless loop, perfect bilateral arm coordination, sharp handshapes, beautiful studio lighting.
```

---

### 05. Seña: NOCHES (Tiempo / Anochecer)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutora anime de LSC (estilo anime 3D cel-shaded, chaqueta blanca y gris con detalles cian neón, fondo oscuro azul pizarra #070c18). 
Plano medio de torso y brazos. Ambos brazos parten de reposo y suben suavemente para cruzarse horizontalmente frente al pecho en forma de X. La mano derecha descansa plana sobre el antebrazo/bíceps izquierdo, y la mano izquierda sobre el antebrazo derecho, simbolizando el recogimiento y la llegada de la noche ('NOCHES'). Expresión serena, tranquila y sosegada. Sostiene el cruce 0.5 segundos y desciende los brazos de forma fluida a la posición neutral. 
Bucle continuo sin saltos, anatomía de manos y brazos perfecta, iluminación suave con luz de contorno cian.
```

**English:**
```text
Seamless 2.5-second loop video. Young female anime sign language tutor (refined 3D anime aesthetic, light futuristic hoodie with indigo and cyan trims, dark studio backdrop #070c18). 
Torso framing. Both arms lift smoothly and cross horizontally in front of the chest into an X pose. The right hand rests flat on the left forearm/bicep, and the left hand rests on the right forearm, symbolizing the peaceful arrival of night ('NIGHTS / NOCHES'). Calm, serene facial expression. Holds the crossed pose cleanly, then gently lowers both arms back to neutral resting position. 
Seamless loop, impeccable hand crossing geometry, soft cinematic studio rim light.
```

---

### 06. Seña: NOMBRE (Identificación)
**Español:**
```text
Video en bucle perfecto de 2 segundos. Tutora anime de LSC (estilo 3D anime, chaqueta blanca con acentos cian, fondo oscuro #070c18). 
Plano medio centrado en el torso y manos. Ambas manos se sitúan frente al pecho: la mano izquierda extiende horizontalmente los dedos índice y medio juntos hacia la derecha (otros dedos doblados). La mano derecha extiende también sus dedos índice y medio juntos y realiza un suave toque o apoyo de doble contacto sobre los dedos extendidos de la mano izquierda ('NOMBRE'). Mirada atenta y pedagógica hacia el usuario. Regresa con gracia al reposo inicial. 
Bucle cerrado suave, definición ultra nítida de los dedos índice y medio de ambas manos, iluminación de alta definición.
```

**English:**
```text
Seamless 2-second loop video. Young anime sign language tutor (3D cel-shaded style, white and slate tech jacket with cyan neon accents, dark navy studio backdrop #070c18). 
Medium shot focused on hands in front of torso. Left hand holds index and middle fingers extended horizontally together with palm facing inward. Right hand extends index and middle fingers together and performs a crisp, gentle double tap on top of the left fingers representing 'NAME / NOMBRE'. Attentive, supportive facial expression. Hands smoothly return to rest. 
Seamless infinite loop, sharp finger separation and accurate contact physics, studio rim lighting.
```

---

### 07. Dactilología: Letra A
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de lengua de señas (estilo 3D cel-shaded, chaqueta blanca con detalles cian, fondo oscuro #070c18). 
Primer plano medio mostrando la mano derecha a la altura del pecho-hombro con la palma hacia el frente. La mano forma la configuración dactilológica de la letra 'A': los cuatro dedos (índice, medio, anular y meñique) están completamente cerrados en un puño compacto, y el pulgar permanece recto y erguido apoyado al lateral exterior del dedo índice apuntando hacia arriba. La mano se presenta nítida, firme y estable durante 1 segundo, luego relaja ligeramente y vuelve a la posición. 
Bucle fluido, articulaciones y uñas definidas con precisión anatómica perfecta, iluminación de estudio suave con rim light cian.
```

**English:**
```text
Seamless 2-second loop video. Anime sign language teacher (modern 3D cel-shaded anime look, white jacket with cyan highlights, dark studio background #070c18). 
Chest-level close-up of the right hand. The hand cleanly demonstrates the sign alphabet letter 'A': all four fingers (index to pinky) are curled tightly into a solid fist, while the thumb rests straight and upright along the outer edge of the index finger, pointing upwards. Palm faces directly forward. Hand remains steady and clearly readable, then relaxes slightly and resets. 
Seamless loop, perfect finger count and knuckle anatomy, crisp focus with subtle cyan contour lighting.
```

---

### 08. Dactilología: Letra B
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de LSC (estilo 3D anime, chaqueta técnica blanca, fondo oscuro #070c18). 
Primer plano medio de la mano derecha a la altura del pecho con la palma hacia el frente. Muestra la letra dactilológica 'B': los cuatro dedos (índice, medio, anular y meñique) se extienden completamente rectos y unidos entre sí hacia arriba formando una superficie plana; el dedo pulgar se dobla horizontalmente sobre la base de la palma. La mano se muestra con estabilidad y nitidez pedagógica. 
Bucle continuo, 4 dedos rectos y paralelos sin deformaciones, pulgar doblado limpiamente, iluminación suave con resplandor cian en los bordes.
```

**English:**
```text
Seamless 2-second loop video. Female anime sign language tutor (modern 3D anime style, clean white tech hoodie, studio dark background #070c18). 
Close-up of the right hand at chest height with palm facing forward. The hand displays the sign alphabet letter 'B': all four fingers (index, middle, ring, pinky) are held straight, fully extended, and pressed tightly side-by-side pointing directly upward; the thumb is folded flat across the lower palm. Clear, steady educational presentation. 
Seamless loop, crisp finger silhouettes, accurate hand proportions, studio lighting with cyan edge glow.
```

---

### 09. Dactilología: Letra C
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de LSC (estilo cel-shaded 3D moderno, chaqueta blanca con ribetes cian neón, fondo oscuro #070c18). 
Primer plano de la mano derecha a la altura del pecho. La mano se coloca de perfil/tres cuartos mostrando la forma tridimensional de la letra 'C': los cuatro dedos permanecen juntos y curvados uniformemente hacia abajo, mientras que el pulgar se curva hacia arriba enfrentado a ellos, formando el arco semicircular continuo y limpio de la letra C. Sostiene la pose con claridad absoluta y relaja levemente. 
Bucle sin cortes, curvatura de los dedos perfecta y proporcionada, iluminación nítida con reflejos cian.
```

**English:**
```text
Seamless 2-second loop video. Young anime sign language instructor (crisp 3D cel-shaded style, white athletic jacket, dark slate background #070c18). 
Close-up of the right hand at chest level in semi-profile. The hand clearly forms the letter 'C': the four fingers curve together smoothly downwards while the thumb curves upwards directly facing them, creating a distinct, elegant C-shaped arch with empty space inside the contour. Held steadily for visual clarity. 
Seamless loop, pristine finger curvature, accurate anatomy, beautiful soft studio lighting with cyan rim light.
```

---

### 10. Dactilología: Letra L
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de LSC (estilo 3D anime, vestimenta técnica blanca, fondo oscuro #070c18). 
Primer plano de la mano derecha frente al pecho con la palma mirando hacia el frente. Configuración dactilológica de la letra 'L': el dedo índice apunta completamente recto y vertical hacia arriba; el dedo pulgar se extiende perpendicularmente hacia la izquierda formando un ángulo recto exacto de 90 grados con el índice; los otros tres dedos (medio, anular y meñique) están firmemente plegados en la palma. La postura es rígida, precisa y educativa. 
Bucle perfecto, ángulo de 90° exacto y limpio, dedos perfectamente modelados, iluminación de estudio suave con rim light cian.
```

**English:**
```text
Seamless 2-second loop video. Anime sign tutor (refined 3D anime aesthetic, modern white tech jacket with cyan accents, dark studio background #070c18). 
Clear close-up of the right hand at chest height, palm facing forward. The hand demonstrates the letter 'L': the index finger points straight vertically upward, the thumb extends horizontally at an exact 90-degree right angle, and the remaining three fingers (middle, ring, pinky) are curled neatly into the palm. Precise, firm pedagogical demonstration. 
Seamless infinite loop, sharp perpendicular angles, immaculate hand anatomy, subtle cyan rim lighting.
```

---

### 11. Dactilología: Letra V (Victoria)
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de lengua de señas (estilo anime 3D cel-shaded, chaqueta blanca y cian, fondo oscuro #070c18). 
Primer plano de la mano derecha a la altura del pecho con la palma al frente. Configuración dactilológica de la letra 'V': los dedos índice y medio se extienden rectos hacia arriba y separados en forma de 'V' (signo de victoria/paz), con una separación de unos 30 grados entre ellos; el dedo anular y el meñique están doblados hacia la palma y sujetos suavemente por el pulgar. Sonrisa amigable y motivadora. 
Bucle continuo, dedos índice y medio firmes y proporcionales, separación limpia, iluminación de estudio con brillo cian en los bordes.
```

**English:**
```text
Seamless 2-second loop video. Young female anime sign language mentor (modern 3D anime style, clean white and cyan futuristic jacket, dark background #070c18). 
Close-up of the right hand at chest level, palm facing forward. The hand executes the letter 'V': index and middle fingers are straight, extended upward, and spread apart into a crisp 'V' shape (peace / victory sign) with ~30 degree separation; ring and pinky fingers are folded down against the palm and held by the thumb. Friendly, motivating smile. 
Seamless loop, perfect finger geometry, no artifacts or distortion, high-end studio lighting with cyan contour rim light.
```

---

## 5. Parámetros Negativos Recomendados (Negative Prompts)

Para generadores como Kling AI, Runway o Stable Video Diffusion que permiten *negative prompts*:

```text
extra fingers, missing fingers, deformed hands, distorted fingers, fused digits, blurry hands, jittery motion, abrupt cuts, flickering, low resolution, bad anatomy, mutated hands, multiple arms, jerky camera, noisy background, text watermark.
```
