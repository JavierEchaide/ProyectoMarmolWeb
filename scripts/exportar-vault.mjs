// npm run exportar -- "<ruta del vault>" [--simular] [--grafo "<captura.png>"]
//
// Exporta del vault de Obsidian a la web SOLO:
//   · los registros semanales:  "Registro SXX - Proyecto Final Mármol.md"
//   · las referencias:          Contenido/Referencias/<categoría>/<nota>.md
// y SOLO si la nota lleva `**Publicar:** sí` en la cabecera (primeras 30
// líneas). Cualquier otra nota (sets, Creador, lore, diario...) no se exporta
// nunca, lleve la marca o no.
//
// Escribe:
//   src/data/generado/registros.json    una entrada por semana publicada
//   src/data/generado/referencias.json  Qué es · Qué cojo · Dónde aplica
//   src/data/generado/cuaderno.json     índice de notas exportadas y grafo
//   public/img/vault/                   las imágenes incrustadas (![[...]])
//
// Antes de escribir imprime la lista de notas exportadas, los avisos y un
// resumen de cambios. Con --simular no escribe nada. REVISAR la salida antes
// del commit: los registros por día pueden llevar cosas personales.
// Lo ejecuta Javi en su ordenador (el vault no está en el repositorio).
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { join, basename, extname, relative, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const simular = args.includes('--simular');
const iGrafo = args.indexOf('--grafo');
const grafo = iGrafo >= 0 ? args[iGrafo + 1] : null;
const vault = args.find((a, i) => !a.startsWith('--') && (iGrafo < 0 || i !== iGrafo + 1));
// Las pruebas escriben en otra carpeta para no tocar el repositorio
const salidaDatos = process.env.EXPORTAR_DATOS || join(raiz, 'src', 'data', 'generado');
const salidaImg = process.env.EXPORTAR_IMG || join(raiz, 'public', 'img', 'vault');

if (!vault || !existsSync(vault)) {
  console.error('Uso: npm run exportar -- "<ruta del vault>" [--simular] [--grafo "<captura.png>"]');
  process.exit(1);
}

const avisos = [];
const aviso = (t) => avisos.push(t);
const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 1. Recorrer el vault ------------------------------------------------------
const archivos = [];
(function recorrer(dir) {
  for (const n of readdirSync(dir)) {
    if (n.startsWith('.')) continue; // .obsidian, .trash...
    const ruta = join(dir, n);
    if (statSync(ruta).isDirectory()) recorrer(ruta);
    else archivos.push(ruta);
  }
})(vault);
const notas = archivos.filter((a) => extname(a).toLowerCase() === '.md');
const porNombre = (nombre) => archivos.find((a) => basename(a).toLowerCase() === nombre.toLowerCase());

// 2. Qué se puede exportar --------------------------------------------------
const RE_REGISTRO = /^Registro S(\d{2}) - Proyecto Final Mármol$/i;
const RE_PUBLICAR = /^\s*\*\*Publicar:\*\*\s*s[ií]\s*$/im;

function tipoDe(ruta) {
  const nombre = basename(ruta, '.md');
  const m = nombre.match(RE_REGISTRO);
  if (m) return { tipo: 'registro', semana: `S${m[1]}` };
  const partes = relative(vault, ruta).split(sep);
  const i = partes.findIndex((p, k) => p === 'Referencias' && partes[k - 1] === 'Contenido');
  if (i >= 0 && partes.length === i + 3) return { tipo: 'referencia', categoria: partes[i + 1] };
  return null;
}
const marcada = (texto) => RE_PUBLICAR.test(texto.split('\n').slice(0, 30).join('\n'));

const exportables = [];
let privadas = 0;
let sinMarca = 0;
for (const ruta of notas) {
  const t = tipoDe(ruta);
  if (!t) { privadas++; continue; }
  const texto = readFileSync(ruta, 'utf8');
  if (!marcada(texto)) { sinMarca++; continue; }
  exportables.push({ ruta, nombre: basename(ruta, '.md'), texto, ...t });
}
const enlaceDe = (nombre) => {
  const n = exportables.find((e) => e.nombre.toLowerCase() === nombre.toLowerCase());
  if (!n) return null;
  return n.tipo === 'registro' ? `registro-${n.semana.toLowerCase()}.html` : 'proceso.html#referencias';
};

// 3. Limpiar y convertir cada nota -------------------------------------------
const imagenes = []; // { origen, destino }
function limpiar(nota) {
  let t = nota.texto.replace(/\r\n/g, '\n');
  t = t.replace(/^---\n[\s\S]*?\n---\n/, ''); // propiedades (frontmatter)
  t = t.replace(/%%[\s\S]*?%%/g, ''); // comentarios de Obsidian
  t = t.replace(/<!--[\s\S]*?-->/g, '');
  t = t.replace(/^\s*\*\*Publicar:\*\*.*$/gim, '');
  // Imágenes incrustadas: ![[archivo.png|texto alternativo]]
  t = t.replace(/!\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g, (_, archivo, alt) => {
    const origen = porNombre(basename(archivo.trim()));
    if (!origen) { aviso(`Imagen que falta: "${archivo}" en "${nota.nombre}"`); return ''; }
    if (!/\.(png|jpe?g|webp|gif|avif)$/i.test(origen)) { aviso(`Incrustado que no es imagen (se omite): "${archivo}" en "${nota.nombre}"`); return ''; }
    let texto = (alt || '').trim();
    if (!texto || /^\d+(x\d+)?$/.test(texto)) { // sin texto, o solo un tamaño (|400)
      texto = `Imagen de ${nota.nombre}: ${basename(archivo, extname(archivo)).replace(/[_-]+/g, ' ')}`;
      aviso(`Texto alternativo generado para "${archivo}" en "${nota.nombre}": conviene escribirlo (![[${archivo}|descripción]])`);
    }
    const destino = `${slug(basename(archivo, extname(archivo)))}${extname(origen).toLowerCase()}`;
    imagenes.push({ origen, destino });
    return `![${texto}](img/vault/${destino})`;
  });
  // Wikilinks: a notas exportadas -> enlace interno; al resto -> texto plano
  t = t.replace(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_, destino, alias) => {
    const texto = (alias || destino).trim();
    const href = enlaceDe(destino.trim());
    if (!href && !notas.some((n) => basename(n, '.md').toLowerCase() === destino.trim().toLowerCase())) {
      aviso(`Enlace roto: [[${destino}]] en "${nota.nombre}"`);
    }
    return href ? `[${texto}](${href})` : texto;
  });
  return t.trim();
}

function enLinea(t) {
  return escapar(t)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" decoding="async">')
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|[\w./#-]+)[^)\s]*)\)/g, (_, tx, href) => `<a href="${href}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${tx}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/==([^=]+)==/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
// Markdown sencillo -> HTML: títulos, listas, párrafos, negrita, cursiva, enlaces
function aHtml(md) {
  const salida = [];
  let lista = null;
  let parrafo = [];
  const cerrarP = () => { if (parrafo.length) { salida.push(`<p>${enLinea(parrafo.join(' '))}</p>`); parrafo = []; } };
  const cerrarL = () => { if (lista) { salida.push(`</${lista}>`); lista = null; } };
  for (const linea of md.split('\n')) {
    const l = linea.trim();
    let m;
    if (!l || /^---+$/.test(l)) { cerrarP(); cerrarL(); continue; }
    if ((m = l.match(/^(#{1,6})\s+(.*)$/))) {
      cerrarP(); cerrarL();
      const nivel = Math.min(4, Math.max(2, m[1].length + 1)); // el h1 es el título de la página
      salida.push(`<h${nivel}>${enLinea(m[2])}</h${nivel}>`);
    } else if ((m = l.match(/^(?:[-*+]|(\d+)[.)])\s+(?:\[[ xX]\]\s+)?(.*)$/))) {
      cerrarP();
      const tipo = m[1] ? 'ol' : 'ul';
      if (lista !== tipo) { cerrarL(); salida.push(`<${tipo}>`); lista = tipo; }
      salida.push(`<li>${enLinea(m[2])}</li>`);
    } else if (l.startsWith('>')) {
      cerrarL();
      parrafo.push(l.replace(/^>\s?(\[![^\]]*\][+-]?\s*)?/, ''));
    } else { cerrarL(); parrafo.push(l); }
  }
  cerrarP(); cerrarL();
  return salida.join('\n');
}

// Campo de una referencia: "**Qué es:** texto" o "## Qué es" + párrafo
function campo(md, nombre) {
  const n = nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let m = md.match(new RegExp(`\\*\\*${n}:?\\*\\*:?\\s*(.+)`, 'i'));
  if (m) return m[1].trim();
  m = md.match(new RegExp(`^#{1,6}\\s*${n}\\s*\\n+([\\s\\S]*?)(?=\\n#{1,6}\\s|$)`, 'im'));
  return m ? m[1].trim().replace(/\n+/g, ' ') : '';
}
const plano = (t) => t.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').trim();

const registros = [];
const referencias = [];
for (const nota of exportables) {
  const md = limpiar(nota);
  if (nota.tipo === 'registro') {
    const cuerpo = md.replace(/^#\s+.*\n/, ''); // el título lo pone la página
    registros.push({ semana: nota.semana, titulo: nota.nombre, html: aHtml(cuerpo) });
  } else {
    const img = md.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const ref = { categoria: nota.categoria, titulo: nota.nombre, que: plano(campo(md, 'Qué es')), cojo: plano(campo(md, 'Qué cojo')), donde: plano(campo(md, 'Dónde aplica')) };
    if (img) ref.imagen = { src: img[2], alt: img[1], falta: nota.nombre };
    if (!ref.que || !ref.cojo || !ref.donde) aviso(`Referencia incompleta (falta Qué es, Qué cojo o Dónde aplica): "${nota.nombre}"`);
    referencias.push(ref);
  }
}
registros.sort((a, b) => a.semana.localeCompare(b.semana));
referencias.sort((a, b) => (a.categoria + a.titulo).localeCompare(b.categoria + b.titulo, 'es'));

let rutaGrafo = null;
if (grafo) {
  if (existsSync(grafo)) { rutaGrafo = `img/vault/grafo${extname(grafo).toLowerCase()}`; imagenes.push({ origen: grafo, destino: basename(rutaGrafo) }); }
  else aviso(`No existe la captura del grafo: ${grafo}`);
}
const cuaderno = {
  notas: [
    ...registros.map((r) => ({ titulo: `Registro ${r.semana}`, tipo: 'Registro semanal', enlace: `registro-${r.semana.toLowerCase()}.html` })),
    ...referencias.map((r) => ({ titulo: r.titulo, tipo: `Referencia · ${r.categoria}`, enlace: 'proceso.html#referencias' })),
  ],
  grafo: rutaGrafo,
};

// 4. Informe -----------------------------------------------------------------
console.log(`Vault: ${vault}`);
console.log(`${notas.length} notas · ${exportables.length} se exportan · ${sinMarca} registros o referencias sin "**Publicar:** sí" · ${privadas} notas de otro tipo (nunca se exportan)\n`);
console.log('NOTAS EXPORTADAS');
for (const e of exportables) console.log(`  ${e.tipo === 'registro' ? `registro ${e.semana}` : `referencia (${e.categoria})`} · ${relative(vault, e.ruta)}`);
if (!exportables.length) console.log('  (ninguna)');
console.log(`\nIMÁGENES: ${imagenes.length}`);
for (const i of imagenes) console.log(`  ${relative(vault, i.origen)} -> public/img/vault/${i.destino}`);
console.log(`\nAVISOS: ${avisos.length}`);
for (const a of avisos) console.log(`  ! ${a}`);

const salidas = [
  ['registros.json', registros],
  ['referencias.json', referencias],
  ['cuaderno.json', cuaderno],
];
console.log('\nCAMBIOS');
for (const [nombre, datos] of salidas) {
  const ruta = join(salidaDatos, nombre);
  const nuevo = JSON.stringify(datos, null, 2) + '\n';
  const viejo = existsSync(ruta) ? readFileSync(ruta, 'utf8') : null;
  const estado = viejo === null ? 'nuevo' : JSON.stringify(JSON.parse(viejo)) === JSON.stringify(datos) ? 'sin cambios' : 'cambia';
  const cuenta = Array.isArray(datos) ? `${datos.length} entradas` : `${datos.notas.length} notas`;
  console.log(`  ${nombre}: ${estado} (${cuenta})`);
  if (!simular && estado !== 'sin cambios') { mkdirSync(salidaDatos, { recursive: true }); writeFileSync(ruta, nuevo); }
}
if (!simular && imagenes.length) {
  mkdirSync(salidaImg, { recursive: true });
  for (const i of imagenes) copyFileSync(i.origen, join(salidaImg, i.destino));
}
console.log(simular
  ? '\nSIMULACIÓN: no se ha escrito nada. Quita --simular para exportar.'
  : '\nExportado. Revisa `git diff` y `git status` (texto e imágenes) antes del commit, y después `npm run build`.');
