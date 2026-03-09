import json, os

with open('DeckLayoutManager/vantage_20_deck.gltf', 'r') as f:
    gltf = json.load(f)

nodes = gltf.get('nodes', [])
meshes = gltf.get('meshes', [])
materials = gltf.get('materials', [])
accessors = gltf.get('accessors', [])

def get_bounds(acc_idx):
    acc = accessors[acc_idx]
    return acc.get('min'), acc.get('max'), acc.get('count', 0)

def find_leaf_meshes(idx):
    n = nodes[idx]
    results = []
    if 'mesh' in n:
        mesh = meshes[n['mesh']]
        for p in mesh.get('primitives', []):
            pos_acc = p['attributes']['POSITION']
            mn, mx, count = get_bounds(pos_acc)
            mat_idx = p.get('material', -1)
            mat_name = materials[mat_idx]['name'] if mat_idx >= 0 else 'none'
            results.append((idx, n.get('name','?'), mat_name, count, mn, mx))
    for ci in n.get('children', []):
        results.extend(find_leaf_meshes(ci))
    return results

print("=== Children of 99032-01 (node 20) ===")
for r in find_leaf_meshes(20):
    idx, name, mat, count, mn, mx = r
    print(f"  [{idx}] {name}  mat={mat}  verts={count}  X=[{mn[0]:.1f}, {mx[0]:.1f}]  Y=[{mn[1]:.1f}, {mx[1]:.1f}]  Z=[{mn[2]:.1f}, {mx[2]:.1f}]")

print()
print("=== Back Panel 6606544-01 (node 54) ===")
for r in find_leaf_meshes(54):
    idx, name, mat, count, mn, mx = r
    print(f"  [{idx}] {name}  mat={mat}  verts={count}  X=[{mn[0]:.1f}, {mx[0]:.1f}]  Y=[{mn[1]:.1f}, {mx[1]:.1f}]  Z=[{mn[2]:.1f}, {mx[2]:.1f}]")

print()
print("=== Deck Cover Panels ===")
for cover_idx in [28, 35, 43, 52]:
    meshes_list = find_leaf_meshes(cover_idx)
    if meshes_list:
        all_min = [min(r[4][j] for r in meshes_list) for j in range(3)]
        all_max = [max(r[5][j] for r in meshes_list) for j in range(3)]
        print(f"  {nodes[cover_idx]['name']}: X=[{all_min[0]:.1f}, {all_max[0]:.1f}]  Y=[{all_min[1]:.1f}, {all_max[1]:.1f}]  Z=[{all_min[2]:.1f}, {all_max[2]:.1f}]")

# Also identify the lighter-colored meshes inside 99032-01
# "Lighter" = high baseColor values
print()
print("=== Lighter meshes in 99032-01 (baseColor > 0.5) ===")
for r in find_leaf_meshes(20):
    idx, name, mat, count, mn, mx = r
    # Find the material's base color
    for mi, m in enumerate(materials):
        if m.get('name') == mat:
            pbr = m.get('pbrMetallicRoughness', {})
            bc = pbr.get('baseColorFactor', [0,0,0,1])
            brightness = (bc[0] + bc[1] + bc[2]) / 3
            if brightness > 0.5:
                print(f"  [{idx}] {name}  mat={mat}  brightness={brightness:.2f}  verts={count}  X=[{mn[0]:.1f}, {mx[0]:.1f}]  Y=[{mn[1]:.1f}, {mx[1]:.1f}]  Z=[{mn[2]:.1f}, {mx[2]:.1f}]")
            break
