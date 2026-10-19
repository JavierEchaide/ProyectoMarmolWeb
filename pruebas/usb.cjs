/* Plan B: abre dist/index.html desde file:// (como desde un USB), navega y comprueba que no falla ninguna petición.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type()==='error' && err.push(m.text()));
  const fallos = []; p.on('requestfailed', r => fallos.push(r.url()));
  await p.goto(require('url').pathToFileURL(require('path').resolve(__dirname, '../dist/index.html')).href); await p.waitForTimeout(3500);
  const estado = await p.evaluate(() => ({
    fuente: document.fonts.check('16px Cinzel'),
    css: getComputedStyle(document.body).backgroundColor,
    hero: document.querySelector('.hero img').naturalWidth,
  }));
  console.log('file:// index', estado);
  await p.click('[data-boton-menu]'); await p.waitForTimeout(900);
  await p.click('.menu__item a[href="proceso.html"]'); await p.waitForURL('**/proceso.html'); await p.waitForTimeout(800);
  console.log('navegó a', p.url().split('/').pop(), 'marmol tarjetas:', await p.evaluate(() => getComputedStyle(document.querySelector('.menu__marmol')).backgroundImage.slice(0,60)));
  console.log('peticiones fallidas:', fallos.length ? fallos : 'ninguna', 'errores:', err.length ? err : 'ninguno');
  await b.close();
})();
