# Web V3 - Proyecto Final Mármol

> Copia de la nota de Obsidian "web v3" de Javi (16/11/2026). Si no coincide con la del vault, manda la del vault.

## Qué es esta nota

Cómo tiene que **verse** y **funcionar** la web en la V3, sala por sala, con un diseño de referencia hecho en Claude Design (ver "Diseño de referencia"). Es la **penúltima versión**: en la V4 Javi cambia los placeholders por textos y fotos reales y se rehace el contenido de Proceso.

Por qué hace falta: la V2 está hecha y en `main` (12/11/2026), pero se construyó sin una referencia de diseño real. Se lee como un documento: todo crema plano, todo dentro de tarjetas con filete dorado, placeholders enormes con rayas y todo con el mismo peso. La estructura de la V2 (salas, indicador, atajos, placeholders, exportación) vale; lo que se rehace es la estética y la composición de las cuatro salas.

## Cambios que apuntó Javi

- Ahora mismo el busto (modelo 3D) no se ve bien: tiene que cargar nada más entrar a la web, así no da errores.

## Dirección: museo monumental

La web es un museo de la serie: cada sala es una sala de exposición con una pieza que impone y después lectura tranquila.

1. **Escala.** Cada sala abre con un momento monumental (imagen a sangre o tipografía enorme grabada) y después baja a lectura.
2. **Luz de museo.** Fondos con luz cenital suave (más clara arriba), piezas con sombra de suelo fina y cartelas. Lo importante (vídeo, spoilers, autor, final) va en **sala oscura**: negro cálido con la pieza iluminada.
3. **Tres pesos, no tarjetas.** Todo es **monumental** (título o imagen a sangre), **pieza** (imagen o bloque con su cartela) o **cartela** (texto pequeño de museo). Las tarjetas con doble filete dorado desaparecen como recurso general.
4. **Materia.** La veta es el hilo común, el mármol es material de piezas (cabecera, estelas, placas, disco) y **nunca va bajo el texto**.
5. **Animación alta pero con sentido.** Cada animación cuenta algo de la historia: tallar, agrietar, sanar con oro, mirar.
6. **Placeholders discretos.** Un hueco sin imagen se ve como una vitrina vacía con su cartela, no como una caja gris rayada.
7. **No cambia:** paleta Rosso Levanto, Cinzel + EB Garamond, las cuatro salas, las restricciones técnicas y lo descartado.

## Sistema común

### Color

| Token | Hex | Uso en la V3 |
|---|---|---|
| `--crema` | `#F1F2E3` | Fondo de Portada y superficies claras |
| `--tinta` | `#362926` | Texto y títulos |
| `--tinta-2` | `#6B5F58` | Cartelas y texto secundario |
| `--rojo` | `#8B2626` | Enlaces, foco, numerales activos, capitulares |
| `--oro` | `#CDA434` | Solo decorativo y solo donde significa sanar: grietas kintsugi, veta de Historia, nodo activo, rotura de los SPOILER. Nunca texto |
| `--negro` | `#0D0D0D` | Base de las salas oscuras |
| `--negro-calido` (nuevo) | `#16110F` | Sala oscura con luz: vídeo, autor, final |

Fondo de cada sala:
- **I Portada:** crema `#F1F2E3`, luz cenital blanca.
- **II Teaser:** travertino crema `#E8E2D4` con veta `#A39886`.
- **III Historia:** papel cálido de libro `#EFE8D4`, veta roja y oro.
- **IV Proceso:** papel de boceto `#ECEBDD`, grafito `#4B4543`.

### Tipografía

- Cinzel para títulos (grabada) y EB Garamond para texto. Ninguna fuente nueva.
- Seis tamaños y mínimo 13 px. `--t-display` pasa a **escala monumental** en los títulos de sala (en escritorio unos 9-10 rem, en móvil se ajusta al ancho) con letra muy espaciada.
- Títulos grabados: relieve de luz arriba a la izquierda y sombra interior, más marcado en los monumentales.
- Numerales romanos de sala huecos (solo contorno) y enormes.
- Texto largo: justificado con guiones en escritorio, a la izquierda en móvil, 60-70 caracteres por línea.

### Componentes

- **Cabecera e indicador de sala.** Siempre como **banda con el fondo de la sala** (al 85-95 %, `backdrop-filter: blur`, línea fina abajo): sobre el hero, el mármol o la nebulosa las letras tienen que leerse. Izquierda "MÁRMOL"; centro el indicador (numeral, nombre y veta con 4 nodos, el actual en oro y más grande); derecha el disco de música y MENÚ. Al bajar se queda solo el indicador.
- **Cartela.** Filete corto, número en Cinzel, título y descripción en cursiva. Sustituye a las tarjetas.
- **Vitrina.** Imagen sin marco grueso, con sombra de suelo y su cartela.
- **Placeholder V3.** Hueco con la proporción real, fondo un tono por debajo del de la sala, filete fino, rombo muy suave en el centro, cartela con `falta` y semana, insignia **Placeholder** pequeña en una esquina. Sin rayas diagonales.
- **Divisores.** Grieta dorada en Portada e Historia; veta del color de la sala en Teaser y Proceso. Más finos y con más aire.
- **Botones.** Cinzel pequeño con una línea que se alarga al pasar o enfocar; el principal con fondo tinta y texto crema.
- **Puerta a la siguiente sala.** Franja ancha con el material de la siguiente sala, su numeral y su nombre en grande. Sustituye al botón "Siguiente".
- **Menú.** Se mantiene.
- **Pie.** Greca y créditos (incluido el crédito CC BY de la música en todas las salas).
- **Reproductor de música.** Disco de mármol Rosso Levanto con veta de progreso, **en la cabecera junto a MENÚ**, nunca tapando texto.

## Sala por sala

### I - Portada (crema, mármol alto)

1. **Intro** "Bienvenido a Proyecto Mármol" y cortina: como están.
2. **Hero monumental.** Render a pantalla completa con **luz rasante** cálida que sigue al ratón despacio (en táctil y con movimiento reducido, quieta). Señal fina de "baja".
3. **Presentación.** Frase gancho monumental ("Él las talló perfectas. / Nunca bajó a mirar.", la segunda en rojo), párrafo justificado y botón "Ver el teaser".
4. **La historia en cuatro fotogramas.** Escena fijada al scroll: fotograma 16:9 grande que cambia de I a IV al bajar, con cartela; a un lado los cuatro numerales como índice. En móvil, los cuatro en lista.
5. **Las salas: estelas A+.** Pared de museo con línea de suelo y tres estelas de piedra, la del centro (Historia) más alta: frontón bajo con el filo grabado, numeral tallado, **tabula ansata** lisa con nombre y frase (el texto nunca sobre las vetas), material de cada sala (travertino, **Rosso Levanto real**, grafito), canto de la losa, pedestal de dos escalones, sombra en el suelo y foco cenital. Al pasar o enfocar: sube la luz, la estela se eleva, aparece una veta fina en la placa y "Entrar" se abre. **Se inclinan unos grados en 3D siguiendo el cursor**; al pulsar se acerca y cae la cortina con su material. En táctil y con movimiento reducido, quietas. En móvil, una debajo de otra.
6. **Hecho por.** Sala oscura con un **cono de luz cenital** sobre el busto, centrado, en su pedestal: arriba "Hecho por" pequeño en oro; **el nombre grabado en el frente del pedestal** (grafito) con los años en romanos (MMXXVI - MMXXVII); a la izquierda dos cartelas (Autor, La pieza); a la derecha "Baja para abrirla" con tres rombos de estado (cerrada, se abre, abierta) que avanzan con el scroll; debajo una frase grande en cursiva (placeholder). El busto **carga al entrar en la web**.
7. **Puerta a II - Teaser** y pie.

### II - Teaser (travertino crema, mármol bajo)

Nebulosa de 3 capas en grises cálidos, sin dorados. El texto nunca en cajas blancas encima.

1. **Título a contraluz.** "TEASER" en Cinzel muy espaciado, en **tinta oscura** con un **halo de luz blanca cálida detrás** (nunca letras blancas sobre el travertino). "II" hueco gigante detrás; debajo "Tres lugares - una ventana" en etiqueta.
2. **Vídeo.** Franja de sala oscura a sangre con el vídeo 2.35:1 casi a todo el ancho, veta fina de travertino en el marco, play grande y redondo, cartela en una línea debajo. Mantiene lo que ya hace (no arranca solo, crece a ventana grande, créditos dentro).
3. **Sinopsis y ficha.** Dos columnas: sinopsis como texto de pared y ficha como cartela vertical.
4. **Cruzar la ventana.** Sección fijada al scroll (unas 3 pantallas): taller con la ventana al fondo, la cámara se acerca, la ventana llena la pantalla y se sale al bosque. **2.5D con capas** (pared del taller, marco de ventana en arco, 3 capas de nebulosa, bosque), cada una a su velocidad y escala. Tres cartelas (El taller - La ventana - El bosque) y una regla de avance. Movimiento reducido: tres fotogramas en lista. Móvil: más corta y con 2 capas. Placeholders hasta S28. Es lo más caro: si no da tiempo, tres fotogramas fijos.
5. **Fotogramas.** Fotograma grande 2.35:1, contador grande ("03 / 12") y tira de miniaturas. 12 huecos (storyboard v2). Estado por plano.
6. **La rima.** Comparador a casi todo el ancho con los dos planos de los ojos (pura y corrupta).
7. **Puerta a III - Historia.**

### III - Historia (papel de libro, mármol medio)

Se lee como un libro bien maquetado.

1. **Cabecera.** Rosso Levanto real a sangre (dos tercios de pantalla) con la ventana que se abre al pulsar. "HISTORIA" monumental grabado en una **franja lisa** de piedra en la base del mármol. Debajo, "Las criaturas no nacen: se tallan." y la pista.
2. **Sumario.** Índice de libro: Premisa, I a VI y Final; los tapados con rombo negro; fijo bajo la cabecera en escritorio, marca en rojo el capítulo actual.
3. **Premisa como doble página.** Dos columnas justificadas con capitular roja; imagen clave 4:5 en vitrina; "Influencias" y "La idea: kintsugi" como notas al margen.
4. **Las seis partes como capítulos.** La veta en el **margen izquierdo como lomo continuo** (gris, rojo agrietado, oro) con un nodo por capítulo. Fila ancha: numeral hueco gigante en el margen, imagen 3:2 y al lado título, resumen y "Leer más"; alternan el lado de la imagen; folio (número de página) en cada capítulo. Sin cajas ni marcos.
5. **SPOILER.** La losa negra tapa **imagen y texto juntos**, con "SPOILER" grabado; el numeral queda visible. Al pulsar se rompe con costuras de oro. "Mostrar todos" solo destapa.
6. **El final.** Sala oscura; destapado, la cita en grande entre dos costuras de oro.
7. **Puerta a IV - Proceso.**

### IV - Proceso (cuaderno de taller)

El contenido se rehace en la V4; en la V3 se fija el marco visual.

1. **Cabecera** monumental e introducción.
2. **Estado** con regla graduada de 35 semanas (hecho en tinta, actual en rojo).
3. **Índice lateral** de placas de mármol con plomada.
4. **Desarrollo visual**: antes y después grandes con anotaciones de taller.
5. **Método paso a paso, fijado**: a la izquierda las 8 estaciones con la actual encendida; a la derecha la captura del WIP del paso, contador y regla. Debajo, referencias como cajones y el dato de render (57 s por fotograma; 768 fotogramas = unas 12,2 h). En móvil, sin fijar.
6. **Calendario como veta luminosa**: veta sinuosa de grafito con un nodo por bloque y su cartela; se enciende en rojo hasta la semana actual al bajar; al pulsar un nodo, sus semanas salen en un panel al lado con "Ver registro". Se mantienen los enlaces `#s05`. En móvil, lista recta.
7. **Archivo como colección con filtros**: rejilla de piezas (WIPs, versiones, fallos, cuaderno) con filtros por tipo y por bloque. Sin JavaScript se ven todas.
8. **Puerta de vuelta a I - Portada.**

## Funcionamiento común

- Menú, indicador y atajos 1-4, M y Esc como en la V2.
- **Cortina entre salas con el material de la sala de destino** (travertino, Rosso Levanto, grafito).
- **Aparición al hacer scroll**: las piezas suben unos píxeles y pasan de desenfocadas a nítidas, con retraso escalonado.
- **Busto 3D**: el `.glb` se descarga al entrar en la Portada (precarga); mientras, imagen de respaldo con la misma silueta; si falla, se queda la imagen sin errores en consola.
- Responsive obligatorio; escenas fijadas pasan a listas en móvil.
- Contraste AA en todos los fondos, foco visible, todo con teclado, `prefers-reduced-motion` en todo lo nuevo.
- Vigilar el peso de `dist/` (Vercel gratuito).

## Lo que NO se toca

- Paleta Rosso Levanto; oro solo decorativo y nunca texto; rojo como acento.
- Grietas doradas solo en Portada e Historia.
- SPOILER en III a VI y el final, sin volver a taparlos.
- Intro, cortina, menú a pantalla completa, 404 propia.
- Cinzel + EB Garamond, seis tamaños, mínimo 13 px.
- Vídeo: nunca arranca solo, crece a ventana grande, créditos dentro.
- Todo lo de la V2 que funciona: indicador, atajos, placeholders, exportación de Obsidian, reproductor.
- **Descartado, no reintroducir:** cursor de cincel, títulos tallados con cincel, sala de cine con telón y luces, ojos que siguen al cursor, marco de mármol en las tarjetas de Historia, losa de fondo que se agrieta detrás de las partes, mármol bajo el texto, esquirlas en la transición en móvil, rejilla y monoespaciada en Proceso.
