/**
 * LSC Learn · Proyecto EXIS
 * signs-data.js - Catálogo Oficial de Señas de Lengua de Señas Colombiana (LSC)
 * Basado en el dataset LSC70 (Universidad Tecnológica de Pereira)
 */

const SIGNS_DATA = {
  words: [
    {
      id: 'HOLA',
      name: 'HOLA',
      category: 'words',
      desc: 'Saludo oficial LSC: Mano derecha en la sien proyectándose hacia adelante y afuera en diagonal.',
      tip: 'Coloca tu mano derecha en tu sien con los dedos juntos y proyéctala suavemente hacia adelante y afuera en diagonal.',
      image: 'dataset_samples/HOLA.jpg',
      rules: { type: 'open_hand_head', height: 'high' },
      trajectory: {
        enabled: true,
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.38, y: 0.36, label: 'Sien' },
          { id: 2, x: 0.52, y: 0.30, label: 'Proyección' },
          { id: 3, x: 0.66, y: 0.24, label: 'Saludo al frente' }
        ]
      }
    },
    {
      id: 'YO',
      name: 'YO',
      category: 'words',
      desc: 'Pronombre: Dedo índice de la mano derecha extendido apuntando directamente hacia el propio pecho con el puño cerrado.',
      tip: 'Cierra tu puño derecho y deja únicamente el dedo índice extendido, desplazándolo hacia tu pecho.',
      image: 'dataset_samples/YO.jpg',
      rules: { type: 'pointing_chest', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 8, // Yema del índice
        hitRadius: 0.14,
        points: [
          { id: 1, x: 0.38, y: 0.45, label: 'Inicio' },
          { id: 2, x: 0.50, y: 0.65, label: 'Pecho' }
        ]
      }
    },
    {
      id: 'BUENOS',
      name: 'BUENOS / AS',
      category: 'words',
      desc: 'Cortesía: La mano izquierda se sostiene como base abierta en el centro del pecho (palma hacia arriba). La mano derecha desciende desde arriba y choca apoyando la palma sobre la mano izquierda en la mitad del torso.',
      tip: 'Coloca la mano izquierda abierta en el centro de tu pecho. Baja la mano derecha desde arriba y choca apoyando la palma sobre la mano izquierda.',
      image: 'dataset_samples/BUENOS.jpg',
      rules: { type: 'flat_chest', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.50, y: 0.38, label: 'Inicio (Arriba)' },
          { id: 2, x: 0.50, y: 0.65, label: 'Contacto (Palma)' }
        ]
      }
    },
    {
      id: 'DIAS',
      name: 'DÍAS',
      category: 'words',
      desc: 'Tiempo: Ambos brazos se abren con las palmas orientadas al frente a la altura de los hombros, simulando la luz y el amanecer.',
      tip: 'Abre ambos brazos lateralmente a la altura del pecho y hombros con las palmas abiertas hacia el frente.',
      image: 'dataset_samples/DIAS.jpg',
      rules: { type: 'open_arms_day', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.45, y: 0.60, label: 'Centro' },
          { id: 2, x: 0.72, y: 0.50, label: 'Apertura' }
        ]
      }
    },
    {
      id: 'NOCHES',
      name: 'NOCHES',
      category: 'words',
      desc: 'Tiempo: Ambos brazos se cruzan horizontalmente sobre el pecho simulando el cierre y la oscuridad de la noche.',
      tip: 'Cruza ambos brazos sobre tu pecho manteniendo los antebrazos cruzados.',
      image: 'dataset_samples/NOCHES.jpg',
      rules: { type: 'crossed_arms_night', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.70, y: 0.55, label: 'Inicio' },
          { id: 2, x: 0.42, y: 0.60, label: 'Cruce' }
        ]
      }
    },
    {
      id: 'NOMBRE',
      name: 'NOMBRE',
      category: 'words',
      desc: 'Identificación: Dedos índice y medio de la mano derecha apoyados horizontalmente sobre los dedos índice y medio de la mano izquierda frente al pecho.',
      tip: 'Extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso.',
      image: 'dataset_samples/NOMBRE.jpg',
      rules: { type: 'two_fingers_chest', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 8, // Índice
        hitRadius: 0.14,
        points: [
          { id: 1, x: 0.62, y: 0.52, label: 'Acercar' },
          { id: 2, x: 0.50, y: 0.60, label: 'Contacto' }
        ]
      }
    },
    {
      id: 'TARDES',
      name: 'TARDES',
      category: 'words',
      desc: 'Cortesía y Tiempo: Ambos brazos se cruzan horizontalmente a la altura del pecho simulando el atardecer formal en LSC.',
      tip: 'Cruza tus antebrazos horizontalmente frente a tu pecho con las palmas orientadas hacia tu cuerpo.',
      image: 'dataset_samples/TARDES.jpg',
      rules: { type: 'crossed_arms_chest', height: 'mid' },
      trajectory: {
        enabled: true,
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.65, y: 0.50, label: 'Inicio' },
          { id: 2, x: 0.40, y: 0.55, label: 'Cruce horizontal' }
        ]
      }
    },
    {
      id: 'GUSTAR',
      name: 'GUSTAR',
      category: 'words',
      desc: 'Expresión / Agrado LSC: Mano derecha con el dedo índice extendido apuntando hacia arriba, deslizándolo suavemente hacia arriba por la garganta mientras la cabeza se inclina levemente hacia atrás.',
      tip: 'Inclina levemente tu cabeza hacia arriba, apoya tu dedo índice en la base de la garganta y deslízalo suavemente hacia arriba.',
      image: 'dataset_samples/GUSTAR.jpg',
      rules: { type: 'index_to_throat', height: 'high' },
      trajectory: {
        enabled: true,
        trackingLandmark: 8, // Yema del índice
        hitRadius: 0.15,
        points: [
          { id: 1, x: 0.50, y: 0.46, label: 'Base garganta' },
          { id: 2, x: 0.50, y: 0.35, label: 'Deslizar arriba' }
        ]
      }
    }
  ],
  letters: [
    {
      id: 'A',
      name: 'Letra A',
      category: 'letters',
      desc: 'Dactilología LSC: Puño completamente cerrado con el pulgar erguido descansando al lateral del índice.',
      tip: 'Cierra los 4 dedos formando un puño sólido y mantén el pulgar apuntando hacia arriba al lateral.',
      image: 'dataset_samples/A.jpg',
      rules: { type: 'fist_thumb_up', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'B',
      name: 'Letra B',
      category: 'letters',
      desc: 'Dactilología LSC: Cuatro dedos (índice a meñique) juntos y extendidos rectos hacia arriba, con el pulgar plegado sobre la palma.',
      tip: 'Extiende índice, medio, anular y meñique juntos hacia arriba; dobla el pulgar sobre la palma.',
      image: 'dataset_samples/B.jpg',
      rules: { type: 'four_fingers_up', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'C',
      name: 'Letra C',
      category: 'letters',
      desc: 'Dactilología LSC: Mano arqueada formando el contorno tridimensional de la letra C.',
      tip: 'Arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C.',
      image: 'dataset_samples/C.jpg',
      rules: { type: 'c_curve', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'L',
      name: 'Letra L',
      category: 'letters',
      desc: 'Dactilología LSC: Índice y pulgar extendidos en ángulo recto exacto de 90 grados, otros tres dedos cerrados.',
      tip: 'Extiende el índice recto hacia arriba y el pulgar en horizontal formando una letra L. Mantén doblados los demás dedos.',
      image: 'dataset_samples/L.jpg',
      rules: { type: 'l_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'V',
      name: 'Letra V',
      category: 'letters',
      desc: 'Dactilología LSC: Dedos índice y medio abiertos en ángulo formando la letra V, pulgar sujetando anular y meñique.',
      tip: 'Levanta el dedo índice y el dedo medio en forma de V (símbolo de victoria). Mantén cerrados el anular y meñique.',
      image: 'dataset_samples/V.jpg',
      rules: { type: 'v_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'I',
      name: 'Letra I',
      category: 'letters',
      desc: 'Dactilología LSC: Puño cerrado con el dedo meñique extendido verticalmente hacia arriba.',
      tip: 'Cierra tu mano en puño y extiende únicamente el dedo meñique hacia arriba.',
      image: 'dataset_samples/I.jpg',
      rules: { type: 'pinky_up', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'O',
      name: 'Letra O',
      category: 'letters',
      desc: 'Dactilología LSC: Mano derecha elevada al lado de la mandíbula/boca con todos los dedos curvados en arco tocando la yema del pulgar para formar un círculo O visible.',
      tip: 'Eleva tu mano derecha al lateral de tu barbilla/boca, curva los 4 dedos y junta sus puntas con el pulgar formando un círculo abierto O.',
      image: 'dataset_samples/O.jpg',
      rules: { type: 'o_shape', height: 'any' },
      trajectory: { enabled: false }
    }
  ]
};

// Export to global scope for browser usage without module bundlers
window.SIGNS_DATA = SIGNS_DATA;
