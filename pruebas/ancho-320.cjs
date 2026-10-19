/* Desbordes a 320 px de ancho: lista los elementos que se salen. Vale si "sw" es 320 (los que salen dentro de un overflow: hidden no cuentan).
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 320, height: 640 } });
  for (const p of ['index', 'teaser', 'historia', 'proceso']) {
    await page.goto(`${BASE}/${p}.html`);
    await page.waitForTimeout(3300);
    const r = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('body *').forEach((e) => {
        const r = e.getBoundingClientRect();
        if (r.right > innerWidth + 1 && r.width > 0) {
          let a = e, oculto = false;
          while (a && a !== document.body) { const cs = getComputedStyle(a); if (cs.position === 'fixed' || cs.visibility === 'hidden' || cs.display === 'none') oculto = true; a = a.parentElement; }
          if (!oculto) out.push(e.tagName.toLowerCase() + '.' + [...e.classList].join('.') + ' ' + Math.round(r.right));
        }
      });
      return { sw: document.documentElement.scrollWidth, out: out.slice(0, 8) };
    });
    console.log(p, JSON.stringify(r));
  }
  await b.close();
})();
