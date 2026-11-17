/* Portada V3: hero, gancho, escena de los cuatro fotogramas, estelas, Hecho
   por y precarga del busto. Necesita la web servida en BASE (por defecto
   http://localhost:4400) y Playwright con Chromium.
   Uso: BASE=http://localhost:4401 node pruebas/v3-portada.cjs */
const BASE = process.env.BASE || 'http://localhost:4400';
const { chromium } = require('playwright');

(async () => {
  const b = await chromium.launch();
  let fallos = 0;
  const ver = (nombre, ok, extra) => { if (!ok) fallos++; console.log(ok ? 'ok   ' : 'FALLA', nombre, extra === undefined ? '' : extra); };
  const abrir = async (vp, opciones) => {
    const ctx = await b.newContext(Object.assign({ viewport: vp }, opciones || {}));
    const p = await ctx.newPage();
    const errores = [];
    p.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    p.on('pageerror', (e) => errores.push(e.message));
    // Sin intro: como al llegar desde otra sala
    await p.addInitScript(() => { try { sessionStorage.setItem('marmol-transicion', '1'); } catch (e) {} });
    return { ctx, p, errores };
  };

  /* Escritorio */
  {
    const { ctx, p, errores } = await abrir({ width: 1440, height: 900 });
    const glb = [];
    p.on('response', (r) => { if (r.url().endsWith('.glb')) glb.push(r.status()); });
    await p.goto(`${BASE}/index.html`);
    await p.waitForTimeout(2500);
    ver('1440: sin desborde horizontal', await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ver('precarga: el .glb se pide al entrar, sin bajar', glb.includes(200), glb.join(','));
    ver('hero a sangre bajo la cabecera', await p.evaluate(() => document.querySelector('[data-frontis]').getBoundingClientRect().top <= 0));
    ver('gancho: dos líneas, la segunda en rojo', await p.evaluate(() => document.querySelectorAll('.gancho__linea').length === 2 && !!document.querySelector('.gancho__linea--roja')));
    ver('botón "Ver el teaser"', await p.evaluate(() => { const a = document.querySelector('.gancho .boton--principal'); return a.textContent.trim() === 'Ver el teaser' && a.getAttribute('href') === 'teaser.html'; }));

    // Luz rasante: sigue al ratón
    const antes = await p.evaluate(() => getComputedStyle(document.querySelector('[data-frontis]')).getPropertyValue('--lx'));
    await p.mouse.move(200, 600, { steps: 4 });
    await p.waitForTimeout(900);
    const despues = await p.evaluate(() => getComputedStyle(document.querySelector('[data-frontis]')).getPropertyValue('--lx'));
    ver('luz rasante sigue al ratón', antes.trim() !== despues.trim(), `${antes.trim()} -> ${despues.trim()}`);

    // Escena de los cuatro fotogramas
    ver('cuatro fotogramas: escena fijada', await p.evaluate(() => document.querySelector('[data-cuatro]').classList.contains('cuatro--escena')));
    const cuatro = await p.evaluate(() => { const c = document.querySelector('[data-cuatro]'); const r = c.getBoundingClientRect(); return { top: r.top + window.scrollY, alto: r.height }; });
    const vistos = [];
    for (const k of [0.02, 0.3, 0.55, 0.8, 0.98]) {
      await p.evaluate((y) => window.scrollTo(0, y), cuatro.top - 64 + (cuatro.alto - 836) * k);
      await p.waitForTimeout(250);
      vistos.push(await p.evaluate(() => [...document.querySelectorAll('[data-cuatro-fotograma]')].findIndex((f) => f.classList.contains('es-actual'))));
    }
    ver('cuatro fotogramas: cambia de I a IV al bajar', vistos.join() === '0,1,2,3,3', vistos.join());

    // Estelas
    await p.evaluate(() => document.querySelector('[data-estelas]').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await p.waitForTimeout(1500);
    const destinos = await p.evaluate(() => [...document.querySelectorAll('[data-estela]')].map((a) => a.getAttribute('href')));
    ver('tres estelas a sus salas', destinos.join() === 'teaser.html,historia.html,proceso.html', destinos.join());
    ver('la del centro es más alta', await p.evaluate(() => { const l = [...document.querySelectorAll('.estela__losa')].map((e) => e.offsetHeight); return l[1] > l[0] && l[1] > l[2]; }));
    const caja = await (await p.$$('[data-estela]'))[1].boundingBox();
    await p.mouse.move(caja.x + caja.width * 0.8, caja.y + caja.height * 0.3, { steps: 5 });
    await p.waitForTimeout(700);
    const inclinada = await p.evaluate(() => document.querySelectorAll('[data-estela-cuerpo]')[1].style.transform);
    ver('la estela se inclina hacia el cursor', /rotateY\(([1-9]|\d\d)/.test(inclinada), inclinada);
    ver('hover estable sobre la estela', await p.evaluate(() => document.querySelectorAll('[data-estela]')[1].matches(':hover')));
    await p.mouse.move(5, 5);

    // Hecho por: rombos que avanzan con el scroll
    const rec = await p.evaluate(() => { const r = document.querySelector('[data-busto]').getBoundingClientRect(); return { top: r.top + window.scrollY, alto: r.height }; });
    const pasos = [];
    for (const k of [0, 0.4, 0.95]) {
      await p.evaluate((y) => window.scrollTo(0, y), rec.top + (rec.alto - 900) * k);
      await p.waitForTimeout(300);
      pasos.push(await p.evaluate(() => document.querySelector('[data-busto]').getAttribute('data-paso')));
    }
    ver('rombos de estado: cerrada, se abre, abierta', pasos.join() === '0,1,2', pasos.join());
    ver('nombre grabado en el pedestal', await p.evaluate(() => /Javier Echaide/.test(document.querySelector('.autor__plinto').textContent)));
    ver('1440: sin errores de consola', errores.length === 0, errores.length ? errores : '');
    await ctx.close();
  }

  /* Móvil y 320 */
  for (const ancho of [390, 320]) {
    const { ctx, p, errores } = await abrir({ width: ancho, height: ancho === 390 ? 844 : 640 }, { hasTouch: true, isMobile: true });
    await p.goto(`${BASE}/index.html`);
    await p.waitForTimeout(1500);
    ver(`${ancho}: sin desborde horizontal`, await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    ver(`${ancho}: fotogramas en lista`, await p.evaluate(() => !document.querySelector('[data-cuatro]').classList.contains('cuatro--escena')));
    ver(`${ancho}: estelas una debajo de otra`, await p.evaluate(() => { const t = [...document.querySelectorAll('[data-estela]')].map((e) => e.getBoundingClientRect().top); return t[0] < t[1] && t[1] < t[2]; }));
    ver(`${ancho}: sin errores de consola`, errores.length === 0, errores.length ? errores : '');
    await ctx.close();
  }

  /* Sin el modelo (404): se queda la silueta de respaldo y el código no da errores.
     (La línea "Failed to load resource" la escribe el propio navegador.) */
  {
    const { ctx, p, errores } = await abrir({ width: 1440, height: 900 });
    await p.route('**/*.glb', (r) => r.fulfill({ status: 404, body: '' }));
    await p.goto(`${BASE}/index.html`);
    await p.waitForTimeout(4000);
    const propios = errores.filter((e) => !/Failed to load resource/.test(e));
    ver('sin .glb: se queda el respaldo', await p.evaluate(() => !document.querySelector('[data-busto]').classList.contains('autor--3d') && getComputedStyle(document.querySelector('.autor__respaldo')).opacity === '1'));
    ver('sin .glb: sin errores propios en consola', propios.length === 0, propios.length ? propios : '');
    await ctx.close();
  }

  await b.close();
  console.log(fallos ? `v3-portada: ${fallos} fallo(s)` : 'v3-portada: todo bien');
  process.exit(fallos ? 1 : 0);
})();
