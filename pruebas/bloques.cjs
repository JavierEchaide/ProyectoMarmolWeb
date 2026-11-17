/* Proceso (V3): el calendario es una veta con un nodo por bloque. Cada nodo
   es un <details> exclusivo: al abrir uno se cierra el anterior, su panel sale
   al lado y funciona con teclado. Los enlaces #sXX abren su bloque.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
let fallos = 0;
const ver = (nombre, ok) => { console.log((ok ? 'ok    ' : 'FALLO ') + nombre); if (!ok) fallos++; };
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type() === 'error' && err.push(m.text()));
  await p.goto(BASE + '/proceso.html'); await p.waitForTimeout(800);
  const abiertos = () => p.evaluate(() => [...document.querySelectorAll('.calveta details')].map((d) => (d.open ? 'A' : 'c')).join(''));
  ver('siete nodos y solo el actual abierto', (await abiertos()) === 'cAccccc');
  await p.evaluate(() => document.querySelector('.calveta').scrollIntoView({ block: 'start', behavior: 'instant' }));
  await p.waitForTimeout(400);
  await p.click('.calveta summary >> nth=2'); await p.waitForTimeout(700);
  ver('al pulsar un nodo se abre y se cierra el anterior', (await abiertos()) === 'ccAcccc');
  ver('el panel sale al lado de la veta', await p.evaluate(() => {
    const d = document.querySelector('.calveta details[open]');
    const caja = d.querySelector('.calveta__caja').getBoundingClientRect(); const nodo = d.querySelector('summary').getBoundingClientRect();
    return caja.left > nodo.right && caja.height > 100 && caja.top < innerHeight;
  }));
  await p.screenshot({ path: SALIDA + '/bloque-abierto.png' });
  // teclado
  await p.evaluate(() => document.querySelectorAll('.calveta summary')[0].focus());
  await p.keyboard.press('Enter'); await p.waitForTimeout(500);
  ver('teclado abre el bloque 0', (await abiertos()) === 'Acccccc');
  await p.keyboard.press('Space'); await p.waitForTimeout(500);
  ver('teclado cierra el bloque 0', (await abiertos()) === 'ccccccc');
  // ancla de semana
  await p.goto(BASE + '/proceso.html#s27'); await p.waitForTimeout(900);
  ver('#s27 abre su bloque y se ve', await p.evaluate(() => { const s = document.getElementById('s27'); const r = s.getBoundingClientRect(); return s.closest('details').open && r.top >= 0 && r.top < innerHeight; }));
  ver('la veta se enciende solo hasta la semana actual', await p.evaluate(() => { const v = document.querySelector('[data-calveta]'); return +v.style.getPropertyValue('--encendido') <= +v.style.getPropertyValue('--tope'); }));
  // móvil: lista recta, el panel va debajo del nodo
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(BASE + '/proceso.html'); await m.waitForTimeout(600);
  ver('móvil: lista recta (panel debajo del nodo, sin veta)', await m.evaluate(() => {
    const d = document.querySelector('.calveta details[open]');
    return getComputedStyle(document.querySelector('.calveta__trazo')).display === 'none' && d.querySelector('.calveta__caja').getBoundingClientRect().top >= d.querySelector('summary').getBoundingClientRect().bottom - 1;
  }));
  ver('sin errores de consola', err.length === 0); if (err.length) console.log(err);
  await b.close();
  process.exit(fallos ? 1 : 0);
})();
