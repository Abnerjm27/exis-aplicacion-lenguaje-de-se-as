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
      desc: 'Saludo: Mano derecha extendida abierta a la altura de la sien con la palma hacia el frente, moviéndose lateralmente.',
      tip: 'Coloca tu mano derecha abierta a la altura de tu sien/frente con los 5 dedos extendidos mirando al frente.',
      image: 'dataset_samples/HOLA.jpg',
      rules: { type: 'open_hand_head', height: 'high' }
    },
    {
      id: 'YO',
      name: 'YO',
      category: 'words',
      desc: 'Pronombre: Dedo índice de la mano derecha extendido apuntando directamente hacia el propio pecho con el puño cerrado.',
      tip: 'Cierra tu puño derecho y deja únicamente el dedo índice extendido, apuntando hacia tu esternón/pecho.',
      image: 'dataset_samples/YO.jpg',
      rules: { type: 'pointing_chest', height: 'mid' }
    },
    {
      id: 'BUENOS',
      name: 'BUENOS / AS',
      category: 'words',
      desc: 'Cortesía: Mano derecha con dedos juntos apoyada en el mentón/boca y proyectándose hacia el frente o sobre la palma.',
      tip: 'Coloca las yemas de los dedos de la mano derecha juntas en el mentón y proyéctala suavemente hacia adelante.',
      image: 'dataset_samples/BUENOS.jpg',
      rules: { type: 'flat_chest', height: 'mid' }
    },
    {
      id: 'DIAS',
      name: 'DÍAS',
      category: 'words',
      desc: 'Tiempo: Ambos brazos se abren con las palmas orientadas al frente a la altura de los hombros, simulando la luz y el amanecer.',
      tip: 'Abre ambos brazos lateralmente a la altura del pecho y hombros con las palmas abiertas hacia el frente.',
      image: 'dataset_samples/DIAS.jpg',
      rules: { type: 'open_arms_day', height: 'mid' }
    },
    {
      id: 'NOCHES',
      name: 'NOCHES',
      category: 'words',
      desc: 'Tiempo: Ambos brazos se cruzan horizontalmente sobre el pecho simulando el cierre y la oscuridad de la noche.',
      tip: 'Cruza ambos brazos sobre tu pecho manteniendo los antebrazos cruzados.',
      image: 'dataset_samples/NOCHES.jpg',
      rules: { type: 'crossed_arms_night', height: 'mid' }
    },
    {
      id: 'NOMBRE',
      name: 'NOMBRE',
      category: 'words',
      desc: 'Identificación: Dedos índice y medio de la mano derecha apoyados horizontalmente sobre los dedos índice y medio de la mano izquierda frente al pecho.',
      tip: 'Extiende los dedos índice y medio de ambas manos y apoya los de la mano derecha sobre los de la izquierda frente a tu torso.',
      image: 'dataset_samples/NOMBRE.jpg',
      rules: { type: 'two_fingers_chest', height: 'mid' }
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
      rules: { type: 'fist_thumb_up', height: 'any' }
    },
    {
      id: 'B',
      name: 'Letra B',
      category: 'letters',
      desc: 'Dactilología LSC: Cuatro dedos (índice a meñique) juntos y extendidos rectos hacia arriba, con el pulgar plegado sobre la palma.',
      tip: 'Extiende índice, medio, anular y meñique juntos hacia arriba; dobla el pulgar sobre la palma.',
      image: 'dataset_samples/B.jpg',
      rules: { type: 'four_fingers_up', height: 'any' }
    },
    {
      id: 'C',
      name: 'Letra C',
      category: 'letters',
      desc: 'Dactilología LSC: Mano arqueada formando el contorno tridimensional de la letra C.',
      tip: 'Arquea los 4 dedos y el pulgar enfrentados formando la curvatura semicircular de la letra C.',
      image: 'dataset_samples/C.jpg',
      rules: { type: 'c_curve', height: 'any' }
    },
    {
      id: 'L',
      name: 'Letra L',
      category: 'letters',
      desc: 'Dactilología LSC: Índice y pulgar extendidos en ángulo recto exacto de 90 grados, otros tres dedos cerrados.',
      tip: 'Extiende el índice recto hacia arriba y el pulgar en horizontal formando una letra L. Mantén doblados los demás dedos.',
      image: 'dataset_samples/L.jpg',
      rules: { type: 'l_shape', height: 'any' }
    },
    {
      id: 'V',
      name: 'Letra V',
      category: 'letters',
      desc: 'Dactilología LSC: Dedos índice y medio abiertos en ángulo formando la letra V, pulgar sujetando anular y meñique.',
      tip: 'Levanta el dedo índice y el dedo medio en forma de V (símbolo de victoria). Mantén cerrados el anular y meñique.',
      image: 'dataset_samples/V.jpg',
      rules: { type: 'v_shape', height: 'any' }
    }
  ]
};

// Export to global scope for browser usage without module bundlers
window.SIGNS_DATA = SIGNS_DATA;
