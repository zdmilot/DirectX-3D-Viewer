# Instrument Deck Models

## Overview

Hamilton uses pre-built 3D models of the entire instrument deck as the base layer for 3D visualization. These models represent the physical frame, rails, panels, and cover plates of each instrument type. Two model formats exist: modern **glTF 2.0** models (current) and legacy **DirectX `.x`** models (older systems).

---

## 1. Available Deck Models

### 1.1 glTF 2.0 Models (Current)

Located at `C:\Program Files (x86)\Hamilton\Graphic\`:

| File | Binary | Instrument | Generator |
|------|--------|------------|-----------|
| `vantage_20_deck.gltf` | `vantage_20_deck.bin` | STAR Vantage 2.0 | Pixyz Studio 2021.1 Update 1 |
| `vantage_13_deck.gltf` | `vantage_13_deck.bin` | STAR Vantage 1.3 | Pixyz Studio 2021.1 Update 1 |
| `star_deck.gltf` | `star_deck.bin` | ML STAR | Pixyz Studio 2021.1 Update 1 |
| `starplus_deck.gltf` | `starplus_deck.bin` | ML STAR Plus | Pixyz Studio 2021.1 Update 1 |
| `starlet_deck.gltf` | `starlet_deck.bin` | Microlab STARlet | Pixyz Studio 2021.1 Update 1 |

All models use glTF version 2.0 and were exported from STEP/CAD assemblies through **Pixyz Studio 2021.1**.

### 1.2 Legacy DirectX `.x` Models

Located at `C:\Program Files (x86)\Hamilton\Graphic\`:

| File | Exporter | Date |
|------|----------|------|
| `Vantage-2_0.x` | PolyTrans (Okino CG) | 2016-11-11 |
| `Vantage-1_3.x` | PolyTrans (Okino CG) | 2016-11-14 |

**Bounding boxes** (in DirectX left-handed Y-up):
- **Vantage-2_0**: (-56.96, -31.85, -768.85) to (1941.96, 916.63, 188.44) mm
- **Vantage-1_3**: (-1268.05, 840.5, -41.40) to (58.05, 1804.91, 905.97) mm

These legacy models are maintained for backward compatibility with older Hamilton rendering systems.

---

## 2. GLTF Node Structure

### 2.1 Scene Graph

GLTF deck models contain a hierarchical node structure where each node represents a CAD component from the original STEP assembly:

```
Scene
  └── "6603785-01"                 ← Root assembly (Hamilton part number)
        ├── "black_plastic"        ← Material group (deck frame)
        ├── "aluminum"             ← Material group (rails)
        ├── "steel"                ← Material group (fasteners)
        ├── "cover_panel_1"        ← Removable cover panel
        ├── "cover_panel_2"
        ├── "cover_panel_3"
        ├── "cover_panel_4"
        └── ...
```

### 2.2 Node Metadata

Each node carries STEP export metadata:

```json
{
    "extras": {
        "__STEP/ProductName": "Component Name",
        "__STEP/ProductID": "6603785-01",
        "__STEP/Description": "Hamilton Vantage 2.0 Deck"
    }
}
```

### 2.3 Transformation Matrices

GLTF uses 4×4 **column-major** matrices (OpenGL convention):

```json
{
    "matrix": [
        -1, 0, 0, 0,
         0, 1, 0, 0,
         0, 0, -1, 0,
        -1500.3, 72.7, -81.5, 1
    ]
}
```

This places components in the GLTF scene's coordinate system, which may differ from Hamilton's internal coordinate system — the `loadDeckModel()` function handles alignment.

---

## 3. Deck Model Loading

### 3.1 `loadDeckModel()` Function

Located in `vantageLayout.js`, this function loads and positions the main deck GLTF:

```javascript
function loadDeckModel() {
    const loader = new THREE.GLTFLoader();
    loader.load('DeckLayoutManager/vantage_20_deck.gltf', function (gltf) {
        const model = gltf.scene;
        model.name = '__vantage_gltf__';
        
        // 1. Apply semi-transparency (opacity 0.88)
        //    Carriers and labware remain visually prominent
        model.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.transparent = true;
                child.material.opacity = 0.88;
            }
        });
        
        // 2. Compute model bounding box
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        // 3. Calculate deck center positions
        const deckCenterX = DECK.FIRST_TRACK_X 
            + (DECK.PHYSICAL_TRACKS * DECK.TRACK_SPACING) / 2;
        const deckCenterZ = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;
        
        // 4. Position model:
        //    X: Center on physical deck tracks
        //    Y: Align top surface to DECK.SURFACE_Z
        //    Z: Center on track depth
        model.position.set(
            deckCenterX - center.x,
            DECK.SURFACE_Z - box.max.y,
            deckCenterZ - center.z
        );
        
        // 5. Store for later access
        vlState.gltfModel = model;
        vlState._gltfBasePos = model.position.clone();
        vlState.scene.add(model);
    });
}
```

### 3.2 Alignment Logic

The GLTF model must be positioned so that:

| Alignment | Calculation | Value |
|-----------|------------|-------|
| X center | `FIRST_TRACK_X + (54 × 22.5) / 2` | ~707.75 mm |
| Y top surface | `DECK.SURFACE_Z - box.max.y` | Aligns model top to 100.0 mm |
| Z center | `TRACK_Y_START + TRACK_DEPTH / 2` | 63.0 + 248.5 = 311.5 mm |

The key alignment is **Y (height)**: `SURFACE_Z - box.max.y` ensures the GLTF model's top surface sits exactly at the deck surface level (100mm), with the model extending downward below.

### 3.3 Semi-Transparency

The deck model is rendered with 88% opacity (`opacity: 0.88`) so that:
- The deck structure remains visible
- Placed carriers and labware visually "pop" against the deck background
- Cover panels are distinguishable from active playing surfaces

---

## 4. Cover Panel Management

### 4.1 Purpose

The GLTF deck model includes **removable cover panels** at the 4 deck cutout positions. When a waste block or drawer fixture is installed, the corresponding panel is hidden to reveal the opening.

### 4.2 Panel Identification

Cover panels are identified by traversing the GLTF scene graph and matching node names/patterns:

```javascript
function collectDeckCoverNodes() {
    // Traverse vlState.gltfModel
    // Find nodes matching cover panel naming patterns
    // Cache references for fast toggling
}
```

### 4.3 Visibility Toggling

```javascript
function applyCutoutVisibility() {
    DECK_CUTOUTS.forEach((slot, idx) => {
        const visible = vlState.deckCutouts[idx];
        // Find cached cover panel node(s) for this cutout
        // Set node.visible = visible
    });
}
```

**State mapping**:

| Cutout Index | Track Range | Panel State | Meaning |
|-------------|------------|------------|---------|
| 0 | Tracks 20–28 | `vlState.deckCutouts[0]` | true=covered, false=open |
| 1 | Tracks 36–44 | `vlState.deckCutouts[1]` | true=covered, false=open |
| 2 | Tracks 46–54 | `vlState.deckCutouts[2]` | true=covered, false=open |
| 3 | Tracks 56–64 | `vlState.deckCutouts[3]` | true=covered, false=open |

---

## 5. Debug Positioning

### 5.1 Debug Offset System

The layout system supports debug offsets stored in `localStorage` for fine-tuning GLTF alignment:

```javascript
// Key: 'vl-deck-debug-offsets'
// Value: JSON { dx: 0, dy: 0, dz: 0 }

// Applied on top of calculated base position:
model.position.set(
    vlState._gltfBasePos.x + debugDx,
    vlState._gltfBasePos.y + debugDy,
    vlState._gltfBasePos.z + debugDz
);
```

This allows iterative adjustment of the deck model position without code changes.

---

## 6. Hamilton Native 3D Rendering (COM)

### 6.1 System 3D View Component

Hamilton's native 3D rendering uses a COM/.NET component:

| Component | File | Purpose |
|-----------|------|---------|
| `Hamilton.HxSys3DView.dll` | `Bin\` | 3D rendering engine |
| `Hamilton.HxSys3DView.xml` | `Bin\` | API documentation |
| `assimp-vc143-mt.dll` | `Bin\` | ASSIMP model loader |
| `d3dcompiler_47.dll` | `Bin\` | DirectX shader compiler |
| `libEGL.dll` / `libGLESv2.dll` | `Bin\` | OpenGL ES rendering |

### 6.2 COM Interfaces

| Interface | Version | Purpose |
|-----------|---------|---------|
| `IHxInstrument3DView` | v1 | Basic 3D instrument view |
| `IHxInstrument3DView2` | v2 | Colorization, hit testing, reload |
| `IHxInstrument3DView3` | v3 | Rubber band selection, position events |
| `IHxSystem3DView` | v1–v2 | System-level 3D rendering |
| `IHxLabware3DView` | — | Individual labware visualization |
| `IHxInstrument3DViewMultiSelect` | — | Multi-object selection |

### 6.3 Key API Methods

**Initialization:**
```
Initialize2(hWnd, instrumentDeck)
// hWnd: Window handle for rendering target
// instrumentDeck: IHxInstrumentDeck reference
```

**Object Selection:**
```
SelectObject(name)              // Select by name
SelectSite(labwareId, siteId)   // Select by labware + site
SelectedObject                   // Property: currently selected object
```

**Hit Testing:**
```
GetHitCoordinates(mouseX, mouseY, ref x, ref y, ref z)
// Returns 3D world coordinates at mouse position

GetHitSite(mouseX, mouseY, ref labwareId, ref siteId)
// Returns labware/site under mouse cursor
```

**Visualization:**
```
ColorizePositions(color, priority, positionArray)
// Colorize specified deck positions (e.g., highlight valid drop targets)

ReloadDeck()
// Reload entire deck geometry (after layout change)

ZoomFit()
// Auto-fit camera to show entire deck
```

**Copy/Paste:**
```
CopySelectedLabware()
PasteCopiedLabware(x, y)
// Clipboard operations for labware objects
```

### 6.4 Events

| Event | Args | Trigger |
|-------|------|---------|
| `MouseClick` | `IHxSys3DViewMouseEventArgs` | Single click in 3D view |
| `MouseDoubleClick` | `IHxSys3DViewMouseEventArgs` | Double click in 3D view |
| `RubberBandPositions` | `IHxSys3DViewPositionsEventArgs` | Rectangle selection |
| `ClickPosition` | Position data | Click tracking |
| `HoverPosition` | Position data | Mouse hover tracking |

### 6.5 Model Loading (ASSIMP)

The native renderer uses **ASSIMP** (Open Asset Import Library) for model loading:

```
assimp-vc143-mt.dll
├── Reads .x files (DirectX format)
├── Reads .gltf/.glb files (glTF format)
├── Handles embedded textures
└── Converts to internal mesh format for rendering
```

### 6.6 HxSys3DView.xml Configuration

```xml
<System3D>
    <Item Name="StarDeckModelPath" Value="..." />
    <Item Name="StarletDeckModelPath" Value="..." />
    <Item Name="VantageDeckModelPath" Value="..." />
</System3D>
```

Maps instrument types to deck model file paths, allowing the rendering engine to load the correct model for each instrument.

---

## 7. Model Pipeline Comparison

| Aspect | Hamilton Native (COM) | Web Viewer (Three.js) |
|--------|----------------------|----------------------|
| Deck models | GLTF via ASSIMP | GLTF via GLTFLoader |
| Labware models | .x/.hxx via ASSIMP | .x/.hxx via XFileLoader |
| Coordinate system | DirectX left-handed | Converted to Three.js right-handed |
| Rendering API | DirectX / OpenGL ES | WebGL |
| Hit testing | `GetHitSite()` / `GetHitCoordinates()` | `THREE.Raycaster` |
| Selection | `SelectObject()` / COM events | Material color change + outline |
| Transparency | Managed by DLL | Manual opacity + depthWrite control |
| Cover panels | Managed by DLL | Manual node visibility toggling |
