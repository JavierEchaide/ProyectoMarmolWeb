/* IV · Proceso (V3). JavaScript clásico, sin módulos (funciona desde file://).
   1. Índice de placas (scrollspy) y enlaces directos por semana (#s05).
   2. Método paso a paso fijado (solo escritorio y sin movimiento reducido).
   3. Calendario: la veta se enciende en rojo hasta la semana actual al bajar.
   4. Archivo: filtros por tipo y por bloque (sin JS se ven todas las piezas). */

/* 1. Índice y anclas de semana ------------------------------------------- */
(function () {
  'use strict';

  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Un enlace a una semana abre antes su bloque del calendario (puede estar
  // plegado) y después baja hasta ella. En escritorio la semana vive en el
  // panel fijo: se baja hasta el nodo del bloque y se desplaza el panel.
  function irAlAncla(desplazar) {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var destino = document.getElementById(id);
    if (!destino) return;
    var plegado = destino.closest('details:not([open])');
    while (plegado) {
      plegado.open = true;
      plegado = plegado.parentElement && plegado.parentElement.closest('details:not([open])');
    }
    if (!desplazar) return;
    var caja = destino.closest('.calveta__caja');
    var comportamiento = movimientoReducido ? 'auto' : 'smooth';
    if (caja && getComputedStyle(caja).position === 'sticky') {
      var bloque = destino.closest('.calveta__bloque');
      bloque.scrollIntoView({ block: 'center', behavior: comportamiento });
      caja.scrollTop = destino.offsetTop - caja.offsetTop - 12;
      requestAnimationFrame(function () {
        caja.scrollTop += destino.getBoundingClientRect().top - caja.getBoundingClientRect().top - 12;
      });
    } else {
      destino.scrollIntoView({ block: 'start', behavior: comportamiento });
    }
  }
  window.addEventListener('hashchange', function () { irAlAncla(true); });
  if (location.hash) {
    irAlAncla(false);
    // el navegador ya intentó bajar con el bloque plegado: se repite con el bloque abierto
    requestAnimationFrame(function () { irAlAncla(true); });
  }
  // Mismo ancla dos veces seguidas no dispara hashchange
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (a && a.getAttribute('href') === location.hash) irAlAncla(true);
  });

  var enlaces = Array.prototype.slice.call(document.querySelectorAll('[data-indice-enlace]'));
  var secciones = Array.prototype.slice.call(document.querySelectorAll('[data-indice-seccion]'));
  if (!enlaces.length || !('IntersectionObserver' in window)) return;
  var visibles = {};
  function marcar() {
    // la primera sección que cruza la franja de lectura
    var actual = secciones.filter(function (s) { return visibles[s.id]; })[0];
    if (!actual) {
      // por encima de la primera sección no hay ninguna placa encendida
      if (secciones[0].getBoundingClientRect().top > window.innerHeight * 0.3) {
        enlaces.forEach(function (a) { a.removeAttribute('aria-current'); });
      }
      return;
    }
    enlaces.forEach(function (a) {
      if (a.getAttribute('href') === '#' + actual.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  var espia = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) { visibles[en.target.id] = en.isIntersecting; });
    marcar();
  }, { rootMargin: '-30% 0px -60% 0px' });
  secciones.forEach(function (s) { espia.observe(s); });
})();

/* 2. Método fijado -------------------------------------------------------- */
(function () {
  'use strict';

  var recorrido = document.querySelector('[data-metodo]');
  if (!recorrido) return;
  var fijo = recorrido.querySelector('.recorrido__fijo');
  var pasos = Array.prototype.slice.call(recorrido.querySelectorAll('[data-metodo-paso]'));
  var contador = recorrido.querySelector('[data-metodo-contador]');
  var regla = recorrido.querySelector('[data-metodo-regla]');
  var reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
  var ancho = window.matchMedia('(min-width: 1000px) and (min-height: 640px)');
  var fijado = false;
  var activo = -1;
  var pendiente = false;

  function dos(n) { return (n < 10 ? '0' : '') + n; }

  function activar(i) {
    if (i === activo) return;
    activo = i;
    pasos.forEach(function (p, n) { p.classList.toggle('estacion--activa', n === i); });
    if (contador) contador.textContent = dos(i + 1);
    if (regla) regla.style.width = ((i + 1) / pasos.length) * 100 + '%';
  }

  // Recorrido útil: lo que se baja mientras la caja está fijada
  function tramo() { return recorrido.offsetHeight - fijo.offsetHeight; }

  function medir() {
    pendiente = false;
    if (!fijado) return;
    var caja = recorrido.getBoundingClientRect();
    var arriba = parseFloat(getComputedStyle(fijo).top) || 0;
    var avance = Math.min(1, Math.max(0, (arriba - caja.top) / Math.max(1, tramo())));
    activar(Math.min(pasos.length - 1, Math.floor(avance * pasos.length)));
  }
  function alBajar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(medir);
  }

  // En modo fijado cada estación es un botón que baja hasta su paso
  function irA(i) {
    var arriba = parseFloat(getComputedStyle(fijo).top) || 0;
    var y = recorrido.getBoundingClientRect().top + window.pageYOffset - arriba + ((i + 0.5) / pasos.length) * tramo();
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  function ponerBotones() {
    pasos.forEach(function (p, i) {
      var titulo = p.querySelector('[data-metodo-titulo]');
      if (!titulo || titulo.querySelector('button')) return;
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'estacion__boton';
      while (titulo.firstChild) boton.appendChild(titulo.firstChild);
      titulo.appendChild(boton);
      boton.addEventListener('click', function () { irA(i); });
    });
  }
  function quitarBotones() {
    pasos.forEach(function (p) {
      var boton = p.querySelector('.estacion__boton');
      if (!boton) return;
      var titulo = boton.parentNode;
      while (boton.firstChild) titulo.appendChild(boton.firstChild);
      titulo.removeChild(boton);
    });
  }

  function ajustar() {
    var debe = ancho.matches && !reducido.matches;
    if (debe === fijado) return;
    fijado = debe;
    recorrido.classList.toggle('recorrido--fijado', fijado);
    if (fijado) {
      ponerBotones();
      activo = -1;
      medir();
      if (activo < 0) activar(0);
    } else {
      quitarBotones();
      pasos.forEach(function (p) { p.classList.remove('estacion--activa'); });
      activo = -1;
    }
  }

  window.addEventListener('scroll', alBajar, { passive: true });
  window.addEventListener('resize', function () { ajustar(); alBajar(); });
  [ancho, reducido].forEach(function (m) {
    if (m.addEventListener) m.addEventListener('change', ajustar);
    else if (m.addListener) m.addListener(ajustar);
  });
  ajustar();
})();

/* 3. Calendario: la veta se enciende al bajar ----------------------------- */
(function () {
  'use strict';

  var veta = document.querySelector('[data-calveta]');
  if (!veta) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tope = parseFloat(veta.style.getPropertyValue('--tope')) || 0;
  var pendiente = false;

  function medir() {
    pendiente = false;
    var caja = veta.getBoundingClientRect();
    // lo que ya ha pasado por el 60 % de la altura de la ventana
    var visto = ((window.innerHeight * 0.6 - caja.top) / Math.max(1, caja.height)) * 100;
    veta.style.setProperty('--encendido', Math.max(0, Math.min(tope, visto)).toFixed(1));
  }
  window.addEventListener('scroll', function () {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(medir);
  }, { passive: true });
  window.addEventListener('resize', medir);
  medir();
})();

/* 4. Archivo: filtros ----------------------------------------------------- */
(function () {
  'use strict';

  var filtros = document.querySelector('[data-filtros]');
  var coleccion = document.querySelector('[data-coleccion]');
  if (!filtros || !coleccion) return;
  var piezas = Array.prototype.slice.call(coleccion.children);
  var cuenta = filtros.querySelector('[data-filtros-cuenta]');
  var elegido = { tipo: '', bloque: '' };

  function aplicar() {
    var vistas = 0;
    piezas.forEach(function (p) {
      var pasa = (!elegido.tipo || p.getAttribute('data-tipo') === elegido.tipo) &&
        (!elegido.bloque || p.getAttribute('data-bloque') === elegido.bloque);
      p.hidden = !pasa;
      if (pasa) vistas++;
    });
    if (cuenta) {
      cuenta.textContent = vistas === 0 ? 'Ninguna pieza con estos filtros.'
        : vistas + (vistas === 1 ? ' pieza' : ' piezas') + ' de ' + piezas.length + '.';
    }
  }

  ['tipo', 'bloque'].forEach(function (grupo) {
    var botones = Array.prototype.slice.call(filtros.querySelectorAll('[data-filtro-' + grupo + ']'));
    botones.forEach(function (b) {
      b.addEventListener('click', function () {
        elegido[grupo] = b.getAttribute('data-filtro-' + grupo);
        botones.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        aplicar();
      });
    });
  });

  filtros.hidden = false;
  aplicar();
})();
