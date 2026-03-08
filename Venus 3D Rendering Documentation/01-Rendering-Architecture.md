# Rendering Architecture

## Overview

Hamilton VENUS uses a multi-layered rendering architecture to display 3D labware, carriers, and instrument decks in the Method Editor and Layout Editor. The system combines COM-based (.NET) rendering components with DirectX/OpenGL graphics, ASSIMP model loading, and modern glTF 2.0 support.

---

## 1. Core Components (DLLs and Executables)

### 1.1 Method Editor — `HxMetEd.exe`

The Method Editor (`C:\Program Files (x86)\Hamilton\Bin\HxMetEd.exe`) is the primary application for building liquid handling methods. It hosts the 3D deck view as an embedded panel. The Method Editor:

- Loads the instrument deck definition (`.dck` file)
- Creates an instance of the 3D view COM component
- Passes the system deck object and instrument name to `Initialize()`
- Receives click/hover events from the 3D view for interactive editing

### 1.2 Labware Editor — `HxLabwrEd2.exe`

The Labware Editor 2 (`C:\Program Files (x86)\Hamilton\Bin\HxLabwrEd2.exe`) is a dedicated tool for creating and editing labware definitions. It uses the same 3D view component for previewing individual labware items and MultiFlex carrier assemblies. When creating MultiFlex carriers, it reads `StarCarriers.xml` and `StarCarrierPedestals.xml` for type definitions and pedestal configuration.

### 1.3 Deck View Component — `HxDeckView.dll`

`HxDeckView.dll` (`C:\Program Files (x86)\Hamilton\Bin\HxDeckView.dll`) provides the 2D deck visualization component. This is the top-down plan-view rendering of the deck layout, distinct from the 3D view. It renders carriers as colored rectangles with site outlines and labware labels. Localized resources are in `HxDeckViewEnu.dll`.

### 1.4 3D View Component — `Hamilton.HxSys3DView.dll`

This is the **primary 3D rendering engine** for Hamilton VENUS. It is a .NET assembly exposed as a COM component.

**File**: `C:\Program Files (x86)\Hamilton\Bin\Hamilton.HxSys3DView.dll`  
**Type Library**: `Hamilton.HxSys3DView.tlb`  
**Config**: `Hamilton.HxSys3DView.config` (assembly binding redirects, v4.0.0.0–v6.0.0.0)  
**API Docs**: `Hamilton.HxSys3DView.xml`

#### Key COM Interfaces

| Interface | Version | Purpose |
|-----------|---------|---------|
| `IHxInstrument3DView` | v1 | Base instrument 3D visualization |
| `IHxInstrument3DView2` | v2 | Extended: colorization, mouse modes, hit testing, reload |
| `IHxInstrument3DView3` | v3 | Additional events: rubber band, click position, hover position |
| `IHxInstrument3DViewMultiSelect` | — | Multi-object selection support |
| `IHxSystem3DView` | v1 | System-level 3D rendering |
| `IHxSystem3DView2` | v2 | Extended system view |
| `IHxLabware3DView` | — | Individual labware visualization |

#### Initialization Flow

```
IHxInstrument3DView.Initialize(hWnd, systemDeck, instrumentName)
    │
    ├─ hWnd: Window handle to render into (HWND from host application)
    ├─ systemDeck: COM object containing deck definition (.dck data)
    └─ instrumentName: e.g. "ML_STAR" — selects the correct .dck and GLTF model

IHxInstrument3DView.Initialize2(hWnd, instrumentDeck)
    │
    └─ Alternative: pass the instrument deck object directly
```

#### 3D View API Methods

**Object Selection**:
- `SelectObject(name)` — Select a labware object by name (empty string clears)
- `SelectedObject` — Property: returns the currently selected object name
- `ClearAllSelectedObjects()` — Deselect everything
- `AddToSelectedLabware(labwareId)` — Add to multi-selection
- `RemoveFromSelectedLabware(labwareId)` — Remove from multi-selection
- `SelectedObjects` — Property: all selected objects

**View Control**:
- `ZoomFit()` — Fit entire deck in view
- `ZoomIn()` / `ZoomOut()` — Incremental zoom
- `SetMaxTraversalHeight(height)` — Set max height for pipetting head display
- `ShowUserSettingsDialog()` — Open 3D view settings (returns true if changed)

**Colorization (v2+)**:
- `BeginColorization()` — Start batch colorization update
- `ColorizePositions(color, priority, positions)` — Color specific positions
  - `color`: System color value
  - `priority`: Byte value for rendering priority (higher = on top)
  - `positions`: 2D array of `[labwareId, positionId]` pairs
- `ClearPositionColorization()` — Remove all colorization
- `EndColorization()` — End batch update and render

**Hit Testing (v2+)**:
- `GetHitCoordinates(mouseX, mouseY, out x, out y, out z)` — Returns 3D coordinates at mouse position
- `GetHitSite(mouseX, mouseY, out carrierName, out siteName)` — Returns which carrier/site is under the mouse
- `MouseMode` — Property: set mouse interaction mode (orbit, select, rubber band)

**Deck Management (v2+)**:
- `ReloadDeck()` — Reload the deck layout (after carrier changes)
- `ViewSettings` — Property: get/set view settings (camera position, visibility)
- `ModifyEnable` — Property: enable/disable deck modification mode
- `CopySelectedLabware()` / `PasteCopiedLabware()` — Clipboard operations

#### Events

| Event | Interface | Description |
|-------|-----------|-------------|
| `MouseClick` | v1+ | Single click on viewport — returns `IHxSys3DViewMouseEventArgs` |
| `MouseDoubleClick` | v1+ | Double click — returns `IHxSys3DViewMouseEventArgs` |
| `RubberBandPositions` | v2+ | Rectangular selection completed — returns `IHxSys3DViewPositionsEventArgs` |
| `ClickPosition` | v2+ | Click position event with labware/site data |
| `HoverPosition` | v2+ | Mouse hover position with labware/site data |

### 1.5 Graphics Libraries

| Library | File | Purpose |
|---------|------|---------|
| **ASSIMP** | `assimp-vc143-mt.dll` | Open Asset Import Library — loads `.x`, `.obj`, `.gltf`, `.fbx` and 40+ formats |
| **DirectX Compiler** | `d3dcompiler_47.dll` | Shader compilation for DirectX rendering |
| **OpenGL ES** | `libEGL.dll`, `libGLESv2.dll` | OpenGL ES 2.0 rendering backend |
| **SkiaSharp** | `SkiaSharp.dll` | 2D graphics drawing (labels, overlays) |
| **HTML Renderer** | `HtmlRenderer.dll`, `HtmlRenderer.WPF.dll` | HTML/CSS rendering for tooltips and overlays |

### 1.6 Supporting COM Libraries

| Library | Purpose |
|---------|---------|
| `Hamilton.Interop.HxLabwr3.dll` | Labware 3 COM interface — reads `.tml`, `.rck`, `.ctr` |
| `Hamilton.Interop.HxCfgFil.dll` | Config file interface — parses HxCfgFile format |
| `Hamilton.Interop.HxDeckView.dll` | Deck view COM interop |
| `Hamilton.Interop.HxCommonLib.dll` | Common shared library |
| `Hamilton.Interop.HxProbeInLabware.dll` | Probe/labware collision detection |
| `HxSysDeck.dll` / `HxSysDeck.tlb` | System deck definition (COM component: reads `.dck` files, provides deck object) |
| `Hamilton.HxStarConfig.dll` | STAR instrument configuration |
| `Hamilton.HxVStarConfig.dll` | Vector/Vantage STAR configuration |
| `Hamilton.CollisionController.Controller.dll` | Collision detection/avoidance for pipetting |

---

## 2. Rendering Pipeline

### 2.1 High-Level Flow

```
Application Startup
    │
    ├─ HxMetEd.exe / HxLabwrEd2.exe starts
    ├─ Loads instrument configuration (ML_STAR.cfg, etc.)
    ├─ Reads deck definition (.dck) via HxSysDeck
    │
    ▼
3D View Initialization
    │
    ├─ Creates HxSys3DView COM component
    ├─ Calls Initialize(hWnd, systemDeck, instrumentName)
    ├─ System loads base deck GLTF model (e.g., star_deck.gltf)
    ├─ ASSIMP loads the GLTF binary buffer (.bin)
    │
    ▼
Deck Population
    │
    ├─ Reads .lay file (layout) for placed carriers
    ├─ For each carrier:
    │   ├─ Reads carrier .tml (template) for dimensions, sites, 3D model path
    │   ├─ Loads 3D model (.x or .hxx) via ASSIMP
    │   ├─ Positions carrier at track N on the deck (Site.X, Site.Y, Site.Z)
    │   └─ For each site on the carrier:
    │       ├─ Reads site labware file (.rck) for well grid + 3D model ref
    │       ├─ Loads labware 3D model (.x / .hxx)
    │       └─ Positions labware at site offset (Site.N.X, Site.N.Y, Site.N.Z)
    │
    ▼
Waste / Special Fixtures
    │
    ├─ Loads WasteBlock.tml → waste2.rck → waste 3D model
    ├─ Loads verification.rck → teaching needle blocks
    ├─ Positions through deck cutout panels
    │
    ▼
Interactive Rendering
    │
    ├─ DirectX / OpenGL ES rendering loop
    ├─ Mouse events → hit testing → selection highlighting
    ├─ Colorization for run control visualization
    └─ Camera orbit/pan/zoom
```

### 2.2 Model Loading via ASSIMP

The `assimp-vc143-mt.dll` (Open Asset Import Library, MSVC 2022 build) is the primary model loading library. It supports:

- **DirectX `.x` (ASCII text)** — The legacy format used for all labware 3D models
- **glTF 2.0 (`.gltf` + `.bin`)** — The modern format used for base deck models
- **Wavefront OBJ, FBX, STL** — Additional import formats supported by ASSIMP

When loading a `.x` file, ASSIMP:
1. Parses the `xof 0303txt 0032` header
2. Traverses the `Frame` hierarchy, accumulating `FrameTransformMatrix` 4×4 matrices
3. Extracts `Mesh` nodes with vertex positions, face indices, normals
4. Reads `MeshMaterialList` for per-face material assignments
5. Creates internal scene representation with materials, geometry, and transforms

### 2.3 Hamilton `.hxx` Container Handling

Before reaching ASSIMP, `.hxx` files (Hamilton's proprietary wrapper) must be unpacked:

1. Check for `Hamilton3dData` magic header (14 bytes at offset 0)
2. Read 2-byte version, 4-byte section count (N)
3. For each of N sections (12-byte descriptors):
   - 4-byte data offset, 4-byte name length, 4-byte decompressed size
4. Navigate to each section data block:
   - Read section name (ASCII, nameLength bytes)
   - Decompress remaining data (gzip/DEFLATE)
5. The `__Main3dData__` section contains the `.x` file text
6. Other sections contain PNG texture data

### 2.4 Dual-Format Model System

Hamilton VENUS uses **two 3D model formats** for different purposes:

| Format | Used For | Examples |
|--------|----------|---------|
| **glTF 2.0** (`.gltf` + `.bin`) | Base instrument deck models | `star_deck.gltf`, `vantage_20_deck.gltf` |
| **DirectX `.x`** (or `.hxx`) | Individual labware, carriers, pedestals, waste | `PLT_CAR_L5_DWP.hxx`, `waste2.hxx`, `Pedestal - DWP.x` |

The GLTF models were exported from **Pixyz Studio 2021.1 Update 1** (an industrial CAD-to-3D conversion tool). They contain:
- Hierarchical node assemblies with STEP product metadata
- Named color materials (`black_metal`, `black_plastic`, color hex codes)
- Transformation matrices for each assembly component
- Binary buffers for vertex positions, normals, and UVs

The `.x` models come from various CAD conversion tools including **PolyTrans** (some dating to 2016). They contain:
- Frame hierarchies with 4×4 row-major transformation matrices
- Vertex arrays with float coordinates (mm scale)
- N-gon face definitions (triangles through 5+ sided polygons)
- Material definitions with RGBA diffuse, specular power/color, and emissive color

---

## 3. Rendering Challenges & Solutions

### 3.1 Concave N-gon Polygons

Hamilton `.x` files frequently contain concave polygons (5+ vertices with non-convex shape). These appear on mechanical parts with cutouts, notches, and complex geometry. Standard fan triangulation produces visual artifacts. The solution is **ear-clipping triangulation**:

1. Project polygon vertices to 2D (drop axis most aligned with polygon normal)
2. Ensure counter-clockwise winding (flip if needed)
3. Iteratively clip "ear" triangles (convex vertex where no other vertex falls inside)
4. Fallback to fan triangulation for degenerate geometry
5. Synchronize normal faces with the same triangulation order

### 3.2 Z-Fighting (Overlapping Meshes)

`.x` files often contain overlapping meshes (e.g., a bottom plate sharing the same plane as the carrier body). Solutions:

| Technique | Implementation |
|-----------|---------------|
| **Logarithmic depth buffer** | `WebGLRenderer({ logarithmicDepthBuffer: true })` |
| **Containment detection** | Compute bounding boxes; tag smaller mesh as `isContained` |
| **Physical nudging** | Move smaller overlapping mesh by `thickness × 0.35 + size × 0.002` |
| **Per-mesh polygon offset** | `polygonOffsetFactor = 1 + i×4`, `polygonOffsetUnits = 4 + i×8` |
| **Strict depth test** | Contained meshes use `THREE.LessDepth` (strictly closer wins) |
| **Grid separation** | Grid at `renderOrder = -1` with `depthWrite = false` |

### 3.3 Face Winding / Double-Sided Materials

Hamilton `.x` files have inconsistent face winding order. All materials use `side = THREE.DoubleSide` to ensure visibility from any camera angle.

### 3.4 Coordinate System Conversion

DirectX `.x` uses a **left-handed Y-up** coordinate system. Three.js uses **right-handed Y-up**. The conversion negates the Z axis:

```javascript
// For each vertex position:
position.z = -position.z;

// For each normal vector:
normal.z = -normal.z;

// For each triangle face (reverse winding order):
[index[f], index[f+1]] = [index[f+1], index[f]];
```

### 3.5 Translucent Materials

Blue-dominant materials in carrier models (polycarbonate covers) are automatically made translucent:

```javascript
if (color.b > color.r * 1.5 && color.b > 0.1) {
    material.transparent = true;
    material.opacity = 0.4;
    material.depthWrite = false;
    material.side = THREE.DoubleSide;
}
```
