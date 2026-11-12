// node scripts/generar-og.cjs
// Genera la imagen que se ve al compartir cada sala (1200×630):
// public/img/og-teaser.jpg, og-historia.jpg y og-proceso.jpg. La de la Portada
// (img/og.jpg) es el render del hero y no se toca. Necesita Playwright (el
// mismo de las pruebas): npm i --no-save playwright
const { chromium } = require('playwright');
const path = require('path');
const pub = path.resolve(__dirname, '..', 'public');
const u = (r) => 'file://' + path.join(pub, r).replace(/\\/g, '/');

const salas = [
  { id: 'teaser', numero: 'II', titulo: 'Teaser', lema: '30 segundos · Blender · Cycles', fondo: '#ecebe5', veta: '#86827b', nodo: '#362926' },
  { id: 'historia', numero: 'III', titulo: 'Historia', lema: 'Las criaturas no nacen: se tallan.', fondo: '#efe8d4', veta: '#8b2626', nodo: '#cda434' },
  { id: 'proceso', numero: 'IV', titulo: 'Proceso', lema: '35 semanas, apuntadas una a una', fondo: '#ecebdd', veta: '#4b4543', nodo: '#8b2626' },
];
const html = (s, i) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:C;src:url('${u('fonts/cinzel.woff2')}');font-weight:400 900}
@font-face{font-family:G;src:url('${u('fonts/eb-garamond-italic.woff2')}');font-style:italic}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:url('${u('img/grano.png')}') ${s.fondo};color:#362926;font-family:C;display:flex;flex-direction:column;justify-content:center;padding:0 96px;position:relative}
.m{position:absolute;top:0;right:0;bottom:0;width:300px;background:url('${u('img/marmol/marmol.webp')}') center/cover;border-left:1px solid ${s.veta}}
.a{font-size:22px;letter-spacing:.34em;text-transform:uppercase;color:#6b5f58;font-weight:600}
h1{font-size:128px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;line-height:1.1;display:flex;gap:.3em;align-items:baseline;text-shadow:1px 2px 0 rgba(255,255,255,.9),-1px -1px 1px rgba(54,41,38,.25)}
h1 span{color:transparent;-webkit-text-stroke:1.5px #6b5f58;font-weight:400}
p{font-family:G;font-style:italic;font-size:36px;color:#6b5f58;margin-top:6px}
svg{margin-top:44px}
.pie{position:absolute;left:96px;bottom:44px;font-size:20px;letter-spacing:.3em;text-transform:uppercase;font-weight:600}
</style><div class="m"></div><div class="a">Sala ${s.numero}</div><h1><span>${s.numero}</span>${s.titulo}</h1><p>${s.lema}</p>
<svg width="300" height="32" viewBox="0 0 300 32"><path d="M16 16H284" stroke="${s.veta}" stroke-width="2"/>${[0, 1, 2, 3].map((j) => { const x = 16 + j * 89.3, r = j === i + 1 ? 13 : 6; return `<path d="M${x} ${16 - r}L${x + r} 16L${x} ${16 + r}L${x - r} 16Z" fill="${j === i + 1 ? s.nodo : s.fondo}" stroke="#362926" stroke-width="2"/>`; }).join('')}</svg>
<div class="pie">Proyecto Mármol · Javier Echaide</div>`;

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  for (const [i, s] of salas.entries()) {
    await p.setContent(html(s, i));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(pub, 'img', `og-${s.id}.jpg`), type: 'jpeg', quality: 86 });
    console.log(`img/og-${s.id}.jpg`);
  }
  await b.close();
})();
