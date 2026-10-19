/* SPOILER: destapar todos, alturas, volver a taparlos y romper uno; también con "reducir movimiento".
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
// Mostrar todos -> Volver a taparlos -> volver a romper una; y movimiento reducido
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const reducido of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reducido ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const err = [];
    page.on('pageerror', (e) => err.push(e.message));
    await page.goto(BASE + '/historia.html');
    await page.waitForTimeout(500);
    const estado = () => page.evaluate(() => [...document.querySelectorAll('.spoiler--activo')].map((s) => s.dataset.spoiler + (s.classList.contains('destapado') ? '+' : '')).join(','));
    await page.click('[data-spoiler-todos]');
    await page.waitForTimeout(3200);
    const a = await estado();
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.spoiler--activo .spoiler__contenido')].map((c) => c.offsetHeight).join(','));
    await page.click('[data-spoiler-todos]');
    await page.waitForTimeout(1200);
    const b2 = await estado();
    const visibles = await page.evaluate(() => [...document.querySelectorAll('.spoiler--activo .spoiler__tapa')].map((t) => getComputedStyle(t).display + '/' + getComputedStyle(t.querySelector('.spoiler__cara')).visibility).join(','));
    await page.locator('.spoiler--activo').first().locator('.spoiler__tapa').click();
    await page.waitForTimeout(2600);
    const c = await estado();
    const boton = await page.textContent('[data-spoiler-todos]');
    console.log(reducido ? 'REDUCIDO' : 'NORMAL', '\n tras mostrar:', a, '\n alturas:', alturas, '\n tras tapar:', b2, '\n tapas:', visibles, '\n tras romper 1:', c, '\n boton:', boton, '\n errores:', err.length ? err : 'ninguno');
    await ctx.close();
  }
  await b.close();
})();
