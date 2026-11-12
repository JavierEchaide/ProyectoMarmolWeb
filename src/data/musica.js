// Música de la web y del teaser: único origen de la pista y de su crédito.
// De aquí salen el reproductor (Musica.astro + js/musica.js) y la fila
// "Música" de la ficha técnica del Teaser.
// PROVISIONAL: es la pista candidata. Si cambia, se cambia solo aquí.

export const musica = {
  titulo: 'Darkness is Coming',
  autor: 'Kevin MacLeod',
  sitio: 'incompetech.com',
  licencia: 'CC BY 4.0',
  urlLicencia: 'https://creativecommons.org/licenses/by/4.0/',
  // Archivo en public/audio/ (MP3 a ~128 kbps, unos 2,7 MB). Lo sube Javi.
  src: 'audio/darkness-is-coming.mp3',
  provisional: true,
  // false: al terminar la pista (2:51) se para. true: vuelve a empezar.
  bucle: false,
};

// Crédito corto que exige la licencia, siempre visible junto al reproductor
export const creditoMusica = `"${musica.titulo}" ${musica.autor} (${musica.sitio})`;
