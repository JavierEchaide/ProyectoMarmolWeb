# Web · Proyecto Mármol — nota técnica

Documento de referencia de la web del Proyecto Final Mármol (Javier Echaide, Animación 3D, Juegos y Entornos Interactivos, 2026–2027). Explica **qué hay, cómo está hecho por dentro, cómo se prueba, por qué se decidió cada cosa y dónde se mete cada asset**. Está escrita para que, en un chat nuevo, baste con leerla (y el código) para seguir trabajando sin repetir errores ya resueltos.

- **Web:** https://proyectomarmol.vercel.app
- **Repositorio:** https://github.com/JavierEchaide/ProyectoMarmolWeb (rama publicada: `main`)
- **Copia en Obsidian:** "Web - Documentación técnica - Proyecto Final Mármol". Si no coinciden, manda esta.
- **Lo que falta por entregar (assets):** [apartado 10](#10-assets-pendientes-y-checklist-de-entrega), también en la nota de Obsidian "Web - Pendiente de Javi - Proyecto Final Mármol".

## Índice

0. Cómo retomar el trabajo en un chat nuevo
1. Resumen rápido
2. Cómo está montada
3. Sistema visual
4. Páginas: qué tiene cada una y dónde se edita
5. Componentes
6. Comportamiento común
7. Cómo funciona por dentro (cada motor, con sus números)
8. Pruebas
9. Publicar, plan B y flujo de git
10. Assets pendientes y checklist de entrega
11. Cómo se hizo: historia del proyecto
12. Decisiones tomadas (y lo que se probó y se quitó)
13. Problemas encontrados y cómo se resolvieron
14. Ideas propuestas que no se han aplicado

---

## 0. Cómo retomar el trabajo en un chat nuevo

### Mensaje para empezar

> Trabajo en la web de mi Proyecto Final Mármol (repo `JavierEchaide/ProyectoMarmolWeb`). Lee entera `NOTA-WEB.md` antes de tocar nada: explica cómo está hecha, cómo se prueba y qué cosas ya se descartaron. Quiero [lo que sea].

### Cómo trabajar con Javi (aprendido en las rondas anteriores)

- **Todo en español**: respuestas, comentarios del código, textos de la web y mensajes de commit.
- **Hacer solo lo que pide.** Las cosas añadidas sin pedirlas (sala de cine, ojos que siguen al cursor, cursor de cincel...) acabaron quitándose, y además daban fallos. Si una idea parece buena, se **propone**, no se mete.
- **Cuando pide "dame una lista antes de hacerlo"**, se entrega una lista numerada de cambios con el porqué de cada uno, y **se espera a que diga cuáles**. Suele responder "Aplica: 1, 2, 5...".
- **Probar antes de subir.** Pasar las pruebas del apartado 8 y mirar capturas en ordenador y en móvil. No dar algo por hecho sin haberlo visto.
- **Publicar en `main` solo cuando lo dice** ("publícalo", "súbelo", "sí"). Mientras, los cambios van a la rama de trabajo.
- **Respuestas cortas y claras:** qué se ha cambiado, qué se ha comprobado y qué falta por su parte. Si algo no se ha podido comprobar (por ejemplo, la web publicada en Vercel), decirlo.
- Valora mucho: referencias reales (Awwwards, museos), animaciones con sentido para la historia (grietas, oro, kintsugi), móvil que funcione bien y que no haya fallos.

### Cosas del entorno (Claude Code en la nube)

- La red del entorno **bloquea casi todas las webs de referencia** (awwwards.com, godly.website, karma-tracks.com, barmat.pt...) y también la web publicada. La búsqueda web sí funciona. Para navegarlas de verdad hay que añadir los dominios en la configuración del entorno: *Network access → Allowed domains*.
- No hay tarjeta gráfica: el busto 3D se renderiza por software a unos 5 fps y alguna prueba larga con WebGL puede cerrar el navegador. En un ordenador normal va fluido.
- Chromium y Playwright vienen instalados (apartado 8).
- La nota de Obsidian del proyecto está en el Drive del vault: "Web - Proyecto Final Mármol" (decisiones y referencias de Javi), más esta documentación técnica y "Web - Pendiente de Javi".

---

## 1. Resumen rápido

| Qué | Cómo |
|---|---|
| Páginas | Portada · Teaser · Historia · Proceso, más una 404 propia (Personajes preparada, desactivada) |
| Tecnología | [Astro 5](https://astro.build) genera HTML estático. CSS y JavaScript propios; three.js solo para el busto 3D |
| Contenido | Todo en `src/data/*.js`, separado del diseño |
| Imágenes | Si una imagen no existe, sale un placeholder con el texto de lo que falta |
| Alojamiento | Vercel (`proyectomarmol.vercel.app`), se publica al hacer push a `main` |
| Plan B | `dist/` copiado a un USB abre con doble clic en `index.html`, sin internet ni servidor |

### Comandos

```bash
npm install        # una vez, instala Astro, three.js y esbuild
npm run dev        # servidor de desarrollo en http://localhost:4321
npm run build      # empaqueta el busto, genera dist/ y comprueba que todas las rutas son relativas
npm run preview    # sirve dist/ para revisarlo
npm run 3d         # solo reempaqueta el busto (src/3d/busto.js → public/js/busto.js)
sh pruebas/todas.sh   # pasa las pruebas automáticas contra dist/ (ver apartado 8)
```

> En `npm run dev` los enlaces entre páginas apuntan a `teaser.html`, `historia.html`... Para revisar la navegación completa es más fiable `npm run build` + `npm run preview`.

---

## 2. Cómo está montada

```
ProyectoMarmolWeb/
├── astro.config.mjs          configuración (salida en archivos .html sueltos)
├── vercel.json               fija el build (npm run build) y la salida (dist)
├── NOTA-WEB.md               esta nota
├── public/                   se copia tal cual a dist/
│   ├── css/site.css          TODO el estilo (índice al principio del archivo)
│   ├── js/site.js            menú, cabecera, transición entre páginas, apariciones, visor, diálogos
│   ├── js/grietas.js         motor de grietas: geometría, roturas en esquirlas y divisores de oro
│   ├── js/portada.js         intro, parallax del hero, cartas flotantes y carga diferida del busto
│   ├── js/teaser.js          reproductor del teaser (usa el visor común)
│   ├── js/historia.js        SPOILER que se rompen, cabecera con ventana y veta de las seis partes
│   ├── js/tallado.js         filetes de las tarjetas y grecas que se dibujan solos
│   ├── js/busto.js           GENERADO: el busto 3D con three.js (no editar; ver src/3d/busto.js)
│   ├── js/proceso.js         comparadores antes/después y bloques que se despliegan animados
│   ├── fonts/                Cinzel y EB Garamond (woff2, autoalojadas)
│   ├── img/                  imágenes (ver "Assets pendientes"); img/grano.png es el grano del crema
│   ├── video/                aquí irá teaser.mp4
│   └── favicon.svg
├── pruebas/                  pruebas automáticas con Playwright (apartado 8)
├── scripts/
│   ├── relativizar.mjs       se ejecuta tras el build: falla si hay rutas absolutas
│   ├── construir-3d.mjs      empaqueta src/3d/busto.js con three.js en public/js/busto.js
│   ├── generar-marmol.py     texturas PROVISIONALES: mármoles, piedra negra y piedras de las cartas
│   └── generar-grano.py      img/grano.png (el grano de papel/piedra del crema)
└── src/
    ├── data/                 ← CONTENIDO. Aquí se edita casi todo
    │   ├── sitio.js          nombre, autor, lista de páginas del menú (y sus números romanos)
    │   ├── portada.js
    │   ├── teaser.js
    │   ├── historia.js
    │   └── proceso.js
    ├── layouts/Base.astro    <head>, cabecera, menú, cortina, visor y pie (común)
    ├── components/           piezas reutilizables (ver apartado 5)
    ├── lib/grietas.js        grieta plana de los divisores para cuando no hay JavaScript
    ├── 3d/busto.js           el busto que se abre en "Hecho por" (three.js)
    └── pages/                una por página: index, teaser, historia, proceso y 404
```

### Por qué así

- **Astro** solo se usa para generar HTML: compone las páginas a partir de componentes y de los archivos de datos. El resultado (`dist/`) es HTML + CSS + JS normales, sin nada que se ejecute en un servidor. `build.format: 'file'` hace que cada página sea un `.html` en la raíz (`teaser.html`), no una carpeta.
- **Sin librerías de animación** (ni GSAP). Todo es CSS, Web Animations API (`el.animate`) y JavaScript propio, salvo el busto 3D de "Hecho por", que usa **three.js**.
- **three.js se empaqueta con esbuild** en un script clásico (formato IIFE) en `public/js/busto.js`, que está subido al repositorio. Se regenera solo con `npm run build`, `npm run dev` o `npm run 3d`. Solo se descarga cuando el visitante se acerca a esa sección (unos 150 KB comprimido).
- **Rutas relativas y JavaScript "clásico"** (sin `type="module"`): es lo que permite abrir la web desde un USB con doble clic. Los módulos de JavaScript y las rutas que empiezan por `/` no funcionan en `file://`. `scripts/relativizar.mjs` lo comprueba en cada build: si encuentra `href="/algo"` o `src="/algo"`, el build falla.
- **Fuentes autoalojadas** en `public/fonts/` (licencia OFL): no dependen de Google Fonts ni de internet.
- **Nada guarda datos:** no hay cookies ni almacenamiento, salvo una marca temporal en `sessionStorage` para saber si se llega desde otra página de la web (ver Intro).
- **Todo funciona sin JavaScript:** el contenido se ve, los `<details>` se abren y los divisores son una grieta plana. El JavaScript añade movimiento. La clase `js` en `<html>` (la pone el script del `<head>`) permite preparar estados iniciales solo cuando hay JS.

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
| `--linea` | `#A39A90` | Divisores y filetes de tinta |
| `--superficie` | `#E7E6D6` | Placeholders y bandas |
| `--negro` | `#0D0D0D` | Cartel SPOILER, fondo del teaser, salas oscuras, visor. Sale de la paleta del Canva |

Un solo tema claro. No hay modo oscuro. La paleta viene de la nota de Obsidian (mármol **Rosso Levanto**: blanco dominante, rojo secundario, oro en detalles).

### Tipografía

- **Títulos:** Cinzel (mayúsculas de inscripción romana, tipo Trajano).
- **Texto:** EB Garamond (Garamond clásica, normal y cursiva).
- Ambas cubren tildes, eñes, ¿ ¡ y comillas. Las flechas de los botones son SVG porque el subconjunto latino de las fuentes no trae `→`.
- **Seis tamaños y nada por debajo de 13 px**, como variables en `:root`: `--t-display` (títulos de página, menú, intro), `--t-h2` (secciones), `--t-h3` (tarjetas), `--t-texto` (texto corrido), `--t-pequeno` (pies y secundario, 17 px) y `--t-etiqueta` (etiquetas en mayúsculas, 13 px). Para un texto nuevo se usa una de estas, no un tamaño suelto.

### Curvas de animación

- `--curva` = `cubic-bezier(0.65, 0, 0.35, 1)`: entra y sale suave, para cosas que van y vuelven (menú, flechas, cierres).
- `--curva-salida` = `cubic-bezier(0.16, 1, 0.3, 1)`: arranca rápido y frena largo, para apariciones y para lo que responde al usuario (hover, abrir).
- Las caídas físicas (esquirlas) aceleran como un objeto que cae, no frenan.

### Mármol

Solo en tres sitios: el hero de la Portada (el render), la mitad izquierda del menú y la cabecera de Historia.

| Variable | Archivo | Dónde |
|---|---|---|
| `--marmol` | `img/marmol/marmol.webp` | menú (y el hero es el render) |
| `--marmol-marco` | `img/marmol/marmol-marco.webp` | cabecera de Historia y tarjetas con `marmol` (ya no se usa en las partes) |
| `--piedra` | `img/marmol/piedra-negra.webp` | losas de SPOILER (negro con grano, sin vetas) |
| — | `img/marmol/carta-negra/rosso/dorada.webp` | la piedra que se mueve dentro de las cartas de la Portada |

**Las texturas son provisionales y salen de código** (`python3 scripts/generar-marmol.py`, ruido de valor con vetas). Cuando llegue la textura real de Blender, se sobrescribe el archivo con el mismo nombre y no hay que tocar nada más.

### Ornamentos

- **Grietas doradas (kintsugi):** divisores entre secciones (`Grieta.astro` + `js/grietas.js`). Cada una sale de una "semilla" (número), así que todas son distintas pero estables. Es el concepto de la serie: la corrupción se sana con oro y la grieta se sigue viendo.
  - Se dibujan en el navegador al tamaño real del divisor, como una costura de kintsugi en piedra: casi recta, con quiebros finos y alguna mella donde el oro se ensancha. Salen 1-2 ramas cortas de oro y varias fisuras finas oscuras sin reparar, y los extremos se desvanecen. El oro cambia de tono a lo largo, como el metal batido; debajo lleva un filo de sombra y encima un filo de luz.
  - **Se abren con el scroll:** una chispa recorre la grieta mientras bajas. Al completarse, un brillo la recorre una vez. Nunca retrocede.
  - Sin JavaScript se ve una grieta plana (la de `src/lib/grietas.js`).
- **Greca (meandro griego):** banda dorada en el pie, la placa del menú y la vitrina del autor (`Greca.astro`). Patrones definidos en `Base.astro`: `#greca` (pequeña) y `#greca-banda` (la del pie, más grande y entre dos líneas; a 14 px se leía como una fila de cuadraditos).
- **Tarjetas** (referencia: karma-tracks.com): doble filete dorado y escuadras con un rombo en cada esquina (`Tarjeta.astro`). Variante `sobria`, con un filete fino de tinta y sin escuadras (pipeline). Variante `marmol`, con marco de mármol.
- **Dónde va el oro:** solo donde significa algo: cartas de la Portada, tarjetas de Historia, la veta de las seis partes, los SPOILER, los divisores, el "estás aquí" del menú y la línea de los antes/después. La ficha técnica, la pipeline y el marco de los antes/después van en tinta.
- **Grano:** el crema lleva un grano muy suave de papel o piedra (`img/grano.png`, variable `--grano`), en el fondo, la cabecera y las tarjetas. Se regenera con `python3 scripts/generar-grano.py`.
- **Rótulo de sala:** las cabeceras de Teaser, Historia, Proceso y la 404 llevan "Sala II" encima y el número en romanos grande y hueco (`-webkit-text-stroke`) delante del título (`TituloSeccion` con `numero`). El número sale de `sitio.js`.
- **Pies de foto como cartelas:** filete corto encima, número en Cinzel y descripción en cursiva, iguales en Portada, Teaser y Proceso.

---

## 4. Páginas: qué tiene cada una y dónde se edita

### I · Portada — `src/pages/index.astro` + `src/data/portada.js`

1. **Intro** (`portada.intro`). Pantalla crema con "Bienvenido a" y "Proyecto Mármol" letra a letra (en móvil, una palabra por línea). A los 2 s se abre en dos mitades, como una cortina (referencia: barmat.pt), y descubre el hero. Dura 2,9 s y se salta con un clic o una tecla.
   - **Cuándo sale:** al recargar la Portada o al entrar por primera vez (escribiendo la dirección o desde un enlace externo). **No** sale al llegar desde el menú o desde otra página de la web, ni al volver con "atrás". Ver apartado 7.4.
   - Con "reducir movimiento" activado en el sistema, la intro es un fundido corto.
2. **Hero** (`portada.hero`). Render del título tallado. El texto real está oculto en un `<h1>` para lectores de pantalla.
   - `escritorio`: 16:9. `movil`: versión para móviles, con su proporción en `ratioMovil` (1 = cuadrado, 0.8 = 4:5).
   - **Parallax:** la imagen baja más despacio que el scroll y se mueve un poco con el ratón.
   - **Por capas:** si se rellena `capas` (fondo / losa / cincel con transparencia), cada capa se mueve según su `profundidad`. El ejemplo está comentado en `portada.js`.
   - **Vídeo en bucle:** si se rellena `video` (MP4/WebM de 3-5 s sin sonido), se ve en lugar de la imagen, con la imagen de escritorio como póster. Con "reducir movimiento" se queda quieto.
3. **Presentación**: frase gancho (`gancho`, cada frase en su línea y la segunda en rojo), dos párrafos (`presentacion`) y botón **Entrar**, que lleva al Teaser.
4. **La historia en cuatro fotogramas** (`fotogramas`): 4 en fila en escritorio y 2×2 en móvil, con pie de cartela. Al pasar el ratón aparece "Ver" y al pulsar se amplían en el visor; se recorren con las flechas.
5. **Las páginas** (`accesos`): sala oscura con tres cartas que **flotan en 3D** (referencia: karma-tracks). Cada una está a una profundidad y un ángulo distintos, se balancea sola y, con ratón, se desplaza por capas y gira hacia el cursor (apartado 7.7).
   - Por dentro, una piedra que se mueve despacio (`piedra`: `'negra'`, `'rosso'` o `'dorada'`).
   - Si una carta tiene imagen (`imagen.src`), se ve la imagen en lugar de la piedra.
   - Al pasar el ratón (o con el foco del teclado) la carta se adelanta, el filete brilla, la piedra se aclara y las otras dos se apagan.
   - Cada carta lleva "Sala II/III/IV", el dato (`subtitulo`) y una frase (`frase`).
6. **Hecho por** (`autor`): sala oscura con un **busto 3D que se abre al bajar** (referencia: Billelis). La escena se queda fija mientras se recorre la sección (230vh); tu nombre va enorme detrás, y a la derecha va la cartela con estudios y curso.
   - Ahora son tres esferas provisionales: el casquete y la base son de mármol blanco, partidos por una rotura irregular con una costura de oro; en medio está el hueso, de bronce con pátina verde y vetas de oro que se encienden al abrirse.
   - Con el ratón la cabeza gira un poco. Con "reducir movimiento" se queda quieta y medio abierta.
   - **Para poner el modelo real:** un `.glb` con tres objetos llamados exactamente `arriba`, `hueso` y `abajo`, centrados en el origen y de 1 unidad de radio más o menos (como una esfera de 1 m en Blender). Se copia a `public/modelos/busto.glb` y se pone `modelo: 'modelos/busto.glb'` en `portada.autor`. Cada pieza sustituye a su esfera y se mueve igual. Conviene que pese menos de 5 MB (Decimate y texturas de 2K).
   - Ojo: desde el USB (`file://`) el navegador no deja cargar archivos `.glb`, así que ahí se verían las esferas. En la web publicada se ve el modelo.
   - Si el navegador no puede mostrar 3D, se ve la imagen del autor (`autor.imagen`).
7. **Siguiente: II · Teaser.**

### II · Teaser — `src/pages/teaser.astro` + `src/data/teaser.js`

1. **Reproductor** a ancho completo en 2.35:1 sobre una banda negra. **Nunca arranca solo.** Al pulsar play crece hasta una ventana grande con el fondo oscurecido y desenfocado, y el vídeo empieza con sonido (`js/teaser.js` usa el visor común; referencia: a24.raviklaassens.com).
   - `video.src`: ruta del MP4 (`'video/teaser.mp4'`). Mientras sea `null`, al pulsar sale "Vídeo pendiente" y en el hueco pone `video.falta`.
   - `video.poster`: fotograma que se ve antes de pulsar.
   - Los créditos van dentro del propio vídeo. No hay página de créditos.
2. **Sinopsis** (`sinopsis`). Describe sin explicar, para no destapar la parte III de la historia (que venerar a las criaturas también las rompe).
3. **Ficha técnica** (`ficha`): Duración · Hecho con · Formato · Música, como la cartela de una pieza de museo (`<dl>`: dato a la izquierda, valor a la derecha, filetes finos). La música pone "A decidir"; cuando se elija, se cambian las dos líneas.
4. **Fotogramas clave** (`fotogramas`): planos 1, 2b, 7 y 8, en 2.35:1 y en 2 × 2 grandes, ampliables.
5. **La rima** (`rima`): los planos 4 y 6 (ojos de la pura y de la corrupta, mismo encuadre) juntos, con una línea que lo explica.
6. **Siguiente: III · Historia.**

### III · Historia — `src/pages/historia.astro` + `src/data/historia.js`

Textos escritos a partir de "Lore - Biblia completa", "Estructura narrativa - Partes y temporadas" y "El Protagonista".

0. **Cabecera con ventanas** (`ventana`): una losa de mármol con el título, el lema ("Las criaturas no nacen: se tallan.") y una pista en una cartela crema de doble filete dorado, como la de un museo, que flota sobre la losa con sombra. Al pasar el cursor se abre en el mármol un rasgón vertical con borde de luz dorada por el que se ve otro mundo, como las ventanas del taller del teaser. Sin ratón, la ventana pasea sola. Ahora el otro mundo es un cielo provisional; el render va en `historia.ventana.src`.
1. **Premisa** (`premisa`): siempre visible, con imagen clave (4:5) y capitular roja.
2. **Las seis partes** (`partes`): tarjetas crema con doble filete dorado, cada una con número, imagen, título y párrafo.
   - `spoiler: true` las tapa con una losa de piedra negra que pone **SPOILER**. Ahora están tapadas la III, la IV, la V y la VI. La I y la II se ven siempre.
   - Mientras está tapado, el contenido es `inert` (no se lee, no se selecciona y no se enfoca con el teclado) y el bloque se queda a una altura fija (4:3; el final, 2:1), en vez de ocupar lo que mide el texto escondido.
   - **El SPOILER** (apartado 7.2): con ratón se inclina un poco y tiene un reflejo que lo sigue; al pasar por encima le sale una fisura. Al pulsarlo se agrieta en oro de lado a lado, se abre y se rompe en unas 14-20 esquirlas que caen girando en perspectiva mientras el bloque crece hasta la altura del texto. Dura 2 s. Con "reducir movimiento" solo se destapa.
   - El botón **Mostrar todos** destapa todo de una vez y pasa a **Volver a taparlos**. Al recargar la página vuelven a estar tapados: no se guarda nada.
   - **La veta cuenta el arco sin texto** (apartado 7.6): las seis partes van en zigzag a los dos lados de una veta vertical (en móvil, la veta va a la izquierda y las tarjetas en una columna). Cada parte cuelga de un rombo con su número. La veta se dibuja con el scroll en tres tramos: I-II, una línea gris fina (la criatura pura); III-IV, una grieta oscura con ramas (la corrupción); V-VI, la grieta rellena de oro (la sanación, kintsugi). Los rombos cambian de color con su tramo.
3. **El final** (`final`): bloque ancho tapado con "SPOILER · EL FINAL", con dos párrafos y la cita del tema de la serie.
4. **Siguiente: IV · Proceso.**

### IV · Proceso — `src/pages/proceso.astro` + `src/data/proceso.js`

Datos sacados de "Proyecto Final Mármol - Proyecto" (calendario y pipeline), "Registro S01" y "Registro S02", y las notas de Referencias.

0. **Avance**, junto a la intro: la semana actual en grande, una barra de 35 semanas (oro = hecha, rojo = en curso), qué se está haciendo ahora y el próximo hito (la próxima semana cuyo plan dice "evaluación"). **Sale solo de los estados de las semanas**: no hay que tocarlo.
1. **Línea de tiempo S01–S35** (`bloques`): los 7 bloques reales de la pipeline (Cimientos, Previz, Assets, Look dev, Animación, Render, Post y entrega). Cada uno se despliega **animado** (apartado 7.10; sin JS sigue funcionando como `<details>`) y enseña:
   - el objetivo,
   - cada semana con su plan y su **estado**: `'hecho'`, `'en-curso'` o `'pendiente'`. El estado del bloque se calcula solo,
   - lo que se hizo (`registro`: una lista de frases),
   - capturas opcionales (`capturas`: "Mis notas de Obsidian", "Grafo del proyecto", "Storyboard"...).
   - **Para actualizar una semana:** cambiar su `estado` y rellenar su `registro`.
2. **Referencias** (`referencias`): 7 categorías (Personajes, Sets, Color y luz, Cámara y encuadre, Materiales, Sonido y música, Producción), en un índice de dos columnas con miniatura y los nombres de sus referencias. Cada fila abre un diálogo con **todas** sus referencias, y cada referencia trae imagen, **Qué es / Qué cojo / Dónde aplica**.
   - Una categoría sin referencias pone "Por documentar" y no se abre.
   - Para añadir una referencia, se añade un objeto a su `items`.
3. **Antes y después** (`antesDespues`): comparadores con una línea que se arrastra (ratón, dedo o flechas del teclado). Cada uno lleva imagen de `antes`, de `despues`, título y texto.
4. **Pipeline** (`pipeline`): 8 pasos (Guion · Previz · Modelado · Rig · Look dev · Animación · Render · Post), numerados en romanos (I-VIII), cada uno con su estado, en tarjetas sobrias.
5. **Archivo completo, plegado** (`archivo`): WIPs (`wips`), versiones antiguas (`versiones`, ahora las tres del shader de las ventanas) y fallos (`fallos`, los tres reales de S01). También se despliega animado.
6. **Volver a la Portada.**

### 404 · Sala vacía — `src/pages/404.astro`

"CDIV Sala vacía" (404 en romanos), una frase, botón **Volver a la Portada** y la lista de las cuatro salas. Vercel la sirve en cualquier dirección que no exista. Lleva `<base href="/">` (prop `base` de `Base.astro`) para que los estilos carguen también en direcciones como `/algo/mal/escrito`, y `noindex`. No sale en el menú: se le pasa a `Base` una página propia (prop `pagina`) que no está en `sitio.js`.

### V · Personajes (fase 2, sin construir)

Ya está en `src/data/sitio.js` con `activa: false`. Para activarla:

1. Crear `src/pages/personajes.astro`, copiando la estructura de otra página: `<Base id="personajes">`, el contenido y `<Siguiente actual="personajes" />`.
2. Poner `activa: true` en su entrada de `sitio.js`.

El menú, la numeración y los enlaces "Siguiente" se recalculan solos: Proceso pasaría a llevar a Personajes, y Personajes volvería a la Portada. Un visor `.glb` de las criaturas encajaría aquí.

---

## 5. Componentes (`src/components/`)

| Componente | Qué hace |
|---|---|
| `Imagen.astro` | Imagen real o placeholder. Props: `imagen` (`{ src, alt, falta }`), `ratio`, `ver` (ampliable), `grupo` (se recorren con flechas), `pie`, `oscuro` |
| `Tarjeta.astro` | Tarjeta con doble filete y escuadras. Props: `marmol`, `sobria`, `href`, `etiqueta`, `clase`, `posicion` (qué trozo de mármol se ve) |
| `Grieta.astro` | Divisor de grieta dorada (la rehace `js/grietas.js`). Prop: `semilla` |
| `Greca.astro` | Banda de meandro. Prop: `ancho` (px o `'total'`) |
| `Spoiler.astro` | Losa negra que tapa su contenido y se rompe al pulsarla. Props: `activo`, `semilla` (forma de la rotura), `texto`, `descripcion`. La altura tapada se cambia con la variable CSS `--ratio-tapado` |
| `AntesDespues.astro` | Comparador. Props: `antes`, `despues`, `titulo`, `ratio` |
| `TituloSeccion.astro` | Antetítulo + título de sección. Props: `antetitulo`, `titulo`, `id`, `nivel` (1 para el título de página), `centrado`, `numero` (rótulo de sala) |
| `Siguiente.astro` | Botón al final de cada página hacia la siguiente del menú |

`Base.astro` (layout) recibe: `id` (de `sitio.js`), `descripcion`, `scripts` (JS propio de la página), y solo para la 404 `base` y `pagina`.

### El formato de imagen, en todas partes

```js
{ src: null, alt: 'Descripción para lectores de pantalla.', falta: 'Texto que se ve mientras no hay imagen' }
```

Para poner la imagen real: copiar el archivo a `public/img/...` y cambiar `src: null` por `src: 'img/carpeta/archivo.webp'` (ruta **sin** barra al principio). Nada más.

---

## 6. Comportamiento común (`public/js/site.js`)

`site.js` está dividido en 5 bloques numerados: 1 Menú, 2 Transición, 3 Aparición, 4 Visor, 5 Diálogos.

- **Menú** a pantalla completa (referencia: peryton-film.com). La mitad de mármol baja y la lista sube a la vez; las páginas aparecen escalonadas. La actual sale en rojo con "Estás aquí" y una línea dorada.
  - Se cierra con el botón (que pasa a "Cerrar" y a una X), con Esc o eligiendo página.
  - Mientras está abierto, el resto de la página queda `inert` y el foco no sale del menú.
  - En móvil el mármol queda arriba y la lista debajo.
  - Va en `z-index: 50`. **Nada puede quedar por encima del menú** (la sala de cine que se probó lo tapaba).
- **Cabecera** sin filete: al bajar cambia a un fondo un poco más oscuro y se esconde; al subir vuelve. Así no tapa lo que se está leyendo.
- **Cortina entre páginas** (apartado 7.3). Al pulsar un enlace interno sube una placa de mármol con el número y el nombre de la página de destino. En la página nueva:
  - **En ordenador**, la placa **se agrieta en oro y cae en esquirlas**, con la página nueva en penumbra que se aclara. Dura algo más de 1 s.
  - **En móvil** (pantalla táctil o menos de 760 px), la placa simplemente sube y deja ver la página. Dura 0,8 s.
  - No bloquea: se puede hacer scroll mientras se va. Si algo fallara, la placa se retira sola a los 2,5 s.
- **Cursor normal** del sistema en toda la web.
- **Ornamentos que se dibujan** (`js/tallado.js`, referencia: heronaiapp): el doble filete dorado de las tarjetas se traza solo y después crecen las escuadras desde su esquina; las grecas se dibujan de izquierda a derecha. Los títulos aparecen con el resto del contenido, sin efecto propio.
- **Aparición al hacer scroll.** Los elementos con `data-revelar` suben y aparecen al entrar en pantalla (IntersectionObserver); sus imágenes se destapan de abajo arriba con un leve zoom de salida.
- **Hovers solo con ratón.** Todos los `:hover` van dentro de `@media (hover: hover) and (pointer: fine)`, así en móvil no se quedan "pegados" al tocar. El foco con teclado (`:focus-visible`) va aparte y funciona siempre. **Cualquier hover nuevo tiene que ir dentro de esa media query.**
- **Visor** (`<dialog>`) para imágenes, placeholders y el vídeo. Crece desde el elemento pulsado, con el fondo oscurecido y desenfocado. Se recorre con flechas y se cierra con Esc, con el botón o con un clic fuera.
- **Diálogos** de referencias: `data-abrir-dialogo="id"` / `data-cerrar-dialogo`.

### Accesibilidad

- `lang="es"` y enlace "Saltar al contenido".
- Foco visible en rojo; menú, visor, bloques y comparadores manejables con teclado.
- Textos alternativos en todas las imágenes.
- Spoilers `inert` mientras están tapados.
- Contrastes AA y el oro nunca como texto.
- **Movimiento reducido:** si el sistema lo pide (`prefers-reduced-motion`), cada script lo comprueba al empezar y se salta la animación; la intro se reduce a un fundido.
- Comprobado con axe-core en las cuatro páginas, ordenador y móvil: sin errores (apartado 8).

---

## 7. Cómo funciona por dentro

### 7.1 Motor de grietas (`public/js/grietas.js`)

Es la pieza central: lo usan los divisores, los SPOILER, la cortina entre páginas y la veta de Historia. Expone `window.marmolGrietas` con:

| Función | Qué hace |
|---|---|
| `aleatorio(semilla)` | Generador con semilla (mulberry32). Misma semilla → misma grieta siempre. El mismo algoritmo está en `src/lib/grietas.js` y en `src/3d/busto.js` |
| `trazado(puntos)` / `poligono(puntos)` | Convierten una lista de `[x, y]` en un `d` de SVG (abierto o cerrado) |
| `cinta(puntos, grosor)` | Convierte una línea quebrada en una cinta con grosor variable (`grosor(t)`, t de 0 a 1). Devuelve el contorno, un núcleo más fino pegado al borde que recibe la luz y ese borde |
| `horizontal(semilla, ancho, alto)` | Grieta de divisor: línea principal casi recta (quiebros cada 3-12 px, deriva lenta con dos senos, escalones bruscos de vez en cuando que se recuperan), 1-2 ramas de oro y 4-7 fisuras finas |
| `rotura(semilla, w, h)` | Rotura de una placa: punto de impacto, grietas radiales hasta los bordes y un anillo que las une. Devuelve también los polígonos de las esquirlas (dos por cada par de grietas: dentro y fuera del anillo) |
| `dibujar(svg, geo)` | Pinta las grietas de una rotura en tres pasadas (sombra, oro, luz) con `pathLength=1`, para animarlas con `stroke-dashoffset` en CSS |
| `esquirlas(contenedor, cara, geo, opciones)` | Rompe la placa: cada esquirla es **una copia de la cara recortada con `clip-path: polygon()`**. Primero se separan un poco del centro (asoma lo de detrás por las juntas) y luego caen girando en 3D. Retraso según la distancia al impacto. Opciones: `semilla`, `duracion`, `retraso`, `caida` |

**Divisores:** `construir()` crea un SVG al tamaño real en píxeles (32 px de alto, 26 en móvil; grosor máximo 2,4 px, 1,9 en móvil). Capas de abajo arriba: fisuras (trazo de tinta al 42 %), sombra (la forma desplazada 0,9 px abajo), oro (degradado horizontal con 13 paradas de tonos al azar entre `#9c741a` y `#e3c46a`), núcleo claro y filo de luz. Todo va dentro de una máscara con degradado que desvanece el 7 % de cada extremo, y de un `clipPath` cuyo rectángulo crece con el scroll. Progreso: empieza cuando el divisor asoma al 95 % de la altura de la pantalla y termina 45 % de pantalla después; nunca retrocede. Al llegar al final, un brillo blanco recorre el oro una vez (1,6 s). Se reconstruyen al cambiar el ancho de la ventana.

### 7.2 SPOILER (`Spoiler.astro` + `public/js/historia.js`, primer bloque)

- **Tapado:** el contenido lleva `inert` y el bloque tiene altura fija (`--ratio-tapado`, 4:3 o 2:1). Con ratón, la losa se inclina siguiendo el cursor (`--rx`, `--ry`) y el reflejo se mueve (`--mx`, `--my`). Al pasar por encima se prepara la geometría de la rotura y asoma una fisura.
- **Al pulsar** (`destapar`), con tiempos fijos:
  - 0 ms: la losa fija su tamaño en píxeles (para que las esquirlas no se estiren), la tarjeta pasa por encima de las vecinas (`tarjeta--encima`) y la cara da un "golpe" (`translateZ(-14px)`, 220 ms). Las grietas de oro se dibujan desde el impacto.
  - 430 ms: `esquirlas()` rompe la losa; la luz dorada sale del punto de impacto (`--cx`, `--cy`).
  - 720 ms: el contenido se abre (`inert` fuera) y el bloque anima su altura hasta la real.
  - 2100 ms: limpieza (se quitan las esquirlas y los tamaños fijos).
- **Volver a taparlos** (`tapar`) repone la losa: el bloque vuelve a su altura fija (600 ms) y la tapa reaparece bajando un poco desde arriba.
- **Importante:** el contenedor de las esquirlas es **plano** (sin `preserve-3d`) y lleva su propia `perspective`. Con `preserve-3d`, Chrome ordenaba las piezas por profundidad contra el resto de la página y algunas desaparecían a mitad de caída.

### 7.3 Cortina entre páginas (`site.js`, bloque 2, + script del `<head>` en `Base.astro`)

1. Al pulsar un enlace interno (`.html`, mismo sitio, sin teclas modificadoras), se guarda `marmol-transicion` en `sessionStorage`, se pone el texto de destino en la placa ("III · Historia") y `<html>` recibe `saliendo`: la placa sube y tapa la pantalla. A los 560 ms se navega.
2. En la página nueva, el script inline del `<head>` (se ejecuta antes de pintar) ve la marca, la borra y añade `entrando`: la placa ya está puesta desde el primer fotograma.
3. **Ordenador:** semilla al azar → `rotura()` al tamaño de la ventana → `dibujar()` las grietas (clase `agrietando`, dos `requestAnimationFrame` para que la transición arranque) → a los 360 ms `esquirlas()` (duración 1000 ms, caída 0,8) → a los 1300 ms se limpia.
4. **Móvil** (`(max-width: 760px), (pointer: coarse)`): clase `cortina--sube`, la placa se desliza hacia arriba en 0,7 s y a los 900 ms se limpia. Se hizo así porque unas veinte esquirlas a pantalla completa iban a tirones en móvil.
5. Respaldo: una animación CSS retira la placa a los 2,5 s pase lo que pase. Al volver con "atrás" desde la caché (`pageshow` con `persisted`), se quitan las clases.

### 7.4 Intro de la Portada (`Base.astro` + `portada.js`)

El script del `<head>` decide con `performance.getEntriesByType('navigation')[0].type` y la marca de `sessionStorage`: la intro (`intro-activa`) sale si la página es la Portada, no se llega con "atrás" (`back_forward`) y o no se viene de dentro de la web o es una recarga (`reload`). `portada.js` la retira al terminar (2,9 s) o al primer clic/tecla (fundido de 360 ms).

### 7.5 Ventana de la cabecera de Historia (`historia.js`, segundo bloque)

El rasgón es un polígono de 2 × 23 puntos (`N = 22` por lado), aplicado como `clip-path` a la capa del "otro mundo" y dibujado como borde de luz en un SVG. Perfil: `sin(πv)^0,75`, más ancho un poco por encima del centro, con dientes que cambian despacio (dos senos por punto con fases al azar; el array de fases mide `(N + 1) × 2`). Alto máximo 420 px u 82 % de la cabecera; ancho máximo 130 px o 16 %. Con ratón sigue al cursor con inercia (posición ×0,14 por fotograma, apertura ×0,1). Sin ratón pasea sola en una curva lenta. Solo se anima mientras la cabecera está en pantalla.

### 7.6 Veta de las seis partes (`historia.js`, tercer bloque)

- **Maquetación (CSS):** `.partes--arco` es una columna flex; las partes impares van a la izquierda y las pares a la derecha, con ancho `calc(50% - var(--hueco)/2)` y `margin-top: -220px` (a partir de la segunda) para el zigzag. El rombo (`.parte__nodo`, 40 px) se coloca sobre la veta. Por debajo de 900 px: veta a 15 px de la izquierda, tarjetas a ancho completo, rombos de 32 px.
- **Dibujo (JS):** `construir()` lee la x de la veta de la variable CSS `--veta-x` (si viene en `%`, la convierte con el ancho). Hace una línea quebrada de arriba abajo (`camino`: saltos de 14-36 px), la corta a la altura de la III (`partes[2].offsetTop + 44`) y de la V, y crea tres tramos: gris fino, oscuro con ramas y oro con ramas (`rama`). Cada tramo es un `path` con `pathLength=1`.
- **Scroll:** la "línea de lectura" está al 70 % de la altura de la pantalla. El progreso de cada tramo es lo que esa línea ha recorrido de él, y se aplica a `stroke-dashoffset`; las ramas empiezan a dibujarse a mitad de su tramo (`(p - 0.3) / 0.5`). Las clases `arco--fase-2` y `arco--fase-3` cambian el color de los rombos. Es reversible.
- Se reconstruye con un `ResizeObserver` cuando cambia el alto (al destapar spoilers) o el ancho. Con "reducir movimiento" todo se ve dibujado.

### 7.7 Cartas flotantes de "Las páginas" (`index.astro`, `portada.js`, CSS "Las páginas")

Cada carta tiene **cuatro capas**, cada una con un solo trabajo:

```
li.carta                 posición en el espacio (profundidad y ángulo propios, fijos)
└ a.carta__enlace        el enlace: un marco QUIETO. Es lo que recibe el ratón
  └ div.carta__capa      parallax con el ratón (portada.js: translate/rotate)
    └ div.carta__cara    balanceo continuo (animación CSS) + hover (transform)
      └ span.carta__textura   la piedra que se desplaza despacio
```

- **Por qué el enlace va quieto:** si el hover lo detecta algo que se mueve (que flota, se adelanta o sigue al ratón), en los bordes la carta se escapa del cursor, pierde el hover, vuelve y lo recupera en bucle: parpadea. Las reglas son `.carta__enlace:hover .carta__cara`.
- **Por qué el balanceo usa `translate`/`rotate` y el hover `transform`:** son propiedades CSS distintas y se suman. Si la animación usara `transform`, anularía el `transform` del hover.
- Parallax: profundidad `[0.6, 1, 0.8]` por carta; desplazamiento hasta 28 × 18 px y giro hasta 9° hacia el cursor. Solo con ratón y sin "reducir movimiento".
- Hover: la cara se adelanta `translate3d(0, -14px, 80px)`, el filete brilla, la piedra se aclara (`brightness 1.45`) y las otras dos bajan al 55 % de opacidad (`:has()`).

### 7.8 Busto 3D (`src/3d/busto.js` → `public/js/busto.js`)

- **Carga:** `portada.js` observa la sección y añade el `<script src="js/busto.js">` cuando está a 900 px de entrar en pantalla.
- **Geometría procedural** (no hay modelo todavía): tres piezas de una esfera de radio 1 (hueco interior de 0,7) cortadas por una línea de rotura irregular (`bordeRotura`, con semilla), con su cara de fractura con relieve (`caraRotura`) y una costura de oro a lo largo del borde (`TubeGeometry` sobre una `CatmullRomCurve3`). El hueso es una esfera de 0,62.
- **Texturas dibujadas en canvas** (mármol Rosso Levanto calculado píxel a píxel con ruido periódico, hueso con pátina, vetas de oro): así funcionan también desde `file://`, donde no se pueden cargar imágenes para WebGL.
- **Escena:** cámara de 28°, foco cálido (`SpotLight` `#ffd6a0`), contraluz azul, relleno cálido, ambiente oscuro y `RoomEnvironment` para los reflejos del oro. Tone mapping ACES. Píxeles máximos ×2.
- **Apertura:** la sección mide 230vh y la escena es `sticky`. El progreso del scroll por la sección se suaviza con inercia y mueve el casquete hacia arriba (0,95) girándolo, la base hacia abajo (0,6) y el hueso girando. Se escribe también en la variable CSS `--apertura` (0 a 1) para coreografiar los textos. Flota un poco siempre; el ratón gira la cabeza.
- **Modelo real:** con `portada.autor.modelo` carga el `.glb` con `GLTFLoader` y sustituye cada pieza por el objeto con su nombre (`arriba`, `hueso`, `abajo`). Si falla, se quedan las esferas.
- **Sin WebGL:** se ve `autor.imagen`.
- **Empaquetado:** `scripts/construir-3d.mjs` usa esbuild (formato IIFE, minificado) para meter three.js y el código en un único script clásico.

### 7.9 Ornamentos que se dibujan (`public/js/tallado.js`)

Para cada `.tarjeta__panel` (salvo las de tarjetas `sobria`) que entra en pantalla: se le quita el filete de CSS (`filete-pendiente`), se le añade un SVG con dos rectángulos con `pathLength=1` que se trazan con `stroke-dashoffset`, crecen las escuadras desde su esquina (`clip-path`) y a los 1,7 s se quita el SVG y vuelve el filete de CSS. Las grecas pasan de `greca--pendiente` a `greca--trazando`. Con "reducir movimiento" no hace nada: todo está ya dibujado.

### 7.10 Bloques de Proceso (`public/js/proceso.js`, segundo bloque)

Se intercepta el clic en el `<summary>` de cada bloque y del archivo:

- **Abrir:** `open = true`, se mide la altura final (cabecera + cuerpo) y se anima `height` del `<details>` en 450-900 ms (según lo que crezca) con `--curva-salida`. El objetivo, cada semana y cada captura entran con `opacity` + `translateY(14px)`, 45 ms una después de otra (máximo 10 escalones).
- **Cerrar:** clase `plegando` (la flecha gira al momento), el cuerpo se funde en 200 ms y la altura baja en 320-550 ms con `--curva`. Al terminar, `open = false`.
- **Interrumpir:** si se pulsa a mitad, se fija la altura actual, se cancela la animación y se sale hacia el otro lado desde ahí.
- Recorte con `clip-path: inset(0 -60px 0 -60px)` en vez de `overflow: hidden`, para no cortar el punto de la línea de tiempo, que asoma por la izquierda.
- Con "reducir movimiento", comportamiento nativo.

### 7.11 Visor (`site.js`, bloque 4)

Un `<dialog>` único. Al abrir, calcula la posición y el tamaño del elemento pulsado y anima el medio desde ahí hasta su sitio (técnica FLIP, 520 ms). Los elementos con el mismo `grupo` se recorren con flechas. El teaser usa el mismo visor con un `<video>`.

### 7.12 CSS (`public/css/site.css`)

Un solo archivo con índice al principio (15 apartados: variables, base, utilidades, cabecera, menú, cortina, ornamentos, tarjetas, imágenes, Portada, Teaser, Historia, Proceso, visor, pie). Convenciones:

- Clases en español con BEM: `bloque__elemento--modificador` (`carta__cara`, `parte--oro`).
- Atributos `data-*` para lo que engancha JavaScript (`data-revelar`, `data-spoiler-tapa`...), no clases.
- Variables de `:root` para colores, tamaños, curvas y texturas. No se escriben valores sueltos.
- Hovers dentro de `@media (hover: hover) and (pointer: fine)`; `:focus-visible` fuera.
- Las propiedades que se animan son `transform`, `opacity`, `clip-path` y `stroke-dashoffset` (nada de animar `top`/`left`/`width`, salvo la altura de los bloques y SPOILER, que es intencionada).
- Bloque final de `prefers-reduced-motion`.

---

## 8. Pruebas

Las pruebas automáticas están en `pruebas/` (Playwright + Chromium). Se pasan contra la web construida.

### Cómo se pasan

```bash
# una vez
npm i --no-save playwright axe-core
npx playwright install chromium      # en Claude Code en la nube ya viene instalado

# cada vez
npm run build
sh pruebas/todas.sh                  # sirve dist/ en el puerto 4400, pasa todas y apaga el servidor
```

Para una sola: servir `dist/` (`python3 -m http.server 4400 --directory dist`) y `node pruebas/menus.cjs`. Variables: `BASE` (otra dirección) y `SALIDA` (carpeta de capturas; por defecto `pruebas/capturas/`, que no se sube). Van en `.cjs` porque el proyecto es `"type": "module"`.

### Qué comprueba cada una y qué debe salir

| Prueba | Comprueba | Resultado bueno |
|---|---|---|
| `interacciones` | Intro, menú (foco, Esc), cortina, SPOILER, "Mostrar todos", visor con flechas, intro solo al recargar, teaser, bloques, diálogos, comparador, menú en móvil | Todas las líneas `true` y `errores: ninguno` |
| `spoilers` | Destapar todos, alturas, volver a taparlos, romper uno; también con "reducir movimiento" | `destapado+` / `tapado` coherentes y `errores: ninguno` |
| `usb` | `dist/index.html` desde `file://`, navegación y texturas | `peticiones fallidas: ninguna errores: ninguno` |
| `ancho-320` | Desbordes a 320 px | `"sw":320` en las cuatro páginas (los elementos que salen dentro de un `overflow: hidden` no cuentan) |
| `cortina` | Transición en ordenador | Llega a `historia.html` sin errores |
| `cortina-movil` | Transición en móvil y cursor | `cortina--sube`, `esquirlas: 0`, cursor `auto` |
| `menus` | El menú no lo tapa nada | `ok` en las cuatro |
| `bloques` | Abrir, cerrar, interrumpir y teclado en Proceso | Alturas que crecen y bajan, `true` en teclado |
| `cartas-hover` | Hover estable con el ratón quieto cerca de los bordes | `16/16` en todos los puntos, `fallos: 0` |
| `accesibilidad` | axe-core en ordenador y móvil | Nada debajo de cada `== página` |
| `capturas` | Capturas de página entera (1440 y 390) | Para mirarlas, no comprueba nada |

### Lo que se mira a ojo

Después de un cambio visual: capturas en 1440 × 900 y en móvil (iPhone 13, 390 px), mirando el cambio y lo que lo rodea. En los elementos animados, captura a mitad de animación (así salió el punto de la línea de tiempo que desaparecía). Al tocar el hover o las animaciones, pasar las pruebas de esa parte.

### Trucos de las pruebas

- Playwright no recalcula el hover si el ratón no se mueve: en `cartas-hover` se vuelve a "mover" al mismo punto antes de cada lectura.
- `python3 -m http.server` no sirve la 404 en direcciones que no existen. Para probarla como en Vercel hace falta un servidor que responda `404.html`, o abrir `/404.html` directamente.
- Si se mata el servidor con `pkill -f "http.server 4400"` dentro de un comando que contiene ese mismo texto, se mata el propio comando. Usar `pkill -f "[h]ttp.server 4400"` en un comando aparte.

---

## 9. Publicar, plan B y flujo de git

- **Vercel:** proyecto `proyectomarmol` (https://proyectomarmol.vercel.app), enlazado al repositorio. Publica en producción la rama `main`: cada `git push` a `main` despliega solo en un par de minutos. `vercel.json` fija el build (`npm run build`) y la salida (`dist`), así que no depende de lo que diga el panel.
- **Flujo que se ha usado:** se trabaja en la rama `claude/serie-marmol-web-qhdbs8`, se hace commit con un mensaje en español que explica qué y por qué, se sube la rama y, cuando Javi dice que se publique, se sube esa misma historia a `main` (`git push origin HEAD:main`, comprobando antes que `main` está contenida en la rama). Un chat nuevo puede tener otra rama asignada; lo importante es no publicar en `main` sin permiso.
- **Plan B (USB):** `npm run build` y copiar la carpeta `dist/` entera al USB. Se abre con doble clic en `dist/index.html`. Funciona sin internet, con fuentes, imágenes y vídeo incluidos (comprobado en Chrome desde `file://`, prueba `usb`).
- **Tamaño del vídeo:** Vercel admite archivos estáticos grandes, pero conviene exportar el MP4 en H.264 1080p (1920×817 en 2.35:1) a unos 8–10 Mbps. Para 30 s son unos 30–40 MB.

---

## 10. Assets pendientes y checklist de entrega

Formato recomendado: **WebP** (o JPG) calidad ~85. Renders con el mismo nombre que aquí → no hay que tocar código salvo cambiar `src: null` por la ruta.

| # | Qué | Proporción / tamaño | Archivo sugerido | Dónde se pone |
|---|---|---|---|---|
| 1 | Render final del título tallado (pondrá "Proyecto Mármol" por ahora) | 16:9 · 2560×1440 | `img/portada/hero.webp` | se sobrescribe |
| 2 | Mismo render en vertical, para móvil | 4:5 · 1080×1350 | `img/portada/hero-movil.webp` | se sobrescribe y `ratioMovil: 0.8` |
| 3 | *(Opcional)* el hero en 3 capas con transparencia: fondo, losa, cincel | 16:9 cada una | `img/portada/capa-*.webp` | `portada.hero.capas` |
| 3b | *(Opcional)* el hero como vídeo en bucle de 3-5 s (la luz moviéndose sobre la losa, polvo cayendo...) | 16:9 · 1920×1080, sin sonido, menos de 4 MB | `video/hero-bucle.mp4` | `portada.hero.video` |
| 4 | Textura plana del mármol del hero (render cenital del material, sin luz dramática) | 2000×1500 o mayor | `img/marmol/marmol.webp` | se sobrescribe |
| 5–8 | 4 fotogramas del prólogo: Creador de espaldas ante la ventana · sus ojos · la criatura en el bosque · la jaula en la bodega | 16:9 | `img/portada/prologo-1..4.webp` | `portada.fotogramas[i].imagen.src` |
| 9–11 | *(Opcional)* imágenes para las 3 cartas (Teaser, Historia, Proceso); sin ellas se ve la piedra en movimiento | 5:7 vertical | `img/portada/acceso-*.webp` | `portada.accesos[i].imagen.src` |
| 12 | Busto del autor en 3D partido en tres piezas (`arriba`, `hueso`, `abajo`), estética estatua/calavera | `.glb`, menos de 5 MB | `modelos/busto.glb` | `portada.autor.modelo` |
| 12b | *(Respaldo)* render del busto para navegadores sin 3D | 3:4 vertical | `img/portada/autor.webp` | `portada.autor.imagen.src` |
| 13 | **Teaser** en MP4 (H.264, 2.35:1, créditos dentro) | 1920×817 | `video/teaser.mp4` | `teaser.video.src` |
| 14 | Póster del teaser (fotograma antes de pulsar play) | 2.35:1 | `img/teaser/poster.webp` | `teaser.video.poster` |
| 15–20 | Fotogramas clave: planos 1, 2b, 7, 8 y la pareja 4 + 6 | 2.35:1 | `img/teaser/plano-*.webp` | `teaser.fotogramas` y `teaser.rima` |
| 20b | El "otro mundo" que se ve por las ventanas de la cabecera de Historia (oscuro, con mucha profundidad) | 16:9 · 2560×1440 | `img/historia/ventana.webp` | `historia.ventana.src` |
| 21 | Imagen clave de la premisa | 4:5 | `img/historia/premisa.webp` | `historia.premisa.imagen.src` |
| 22–27 | Una imagen por parte (I–VI); la descripción de cada una está en su placeholder | 4:3 | `img/historia/parte-1..6.webp` | `historia.partes[i].imagen.src` |
| 28 | Capturas para la línea de tiempo: notas de Obsidian, grafo, storyboard | 16:10 | `img/proceso/...` | `proceso.bloques[i].capturas` |
| 29 | Registros S03 en adelante (o decirme qué se hizo cada semana) | texto | — | `proceso.bloques[i].semanas[j]` |
| 30 | Imágenes de referencias (`criatura_estatuaria_01..04`, `taller_portal_01`, ficha de incompetech...) y las categorías vacías (Color y luz, Cámara y encuadre) | 4:3 | `img/referencias/...` | `proceso.referencias` |
| 31 | Pares antes/después: portal v1 → v3, blockout → render, criatura | 16:9 | `img/proceso/antes-*.webp`, `despues-*.webp` | `proceso.antesDespues` |
| 32 | WIPs y versiones antiguas (capturas de Blender) | 16:10 | `img/proceso/wip-*.webp` | `proceso.archivo` |
| 33 | Música definitiva y su crédito CC BY | texto | — | `teaser.ficha` (Música) |
| 34 | Título definitivo de la serie, si cambia | texto | — | `sitio.js`, `portada.js` |

### Checklist del día de la entrega

La web está terminada: lo que queda es meter los assets reales y comprobar.

1. **Imprescindible:** teaser en MP4 (13) y su póster (14), render del hero (1 y 2), las seis imágenes de Historia (22–27) y la premisa (21). Copiar cada archivo a `public/` con la ruta de la tabla y cambiar `src: null` por esa ruta en `src/data/`.
2. **Muy recomendable:** fotogramas del teaser (15–20), el "otro mundo" de la cabecera de Historia (20b), capturas del proceso (28, 31, 32) y el crédito de la música (33).
3. **Opcional:** busto `.glb` (12, si no, se ven las tres esferas provisionales), capas o vídeo del hero (3, 3b), imágenes de las cartas (9–11).
4. `npm run build` sin errores (el último mensaje debe ser "Todas las rutas son relativas") y `sh pruebas/todas.sh`.
5. `git push` a `main` y abrir https://proyectomarmol.vercel.app en ordenador y en el móvil: recorrer las cuatro páginas con el menú, reproducir el vídeo y destapar un SPOILER.
6. **Plan B:** copiar `dist/` a un USB y abrir `index.html` con doble clic en el ordenador de clase (o en otro que no sea el tuyo) antes de ir.
7. Lo que no llegue a tiempo se queda con su placeholder, que ya dice qué va ahí: la web se puede enseñar así.

---

## 11. Cómo se hizo: historia del proyecto

| Fecha | Commit | Qué se hizo |
|---|---|---|
| 16/10/2026 | `1ced64d` | Repositorio vacío. Antes, en Obsidian: decisiones (páginas, navegación, paleta Rosso Levanto, spoilers), wireframes en papel de escritorio y móvil, referencias y el "Prompt para la web" |
| 17/10 | `fa168c9` | Primera versión completa de las cuatro páginas con Astro, a partir del prompt, la nota de Obsidian, el PDF del Canva y las notas de lore |
| 17/10 | `4d8eca2`, `9044695` | Vercel: `vercel.json` y dominio `proyectomarmol.vercel.app` |
| 17/10 | `6f481e0`, `cc872f5` | Se instalaron las skills de diseño (impeccable, emil-design-eng, taste-skill) y se hizo una auditoría con Taste: escala de seis tamaños, mínimo 13 px, grietas con relieve, arreglos de móvil (intro cortada, spoilers gigantes, cabecera que tapaba el gancho) |
| 17/10 | `994d137` | Tras analizar las referencias: sala oscura con cartas flotantes (karma-tracks), busto 3D que se abre (Billelis), cortina que se rompe en esquirlas (crystallize) y ornamentos que se dibujan (heronaiapp) |
| 17/10 | `52cd164` | Historia que se corrompe y se cura, ventanas a otros mundos, ojos que no miran, sala de proyección y cursor de cincel |
| 17/10 | `17cdfcf` | Se quitan la sala de proyección (tapaba el menú) y los ojos (no funcionaban); hover real en las cartas |
| 17/10 | `9eef287` | Versión de entrega: fuera cincel y títulos tallados, hovers solo con ratón, cortina que sube en móvil, cabecera de Historia con cartela y la veta de las seis partes en lugar de la losa de fondo |
| 17/10 | `b03b604` | Hover de las cartas estable: enlace quieto, capas que se mueven dentro |
| 18/10 | `348de18` | Bloques de Proceso que se despliegan animados |
| 18/10 | `4d1394b` | Pulido de entrega tras comparar con webs premiadas: 404 propia, menos oro, grietas rehechas como costura de kintsugi, ficha técnica como cartela, rótulos de sala, grano y pies como cartelas |
| 19/10 | — | Esta nota ampliada, pruebas guardadas en `pruebas/` y `scripts/generar-grano.py` |

### Referencias que se usaron y qué se cogió de cada una

| Referencia | Qué se cogió | Dónde está |
|---|---|---|
| barmat.pt | Cortina elegante de presentación | Intro de la Portada |
| peryton-film.com | Botón de menú y apertura de secciones | Menú a pantalla completa |
| karma-tracks.com | Cartas con filete dorado, flotando en 3D | Tarjetas y "Las páginas" |
| heronaiapp.com | Microanimaciones que se dibujan solas | Filetes, escuadras y grecas |
| crystallize.prism-on.tokyo | Transiciones con efecto | Cortina que se rompe entre páginas |
| a24.raviklaassens.com | Pulsar el vídeo y que se amplíe | Reproductor del teaser y visor |
| Billelis (Behance/Pinterest) | Busto clásico abierto, grandeza, nombre enorme detrás | "Hecho por" |
| culturetrends.siriusxmmedia.com | El texto de la intro se convierte en el título | **No aplicado** (apartado 14) |
| Webs de museo (Rijksmuseum, Getty "Persepolis Reimagined", Van Gogh Museum) | Cartelas, salas numeradas, poco oro, mucho aire | Ficha técnica, pies de foto, rótulos de sala, 404 |
| jasonbergh.com (Awwwards SOTD 2026) | Negro cálido y crema de película, intro como créditos | Propuesto para el Teaser (apartado 14) |

---

## 12. Decisiones tomadas (y lo que se probó y se quitó)

- Spoilers en las partes **III a VI** y el final (manda el prompt; la nota de Obsidian decía IV a VI).
- Bienvenida "Bienvenido a Proyecto Mármol"; la serie se nombra "Serie Mármol (título provisional)".
- Frase gancho: "Él las talló perfectas. Nunca bajó a mirar."
- La intro solo sale al recargar o al entrar por primera vez.
- Menú: mármol a un lado con una placa de museo, y la lista en números romanos.
- Ornamentos: grecas finas y escuadras tipo karma-tracks (las esquineras Art Déco de la referencia tenían marca de agua y no son grecorromanas).
- Animación de nivel medio-alto pero con sentido: aparición al hacer scroll, parallax del hero, cartas flotantes, grietas doradas, veta de las seis partes, SPOILER que se rompen y cortina entre páginas.
- Revisión con la skill Taste (octubre 2026): seis tamaños de letra, nada por debajo de 13 px, fuera los antetítulos que repetían la cabecera, pipeline en romanos y cabecera sin filete. Se mantienen a propósito: los filetes dorados, la paleta crema / oro / rojo y los números romanos.
- El oro, solo donde significa algo (ver apartado 3).
- Tipografía: Cinzel + EB Garamond.
- Pipeline de 8 pasos, que refleja la previz antes del modelado y el look dev antes de animar.
- No se incluyen las referencias descartadas. La imagen de Billelis es solo referencia: no aparece en la web.
- **Probado y descartado (octubre 2026). No volver a meterlo sin hablarlo:**
  - Cursor de cincel con polvo al hacer clic: daba fallos. Cursor normal.
  - Títulos que se tallan con un cincel: no convenció. Los títulos solo aparecen.
  - Sala de proyección con telón y luces en el Teaser: tapaba el menú y se buggeaba.
  - Ojos que siguen al cursor: no funcionaban bien.
  - Marco de mármol en las tarjetas de Historia.
  - Losa de mármol de fondo que se agrietaba detrás de las seis partes: "horrible". Sustituida por la veta.
  - Esquirlas en la transición entre páginas en móvil: iban a tirones. En móvil la placa sube.

---

## 13. Problemas encontrados y cómo se resolvieron

| Problema | Causa | Solución (y regla para el futuro) |
|---|---|---|
| El hover de las cartas no hacía nada | La animación de balanceo usaba `transform` y pisaba el `transform` del hover | Animar con `translate`/`rotate` y dejar `transform` para el hover |
| El hover de las cartas parpadeaba en los bordes | El elemento que detectaba el hover se movía (flotaba, se adelantaba y seguía al ratón) | El elemento con `:hover` no se mueve nunca; lo que se mueve va dentro |
| Esquirlas que desaparecían al caer | `preserve-3d` hace que Chrome ordene las piezas contra el resto de la página | Contenedor de esquirlas plano con su propia `perspective` |
| El punto de la línea de tiempo desaparecía al abrir un bloque | `overflow: hidden` durante la animación recortaba lo que asoma por la izquierda | `clip-path: inset(0 -60px 0 -60px)`: recorta solo arriba y abajo |
| La veta salía pegada a la izquierda | `--veta-x: 50%` leída desde JS como `50` px | Convertir los `%` con el ancho del contenedor |
| `NaN` en el polígono de la ventana | El array de fases era más corto que los puntos que lo leían | Fases de tamaño `(N + 1) × 2` |
| Banda negra en la textura del busto | El ruido no daba la vuelta entero y dejaba una costura | Ruido periódico con un número entero de celdas |
| La sección del busto daba un salto al cargar | El alto se calculaba cuando llegaba el script | Reservar el alto con `.js .vitrina` en CSS |
| La sala de cine tapaba el menú | `z-index` mayor que el del menú (50) | Nada por encima del menú |
| Hovers "pegados" en el móvil | `:hover` se queda activo tras tocar | Todos los hovers en `@media (hover: hover) and (pointer: fine)` |
| Texto del vídeo bajo el botón de play en móvil | En pantallas estrechas el texto ocupa dos líneas | Por debajo de 700 px el botón sube al 40 % y el texto se compacta abajo |
| La 404 sin estilos en `/algo/mal` | Las rutas relativas se resuelven desde `/algo/` | `<base href="/">` solo en la 404 |
| El grano se veía sucio | Demasiada opacidad y demasiado ruido grueso | Alfa máx. ~5 %, media ~1 %, ruido fino |
| Capturas de prueba subidas por error | Se generaban dentro del repositorio | Capturas en `pruebas/capturas/` (en `.gitignore`) o fuera del repo |
| El USB no carga el `.glb` ni módulos | `file://` bloquea esas peticiones | Script clásico IIFE y texturas en canvas; el `.glb` solo en la web publicada |
| Al borrar un bloque de CSS se fueron reglas vecinas | Borrado por rango "hasta el siguiente comentario" | Tras editar CSS a lo grande, revisar el `git diff` y pasar capturas de todas las páginas |

---

## 14. Ideas propuestas que no se han aplicado

Salieron de comparar la web con webs premiadas (Awwwards, museos). **Son propuestas: preguntar a Javi antes de hacer ninguna.**

- **Teaser como sala oscura:** toda la página en casi negro cálido con texto crema y los fotogramas a todo el ancho, como una tira de película. Estático, sin telón (lo del cine se descartó).
- **Intro tipo culturetrends:** "PROYECTO MÁRMOL" aparece y luego vuela, encogiéndose, hasta su sitio en la cabecera. Javi dijo que le encantaba la referencia.
- **"La historia en cuatro fotogramas":** una imagen grande y tres pequeñas, o una secuencia fija que cambia al bajar.
- **Luz rasante en el hero:** un degradado cálido que se mueve despacio con el ratón sobre el render (como la luz sobre la piedra del Getty).
- **SPOILER que dejan costuras de oro** al volver a taparlos, en vez de reponerse lisos.
- **Página de Personajes** (fase 2) con visor `.glb` de las criaturas.
