/* Busto de "Hecho por" (Portada): una cabeza de mármol partida en tres piezas.
   Arriba, el casquete; en medio, el hueso (bronce con pátina y vetas de oro);
   abajo, la base. Al bajar por la sección, la cabeza se abre y deja ver el
   hueso. El ratón la gira un poco.

   Provisional: son tres esferas. Cuando exista el modelo real, se exporta un
   .glb con tres objetos llamados "arriba", "hueso" y "abajo" y se pone su ruta
   en portada.autor.modelo (ver NOTA-WEB.md); las piezas se sustituyen solas.

   Este archivo NO se carga tal cual: scripts/construir-3d.mjs lo empaqueta con
   three.js en public/js/busto.js como script clásico, para que la web siga
   abriéndose desde un USB. */
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  SpotLight,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const R = 1; // radio exterior de la cabeza
const RC = 0.7; // radio del hueco interior (grosor del mármol: R - RC)
const RH = 0.62; // radio del hueso
const N_THETA = 160;
const N_PHI = 40;

/* Azar con semilla (mismo mulberry32 que js/grietas.js) */
function aleatorio(semilla) {
  let t = semilla >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/* Borde de la rotura: ángulo polar del corte para cada ángulo alrededor.
   Una ondulación suave más dientes irregulares, como piedra partida. */
function bordeRotura(semilla) {
  const azar = aleatorio(semilla);
  const ondas = [1, 2, 3].map((k) => ({ k, a: (azar() - 0.5) * 0.16 / k, f: azar() * Math.PI * 2 }));
  const dientes = Array.from({ length: 56 }, () => (azar() - 0.5) * 0.11);
  return (theta) => {
    let phi = Math.PI * 0.5 + 0.04;
    ondas.forEach((o) => { phi += o.a * Math.sin(o.k * theta + o.f); });
    const x = (theta / (Math.PI * 2)) * dientes.length;
    const i = Math.floor(x) % dientes.length;
    const t = x - Math.floor(x);
    phi += dientes[i] * (1 - t) + dientes[(i + 1) % dientes.length] * t;
    return phi;
  };
}

const punto = (r, theta, phi) =>
  new Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));

/* Rejilla (theta × phi) convertida en geometría. `fila(theta, j)` devuelve
   [radio, phi] para la fila j. `dentro` invierte las caras (hueco interior). */
function rejilla(fila, dentro, uvEscala = 1) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= N_THETA; i++) {
    const theta = (i / N_THETA) * Math.PI * 2;
    for (let j = 0; j <= N_PHI; j++) {
      const [r, phi] = fila(theta, j / N_PHI);
      const p = punto(r, theta, phi);
      pos.push(p.x, p.y, p.z);
      uv.push((i / N_THETA) * uvEscala, phi / Math.PI);
    }
  }
  const ancho = N_PHI + 1;
  for (let i = 0; i < N_THETA; i++) {
    for (let j = 0; j < N_PHI; j++) {
      const a = i * ancho + j;
      const b = (i + 1) * ancho + j;
      if (dentro) idx.push(a, a + 1, b, b, a + 1, b + 1);
      else idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('uv', new BufferAttribute(new Float32Array(uv), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* Cara de la fractura: el anillo entre la superficie y el hueco, con relieve */
function caraRotura(borde, arriba, semilla) {
  const azar = aleatorio(semilla);
  const rugosidad = Array.from({ length: N_THETA + 1 }, () => (azar() - 0.5) * 0.05);
  rugosidad[N_THETA] = rugosidad[0];
  return rejilla((theta, t) => {
    const i = Math.round((theta / (Math.PI * 2)) * N_THETA);
    const r = R - (R - RC) * t;
    const bulto = Math.sin(t * Math.PI) * rugosidad[i];
    return [r, borde(theta) + bulto * (arriba ? 1 : -1)];
  }, !arriba, 3);
}

/* Una pieza de la cabeza: superficie exterior, cara de rotura y hueco */
function pieza(borde, arriba, materiales) {
  const g = new Group();
  const exterior = rejilla((theta, t) => {
    const b = borde(theta);
    return [R, arriba ? b * t : b + (Math.PI - b) * t];
  }, false);
  const hueco = rejilla((theta, t) => {
    const b = borde(theta);
    return [RC, arriba ? b * t : b + (Math.PI - b) * t];
  }, true);
  g.add(new Mesh(exterior, materiales.marmol));
  g.add(new Mesh(caraRotura(borde, arriba, arriba ? 7 : 8), materiales.rotura));
  g.add(new Mesh(hueco, materiales.hueco));
  return g;
}

/* Costura de oro a lo largo del borde (kintsugi) */
function costura(borde, material) {
  const puntos = [];
  for (let i = 0; i < 120; i++) {
    const theta = (i / 120) * Math.PI * 2;
    puntos.push(punto(R * 1.003, theta, borde(theta)));
  }
  const curva = new CatmullRomCurve3(puntos, true);
  return new Mesh(new TubeGeometry(curva, 360, 0.012, 6, true), material);
}

/* Texturas dibujadas en un canvas: así funcionan también desde file:// */
function lienzo(ancho, alto, pintar) {
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  pintar(c.getContext('2d'), ancho, alto);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function veta(ctx, azar, x, y, largo, ancho, color, desvio) {
  ctx.strokeStyle = color;
  ctx.lineWidth = ancho;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  let a = (azar() - 0.5) * 0.8 + 0.35;
  for (let k = 0; k < largo; k++) {
    a += (azar() - 0.5) * desvio;
    x += Math.cos(a) * 9;
    y += Math.sin(a) * 9;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

/* Ruido de valor que se repite en horizontal (la textura da la vuelta a la
   esfera sin costura) */
function ruidoPeriodico(azar, celdasX, celdasY) {
  const rejillaR = Array.from({ length: celdasX * (celdasY + 1) }, azar);
  const v = (i, j) => rejillaR[((j * celdasX) + (((i % celdasX) + celdasX) % celdasX))];
  const s = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x * celdasX;
    const fy = y * celdasY;
    const i = Math.floor(fx);
    const j = Math.min(celdasY - 1, Math.floor(fy));
    const tx = s(fx - i);
    const ty = s(fy - j);
    const a = v(i, j) + (v(i + 1, j) - v(i, j)) * tx;
    const b = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * tx;
    return a + (b - a) * ty;
  };
}

/* Mármol Rosso Levanto calculado píxel a píxel (como scripts/generar-marmol.py):
   blanco con nubes grises, vetas finas grises y bandas granate suaves */
function texturaMarmol() {
  const azar = aleatorio(11);
  const W = 1024;
  const H = 512;
  const octavas = (n, base) => {
    const capas = Array.from({ length: n }, (_, k) => ruidoPeriodico(azar, base * 2 ** k, Math.max(1, Math.round((base * 2 ** k) / 2))));
    return (x, y) => {
      let t = 0;
      let amp = 1;
      let peso = 0;
      capas.forEach((c) => { t += amp * c(x, y); peso += amp; amp *= 0.5; });
      return t / peso;
    };
  };
  const nubes = octavas(4, 3);
  const turb = octavas(5, 4);
  const turb2 = octavas(5, 6);
  const manchas = octavas(3, 2);
  return lienzo(W, H, (ctx) => {
    const img = ctx.createImageData(W, H);
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const u = x / W;
        const v = y / H;
        let r = 246;
        let g = 243;
        let b = 237;
        const n = nubes(u, v);
        const gris = Math.max(0, (n - 0.5) * 1.4) * 40;
        r -= gris; g -= gris; b -= gris * 0.9;
        // vetas finas grises: donde el seno deformado pasa por cero
        const t1 = turb(u, v);
        const fina = 1 - Math.abs(Math.sin((u * 2 + v * 1.3) * Math.PI * 3 + t1 * 9));
        const vf = Math.max(0, (fina - 0.965) / 0.035) * 0.75;
        r += (92 - r) * vf; g += (84 - g) * vf; b += (82 - b) * vf;
        // bandas granate anchas y difuminadas, solo en algunas zonas
        const t2 = turb2(u, v);
        const banda = Math.sin((u * 1.4 - v * 0.9) * Math.PI * 2 + t2 * 7);
        const zona = Math.max(0, (manchas(u, v) - 0.5) * 3);
        const vb = Math.min(1, Math.max(0, (banda - 0.55) / 0.3)) * Math.min(1, zona) * 0.7;
        r += (150 - r) * vb; g += (58 - g) * vb; b += (60 - b) * vb;
        const i = (y * W + x) * 4;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

function texturaHueso() {
  const azar = aleatorio(23);
  return lienzo(1024, 512, (ctx, w, h) => {
    // bronce con pátina verde (la calavera de la referencia de Billelis)
    ctx.fillStyle = '#2d5a50';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const x = azar() * w;
      const y = azar() * h;
      const r = 6 + azar() * 46;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const bronce = azar() < 0.35;
      g.addColorStop(0, bronce ? 'rgba(150,104,52,0.75)' : 'rgba(18,40,36,0.6)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}

/* Vetas de oro del hueso: solo las líneas, para usarlas como brillo propio */
function texturaVetasOro() {
  const azar = aleatorio(31);
  return lienzo(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 9; i++) veta(ctx, azar, azar() * w, azar() * h, 40, 2.2, '#e8c35a', 1.1);
  });
}

/* Interpolación con frenada al final */
const suave = (t) => 1 - Math.pow(1 - t, 3);
const tramo = (p, a, b) => MathUtils.clamp((p - a) / (b - a), 0, 1);

function iniciar(seccion) {
  const lienzoEl = seccion.querySelector('[data-busto-lienzo]');
  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas: lienzoEl, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return; // sin WebGL se queda la imagen de respaldo
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  seccion.classList.add('vitrina--3d');

  const escena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.35;

  const camara = new PerspectiveCamera(28, 1, 0.1, 50);
  camara.position.set(0, 0.15, 7.2);

  // Luz cálida de museo desde arriba a la izquierda, contraluz frío detrás
  const foco = new SpotLight(0xffd6a0, 90, 20, 0.5, 0.6, 1.4);
  foco.position.set(-3, 5, 4);
  escena.add(foco);
  const contra = new DirectionalLight(0x8fa6c0, 1.2);
  contra.position.set(3, 1.5, -4);
  escena.add(contra);
  const relleno = new DirectionalLight(0xffe2c0, 0.35);
  relleno.position.set(2, -2, 3);
  escena.add(relleno);
  escena.add(new AmbientLight(0x2a2220, 0.6));

  const marmol = texturaMarmol();
  const materiales = {
    marmol: new MeshStandardMaterial({ map: marmol, roughness: 0.32, metalness: 0 }),
    rotura: new MeshStandardMaterial({ map: marmol, color: new Color('#d8d2c6'), roughness: 0.85, side: DoubleSide }),
    hueco: new MeshStandardMaterial({ color: new Color('#3a322e'), roughness: 0.95, side: DoubleSide }),
  };
  const oro = new MeshStandardMaterial({ color: new Color('#d4ab45'), metalness: 1, roughness: 0.28, emissive: new Color('#5a3d08'), emissiveIntensity: 0.4 });
  const vetasOro = texturaVetasOro();
  const bronce = new MeshStandardMaterial({
    map: texturaHueso(),
    metalness: 0.55,
    roughness: 0.5,
    emissive: new Color('#f2c45a'),
    emissiveMap: vetasOro,
    emissiveIntensity: 0.2,
  });

  const borde = bordeRotura(5);
  const cabeza = new Group();
  const arriba = pieza(borde, true, materiales);
  const abajo = pieza(borde, false, materiales);
  abajo.add(costura(borde, oro));
  const hueso = new Group();
  hueso.add(new Mesh(new SphereGeometry(RH, 96, 64), bronce));
  cabeza.add(arriba, hueso, abajo);
  escena.add(cabeza);

  // Modelo real, si existe: sustituye a las esferas pieza a pieza
  const modelo = seccion.dataset.bustoModelo;
  if (modelo) {
    new GLTFLoader().load(
      modelo,
      (gltf) => {
        const piezas = { arriba, hueso, abajo };
        Object.keys(piezas).forEach((nombre) => {
          const obj = gltf.scene.getObjectByName(nombre);
          if (!obj) return;
          piezas[nombre].clear();
          piezas[nombre].add(obj);
        });
        pedir();
      },
      undefined,
      () => {} // si falla, se quedan las esferas
    );
  }

  /* Tamaño */
  function ajustar() {
    const w = lienzoEl.clientWidth;
    const h = lienzoEl.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    // en pantallas estrechas se aleja para que quepa abierta
    distancia = w / h < 0.8 ? 11 : 8.4;
    // En pantallas anchas la pieza va un poco a la derecha para no tapar el nombre
    cabeza.position.x = w / h > 1.25 ? 0.6 : 0;
    camara.updateProjectionMatrix();
    pedir();
  }
  window.addEventListener('resize', ajustar);

  /* Progreso del scroll dentro de la sección fijada: 0 al entrar, 1 al salir */
  function progreso() {
    if (movimientoReducido) return 0.7;
    const r = seccion.getBoundingClientRect();
    const recorrido = r.height - window.innerHeight;
    return recorrido > 0 ? MathUtils.clamp(-r.top / recorrido, 0, 1) : 0.7;
  }

  const raton = { x: 0, y: 0 };
  const giro = { x: 0, y: 0 };
  if (!movimientoReducido && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (e) => {
      raton.x = e.clientX / window.innerWidth - 0.5;
      raton.y = e.clientY / window.innerHeight - 0.5;
      pedir();
    }, { passive: true });
  }

  let distancia = 7.4;
  let visible = false;
  let pendiente = false;
  let abierto = 0;
  const reloj = { inicio: performance.now() };

  function pintar(ahora) {
    pendiente = false;
    const t = (ahora - reloj.inicio) / 1000;
    const p = progreso();
    // La apertura sigue al scroll con un poco de inercia
    abierto += (suave(tramo(p, 0.08, 0.72)) - abierto) * (movimientoReducido ? 1 : 0.12);
    seccion.style.setProperty('--apertura', abierto.toFixed(3));

    const flota = movimientoReducido ? 0 : 1;
    arriba.position.y = abierto * 0.95 + Math.sin(t * 0.9) * 0.012 * flota;
    arriba.rotation.set(-0.42 * abierto, 0, 0.2 * abierto);
    abajo.position.y = -abierto * 0.6 + Math.sin(t * 0.9 + 1.7) * 0.01 * flota;
    abajo.rotation.set(0.16 * abierto, 0, -0.12 * abierto);
    hueso.position.y = Math.sin(t * 0.9 + 0.8) * 0.015 * flota;
    hueso.rotation.y = t * 0.15 * flota + abierto * 0.6;
    bronce.emissiveIntensity = 0.2 + abierto * 1.6;
    oro.emissiveIntensity = 0.4 + abierto * 0.8;

    // Abierta mide casi el doble: la cámara se aleja y la centra
    camara.position.z = distancia * (1 + 0.28 * abierto);
    cabeza.position.y = -0.18 * abierto;

    giro.x += (raton.y * 0.25 - giro.x) * 0.06;
    giro.y += (raton.x * 0.6 - giro.y) * 0.06;
    cabeza.rotation.x = 0.08 + giro.x;
    cabeza.rotation.y = -0.5 + t * 0.06 * flota + giro.y;

    renderer.render(escena, camara);
    // Mientras se ve, se sigue animando (flota); quieta si hay que reducir movimiento
    if (visible && (!movimientoReducido || Math.abs(suave(tramo(p, 0.08, 0.72)) - abierto) > 0.001)) pedir();
  }
  function pedir() {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(pintar);
    }
  }

  new IntersectionObserver((entradas) => {
    visible = entradas[0].isIntersecting;
    if (visible) pedir();
  }).observe(seccion);
  window.addEventListener('scroll', pedir, { passive: true });
  ajustar();
}

const seccion = document.querySelector('[data-busto]');
if (seccion) iniciar(seccion);
