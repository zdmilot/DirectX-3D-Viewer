import json, struct

with open('DeckLayoutManager/vantage_20_deck.gltf','r') as f:
    gltf = json.load(f)
with open('DeckLayoutManager/vantage_20_deck.bin','rb') as f:
    buf = f.read()

def get_accessor_data(acc_idx):
    acc = gltf['accessors'][acc_idx]
    bv = gltf['bufferViews'][acc['bufferView']]
    offset = bv.get('byteOffset',0) + acc.get('byteOffset',0)
    count = acc['count']
    ctype = acc['componentType']
    atype = acc['type']
    comps = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[atype]
    fmt = {5126:'f',5123:'H',5125:'I'}[ctype]
    sz = struct.calcsize(fmt)
    stride = bv.get('byteStride', sz*comps)
    result = []
    for i in range(count):
        vals = struct.unpack_from('<'+fmt*comps, buf, offset + i*stride)
        result.append(vals)
    return result

def mat4_mul_vec3(m, v):
    x,y,z = v
    w = m[3]*x + m[7]*y + m[11]*z + m[15]
    if w == 0: w = 1
    return ((m[0]*x+m[4]*y+m[8]*z+m[12])/w, (m[1]*x+m[5]*y+m[9]*z+m[13])/w, (m[2]*x+m[6]*y+m[10]*z+m[14])/w)

def mat4_identity():
    return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]

def mat4_from_trs(t=None,r=None,s=None):
    m = mat4_identity()
    if s: m[0],m[5],m[10] = s
    if r:
        qx,qy,qz,qw = r
        m2 = mat4_identity()
        m2[0]=1-2*(qy*qy+qz*qz); m2[1]=2*(qx*qy+qz*qw); m2[2]=2*(qx*qz-qy*qw)
        m2[4]=2*(qx*qy-qz*qw); m2[5]=1-2*(qx*qx+qz*qz); m2[6]=2*(qy*qz+qx*qw)
        m2[8]=2*(qx*qz+qy*qw); m2[9]=2*(qy*qz-qx*qw); m2[10]=1-2*(qx*qx+qy*qy)
        m = mat4_mul(m2, m)
    if t: m[12],m[13],m[14] = t
    return m

def mat4_mul(a, b):
    r = [0]*16
    for i in range(4):
        for j in range(4):
            for k in range(4):
                r[j*4+i] += a[k*4+i]*b[j*4+k]
    return r

nodes = gltf['nodes']
world_mats = [None]*len(nodes)

def compute_world(ni, parent_mat):
    n = nodes[ni]
    if 'matrix' in n:
        local = n['matrix']
    else:
        local = mat4_from_trs(n.get('translation'), n.get('rotation'), n.get('scale'))
    world = mat4_mul(parent_mat, local) if parent_mat else local
    world_mats[ni] = world
    for ci in n.get('children',[]): compute_world(ci, world)

scene = gltf['scenes'][gltf.get('scene',0)]
for root in scene['nodes']: compute_world(root, mat4_identity())

# Focus on node 11: the big white_plastic_torp (37440 verts) NOT inside VANTAGE_DECK_COVER
ni = 11
n = nodes[ni]
mesh = gltf['meshes'][n['mesh']]
wm = world_mats[ni]
prim = mesh['primitives'][0]
pos_data = get_accessor_data(prim['attributes']['POSITION'])

world_pts = [mat4_mul_vec3(wm, p) for p in pos_data]
xs = [p[0] for p in world_pts]
zs = [p[2] for p in world_pts]

print("Node 11 white_plastic_torp (main back-side mesh)")
print("  Verts: %d" % len(pos_data))
print("  X: [%.1f, %.1f]" % (min(xs), max(xs)))
print("  Z: [%.1f, %.1f]" % (min(zs), max(zs)))

# Detailed X histogram to find natural gaps
print("\n=== X HISTOGRAM (2mm bins) ===")
x_min, x_max = min(xs), max(xs)
bin_width = 10  # 10mm bins
num_bins = int((x_max - x_min) / bin_width) + 1
bins = [0] * num_bins
for x in xs:
    bi = min(num_bins-1, int((x - x_min) / bin_width))
    bins[bi] += 1

# Find gaps (empty runs)
print("Looking for X gaps (empty regions):")
in_gap = False
gap_start = None
for i, count in enumerate(bins):
    x_at = x_min + i * bin_width
    if count == 0:
        if not in_gap:
            gap_start = x_at
            in_gap = True
    else:
        if in_gap:
            gap_end = x_at
            if gap_end - gap_start > 15:  # significant gap > 15mm
                print("  GAP: X [%.1f, %.1f] (width %.1f mm)" % (gap_start, gap_end, gap_end - gap_start))
            in_gap = False

# Also check index buffer to find connected components via triangle adjacency
idx_attr = prim.get('indices')
if idx_attr is not None:
    idx_data = get_accessor_data(idx_attr)
    idx_flat = [i[0] for i in idx_data]
    
    # Build adjacency: which vertices connect to which
    from collections import defaultdict
    adj = defaultdict(set)
    for t in range(len(idx_flat)//3):
        i0, i1, i2 = idx_flat[t*3], idx_flat[t*3+1], idx_flat[t*3+2]
        adj[i0].update([i1,i2])
        adj[i1].update([i0,i2])
        adj[i2].update([i0,i1])
    
    # Find connected components via BFS
    visited = set()
    components = []
    for v in range(len(pos_data)):
        if v in visited: continue
        if v not in adj: continue
        comp = set()
        queue = [v]
        while queue:
            cur = queue.pop()
            if cur in visited: continue
            visited.add(cur)
            comp.add(cur)
            for nb in adj[cur]:
                if nb not in visited:
                    queue.append(nb)
        components.append(comp)
    
    print("\n=== CONNECTED COMPONENTS ===")
    print("Total components:", len(components))
    # Sort by min X
    comp_info = []
    for comp in components:
        comp_xs = [world_pts[v][0] for v in comp]
        comp_zs = [world_pts[v][2] for v in comp]
        comp_info.append({
            'verts': len(comp),
            'x_min': min(comp_xs), 'x_max': max(comp_xs),
            'z_min': min(comp_zs), 'z_max': max(comp_zs),
        })
    comp_info.sort(key=lambda c: c['x_min'])
    
    for i, c in enumerate(comp_info):
        print("  Component %d: %5d verts, X [%7.1f, %7.1f], Z [%7.1f, %7.1f], width=%.1f" % (
            i, c['verts'], c['x_min'], c['x_max'], c['z_min'], c['z_max'], c['x_max']-c['x_min']))

# Also check the per-cover white_plastic_torp meshes
print("\n=== PER-COVER white_plastic_torp meshes ===")
for ni2 in [27, 34, 42, 51]:
    n2 = nodes[ni2]
    wm2 = world_mats[ni2]
    mesh2 = gltf['meshes'][n2['mesh']]
    prim2 = mesh2['primitives'][0]
    pos2 = get_accessor_data(prim2['attributes']['POSITION'])
    wp2 = [mat4_mul_vec3(wm2, p) for p in pos2]
    x2 = [p[0] for p in wp2]
    z2 = [p[2] for p in wp2]
    # Find parent VANTAGE_DECK_COVER
    parent_name = ''
    for pni, pn in enumerate(nodes):
        if ni2 in pn.get('children', []):
            parent_name = pn.get('name','')
            break
    print("  Node %d (parent: %s): %d verts, X [%.1f, %.1f], Z [%.1f, %.1f]" % (
        ni2, parent_name, len(pos2), min(x2), max(x2), min(z2), max(z2)))
