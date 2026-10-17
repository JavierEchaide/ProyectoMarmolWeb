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
  var NS = 'http://www.w3.org/2000/svg';
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
    var svg = s.querySelector('.spoiler__grietas');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '';
    // Tres pasadas por trazo: hueco oscuro, oro y filo de luz
    ['sombra', 'oro', 'luz'].forEach(function (capa) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'spoiler__capa spoiler__capa--' + capa);
      geo.grietas.forEach(function (puntos) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', G.trazado(puntos));
        p.setAttribute('pathLength', '1');
        g.appendChild(p);
      });
      geo.anillo.forEach(function (puntos) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', G.trazado(puntos));
        p.setAttribute('pathLength', '1');
        p.setAttribute('class', 'spoiler__anillo');
        g.appendChild(p);
      });
      svg.appendChild(g);
    });
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

  /* Rotura ---------------------------------------------------------------- */

  function centroide(puntos) {
    var x = 0;
    var y = 0;
    puntos.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / puntos.length, y / puntos.length];
  }

  function romper(s, tapa, geo) {
    var cara = tapa.querySelector('.spoiler__cara');
    var azar = G.aleatorio((parseInt(s.dataset.semilla, 10) || 1) * 13 + 5);
    var capa = document.createElement('span');
    capa.className = 'spoiler__esquirlas';
    capa.setAttribute('aria-hidden', 'true');
    var radioMax = Math.hypot(geo.w, geo.h) / 2;

    var piezas = geo.esquirlas.map(function (poli) {
      var c = centroide(poli);
      var dx = c[0] - geo.centro[0];
      var dy = c[1] - geo.centro[1];
      var d = Math.hypot(dx, dy) || 1;
      var el = document.createElement('span');
      el.className = 'esquirla';
      el.style.clipPath =
        'polygon(' +
        poli.map(function (p) { return ((p[0] / geo.w) * 100).toFixed(3) + '% ' + ((p[1] / geo.h) * 100).toFixed(3) + '%'; }).join(',') +
        ')';
      el.style.transformOrigin = ((c[0] / geo.w) * 100).toFixed(2) + '% ' + ((c[1] / geo.h) * 100).toFixed(2) + '%';
      el.appendChild(cara.cloneNode(true));
      capa.appendChild(el);
      return { el: el, ux: dx / d, uy: dy / d, d: d };
    });

    tapa.appendChild(capa);
    // La luz sale del punto de impacto
    tapa.style.setProperty('--cx', ((geo.centro[0] / geo.w) * 100).toFixed(1) + '%');
    tapa.style.setProperty('--cy', ((geo.centro[1] / geo.h) * 100).toFixed(1) + '%');
    tapa.classList.add('tapa--rota');

    piezas.forEach(function (p) {
      var cerca = p.d / radioMax;
      var signo = azar() < 0.5 ? -1 : 1;
      // 2. Se abre: un poco hacia fuera y hacia delante
      var abierta =
        'translate3d(' + (p.ux * 7).toFixed(1) + 'px,' + (p.uy * 7).toFixed(1) + 'px,' + (12 + azar() * 26).toFixed(1) + 'px) ' +
        'rotateX(' + (p.uy * -6).toFixed(1) + 'deg) rotateY(' + (p.ux * 8).toFixed(1) + 'deg)';
      // 3. Cae: hacia fuera, hacia el espectador y hacia abajo, girando
      var lejos = 70 + azar() * 140;
      var caida =
        'translate3d(' + (p.ux * lejos).toFixed(1) + 'px,' + (p.uy * lejos * 0.6 + geo.h * (0.7 + azar() * 0.6)).toFixed(1) + 'px,' +
        (140 + azar() * 220).toFixed(1) + 'px) ' +
        'rotateX(' + (signo * (40 + azar() * 70)).toFixed(1) + 'deg) rotateY(' + (-signo * (30 + azar() * 70)).toFixed(1) + 'deg) ' +
        'rotateZ(' + ((azar() - 0.5) * 70).toFixed(1) + 'deg)';
      p.el.animate(
        [
          { transform: 'none', opacity: 1, offset: 0 },
          { transform: abierta, opacity: 1, offset: 0.24, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
          { transform: caida, opacity: 1, offset: 0.78 },
          { transform: caida, opacity: 0, offset: 1 },
        ],
        { duration: 1250, delay: 60 + cerca * 170, easing: 'linear', fill: 'forwards' }
      );
    });
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
      var capa = tapa.querySelector('.spoiler__esquirlas');
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
