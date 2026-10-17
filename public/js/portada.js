/* Portada: saltar la intro y parallax del hero. */
(function () {
  'use strict';

  var html = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Intro: se puede saltar con un clic o una tecla. Se retira al terminar. */
  var intro = document.querySelector('[data-intro]');
  if (intro && html.classList.contains('intro-activa')) {
    var retirar = function () {
      html.classList.remove('intro-activa');
      intro.remove();
    };
    var saltar = function () {
      intro.classList.add('saltar');
      setTimeout(retirar, 360);
      document.removeEventListener('keydown', saltar);
    };
    intro.addEventListener('click', saltar);
    document.addEventListener('keydown', saltar);
    // Duración total de la intro (ver .intro en site.css): 2,9 s
    setTimeout(retirar, movimientoReducido ? 1900 : 3000);
  }

  /* Vídeo en bucle del hero: con "reducir movimiento" se queda en el primer fotograma */
  var video = document.querySelector('[data-hero-video]');
  if (video && movimientoReducido) {
    video.removeAttribute('autoplay');
    video.pause();
  }

  /* Cartas de "Las páginas": con ratón se desplazan por capas (las más
     cercanas, más) y giran un poco hacia el cursor. Usa las propiedades
     `translate` y `rotate`, que se suman a la posición base de cada carta. */
  var cartas = document.querySelector('[data-cartas]');
  if (cartas && !movimientoReducido && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var sala = cartas.closest('.sala-cartas');
    // Se mueve la capa de dentro, no el enlace: así la zona que recibe el
    // ratón no se desplaza y la carta no se le escapa al cursor
    var lista = Array.prototype.slice.call(cartas.querySelectorAll('[data-carta-capa]'));
    var profundidad = [0.6, 1, 0.8];
    var cursor = { x: 0, y: 0 };
    var cartasPendiente = false;
    var moverCartas = function () {
      cartasPendiente = false;
      lista.forEach(function (c, i) {
        var k = profundidad[i] || 0.8;
        c.style.translate = (cursor.x * -28 * k).toFixed(1) + 'px ' + (cursor.y * -18 * k).toFixed(1) + 'px';
        var angulo = Math.hypot(cursor.x, cursor.y) * 9 * k;
        c.style.rotate = angulo ? (-cursor.y).toFixed(3) + ' ' + cursor.x.toFixed(3) + ' 0 ' + angulo.toFixed(2) + 'deg' : '';
      });
    };
    sala.addEventListener('pointermove', function (e) {
      var r = sala.getBoundingClientRect();
      cursor.x = (e.clientX - r.left) / r.width - 0.5;
      cursor.y = (e.clientY - r.top) / r.height - 0.5;
      if (!cartasPendiente) {
        cartasPendiente = true;
        requestAnimationFrame(moverCartas);
      }
    });
    sala.addEventListener('pointerleave', function () {
      cursor.x = 0;
      cursor.y = 0;
      moverCartas();
    });
  }

  /* Busto 3D de "Hecho por": three.js pesa, así que js/busto.js solo se
     descarga cuando la sección está a punto de entrar en pantalla. */
  var busto = document.querySelector('[data-busto]');
  if (busto && 'IntersectionObserver' in window) {
    var cargaBusto = new IntersectionObserver(function (entradas) {
      if (!entradas[0].isIntersecting) return;
      cargaBusto.disconnect();
      var s = document.createElement('script');
      s.src = 'js/busto.js';
      document.body.appendChild(s);
    }, { rootMargin: '900px 0px' });
    cargaBusto.observe(busto);
  }

  /* Parallax del hero: la imagen se desplaza más despacio que el scroll
     y se mueve un poco con el ratón. Si algún día hay render por capas,
     cada capa con data-profundidad se mueve en proporción. */
  var hero = document.querySelector('[data-hero]');
  var imagen = document.querySelector('[data-hero-imagen]');
  if (!hero || !imagen || movimientoReducido) return;

  var capas = Array.prototype.slice.call(imagen.querySelectorAll('[data-profundidad]'));
  var raton = { x: 0, y: 0 };
  var actual = { x: 0, y: 0 };
  var pendiente = false;

  function pintar() {
    pendiente = false;
    actual.x += (raton.x - actual.x) * 0.08;
    actual.y += (raton.y - actual.y) * 0.08;
    var desplazado = Math.min(window.scrollY, hero.offsetHeight);
    imagen.style.transform = 'translate3d(0,' + (desplazado * 0.3).toFixed(2) + 'px,0)';
    if (capas.length) {
      // Cada capa se mueve con el ratón en proporción a su profundidad
      capas.forEach(function (c) {
        var p = parseFloat(c.dataset.profundidad) || 0;
        c.style.transform =
          'translate3d(' + (actual.x * -30 * p).toFixed(2) + 'px,' + (actual.y * -20 * p - desplazado * 0.15 * p).toFixed(2) + 'px,0)';
      });
    } else {
      imagen.firstElementChild.style.transform =
        'translate3d(' + (actual.x * -14).toFixed(2) + 'px,' + (actual.y * -10).toFixed(2) + 'px,0)';
    }
    if (Math.abs(raton.x - actual.x) > 0.001 || Math.abs(raton.y - actual.y) > 0.001) pedir();
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }

  window.addEventListener('scroll', pedir, { passive: true });
  if (window.matchMedia('(pointer: fine)').matches) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      raton.x = (e.clientX - r.left) / r.width - 0.5;
      raton.y = (e.clientY - r.top) / r.height - 0.5;
      pedir();
    });
    hero.addEventListener('pointerleave', function () {
      raton.x = 0;
      raton.y = 0;
      pedir();
    });
  }
})();
