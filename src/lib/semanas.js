// Semanas del calendario, sacadas de src/data/proceso.js (única fuente).
// De aquí salen la etiqueta de los placeholders ("S27 · 22–28/03"), la
// barra de Estado de Proceso y el bloque del calendario que viene abierto.
import { proceso } from '../data/proceso.js';

export const semanas = proceso.bloques.flatMap((b) => b.semanas.map((s) => ({ ...s, id: s.semana, bloque: b })));

// Datos de una semana por su id ('S05', 's05' o 5). null si no existe.
export const semana = (id) => {
  if (id == null) return null;
  const n = String(id).replace(/\D/g, '').padStart(2, '0');
  return semanas.find((s) => s.id === `S${n}`) ?? null;
};

// "S27 · 22–28/03", o null si la semana no existe o no se ha indicado
export const etiquetaSemana = (id) => {
  const s = semana(id);
  return s ? `${s.id} · ${s.fechas}` : null;
};

// La semana en curso: la última que no está pendiente (o la primera)
export const semanaActual = () => semanas.filter((s) => s.estado !== 'pendiente').at(-1) ?? semanas[0];
export const bloqueActual = () => semanaActual().bloque;

// Próximo hito: la siguiente semana cuyo plan habla de evaluación
export const proximoHito = () => semanas.slice(semanas.indexOf(semanaActual()) + 1).find((s) => /evaluaci/i.test(s.plan)) ?? null;

// Ancla y archivo del registro de una semana ('s05', 'registro-s05.html')
export const anclaSemana = (id) => semana(id)?.id.toLowerCase() ?? null;
