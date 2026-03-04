#!/usr/bin/env python3
"""Generate a simple teapot .x file for use as a default example model."""
import math

def make_teapot():
    """Create a teapot-like shape using surfaces of revolution + extras."""
    profile = [
        (0.0, 0.0), (0.8, 0.0), (1.2, 0.3), (1.5, 0.8),
        (1.4, 1.3), (1.2, 1.6), (0.9, 1.8), (0.7, 1.9),
        (0.8, 2.0), (0.0, 2.0),
    ]
    n_slices = 24
    verts = []
    faces = []

    # Body (surface of revolution)
    for r, y in profile:
        for j in range(n_slices):
            a = 2.0 * math.pi * j / n_slices
            verts.append((r * math.cos(a), y, r * math.sin(a)))

    n_rings = len(profile)
    for i in range(n_rings - 1):
        for j in range(n_slices):
            jn = (j + 1) % n_slices
            v0 = i * n_slices + j
            v1 = i * n_slices + jn
            v2 = (i + 1) * n_slices + jn
            v3 = (i + 1) * n_slices + j
            faces.append((v0, v1, v2, v3))

    # Spout
    sb = len(verts)
    ss = 8
    for i in range(4):
        t = i / 3.0
        cx = 1.5 + t * 0.8
        cy = 0.8 + t * 0.6
        r = 0.15 - t * 0.03
        for j in range(ss):
            a = 2.0 * math.pi * j / ss
            verts.append((cx + r * math.cos(a), cy, r * math.sin(a)))
    for i in range(3):
        for j in range(ss):
            jn = (j + 1) % ss
            faces.append((sb + i*ss + j, sb + i*ss + jn,
                          sb + (i+1)*ss + jn, sb + (i+1)*ss + j))

    # Handle (torus arc)
    hb = len(verts)
    ha, ht = 12, 6
    for i in range(ha):
        aa = math.pi * 0.3 + math.pi * 0.7 * i / (ha - 1)
        cx = -1.3 - 0.6 * math.cos(aa)
        cy = 1.0 + 0.6 * math.sin(aa)
        for j in range(ht):
            ta = 2.0 * math.pi * j / ht
            verts.append((
                cx + 0.08 * math.cos(ta) * math.cos(aa),
                cy + 0.08 * math.sin(ta),
                0.08 * math.cos(ta) * math.sin(aa)
            ))
    for i in range(ha - 1):
        for j in range(ht):
            jn = (j + 1) % ht
            faces.append((hb + i*ht + j, hb + i*ht + jn,
                          hb + (i+1)*ht + jn, hb + (i+1)*ht + j))

    # Lid dome
    lb = len(verts)
    lr, ls2 = 5, 16
    for i in range(lr + 1):
        phi = math.pi * 0.5 * i / lr
        r = 0.7 * math.cos(phi)
        y = 2.0 + 0.28 * math.sin(phi)
        for j in range(ls2):
            a = 2.0 * math.pi * j / ls2
            verts.append((r * math.cos(a), y, r * math.sin(a)))
    for i in range(lr):
        for j in range(ls2):
            jn = (j + 1) % ls2
            faces.append((lb + i*ls2 + j, lb + i*ls2 + jn,
                          lb + (i+1)*ls2 + jn, lb + (i+1)*ls2 + j))

    return verts, faces


def compute_normals(verts, faces):
    normals = [[0.0, 0.0, 0.0] for _ in range(len(verts))]
    for face in faces:
        v0, v1, v2 = verts[face[0]], verts[face[1]], verts[face[2]]
        e1 = (v1[0]-v0[0], v1[1]-v0[1], v1[2]-v0[2])
        e2 = (v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2])
        nx = e1[1]*e2[2] - e1[2]*e2[1]
        ny = e1[2]*e2[0] - e1[0]*e2[2]
        nz = e1[0]*e2[1] - e1[1]*e2[0]
        for idx in face:
            normals[idx][0] += nx
            normals[idx][1] += ny
            normals[idx][2] += nz
    for n in normals:
        length = math.sqrt(n[0]**2 + n[1]**2 + n[2]**2)
        if length > 0:
            n[0] /= length; n[1] /= length; n[2] /= length
    return normals


def write_x_file(filename, verts, faces, normals):
    with open(filename, 'w') as f:
        f.write('xof 0303txt 0032\n\n')
        f.write('Mesh Teapot {\n')
        f.write(f'  {len(verts)};\n')
        for i, (x, y, z) in enumerate(verts):
            sep = ',' if i < len(verts) - 1 else ';'
            f.write(f'  {x:.6f};{y:.6f};{z:.6f};{sep}\n')
        f.write(f'  {len(faces)};\n')
        for i, face in enumerate(faces):
            sep = ',' if i < len(faces) - 1 else ';'
            indices = ';'.join(str(idx) for idx in face)
            f.write(f'  {len(face)};{indices};{sep}\n')
        # Material
        f.write('  MeshMaterialList {\n')
        f.write('    1;\n')
        f.write(f'    {len(faces)};\n')
        for i in range(len(faces)):
            sep = ',' if i < len(faces) - 1 else ';'
            f.write(f'    0{sep}\n')
        f.write('    Material {\n')
        f.write('      0.800000;0.750000;0.650000;1.000000;;\n')
        f.write('      30.000000;\n')
        f.write('      0.400000;0.400000;0.400000;;\n')
        f.write('      0.050000;0.040000;0.030000;;\n')
        f.write('    }\n')
        f.write('  }\n')
        # Normals
        f.write('  MeshNormals {\n')
        f.write(f'    {len(normals)};\n')
        for i, n in enumerate(normals):
            sep = ',' if i < len(normals) - 1 else ';'
            f.write(f'    {n[0]:.6f};{n[1]:.6f};{n[2]:.6f};{sep}\n')
        f.write(f'    {len(faces)};\n')
        for i, face in enumerate(faces):
            sep = ',' if i < len(faces) - 1 else ';'
            indices = ';'.join(str(idx) for idx in face)
            f.write(f'    {len(face)};{indices};{sep}\n')
        f.write('  }\n')
        f.write('}\n')


if __name__ == '__main__':
    verts, faces = make_teapot()
    normals = compute_normals(verts, faces)
    write_x_file('teapot_simple.x', verts, faces, normals)
    print(f'Created teapot_simple.x: {len(verts)} verts, {len(faces)} faces')
