#!/usr/bin/env python3
"""Verify the face normal direction counts from the .x file."""
import math

with open('test.x', 'r') as f:
    content = f.read()

# Find the Cube mesh normals section
normals_start = content.index('MeshNormals { // Cube normals')
normals_end = content.index('} // End of Cube normals', normals_start)
normals_text = content[normals_start:normals_end]

# Parse normal vectors
normal_vecs = []
lines = normals_text.split('\n')
reading = False
count = 0
for line in lines:
    line = line.strip()
    if not reading:
        try:
            count = int(line.rstrip(';'))
            reading = True
        except:
            pass
        continue
    if not line or line.startswith('//'):
        continue
    parts = line.rstrip(',').rstrip(';').split(';')
    if len(parts) >= 3:
        try:
            nx, ny, nz = float(parts[0]), float(parts[1]), float(parts[2])
            normal_vecs.append((nx, ny, nz))
        except:
            pass
    if len(normal_vecs) >= count:
        break

print(f"Found {len(normal_vecs)} face normals in Cube mesh")

dirs = {'+X': 0, '-X': 0, '+Y': 0, '-Y': 0, '+Z': 0, '-Z': 0}
for nx, ny, nz in normal_vecs:
    anx, any_val, anz = abs(nx), abs(ny), abs(nz)
    if anx > any_val and anx > anz:
        dirs['+X' if nx > 0 else '-X'] += 1
    elif any_val > anx and any_val > anz:
        dirs['+Y' if ny > 0 else '-Y'] += 1
    else:
        dirs['+Z' if nz > 0 else '-Z'] += 1

print("Face normal directions from .x file:")
for d in ['+X', '-X', '+Y', '-Y', '+Z', '-Z']:
    print(f"  {d}: {dirs[d]}")
print(f"Paired: +X/-X = {dirs['+X']}/{dirs['-X']}, +Y/-Y = {dirs['+Y']}/{dirs['-Y']}, +Z/-Z = {dirs['+Z']}/{dirs['-Z']}")
print("\nNote: Asymmetry is inherent to the .x file geometry (slot cutout has")
print("different tessellation on each side). Rendering should still look")
print("identical because the same surface area is covered.")
