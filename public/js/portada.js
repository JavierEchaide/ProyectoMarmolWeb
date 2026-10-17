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
