# 3D Model Loading Pipeline

## Overview

The 3D model loading pipeline is a multi-stage process that takes Hamilton labware files from disk, decompresses them (if `.hxx`), parses the DirectX `.x` text, triangulates n-gon faces, creates Three.js geometry, converts coordinate systems, and positions the result in the scene. This document traces the complete pipeline step by step.

---

## 1. Pipeline Overview

```
File Fetch (HTTP or disk)
    │
    ▼
Format Detection (.hxx or .x?)
    │
    ├── .hxx → HXX Decompression (Hamilton3dData container)
    │              │
    │              ▼
    │          Gzip Inflate (pako)
    │              │
    │              ▼
    │          Raw .x ASCII text
    │
    ├── .x → Direct ASCII text
    │
    ▼
XFileLoader Parsing
    │
    ├── Tokenization (regex-based)
    ├── Frame hierarchy construction
    ├── Mesh extraction (vertices, faces, normals)
    ├── N-gon triangulation (ear-clipping)
    ├── Material creation (MeshPhongMaterial, DoubleSide)
    └── Texture reference extraction
    │
    ▼
THREE.Group (scene graph)
    │
    ▼
Coordinate Conversion (fixXFileCoords)
    │
    ├── Negate Z positions (all vertices)
    ├── Negate Z normals (all normal vectors)
    └── Reverse face winding (swap first two indices per triangle)
    │
    ▼
Bounding Box Calculation
    │
    ▼
Centering & Positioning
    │
    ├── Center on TML footprint (carrier models)
    ├── Apply 3D offsets from TML/RCK (model3DxOff, etc.)
    └── Lift base to y=0 (ground plane alignment)
    │
    ▼
Cache Storage
    │
    ▼
Scene Addition (with z-fighting prevention)
```

---

## 2. File Fetch

### 2.1 Path Resolution

Hamilton paths use backslash separators relative to the `Labware\` directory:

```
Input:  "ML_STAR\\PLT_CAR_L5_DWP\\PLT_CAR_L5_DWP.hxx"
Output: "Base Hamilton Files/Labware/ML_STAR/PLT_CAR_L5_DWP/PLT_CAR_L5_DWP.hxx"
```

```javascript
function resolveHamiltonPath(hamiltonPath) {
    // Replace backslashes with forward slashes
    // Prepend server base path
    return 'Base Hamilton Files/Labware/' + hamiltonPath.replace(/\\/g, '/');
}
```

### 2.2 Fetch as ArrayBuffer

All model files are fetched as binary `ArrayBuffer` to support both HXX (binary) and `.x` (text) formats:

```javascript
const response = await fetch(serverUrl);
const arrayBuffer = await response.arrayBuffer();
```

---

## 3. HXX Decompression

### 3.1 Detection

```javascript
if (HXXLoader.isHXX(arrayBuffer)) {
    // First 14 bytes == "Hamilton3dData"
    // → Decompress
}
```

### 3.2 Parsing Pipeline

```javascript
const result = await HXXLoader.parse(arrayBuffer);
// result = {
//     xFileText: string,          // Decompressed .x ASCII text
//     textures: [{name, blob}]    // Embedded textures (if any)
// }
```

#### Decompression Steps

1. **Read header** (20 bytes):
   - Magic: `Hamilton3dData` (14 bytes)
   - Version: 2 bytes (ignored)
   - Section count N: 4 bytes (big-endian uint32)

2. **Read section table** (N × 12 bytes):
   ```
   For each section:
     dataOffset    (4 bytes BE uint32)
     nameLength    (4 bytes BE uint32)  
     decompressedSize (4 bytes BE uint32)
   ```

3. **For each section**:
   a. Seek to `dataOffset`
   b. Read `nameLength` bytes → section name (ASCII)
   c. Calculate compressed size:
      - `nextSection.dataOffset - (current.dataOffset + current.nameLength)`
      - For last section: `fileLength - (current.dataOffset + current.nameLength)`
   d. Extract gzip payload
   e. Parse gzip header (RFC 1952) to find DEFLATE start
   f. Extract ISIZE from last 4 bytes of gzip stream
   g. Inflate raw DEFLATE data with `pako.inflate({ raw: true })`

4. **Route by section name**:
   - `__Main3dData__` → decode as UTF-8 → `.x` file text
   - Other names → store as texture blob

### 3.3 Shortcut API

For cases where only the `.x` text is needed:

```javascript
const blob = await HXXLoader.toXFileBlob(arrayBuffer);
// Returns a Blob containing the decompressed .x text
```

---

## 4. XFileLoader Parsing

### 4.1 Initialization

```javascript
const loader = new THREE.XFileLoader();
const group = loader.parse(xFileText, {
    texturePath: resolvedTexturePath  // Base URL for texture references
});
```

### 4.2 Tokenization

The parser uses regex-based tokenization to extract:
- Keywords: `Frame`, `Mesh`, `MeshNormals`, `MeshMaterialList`, `Material`, `FrameTransformMatrix`, `TextureFilename`
- Delimiters: `{`, `}`, `;`, `,`
- Numbers: Integer and floating-point values
- Strings: Quoted strings for names and texture paths

### 4.3 Frame Hierarchy Construction

```
Parse stack tracks:
  - Current Frame name
  - Current FrameTransformMatrix (4×4 row-major)
  - World transform = parent.worldTransform × local.transform

Each Frame may contain:
  - FrameTransformMatrix → local transform
  - Child Frame nodes → recursive descent
  - Mesh nodes → geometry data
```

### 4.4 Mesh Parsing

For each `Mesh` block:

1. **Vertex list**: Read `vertexCount` then `vertexCount × (x, y, z)` floats
2. **Face list**: Read `faceCount` then per-face `vertexCount; v0, v1, ..., vN;`
3. **MeshNormals**: Same structure — normals then face normal indices
4. **MeshMaterialList**: Material count, face-to-material mapping, then Material blocks

### 4.5 N-gon Triangulation

Hamilton's `.x` models frequently contain faces with 4+ vertices (quads, pentagons, hexagons, etc.). The XFileLoader applies **ear-clipping triangulation**:

#### Algorithm

```
Input: Polygon with vertices [v0, v1, ..., vN-1]

1. Compute face normal from cross product of first three vertices
2. Choose projection plane (drop axis with largest normal component):
   - If |normal.x| is largest → project to YZ plane
   - If |normal.y| is largest → project to XZ plane
   - If |normal.z| is largest → project to XY plane
3. Create 2D projection of vertices
4. Initialize vertex linked list
5. Loop until 3 vertices remain:
   a. Find an "ear" — triangle (prev, current, next) where:
      - Interior angle is convex (cross product sign matches polygon winding)
      - No other polygon vertex lies inside the triangle
   b. Emit triangle (prev, current, next)
   c. Remove "current" from list
6. Emit final triangle
```

#### Why Ear-Clipping?

Simple fan triangulation (`v0, vi, vi+1`) fails on **concave** polygons — it produces overlapping or inverted triangles. Hamilton models exported from CAD software contain concave n-gons that require proper ear-clipping for correct rendering.

### 4.6 Material Creation

Each `.x` Material maps to a `THREE.MeshPhongMaterial`:

```javascript
const material = new THREE.MeshPhongMaterial({
    color: new THREE.Color(r, g, b),        // From diffuse RGB
    opacity: a,                              // From diffuse alpha
    transparent: (a < 1.0),                  // Enable transparency if needed
    shininess: specularPower,                // Specular exponent
    specular: new THREE.Color(specR, specG, specB),
    emissive: new THREE.Color(emR, emG, emB),
    side: THREE.DoubleSide                   // Always double-sided
});
```

**Double-sided rendering** (`side: DoubleSide`) is critical because:
- Hamilton `.x` models may have inconsistent winding
- The coordinate conversion (LH→RH) reverses winding, but some faces may already be correct
- DoubleSide ensures all faces are visible regardless of winding

### 4.7 World Transform Baking

After parsing, each mesh has the accumulated world transform applied:

```javascript
mesh.applyMatrix4(worldBaseMx);
// Bakes Frame hierarchy transforms directly into vertex positions
// No runtime transform hierarchy needed
```

---

## 5. Coordinate Conversion (fixXFileCoords)

### 5.1 Purpose

Convert from DirectX **left-handed Y-up** to Three.js **right-handed Y-up** coordinate system.

### 5.2 Implementation

```javascript
function fixXFileCoords(group) {
    group.traverse(function (child) {
        if (!child.isMesh || !child.geometry) return;
        
        const pos = child.geometry.attributes.position;
        const norm = child.geometry.attributes.normal;
        const idx = child.geometry.index;
        
        // 1. Negate Z on all vertex positions
        for (let i = 0; i < pos.count; i++) {
            pos.setZ(i, -pos.getZ(i));
        }
        
        // 2. Negate Z on all normal vectors
        if (norm) {
            for (let i = 0; i < norm.count; i++) {
                norm.setZ(i, -norm.getZ(i));
            }
        }
        
        // 3. Reverse face winding (swap vertices 0 and 1 of each triangle)
        if (idx) {
            for (let f = 0; f < idx.count; f += 3) {
                const a = idx.getX(f);
                const b = idx.getX(f + 1);
                idx.setX(f, b);
                idx.setX(f + 1, a);
            }
        }
    });
}
```

### 5.3 Why This Works

| Operation | Effect |
|-----------|--------|
| Negate Z positions | Mirrors geometry across the XY plane (Z=0) |
| Negate Z normals | Ensures normals still point outward after mirroring |
| Swap winding | Negating one axis flips face orientation — swap restores correct front-facing |

---

## 6. Bounding Box & Centering

### 6.1 Bounding Box Calculation

After coordinate conversion, compute the axis-aligned bounding box:

```javascript
const box = new THREE.Box3().setFromObject(group);
const center = box.getCenter(new THREE.Vector3());
const size = box.getSize(new THREE.Vector3());
```

### 6.2 Centering for Carrier Models

```javascript
xModel.position.set(
    carrierDef.dx / 2 - center.x,     // Center X on TML width
    -box.min.y,                         // Lift base to y=0
    carrierDef.dy / 2 - center.z        // Center Z on TML depth
);
```

### 6.3 Centering for Site Labware

```javascript
siteModel.position.set(
    site.x + site.dx / 2 - center.x + rckInfo.xOff,
    site.z - box.min.y + rckInfo.zOff,
    site.y + site.dy / 2 - center.z + rckInfo.yOff
);
```

### 6.4 Centering for Fixtures (Waste/Drawer)

```javascript
xModel.position.set(
    def.dx / 2 - center.x + hamXOff,     // + TML 3DxOffset
    -box.min.y + hamZOff,                  // + TML 3DzOffset → Three Y
    def.dy / 2 - center.z + hamYOff        // + TML 3DyOffset → Three Z
);
```

---

## 7. RCK Parsing for 3D Model Paths

### 7.1 Flow

Before loading a labware 3D model, the `.rck` file must be parsed to extract the model path and offsets:

```
Fetch .rck → Detect format → Parse → Extract { model, xOff, yOff, zOff }
```

### 7.2 Format Detection

```javascript
async function fetchAndParseRCK(serverPath) {
    const buf = await fetch(serverPath).then(r => r.arrayBuffer());
    const header = new Uint8Array(buf, 0, 20);
    const headerStr = String.fromCharCode(...header);
    
    if (headerStr.includes('HxCfgFile')) {
        // Text format
        const text = new TextDecoder().decode(buf);
        return parseRCKText(text);
    } else {
        // Binary format
        return parseRCKBinary(buf);
    }
}
```

### 7.3 Text Parser (`parseRCKText`)

Uses regex to extract key-value pairs:

```javascript
const regex = /^(\S+),\s*"([^"]*)"\s*[;,]?\s*$/gm;
// Extracts:
//   3DModel → model path
//   3DModelRel → relative path
//   3DxOffset → float
//   3DyOffset → float
//   3DzOffset → float
```

### 7.4 Binary Parser (`parseRCKBinary`)

Scans binary data for readable ASCII strings:

```javascript
// Convert bytes 32-127 to ASCII, rest to newlines
// Split on newlines → array of strings
// Search for patterns:
//   "3DModel\n<value>" → model path
//   "3DxOffset\n<number>" → xOff
//   "3DyOffset\n<number>" → yOff
//   "3DzOffset\n<number>" → zOff
```

---

## 8. Caching System

### 8.1 Model Cache

All loaded 3D models are cached to avoid redundant fetches and parses:

```javascript
vlState.xModelCache = {
    'PLT_CAR_L5AC':    THREE.Group,  // Carrier model
    'PLT_CAR_L5_DWP':  THREE.Group,
    'TIP_CAR_480':     THREE.Group,
    '__WASTE_CHUTE__': THREE.Group,  // Waste fixture model
    '__DRAWER__':      THREE.Group,  // Drawer fixture model
    // ...
};
```

### 8.2 Site Labware Cache

Labware models loaded from `.rck` references:

```javascript
vlState.siteModelCache = {
    'ML_STAR/COS_96_FL.rck': {
        group: THREE.Group,     // Cloneable model
        xOff: 0,                // From RCK 3DxOffset
        yOff: 0,                // From RCK 3DyOffset
        zOff: 0                 // From RCK 3DzOffset
    },
    // ...
};
```

### 8.3 Loading State

Prevents duplicate in-flight requests:

```javascript
vlState.siteModelLoading = {
    'ML_STAR/COS_96_FL.rck': true,   // Currently loading
    'ML_STAR/NUN_384.rck': false,      // Done loading
};
```

### 8.4 Cache Key Generation

```javascript
function getCarrierCacheKey(def) {
    return def.viewName.toUpperCase().replace(/\s/g, '_');
}
```

### 8.5 Deep Cloning

When placing a model instance, the cached model is deep-cloned:

```javascript
const clone = cachedModel.clone(true);
// Deep clone: geometry shared, materials cloned for independent state
clone.traverse(child => {
    if (child.isMesh) {
        child.material = child.material.clone();  // Independent material
        child.frustumCulled = false;                // Always render
    }
});
```

---

## 9. Z-Fighting Prevention

### 9.1 Problem

When multiple coplanar surfaces exist (e.g., carrier body + site well boxes), they compete for the same depth buffer values, causing flickering (z-fighting).

### 9.2 Solutions Applied

| Technique | Details |
|-----------|---------|
| Polygon offset | `material.polygonOffset = true; material.polygonOffsetFactor = 1; material.polygonOffsetUnits = 1;` |
| Depth write control | Transparent materials: `material.depthWrite = false` |
| Slight position offsets | Site wells positioned slightly below carrier body surface |
| Render order | Transparent objects rendered after opaque via `renderOrder` |

### 9.3 Transparency Handling

Materials with blue-dominant colors (polycarbonate carrier lids) get special treatment:

```javascript
if (mat.color.b > mat.color.r * 1.2 && mat.color.b > mat.color.g * 1.2) {
    mat.opacity = 0.4;
    mat.transparent = true;
    mat.depthWrite = false;
}
```

---

## 10. Complete Loading Example

Loading a carrier from start to finish:

```
1. User selects PLT_CAR_L5_DWP from carrier list
2. Check vlState.xModelCache['PLT_CAR_L5_DWP'] → found (preloaded)
3. buildCarrierMesh(carrierDef, trackStart=7):
   a. Clone cached model
   b. Clone materials
   c. Apply transparency to polycarbonate
   d. Center on footprint: pos(67.5, 0, 248.5)
   e. Create site wells (invisible, raycast-only)
   f. For each site with labwareFile:
      - Check siteModelCache for RCK key
      - If cached: clone, position at site coords
      - If not cached: fetch RCK → parse → fetch model → parse → cache → rebuild
   g. Position group at track 7: (235.25, 100.0, 63.0)
4. Add group to scene
5. Register in vlState.placedCarriers[]
```
