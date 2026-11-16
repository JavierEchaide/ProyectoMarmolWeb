/* Busto 3D de "Hecho por": comprueba que el .glb carga sin errores, que
   sustituye a las esferas y hace capturas cerrado / a medias / abierto en
   ordenador y móvil. Necesita la web servida en BASE (por defecto
   http://localhost:4400). Sin tarjeta gráfica va lento (render por software):
   por eso las esperas son largas. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  let ok = true;
  for (const [nombre, vp] of [['esc', { width: 1440, height: 900 }], ['mov', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errores = [];
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    page.on('pageerror', (e) => errores.push(e.message));
    const glb = [];
    page.on('response', (r) => { if (r.url().endsWith('.glb')) glb.push(r.status()); });
    await page.goto(`${BASE}/index.html`);
    await page.waitForTimeout(3500);
    const sec = await page.evaluate(() => {
      const s = document.querySelector('[data-busto]');
      const r = s.getBoundingClientRect();
      return { top: r.top + window.scrollY, alto: r.height };
    });
    // entrar en la sección y esperar a que cargue el modelo
    await page.evaluate((y) => window.scrollTo(0, y), sec.top - 300);
    await page.waitForTimeout(1500);
    await page.evaluate((y) => window.scrollTo(0, y), sec.top);
    await page.waitForTimeout(9000);
    const recorrido = sec.alto - vp.height;
    for (const [etiqueta, p] of [['cerrado', 0], ['medio', 0.35], ['abierto', 0.8]]) {
      await page.evaluate((y) => window.scrollTo(0, y), sec.top + recorrido * p);
      await page.waitForTimeout(7000);
      await page.screenshot({ path: `${SALIDA}/busto-${nombre}-${etiqueta}.png`, timeout: 150000 });
    }
    const estado = await page.evaluate(() => getComputedStyle(document.querySelector('[data-busto]')).getPropertyValue('--apertura'));
    console.log(nombre, 'glb:', glb.join(',') || 'no pedido', '| apertura final:', estado.trim(), '| errores:', errores.length ? errores : 'ninguno');
    if (!glb.includes(200) || errores.length) ok = false;
    await ctx.close();
  }
  await browser.close();
  console.log('busto', ok);
})();
