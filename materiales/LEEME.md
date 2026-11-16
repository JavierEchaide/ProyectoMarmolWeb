# Materiales de Blender

Materiales de mármol del proyecto, hechos por Javi en Blender. No forman parte de la web publicada (están fuera de `public/`, así que no cuentan en el peso de `dist/`).

- `blender/Mat_Marmol_RossoLevanto.blend`: material "Mat - rosso levanto" (y una copia de "Mat - marmol"). Nodo de grupo con Escala, Color 1, Color 2, Roughness, Superficie, Distorsión 1-4, Detalle 1-3.
- `blender/Mat_Marmol.blend`: material "Mat - marmol" (mármol blanco crema).
- `texturas/rosso-levanto.webp` y `texturas/marmol-blanco.webp`: render cenital plano de cada material (1472×1104, luz blanca uniforme, sin sombras). Son las texturas "de verdad" que sustituirán a las provisionales de `scripts/generar-marmol.py` cuando se apruebe en la V3.

## Volver a sacar las texturas

Con el módulo `bpy` de Blender 5.2 (`pip install bpy==5.2.4`, Python 3.13):

```
python -c "import bpy,sys,runpy; bpy.ops.wm.open_mainfile(filepath='materiales/blender/Mat_Marmol_RossoLevanto.blend'); sys.argv=['x','--','salida.png','Mat - rosso levanto']; runpy.run_path('scripts/render-material.py')"
```

El script crea una escena aparte con un plano de 2×1,5 m, cámara ortográfica cenital y mundo blanco, y renderiza con Cycles (48 muestras, CPU).
