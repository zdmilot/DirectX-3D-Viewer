import json, sys
with open('/Users/zdmilot/X File Test in JS App/DeckLayoutManager/vantage_20_deck.gltf') as f:
    gltf = json.load(f)
for i, node in enumerate(gltf.get('nodes', [])):
    name = node.get('name', '')
    if 'COVER' in name.upper():
        m = node.get('matrix', [])
        if m and len(m) >= 16:
            print(f'{name}: tx={m[12]:.2f}, ty={m[13]:.2f}, tz={m[14]:.2f}')
        if 'mesh' in node:
            mesh_idx = node['mesh']
            mesh = gltf['meshes'][mesh_idx]
            for prim in mesh.get('primitives', []):
                pos_acc_idx = prim.get('attributes', {}).get('POSITION')
                if pos_acc_idx is not None:
                    acc = gltf['accessors'][pos_acc_idx]
                    mn = acc.get('min')
                    mx = acc.get('max')
                    if mn and mx:
                        print(f'  bounds: x=[{mn[0]:.1f},{mx[0]:.1f}] y=[{mn[1]:.1f},{mx[1]:.1f}] z=[{mn[2]:.1f},{mx[2]:.1f}]')
                        print(f'  size: {mx[0]-mn[0]:.1f} x {mx[1]-mn[1]:.1f} x {mx[2]-mn[2]:.1f}')
