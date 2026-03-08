import json

with open('DeckLayoutManager/vantage_20_deck.gltf') as f:
    gltf = json.load(f)

nodes = gltf['nodes']

# Build parent map
parent_map = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_map[c] = i

# For each cover node, walk up to root and print transform chain
cover_indices = []
for i, n in enumerate(nodes):
    if 'VANTAGE_DECK_COVER' in n.get('name', ''):
        cover_indices.append(i)
cover_indices.sort(key=lambda i: nodes[i]['name'])

for ci in cover_indices:
    print('--- %s (node %d) ---' % (nodes[ci]['name'], ci))
    current = ci
    chain = []
    while current is not None:
        n = nodes[current]
        t = n.get('translation')
        r = n.get('rotation')
        s = n.get('scale')
        m = n.get('matrix')
        info = 'Node %d (%s):' % (current, n.get('name', '?'))
        if t:
            info += ' T=%s' % t
        if r:
            info += ' R=%s' % r
        if s:
            info += ' S=%s' % s
        if m:
            info += ' M=%s' % str(m)
        if not t and not r and not s and not m:
            info += ' (identity)'
        chain.append(info)
        current = parent_map.get(current)
    for line in reversed(chain):
        print('  ' + line)

    # Also print children transforms
    node = nodes[ci]
    for c in node.get('children', []):
        cn = nodes[c]
        t = cn.get('translation')
        mesh_idx = cn.get('mesh')
        info = '  Child %d (%s):' % (c, cn.get('name', '?'))
        if t:
            info += ' T=%s' % t
        else:
            info += ' (identity)'
        if mesh_idx is not None:
            info += ' [mesh %d]' % mesh_idx
        print(info)
    print()
