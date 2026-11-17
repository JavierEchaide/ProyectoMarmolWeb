/* V2: indicador de sala y aria-current, atajos de teclado, carrusel, rima,
   nebulosa, "Leer más", ventana de Historia, índice y calendario de Proceso y
   reproductor de música. Todas las líneas deben acabar en true.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". */
const BASE = process.env.BASE || 'http://localhost:4400';
const { chromium } = require('playwright');
const fallos = [];
const ver = (nombre, ok, extra = '') => { console.log(`${ok ? 'true ' : 'FALLO'} ${nombre}${extra ? ' · ' + extra : ''}`); if (!ok) fallos.push(nombre); };
const SALAS = [['index', 'portada', 'Sala I de IV: Portada'], ['teaser', 'teaser', 'Sala II de IV: Teaser'], ['historia', 'historia', 'Sala III de IV: Historia'], ['proceso', 'proceso', 'Sala IV de IV: Proceso']];
(async () => {
  const b = await chromium.launch();
  const err = [];
  const nueva = async (opciones = {}) => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', ...opciones });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => err.push(e.message));
    return p;
  };

  // --- Indicador y aria-current, en ordenador y en móvil
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const p = await nueva({ viewport: vp });
    for (const [archivo, sala, nombre] of SALAS) {
      await p.goto(`${BASE}/${archivo}.html`); await p.waitForTimeout(archivo === 'index' ? 2300 : 400);
      const r = await p.evaluate(() => {
        const i = document.querySelector('[data-indicador]');
        const caja = i.getBoundingClientRect();
        return {
          sala: document.body.dataset.sala,
          texto: i.querySelector('.oculto').textContent.trim(),
          nodos: i.querySelectorAll('.indicador__nodo').length,
          actuales: i.querySelectorAll('.indicador__nodo--actual').length,
          actual: [...document.querySelectorAll('.menu__item a')].filter((a) => a.getAttribute('aria-current') === 'page').map((a) => a.querySelector('.menu__titulo').textContent).join(),
          dentro: caja.left >= 0 && caja.right <= innerWidth && caja.width > 60,
        };
      });
      ver(`indicador ${sala} ${vp.width}`, r.sala === sala && r.texto === nombre && r.nodos === 4 && r.actuales === 1 && nombre.endsWith(r.actual) && r.dentro, r.texto);
      // al bajar sigue visible aunque la cabecera se esconda
      await p.mouse.wheel(0, 1400); await p.waitForTimeout(500);
      const visible = await p.evaluate(() => {
        const i = document.querySelector('[data-indicador]');
        const c = i.getBoundingClientRect();
        const cab = document.querySelector('.cabecera');
        // la cabecera se esconde (marca y botón fuera), pero no se desplaza: el indicador se queda
        return cab.classList.contains('cabecera--oculta') && c.top >= 0 && c.bottom <= innerHeight && c.width > 60 && getComputedStyle(cab).transform === 'none' && getComputedStyle(i).opacity === '1' && getComputedStyle(document.querySelector('.boton-menu')).opacity === '0';
      });
      ver(`indicador visible al bajar ${sala} ${vp.width}`, visible);
    }
    await p.context().close();
  }

  // --- Atajos
  {
    const p = await nueva();
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(400);
    await p.keyboard.press('m'); await p.waitForTimeout(200);
    ver('M abre el menú', await p.evaluate(() => document.documentElement.classList.contains('menu-abierto')));
    await p.keyboard.press('Escape'); await p.waitForTimeout(100);
    ver('Esc cierra el menú', await p.evaluate(() => !document.documentElement.classList.contains('menu-abierto')));
    await p.keyboard.press('m'); await p.keyboard.press('m'); await p.waitForTimeout(100);
    ver('M cierra el menú', await p.evaluate(() => !document.documentElement.classList.contains('menu-abierto')));
    await p.keyboard.press('Control+3'); await p.waitForTimeout(300);
    ver('Ctrl+3 no hace nada', p.url().endsWith('teaser.html'));
    await p.keyboard.press('3'); await p.waitForURL('**/historia.html', { timeout: 4000 }).catch(() => {});
    ver('3 lleva a Historia', p.url().endsWith('historia.html'));
    await p.waitForTimeout(300);
    await p.keyboard.press('4'); await p.waitForURL('**/proceso.html', { timeout: 4000 }).catch(() => {});
    ver('4 lleva a Proceso', p.url().endsWith('proceso.html'));
    await p.waitForTimeout(300);
    await p.keyboard.press('1'); await p.waitForURL('**/index.html', { timeout: 4000 }).catch(() => {});
    ver('1 lleva a la Portada', p.url().endsWith('index.html'));
    await p.waitForTimeout(300);
    await p.keyboard.press('2'); await p.waitForURL('**/teaser.html', { timeout: 4000 }).catch(() => {});
    ver('2 lleva al Teaser', p.url().endsWith('teaser.html'));
    await p.waitForTimeout(300);
    // no se disparan escribiendo en un campo de texto
    await p.evaluate(() => { const i = document.createElement('input'); i.id = 'campo-prueba'; i.setAttribute('aria-label', 'prueba'); document.querySelector('main').prepend(i); i.focus(); });
    await p.keyboard.type('3m'); await p.waitForTimeout(700);
    ver('escribir en un campo no dispara atajos', p.url().endsWith('teaser.html') && await p.evaluate(() => document.getElementById('campo-prueba').value === '3m' && !document.documentElement.classList.contains('menu-abierto')));
    await p.evaluate(() => document.getElementById('campo-prueba').remove());
    // ni con el visor abierto
    await p.locator('.carrusel__plano--actual [data-visor]').click(); await p.waitForTimeout(300);
    await p.keyboard.press('4'); await p.waitForTimeout(700);
    ver('con el visor abierto no hay atajos', p.url().endsWith('teaser.html') && await p.evaluate(() => document.querySelector('dialog.visor').open));
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    // interruptor
    await p.keyboard.press('m'); await p.waitForTimeout(200);
    await p.click('[data-atajos]');
    ver('interruptor apagado', await p.evaluate(() => document.querySelector('[data-atajos]').getAttribute('aria-checked') === 'false'));
    await p.keyboard.press('Escape'); await p.keyboard.press('4'); await p.keyboard.press('m'); await p.waitForTimeout(700);
    ver('con los atajos apagados no pasa nada', p.url().endsWith('teaser.html') && await p.evaluate(() => !document.documentElement.classList.contains('menu-abierto')));
    await p.goto(`${BASE}/historia.html`); await p.waitForTimeout(300);
    ver('la elección dura la sesión', await p.evaluate(() => document.querySelector('[data-atajos]').getAttribute('aria-checked') === 'false'));
    await p.context().close();
  }

  // --- Teaser: carrusel, rima y nebulosa
  {
    const p = await nueva({ reducedMotion: 'no-preference' });
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(500);
    const actual = () => p.evaluate(() => [...document.querySelectorAll('[data-carrusel-plano]')].findIndex((x) => x.classList.contains('carrusel__plano--actual')) + '/' + [...document.querySelectorAll('[data-carrusel-miniatura]')].findIndex((x) => x.getAttribute('aria-current') === 'true'));
    ver('carrusel: 12 planos', await p.evaluate(() => document.querySelectorAll('[data-carrusel-plano]').length === 12 && document.querySelectorAll('[data-carrusel-miniatura]').length === 12));
    await p.locator('[data-carrusel-miniatura]').nth(4).click(); await p.waitForTimeout(600);
    ver('carrusel: clic en miniatura', (await actual()) === '4/4');
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(100);
    await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(600);
    ver('carrusel: flechas con el foco dentro', (await actual()) === '5/5' && p.url().endsWith('teaser.html'));
    ver('carrusel: solo el actual es accesible', await p.evaluate(() => [...document.querySelectorAll('[data-carrusel-plano]')].filter((x) => !x.inert).length === 1));
    await p.evaluate(() => document.activeElement.blur());
    await p.keyboard.press('ArrowRight'); await p.waitForTimeout(300);
    ver('carrusel: sin foco las flechas no hacen nada', (await actual()) === '5/5');
    await p.locator('.carrusel__plano--actual [data-visor]').click(); await p.waitForTimeout(400);
    ver('carrusel: clic en el grande abre el visor', await p.evaluate(() => document.querySelector('dialog.visor').open));
    await p.keyboard.press('Escape');
    // rima
    await p.locator('[data-comparador-control]').focus();
    await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
    ver('rima: flechas mueven la línea', await p.evaluate(() => document.querySelector('[data-comparador]').style.getPropertyValue('--corte') === '52%'));
    ver('rima: planos 4 y 6 con sus etiquetas', await p.evaluate(() => [...document.querySelectorAll('.comparador__etiqueta')].map((e) => e.textContent).sort().join('|') === 'En el bosque|En la jaula'));
    // nebulosa: las capas se mueven a distinta velocidad (lejana < media < cercana)
    await p.evaluate(() => window.scrollTo(0, 1500)); await p.waitForTimeout(400);
    const y = await p.evaluate(() => [...document.querySelectorAll('[data-nebulosa-capa]')].map((c) => -new DOMMatrix(getComputedStyle(c).transform).m42));
    ver('nebulosa: tres capas a distinta velocidad', y.length === 3 && y[0] > 1 && y[0] < y[1] && y[1] < y[2], y.map((n) => n.toFixed(0)).join(' < '));
    ver('nebulosa por debajo del menú', await p.evaluate(() => getComputedStyle(document.querySelector('.nebulosa')).zIndex === '-1' && getComputedStyle(document.querySelector('.menu')).zIndex === '50'));
    await p.context().close();
    const q = await nueva(); // movimiento reducido
    await q.goto(`${BASE}/teaser.html`); await q.evaluate(() => window.scrollTo(0, 1500)); await q.waitForTimeout(400);
    ver('nebulosa quieta con movimiento reducido', await q.evaluate(() => [...document.querySelectorAll('[data-nebulosa-capa]')].every((c) => getComputedStyle(c).transform === 'none')));
    await q.context().close();
    const m = await nueva({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
    await m.goto(`${BASE}/teaser.html`); await m.evaluate(() => window.scrollTo(0, 1500)); await m.waitForTimeout(400);
    ver('nebulosa en móvil: dos capas y quietas', await m.evaluate(() => { const c = [...document.querySelectorAll('[data-nebulosa-capa]')]; return getComputedStyle(c[2]).display === 'none' && c.slice(0, 2).every((x) => getComputedStyle(x).transform === 'none'); }));
    ver('portada: botón "Ver el teaser"', await (async () => { await m.goto(`${BASE}/index.html`); await m.waitForTimeout(300); return m.evaluate(() => document.querySelector('.gancho .boton').textContent.trim() === 'Ver el teaser'); })());
    await m.context().close();
  }

  // --- Historia: leer más, ventana y terminología
  {
    const p = await nueva();
    await p.goto(`${BASE}/historia.html`); await p.waitForTimeout(400);
    const boton = p.locator('[data-leer-mas]').first();
    await boton.focus(); await p.keyboard.press('Enter');
    ver('leer más: abre con Enter', await p.evaluate(() => { const b = document.querySelector('[data-leer-mas]'); return b.getAttribute('aria-expanded') === 'true' && !document.getElementById(b.getAttribute('aria-controls')).hidden; }));
    await p.keyboard.press('Space');
    ver('leer más: cierra con Espacio', await p.evaluate(() => { const b = document.querySelector('[data-leer-mas]'); return b.getAttribute('aria-expanded') === 'false' && document.getElementById(b.getAttribute('aria-controls')).hidden; }));
    const v = p.locator('[data-ventana-boton]');
    await v.focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    const abierta = await p.evaluate(() => document.querySelector('[data-ventana-boton]').getAttribute('aria-pressed') === 'true' && /polygon/.test(document.querySelector('[data-ventana-mundo]').style.clipPath) && document.querySelector('[data-ventana-borde] path').getBBox().width > 20);
    ver('ventana: se abre con teclado', abierta);
    await v.click({ position: { x: 900, y: 200 } }); await p.waitForTimeout(200);
    ver('ventana: se cierra al pulsar otra vez', await p.evaluate(() => document.querySelector('[data-ventana-boton]').getAttribute('aria-pressed') === 'false' && document.querySelector('[data-ventana-borde] path').getBBox().width < 2));
    await v.click({ position: { x: 900, y: 200 } }); await p.waitForTimeout(200);
    ver('ventana: se abre con clic', await p.evaluate(() => document.querySelector('[data-ventana-borde] path').getBBox().width > 20));
    const dios = await p.evaluate(() => { const t = document.querySelector('main').textContent; return (t.match(/\bDios\b|\bdios\b/g) || []).length + '|' + /Attack on Titan/.test(t); });
    ver('"Dios" solo en la frase que lo explica y sin Attack on Titan', dios === '1|false', dios);
    for (const pg of ['index', 'teaser', 'proceso']) { await p.goto(`${BASE}/${pg}.html`); ver(`sin "Dios" en ${pg}`, await p.evaluate(() => !/\bdios\b/i.test(document.querySelector('main').textContent))); }
    await p.context().close();
  }

  // --- Proceso: orden, calendario, índice y registros
  {
    const p = await nueva();
    await p.goto(`${BASE}/proceso.html`); await p.waitForTimeout(500);
    ver('proceso: cinco secciones en orden', await p.evaluate(() => [...document.querySelectorAll('[data-indice-seccion]')].map((s) => s.id).join() === 'estado,desarrollo-visual,metodo,calendario,archivo'));
    ver('proceso: solo el bloque actual abierto', await p.evaluate(() => { const d = [...document.querySelectorAll('.calveta details')]; return d.filter((x) => x.open).length === 1 && d.findIndex((x) => x.open) === 1; }));
    ver('proceso: 35 semanas con ancla', await p.evaluate(() => document.querySelectorAll('.calveta__semana[id^="s"]').length === 35 && !!document.getElementById('s35')));
    await p.locator('[data-indice-semana]').nth(26).click(); await p.waitForTimeout(500);
    ver('índice: S27 abre su bloque y baja', await p.evaluate(() => { const s = document.getElementById('s27'); const r = s.getBoundingClientRect(); return location.hash === '#s27' && s.closest('details').open && r.top >= 0 && r.top < innerHeight; }));
    ver('índice: scrollspy marca Calendario', await p.evaluate(() => document.querySelector('[data-indice-enlace][aria-current="true"]')?.getAttribute('href') === '#calendario'));
    await p.goto(`${BASE}/proceso.html#s12`); await p.waitForTimeout(600);
    ver('enlace directo #s12', await p.evaluate(() => { const s = document.getElementById('s12'); const r = s.getBoundingClientRect(); return s.closest('details').open && r.top >= 0 && r.top < innerHeight; }));
    ver('índice lateral fijo en escritorio', await p.evaluate(() => getComputedStyle(document.querySelector('.placas')).position === 'sticky'));
    ver('referencias: 8 categorías con Narrativa', await p.evaluate(() => { const t = [...document.querySelectorAll('.cajon__titulo')].map((x) => x.textContent); return t.length === 8 && t.includes('Narrativa'); }));
    await p.goto(`${BASE}/proceso.html`); await p.waitForTimeout(300);
    await p.evaluate(() => { document.querySelector('.calveta details').open = true; });
    await p.locator('.calveta__ver').first().click(); await p.waitForURL('**/registro-s01.html', { timeout: 4000 }).catch(() => {});
    ver('ver registro lleva a registro-s01.html', p.url().endsWith('registro-s01.html') && await p.evaluate(() => document.body.dataset.sala === 'proceso' && /Registro S01/.test(document.querySelector('h1').textContent)));
    await p.context().close();
  }

  // --- Música
  {
    const p = await nueva();
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(400);
    const m = () => p.evaluate(() => { const b = document.querySelector('[data-musica-boton]'); return b.getAttribute('aria-pressed') + '|' + b.getAttribute('aria-label'); });
    ver('música: apagada al entrar', (await m()) === 'false|Música: activar');
    ver('música: crédito CC BY visible en el pie', await p.evaluate(() => { const c = document.querySelector('.pie .musica__credito'); c.scrollIntoView({ block: 'end' }); const r = c.getBoundingClientRect(); return /Darkness is Coming.*Kevin MacLeod.*incompetech\.com/.test(c.textContent) && c.querySelector('a').href === 'https://creativecommons.org/licenses/by/4.0/' && r.width > 0 && r.bottom <= innerHeight + 1; }));
    // pista de prueba (silencio) para no depender del MP3, que sube Javi
    const wav = 'data:audio/wav;base64,' + (() => { const n = 8000 * 30; const b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(8000, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b.toString('base64'); })();
    await p.evaluate((w) => { document.querySelector('[data-musica]').dataset.src = w; }, wav);
    await p.locator('[data-musica-boton]').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    ver('música: suena con Enter y la veta avanza', (await m()) === 'true|Música: silenciar' && await p.evaluate(() => parseFloat(document.querySelector('[data-musica]').style.getPropertyValue('--progreso')) > 0));
    ver('música: no gira con movimiento reducido', await p.evaluate(() => getComputedStyle(document.querySelector('.musica__disco')).animationName === 'none'));
    await p.keyboard.press('Space'); await p.waitForTimeout(200);
    ver('música: Espacio silencia', (await m()) === 'false|Música: activar');
    const guardado = await p.evaluate(() => JSON.parse(sessionStorage.getItem('marmol-musica')));
    ver('música: guarda { activo, posicion }', guardado.activo === false && guardado.posicion > 0.5, JSON.stringify(guardado));
    await p.context().close();
    const sinPista = await nueva();
    const e2 = []; sinPista.on('pageerror', (e) => e2.push(e.message));
    await sinPista.goto(`${BASE}/historia.html`); await sinPista.waitForTimeout(300);
    await sinPista.click('[data-musica-boton]'); await sinPista.waitForTimeout(900);
    ver('música: sin archivo vuelve a apagado sin errores de script', await sinPista.evaluate(() => document.querySelector('[data-musica-boton]').getAttribute('aria-pressed') === 'false') && !e2.length);
    await sinPista.context().close();
    const mov = await nueva({ viewport: { width: 390, height: 844 } });
    await mov.goto(`${BASE}/proceso.html`); await mov.waitForTimeout(300);
    ver('música en 390: en la cabecera, dentro de la pantalla y bajo el menú', await mov.evaluate(() => { const r = document.querySelector('.musica').getBoundingClientRect(); return !!document.querySelector('.cabecera .musica') && r.left >= 0 && r.right <= innerWidth && r.height <= 60 && +getComputedStyle(document.querySelector('.musica')).zIndex < 50; }));
    await mov.context().close();
  }

  console.log('errores de script:', err.length ? err : 'ninguno');
  console.log(fallos.length ? `FALLOS: ${fallos.length} -> ${fallos.join(' | ')}` : 'V2: todo correcto');
  await b.close();
  process.exit(fallos.length || err.length ? 1 : 0);
})();
