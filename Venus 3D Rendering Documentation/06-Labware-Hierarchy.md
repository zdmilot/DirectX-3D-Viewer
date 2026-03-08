# Labware Hierarchy

## Overview

Hamilton VENUS organizes labware in a strict hierarchy: **Deck → Carrier/Template → Rack → Container → Lid**. Each level defines geometry, positions, and references downward to child objects. The catalog (`.dat`) files and `Labware.json` manifests index all available labware.

---

## 1. Hierarchy Diagram

```
Deck (.dck)
  ├── Track Sites (Site.1 .. Site.54)
  │     └── Carrier Templates (.tml)
  │           ├── 3D Model (.x / .hxx)
  │           ├── Preview Image (.png)
  │           └── Sites (Site.1 .. Site.N)
  │                 └── Racks (.rck)
  │                       ├── 3D Model (.x / .hxx)
  │                       └── Container Grid (Cntr.1 .. Cntr.M)
  │                             └── Container Definitions (.ctr)
  │
  ├── External Sites (ExSite.1 .. ExSite.N)
  │     └── Direct labware placement (racks, tips)
  │
  └── Deck Fixtures (waste, drawers)
        ├── Fixture Template (.tml)
        ├── Fixture 3D Model (.x / .hxx)
        └── Fixture Sites
              └── Racks (.rck) for sub-components
```

---

## 2. Template Level (.tml)

### 2.1 Purpose

Templates define the physical footprint and site layout of a carrier, rack, or fixture. They are the primary unit of placement on the deck.

### 2.2 Key Properties

| Property | Description |
|----------|-------------|
| `ViewName` | Display name (e.g., `PLT_CAR_L5_DWP`) |
| `Description` | Human-readable description |
| `Dim.Dx / Dy / Dz` | Physical dimensions in mm |
| `Clearance` | Total clearance height needed (mm) |
| `3DModel` | Path to 3D model file |
| `3DxOffset / yOffset / zOffset` | Model alignment offsets |
| `Site.Cnt` | Number of child sites |
| `Site.N.*` | Per-site position and properties |

### 2.3 Template Types

| Type | HxCfgFile Block | Typical Use |
|------|----------------|-------------|
| Carrier | `DataDef,TEMPLATE,1,default` | Physical carrier for deck tracks |
| Rack template | `DataDef,TEMPLATE,1,default` | Labware placed on carrier sites |
| Fixture | `DataDef,TEMPLATE,1,default` | Deck fixtures (waste, drawers) |

### 2.4 Site-to-Child Reference Chain

Each template site can reference a labware file:

```
Site.1.LabwareFile, "ML_STAR\\waste2.rck"
Site.1.LabwareFileRel, ".\\waste2.rck"
```

This creates the **site → rack** link in the hierarchy.

---

## 3. Rack Level (.rck)

### 3.1 Purpose

Racks represent physical labware items (plates, tip boxes, reagent troughs, etc.) that sit on carrier sites. They define the well/container grid and reference a 3D model for visualization.

### 3.2 Key Properties

| Property | Description |
|----------|-------------|
| `3DModel` | Path to rack 3D model file |
| `3DxOffset / yOffset / zOffset` | Model alignment offsets |
| `Dim.Dx / Dy / Dz` | Rack dimensions in mm |
| `Cntr.N.file` | Path to container definition (`.ctr`) |
| Grid properties | Rows, columns, spacing |

### 3.3 Common Rack Dimensions

| Rack Type | Dx (mm) | Dy (mm) | Dz (mm) |
|-----------|---------|---------|---------|
| SBS Plate (96-well) | 127.76 | 85.48 | ~15 |
| Deep Well Plate | 127.76 | 85.48 | ~44 |
| Tip Rack (300µL) | 127.76 | 85.48 | ~60 |
| Reagent Trough | ~30 | ~86 | ~40 |
| Waste2 | 150 | 220 | 33 |

### 3.4 Dual Parsing Modes

The RCK file exists in two formats (see [03-File-Formats-Deep-Dive.md](03-File-Formats-Deep-Dive.md)):

| Format | Detection | Parser |
|--------|-----------|--------|
| Text (HxCfgFile) | First 20 bytes contain `HxCfgFile` | `parseRCKText()` |
| Binary | No HxCfgFile header | `parseRCKBinary()` |

Both parsers extract the same output:
```javascript
{ model: string, modelRel: string, xOff: number, yOff: number, zOff: number }
```

---

## 4. Container Level (.ctr)

### 4.1 Purpose

Container files define individual well geometry — the physical shape, depth, and volume characteristics of a single well/tube/trough within a rack.

### 4.2 Well Shape Types

| Code | Type | Cross Section | Typical Use |
|------|------|--------------|-------------|
| 0 | Flat bottom | ═══ | Standard 96-well plates |
| 1 | Round bottom | ╰─╯ | Cell culture plates |
| 2 | V-bottom | ╲ ╱ | PCR plates, conical tubes |
| 3 | U-shape | ╰─╯ | Rounded-bottom plates |
| 4 | Square flat | ═══ | Rectangular wells |
| 5 | Square V | ╲ ╱ | Rectangular V-bottom |

### 4.3 Key Parameters

| Parameter | Description |
|-----------|-------------|
| Well shape code | Integer (0–5) identifying cross-section type |
| Well depth | Total depth in mm |
| Top diameter/width | Opening dimension in mm |
| Bottom diameter/width | Bottom dimension in mm |
| Volume segments | Piecewise volume-to-height mapping |

### 4.4 Reference Chain

```
Template (.tml)
  └── Site.N.LabwareFile = "something.rck"
        └── Rack (.rck)
              └── Cntr.1.file = "something.ctr"
                    └── Container (.ctr) — Well geometry
```

---

## 5. Lid Level (.lid)

### 5.1 Purpose

Lid files define cover/cap geometry for stackable labware. They are binary files associated with racks that support stacking.

### 5.2 Properties

| Property | Description |
|----------|-------------|
| Lid 3D model | Cover geometry |
| Stack height | Height contribution when stacked |
| Fit dimensions | Matching dimensions for rack |

### 5.3 Stack Support in Templates

Templates indicate stacking capability via:

```
Site.N.Stack, "1"          ← Stacking enabled
Site.N.StackSize, "5"     ← Maximum stack count
Site.N.IsCovered, "1"     ← Has lid/cover
```

---

## 6. Catalog System

### 6.1 `.dat` Catalog Files

Located at `C:\Program Files (x86)\Hamilton\Labware\ML_STAR\`:

| File | Purpose |
|------|---------|
| `BaseCategory.dat` | Root category definitions (e.g., "Carriers", "Plates", "Tips") |
| `Category.dat` | Sub-category hierarchy with IDs and parent references |
| `Index.dat` | Master index mapping labware names to categories and file paths |

### 6.2 Category Hierarchy Examples

```
BaseCategory
  ├── Carriers
  │     ├── Plate Carriers
  │     ├── Tip Carriers
  │     ├── Reagent Carriers
  │     └── MultiFlex Carriers
  ├── Plates / Deep Well Plates
  │     ├── 96-well
  │     ├── 384-well
  │     └── DWP
  ├── Tips
  │     ├── Standard Tips
  │     └── Filter Tips
  ├── Tubes
  │     ├── Eppendorf
  │     └── Falcon
  └── Accessories
        ├── Waste
        └── Teaching Tools
```

### 6.3 `Labware.json` Manifest

Individual labware directories may contain a manifest file:

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

## 7. File Organization on Disk

### 7.1 Directory Structure

```
C:\Program Files (x86)\Hamilton\Labware\
  └── ML_STAR\
        ├── BaseCategory.dat
        ├── Category.dat
        ├── Index.dat
        ├── PLT_CAR_L5_DWP\
        │     ├── PLT_CAR_L5_DWP.tml     ← Template
        │     ├── PLT_CAR_L5_DWP.hxx     ← 3D model (compressed .x)
        │     └── PLT_CAR_L5_DWP.png     ← Preview image
        ├── Cos_96_Fl\
        │     ├── Cos_96_Fl.rck           ← Rack (96-well plate)
        │     └── Cos_96_Fl.x            ← 3D model
        ├── CORE\
        │     ├── WasteBlock.tml          ← Waste fixture template
        │     ├── WasteBlock.hxx          ← Waste 3D model
        │     ├── waste2.rck              ← Waste rack
        │     ├── Waste2.hxx             ← Waste rack 3D model
        │     └── verification.rck        ← Verification needle rack
        ├── MFXCreation\
        │     ├── Base - 5 Position.x     ← Carrier base model
        │     ├── Pedestal - *.x          ← Pedestal models (100+)
        │     ├── Rack - *.rck            ← Pedestal racks
        │     └── Container - *.ctr       ← Well definitions
        └── [hundreds more labware directories]
```

### 7.2 Path Resolution

Hamilton paths use backslash separators starting from the `Labware\` directory:

```
Hamilton path:  "ML_STAR\\PLT_CAR_L5_DWP\\PLT_CAR_L5_DWP.hxx"
Resolved path:  "C:\Program Files (x86)\Hamilton\Labware\ML_STAR\PLT_CAR_L5_DWP\PLT_CAR_L5_DWP.hxx"
```

In the web-based 3D viewer, paths are resolved to server URLs:

```javascript
resolveHamiltonPath("ML_STAR\\CORE\\foo.x")
→ "Base Hamilton Files/Labware/ML_STAR/CORE/foo.x"
```

### 7.3 Cross-References Between Files

```
PLT_CAR_L5_DWP.tml
  ├── 3DModel = "ML_STAR\\PLT_CAR_L5_DWP.hxx"        ← Own 3D model
  ├── Site.1.LabwareFile = "ML_STAR\\Cos_96_Fl.rck"    ← Labware at site 1
  └── Site.2.LabwareFile = "ML_STAR\\Nunc_384.rck"     ← Labware at site 2

Cos_96_Fl.rck
  ├── 3DModel = "ML_STAR\\Cos_96_Fl.x"                ← Rack 3D model
  └── Cntr.1.file = "ML_STAR\\Cos_96_Fl.ctr"          ← Well definition

WasteBlock.tml
  ├── 3DModel = "ML_STAR\\CORE\\WasteBlock.hxx"       ← Waste body 3D model
  ├── Site.8.LabwareFile = "ML_STAR\\waste2.rck"       ← Waste chute rack
  └── Site.1.LabwareFile = "ML_STAR\\verification.rck" ← Verification needles
```

---

## 8. Rendering Implications

### 8.1 Loading Order

1. **Deck** loaded first (GLTF model)
2. **Carrier templates** parsed from `.tml` files
3. **Carrier 3D models** fetched and cached asynchronously
4. **When carrier placed**: Site labware `.rck` files fetched → parsed → 3D model paths extracted → models fetched and cached
5. **Labware 3D models** cloned from cache and positioned at each site
6. **Containers** (`.ctr`) are NOT rendered in 3D — they define liquid handling parameters only

### 8.2 What Gets Rendered vs. What Doesn't

| Item | Rendered in 3D? | Purpose |
|------|-----------------|---------|
| Deck base | ✅ GLTF model | Physical instrument |
| Track slots | ✅ Procedural boxes | Visual track indicators |
| Carrier body | ✅ .x/.hxx model (or procedural) | Physical carrier |
| Site wells | ✅ Invisible boxes (raycast only) | Click targets for interaction |
| Labware (rack) | ✅ .x/.hxx model | Physical labware item |
| Container wells | ❌ Not rendered | Liquid handling simulation data |
| Lids | ❌ Not individually rendered | Stacking information |
| Barcodes | ❌ Not rendered in 3D | System identification |
