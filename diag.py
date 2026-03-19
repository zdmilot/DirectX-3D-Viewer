import math

def mat_vec_mul(mat, vec):
    """4x4 matrix * 4-vector (row-major: vec @ mat)"""
    r = [0,0,0,0]
    for j in range(4):
        for k in range(4):
            r[j] += vec[k] * mat[k][j]
    return r

meshes = {
    "Cube": {
        "mat": [[-24.34, 0.000004, 0, 0],[-0.000002, -16.4, 0, 0],[0, 0, 2.24, 0],[0.16764, 9.058004, 5.6, 1]],
        "local_min": [-2.5, -2.5, -5.396],
        "local_max": [2.5, 2.5, 2.5]
    },
    "Cube_002": {
        "mat": [[-24.0, 0.000004, 0, 0],[-0.000002, -16.0, 0, 0],[0, 0, 0.2, 0],[0.16764, 9.058004, 0.5, 1]],
        "local_min": [-2.5, -2.5, -2.5],
        "local_max": [2.5, 2.5, 2.5]
    },
    "Cube_001": {
        "mat": [[-0.070711, 0.070711, 0, 0],[-1.697057, -1.697056, 0, 0],[0, 0, 1.8, 0],[56.287281, -27.271847, 6.644083, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    },
    "Cube_003": {
        "mat": [[-1.8, 0, 0, 0],[0, -1.8, 0, 0],[0, 0, 1.56, 0],[49.667633, -22.442001, -2.747981, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    },
    "Cube_004": {
        "mat": [[-0.070711, 0.070711, 0, 0],[-1.697057, -1.697056, 0, 0],[0, 0, 1.8, 0],[-55.584053, 45.129009, 6.644083, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    },
    "Cube_005": {
        "mat": [[-0.070711, -0.070711, 0, 0],[1.697056, -1.697056, 0, 0],[0, 0, 1.8, 0],[-55.584061, -26.842728, 6.644083, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    },
    "Cube_006": {
        "mat": [[-0.070711, -0.070711, 0, 0],[1.697056, -1.697056, 0, 0],[0, 0, 1.8, 0],[56.265503, 45.014565, 6.644083, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    },
    "Cylinder": {
        "mat": [[1.64, 0, 0, 0],[0, 1.64, 0, 0],[0, 0, 1.2047, 0],[-49.5, 40.5, -17.986897, 1]],
        "local_min": [-1, -1, -1],
        "local_max": [1, 1, 1]
    }
}

root = [[1, 0, 0, 0],[0, 0, 1, 0],[0, 1, 0, 0],[0, 0, 0, 1]]

def transform_bbox(lmin, lmax, mmat, rmat):
    mins = [1e9, 1e9, 1e9]
    maxs = [-1e9, -1e9, -1e9]
    for xi in range(2):
        for yi in range(2):
            for zi in range(2):
                x = lmin[0] if xi==0 else lmax[0]
                y = lmin[1] if yi==0 else lmax[1]
                z = lmin[2] if zi==0 else lmax[2]
                p = mat_vec_mul(mmat, [x, y, z, 1.0])
                p = mat_vec_mul(rmat, p)
                for a in range(3):
                    mins[a] = min(mins[a], p[a])
                    maxs[a] = max(maxs[a], p[a])
    return mins, maxs

print("=== World-Space Bounding Boxes ===\n")
world_boxes = {}
for name, data in meshes.items():
    wmin, wmax = transform_bbox(data["local_min"], data["local_max"], data["mat"], root)
    world_boxes[name] = (wmin, wmax)
    s = [wmax[i]-wmin[i] for i in range(3)]
    vol = s[0]*s[1]*s[2]
    print(f"{name:12s}  X:[{wmin[0]:8.2f}, {wmax[0]:8.2f}]  Y:[{wmin[1]:8.2f}, {wmax[1]:8.2f}]  Z:[{wmin[2]:8.2f}, {wmax[2]:8.2f}]  vol={vol:.1f}")

print("\n=== Overlapping Pairs ===\n")
names = list(world_boxes.keys())
for i in range(len(names)):
    for j in range(i+1, len(names)):
        a_min, a_max = world_boxes[names[i]]
        b_min, b_max = world_boxes[names[j]]
        overlap = True
        for ax in range(3):
            if a_min[ax] > b_max[ax] or b_min[ax] > a_max[ax]:
                overlap = False
                break
        if not overlap:
            continue
        o_size = [min(a_max[k], b_max[k]) - max(a_min[k], b_min[k]) for k in range(3)]
        a_contains_b = all(a_min[k] <= b_min[k] and a_max[k] >= b_max[k] for k in range(3))
        b_contains_a = all(b_min[k] <= a_min[k] and b_max[k] >= a_max[k] for k in range(3))
        cs = ""
        if a_contains_b: cs = f"  ** {names[i]} CONTAINS {names[j]} **"
        elif b_contains_a: cs = f"  ** {names[j]} CONTAINS {names[i]} **"
        else: cs = "  (overlap, NO containment)"
        print(f"{names[i]:12s} <-> {names[j]:12s}  overlap: X={o_size[0]:.2f} Y={o_size[1]:.2f} Z={o_size[2]:.2f}{cs}")
