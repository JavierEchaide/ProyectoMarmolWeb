/* Proceso: comparadores antes / después. El control es un <input type="range">
   invisible encima de la imagen: funciona con ratón, dedo y teclado. */
(function () {
  'use strict';

  document.querySelectorAll('[data-comparador]').forEach(function (c) {
    var control = c.querySelector('[data-comparador-control]');
    function actualizar() {
      c.style.setProperty('--corte', control.value + '%');
      c.style.setProperty('--corte-num', control.value / 100);
    }
    control.addEventListener('input', actualizar);
    actualizar();
  });
})();

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
