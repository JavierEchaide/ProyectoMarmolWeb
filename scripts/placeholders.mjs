// npm run placeholders
// Lista todos los huecos sin imagen o vídeo (`src: null`) de src/data/*.js:
// página, campo, qué va ahí (`falta`) y la semana prevista. Sirve para saber
// qué falta por entregar sin abrir la web.
import { etiquetaSemana } from '../src/lib/semanas.js';

const fuentes = ['portada', 'teaser', 'historia', 'proceso'];
const filas = [];

function recorrer(valor, ruta, pagina) {
  if (!valor || typeof valor !== 'object') return;
  if ('src' in valor && valor.src === null) {
    filas.push({ pagina, campo: ruta, falta: valor.falta ?? '(sin texto de "falta")', semana: etiquetaSemana(valor.semana) ?? 'sin semana' });
  }
  for (const [clave, hijo] of Object.entries(valor)) {
    recorrer(hijo, Array.isArray(valor) ? `${ruta}[${clave}]` : `${ruta}.${clave}`, pagina);
  }
}

for (const f of fuentes) {
  const modulo = await import(`../src/data/${f}.js`);
  recorrer(modulo[f], f, f);
}

let actual = '';
for (const f of filas) {
  if (f.pagina !== actual) {
    actual = f.pagina;
    console.log(`\n== ${actual} (${filas.filter((x) => x.pagina === actual).length})`);
  }
  console.log(`  ${f.campo}\n      falta:  ${f.falta}\n      semana: ${f.semana}`);
}
console.log(`\n${filas.length} placeholders en total.`);
