/**
 * Manitas · Configuración Tailwind (paleta de marca)
 * Se carga justo después de lib/tailwind/tailwind.js. Sin estilos ni scripts embebidos en HTML.
 * Re-mapea la escala `amber` (usada en todo el proyecto) al turquesa de marca, de modo que
 * las clases existentes (text-amber-400, bg-amber-500, ...) adoptan la paleta nueva sin reescribir cada vista.
 * `slate` 700-950 se tiñe con el Azul Noche. Se añaden `sun` (amarillo), `coral` y `bone`.
 */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#E6FAF8', 100: '#C2F3EF', 200: '#8FE8E1', 300: '#4DD8CC', 400: '#1FC8BA',
          500: '#00B8A9', 600: '#009688', 700: '#007A70', 800: '#045F58', 900: '#064A45', 950: '#032B28'
        },
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1', 400: '#a3b0c7',
          500: '#7d8aa5', 600: '#4f5d7a', 700: '#33456b', 800: '#243658', 900: '#1B2B4D', 950: '#14213D'
        },
        sun: { 300: '#FFD98A', 400: '#FFC857', 500: '#F5B52E' },
        coral: { 400: '#FF8A7C', 500: '#FF6B5B', 600: '#E85544' },
        bone: { 50: '#FCFAF6', 100: '#F8F5EF', 200: '#EDE7DB' },
        navy: { 700: '#2A3B63', 800: '#1B2B4D', 900: '#14213D' }
      }
    }
  }
};
