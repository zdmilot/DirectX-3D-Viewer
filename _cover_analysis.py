import json, struct, base64

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

cover_nodes = sorted(
    [n for n in nodes if 'VANTAGE_DECK_COVER' in n.get('name', '')],
    key=lambda n: n['name']
)

def get_all_mesh_vertices(node_idx, depth=0):
    """Recursively collect all vertex positions from a node and its children."""
    node = nodes[node_idx]
    all_x = []
    mesh_idx = node.get('mesh')
    if mesh_idx is not None:
        mesh = meshes[mesh_idx]
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
                all_x.append(x)
    for child_idx in node.get('children', []):
        all_x.extend(get_all_mesh_vertices(child_idx, depth + 1))
    return all_x

print("=== Cover Panel Mesh Positions (recursive children) ===")
# Find cover node indices
cover_node_indices = []
for i, n in enumerate(nodes):
    if 'VANTAGE_DECK_COVER' in n.get('name', ''):
        cover_node_indices.append(i)
cover_node_indices.sort(key=lambda i: nodes[i]['name'])

for ni in cover_node_indices:
    cn = nodes[ni]
    xs = get_all_mesh_vertices(ni)
    if not xs:
        print(cn['name'] + ': no vertices found')
        continue
    min_x = min(xs)
    max_x = max(xs)
    center_x = (min_x + max_x) / 2.0
    width = max_x - min_x
    print('%s: x=[%.2f, %.2f] center=%.2f width=%.2f (%d verts)' % (
        cn['name'], min_x, max_x, center_x, width, len(xs)))

# Now compute the overall bounding box center the same way Three.js does
# Three.js Box3.setFromObject uses all mesh geometries
print("\n=== Computing overall bbox from ALL mesh vertices ===")
all_xs = []
all_ys = []
all_zs = []
for node in nodes:
    mesh_idx = node.get('mesh')
    if mesh_idx is None:
        continue
    mesh = meshes[mesh_idx]
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
            pos_off = offset + i * stride
            x, y, z = struct.unpack_from('<fff', raw, pos_off)
            all_xs.append(x)
            all_ys.append(y)
            all_zs.append(z)

min_x = min(all_xs)
max_x = max(all_xs)
min_y = min(all_ys)
max_y = max(all_ys)
min_z = min(all_zs)
max_z = max(all_zs)
center_x = (min_x + max_x) / 2.0
center_y = (min_y + max_y) / 2.0
center_z = (min_z + max_z) / 2.0

print('BBox X: [%.2f, %.2f] center=%.2f' % (min_x, max_x, center_x))
print('BBox Y: [%.2f, %.2f] center=%.2f' % (min_y, max_y, center_y))
print('BBox Z: [%.2f, %.2f] center=%.2f' % (min_z, max_z, center_z))

# Three.js alignment code:
# deckCenterX = FIRST_TRACK_X + (PHYSICAL_TRACKS * TRACK_SPACING) / 2
# model.position.x = deckCenterX - center.x
FIRST_TRACK_X = 100.25
TRACK_SPACING = 22.5
PHYSICAL_TRACKS = 54
SURFACE_Z = 100.0
TRACK_Y_START = 63.0
TRACK_DEPTH = 497.0

deckCenterX = FIRST_TRACK_X + (PHYSICAL_TRACKS * TRACK_SPACING) / 2.0
deckCenterZ = TRACK_Y_START + TRACK_DEPTH / 2.0

model_pos_x = deckCenterX - center_x
model_pos_y = SURFACE_Z - max_y
model_pos_z = deckCenterZ - center_z

print('\ndeckCenterX = %.2f' % deckCenterX)
print('model.position = (%.2f, %.2f, %.2f)' % (model_pos_x, model_pos_y, model_pos_z))

print('\n=== Cover Panel World Positions & Track Mapping ===')
for ni in cover_node_indices:
    cn = nodes[ni]
    xs = get_all_mesh_vertices(ni)
    if not xs:
        continue
    cov_min = min(xs)
    cov_max = max(xs)
    cov_center = (cov_min + cov_max) / 2.0
    cov_width = cov_max - cov_min

    world_min = model_pos_x + cov_min
    world_max = model_pos_x + cov_max
    world_center = model_pos_x + cov_center

    track_min = (world_min - FIRST_TRACK_X) / TRACK_SPACING + 1
    track_max = (world_max - FIRST_TRACK_X) / TRACK_SPACING + 1
    track_center = (world_center - FIRST_TRACK_X) / TRACK_SPACING + 1

    print('%s:' % cn['name'])
    print('  local x: [%.2f, %.2f] width=%.2f' % (cov_min, cov_max, cov_width))
    print('  world x: [%.2f, %.2f]' % (world_min, world_max))
    print('  tracks: %.1f to %.1f (center=%.1f)' % (track_min, track_max, track_center))
