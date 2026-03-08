# Waste System Rendering

## Overview

The waste system is a critical deck fixture that occupies one of four removable deck panels. It sits below the deck surface through a cutout, routing liquid waste away from the working area. Rendering the waste system involves TML parsing, deck cutout management, 3D model loading with special coordinate handling, and collision detection with carriers.

---

## 1. Waste Block Architecture

### 1.1 Components

The waste system consists of:

| Component | File | Description |
|-----------|------|-------------|
| Waste body | `WasteBlock.tml` / `VStarWasteBlock_Config.tml` | Template with sites |
| Waste body 3D model | `WasteBlock.hxx` / `twoTWasteBlock.x` | 3D visualization |
| Waste chute | `waste2.rck` / `VStarWaste_2T.rck` | Main waste container rack |
| Chute 3D model | `Waste2.hxx` / `universal_waste_chute.x` | Chute visualization |
| Verification needles | `verification.rck` / `VOVVerificationSquare.rck` | Position verification |
| Teaching needles | `teachingneedleblock.rck` / `TeachingNeedle5ml.rck` | Teaching positions |
| CORE grip tool | `VStarCOREGripTool.rck` | CORE-Grip tool (Vantage) |

### 1.2 Waste Variants

| Variant | Dimensions (mm) | Tracks | Model |
|---------|-----------------|--------|-------|
| WasteBlock (ML STAR) | 30 × 445 × 122 | ~2T within cutout | WasteBlock.hxx |
| StarPlusWasteBlock (STAR+) | Similar | ~2T | StarPlusWasteBlock.hxx |
| VStarWasteBlock_2T_Config (Vantage) | 45 × 497 × 139.8 | 2T | twoTWasteBlock.x |
| VStarWasteBlock (various) | Various | Various | Various |
| VStarActiveWaste | Various | Various | Active waste model |

---

## 2. WasteBlock.tml (ML STAR Standard)

### 2.1 Dimensions

```
Dim.Dx = 30       ← Width (mm)
Dim.Dy = 445      ← Depth (mm)
Dim.Dz = 122      ← Height (mm)
```

### 2.2 Site Map

```
┌─────────────────────────────────────┐  Y=445 (back)
│                                     │
│  ┌──┐   Site 7: teachingneedleblock │  (2, 347, 75) 20×75
│  └──┘   ID=1                        │
│                                     │
│  [□]    Site 1: verification.rck    │  (0, 308, 87) 30×30
│         ID=3                         │
│                                     │
│                                     │
│ ┌────────────────────────┐          │
│ │                        │          │
│ │  Site 8: waste2.rck    │          │  (3, 87.5, 86) 150×220
│ │  ID=2 (INVISIBLE)      │          │
│ │  MAIN WASTE CHUTE      │          │
│ │                        │          │
│ └────────────────────────┘          │
│                                     │
│  [□]   Site 5: TeachingNeedle5ml   │  (5, 60, 110) 20×20
│        ID=7                         │
│                                     │
│  [□]   Site 2: verification.rck   │  (0, 28, 87) 30×30
│        ID=4                         │
│                                     │
│  ░░░   Site 3: (empty, invisible)  │  (-2.5, -44.95, 119) 45×45
│  ░░░   Site 4: (empty, invisible)  │  (-2.55, -45, 105) 45.1×45.1
│  ░░░   Site 6: (empty, invisible)  │  (0, -29.5, 105) 39×61
└─────────────────────────────────────┘  Y=0 (front)
```

### 2.3 Complete Site Table

| Site | ID | X | Y | Z | Dx | Dy | Labware | Visible |
|------|----|---|---|---|----|----|---------|---------|
| 1 | 3 | 0 | 308 | 87 | 30 | 30 | `verification.rck` | Yes |
| 2 | 4 | 0 | 28 | 87 | 30 | 30 | `verification.rck` | Yes |
| 3 | 5 | -2.5 | -44.95 | 119 | 45 | 45 | — | No |
| 4 | 6 | -2.55 | -45 | 105 | 45.1 | 45.1 | — | No |
| 5 | 7 | 5 | 60 | 110 | 20 | 20 | `TeachingNeedle5ml.rck` | Yes |
| 6 | 8 | 0 | -29.5 | 105 | 39 | 61 | — | No |
| 7 | 1 | 2 | 347 | 75 | 20 | 75 | `teachingneedleblock.rck` | Yes |
| 8 | 2 | 3 | 87.5 | 86 | 150 | 220 | `waste2.rck` | No |

**Note**: Site 8 (waste2.rck) is the main waste chute — 150×220mm, marked invisible (`Visible=0`). It extends beyond the template width (150mm > 30mm Dx) because the waste chute sits below the deck surface.

---

## 3. VStarWasteBlock_2T_Config.tml (Vantage 2-Track)

### 3.1 Dimensions

```
Dim.Dx = 45       ← Width (mm)
Dim.Dy = 497      ← Depth (mm) — full track depth
Dim.Dz = 139.8    ← Height (mm)
```

### 3.2 3D Model Offsets

```
3DModel = "twoTWasteBlock.x"
3DxOffset = "-107.6"    ← Large negative X offset (shifts model left)
3DyOffset = "15.3"      ← Shifts model backward
3DzOffset = "-7.8"      ← Shifts model downward
```

### 3.3 Complete Site Table (13 Sites)

| Site | ID | X | Y | Z | Dx | Dy | Labware | Purpose |
|------|----|---|---|---|----|----|---------|---------|
| 1 | 12 | 5 | 459.9 | 96.9 | 20 | 18 | `TeachingNeedleBlock_5ml.rck` | Teaching |
| 2 | 11 | 5 | 441.9 | 96.9 | 20 | 18 | — | Channel position |
| 3 | 10 | 5 | 423.9 | 96.9 | 20 | 18 | — | Channel position |
| 4 | 6 | 5 | 414.9 | 96.9 | 20 | 45 | `TeachingNeedleBlock_VStar_4.rck` | Teaching |
| 5 | 9 | 5 | 405.9 | 96.9 | 20 | 18 | — | Channel position |
| 6 | QCG | 5 | 356.9 | 139.8 | 38.9 | 85.8 | `VStarCOREGripTool.rck` | CORE-Grip tool |
| 7 | 8 | 5.45 | 350.9 | 115.8 | 18 | 18 | `VOVVerificationSquare.rck` | Verification |
| 8 | 3 | 5.45 | 100.9 | 115.8 | 18 | 18 | `VOVVerificationSquare.rck` | Verification |
| 9 | 13 | 5 | 81.9 | 96.9 | 20 | 18 | — | Channel position |
| 10 | 14 | 5 | 63.9 | 96.9 | 20 | 18 | — | Channel position |
| 11 | 5 | 5 | 54.9 | 96.9 | 20 | 45 | `TeachingNeedleBlock_VStar_4.rck` | Teaching |
| 12 | 15 | 5 | 45.9 | 96.9 | 20 | 18 | — | Channel position |
| 13 | 2 | 16 | 160.9 | 139.8 | 13 | 148 | `VStarWaste_2T.rck` | **Main waste** |

---

## 4. Deck Cutout System

### 4.1 Cutout Definitions

Four removable deck panels defined in `DECK_CUTOUTS`:

| Panel | Track Start | Track Span | X Start (mm) | Width (mm) | Track Range |
|-------|------------|-----------|-------------|-----------|-------------|
| 0 | 20 | 9 | 527.75 | 202.5 | Tracks 20–28 |
| 1 | 36 | 9 | 887.75 | 202.5 | Tracks 36–44 |
| 2 | 46 | 9 | 1112.75 | 202.5 | Tracks 46–54 |
| 3 | 56 | 9 | 1337.75 | 202.5 | Tracks 56–64 |

### 4.2 Cutout Width Calculation

```
cutoutWidth = trackSpan × TRACK_SPACING = 9 × 22.5 = 202.5 mm
```

### 4.3 Cover Panel Visibility

The GLTF deck model contains cover panel nodes at each cutout position. These are toggled when fixtures are installed/removed:

```javascript
vlState.deckCutouts = [true, true, true, true];  // All panels visible

// When waste installed at cutout 0:
vlState.deckCutouts[0] = false;  // Hide panel
applyCutoutVisibility();          // Update GLTF nodes
```

---

## 5. Waste Rendering Pipeline

### 5.1 Loading Phase

**`loadWasteTmlFromServer()`** executes during deck initialization:

```
1. Fetch TML text from server path:
   "Base Hamilton Files/Labware/ML_STAR/CORE/VStarWasteBlock_Config.tml"

2. Parse with parseTML(text) → extract:
   - viewName, dimensions (dx, dy, dz)
   - 3D model path (modelFileHamilton)
   - 3D offsets (model3DxOff, model3DyOff, model3DzOff)
   - All sites with labware references

3. Fetch 3D model (.x or .hxx)
   - If .hxx: decompress with HXXLoader
   - Parse with XFileLoader
   - Apply fixXFileCoords() (LH→RH)

4. Cache in vlState.xModelCache['__WASTE_CHUTE__']

5. Store parsed TML in vlState.wasteTmlDef
```

### 5.2 Installation Phase

**`installWasteAtCutout(cutoutIdx)`** executes when user enables waste:

```
1. Remove existing waste (if any)
2. If drawer at same cutout → remove drawer first
3. Record: vlState.wasteCutoutIdx = cutoutIdx
4. Hide cover panel: vlState.deckCutouts[cutoutIdx] = false
5. Calculate occupied tracks: getWasteOccupiedTracks()
6. Evict overlapping carriers (auto-remove)
7. Build waste mesh: buildWasteMesh(cutoutIdx)
8. Add to scene
9. Load site labware 3D models (async)
10. Update UI checkboxes
```

### 5.3 Mesh Building Phase

**`buildDeckFixtureMesh(cutoutIdx, tmlDef, cacheKey, groupName)`** positions the waste:

#### Step 1: Calculate Position

```javascript
const slot = DECK_CUTOUTS[cutoutIdx];
const cutoutWidth = slot.trackSpan * DECK.TRACK_SPACING;      // 202.5mm
const slotX = DECK.FIRST_TRACK_X + (slot.trackStart - 1) * DECK.TRACK_SPACING;

// Center waste body over cutout
const groupX = slotX + cutoutWidth / 2 - (def.dx / 2);
```

#### Step 2: Place Group

```javascript
group.position.set(groupX, DECK.SURFACE_Z, DECK.TRACK_Y_START);
// groupX = panel X center minus half template width
// Y = 100.0 (deck surface)
// Z = 63.0 (track front edge)
```

#### Step 3: Position Body 3D Model

```javascript
// Hamilton TML 3D offsets → Three.js coordinates:
const hamXOff = def.model3DxOff || 0;   // Ham X → Three X
const hamYOff = def.model3DyOff || 0;   // Ham Y → Three Z
const hamZOff = def.model3DzOff || 0;   // Ham Z → Three Y

xModel.position.set(
    def.dx / 2 - center.x + hamXOff,     // Center on width + X offset
    -box.min.y + hamZOff,                  // Base at 0 + Z offset (height)
    def.dy / 2 - center.z + hamYOff       // Center on depth + Y offset
);
```

For the Vantage 2T waste block:
- `hamXOff = -107.6` (large left shift — model is wider than template)
- `hamYOff = 15.3` (shift backward)
- `hamZOff = -7.8` (shift downward)

#### Step 4: Position Site Labware (with Y-Mirroring)

**Critical**: Site labware models undergo **Y-mirroring** to map Hamilton coordinate direction:

```javascript
// Mirror Y coordinate for correct front-to-back orientation
const mirroredY = (def.dy || 471.5) - site.y - site.dy;

siteModel.position.set(
    site.x + site.dx / 2 - sCenter.x + (cachedLw.xOff || 0),
    site.z - sBox.min.y + (cachedLw.zOff || 0),
    mirroredY + site.dy / 2 - sCenter.z + (cachedLw.yOff || 0)
);
```

The `mirroredY` formula flips the depth axis: Hamilton's Y=0 (front) maps to the opposite end in Three.js rendering, ensuring that waste components appear in the correct front-to-back positions.

#### Step 5: Procedural Fallback

When no 3D model is available, a placeholder box is rendered:

```javascript
BoxGeometry(max(def.dx, cutoutWidth), 200, def.dy)
// position: (def.dx/2, -100, def.dy/2)
// color: 0x404040, opacity: 0.7
```

The box extends 200mm downward from the deck surface to represent the waste cavity.

---

## 6. Collision Detection

### 6.1 Track Occupation

When waste is installed at a cutout, the occupied tracks are computed:

```javascript
function getWasteOccupiedTracks() {
    if (vlState.wasteCutoutIdx < 0) return new Set();
    const slot = DECK_CUTOUTS[vlState.wasteCutoutIdx];
    const tracks = new Set();
    for (let t = slot.trackStart; t < slot.trackStart + slot.trackSpan; t++) {
        tracks.add(t);
    }
    return tracks;
    // Example: Panel 0 → {20, 21, 22, 23, 24, 25, 26, 27, 28}
}
```

### 6.2 Carrier Eviction

When installing waste, any carrier whose tracks overlap the waste-occupied tracks is automatically removed:

```javascript
vlState.placedCarriers.forEach(function (carrier) {
    for (var t = carrier.trackStart; t < carrier.trackStart + carrier.def.tWidth; t++) {
        if (wasteTracks.has(t)) {
            toRemove.push(carrier.id);  // Mark for eviction
            break;
        }
    }
});
```

### 6.3 Placement Prevention

New carrier placement is blocked if any of the carrier's tracks would overlap waste-occupied tracks. The minimum placeable track is track 4 (tracks 1–3 are reserved).

---

## 7. Waste Removal

**`removeWaste()`** reverses the installation:

```
1. Dispose all mesh geometry and materials
2. Remove waste group from scene
3. Restore cover panel: vlState.deckCutouts[oldIdx] = true
4. Apply cutout visibility to GLTF model
5. Set vlState.wasteCutoutIdx = -1
6. Update UI checkbox state
```

---

## 8. Waste 3D Model Files

### 8.1 Available Models

| File | Format | Size | Description |
|------|--------|------|-------------|
| `WasteBlock.hxx` | HXX container | ~50KB | ML STAR waste body |
| `WasteBlock.x` | DirectX ASCII | ~200KB | ML STAR waste (uncompressed) |
| `wasteblock.gltf` + `.bin` | glTF 2.0 | ~100KB | ML STAR waste (GLTF) |
| `Waste2.hxx` | HXX container | ~30KB | Waste chute insert |
| `Waste2.x` | DirectX ASCII | ~150KB | Waste chute (uncompressed) |
| `waste2.gltf` + `.bin` | glTF 2.0 | ~80KB | Waste chute (GLTF) |
| `twoTWasteBlock.x` | DirectX ASCII | varies | Vantage 2T waste body |
| `universal_waste_chute.x` | DirectX ASCII | varies | Universal chute |
| `universal_waste_chute.gltf` + `.bin` | glTF 2.0 | varies | Universal chute (GLTF) |

### 8.2 Model Locations

Models are distributed across multiple directories:

```
C:\Program Files (x86)\Hamilton\Labware\ML_STAR\CORE\
  ├── WasteBlock.hxx
  ├── WasteBlock.x
  ├── wasteblock.gltf / .bin
  ├── Waste2.hxx
  ├── Waste2.x
  ├── waste2.gltf / .bin
  ├── twoTWasteBlock.x
  ├── universal_waste_chute.x
  └── universal_waste_chute.gltf / .bin

C:\Program Files (x86)\Hamilton\Labware\ML_STAR\VStarWastexxx\
  └── (variant-specific waste models)
```

---

## 9. Waste vs. Drawer Mutual Exclusion

Waste and drawer fixtures share the same cutout system:

- A cutout can hold **either** a waste block **or** a drawer, not both
- Installing waste at a cutout with a drawer removes the drawer first
- Installing a drawer at a cutout with waste removes the waste first
- Both use the same `buildDeckFixtureMesh()` function with different parameters
- Both share the same `DECK_CUTOUTS` positions and cover panel toggling

```javascript
// Waste uses:
buildDeckFixtureMesh(cutoutIdx, vlState.wasteTmlDef, '__WASTE_CHUTE__', '__waste__')

// Drawer uses:
buildDeckFixtureMesh(cutoutIdx, vlState.drawerTmlDef, '__DRAWER__', '__drawer__')
```
