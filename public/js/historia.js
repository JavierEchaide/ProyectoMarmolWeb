/* Historia: losas de SPOILER.

   Tapada, la losa se inclina siguiendo el ratón y, al pasar por encima, le
   sale una fisura en el punto de impacto. Al pulsarla:
     1. se agrieta en oro desde el punto de impacto (0,4 s),
     2. se abre: las esquirlas se separan y la luz dorada asoma por las juntas,
     3. las esquirlas caen y giran en 3D mientras el bloque crece hasta la
        altura real del contenido.
   "Mostrar todos" destapa todas; "Volver a taparlos" las repone. No se guarda
   nada: al recargar vuelven a estar tapadas. Necesita js/grietas.js. */
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

  function tapar(s) {
    var contenido = s.querySelector('.spoiler__contenido');
    var tapa = s.querySelector('.spoiler__tapa');
    var antes = contenido.offsetHeight;
    s.classList.remove('rompiendo', 'agrietando', 'destapado');
    s.dataset.spoiler = 'tapado';
    contenido.inert = true;
    contenido.removeAttribute('tabindex');
    if (movimientoReducido || !contenido.animate) return;
    var despues = contenido.offsetHeight;
    contenido.style.overflow = 'hidden';
    contenido
      .animate([{ height: antes + 'px' }, { height: despues + 'px' }], { duration: 600, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' })
      .finished.then(function () { contenido.style.overflow = ''; });
    tapa.animate([{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'none' }], {
      duration: 500,
      delay: 200,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'backwards',
    });
  }

  function quedanTapados() {
    return spoilers.some(function (s) { return s.dataset.spoiler === 'tapado' && !s.classList.contains('rompiendo'); });
  }

  function actualizarBoton() {
    if (!botonTodos) return;
    var quedan = quedanTapados();
    botonTodos.textContent = quedan ? 'Mostrar todos' : 'Volver a taparlos';
    botonTodos.setAttribute('aria-pressed', quedan ? 'false' : 'true');
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
      var quedan = quedanTapados();
      spoilers.forEach(function (s, i) {
        if (quedan) setTimeout(function () { destapar(s, false); }, movimientoReducido ? 0 : i * 160);
        else tapar(s);
      });
      setTimeout(actualizarBoton, quedan ? 0 : 50);
    });
  }
})();

/* Cabecera: ventanas del taller. El cursor abre en el mármol un rasgón
   vertical por el que se ve otro mundo, con el borde de luz dorada. La forma
   respira un poco. Sin ratón, la ventana pasea sola mientras se ve; con
   "reducir movimiento" se queda quieta. */
(function () {
  'use strict';

  var cabecera = document.querySelector('[data-ventana]');
  if (!cabecera) return;
  var mundo = cabecera.querySelector('[data-ventana-mundo]');
  var borde = cabecera.querySelector('[data-ventana-borde]');
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
    if (!conRaton && !movimientoReducido) {
      // Sin ratón: pasea por la mitad derecha
      var w = cabecera.clientWidth;
      var h = cabecera.clientHeight;
      objetivo.x = w * (0.66 + Math.sin(t * 0.23) * 0.2);
      objetivo.y = h * (0.5 + Math.sin(t * 0.37) * 0.12);
    }
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

  if (conRaton && !movimientoReducido) {
    cabecera.addEventListener('pointerenter', function (e) {
      colocar(e);
      pos.x = objetivo.x;
      pos.y = objetivo.y;
      abrir = 1;
      pedir();
    });
    cabecera.addEventListener('pointermove', function (e) {
      colocar(e);
      pedir();
    });
    cabecera.addEventListener('pointerleave', function () {
      abrir = 0;
      pedir();
    });
  } else {
    // Sin ratón o con movimiento reducido: una ventana fija o paseando
    objetivo.x = pos.x = cabecera.clientWidth * 0.7;
    objetivo.y = pos.y = cabecera.clientHeight * 0.5;
    abrir = 1;
  }

  new IntersectionObserver(function (entradas) {
    visible = entradas[0].isIntersecting;
    if (visible) pedir();
  }).observe(cabecera);
  window.addEventListener('resize', pedir);
  pedir();
})();

/* La losa de detrás de las seis partes cuenta el arco de la serie sin texto:
   intacta mientras se leen I y II; al bajar por III y IV le salen grietas
   oscuras (la corrupción) y al bajar por V y VI esas mismas grietas se
   rellenan de oro (la sanación, kintsugi). Va ligado al scroll y es
   reversible. Necesita js/grietas.js. */
(function () {
  'use strict';

  var G = window.marmolGrietas;
  var losa = document.querySelector('[data-losa]');
  if (!G || !losa) return;
  var svg = losa.querySelector('[data-losa-grietas]');
  var NS = 'http://www.w3.org/2000/svg';
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var grietas = [];
  var medida = '';

  // Grietas por toda la losa: unas cruzan de lado a lado y otras bajan
  function construir() {
    var w = losa.clientWidth;
    var h = losa.clientHeight;
    var clave = w + 'x' + h;
    if (clave === medida || !w || !h) return;
    medida = clave;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.innerHTML = '';
    var oscuras = document.createElementNS(NS, 'g');
    oscuras.setAttribute('class', 'losa__corrupcion');
    var oros = document.createElementNS(NS, 'g');
    oros.setAttribute('class', 'losa__oro');
    svg.appendChild(oscuras);
    svg.appendChild(oros);
    grietas = [];

    var trazados = [];
    var filas = Math.max(3, Math.round(h / 320));
    for (var f = 0; f < filas; f++) {
      var geo = G.horizontal(101 + f * 7, w, 120);
      var dy = ((f + 0.5) / filas) * h - 60;
      [geo.principal].concat(geo.ramas).forEach(function (pts, k) {
        trazados.push({ d: pts.map(function (p) { return [p[0], p[1] + dy]; }), rama: k > 0 });
      });
    }
    var columnas = w > 800 ? 4 : 2;
    for (var c = 0; c < columnas; c++) {
      var geoV = G.horizontal(211 + c * 5, h, 80);
      var dx = ((c + 0.5) / columnas) * w - 40;
      [geoV.principal].concat(geoV.ramas).forEach(function (pts, k) {
        trazados.push({ d: pts.map(function (p) { return [p[1] + dx, p[0]]; }), rama: k > 0 });
      });
    }

    var azar = G.aleatorio(77);
    trazados.forEach(function (t) {
      var d = G.trazado(t.d);
      // cada grieta aparece en su momento: unas antes, otras después
      var inicio = azar() * 0.55;
      ['corrupcion', 'oro'].forEach(function (capa) {
        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('pathLength', '1');
        if (t.rama) p.setAttribute('class', 'losa__rama');
        (capa === 'oro' ? oros : oscuras).appendChild(p);
        grietas.push({ el: p, capa: capa, inicio: inicio });
      });
    });
    pintar();
  }

  function tramo(y, desde, hasta) {
    return Math.max(0, Math.min(1, (y - desde) / (hasta - desde)));
  }

  function pintar() {
    pendiente = false;
    // Avance de la lectura por la losa (sirva igual con 1, 2 o 3 columnas):
    // primer tercio intacta, el segundo se corrompe y el último se cura
    var r = losa.getBoundingClientRect();
    var p = (window.innerHeight * 0.65 - r.top) / r.height;
    var corrupcion = movimientoReducido ? 1 : tramo(p, 0.22, 0.55);
    var sanacion = movimientoReducido ? 1 : tramo(p, 0.6, 0.95);
    grietas.forEach(function (g) {
      var p = g.capa === 'oro' ? sanacion : corrupcion;
      var local = Math.max(0, Math.min(1, (p - g.inicio) / 0.45));
      g.el.style.strokeDashoffset = (1 - local).toFixed(3);
    });
    // Mientras está corrupta (y aún sin oro), la losa se apaga un poco
    losa.style.setProperty('--corrupcion', (corrupcion * (1 - sanacion)).toFixed(3));
    losa.style.setProperty('--sanacion', sanacion.toFixed(3));
  }

  var pendiente = false;
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }

  construir();
  window.addEventListener('scroll', pedir, { passive: true });
  // La losa cambia de alto cuando se destapa un spoiler: se rehacen las grietas
  if ('ResizeObserver' in window) new ResizeObserver(construir).observe(losa);
  else window.addEventListener('resize', construir);
})();
