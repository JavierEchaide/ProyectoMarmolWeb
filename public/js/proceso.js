/* Proceso: los bloques de la línea de tiempo y el archivo se despliegan
   animados. Al abrir, el bloque crece hasta su altura y su contenido entra
   escalonado (cada semana un poco después de la anterior); al cerrar se
   recoge más rápido. Si se pulsa a mitad, la animación da la vuelta desde
   donde esté. Con "reducir movimiento" se abren y cierran sin animación. */
(function () {
  'use strict';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!document.documentElement.animate) return;

  var CURVA_SALIDA = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var CURVA = 'cubic-bezier(0.65, 0, 0.35, 1)';
  // Recorta solo arriba y abajo: el punto de la línea de tiempo asoma por la
  // izquierda del bloque y con overflow: hidden desaparecería
  var RECORTE = 'inset(0 -60px 0 -60px)';

  document.querySelectorAll('.linea-tiempo details, details.archivo').forEach(function (d) {
    var resumen = d.querySelector('summary');
    var cuerpo = d.querySelector('.bloque__cuerpo, .archivo__cuerpo');
    var animacion = null;

    // Lo que entra escalonado: el objetivo, cada semana y cada captura;
    // en el archivo, los subtítulos y lo que hay debajo de cada uno
    function piezas() {
      return Array.prototype.slice.call(
        cuerpo.querySelectorAll(
          ':scope > .bloque__objetivo, .semana, .captura, :scope > .archivo__subtitulo, :scope > ul > li'
        )
      );
    }

    function altura(el) {
      return el.getBoundingClientRect().height;
    }

    function terminar() {
      animacion = null;
      d.style.height = '';
      d.style.clipPath = '';
      d.classList.remove('plegando');
    }

    function abrir() {
      var desde = altura(d);
      d.classList.remove('plegando');
      d.open = true;
      var hasta = altura(resumen) + cuerpo.offsetHeight;
      d.style.clipPath = RECORTE;
      var duracion = Math.min(900, Math.max(450, (hasta - desde) * 0.6));
      animacion = d.animate([{ height: desde + 'px' }, { height: hasta + 'px' }], {
        duration: duracion,
        easing: CURVA_SALIDA,
      });
      animacion.onfinish = terminar;
      piezas().forEach(function (p, i) {
        p.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
          duration: 520,
          delay: 80 + Math.min(i, 10) * 45,
          easing: CURVA_SALIDA,
          fill: 'backwards',
        });
      });
    }

    function cerrar() {
      var desde = altura(d);
      var hasta = altura(resumen);
      d.classList.add('plegando');
      d.style.clipPath = RECORTE;
      cuerpo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-out', fill: 'forwards' });
      animacion = d.animate([{ height: desde + 'px' }, { height: hasta + 'px' }], {
        duration: Math.min(550, Math.max(320, (desde - hasta) * 0.35)),
        easing: CURVA,
      });
      animacion.onfinish = function () {
        d.open = false;
        cuerpo.getAnimations().forEach(function (a) { a.cancel(); });
        terminar();
      };
    }

    resumen.addEventListener('click', function (e) {
      e.preventDefault();
      // A mitad de animación: se para donde esté y sale hacia el otro lado
      var plegando = d.classList.contains('plegando');
      if (animacion) {
        d.style.height = altura(d) + 'px';
        animacion.onfinish = null;
        animacion.cancel();
        cuerpo.getAnimations().forEach(function (a) { a.cancel(); });
        animacion = null;
      }
      if (!d.open || plegando) abrir();
      else cerrar();
    });
  });
})();

/* Proceso: índice lateral (scrollspy) y enlaces directos por semana (#s05).
   - Marca en el índice la sección que se está leyendo (aria-current).
   - Un enlace a una semana abre antes su bloque del calendario, que puede
     estar plegado, y después baja hasta ella. Funciona al cargar la página
     con el ancla en la dirección y al pulsar en el índice. */
(function () {
  'use strict';

  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    document.querySelectorAll('[data-indice-semana]').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (desplazar) destino.scrollIntoView({ block: 'start', behavior: movimientoReducido ? 'auto' : 'smooth' });
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
    if (!actual) return;
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
