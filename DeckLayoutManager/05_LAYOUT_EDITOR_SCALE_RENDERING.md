# Hamilton Layout Editor — Scale, Dimensions, and Rendering

## Coordinate System and Scale

The Hamilton VENUS Layout Editor (within the Method Editor) uses a **1:1 millimeter** coordinate system. All positions in `.dck`, `.tpl`, `.tml`, and `.rck` files are in millimeters and correspond directly to the physical instrument.

### Deck Bounding Box (ML_STAR)

| Property | Value | Description |
|----------|-------|-------------|
| **Dim.Dx** | 1600.0 mm | Total deck canvas width |
| **Dim.Dy** | 520.0 mm | Total deck canvas depth |
| **Dim.Dz** | 0.0 mm | 2D canvas (3D handled by model viewer) |
| **Origin.X** | -80.0 mm | Canvas X offset (tracks start at +100.25) |
| **Origin.Y** | 51.0 mm | Canvas Y offset (tracks start at +63.0) |

### Physical Deck Dimensions

| Measurement | Value | Notes |
|------------|-------|-------|
| **Usable track area width** | 1215.0 mm | 54 tracks × 22.5 mm/track |
| **Track area X range** | 100.25 → 1314.75 mm | Left edge of Track 1 → Right edge of Track 54 |
| **Track depth** | 497.0 mm | Front-to-back rail length |
| **Track area Y range** | 63.0 → 560.0 mm | Front edge → Back edge |
| **Total deck area** | 1215 × 497 mm | Active carrier placement area |
| **9 standard carrier columns** | 135 mm each | 9 × 135 = 1215 mm |

### Scale Comparison to Real-World

The Method Editor renders the deck in a 2D top-down view at a zoom level that fits the ~1600 × 520 mm canvas onto screen. The underlying data is always 1:1 mm:

- **22.5 mm = 1 Track** (the fundamental unit)
- **135 mm = 6 Tracks = 1 Standard Carrier Width** (the practical unit)
- **497 mm = Track depth** (constant for all standard carriers)

## Layout Editor Views

### 2D Deck View (Method Editor)
- Top-down view of the deck
- Tracks shown as vertical strips
- Labeled tracks (1, 7, 13, 19, 25, 31, 37, 43, 49) displayed with track number labels
- Carriers shown as colored rectangles with site positions
- Labware shown within carrier sites

### 3D Deck View
- Uses `.hxx` (Hamilton proprietary) or `.x` (DirectX) 3D model files
- Newer models use `.gltf` + `.bin` format (glTF standard)
- 3D models are positioned using `3DxOffset`, `3DyOffset`, `3DzOffset` from the carrier template
- Models referenced from carrier templates: `3DModel, "ML_STAR\\<name>.hxx"`

### Model Files

| Format | Extension | Era | Usage |
|--------|-----------|-----|-------|
| Hamilton HXX | `.hxx` | Current | Primary 3D model format |
| DirectX | `.x` | Legacy | MFX carrier bases and pedestals |
| glTF | `.gltf` + `.bin` | Newer | CORE components (waste, teaching needles) |
| PNG | `.png` | All | 2D image previews |
| BMP | `.bmp` | Legacy | 2D image previews |

## Layout Template Format (.tpl)

The `.tpl` file defines the default deck layout — what's pre-placed when you start a new method:

```
DataDef,DECKLAY,4,default,
{
    Deck,         "ML_STAR2.dck",          // Which deck definition to use
    DefaultWash,  "Waste",                  // Default wash station
    Instrument,   "ML_STAR",               // Instrument type
    
    Labware.Cnt,  "6",                     // Number of pre-placed items
    
    // Per labware entry:
    Labware.N.Angle,     "0",              // Rotation (degrees)
    Labware.N.BarcodeCnt,"0",
    Labware.N.Clsid,     "{GUID}",         // COM class ID
    Labware.N.File,      "path\\file.tml", // Labware file path
    Labware.N.Id,        "WasteBlock",     // Unique identifier on deck
    Labware.N.SiteId,    "WasteBlock",     // Which deck site/carrier site
    Labware.N.Template,  "WasteBlock",     // Parent template carrier
    Labware.N.ZTrans,    "100",            // Z translation
    
    // Position via Transform Matrix (3×3):
    Labware.N.TForm.1.X, "1",   .Y, "0",   .Z, "0",     // Scale X
    Labware.N.TForm.2.X, "0",   .Y, "1",   .Z, "0",     // Scale Y
    Labware.N.TForm.3.X, "1318",.Y, "115",  .Z, "1",    // Translation (X, Y)
    
    // Sequences (predefined well ordering):
    Seq.Cnt, "5",
    Seq.1.Id, "Waste16",     // 16-position waste
    Seq.2.Id, "Waste08",     // 8-position waste
    // ...
};

DataDef,RESOURCES,1,default,
{
    CNT, "1",
    1.RID,   "ML_STAR",
    1.RNAME, "Res_ML_STAR",
    1.RFILE, "ML_STAR_side.png",    // Resource sidebar image
    1.VNAME, "ML_STAR",
};
```

### COM Class IDs

| CLSID | Type |
|-------|------|
| `{77DF9B91-671E-4974-8380-38AD0B4E0D86}` | Template (TML carrier) |
| `{8E1D6C02-F939-11D1-8D14-008029ED67EA}` | Rack/Container (RCK) |

## Carrier Placement Logic

When the user places a carrier on the deck:

1. **Track Snapping**: The carrier's X position snaps to the nearest track boundary. The carrier occupies `MlStarCarWidthAsT` tracks starting from the snap position.

2. **ExSite Matching**: The Layout Editor checks the carrier's site dimensions (Dx × Dy) against ExSite types to determine snap alignment.

3. **Collision Detection**: The editor prevents overlapping carriers on the same tracks.

4. **Z-Height Resolution**: Each carrier type has a fixed Z for its sites. The Z values determine the absolute height where pipetting occurs:
   - Tip sites: Z=114.95 (carrier) + 100 (deck surface) ≈ 214.95 mm
   - Plate sites: Z=86.15 (carrier) + 100 (deck surface) ≈ 186.15 mm (DWP) to 211.75 mm (standard)

## Method Editor Configuration

The Method Editor UI is configured via `Config\HxMetEd.cfg`:

```
DataDef,Settings,1,default,
{
    OpenLastOpenedFile,           "0",
    ShowVariablesWithProcessNamespace,"0",
    ToolboxTabBg,                "204 204 255",      // Light blue
    WorkflowGraphicTabBg,        "204 255 153",      // Light green
    WorkflowStepsTabBg,          "255 204 153",      // Light orange
};

DataDef,StepColors,1,default,
{
    CommentStep,                 "188 216 245",
    DisabledStep,                "95 95 95",
    ErroneousStep,               "255 204 102",
    ExecutorOnlyStep,            "183 255 183",
    RunView_CurrentStep,         "0 255 255",
    SchedulerOnlyStep,           "255 255 128"
};
```

The deck view rendering is handled by compiled COM components — the Layout Editor does not have user-configurable scale/grid/zoom settings in text config files. Scale and zoom are controlled programmatically by the `HxLabwareEd2` component.
