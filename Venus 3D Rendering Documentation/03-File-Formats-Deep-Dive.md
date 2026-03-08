# File Formats Deep Dive

## Overview

Hamilton VENUS uses a mix of text-based and binary file formats for layout, labware, and 3D model data. This document provides byte-level specifications for each format.

---

## 1. DirectX `.x` File Format

### 1.1 File Header

```
xof 0303txt 0032
```

| Field | Value | Meaning |
|-------|-------|---------|
| `xof` | Magic | DirectX mesh format marker |
| `0303` | Version | DirectX version 3.3 |
| `txt` | Encoding | ASCII text (binary `.x` files are NOT supported) |
| `0032` | Precision | 32-bit floating point |

### 1.2 Coordinate System

- **Handedness**: Left-handed (DirectX convention)
- **Up-axis**: Y-up
- **Units**: Millimeters (Hamilton convention; no units in the format itself)
- After loading, the XFileLoader applies `fixXFileCoords()` to convert to Three.js right-handed Y-up.

### 1.3 Scene Graph

`.x` files use a hierarchical **Frame** system to build a scene graph:

```
xof 0303txt 0032

Frame RootFrame {
    FrameTransformMatrix {
        1.000000, 0.000000, 0.000000, 0.000000,
        0.000000, 1.000000, 0.000000, 0.000000,
        0.000000, 0.000000, 1.000000, 0.000000,
        0.000000, 0.000000, 0.000000, 1.000000;;
    }
    
    Frame ChildFrame {
        FrameTransformMatrix { ... }
        
        Mesh MeshName {
            <vertex_count>;
            <x>; <y>; <z>;,
            ...
            <face_count>;
            <n_vertices>; <v0>, <v1>, ... <vN-1>;,
            ...
            
            MeshNormals {
                <normal_count>;
                <nx>; <ny>; <nz>;,
                ...
                <face_count>;
                <n_normals>; <n0>, <n1>, ... <nN-1>;,
                ...
            }
            
            MeshMaterialList {
                <material_count>;
                <face_count>;
                <face_material_index_0>,
                <face_material_index_1>,
                ...
                
                Material MaterialName {
                    <r>; <g>; <b>; <a>;;        // Diffuse RGBA
                    <specular_power>;
                    <specR>; <specG>; <specB>;;  // Specular RGB
                    <emissR>; <emissG>; <emissB>;;  // Emissive RGB
                    
                    TextureFilename {
                        "texture_file.png";
                    }
                }
            }
        }
    }
}
```

### 1.4 Node Types

#### Frame
A named coordinate space containing an optional transform matrix and child Frames or Meshes.

```
Frame MyFrame {
    FrameTransformMatrix { ... }
    // Children
}
```

#### FrameTransformMatrix
A 4×4 **row-major** transformation matrix (16 floats). Defines the local-to-parent coordinate transformation.

```
FrameTransformMatrix {
    m00, m01, m02, m03,     // Row 0
    m10, m11, m12, m13,     // Row 1
    m20, m21, m22, m23,     // Row 2
    m30, m31, m32, m33;;    // Row 3 (usually 0,0,0,1)
}
```

The XFileLoader accumulates these matrices through the hierarchy and bakes the world transform into each mesh via `mesh.applyMatrix4(worldMatrix)`.

#### Mesh
Contains three sub-structures:

1. **Vertex List** — N vertices, each `x; y; z;` separated by commas with final semicolon
2. **Face Index List** — M faces, each `vertexCount; i0, i1, ..., iN;` format
3. **Child nodes** — `MeshNormals`, `MeshMaterialList`, `MeshTextureCoords`

**Face format:**
```
<vertex_count>; <v0>, <v1>, ..., <vN-1>;,
```

- Triangles: `3; 0, 1, 2;`
- Quads: `4; 0, 1, 2, 3;`
- N-gons: `N; v0, v1, ... vN-1;` — requires triangulation

#### MeshNormals
Per-vertex normal vectors + per-face normal index lists:

```
MeshNormals {
    <normal_count>;
    <nx>; <ny>; <nz>;,
    ...
    <face_count>;
    <n_verts>; <n0>, <n1>, ...;,
    ...
}
```

Normal indices may differ from vertex indices (same vertex can have different normals on different faces — hard edges vs smooth).

#### MeshMaterialList
Maps faces to materials:

```
MeshMaterialList {
    <material_count>;
    <face_count>;
    <mat_index_for_face_0>,
    <mat_index_for_face_1>,
    ...;
    
    Material { ... }
    Material { ... }
}
```

#### Material
Full surface material definition:

```
Material MyMaterial {
    <r>; <g>; <b>; <a>;;             // Diffuse RGBA (0.0–1.0)
    <specular_power>;;               // Shininess exponent (float)
    <specR>; <specG>; <specB>;;      // Specular color RGB
    <emissR>; <emissG>; <emissB>;;   // Emissive color RGB
    
    TextureFilename {
        "texture.png";               // Optional texture reference
    }
}
```

**Material mapping to Three.js `MeshPhongMaterial`:**

| `.x` Field | Three.js Property | Notes |
|-----------|------------------|-------|
| Diffuse RGBA | `color` + `opacity` | Alpha < 1.0 → `transparent: true` |
| Specular power | `shininess` | DirectX specular exponent |
| Specular RGB | `specular` | Specular highlight color |
| Emissive RGB | `emissive` | Self-illumination color |
| TextureFilename | `map` | Loaded as texture (if supported) |

All materials are created with `side: THREE.DoubleSide` to handle arbitrary model winding.

### 1.5 N-gon Triangulation

Hamilton's `.x` models frequently contain n-gon faces (4+ vertices). The XFileLoader uses **ear-clipping** triangulation:

1. Project polygon vertices onto the best-fit 2D plane (drop the axis with smallest normal component)
2. Walk the polygon edge list looking for "ears" — triangles whose interior contains no other vertices
3. Clip each ear, producing one triangle, until only 3 vertices remain
4. Handle concave polygons correctly (convex-only fan triangulation fails on Hamilton models)

---

## 2. Hamilton `.hxx` Format (Hamilton3dData Container)

### 2.1 Purpose

The `.hxx` format is a binary container wrapping one or more gzip-compressed files. The primary payload is a DirectX `.x` ASCII text file. HXX may also embed textures.

### 2.2 Binary Layout

```
┌────────────────────────────────────────────────┐
│ HEADER (20 bytes)                              │
│   Offset 0:   "Hamilton3dData"  (14 bytes ASCII) │
│   Offset 14:  Version[0]       (1 byte uint8)  │
│   Offset 15:  Version[1]       (1 byte uint8)  │
│   Offset 16:  SectionCount N   (4 bytes BE u32) │
├────────────────────────────────────────────────┤
│ SECTION TABLE (N × 12 bytes)                   │
│   For each section i (0..N-1):                 │
│     [0..3]  DataOffset     (4 bytes BE uint32)  │
│     [4..7]  NameLength     (4 bytes BE uint32)  │
│     [8..11] DecompressedSz (4 bytes BE uint32)  │
├────────────────────────────────────────────────┤
│ SECTION DATA BLOCKS                            │
│   For each section:                            │
│     [nameLength bytes] Section name (ASCII)    │
│     [remaining bytes]  Gzip-compressed data    │
│       (compressed size = next_offset - current │
│        - nameLength, or EOF for last section)  │
└────────────────────────────────────────────────┘
```

### 2.3 Header Details

| Offset | Size | Type | Value | Description |
|--------|------|------|-------|-------------|
| 0 | 14 | ASCII | `Hamilton3dData` | Magic signature (no null terminator) |
| 14 | 1 | uint8 | varies | Version byte 0 (not validated by loader) |
| 15 | 1 | uint8 | varies | Version byte 1 (not validated by loader) |
| 16 | 4 | BE uint32 | N | Number of sections |

### 2.4 Section Table Entry (12 bytes each)

| Byte | Size | Type | Description |
|------|------|------|-------------|
| 0–3 | 4 | BE uint32 | Absolute byte offset from file start to section data block |
| 4–7 | 4 | BE uint32 | Length of section name in bytes (no null terminator) |
| 8–11 | 4 | BE uint32 | Expected decompressed size of the gzip payload |

### 2.5 Standard Section Names

| Name | Content | Description |
|------|---------|-------------|
| `__Main3dData__` | Gzip-compressed `.x` text | Primary 3D model data |
| `textures/<filename>.png` | Gzip-compressed PNG | Embedded texture image |

### 2.6 Decompression Algorithm

```javascript
// 1. Parse gzip header to find DEFLATE payload start
//    Standard gzip header: 1F 8B 08 ... (10+ bytes)
// 2. Skip gzip header per RFC 1952
// 3. Read ISIZE from last 4 bytes (little-endian, decompressed mod 2^32)
// 4. Extract raw DEFLATE data between header end and trailer
// 5. Inflate with pako.inflate({ raw: true })
// 6. Decode as UTF-8 for .x text, or keep as binary for images
```

### 2.7 Detection API

```javascript
HXXLoader.isHXX(arrayBuffer)  // Returns true if first 14 bytes = "Hamilton3dData"
```

---

## 3. HxCfgFile Format (`.tml`, `.dck`)

### 3.1 File Header

```
HxCfgFile,3;
ConfigIsValid,Y;
```

The header version is either `2` or `3`. The format is forward-compatible — higher versions may have additional features.

### 3.2 Basic Syntax

- **Key-value pairs**: `key, value;` (comma-separated, semicolon terminated)
- **String values**: Quoted `"value"` or unquoted
- **Data blocks**: `DataDef,TYPE,VERSION,NAME, { ... };`
- **Comments**: Lines starting with `*`
- **Footer**: `* $$author=...$$valid=...$$time=...$$checksum=...$$length=...$$`

### 3.3 DataDef Blocks

```
DataDef, TEMPLATE, 1, default,
{
    key1, "value1",
    key2, "value2",
    ...
};
```

Block types include:
- `TEMPLATE` — Template definition (carrier, rack, container)
- `RACK` — Rack data definition
- `CONTAINER` — Container well definition
- `HxPars` — Parameter data (e.g., audit trail, Hamilton-specific data)

### 3.4 Template Properties

#### Identification
| Key | Type | Description |
|-----|------|-------------|
| `ViewName` | String | Display name |
| `Description` | String | Full description text |
| `Category.N.Id` | String | Category ID for Nth category |
| `CategoryCnt` | String | Number of categories |
| `ReadOnly` | String | `0`/`1` — Is read-only |
| `Visible` | String | `0`/`1` — Is visible |

#### Dimensions
| Key | Type | Description |
|-----|------|-------------|
| `Dim.Dx` | String | Width in mm |
| `Dim.Dy` | String | Depth in mm |
| `Dim.Dz` | String | Height in mm |
| `Clearance` | String | Clearance height in mm |

#### 3D Model References
| Key | Type | Description |
|-----|------|-------------|
| `3DModel` | String | Full path to `.hxx`/`.x` model (backslash-separated) |
| `3DModelRel` | String | Relative path to model |
| `3DxOffset` | String | X offset of 3D model from template origin (mm) |
| `3DyOffset` | String | Y offset (mm) |
| `3DzOffset` | String | Z offset (mm) |
| `Image3D` | String | Path to 3D preview image (`.png`) |
| `ImageRel` | String | Relative path to preview image |

#### Visual Properties
| Key | Type | Description |
|-----|------|-------------|
| `BackgrndClr` | String | Background color as decimal BGR integer |
| `UseBndry` | String | `0`/`1` — Use boundary |

#### Barcode
| Key | Type | Description |
|-----|------|-------------|
| `Barcode.Unique` | String | `0`/`1` — Is barcode unique |
| `Barcode.Value` | String | Barcode template string (e.g., `SR11****`) |

#### Site Definitions (repeated for each site 1..N)
| Key | Type | Description |
|-----|------|-------------|
| `Site.Cnt` | String | Total number of sites |
| `Site.N.Id` | String | Site identifier number |
| `Site.N.Posn` | String | Position number |
| `Site.N.X` | String | X offset from template left edge (mm) |
| `Site.N.Y` | String | Y offset from template front edge (mm) |
| `Site.N.Z` | String | Z offset from template base (mm) |
| `Site.N.Dx` | String | Site footprint width (mm) |
| `Site.N.Dy` | String | Site footprint depth (mm) |
| `Site.N.Label` | String | `0`/`1` — Has label |
| `Site.N.IsCovered` | String | `0`/`1` — Is covered |
| `Site.N.Visible` | String | `0`/`1` — Is visible |
| `Site.N.SnapBase` | String | `0`/`1` — Can snap to base |
| `Site.N.Stack` | String | `0`/`1` — Stackable |
| `Site.N.StackSize` | String | Stack size count |
| `Site.N.LabwareFile` | String | Path to labware file (`.rck`) placed on this site |

#### ML_STAR Carrier-Specific Properties
| Property | Key | Example | Description |
|----------|-----|---------|-------------|
| `MlStarCarBCOrientation` | int | `1` | Barcode reader orientation |
| `MlStarCarBCReadWidth` | int | `300` | Barcode read width |
| `MlStarCarCountOfBCPos` | int | `5` | Number of barcode positions |
| `MlStarCarFirstBCPos` | int | `615` | First barcode position offset |
| `MlStarCarIsAutoLoad` | bool(int) | `1` | Supports auto-load |
| `MlStarCarIsLoadable` | bool(int) | `1` | Is loadable |
| `MlStarCarIsRecognizable` | bool(int) | `1` | Is recognizable by system |
| `MlStarCarLabelName` | string | `PLT_CAR_L5_DWP` | Label identifier |
| `MlStarCarPosAreRecognizable` | bool(int) | `0` | Positions recognizable |
| `MlStarCarRasterWidth` | int | `960` | Grid/raster width |
| `MlStarCarWidthAsT` | int | `6` | Width in tracks |

### 3.5 Deck File (`.dck`) Additions

Deck files share the HxCfgFile format but have additional sections:

#### DECK DataDef Properties
| Key | Type | Description |
|-----|------|-------------|
| `Dim.Dx` | String | Total deck width (mm) |
| `Dim.Dy` | String | Total deck depth (mm) |
| `Site.N.X/Y/Z` | String | Track positions (absolute coordinates) |
| `Site.N.Dx/Dy` | String | Track dimensions |
| `Site.N.Id` | String | Track number |
| `Site.N.Label` | String | `0`/`1` — Track is labeled |
| `Target.N.X/Y/Z` | String | Reference/home position |

#### ExSite Definitions
| Key | Type | Description |
|-----|------|-------------|
| `ExSite.Cnt` | String | Total external site count |
| `ExSite.N.Id` | String | External site ID (e.g., `PL1`, `DWL5`) |
| `ExSite.N.X/Y/Z` | String | External site position (absolute) |
| `ExSite.N.Dx/Dy` | String | External site footprint |
| `ExSite.N.MatchMask` | String | Matching mask for labware compatibility |

### 3.6 Footer Checksum

```
* $$author=ContainerAdministrator$$valid=1$$time=2025-06-21 16:40$$checksum=6d1c90b0$$length=098$$
```

| Field | Description |
|-------|-------------|
| `author` | Windows username who last modified the file |
| `valid` | `0`/`1` — File validity flag |
| `time` | Last modification timestamp (`YYYY-MM-DD HH:MM`) |
| `checksum` | CRC/hash for integrity verification (hex string) |
| `length` | File length information (decimal string) |

---

## 4. Rack File Format (`.rck`)

### 4.1 Dual Format

Rack files exist in **two formats** depending on their origin:

1. **Text format** — HxCfgFile format identical to `.tml` (older files, some manually created)
2. **Binary format** — Proprietary binary with embedded strings (majority of Hamilton-shipped labware)

### 4.2 Text Format (HxCfgFile)

Same structure as described in Section 3. Contains `DataDef, RACK, ...` blocks with 3D model references and well/container grid definitions.

### 4.3 Binary Format

Binary `.rck` files cannot be parsed as text. Key data is extracted by scanning for embedded ASCII strings:

**Extraction via `parseRCKBinary()`:**

```javascript
// Scan the binary buffer for readable ASCII strings (length ≥ 4 chars)
// Look for specific field patterns:
//   - Strings ending in ".x" or ".hxx" → 3D model path
//   - Strings matching "3DxOffset", "3DyOffset", "3DzOffset" → followed by numeric strings
//   - Dimension strings for grid layout
```

**Key fields extracted from binary `.rck`:**

| Field | How Found | Description |
|-------|-----------|-------------|
| 3D Model path | String ending `.x` or `.hxx` | Path to the 3D model file |
| `3DxOffset` | Key-value pattern | X offset of 3D model |
| `3DyOffset` | Key-value pattern | Y offset of 3D model |
| `3DzOffset` | Key-value pattern | Z offset of 3D model |
| Container file | String ending `.ctr` | Path to container definition |
| Grid dimensions | Numeric fields | Well rows/columns |

### 4.4 Example: waste2.rck

The waste2.rck rack (used in the waste block) defines:
- Dimensions: 150 × 220 × 33 mm
- 3D Model: `Waste2.hxx` or `Waste2.x`
- Positioned at site coordinates within WasteBlock.tml

---

## 5. Container File Format (`.ctr`)

### 5.1 Purpose

Container files define individual well geometry — shape, dimensions, and volume relationships.

### 5.2 Binary Format

`.ctr` files are binary. Key data includes:

| Field | Description |
|-------|-------------|
| Well shape code | Integer identifying the well cross-section type |
| Well depth | Depth of the well in mm |
| Well diameter | Diameter (or width) of the well opening in mm |
| Bottom diameter | Diameter at the well bottom |
| Volume segments | Piecewise-linear or polynomial volume-to-height mapping |

### 5.3 Well Shape Codes

| Code | Shape | Description |
|------|-------|-------------|
| 0 | Flat bottom | Cylindrical well with flat bottom |
| 1 | Round bottom | Cylindrical well with hemispherical bottom |
| 2 | V-bottom | Cylindrical well with conical bottom |
| 3 | Round (U-shape) | U-shaped well |
| 4 | Square flat | Rectangular well with flat bottom |
| 5 | Square V | Rectangular well with V-bottom |

### 5.4 Reference in Template Files

Container files are referenced via site labware chains:

```
Site.N.LabwareFile → something.rck → Cntr.1.file → something.ctr
```

---

## 6. Catalog & Manifest Files

### 6.1 `.dat` Catalog Files

Located in `C:\Program Files (x86)\Hamilton\Labware\ML_STAR\`:

| File | Purpose |
|------|---------|
| `BaseCategory.dat` | Base category definitions |
| `Category.dat` | Category hierarchy and names |
| `Index.dat` | Index of all available labware templates |

Format: CSV-like text files with header rows and pipe/comma delimiters.

### 6.2 `Labware.json` Manifest

Located in each labware subdirectory:

```json
{
    "name": "PLT_CAR_L5_DWP",
    "type": "carrier",
    "files": [
        "PLT_CAR_L5_DWP.tml",
        "PLT_CAR_L5_DWP.hxx",
        "PLT_CAR_L5_DWP.png"
    ]
}
```

---

## 7. XML Configuration Files

### 7.1 StarCarriers.xml

Defines MultiFlex carrier geometry and pedestal configurations:

```xml
<starCarriers>
    <carrier
        displayName="Plate Carrier - 5 Position"
        dimensions="135,497,18"
        modelFilePath="ML_STAR\MFXCreation\Base - 5 Position.x"
        sitePedestalOffsets="[67.5,435.5,0];[67.5,339.5,0];..."
        sitePedestalTypes="1;1;1;1;1"
        modelOffsets="0,0,0"
        modelEdgeOffsets="0,-2.5,0" />
</starCarriers>
```

### 7.2 StarCarrierPedestals.xml

Defines individual pedestal types that mount on MultiFlex carrier bases:

```xml
<starCarrierPedestals>
    <pedestal
        displayName="Standard Plate Pedestal"
        pedestalType="Plate"
        templateFilePath="ML_STAR\MFXCreation\Pedestal.tml"
        modelFilePath="ML_STAR\MFXCreation\Pedestal.x"
        modelOffsetsOverride=""
        sitesOffsetsOverride=""
        oversized="" />
</starCarrierPedestals>
```

### 7.3 HxSys3DView.xml

Contains 3D view configuration:

```xml
<System3D>
    <Item Name="StarDeckModelPath" Value="..." />
    <Item Name="StarletDeckModelPath" Value="..." />
    <Item Name="VantageDeckModelPath" Value="..." />
</System3D>
```

---

## 8. glTF / GLB Format

### 8.1 Usage

glTF 2.0 is used for **instrument deck base models** only — not for labware. These are complex whole-deck models exported from CAD software.

### 8.2 File Pairs

```
Model.gltf    ← JSON scene descriptor
Model.bin     ← Binary buffer with vertices, indices, etc.
```

### 8.3 Known Models

| File | Instrument |
|------|------------|
| `star_deck.gltf` + `.bin` | ML STAR deck |
| `starlet_deck.gltf` + `.bin` | Starlet deck |
| `vantage_deck.gltf` + `.bin` | STAR Vantage deck |

### 8.4 Export Metadata

From GLTF asset metadata:
```json
{
    "generator": "Pixyz Studio 2021.1",
    "version": "2.0"
}
```

The GLTF models originate from STEP/CAD exports processed through Pixyz Studio for web/real-time optimization.

---

## 9. Other File Extensions

| Extension | Format | Purpose |
|-----------|--------|---------|
| `.lid` | Binary | Lid/cover file for stacked labware |
| `.lay` | Binary | Layout file (deck configuration with placed carriers/labware) |
| `.stp` / `.step` | STEP CAD | Source engineering models (not used at runtime) |
| `.png` | Image | 3D preview thumbnails for labware browser |
