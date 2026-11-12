/* SPOILER: romper uno, destapar todos y comprobar que NO se pueden volver a tapar (V2); también con "reducir movimiento".
   Uso: ver NOTA-WEB.md, apartado "Pruebas". Necesita la web servida en BASE
   (por defecto http://localhost:4400) y Playwright con Chromium. */
const BASE = process.env.BASE || 'http://localhost:4400';
const SALIDA = process.env.SALIDA || require('path').resolve(__dirname, 'capturas');
require('fs').mkdirSync(SALIDA, { recursive: true });
// Mostrar todos -> Volver a taparlos -> volver a romper una; y movimiento reducido
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const reducido of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reducido ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const err = [];
    page.on('pageerror', (e) => err.push(e.message));
    await page.goto(BASE + '/historia.html');
    await page.waitForTimeout(500);
    const estado = () => page.evaluate(() => [...document.querySelectorAll('.spoiler--activo')].map((s) => s.dataset.spoiler + (s.classList.contains('destapado') ? '+' : '')).join(','));
    // 1. Romper uno con el teclado (el cartel es un <button>: Enter)
    await page.locator('.spoiler--activo').first().locator('.spoiler__tapa').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2600);
    const a = await estado();
    // 2. Mostrar todos
    await page.click('[data-spoiler-todos]');
    await page.waitForTimeout(3400);
    const b2 = await estado();
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.spoiler--activo .spoiler__contenido')].map((c) => c.offsetHeight).join(','));
    // 3. No hay control para volver a taparlos: el botón queda desactivado
    const boton = await page.evaluate(() => { const b = document.querySelector('[data-spoiler-todos]'); return b.textContent + (b.disabled ? ' (desactivado)' : ' (ACTIVO)'); });
    await page.click('[data-spoiler-todos]', { force: true }).catch(() => {});
    await page.waitForTimeout(600);
    const c = await estado();
    const hayTapar = await page.evaluate(() => /volver a tapar/i.test(document.body.textContent));
    // 4. Al recargar vuelven a estar tapados
    await page.reload(); await page.waitForTimeout(500);
    const d = await estado();
    const ok = !/(^|,)tapado/.test(b2) && b2 === c && !hayTapar && /^tapado(,tapado)*$/.test(d) && /desactivado/.test(boton);
    console.log(reducido ? 'REDUCIDO' : 'NORMAL', '\n tras romper 1 (Enter):', a, '\n tras mostrar todos:', b2, '\n alturas:', alturas, '\n botón:', boton, '\n tras pulsarlo otra vez:', c, '\n texto "volver a tapar":', hayTapar, '\n tras recargar:', d, '\n correcto:', ok, '\n errores:', err.length ? err : 'ninguno');
    await ctx.close();
  }
  await b.close();
})();
