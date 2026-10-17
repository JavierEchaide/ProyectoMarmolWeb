// Contenido de la página Teaser.

export const teaser = {
  video: {
    // Ruta del MP4 cuando exista (p. ej. 'video/teaser.mp4'). Con null se
    // enseña el aviso de "en producción" al pulsar play.
    src: null,
    // Fotograma que se ve antes de pulsar play (2.35:1, p. ej. 1920×817).
    poster: null,
    falta: 'Teaser en producción · 30 s · 2.35:1',
  },

  sinopsis: [
    'Treinta segundos, tres lugares. Un taller fuera del mundo, donde alguien talla en mármol sin que se le vea la cara. Un bosque alto, donde algo recién hecho abre los ojos por primera vez. La bodega de un barco, donde ese algo ya no es lo que era.',
    'Y una ventana que, después de siglos, alguien vuelve a mirar.',
  ],

  ficha: [
    { titulo: 'Duración', lineas: ['30 segundos', '24 fps · 720 fotogramas'] },
    { titulo: 'Hecho con', lineas: ['Blender 5.2 LTS · Cycles', 'Montaje y color en DaVinci Resolve'] },
    { titulo: 'Formato', lineas: ['Panorámico 2.35:1', 'Con bandas negras'] },
    { titulo: 'Música', lineas: ['A decidir', 'Con licencia CC BY: se acredita al autor'] },
  ],

  // Fotogramas clave. Los planos 4 y 6 van aparte como pareja ("la rima").
  fotogramas: [
    { plano: '1', pie: 'El taller: ventanas al multiverso.', imagen: { src: null, alt: 'Plano general del taller.', falta: 'Plano 1 · plano general del taller' } },
    { plano: '2b', pie: 'Abre la mano hacia la ventana.', imagen: { src: null, alt: 'El Creador abre la mano hacia la ventana.', falta: 'Plano 2b · la mano hacia la ventana' } },
    { plano: '7', pie: 'Deja de tallar.', imagen: { src: null, alt: 'El Creador se detiene.', falta: 'Plano 7 · el Creador se detiene' } },
    { plano: '8', pie: 'Se gira hacia este mundo.', imagen: { src: null, alt: 'El Creador se gira hacia la ventana.', falta: 'Plano 8 · se gira con el cincel en la mano' } },
  ],

  rima: {
    titulo: 'La rima',
    texto: 'Los dos planos de los ojos de la criatura usan exactamente el mismo encuadre. Es lo que cuenta, sin una palabra, que la del bosque y la de la jaula son la misma.',
    antes: { plano: '4', pie: 'En el bosque.', imagen: { src: null, alt: 'Los ojos de la criatura pura.', falta: 'Plano 4 · ojos de la criatura pura (encuadre A)' } },
    despues: { plano: '6', pie: 'En la jaula.', imagen: { src: null, alt: 'Los ojos de la criatura corrupta.', falta: 'Plano 6 · ojos de la criatura corrupta (mismo encuadre A)' } },
  },
};
