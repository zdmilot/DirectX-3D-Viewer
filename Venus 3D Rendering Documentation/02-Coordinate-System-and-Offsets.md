# Coordinate System & Offsets

## Overview

Hamilton VENUS uses a millimeter-based coordinate system throughout. Every dimension, position, and offset in the system is expressed in **millimeters (mm)**. Understanding the coordinate system is critical for correctly placing 3D models on the deck.

---

## 1. Hamilton Native Coordinate System

### 1.1 Axis Definitions

In the Hamilton coordinate system (as defined in `.tml`, `.dck`, and `.rck` files):

| Hamilton Axis | Direction | Description |
|---------------|-----------|-------------|
| **X** | Left → Right | Width axis. Track positions along the deck rails. |
| **Y** | Front → Back | Depth axis. Along the carrier from front to back. |
| **Z** | Bottom → Top | Height axis. Deck surface at Z=100mm. |

### 1.2 Origin Point

The deck origin (0, 0, 0) is at the **front-left corner** of the instrument:

- **X = 0**: Left edge of the physical deck
- **Y = 0**: Front edge of the deck (operator side)
- **Z = 0**: Base of the instrument (below the deck surface)

The deck surface sits at **Z = 100.0 mm** above the origin.

### 1.3 Key Reference Points (ML_STAR Deck)

From `C:\Program Files (x86)\Hamilton\Config\ML_STAR.dck`:

```
Dim.Dx = 1600.0    ← Total deck width (mm)
Dim.Dy = 520.0     ← Total deck depth (mm)
Dim.Dz = 0.0       ← (unused in deck definition)

Site.1.X = 100.25  ← X of first track center
Site.1.Y = 63.0    ← Y of track front edge
Site.1.Z = 100.0   ← Z of deck surface

Target.1.X = 1147.75  ← Home/reference position X
Target.1.Y = 0.0
Target.1.Z = 0.0
```

---

## 2. Track System

### 2.1 Track Spacing

The deck is divided into **tracks** — vertical slots running front-to-back along the deck rails. Carriers snap to tracks.

| Constant | Value | Description |
|----------|-------|-------------|
| `TRACK_SPACING` | **22.5 mm** | Center-to-center distance between adjacent tracks |
| `TRACK_WIDTH` | **22.0 mm** | Physical width of each track slot |
| `TRACK_GAP` | **0.5 mm** | Gap between adjacent track slots |
| `TRACK_DEPTH` | **497.0 mm** | Front-to-back rail length |
| `TRACK_Y_START` | **63.0 mm** | Y position of the front edge of all tracks |
| `FIRST_TRACK_X` | **100.25 mm** | X center of Track 1 |
| `PHYSICAL_TRACKS` | **54** | Number of tracks on the physical deck |
| `SURFACE_Z` | **100.0 mm** | Z height of the deck surface |

### 2.2 Track Position Formula

```
Track_Center_X(n) = 100.25 + (n - 1) × 22.5    [mm, 1-indexed]
```

**Examples:**
| Track # | X Center (mm) | Notes |
|---------|--------------|-------|
| 1 | 100.25 | First track |
| 7 | 235.25 | Labeled track |
| 13 | 370.25 | Labeled track |
| 19 | 505.25 | Labeled track |
| 25 | 640.25 | Labeled track |
| 31 | 775.25 | Labeled track |
| 37 | 910.25 | Labeled track |
| 43 | 1045.25 | Labeled track |
| 49 | 1180.25 | Labeled track |
| 54 | 1292.75 | Last physical track |

### 2.3 Labeled Tracks

Tracks 1, 7, 13, 19, 25, 31, 37, 43, 49 (and extended: 55, 61, 67, 73, 79) have visible labels in the deck view. The labeling pattern is every 6 tracks starting from track 1, matching the standard 6-track carrier width.

### 2.4 Site Definitions in `.dck`

Each track on the deck is defined as a `Site` entry. From `ML_STAR.dck`:

```
Site.1.Dx, "22.0"        ← Track slot width
Site.1.Dy, "497.0"       ← Track slot depth (front-to-back)
Site.1.Id, "1"           ← Track number
Site.1.Label, "1"        ← Labeled (1) or unlabeled (0)
Site.1.SnapBase, "1"     ← Carriers snap to this track
Site.1.X, "100.25"       ← X position (left edge)
Site.1.Y, "63.0"         ← Y position (front edge)
Site.1.Z, "100.0"        ← Z position (deck surface)
```

---

## 3. External Sites (ExSite)

The `.dck` file also defines **External Sites** — pre-defined positions for specific labware types. These are used by the deck editor to show drop targets.

### 3.1 External Site Types

| Prefix | Type | Z Height | Example Use |
|--------|------|----------|-------------|
| `PL` | Plate Position (Landscape) | 211.75 mm | 96-well plate positions on plate carriers |
| `DWL` | Deep Well Landscape | 186.15 mm | Deep well plate positions |
| `DWP` | Deep Well Portrait | 186.15 mm | Portrait-oriented deep well positions |
| `TL` | Tip Location (Landscape) | 214.90 mm | Tip rack positions on tip carriers |
| `TP` | Tip Portrait | 214.90 mm | Portrait-oriented tip positions |
| `AT` | Aspiration Tool | 177.75 mm | 96/384 head tool positions |
| `TC` | Temperature Controlled | Various | Heated/cooled positions |

### 3.2 External Site Grid Pattern

Plate positions (`PL1`–`PL45`) form a 9×5 grid:

```
Y\X     104    239    374    509    644    779    914   1049   1184
455.4   PL1    PL6    PL11   PL16   PL21   PL26   PL31  PL36   PL41
359.4   PL2    PL7    PL12   PL17   PL22   PL27   PL32  PL37   PL42
263.4   PL3    PL8    PL13   PL18   PL23   PL28   PL33  PL38   PL43
167.4   PL4    PL9    PL14   PL19   PL24   PL29   PL34  PL39   PL44
71.4    PL5    PL10   PL15   PL20   PL25   PL30   PL35  PL40   PL45
```

Each column aligns with carrier columns (6 tracks wide = 135mm). The X spacing is 135mm, the Y spacing is 96mm (matching the SBS plate depth + gap).

---

## 4. Carrier Positioning

### 4.1 Carrier Placement on Deck

When a carrier is placed at track N:

```
Carrier_Left_Edge_X = Track_Center_X(N)
Carrier_Y = TRACK_Y_START = 63.0 mm
Carrier_Z = SURFACE_Z = 100.0 mm
```

The carrier template (`.tml`) defines:
- `Dim.Dx` — Carrier width (typically 135mm for 6-track carriers)
- `Dim.Dy` — Carrier depth (typically 497mm)
- `Dim.Dz` — Carrier height above deck surface

### 4.2 Standard Carrier Sizes

| Carrier Width | Tracks | Width (mm) | Examples |
|--------------|--------|------------|---------|
| 6T | 6 tracks | 135.0 mm | PLT_CAR_L5, TIP_CAR_480, RGT_CAR |
| 5T | 5 tracks | 112.5 mm | 3-Position Portrait carriers |
| 4T | 4 tracks | 90.0 mm | TIP_CAR_288 |
| 1T | 1 track | 22.5 mm | SMP_CAR_32 |

### 4.3 Site Positions Within Carriers

Each carrier defines numbered **Sites** — positions where labware can be placed. Site coordinates are **relative to the carrier origin** (the carrier's front-left corner at its base):

```
Site.N.X    ← X offset from carrier left edge
Site.N.Y    ← Y offset from carrier front edge
Site.N.Z    ← Z offset from carrier base (height of the site shelf)
Site.N.Dx   ← Site width (labware footprint width)
Site.N.Dy   ← Site depth (labware footprint depth)
```

**Example: PLT_CAR_L5_DWP** (5-position plate carrier):

| Site | X (mm) | Y (mm) | Z (mm) | Dx (mm) | Dy (mm) | Position |
|------|--------|--------|--------|---------|---------|----------|
| 1 | 4.0 | 393.0 | 81.77 | 127 | 86 | Back |
| 2 | 4.0 | 297.0 | 81.77 | 127 | 86 | |
| 3 | 4.0 | 201.0 | 81.77 | 127 | 86 | Center |
| 4 | 4.0 | 105.0 | 81.77 | 127 | 86 | |
| 5 | 4.0 | 9.0 | 81.77 | 127 | 86 | Front |

Sites are numbered from back (highest Y) to front (lowest Y), with ~96mm spacing between positions.

---

## 5. 3D Model Offset System

### 5.1 Template-Level 3D Offsets

Every `.tml` file defines 3D model offsets that position the `.x` model relative to the template's 2D footprint:

```
3DModel, "ML_STAR\\PLT_CAR_L5_DWP.hxx"     ← Path to 3D model
3DModelRel, ".\\PLT_CAR_L5_DWP.hxx"         ← Relative path
3DxOffset, "0"                               ← X offset of 3D model from template origin
3DyOffset, "0"                               ← Y offset (depth)
3DzOffset, "0"                               ← Z offset (height)
```

- **`3DxOffset`** — Shifts the 3D model left/right relative to the template rectangle
- **`3DyOffset`** — Shifts the 3D model forward/backward
- **`3DzOffset`** — Shifts the 3D model up/down (e.g., `-110` in EntryExitDrawer.tml to sink the model below deck level)

### 5.2 Carrier XML 3D Offsets

For MultiFlex carriers, additional offsets are defined in `StarCarriers.xml`:

```xml
<carrier
    dimensions="135,497,18"
    modelFilePath="ML_STAR\MFXCreation\Base - 5 Position.x"
    sitePedestalOffsets="[67.5,435.5,0];[67.5,339.5,0];[67.5,243.5,0];[67.5,147.5,0];[67.5,51.5,0]"
    modelOffsets="0,0,0"
    modelEdgeOffsets="0,-2.5,0" />
```

| Field | Format | Purpose |
|-------|--------|---------|
| `dimensions` | `x,y,z` | Carrier base dimensions in mm |
| `sitePedestalOffsets` | `[x,y,z];[x,y,z];...` | Center point of each pedestal position |
| `modelOffsets` | `x,y,z` | Final 3D model alignment for the Deck Editor |
| `modelEdgeOffsets` | `x,y,z` | Edge alignment between 3D model and template rectangle |

### 5.3 Pedestal XML 3D Offsets

Individual pedestals can override the carrier's default offsets. From `StarCarrierPedestals.xml`:

```xml
<pedestal
    displayName="Heating Module"
    pedestalType="HeatCool"
    templateFilePath="ML_STAR\MFXCreation\Pedestal - Heating Module.tml"
    modelFilePath="ML_STAR\MFXCreation\Pedestal - Heating Module.x"
    modelOffsetsOverride="0,47"
    sitesOffsetsOverride="0,16.5"
    oversized="-1" />
```

| Field | Format | Purpose |
|-------|--------|---------|
| `modelOffsetsOverride` | `x,y` | X,Y offset override for the pedestal 3D model |
| `sitesOffsetsOverride` | `x,y` | X,Y offset override for the pedestal template sites |
| `oversized` | `-1` / `1` / `[1,-1]` | Blocks neighboring pedestals (-1 = previous, 1 = next) |

### 5.4 Rack-Level 3D Offsets

Rack files (`.rck`) also define 3D model offsets:

```
3DModel, "ML_STAR\\CORE\\Waste2.hxx"
3DModelRel, ".\\Waste2.hxx"
3DxOffset, "0"
3DyOffset, "0"
3DzOffset, "0"
```

These offset the labware's 3D model relative to the rack's grid origin.

---

## 6. Coordinate Mapping: Hamilton → Three.js

### 6.1 Axis Mapping

Hamilton VENUS uses a **left-handed Y-up** coordinate system. Three.js uses a **right-handed Y-up** system. The mapping is:

| Hamilton | Three.js | Notes |
|----------|----------|-------|
| X (width, left→right) | X (width, left→right) | Same |
| Y (depth, front→back) | Z (depth, front→back) | Swapped |
| Z (height, bottom→top) | Y (height, bottom→top) | Swapped |

### 6.2 Positioning a Carrier in Three.js

Given a carrier placed at track `trackStart` with template data:

```javascript
// Deck constants
const x0 = FIRST_TRACK_X + (trackStart - 1) * TRACK_SPACING;  // Hamilton X → Three.js X
const y0 = TRACK_Y_START;                                       // Hamilton Y → Three.js Z
const z0 = SURFACE_Z;                                           // Hamilton Z → Three.js Y

// Place carrier group
group.position.set(x0, z0, y0);
```

### 6.3 Positioning a Site's Labware in Three.js

Given a site with position `(site.x, site.y, site.z)` relative to the carrier, and a cached 3D model with offsets from the `.rck` file:

```javascript
// Compute model center from bounding box
const box = new THREE.Box3().setFromObject(siteModel);
const center = box.getCenter(new THREE.Vector3());

// Position within carrier group's local space
siteModel.position.set(
    site.x + site.dx / 2 - center.x + rckInfo.xOff,   // Hamilton X → Three X
    site.z - box.min.y + rckInfo.zOff,                  // Hamilton Z → Three Y (lift above site)
    site.y + site.dy / 2 - center.z + rckInfo.yOff      // Hamilton Y → Three Z
);
```

### 6.4 Left-Handed to Right-Handed Conversion (fixXFileCoords)

After loading a `.x` file with Three.js XFileLoader, the geometry must be converted from DirectX left-handed to Three.js right-handed:

```javascript
function fixXFileCoords(group) {
    group.traverse(function (child) {
        if (!child.isMesh || !child.geometry) return;
        
        // Negate Z coordinates on all vertex positions
        const pos = child.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            pos.setZ(i, -pos.getZ(i));
        }
        
        // Negate Z on all normal vectors
        const norm = child.geometry.attributes.normal;
        for (let i = 0; i < norm.count; i++) {
            norm.setZ(i, -norm.getZ(i));
        }
        
        // Reverse triangle winding order (swap first two vertices of each triangle)
        const idx = child.geometry.index;
        for (let f = 0; f < idx.count; f += 3) {
            const a = idx.getX(f), b = idx.getX(f + 1);
            idx.setX(f, b);
            idx.setX(f + 1, a);
        }
    });
}
```

### 6.5 Fitting `.x` Models to TML Footprints

After coordinate conversion, the model is centered on the TML footprint:

```javascript
const box = new THREE.Box3().setFromObject(xModel);
const modelCenter = box.getCenter(new THREE.Vector3());

xModel.position.set(
    carrierDef.dx / 2 - modelCenter.x,      // Center X on TML width
    -box.min.y,                               // Lift so base sits at y=0
    carrierDef.dy / 2 - modelCenter.z         // Center Z on TML depth
);
```

---

## 7. SBS / ANSI Standard Constants

All plate-related dimensions follow the ANSI/SLAS microplate standards:

| Constant | Value (mm) | Standard |
|----------|------------|----------|
| Footprint length | 127.76 | ANSI/SLAS 1-2004 |
| Footprint width | 85.48 | ANSI/SLAS 1-2004 |
| 96-well spacing | 9.0 | ANSI/SLAS 4-2004 |
| 384-well spacing | 4.5 | ANSI/SLAS 4-2004 |
| 1536-well spacing | 2.25 | ANSI/SLAS 4-2004 |
| A1 X offset | 14.38 | ANSI/SLAS 4-2004 |
| A1 Y offset | 11.24 | ANSI/SLAS 4-2004 |
| Corner radius | 3.18 | ANSI/SLAS 1-2004 |
| Wall thickness | 1.27 | Typical |
| Flange height | 2.41 | Typical |

---

## 8. Transformation Matrix Format

### 8.1 `.x` File FrameTransformMatrix

The `FrameTransformMatrix` in `.x` files is a 4×4 **row-major** matrix:

```
FrameTransformMatrix {
    m00, m01, m02, m03,    ← Row 0 (X axis + translation X)
    m10, m11, m12, m13,    ← Row 1 (Y axis + translation Y)
    m20, m21, m22, m23,    ← Row 2 (Z axis + translation Z)
    m30, m31, m32, m33;;   ← Row 3 (perspective, usually 0,0,0,1)
}
```

Identity matrix:
```
1.000000, 0.000000, 0.000000, 0.000000,
0.000000, 1.000000, 0.000000, 0.000000,
0.000000, 0.000000, 1.000000, 0.000000,
0.000000, 0.000000, 0.000000, 1.000000;;
```

The XFileLoader accumulates these matrices through the Frame hierarchy and bakes the final world transform into each mesh via `mesh.applyMatrix4(worldBaseMx)`.

### 8.2 glTF Node Matrices

GLTF models use 4×4 **column-major** matrices in the `nodes[].matrix` property. These are standard OpenGL-style transformations.
