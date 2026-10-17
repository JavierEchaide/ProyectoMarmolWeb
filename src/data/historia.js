// Contenido de la página Historia. Escrito a partir de "Lore - Biblia
// completa", "Estructura narrativa - Partes y temporadas" y "El Protagonista".
// `spoiler: true` tapa la parte con el cartel negro hasta que se pulsa.

export const historia = {
  premisa: {
    titulo: 'Premisa',
    parrafos: [
      'En el mundo de Serie Mármol las criaturas no nacen: se tallan. Un ser al que todos llaman Dios las esculpe en mármol, en un taller que no pertenece a ningún universo, y las deja caer por una ventana en los paisajes más bellos y más lejanos que encuentra. Llegan perfectas, simétricas, sin una sola marca.',
      'En cuanto alguien las usa para algo —para la guerra, para un templo, para demostrar que tiene razón— empiezan a agrietarse.',
      'Es la premisa de Attack on Titan dada la vuelta: los monstruos no son armas por diseño, son arte que el mundo corrompe. Y debajo hay una idea que viene del kintsugi japonés: la corrupción no se revierte. Se sana, y la grieta se sigue viendo.',
    ],
    imagen: {
      src: null,
      alt: 'El Creador ante una de sus ventanas, con una criatura de mármol a medio tallar.',
      falta: 'Imagen clave: el Creador en el taller con una criatura de mármol a medio tallar',
    },
  },

  partes: [
    {
      numero: 'I',
      titulo: 'La infancia',
      spoiler: false,
      texto:
        'Cassian pierde a su familia y a su pueblo cuando una facción vecina los arrasa con una criatura. Crece odiándolas: para él son monstruos. A los quince años se cruza con una criatura pura, intacta, y se acerca para doblegarla. Ella no ataca, solo se defiende. Y bajo sus manos aparecen dos grietas finísimas donde antes no había ninguna. Cassian se detiene. Cree que la ha herido. Tardará décadas en entender lo que vio ese día.',
      imagen: { src: null, alt: 'Cassian, con quince años, frente a una criatura pura.', falta: 'Cassian a los quince años frente a la criatura pura, con las dos primeras grietas' },
    },
    {
      numero: 'II',
      titulo: 'La conversión',
      spoiler: false,
      texto:
        'No hay una revelación de golpe, hay años. Criaturas que no atacan, gente que le obliga a mirar lo que no quiere ver y, sobre todo, ver de cerca cómo los humanos capturan, doman y arman a las criaturas hasta romperlas. Recae, desconfía, vuelve a empezar. Cuando por fin está convencido deja de odiarlas y empieza a protegerlas, y descubre algo que nadie en el mundo sabía: una criatura rota se puede sanar. Donde estaba la grieta queda una veta de oro.',
      imagen: { src: null, alt: 'Una criatura con las grietas selladas en oro.', falta: 'Una criatura con las grietas selladas en oro (la primera sanación)' },
    },
    {
      numero: 'III',
      titulo: 'El profeta y su precio',
      spoiler: true,
      texto:
        'A su alrededor nace un movimiento con una doctrina en negativo: no representarlas, no retenerlas, no pedirles nada. Entonces llegan dos golpes seguidos. Primero ve criaturas agrietadas en pueblos pacifistas donde nadie les ha puesto la mano encima: venerarlas también las rompe. Después mira de cerca a Vela, la criatura de los quince años, la prueba viva de que la sanación existe, y encuentra grietas más viejas que su propio movimiento. Hace la cuenta y la cuenta da él, dos veces. Decide seguir sabiendo el precio. Ahí deja de ser inocente.',
      imagen: { src: null, alt: 'Vela, cubierta de vetas de oro, rodeada de seguidores.', falta: 'Vela con sus grietas de oro, rodeada de gente que la venera' },
    },
    {
      numero: 'IV',
      titulo: 'La revelación',
      spoiler: true,
      texto:
        'Cassian no acusa a nadie: sana a una criatura en una plaza pública y la criatura se niega a cumplir su papel en la ceremonia. Si sanar era tan sencillo, ¿por qué nadie lo sabía? La gente deduce sola el resto: sus gobiernos llevaban siglos ocultando que tratar a las criaturas como un medio es lo que las rompe. Las siete facciones se hunden, se refundan o se desangran, cada una a su manera, y el colapso acaba en la Gran Guerra. Alguien se lo dice a la cara: murieron más por tu verdad que por sus criaturas. Él no puede responder que no.',
      imagen: { src: null, alt: 'Una criatura sanada en medio de una plaza, ante una multitud.', falta: 'La primera sanación pública en una plaza' },
    },
    {
      numero: 'V',
      titulo: 'El taller',
      spoiler: true,
      texto:
        'Con el mundo en llamas, el Creador vuelve a mirar por primera vez en siglos. No por compasión: iba a soltar una criatura nueva y no encontraba un solo paisaje intacto. Al ver lo que han hecho con su obra talla criaturas para exterminar a la humanidad, hasta que encuentra algo que ni él sabía posible: una criatura con oro en las grietas. Manda a Vela a buscar a Cassian, que se tumba en la silueta prohibida del santuario y cruza al taller. Hablan. Cada conversación le cuesta a Cassian meses de vida.',
      imagen: { src: null, alt: 'Cassian frente al Creador en el taller.', falta: 'Cassian en el taller, frente al Creador de espaldas' },
    },
    {
      numero: 'VI',
      titulo: 'El barquero',
      spoiler: true,
      texto:
        'El pacto tiene letra pequeña. El Creador retira a las exterminadoras y rediseña a las criaturas nuevas para que puedan elegir, pero las antiguas solo quedan libres si cruzan al taller, una a una y por decisión propia, y Cassian es el único que puede llevarlas. Deja de ser profeta y se convierte en barquero. Sana a muchas y cruza a poquísimas, mientras su movimiento se vuelve una religión con templos, listas de espera y sacerdotes: justo lo que prohibía. Y él, que dedicó su vida a que nadie usara a nadie como medio, sigue subiendo a hablar con Dios para no estar solo.',
      imagen: { src: null, alt: 'Una cola de criaturas sanadas ante la puerta del santuario.', falta: 'La cola de criaturas sanadas esperando ante el santuario' },
    },
  ],

  final: {
    titulo: 'El final',
    parrafos: [
      'Cassian muere con la cola sin terminar. Vela, cubierta de oro de tantas sanaciones, acaba convertida en estatua: la única criatura que nunca pudo cruzar. Él intenta disolver su propia orden y solo lo consigue a medias; libera a las criaturas del parque, pero no logra que la gente deje de venerarlo.',
      'Generaciones después, el santuario está lleno de peregrinos y reliquias, y alguien explica con total sinceridad que el fundador prohibió todo aquello, mientras lo hace. El último plano vuelve al taller: el Creador, solo, sentado bajo el árbol que fue su primera obra. Lo único que creció sin su permiso. Sin tallar.',
    ],
    cita: 'Se puede destrozar algo queriéndolo mucho, si lo que se quiere de ello es que sirva para algo.',
  },
};
