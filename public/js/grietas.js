/* Grietas de kintsugi: geometría compartida y divisores de sección.

   1. Geometría (deterministas: la misma semilla da siempre la misma grieta)
   2. Divisores: una costura de oro fina que se dibuja al hacer scroll

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

  // Grieta horizontal de lado a lado, como una costura de kintsugi en piedra:
  // casi recta, con un quiebro fino cada pocos píxeles, una deriva lenta y algún
  // escalón brusco que se recupera. Devuelve la línea principal (que se rellena
  // de oro), 1-2 ramas cortas también de oro y 4-7 fisuras finas sin reparar.
  function horizontal(semilla, ancho, alto) {
    var azar = aleatorio(semilla);
    var medio = alto / 2;
    var f1 = 0.004 + azar() * 0.004;
    var f2 = 0.011 + azar() * 0.008;
    var p1 = azar() * 6.28;
    var p2 = azar() * 6.28;
    function deriva(x) {
      return (Math.sin(x * f1 + p1) * 0.65 + Math.sin(x * f2 + p2) * 0.35) * alto * 0.16;
    }
    var principal = [[0, medio + deriva(0)]];
    var x = 0;
    var escalon = 0;
    while (x < ancho) {
      x = Math.min(ancho, x + 3 + azar() * 9);
      if (azar() < 0.05) escalon += (azar() < 0.5 ? -1 : 1) * alto * (0.12 + azar() * 0.1);
      escalon *= 0.9;
      var y = medio + deriva(x) + escalon + (azar() - 0.5) * alto * 0.1;
      principal.push([x, Math.max(alto * 0.12, Math.min(alto * 0.88, y))]);
    }

    function brote(largoMin, largoMax, tramoMax) {
      var origen = principal[2 + Math.floor(azar() * (principal.length - 5))];
      var angulo = (azar() < 0.5 ? -1 : 1) * (0.35 + azar() * 0.75) + (azar() < 0.3 ? Math.PI : 0);
      var puntos = [origen.slice()];
      var px = origen[0];
      var py = origen[1];
      var largo = largoMin + azar() * (largoMax - largoMin);
      var hecho = 0;
      while (hecho < largo) {
        var tramo = 2.5 + azar() * tramoMax;
        var a = angulo + (azar() - 0.5) * 0.9;
        px += Math.cos(a) * tramo;
        py += Math.sin(a) * tramo;
        if (py < 1 || py > alto - 1 || px < 0 || px > ancho) break;
        hecho += tramo;
        puntos.push([px, py]);
      }
      return puntos;
    }
    var ramas = [];
    var nRamas = 1 + Math.floor(azar() * 2);
    for (var i = 0; i < nRamas; i++) {
      var r = brote(26, 70, 7);
      if (r.length > 3) ramas.push(r);
    }
    var fisuras = [];
    var nFisuras = 4 + Math.floor(azar() * 4);
    for (var k = 0; k < nFisuras; k++) {
      var f = brote(8, 34, 5);
      if (f.length > 2) fisuras.push(f);
    }
    return { principal: principal, ramas: ramas, fisuras: fisuras };
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

  // Grosor de la costura de oro: casi nada en los extremos, un trazo fino y
  // regular en el centro y, de vez en cuando, un ensanche corto (donde la
  // piedra saltó al romperse y el oro rellena la mella)
  function grosorPrincipal(azar, maximo) {
    var pulsos = [];
    for (var i = 0; i < 60; i++) pulsos.push(0.7 + azar() * 0.45);
    var mellas = [];
    var n = 2 + Math.floor(azar() * 3);
    for (var m = 0; m < n; m++) mellas.push([0.12 + azar() * 0.76, 0.012 + azar() * 0.02, 0.7 + azar() * 0.9]);
    return function (t) {
      var f = t * 59;
      var k = Math.min(58, Math.floor(f));
      var pulso = pulsos[k] + (pulsos[k + 1] - pulsos[k]) * (f - k);
      var mella = 1;
      mellas.forEach(function (c) {
        var d = (t - c[0]) / c[1];
        mella += c[2] * Math.exp(-d * d);
      });
      return maximo * (0.08 + 0.92 * Math.pow(Math.sin(Math.PI * t), 0.35)) * pulso * mella;
    };
  }

  function construir(d, indice) {
    var ancho = d.clientWidth - parseFloat(getComputedStyle(d).paddingLeft) * 2;
    if (ancho <= 0) return;
    var estrecho = window.innerWidth < 700;
    var alto = estrecho ? 26 : 32;
    var semilla = parseInt(d.dataset.semilla, 10) || 1;
    var geo = horizontal(semilla, ancho, alto);
    var azar = aleatorio(semilla * 7 + 3);
    var maximo = estrecho ? 1.9 : 2.4;
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
    // Oro con reflejos a lo largo: tonos que cambian como en el metal batido
    var oroGrad = nodo('linearGradient', { id: id + '-oro', gradientUnits: 'userSpaceOnUse', x1: 0, x2: ancho, y1: 0, y2: 0 }, defs);
    var tonos = ['#a37a1c', '#c99f36', '#e3c46a', '#b78c27', '#d8b551', '#9c741a'];
    for (var o = 0; o <= 12; o++) {
      nodo('stop', { offset: (o / 12).toFixed(3), 'stop-color': tonos[Math.floor(azar() * tonos.length)] }, oroGrad);
    }
    // Los extremos se desvanecen en vez de cortarse en seco
    var fundido = nodo('linearGradient', { id: id + '-fundido', x1: '0', x2: '1', y1: '0', y2: '0' }, defs);
    nodo('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0' }, fundido);
    nodo('stop', { offset: '0.07', 'stop-color': '#fff', 'stop-opacity': '1' }, fundido);
    nodo('stop', { offset: '0.93', 'stop-color': '#fff', 'stop-opacity': '1' }, fundido);
    nodo('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }, fundido);
    var mascara = nodo('mask', { id: id + '-mascara', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: ancho, height: alto }, defs);
    nodo('rect', { x: 0, y: 0, width: ancho, height: alto, fill: 'url(#' + id + '-fundido)' }, mascara);

    var cintas = [cinta(geo.principal, grosorPrincipal(azar, maximo))];
    geo.ramas.forEach(function (r) {
      var base = maximo * (0.5 + azar() * 0.2);
      cintas.push(cinta(r, function (t) { return base * Math.pow(1 - t, 0.9) + 0.15; }));
    });

    // Capas, de abajo arriba: fisuras sin reparar, la sombra fina de la
    // grieta, el oro, su núcleo claro y el filo que recibe la luz
    var capas = nodo('g', { 'clip-path': 'url(#' + id + '-abierto)', mask: 'url(#' + id + '-mascara)' }, svg);
    var fisuras = nodo('g', { class: 'grieta__fisuras' }, capas);
    geo.fisuras.forEach(function (f) { nodo('path', { d: trazado(f) }, fisuras); });
    var sombra = nodo('g', { class: 'grieta__sombra' }, capas);
    var oro = nodo('g', { class: 'grieta__oro', fill: 'url(#' + id + '-oro)' }, capas);
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
    var chispa = nodo('circle', { class: 'grieta__chispa', r: maximo * 0.8, cx: 0, cy: alto / 2 }, svg);

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
