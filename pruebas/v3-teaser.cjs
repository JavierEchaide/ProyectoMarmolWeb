/* V3 · II Teaser: título a contraluz, franja de vídeo, cruzar la ventana
   (fijada al scroll; lista con movimiento reducido), carrusel de 12 con
   contador y flechas, rima, sin desbordes y nada por encima del menú.
   Todas las líneas deben acabar en true.
   Uso: BASE=http://localhost:4400 node pruebas/v3-teaser.cjs */
const BASE = process.env.BASE || 'http://localhost:4400';
const { chromium } = require('playwright');
const fallos = [];
const ver = (nombre, ok, extra = '') => { console.log(`${ok ? 'true ' : 'FALLO'} ${nombre}${extra ? ' · ' + extra : ''}`); if (!ok) fallos.push(nombre); };
(async () => {
  const b = await chromium.launch();
  const err = [];
  const nueva = async (opciones = {}) => {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', ...opciones });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => err.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error') err.push(m.text()); });
    return p;
  };
  const luminancia = (rgb) => { const [r, g, bl] = rgb.match(/[\d.]+/g).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };

  // --- Ordenador
  {
    const p = await nueva();
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(600);
    ver('hoja de la sala enlazada con ruta relativa', await p.evaluate(() => [...document.querySelectorAll('link[rel=stylesheet]')].some((l) => l.getAttribute('href') === 'css/sala-teaser.css')));
    const color = await p.evaluate(() => getComputedStyle(document.querySelector('.contraluz__titulo')).color);
    ver('título a contraluz: tinta oscura, con halo detrás', luminancia(color) < 0.05 && await p.evaluate(() => !!document.querySelector('.contraluz__halo') && document.querySelector('.contraluz__numeral').getAttribute('aria-hidden') === 'true'), color);
    ver('sin paneles blancos de la V2', await p.evaluate(() => document.querySelectorAll('main .panel').length === 0));
    ver('vídeo: no arranca solo', await p.evaluate(() => document.querySelectorAll('video[autoplay]').length === 0 && !document.querySelector('dialog.visor').open));
    ver('vídeo: 2.35:1 en franja oscura', await p.evaluate(() => { const v = document.querySelector('[data-reproductor]').getBoundingClientRect(); return Math.abs(v.width / v.height - 2.35) < 0.02 && v.width > innerWidth * 0.8 && !!document.querySelector('.pantalla.sala-oscura'); }));
    await p.click('[data-reproductor]'); await p.waitForTimeout(500);
    ver('vídeo: al pulsar crece en el visor', await p.evaluate(() => document.querySelector('dialog.visor').open));
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);

    // cruzar la ventana
    ver('cruce: activo y con lista oculta', await p.evaluate(() => document.querySelector('[data-cruce]').classList.contains('cruce--viva') && getComputedStyle(document.querySelector('.cruce__lista')).display === 'none'));
    const rec = await p.evaluate(() => { const r = document.querySelector('[data-cruce-recorrido]').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
    const estado = async (f) => {
      await p.evaluate((y) => window.scrollTo(0, y), rec.top - 64 + (rec.h - (900 - 64)) * f); await p.waitForTimeout(350);
      return p.evaluate(() => { const fj = document.querySelector('[data-cruce-fija]'); const pasos = [...document.querySelectorAll('[data-cruce-paso]')]; return { p: parseFloat(fj.style.getPropertyValue('--p')), top: Math.round(fj.getBoundingClientRect().top), paso: pasos.findIndex((x) => x.getAttribute('aria-current') === 'step'), escala: new DOMMatrix(getComputedStyle(document.querySelector('.cruce__escena .ventana-escena__ventana')).transform).a, bosque: parseFloat(getComputedStyle(document.querySelector('.cruce__escena .ventana-escena__bosque')).opacity), contador: document.querySelector('[data-cruce-contador]').textContent }; });
    };
    const a = await estado(0.02); const m = await estado(0.5); const z = await estado(0.98);
    ver('cruce: fijada bajo la cabecera', a.top === 64 && m.top === 64 && z.top === 64, [a.top, m.top, z.top].join(' '));
    ver('cruce: el avance sigue al scroll', a.p < 0.1 && Math.abs(m.p - 0.5) < 0.05 && z.p > 0.9, [a.p, m.p, z.p].join(' '));
    ver('cruce: la ventana crece y se sale al bosque', a.escala < 1.2 && m.escala > 2 && z.escala > 8 && a.bosque === 0 && z.bosque > 0.9, [a.escala.toFixed(2), m.escala.toFixed(2), z.escala.toFixed(2), z.bosque].join(' '));
    ver('cruce: tres cartelas y contador', a.paso === 0 && m.paso === 1 && z.paso === 2 && z.contador === '03 / 03');
    ver('cruce: nada por encima del menú', await p.evaluate(() => [...document.querySelectorAll('main *')].every((e) => { const zi = parseInt(getComputedStyle(e).zIndex, 10); return isNaN(zi) || zi < 50; })));

    // carrusel
    await p.locator('[data-carrusel]').scrollIntoViewIfNeeded();
    ver('carrusel: 12 huecos y contador', await p.evaluate(() => document.querySelectorAll('[data-carrusel-plano]').length === 12 && document.querySelector('[data-carrusel-contador]').textContent.trim() === '01 / 12'));
    await p.click('[data-carrusel-siguiente]'); await p.click('[data-carrusel-siguiente]'); await p.waitForTimeout(600);
    ver('carrusel: flechas y contador "03 / 12"', await p.evaluate(() => document.querySelector('[data-carrusel-contador]').textContent === '03 / 12' && [...document.querySelectorAll('[data-carrusel-plano]')].findIndex((x) => x.classList.contains('carrusel__plano--actual')) === 2));
    await p.click('[data-carrusel-anterior]'); await p.waitForTimeout(600);
    ver('carrusel: anterior', await p.evaluate(() => document.querySelector('[data-carrusel-contador]').textContent === '02 / 12'));
    ver('rima: comparador a casi todo el ancho', await p.evaluate(() => document.querySelector('.teaser-rima [data-comparador]').getBoundingClientRect().width > innerWidth * 0.8));
    ver('puerta a III · Historia', await p.evaluate(() => !!document.querySelector('main a[href="historia.html"], a.puerta[href="historia.html"]')));
    ver('sin desborde a 1440', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.context().close();
  }

  // --- Movimiento reducido: tres fotogramas en lista
  {
    const p = await nueva({ reducedMotion: 'reduce' });
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(400);
    ver('reducido: tres fotogramas fijos, sin escena fijada', await p.evaluate(() => !document.querySelector('[data-cruce]').classList.contains('cruce--viva') && getComputedStyle(document.querySelector('[data-cruce-recorrido]')).display === 'none' && [...document.querySelectorAll('.cruce__lista li')].filter((l) => l.getBoundingClientRect().height > 50).length === 3));
    await p.context().close();
  }

  // --- Móvil y 320
  for (const w of [390, 320]) {
    const p = await nueva({ viewport: { width: w, height: 844 }, hasTouch: true, isMobile: true });
    await p.goto(`${BASE}/teaser.html`); await p.waitForTimeout(500);
    ver(`sin desborde a ${w}`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    ver(`título dentro de la pantalla a ${w}`, await p.evaluate(() => { const r = document.querySelector('.contraluz__titulo').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1 + parseFloat(getComputedStyle(document.querySelector('.contraluz__titulo')).letterSpacing); }));
    if (w === 390) {
      ver('móvil: escena más corta y con 2 capas menos', await p.evaluate(() => { const r = document.querySelector('[data-cruce-recorrido]'); return r.getBoundingClientRect().height < innerHeight * 2.6 && getComputedStyle(document.querySelector('.cruce__escena .ventana-escena__neb--media')).display === 'none' && getComputedStyle(document.querySelector('.cruce__escena .ventana-escena__neb--cercana')).display === 'none'; }));
      ver('móvil: letra de 13 px o más', await p.evaluate(() => [...document.querySelectorAll('main *')].filter((e) => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length).every((e) => { const t = parseFloat(getComputedStyle(e).fontSize); return t === 0 || t >= 13; })));
    }
    await p.context().close();
  }

  ver('sin errores de consola', err.length === 0, err.slice(0, 3).join(' | '));
  await b.close();
  console.log(fallos.length ? `\n${fallos.length} FALLOS: ${fallos.join(', ')}` : '\nTodo true');
  process.exit(fallos.length ? 1 : 0);
})();
