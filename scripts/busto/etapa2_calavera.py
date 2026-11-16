"""Etapa 2: calavera dentro del hueco, orientada y encajada.
Entrada etapa1.blend -> salida etapa2.blend (añade 'hueso')."""
import bpy, bmesh, math
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

IN = '/home/claude/trabajo/etapa1.blend'
OUT = '/home/claude/trabajo/etapa2.blend'
OBJ = '/home/claude/trabajo/calavera/Calavera-N1.obj'
Z_OJOS = 1.195
log = lambda *a: print(*a, flush=True)

bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene
bpy.ops.wm.obj_import(filepath=OBJ)
cal = [o for o in bpy.context.selected_objects][0]
cal.name = 'hueso'; cal.data.name = 'hueso'
# Viene de ZBrush tumbada: arriba = -Y. Se pone de pie (arriba = +Z)
cal.data.transform(Matrix.Rotation(-math.pi / 2, 4, 'X') @ cal.matrix_world)
cal.matrix_world = Matrix.Identity(4)
vs = [v.co.copy() for v in cal.data.vertices]
zmin, zmax = min(v.z for v in vs), max(v.z for v in vs)
ymin, ymax = min(v.y for v in vs), max(v.y for v in vs)
# los dientes y la mandíbula están delante: si su centro cae en -Y, girar 180°
abajo = [v for v in vs if v.z < zmin + (zmax - zmin) * 0.3]
yj = sum(v.y for v in abajo) / len(abajo)
log('mandíbula y', round(yj, 3), 'centro y', round((ymin + ymax) / 2, 3))
if yj < (ymin + ymax) / 2:
    cal.data.transform(Matrix.Rotation(math.pi, 4, 'Z'))
# centrar: origen en el centro de la caja, base en z=0
vs = [v.co.copy() for v in cal.data.vertices]
c = Vector([(min(v[i] for v in vs) + max(v[i] for v in vs)) / 2 for i in range(3)])
cal.data.transform(Matrix.Translation(-c))
vs = [v.co.copy() for v in cal.data.vertices]
alto = max(v.z for v in vs) - min(v.z for v in vs)
# cuencas de los ojos: buscar el hueco más hondo en la cara delantera
# (aprox. 58 % de la altura desde la barbilla en una calavera con mandíbula)
ojos_rel = -alto / 2 + alto * 0.58
log('calavera alto', round(alto, 3))

hue = bpy.data.objects['hueco_interior']
bm = bmesh.new(); bm.from_mesh(hue.data)
bvh = BVHTree.FromBMesh(bm)
DIRS = [Vector((0.577, 0.612, 0.54)).normalized(), Vector((-0.71, 0.33, -0.62)).normalized(), Vector((0.12, -0.83, 0.55)).normalized()]
def cruces(p, d):
    n = 0; o = p.copy()
    for _ in range(100):
        hit, _, _, _ = bvh.ray_cast(o, d)
        if hit is None: break
        n += 1; o = hit + d * 1e-5
    return n
def dentro(p):
    return sum(cruces(p, d) % 2 for d in DIRS) >= 2
muestra = vs[::7]
hv = [v.co for v in hue.data.vertices]
cx = (min(v.x for v in hv) + max(v.x for v in hv)) / 2

def cabe(s, dy, dz):
    off = Vector((cx, 0.02 + dy, Z_OJOS - ojos_rel * s + dz))
    for v in muestra:
        p = v * s + off
        loc, nor, idx, d = bvh.find_nearest(p)
        if d < 0.002 or not dentro(p):
            return False
    return True

mejor = (0.05, 0, 0)
for dy in [i * 0.01 for i in range(-3, 6)]:
    for dz in (-0.02, -0.01, 0.0, 0.01):
        if not cabe(mejor[0] + 0.002, dy, dz):
            continue
        lo, hi = mejor[0] + 0.002, 0.6
        while hi - lo > 0.002:
            mid = (lo + hi) / 2
            if cabe(mid, dy, dz): lo = mid
            else: hi = mid
        mejor = (lo, dy, dz)
log('mejor escala/dy/dz', [round(x, 3) for x in mejor])
s, dy, dz = mejor
s *= 0.985  # un pelo de margen
cal.data.transform(Matrix.Translation(Vector((cx, 0.02 + dy, Z_OJOS - ojos_rel * s + dz))) @ Matrix.Scale(s, 4))
for p in cal.data.polygons: p.use_smooth = True
cal.data.materials.clear()
cal.data.materials.append(bpy.data.materials.get('calavera') or bpy.data.materials.new('calavera'))
bpy.ops.wm.save_as_mainfile(filepath=OUT)
log('OK etapa2', 'alto final', round(alto * s, 3))
