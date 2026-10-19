/* axe-core en las cuatro páginas, en ordenador y móvil. No debe listar nada debajo de cada página.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
(async () => {
  const b = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await b.newPage({ viewport: vp, reducedMotion: 'reduce' });
    for (const pg of ['index', 'teaser', 'historia', 'proceso']) {
      await p.goto(`${BASE}/${pg}.html`); await p.waitForTimeout(1500);
      await p.addScriptTag({ content: axe });
      const r = await p.evaluate(async () => { const res = await axe.run(document, { resultTypes: ['violations'] }); return res.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, ej: v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' :: ' + (n.any[0]?.message || '').slice(0, 110)) })); });
      console.log(`== ${pg} ${vp.width}`); r.forEach(v => console.log(' ', v.impact, v.id, 'x' + v.n, '\n    ' + v.ej.join('\n    ')));
    }
    await p.close();
  }
  await b.close();
})();
