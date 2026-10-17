# Web · Proyecto Mármol — nota técnica

Documento de referencia de la web del Proyecto Final Mármol (Javier Echaide, Animación 3D, Juegos y Entornos Interactivos, 2026–2027). Explica qué se ha usado, cómo funciona cada parte y **dónde se mete cada cosa** cuando lleguen los renders, el vídeo o los textos nuevos. Está pensada para que, en un chat nuevo, baste con leerla para seguir trabajando.

- **Web publicada:** https://serie-marmol.vercel.app
- **Repositorio:** https://github.com/JavierEchaide/ProyectoMarmolWeb
- **Lista de lo que falta por entregar (assets):** ver [Assets pendientes](#assets-pendientes), también copiada en la nota de Obsidian "Web - Proyecto Final Mármol".

---

## 1. Resumen rápido

| Qué | Cómo |
|---|---|
| Páginas | Portada · Teaser · Historia · Proceso (Personajes preparada, desactivada) |
| Tecnología | [Astro 5](https://astro.build) genera HTML estático. CSS y JavaScript propios, sin librerías |
| Contenido | Todo en `src/data/*.js`, separado del diseño |
| Imágenes | Si una imagen no existe, sale un placeholder con el texto de lo que falta |
| Alojamiento | Vercel (`serie-marmol.vercel.app`) |
| Plan B | `dist/` copiado a un USB abre con doble clic en `index.html`, sin internet ni servidor |

### Comandos

```bash
npm install        # una vez, instala Astro
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # genera dist/ y comprueba que todas las rutas son relativas
npm run preview    # sirve dist/ para revisarlo
```

> En `npm run dev` los enlaces entre páginas apuntan a `teaser.html`, `historia.html`... Para revisar la navegación completa es más fiable `npm run build` + `npm run preview`.

---

## 2. Cómo está montada

```
ProyectoMarmolWeb/
├── astro.config.mjs          configuración (salida en archivos .html sueltos)
├── NOTA-WEB.md               esta nota
├── public/                   se copia tal cual a dist/
│   ├── css/site.css          TODO el estilo (índice al principio del archivo)
│   ├── js/site.js            menú, transiciones, apariciones, visor, inclinación 3D, diálogos
│   ├── js/portada.js         intro y parallax del hero
│   ├── js/teaser.js          reproductor del teaser
│   ├── js/historia.js        carteles de SPOILER
│   ├── js/proceso.js         comparadores antes/después
│   ├── fonts/                Cinzel y EB Garamond (woff2, autoalojadas)
│   ├── img/                  imágenes (ver "Assets pendientes")
│   ├── video/                aquí irá teaser.mp4
│   └── favicon.svg
├── scripts/
│   ├── relativizar.mjs       se ejecuta tras el build: falla si hay rutas absolutas
│   └── generar-marmol.py     textura de mármol PROVISIONAL (se tira cuando llegue la real)
└── src/
    ├── data/                 ← CONTENIDO. Aquí se edita casi todo
    │   ├── sitio.js          nombre, autor, lista de páginas del menú
    │   ├── portada.js
    │   ├── teaser.js
    │   ├── historia.js
    │   └── proceso.js
    ├── layouts/Base.astro    <head>, cabecera, menú, cortina, visor y pie (común)
    ├── components/           piezas reutilizables (ver apartado 5)
    ├── lib/grietas.js        genera las grietas doradas en SVG
    └── pages/                una por página: index, teaser, historia, proceso
```

### Por qué así

- **Astro** solo se usa para generar HTML: compone las páginas a partir de componentes y de los archivos de datos. El resultado (`dist/`) es HTML + CSS + JS normales, sin nada que se ejecute en un servidor.
- **Sin librerías de animación** (ni GSAP ni three.js). Todo es CSS y JavaScript propio: pesa poco, se entiende línea a línea y funciona sin internet.
- **Rutas relativas y JavaScript "clásico"** (sin `type="module"`): es lo que permite abrir la web desde un USB con doble clic. Los módulos de JavaScript y las rutas que empiezan por `/` no funcionan en `file://`. `scripts/relativizar.mjs` lo comprueba en cada build.
- **Fuentes autoalojadas** en `public/fonts/` (licencia OFL): no dependen de Google Fonts ni de internet.
- **Nada guarda datos:** no hay cookies ni almacenamiento salvo una marca temporal en `sessionStorage` para saber si se llega desde otra página de la web (ver Intro).

---

## 3. Sistema visual

### Colores (todos en `:root` de `site.css`)

| Variable | Color | Uso |
|---|---|---|
| `--crema` | `#F1F2E3` | Fondo base y superficies (dominante) |
| `--oro` | `#CDA434` | **Solo decorativo**: filetes, escuadras, grietas, grecas. Nunca texto (contraste 2,1:1) |
| `--rojo` | `#8B2626` | Acento: enlaces, botones al pasar, foco del teclado, capitulares (7,7:1) |
| `--tinta` | `#362926` | Texto y títulos (12,4:1). Sale de la paleta del Canva |
| `--tinta-2` | `#6B5F58` | Texto secundario: pies, fechas (5,5:1, pasa AA) |
| `--linea` | `#A39A90` | Divisores |
| `--superficie` | `#E7E6D6` | Placeholders y bandas |
| `--negro` | `#0D0D0D` | Cartel SPOILER, fondo del teaser, visor. Sale de la paleta del Canva |

Un solo tema claro. No hay modo oscuro.

### Tipografía

- **Títulos:** Cinzel (mayúsculas de inscripción romana, tipo Trajano).
- **Texto:** EB Garamond (Garamond clásica, normal y cursiva).
- Ambas cubren tildes, eñes, ¿ ¡ y comillas. Las flechas de los botones son SVG porque el subconjunto latino de las fuentes no trae `→`.

### Mármol

Solo en tres sitios: el hero de la Portada (el render), la mitad izquierda del menú y el marco de las tarjetas con `marmol`. Todo usa la variable `--marmol` → `public/img/marmol/marmol.webp`.

**Ahora mismo es una textura provisional generada por código** (`scripts/generar-marmol.py`). Cuando llegue la textura real de Blender, se sobrescribe ese archivo con el mismo nombre y no hay que tocar nada más.

### Ornamentos

- **Grietas doradas (kintsugi):** divisores entre secciones (`Grieta.astro`). Cada una se genera a partir de una "semilla" (número), así que todas son distintas pero estables. Avanzan de izquierda a derecha al entrar en pantalla. Es el concepto de la serie: la corrupción se sana con oro y la grieta se sigue viendo.
- **Greca (meandro griego):** banda dorada en el pie, la placa del menú y la vitrina del autor (`Greca.astro`, patrón `#greca` definido en `Base.astro`).
- **Tarjetas** (referencia: karma-tracks.com): doble filete dorado y escuadras con un rombo en cada esquina (`Tarjeta.astro`). Variante `marmol` con marco de mármol.

---

## 4. Páginas: qué tiene cada una y dónde se edita

### I · Portada — `src/pages/index.astro` + `src/data/portada.js`

1. **Intro** (`portada.intro`). Pantalla crema con "Bienvenido a" y "Proyecto Mármol" letra a letra. A los 2 s se abre en dos mitades, como una cortina, y descubre el hero. Dura 2,9 s y se salta con un clic o una tecla.
   - **Cuándo sale:** al recargar la Portada o al entrar por primera vez (escribiendo la dirección o desde un enlace externo). **No** sale al llegar desde el menú o desde otra página de la web, ni al volver con "atrás". Lo decide el script del `<head>` en `Base.astro`. Antes de navegar dentro de la web se guarda una marca en `sessionStorage`, y se mira el tipo de navegación (`reload`, `navigate`, `back_forward`).
   - Con "reducir movimiento" activado en el sistema, la intro es un fundido corto.
2. **Hero** (`portada.hero`). Render del título tallado. El texto real está oculto en un `<h1>` para lectores de pantalla.
   - `escritorio`: 16:9. `movil`: versión para móviles, con su proporción en `ratioMovil` (1 = cuadrado, 0.8 = 4:5).
   - **Parallax:** la imagen baja más despacio que el scroll y se mueve un poco con el ratón.
   - **Por capas:** si se rellena `capas` (fondo / losa / cincel con transparencia), cada capa se mueve según su `profundidad` y la profundidad es real. El ejemplo está comentado en `portada.js`.
3. **Presentación**: frase gancho (`gancho`), dos párrafos (`presentacion`) y botón **Entrar**, que lleva al Teaser.
4. **La historia en cuatro fotogramas** (`fotogramas`): 4 en fila en escritorio y 2×2 en móvil. Al pasar el ratón aparece "Ver" y al pulsar se amplían en el visor; se recorren con las flechas.
5. **Las páginas** (`accesos`): tres tarjetas con marco de mármol que se inclinan en 3D siguiendo el ratón.
6. **Hecho por** (`autor`): vitrina oscura con el render del autor (vertical 3:4), su nombre y una greca.
7. **Siguiente: II · Teaser.**

### II · Teaser — `src/pages/teaser.astro` + `src/data/teaser.js`

1. **Reproductor** a ancho completo en 2.35:1 sobre una banda negra. **Nunca arranca solo.** Al pulsar play crece hasta una ventana grande con el fondo oscurecido y desenfocado, y el vídeo empieza con sonido (`js/teaser.js` usa el visor común).
   - `video.src`: ruta del MP4 (`'video/teaser.mp4'`). Mientras sea `null`, al pulsar sale "Vídeo pendiente".
   - `video.poster`: fotograma que se ve antes de pulsar.
   - Los créditos van dentro del propio vídeo. No hay página de créditos.
2. **Sinopsis** (`sinopsis`). Describe sin explicar, para no destapar la parte III de la historia (que venerar a las criaturas también las rompe).
3. **Ficha técnica** (`ficha`): Duración · Hecho con · Formato · Música. La música pone "A decidir"; cuando se elija, se cambian las dos líneas.
4. **Fotogramas clave** (`fotogramas`): planos 1, 2b, 7 y 8, en 2.35:1, ampliables.
5. **La rima** (`rima`): los planos 4 y 6 (ojos de la pura y de la corrupta, mismo encuadre) juntos, con una línea que lo explica.
6. **Siguiente: III · Historia.**

### III · Historia — `src/pages/historia.astro` + `src/data/historia.js`

Textos escritos a partir de "Lore - Biblia completa", "Estructura narrativa - Partes y temporadas" y "El Protagonista".

1. **Premisa** (`premisa`): siempre visible, con imagen clave (4:5) y capitular roja.
2. **Las seis partes** (`partes`): tarjetas con marco de mármol, cada una con número, imagen, título y párrafo.
   - `spoiler: true` las tapa con el cartel negro **SPOILER**. Ahora están tapadas la III, la IV, la V y la VI. La I y la II se ven siempre.
   - Mientras está tapado, el contenido es `inert`: no se lee, no se selecciona y no se enfoca con el teclado.
   - Al pulsar el cartel se dibujan grietas doradas sobre el negro y el cartel cae (`js/historia.js`).
   - El botón **Mostrar todos** destapa todo de una vez y pasa a **Volver a taparlos**. Al recargar la página vuelven a estar tapados: no se guarda nada.
3. **El final** (`final`): bloque ancho tapado con "SPOILER · EL FINAL", con dos párrafos y la cita del tema de la serie.
4. **Siguiente: IV · Proceso.**

### IV · Proceso — `src/pages/proceso.astro` + `src/data/proceso.js`

Datos sacados de "Proyecto Final Mármol - Proyecto" (calendario y pipeline), "Registro S01" y "Registro S02", y las notas de Referencias.

1. **Línea de tiempo S01–S35** (`bloques`): los 7 bloques reales de la pipeline (Cimientos, Previz, Assets, Look dev, Animación, Render, Post y entrega). Cada uno se despliega (`<details>`, funciona sin JavaScript) y enseña:
   - el objetivo,
   - cada semana con su plan y su **estado**: `'hecho'`, `'en-curso'` o `'pendiente'`. El estado del bloque se calcula solo,
   - lo que se hizo (`registro`: una lista de frases),
   - capturas opcionales (`capturas`: "Mis notas de Obsidian", "Grafo del proyecto", "Storyboard"...).
   - **Para actualizar una semana:** cambiar su `estado` y rellenar su `registro`.
2. **Referencias** (`referencias`): 7 categorías (Personajes, Sets, Color y luz, Cámara y encuadre, Materiales, Sonido y música, Producción). Cada tarjeta abre un diálogo con **todas** sus referencias, y cada referencia trae imagen, **Qué es / Qué cojo / Dónde aplica**.
   - Una categoría sin referencias pone "Por documentar" y no se abre.
   - Para añadir una referencia, se añade un objeto a su `items`.
3. **Antes y después** (`antesDespues`): comparadores con una línea que se arrastra (ratón, dedo o flechas del teclado). Cada uno lleva imagen de `antes`, de `despues`, título y texto.
4. **Pipeline** (`pipeline`): 8 pasos (Guion · Previz · Modelado · Rig · Look dev · Animación · Render · Post), cada uno con su estado.
5. **Archivo completo, plegado** (`archivo`): WIPs (`wips`), versiones antiguas (`versiones`, ahora las tres del shader de las ventanas) y fallos (`fallos`, los tres reales de S01).
6. **Volver a la Portada.**

### V · Personajes (fase 2, sin construir)

Ya está en `src/data/sitio.js` con `activa: false`. Para activarla:

1. Crear `src/pages/personajes.astro`, copiando la estructura de otra página: `<Base id="personajes">`, el contenido y `<Siguiente actual="personajes" />`.
2. Poner `activa: true` en su entrada de `sitio.js`.

El menú, la numeración y los enlaces "Siguiente" se recalculan solos: Proceso pasaría a llevar a Personajes, y Personajes volvería a la Portada.

---

## 5. Componentes (`src/components/`)

| Componente | Qué hace |
|---|---|
| `Imagen.astro` | Imagen real o placeholder. Props: `imagen` (`{ src, alt, falta }`), `ratio`, `ver` (ampliable), `grupo` (se recorren con flechas), `pie`, `oscuro` |
| `Tarjeta.astro` | Tarjeta con doble filete y escuadras. Props: `marmol`, `href`, `inclinar`, `etiqueta`, `posicion` (qué trozo de mármol se ve) |
| `Grieta.astro` | Divisor de grieta dorada. Prop: `semilla` |
| `Greca.astro` | Banda de meandro. Prop: `ancho` (px o `'total'`) |
| `Spoiler.astro` | Cartel negro que tapa su contenido. Props: `activo`, `semilla`, `texto`, `descripcion` |
| `AntesDespues.astro` | Comparador. Props: `antes`, `despues`, `titulo`, `ratio` |
| `TituloSeccion.astro` | Antetítulo + título de sección (`nivel` 1 para el título de página) |
| `Siguiente.astro` | Botón al final de cada página hacia la siguiente del menú |

### El formato de imagen, en todas partes

```js
{ src: null, alt: 'Descripción para lectores de pantalla.', falta: 'Texto que se ve mientras no hay imagen' }
```

Para poner la imagen real: copiar el archivo a `public/img/...` y cambiar `src: null` por `src: 'img/carpeta/archivo.webp'` (ruta **sin** barra al principio). Nada más.

---

## 6. Comportamiento común (`public/js/site.js`)

- **Menú** a pantalla completa (referencia: peryton-film.com). La mitad de mármol baja y la lista sube a la vez; las páginas aparecen escalonadas. La actual sale en rojo con "Estás aquí" y una línea dorada.
  - Se cierra con el botón (que pasa a "Cerrar" y a una X), con Esc o eligiendo página.
  - Mientras está abierto, el resto de la página queda `inert` y el foco no sale del menú.
  - En móvil el mármol queda arriba y la lista debajo.
- **Cortina entre páginas.** Al pulsar un enlace interno sube una cortina crema con el número y el nombre de la página de destino. En la página nueva, la cortina se retira hacia arriba.
- **Aparición al hacer scroll.** Los elementos con `data-revelar` suben y aparecen al entrar en pantalla. Las grietas avanzan.
- **Inclinación 3D** de las tarjetas con `data-inclinar` (solo con ratón).
- **Visor** (`<dialog>`) para imágenes, placeholders y el vídeo. Crece desde el elemento pulsado, con el fondo oscurecido y desenfocado. Se recorre con flechas y se cierra con Esc, con el botón o con un clic fuera.
- **Diálogos** de referencias: `data-abrir-dialogo="id"` / `data-cerrar-dialogo`.

### Accesibilidad

- `lang="es"` y enlace "Saltar al contenido".
- Foco visible en rojo y menú y visor manejables con teclado.
- Textos alternativos en todas las imágenes.
- Spoilers `inert` mientras están tapados.
- Contrastes AA y el oro nunca como texto.
- **Movimiento reducido:** si el sistema lo pide, se quitan las animaciones y la intro se reduce a un fundido.

---

## 7. Publicar y plan B

- **Vercel:** proyecto `serie-marmol`, enlazado al repositorio de GitHub. Cada `git push` despliega solo. El build es `npm run build` y la salida es `dist/`.
- **Plan B (USB):** `npm run build` y copiar la carpeta `dist/` entera al USB. Se abre con doble clic en `dist/index.html`. Funciona sin internet, con fuentes, imágenes y vídeo incluidos (comprobado en Chrome desde `file://`).
- **Tamaño del vídeo:** Vercel admite archivos estáticos grandes, pero conviene exportar el MP4 en H.264 1080p (1920×817 en 2.35:1) a unos 8–10 Mbps. Para 30 s son unos 30–40 MB.

---

## 8. Assets pendientes

Formato recomendado: **WebP** (o JPG) calidad ~85. Renders con el mismo nombre que aquí → no hay que tocar código salvo cambiar `src: null` por la ruta.

| # | Qué | Proporción / tamaño | Archivo sugerido | Dónde se pone |
|---|---|---|---|---|
| 1 | Render final del título tallado (pondrá "Proyecto Mármol" por ahora) | 16:9 · 2560×1440 | `img/portada/hero.webp` | se sobrescribe |
| 2 | Mismo render en vertical, para móvil | 4:5 · 1080×1350 | `img/portada/hero-movil.webp` | se sobrescribe y `ratioMovil: 0.8` |
| 3 | *(Opcional)* el hero en 3 capas con transparencia: fondo, losa, cincel | 16:9 cada una | `img/portada/capa-*.webp` | `portada.hero.capas` |
| 4 | Textura plana del mármol del hero (render cenital del material, sin luz dramática) | 2000×1500 o mayor | `img/marmol/marmol.webp` | se sobrescribe |
| 5–8 | 4 fotogramas del prólogo: Creador de espaldas ante la ventana · sus ojos · la criatura en el bosque · la jaula en la bodega | 16:9 | `img/portada/prologo-1..4.webp` | `portada.fotogramas[i].imagen.src` |
| 9–11 | Imágenes de las 3 tarjetas de acceso (Teaser, Historia, Proceso) | 4:3 | `img/portada/acceso-*.webp` | `portada.accesos[i].imagen.src` |
| 12 | Render del autor, estética estatua/calavera | 3:4 vertical | `img/portada/autor.webp` | `portada.autor.imagen.src` |
| 13 | **Teaser** en MP4 (H.264, 2.35:1, créditos dentro) | 1920×817 | `video/teaser.mp4` | `teaser.video.src` |
| 14 | Póster del teaser (fotograma antes de pulsar play) | 2.35:1 | `img/teaser/poster.webp` | `teaser.video.poster` |
| 15–20 | Fotogramas clave: planos 1, 2b, 7, 8 y la pareja 4 + 6 | 2.35:1 | `img/teaser/plano-*.webp` | `teaser.fotogramas` y `teaser.rima` |
| 21 | Imagen clave de la premisa | 4:5 | `img/historia/premisa.webp` | `historia.premisa.imagen.src` |
| 22–27 | Una imagen por parte (I–VI); la descripción de cada una está en su placeholder | 4:3 | `img/historia/parte-1..6.webp` | `historia.partes[i].imagen.src` |
| 28 | Capturas para la línea de tiempo: notas de Obsidian, grafo, storyboard | 16:10 | `img/proceso/...` | `proceso.bloques[i].capturas` |
| 29 | Registros S03 en adelante (o decirme qué se hizo cada semana) | texto | — | `proceso.bloques[i].semanas[j]` |
| 30 | Imágenes de referencias (`criatura_estatuaria_01..04`, `taller_portal_01`, ficha de incompetech...) y las categorías vacías (Color y luz, Cámara y encuadre) | 4:3 | `img/referencias/...` | `proceso.referencias` |
| 31 | Pares antes/después: portal v1 → v3, blockout → render, criatura | 16:9 | `img/proceso/antes-*.webp`, `despues-*.webp` | `proceso.antesDespues` |
| 32 | WIPs y versiones antiguas (capturas de Blender) | 16:10 | `img/proceso/wip-*.webp` | `proceso.archivo` |
| 33 | Música definitiva y su crédito CC BY | texto | — | `teaser.ficha` (Música) |
| 34 | Título definitivo de la serie, si cambia | texto | — | `sitio.js`, `portada.js` |

---

## 9. Decisiones tomadas (y de dónde salen)

- Spoilers en las partes **III a VI** y el final (manda el prompt; la nota de Obsidian decía IV a VI).
- Bienvenida "Bienvenido a Proyecto Mármol"; la serie se nombra "Serie Mármol (título provisional)".
- Frase gancho: "Él las talló perfectas. Nunca bajó a mirar."
- La intro solo sale al recargar o al entrar por primera vez.
- Menú: mármol a un lado con una placa de museo, y la lista en números romanos.
- Ornamentos: grecas finas y escuadras tipo karma-tracks (las esquineras Art Déco de la referencia tenían marca de agua y no son grecorromanas).
- Animación de nivel medio: aparición al hacer scroll, parallax del hero, inclinación de tarjetas, grietas doradas y cortina entre páginas. Sin 3D en tiempo real; un visor `.glb` encajaría en la página de Personajes.
- Tipografía elegida: Cinzel + EB Garamond.
- Pipeline de 8 pasos, que refleja la previz antes del modelado y el look dev antes de animar.
- No se incluyen las referencias descartadas.
- La imagen de Billelis (busto con calavera) es solo referencia: no aparece en la web.
