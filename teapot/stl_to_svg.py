#!/usr/bin/env python3
"""
stl_to_svg.py  –  Extract a crisp side-view (XZ) silhouette from the Utah teapot
STL, with:
  - Vertical flip so lid is on top
  - Handle-hole cutout via evenodd fill
  - Wireframe lines clipped to avoid crossing the spout gap

Usage:  python3 teapot/stl_to_svg.py
"""

import struct, math, os
import numpy as np
from collections import deque

# ── 1. Parse binary STL ─────────────────────────────────────────────
def read_stl_binary(path):
    triangles = []
    with open(path, 'rb') as f:
        f.read(80)  # header
        num_tri = struct.unpack('<I', f.read(4))[0]
        for _ in range(num_tri):
            data = struct.unpack('<12fH', f.read(50))
            triangles.append((data[3:6], data[6:9], data[9:12]))
    return triangles

# ── 2. Rasterise side-view silhouette (XZ projection, Y=depth) ─────
def silhouette_bitmap(triangles, res=1024, flip_v=True):
    pts = [(v[0], v[2]) for tri in triangles for v in tri]
    xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
    xmin, xmax = min(xs), max(xs); zmin, zmax = min(zs), max(zs)
    span = max(xmax - xmin, zmax - zmin) * 1.08
    cx, cz = (xmin+xmax)/2, (zmin+zmax)/2
    x0, z0 = cx - span/2, cz - span/2

    bmp = np.zeros((res, res), dtype=np.uint8)
    def to_px(x, z):
        px = int((x - x0)/span*(res-1))
        pz = int(((z - z0)/span)*(res-1)) if flip_v else int((1-(z-z0)/span)*(res-1))
        return (px, pz)

    for v1, v2, v3 in triangles:
        _fill_tri(bmp, to_px(v1[0],v1[2]), to_px(v2[0],v2[2]), to_px(v3[0],v3[2]), res)
    return bmp

def _fill_tri(bmp, p1, p2, p3, res):
    pts = sorted([p1, p2, p3], key=lambda p: p[1])
    (x0,y0),(x1,y1),(x2,y2) = pts
    def lerp(ya,xa,yb,xb,y):
        return xa if yb==ya else xa+(xb-xa)*(y-ya)/(yb-ya)
    for y in range(max(0,y0), min(res,y2+1)):
        if y < y1:
            xa = lerp(y0,x0,y1,x1,y) if y1!=y0 else min(x0,x1)
            xb = lerp(y0,x0,y2,x2,y)
        else:
            xa = lerp(y1,x1,y2,x2,y) if y2!=y1 else min(x1,x2)
            xb = lerp(y0,x0,y2,x2,y)
        if xa>xb: xa,xb = xb,xa
        L,R = max(0,int(math.floor(xa))), min(res-1,int(math.ceil(xb)))
        bmp[y, L:R+1] = 1

# ── 3. Detect interior holes ───────────────────────────────────────
def find_holes(bmp):
    h,w = bmp.shape
    ext = np.zeros_like(bmp, dtype=np.uint8)
    q = deque()
    for y in range(h):
        for x in (0, w-1):
            if bmp[y,x]==0 and ext[y,x]==0:
                ext[y,x]=1; q.append((x,y))
    for x in range(w):
        for y in (0, h-1):
            if bmp[y,x]==0 and ext[y,x]==0:
                ext[y,x]=1; q.append((x,y))
    while q:
        cx,cy = q.popleft()
        for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
            nx,ny = cx+dx, cy+dy
            if 0<=nx<w and 0<=ny<h and bmp[ny,nx]==0 and ext[ny,nx]==0:
                ext[ny,nx]=1; q.append((nx,ny))
    return (bmp==0) & (ext==0)

def label_holes(mask, min_area=50):
    h,w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    regions = []
    for y in range(h):
        for x in range(w):
            if mask[y,x] and not visited[y,x]:
                pixels = []
                q = deque([(x,y)]); visited[y,x]=True
                while q:
                    cx,cy = q.popleft(); pixels.append((cx,cy))
                    for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
                        nx,ny = cx+dx,cy+dy
                        if 0<=nx<w and 0<=ny<h and mask[ny,nx] and not visited[ny,nx]:
                            visited[ny,nx]=True; q.append((nx,ny))
                if len(pixels)>=min_area:
                    m = np.zeros_like(mask); 
                    for px,py in pixels: m[py,px]=1
                    regions.append(m)
    return regions

# ── 4. Moore-neighbourhood contour tracer ──────────────────────────
def trace_contour(bmp):
    padded = np.pad(bmp, 1, constant_values=0)
    h,w = padded.shape
    start = None
    for y in range(h):
        for x in range(w):
            if padded[y,x]:
                start=(x,y); break
        if start: break
    if not start: return []

    dirs=[(-1,0),(-1,-1),(0,-1),(1,-1),(1,0),(1,1),(0,1),(-1,1)]
    contour=[start]; cur=start; d=0
    for _ in range(800000):
        found=False
        for i in range(8):
            nd=(d+i)%8; nx,ny = cur[0]+dirs[nd][0], cur[1]+dirs[nd][1]
            if 0<=nx<w and 0<=ny<h and padded[ny,nx]:
                contour.append((nx,ny)); cur=(nx,ny); d=(nd+5)%8; found=True; break
        if not found: break
        if cur==start and len(contour)>2: break
    return [(x-1,y-1) for x,y in contour]

# ── 5. Ramer-Douglas-Peucker simplification ────────────────────────
def rdp(pts, eps):
    if len(pts)<3: return pts
    s,e = pts[0],pts[-1]
    dx,dy = e[0]-s[0], e[1]-s[1]
    L = math.hypot(dx,dy)
    md=mi=0
    for i in range(1,len(pts)-1):
        px,py = pts[i]
        d = math.hypot(px-s[0],py-s[1]) if L==0 else abs(dy*px-dx*py+e[0]*s[1]-e[1]*s[0])/L
        if d>md: md=d; mi=i
    if md>eps:
        return rdp(pts[:mi+1],eps)[:-1] + rdp(pts[mi:],eps)
    return [s,e]

# ── 6. Polygon → SVG path ──────────────────────────────────────────
def poly_to_d(points, sw, sh, res):
    sx,sy = sw/res, sh/res
    parts = []
    for i,(x,y) in enumerate(points):
        parts.append(f"{'M' if i==0 else 'L'}{x*sx:.1f} {y*sy:.1f}")
    parts.append('Z')
    return ''.join(parts)

# ── 7. Clip horizontal wireframe line to silhouette segments ───────
def clipped_h_segments(bmp, row, svg_w, svg_h, res, min_gap=8):
    """Return list of (x1, x2) SVG-coord segments, splitting at gaps > min_gap px."""
    cols = np.where(bmp[row])[0]
    if len(cols)<2: return []
    # Find contiguous runs
    segs = []
    seg_start = cols[0]
    for i in range(1, len(cols)):
        if cols[i] - cols[i-1] > min_gap:
            segs.append((seg_start, cols[i-1]))
            seg_start = cols[i]
    segs.append((seg_start, cols[-1]))
    # Convert to SVG coords
    sx = svg_w / res
    sy = svg_h / res
    y_svg = row * sy
    result = []
    for s, e in segs:
        if (e - s) * sx > 3:  # skip tiny fragments
            result.append((s*sx, e*sx, y_svg))
    return result

# ── Main ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    stl_path = os.path.join(script_dir, 'Utah_teapot_(solid).stl')

    print(f"Reading STL: {stl_path}")
    tris = read_stl_binary(stl_path)
    print(f"  {len(tris)} triangles")

    RES = 1024
    SVG_W = SVG_H = 120

    print("Rasterising side-view silhouette (flipped) …")
    bmp = silhouette_bitmap(tris, res=RES, flip_v=True)

    # ── outer contour ──
    print("Tracing outer contour …")
    outer = trace_contour(bmp)
    outer_s = rdp(outer, 1.5)
    print(f"  {len(outer)} raw → {len(outer_s)} simplified")
    d_outer = poly_to_d(outer_s, SVG_W, SVG_H, RES)

    # ── handle hole ──
    print("Finding handle hole …")
    holes = find_holes(bmp)
    regions = label_holes(holes, min_area=50)
    print(f"  {len(regions)} hole(s) found")

    hole_ds = []
    for i, hmask in enumerate(regions):
        hc = trace_contour(hmask.astype(np.uint8))
        if len(hc)<10: continue
        hs = rdp(hc, 1.0)
        print(f"  Hole {i}: {len(hc)} → {len(hs)} pts")
        hole_ds.append(poly_to_d(hs, SVG_W, SVG_H, RES))

    d_full = d_outer + ''.join(' '+hd for hd in hole_ds)

    # ── write paths ──
    path_file = os.path.join(script_dir, 'teapot_path.txt')
    with open(path_file, 'w') as f: f.write(d_full)
    print(f"Wrote combined path → {path_file}")

    outer_file = os.path.join(script_dir, 'teapot_outer.txt')
    with open(outer_file, 'w') as f: f.write(d_outer)
    print(f"Wrote outer path   → {outer_file}")

    for i, hd in enumerate(hole_ds):
        hf = os.path.join(script_dir, f'teapot_hole_{i}.txt')
        with open(hf, 'w') as f: f.write(hd)
        print(f"Wrote hole {i} path → {hf}")

    # ── wireframe lines (clipped to body, skipping spout gap) ──
    print("Generating clipped wireframe …")
    rows_with_data = np.where(np.any(bmp, axis=1))[0]
    y_top, y_bot = rows_with_data[0], rows_with_data[-1]
    body_h = y_bot - y_top

    wire_paths = []

    # Horizontal slices
    n_h = 7
    for i in range(1, n_h+1):
        row = y_top + int(body_h * i / (n_h+1))
        segs = clipped_h_segments(bmp, row, SVG_W, SVG_H, RES, min_gap=8)
        for x1, x2, yy in segs:
            wire_paths.append(f"M{x1:.1f} {yy:.1f}L{x2:.1f} {yy:.1f}")

    # Vertical meridians
    cols_with_data = np.where(np.any(bmp, axis=0))[0]
    x_left, x_right = cols_with_data[0], cols_with_data[-1]
    body_w = x_right - x_left

    n_v = 5
    for i in range(1, n_v+1):
        col = x_left + int(body_w * i / (n_v+1))
        rows = np.where(bmp[:, col])[0]
        if len(rows)<2: continue
        # split at vertical gaps too
        seg_start = rows[0]
        for j in range(1, len(rows)):
            if rows[j]-rows[j-1] > 8:
                sx_v = col * SVG_W / RES
                t = seg_start * SVG_H / RES
                b = rows[j-1] * SVG_H / RES
                if b - t > 3:
                    wire_paths.append(f"M{sx_v:.1f} {t:.1f}L{sx_v:.1f} {b:.1f}")
                seg_start = rows[j]
        sx_v = col * SVG_W / RES
        t = seg_start * SVG_H / RES
        b = rows[-1] * SVG_H / RES
        if b - t > 3:
            wire_paths.append(f"M{sx_v:.1f} {t:.1f}L{sx_v:.1f} {b:.1f}")

    wire_file = os.path.join(script_dir, 'teapot_wireframe.txt')
    with open(wire_file, 'w') as f: f.write('\n'.join(wire_paths))
    print(f"Wrote wireframe ({len(wire_paths)} segs) → {wire_file}")

    # ── SVG preview ──
    svg_file = os.path.join(script_dir, 'teapot_silhouette.svg')
    wire_svg = '\n'.join(f'  <path d="{w}" fill="none" stroke="#666" stroke-width="0.5"/>' for w in wire_paths)
    with open(svg_file, 'w') as f:
        f.write(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SVG_W} {SVG_H}" width="480" height="480">
  <rect width="{SVG_W}" height="{SVG_H}" fill="white"/>
  <path d="{d_full}" fill="black" fill-rule="evenodd"/>
{wire_svg}
</svg>
''')
    print(f"Wrote SVG preview  → {svg_file}")
    print("Done.")
