// Empaqueta src/3d/busto.js con three.js en public/js/busto.js como script
// clásico (IIFE, sin módulos), para que funcione también desde file:// (USB).
// Se ejecuta solo en `npm run build` y `npm run dev`.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/3d/busto.js'],
  outfile: 'public/js/busto.js',
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'eof',
  logLevel: 'info',
});
