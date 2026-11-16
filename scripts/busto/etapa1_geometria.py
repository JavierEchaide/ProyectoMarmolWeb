"""Etapa 1 (v3): sólidos limpios por vóxeles + booleanos EXACT.
- O = cabeza (cuello y agujeros tapados) ∪ pelo con grosor, remallado por vóxeles
- cáscara = O − hueco (hueco = forma alisada y encogida)
- abajo = cáscara ∩ caja de la grieta ; arriba = cáscara − caja
Guarda /home/claude/trabajo/etapa1.blend con 'arriba', 'abajo', 'costura' y 'hueco_interior'."""
import bpy, bmesh, math, random
from mathutils import Vector
from mathutils.bvhtree import BVHTree

SRC = '/home/claude/trabajo/busto.blend'
OUT = '/home/claude/trabajo/etapa1.blend'
Z0 = 1.200            # altura de la grieta (ojos)
CX, CY = 0.0, 0.02    # eje de la cabeza
GROSOR = 0.014        # grosor mínimo del mármol (m)
PELO_GROSOR = 0.008
VOXEL = 0.0014
TRIS_OBJETIVO = int(__import__('os').environ.get('TRIS', 250000))

bpy.ops.wm.open_mainfile(filepath=SRC)
sc = bpy.context.scene
log = lambda *a: print(*a, flush=True)

def malla_mundo(o):
    bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
    return bm

def islas(bm):
    sin_ver = set(bm.verts); res = []
    while sin_ver:
        v0 = sin_ver.pop(); pila = [v0]; comp = [v0]
        while pila:
            v = pila.pop()
            for e in v.link_edges:
                w = e.other_vert(v)
                if w in sin_ver:
                    sin_ver.remove(w); pila.append(w); comp.append(w)
        res.append(comp)
    return res

def quitar_sueltos(bm, minimo=20):
    bmesh.ops.delete(bm, geom=[e for e in bm.edges if not e.link_faces], context='EDGES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_edges], context='VERTS')
    borrar = [v for c in islas(bm) if len(c) < minimo for v in c]
    bmesh.ops.delete(bm, geom=borrar, context='VERTS')

def bm_a_obj(nombre, bm):
    me = bpy.data.meshes.new(nombre); bm.to_mesh(me)
    o = bpy.data.objects.new(nombre, me); sc.collection.objects.link(o)
    return o

def aplicar(o):
    for x in bpy.context.selected_objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    for m in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)

def booleano(obj, cutter, op, nombre):
    c = obj.copy(); c.data = obj.data.copy(); c.name = nombre; sc.collection.objects.link(c)
    mb = c.modifiers.new('b', 'BOOLEAN'); mb.operation = op; mb.object = cutter; mb.solver = 'EXACT'
    aplicar(c)
    log(' boolean', op, nombre, len(c.data.vertices))
    return c

DIRS = [Vector((0.577, 0.612, 0.54)).normalized(), Vector((-0.71, 0.33, -0.62)).normalized(), Vector((0.12, -0.83, 0.55)).normalized()]
def cruces(bvh, p, d):
    n = 0; o = p.copy()
    for _ in range(200):
        hit, _, _, _ = bvh.ray_cast(o, d)
        if hit is None: break
        n += 1; o = hit + d * 1e-5
    return n
def dentro(bvh, p):
    return sum(cruces(bvh, p, d) % 2 for d in DIRS) >= 2

# ---------- Cabeza cerrada y pelo con grosor ----------
cab = malla_mundo(bpy.data.objects['Retopologia'])
pel = malla_mundo(bpy.data.objects['Pelo_Modelo.001'])
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
quitar_sueltos(cab); quitar_sueltos(pel)
res = bmesh.ops.holes_fill(cab, edges=[e for e in cab.edges if e.is_boundary], sides=0)
bmesh.ops.triangulate(cab, faces=[f for f in res['faces'] if len(f.verts) > 4])
bmesh.ops.recalc_face_normals(cab, faces=cab.faces)
bvh_cab = BVHTree.FromBMesh(cab)
cab_o = bm_a_obj('cab', cab.copy())
pelo_o = bm_a_obj('pelo', pel)
ms = pelo_o.modifiers.new('sol', 'SOLIDIFY'); ms.thickness = PELO_GROSOR; ms.offset = -1; ms.use_rim = True; ms.use_even_offset = False; ms.thickness_clamp = 1.0
aplicar(pelo_o)

# ---------- O: unión por vóxeles ----------
for x in bpy.context.selected_objects: x.select_set(False)
cab_o.select_set(True); pelo_o.select_set(True); bpy.context.view_layer.objects.active = cab_o
bpy.ops.object.join()
O = cab_o; O.name = 'exterior'
rm = O.modifiers.new('rem', 'REMESH'); rm.mode = 'VOXEL'; rm.voxel_size = VOXEL; rm.adaptivity = 0
aplicar(O)
bm = bmesh.new(); bm.from_mesh(O.data)
cs = islas(bm); cs.sort(key=len, reverse=True)
bmesh.ops.delete(bm, geom=[v for c in cs[1:] for v in c], context='VERTS')   # solo la pieza principal
bm.to_mesh(O.data); bm.free()
log('exterior vóxeles: islas', len(cs), 'verts', len(O.data.vertices))
# Decimado con fast-simplification (cuádricas): el Decimate de Blender dejaba
# triángulos enormes saliendo de la superficie con reducciones tan fuertes
import numpy as np, fast_simplification
me = O.data; me.calc_loop_triangles()
V = np.array([v.co[:] for v in me.vertices], dtype=np.float32)
F = np.array([t.vertices[:] for t in me.loop_triangles], dtype=np.int64)
V2, F2 = fast_simplification.simplify(V, F, target_reduction=1 - TRIS_OBJETIVO / len(F), agg=7)
nuevo = bpy.data.meshes.new('exterior')
nuevo.from_pydata(V2.tolist(), [], F2.tolist()); nuevo.validate(); nuevo.update()
O.data = nuevo
log('exterior decimado tris', sum(len(p.vertices) - 2 for p in O.data.polygons))

# ---------- Hueco ----------
hue_o = bm_a_obj('hueco_interior', cab.copy())
m = hue_o.modifiers.new('rem', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = 0.008
m = hue_o.modifiers.new('suave', 'SMOOTH'); m.factor = 1.0; m.iterations = 40
m = hue_o.modifiers.new('dec', 'DECIMATE'); m.ratio = 0.3
aplicar(hue_o)
hue = bmesh.new(); hue.from_mesh(hue_o.data); hue.verts.ensure_lookup_table()
vs = [v.co for v in hue.verts]
centro = Vector((CX, (min(v.y for v in vs) + max(v.y for v in vs)) / 2, (min(v.z for v in vs) + max(v.z for v in vs)) / 2))
orig = [v.co.copy() for v in hue.verts]
def cabe(s):
    for v, o in zip(hue.verts, orig):
        v.co = centro + (o - centro) * s
    for v in hue.verts:
        loc, nor, idx, d = bvh_cab.find_nearest(v.co)
        if d < GROSOR or not dentro(bvh_cab, v.co):
            return False
    return True
lo, hi = 0.5, 1.0
for _ in range(12):
    mid = (lo + hi) / 2
    if cabe(mid): lo = mid
    else: hi = mid
cabe(lo)
hue.to_mesh(hue_o.data); hue.free()
log('hueco escala', round(lo, 3), 'verts', len(hue_o.data.vertices))

# ---------- Caja de la grieta ----------
rnd = random.Random(5)
ondas = [(k, (rnd.random() - 0.5) * 0.045 / k, rnd.random() * math.tau) for k in (1, 2, 3)]
N_DIENTES = 56
dientes = [(rnd.random() - 0.5) * 0.012 for _ in range(N_DIENTES)]
rug = [[(rnd.random() - 0.5) * 0.004 for _ in range(12)] for _ in range(N_DIENTES)]
def z_grieta(theta, r=0.0):
    theta %= math.tau
    z = Z0
    for k, a, f in ondas:
        z += a * math.sin(k * theta + f)
    x = (theta / math.tau) * N_DIENTES
    i = int(math.floor(x)) % N_DIENTES; t = x - math.floor(x)
    z += dientes[i] * (1 - t) + dientes[(i + 1) % N_DIENTES] * t
    rr = min(11.0, r / 0.3 * 11); j = int(rr); tr = rr - j
    z += (rug[i][j] * (1 - tr) + rug[i][min(11, j + 1)] * tr) * min(1.0, r / 0.08)
    return z

bmc = bmesh.new()
NT, ZB = 448, 0.6
RADIOS = [0.04 + i * 0.02 for i in range(15)] + [0.5]
arr, aba = [], []
for r in RADIOS:
    fa, fb = [], []
    for i in range(NT):
        th = i / NT * math.tau
        x, y = CX + r * math.cos(th), CY + r * math.sin(th)
        fa.append(bmc.verts.new((x, y, z_grieta(th, r)))); fb.append(bmc.verts.new((x, y, ZB)))
    arr.append(fa); aba.append(fb)
ca = bmc.verts.new((CX, CY, Z0)); cb = bmc.verts.new((CX, CY, ZB))
for i in range(NT):
    n = (i + 1) % NT
    bmc.faces.new((ca, arr[0][i], arr[0][n])); bmc.faces.new((cb, aba[0][n], aba[0][i]))
    for j in range(len(RADIOS) - 1):
        bmc.faces.new((arr[j][i], arr[j + 1][i], arr[j + 1][n], arr[j][n]))
        bmc.faces.new((aba[j][n], aba[j + 1][n], aba[j + 1][i], aba[j][i]))
    bmc.faces.new((arr[-1][n], arr[-1][i], aba[-1][i], aba[-1][n]))
bmesh.ops.recalc_face_normals(bmc, faces=bmc.faces)
log('caja: volumen', round(bmc.calc_volume(signed=True), 4))
caja = bm_a_obj('caja', bmc)

# materiales: 0 mármol, 1 hueco, 2 cara de rotura
mats = [bpy.data.materials.get(n) or bpy.data.materials.new(n) for n in ('marmol', 'hueco', 'corte')]
for ob, idx in ((O, 0), (hue_o, 1), (caja, 2)):
    ob.data.materials.clear()
    for mt in mats: ob.data.materials.append(mt)
    for p in ob.data.polygons: p.material_index = idx

cascara = booleano(O, hue_o, 'DIFFERENCE', 'cascara')
abajo = booleano(cascara, caja, 'INTERSECT', 'abajo')
arriba = booleano(cascara, caja, 'DIFFERENCE', 'arriba')
for ob in (arriba, abajo):
    cnt = [0, 0, 0]
    for p in ob.data.polygons: cnt[p.material_index] += 1
    log(ob.name, 'caras por material', cnt)

# ---------- Costura de oro ----------
bmo = bmesh.new(); bmo.from_mesh(O.data)
bvh_ext = BVHTree.FromBMesh(bmo)
puntos = []
NS = 448
for i in range(NS):
    th = i / NS * math.tau
    d = Vector((math.cos(th), math.sin(th), 0))
    base = Vector((CX, CY, 0)) + d * 0.6
    hit = None; r = 0.2
    for _ in range(3):
        h, _, _, _ = bvh_ext.ray_cast(Vector((base.x, base.y, z_grieta(th, r))), -d, 0.6)
        if h is None: break
        hit = h; r = (Vector((h.x, h.y, 0)) - Vector((CX, CY, 0))).length
    if hit is not None:
        puntos.append(hit + d * 0.0010)
cu = bpy.data.curves.new('costura', 'CURVE'); cu.dimensions = '3D'
sp = cu.splines.new('POLY'); sp.points.add(len(puntos) - 1)
for p, q in zip(sp.points, puntos): p.co = (q.x, q.y, q.z, 1)
sp.use_cyclic_u = True
cu.bevel_depth = 0.0026; cu.bevel_resolution = 1
co = bpy.data.objects.new('costura', cu); sc.collection.objects.link(co)
for o in bpy.context.selected_objects: o.select_set(False)
bpy.context.view_layer.objects.active = co; co.select_set(True)
bpy.ops.object.convert(target='MESH')
log('costura puntos', len(puntos))

for n in ('exterior', 'caja', 'cascara'):
    bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)
hue_o.hide_render = True
bpy.ops.wm.save_as_mainfile(filepath=OUT)
log('OK etapa1')
