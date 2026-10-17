/* Teaser: sala de proyección.
   - Las luces de la página se apagan al acercarse al reproductor: con ratón,
     según lo cerca que esté el cursor; sin ratón, según lo centrado que esté
     el reproductor en la pantalla.
   - Al pulsar play se abre el telón y luego el reproductor crece hasta una
     ventana grande (visor de js/site.js) y el vídeo arranca con sonido.
     Nunca hay autoplay al cargar la página. Al cerrar, el telón se cierra. */
(function () {
  'use strict';

  var boton = document.querySelector('[data-reproductor]');
  if (!boton || !window.marmolVisor) return;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var luces = document.querySelector('[data-luces]');
  var visor = document.querySelector('[data-visor-dialogo]');

  /* Luces */
  var oscuridad = 0;
  var objetivo = 0;
  var cursor = null;
  var pendiente = false;
  function calcular() {
    var r = boton.getBoundingClientRect();
    var porScroll = 0;
    var centro = r.top + r.height / 2;
    var desvio = Math.abs(centro - window.innerHeight / 2) / (window.innerHeight * 0.5);
    porScroll = Math.max(0, 1 - desvio * 1.4) * 0.35;
    var porCursor = 0;
    if (cursor) {
      var dx = Math.max(r.left - cursor.x, 0, cursor.x - r.right);
      var dy = Math.max(r.top - cursor.y, 0, cursor.y - r.bottom);
      porCursor = Math.max(0, 1 - Math.hypot(dx, dy) / 320) * 0.86;
    }
    objetivo = Math.max(porScroll, porCursor);
  }
  function pintar() {
    pendiente = false;
    calcular();
    oscuridad += (objetivo - oscuridad) * (movimientoReducido ? 1 : 0.08);
    luces.style.opacity = oscuridad.toFixed(3);
    if (Math.abs(objetivo - oscuridad) > 0.002) pedir();
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }
  if (luces) {
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    if (conRaton) {
      window.addEventListener('pointermove', function (e) {
        cursor = { x: e.clientX, y: e.clientY };
        pedir();
      }, { passive: true });
      document.addEventListener('pointerleave', function () {
        cursor = null;
        pedir();
      });
    }
    pedir();
  }

  /* Telón y vídeo */
  function abrirVideo() {
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
  }

  boton.addEventListener('click', function () {
    if (boton.classList.contains('telon-abierto') || movimientoReducido) {
      boton.classList.add('telon-abierto');
      abrirVideo();
      return;
    }
    boton.classList.add('telon-abierto');
    // El vídeo crece cuando el telón ya casi se ha recogido
    setTimeout(abrirVideo, 750);
  });

  if (visor) {
    visor.addEventListener('close', function () {
      setTimeout(function () { boton.classList.remove('telon-abierto'); }, 350);
    });
  }
})();
