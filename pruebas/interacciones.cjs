/* Recorrido completo: intro, menú (Esc y foco), cortina, SPOILER, "Mostrar todos", visor con flechas, intro solo al recargar, teaser, bloques, diálogos, comparador y menú en móvil.
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
const { chromium } = require('playwright');
const base = BASE, out = SALIDA;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const err = []; p.on('pageerror', e => err.push(e.message)); p.on('console', m => m.type()==='error' && err.push(m.text()));
  await p.goto(base + '/index.html');
  await p.waitForTimeout(700); await p.screenshot({ path: out + '/intro-07.png' });
  await p.waitForTimeout(800); await p.screenshot({ path: out + '/intro-15.png' });
  await p.waitForTimeout(700); await p.screenshot({ path: out + '/intro-22.png' });
  await p.waitForTimeout(1200);
  console.log('intro retirada:', await p.evaluate(() => !document.querySelector('[data-intro]') && !document.documentElement.classList.contains('intro-activa')));
  await p.click('[data-boton-menu]'); await p.waitForTimeout(1000); await p.screenshot({ path: out + '/menu.png' });
  console.log('foco en menú:', await p.evaluate(() => document.activeElement.textContent.trim().slice(0,30)));
  await p.keyboard.press('Escape'); await p.waitForTimeout(800);
  console.log('menu cerrado con Esc:', await p.evaluate(() => !document.documentElement.classList.contains('menu-abierto')));
  await p.click('[data-boton-menu]'); await p.waitForTimeout(900);
  await p.click('.menu__item a[href="historia.html"]'); await p.waitForTimeout(300); await p.screenshot({ path: out + '/cortina-sale.png' });
  await p.waitForURL('**/historia.html'); await p.waitForTimeout(250); await p.screenshot({ path: out + '/cortina-entra.png' });
  await p.waitForTimeout(1200);
  // spoiler
  const tapa = p.locator('[data-spoiler-tapa]').first();
  await tapa.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
  await tapa.click(); await p.waitForTimeout(380); await p.screenshot({ path: out + '/spoiler-rompe.png' });
  await p.waitForTimeout(1300); await p.screenshot({ path: out + '/spoiler-abierto.png' });
  console.log('spoiler destapado:', await p.evaluate(() => document.querySelector('.spoiler--activo').dataset.spoiler));
  await p.click('[data-spoiler-todos]'); await p.waitForTimeout(1800);
  console.log('todos destapados:', await p.evaluate(() => [...document.querySelectorAll('.spoiler--activo')].every(s => s.dataset.spoiler === 'destapado')), await p.textContent('[data-spoiler-todos]'));
  // visor
  await p.locator('[data-visor]').first().scrollIntoViewIfNeeded();
  await p.locator('[data-visor]').first().click(); await p.waitForTimeout(700); await p.screenshot({ path: out + '/visor.png' });
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500);
  console.log('visor pie tras flecha:', await p.textContent('[data-visor-pie]'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  // volver a portada desde el menú: sin intro
  await p.click('[data-boton-menu]'); await p.waitForTimeout(900);
  await p.click('.menu__item a[href="index.html"]'); await p.waitForURL('**/index.html'); await p.waitForTimeout(200);
  console.log('portada desde menú sin intro:', await p.evaluate(() => !document.documentElement.classList.contains('intro-activa')));
  await p.reload(); await p.waitForTimeout(200);
  console.log('portada al recargar con intro:', await p.evaluate(() => document.documentElement.classList.contains('intro-activa')));
  // teaser
  await p.goto(base + '/teaser.html'); await p.waitForTimeout(800);
  await p.click('[data-reproductor]'); await p.waitForTimeout(800); await p.screenshot({ path: out + '/teaser-play.png' });
  await p.keyboard.press('Escape');
  // proceso
  await p.goto(base + '/proceso.html'); await p.waitForTimeout(800);
  await p.click('.bloque summary'); await p.waitForTimeout(400);
  await p.locator('.bloque').first().screenshot({ path: out + '/bloque.png' });
  await p.locator('[data-abrir-dialogo]').first().click(); await p.waitForTimeout(700); await p.screenshot({ path: out + '/dialogo.png' });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('.archivo summary'); await p.waitForTimeout(400);
  await p.locator('.archivo').screenshot({ path: out + '/archivo.png' });
  const c = p.locator('[data-comparador-control]').first(); await c.scrollIntoViewIfNeeded();
  await c.evaluate(el => { el.value = 25; el.dispatchEvent(new Event('input')); }); await p.waitForTimeout(200);
  await p.locator('.comparador').first().screenshot({ path: out + '/comparador.png' });
  console.log('errores:', err.length ? err : 'ninguno');
  // móvil: menú
  const m = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await m.goto(base + '/proceso.html'); await m.waitForTimeout(600);
  await m.click('[data-boton-menu]'); await m.waitForTimeout(1000); await m.screenshot({ path: out + '/menu-movil.png' });
  await b.close();
})();
