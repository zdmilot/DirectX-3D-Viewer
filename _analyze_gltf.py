import json, struct
import numpy as np

with open('DeckLayoutManager/vantage_20_deck.gltf', 'rb') as f:
    data = f.read()

if data[:4] == b'glTF':
    json_len = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20+json_len])
    bin_offset = 20 + json_len
    while bin_offset % 4:
        bin_offset += 1
    bin_offset += 8
    bin_data = data[bin_offset:]
else:
    gltf = json.loads(data)
    # Load external .bin if present
    import os
    base_dir = 'DeckLayoutManager'
    buffers = gltf.get('buffers', [])
    bin_data = b''
    if buffers and 'uri' in buffers[0]:
        bin_path = os.path.join(base_dir, buffers[0]['uri'])
        with open(bin_path, 'rb') as bf:
            bin_data = bf.read()
    elif buffers:
        bin_data = b'\x00' * buffers[0].get('byteLength', 0)

nodes = gltf['nodes']
accessors = gltf['accessors']
buffer_views = gltf['bufferViews']

def get_matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix']).reshape(4, 4).T
    m = np.eye(4)
    if 'scale' in node:
        s = node['scale']
        m[0,0], m[1,1], m[2,2] = s
    if 'translation' in node:
        t = node['translation']
        m[:3, 3] = t
    return m

def get_world_matrix(idx, cache={}):
    if idx in cache:
        return cache[idx]
    # find parent
    parent_idx = None
    for i, n in enumerate(nodes):
        if idx in n.get('children', []):
            parent_idx = i
            break
    local = get_matrix(nodes[idx])
    if parent_idx is not None:
        world = get_world_matrix(parent_idx, cache) @ local
    else:
        world = local
    cache[idx] = world
    return world

def get_accessor_data(acc_idx):
    acc = accessors[acc_idx]
    bv = buffer_views[acc['bufferView']]
    offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
    count = acc['count']
    ct = acc['componentType']
    dtype = {5126: np.float32, 5123: np.uint16, 5125: np.uint32}[ct]
    tp = acc['type']
    components = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[tp]
    stride = bv.get('byteStride', 0)
    if stride == 0:
        arr = np.frombuffer(bin_data, dtype=dtype, count=count * components, offset=offset)
        return arr.reshape(count, components)
    else:
        result = []
        for i in range(count):
            o = offset + i * stride
            result.append(np.frombuffer(bin_data, dtype=dtype, count=components, offset=o))
        return np.array(result)

def get_node_world_bbox(idx):
    """Get world bounding box of a node and all descendants."""
    all_pts = []
    stack = [idx]
    while stack:
        ni = stack.pop()
        n = nodes[ni]
        if 'mesh' in n:
            mesh = gltf['meshes'][n['mesh']]
            wm = get_world_matrix(ni)
            for prim in mesh['primitives']:
                pos_acc = prim['attributes']['POSITION']
                pts = get_accessor_data(pos_acc)
                # transform to world
                ones = np.ones((pts.shape[0], 1))
                pts4 = np.hstack([pts, ones])
                world_pts = (wm @ pts4.T).T[:, :3]
                all_pts.append(world_pts)
        for c in n.get('children', []):
            stack.append(c)
    if not all_pts:
        return None
    all_pts = np.vstack(all_pts)
    return all_pts.min(axis=0), all_pts.max(axis=0)

# Show bounding boxes for children of VCOS_ASM_2PT0_ASM (idx=55)
parent = nodes[55]
print("Children of VCOS_ASM_2PT0_ASM:")
for ci in parent.get('children', []):
    name = nodes[ci].get('name', '?')
    bb = get_node_world_bbox(ci)
    if bb:
        mn, mx = bb
        print(f"  {name} (idx={ci}): bbox min=({mn[0]:.1f}, {mn[1]:.1f}, {mn[2]:.1f}), max=({mx[0]:.1f}, {mx[1]:.1f}, {mx[2]:.1f})")
        print(f"    size=({mx[0]-mn[0]:.1f}, {mx[1]-mn[1]:.1f}, {mx[2]-mn[2]:.1f})")
    else:
        print(f"  {name} (idx={ci}): no mesh data")

# Also show children of main deck body 99032-01
print("\nChildren of 99032-01 (main deck body):")
deck_body = nodes[20]
for ci in deck_body.get('children', []):
    name = nodes[ci].get('name', '?')
    bb = get_node_world_bbox(ci)
    if bb:
        mn, mx = bb
        print(f"  {name} (idx={ci}): bbox min=({mn[0]:.1f}, {mn[1]:.1f}, {mn[2]:.1f}), max=({mx[0]:.1f}, {mx[1]:.1f}, {mx[2]:.1f})")
        print(f"    size=({mx[0]-mn[0]:.1f}, {mx[1]-mn[1]:.1f}, {mx[2]-mn[2]:.1f})")
