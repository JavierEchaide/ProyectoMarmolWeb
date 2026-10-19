/* Transición entre páginas en ordenador (placa que se agrieta): capturas a lo largo del tiempo.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const err = [];
  page.on('pageerror', (e) => err.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.goto(BASE + '/teaser.html');
  await page.waitForTimeout(1200);
  await page.click('.siguiente a');
  const t0 = Date.now();
  const marcas = [200, 450, 1000, 1300, 1600, 1900, 2400];
  for (const t of marcas) {
    const espera = t - (Date.now() - t0);
    if (espera > 0) await page.waitForTimeout(espera);
    await page.screenshot({ path: `${SALIDA}/cortina-${t}.png` });
  }
  const fin = await page.evaluate(() => ({ url: location.pathname, clases: document.documentElement.className }));
  console.log(fin, err);
  await b.close();
})();
