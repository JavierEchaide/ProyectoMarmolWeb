/* Historia: carteles de SPOILER. Al pulsar uno, se dibujan grietas doradas
   sobre el negro, el cartel cae y aparece el contenido. "Mostrar todos"
   destapa todos a la vez; "Volver a taparlos" los repone. No se guarda nada:
   al recargar la página vuelven a estar tapados. */
(function () {
  'use strict';

  var movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var spoilers = Array.prototype.slice.call(document.querySelectorAll('.spoiler--activo'));
  var botonTodos = document.querySelector('[data-spoiler-todos]');

  function destapar(s, enfocar) {
    if (s.dataset.spoiler !== 'tapado') return;
    var contenido = s.querySelector('.spoiler__contenido');
    s.classList.add('rompiendo');
    s.dataset.spoiler = 'destapado';
    contenido.inert = false;
    setTimeout(function () {
      s.classList.add('destapado');
      if (enfocar) {
        contenido.setAttribute('tabindex', '-1');
        contenido.focus({ preventScroll: true });
      }
    }, movimientoReducido ? 0 : 1000);
    actualizarBoton();
  }

  function tapar(s) {
    s.classList.remove('rompiendo', 'destapado');
    s.dataset.spoiler = 'tapado';
    s.querySelector('.spoiler__contenido').inert = true;
  }

  function actualizarBoton() {
    if (!botonTodos) return;
    var quedan = spoilers.some(function (s) { return s.dataset.spoiler === 'tapado'; });
    botonTodos.textContent = quedan ? 'Mostrar todos' : 'Volver a taparlos';
    botonTodos.setAttribute('aria-pressed', quedan ? 'false' : 'true');
  }

  spoilers.forEach(function (s) {
    s.querySelector('[data-spoiler-tapa]').addEventListener('click', function () {
      destapar(s, true);
    });
  });

  if (botonTodos) {
    botonTodos.addEventListener('click', function () {
      var quedan = spoilers.some(function (s) { return s.dataset.spoiler === 'tapado'; });
      spoilers.forEach(function (s, i) {
        if (quedan) setTimeout(function () { destapar(s, false); }, movimientoReducido ? 0 : i * 120);
        else tapar(s);
      });
      if (!quedan) actualizarBoton();
    });
  }
})();
