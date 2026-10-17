"""Genera las texturas PROVISIONALES de la web:

  public/img/marmol/marmol.webp        Rosso Levanto (hero, menú)
  public/img/marmol/marmol-marco.webp  la misma piedra con las bandas finas y
                                       el rojo apagado, para los marcos de las
                                       tarjetas (en 10 px de marco las bandas
                                       gruesas parecían manchas)
  public/img/marmol/piedra-negra.webp  piedra negra con grano, para las losas
                                       de SPOILER de Historia

Solo hace falta mientras no exista la textura real sacada de Blender
(ver NOTA-WEB.md, "Assets pendientes"). Cuando llegue, se sustituye
public/img/marmol/marmol.webp y este script deja de usarse.

Uso:  python3 scripts/generar-marmol.py
Necesita numpy y Pillow.
"""
import numpy as np
from PIL import Image, ImageFilter

ANCHO, ALTO = 2000, 1500
rng = np.random.default_rng(11)
yy, xx = np.mgrid[0:ALTO, 0:ANCHO].astype(np.float32)


def ruido(octavas, escala_base, persistencia=0.55):
    """Ruido fractal (fbm): suma de rejillas aleatorias reescaladas en bicúbico."""
    total = np.zeros((ALTO, ANCHO), np.float32)
    amp, peso = 1.0, 0.0
    for o in range(octavas):
        n = int(escala_base * 2 ** o) + 3
        rejilla = rng.random((n, n)).astype(np.float32)
        total += amp * np.asarray(Image.fromarray(rejilla).resize((ANCHO, ALTO), Image.BICUBIC))
        peso += amp
        amp *= persistencia
    return total / peso


def turbulencia(octavas, escala_base):
    """Como el ruido pero sumando |n - 0.5|: da los quiebros del mármol."""
    total = np.zeros((ALTO, ANCHO), np.float32)
    amp = 1.0
    for o in range(octavas):
        n = int(escala_base * 2 ** o) + 3
        rejilla = rng.random((n, n)).astype(np.float32)
        capa = np.asarray(Image.fromarray(rejilla).resize((ANCHO, ALTO), Image.BICUBIC))
        total += amp * np.abs(capa - 0.5)
        amp *= 0.5
    return total


def vetas(angulo, frecuencia, fuerza, turb):
    """Campo seno en diagonal deformado por turbulencia (marmol clásico)."""
    a = np.radians(angulo)
    u = (xx * np.cos(a) + yy * np.sin(a)) / ANCHO
    return np.sin(2 * np.pi * u * frecuencia + fuerza * turb)


def mezclar(color, tinta, alfa):
    return color * (1 - alfa[..., None]) + np.array(tinta, np.float32) * alfa[..., None]


def marmol(umbral_base, fuerza, apagado):
    """umbral_base: más alto = bandas granate más finas. fuerza: opacidad de
    las bandas. apagado: 0 = granate intenso, 1 = rosa grisáceo."""
    # Fondo blanco con nubes grises muy suaves
    nubes = ruido(5, 2)
    color = np.empty((ALTO, ANCHO, 3), np.float32)
    color[:] = [247, 245, 240]
    color = mezclar(color, [218, 214, 208], np.clip((nubes - 0.5) * 1.6, 0, 1) * 0.5)

    # Bandas granate gruesas: donde el seno pasa de un umbral que varía
    t1 = turbulencia(7, 2)
    banda = vetas(-38, 2.0, 7.0, t1)
    umbral = umbral_base + 0.25 * ruido(3, 2)
    alfa_banda = np.clip((banda - umbral) / 0.1, 0, 1)
    textura = ruido(6, 24)
    granate = np.stack([110 + 50 * textura, 22 + 26 * textura, 28 + 22 * textura], -1)
    granate = granate * (1 - apagado) + np.array([176, 128, 122], np.float32) * apagado
    color = color * (1 - alfa_banda[..., None] * fuerza) + granate * alfa_banda[..., None] * fuerza

    # Halo rosado alrededor de las bandas (el rojo "sangra" en el blanco)
    halo = np.clip((banda - umbral + 0.18) / 0.18, 0, 1) * (1 - alfa_banda)
    color = mezclar(color, [196, 120, 122], halo * 0.35 * fuerza)

    # Vetas finas rojizas en la misma dirección, más frecuentes
    t2 = turbulencia(7, 3)
    finas = 1 - np.abs(vetas(-34, 3.5, 5.5, t2))
    visibles = np.clip((ruido(3, 2) - 0.42) * 4, 0, 1)
    color = mezclar(color, [139, 38, 38], np.clip((finas - 0.975) / 0.025, 0, 1) * visibles * 0.75)

    # Pocas vetas casi negras
    t3 = turbulencia(6, 2)
    negras = 1 - np.abs(vetas(-44, 2.2, 6.0, t3))
    zonas = np.clip((ruido(3, 1.5) - 0.55) * 6, 0, 1)
    color = mezclar(color, [40, 30, 30], np.clip((negras - 0.985) / 0.015, 0, 1) * zonas * 0.85)

    # Craquelado blanco dentro de las bandas
    t4 = turbulencia(5, 8)
    craq = 1 - np.abs(vetas(20, 14, 16.0, t4))
    color = mezclar(color, [240, 232, 228], np.clip((craq - 0.95) / 0.05, 0, 1) * alfa_banda * 0.7)

    return color


def guardar(color, ruta, ancho=None):
    img = Image.fromarray(np.clip(color, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    if ancho:
        img = img.resize((ancho, round(ancho * ALTO / ANCHO)), Image.LANCZOS)
    img.save(ruta, quality=82)
    print(ruta, img.size)


def piedra_negra():
    """Negro casi plano con grano fino y nubes muy suaves (sin vetas)."""
    nubes = ruido(5, 3)
    grano = rng.random((ALTO, ANCHO)).astype(np.float32)
    base = 14 + 10 * nubes + 7 * (grano - 0.5)
    motas = np.clip((ruido(1, 260) - 0.68) * 9, 0, 1) * 7
    v = base + motas
    return np.stack([v * 1.04, v, v * 0.96], -1)


guardar(marmol(0.72, 0.95, 0.0), "public/img/marmol/marmol.webp")
guardar(marmol(0.86, 0.55, 0.45), "public/img/marmol/marmol-marco.webp")
guardar(piedra_negra(), "public/img/marmol/piedra-negra.webp", 900)
