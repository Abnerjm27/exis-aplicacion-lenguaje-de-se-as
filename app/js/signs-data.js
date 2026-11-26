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
        bodyZone: 'Sien Derecha',
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.38, y: 0.36, anchor: 'temple', dx: 0.0, dy: 0.0, label: 'Sien' },
          { id: 2, x: 0.52, y: 0.30, anchor: 'temple', dx: 0.14, dy: -0.06, label: 'Proyección' },
          { id: 3, x: 0.66, y: 0.24, anchor: 'temple', dx: 0.28, dy: -0.12, label: 'Saludo al frente' }
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
        bodyZone: 'Centro del Pecho',
        trackingLandmark: 8, // Yema del índice
        hitRadius: 0.14,
        points: [
          { id: 1, x: 0.38, y: 0.45, anchor: 'chest', dx: -0.12, dy: -0.18, label: 'Inicio' },
          { id: 2, x: 0.50, y: 0.65, anchor: 'chest', dx: 0.0, dy: 0.0, label: 'Pecho' }
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
        bodyZone: 'Mano Base / Pecho',
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.50, y: 0.38, anchor: 'chest', dx: 0.0, dy: -0.24, label: 'Inicio (Arriba)' },
          { id: 2, x: 0.50, y: 0.65, anchor: 'base_hand_or_chest', dx: 0.0, dy: 0.0, label: 'Contacto (Palma)' }
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
        bodyZone: 'Eje del Pecho',
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.45, y: 0.60, anchor: 'chest', dx: -0.05, dy: -0.03, label: 'Centro' },
          { id: 2, x: 0.72, y: 0.50, anchor: 'chest', dx: 0.22, dy: -0.13, label: 'Apertura' }
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
        bodyZone: 'Eje del Pecho',
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.70, y: 0.55, anchor: 'chest', dx: 0.20, dy: -0.08, label: 'Inicio' },
          { id: 2, x: 0.42, y: 0.60, anchor: 'chest', dx: -0.08, dy: -0.03, label: 'Cruce' }
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
        bodyZone: 'Mano Base / Torso',
        trackingLandmark: 8, // Índice
        hitRadius: 0.14,
        points: [
          { id: 1, x: 0.62, y: 0.52, anchor: 'chest', dx: 0.12, dy: -0.10, label: 'Acercar' },
          { id: 2, x: 0.50, y: 0.60, anchor: 'base_hand_or_chest', dx: 0.0, dy: 0.0, label: 'Contacto' }
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
        bodyZone: 'Eje del Pecho',
        trackingLandmark: 0, // Muñeca
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.65, y: 0.50, anchor: 'chest', dx: 0.15, dy: -0.12, label: 'Inicio' },
          { id: 2, x: 0.40, y: 0.55, anchor: 'chest', dx: -0.10, dy: -0.07, label: 'Cruce horizontal' }
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
        bodyZone: 'Garganta y Cuello',
        trackingLandmark: 8, // Yema del índice
        hitRadius: 0.15,
        points: [
          { id: 1, x: 0.50, y: 0.46, anchor: 'throat', dx: 0.0, dy: 0.04, label: 'Base garganta' },
          { id: 2, x: 0.50, y: 0.35, anchor: 'throat', dx: 0.0, dy: -0.07, label: 'Deslizar arriba' }
        ]
      }
    },
    {
      id: 'ANNOS',
      name: 'AÑOS',
      category: 'words',
      hasAnime: false,
      desc: 'Tiempo y Edad LSC: Ambas manos frente al torso a la altura del pecho/abdomen; la mano derecha realiza un suave movimiento circular frotando o interactuando sobre la mano izquierda marcando el paso de los años.',
      tip: 'Coloca ambas manos frente a tu torso y realiza un movimiento circular continuo con tu mano derecha sobre la izquierda.',
      image: 'dataset_samples/ANNOS.jpg',
      rules: { type: 'rubbing_hands_chest', height: 'mid' },
      trajectory: {
        enabled: true,
        bodyZone: 'Mano Base / Torso',
        trackingLandmark: 0, // Muñeca derecha
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.55, y: 0.65, anchor: 'base_hand_or_chest', dx: 0.03, dy: -0.03, label: 'Inicio' },
          { id: 2, x: 0.65, y: 0.72, anchor: 'base_hand_or_chest', dx: 0.12, dy: 0.05, label: 'Giro' },
          { id: 3, x: 0.55, y: 0.70, anchor: 'base_hand_or_chest', dx: 0.03, dy: 0.02, label: 'Retorno' }
        ]
      }
    },
    {
      id: 'LICOR',
      name: 'LICOR',
      category: 'words',
      hasAnime: false,
      desc: 'Alimentos y Bebidas LSC: Mano derecha configurada en copa / letra Y cerca del mentón y la boca, inclinándose suavemente hacia los labios para simular el acto de tomar un trago o copa.',
      tip: 'Forma una copa con tu mano derecha (o extiende pulgar y meñique) y elévala hacia tu barbilla o boca inclinándola levemente.',
      image: 'dataset_samples/LICOR.jpg',
      rules: { type: 'cup_to_mouth', height: 'high' },
      trajectory: {
        enabled: true,
        bodyZone: 'Barbilla y Boca',
        trackingLandmark: 4, // Yema del pulgar
        hitRadius: 0.16,
        points: [
          { id: 1, x: 0.50, y: 0.65, anchor: 'chest', dx: 0.0, dy: 0.0, label: 'Pecho' },
          { id: 2, x: 0.52, y: 0.48, anchor: 'chin', dx: 0.01, dy: 0.0, label: 'Boca / Barbilla' }
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
      preferStaticImage: true,
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
    },
    {
      id: 'D',
      name: 'Letra D',
      category: 'letters',
      desc: 'Dactilología LSC: Dedo índice completamente erguido vertical hacia arriba, mientras las puntas del pulgar y el dedo medio se tocan formando un círculo en la base.',
      tip: 'Apunta tu dedo índice recto hacia arriba y junta la punta de tu pulgar con tu dedo medio formando un aro.',
      image: 'dataset_samples/D.jpg',
      preferStaticImage: true,
      rules: { type: 'd_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'E',
      name: 'Letra E',
      category: 'letters',
      desc: 'Dactilología LSC: Los cuatro dedos curvados juntos hacia abajo con las yemas descansando sobre la punta del pulgar doblado horizontalmente en la base de la palma.',
      tip: 'Curva los cuatro dedos juntos hacia abajo y apoya sus yemas sobre el pulgar doblado en la palma.',
      image: 'dataset_samples/E.jpg',
      solImage: 'img/letters/E_sol.png',
      preferStaticImage: true,
      rules: { type: 'e_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'F',
      name: 'Letra F',
      category: 'letters',
      desc: 'Dactilología LSC: Dedo índice erguido vertical, pulgar casi vertical paralelo al borde de la palma e índice, y medio, anular y meñique doblados en escalón sobre la palma.',
      tip: 'Levanta el índice recto, acerca el pulgar casi vertical junto a su base y dobla medio, anular y meñique sobre la palma.',
      image: 'img/letters/F_sol.jpg',
      solImage: 'img/letters/F_sol.jpg',
      preferStaticImage: true,
      hasAnime: true,
      rules: { type: 'f_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'G',
      name: 'Letra G',
      category: 'letters',
      desc: 'Dactilología LSC: Puño cerrado compacto proyectado hacia adelante a la altura del abdomen con los nudillos inclinados ~40° y el pulgar recogido sobre los dedos.',
      tip: 'Cierra tu puño con el pulgar plegado y proyecta el antebrazo hacia adelante separado del torso.',
      image: 'img/letters/G_sol.png',
      solImage: 'img/letters/G_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'g_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'H',
      name: 'Letra H',
      category: 'letters',
      desc: 'Dactilología LSC: Mano en ángulo lateral frente al pecho superior con el índice vertical arriba, el pulgar apuntando al frente y los demás dedos recogidos.',
      tip: 'Gira la mano de lado frente a tu pecho, apunta el índice arriba, el pulgar al frente y cierra los otros tres dedos.',
      image: 'img/letters/H_sol.png',
      solImage: 'img/letters/H_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'h_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'J',
      name: 'Letra J',
      category: 'letters',
      desc: 'Dactilología LSC: Trazo suave en curva de J frente al pecho con el puño cerrado y únicamente el meñique extendido en diagonal.',
      tip: 'Cierra el puño, extiende solo el meñique lateralmente y dibuja una curva en J frente a tu pecho.',
      image: 'img/letters/J_sol.png',
      solImage: 'img/letters/J_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'j_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'K',
      name: 'Letra K',
      category: 'letters',
      desc: 'Dactilología LSC: Mano en tijera lateral en el pecho alto con el índice en diagonal arriba, el medio en diagonal abajo y el pulgar encajado en la horquilla.',
      tip: 'Abre índice y medio en tijera lateral, apoya el pulgar entre ambos y cierra anular y meñique.',
      image: 'img/letters/K_sol.png',
      solImage: 'img/letters/K_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'k_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'M',
      name: 'Letra M',
      category: 'letters',
      desc: 'Dactilología LSC: Muñeca flexionada hacia abajo con índice, medio y anular extendidos y separados en tridente invertido; pulgar y meñique recogidos.',
      tip: 'Flexiona la muñeca hacia abajo y separa índice, medio y anular en tres puntas dejando pulgar y meñique cerrados.',
      image: 'img/letters/M_sol.png',
      solImage: 'img/letters/M_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'm_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'N',
      name: 'Letra N',
      category: 'letters',
      desc: 'Dactilología LSC: Muñeca flexionada hacia abajo con índice y medio extendidos y separados en V invertida; anular, meñique y pulgar recogidos.',
      tip: 'Flexiona la muñeca hacia abajo, abre índice y medio en V invertida y cierra anular, meñique y pulgar.',
      image: 'img/letters/N_sol.png',
      solImage: 'img/letters/N_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'n_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'P',
      name: 'Letra P',
      category: 'letters',
      desc: 'Dactilología LSC: Puño cerrado horizontal bajo el mentón con únicamente el dedo medio colgando verticalmente hacia abajo.',
      tip: 'Coloca el puño horizontal bajo tu barbilla y deja únicamente el dedo medio colgando hacia abajo.',
      image: 'img/letters/P_sol.png',
      solImage: 'img/letters/P_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'p_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'Q',
      name: 'Letra Q',
      category: 'letters',
      desc: 'Dactilología LSC: Pinza o gancho invertido hacia abajo formado por el pulgar y el índice frente al pecho, con medio, anular y meñique cerrados.',
      tip: 'Forma una pinza con el pulgar y el índice apuntando hacia abajo y mantén los otros tres dedos recogidos.',
      image: 'img/letters/Q_sol.png',
      solImage: 'img/letters/Q_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'q_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'R',
      name: 'Letra R',
      category: 'letters',
      desc: 'Dactilología LSC: Dedos índice y medio erguidos verticales y cruzados entre sí, con pulgar, anular y meñique recogidos en la palma.',
      tip: 'Levanta índice y medio cruzándolos entre sí y cierra el pulgar, anular y meñique.',
      image: 'img/letters/R_sol.png',
      solImage: 'img/letters/R_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'r_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'S',
      name: 'Letra S',
      category: 'letters',
      desc: 'Dactilología LSC: Puño cerrado compacto con el pulgar doblado horizontalmente cruzando sobre el frente de los dedos.',
      tip: 'Cierra todos los dedos en puño firme y cruza el pulgar horizontalmente sobre ellos.',
      image: 'img/letters/S_sol.png',
      solImage: 'img/letters/S_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 's_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'T',
      name: 'Letra T',
      category: 'letters',
      desc: 'Dactilología LSC: Puño cerrado compacto con el pulgar insertado verticalmente asomando entre el dedo índice y el medio.',
      tip: 'Cierra el puño y pasa la punta del pulgar entre el dedo índice y el dedo medio.',
      image: 'img/letters/T_sol.png',
      solImage: 'img/letters/T_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 't_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'U',
      name: 'Letra U',
      category: 'letters',
      desc: 'Dactilología LSC: Dedos índice y meñique extendidos rectos hacia arriba (forma de cuernos), con los dedos medio y anular doblados sobre la palma y el pulgar sujetándolos.',
      tip: 'Levanta el dedo índice y el meñique apuntando hacia arriba. Mantén el medio y el anular cerrados en la palma.',
      image: 'dataset_samples/U.jpg',
      solImage: 'img/letters/U_sol.png',
      rules: { type: 'u_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'W',
      name: 'Letra W',
      category: 'letters',
      desc: 'Dactilología LSC: Tres dedos (índice, medio y anular) erguidos y separados en abanico abierto formando una W; pulgar y meñique recogidos.',
      tip: 'Levanta índice, medio y anular abiertos en forma de W mientras sujetas el meñique con el pulgar.',
      image: 'img/letters/W_sol.png',
      solImage: 'img/letters/W_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'w_shape', height: 'any' },
      trajectory: { enabled: false }
    },
    {
      id: 'Z',
      name: 'Letra Z',
      category: 'letters',
      desc: 'Dactilología LSC: Dedo índice extendido al frente trazando en el aire el recorrido diagonal en zigzag de la letra Z, con los demás dedos cerrados.',
      tip: 'Extiende únicamente el dedo índice y dibuja el trazo de la letra Z en el aire frente a tu pecho.',
      image: 'img/letters/Z_sol.png',
      solImage: 'img/letters/Z_sol.png',
      preferStaticImage: true,
      hasAnime: false,
      rules: { type: 'z_shape', height: 'any' },
      trajectory: { enabled: false }
    }
  ]
};

// Export to global scope for browser usage without module bundlers
window.SIGNS_DATA = SIGNS_DATA;
