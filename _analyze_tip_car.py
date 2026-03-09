#!/usr/bin/env python3
"""Analyze TIP_CAR_480_A00.hxx model for z-fighting diagnosis."""
import zlib, struct, re

with open('Base Hamilton Files/Labware/ML_STAR/TIP_CAR_480_A00.hxx', 'rb') as f:
    data = f.read()

# Gzip magic at offset 46, header is 10 bytes
compressed = data[46+10:]
decompressed = zlib.decompress(compressed, -zlib.MAX_WBITS)
text = decompressed.decode('utf-8', errors='replace')
print('Decompressed size:', len(decompressed))

# Count meshes and frames
meshes = re.findall(r'Mesh\s*\{', text)
frames = re.findall(r'Frame\s+(\w+)\s*\{', text)
print('Mesh blocks:', len(meshes))
print('Frame names:', frames[:30])
print()

# Vertex counts per mesh
mesh_starts = [m.start() for m in re.finditer(r'Mesh\s*\{', text)]
for i, ms in enumerate(mesh_starts[:15]):
    after = text[ms:ms+200]
    nums = re.findall(r'(\d+);', after)
    if nums:
        print('Mesh %d: ~%s vertices' % (i, nums[0]))
print()

# Material analysis
mat_sections = list(re.finditer(r'Material\s+(\w*)\s*\{([^}]{0,500})', text))
print('Material blocks:', len(mat_sections))
for mi, m in enumerate(mat_sections):
    name = m.group(1)
    inner = m.group(2).strip()
    color_match = re.match(r'([\d.]+)\s*;\s*([\d.]+)\s*;\s*([\d.]+)\s*;\s*([\d.]+)', inner)
    if color_match:
        r, g, b, a = [float(x) for x in color_match.groups()]
        is_blue = b > r * 1.5 and b > 0.1
        tag = ' <<< BLUE-DOMINANT' if is_blue else ''
        print('  Mat %d "%s": RGBA=(%.3f,%.3f,%.3f,%.3f)%s' % (mi, name, r, g, b, a, tag))

# Check for coplanar surfaces
print()
print('--- Checking for potential coplanar surfaces ---')
for i, ms in enumerate(mesh_starts[:15]):
    end = mesh_starts[i+1] if i+1 < len(mesh_starts) else ms + 50000
    mesh_text = text[ms:end]
    vert_match = re.match(r'Mesh\s*\{\s*(\d+)\s*;', mesh_text)
    if not vert_match:
        continue
    nv = int(vert_match.group(1))
    vert_section = mesh_text[vert_match.end():]
    verts = re.findall(r'([-\d.]+)\s*;\s*([-\d.]+)\s*;\s*([-\d.]+)\s*;', vert_section[:nv*80])
    if verts:
        yvals = sorted(set(round(float(v[1]), 2) for v in verts[:nv]))
        print('  Mesh %d: %d verts, unique Y planes=%s' % (i, nv, yvals[:15]))
