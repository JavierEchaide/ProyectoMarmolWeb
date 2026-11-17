/* Historia: losas de SPOILER.

   Tapada, la losa se inclina siguiendo el ratón y, al pasar por encima, le
   sale una fisura en el punto de impacto. Al pulsarla:
     1. se agrieta en oro desde el punto de impacto (0,4 s),
     2. se abre: las esquirlas se separan y la luz dorada asoma por las juntas,
     3. las esquirlas caen y giran en 3D mientras el bloque crece hasta la
        altura real del contenido.
   La losa tapa imagen y texto juntos (V3); el numeral del capítulo queda a la
   vista. "Mostrar todos" destapa todas. No hay forma de volver a taparlas: al
   recargar la página vuelven a estar tapadas (no se guarda nada).
   Necesita js/grietas.js. */
(function () {
  'use strict';

  var G = window.marmolGrietas;
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
    G.dibujar(s.querySelector('.spoiler__grietas'), geo);
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

  /* Rotura (motor común en js/grietas.js) -------------------------------- */

  function romper(s, tapa, geo) {
    G.esquirlas(tapa, tapa.querySelector('.spoiler__cara'), geo, { semilla: parseInt(s.dataset.semilla, 10) || 1 });
    // La luz sale del punto de impacto
    tapa.style.setProperty('--cx', ((geo.centro[0] / geo.w) * 100).toFixed(1) + '%');
    tapa.style.setProperty('--cy', ((geo.centro[1] / geo.h) * 100).toFixed(1) + '%');
    tapa.classList.add('tapa--rota');
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
      var capa = tapa.querySelector('.rotura__esquirlas');
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
    // En el sumario, el rombo negro del capítulo pasa a ser su numeral
    var capitulo = s.closest('[data-capitulo]');
    var enlace = capitulo && document.querySelector('[data-sumario] a[href="#' + capitulo.id + '"]');
    if (enlace) {
      enlace.removeAttribute('data-tapado');
      var aviso = enlace.querySelector('[data-tapado-texto]');
      if (aviso) aviso.remove();
    }
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

  function quedanTapados() {
    return spoilers.some(function (s) { return s.dataset.spoiler === 'tapado' && !s.classList.contains('rompiendo'); });
  }

  function actualizarBoton() {
    if (!botonTodos) return;
    // Con todo destapado el botón ya no hace nada: se desactiva
    botonTodos.disabled = !quedanTapados();
    botonTodos.textContent = botonTodos.disabled ? 'Todo destapado' : 'Mostrar todos';
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
      spoilers.forEach(function (s, i) {
        if (s.dataset.spoiler !== 'tapado') return;
        setTimeout(function () { destapar(s, false); }, movimientoReducido ? 0 : i * 160);
      });
      botonTodos.disabled = true;
      botonTodos.textContent = 'Todo destapado';
    });
  }
})();

/* Cabecera: ventanas del taller. Al pulsar el mármol (clic, toque o Enter /
   Espacio sobre el botón) se abre un rasgón vertical por el que se ve otro
   mundo, con el borde de luz dorada. Abierta, con ratón sigue al puntero; en
   táctil se queda donde se tocó. Al pulsar otra vez, se cierra. No depende
   del hover. La forma respira un poco; con "reducir movimiento" se queda
   quieta. */
(function () {
  'use strict';

  var cabecera = document.querySelector('[data-ventana]');
  if (!cabecera) return;
  var mundo = cabecera.querySelector('[data-ventana-mundo]');
  var borde = cabecera.querySelector('[data-ventana-borde]');
  var botonVentana = cabecera.querySelector('[data-ventana-boton]');
  var trazo = borde.querySelector('path');
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  cabecera.classList.add('ventana--activa');

  // Perfil del rasgón: puntos del borde izquierdo de arriba abajo (el derecho
  // es parecido pero no igual), con dientes que cambian despacio
  var N = 22;
  var fases = [];
  for (var i = 0; i < (N + 1) * 2; i++) fases.push(Math.random() * Math.PI * 2);

  var pos = { x: 0, y: 0 };
  var objetivo = { x: 0, y: 0 };
  var apertura = 0;
  var abrir = 0;
  var visible = true;
  var pendiente = false;

  function forma(t) {
    var w = cabecera.clientWidth;
    var h = cabecera.clientHeight;
    var alto = Math.min(h * 0.82, 420) * apertura;
    var ancho = Math.min(w * 0.16, 130) * apertura;
    var izq = [];
    var der = [];
    for (var k = 0; k <= N; k++) {
      var v = k / N;
      // ancho del rasgón: cero en las puntas, máximo un poco por encima del centro
      var perfil = Math.pow(Math.sin(Math.PI * v), 0.75) * (1 - 0.25 * Math.abs(v - 0.45));
      var y = pos.y + (v - 0.5) * alto;
      var dI = Math.sin(t * 1.3 + fases[k]) * 0.12 + Math.sin(k * 2.1 + fases[k]) * 0.18;
      var dD = Math.sin(t * 1.1 + fases[N + k]) * 0.12 + Math.cos(k * 1.7 + fases[N + k]) * 0.18;
      izq.push([pos.x - ancho * perfil * (0.5 + dI), y]);
      der.push([pos.x + ancho * perfil * (0.5 + dD), y]);
    }
    return izq.concat(der.reverse());
  }

  function pintar(ahora) {
    pendiente = false;
    var t = ahora / 1000;
    pos.x += (objetivo.x - pos.x) * (movimientoReducido ? 1 : 0.14);
    pos.y += (objetivo.y - pos.y) * (movimientoReducido ? 1 : 0.14);
    apertura += (abrir - apertura) * (movimientoReducido ? 1 : 0.1);

    var puntos = forma(movimientoReducido ? 0 : t);
    mundo.style.clipPath = 'polygon(' + puntos.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';
    trazo.setAttribute('d', 'M' + puntos.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' Z');
    // El mundo de detrás se mueve un poco al revés que la ventana (profundidad)
    mundo.style.setProperty('--px', ((pos.x / cabecera.clientWidth - 0.5) * -24).toFixed(1) + 'px');
    mundo.style.setProperty('--py', ((pos.y / cabecera.clientHeight - 0.5) * -16).toFixed(1) + 'px');

    if (visible && !movimientoReducido && (apertura > 0.002 || abrir > 0)) pedir();
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }

  function colocar(e) {
    var r = cabecera.getBoundingClientRect();
    objetivo.x = e.clientX - r.left;
    objetivo.y = e.clientY - r.top;
  }

  if (botonVentana) {
    botonVentana.addEventListener('click', function (e) {
      var abierta = abrir === 1;
      if (!abierta) {
        // Con teclado no hay coordenadas: se abre en la mitad derecha
        if (e.detail === 0 || (!e.clientX && !e.clientY)) {
          objetivo.x = cabecera.clientWidth * 0.7;
          objetivo.y = cabecera.clientHeight * 0.5;
        } else colocar(e);
        pos.x = objetivo.x;
        pos.y = objetivo.y;
      }
      abrir = abierta ? 0 : 1;
      botonVentana.setAttribute('aria-pressed', abierta ? 'false' : 'true');
      botonVentana.setAttribute('aria-label', abierta ? 'Abrir en el mármol una ventana a otro mundo' : 'Cerrar la ventana a otro mundo');
      pedir();
    });
    if (conRaton && !movimientoReducido) {
      cabecera.addEventListener('pointermove', function (e) {
        if (abrir !== 1) return;
        colocar(e);
        pedir();
      });
    }
  }

  new IntersectionObserver(function (entradas) {
    visible = entradas[0].isIntersecting;
    if (visible) pedir();
  }).observe(cabecera);
  window.addEventListener('resize', pedir);
  pedir();
})();

/* El lomo de las seis partes: la veta baja por el margen izquierdo, como el
   lomo de un libro, y cuenta la historia sin texto. Entre I y II es una veta
   gris fina (el mármol intacto); entre III y IV, roja y con ramas (la
   corrupción); entre V y VI, de oro (la sanación, kintsugi). Pasa por el nodo
   de cada capítulo. Se dibuja según se baja y vuelve atrás si se sube. Se
   rehace si cambia el alto (spoilers, "Leer más"). */
(function () {
  'use strict';

  var G = window.marmolGrietas;
  var libro = document.querySelector('[data-lomo]');
  if (!G || !libro) return;
  var svg = libro.querySelector('[data-lomo-veta]');
  var nodos = Array.prototype.slice.call(libro.querySelectorAll('[data-lomo-nodo]'));
  if (!svg || nodos.length < 6) return;
  var NS = 'http://www.w3.org/2000/svg';
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tramos = [];
  var medida = '';
  var pendiente = false;

  function camino(azar, x, y0, y1, amplitud) {
    var puntos = [[x, y0]];
    var y = y0;
    while (y < y1) {
      y = Math.min(y1, y + 14 + azar() * 22);
      puntos.push([x + (azar() - 0.5) * amplitud, y]);
    }
    return puntos;
  }

  function rama(azar, origen, sentido, largo) {
    var puntos = [origen.slice()];
    var p = origen.slice();
    var a = sentido * (0.6 + azar() * 0.5) + Math.PI / 2;
    for (var k = 0; k < 4 + Math.floor(azar() * 4); k++) {
      a += (azar() - 0.5) * 0.7;
      p = [p[0] + Math.cos(a) * largo / 6, p[1] + Math.sin(a) * largo / 6];
      puntos.push(p);
    }
    return puntos;
  }

  function trazo(clase, d, esRama) {
    var el = document.createElementNS(NS, 'path');
    el.setAttribute('d', d);
    el.setAttribute('pathLength', '1');
    el.setAttribute('class', clase + (esRama ? ' hist-lomo__rama' : ''));
    svg.appendChild(el);
    return el;
  }

  // Centro de cada nodo dentro del libro (sin contar transformaciones)
  function centro(n) {
    var x = n.offsetWidth / 2;
    var y = n.offsetHeight / 2;
    var el = n;
    while (el && el !== libro) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    return [x, y];
  }

  function construir() {
    var w = libro.clientWidth;
    var h = libro.clientHeight;
    var centros = nodos.map(centro);
    var clave = w + 'x' + h + ':' + centros.map(function (c) { return Math.round(c[1]); }).join(',');
    if (clave === medida || !w || !h) return;
    medida = clave;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '';
    tramos = [];
    var x = centros[0][0];
    var estrecho = x < 60; // móvil: el lomo va pegado al borde, ramas cortas
    var cortes = [0, centros[2][1], centros[4][1], h];
    var azar = G.aleatorio(17);
    var clases = ['hist-lomo__pura', 'hist-lomo__rota', 'hist-lomo__oro'];
    for (var t = 0; t < 3; t++) {
      var puntos = camino(azar, x, cortes[t], cortes[t + 1], t === 0 ? 3 : estrecho ? 5 : 9);
      var piezas = [trazo(clases[t], G.trazado(puntos), false)];
      if (t > 0) {
        // la corrupción echa ramas; el oro las rellena
        for (var r = 0; r < 4; r++) {
          var origen = puntos[1 + Math.floor(azar() * (puntos.length - 2))];
          var largo = estrecho ? 14 + azar() * 10 : 36 + azar() * 40;
          piezas.push(trazo(clases[t], G.trazado(rama(azar, origen, azar() < 0.5 ? -1 : 1, largo)), true));
        }
      }
      tramos.push({ desde: cortes[t], hasta: cortes[t + 1], piezas: piezas });
    }
    pintar();
  }

  function pintar() {
    pendiente = false;
    var r = libro.getBoundingClientRect();
    var linea = window.innerHeight * 0.7 - r.top; // por dónde va la lectura dentro del libro
    tramos.forEach(function (t) {
      var p = movimientoReducido ? 1 : Math.max(0, Math.min(1, (linea - t.desde) / (t.hasta - t.desde)));
      t.piezas.forEach(function (el, k) {
        // las ramas salen cuando la veta principal ya ha pasado la mitad
        var local = k === 0 ? p : Math.max(0, Math.min(1, (p - 0.3) / 0.5));
        el.style.strokeDashoffset = (1 - local).toFixed(3);
      });
    });
  }

  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }

  construir();
  window.addEventListener('scroll', pedir, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(construir).observe(libro);
  window.addEventListener('resize', construir);
})();

/* Sumario: marca en rojo el capítulo por el que va la lectura (scrollspy). */
(function () {
  'use strict';

  var sumario = document.querySelector('[data-sumario]');
  if (!sumario) return;
  var enlaces = Array.prototype.slice.call(sumario.querySelectorAll('a[href^="#"]'));
  var secciones = enlaces.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  var pendiente = false;

  function marcar() {
    pendiente = false;
    var linea = window.innerHeight * 0.45;
    var actual = 0;
    secciones.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= linea) actual = i;
    });
    enlaces.forEach(function (a, i) {
      if (i === actual) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(marcar);
    }
  }

  marcar();
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
})();

/* "Leer más" de las seis partes: despliega el texto completo dentro de la
   misma página, con la altura animada y aria-expanded (como los bloques de
   Proceso). La veta se rehace sola: observa los cambios de alto. Sin
   JavaScript el texto completo se ve siempre. */
(function () {
  'use strict';

  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-leer-mas]').forEach(function (boton) {
    var cuerpo = document.getElementById(boton.getAttribute('aria-controls'));
    var texto = boton.querySelector('[data-leer-mas-texto]');
    if (!cuerpo) return;
    cuerpo.hidden = true;
    var animacion = null;

    boton.addEventListener('click', function () {
      var abrir = boton.getAttribute('aria-expanded') !== 'true';
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
      texto.textContent = abrir ? 'Leer menos' : 'Leer más';
      if (animacion) animacion.cancel();
      if (movimientoReducido || !cuerpo.animate) {
        cuerpo.hidden = !abrir;
        return;
      }
      cuerpo.hidden = false;
      var alto = cuerpo.scrollHeight;
      cuerpo.style.overflow = 'hidden';
      animacion = cuerpo.animate(
        abrir
          ? [{ height: '0px', opacity: 0 }, { height: alto + 'px', opacity: 1 }]
          : [{ height: alto + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
        { duration: abrir ? 480 : 320, easing: abrir ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.65, 0, 0.35, 1)' }
      );
      animacion.onfinish = function () {
        animacion = null;
        cuerpo.style.overflow = '';
        if (!abrir) cuerpo.hidden = true;
      };
    });
  });
})();
