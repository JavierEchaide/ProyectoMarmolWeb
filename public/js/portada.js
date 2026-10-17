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

  /* Ojos del Creador (fotograma II): "nunca bajó a mirar". Apartan la
     mirada del cursor; si nadie se mueve en 3 s, por fin miran (al cursor o,
     sin ratón, al frente) y se les dilata la pupila. Al volver a moverse,
     parpadean y esquivan. Parpadean solos de vez en cuando. */
  var ojosEl = document.querySelector('[data-ojos]');
  if (ojosEl) {
    var svgOjos = ojosEl.querySelector('svg');
    var ojos = Array.prototype.slice.call(ojosEl.querySelectorAll('[data-ojo]')).map(function (g) {
      return {
        globo: g.querySelector('.ojo__globo'),
        iris: g.querySelector('[data-iris]'),
        pupila: g.querySelector('[data-pupila]'),
        cx: parseFloat(g.dataset.cx),
        cy: parseFloat(g.dataset.cy),
        x: -8,
        y: 5,
      };
    });
    var mirada = { x: null, y: null };
    var quieto = performance.now();
    var mirando = false;
    var ojosVisibles = false;
    var ojosPendiente = false;
    var proximoParpadeo = performance.now() + 2500;

    var parpadear = function () {
      if (movimientoReducido) return;
      ojos.forEach(function (o) {
        o.globo.animate(
          [{ transform: 'scaleY(1)' }, { transform: 'scaleY(0.06)' }, { transform: 'scaleY(1)' }],
          { duration: 170, easing: 'ease-in-out' }
        );
      });
    };

    var pintarOjos = function (ahora) {
      ojosPendiente = false;
      if (!mirando && !movimientoReducido && ahora - quieto > 3000) {
        mirando = true;
        parpadear();
      }
      ojos.forEach(function (o) {
        var dx = mirada.x === null ? 0 : mirada.x - o.cx;
        var dy = mirada.y === null ? 0 : mirada.y - o.cy;
        var d = Math.hypot(dx, dy) || 1;
        var ux = dx / d;
        var uy = dy / d;
        var tx;
        var ty;
        if (mirando) {
          // miran: hacia el cursor, o al frente si no hay cursor
          tx = mirada.x === null ? 0 : ux * Math.min(d * 0.12, 13);
          ty = mirada.y === null ? 0 : uy * Math.min(d * 0.12, 7);
        } else if (mirada.x === null) {
          tx = -11; // sin cursor todavía: miran abajo a un lado
          ty = 6;
        } else {
          tx = -ux * 13; // esquivan: al lado contrario del cursor
          ty = -uy * 7;
        }
        o.x += (tx - o.x) * (movimientoReducido ? 1 : 0.22);
        o.y += (ty - o.y) * (movimientoReducido ? 1 : 0.22);
        o.iris.setAttribute('transform', 'translate(' + o.x.toFixed(2) + ' ' + o.y.toFixed(2) + ')');
        o.pupila.setAttribute('r', mirando ? 8.6 : 6.4);
      });
      if (!movimientoReducido && ahora > proximoParpadeo) {
        proximoParpadeo = ahora + 3000 + Math.random() * 4000;
        parpadear();
      }
      if (ojosVisibles && !movimientoReducido) pedirOjos();
    };
    var pedirOjos = function () {
      if (!ojosPendiente) {
        ojosPendiente = true;
        requestAnimationFrame(pintarOjos);
      }
    };
    var mover = function (e) {
      var r = svgOjos.getBoundingClientRect();
      if (!r.width) return;
      mirada.x = ((e.clientX - r.left) / r.width) * 320;
      mirada.y = ((e.clientY - r.top) / r.height) * 180;
      quieto = performance.now();
      if (mirando) {
        mirando = false;
        parpadear();
      }
      pedirOjos();
    };
    window.addEventListener('pointermove', mover, { passive: true });
    window.addEventListener('pointerdown', mover, { passive: true });
    window.addEventListener('scroll', function () { quieto = performance.now(); if (mirando) { mirando = false; parpadear(); } }, { passive: true });
    new IntersectionObserver(function (entradas) {
      ojosVisibles = entradas[0].isIntersecting;
      if (ojosVisibles) {
        quieto = performance.now();
        pedirOjos();
      }
    }).observe(ojosEl);
    pintarOjos(performance.now());
  }

  /* Cartas de "Las páginas": con ratón se desplazan por capas (las más
     cercanas, más) y giran un poco hacia el cursor. Usa las propiedades
     `translate` y `rotate`, que se suman a la posición base de cada carta. */
  var cartas = document.querySelector('[data-cartas]');
  if (cartas && !movimientoReducido && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var sala = cartas.closest('.sala-cartas');
    var lista = Array.prototype.slice.call(cartas.querySelectorAll('[data-carta]'));
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
