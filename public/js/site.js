/* Proyecto Mármol · comportamiento común a todas las páginas.
   Sin librerías y sin módulos (script clásico) para que la web funcione
   también abriendo los .html desde un USB, sin servidor.

   1. Menú a pantalla completa
   2. Transición entre páginas (cortina)
   3. Aparición al hacer scroll
   4. Visor de imágenes y vídeo
   5. Diálogos (referencias de Proceso)
*/
(function () {
  'use strict';

  var html = document.documentElement;
  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Menú ------------------------------------------------------------- */

  var botonMenu = document.querySelector('[data-boton-menu]');
  var textoMenu = document.querySelector('[data-texto-menu]');
  var menu = document.querySelector('[data-menu]');
  var fondo = [document.querySelector('main'), document.querySelector('.pie')];

  function abrirMenu() {
    html.classList.add('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'true');
    textoMenu.textContent = 'Cerrar';
    fondo.forEach(function (el) { if (el) el.inert = true; });
    var actual = menu.querySelector('[aria-current="page"]') || menu.querySelector('a');
    setTimeout(function () { actual.focus({ preventScroll: true }); }, movimientoReducido ? 0 : 350);
  }

  function cerrarMenu(devolverFoco) {
    html.classList.remove('menu-abierto');
    botonMenu.setAttribute('aria-expanded', 'false');
    textoMenu.textContent = 'Menú';
    fondo.forEach(function (el) { if (el) el.inert = false; });
    if (devolverFoco) botonMenu.focus();
  }

  if (botonMenu && menu) {
    botonMenu.addEventListener('click', function () {
      if (html.classList.contains('menu-abierto')) cerrarMenu(true);
      else abrirMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && html.classList.contains('menu-abierto')) cerrarMenu(true);
    });
    // El enlace a la página en la que ya estás solo cierra el menú
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (a.getAttribute('aria-current') === 'page') {
          e.preventDefault();
          cerrarMenu(true);
        }
      });
    });
  }

  /* Cabecera: cambia de fondo al bajar y se esconde mientras se baja; al
     subir vuelve. Así nunca tapa lo que se está leyendo. */
  var cabecera = document.querySelector('.cabecera');
  var ultimoScroll = window.scrollY;
  var cabeceraPendiente = false;
  function actualizarCabecera() {
    cabeceraPendiente = false;
    var y = window.scrollY;
    cabecera.classList.toggle('cabecera--fondo', y > 8);
    if (!html.classList.contains('menu-abierto') && Math.abs(y - ultimoScroll) > 6) {
      cabecera.classList.toggle('cabecera--oculta', y > ultimoScroll && y > 160);
      ultimoScroll = y;
    }
  }
  if (cabecera) {
    window.addEventListener('scroll', function () {
      if (!cabeceraPendiente) {
        cabeceraPendiente = true;
        requestAnimationFrame(actualizarCabecera);
      }
    }, { passive: true });
    // Si el foco del teclado entra en la cabecera, se muestra
    cabecera.addEventListener('focusin', function () { cabecera.classList.remove('cabecera--oculta'); });
    actualizarCabecera();
  }

  /* 2. Transición entre páginas ----------------------------------------- */

  var cortinaTexto = document.querySelector('[data-cortina-texto]');

  function esInterno(a) {
    var href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return false;
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return false;
    return /\.html(#.*)?$/.test(href);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (!esInterno(a)) return;
    e.preventDefault();
    var destino = a.getAttribute('href');
    try { sessionStorage.setItem('marmol-transicion', '1'); } catch (err) {}
    if (movimientoReducido) {
      window.location.href = destino;
      return;
    }
    // Texto de la cortina: el número y título de la página de destino
    var item = menu && menu.querySelector('a[href="' + destino + '"]');
    if (item && cortinaTexto) {
      cortinaTexto.textContent =
        item.querySelector('.menu__numero').textContent + ' · ' + item.querySelector('.menu__titulo').textContent;
    }
    html.classList.add('saliendo');
    setTimeout(function () { window.location.href = destino; }, 560);
  });

  // Al llegar desde otra página de la web, la placa de la cortina se agrieta
  // en oro y cae en esquirlas (motor de js/grietas.js). En móvil, donde una
  // veintena de piezas a pantalla completa puede ir a tirones, la placa
  // simplemente sube. No bloquea la página: la cortina no recibe clics.
  if (html.classList.contains('entrando')) {
    var G = window.marmolGrietas;
    var cortina = document.querySelector('[data-cortina]');
    var caraCortina = document.querySelector('[data-cortina-cara]');
    var movil = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    if (!G || movimientoReducido || !cortina || !caraCortina || !caraCortina.animate) {
      html.classList.remove('entrando');
    } else if (movil) {
      cortina.classList.add('cortina--sube');
      setTimeout(function () {
        html.classList.remove('entrando');
        cortina.classList.remove('cortina--sube');
      }, 900);
    } else {
      var semilla = Math.floor(Math.random() * 100000);
      var geoCortina = G.rotura(semilla, window.innerWidth, window.innerHeight);
      geoCortina.w = window.innerWidth;
      geoCortina.h = window.innerHeight;
      G.dibujar(document.querySelector('[data-cortina-grietas]'), geoCortina);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { cortina.classList.add('agrietando'); });
      });
      setTimeout(function () {
        var capa = G.esquirlas(cortina, caraCortina, geoCortina, { semilla: semilla, duracion: 1000, retraso: 140, caida: 0.8 });
        cortina.classList.add('cortina--rota');
        setTimeout(function () {
          html.classList.remove('entrando');
          cortina.classList.remove('agrietando', 'cortina--rota');
          capa.remove();
        }, 1300);
      }, 360);
    }
  }

  // Al volver con el botón "atrás" la página puede salir de la caché con la cortina puesta
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      html.classList.remove('saliendo', 'entrando');
      cerrarMenu(false);
    }
  });

  /* 3. Aparición al hacer scroll (las grietas van en js/grietas.js) ------ */

  var observables = document.querySelectorAll('[data-revelar]');
  if ('IntersectionObserver' in window) {
    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('visible');
            observador.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    observables.forEach(function (el) { observador.observe(el); });
  } else {
    observables.forEach(function (el) { el.classList.add('visible'); });
  }

  /* 4. Visor de imágenes y vídeo ---------------------------------------- */

  var visor = document.querySelector('[data-visor-dialogo]');
  var medio = document.querySelector('[data-visor-medio]');
  var marco = document.querySelector('[data-visor-marco]');
  var pie = document.querySelector('[data-visor-pie]');
  var grupoActual = [];
  var indiceActual = 0;
  var origen = null;

  function ratioNumero(ratio) {
    var partes = String(ratio || '16 / 9').split('/');
    return parseFloat(partes[0]) / parseFloat(partes[1] || 1);
  }

  function pintar(datos) {
    medio.innerHTML = '';
    medio.style.setProperty('--ratio', ratioNumero(datos.ratio));
    medio.style.setProperty('--ratio-css', datos.ratio || '16 / 9');
    if (datos.video) {
      var v = document.createElement('video');
      v.src = datos.video;
      v.controls = true;
      v.playsInline = true;
      v.autoplay = true;
      medio.appendChild(v);
    } else if (datos.src) {
      var img = document.createElement('img');
      img.src = datos.src;
      img.alt = datos.alt || '';
      medio.appendChild(img);
    } else {
      var falta = document.createElement('div');
      falta.className = 'visor__falta';
      falta.innerHTML = '<span><strong>' + (datos.esVideo ? 'Vídeo pendiente' : 'Imagen pendiente') + '</strong></span>';
      falta.firstChild.appendChild(document.createTextNode(datos.falta || ''));
      medio.appendChild(falta);
    }
    pie.textContent = datos.pie || '';
  }

  function datosDe(el) {
    return {
      src: el.dataset.src,
      alt: el.dataset.alt,
      falta: el.dataset.falta,
      pie: el.dataset.pie,
      ratio: el.dataset.ratio,
    };
  }

  // Animación de "crecer" desde el elemento pulsado hasta la ventana grande
  function animarDesde(el) {
    if (movimientoReducido || !el || !medio.animate) return;
    var a = el.getBoundingClientRect();
    var b = medio.getBoundingClientRect();
    if (!a.width || !b.width) return;
    var dx = a.left + a.width / 2 - (b.left + b.width / 2);
    var dy = a.top + a.height / 2 - (b.top + b.height / 2);
    medio.animate(
      [
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + a.width / b.width + ',' + a.height / b.height + ')' },
        { transform: 'none' },
      ],
      { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
    pie.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 250, fill: 'backwards' });
  }

  function abrirVisor(datos, el, grupo) {
    origen = el;
    grupoActual = grupo || [];
    indiceActual = grupo ? grupo.indexOf(el) : 0;
    visor.classList.toggle('visor--grupo', grupoActual.length > 1);
    pintar(datos);
    visor.showModal();
    animarDesde(el);
  }

  function mover(paso) {
    if (grupoActual.length < 2) return;
    indiceActual = (indiceActual + paso + grupoActual.length) % grupoActual.length;
    var el = grupoActual[indiceActual];
    pintar(datosDe(el));
    if (!movimientoReducido) {
      medio.animate([{ opacity: 0, transform: 'translateX(' + paso * 24 + 'px)' }, { opacity: 1, transform: 'none' }], {
        duration: 350,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      });
    }
  }

  function cerrarVisor() {
    var v = medio.querySelector('video');
    if (v) v.pause();
    visor.close();
  }

  if (visor) {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-visor]');
      if (!el) return;
      var grupo = el.dataset.grupo
        ? Array.prototype.slice.call(document.querySelectorAll('[data-visor][data-grupo="' + el.dataset.grupo + '"]'))
        : null;
      abrirVisor(datosDe(el), el, grupo);
    });

    document.querySelector('[data-visor-cerrar]').addEventListener('click', cerrarVisor);
    document.querySelector('[data-visor-anterior]').addEventListener('click', function () { mover(-1); });
    document.querySelector('[data-visor-siguiente]').addEventListener('click', function () { mover(1); });

    // Clic fuera de la imagen: cerrar
    visor.addEventListener('click', function (e) {
      if (e.target === visor) cerrarVisor();
    });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') mover(-1);
      if (e.key === 'ArrowRight') mover(1);
    });
    visor.addEventListener('close', function () {
      medio.innerHTML = '';
      if (origen && document.contains(origen)) origen.focus({ preventScroll: true });
    });

    // Lo usa el reproductor del Teaser
    window.marmolVisor = { abrir: abrirVisor };
  }

  /* 5. Diálogos --------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var abrir = e.target.closest('[data-abrir-dialogo]');
    if (abrir) {
      var d = document.getElementById(abrir.dataset.abrirDialogo);
      if (d) d.showModal();
      return;
    }
    var cerrar = e.target.closest('[data-cerrar-dialogo]');
    if (cerrar) {
      cerrar.closest('dialog').close();
      return;
    }
    // Clic en el fondo de un diálogo: cerrar
    if (e.target.matches && e.target.matches('dialog.dialogo')) {
      var r = e.target.getBoundingClientRect();
      var fuera = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      if (fuera) e.target.close();
    }
  });
})();
