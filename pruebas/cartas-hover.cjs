/* Cartas de "Las páginas": el hover no parpadea con el ratón quieto cerca de los bordes (16/16 en cada punto).
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const err = []; p.on('pageerror', e => err.push(e.message));
  await p.goto(BASE + '/index.html');
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('[data-cartas]').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(1500);
  const sel = process.argv[3] || '.carta__enlace';
  let malos = 0;
  for (const c of (process.argv[4] || "0,1,2").split(",").map(Number)) {
    const r = await (await p.$$(sel))[c].boundingBox();
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const pts = { arriba: [cx, r.y + r.height * 0.08], abajo: [cx, r.y + r.height * 0.9], izq: [r.x + r.width * 0.08, cy], der: [r.x + r.width * 0.92, cy] };
    const fila = [];
    for (const [n, [x, y]] of Object.entries(pts)) {
      await p.mouse.move(5, 5); await p.waitForTimeout(150);
      await p.mouse.move(x, y, { steps: 6 });
      let si = 0;
      for (let k = 0; k < 16; k++) { await p.mouse.move(x, y); si += await p.evaluate(([s, c]) => document.querySelectorAll(s)[c].matches(':hover'), [sel, c]); await p.waitForTimeout(120); }
      if (si < 16) malos++;
      fila.push(n + ' ' + si + '/16');
    }
    console.log('carta', c + 1, fila.join(' · '));
  }
  console.log('fallos:', malos, err);
  await b.close();
})();
