# Genera public/img/grano.png: el grano de papel o piedra que lleva el crema
# (variable --grano en css/site.css). Es una tesela de 180 px que se repite:
# ruido fino mezclado con un poco de ruido más grueso, en el tono de la tinta
# (#362926) y con transparencia (de media ~1 %, como mucho ~5 %).
# Uso: python3 scripts/generar-grano.py   (necesita Pillow: pip install pillow)
import random
from PIL import Image

random.seed(7)
N = 180
fino = [random.randint(0, 255) for _ in range(N * N)]
medio = Image.new('L', (N // 2, N // 2))
medio.putdata([random.randint(0, 255) for _ in range((N // 2) ** 2)])
medio = list(medio.resize((N, N), Image.BICUBIC).getdata())

pixeles = []
for a, b in zip(fino, medio):
    v = 0.8 * a + 0.2 * b
    alfa = int(max(0, v - 140) / 115 * 13)
    pixeles.append((54, 41, 38, alfa))

im = Image.new('RGBA', (N, N))
im.putdata(pixeles)
im.save('public/img/grano.png', optimize=True)
print('public/img/grano.png')
