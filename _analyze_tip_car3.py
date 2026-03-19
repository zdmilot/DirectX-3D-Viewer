#!/usr/bin/env python3
"""Deep analysis of TIP_CAR_480 for z-fighting."""
import zlib, re, struct
from collections import defaultdict

with open('Base Hamilton Files/Labware/ML_STAR/TIP_CAR_480_A00.hxx', 'rb') as f:
    data = f.read()

compressed = data[46+10:]
decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)
text = decompressed.decode('utf-8', errors='replace')

# Skip template definitions - find actual Frame data
# Templates end before the first "Frame V_Model" or actual frame 
frame_start = text.find('Frame V_Model')
if frame_start < 0:
    frame_start = text.find('Frame ')
print('Actual frame data starts at char', frame_start)

model_text = text[frame_start:]

# Count meshes in model data only
mesh_blocks = list(re.finditer(r'Mesh\s*\{', model_text))
print('Mesh blocks in model:', len(mesh_blocks))

# Count frames
frames = re.findall(r'Frame\s+(\w+)\s*\{', model_text)
print('Frames:', len(frames))
print('Frame names:', frames[:20])

# For each mesh, get vertex count and Y-plane distribution
for i, mb in enumerate(mesh_blocks[:20]):
    after = model_text[mb.start():mb.start()+500]
    vert_match = re.match(r'Mesh\s*\{\s*(\d+)\s*;', after)
    if not vert_match:
        continue
    nv = int(vert_match.group(1))
    
    # Get all vertices
    big_after = model_text[mb.start()+vert_match.end()-mb.start():]
    verts = re.findall(r'([-\d.]+)\s*;\s*([-\d.]+)\s*;\s*([-\d.]+)\s*;', big_after[:nv*80])
    
    # Y-plane histogram
    y_planes = defaultdict(int)
    for v in verts[:nv]:
        y = round(float(v[1]), 1)
        y_planes[y] += 1
    
    # Get material info for this mesh
    mesh_end = mesh_blocks[i+1].start() if i+1 < len(mesh_blocks) else mb.start()+100000
    mesh_section = model_text[mb.start():mb.start()+mesh_end]
    mat_match = re.search(r'MeshMaterialList\s*\{\s*(\d+)\s*;\s*(\d+)\s*;', mesh_section)
    nmat_str = ''
    if mat_match:
        nmat_str = ', %s materials' % mat_match.group(1)
    
    # Get the parent frame name
    # Look backward from mesh position for the nearest Frame
    before = model_text[:mb.start()]
    frame_match = list(re.finditer(r'Frame\s+(\w+)\s*\{', before))
    parent = frame_match[-1].group(1) if frame_match else '?'
    
    print('\nMesh %d (in Frame %s): %d vertices%s' % (i, parent, nv, nmat_str))
    for y in sorted(y_planes.keys()):
        print('  Y=%7.1f: %4d verts' % (y, y_planes[y]))

# Find any materials with blue color
print('\n--- Material colors in model data ---')
mat_sections = list(re.finditer(r'Material\s+(\w*)\s*\{', model_text))
for mi, m in enumerate(mat_sections):
    after = model_text[m.end():m.end()+200]
    color_match = re.match(r'\s*([\d.]+)\s*;\s*([\d.]+)\s*;\s*([\d.]+)\s*;\s*([\d.]+)', after)
    if color_match:
        r, g, b, a = [float(x) for x in color_match.groups()]
        is_blue = b > r * 1.5 and b > 0.1
        tag = ' <<< BLUE' if is_blue else ''
        print('  Mat %d "%s": RGBA=(%.3f,%.3f,%.3f,%.3f)%s' % (mi, m.group(1), r, g, b, a, tag))
