import json

with open('/Users/zdmilot/X File Test in JS App/DeckLayoutManager/vantage_20_deck.gltf') as f:
    gltf = json.load(f)

# Find all nodes to understand the model's overall structure
print("=== COVER PANELS ===")
for i, node in enumerate(gltf.get('nodes', [])):
    name = node.get('name', '')
    if 'COVER' in name.upper():
        m = node.get('matrix', [])
        if m and len(m) >= 16:
            print(f'{name} (node {i}):')
            print(f'  Translation: ({m[12]:.2f}, {m[13]:.2f}, {m[14]:.2f})')
        if 'mesh' in node:
            mesh_idx = node['mesh']
            mesh = gltf['meshes'][mesh_idx]
            for prim in mesh.get('primitives', []):
                pos_acc_idx = prim.get('attributes', {}).get('POSITION')
                if pos_acc_idx is not None:
                    acc = gltf['accessors'][pos_acc_idx]
                    mn = acc.get('min', [0,0,0])
                    mx = acc.get('max', [0,0,0])
                    # World-space bounds = local bounds + translation
                    print(f'  Local bounds: x=[{mn[0]:.1f},{mx[0]:.1f}] y=[{mn[1]:.1f},{mx[1]:.1f}] z=[{mn[2]:.1f},{mx[2]:.1f}]')
                    print(f'  Local size: {mx[0]-mn[0]:.1f} x {mx[1]-mn[1]:.1f} x {mx[2]-mn[2]:.1f}')
                    wx_min = mn[0] + m[12]
                    wx_max = mx[0] + m[12]
                    wy_min = mn[1] + m[13]
                    wy_max = mx[1] + m[13]
                    wz_min = mn[2] + m[14]
                    wz_max = mx[2] + m[14]
                    print(f'  World bounds: x=[{wx_min:.1f},{wx_max:.1f}] y=[{wy_min:.1f},{wy_max:.1f}] z=[{wz_min:.1f},{wz_max:.1f}]')

print("\n=== OVERALL MODEL BOUNDS ===")
# Find the root/scene and compute rough total bounds
all_x = []
all_y = []
all_z = []
for i, node in enumerate(gltf.get('nodes', [])):
    m = node.get('matrix', [])
    if m and len(m) >= 16 and 'mesh' in node:
        mesh_idx = node['mesh']
        mesh = gltf['meshes'][mesh_idx]
        for prim in mesh.get('primitives', []):
            pos_acc_idx = prim.get('attributes', {}).get('POSITION')
            if pos_acc_idx is not None:
                acc = gltf['accessors'][pos_acc_idx]
                mn = acc.get('min', [0,0,0])
                mx = acc.get('max', [0,0,0])
                all_x.extend([mn[0]+m[12], mx[0]+m[12]])
                all_y.extend([mn[1]+m[13], mx[1]+m[13]])
                all_z.extend([mn[2]+m[14], mx[2]+m[14]])
if all_x:
    print(f'  X range: [{min(all_x):.1f}, {max(all_x):.1f}] (width={max(all_x)-min(all_x):.1f})')
    print(f'  Y range: [{min(all_y):.1f}, {max(all_y):.1f}] (height={max(all_y)-min(all_y):.1f})')
    print(f'  Z range: [{min(all_z):.1f}, {max(all_z):.1f}] (depth={max(all_z)-min(all_z):.1f})')
