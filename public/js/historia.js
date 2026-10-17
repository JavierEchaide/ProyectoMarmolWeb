/* Historia: losas de SPOILER.

   Tapada, la losa se inclina siguiendo el ratón y, al pasar por encima, le
   sale una fisura en el punto de impacto. Al pulsarla:
     1. se agrieta en oro desde el punto de impacto (0,4 s),
     2. se abre: las esquirlas se separan y la luz dorada asoma por las juntas,
     3. las esquirlas caen y giran en 3D mientras el bloque crece hasta la
        altura real del contenido.
   "Mostrar todos" destapa todas; "Volver a taparlos" las repone. No se guarda
   nada: al recargar vuelven a estar tapadas. Necesita js/grietas.js. */
(function () {
  'use strict';

  var G = window.marmolGrietas;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var punteroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var spoilers = Array.prototype.slice.call(document.querySelectorAll('.spoiler--activo'));
  var botonTodos = document.querySelector('[data-spoiler-todos]');

  /* Geometría: las grietas se dibujan al tamaño real de la losa. Se rehacen
     si la losa cambia de tamaño entre que se prepara y se rompe. */
  function preparar(s) {
    var tapa = s.querySelector('.spoiler__tapa');
    var w = Math.round(tapa.offsetWidth);
    var h = Math.round(tapa.offsetHeight);
    if (!G || !w || !h) return null;
    if (s._geo && s._geo.w === w && s._geo.h === h) return s._geo;

    var geo = G.rotura(parseInt(s.dataset.semilla, 10) || 1, w, h);
    geo.w = w;
    geo.h = h;
    G.dibujar(s.querySelector('.spoiler__grietas'), geo);
    s._geo = geo;
    return geo;
  }

  /* Inclinación de la losa y reflejo que sigue al ratón */
  function inclinar(s) {
    var tapa = s.querySelector('.spoiler__tapa');
    tapa.addEventListener('pointermove', function (e) {
      if (s.dataset.spoiler !== 'tapado' || s.classList.contains('rompiendo')) return;
      var r = tapa.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      tapa.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
      tapa.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
      tapa.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      tapa.style.setProperty('--my', (y * 100).toFixed(1) + '%');
    });
    tapa.addEventListener('pointerleave', function () {
      tapa.style.setProperty('--rx', '0deg');
      tapa.style.setProperty('--ry', '0deg');
    });
  }

  /* Rotura (motor común en js/grietas.js) -------------------------------- */

  function romper(s, tapa, geo) {
    G.esquirlas(tapa, tapa.querySelector('.spoiler__cara'), geo, { semilla: parseInt(s.dataset.semilla, 10) || 1 });
    // La luz sale del punto de impacto
    tapa.style.setProperty('--cx', ((geo.centro[0] / geo.w) * 100).toFixed(1) + '%');
    tapa.style.setProperty('--cy', ((geo.centro[1] / geo.h) * 100).toFixed(1) + '%');
    tapa.classList.add('tapa--rota');
  }

  function destapar(s, enfocar) {
    if (s.dataset.spoiler !== 'tapado' || s.classList.contains('rompiendo')) return;
    var tapa = s.querySelector('.spoiler__tapa');
    var contenido = s.querySelector('.spoiler__contenido');
    var tarjeta = s.closest('.tarjeta');
    s.classList.add('rompiendo');
    actualizarBoton();

    var geo = movimientoReducido ? null : preparar(s);
    if (!geo || !tapa.animate) {
      abrirContenido(s, contenido, enfocar);
      s.classList.add('destapado');
      return;
    }

    // La losa se queda con su tamaño en píxeles mientras se rompe, para que
    // las esquirlas no se estiren cuando el bloque empiece a crecer.
    tapa.style.width = geo.w + 'px';
    tapa.style.height = geo.h + 'px';
    tapa.style.setProperty('--rx', '0deg');
    tapa.style.setProperty('--ry', '0deg');
    if (tarjeta) tarjeta.classList.add('tarjeta--encima');

    // 1. Golpe y grietas
    s.classList.add('agrietando');
    tapa.querySelector('.spoiler__cara').animate(
      [{ transform: 'none' }, { transform: 'translateZ(-14px) scale(0.985)' }, { transform: 'none' }],
      { duration: 220, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' }
    );

    setTimeout(function () {
      romper(s, tapa, geo);
    }, 430);

    setTimeout(function () {
      abrirContenido(s, contenido, enfocar);
    }, 720);

    setTimeout(function () {
      s.classList.add('destapado');
      tapa.style.width = '';
      tapa.style.height = '';
      var capa = tapa.querySelector('.rotura__esquirlas');
      if (capa) capa.remove();
      tapa.classList.remove('tapa--rota');
      if (tarjeta) tarjeta.classList.remove('tarjeta--encima');
    }, 2100);
  }

  // El bloque pasa de la altura fija de la losa a la del contenido
  function abrirContenido(s, contenido, enfocar) {
    var antes = contenido.offsetHeight;
    s.dataset.spoiler = 'destapado';
    contenido.inert = false;
    var despues = contenido.offsetHeight;
    if (!movimientoReducido && contenido.animate && despues !== antes) {
      contenido.style.overflow = 'hidden';
      contenido
        .animate([{ height: antes + 'px' }, { height: despues + 'px' }], {
          duration: 700,
          easing: 'cubic-bezier(0.65, 0, 0.35, 1)',
        })
        .finished.then(function () { contenido.style.overflow = ''; });
    }
    if (enfocar) {
      contenido.setAttribute('tabindex', '-1');
      setTimeout(function () { contenido.focus({ preventScroll: true }); }, movimientoReducido ? 0 : 700);
    }
  }

  function tapar(s) {
    var contenido = s.querySelector('.spoiler__contenido');
    var tapa = s.querySelector('.spoiler__tapa');
    var antes = contenido.offsetHeight;
    s.classList.remove('rompiendo', 'agrietando', 'destapado');
    s.dataset.spoiler = 'tapado';
    contenido.inert = true;
    contenido.removeAttribute('tabindex');
    if (movimientoReducido || !contenido.animate) return;
    var despues = contenido.offsetHeight;
    contenido.style.overflow = 'hidden';
    contenido
      .animate([{ height: antes + 'px' }, { height: despues + 'px' }], { duration: 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' })
      .finished.then(function () { contenido.style.overflow = ''; });
    tapa.animate([{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'none' }], {
      duration: 500,
      delay: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'backwards',
    });
  }

  function quedanTapados() {
    return spoilers.some(function (s) { return s.dataset.spoiler === 'tapado' && !s.classList.contains('rompiendo'); });
  }

  function actualizarBoton() {
    if (!botonTodos) return;
    var quedan = quedanTapados();
    botonTodos.textContent = quedan ? 'Mostrar todos' : 'Volver a taparlos';
    botonTodos.setAttribute('aria-pressed', quedan ? 'false' : 'true');
  }

  spoilers.forEach(function (s) {
    var tapa = s.querySelector('[data-spoiler-tapa]');
    tapa.addEventListener('click', function () { destapar(s, true); });
    // Las grietas se preparan antes del clic para poder insinuarlas
    tapa.addEventListener('pointerenter', function () { preparar(s); });
    tapa.addEventListener('focus', function () { preparar(s); });
    if (punteroFino && !movimientoReducido) inclinar(s);
  });

  if (botonTodos) {
    botonTodos.addEventListener('click', function () {
      var quedan = quedanTapados();
      spoilers.forEach(function (s, i) {
        if (quedan) setTimeout(function () { destapar(s, false); }, movimientoReducido ? 0 : i * 160);
        else tapar(s);
      });
      setTimeout(actualizarBoton, quedan ? 0 : 50);
    });
  }
})();
