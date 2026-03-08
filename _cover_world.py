import json, struct, base64
import numpy as np

with open('DeckLayoutManager/vantage_20_deck.gltf') as f:
    gltf = json.load(f)

nodes = gltf['nodes']
meshes = gltf['meshes']
accessors = gltf['accessors']
bufferViews = gltf['bufferViews']
buffers = gltf['buffers']

buf_uri = buffers[0]['uri']
if buf_uri.startswith('data:'):
    b64data = buf_uri.split(',')[1]
    raw = base64.b64decode(b64data)
else:
    with open('DeckLayoutManager/' + buf_uri, 'rb') as bf:
        raw = bf.read()

# Build parent map
parent_map = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_map[c] = i

def get_node_matrix(node):
    """Get the local transform matrix for a node."""
    if 'matrix' in node:
        m = node['matrix']
        # GLTF matrices are column-major
        return np.array(m, dtype=float).reshape(4, 4).T  # column-major to row-major
    mat = np.eye(4)
    if 'translation' in node:
        t = node['translation']
        mat[0, 3] = t[0]
        mat[1, 3] = t[1]
        mat[2, 3] = t[2]
    if 'scale' in node:
        s = node['scale']
        scale_mat = np.diag([s[0], s[1], s[2], 1.0])
        mat = mat @ scale_mat
    return mat

def get_world_matrix(node_idx):
    """Get the world transform matrix by walking up the parent chain."""
    chain = []
    current = node_idx
    while current is not None:
        chain.append(current)
        current = parent_map.get(current)
    # Apply from root down
    mat = np.eye(4)
    for idx in reversed(chain):
        mat = mat @ get_node_matrix(nodes[idx])
    return mat

def get_mesh_vertices(mesh_idx):
    """Get all vertex positions from a mesh."""
    mesh = meshes[mesh_idx]
    verts = []
    for prim in mesh['primitives']:
        pos_acc_idx = prim['attributes'].get('POSITION')
        if pos_acc_idx is None:
            continue
        acc = accessors[pos_acc_idx]
        bv = bufferViews[acc['bufferView']]
        offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
        count = acc['count']
        stride = bv.get('byteStride', 12)
        for i in range(count):
            pos = offset + i * stride
            x, y, z = struct.unpack_from('<fff', raw, pos)
            verts.append((x, y, z))
    return verts

def get_world_vertices(node_idx):
    """Get world-space vertices for a node and all children recursively."""
    world_verts = []
    mat = get_world_matrix(node_idx)
    node = nodes[node_idx]
    mesh_idx = node.get('mesh')
    if mesh_idx is not None:
        for v in get_mesh_vertices(mesh_idx):
            p = np.array([v[0], v[1], v[2], 1.0])
            wp = mat @ p
            world_verts.append((wp[0], wp[1], wp[2]))
    for c in node.get('children', []):
        world_verts.extend(get_world_vertices(c))
    return world_verts

# Compute overall bounding box in world space
print("=== Computing world-space bounding box ===")
all_world_verts = []
# Find root nodes (those without parents)
root_indices = set(range(len(nodes))) - set(parent_map.keys())
for ri in root_indices:
    all_world_verts.extend(get_world_vertices(ri))

if all_world_verts:
    xs = [v[0] for v in all_world_verts]
    ys = [v[1] for v in all_world_verts]
    zs = [v[2] for v in all_world_verts]
    print('World BBox X: [%.2f, %.2f] center=%.2f' % (min(xs), max(xs), (min(xs)+max(xs))/2))
    print('World BBox Y: [%.2f, %.2f] center=%.2f' % (min(ys), max(ys), (min(ys)+max(ys))/2))
    print('World BBox Z: [%.2f, %.2f] center=%.2f' % (min(zs), max(zs), (min(zs)+max(zs))/2))
    center_x = (min(xs) + max(xs)) / 2
    center_y = (min(ys) + max(ys)) / 2
    center_z = (min(zs) + max(zs)) / 2
    max_y = max(ys)
else:
    print("No vertices found!")
    exit()

# Three.js alignment
FIRST_TRACK_X = 100.25
TRACK_SPACING = 22.5
PHYSICAL_TRACKS = 54
SURFACE_Z = 100.0
TRACK_Y_START = 63.0
TRACK_DEPTH = 497.0

deckCenterX = FIRST_TRACK_X + (PHYSICAL_TRACKS * TRACK_SPACING) / 2.0
deckCenterZ = TRACK_Y_START + TRACK_DEPTH / 2.0

# Three.js: model.position.set(deckCenterX - center.x, SURFACE_Z - box.max.y, deckCenterZ - center.z)
# In GLTF/Three.js: X=right, Y=up, Z=forward
model_pos_x = deckCenterX - center_x
model_pos_y = SURFACE_Z - max_y
model_pos_z = deckCenterZ - center_z

print('\ndeckCenterX=%.2f, deckCenterZ=%.2f' % (deckCenterX, deckCenterZ))
print('model.position = (%.2f, %.2f, %.2f)' % (model_pos_x, model_pos_y, model_pos_z))

# Cover panel positions in final Three.js world space
print('\n=== Cover Panel Final Three.js World Positions ===')
cover_indices = []
for i, n in enumerate(nodes):
    if 'VANTAGE_DECK_COVER' in n.get('name', ''):
        cover_indices.append(i)
cover_indices.sort(key=lambda i: nodes[i]['name'])

for ci in cover_indices:
    cn = nodes[ci]
    wv = get_world_vertices(ci)
    if not wv:
        print('%s: no vertices' % cn['name'])
        continue
    wxs = [v[0] for v in wv]
    wys = [v[1] for v in wv]
    wzs = [v[2] for v in wv]
    
    # These are GLTF world coords. Three.js adds model.position offset
    final_min_x = model_pos_x + min(wxs)
    final_max_x = model_pos_x + max(wxs)
    final_center_x = model_pos_x + (min(wxs) + max(wxs)) / 2
    final_width = max(wxs) - min(wxs)
    
    # Track mapping
    track_min = (final_min_x - FIRST_TRACK_X) / TRACK_SPACING + 1
    track_max = (final_max_x - FIRST_TRACK_X) / TRACK_SPACING + 1
    track_center = (final_center_x - FIRST_TRACK_X) / TRACK_SPACING + 1
    
    print('%s:' % cn['name'])
    print('  GLTF world x: [%.2f, %.2f] width=%.2f' % (min(wxs), max(wxs), max(wxs)-min(wxs)))
    print('  Three.js x:   [%.2f, %.2f]' % (final_min_x, final_max_x))
    print('  tracks: %.1f to %.1f (center=%.1f), width=%.1fmm' % (track_min, track_max, track_center, final_width))
