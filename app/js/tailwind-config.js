/**
 * Manitas · Configuración Tailwind (Regla 60-30-10 · Paleta Cálida, Cero Azul)
 * - 60% Dominante: Blanco Crema Cálido (#FAF8F5), Superficies (#FFFFFF), Elevado (#F3EFEA)
 * - 30% Secundario: Carbón Espresso Cálido (#1C1917), Marrón Topo (#574F47), Piedra (#E6DFD5) en `slate`/`navy`
 * - 10% Acento: Melocotón / Coral Cálido (#FF7A45) mapeado en `amber`, `coral` y `sun`
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
          50: '#FFF2EC', 100: '#FFE4D6', 200: '#FFC9B0', 300: '#FFB088', 400: '#FF9266',
          500: '#FF7A45', 600: '#E85D2A', 700: '#C84B1C', 800: '#9E3B16', 900: '#7C2D12', 950: '#4A1808'
        },
        slate: {
          50: '#FAF8F5', 100: '#F3EFEA', 200: '#E6DFD5', 300: '#D4C9BC', 400: '#A69B8E',
          500: '#786E63', 600: '#574F47', 700: '#3D3630', 800: '#292524', 900: '#1C1917', 950: '#141210'
        },
        sun: { 300: '#FFB088', 400: '#FF9266', 500: '#FF7A45' },
        coral: { 400: '#FF9266', 500: '#FF7A45', 600: '#E85D2A' },
        bone: { 50: '#FFFFFF', 100: '#FAF8F5', 200: '#F3EFEA' },
        navy: { 700: '#574F47', 800: '#292524', 900: '#1C1917' }
      }
    }
  }
};
