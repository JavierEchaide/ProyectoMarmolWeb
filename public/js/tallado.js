/* Ornamentos que se dibujan trazo a trazo al entrar en pantalla (referencia:
   el dibujo técnico que se dibuja solo de heronaiapp.com): el doble filete
   dorado de las tarjetas, sus escuadras y las grecas.

   Con "reducir movimiento" no se hace nada: todo está ya dibujado. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window) || !document.documentElement.animate) return;

  var html = document.documentElement;
  html.classList.add('tallado-activo');

  function aleatorio(semilla) {
    var t = semilla >>> 0;
    return function () {
      t += 0x6d2b79f5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function alEntrar(elementos, umbral, fn) {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        fn(en.target);
      });
    }, { threshold: umbral, rootMargin: '0px 0px -6% 0px' });
    elementos.forEach(function (el) { io.observe(el); });
  }

  var NS = 'http://www.w3.org/2000/svg';

  // Doble filete de las tarjetas: dos rectángulos SVG que se trazan y luego
  // dejan su sitio al filete de CSS de siempre
  // (las tarjetas sobrias no llevan filete dorado: no hay nada que trazar)
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.tarjeta:not(.tarjeta--sobria) > .tarjeta__panel'));
  paneles.forEach(function (p) { p.classList.add('filete-pendiente'); });
  alEntrar(paneles, 0.25, function (p) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'filete');
    svg.setAttribute('aria-hidden', 'true');
    ['filete__exterior', 'filete__interior'].forEach(function (c) {
      var r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', c);
      r.setAttribute('pathLength', '1');
      svg.appendChild(r);
    });
    p.appendChild(svg);
    p.classList.add('filete-trazando');
    setTimeout(function () {
      p.classList.remove('filete-pendiente', 'filete-trazando');
      svg.remove();
    }, 1700);
  });

  // Grecas: se dibujan de izquierda a derecha
  var grecas = Array.prototype.slice.call(document.querySelectorAll('.greca'));
  grecas.forEach(function (g) { g.classList.add('greca--pendiente'); });
  alEntrar(grecas, 0.5, function (g) {
    g.classList.remove('greca--pendiente');
    g.classList.add('greca--trazando');
  });
})();
