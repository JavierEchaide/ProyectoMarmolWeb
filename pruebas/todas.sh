#!/bin/sh
# Pasa todas las pruebas contra la web ya construida (npm run build).
# Sirve dist/ en el puerto 4400, ejecuta cada prueba y apaga el servidor.
# Las capturas quedan en pruebas/capturas/ (no se suben al repositorio).
# Requisitos (una vez): npm i --no-save playwright axe-core && npx playwright install chromium
cd "$(dirname "$0")/.."
python3 -m http.server 4400 --directory dist >/dev/null 2>&1 &
SERVIDOR=$!
sleep 1
for p in interacciones spoilers usb ancho-320 cortina cortina-movil menus bloques cartas-hover accesibilidad; do
  echo "=== $p"
  node "pruebas/$p.cjs" 2>&1 | tail -12
done
kill $SERVIDOR
