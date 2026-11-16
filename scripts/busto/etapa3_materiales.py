"""Etapa 3: sombreado suave, UVs, materiales (Mat_Marmol crema y aguamarina),
horneado a texturas, normalización para la web y exportación a busto.glb.
Entrada etapa2.blend. Salidas:
  /home/claude/trabajo/busto_web.blend  (piezas + materiales procedurales y horneados)
  /home/claude/trabajo/busto.glb"""
import bpy, bmesh, math, sys, os
from mathutils import Vector, Matrix

IN = '/home/claude/trabajo/etapa2.blend'
MAT_LIB = '/home/claude/trabajo/c0c07ff6-Mat_Marmol.blend'
OUT_BLEND = '/home/claude/trabajo/busto_web.blend'
OUT_GLB = '/home/claude/trabajo/busto.glb'
TEX = '/home/claude/trabajo/texturas'
RES = int(os.environ.get('RES', 2048))
ESCALA_CABEZA = float(os.environ.get('ESCALA_CABEZA', 1.0))
ESCALA_CALAVERA = float(os.environ.get('ESCALA_CALAVERA', 1.5))
os.makedirs(TEX, exist_ok=True)
log = lambda *a: print(*a, flush=True)

def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)

# Aguamarina verdoso, a partir del Verde Guatemala / Verde Alpi: fondo verde
# azulado y vetas claras de espuma de mar
AGUA_BASE = os.environ.get('AGUA_BASE', '#2f8a78')
AGUA_VETA = os.environ.get('AGUA_VETA', '#bfeadc')

bpy.ops.wm.open_mainfile(filepath=IN)
sc = bpy.context.scene
bpy.data.objects.remove(bpy.data.objects['hueco_interior'], do_unlink=True)

# --- Material de Javi (append) ---
with bpy.data.libraries.load(MAT_LIB, link=False) as (src, dst):
    dst.materials = ['Mat - marmol']
base = bpy.data.materials['Mat - marmol']
grupo = [n for n in base.node_tree.nodes if n.type == 'GROUP'][0].node_tree
log('grupo', grupo.name)

# Copia del grupo para hornear: el color del mármol sale por una Emisión
g_bake = grupo.copy(); g_bake.name = grupo.name + ' (hornear)'
mix = g_bake.nodes['Mix.003']; out = g_bake.nodes['Group Output']
em = g_bake.nodes.new('ShaderNodeEmission')
g_bake.links.new(mix.outputs['Result'], em.inputs['Color'])
g_bake.links.new(em.outputs['Emission'], out.inputs['Shader'])

def valores(nodo_grupo):
    return {i.name: (tuple(i.default_value) if hasattr(i.default_value, '__len__') else i.default_value)
            for i in nodo_grupo.inputs if hasattr(i, 'default_value')}
vals_crema = valores([n for n in base.node_tree.nodes if n.type == 'GROUP'][0])
log('valores crema', vals_crema)

def mat_procedural(nombre, grupo_arbol, vals, extra=None):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = grupo_arbol
    for k, v in vals.items():
        if k in g.inputs: g.inputs[k].default_value = v
    if extra: extra(g)
    o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(g.outputs[0], o.inputs['Surface'])
    return m

vals_cab = dict(vals_crema); vals_cab['Escala'] = ESCALA_CABEZA
vals_cal = dict(vals_crema); vals_cal['Escala'] = ESCALA_CALAVERA
vals_cal['Color 1'] = lin(AGUA_BASE); vals_cal['Color 2'] = lin(AGUA_VETA)

# Vetas de oro de la calavera (máscara procedural, se hornea aparte)
def mat_vetas(nombre):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    tc = nt.nodes.new('ShaderNodeTexCoord')
    ns = nt.nodes.new('ShaderNodeTexNoise'); ns.inputs['Scale'].default_value = 6; ns.inputs['Detail'].default_value = 4
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'VECTOR'; mx.inputs['Factor'].default_value = 0.35
    wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 4.5; wv.inputs['Distortion'].default_value = 6
    wv.inputs['Detail'].default_value = 3; wv.wave_profile = 'SIN'
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = 0.93; cr.color_ramp.elements[0].color = (0, 0, 0, 1)
    cr.color_ramp.elements[1].position = 0.985; cr.color_ramp.elements[1].color = (1, 1, 1, 1)
    zona = nt.nodes.new('ShaderNodeTexNoise'); zona.inputs['Scale'].default_value = 2.5
    zr = nt.nodes.new('ShaderNodeValToRGB')
    zr.color_ramp.elements[0].position = 0.45; zr.color_ramp.elements[1].position = 0.6
    mul = nt.nodes.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1
    col = nt.nodes.new('ShaderNodeMix'); col.data_type = 'RGBA'; col.blend_type = 'MULTIPLY'; col.inputs['Factor'].default_value = 1
    col.inputs[7].default_value = lin('#f2c45a')
    em = nt.nodes.new('ShaderNodeEmission'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    L = nt.links.new
    L(tc.outputs['Object'], ns.inputs['Vector']); L(tc.outputs['Object'], mx.inputs[4]); L(ns.outputs['Color'], mx.inputs[5])
    L(mx.outputs[1], wv.inputs['Vector']); L(wv.outputs['Color'], cr.inputs['Fac'])
    L(tc.outputs['Object'], zona.inputs['Vector']); L(zona.outputs['Fac'], zr.inputs['Fac'])
    L(cr.outputs['Color'], mul.inputs[6]); L(zr.outputs['Color'], mul.inputs[7])
    L(mul.outputs[2], col.inputs[6])
    L(col.outputs[2], em.inputs['Color']); L(em.outputs[0], o.inputs['Surface'])
    return m

# --- Sombreado suave con aristas duras en los cambios de material y ángulos fuertes ---
def suavizar(o, angulo=50):
    bm = bmesh.new(); bm.from_mesh(o.data)
    lim = math.radians(angulo)
    for f in bm.faces: f.smooth = True
    for e in bm.edges:
        lf = e.link_faces
        e.smooth = not (len(lf) == 2 and (lf[0].material_index != lf[1].material_index or e.calc_face_angle(0) > lim))
    bm.to_mesh(o.data); bm.free()

arriba, abajo, hueso, costura = (bpy.data.objects[n] for n in ('arriba', 'abajo', 'hueso', 'costura'))
for o in (arriba, abajo, hueso): suavizar(o)
for p in costura.data.polygons: p.use_smooth = True

# --- UVs ---
def uv(o, margen=0.002):
    for x in bpy.context.selected_objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    if not o.data.uv_layers: o.data.uv_layers.new(name='UVMap')
    while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[1])
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=margen, area_weight=0.0, scale_to_bounds=True)
    bpy.ops.object.mode_set(mode='OBJECT')
for o in (arriba, abajo, hueso): uv(o)
log('UVs hechas')

# --- Hornear ---
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
sc.render.bake.margin = 16; sc.render.bake.margin_type = 'EXTEND'; sc.render.bake.use_clear = False; sc.render.bake.use_selected_to_active = False; sc.render.bake.target = 'IMAGE_TEXTURES'

def hornear(o, mat_bake, nombre_img, indices, res=None, fondo=(0, 0, 0, 1)):
    """Hornea mat_bake en los slots 'indices' del objeto a una imagen nueva."""
    img = bpy.data.images.new(nombre_img, res or RES, res or RES, alpha=False, float_buffer=False)
    # fondo del color del mármol: así los bordes de las islas UV (y los mipmaps)
    # no sacan puntos negros
    img.generated_color = fondo
    tex = mat_bake.node_tree.nodes.new('ShaderNodeTexImage'); tex.image = img
    mat_bake.node_tree.nodes.active = tex
    viejos = [s.material for s in o.material_slots]
    negro = bpy.data.materials.get('_negro')
    if not negro:
        negro = bpy.data.materials.new('_negro'); negro.use_nodes = True
        t2 = negro.node_tree.nodes.new('ShaderNodeTexImage')
    # todos los slots usan el material de horneado (los que no toca, también,
    # para que Cycles tenga imagen activa en todos; luego se sobreescribe)
    for i, s in enumerate(o.material_slots):
        s.material = mat_bake
    for x in bpy.context.selected_objects: x.select_set(False)
    bpy.context.view_layer.objects.active = o; o.select_set(True)
    bpy.ops.object.bake(type='EMIT')
    for s, m in zip(o.material_slots, viejos): s.material = m
    img.filepath_raw = f'{TEX}/{nombre_img}.png'; img.file_format = 'PNG'; img.save()
    mat_bake.node_tree.nodes.remove(tex)
    log('horneado', nombre_img)
    return img

bake_cab = mat_procedural('_bake_cabeza', g_bake, vals_cab)
bake_cal = mat_procedural('_bake_calavera', g_bake, vals_cal)
bake_vet = mat_vetas('_bake_vetas')
img_ar = hornear(arriba, bake_cab, 'arriba_color', None, fondo=vals_cab['Color 1'])
img_ab = hornear(abajo, bake_cab, 'abajo_color', None, fondo=vals_cab['Color 1'])
img_ca = hornear(hueso, bake_cal, 'calavera_color', None, res=1024, fondo=vals_cal['Color 1'])
img_ve = hornear(hueso, bake_vet, 'calavera_vetas', None, res=1024)

# --- Materiales finales (los que viajan en el .glb) ---
def mat_final(nombre, img, rough=0.3, color=None, emis=None):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    b = nt.nodes.new('ShaderNodeBsdfPrincipled'); o = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(b.outputs[0], o.inputs['Surface'])
    b.inputs['Roughness'].default_value = rough
    if img:
        t = nt.nodes.new('ShaderNodeTexImage'); t.image = img
        if color:
            mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'
            mx.inputs['Factor'].default_value = 1; mx.inputs[7].default_value = color
            nt.links.new(t.outputs['Color'], mx.inputs[6]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])
        else:
            nt.links.new(t.outputs['Color'], b.inputs['Base Color'])
    elif color:
        b.inputs['Base Color'].default_value = color
    if emis:
        te = nt.nodes.new('ShaderNodeTexImage'); te.image = emis
        nt.links.new(te.outputs['Color'], b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = 1.0
    return m

hueco_m = mat_final('hueco', None, rough=0.95, color=lin('#3a322e'))
def asignar(o, img, nombre):
    marm = mat_final(nombre, img, rough=0.3)
    rot = mat_final(nombre + '_rotura', img, rough=0.75)
    # ojo: materials.clear() pone todos los índices a 0; se sustituyen slot a slot
    for i, m in enumerate((marm, hueco_m, rot)):
        o.material_slots[i].material = m
asignar(arriba, img_ar, 'marmol_arriba')
asignar(abajo, img_ab, 'marmol_abajo')
hueso.data.materials.clear(); hueso.data.materials.append(mat_final('calavera', img_ca, rough=0.28, emis=img_ve))
oro = bpy.data.materials.new('oro'); oro.use_nodes = True
b = oro.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = lin('#d4ab45'); b.inputs['Metallic'].default_value = 1; b.inputs['Roughness'].default_value = 0.28
costura.data.materials.clear(); costura.data.materials.append(oro)

# --- Guardar versión de trabajo (procedural + horneado) para Javi ---
# Material procedural original en un slot extra no usado no viaja: se guarda en
# la escena con usuario falso para poder volver a hornear.
for m in (base, bake_cab, bake_cal, bake_vet): m.use_fake_user = True
for im in (img_ar, img_ab, img_ca, img_ve): im.pack()

# --- Normalizar para la web: centro en el origen, alto 2, cara hacia -Y (=> +Z en glTF) ---
pts = [o.matrix_world @ Vector(c) for o in (arriba, abajo) for c in o.bound_box]
mn = Vector([min(p[i] for p in pts) for i in range(3)]); mx_ = Vector([max(p[i] for p in pts) for i in range(3)])
c = (mn + mx_) / 2; k = 2.0 / (mx_.z - mn.z)
M = Matrix.Rotation(math.pi, 4, 'Z') @ Matrix.Scale(k, 4) @ Matrix.Translation(-c)
log('normalizar: centro', tuple(round(x, 3) for x in c), 'escala', round(k, 3))
for o in (arriba, abajo, hueso, costura):
    o.data.transform(M); o.matrix_world = Matrix.Identity(4)
costura.parent = abajo
for o in list(sc.objects):
    if o not in (arriba, abajo, hueso, costura): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)

# --- Exportar ---
for x in bpy.context.selected_objects: x.select_set(False)
for o in (arriba, abajo, hueso, costura): o.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB, export_format='GLB', use_selection=True,
    export_image_format=os.environ.get('FORMATO', 'WEBP'), export_image_quality=int(os.environ.get('CALIDAD', 82)),
    export_yup=True, export_apply=False, export_texcoords=True, export_normals=True,
    export_materials='EXPORT', export_cameras=False, export_lights=False, export_animations=False,
    export_extras=False,
    export_draco_mesh_compression_enable=os.environ.get('DRACO', '1') == '1',
    export_draco_mesh_compression_level=6, export_draco_position_quantization=14,
    export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
log('glb', round(os.path.getsize(OUT_GLB) / 1e6, 2), 'MB')
