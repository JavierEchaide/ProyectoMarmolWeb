"""Genera las tres capas PROVISIONALES de la nebulosa del Teaser:

  public/img/teaser/nebulosa-1.webp   capa lejana: bruma clara y amplia
  public/img/teaser/nebulosa-2.webp   capa media: velos de travertino
  public/img/teaser/nebulosa-3.webp   capa cercana: jirones grises y polvo

Grises, blancos y travertino, sin dorados. WebP con transparencia. Cuando
existan los renders de Blender se sobrescriben estos archivos con el mismo
nombre y no hay que tocar código (ver NOTA-WEB.md).

Uso:  python3 scripts/generar-nebulosa.py
Necesita numpy y Pillow.
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ANCHO, ALTO = 1600, 2400
SALIDA = os.path.join(os.path.dirname(__file__), '..', 'public', 'img', 'teaser')
os.makedirs(SALIDA, exist_ok=True)


def ruido(rng, octavas, celda, persistencia=0.55):
    """Ruido fractal: rejillas aleatorias reescaladas en bicúbico y sumadas."""
    total = np.zeros((ALTO, ANCHO), np.float32)
    amplitud, suma = 1.0, 0.0
    for o in range(octavas):
        c = max(2, celda // (2 ** o))
        w, h = max(2, ANCHO // c), max(2, ALTO // c)
        rejilla = (rng.random((h, w)) * 255).astype(np.uint8)
        capa = np.asarray(Image.fromarray(rejilla).resize((ANCHO, ALTO), Image.BICUBIC), np.float32) / 255
        total += capa * amplitud
        suma += amplitud
        amplitud *= persistencia
    return total / suma


def umbral(x, a, b):
    """Rampa suave entre a y b (0 fuera, 1 dentro)."""
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def guardar(nombre, color, alfa, desenfoque=0):
    rgba = np.dstack([np.broadcast_to(np.array(c, np.float32), alfa.shape) if np.isscalar(c) else c for c in color] + [alfa * 255])
    img = Image.fromarray(np.clip(rgba, 0, 255).astype(np.uint8), 'RGBA')
    if desenfoque:
        img = img.filter(ImageFilter.GaussianBlur(desenfoque))
    ruta = os.path.join(SALIDA, nombre)
    img.save(ruta, 'WEBP', quality=62, alpha_quality=70, method=6)
    print(nombre, round(os.path.getsize(ruta) / 1024), 'KB')


# 1 · Lejana: bruma blanca y gris muy clara, masas grandes
rng = np.random.default_rng(21)
n = ruido(rng, 5, 520)
m = ruido(rng, 3, 900)
alfa = umbral(n, 0.42, 0.66) * 0.85
gris = 236 - m * 34
guardar('nebulosa-1.webp', [gris + 6, gris + 4, gris - 2], alfa, 6)

# 2 · Media: velos de travertino (beige grisáceo), más rotos
rng = np.random.default_rng(34)
n = ruido(rng, 6, 360)
v = np.abs(ruido(rng, 5, 300) - 0.5) * 2          # crestas: forma de velo
alfa = umbral(n, 0.48, 0.7) * (1 - umbral(v, 0.0, 0.5)) * 0.8
t = ruido(rng, 3, 700)
guardar('nebulosa-2.webp', [205 - t * 30, 194 - t * 30, 176 - t * 30], alfa, 3)

# 3 · Cercana: jirones gris piedra, pocos y nítidos, con algo de polvo claro
rng = np.random.default_rng(55)
n = ruido(rng, 6, 260)
v = np.abs(ruido(rng, 6, 220) - 0.5) * 2
alfa = umbral(n, 0.55, 0.72) * (1 - umbral(v, 0.0, 0.3)) * 0.55
polvo = (rng.random((ALTO, ANCHO)) > 0.9994).astype(np.float32)
polvo = np.asarray(Image.fromarray((polvo * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.3)), np.float32) / 255 * 4
polvo = np.clip(polvo, 0, 1)
t = ruido(rng, 3, 500)
base = 128 - t * 26
guardar('nebulosa-3.webp', [base + polvo * 120, base - 3 + polvo * 120, base - 9 + polvo * 120], np.clip(alfa + polvo * 0.8, 0, 1), 1)
