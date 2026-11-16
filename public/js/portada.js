/* Portada (V3): intro, luz rasante del hero, escena de los cuatro fotogramas,
   estelas que se inclinan, precarga del busto 3D y rombos de estado. */
(function () {
  'use strict';

  var html = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conRaton = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var introActiva = html.classList.contains('intro-activa');
  var lista = function (nodos) { return Array.prototype.slice.call(nodos); };
  var limitar = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var altoCabecera = function () {
    return parseFloat(getComputedStyle(html).getPropertyValue('--cabecera')) || 64;
  };

  /* Intro: se puede saltar con un clic o una tecla. Se retira al terminar. */
  var intro = document.querySelector('[data-intro]');
  if (intro && introActiva) {
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

  /* Luz rasante del hero: sigue al ratón despacio (interpolada en rAF). En
     táctil y con movimiento reducido se queda donde la pone el CSS. */
  var frontis = document.querySelector('[data-frontis]');
  var luz = frontis && frontis.querySelector('[data-luz]');
  if (luz && conRaton && !movimientoReducido) {
    var meta = { x: 66, y: 38 };
    var ahora = { x: 66, y: 38 };
    var luzPendiente = false;
    var pintarLuz = function () {
      luzPendiente = false;
      ahora.x += (meta.x - ahora.x) * 0.045;
      ahora.y += (meta.y - ahora.y) * 0.045;
      frontis.style.setProperty('--lx', ahora.x.toFixed(2) + '%');
      frontis.style.setProperty('--ly', ahora.y.toFixed(2) + '%');
      if (Math.abs(meta.x - ahora.x) > 0.05 || Math.abs(meta.y - ahora.y) > 0.05) pedirLuz();
    };
    var pedirLuz = function () {
      if (!luzPendiente) {
        luzPendiente = true;
        requestAnimationFrame(pintarLuz);
      }
    };
    frontis.addEventListener('pointermove', function (e) {
      var r = frontis.getBoundingClientRect();
      meta.x = ((e.clientX - r.left) / r.width) * 100;
      meta.y = ((e.clientY - r.top) / r.height) * 100;
      pedirLuz();
    });
    frontis.addEventListener('pointerleave', function () {
      meta.x = 66;
      meta.y = 38;
      pedirLuz();
    });
  }

  /* La historia en cuatro fotogramas: en pantalla ancha la escena se fija y
     el fotograma cambia de I a IV al bajar. En móvil y con movimiento
     reducido se queda la lista. */
  var cuatro = document.querySelector('[data-cuatro]');
  if (cuatro && !movimientoReducido) {
    var fotogramas = lista(cuatro.querySelectorAll('[data-cuatro-fotograma]'));
    var marcas = lista(cuatro.querySelectorAll('[data-cuatro-marca]'));
    var ancha = window.matchMedia('(min-width: 900px) and (min-height: 600px)');
    var escena = false;
    var actual = -1;
    var cuatroPendiente = false;
    var poner = function (i) {
      if (i === actual) return;
      actual = i;
      fotogramas.forEach(function (f, n) { f.classList.toggle('es-actual', n === i); });
      marcas.forEach(function (m, n) { m.classList.toggle('es-actual', n === i); });
    };
    var recorridoCuatro = function () {
      return cuatro.offsetHeight - (window.innerHeight - altoCabecera());
    };
    var medirCuatro = function () {
      cuatroPendiente = false;
      if (!escena) return;
      var rec = recorridoCuatro();
      var p = rec > 0 ? limitar((altoCabecera() - cuatro.getBoundingClientRect().top) / rec, 0, 0.999) : 0;
      poner(Math.floor(p * fotogramas.length));
    };
    var pedirCuatro = function () {
      if (escena && !cuatroPendiente) {
        cuatroPendiente = true;
        requestAnimationFrame(medirCuatro);
      }
    };
    var modo = function () {
      escena = ancha.matches;
      cuatro.classList.toggle('cuatro--escena', escena);
      actual = -1;
      if (escena) medirCuatro();
    };
    marcas.forEach(function (m, i) {
      m.addEventListener('click', function () {
        if (!escena) return;
        var arriba = cuatro.getBoundingClientRect().top + window.scrollY - altoCabecera();
        window.scrollTo({ top: arriba + recorridoCuatro() * ((i + 0.5) / fotogramas.length), behavior: 'smooth' });
      });
    });
    if (ancha.addEventListener) ancha.addEventListener('change', modo);
    window.addEventListener('scroll', pedirCuatro, { passive: true });
    window.addEventListener('resize', pedirCuatro);
    modo();
  }

  /* Estelas de "Las salas": con ratón, la losa se inclina unos grados hacia
     el cursor. El enlace no se mueve (solo la losa de dentro), así la zona
     que recibe el ratón no se le escapa al cursor. Al pulsar se acerca y la
     cortina (site.js) cae sola. */
  var estelas = lista(document.querySelectorAll('[data-estela]'));
  if (estelas.length && conRaton && !movimientoReducido) {
    var reposo = [9, 0, -9];
    estelas.forEach(function (estela, i) {
      var cuerpo = estela.querySelector('[data-estela-cuerpo]');
      var base = window.matchMedia('(min-width: 900px)').matches ? reposo[i] || 0 : 0;
      var est = { rx: 1, ry: base, y: 0 };
      var fin = { rx: 1, ry: base, y: 0 };
      var dentro = false;
      var pendiente = false;
      var entrando = false;
      var pintar = function () {
        pendiente = false;
        if (entrando) return;
        est.rx += (fin.rx - est.rx) * 0.12;
        est.ry += (fin.ry - est.ry) * 0.12;
        est.y += (fin.y - est.y) * 0.12;
        var quieta = Math.abs(fin.rx - est.rx) < 0.02 && Math.abs(fin.ry - est.ry) < 0.02 && Math.abs(fin.y - est.y) < 0.05;
        if (quieta && !dentro) {
          // De vuelta al reposo: manda otra vez el CSS
          cuerpo.classList.remove('es-guiada');
          cuerpo.style.transform = '';
          return;
        }
        cuerpo.style.transform =
          'translateY(' + est.y.toFixed(2) + 'px) rotateY(' + est.ry.toFixed(2) + 'deg) rotateX(' + est.rx.toFixed(2) + 'deg)';
        if (!quieta) pedir();
      };
      var pedir = function () {
        if (!pendiente) {
          pendiente = true;
          requestAnimationFrame(pintar);
        }
      };
      estela.addEventListener('pointerenter', function () {
        dentro = true;
        base = window.matchMedia('(min-width: 900px)').matches ? reposo[i] || 0 : 0;
        if (!cuerpo.classList.contains('es-guiada')) {
          est.rx = 1;
          est.ry = base;
          est.y = 0;
        }
        cuerpo.classList.add('es-guiada');
        fin.y = -10;
        pedir();
      });
      estela.addEventListener('pointermove', function (e) {
        var r = estela.getBoundingClientRect();
        var nx = limitar((e.clientX - r.left) / r.width - 0.5, -0.5, 0.5);
        var ny = limitar((e.clientY - r.top) / r.height - 0.5, -0.5, 0.5);
        fin.ry = nx * 12;
        fin.rx = 2 - ny * 7;
        pedir();
      });
      estela.addEventListener('pointerleave', function () {
        dentro = false;
        fin.rx = 1;
        fin.ry = base;
        fin.y = 0;
        pedir();
      });
      estela.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        entrando = true;
        cuerpo.classList.remove('es-guiada');
        cuerpo.style.transform = 'translateY(-14px) scale(1.06)';
      });
    });
    // Al volver con "atrás" (caché del navegador), las estelas vuelven al reposo
    window.addEventListener('pageshow', function () {
      estelas.forEach(function (estela) {
        var c = estela.querySelector('[data-estela-cuerpo]');
        if (c) c.style.transform = '';
      });
    });
  }

  /* Busto 3D de "Hecho por": three.js y el .glb se descargan al entrar en la
     web (precarga), cuando la página ya ha cargado y sin estorbar a la intro.
     Mientras tanto, y si algo falla, se ve la silueta de respaldo. */
  var busto = document.querySelector('[data-busto]');
  if (busto) {
    var cargarBusto = function () {
      try {
        var s = document.createElement('script');
        s.src = 'js/busto.js';
        s.async = true;
        s.onerror = function () { /* sin 3D: se queda el respaldo */ };
        document.body.appendChild(s);
      } catch (e) { /* se queda el respaldo */ }
    };
    var trasCargar = function () {
      var espera = introActiva ? 3200 : 0;
      setTimeout(function () {
        if ('requestIdleCallback' in window) window.requestIdleCallback(cargarBusto, { timeout: 2500 });
        else setTimeout(cargarBusto, 300);
      }, espera);
    };
    if (document.readyState === 'complete') trasCargar();
    else window.addEventListener('load', trasCargar);

    /* Rombos de estado (cerrada, se abre, abierta): avanzan con el scroll */
    var pasos = lista(busto.querySelectorAll('[data-paso-n]'));
    var pasoActual = -1;
    var pasosPendiente = false;
    var medirPasos = function () {
      pasosPendiente = false;
      var r = busto.getBoundingClientRect();
      var rec = r.height - window.innerHeight;
      var p = movimientoReducido || rec <= 0 ? 0.7 : limitar(-r.top / rec, 0, 1);
      var paso = p < 0.1 ? 0 : p < 0.68 ? 1 : 2;
      if (paso === pasoActual) return;
      pasoActual = paso;
      busto.setAttribute('data-paso', paso);
      pasos.forEach(function (li, n) {
        li.classList.toggle('es-hecho', n < paso);
        li.classList.toggle('es-actual', n === paso);
      });
    };
    var pedirPasos = function () {
      if (!pasosPendiente) {
        pasosPendiente = true;
        requestAnimationFrame(medirPasos);
      }
    };
    window.addEventListener('scroll', pedirPasos, { passive: true });
    window.addEventListener('resize', pedirPasos);
    medirPasos();
  }
})();
