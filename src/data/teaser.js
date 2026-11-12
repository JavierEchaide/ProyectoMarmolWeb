// Contenido de la página Teaser.
import { musica } from './musica.js';

export const teaser = {
  video: {
    // Ruta del MP4 cuando exista (p. ej. 'video/teaser.mp4'). Con null se
    // enseña el aviso de "en producción" al pulsar play.
    src: null,
    // Fotograma que se ve antes de pulsar play (2.35:1, p. ej. 1920×817).
    poster: null,
    falta: 'Teaser en producción · 30 s · 2.35:1',
    semana: 'S33', // máster del teaser
  },

  sinopsis: [
    'Treinta segundos, tres lugares. Un taller fuera del mundo, donde alguien talla en mármol sin que se le vea la cara. Un bosque alto, donde algo recién hecho abre los ojos por primera vez. La bodega de un barco, donde ese algo ya no es lo que era.',
    'Y una ventana que, después de siglos, alguien vuelve a mirar.',
  ],

  // Ficha técnica: franja compacta bajo el vídeo. La música sale de
  // src/data/musica.js (el mismo origen que el reproductor de la web).
  ficha: [
    { titulo: 'Duración', lineas: ['30 segundos', '24 fps · 720 fotogramas'] },
    { titulo: 'Hecho con', lineas: ['Blender 5.2 LTS · Cycles', 'Montaje y color en DaVinci Resolve'] },
    { titulo: 'Formato', lineas: ['Panorámico 2.35:1', 'Con bandas negras'] },
    {
      titulo: 'Música',
      lineas: [
        `"${musica.titulo}" · ${musica.autor}`,
        `${musica.sitio} · Licencia Creative Commons Atribución 4.0 (${musica.licencia})${musica.provisional ? ' · Pista provisional' : ''}`,
      ],
    },
  ],

  // Carrusel de planos: un hueco por plano del teaser (2a y 2b son dos
  // divisiones; 2b y 3 son un solo plano de cámara). Todos 2.35:1.
  // estado: 'placeholder' | 'previz' | 'render de prueba' | 'render'.
  // Para poner un fotograma: copiarlo a public/img/teaser/plano-XX.webp,
  // rellenar `src` y cambiar el `estado`. Los pies marcados como pendientes
  // son huecos: los escribe Javi.
  planos: [
    { plano: '1', estado: 'placeholder', pie: 'El taller: ventanas al multiverso.', imagen: { src: null, alt: 'Plano general del taller.', falta: 'Plano 1 · plano general del taller', semana: 'S27' } },
    { plano: '2a', estado: 'placeholder', pie: 'Pie del plano 2a, pendiente.', imagen: { src: null, alt: 'Fotograma del plano 2a (pendiente de describir).', falta: 'Plano 2a · fotograma y descripción pendientes', semana: 'S27' } },
    { plano: '2b', estado: 'placeholder', pie: 'Abre la mano hacia la ventana.', imagen: { src: null, alt: 'El Creador abre la mano hacia la ventana.', falta: 'Plano 2b · la mano hacia la ventana', semana: 'S27' } },
    { plano: '3', estado: 'placeholder', pie: 'Pie del plano 3, pendiente.', imagen: { src: null, alt: 'Fotograma del plano 3 (pendiente de describir).', falta: 'Plano 3 · fotograma y descripción pendientes', semana: 'S27' } },
    { plano: '4', estado: 'placeholder', pie: 'En el bosque.', imagen: { src: null, alt: 'Los ojos de la criatura pura.', falta: 'Plano 4 · ojos de la criatura pura (encuadre A)', semana: 'S27' } },
    { plano: '5', estado: 'placeholder', pie: 'Pie del plano 5, pendiente.', imagen: { src: null, alt: 'Fotograma del plano 5 (pendiente de describir).', falta: 'Plano 5 · fotograma y descripción pendientes', semana: 'S27' } },
    { plano: '6', estado: 'placeholder', pie: 'En la jaula.', imagen: { src: null, alt: 'Los ojos de la criatura corrupta.', falta: 'Plano 6 · ojos de la criatura corrupta (mismo encuadre A)', semana: 'S27' } },
    { plano: '7', estado: 'placeholder', pie: 'Deja de tallar.', imagen: { src: null, alt: 'El Creador se detiene.', falta: 'Plano 7 · el Creador se detiene', semana: 'S27' } },
    { plano: '8', estado: 'placeholder', pie: 'Se gira hacia este mundo.', imagen: { src: null, alt: 'El Creador se gira hacia la ventana.', falta: 'Plano 8 · se gira con el cincel en la mano', semana: 'S27' } },
    { plano: '9', estado: 'placeholder', pie: 'Pie del plano 9, pendiente.', imagen: { src: null, alt: 'Fotograma del plano 9 (pendiente de describir).', falta: 'Plano 9 · fotograma y descripción pendientes', semana: 'S27' } },
  ],

  // La rima: planos 4 y 6, mismo recorte y encuadre A, en un comparador
  // con una línea que se arrastra.
  rima: {
    titulo: 'La rima',
    texto: 'Los dos planos de los ojos de la criatura usan exactamente el mismo encuadre. Es lo que cuenta, sin una palabra, que la del bosque y la de la jaula son la misma.',
    antes: { plano: '4', etiqueta: 'En el bosque', imagen: { src: null, alt: 'Los ojos de la criatura pura.', falta: 'Plano 4 · ojos de la criatura pura (encuadre A)', semana: 'S27' } },
    despues: { plano: '6', etiqueta: 'En la jaula', imagen: { src: null, alt: 'Los ojos de la criatura corrupta.', falta: 'Plano 6 · ojos de la criatura corrupta (mismo encuadre A)', semana: 'S27' } },
  },
};
