// Se ejecuta después de `astro build` (ver package.json).
// Comprueba que ningún .html de dist/ use rutas absolutas ("/algo"), porque
// romperían la copia de la web abierta desde un USB sin servidor.
// Si Astro genera alguna ruta /_astro/..., la convierte en relativa.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let problemas = 0;

for (const archivo of readdirSync(dist).filter((f) => f.endsWith('.html'))) {
  const ruta = join(dist, archivo);
  let html = readFileSync(ruta, 'utf8').replaceAll('="/_astro/', '="_astro/');
  writeFileSync(ruta, html);
  const absolutas = [...html.matchAll(/(?:href|src|srcset)="(\/[^/"][^"]*)"/g)].map((m) => m[1]);
  if (absolutas.length) {
    problemas += absolutas.length;
    console.error(`✗ ${archivo}: rutas absolutas ${absolutas.join(', ')}`);
  }
}

if (problemas) {
  console.error(`\n${problemas} ruta(s) absoluta(s). Usa rutas relativas (sin "/" delante).`);
  process.exit(1);
}
console.log('✓ Todas las rutas son relativas: dist/ funciona sin servidor.');
