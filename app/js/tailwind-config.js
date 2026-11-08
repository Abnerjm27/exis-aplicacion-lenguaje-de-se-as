/**
 * Manitas · Configuración Tailwind (paleta de marca + tipografía Impeccable)
 * Se carga justo después de lib/tailwind/tailwind.js. Sin estilos ni scripts embebidos en HTML.
 * Re-mapea la escala `amber` al turquesa de marca (#00B8A9), `slate` teñido con Azul Noche,
 * `sun` (#FFC857), `coral` (#FF6B5B) y `bone` (#F8F5EF).
 * Configura Plus Jakarta Sans como fuente sans principal y Lexend para display.
 */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Lexend', 'Plus Jakarta Sans', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        amber: {
          50: '#E6FAF8', 100: '#C2F3EF', 200: '#8FE8E1', 300: '#4DD8CC', 400: '#3DE8D2',
          500: '#1FC8BA', 600: '#0FA89B', 700: '#0C8A7F', 800: '#0A6E66', 900: '#07504A', 950: '#04322E'
        },
        slate: {
          50: '#f8fafc', 100: '#F4F6FA', 200: '#E2E8F4', 300: '#B9C4D6', 400: '#94A3B8',
          500: '#64748B', 600: '#475569', 700: '#2A3A5E', 800: '#2A3A5E', 900: '#172544', 950: '#0F1A30'
        },
        sun: { 300: '#FFD453', 400: '#FFC857', 500: '#F6A93C' },
        coral: { 400: '#FF8274', 500: '#FF6B5B', 600: '#E85544' },
        bone: { 50: '#FCFAF6', 100: '#F4F6FA', 200: '#EDE7DB' },
        navy: { 700: '#2A3A5E', 800: '#172544', 900: '#0F1A30' }
      }
    }
  }
};
