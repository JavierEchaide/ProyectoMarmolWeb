/* Exportación desde Obsidian contra el vault de ejemplo (pruebas/vault-ejemplo),
   en simulación y a una carpeta temporal: solo salen los registros y las
   referencias con "**Publicar:** sí"; nada privado llega a la salida.
   También comprueba `npm run placeholders`. Todo debe salir true. */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const raiz = path.resolve(__dirname, '..');
const ver = (n, ok) => { console.log(`${ok ? 'true ' : 'FALLO'} ${n}`); if (!ok) process.exitCode = 1; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marmol-'));
const env = { ...process.env, EXPORTAR_DATOS: path.join(tmp, 'datos'), EXPORTAR_IMG: path.join(tmp, 'img') };
const correr = (...a) => execFileSync('node', ['scripts/exportar-vault.mjs', 'pruebas/vault-ejemplo', ...a], { cwd: raiz, env, encoding: 'utf8' });

const sim = correr('--simular');
ver('simulación: no escribe nada', !fs.existsSync(env.EXPORTAR_DATOS) && /SIMULACIÓN/.test(sim));
ver('simulación: lista 2 notas y avisa de enlace roto e imagen que falta', /2 se exportan/.test(sim) && /Enlace roto: \[\[Nota que no existe\]\]/.test(sim) && /Imagen que falta: "no_esta.png"/.test(sim));
correr();
const todo = fs.readdirSync(env.EXPORTAR_DATOS).map((f) => fs.readFileSync(path.join(env.EXPORTAR_DATOS, f), 'utf8')).join('\n');
const reg = JSON.parse(fs.readFileSync(path.join(env.EXPORTAR_DATOS, 'registros.json'), 'utf8'));
const ref = JSON.parse(fs.readFileSync(path.join(env.EXPORTAR_DATOS, 'referencias.json'), 'utf8'));
ver('solo el registro publicado (S05)', reg.length === 1 && reg[0].semana === 'S05');
ver('nada privado ni sin marca en la salida', !/SECRETO|comentario privado|Publicar/.test(todo));
ver('wikilink a nota exportada -> enlace; a privada -> texto', /<a href="proceso.html#referencias">Rasgón de ejemplo<\/a>/.test(reg[0].html) && /con Set - Taller y/.test(reg[0].html) && !/\[\[/.test(reg[0].html));
ver('imágenes copiadas con texto alternativo', fs.readdirSync(env.EXPORTAR_IMG).sort().join() === 'captura-previz.png,sin-alt.png' && /alt="Captura de la previz en Blender"/.test(reg[0].html));
ver('referencia con Qué es · Qué cojo · Dónde aplica', ref.length === 1 && ref[0].categoria === 'Sets' && ref[0].que && ref[0].cojo && ref[0].donde);
ver('rutas relativas en lo exportado', !/(src|href)="\//.test(todo));

const ph = execFileSync('node', ['scripts/placeholders.mjs'], { cwd: raiz, encoding: 'utf8' });
ver('placeholders: lista por página con semana', /== portada/.test(ph) && /== teaser/.test(ph) && /== historia/.test(ph) && /== proceso/.test(ph) && /semana: S27 · 22–28\/03/.test(ph) && /placeholders en total/.test(ph));
fs.rmSync(tmp, { recursive: true, force: true });
