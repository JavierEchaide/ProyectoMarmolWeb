/* El menú se abre y no lo tapa nada en ninguna página.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const res = [];
  for (const p of ['index', 'teaser', 'historia', 'proceso']) {
    await page.goto(`${BASE}/${p}.html`);
    await page.waitForTimeout(p === 'index' ? 3300 : 1200);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.4));
    await page.waitForTimeout(600);
    await page.click('[data-boton-menu]');
    await page.waitForTimeout(1100);
    // ¿qué hay encima en varios puntos del menú?
    const tapan = await page.evaluate(() => {
      const fuera = [];
      for (const [x, y] of [[200, 300], [700, 450], [1100, 300], [1300, 800], [400, 800]]) {
        const e = document.elementFromPoint(x, y);
        if (e && !e.closest('.menu, .cabecera')) fuera.push(e.className.baseVal ?? e.className);
      }
      return fuera;
    });
    await page.screenshot({ path: `${SALIDA}/menu3-${p}.png` });
    res.push(p + ': ' + (tapan.length ? 'TAPADO por ' + tapan.join(', ') : 'ok'));
    await page.keyboard.press('Escape');
  }
  console.log(res.join('\n'));
  await b.close();
})();
