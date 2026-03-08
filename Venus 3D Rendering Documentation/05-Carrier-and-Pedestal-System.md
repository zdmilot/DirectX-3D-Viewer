# Carrier & Pedestal System

## Overview

Hamilton VENUS uses a **modular carrier system** where carriers snap to deck tracks and contain numbered sites for labware placement. The MultiFlex (MFX) system extends this with interchangeable **pedestal modules** that mount on carrier bases.

---

## 1. Traditional Carriers

### 1.1 Carrier Library (Built-in Definitions)

The layout renderer maintains a `CARRIER_LIBRARY` object with pre-defined carriers:

| Key | View Name | Tracks | Dx×Dy×Dz (mm) | Sites | Color |
|-----|-----------|--------|---------------|-------|-------|
| `PLT_CAR_L5AC` | Plate Carrier L5 Landscape | 6T | 135×497×130 | 5 | 0x607080 |
| `PLT_CAR_L5PCR` | Plate Carrier L5 PCR | 6T | 135×497×130 | 5 | 0x607080 |
| `PLT_CAR_L5MD` | Plate Carrier L5 Medium Deck | 6T | 135×497×130 | 5 | 0x607080 |
| `PLT_CAR_L5_DWP` | Plate Carrier L5 Deep Well | 6T | 135×497×130 | 5 | 0x607080 |
| `TIP_CAR_480` | Tip Carrier 480 | 6T | 135×497×130 | 5 | 0x607080 |
| `RGT_CAR_12R` | Reagent Carrier 12 Trough | 6T | 135×497×130 | 12 | 0x607080 |
| `PLT_CAR_P3AC` | Plate Carrier P3 Portrait | 6T | 135×497×130 | 3 | 0x607080 |
| `TIP_CAR_288` | Tip Carrier 288 Portrait | 4T | 90×497×130 | 3 | 0x607080 |
| `SMP_CAR_32` | Sample Carrier 32 | 1T | 22.5×497×130 | 1 | 0x607080 |

### 1.2 Carrier Data Structure

Each carrier definition contains:

```javascript
{
    viewName:    'PLT_CAR_L5AC',       // Display name / lookup key
    description: 'Plate Carrier...',    // Human-readable description
    tWidth:      6,                     // Width in track units
    dx:          135,                   // X dimension (mm) = tWidth × 22.5
    dy:          497,                   // Y dimension (mm) = track depth
    dz:          130,                   // Z dimension (mm) = carrier height
    color:       0x607080,              // Default procedural mesh color
    modelFile:   'PLT_CAR_L5AC.hxx',   // Path to 3D model
    sites: [                           // Array of site definitions
        { id: 1, x: 4, y: 393, z: 81.77, dx: 127, dy: 86, labwareFile: '...' },
        { id: 2, x: 4, y: 297, z: 81.77, dx: 127, dy: 86 },
        // ...
    ]
}
```

### 1.3 Site Position Patterns

#### 5-Position Landscape Carrier (e.g., PLT_CAR_L5_DWP)

Sites are numbered from back (highest Y) to front (lowest Y):

```
                  ┌─────────────────────┐  Y=497 (back)
                  │   ┌─────────────┐   │
                  │   │   Site 1    │   │  Y=393, Z=81.77
                  │   └─────────────┘   │
                  │   ┌─────────────┐   │
                  │   │   Site 2    │   │  Y=297
                  │   └─────────────┘   │
                  │   ┌─────────────┐   │
                  │   │   Site 3    │   │  Y=201
                  │   └─────────────┘   │
                  │   ┌─────────────┐   │
                  │   │   Site 4    │   │  Y=105
                  │   └─────────────┘   │
                  │   ┌─────────────┐   │
                  │   │   Site 5    │   │  Y=9
                  │   └─────────────┘   │
                  └─────────────────────┘  Y=0 (front)
              X=0                     X=135
```

Each site has X=4mm inset from left edge, ~96mm Y spacing between sites, and Z=81.77mm (site shelf height).

#### 3-Position Portrait Carrier (e.g., PLT_CAR_P3AC)

```
                  ┌──────────────────────┐  Y=497
                  │  ┌──────────┐        │
                  │  │  Site 1  │(rotated)│  Y=393, Dx=86, Dy=127
                  │  └──────────┘        │
                  │  ┌──────────┐        │
                  │  │  Site 2  │        │  Y=247
                  │  └──────────┘        │
                  │  ┌──────────┐        │
                  │  │  Site 3  │        │  Y=101
                  │  └──────────┘        │
                  └──────────────────────┘  Y=0
```

Portrait sites swap Dx/Dy (86×127 instead of 127×86).

#### 12-Position Reagent Carrier (RGT_CAR_12R)

```
                  ┌──────────────────────┐  Y=497
                  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
                  │ │ 1│ │ 2│ │ 3│ │ 4│ │  Row 1 (back)
                  │ └──┘ └──┘ └──┘ └──┘ │
                  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
                  │ │ 5│ │ 6│ │ 7│ │ 8│ │  Row 2
                  │ └──┘ └──┘ └──┘ └──┘ │
                  │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
                  │ │ 9│ │10│ │11│ │12│ │  Row 3 (front)
                  │ └──┘ └──┘ └──┘ └──┘ │
                  └──────────────────────┘  Y=0
```

---

## 2. Carrier Mesh Building

### 2.1 `buildCarrierMesh(carrierDef, trackStart)` → `{group, siteMeshes}`

#### Step 1: Positioning

```javascript
const x0 = DECK.FIRST_TRACK_X + (trackStart - 1) * DECK.TRACK_SPACING;
const y0 = DECK.TRACK_Y_START;  // 63.0
const z0 = DECK.SURFACE_Z;      // 100.0

group.position.set(x0, z0, y0);  // Ham X→X, Ham Z→Y, Ham Y→Z
```

#### Step 2: Body Model (if cached .x model exists)

1. Deep-clone from `vlState.xModelCache[cacheKey]`
2. Clone materials for independent selection highlighting
3. Apply transparency to polycarbonate-like materials (blue-dominant colors → opacity 0.4)
4. Center on TML footprint:
   ```javascript
   xModel.position.set(
       carrierDef.dx / 2 - modelCenter.x,   // Center X on width
       -box.min.y,                            // Base at y=0
       carrierDef.dy / 2 - modelCenter.z      // Center Z on depth
   );
   ```
5. Name: `__carrier_body_x__`

#### Step 3: Procedural Fallback (no .x model available)

When no 3D model is cached:

```
Body box: BoxGeometry(dx, dz×0.15, dy)
  Position: (dx/2, dz×0.075, dy/2)
  Color: carrier.color, opacity 0.92

Left rail: BoxGeometry(4, dz×0.65, dy)
  Position: (2, railH/2 + dz×0.15, dy/2)

Right rail: BoxGeometry(4, dz×0.65, dy)
  Position: (dx-2, railH/2 + dz×0.15, dy/2)
```

#### Step 4: Site Wells

For each site in `carrierDef.sites`:

```
Site well: BoxGeometry(site.dx, 6, site.dy)
  Position: (site.x + site.dx/2, site.z - dz×0.10, site.y + site.dy/2)
  Color: 0x1a2530 (dark blue)
  Visibility: hidden if .x model present (raycast-only)
  Name: __site_{id}__
  userData: { siteId, siteData }
```

#### Step 5: Site Labware Models

For each site with `labwareFile`:

1. Look up `vlState.siteModelCache[lwKey]`
2. Deep-clone the cached model
3. Position within carrier local space:
   ```javascript
   siteModel.position.set(
       site.x + site.dx/2 - center.x + rckInfo.xOff,
       site.z - box.min.y + rckInfo.zOff,
       site.y + site.dy/2 - center.z + rckInfo.yOff
   );
   ```

---

## 3. MultiFlex (MFX) Carrier System

### 3.1 Configuration Files

| File | Location | Purpose |
|------|----------|---------|
| `StarCarriers.xml` | `Config\` | Defines carrier base types (4 types) |
| `StarCarrierPedestals.xml` | `Config\` | Defines pedestal modules (60+ types) |
| `MFXCreation\` | `Labware\ML_STAR\` | 530+ files: models, templates, images |

### 3.2 Carrier Base Types

From `StarCarriers.xml`:

#### 5-Position Base (Part# 188039)
```xml
<carrier 
    displayName="5 Position"
    displayPartNumber="188039"
    dimensions="135,497,18"
    modelFilePath="ML_STAR\MFXCreation\Base - 5 Position.x"
    sitePedestalOffsets="[67.5,435.5,0];[67.5,339.5,0];[67.5,243.5,0];[67.5,147.5,0];[67.5,51.5,0]"
    sitePedestalTypes="[TurnTable,LidParkBack,Standard];[HeatCool,Standard];[HeatCool,Standard];[HeatCool,Standard];[HeatCool,LidPark,Standard]"
    modelOffsets="0,0,0"
    modelEdgeOffsets="0,-2.5,0" />
```

| Field | Value | Description |
|-------|-------|-------------|
| `dimensions` | 135,497,18 | Base plate: 135mm wide, 497mm deep, 18mm tall |
| `sitePedestalOffsets` | 5 centroids | Center point (X,Y,Z) for each pedestal position |
| `sitePedestalTypes` | 5 type-lists | Compatible pedestal types at each position |
| `modelOffsets` | 0,0,0 | 3D model alignment in Deck Editor |
| `modelEdgeOffsets` | 0,-2.5,0 | Edge alignment between 3D model and template rectangle |

#### 4-Position Base (Part# 188039)
```
dimensions="135,497,18"
sitePedestalOffsets="[67.5,387.5,0];[67.5,291.5,0];[67.5,195.5,0];[67.5,99.5,0]"
modelEdgeOffsets="0,-3,0"
```

#### 4-Position Shaker Base (Part# 187001/55574-01)
```
dimensions="157.5,497,8"              ← Wider than standard (7 tracks)
sitePedestalOffsets="[78.75,418.05,0];[78.75,298.05,0];[78.75,178.05,0];[78.75,58.05,0]"
modelEdgeOffsets="0,-29.5,0"          ← Large Y edge offset
```

#### 3-Position Portrait Base (Part# 188053)
```
dimensions="112.5,497,18"             ← 5 tracks wide
sitePedestalOffsets="[65,393,0];[65,247,0];[65,101,0]"
modelEdgeOffsets="0,-3.5,0"
```

### 3.3 Pedestal Position Layout

The `sitePedestalOffsets` field defines the **center point** (X,Y) of each pedestal position on the carrier base:

```
5-Position Base Pedestal Centers:

    ┌─────────────────────────┐  Y=497
    │                         │
    │     ⊕ (67.5, 435.5)    │  Position 1 (back)
    │                         │
    │     ⊕ (67.5, 339.5)    │  Position 2
    │                         │
    │     ⊕ (67.5, 243.5)    │  Position 3
    │                         │
    │     ⊕ (67.5, 147.5)    │  Position 4
    │                         │
    │     ⊕ (67.5, 51.5)     │  Position 5 (front)
    │                         │
    └─────────────────────────┘  Y=0
X=0        X=67.5          X=135
```

All pedestals center at X=67.5mm (half of 135mm carrier width). Y spacing: ~96mm.

### 3.4 Pedestal Type Compatibility

Each carrier position specifies which pedestal types can mount there:

```
Position 1: [TurnTable, LidParkBack, Standard]
Position 2: [HeatCool, Standard]
Position 3: [HeatCool, Standard]
Position 4: [HeatCool, Standard]
Position 5: [HeatCool, LidPark, Standard]
```

The `pedestalType` field in `StarCarrierPedestals.xml` links pedestal definitions to these type labels.

---

## 4. Pedestal Definitions

### 4.1 Pedestal Attributes

From `StarCarrierPedestals.xml`:

| Attribute | Type | Description |
|-----------|------|-------------|
| `displayName` | string | Shown in pedestal dropdown selection |
| `displayPartNumber` | string | Hamilton part number |
| `pedestalType` | string | Type key matching carrier `sitePedestalTypes` |
| `templateFilePath` | string | Path to pedestal `.tml` file |
| `modelFilePath` | string | Path to pedestal `.x` 3D model |
| `imageFilePath` | string | Path to pedestal preview `.png` |
| `modelOffsetsOverride` | string | `"x,y"` — Override 3D model positioning |
| `sitesOffsetsOverride` | string | `"x,y"` — Override template site positioning |
| `oversized` | string | `"-1"` / `"1"` / `"[-1,1]"` — Block neighboring positions |

### 4.2 Pedestal Categories

#### Thermal Modules

| Display Name | Part# | Type | Model Offsets | Sites Offsets | Oversized |
|-------------|-------|------|--------------|--------------|-----------|
| Heating Module | 188045 | HeatCool | 0,47 | 0,16.5 | -1 |
| Heating Module (Brackets) | 188045 | HeatCoolShaker | 0,76 | 0,46 | -1 |
| Cooling Module | 188046 | HeatCool | 0,47 | 0,16.5 | -1 |
| Cooling Module (Brackets) | 188046 | HeatCoolShaker | 0,76 | 0,46 | -1 |

The Heating and Cooling modules are **oversized** (`oversized="-1"`), meaning they block the previous pedestal position (the one closer to the back of the carrier).

#### Lid Park Modules

| Display Name | Part# | Type | Model Offsets | Sites Offsets |
|-------------|-------|------|--------------|--------------|
| Lid Park Module | 188058APE | LidPark | 0,-2 | 0,-12 |
| Lid Park Module (Back) | 188058APE | LidParkBack | 0,5 | 0,12 |
| Lid Park Module (Brackets) | 188058APE | LidParkShaker | 0,-2 | 0,-12 |
| Lid Park Module (Back, Brackets) | 188058APE | LidParkBackShaker | 0,5 | 0,12 |

Note: "Back" variants have positive Y offsets (shift toward back), while regular variants shift forward.

#### Turn Table Module

| Display Name | Part# | Type | Model Offsets | Sites Offsets | Oversized |
|-------------|-------|------|--------------|--------------|-----------|
| Turn Table Module | 188055APE | TurnTable | 0,-49 | 0,-48 | 1 |

Large negative Y offsets (extends forward), blocks the **next** pedestal position (closer to front).

#### Standard Pedestal Variants

| Display Name | Part# | Type |
|-------------|-------|------|
| Tip Stack Standard | 188062 | Standard |
| Tip Stack Standard (Brackets) | 188062 | StandardShaker |
| Tip Stack Low | 188062 | Standard |
| Tip Stack Low (Brackets) | 188062 | StandardShaker |
| Stacker Module | 188044 | Standard / StandardShaker |
| Stacker Module (Portrait) | 188059 | StandardPortrait |

#### Tube Modules

| Display Name | Part# | Type |
|-------------|-------|------|
| Tube Module | 188048 | Standard |
| Tube Module (Brackets) | 188048 | StandardShaker |
| Tube Module Mixed | 188307 | Standard |
| Tube Module Mixed (Brackets) | 188307 | StandardShaker |

#### Specialized Modules (additional categories)

- **DWP Pedestals** — Deep Well Plate (HP Flat, HP Raised, HP Tabbed, Nest variants)
- **MTP Pedestals** — Microtest Plate (HP Flat, HP Raised, HP Tabbed, Nest variants)
- **PCR Pedestals** — PCR 96/384 variants
- **NTR Pedestals** — NTR1/NTR4 variants  
- **MIDI Pedestals** — MIDI format variants
- **HHS Pedestals** — Hamilton Heat Shaker variants
- **Teleshake Pedestals** — DWP/MTP/95 variants
- **RGT Pedestals** — Reagent trough variants (standard, 8 Refill, 96 Refill)
- **Gravity Waste** — Waste chute pedestals
- **Tilt Module** — Tilting pedestal variants
- **Byonoy** — Absorbance reader pedestals (Park, Reader)
- **Tip Module/Tip Park** — Tip handling pedestals
- **Tip Isolator** — Tip isolation pedestals

### 4.3 Oversized Pedestal Blocking

The `oversized` field determines which neighboring pedestal positions are unavailable:

| Value | Meaning | Blocked Position(s) |
|-------|---------|---------------------|
| (empty) | Standard size — fits one position | None |
| `"-1"` | Extends backward | Previous position (closer to back) |
| `"1"` | Extends forward | Next position (closer to front) |
| `"[-1,1]"` | Extra-wide | Both adjacent positions |

**Example**: Heating Module at Position 3 (`oversized="-1"`) blocks Position 2.

---

## 5. Offset System

### 5.1 Offset Hierarchy

When rendering a carrier with pedestals, offsets are applied in layers:

```
Layer 1: Carrier base position (track snap)
  ├── Layer 2: sitePedestalOffsets (pedestal center on base)
  │     ├── Layer 3a: modelOffsetsOverride (3D model alignment)
  │     └── Layer 3b: sitesOffsetsOverride (TML template alignment)
  └── Layer 2: modelEdgeOffsets (base model edge alignment)
```

### 5.2 modelOffsets vs modelEdgeOffsets

- **`modelOffsets`** — Shifts the final composed carrier 3D model for alignment in the Deck Editor view. Used at the carrier level.
- **`modelEdgeOffsets`** — Shifts the carrier base 3D model to align with actual pedestal positions. Compensates for model geometry not being centered on the physical base.

**Example**: 5-Position base has `modelEdgeOffsets="0,-2.5,0"`, meaning the base model needs to shift 2.5mm backward to align visually with pedestal positions.

### 5.3 Pedestal modelOffsetsOverride

Shifts the pedestal 3D model relative to the `sitePedestalOffsets` center point:

```
Heating Module: modelOffsetsOverride="0,47"
→ Pedestal 3D model shifted 47mm toward the back from pedestal center
→ This accounts for the heating module extending 47mm beyond its center point

Turn Table Module: modelOffsetsOverride="0,-49"
→ Pedestal 3D model shifted 49mm toward the front
```

### 5.4 Pedestal sitesOffsetsOverride

Shifts the pedestal `.tml` template sites relative to the `sitePedestalOffsets` center:

```
Heating Module: sitesOffsetsOverride="0,16.5"
→ Labware sites shift 16.5mm toward the back
→ The labware sits offset from the pedestal center due to module geometry
```

---

## 6. MFXCreation Directory Structure

Located at `C:\Program Files (x86)\Hamilton\Labware\ML_STAR\MFXCreation\` with 530+ files:

| File Pattern | Count | Purpose |
|-------------|-------|---------|
| `Base - *.x` | 4 | Carrier base 3D models |
| `Base - *.tml` | 4 | Carrier base templates |
| `Base - *.png` | 4 | Carrier base preview images |
| `Pedestal - *.x` | ~100 | Pedestal 3D models (all variants) |
| `Pedestal - *.tml` | ~100 | Pedestal templates |
| `Pedestal - *.png` | ~60 | Pedestal preview images |
| `Rack - *.rck` | ~20 | Rack definitions for pedestal accessories |
| `Rack - *.x` | ~20 | Rack 3D models |
| `Container - *.ctr` | ~15 | Container/well definitions |
| `transparent.x` | 1 | Utility transparent model |
