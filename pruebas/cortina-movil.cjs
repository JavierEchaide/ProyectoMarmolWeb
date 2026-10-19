/* Transición en móvil: la placa sube, sin esquirlas; y cursor normal.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  const err = [];
  page.on('pageerror', (e) => err.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
  await page.goto(BASE + '/teaser.html');
  await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('.siguiente a').scrollIntoView());
  await page.tap('.siguiente a');
  const t0 = Date.now();
  for (const t of [300, 700, 1100, 1600]) {
    const e = t - (Date.now() - t0); if (e > 0) await page.waitForTimeout(e);
    const s = await page.evaluate(() => { const c = document.querySelector('.cortina'); return c ? c.className + ' ' + getComputedStyle(c).transform : 'sin cortina'; });
    const n = await page.evaluate(() => document.querySelectorAll('.esquirla, [class*=esquirla]').length);
    console.log(t, await page.evaluate(() => location.pathname), s, 'esquirlas:', n);
    await page.screenshot({ path: `${SALIDA}/cmov-${t}.png` });
  }
  const cur = await page.evaluate(() => [getComputedStyle(document.body).cursor, getComputedStyle(document.querySelector('a')).cursor]);
  console.log('cursor', cur, err);
  await b.close();
})();
