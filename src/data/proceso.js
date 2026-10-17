// Contenido de la página Proceso. Sale de "Proyecto Final Mármol - Proyecto"
// (calendario y pipeline), los "Registro SXX" y las notas de Referencias.
//
// Estados de cada semana: 'hecho' | 'en-curso' | 'pendiente'.
// El estado de cada bloque se calcula solo a partir de sus semanas.
// Para añadir lo hecho en una semana: rellenar su lista `registro`.

const img = (falta, alt = falta) => ({ src: null, alt, falta });

export const proceso = {
  intro:
    'El proyecto se planificó en 35 semanas, de septiembre de 2026 a mayo de 2027, con un registro semanal de lo que se hace y cuánto se tarda. Arriba está lo pulido: el calendario, las referencias, el antes y el después y la pipeline. Abajo, plegado, el archivo completo con los WIPs, las versiones viejas y los fallos.',

  bloques: [
    {
      numero: '0',
      titulo: 'Cimientos',
      fechas: '21/09 → 04/10',
      objetivo: 'Escribir la escena del teaser, elegir la música y medir cuánto tarda en renderizar un fotograma antes de modelar nada.',
      semanas: [
        {
          semana: 'S01', fechas: '21–27/09', plan: 'Logística y escena del teaser escrita', estado: 'hecho',
          registro: [
            'Estructura de carpetas, nomenclatura, guardado incremental y backup en USB.',
            'Escena del teaser cerrada: estructura circular taller → bosque → bodega → taller, nueve planos.',
            'Prototipo del shader de las ventanas del taller: del óvalo con ruido a la grieta angular con Voronoi.',
          ],
        },
        {
          semana: 'S02', fechas: '28/09–04/10', plan: 'Música, licencia y test de render', estado: 'hecho',
          registro: [
            'Medidas de la criatura: 2 m a la cruz y 3,8 m con la cornamenta.',
            'Set 3 decidido: la bodega de un barco romano, basado en el pecio de la Madrague de Giens.',
            'Test de render en Cycles: 57 s por fotograma con ajustes propios frente a 4 min 12 s con los de fábrica.',
            'Música candidata y licencia CC BY 4.0 comprobada.',
          ],
        },
      ],
      capturas: [
        { titulo: 'Mis notas de Obsidian', texto: 'Cómo está organizado el proyecto en el vault.', imagen: img('Captura de las notas del proyecto en Obsidian') },
        { titulo: 'Grafo del proyecto', texto: 'Las notas del proyecto y cómo se enlazan.', imagen: img('Captura del grafo de Obsidian del proyecto') },
      ],
    },
    {
      numero: '1',
      titulo: 'Previz',
      fechas: '05/10 → 01/11',
      objetivo: 'Decidir cada plano con primitivas antes de modelar: solo se modela lo que entra en cámara.',
      semanas: [
        { semana: 'S03', fechas: '05–11/10', plan: 'Thumbnails y storyboard', estado: 'en-curso', registro: [] },
        { semana: 'S04', fechas: '12–18/10', plan: 'Blockout 3D de los tres sets y cámaras', estado: 'en-curso', registro: [] },
        { semana: 'S05', fechas: '19–25/10', plan: 'Previz animada contra la música · timing de 30 s', estado: 'pendiente', registro: [] },
        { semana: 'S06', fechas: '26/10–01/11', plan: 'Lista de planos y assets · color script', estado: 'pendiente', registro: [] },
      ],
      capturas: [
        { titulo: 'Storyboard', texto: 'Los nueve planos del teaser.', imagen: img('Storyboard o thumbnails de los 9 planos') },
      ],
    },
    {
      numero: '2',
      titulo: 'Assets',
      fechas: '02/11 → 20/12',
      objetivo: 'Diseñar en 3D al Creador y a la criatura, modelar los tres sets y riggear antes de Navidad.',
      semanas: [
        { semana: 'S07', fechas: '02–08/11', plan: 'Diseño en 3D del Creador y de la criatura', estado: 'pendiente', registro: [] },
        { semana: 'S08', fechas: '09–15/11', plan: 'Modelado final del Creador', estado: 'pendiente', registro: [] },
        { semana: 'S09', fechas: '16–22/11', plan: 'Modelado de la criatura base', estado: 'pendiente', registro: [] },
        { semana: 'S10', fechas: '23–29/11', plan: 'Semana tampón · 1.ª evaluación', estado: 'pendiente', registro: [] },
        { semana: 'S11', fechas: '30/11–06/12', plan: 'Sets 1 y 2', estado: 'pendiente', registro: [] },
        { semana: 'S12', fechas: '07–13/12', plan: 'Set 3 y props', estado: 'pendiente', registro: [] },
        { semana: 'S13', fechas: '14–20/12', plan: 'Rig del Creador y de la criatura', estado: 'pendiente', registro: [] },
      ],
      capturas: [],
    },
    {
      numero: '3',
      titulo: 'Look dev',
      fechas: '21/12 → 10/01',
      objetivo: 'Cerrar materiales e iluminación y renderizar un fotograma bonito de cada set antes de animar.',
      semanas: [
        { semana: 'S14', fechas: '21–27/12', plan: 'Materiales de la criatura, pura y corrupta', estado: 'pendiente', registro: [] },
        { semana: 'S15', fechas: '28/12–03/01', plan: 'Materiales del Creador y de los sets', estado: 'pendiente', registro: [] },
        { semana: 'S16', fechas: '04–10/01', plan: 'Iluminación base y un fotograma por set', estado: 'pendiente', registro: [] },
      ],
      capturas: [],
    },
    {
      numero: '4',
      titulo: 'Animación',
      fechas: '11/01 → 14/03',
      objetivo: 'Layout, blocking y animación fina. La fase más larga, durante las prácticas.',
      semanas: [
        { semana: 'S17', fechas: '11–17/01', plan: 'Layout definitivo', estado: 'pendiente', registro: [] },
        { semana: 'S18', fechas: '18–24/01', plan: 'Layout (cierre)', estado: 'pendiente', registro: [] },
        { semana: 'S19', fechas: '25–31/01', plan: 'Blocking', estado: 'pendiente', registro: [] },
        { semana: 'S20', fechas: '01–07/02', plan: 'Blocking y revisión contra la música', estado: 'pendiente', registro: [] },
        { semana: 'S21', fechas: '08–14/02', plan: 'Semana tampón · semana blanca', estado: 'pendiente', registro: [] },
        { semana: 'S22', fechas: '15–21/02', plan: 'Animación fina', estado: 'pendiente', registro: [] },
        { semana: 'S23', fechas: '22–28/02', plan: 'Animación fina', estado: 'pendiente', registro: [] },
        { semana: 'S24', fechas: '01–07/03', plan: 'Animación fina (cierre)', estado: 'pendiente', registro: [] },
        { semana: 'S25', fechas: '08–14/03', plan: 'Pulido y playblast · 2.ª evaluación', estado: 'pendiente', registro: [] },
      ],
      capturas: [],
    },
    {
      numero: '5',
      titulo: 'Render',
      fechas: '15/03 → 11/04',
      objetivo: 'Iluminación plano a plano, render de prueba y render final de noche en OpenEXR. La web, de día.',
      semanas: [
        { semana: 'S26', fechas: '15–21/03', plan: 'Iluminación plano a plano y view layers', estado: 'pendiente', registro: [] },
        { semana: 'S27', fechas: '22–28/03', plan: 'Render de prueba de todos los planos', estado: 'pendiente', registro: [] },
        { semana: 'S28', fechas: '29/03–04/04', plan: 'Render final de noche · web de día', estado: 'pendiente', registro: [] },
        { semana: 'S29', fechas: '05–11/04', plan: 'Re-renders y cierre de la web', estado: 'pendiente', registro: [] },
      ],
      capturas: [],
    },
    {
      numero: '6',
      titulo: 'Post y entrega',
      fechas: '12/04 → 21/05',
      objetivo: 'Composición, montaje, sonido, color, dossier de venta y entrega.',
      semanas: [
        { semana: 'S30', fechas: '12–18/04', plan: 'Composición por capas', estado: 'pendiente', registro: [] },
        { semana: 'S31', fechas: '19–25/04', plan: 'Montaje en DaVinci Resolve y diseño de sonido', estado: 'pendiente', registro: [] },
        { semana: 'S32', fechas: '26/04–02/05', plan: 'Sonido y mezcla', estado: 'pendiente', registro: [] },
        { semana: 'S33', fechas: '03–09/05', plan: 'Etalonaje y máster', estado: 'pendiente', registro: [] },
        { semana: 'S34', fechas: '10–16/05', plan: 'Dossier de venta · web publicada · plan B probado', estado: 'pendiente', registro: [] },
        { semana: 'S35', fechas: '17–21/05', plan: 'Memoria, copias de seguridad y ensayo', estado: 'pendiente', registro: [] },
      ],
      capturas: [],
    },
  ],

  // Referencias por categoría. Cada una con Qué es / Qué cojo / Dónde aplica.
  referencias: [
    {
      categoria: 'Personajes',
      portada: img('Referencia destacada de personajes (estatuaria clásica)'),
      items: [
        { titulo: 'Caballo de Selene', que: 'Cabeza del caballo de Selene, del frontón este del Partenón (British Museum).', cojo: 'El cuadrúpedo herbívoro más cercano a la criatura: venas y músculo idealizados, la crin como una masa sólida.', donde: 'Cabeza y crin de la criatura pura.', imagen: img('criatura_estatuaria_01 · Caballo de Selene') },
        { titulo: 'Caballos del friso del Partenón', que: 'Los caballos del friso del Partenón.', cojo: 'Crines cortas talladas como un solo bloque con surcos.', donde: 'Crin del cuello y pecho de la criatura pura.', imagen: img('criatura_estatuaria_02 · friso del Partenón') },
        { titulo: 'Sala degli Animali', que: 'Sala degli Animali, Museo Pio-Clementino (Vaticano): animales romanos en mármol, ciervos incluidos.', cojo: 'La referencia directa de especie: un ciervo tallado.', donde: 'Cuerpo y proporciones de la criatura pura.', imagen: img('criatura_estatuaria_03 · Sala degli Animali') },
        { titulo: 'Cierva de la Diana de Versalles', que: 'La cierva que acompaña a la Diana de Versalles (Louvre).', cojo: 'Un ciervo clásico a escala real, tallado.', donde: 'Anatomía y postura del cuerpo de la criatura pura.', imagen: img('criatura_estatuaria_04 · Diana de Versalles') },
      ],
    },
    {
      categoria: 'Sets',
      portada: img('Referencia destacada de sets (el rasgón del taller)'),
      items: [
        { titulo: 'Rasgón del Taller', que: 'Ilustración de un rasgón vertical de bordes brumosos con una ciudad fantástica al otro lado y dos figuras mirando desde un pórtico.', cojo: 'La forma del rasgón: bordes de humo irregulares, nada de anillo de energía. Y que al otro lado se vea un mundo entero, no solo un resplandor.', donde: 'Las ventanas del taller, sobre todo el plano 9.', imagen: img('taller_portal_01 · rasgón del taller') },
        { titulo: 'Madrague de Giens', que: 'Pecio de un barco mercante romano del siglo I a. C., hundido frente a la costa francesa.', cojo: 'La bodega: madera oscura, ánforas apiladas y luz dura entrando por las rendijas.', donde: 'Set 3, la bodega donde está la jaula.', imagen: img('Referencia de la bodega · Madrague de Giens') },
      ],
    },
    {
      categoria: 'Color y luz',
      portada: img('Referencia destacada de color y luz'),
      items: [],
    },
    {
      categoria: 'Cámara y encuadre',
      portada: img('Referencia destacada de cámara y encuadre'),
      items: [],
    },
    {
      categoria: 'Materiales',
      portada: img('Referencia de mármol Rosso Levanto'),
      items: [
        { titulo: 'Rosso Levanto', que: 'Mármol blanco con vetas granate y craquelado blanco.', cojo: 'Las vetas y la paleta crema, rojo y oro de esta web.', donde: 'Solo en la web. Las criaturas de la historia no tienen vetas: son blanco mate, plata y azul claro.', imagen: img('Muestra de mármol Rosso Levanto') },
      ],
    },
    {
      categoria: 'Sonido y música',
      portada: img('Captura de la ficha de la pista en incompetech'),
      items: [
        { titulo: 'Darkness is Coming', que: 'Pista de Kevin MacLeod (incompetech), licencia CC BY 4.0. Oscura, épica, 73 bpm.', cojo: 'La pista completa como música candidata del teaser. Provisional.', donde: 'Banda sonora del teaser, con el crédito que exige la licencia.', imagen: img('Captura de la ficha de la pista con el logo CC') },
      ],
    },
    {
      categoria: 'Producción',
      portada: img('Referencia destacada de producción'),
      items: [
        { titulo: 'Charge · Blender Studio', que: 'Corto de Blender Studio.', cojo: 'La previz hace el trabajo pesado del layout: una maqueta barata, fácil de juzgar y de corregir.', donde: 'La pipeline: previz antes de modelar.', imagen: img('Fotograma de Charge (Blender Studio)') },
        { titulo: 'Corto de Marfa Tarkhova', que: 'Corto hecho en solitario en Blender: nueve meses para un minuto.', cojo: 'Bloquear cámaras antes de modelar, y su mayor arrepentimiento: no cerrar el color en preproducción.', donde: 'La pipeline y el calendario semanal.', imagen: img('Fotograma del corto de Marfa Tarkhova') },
        { titulo: 'Inspired 3D Short Film Production', que: 'Libro de Cantor y Valencia sobre producción de cortos 3D.', cojo: 'Planificar con una columna por semana y cerrar la lista de assets antes de producir.', donde: 'El calendario semanal y la pipeline.', imagen: img('Portada del libro Inspired 3D Short Film Production') },
      ],
    },
  ],

  antesDespues: [
    {
      titulo: 'Las ventanas del taller',
      texto: 'El primer intento de grieta era un óvalo deformado con ruido suave y se leía como algo anatómico. Con Voronoi los bordes salen angulares, como una grieta de verdad.',
      antes: img('Portal v1: óvalo con Noise Texture'),
      despues: img('Portal v3: grieta con Voronoi'),
    },
    {
      titulo: 'Del blockout al render',
      texto: 'El taller con primitivas en la previz y el mismo encuadre renderizado.',
      antes: img('Blockout del taller (S04)'),
      despues: img('Render final del mismo encuadre'),
    },
    {
      titulo: 'La criatura',
      texto: 'De la primera silueta en 3D al diseño final.',
      antes: img('Primer diseño 3D de la criatura (S07)'),
      despues: img('Criatura terminada'),
    },
  ],

  pipeline: [
    { paso: 'Guion', texto: 'La escena de una página: qué pasa en cada set y cuál es el último plano.', estado: 'hecho' },
    { paso: 'Previz', texto: 'Thumbnails, storyboard y primitivas contra la música. Va antes de modelar.', estado: 'en-curso' },
    { paso: 'Modelado', texto: 'Solo lo que entra en cámara. Un modelo para la criatura pura y la corrupta.', estado: 'pendiente' },
    { paso: 'Rig', texto: 'Creador con cuerpo, manos y ojos; la criatura comparte rig en sus dos versiones.', estado: 'pendiente' },
    { paso: 'Look dev', texto: 'Materiales e iluminación cerrados antes de animar, no en marzo.', estado: 'pendiente' },
    { paso: 'Animación', texto: 'Layout, blocking contra la música y animación fina.', estado: 'pendiente' },
    { paso: 'Render', texto: 'Cycles en GPU. Secuencias OpenEXR multicapa, de noche y por lotes.', estado: 'pendiente' },
    { paso: 'Post', texto: 'Composición, montaje, sonido y color en DaVinci Resolve.', estado: 'pendiente' },
  ],

  archivo: {
    wips: [
      img('WIP: blockout del taller'),
      img('WIP: blockout del bosque'),
      img('WIP: blockout de la bodega'),
      img('WIP: escena del test de render (S02)'),
    ],
    versiones: [
      { titulo: 'Ventanas del taller · v1', texto: 'Ruido Perlin sin forma reconocible: un borrón, no una ventana.', imagen: img('Portal v1') },
      { titulo: 'Ventanas del taller · v2', texto: 'Óvalo vertical deformado con ruido suave. Demasiado simétrico y redondo: se leía como algo anatómico.', imagen: img('Portal v2') },
      { titulo: 'Ventanas del taller · v3', texto: 'Óvalo deformado con Voronoi y transición de color estrecha: bordes angulares y nítidos, como una grieta.', imagen: img('Portal v3') },
    ],
    fallos: [
      { titulo: 'La salida Alpha del Color Ramp', texto: 'El portal salía transparente entero. La salida Alpha de un Color Ramp es el alfa de los propios stops (1 si no se toca), no el degradado. Se arregló conectando la salida Color.' },
      { titulo: 'El "otro mundo" detrás de la ventana', texto: 'Un plano de fondo detrás del hueco fallaba con la cámara en ángulo. Se sustituyó por una nebulosa en el World, visible solo para la cámara (Light Path › Is Camera Ray) para que no tiñera de azul todo el taller.' },
      { titulo: 'CUDA en el portátil', texto: 'Cycles con GPU daba "Invalid kernel image" en el portátil con RTX 3050 Ti y OptiX no detectaba dispositivo. El prototipo se verificó por CPU y el render real se hace en el PC con la RX 9070 XT.' },
    ],
  },
};
