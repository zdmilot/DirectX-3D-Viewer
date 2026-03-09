#!/usr/bin/env python3
"""Deep analysis of TIP_CAR_480 for z-fighting."""
import zlib, re, struct
from collections import defaultdict

with open('Base Hamilton Files/Labware/ML_STAR/TIP_CAR_480_A00.hxx', 'rb') as f:
    data = f.read()

compressed = data[46+10:]
decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)
text = decompressed.decode('utf-8', errors='replace')

# Find the mesh and analyze its vertices
mesh_match = re.search(r'Mesh\s*\{\s*(\d+)\s*;', text)
if mesh_match:
    nv = int(mesh_match.group(1))
    print('Total vertices:', nv)
    vert_section = text[mesh_match.end():]
    verts = re.findall(r'([-\d.]+)\s*;\s*([-\d.]+)\s*;\s*([-\d.]+)\s*;', vert_section[:nv*80])
    
    # Build Y-plane histogram to find coplanar surfaces
    y_planes = defaultdict(int)
    for v in verts[:nv]:
        y = round(float(v[1]), 1)
        y_planes[y] += 1
    
    print('\nY-plane histogram (verts per plane):')
    for y in sorted(y_planes.keys()):
        bar = '#' * min(y_planes[y], 80)
        print('  Y=%7.1f: %4d verts %s' % (y, y_planes[y], bar))

# Find MeshMaterialList to see how faces map to materials
matlist_match = re.search(r'MeshMaterialList\s*\{\s*(\d+)\s*;\s*(\d+)\s*;', text)
if matlist_match:
    nmat = int(matlist_match.group(1))
    nfaces = int(matlist_match.group(2))
    print('\nMeshMaterialList: %d materials, %d faces' % (nmat, nfaces))
    
    # Read face-to-material assignments
    after = text[matlist_match.end():]
    assignments = re.findall(r'(\d+)', after[:nfaces*5])
    mat_face_count = defaultdict(int)
    for a in assignments[:nfaces]:
        mat_face_count[int(a)] += 1
    for mi in sorted(mat_face_count.keys()):
        print('  Material %d: %d faces' % (mi, mat_face_count[mi]))

# Print first few hundred chars of the frame structure
print('\n--- Frame hierarchy (first 2000 chars) ---')
print(text[:2000])
