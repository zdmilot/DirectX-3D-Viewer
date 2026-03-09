import json, struct

with open('DeckLayoutManager/vantage_20_deck.gltf','r') as f:
    gltf = json.load(f)

nodes = gltf['nodes']
meshes = gltf['meshes']
materials = gltf['materials']

# Print full node hierarchy with parent-child relationships
def print_tree(ni, depth=0):
    n = nodes[ni]
    name = n.get('name','(unnamed)')
    info = ''
    if 'mesh' in n:
        mi = n['mesh']
        m = meshes[mi]
        prims = m['primitives']
        for pi, p in enumerate(prims):
            mat_idx = p.get('material')
            mat_name = materials[mat_idx]['name'] if mat_idx is not None else 'none'
            vert_count = gltf['accessors'][p['attributes']['POSITION']]['count']
            info += '  [mesh %d, prim %d: mat="%s", verts=%d]' % (mi, pi, mat_name, vert_count)
    print('%s Node %d: "%s"%s' % ('  '*depth, ni, name, info))
    for ci in n.get('children', []):
        print_tree(ci, depth+1)

scene = gltf['scenes'][gltf.get('scene',0)]
print("=== FULL NODE TREE ===")
for root in scene['nodes']:
    print_tree(root)

# Check how Three.js names meshes - for nodes with single primitive, 
# the node becomes a Mesh and gets the node's name.
# For multi-primitive, it becomes a Group with Mesh children named differently.
print("\n=== NODES WITH NAME 'Color #959595ff' ===")
for ni, n in enumerate(nodes):
    if n.get('name') == 'Color #959595ff':
        mi = n.get('mesh')
        if mi is not None:
            m = meshes[mi]
            print("  Node %d: mesh %d, %d primitive(s)" % (ni, mi, len(m['primitives'])))
            parent = None
            for pi2, n2 in enumerate(nodes):
                if ni in n2.get('children', []):
                    parent = pi2
                    break
            if parent is not None:
                print("    Parent: Node %d \"%s\"" % (parent, nodes[parent].get('name','')))

# Also check VANTAGE_DECK_COVER nodes
print("\n=== VANTAGE_DECK_COVER NODES ===")
for ni, n in enumerate(nodes):
    name = n.get('name','')
    if 'VANTAGE_DECK_COVER' in name:
        children = n.get('children', [])
        print("  Node %d: \"%s\", children: %s" % (ni, name, children))
        for ci in children:
            cn = nodes[ci]
            print("    Child Node %d: \"%s\", has_mesh=%s" % (ci, cn.get('name',''), 'mesh' in cn))
