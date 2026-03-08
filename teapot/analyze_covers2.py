import json

with open('/Users/zdmilot/X File Test in JS App/DeckLayoutManager/vantage_20_deck.gltf') as f:
    gltf = json.load(f)

# Check children of cover nodes
for i, node in enumerate(gltf.get('nodes', [])):
    name = node.get('name', '')
    if 'COVER' in name.upper():
        m = node.get('matrix', [])
        tx = m[12] if m and len(m) >= 16 else 0
        ty = m[13] if m and len(m) >= 16 else 0
        tz = m[14] if m and len(m) >= 16 else 0
        children = node.get('children', [])
        print(f'{name} (node {i}): translate=({tx:.2f}, {ty:.2f}, {tz:.2f}), children={children}')
        
        # Traverse children recursively
        def visit(nidx, depth=1):
            n = gltf['nodes'][nidx]
            nm = n.get('name', f'node_{nidx}')
            cm = n.get('matrix', [])
            ctrans = ''
            if cm and len(cm) >= 16:
                ctrans = f' translate=({cm[12]:.2f}, {cm[13]:.2f}, {cm[14]:.2f})'
            mesh_info = ''
            if 'mesh' in n:
                mesh_idx = n['mesh']
                mesh = gltf['meshes'][mesh_idx]
                for prim in mesh.get('primitives', []):
                    pos_acc_idx = prim.get('attributes', {}).get('POSITION')
                    if pos_acc_idx is not None:
                        acc = gltf['accessors'][pos_acc_idx]
                        mn = acc.get('min', [0,0,0])
                        mx = acc.get('max', [0,0,0])
                        mesh_info = f' MESH bounds: x=[{mn[0]:.1f},{mx[0]:.1f}] y=[{mn[1]:.1f},{mx[1]:.1f}] z=[{mn[2]:.1f},{mx[2]:.1f}] size={mx[0]-mn[0]:.1f}x{mx[1]-mn[1]:.1f}x{mx[2]-mn[2]:.1f}'
            print(f'  {"  "*depth}{nm}{ctrans}{mesh_info}')
            for c in n.get('children', []):
                visit(c, depth+1)
        
        for c in children:
            visit(c)
        print()
