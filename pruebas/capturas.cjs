/* Capturas de página entera de las cuatro páginas en ordenador (1440) y móvil (390).
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
const base = BASE;
const out = SALIDA;
const paginas = (process.env.PAGINAS || 'index,teaser,historia,proceso').split(',');
(async () => {
  const browser = await chromium.launch();
  for (const [nombre, vp] of [['esc', { width: 1440, height: 900 }], ['mov', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errores = [];
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    page.on('pageerror', (e) => errores.push(e.message));
    for (const p of paginas) {
      await page.goto(`${base}/${p}.html`);
      await page.waitForTimeout(p === 'index' ? 3400 : 1200);
      // recorre la página para disparar las apariciones
      const h = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < h; y += 500) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(60); }
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SALIDA}/${p}-${nombre}.png`, fullPage: true });
    }
    console.log(nombre, 'errores:', errores.length ? errores : 'ninguno');
    await ctx.close();
  }
  await browser.close();
})();
