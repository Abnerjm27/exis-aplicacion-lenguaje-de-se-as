# 🎨 Hoja de Diseño y Especificaciones del Personaje Anime: "Sol"
**Tutor Oficial de Lengua de Señas Colombiana (LSC)**  
*Proyecto: Aplicación Web LSC / Rama de Videos Anime IA*

---

## 1. Concepto e Identidad

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre** | **Sol** (o *Kael*) |
| **Rol** | Tutor interactivo y pedagógico de Lengua de Señas Colombiana |
| **Edad aparente** | 19 - 21 años |
| **Estilo artístico** | Anime moderno cel-shading de alta calidad (influencia *Makoto Shinkai* / *Kyoto Animation*) |
| **Personalidad** | Cálido, paciente, expresivo, dinámico y amigable |
| **Expresión base** | Sonrisa acogedora, mirada directa al espectador (contacto visual esencial en LSC) |

---

## 2. Anatomía y Silueta Diseñada para Lengua de Señas (LSC)

En la animación de lengua de señas por Inteligencia Artificial (Veo, Kling, Runway Gen-3), la ropa y el peinado pueden causar confusión de contornos o fusión de dedos ("finger merging"). El diseño de **Sol** resuelve esto con principios ergonómicos estrictos:

### A. Rostro y Cabeza (Componente No Manual)
- **Cabello**: Corte limpio semi-corto o recogido en coleta baja/despejada.
  - **Regla crítica**: La frente, las cejas, las mejillas y la boca están **100% despejadas**.
  - **Motivo**: En LSC, el movimiento de cejas, apertura bucal y sonrisa son componentes gramaticales ("rasgos no manuales"). Si el flequillo tapa los ojos, la seña pierde significado.
- **Color de Cabello**: Castaño oscuro con reflejos ámbar/dorados sutiles.
- **Ojos**: Color miel/ámbar cálido (coherente con la identidad visual de la aplicación).

### B. Manos y Muñecas (Componente Manual)
- **Manos**: Descubiertas, sin guantes, sin anillos, sin pulseras abultadas.
- **Dedos**: 5 dedos perfectamente definidos, proporcionales y articulados.
- **Muñecas y Antebrazos**: Visibles permanentemente gracias a mangas arremangadas o corte 3/4.
  - **Motivo**: Algoritmos de visión (MediaPipe) y modelos generativos de video necesitan detectar con exactitud el eje de la muñeca para calcular la orientación de la palma.

### C. Torso y Contraste de Ropa
- **Camiseta Interior**: Color carbón oscuro / azul marino ajustada (`#1A1C23`).
  - **Motivo de accesibilidad sorda**: La piel clara de las manos resalta con altísimo contraste sobre el pecho oscuro. Esto permite que señas como `YO`, `BUENOS` y `NOMBRE` se lean con máxima claridad.
- **Chaqueta**: Chaqueta ligera deportiva urbana de color ámbar/dorado suave (`#F59E0B` / `#D97706`) con detalles blancos y mangas dobladas hasta el codo.
- **Pantalón**: Jeans oscuros o joggers negros con caída recta neutra.

---

## 3. Paleta Cromática Oficial (Color Swatches)

```
[Piel]        #FDDCB5  (Tono piel cálido, sombras melocotón #E8B98A)
[Cabello]     #2D1F17  (Castaño oscuro, brillos #784A33)
[Ojos]        #F59E0B  (Ámbar brillante con pupila oscura)
[Interior]    #14171F  (Azul carbón profundo - contraste manos)
[Chaqueta]    #FBBF24  (Ámbar / Amarillo cálido tutor)
[Detalles]    #FFFFFF  (Acentos blancos deportivos)
[Fondo Guía]  #111827  (Gris pizarra de estudio neutro)
```

---

## 4. Vistas Obligatorias en la Hoja de Referencia (Model Sheet)

1. **Vista Frontal Completa (Front Turnaround)**:
   - Postura neutra en bipedestación, brazos ligeramente separados del torso a la altura de la cadera con palmas semiabiertas listas para gesticular.
2. **Vista Tres Cuartos (3/4 View)**:
   - Muestra el volumen del peinado, la caída de la chaqueta y la profundidad de los hombros.
3. **Detalle de Manos en Alta Definición (Hand Studies)**:
   - **Mano Abierta (Palma)**: Los 5 dedos extendidos con separación natural (clave para señas como `HOLA`, `DIAS`, `B`).
   - **Mano de Perfil / Puño con Pulgar (A / S)**: Claridad en la posición del pulgar respecto al índice.
   - **Mano en 'V' / 'L'**: Ángulos rectos y separación limpia de dedos.
4. **Expresiones Faciales Clave**:
   - **Neutra amigable**: Para transiciones de reposo.
   - **Sonrisa abierta y cejas alzadas**: Para preguntas y saludos cordiales (`HOLA`, `BUENOS DÍAS`).
   - **Atenta / Didáctica**: Para explicaciones del alfabeto (`A`, `B`, `C`, etc.).

---

## 5. Cómo Usar esta Hoja como Referencia en Gemini / Kling / Runway

Al generar cualquiera de los 11 videos de señas:

1. **Sube la imagen de la Hoja de Referencia** (`hoja_personaje_referencia.png`) como imagen de ancla (`Image-to-Video` o `Character Reference`).
2. **Sube la foto de la seña real** correspondiente desde `referencias_para_gemini/fotos/<SEÑA>_real.jpg`.
3. **Usa el prompt estructurado** de `referencias_para_gemini/PROMPTS_GEMINI.md`:
   - Ancla de personaje: *"Maintain the exact character Sol from the reference sheet: youthful anime sign language tutor, dark cropped hair away from face, dark navy inner shirt, amber-yellow open jacket with rolled-up sleeves, bare hands with exactly 5 clearly separated fingers..."*
   - Ancla de movimiento: *"Execute the exact hand gesture from the real LSC photo in a seamless, fluid 2-second loop..."*

---

*Desarrollado para el sistema educativo LSC - Noviembre 2026*
