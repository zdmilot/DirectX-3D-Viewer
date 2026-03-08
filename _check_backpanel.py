import json, struct
with open('DeckLayoutManager/vantage_20_deck.gltf', 'r') as f:
    data = json.load(f)

# Node 53 (Color #777777ff) mesh bounds
for node_idx in [53]:
    node = data['nodes'][node_idx]
    if 'mesh' not in node: continue
    mesh = data['meshes'][node['mesh']]
    for prim in mesh['primitives']:
        pos_acc_idx = prim['attributes']['POSITION']
        acc = data['accessors'][pos_acc_idx]
        mn = acc.get('min', 'N/A')
        mx = acc.get('max', 'N/A')
        print(f'Node {node_idx} ({node["name"]}): POS min={mn} max={mx}')

# Transform chain: Node 55 (VCOS_ASM_2PT0_ASM) -> Node 54 -> Node 53
for nidx in [54, 55]:
    node = data['nodes'][nidx]
    t = node.get('translation')
    s = node.get('scale')
    m = node.get('matrix')
    print(f'Node {nidx} ({node["name"]}): translation={t}, scale={s}, matrix={m}')

# Also check Node 20 (99032-01 main body) transform
node20 = data['nodes'][20]
print(f'Node 20 ({node20["name"]}): translation={node20.get("translation")}, scale={node20.get("scale")}, matrix={node20.get("matrix")}')
