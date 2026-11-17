# Render cenital plano de un material de Blender para sacar su textura (uso: ver materiales/LEEME.md)
import bpy, sys, math
out = sys.argv[sys.argv.index('--')+1]
matname = sys.argv[sys.argv.index('--')+2]
mat = bpy.data.materials[matname]
for n in mat.node_tree.nodes:
    if n.type=='GROUP':
        print("GROUP", n.node_tree.name, [(i.name, getattr(i,'default_value',None) if not hasattr(getattr(i,'default_value',None),'__len__') else tuple(i.default_value)) for i in n.inputs])
sc = bpy.data.scenes.new("Tex")
bpy.context.window.scene = sc
bpy.ops.mesh.primitive_plane_add(size=1)
p = bpy.context.active_object
p.scale = (2.0, 1.5, 1)
bpy.ops.object.transform_apply(scale=True)
p.data.materials.append(mat)
cam_data = bpy.data.cameras.new("C"); cam_data.type='ORTHO'; cam_data.ortho_scale = 2.0
cam = bpy.data.objects.new("C", cam_data); sc.collection.objects.link(cam)
cam.location = (0,0,3); cam.rotation_euler=(0,0,0); sc.camera = cam
w = bpy.data.worlds.new("W"); w.use_nodes=True
bg = w.node_tree.nodes.get('Background'); bg.inputs[0].default_value=(1,1,1,1); bg.inputs[1].default_value=1.0
sc.world = w
sc.render.engine='CYCLES'; sc.cycles.samples=48; sc.cycles.device='CPU'
sc.render.resolution_x=1600; sc.render.resolution_y=1200
sc.view_settings.view_transform='Standard'
sc.render.image_settings.file_format='PNG'
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("OK", out)
