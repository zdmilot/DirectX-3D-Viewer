import json, struct

with open('DeckLayoutManager/vantage_20_deck.gltf') as f:
    g = json.load(f)

bufUri = g['buffers'][0]['uri']
with open('DeckLayoutManager/' + bufUri, 'rb') as bf:
    buf = bf.read()

def get_positions(acc_idx):
    acc = g['accessors'][acc_idx]
    bv = g['bufferViews'][acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    positions = []
    for i in range(count):
        x = struct.unpack_from('f', buf, offset + i*12)[0]
        y = struct.unpack_from('f', buf, offset + i*12 + 4)[0]
        z = struct.unpack_from('f', buf, offset + i*12 + 8)[0]
        positions.append((x, y, z))
    return positions

def get_all_mesh_nodes(node_idx, depth=0):
    node = g['nodes'][node_idx]
    results = []
    if 'mesh' in node:
        results.append((node_idx, node.get('name','?'), node['mesh'], depth))
    for c in node.get('children', []):
        results.extend(get_all_mesh_nodes(c, depth+1))
    return results

print('=== Node 20 (99032-01) mesh children ===')
for idx, name, mesh_idx, d in get_all_mesh_nodes(20):
    mesh = g['meshes'][mesh_idx]
    prim = mesh['primitives'][0]
    pos = get_positions(prim['attributes']['POSITION'])
    mat_idx = prim.get('material', -1)
    mat_name = g['materials'][mat_idx]['name'] if mat_idx >= 0 else 'none'
    xs = [p[0] for p in pos]
    ys = [p[1] for p in pos]
    zs = [p[2] for p in pos]
    print(f'  [{idx}] {name} (mesh {mesh_idx}, mat: {mat_name}, verts: {len(pos)})')
    print(f'       X: [{min(xs):.1f}, {max(xs):.1f}]  Y: [{min(ys):.1f}, {max(ys):.1f}]  Z: [{min(zs):.1f}, {max(zs):.1f}]')

print()
print('=== Node 54 (6606544-01 back panel) ===')
for idx, name, mesh_idx, d in get_all_mesh_nodes(54):
    mesh = g['meshes'][mesh_idx]
    prim = mesh['primitives'][0]
    pos = get_positions(prim['attributes']['POSITION'])
    mat_idx = prim.get('material', -1)
    mat_name = g['materials'][mat_idx]['name'] if mat_idx >= 0 else 'none'
    xs = [p[0] for p in pos]
    ys = [p[1] for p in pos]
    zs = [p[2] for p in pos]
    print(f'  [{idx}] {name} (mesh {mesh_idx}, mat: {mat_name}, verts: {len(pos)})')
    print(f'       X: [{min(xs):.1f}, {max(xs):.1f}]  Y: [{min(ys):.1f}, {max(ys):.1f}]  Z: [{min(zs):.1f}, {max(zs):.1f}]')

print()
print('=== VANTAGE_DECK_COVER nodes ===')
for cover_idx in [28, 35, 43, 52]:
    for idx, name, mesh_idx, d in get_all_mesh_nodes(cover_idx):
        mesh = g['meshes'][mesh_idx]
        prim = mesh['primitives'][0]
        pos = get_positions(prim['attributes']['POSITION'])
        mat_idx = prim.get('material', -1)
        mat_name = g['materials'][mat_idx]['name'] if mat_idx >= 0 else 'none'
        xs = [p[0] for p in pos]
        ys = [p[1] for p in pos]
        zs = [p[2] for p in pos]
        print(f'  [{idx}] {name} @ cover {cover_idx} (mesh {mesh_idx}, mat: {mat_name}, verts: {len(pos)})')
        print(f'       X: [{min(xs):.1f}, {max(xs):.1f}]  Y: [{min(ys):.1f}, {max(ys):.1f}]  Z: [{min(zs):.1f}, {max(zs):.1f}]')
