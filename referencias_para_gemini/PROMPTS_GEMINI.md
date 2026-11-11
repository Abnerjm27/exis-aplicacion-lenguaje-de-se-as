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
   - Sube la imagen del personaje: `referencias_para_gemini/anime_character_render.png`.
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

## 3. Tabla Resumen de las 20 Señas Oficiales

| ID Seña | Categoría | Foto de Referencia | Gesto Clave LSC | Archivo Destino |
|:---|:---:|:---|:---|:---|
| **HOLA** | Palabra | `fotos/HOLA_ref.jpg` | Mano derecha en la sien proyectándose hacia adelante y afuera en diagonal | `app/videos/anime/HOLA_body.mp4` |
| **YO** | Palabra | `fotos/YO_ref.jpg` | Puño cerrado con dedo índice señalando al centro del pecho | `app/videos/anime/YO_body.mp4` |
| **BUENOS** | Palabra | `fotos/BUENOS_ref.jpg` | Mano derecha baja desde arriba y choca con la palma sobre la mano izquierda en el centro | `app/videos/anime/BUENOS_body.mp4` |
| **DIAS** | Palabra | `fotos/DIAS_ref.jpg` | Ambos brazos se abren hacia los lados como el amanecer | `app/videos/anime/DIAS_body.mp4` |
| **TARDES** | Palabra | `fotos/TARDES_ref.jpg` | Ambos brazos se cruzan horizontalmente a la altura del pecho (atardecer formal) | `app/videos/anime/TARDES_body.mp4` |
| **NOCHES** | Palabra | `fotos/NOCHES_ref.jpg` | Ambos brazos cruzados sobre el pecho descansando en antebrazos | `app/videos/anime/NOCHES_body.mp4` |
| **GUSTAR** | Palabra | `fotos/GUSTAR_ref.jpg` | Dedo índice derecho extendido apuntando hacia arriba tocando la garganta/cuello con la cabeza levantada | `app/videos/anime/GUSTAR_body.mp4` |
| **NOMBRE** | Palabra | `fotos/NOMBRE_ref.jpg` | Dedos índice y medio de la mano derecha sobre los de la izquierda | `app/videos/anime/NOMBRE_body.mp4` |
| **ANNOS** | Palabra | `fotos/ANNOS_ref.jpg` | Movimiento circular frotando ambas manos en el torso (paso de los años) | `app/videos/anime/ANNOS_body.mp4` |
| **LICOR** | Palabra | `fotos/LICOR_ref.jpg` | Mano derecha en copa / letra Y ascendiendo hacia la barbilla y boca simulando beber | `app/videos/anime/LICOR_body.mp4` |
| **A** | Letra | `fotos/A_ref.jpg` | Puño cerrado con pulgar erguido al lateral del índice | `app/videos/anime/A_body.mp4` |
| **B** | Letra | `fotos/B_ref.jpg` | Cuatro dedos extendidos hacia arriba y pulgar doblado en palma | `app/videos/anime/B_body.mp4` |
| **C** | Letra | `fotos/C_ref.jpg` | Dedos y pulgar arqueados formando el semicírculo de la letra C | `app/videos/anime/C_body.mp4` |
| **D** | Letra | `fotos/D_ref.jpg` | Índice erguido vertical hacia arriba y aro cerrado entre pulgar y medio | `app/videos/anime/D_body.mp4` |
| **E** | Letra | `fotos/E_ref.jpg` | Cuatro dedos curvados juntos hacia abajo descansando sobre el pulgar | `app/videos/anime/E_body.mp4` |
| **I** | Letra | `fotos/I_ref.jpg` | Puño cerrado con meñique extendido vertical hacia arriba | `app/videos/anime/I_body.mp4` |
| **L** | Letra | `fotos/L_ref.jpg` | Índice vertical y pulgar horizontal formando ángulo de 90° | `app/videos/anime/L_body.mp4` |
| **O** | Letra | `fotos/O_ref.jpg` | Cuatro dedos curvados tocando la yema del pulgar formando un círculo O | `app/videos/anime/O_body.mp4` |
| **U** | Letra | `fotos/U_ref.jpg` | Dedos índice y medio erguidos y unidos (paralelos sin separación en V) | `app/videos/anime/U_body.mp4` |
| **V** | Letra | `fotos/V_ref.jpg` | Índice y medio abiertos en V (victoria), anular y meñique sujetos | `app/videos/anime/V_body.mp4` |

---

## 4. Prompts Detallados para Copiar y Pegar

### 01. Seña: HOLA (Saludo Oficial LSC70)
**Español:**
```text
Video en bucle perfecto de 2.5 segundos. Personaje tutor anime de Lengua de Señas Colombiana (LSC70, estilo anime cel-shading nítido, cabello castaño con flequillo despejando rostro, fondo neutro azul pizarra oscuro #070c18). 
Plano medio mostrando claramente torso superior y rostro. Seña oficial de LSC para 'HOLA': La mano derecha parte con los cuatro dedos juntos y rectos y el pulgar descansando suavemente sobre el lateral, colocada junto a la sien/ceja derecha (postura de saludo formal o saludo militar suave, palma orientada en diagonal hacia adentro/abajo). Desde la sien, el personaje proyecta el brazo y la mano hacia adelante y hacia afuera en un movimiento diagonal recto y elegante, despegando la mano de la sien para saludar al interlocutor. Pausa 0.4 segundos en la extensión clave mostrando la pose exacta de la foto de referencia (fotos/HOLA_ref.jpg), y regresa con naturalidad al reposo.
Cinemática exacta de LSC, dedos firmes y anatómicamente correctos, sin sacudidas ni oscilaciones de dedos, iluminación difusa de estudio con borde sutil. 60 fps, render limpio, bucle continuo y fluido.
```

**English:**
```text
Seamless 2.5-second perfect loop video. Anime Colombian Sign Language (LSC) instructor (crisp cel-shaded anime style, dark brown hair with bangs clearing the face, studio dark slate background #070c18). 
Medium shot framing torso, head and right hand clearly. Canonical LSC sign for 'HOLA' (Hello): The character starts with the right hand placed at the right temple/eyebrow (formal salute position, four fingers straight and joined together, thumb resting against the hand, palm angled diagonally inward/downward). From the temple, the right arm and hand project forward and outward in a clean, elegant diagonal extension away from the head toward the viewer. Holds the key salute projection pose for 0.4 seconds matching the reference photo exactly (fotos/HOLA_ref.jpg), then returns smoothly to neutral rest pose. 
Accurate sign language kinematics, anatomically flawless hands, no waving or flapping fingers, crisp studio lighting. 60 fps, clean render, seamless looping animation.
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

### 03. Seña: BUENOS / BUENAS (Cortesía - LSC70)
**Español:**
```text
Video en bucle perfecto de 2.5 segundos. Tutora anime de señas LSC (estilo anime moderno 3D, cabello castaño con flequillo despejando rostro, chaqueta técnica gris pizarra con detalles ámbar #FBBF24, fondo de estudio oscuro #070c18). 
Plano medio mostrando torso superior y ambas manos. La mano izquierda se sostiene abierta como base frente al centro del pecho con la palma orientada hacia arriba. La mano derecha (con los dedos juntos y extendidos) parte desde la altura superior del pecho, desciende con un movimiento limpio y choca apoyando la palma firmemente sobre la palma de la mano izquierda en la mitad del torso (seña de 'BUENOS / AS' en Lengua de Señas Colombiana - LSC70). Pausa 0.4 segundos en el contacto y retorna suavemente a la posición de reposo. 
Bucle fluido, dedos perfectamente dibujados en ambas manos, iluminación cinematográfica suave. 24 fps, clean seamless loop.
```

**English:**
```text
Seamless 2.5-second loop video. Young female anime sign tutor (clean cel-shaded 3D anime aesthetic, dark brown hair with bangs clearing the face, slate athletic jacket with amber accents #FBBF24, dark navy studio background #070c18). 
Medium shot showing upper torso and both hands. The left hand is held open as a flat base in front of the center of the chest with palm facing upward. The right hand (fingers together and flat) starts from upper chest level, moves downward and lands with its palm slapping/resting firmly onto the left palm in the middle of the torso (Colombian Sign Language 'BUENOS / GOOD' - LSC70). Pauses for 0.4 seconds upon contact, then smoothly returns to neutral resting position. 
Seamless continuous loop, crystal clear fingers and palms on both hands, professional studio illumination. 24 fps.
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

### 12. Seña: TARDES (Cortesía y Tiempo - LSC70)
**Español:**
```text
Video en bucle perfecto de 2.5 segundos. Tutora anime de Lengua de Señas Colombiana (estilo anime cel-shading nítido, cabello castaño recogido despejando rostro y cuello, chaqueta técnica pizarra con toques ámbar #FBBF24, fondo de estudio oscuro #070c18).
Plano medio mostrando torso superior, hombros y ambos brazos claramente. Seña oficial de LSC para 'TARDES': Ambos brazos parten de una postura relajada y se elevan frente al pecho, cruzándose de forma horizontal a la altura media del torso, con los antebrazos superpuestos y las palmas de las manos reposando suavemente sobre el antebrazo o codo contrario, simulando el reposo y la transición de la tarde. Pausa 0.4 segundos mostrando con nitidez la pose de referencia (fotos/TARDES_ref.jpg), y retorna de manera fluida y suave a la postura neutral.
Cinemática precisa de señas LSC, manos y dedos perfectamente definidos sin deformaciones, iluminación frontal suave de estudio con sutil luz de borde. 60 fps, render limpio, bucle continuo y armónico.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language (LSC) tutor (crisp cel-shaded anime style, neat dark brown hair clearing face and neck, slate jacket with amber accents #FBBF24, dark studio background #070c18).
Medium shot framing upper chest, shoulders, and both arms. Canonical LSC sign for 'TARDES' (Afternoon): Both arms raise in front of the chest and cross horizontally across mid-torso, with forearms resting over each other and hands resting gently over the opposite forearm/elbow, representing the resting dusk of the afternoon. Holds key reference pose cleanly for 0.4 seconds (matching fotos/TARDES_ref.jpg), then smoothly returns to neutral resting position.
Flawless sign language motion, crisp hand anatomy, no extra digits or flickering, soft studio rim lighting. 60 fps, high-end clean loop.
```

---

### 13. Seña: GUSTAR (Expresión / Agrado - LSC70)
**Español:**
```text
Video en bucle perfecto de 2.5 segundos. Personaje tutor anime de Lengua de Señas Colombiana (Sol, estilo cel-shading nítido, cabello castaño despejando el cuello y rostro, fondo neutro azul pizarra oscuro #070c18).
Plano medio mostrando claramente rostro, cuello y mano derecha. Seña oficial canónica de LSC (Colombia) para 'GUSTAR': 
El personaje inclina levemente la cabeza hacia atrás levantando la barbilla unos 15 grados para exponer con claridad la garganta y el cuello, con una mirada cálida y sonrisa de agrado. La mano derecha parte de reposo, forma un puño cerrado suave manteniendo ÚNICAMENTE el dedo índice extendido, recto y erguido en vertical apuntando hacia arriba (dedos medio, anular y meñique doblados firmemente en la palma, pulgar recogido). 
MOVIMIENTO DINÁMICO CANÓNICO DE DESLIZAMIENTO ASCENDENTE: 
1. La mano se aproxima y la yema del dedo índice derecho hace contacto inicial suave en la base frontal de la garganta / nuez baja.
2. Desde la base, el personaje DESLIZA la yema del dedo índice en un trazo vertical continuo y suave hacia arriba a lo largo de la garganta hasta llegar justo debajo de la barbilla/mandíbula (deslizamiento rectilíneo ascendente de unos 4 centímetros).
3. Sostiene la pose en la parte superior del cuello por 0.4 segundos mostrando con nitidez la pose de referencia (fotos/GUSTAR_ref.jpg).
4. Finalmente, separa el dedo del cuello y desciende la mano suavemente al reposo mientras la cabeza regresa a su posición neutral.
Cinemática precisa de LSC70, deslizamiento ascendente fluido y continuo sin saltos, dedo índice firme y recto, cuello bien iluminado sin sombras duras. 60 fps, render nítido, bucle infinito armónico.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language (LSC) tutor (Sol, crisp cel-shaded anime style, neat dark brown hair clearing neck and face, studio dark slate background #070c18).
Medium shot framing head, throat, neck, and right hand clearly. Canonical LSC (Colombian Sign Language) sign for 'GUSTAR' (To like / Pleasure):
The character tilts head slightly upward and backward (~15 degrees), raising the chin to clearly expose the throat and neck, displaying a gentle, pleasant smile of enjoyment. The right hand starts from resting position, forms a neat fist with ONLY the index finger extended straight vertically upward (middle, ring, and pinky fingers are curled firmly into the palm, thumb tucked). 
CANONICAL UPWARD SLIDING MOTION (DYNAMIC STROKE):
1. The hand moves in and the fingertip of the extended right index finger makes initial soft contact at the lower base of the throat / Adam's apple area.
2. From the base, the character SLIDES / GLIDES the fingertip of the index finger in a smooth, continuous vertical upward stroke along the throat up to just beneath the jawline/chin (a clean 4cm upward stroke).
3. Holds the peak pose at the upper throat for 0.4 seconds matching the reference photo exactly (fotos/GUSTAR_ref.jpg).
4. Gently releases contact and lowers the hand back down to neutral resting position as the head returns forward.
Accurate LSC70 kinematics, continuous smooth upward sliding stroke, single vertical index finger with zero flapping, clean throat anatomy, soft studio lighting. 60 fps, clean render, seamless looping animation.
```

---

### 14. Dactilología: Letra I
**Español:**
```text
Video en bucle continuo de 2 segundos. Tutora anime de LSC (estilo 3D anime cel-shaded, vestimenta deportiva moderna, fondo oscuro #070c18).
Primer plano nítido de la mano derecha a la altura del pecho con la palma orientada hacia el frente. Configuración dactilológica de la letra 'I': La mano forma un puño cerrado sólido con los dedos pulgar, índice, medio y anular doblados firmemente contra la palma; únicamente el dedo meñique se extiende completamente erguido, recto y vertical hacia arriba. Rostro sonriente y motivador enfocado a cámara.
Bucle continuo sin cortes, dedo meñique firme y recto, puño limpio y anatómicamente proporcionado, iluminación de estudio suave con luz de contorno nítida.
```

**English:**
```text
Seamless 2-second loop video. Anime sign language instructor (clean cel-shaded aesthetic, modern tech athletic attire, dark studio background #070c18).
Clear close-up of the right hand at chest height, palm facing forward. The hand demonstrates the manual alphabet letter 'I': hand curled into a firm, solid fist with thumb, index, middle, and ring fingers folded against the palm; only the pinky finger is fully extended straight vertically upwards. Engaging, confident instructor expression.
Seamless infinite loop, immaculate pinky and fist geometry, soft studio rim lighting.
```

---

### 15. Dactilología: Letra O (LSC70)
**Español:**
```text
Video en bucle perfecto de 2.5 segundos. Personaje tutor anime de Lengua de Señas Colombiana (Sol, estilo anime cel-shading de alta definición, chaqueta roja oscura/borgoña con solapas gris oscuro, camiseta negra con cuello en V, cabello castaño con mechón rebelde, fondo neutro azul pizarra oscuro #070c18).
Plano medio mostrando claramente torso superior, rostro y mano derecha. Cinemática oficial canónica de LSC (Colombia - LSC70) para la 'Letra O':
POSICIÓN Y ALTURA EXACTA SEGÚN EL DATASET:
El brazo derecho se eleva flexionando el codo hacia adelante, situando la mano derecha a la altura de la mandíbula y la mejilla derecha (al lado de la boca/mentón, NO en el pecho bajo).
CONFIGURACIÓN DE LA MANO (FORMA DE LA O):
La mano forma la silueta circular tridimensional de la letra 'O': todos los cuatro dedos (índice, medio, anular y meñique) se curvan hacia adelante y abajo de forma uniforme y conjunta en un arco suave, mientras el pulgar se curva hacia arriba enfrentado a ellos, uniendo suavemente las yemas de los dedos con la yema del pulgar para cerrar un círculo hueco claramente visible y definido en el centro (como mirando a través de un lente u ocular).
REGLAS ANATÓMICAS CRÍTICAS:
- NO es la seña de 'OK': los dedos medio, anular y meñique NO deben estar extendidos hacia arriba; deben estar curvados juntos tocando el pulgar.
- NO es un puño cerrado: el centro del círculo debe estar completamente abierto y visible.
- La mano se mantiene firme, nítida y estática en esa postura canónica durante 1.8 segundos frente a la cámara, con una leve respiración natural del personaje y sonrisa amable, regresando de forma suave y armónica al bucle.
Render ultra limpio a 24/60 fps, dedos anatómicos perfectos de 5 dígitos, iluminación de estudio suave con rim light cian sutil.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language (LSC) tutor (Sol, crisp high-end cel-shaded anime style, dark red/burgundy jacket with dark slate lapels, black V-neck t-shirt, messy brown hair, dark studio backdrop #070c18).
Medium shot clearly framing upper torso, face, and right hand. Canonical Colombian Sign Language (LSC70 dataset) manual alphabet letter 'O':
CANONICAL POSITIONING MATCHING DATASET (LSC70):
The character raises the right arm with elbow bent, positioning the right hand elevated at jawline / cheek height beside the mouth (face/chin level, NOT down at lower chest).
HAND CONFIGURATION (ROUND 'O' SHAPE):
The right hand forms the precise circular silhouette of the letter 'O': all four fingers (index, middle, ring, and pinky) curve downward and forward together in a synchronized smooth arch, while the thumb curves upward to meet the fingertips, creating a clean, hollow, clearly visible circular opening in the center (three-quarters facing camera to display the circular hole).
CRITICAL ANATOMICAL RULES:
- NOT an 'OK' sign! Middle, ring, and pinky fingers MUST NOT point straight up; all fingers must curve together touching the thumb.
- NOT a closed fist! There must be a clear, hollow circular aperture visible between the curved fingers and thumb.
- Hand height must remain elevated at the jaw/mouth level as documented in LSC70.
The character holds this canonical posture steadily for 1.8 seconds with gentle natural breathing and a friendly pedagogical smile, smoothly looping.
Flawless hand anatomy, 5 distinct proportional fingers, no digit fusing or mutations, soft studio rim lighting. 24/60 fps clean render.
```

---

### 16. Seña: ANNOS (Años / Tiempo Oficial LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutor anime de Lengua de Señas Colombiana (Sol, estilo anime cel-shading nítido, chaqueta deportiva pizarra/ámbar con mangas recogidas hasta el codo, camiseta interior oscura #14171F, fondo neutro azul pizarra #070c18).
Plano medio mostrando claramente torso superior, rostro y ambas manos. Seña oficial LSC para 'AÑOS' (LSC70W):
Ambas manos se posicionan frente al torso a la altura del pecho. La mano izquierda sirve de apoyo base mientras la mano derecha realiza un movimiento circular suave de frotamiento/rotación sobre la mano izquierda, marcando con cadencia rítmica el paso del tiempo y los años.
Pausa 0.4 segundos en la pose canónica de contacto (fotos/ANNOS_ref.jpg) y retorna con fluidez al inicio. Dedos firmes de 5 dígitos anatómicamente perfectos, iluminación difusa de estudio, render a 60 fps, bucle continuo y limpio.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language (LSC) tutor (Sol, crisp high-end cel-shaded anime style, slate/amber tech jacket with sleeves pushed to elbows, dark undershirt #14171F, dark slate backdrop #070c18).
Medium shot clearly framing torso, face and both hands. Canonical Colombian Sign Language sign for 'YEARS / AGE' (LSC70W dataset):
Both hands are positioned in front of the torso at mid-chest height. The left hand serves as a steady base while the right hand executes a smooth circular rubbing/revolving motion over the left hand, indicating the passage of years with natural pedagogical cadence.
Holds key contact pose for 0.4s matching reference photo (fotos/ANNOS_ref.jpg), then returns smoothly to start. Flawless 5-finger anatomy, studio lighting, 60 fps clean render, seamless looping.
```

---

### 17. Seña: LICOR (Licor / Bebida Oficial LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutor anime de Lengua de Señas Colombiana (Sol, estilo cel-shading nítido, fondo neutro azul pizarra #070c18).
Plano medio del torso superior y rostro. Seña oficial LSC para 'LICOR' (LSC70W):
La mano derecha adopta la configuración en copa o letra Y (pulgar extendido y meñique proyectado), ascendiendo suavemente desde el pecho hacia el lateral de la barbilla y boca. La mano se inclina con delicadeza simulando el acto de tomar un trago corto de licor.
Sostiene la pose clave a la altura de los labios durante 0.5 segundos con expresión agradable (fotos/LICOR_ref.jpg) y regresa con naturalidad a reposo. Dedos anatómicamente perfectos, iluminación limpia con sutil luz de borde.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language (LSC) tutor (Sol, crisp cel-shaded anime aesthetic, dark slate background #070c18).
Medium shot framing upper chest, facial expression, and right hand. Canonical Colombian Sign Language sign for 'LIQUOR / DRINK' (LSC70W dataset):
The right hand forms a small cup or 'Y' shape (thumb and pinky extended, middle fingers curled), rising gracefully from chest level toward the lower chin and corner of the mouth. Tilts softly simulating sipping a drink.
Holds the key apex pose beside the lips for 0.5s matching reference (fotos/LICOR_ref.jpg), then flows back to rest. Perfect finger articulation, studio rim lighting, flawless continuous loop.
```

---

### 18. Seña: D (Dactilología LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutor anime de Lengua de Señas Colombiana (Sol, estilo cel-shading nítido, fondo azul pizarra #070c18).
Plano medio con primer plano de mano derecha. Letra dactilológica 'D' (LSC70AN):
La mano derecha se eleva a la altura del pecho/hombro. El dedo índice se mantiene completamente recto y vertical erguido apuntando hacia arriba, mientras las puntas del pulgar y el dedo medio se tocan cerrando un aro circular visible en la base (formando la panza de la letra D). Anular y meñique descansan plegados.
Mantiene la postura estática y nítida durante 1.8 segundos (fotos/D_ref.jpg). Sin temblores ni dedos fusionados, iluminación difusa de estudio.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language tutor (Sol, clean anime cel-shading, dark studio background #070c18).
Medium shot framing torso and right hand. Canonical manual alphabet letter 'D' (LSC70AN dataset):
The right hand is raised at chest/shoulder level. The index finger points completely straight and vertical upward, while the thumb tip touches the middle finger tip forming a clean closed circular loop at the base (the round loop of letter D). Ring and pinky fingers are curled neatly.
Holds the exact canonical pose steadily for 1.8s matching reference (fotos/D_ref.jpg). Flawless hand anatomy, studio lighting, smooth loop.
```

---

### 19. Seña: E (Dactilología LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutora anime de Lengua de Señas Colombiana (estilo cel-shading nítido, fondo neutro #070c18).
Plano medio mostrando torso y rostro. Letra dactilológica 'E' (LSC70AN):
El brazo derecho está alzado flexionando el codo, situando la mano derecha al lado de la mandíbula y mejilla derecha (a la altura de la boca/mentón, NO en el pecho). Los cuatro dedos (índice, medio, anular y meñique) están curvados juntos en un arco semicerrado compacto con los nudillos y el dorso orientados de tres cuartos hacia la cámara al lateral de la cara, apoyados suavemente sobre el pulgar recogido en la base.
Sostiene la pose fija durante 1.8 segundos con expresión cálida (fotos/E_ref.jpg). 5 dedos nítidos, sin artefactos visuales, bucle continuo a 24 fps.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language tutor (crisp anime style, studio backdrop #070c18).
Medium shot showing upper body and head. Canonical manual alphabet letter 'E' (LSC70AN dataset):
The right arm is raised with elbow bent, positioning the right hand elevated beside the right jawline / cheek at mouth level (beside the chin, NOT down at the chest). All four fingers (index, middle, ring, pinky) curl neatly together in a compact semi-closed curved arch resting their tips against the folded thumb. The hand is angled in a three-quarter orientation so the back of the curved fingers and knuckles face toward the camera beside the jaw.
Holds steady for 1.8s matching reference (fotos/E_ref.jpg). Precise hand anatomy, smooth 24 fps loop.
```

---

### 20. Seña: U (Dactilología LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutor anime de Lengua de Señas Colombiana (Sol, estilo cel-shading nítido, fondo neutro #070c18).
Plano medio con vista clara de la mano derecha a la altura del pecho, palma orientada hacia el frente a la cámara. Letra dactilológica 'U' (LSC70AN):
La mano derecha se eleva al pecho/hombro. El dedo índice se extiende completamente recto y vertical hacia arriba, y el dedo meñique se extiende completamente recto y vertical hacia arriba (ambos extremos erguidos formando la silueta en U / cuernos suaves). Los dedos medio y anular se pliegan hacia la palma sujetados suavemente por el pulgar.
Mantiene la pose canónica firme durante 1.8 segundos (fotos/U_ref.jpg). Dedos bien definidos, 24 fps, render limpio y bucle fluido.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language tutor (Sol, crisp cel-shaded anime style, studio backdrop #070c18).
Medium shot displaying chest and right hand, palm facing forward toward viewer. Canonical manual alphabet letter 'U' (LSC70AN dataset):
The right hand is raised at chest height. Index finger and pinky finger are extended completely straight vertically pointing upward (forming the two upright sides of a 'U'). Middle finger and ring finger are tucked firmly into the palm, held down by the thumb. 
Holds pose steadily for 1.8s matching reference (fotos/U_ref.jpg). Flawless fingers, clean studio lighting, seamless 24 fps loop.
```

---

### 21. Seña: F (Dactilología LSC70)
**Español:**
```text
Video en bucle continuo de 2.5 segundos. Tutor anime de Lengua de Señas Colombiana (Sol, estilo cel-shading nítido, fondo neutro #070c18).
Plano medio mostrando torso y rostro. Letra dactilológica 'F' (LSC70AN):
La mano derecha se eleva frente a la barbilla/boca con la palma orientada hacia adelante hacia la cámara. El dedo índice se mantiene completamente erguido y vertical hacia arriba, mientras los otros tres dedos (medio, anular y meñique) se curvan hacia adelante en un arco abierto escalonado (simulando los trazos horizontales característicos de la letra F), con el pulgar apoyado en la base de la palma.
Mantiene la postura estática y nítida durante 1.8 segundos (fotos/F_ref.jpg). 5 dedos anatómicamente perfectos, iluminación difusa de estudio, bucle fluido a 24 fps.
```

**English:**
```text
Seamless 2.5-second loop video. Anime Colombian Sign Language tutor (Sol, crisp cel-shaded anime style, studio backdrop #070c18).
Medium shot framing torso and face. Canonical manual alphabet letter 'F' (LSC70AN dataset):
The right hand is raised in front of the chin/mouth with the palm facing forward toward the camera. The index finger points straight vertically upward, while the other three fingers (middle, ring, pinky) are curved forward in an open, cascading arch (mimicking the horizontal crossbars of letter F), with the thumb resting at the base of the palm.
Holds the canonical pose steadily for 1.8s matching reference (fotos/F_ref.jpg). Flawless 5-finger anatomy, studio lighting, smooth 24 fps loop.
```

---

## 5. Parámetros Negativos Recomendados (Negative Prompts)

Para generadores como Kling AI, Runway o Stable Video Diffusion que permiten *negative prompts*:

```text
extra fingers, missing fingers, deformed hands, distorted fingers, fused digits, blurry hands, jittery motion, abrupt cuts, flickering, low resolution, bad anatomy, mutated hands, multiple arms, jerky camera, noisy background, text watermark.
```
