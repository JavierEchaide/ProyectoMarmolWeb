// Genera las grietas doradas (kintsugi) como trazados SVG.
// Son deterministas: la misma semilla da siempre la misma grieta, así que
// cada divisor es distinto pero no cambia entre compilaciones.

function aleatorio(semilla) {
  // mulberry32
  let t = semilla >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const punto = ([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`;
const trazado = (puntos) => 'M' + puntos.map(punto).join(' L');

// Recorrido quebrado desde `inicio` en la dirección `angulo` (radianes).
function quiebro(azar, inicio, angulo, longitud, paso, desvio) {
  const puntos = [inicio];
  let [x, y] = inicio;
  let recorrido = 0;
  while (recorrido < longitud) {
    const tramo = paso * (0.5 + azar());
    const a = angulo + (azar() - 0.5) * desvio;
    x += Math.cos(a) * tramo;
    y += Math.sin(a) * tramo;
    recorrido += tramo;
    puntos.push([x, y]);
  }
  return puntos;
}

// Grieta horizontal para los divisores de sección (viewBox ancho × alto).
export function grietaHorizontal(semilla, ancho = 1200, alto = 40) {
  const azar = aleatorio(semilla);
  const principal = [[0, alto / 2]];
  let x = 0;
  let y = alto / 2;
  while (x < ancho) {
    x = Math.min(ancho, x + 18 + azar() * 46);
    y = Math.max(5, Math.min(alto - 5, y + (azar() - 0.5) * 16));
    principal.push([x, y]);
  }
  const ramas = [];
  const n = 2 + Math.floor(azar() * 3);
  for (let i = 0; i < n; i++) {
    const origen = principal[1 + Math.floor(azar() * (principal.length - 2))];
    const sentido = azar() < 0.5 ? -1 : 1;
    const angulo = (azar() < 0.5 ? 0 : Math.PI) + sentido * (0.25 + azar() * 0.35);
    ramas.push(trazado(quiebro(azar, origen, angulo, 40 + azar() * 110, 16, 0.9)));
  }
  return { principal: trazado(principal), ramas };
}

// Grieta que sale de un punto hacia los bordes (para romper el cartel de SPOILER).
export function grietaRadial(semilla, ancho = 400, alto = 250) {
  const azar = aleatorio(semilla);
  const centro = [ancho * (0.35 + azar() * 0.3), alto * (0.35 + azar() * 0.3)];
  const trazos = [];
  const n = 6 + Math.floor(azar() * 3);
  for (let i = 0; i < n; i++) {
    const angulo = (i / n) * Math.PI * 2 + (azar() - 0.5) * 0.6;
    trazos.push(trazado(quiebro(azar, centro, angulo, Math.max(ancho, alto), 22, 0.8)));
  }
  return trazos;
}
