# Deck Layout System

## Overview

The deck layout system defines how the physical instrument deck is structured — tracks, carriers, labware, and fixtures. The deck is divided into a grid of **tracks** along the X-axis, with carriers snapping to track positions.

---

## 1. Deck File: `ML_STAR.dck`

Located at `C:\Program Files (x86)\Hamilton\Config\ML_STAR.dck`

### 1.1 Deck Dimensions

```
Dim.Dx = 1600.0    ← Total deck width (mm)
Dim.Dy = 520.0     ← Total deck depth (mm)
```

### 1.2 Main Track Sites (54)

The deck defines 54 physical tracks, each as a `Site` entry:

```
Site.Cnt, "54"

Site.1.X,  "100.25"    Site.1.Y, "63.0"    Site.1.Z, "100.0"
Site.2.X,  "122.75"    Site.2.Y, "63.0"    Site.2.Z, "100.0"
Site.3.X,  "145.25"    Site.3.Y, "63.0"    Site.3.Z, "100.0"
...
Site.54.X, "1292.75"   Site.54.Y, "63.0"   Site.54.Z, "100.0"
```

All tracks share:
- `Dx` = 22.0 mm (track width)
- `Dy` = 497.0 mm (track depth, front-to-back)
- `Y` = 63.0 mm (front edge Y position)
- `Z` = 100.0 mm (deck surface height)

### 1.3 Track Position Verification

```
Track 1:   X = 100.25
Track 2:   X = 100.25 + 22.5 = 122.75   ✓
Track 3:   X = 100.25 + 45.0 = 145.25   ✓
Track 54:  X = 100.25 + 53×22.5 = 1292.75  ✓
```

### 1.4 Labeled Tracks

Tracks with `Label = "1"` show visible track numbers in the editor:

```
Labeled: 1, 7, 13, 19, 25, 31, 37, 43, 49
Pattern: Every 6th track starting from 1
```

This corresponds to carrier column boundaries (6 tracks × 22.5mm = 135mm per column).

### 1.5 Reference Target

```
Target.1.X = 1147.75    ← Home/reference X position
Target.1.Y = 0.0
Target.1.Z = 0.0
```

---

## 2. External Sites (ExSite)

External sites define pre-positioned labware drop targets at specific Z-heights, enabling the layout editor to show valid placement areas.

### 2.1 External Site Categories

| Prefix | Count | Z Height | Footprint (Dx × Dy) | Purpose |
|--------|-------|----------|---------------------|---------|
| `PL` | PL1–PL54 | 211.75 mm | 127 × 86 | SBS plate positions (Landscape) |
| `DWL` | DWL1–DWL45 | 186.15 mm | 127 × 86 | Deep-well plate positions (Landscape) |
| `DWP` | DWP1–DWP45 | 186.15 mm | 86 × 127 | Deep-well plate positions (Portrait) |
| `TL` | TL1–TL45 | 214.90 mm | 127 × 86 | Tip rack positions (Landscape) |
| `TP` | TP1–TP27 | 214.90 mm | 86 × 127 | Tip positions (Portrait) |
| `AT` | AT1–AT9 | 177.75 mm | 127 × 86 | Aspiration tool positions |
| `TC` | TC1–TC9 | varies | varies | Temperature-controlled positions |

### 2.2 PL Grid Layout (9 columns × 5 rows = 45 positions)

```
         Col A    Col B    Col C    Col D    Col E    Col F    Col G    Col H    Col I
         T1-6    T7-12   T13-18  T19-24  T25-30  T31-36  T37-42  T43-48  T49-54
Row 1    PL1     PL6     PL11    PL16    PL21    PL26    PL31    PL36    PL41
  Y=455  (104)   (239)   (374)   (509)   (644)   (779)   (914)   (1049)  (1184)

Row 2    PL2     PL7     PL12    PL17    PL22    PL27    PL32    PL37    PL42
  Y=359

Row 3    PL3     PL8     PL13    PL18    PL23    PL28    PL33    PL38    PL43
  Y=263

Row 4    PL4     PL9     PL14    PL19    PL24    PL29    PL34    PL39    PL44
  Y=167

Row 5    PL5     PL10    PL15    PL20    PL25    PL30    PL35    PL40    PL45
  Y=71
```

Column X spacing: 135mm (matching 6-track carrier widths).
Row Y spacing: ~96mm (SBS depth 86mm + ~10mm gap).

### 2.3 Extended External Sites (PL46+)

Additional external sites `PL46`–`PL54` extend the grid to include tool carriers and non-standard positions beyond the standard 45-position grid.

---

## 3. Procedural Deck Geometry

When the 3D deck viewer initializes, it creates procedural geometry before the GLTF model loads:

### 3.1 `buildDeckGeometry()` Output

| Element | Geometry | Size | Position | Name |
|---------|----------|------|----------|------|
| Deck surface | BoxGeometry | deckW × 4 × deckD | (center, SURFACE_Z-2, center) | `__decksurf__` |
| Track slots (×54–80) | BoxGeometry | 22 × 2.5 × 497 | (trackX, SURFACE_Z+1.25, center) | `__track_{i}__` |
| Track labels | Canvas sprites | 14 × 14 | Above tracks | `__tracklabel_{n}__` |
| Front rail | BoxGeometry | deckW × 8 × 6 | (center, SURFACE_Z+4, Y_START-4) | `__rail_front__` |
| Back rail | BoxGeometry | deckW × 8 × 6 | (center, SURFACE_Z+4, Y_START+D+4) | `__rail_back__` |
| Grid overlay | GridHelper | 2000 × 2000, div=22.5 | (gridCenter, SURFACE_Z+4.1, 310) | `__vlgrid__` |

### 3.2 Track Color Coding

| Track Type | Light Mode | Dark Mode |
|------------|-----------|-----------|
| Labeled tracks (1,7,13,...) | 0x8fa8c0 | 0x2a3d55 |
| Normal tracks | 0xb0bfcf | 0x151f2a |
| Track 4 label | Red (#ee2222) | Red (#ee2222) |

Track 4 is highlighted in red as a reference point.

### 3.3 Track Label Rendering

Labels are rendered as **canvas sprites**:
- Canvas size: 64 × 64 pixels
- Font: Bold 28px sans-serif
- Color: White (#ffffff), except Track 4 (Red #ee2222)
- Sprite scale: 14 × 14 world units
- Positioned: 12mm above deck surface, 12mm beyond rear rail

---

## 4. GLTF Deck Model

### 4.1 Loading

```javascript
loadDeckModel() {
    // Load from 'DeckLayoutManager/vantage_20_deck.gltf'
    // Apply transparent materials (opacity 0.88)
    // Position at DECK.SURFACE_Z level
    // Hide procedural geometry when GLTF loads
}
```

### 4.2 Cover Panel System (Deck Cutouts)

The GLTF model includes removable cover panels at 4 positions. These panels hide when waste blocks or drawers are installed.

**DECK_CUTOUTS** array:

| Panel | Track Start | Track Span | Width (mm) |
|-------|------------|-----------|-----------|
| Panel 0 | Track 20 | 9 tracks | 202.5 |
| Panel 1 | Track 36 | 9 tracks | 202.5 |
| Panel 2 | Track 46 | 9 tracks | 202.5 |
| Panel 3 | Track 56 | 9 tracks | 202.5 |

**Visibility state**: `vlState.deckCutouts = [true, true, true, true]`
- `true` = panel visible (no fixture installed)
- `false` = panel hidden (waste or drawer occupies cutout)

**`applyCutoutVisibility()`** traverses the GLTF scene graph to show/hide cover panel nodes.

---

## 5. Carrier Placement

### 5.1 Snap-to-Track Logic

When a user clicks a track to place a carrier:

1. **Raycast** against track meshes to find clicked track number
2. **Calculate starting track**: Snap to track number
3. **Width check**: Ensure `trackStart + carrier.tWidth - 1 ≤ PHYSICAL_TRACKS`
4. **Overlap check**: Ensure no existing carrier occupies the required tracks
5. **Waste/fixture check**: Ensure carrier tracks don't overlap waste-occupied tracks

### 5.2 Carrier Instance State

Placed carriers are stored in `vlState.placedCarriers`:

```javascript
{
    carrierKey: 'PLT_CAR_L5AC',     // Carrier library key
    trackStart: 7,                   // Starting track number
    group: THREE.Group,              // 3D mesh group
    siteMeshes: [THREE.Mesh, ...],   // Individual site hit meshes
    def: { ... }                     // Full carrier definition
}
```

### 5.3 Carrier Collision Masks

Each placed carrier occupies a range of tracks:

```
Occupied tracks = [trackStart, trackStart + tWidth - 1]
Example: PLT_CAR_L5AC at track 7 → occupies tracks 7, 8, 9, 10, 11, 12
```

---

## 6. Initialization Flow

### 6.1 `initVantageLayout()` Sequence

1. **State init** — Dark mode detection, canvas element lookup
2. **Three.js scene** — Create scene, camera (45° FOV), renderer (antialias + alpha)
3. **Camera setup** — Position: `(deckCenterX, 1600, 600)`, target: `(deckCenterX, 0, 280)`
4. **Controls** — OrbitControls with damping
5. **Lights** — Ambient 0xaaaaaa + 2 directional lights
6. **Raycaster** — Invisible PlaneGeometry(3000, 3000) at deck surface for mouse hit testing
7. **Deck geometry** — `buildDeckGeometry()` creates procedural tracks, rails, labels, grid
8. **GLTF model** — `loadDeckModel()` asynchronous fetch of GLTF deck model
9. **Carrier preload** — `preloadBuiltinCarrierModels()` fetches all `.x`/`.hxx` carrier models
10. **Waste preload** — `loadWasteTmlFromServer()` fetches waste TML, parses, loads 3D model
11. **Drawer preload** — `loadDrawerTmlFromServer()` fetches drawer TML, parses, loads 3D model
12. **Render loop** — `requestAnimationFrame` loop with orbit controls update

### 6.2 Model Preloading

**`preloadBuiltinCarrierModels()`** fetches all carrier 3D models asynchronously:

```
For each carrier in CARRIER_LIBRARY:
  1. Resolve model path → server URL
  2. Fetch as ArrayBuffer
  3. If .hxx → decompress with HXXLoader
  4. Parse .x text with XFileLoader
  5. Apply fixXFileCoords() (LH → RH conversion)
  6. Cache in vlState.xModelCache[cacheKey]
```

Cache key: carrier `viewName` uppercased with spaces → underscores.

---

## 7. Layout State Management

### 7.1 `vlState` Object

```javascript
vlState = {
    initialized:      false,
    scene:            THREE.Scene,
    camera:           THREE.PerspectiveCamera,
    renderer:         THREE.WebGLRenderer,
    controls:         THREE.OrbitControls,
    
    // Deck model
    gltfModel:        THREE.Group,          // Loaded GLTF deck mesh
    deckCutouts:      [true, true, true, true],  // Cover panel visibility
    
    // Carrier state
    placedCarriers:   [],                   // Array of placed carrier instances
    xModelCache:      {},                   // carrierKey → THREE.Group (3D model cache)
    siteModelCache:   {},                   // lwKey → {group, xOff, yOff, zOff}
    siteModelLoading: {},                   // lwKey → boolean
    
    // Fixture state
    wasteCutoutIdx:   -1,                   // Currently installed waste cutout (-1 = none)
    drawerCutoutIdx:  -1,                   // Currently installed drawer cutout (-1 = none)
    wasteTml:         null,                 // Parsed waste TML definition
    drawerTml:        null,                 // Parsed drawer TML definition
    wasteXModel:      null,                 // Preloaded waste 3D model
    drawerXModel:     null,                 // Preloaded drawer 3D model
    wasteGroup:       null,                 // Installed waste THREE.Group
    drawerGroup:      null,                 // Installed drawer THREE.Group
    
    // Interaction
    selectedCarrier:  null,                 // Currently selected placed carrier
    hoverTrack:       null,                 // Currently hovered track number
}
```
