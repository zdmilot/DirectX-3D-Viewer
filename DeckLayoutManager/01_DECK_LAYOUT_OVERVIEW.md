# Hamilton VENUS Deck Layout System — Overview

## Where the Base Deck Layout is Stored

The base deck layout definition lives in the `Config` directory of the Hamilton installation:

```
C:\Program Files (x86)\Hamilton\Config\
```

### Key Files

| File | Format | Purpose |
|------|--------|---------|
| `ML_STAR.dck` | Text (HxCfgFile v2) | **Master deck definition** — 54 tracks, 279 ExSites, deck dimensions |
| `ML_STAR2.dck` | Binary | Extended STAR deck (binary variant) |
| `ML_Starlet.dck` | Binary | STARlet (compact) deck definition |
| `ML_FlexStar.dck` | Binary | FlexStar / STARplus deck definition |
| `Diagnostic.dck` | Text | Single-track diagnostic deck |
| `ML_STAR2.tpl` | Text (HxCfgFile) | **Default STAR layout template** — pre-placed waste/teaching labware |
| `ML_Starlet.tpl` | Text | Default STARlet layout template |
| `ML_FlexStar.tpl` | Text | Default FlexStar layout template |
| `VStar.tpl` | Binary | Vantage/VSTAR layout template |
| `*.lay` | Binary | **Saved deck layouts** from the Method Editor (per-method) |

### File Type Hierarchy

```
.dck (Deck Config)        → Defines physical deck: tracks, ExSites, dimensions, origin
  └── .tpl (Template)     → Default layout: pre-placed labware on the .dck 
        └── .lay (Layout)  → User's saved layout for a specific method (binary, per-method)
```

When the Method Editor opens, it loads:
1. The `.dck` file to define the physical deck structure (tracks, snap sites)
2. The `.tpl` file as the starting template (waste block, teaching needles)
3. The user's `.lay` file (if re-opening an existing method) overlaying carriers and labware

### Deck Configuration File Format

The `.dck` file uses Hamilton's proprietary `HxCfgFile` format:

```
HxCfgFile,2;
ConfigIsValid,Y;

DataDef,DECK,3,default,
{
    Dim.Dx, "1600",        // Total deck width in mm
    Dim.Dy, "520",         // Total deck depth in mm
    Dim.Dz, "0",           // Total deck height (0 = 2D)
    Origin.X, "-80",       // Coordinate origin X offset
    Origin.Y, "51",        // Coordinate origin Y offset
    Origin.Z, "0",
    
    ExSite.Cnt, "279",     // Extended snap sites count
    ExSite.1.*, ...        // 279 ExSite definitions (see detailed doc)
    
    Site.Cnt, "54",        // Track count
    Site.1.*, ...          // 54 track definitions (see detailed doc)
    
    Target.Cnt, "1",       // Target positions
    Target.1.X, "1147.75",
    Target.1.Y, "0.0",
    Target.1.Z, "0.0",
};

DataDef,HxGruCommand,1,default,
{
    MaxInstrumentTrays, "54",
    MaxLoadingTrays, "54"
};
```

### Labware File Types

| Extension | DataDef Type | Purpose |
|-----------|------------|---------|
| `.tml` | `TEMPLATE` | Carrier templates — define sites where labware sits |
| `.rck` | `RECTRACK` | Rack/labware definitions — well grids, container geometry |
| `.ctr` | Container | Individual vessel/tip definitions |
| `.hxx` | 3D Model | Hamilton 3D model files (DirectX-based) |
| `.x` | DirectX Model | Legacy DirectX model files for 3D view |
| `.gltf` / `.bin` | glTF 3D Model | Modern 3D model files (CORE waste block, etc.) |

### Layout File Locations

Saved `.lay` files (binary, per-method) are scattered across the installation:
- `Library/Deck Loading Instructions/` — library-bundled layouts
- `Methods/VM/` — maintenance/verification method layouts
- `Methods/Library Demo Methods/` — demo method layouts
- `OEM/GRU_SoftDev/Config/` — OEM global layouts

### Coordinate System

- **Origin**: X=-80mm, Y=51mm (offset from deck physical origin)
- **X-axis**: Left to right (track direction), range ~100mm to ~1315mm
- **Y-axis**: Front to back, range ~63mm to ~560mm (tracks extend 497mm deep)
- **Z-axis**: Vertical height from deck surface
- **All dimensions are in millimeters (mm)**
- **Scale is 1:1** — coordinates correspond directly to physical dimensions on the instrument
