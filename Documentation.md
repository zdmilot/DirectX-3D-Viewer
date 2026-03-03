# X File Viewer — Technical Documentation

This document describes the rendering pipeline and all fixes implemented to correctly display `.x` (DirectX) 3D model files in the browser using Three.js.

---

## Architecture Overview

```
index.html          → Entry point, splash screen, theme toggle, canvas
js/app.js           → Viewer initialization, model loading, z-fighting fixes
js/lib/XFileLoader.js → .x file parser and geometry builder
js/lib/three.min.js → Three.js runtime
js/lib/OrbitControls.js → Camera orbit/pan/zoom controls
```

### Loading Flow

1. `initViewer()` creates the Three.js scene, camera, renderer, lights, grid, and controls.
2. `loadXFile('test.x', ...)` invokes `THREE.XFileLoader` to parse the `.x` file.
3. XFileLoader parses Frame hierarchy, vertices, faces, normals, materials, and animations.
4. Each Frame's `FrameTransformMatrix` is accumulated and baked into the mesh via `mesh.applyMatrix4(worldBaseMx)`.
5. `app.js` receives the array of `object.models` (Three.js Mesh objects) and applies post-processing.

---

## Key Fixes and How They Work

### 1. Ear-Clipping Triangulation (XFileLoader.js)

**Problem:** The original loader used **fan triangulation** to convert n-gon faces (polygons with 5+ vertices) into triangles. Fan triangulation fans all triangles from vertex 0 of the polygon. This works correctly only for **convex** polygons. The `.x` file format commonly contains non-convex (concave) polygons — especially on complex mechanical parts with cutouts and notches. Fan triangulation on these faces produces overlapping/incorrect triangles, causing:

- Missing edges on side walls
- Asymmetric rendering between mirrored sides
- Spurious triangles crossing through the interior of faces

**Solution:** Replaced fan triangulation with a proper **ear-clipping algorithm** (`triangulateFaceLocal()`):

```
Location: js/lib/XFileLoader.js (top of file, before HeaderLineParser)
Functions: triangulateFaceLocal(), _pointInTriangle2D()
```

**How ear-clipping works:**

1. **Project to 2D:** The polygon's 3D vertices are projected onto the dominant 2D plane by computing the polygon normal (Newell's method) and dropping the axis most aligned with it.

2. **Ensure CCW winding:** The signed area of the 2D polygon is computed. If it's negative (clockwise), the vertex order is reversed for processing, and a reverse-map is maintained to emit triangles with correct original indices.

3. **Clip ears iteratively:** An "ear" is a triangle formed by three consecutive polygon vertices where:
   - The middle vertex is **convex** (positive cross product)
   - **No other polygon vertex** falls inside the triangle

   When an ear is found, it's emitted as a triangle and the middle vertex is removed from the polygon. This repeats until only 3 vertices remain.

4. **Fallback:** If no ear can be found (degenerate geometry), falls back to fan triangulation for the remaining vertices.

5. **Fast path:** Triangles (3 vertices) and quads (4 vertices) skip ear-clipping entirely since they're always handled correctly by the simple decomposition.

**Normal synchronization:** The same local triangulation order (`faceTriOrders[]`) computed for vertex faces is reused for normal faces, ensuring normals stay correctly aligned with their triangles.

```javascript
// Vertex faces — ear-clip triangulation
this._currentMesh.vertexFaces.forEach(function (face, fi) {
    var localOrder = triangulateFaceLocal(face.indices, _this4._currentMesh.vertices);
    faceTriOrders.push(localOrder);
    for (var t = 0; t < localOrder.length; t += 3) {
        indices.push(face.indices[localOrder[t]],
                     face.indices[localOrder[t + 1]],
                     face.indices[localOrder[t + 2]]);
        triMatIndices.push(matIdx);
    }
});

// Normal faces — reuse same triangulation order
this._currentMesh.normalFaces.forEach(function (face, fi) {
    var localOrder = faceTriOrders[fi];
    for (var t = 0; t < localOrder.length; t += 3) {
        indicesN.push(face.indices[localOrder[t]],
                     face.indices[localOrder[t + 1]],
                     face.indices[localOrder[t + 2]]);
    }
});
```

---

### 2. Double-Sided Materials (XFileLoader.js)

**Problem:** Three.js defaults to `THREE.FrontSide` rendering. Faces are only visible from one side based on their winding order. When viewing the model from the back, entire surfaces become transparent/invisible.

**Solution:** Set `side = THREE.DoubleSide` on every material created by the loader:

```
Location: js/lib/XFileLoader.js, inside _makeOutputMesh(), material creation block
```

```javascript
var mpMat = new THREE.MeshPhongMaterial();
mpMat.side = THREE.DoubleSide;  // Render both front and back faces
```

This ensures all geometry is visible regardless of camera angle or face winding direction.

---

### 3. Overlapping Mesh Separation — Z-Fighting Prevention (app.js)

**Problem:** `.x` files often contain multiple meshes whose surfaces overlap or are coplanar (e.g., a thin bottom plate sharing the same plane as the main body's bottom face). When two surfaces occupy the same depth, the GPU cannot determine which is in front, causing **z-fighting** — a flickering/shimmering visual artifact.

**Solution:** A multi-layered approach:

#### 3a. Logarithmic Depth Buffer

```javascript
renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true
});
```

Provides much higher depth precision across the full range, reducing z-fighting especially on large models.

#### 3b. Overlapping Mesh Nudge (`separateOverlappingMeshes()`)

```
Location: js/app.js, called before adding models to the scene group
```

For every pair of meshes, this function:

1. Computes world-space bounding boxes
2. Checks if they intersect
3. **Containment detection:** If the smaller mesh's bounding box is entirely contained within the larger mesh's box, the meshes physically intersect and no positional nudge can help — it only moves the seam. Instead the contained mesh is tagged (`userData.isContained = true`) so the material setup can apply a strict depth function (see §3c).
4. For non-contained overlaps: Measures the overlap region and finds the **thinnest overlap axis**
5. Only nudges if the overlap is very thin relative to the model size (< 5% of the largest mesh dimension)
6. **Nudges the smaller mesh** slightly away from the larger mesh along the thin axis

This physically separates coplanar surfaces by a sub-pixel amount, eliminating z-fighting without changing the visual appearance.

```javascript
const nudge = overlapThickness * 0.35 + maxMeshSize * 0.002;
models[smallerIdx].position.add(offset);
```

#### 3c. Per-Mesh Render Order, Polygon Offset, and Strict Depth Test

Each mesh gets a unique `renderOrder` and `polygonOffset` values:

```javascript
model.renderOrder = i;

// On each material:
m.polygonOffset = true;
m.polygonOffsetFactor = 1 + meshIdx * 4;
m.polygonOffsetUnits  = 4 + meshIdx * 8;
```

- **renderOrder** determines draw sequence, ensuring consistent depth priority (largest mesh first)
- **polygonOffset** adds a small depth bias per mesh, separating surfaces in the depth buffer

**Strict depth test for contained meshes:**

When a mesh is entirely contained inside another (§3b), its material's depth function is changed from the default `LessEqualDepth` to `LessDepth`:

```javascript
if (isContained) {
    m.depthFunc = THREE.LessDepth;
}
```

With `LessDepth`, the contained mesh's fragments must be **strictly closer** than whatever is already in the depth buffer to render. At intersection seams — where both the outer and inner mesh surfaces meet at the same depth — the polygon offset pushes the inner mesh slightly behind, causing it to fail the strict depth test. The outer mesh's surface always wins, producing a clean edge with no z-fighting.

#### 3d. Grid Separation

The grid helper is rendered behind everything with depth write disabled and positioned slightly below the model bottom:

```javascript
newGrid.renderOrder = -1;
newGrid.material.depthWrite = false;
newGrid.position.y = -size.y / 2 - maxDim * 0.002;
```

---

## File Structure Summary

### js/lib/XFileLoader.js — Key Sections

| Section | Purpose |
|---------|---------|
| `triangulateFaceLocal()` | Ear-clipping triangulation for concave n-gon faces |
| `_pointInTriangle2D()` | Point-in-triangle test used by ear-clipping |
| `meshNode()` | Parses vertex positions and face index lists |
| `meshNormalNode()` | Parses normal vectors and normal face indices |
| `meshMaterialListNode()` | Parses materials and per-face material assignments |
| `transformationMatrixNode()` | Parses 4x4 frame transformation matrices |
| `_makeOutputMesh()` | Builds Three.js BufferGeometry from parsed data |
| Material creation block | Creates MeshPhongMaterial with DoubleSide rendering |

### js/app.js — Key Sections

| Section | Purpose |
|---------|---------|
| `separateOverlappingMeshes()` | Detects containment + nudges coplanar meshes apart |
| `initViewer()` | Scene, camera, renderer, controls, lights, grid setup |
| `loadXFile()` | Loads .x file, applies post-processing, auto-fits camera |
| Polygon offset block | Per-mesh depth bias + strict depth test for contained meshes |
| `updateViewerTheme()` | Switches scene colors for light/dark theme |

---

## Configuration Constants

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| `logarithmicDepthBuffer` | `true` | app.js renderer | High-precision depth buffer |
| `polygonOffsetFactor` | `1 + i*4` | app.js load loop | Per-mesh depth bias scale |
| `polygonOffsetUnits` | `4 + i*8` | app.js load loop | Per-mesh depth bias offset |
| `depthFunc` | `THREE.LessDepth` | app.js load loop | Strict depth test for contained meshes |
| Overlap threshold | `0.05` | app.js `separateOverlappingMeshes` | Max overlap ratio before nudging |
| Nudge amount | `thickness*0.35 + size*0.002` | app.js `separateOverlappingMeshes` | Physical separation distance |

---

## Why These Fixes Are Universal

These fixes solve the core rendering problems for **any** `.x` file, not just the test model:

- **Ear-clipping** handles arbitrary concave polygons with any number of vertices
- **DoubleSide materials** ensure visibility from all camera angles
- **Overlap separation** dynamically detects and resolves coplanar surfaces based on geometry analysis, not hardcoded positions
- **Polygon offset** scales with mesh count, working for models with any number of sub-meshes

No geometry is deleted or modified — all original faces, edges, and surfaces from the `.x` file are preserved and rendered correctly.
