// Registros semanales: une lo exportado desde Obsidian
// (src/data/generado/registros.json, lo escribe `npm run exportar`) con el
// `registro` manual de src/data/proceso.js, que queda como respaldo.
import { semanas } from './semanas.js';
import exportados from '../data/generado/registros.json';

// Registro de una semana: { semana, origen: 'obsidian' | 'manual', html?, lineas? } o null
export const registroDe = (s) => {
  const nota = exportados.find((r) => r.semana === s.id);
  if (nota) return { semana: s, origen: 'obsidian', titulo: nota.titulo, html: nota.html };
  if (s.registro?.length) return { semana: s, origen: 'manual', lineas: s.registro };
  return null;
};

export const registros = () => semanas.map(registroDe).filter(Boolean);
export const archivoRegistro = (s) => `registro-${s.id.toLowerCase()}.html`;
