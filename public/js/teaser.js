/* Teaser: al pulsar play, el reproductor crece hasta una ventana grande con
   el fondo oscurecido y desenfocado (visor de js/site.js), y el vídeo
   arranca con sonido. Nunca hay autoplay al cargar la página. */
(function () {
  'use strict';

  var boton = document.querySelector('[data-reproductor]');
  if (!boton || !window.marmolVisor) return;

  boton.addEventListener('click', function () {
    window.marmolVisor.abrir(
      {
        video: boton.dataset.video,
        esVideo: true,
        falta: boton.dataset.falta,
        ratio: '2.35 / 1',
        pie: 'Teaser · Serie Mármol',
      },
      boton,
      null
    );
  });
})();
