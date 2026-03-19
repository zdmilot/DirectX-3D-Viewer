# Hamilton Carrier & Labware File Formats

## Carrier Templates (.tml)

Carrier templates (`.tml` files) define the physical structure of a carrier — its dimensions, sites (positions where labware sits), and properties. They are stored in:

```
C:\Program Files (x86)\Hamilton\Labware\ML_STAR\          ← Root carriers
C:\Program Files (x86)\Hamilton\Labware\ML_STAR\CORE\     ← Waste/teaching blocks
C:\Program Files (x86)\Hamilton\Labware\ML_STAR\MFXCreation\  ← MultiFlex pedestal templates
C:\Program Files (x86)\Hamilton\Labware\ML_STAR\MultiFlexCarrier\  ← Pre-built MFX carriers
```

### TML File Structure

```
HxCfgFile,<version>;                   // 2 or 3
ConfigIsValid,Y;

DataDef,TEMPLATE,1,default,
{
    // === IDENTITY ===
    ViewName,        "<carrier_name>",        // Display name in editor
    Description,     "<text>",                // Human-readable description
    ReadOnly,        "1",                     // System file flag
    Visible,         "0|1",                   // Visibility in labware list
    
    // === DIMENSIONS (mm) ===
    Dim.Dx,          "135",                   // Width (X) — carrier footprint
    Dim.Dy,          "497",                   // Depth (Y) — always 497 for STAR
    Dim.Dz,          "130",                   // Height (Z) — carrier total height
    
    // === VISUAL ===
    BackgrndClr,     "<BGR_color_int>",       // Background color
    Bitmap,          "",                      // Optional bitmap
    
    // === 3D MODEL (HxCfgFile v3 / _A00 files) ===
    3DModel,         "ML_STAR\\<name>.hxx",   // 3D model path
    3DModelRel,      ".\\<name>.hxx",         // Relative 3D model path
    3DxOffset,       "0.5",                   // 3D display X offset
    3DyOffset,       "0",                     // 3D display Y offset  
    3DzOffset,       "0",                     // 3D display Z offset
    Image3D,         "ML_STAR\\<name>.png",   // 3D image path
    
    // === BARCODE ===
    Barcode.Unique,  "0|1",                   // Unique barcode flag
    Barcode.Value,   "P04*****",              // Barcode mask pattern
    
    // === CATEGORY ===
    CategoryCnt,     "1",
    Category.0.Id,   "<id>",                  // 144=plate carrier, 145=reagent, 151=tip
    
    // === ML STAR PROPERTIES ===
    PropertyCnt,     "<n>",
    Property.1,      "MlStarCarBCOrientation",
    PropertyValue.1, "0",                     // 0=landscape, 1=portrait
    Property.2,      "MlStarCarBCReadWidth",
    PropertyValue.2, "<width_mm>",
    Property.3,      "MlStarCarCountOfBCPos",
    PropertyValue.3, "<count>",
    Property.4,      "MlStarCarFirstBCPos",
    PropertyValue.4, "<offset_mm>",
    Property.5,      "MlStarCarIsAutoLoad",
    PropertyValue.5, "0|1",                   // Can auto-load
    Property.6,      "MlStarCarIsLoadable",
    PropertyValue.6, "0|1",                   // Can be loaded on deck
    Property.7,      "MlStarCarIsRecognizable",
    PropertyValue.7, "0|1",                   // Recognized by system
    Property.8,      "MlStarCarLabelName",
    PropertyValue.8, "<label>",
    Property.9,      "MlStarCarNoReadBarcode",
    PropertyValue.9, "0|1",                   // Skip barcode reading
    Property.10,     "MlStarCarPosAreRecognizable",
    PropertyValue.10,"0|1",
    Property.11,     "MlStarCarRasterWidth",
    PropertyValue.11,"960",                   // Grid spacing (tenths of mm?)
    Property.12,     "MlStarCarWidthAsT",
    PropertyValue.12,"6",                     // Width in track units
    
    // === SITE DEFINITIONS ===
    Site.Cnt,        "5",                     // Total number of labware sites
    
    Site.1.Dx,       "127",                   // Site width
    Site.1.Dy,       "86",                    // Site depth
    Site.1.Id,       "3",                     // Logical site ID (not sequential!)
    Site.1.IsCovered,"0",                     // Has lid
    Site.1.Label,    "1",                     // Label visibility
    Site.1.LabwareFile, "",                   // Pre-loaded labware (empty = user places)
    Site.1.SnapBase, "0",                     // Snap behavior
    Site.1.Stack,    "0",                     // Stacking enabled
    Site.1.StackSize,"1",                     // Stack size
    Site.1.Visible,  "1",                     // Visible in editor
    Site.1.X,        "4",                     // X offset from carrier origin
    Site.1.Y,        "200.5",                 // Y offset from carrier origin
    Site.1.Z,        "86.15",                 // Z height of site surface
    
    // ... additional sites ...
    
    UseBndry,        "0|1",                   // Use boundary flag
};

// Checksum trailer
* $$author=<user>$$valid=<0|1>$$time=<timestamp>$$checksum=<hex>$$length=<nnn>$$
```

## Exemplar Carrier: PLT_CAR_L5AC_A00 (5-Position Plate Carrier)

```
ViewName: "PLT_CAR_L5AC_A00"
Description: "Carrier for 5 deep well 96 Well PCR Plates"
Dimensions: 135 × 497 × 130 mm
Barcode Pattern: "P04*****"
MlStarCarWidthAsT: 6 (= 135mm / 22.5mm)
MlStarCarRasterWidth: 960
MlStarCarIsAutoLoad: 1

5 Sites (Dx=127, Dy=86, Z=86.15):
```

| File Index | Site.Id | Y Offset | Physical Position |
|-----------|---------|----------|-------------------|
| Site.4 | 1 | 392.5 | Rear (closest to pipetting arm) |
| Site.5 | 2 | 296.5 | Second from rear |
| Site.1 | 3 | 200.5 | Middle |
| Site.2 | 4 | 104.5 | Second from front |
| Site.3 | 5 | 8.5 | Front (closest to user) |

**Note**: File indexing (Site.1, Site.2...) does NOT match logical Site.Id ordering. The Id field determines the physical position.

## Rack/Labware Files (.rck)

Racks define containers/wells within a site position:

```
HxCfgFile,<version>;
ConfigIsValid,Y;

DataDef,RECTRACK,3,default,
{
    Dim.Dx,    "22.5",         // Rack dimensions
    Dim.Dy,    "497",
    Dim.Dz,    "140",
    
    Rows,      "32",           // Well grid rows
    Columns,   "1",            // Well grid columns
    
    Dx,        "0",            // Well spacing X
    Dy,        "15",           // Well spacing Y
    BndryX,    "14.5",         // Boundary offset X
    BndryY,    "14.5",         // Boundary offset Y
    
    Hole.Shape,"0",            // 0=round, 1=rectangular
    Hole.X,    "0",            // Hole dimension X
    Hole.Y,    "0",            // Hole dimension Y
    Hole.Z,    "10.8",         // Hole depth Z
    
    // Same MlStarCar* properties as TML
};
```

## Container Files (.ctr)

Individual vessel/tip geometry:
- Define the shape of a single well, tube, or tip
- Referenced by `.rck` files via `Cntr.N.file`
- Contain liquid level detection parameters, volume curves, etc.

## Waste Block Template

The waste block is a special carrier:

```
WasteBlock.tml:
  Dimensions: 30 × 445 × 122 mm
  Background: Green (32896)
  
  Sites:
    1: Teaching needle block (20×75, Z=75)
    2: Waste container (150×220, Z=86)  
    3: Rear verification (30×30, Z=87)
    4: Front verification (30×30, Z=87)
    
  CORE variant has additional sites:
    5: Core 96 waste (45×45, Z=119)
    6: Core 384 waste (45.1×45.1, Z=105)
    7: Teaching needle 5mL (Z=110)
    8: Additional waste (39×61, Z=105)
```

## Category IDs

| ID | Category |
|----|----------|
| 144 | Plate/microplate carriers |
| 145 | Reagent carriers |
| 151 | Tip carriers |
| (varies) | Wash stations, sample carriers, etc. |

## Carrier Width Reference

| Carrier | Width (T) | Width (mm) | Dx × Dy × Dz |
|---------|-----------|------------|---------------|
| SMP_CAR_32 | 1T | 22.5 | 22.5 × 497 × 140 |
| TIP_CAR_288_A00 | 4T | 90.0 | 90 × 497 × 130 |
| PLT_CAR_L5AC | 6T | 135.0 | 135 × 497 × 130 |
| PLT_CAR_L5FLEX_AC | 7T | 157.5 | 157.5 × 497 × 130 |
| Car_Wash_Standard | 6T | 135.0 | 135 × 497 × 135 |
| WasteBlock | special | 30.0 | 30 × 445 × 122 |
| REA_CAR_L3AT | 6T | 135.0 | 135 × 497 × 130 |
| RGT_CAR_12R | 6T | 135.0 | 135 × 497 × 130 |

**Depth (Dy) is always 497 mm** for all standard carriers — this is the deck rail/track depth.
