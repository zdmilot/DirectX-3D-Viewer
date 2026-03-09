import json, struct
import numpy as np

with open('/Users/zdmilot/X File Test in JS App/DeckLayoutManager/vantage_20_deck.gltf') as f:
    g = json.load(f)

bufUri = g['buffers'][0]['uri']
with open('/Users/zdmilot/X File Test in JS App/DeckLayoutManager/' + bufUri, 'rb') as bf:
    buf = bf.read()

def mat4_from_gltf(m):
    """GLTF stores 16 floats column-major -> 4x4 numpy"""
    return np.array(m, dtype=np.float64).reshape(4,4,order='F')

def get_node_local_matrix(node):
    if 'matrix' in node:
        return mat4_from_gltf(node['matrix'])
    return np.eye(4)

def get_world_matrix(node_idx, parent_map, nodes):
    chain = []
    idx = node_idx
    while idx is not None:
        chain.append(idx)
        idx = parent_map.get(idx)
    chain.reverse()
    M = np.eye(4)
    for ni in chain:
        M = M @ get_node_local_matrix(nodes[ni])
    return M

# Build parent map
nodes = g['nodes']
parent_map = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_map[c] = i

def get_positions(acc_idx):
    acc = g['accessors'][acc_idx]
    bv = g['bufferViews'][acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    pos = np.zeros((count, 3), dtype=np.float32)
    for i in range(count):
        off = offset + i * 12
        pos[i] = struct.unpack_from('fff', buf, off)
    return pos

def get_all_mesh_nodes(node_idx, depth=0):
    node = nodes[node_idx]
    results = []
    if 'mesh' in node:
        results.append((node_idx, node.get('name','?'), node['mesh'], depth))
    for c in node.get('children', []):
        results.extend(get_all_mesh_nodes(c, depth+1))
    return results

print("=== World-space bounding boxes for all meshes ===\n")

# Start from node 55 root
for idx, name, mesh_idx, d in get_all_mesh_nodes(55):
    mesh = g['meshes'][mesh_idx]
    prim = mesh['primitives'][0]
    local_pos = get_positions(prim['attributes']['POSITION'])
    mat_idx = prim.get('material', -1)
    mat_name = g['materials'][mat_idx]['name'] if mat_idx >= 0 else 'none'
    
    # Add homogeneous coordinate
    ones = np.ones((len(local_pos), 1), dtype=np.float32)
    pts4 = np.hstack([local_pos, ones])  # Nx4
    
    # Get world matrix
    wm = get_world_matrix(idx, parent_map, nodes)
    
    # Transform: world = pts4 @ wm.T
    world_pts = (wm @ pts4.T).T[:, :3]
    
    # Find parent group name
    p = parent_map.get(idx)
    p2 = parent_map.get(p) if p else None
    parent_name = nodes[p]['name'] if p else '-'
    grandparent_name = nodes[p2]['name'] if p2 else '-'
    
    print(f'[{idx}] "{name}" (mesh {mesh_idx}, mat: {mat_name}, verts: {len(local_pos)})')
    print(f'  parent: [{p}] {parent_name}, grandparent: [{p2}] {grandparent_name}')
    print(f'  World X: [{world_pts[:,0].min():.1f}, {world_pts[:,0].max():.1f}]')
    print(f'  World Y: [{world_pts[:,1].min():.1f}, {world_pts[:,1].max():.1f}]')
    print(f'  World Z: [{world_pts[:,2].min():.1f}, {world_pts[:,2].max():.1f}]')
    print()
