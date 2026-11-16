/* III · Historia (V3): cabecera, sumario (fijo y scrollspy), doble página,
   capítulos con lomo, SPOILER que tapa imagen y texto, final y desbordes.
   Guarda capturas de la página entera (tapada y destapada) en 1440 y 390.
   Uso: BASE=http://localhost:4403 node pruebas/v3-historia.cjs
   Necesita la web servida en BASE (por defecto http://localhost:4400) y
   Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  let fallos = 0;
  const ver = (nombre, ok, extra = '') => { if (!ok) fallos++; console.log((ok ? '  ok  ' : ' FALLA ') + nombre + (extra ? ' · ' + extra : '')); };
  // Las piezas con [data-revelar] aparecen al hacer scroll: para la captura se fuerzan
  const forzar = (p) => p.addStyleTag({ content: '[data-revelar]{opacity:1!important;transform:none!important;filter:none!important}' });
  const bajar = async (p) => {
    const alto = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < alto; y += 600) { await p.evaluate((v) => window.scrollTo(0, v), y); await p.waitForTimeout(60); }
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(150);
  };

  for (const [ancho, alto] of [[1440, 900], [390, 844], [320, 640]]) {
    const ctx = await b.newContext({ viewport: { width: ancho, height: alto } });
    const p = await ctx.newPage();
    const err = [];
    p.on('pageerror', (e) => err.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
    await p.goto(BASE + '/historia.html'); await p.waitForTimeout(500);
    console.log(`--- ${ancho}×${alto}`);
    ver('sin desborde horizontal', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ver('h1 HISTORIA fuera del mármol (franja lisa)', await p.evaluate(() => { const h = document.querySelector('h1'); return /historia/i.test(h.textContent) && !h.closest('[data-ventana]') && !!h.closest('.hist-canto'); }));
    ver('h1 cabe en la franja', await p.evaluate(() => { const h = document.querySelector('h1'); const r = document.createRange(); r.selectNodeContents(h); return r.getBoundingClientRect().right <= window.innerWidth; }));
    ver('sumario: 8 entradas, 5 tapadas', await p.evaluate(() => document.querySelectorAll('[data-sumario] a').length === 8 && document.querySelectorAll('[data-sumario] a[data-tapado]').length === 5));
    ver('spoilers: 5 tapados e inert', await p.evaluate(() => { const s = [...document.querySelectorAll('.spoiler--activo')]; return s.length === 5 && s.every((x) => x.dataset.spoiler === 'tapado' && x.querySelector('.spoiler__contenido').inert); }));
    ver('la losa tapa imagen y texto', await p.evaluate(() => [...document.querySelectorAll('.hist-capitulo .spoiler--activo')].every((s) => s.querySelector('.spoiler__contenido .imagen') && s.querySelector('.spoiler__contenido h3') && !s.closest('.hist-capitulo').querySelector('.hist-capitulo__margen .spoiler'))));
    ver('lomo: veta gris, roja y de oro', await p.evaluate(() => ['pura', 'rota', 'oro'].every((c) => document.querySelector('.hist-lomo .hist-lomo__' + c))));
    ver('lomo en el margen izquierdo', await p.evaluate(() => { const n = document.querySelector('[data-lomo-nodo]').getBoundingClientRect(); const c = document.querySelector('.hist-capitulo__cuerpo').getBoundingClientRect(); return n.right < c.left + 4; }));
    if (ancho === 1440) {
      // Sumario fijo bajo la cabecera y capítulo actual en rojo
      await p.evaluate(() => document.getElementById('parte-ii').scrollIntoView()); await p.waitForTimeout(400);
      ver('sumario fijo bajo la cabecera', await p.evaluate(() => { const r = document.querySelector('[data-sumario]').getBoundingClientRect(); return Math.abs(r.top - 64) < 2; }));
      ver('sumario marca la parte II', await p.evaluate(() => { const a = document.querySelector('[data-sumario] a[aria-current]'); return a && a.getAttribute('href') === '#parte-ii'; }));
      ver('una sola entrada marcada', await p.evaluate(() => document.querySelectorAll('[data-sumario] a[aria-current]').length === 1));
      ver('las imágenes alternan de lado', await p.evaluate(() => { const x = [...document.querySelectorAll('.hist-capitulo')].slice(0, 2).map((c) => c.querySelector('.hist-fila__imagen').getBoundingClientRect().left - c.querySelector('.hist-fila__texto').getBoundingClientRect().left); return x[0] < 0 && x[1] > 0; }));
      await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(200);
    } else {
      ver('sumario sin fijar en móvil', await p.evaluate(() => getComputedStyle(document.querySelector('[data-sumario]')).position === 'static'));
    }
    if (ancho !== 320) {
      await forzar(p); await bajar(p);
      await p.screenshot({ path: `${SALIDA}/v3-historia-${ancho}-tapada.png`, fullPage: true });
      // Romper una: el sumario cambia el rombo por el numeral
      await p.locator('#parte-iii [data-spoiler-tapa]').click(); await p.waitForTimeout(2500);
      ver('parte III destapada y sumario al día', await p.evaluate(() => document.querySelector('#parte-iii .spoiler').dataset.spoiler === 'destapado' && !document.querySelector('[data-sumario] a[href="#parte-iii"]').hasAttribute('data-tapado') && !document.querySelector('#parte-iii .spoiler__contenido').inert));
      await p.click('[data-spoiler-todos]'); await p.waitForTimeout(3600);
      ver('mostrar todos: todo destapado, sin rombos', await p.evaluate(() => [...document.querySelectorAll('.spoiler--activo')].every((s) => s.dataset.spoiler === 'destapado') && !document.querySelector('[data-sumario] a[data-tapado]') && document.querySelector('[data-spoiler-todos]').disabled));
      ver('final: cita entre dos costuras de oro', await p.evaluate(() => { const c = document.querySelector('.hist-final__cuerpo'); return c.querySelectorAll('.hist-costura').length === 2 && c.querySelector('.hist-final__cita').offsetHeight > 0; }));
      ver('sin desborde horizontal (destapado)', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
      await bajar(p);
      await p.screenshot({ path: `${SALIDA}/v3-historia-${ancho}-destapada.png`, fullPage: true });
    }
    ver('sin errores de consola', !err.length, err.join(' | '));
    await ctx.close();
  }
  await b.close();
  console.log(fallos ? `\n${fallos} comprobaciones fallan` : '\nTodo correcto');
  process.exit(fallos ? 1 : 0);
})();
