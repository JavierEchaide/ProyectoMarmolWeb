// Contenido de la Portada.
// Imágenes: { src, alt, falta }. Mientras `src` sea null se ve un
// placeholder con el texto de `falta` (qué render tiene que ir ahí).
// Para poner la imagen real: copiarla a public/img/... y rellenar `src`.

export const portada = {
  intro: {
    saludo: 'Bienvenido a',
    titulo: 'Proyecto Mármol',
  },

  hero: {
    // Render del título tallado. Provisional: el render del tablero de Canva.
    titulo: 'Proyecto Mármol', // texto real, oculto, para lectores de pantalla
    escritorio: 'img/portada/hero.webp', // 16:9
    movil: 'img/portada/hero-movil.webp',
    // Proporción del render de móvil (ancho / alto). El provisional es 1:1;
    // cuando llegue el render vertical 4:5, poner 0.8.
    ratioMovil: 1,
    alt: 'El título Proyecto Mármol tallado en una losa de mármol blanco con vetas rojas, junto a un cincel.',
    // Render por capas (PNG/WebP con transparencia, mismo tamaño 16:9), de
    // la más lejana a la más cercana. Profundidad: 0 = quieta, 1 = la que más
    // se mueve. Si la lista tiene capas, sustituyen a la imagen única. Ejemplo:
    // capas: [
    //   { src: 'img/portada/capa-fondo.webp', profundidad: 0.2 },
    //   { src: 'img/portada/capa-losa.webp', profundidad: 0.5 },
    //   { src: 'img/portada/capa-cincel.webp', profundidad: 1 },
    // ],
    capas: [],
  },

  gancho: 'Él las talló perfectas. Nunca bajó a mirar.',

  presentacion: [
    'Serie Mármol (título provisional) es una serie de animación sobre un dios escultor que talla criaturas en mármol, las deja caer en el mundo más bonito que encuentra y nunca vuelve a mirar qué hacemos con ellas.',
    'Esta web acompaña al teaser de 30 segundos hecho en Blender: resume la historia de la serie y enseña cómo se ha hecho el proyecto, semana a semana.',
  ],

  fotogramas: [
    {
      pie: 'Un taller fuera del mundo, lleno de ventanas.',
      imagen: { src: null, alt: 'El Creador de espaldas ante una ventana del taller.', falta: 'Render: el Creador de espaldas ante la ventana' },
    },
    {
      pie: 'De su cara solo se ven los ojos.',
      imagen: { src: null, alt: 'Los ojos del Creador en primer plano.', falta: 'Render: los ojos del Creador en primer plano' },
    },
    {
      pie: 'En un bosque alto, algo nuevo abre los ojos.',
      imagen: { src: null, alt: 'La criatura pura en un claro del bosque.', falta: 'Render: la criatura en el bosque' },
    },
    {
      pie: 'Lejos de allí, la misma criatura, encerrada.',
      imagen: { src: null, alt: 'La jaula con la criatura en la bodega del barco.', falta: 'Render: la jaula en la bodega del barco' },
    },
  ],

  accesos: [
    {
      pagina: 'teaser',
      subtitulo: '30 s',
      imagen: { src: null, alt: 'Fotograma del teaser.', falta: 'Fotograma del teaser para la tarjeta' },
    },
    {
      pagina: 'historia',
      subtitulo: 'Resumen',
      imagen: { src: null, alt: 'Imagen de la historia.', falta: 'Render o fotograma para la tarjeta de Historia' },
    },
    {
      pagina: 'proceso',
      subtitulo: 'Cómo se hizo',
      imagen: { src: null, alt: 'Captura del proceso en Blender.', falta: 'Captura de Blender para la tarjeta de Proceso' },
    },
  ],

  autor: {
    etiqueta: 'Hecho por',
    nombre: 'Javier Echaide',
    imagen: {
      src: null,
      alt: 'Autorretrato 3D de Javier Echaide con estética de estatua.',
      falta: 'Render: autorretrato 3D con estética de estatua y calavera (vertical 3:4)',
    },
  },
};
