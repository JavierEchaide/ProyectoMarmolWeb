/* Reproductor de música (las cuatro salas).

   - Apagado por defecto: solo suena tras pulsar el botón.
   - Al cambiar de sala sigue donde iba: guarda { activo, posicion } en
     sessionStorage (al salir de la página y cada 3 s) y, al cargar, si estaba
     activo, intenta reanudar desde ahí. Si el navegador bloquea play() sin
     gesto del usuario, el botón queda apagado y arranca con el clic.
   - Si empieza a sonar un vídeo con sonido (el teaser), la música se calla y
     no vuelve sola.
   - La veta alrededor del disco avanza con currentTime / duration.
   - Sin archivo de audio (o si falla), el botón vuelve a apagado sin romper nada.
   Script clásico: funciona también desde file://. */
(function () {
  'use strict';

  var raiz = document.querySelector('[data-musica]');
  if (!raiz) return;
  var boton = raiz.querySelector('[data-musica-boton]');
  var CLAVE = 'marmol-musica';
  var audio = null;
  var activo = false;
  var reloj = null;

  function leer() {
    try { return JSON.parse(sessionStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; }
  }
  var guardado = leer();
  var posicion = typeof guardado.posicion === 'number' && isFinite(guardado.posicion) ? guardado.posicion : 0;

  function guardar() {
    if (audio && isFinite(audio.currentTime)) posicion = audio.currentTime;
    try { sessionStorage.setItem(CLAVE, JSON.stringify({ activo: activo, posicion: posicion })); } catch (e) {}
  }

  function pintar() {
    var p = audio && audio.duration ? audio.currentTime / audio.duration : 0;
    raiz.style.setProperty('--progreso', Math.max(0, Math.min(1, p)).toFixed(4));
  }

  function estado(sonando) {
    activo = sonando;
    raiz.classList.toggle('musica--sonando', sonando);
    boton.setAttribute('aria-pressed', sonando ? 'true' : 'false');
    boton.setAttribute('aria-label', sonando ? 'Música: silenciar' : 'Música: activar');
    clearInterval(reloj);
    if (sonando) reloj = setInterval(guardar, 3000);
  }

  function crear() {
    if (audio) return;
    audio = new Audio();
    audio.preload = 'auto';
    audio.loop = raiz.hasAttribute('data-bucle');
    audio.addEventListener('loadedmetadata', function () {
      if (posicion > 0 && posicion < audio.duration - 1) audio.currentTime = posicion;
      pintar();
    });
    audio.addEventListener('timeupdate', pintar);
    audio.addEventListener('ended', function () {
      posicion = 0;
      audio.currentTime = 0;
      estado(false);
      guardar();
      pintar();
    });
    // Falta el archivo o no se puede leer: apagado, sin más
    audio.addEventListener('error', function () {
      raiz.classList.add('musica--sin-pista');
      estado(false);
      guardar();
    });
    audio.src = raiz.dataset.src;
  }

  function sonar() {
    crear();
    var promesa;
    try { promesa = audio.play(); } catch (e) { estado(false); return; }
    estado(true);
    if (promesa && promesa.catch) {
      // NotAllowedError (el navegador pide un gesto) u otro fallo: se queda
      // apagado y el siguiente clic lo arranca. Se conserva la posición.
      promesa.catch(function () { estado(false); });
    }
  }

  function silenciar() {
    if (audio) audio.pause();
    estado(false);
    guardar();
  }

  boton.addEventListener('click', function () {
    if (activo) silenciar();
    else { sonar(); guardar(); }
  });

  // El teaser (o cualquier vídeo con sonido) manda: la música se calla
  document.addEventListener('play', function (e) {
    var t = e.target;
    if (activo && t && t.tagName === 'VIDEO' && !t.muted) silenciar();
  }, true);

  window.addEventListener('pagehide', guardar);

  // Venía sonando desde otra sala: se intenta reanudar donde iba
  if (guardado.activo) sonar();
  else pintar();

  window.marmolMusica = { silenciar: silenciar };
})();
