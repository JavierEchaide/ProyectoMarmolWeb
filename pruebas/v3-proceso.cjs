/* V3 · IV Proceso: regla de 35 semanas, placas, método fijado, veta del
   calendario, archivo con filtros, sin desborde y sin JavaScript.
   Uso: BASE=http://localhost:4400 node pruebas/v3-proceso.cjs */
const BASE = process.env.BASE || 'http://localhost:4400';
const { chromium } = require('playwright');
let fallos = 0;
const ver = (nombre, ok) => { console.log((ok ? 'ok    ' : 'FALLO ') + nombre); if (!ok) fallos++; };
(async () => {
  const b = await chromium.launch();
  const err = [];
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type() === 'error' && err.push(m.text()));
  await p.goto(BASE + '/proceso.html'); await p.waitForTimeout(800);

  ver('cabecera monumental con numeral hueco', await p.evaluate(() => !!document.querySelector('h1.monumental') && document.querySelector('.numeral-hueco').getAttribute('aria-hidden') === 'true'));
  ver('regla: 35 marcas, una actual y una marca larga por bloque', await p.evaluate(() => document.querySelectorAll('.regla__marca').length === 35 && document.querySelectorAll('.regla__marca--actual').length === 1 && document.querySelectorAll('.regla__marca--bloque').length === document.querySelectorAll('.calveta__bloque').length));
  ver('regla: la actual es roja y la más alta', await p.evaluate(() => {
    const alto = (e) => parseFloat(getComputedStyle(e, '::before').height);
    const a = document.querySelector('.regla__marca--actual');
    return getComputedStyle(a, '::before').backgroundColor === 'rgb(139, 38, 38)' && [...document.querySelectorAll('.regla__marca')].every((m) => alto(m) <= alto(a));
  }));
  ver('índice de placas fijo con plomada', await p.evaluate(() => getComputedStyle(document.querySelector('.placas')).position === 'sticky' && !!document.querySelector('.placas__pesa') && document.querySelectorAll('.placas__placa').length === 5));

  // Método fijado: al bajar cambia el paso activo, el contador y la regla
  ver('método: fijado en escritorio con 8 estaciones', await p.evaluate(() => document.querySelector('[data-metodo]').classList.contains('recorrido--fijado') && document.querySelectorAll('[data-metodo-paso]').length === 8));
  const activo = () => p.evaluate(() => [...document.querySelectorAll('[data-metodo-paso]')].findIndex((e) => e.classList.contains('estacion--activa')) + ':' + document.querySelector('[data-metodo-contador]').textContent);
  await p.evaluate(() => { const e = document.querySelector('[data-metodo]'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY + (e.offsetHeight - innerHeight) * 0.55); });
  await p.waitForTimeout(500);
  const medio = await activo();
  ver('método: a mitad de recorrido el paso activo es intermedio (' + medio + ')', /^[3-5]:0[4-6]$/.test(medio));
  ver('método: la caja sigue fijada y la captura activa se ve', await p.evaluate(() => { const f = document.querySelector('.recorrido__fijo').getBoundingClientRect(); const c = document.querySelector('.estacion--activa .estacion__captura'); return f.top >= 0 && f.top < 120 && getComputedStyle(c).visibility === 'visible'; }));
  await p.locator('.estacion__boton').nth(7).click(); await p.waitForTimeout(1500);
  ver('método: pulsar la estación 8 lleva a su paso', (await activo()) === '7:08');
  ver('dato de render sale de proceso.render', await p.evaluate(() => /57 s/.test(document.querySelector('.medida').textContent) && /768 fotogramas/.test(document.querySelector('.medida').textContent) && /12,2 h/.test(document.querySelector('.medida').textContent)));
  ver('referencias: cajones con diálogo', await p.evaluate(() => document.querySelectorAll('.cajon').length === 8 && document.querySelectorAll('.cajon [data-abrir-dialogo]').length > 0));

  // Archivo: filtros con aria-pressed
  await p.evaluate(() => document.getElementById('archivo').scrollIntoView({ block: 'start', behavior: 'instant' })); await p.waitForTimeout(300);
  const vistas = () => p.evaluate(() => [...document.querySelectorAll('.coleccion__pieza')].filter((e) => !e.hidden).map((e) => e.dataset.tipo));
  const total = (await vistas()).length;
  await p.click('[data-filtro-tipo="fallos"]');
  const soloFallos = await vistas();
  ver('archivo: filtrar por tipo', soloFallos.length > 0 && soloFallos.length < total && soloFallos.every((t) => t === 'fallos') && await p.evaluate(() => document.querySelector('[data-filtro-tipo="fallos"]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-filtro-tipo=""]').getAttribute('aria-pressed') === 'false'));
  await p.click('[data-filtro-tipo=""]');
  ver('archivo: "Todo" las devuelve todas', (await vistas()).length === total);
  const hayBloque = await p.locator('[data-filtro-bloque]:not([data-filtro-bloque=""])').count();
  if (hayBloque) {
    await p.locator('[data-filtro-bloque]:not([data-filtro-bloque=""])').first().click();
    ver('archivo: filtrar por bloque', await p.evaluate(() => { const b = document.querySelector('[data-filtro-bloque][aria-pressed="true"]').dataset.filtroBloque; const v = [...document.querySelectorAll('.coleccion__pieza')].filter((e) => !e.hidden); return v.length > 0 && v.every((e) => e.dataset.bloque === b); }));
  }
  ver('puerta de vuelta a la portada', await p.evaluate(() => !!document.querySelector('.puerta, [class*="siguiente"]')));
  await p.close();

  // Sin desborde horizontal
  for (const w of [1440, 1100, 390, 320]) {
    const q = await b.newPage({ viewport: { width: w, height: 844 } });
    q.on('pageerror', e => err.push(e.message));
    await q.goto(BASE + '/proceso.html'); await q.waitForTimeout(400);
    ver(`sin desborde horizontal a ${w}`, await q.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (w === 390) {
      ver('móvil: método sin fijar y placas en fila', await q.evaluate(() => !document.querySelector('[data-metodo]').classList.contains('recorrido--fijado') && getComputedStyle(document.querySelector('.placas')).position === 'static' && getComputedStyle(document.querySelector('.estacion__detalle')).display !== 'none'));
      ver('móvil: nada por debajo de 13 px', await q.evaluate(() => [...document.querySelectorAll('main *')].every((e) => !e.childNodes.length || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || parseFloat(getComputedStyle(e).fontSize) >= 13)));
    }
    await q.close();
  }

  // Movimiento reducido: el método no se fija
  const r = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
  await r.goto(BASE + '/proceso.html'); await r.waitForTimeout(400);
  ver('movimiento reducido: método en lista', await r.evaluate(() => !document.querySelector('[data-metodo]').classList.contains('recorrido--fijado')));

  // Sin JavaScript: todas las piezas, sin filtros, semanas con ancla y método en lista
  const s = await (await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false })).newPage();
  await s.goto(BASE + '/proceso.html');
  ver('sin JS: todas las piezas visibles y filtros ocultos', await s.locator('.coleccion__pieza:visible').count() === await s.locator('.coleccion__pieza').count() && await s.locator('[data-filtros]').isHidden());
  ver('sin JS: 35 semanas con ancla y método en lista', await s.locator('.calveta__semana[id^="s"]').count() === 35 && await s.locator('.estacion__detalle:visible').count() === 8);

  ver('sin errores de consola', err.length === 0); if (err.length) console.log(err);
  await b.close();
  process.exit(fallos ? 1 : 0);
})();
