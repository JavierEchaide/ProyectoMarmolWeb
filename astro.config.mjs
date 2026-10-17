// Configuración de Astro. Ver NOTA-WEB.md, apartado "Cómo está montada".
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://serie-marmol.vercel.app',
  // Cada página sale como un .html en la raíz (index.html, teaser.html...).
  // Así todas las rutas pueden ser relativas y la web abre desde un USB
  // con doble clic, sin servidor (plan B de entrega).
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
