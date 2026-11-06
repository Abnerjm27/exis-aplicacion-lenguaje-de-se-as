# Task 2 Brief: Estilos Dedicados de Lección Interactiva (`app/css/lesson.css`)

## Objetivo
Crear `app/css/lesson.css` con el sistema de diseño visual de la lección interactiva gamificada (tipo Duolingo / Lingvano), utilizando los tokens de color oficiales de Manitas (`tokens.css`), la tipografía Plus Jakarta Sans / Lexend, y animaciones suaves para los estados de la lección.

## Requisitos de Diseño
1. **Contenedor Inmersivo (`#lessonSessionModal` / `.lesson-modal`)**:
   - Modal a pantalla completa en móvil y tarjeta centrada inmersiva en escritorio (`max-w-4xl`, `min-h-[85vh]`).
   - Fondo: Azul Noche `#14213D` con iluminación sutil turquesa.
   - Borde: `#2A3B63` con radio `var(--radius-lg)`.
2. **Barra de Progreso de la Lección (`.lesson-progress-bar`)**:
   - Progreso segmentado de 3 pasos (1: Demostración, 2: Pregunta, 3: Práctica con cámara).
   - Relleno animado en Turquesa Cámara (`#00B8A9`) con brillo suave.
3. **Fase 1 (Demostración)**:
   - Video en bucle centrado con marco suave.
   - Tarjeta del zorrito tutor con tip anatómico destacado en Amarillo Sol (`#FFC857`).
4. **Fase 2 (Pregunta tipo test)**:
   - Grilla de 4 opciones (`.quiz-choice-btn`):
     - Tamaño táctil mínimo $\ge 52\text{px}$.
     - Fondo `#1B2B4D`, borde `#2A3B63`, texto Blanco Hueso `#F8F5EF`.
     - Efecto hover con elevación suave (`transform: translateY(-2px)`).
     - Estado seleccionado: borde turquesa y fondo `#00B8A9`/15.
     - Estado acierto: verde `#3DDC97`.
     - Estado error: rojo coral `#FF6B5B`.
5. **Fase 3 (Práctica con cámara - Split View)**:
   - Layout de 2 columnas o split vertical:
     - Izquierda/Arriba: Video guía en miniatura espejo.
     - Derecha/Abajo: Video de webcam con canvas superpuesto de landmarks MediaPipe.
   - Medidor de coincidencia en tiempo real con barra de progreso y porcentaje tabular.
6. **Franja de Feedback Inferior (.lesson-feedback-sheet)**:
   - Oculta por defecto, aparece con deslizamiento elástico desde abajo.
   - Variante éxito (`.is-correct`): Fondo `#00B8A9`/15 con borde verde `#3DDC97`, mensaje del zorrito y botón verde "Continuar".
   - Variante fallo (`.is-incorrect`): Fondo `#FF6B5B`/15 con borde `#FF6B5B`, explicación correctiva y botón "Reintentar" o "Continuar".
7. **Accesibilidad**:
   - WCAG AAA contrast ratio $\ge 7:1$.
   - Soportar `prefers-reduced-motion`.
