// Datos generales y lista de páginas.
// Para activar Personajes (fase 2): crear src/pages/personajes.astro
// y poner `activa: true` en su entrada. El menú, los enlaces "Siguiente"
// y la numeración se actualizan solos.

export const sitio = {
  nombre: 'Proyecto Mármol',
  serie: 'Serie Mármol',
  autor: 'Javier Echaide',
  estudios: 'Animación 3D, Juegos y Entornos Interactivos',
  curso: '2026 – 2027',
  url: 'https://proyectomarmol.vercel.app',
  descripcion:
    'Proyecto final de Javier Echaide: el teaser de Serie Mármol, su historia y cómo se ha hecho.',
};

// og: imagen que se ve al compartir el enlace de esa sala (1200×630;
// se regeneran con `node scripts/generar-og.cjs`, salvo la de la Portada).
export const paginas = [
  { id: 'portada', og: 'img/og.jpg', numero: 'I', titulo: 'Portada', archivo: 'index.html', resumen: 'El principio', activa: true },
  { id: 'teaser', og: 'img/og-teaser.jpg', numero: 'II', titulo: 'Teaser', archivo: 'teaser.html', resumen: '30 segundos', activa: true },
  { id: 'historia', og: 'img/og-historia.jpg', numero: 'III', titulo: 'Historia', archivo: 'historia.html', resumen: 'Resumen de la serie', activa: true },
  { id: 'proceso', og: 'img/og-proceso.jpg', numero: 'IV', titulo: 'Proceso', archivo: 'proceso.html', resumen: 'Cómo se ha hecho', activa: true },
  { id: 'personajes', numero: 'V', titulo: 'Personajes', archivo: 'personajes.html', resumen: 'Fichas del reparto', activa: false },
];

export const paginasActivas = () => paginas.filter((p) => p.activa);

export const pagina = (id) => paginas.find((p) => p.id === id);

// Página siguiente en el orden del menú. Desde la última se vuelve a la Portada.
export const siguiente = (id) => {
  const activas = paginasActivas();
  const i = activas.findIndex((p) => p.id === id);
  return activas[(i + 1) % activas.length];
};
