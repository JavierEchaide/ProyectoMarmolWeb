/* Tallado: el taller del escultor (referencia: el dibujo técnico que se
   dibuja solo de heronaiapp.com).

   1. Títulos de sección: primero aparece el boceto (el contorno en línea
      fina) y luego un borde irregular de cincel lo va descubriendo de
      izquierda a derecha, con una chispa y polvo de mármol que cae.
   2. Ornamentos que se dibujan trazo a trazo al entrar en pantalla: el doble
      filete dorado de las tarjetas, sus escuadras y las grecas.

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

  /* 1. Títulos ----------------------------------------------------------- */

  var titulos = Array.prototype.slice.call(document.querySelectorAll('.titulo-seccion__titulo'));
  // El texto real va a una capa (la que se recorta con el cincel) y encima
  // queda el boceto, una copia en contorno que no leen los lectores de pantalla
  // La pieza mide lo que mide el texto (no el ancho de la columna), para
  // que el cincel recorra solo las letras
  titulos.forEach(function (t, i) {
    var pieza = document.createElement('span');
    pieza.className = 'tallado__pieza';
    var solido = document.createElement('span');
    solido.className = 'tallado__solido';
    while (t.firstChild) solido.appendChild(t.firstChild);
    var boceto = document.createElement('span');
    boceto.className = 'tallado__boceto';
    boceto.setAttribute('aria-hidden', 'true');
    boceto.textContent = solido.textContent;
    pieza.appendChild(solido);
    pieza.appendChild(boceto);
    t.appendChild(pieza);
    t.classList.add('tallable');
    t.dataset.semilla = String(i + 3);
  });

  // Polvo de mármol: motas que saltan del borde del cincel y caen
  function polvo(t, x, alto, azar) {
    var n = 1 + Math.floor(azar() * 2);
    for (var k = 0; k < n; k++) {
      var m = document.createElement('span');
      m.className = 'tallado__polvo';
      var tam = 1.2 + azar() * 2;
      m.style.width = m.style.height = tam.toFixed(1) + 'px';
      m.style.left = (x + (azar() - 0.3) * 6).toFixed(1) + 'px';
      m.style.top = (azar() * alto).toFixed(1) + 'px';
      t.appendChild(m);
      var dx = (azar() * 18 + 4).toFixed(1);
      var dy = (alto * 0.3 + azar() * 30).toFixed(1);
      m.animate(
        [
          { transform: 'translate3d(0,0,0)', opacity: 0.9 },
          { transform: 'translate3d(' + dx * 0.5 + 'px,' + -(4 + azar() * 10).toFixed(1) + 'px,0)', opacity: 0.9, offset: 0.25 },
          { transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)', opacity: 0 },
        ],
        { duration: 700 + azar() * 500, easing: 'cubic-bezier(0.33, 0, 0.67, 0)' }
      ).onfinish = (function (el) { return function () { el.remove(); }; })(m);
    }
  }

  function tallar(t) {
    var azar = aleatorio(parseInt(t.dataset.semilla, 10) || 1);
    var pieza = t.querySelector('.tallado__pieza');
    var solido = t.querySelector('.tallado__solido');
    var ancho = solido.offsetWidth;
    var alto = solido.offsetHeight;
    // El borde del cincel: un diente por banda horizontal
    var bandas = Math.max(6, Math.round(alto / 9));
    var dientes = [];
    for (var b = 0; b <= bandas; b++) dientes.push((azar() - 0.5) * 22);
    var chispa = document.createElement('span');
    chispa.className = 'tallado__chispa';
    pieza.appendChild(chispa);

    var duracion = Math.min(1500, 700 + ancho * 0.9);
    var inicio = null;
    var ultimoPolvo = 0;
    t.classList.add('tallando');

    function paso(ahora) {
      if (inicio === null) inicio = ahora;
      var p = Math.min(1, (ahora - inicio) / duracion);
      // salida suave: el cincel arranca con fuerza y termina con cuidado
      var e = 1 - Math.pow(1 - p, 3);
      var frente = e * (ancho + 30) - 15;
      var puntos = ['0 0'];
      for (var k = 0; k <= bandas; k++) {
        var y = (k / bandas) * 100;
        var x = frente + dientes[k] + (azar() - 0.5) * 3;
        puntos.push(x.toFixed(1) + 'px ' + y.toFixed(1) + '%');
      }
      puntos.push('0 100%');
      solido.style.clipPath = 'polygon(' + puntos.join(',') + ')';
      var yChispa = alto * (0.5 + Math.sin(ahora / 55) * 0.42);
      chispa.style.transform = 'translate3d(' + frente.toFixed(1) + 'px,' + yChispa.toFixed(1) + 'px,0)';
      if (ahora - ultimoPolvo > 70 && p < 0.97) {
        ultimoPolvo = ahora;
        polvo(pieza, frente, alto, azar);
      }
      if (p < 1) {
        requestAnimationFrame(paso);
      } else {
        solido.style.clipPath = '';
        t.classList.remove('tallando');
        t.classList.add('tallado');
        chispa.remove();
      }
    }
    requestAnimationFrame(paso);
  }

  // El título empieza a tallarse cuando su cabecera ya ha aparecido
  alEntrar(titulos, 0.6, function (t) { setTimeout(function () { tallar(t); }, 280); });

  /* 2. Ornamentos -------------------------------------------------------- */

  var NS = 'http://www.w3.org/2000/svg';

  // Doble filete de las tarjetas: dos rectángulos SVG que se trazan y luego
  // dejan su sitio al filete de CSS de siempre
  var paneles = Array.prototype.slice.call(document.querySelectorAll('.tarjeta__panel'));
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

  /* 3. Cincel: al hacer clic con el ratón salta un poco de polvo de mármol.
     Pocas motas y como mucho una vez cada 150 ms, para no cansar. */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var ultimoGolpe = 0;
    document.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      var ahora = performance.now();
      if (ahora - ultimoGolpe < 150) return;
      ultimoGolpe = ahora;
      var azar = aleatorio(Math.floor(ahora));
      for (var k = 0; k < 5; k++) {
        var m = document.createElement('span');
        m.className = 'polvo-cincel';
        m.style.left = e.clientX + 'px';
        m.style.top = e.clientY + 'px';
        var tam = (1.6 + azar() * 2).toFixed(1);
        m.style.width = m.style.height = tam + 'px';
        document.body.appendChild(m);
        var angulo = -Math.PI * (0.15 + azar() * 0.7); // hacia arriba, en abanico
        var fuerza = 10 + azar() * 22;
        var vx = Math.cos(angulo) * fuerza;
        var vy = Math.sin(angulo) * fuerza;
        m.animate(
          [
            { transform: 'translate3d(0,0,0)', opacity: 1 },
            { transform: 'translate3d(' + vx.toFixed(1) + 'px,' + vy.toFixed(1) + 'px,0)', opacity: 1, offset: 0.35 },
            { transform: 'translate3d(' + (vx * 1.5).toFixed(1) + 'px,' + (vy + 34).toFixed(1) + 'px,0)', opacity: 0 },
          ],
          { duration: 520 + azar() * 220, easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)' }
        ).onfinish = (function (el) { return function () { el.remove(); }; })(m);
      }
    });
  }

  // Grecas: se dibujan de izquierda a derecha
  var grecas = Array.prototype.slice.call(document.querySelectorAll('.greca'));
  grecas.forEach(function (g) { g.classList.add('greca--pendiente'); });
  alEntrar(grecas, 0.5, function (g) {
    g.classList.remove('greca--pendiente');
    g.classList.add('greca--trazando');
  });
})();
