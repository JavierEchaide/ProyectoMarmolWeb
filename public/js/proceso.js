/* Proceso: comparadores antes / después. El control es un <input type="range">
   invisible encima de la imagen: funciona con ratón, dedo y teclado. */
(function () {
  'use strict';

  document.querySelectorAll('[data-comparador]').forEach(function (c) {
    var control = c.querySelector('[data-comparador-control]');
    function actualizar() {
      c.style.setProperty('--corte', control.value + '%');
      c.style.setProperty('--corte-num', control.value / 100);
    }
    control.addEventListener('input', actualizar);
    actualizar();
  });
})();
