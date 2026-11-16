"""Genera las texturas PROVISIONALES de los materiales de sala de la V3:

  public/img/marmol/travertino.webp  travertino crema (sala II, Teaser):
                                     bandas horizontales suaves y poros
  public/img/marmol/grafito.webp     piedra de grafito (sala IV, Proceso, y
                                     el pedestal de "Hecho por"): gris oscuro
                                     con brillo fino y vetas claras

Las reales (Rosso Levanto y mármol blanco) salen de los .blend de Javi y
están en materiales/texturas/. Cuando existan las de travertino y grafito,
se sobrescriben estos archivos con el mismo nombre.

Uso:  python3 scripts/generar-materiales-v3.py
Necesita numpy y Pillow.
"""
import numpy as np
from PIL import Image, ImageFilter

ANCHO, ALTO = 1472, 1104
rng = np.random.default_rng(23)
yy, xx = np.mgrid[0:ALTO, 0:ANCHO].astype(np.float32)


def ruido(octavas, bx, by, persistencia=0.55):
    """Ruido fractal: rejillas aleatorias reescaladas en bicúbico (bx, by: celdas de la primera octava)."""
    total = np.zeros((ALTO, ANCHO), np.float32)
    amp, peso = 1.0, 0.0
    for o in range(octavas):
        rejilla = rng.random((int(by * 2 ** o) + 3, int(bx * 2 ** o) + 3)).astype(np.float32)
        total += amp * np.asarray(Image.fromarray(rejilla).resize((ANCHO, ALTO), Image.BICUBIC))
        peso += amp
        amp *= persistencia
    return total / peso


def mezclar(a, b, t):
    t = t[..., None]
    return a * (1 - t) + b * t


def guardar(rgb, ruta, calidad):
    img = Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))
    img.save(ruta, 'WEBP', quality=calidad, method=6)
    print(ruta)


# --- Travertino crema: bandas sedimentarias casi horizontales + poros ------
deforma = ruido(4, 3, 3) - 0.5
bandas = np.sin((yy / ALTO * 26 + deforma * 5.5 + xx / ANCHO * 0.8) * np.pi)
bandas_finas = ruido(5, 2, 40)          # estirado en horizontal
claro = np.array([236, 230, 216], np.float32)   # #ECE6D8
base = np.array([232, 226, 212], np.float32)    # #E8E2D4
veta = np.array([163, 152, 134], np.float32)    # #A39886
t = np.clip(0.5 + 0.5 * bandas, 0, 1) ** 2.2 * 0.38 + (bandas_finas - 0.5) * 0.5
trav = mezclar(base, veta, np.clip(t, 0, 0.6))
trav = mezclar(trav, claro, np.clip((ruido(3, 4, 4) - 0.45) * 1.6, 0, 0.7))
# Poros: puntos oscuros alargados que siguen las bandas
poros = (rng.random((ALTO // 2, ANCHO // 2)) > 0.9965).astype(np.float32)
poros = np.asarray(Image.fromarray((poros * 255).astype(np.uint8)).resize((ANCHO, ALTO), Image.BILINEAR)
                   .filter(ImageFilter.GaussianBlur(1.1)), np.float32) / 255
poros = np.clip(poros * 3.2, 0, 1) * np.clip(0.3 + bandas, 0, 1)
trav = mezclar(trav, np.array([150, 138, 120], np.float32), poros * 0.55)
trav += (rng.random((ALTO, ANCHO, 1)).astype(np.float32) - 0.5) * 5
guardar(trav, 'public/img/marmol/travertino.webp', 72)

# --- Grafito: gris oscuro con brillo y vetas claras finas ------------------
n1 = ruido(5, 4, 4)
n2 = ruido(6, 10, 10)
fondo = np.array([75, 69, 67], np.float32)      # #4B4543
hondo = np.array([52, 47, 46], np.float32)
luz = np.array([138, 131, 126], np.float32)
graf = mezclar(hondo, fondo, np.clip((n1 - 0.3) * 2.2, 0, 1))
a = np.radians(24)
u = (xx * np.cos(a) + yy * np.sin(a)) / ANCHO
vetas = 1 - np.abs(np.sin(2 * np.pi * u * 3.2 + (n1 - 0.5) * 9 + (n2 - 0.5) * 3))
graf = mezclar(graf, luz, np.clip(vetas, 0, 1) ** 26 * 0.75)
vetas2 = 1 - np.abs(np.sin(2 * np.pi * u * 7.1 + (n2 - 0.5) * 12 + 1.7))
graf = mezclar(graf, luz, np.clip(vetas2, 0, 1) ** 40 * 0.35)
graf += (rng.random((ALTO, ANCHO, 1)).astype(np.float32) - 0.5) * 9   # brillo fino del grafito
guardar(graf, 'public/img/marmol/grafito.webp', 70)
