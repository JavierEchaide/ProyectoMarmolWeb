/* Grietas de kintsugi: geometría compartida y divisores de sección.

   1. Geometría (deterministas: la misma semilla da siempre la misma grieta)
   2. Divisores: una veta de oro con relieve que se dibuja al hacer scroll

   Se genera en el navegador, al tamaño real en píxeles de cada divisor, para
   que el grosor y el relieve no se deformen al estirar el SVG. Sin JS se ve la
   grieta plana que sale de src/components/Grieta.astro.
   window.marmolGrietas también rompe placas en esquirlas: las losas de
   SPOILER (js/historia.js) y la cortina entre páginas (js/site.js). */
(function () {
  'use strict';

  /* 1. Geometría -------------------------------------------------------- */

  function aleatorio(semilla) {
    // mulberry32 (el mismo que src/lib/grietas.js)
    var t = semilla >>> 0;
    return function () {
      t += 0x6d2b79f5;
      var r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function trazado(puntos) {
    return 'M' + puntos.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
  }

  function poligono(puntos) {
    return trazado(puntos) + ' Z';
  }

  // Convierte una línea quebrada en una cinta con grosor variable:
  // grosor(t) recibe la posición 0..1 a lo largo de la línea.
  function cinta(puntos, grosor) {
    var izq = [];
    var der = [];
    var nIzq = [];
    var nDer = [];
    var n = puntos.length;
    for (var i = 0; i < n; i++) {
      var a = puntos[Math.max(0, i - 1)];
      var b = puntos[Math.min(n - 1, i + 1)];
      var dx = b[0] - a[0];
      var dy = b[1] - a[1];
      var l = Math.hypot(dx, dy) || 1;
      var nx = -dy / l;
      var ny = dx / l;
      var g = grosor(i / (n - 1)) / 2;
      izq.push([puntos[i][0] + nx * g, puntos[i][1] + ny * g]);
      der.push([puntos[i][0] - nx * g, puntos[i][1] - ny * g]);
      // Núcleo: una cinta más fina pegada al borde que recibe la luz
      nIzq.push([puntos[i][0] + nx * g * 0.75, puntos[i][1] + ny * g * 0.75]);
      nDer.push([puntos[i][0] - nx * g * 0.05, puntos[i][1] - ny * g * 0.05]);
    }
    // El borde "de arriba" es el que mira hacia la luz (y menor)
    var arriba = izq[Math.floor(n / 2)][1] <= der[Math.floor(n / 2)][1];
    return {
      borde: arriba ? izq : der.slice(),
      contorno: izq.concat(der.slice().reverse()),
      nucleo: arriba ? nIzq.concat(nDer.reverse()) : nDer.concat(nIzq.reverse()),
    };
  }

  // Grieta horizontal de lado a lado con 2-4 ramas que avanzan hacia la derecha
  function horizontal(semilla, ancho, alto) {
    var azar = aleatorio(semilla);
    var medio = alto / 2;
    var principal = [[0, medio]];
    var x = 0;
    var y = medio;
    while (x < ancho) {
      // Tramos cortos y quebrados; de vez en cuando un salto más brusco.
      // La deriva vuelve poco a poco al centro para no salirse de la banda.
      var salto = azar() < 0.12 ? 0.7 : 0.28;
      x = Math.min(ancho, x + 5 + azar() * 17);
      y += (azar() - 0.5) * alto * salto + (medio - y) * 0.08;
      y = Math.max(alto * 0.15, Math.min(alto * 0.85, y));
      principal.push([x, y]);
    }
    var ramas = [];
    var n = 2 + Math.floor(azar() * 3);
    for (var i = 0; i < n; i++) {
      var origen = principal[1 + Math.floor(azar() * (principal.length - 3))];
      var sentido = azar() < 0.5 ? -1 : 1;
      var angulo = sentido * (0.3 + azar() * 0.35);
      var puntos = [origen.slice()];
      var px = origen[0];
      var py = origen[1];
      var largo = 50 + azar() * 120;
      var hecho = 0;
      while (hecho < largo) {
        var tramo = 5 + azar() * 10;
        var a = angulo + (azar() - 0.5) * 1.1;
        px += Math.cos(a) * tramo;
        py += Math.sin(a) * tramo;
        if (py < 2 || py > alto - 2 || px > ancho) break;
        hecho += tramo;
        puntos.push([px, py]);
      }
      if (puntos.length > 2) ramas.push(puntos);
    }
    return { principal: principal, ramas: ramas };
  }

  // Posición de un punto del borde del rectángulo medida en el sentido de las
  // agujas del reloj desde la esquina superior izquierda.
  function enPerimetro(p, w, h) {
    var e = 0.01;
    if (p[1] <= e) return p[0];
    if (p[0] >= w - e) return w + p[1];
    if (p[1] >= h - e) return w + h + (w - p[0]);
    return 2 * w + h + (h - p[1]);
  }

  // Esquinas que hay entre dos puntos del borde, en el mismo sentido
  function recorrerBorde(a, b, w, h) {
    var total = 2 * (w + h);
    var ta = enPerimetro(a, w, h);
    var tb = enPerimetro(b, w, h);
    if (tb <= ta) tb += total;
    var esquinas = [[w, [w, 0]], [w + h, [w, h]], [2 * w + h, [0, h]], [total, [0, 0]]];
    var salida = [];
    for (var vuelta = 0; vuelta < 2; vuelta++) {
      esquinas.forEach(function (c) {
        var t = c[0] + vuelta * total;
        if (t > ta && t < tb) salida.push(c[1]);
      });
    }
    return salida;
  }

  // Punto donde el segmento a→b sale del rectángulo
  function salida(a, b, w, h) {
    var t = 1;
    var dx = b[0] - a[0];
    var dy = b[1] - a[1];
    if (b[0] < 0) t = Math.min(t, -a[0] / dx);
    if (b[0] > w) t = Math.min(t, (w - a[0]) / dx);
    if (b[1] < 0) t = Math.min(t, -a[1] / dy);
    if (b[1] > h) t = Math.min(t, (h - a[1]) / dy);
    return [a[0] + dx * t, a[1] + dy * t];
  }

  /* Rotura de una placa de w × h: grietas que salen de un punto de impacto
     hasta los bordes y un anillo que las une. Devuelve las grietas (para
     dibujarlas) y las esquirlas (polígonos que cubren toda la placa). */
  function rotura(semilla, w, h) {
    var azar = aleatorio(semilla);
    var centro = [w * (0.4 + azar() * 0.2), h * (0.38 + azar() * 0.24)];
    var n = w / h > 1.6 ? 9 + Math.floor(azar() * 3) : 7 + Math.floor(azar() * 2);
    var sector = (Math.PI * 2) / n;
    var giro = azar() * sector;
    var paso = Math.max(w, h) / 7;
    var grietas = [];
    for (var i = 0; i < n; i++) {
      var base = giro + i * sector + (azar() - 0.5) * sector * 0.3;
      var puntos = [centro.slice()];
      var p = centro.slice();
      for (var k = 0; k < 40; k++) {
        var a = base + (azar() - 0.5) * 0.36;
        var tramo = paso * (0.55 + azar() * 0.7);
        var q = [p[0] + Math.cos(a) * tramo, p[1] + Math.sin(a) * tramo];
        if (q[0] < 0 || q[0] > w || q[1] < 0 || q[1] > h) {
          puntos.push(salida(p, q, w, h));
          break;
        }
        puntos.push(q);
        p = q;
      }
      var ultimo = puntos[puntos.length - 1];
      if (ultimo[0] > 0 && ultimo[0] < w && ultimo[1] > 0 && ultimo[1] < h) {
        // Por si no ha llegado al borde: se prolonga en línea recta
        puntos.push(salida(ultimo, [ultimo[0] + Math.cos(base) * 4 * (w + h), ultimo[1] + Math.sin(base) * 4 * (w + h)], w, h));
      }
      grietas.push(puntos);
    }

    // Anillo: un punto de cada grieta a un 35-55 % de su recorrido
    var cortes = grietas.map(function (g) {
      return Math.max(1, Math.min(g.length - 2, Math.round((g.length - 1) * (0.35 + azar() * 0.2))));
    });
    var anillo = [];
    var esquirlas = [];
    for (var j = 0; j < n; j++) {
      var g1 = grietas[j];
      var g2 = grietas[(j + 1) % n];
      var c1 = cortes[j];
      var c2 = cortes[(j + 1) % n];
      var A = g1[c1];
      var B = g2[c2];
      var mx = (A[0] + B[0]) / 2;
      var my = (A[1] + B[1]) / 2;
      var hacia = Math.hypot(mx - centro[0], my - centro[1]) || 1;
      var empuje = (azar() - 0.5) * 0.35 * Math.hypot(B[0] - A[0], B[1] - A[1]);
      var medio = [mx + ((mx - centro[0]) / hacia) * empuje, my + ((my - centro[1]) / hacia) * empuje];
      anillo.push([A, medio, B]);

      var interior = [centro].concat(g1.slice(1, c1 + 1), [medio], g2.slice(1, c2 + 1).reverse());
      var exterior = g1
        .slice(c1)
        .concat(recorrerBorde(g1[g1.length - 1], g2[g2.length - 1], w, h), g2.slice(c2).reverse(), [medio]);
      esquirlas.push(interior, exterior);
    }
    return { centro: centro, grietas: grietas, anillo: anillo, esquirlas: esquirlas };
  }

  var NS_SVG = 'http://www.w3.org/2000/svg';

  /* Dibuja las grietas de una rotura en un <svg> (tres pasadas por trazo:
     hueco oscuro, oro y filo de luz). Se animan con CSS: .rotura__capa */
  function dibujar(svg, geo) {
    svg.setAttribute('viewBox', '0 0 ' + geo.w + ' ' + geo.h);
    svg.innerHTML = '';
    ['sombra', 'oro', 'luz'].forEach(function (nombre) {
      var g = document.createElementNS(NS_SVG, 'g');
      g.setAttribute('class', 'rotura__capa rotura__capa--' + nombre);
      geo.grietas.concat(geo.anillo).forEach(function (puntos, i) {
        var p = document.createElementNS(NS_SVG, 'path');
        p.setAttribute('d', trazado(puntos));
        p.setAttribute('pathLength', '1');
        if (i >= geo.grietas.length) p.setAttribute('class', 'rotura__anillo');
        g.appendChild(p);
      });
      svg.appendChild(g);
    });
  }

  function centroide(puntos) {
    var x = 0;
    var y = 0;
    puntos.forEach(function (p) { x += p[0]; y += p[1]; });
    return [x / puntos.length, y / puntos.length];
  }

  /* Rompe `cara` en esquirlas dentro de `contenedor`: cada esquirla es una
     copia de la cara recortada con clip-path. Primero se abren un poco
     (asoma lo de detrás por las juntas) y luego caen girando en 3D.
     opciones: semilla, duracion (ms), retraso (ms máx. según distancia al
     impacto), caida (cuánto bajan, en altos de la placa).
     Devuelve la capa de esquirlas para quitarla al terminar. */
  function esquirlas(contenedor, cara, geo, opciones) {
    var o = opciones || {};
    var azar = aleatorio((o.semilla || 1) * 13 + 5);
    var duracion = o.duracion || 1250;
    var retraso = o.retraso == null ? 170 : o.retraso;
    var caidaFactor = o.caida || 1;
    var capa = document.createElement('span');
    capa.className = 'rotura__esquirlas';
    capa.setAttribute('aria-hidden', 'true');
    capa.style.perspectiveOrigin = ((geo.centro[0] / geo.w) * 100).toFixed(1) + '% ' + ((geo.centro[1] / geo.h) * 100).toFixed(1) + '%';
    var radioMax = Math.hypot(geo.w, geo.h) / 2;
    var escala = Math.max(1, Math.min(geo.w, geo.h) / 300);

    geo.esquirlas.forEach(function (poli) {
      var c = centroide(poli);
      var dx = c[0] - geo.centro[0];
      var dy = c[1] - geo.centro[1];
      var d = Math.hypot(dx, dy) || 1;
      var ux = dx / d;
      var uy = dy / d;
      var el = document.createElement('span');
      el.className = 'esquirla';
      el.style.clipPath =
        'polygon(' +
        poli.map(function (p) { return ((p[0] / geo.w) * 100).toFixed(3) + '% ' + ((p[1] / geo.h) * 100).toFixed(3) + '%'; }).join(',') +
        ')';
      el.style.transformOrigin = ((c[0] / geo.w) * 100).toFixed(2) + '% ' + ((c[1] / geo.h) * 100).toFixed(2) + '%';
      el.appendChild(cara.cloneNode(true));
      capa.appendChild(el);

      var signo = azar() < 0.5 ? -1 : 1;
      var abierta =
        'translate3d(' + (ux * 7 * escala).toFixed(1) + 'px,' + (uy * 7 * escala).toFixed(1) + 'px,' + (12 + azar() * 26).toFixed(1) + 'px) ' +
        'rotateX(' + (uy * -6).toFixed(1) + 'deg) rotateY(' + (ux * 8).toFixed(1) + 'deg)';
      var lejos = (70 + azar() * 140) * escala;
      var caida =
        'translate3d(' + (ux * lejos).toFixed(1) + 'px,' + (uy * lejos * 0.6 + geo.h * (0.7 + azar() * 0.6) * caidaFactor).toFixed(1) + 'px,' +
        (140 + azar() * 220).toFixed(1) + 'px) ' +
        'rotateX(' + (signo * (40 + azar() * 70)).toFixed(1) + 'deg) rotateY(' + (-signo * (30 + azar() * 70)).toFixed(1) + 'deg) ' +
        'rotateZ(' + ((azar() - 0.5) * 70).toFixed(1) + 'deg)';
      // La caída acelera como un objeto que cae (no es una entrada de UI)
      el.animate(
        [
          { transform: 'none', opacity: 1, offset: 0 },
          { transform: abierta, opacity: 1, offset: 0.24, easing: 'cubic-bezier(0.5, 0, 0.75, 0)' },
          { transform: caida, opacity: 1, offset: 0.78 },
          { transform: caida, opacity: 0, offset: 1 },
        ],
        { duration: duracion, delay: 60 + (d / radioMax) * retraso, easing: 'linear', fill: 'forwards' }
      );
    });
    contenedor.appendChild(capa);
    return capa;
  }

  window.marmolGrietas = {
    aleatorio: aleatorio,
    trazado: trazado,
    poligono: poligono,
    cinta: cinta,
    horizontal: horizontal,
    rotura: rotura,
    dibujar: dibujar,
    esquirlas: esquirlas,
  };

  /* 2. Divisores -------------------------------------------------------- */

  var NS = 'http://www.w3.org/2000/svg';
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var divisores = Array.prototype.slice.call(document.querySelectorAll('[data-grieta]'));
  if (!divisores.length) return;

  function nodo(nombre, atributos, padre) {
    var el = document.createElementNS(NS, nombre);
    for (var k in atributos) el.setAttribute(k, atributos[k]);
    if (padre) padre.appendChild(el);
    return el;
  }

  // Grosor de la veta principal: fina en los extremos, gruesa en el centro, con pulsos
  function grosorPrincipal(azar, maximo) {
    var pulsos = [];
    for (var i = 0; i < 40; i++) pulsos.push(0.65 + azar() * 0.7);
    return function (t) {
      // interpolado entre pulsos para que el grosor cambie sin escalones
      var f = t * 39;
      var k = Math.min(38, Math.floor(f));
      var pulso = pulsos[k] + (pulsos[k + 1] - pulsos[k]) * (f - k);
      return maximo * (0.22 + 0.78 * Math.pow(Math.sin(Math.PI * t), 0.6)) * pulso;
    };
  }

  function construir(d, indice) {
    var ancho = d.clientWidth - parseFloat(getComputedStyle(d).paddingLeft) * 2;
    if (ancho <= 0) return;
    var alto = window.innerWidth < 700 ? 36 : 44;
    var semilla = parseInt(d.dataset.semilla, 10) || 1;
    var geo = horizontal(semilla, ancho, alto);
    var azar = aleatorio(semilla * 7 + 3);
    var maximo = window.innerWidth < 700 ? 3.6 : 5;
    var id = 'grieta-' + indice;

    var svg = nodo('svg', {
      class: 'grieta__svg',
      width: ancho,
      height: alto,
      viewBox: '0 0 ' + ancho + ' ' + alto,
      'aria-hidden': 'true',
      focusable: 'false',
    });
    var defs = nodo('defs', {}, svg);
    var recorte = nodo('clipPath', { id: id + '-recorte' }, defs);
    // Lo que ya se ha abierto de la grieta: crece hacia la derecha con el scroll
    var abierto = nodo('clipPath', { id: id + '-abierto' }, defs);
    var ventana = nodo('rect', { x: -20, y: -20, width: 0, height: alto + 40 }, abierto);
    var brilloGrad = nodo('linearGradient', { id: id + '-brillo', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
    nodo('stop', { offset: '0', 'stop-color': '#fff6d8', 'stop-opacity': '0' }, brilloGrad);
    nodo('stop', { offset: '0.5', 'stop-color': '#fffbea', 'stop-opacity': '0.95' }, brilloGrad);
    nodo('stop', { offset: '1', 'stop-color': '#fff6d8', 'stop-opacity': '0' }, brilloGrad);

    var cintas = [cinta(geo.principal, grosorPrincipal(azar, maximo))];
    geo.ramas.forEach(function (r) {
      var base = maximo * (0.45 + azar() * 0.2);
      cintas.push(cinta(r, function (t) { return base * Math.pow(1 - t, 0.8) + 0.3; }));
    });

    // Capas, de abajo arriba: hueco en sombra, oro y filo de luz
    var capas = nodo('g', { 'clip-path': 'url(#' + id + '-abierto)' }, svg);
    var sombra = nodo('g', { class: 'grieta__sombra' }, capas);
    var oro = nodo('g', { class: 'grieta__oro' }, capas);
    var nucleo = nodo('g', { class: 'grieta__nucleo' }, capas);
    var luz = nodo('g', { class: 'grieta__luz' }, capas);
    cintas.forEach(function (c) {
      var forma = poligono(c.contorno);
      nodo('path', { d: forma }, sombra);
      nodo('path', { d: forma }, oro);
      nodo('path', { d: forma }, recorte);
      nodo('path', { d: poligono(c.nucleo) }, nucleo);
      nodo('path', { d: trazado(c.borde) }, luz);
    });
    var destello = nodo('g', { 'clip-path': 'url(#' + id + '-recorte)' }, capas);
    var brillo = nodo('rect', { class: 'grieta__brillo', x: -140, y: 0, width: 140, height: alto, fill: 'url(#' + id + '-brillo)' }, destello);
    var chispa = nodo('circle', { class: 'grieta__chispa', r: maximo * 0.9, cx: 0, cy: alto / 2 }, svg);

    d.innerHTML = '';
    d.appendChild(svg);
    d._grieta = { svg: svg, ventana: ventana, ancho: ancho, principal: geo.principal, brillo: brillo, chispa: chispa };
    pintar(d);
  }

  // Altura de la grieta principal en una x dada (para colocar la chispa)
  function alturaEn(principal, x) {
    for (var i = 1; i < principal.length; i++) {
      if (principal[i][0] >= x) {
        var a = principal[i - 1];
        var b = principal[i];
        var t = (x - a[0]) / (b[0] - a[0] || 1);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return principal[principal.length - 1][1];
  }

  function pintar(d) {
    var g = d._grieta;
    if (!g) return;
    var p = d._progreso || 0;
    var x = g.ancho * p;
    g.ventana.setAttribute('width', (x + 20).toFixed(1));
    g.chispa.setAttribute('cx', x.toFixed(1));
    g.chispa.setAttribute('cy', alturaEn(g.principal, x).toFixed(1));
    g.chispa.style.opacity = p > 0.01 && p < 0.995 ? 1 : 0;
  }

  // Al terminar de dibujarse, un brillo recorre el oro de izquierda a derecha
  function destellar(d) {
    var g = d._grieta;
    if (!g || movimientoReducido || !g.brillo.animate) return;
    g.brillo.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(' + (g.ancho + 280) + 'px)' }],
      { duration: 1600, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' }
    );
  }

  // Avance ligado al scroll: empieza al asomar por abajo y termina hacia la
  // mitad de la pantalla. Nunca retrocede.
  var pendiente = false;
  function actualizar() {
    pendiente = false;
    var alto = window.innerHeight;
    divisores.forEach(function (d) {
      if (d._progreso >= 1) return;
      var r = d.getBoundingClientRect();
      var p = Math.max(0, Math.min(1, (alto * 0.95 - r.top) / (alto * 0.45)));
      if (p > (d._progreso || 0)) {
        d._progreso = p;
        pintar(d);
        if (p >= 1) destellar(d);
      }
    });
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(actualizar);
    }
  }

  divisores.forEach(function (d, i) {
    d._progreso = movimientoReducido ? 1 : 0;
    construir(d, i);
  });
  document.documentElement.classList.add('grietas-listas');
  if (!movimientoReducido) {
    window.addEventListener('scroll', pedir, { passive: true });
    actualizar();
  }

  var anchoVentana = window.innerWidth;
  var espera;
  window.addEventListener('resize', function () {
    if (window.innerWidth === anchoVentana) return;
    anchoVentana = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(function () {
      divisores.forEach(construir);
      pedir();
    }, 150);
  });
})();
