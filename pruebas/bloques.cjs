/* Proceso: los bloques de la línea de tiempo se abren y cierran animados, se pueden interrumpir y funcionan con teclado.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type() === 'error' && err.push(m.text()));
  await p.goto(BASE + '/proceso.html'); await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.linea-tiempo').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(1200);
  const muestra = async (n, cada) => { const r = []; for (let i = 0; i < n; i++) { r.push(await p.evaluate(() => { const d = document.querySelectorAll('.linea-tiempo details')[1]; return Math.round(d.getBoundingClientRect().height) + (d.open ? 'A' : 'c'); })); await p.waitForTimeout(cada); } return r.join(' '); };
  const s = '.linea-tiempo details >> nth=1 >> summary';
  await p.click(s); console.log('abrir   ', await muestra(10, 90));
  await p.waitForTimeout(400); await p.screenshot({ path: SALIDA + '/bloque-abierto.png' });
  await p.click(s); console.log('cerrar  ', await muestra(8, 70));
  await p.click(s); await p.waitForTimeout(200); await p.click(s); console.log('interr. ', await muestra(8, 80));
  await p.click(s); await p.waitForTimeout(150); await p.screenshot({ path: SALIDA + '/bloque-mitad.png' });
  await p.waitForTimeout(1200);
  // teclado
  await p.evaluate(() => document.querySelectorAll('.linea-tiempo summary')[0].focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
  console.log('teclado abre bloque 0:', await p.evaluate(() => document.querySelectorAll('.linea-tiempo details')[0].open));
  await p.keyboard.press('Space'); await p.waitForTimeout(900);
  console.log('teclado cierra bloque 0:', !(await p.evaluate(() => document.querySelectorAll('.linea-tiempo details')[0].open)));
  // archivo
  await p.click('.archivo__resumen'); await p.waitForTimeout(1300);
  console.log('archivo abierto:', await p.evaluate(() => { const d = document.querySelector('details.archivo'); return d.open + ' h=' + Math.round(d.getBoundingClientRect().height) + ' estiloAltura=' + (d.style.height || 'vacío'); }));
  // ancho de las piezas tras animar: visibles
  console.log('opacidades:', await p.evaluate(() => [...document.querySelectorAll('.linea-tiempo details[open] .semana')].slice(0, 3).map(e => getComputedStyle(e).opacity).join(',')));
  console.log('errores', err);
  await b.close();
})();
