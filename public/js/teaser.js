/* Teaser.
   1. Reproductor: al pulsar play crece hasta una ventana grande con el fondo
      oscurecido (visor de js/site.js) y el vídeo arranca con sonido. Nunca
      hay autoplay al cargar la página.
   2. Nebulosa: tres capas que se mueven con el scroll a distinta velocidad.
   3. Carrusel de planos. */
(function () {
  'use strict';

  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Reproductor ------------------------------------------------------- */

  var boton = document.querySelector('[data-reproductor]');
  if (boton && window.marmolVisor) {
    boton.addEventListener('click', function () {
      window.marmolVisor.abrir(
        { video: boton.dataset.video, esVideo: true, falta: boton.dataset.falta, ratio: '2.35 / 1', pie: 'Teaser · Serie Mármol' },
        boton,
        null
      );
    });
  }

  /* 2. Nebulosa ----------------------------------------------------------
     Cada capa es más alta que la pantalla y sube al bajar: la lejana recorre
     poco y la cercana, mucho (data-nebulosa-capa = cuánto de su sobrante
     recorre). Solo `transform`, en requestAnimationFrame y solo mientras la
     página está visible. Con "reducir movimiento" o en móvil (pantalla
     estrecha o táctil) las capas se quedan quietas; en móvil, además, la
     cercana no se pinta (CSS). */
  var nebulosa = document.querySelector('[data-nebulosa]');
  var movil = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  if (nebulosa && !movimientoReducido && !movil) {
    var capas = Array.prototype.slice.call(nebulosa.querySelectorAll('[data-nebulosa-capa]'));
    var enPantalla = true;
    var pendiente = false;
    var mover = function () {
      pendiente = false;
      var recorrido = document.documentElement.scrollHeight - window.innerHeight;
      var p = recorrido > 0 ? Math.min(1, Math.max(0, window.scrollY / recorrido)) : 0;
      capas.forEach(function (c) {
        var sobrante = c.offsetHeight - window.innerHeight;
        var y = -p * sobrante * parseFloat(c.dataset.nebulosaCapa);
        c.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      });
    };
    var pedir = function () {
      if (enPantalla && !pendiente) {
        pendiente = true;
        requestAnimationFrame(mover);
      }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        enPantalla = e[0].isIntersecting;
        pedir();
      }).observe(document.querySelector('main'));
    }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    nebulosa.classList.add('nebulosa--viva');
    mover();
  }

  /* 2b. Cruzar la ventana (V3) -------------------------------------------
     Escena fijada al scroll (position: sticky en CSS). El avance del
     recorrido (0 a 1) se escribe en --p y el CSS mueve cada capa a su
     velocidad y escala (solo transform y opacity). En requestAnimationFrame
     y solo mientras la sección está en pantalla. Con "reducir movimiento" (o
     sin JavaScript) no se activa: quedan los tres fotogramas en lista. */
  var cruce = document.querySelector('[data-cruce]');
  if (cruce && !movimientoReducido) {
    var recorridoCruce = cruce.querySelector('[data-cruce-recorrido]');
    var fija = cruce.querySelector('[data-cruce-fija]');
    var pasosCruce = Array.prototype.slice.call(cruce.querySelectorAll('[data-cruce-paso]'));
    var contadorCruce = cruce.querySelector('[data-cruce-contador]');
    var cruceVisible = true;
    var crucePendiente = false;
    var pasoActual = -1;
    cruce.classList.add('cruce--viva');
    var medidas = function () {
      var tope = parseFloat(getComputedStyle(fija).top) || 0;
      var r = recorridoCruce.getBoundingClientRect();
      return { tope: tope, arriba: r.top, total: r.height - fija.offsetHeight };
    };
    var pintarCruce = function () {
      crucePendiente = false;
      var m = medidas();
      var p = m.total > 0 ? Math.min(1, Math.max(0, (m.tope - m.arriba) / m.total)) : 0;
      fija.style.setProperty('--p', p.toFixed(4));
      var n = p < 0.3 ? 0 : p < 0.74 ? 1 : 2;
      if (n !== pasoActual) {
        pasoActual = n;
        pasosCruce.forEach(function (b, i) {
          if (i === n) b.setAttribute('aria-current', 'step');
          else b.removeAttribute('aria-current');
        });
        if (contadorCruce) contadorCruce.textContent = '0' + (n + 1) + ' / 0' + pasosCruce.length;
      }
    };
    var pedirCruce = function () {
      if (cruceVisible && !crucePendiente) {
        crucePendiente = true;
        requestAnimationFrame(pintarCruce);
      }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        cruceVisible = e[0].isIntersecting;
        pedirCruce();
      }).observe(cruce);
    }
    window.addEventListener('scroll', pedirCruce, { passive: true });
    window.addEventListener('resize', pedirCruce);
    // Las cartelas llevan a su punto del recorrido
    pasosCruce.forEach(function (b) {
      b.addEventListener('click', function () {
        var m = medidas();
        var destino = window.scrollY + m.arriba - m.tope + m.total * parseFloat(b.dataset.crucePaso);
        window.scrollTo({ top: destino, behavior: 'smooth' });
      });
    });
    pintarCruce();
  }

  /* 3. Carrusel ----------------------------------------------------------
     Miniatura -> cambia el fotograma grande (fundido de 450 ms en CSS).
     Flechas con el foco dentro, deslizar con el dedo. Precarga solo el
     siguiente: a los demás se les quita el `src` hasta que hacen falta. */
  document.querySelectorAll('[data-carrusel]').forEach(function (c) {
    var planos = Array.prototype.slice.call(c.querySelectorAll('[data-carrusel-plano]'));
    var minis = Array.prototype.slice.call(c.querySelectorAll('[data-carrusel-miniatura]'));
    var aviso = c.querySelector('[data-carrusel-aviso]');
    var escena = c.querySelector('[data-carrusel-escena]');
    var contador = c.querySelector('[data-carrusel-contador]');
    var anterior = c.querySelector('[data-carrusel-anterior]');
    var siguiente = c.querySelector('[data-carrusel-siguiente]');
    var actual = 0;
    if (planos.length < 2) return;
    c.classList.add('carrusel--activo');
    var dos = function (n) { return (n < 10 ? '0' : '') + n; };

    function cargar(i) {
      var img = planos[i] && planos[i].querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    }
    planos.forEach(function (p, i) {
      var img = p.querySelector('img');
      if (img && i > 1) {
        img.dataset.src = img.getAttribute('src');
        img.removeAttribute('src');
      }
      p.inert = i !== 0;
    });

    function ir(i, enfocar) {
      i = (i + planos.length) % planos.length;
      if (i === actual) return;
      planos[actual].classList.remove('carrusel__plano--actual');
      planos[actual].inert = true;
      minis[actual].removeAttribute('aria-current');
      actual = i;
      cargar(i);
      cargar((i + 1) % planos.length);
      planos[i].classList.add('carrusel__plano--actual');
      planos[i].inert = false;
      minis[i].setAttribute('aria-current', 'true');
      if (minis[i].scrollIntoView) minis[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: movimientoReducido ? 'auto' : 'smooth' });
      if (enfocar) minis[i].focus({ preventScroll: true });
      if (aviso) aviso.textContent = minis[i].getAttribute('aria-label');
      if (contador) contador.textContent = dos(i + 1) + ' / ' + dos(planos.length);
    }
    if (anterior) anterior.addEventListener('click', function () { ir(actual - 1, false); });
    if (siguiente) siguiente.addEventListener('click', function () { ir(actual + 1, false); });

    minis.forEach(function (m, i) {
      m.addEventListener('click', function () { ir(i, false); });
    });

    // Flechas: solo con el foco dentro del carrusel (no chocan con 1-4 ni con
    // el visor, que es un <dialog> aparte)
    c.addEventListener('keydown', function (e) {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      var enTira = !!e.target.closest('[data-carrusel-miniatura]');
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1, enTira); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1, enTira); }
      else if (e.key === 'Home') { e.preventDefault(); ir(0, enTira); }
      else if (e.key === 'End') { e.preventDefault(); ir(planos.length - 1, enTira); }
    });

    // Deslizar con el dedo sobre el fotograma grande
    var inicio = null;
    escena.addEventListener('touchstart', function (e) {
      inicio = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    escena.addEventListener('touchend', function (e) {
      if (!inicio) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - inicio.x;
      var dy = t.clientY - inicio.y;
      inicio = null;
      if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.5) ir(actual + (dx < 0 ? 1 : -1), false);
    }, { passive: true });
  });
})();
