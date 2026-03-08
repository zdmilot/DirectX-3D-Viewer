# Venus 3D Rendering & Labware System — Documentation Index

This documentation suite provides a comprehensive, code-level deep dive into how Hamilton VENUS renders 3D labware models, manages deck layouts, and structures the files that define carriers, containers, racks, instruments, and waste systems. All information is derived from direct examination of installed Hamilton VENUS files, COM interface XML documentation, configuration files, and the 3D File Tools / Labware Manager codebases.

## Documents

| # | Document | Description |
|---|----------|-------------|
| 1 | [Rendering Architecture](01-Rendering-Architecture.md) | Full rendering pipeline: DLLs, COM interfaces, ASSIMP, DirectX, GLTF, initialization flow, 3D View API |
| 2 | [Coordinate System & Offsets](02-Coordinate-System-and-Offsets.md) | The complete mm-based coordinate system: deck origin, track spacing, carrier placement, site offsets, 3D model alignment, Hamilton→Three.js axis mapping |
| 3 | [File Formats Deep Dive](03-File-Formats-Deep-Dive.md) | Binary layout of every file type: `.x`, `.hxx`, `.tml`, `.dck`, `.rck`, `.ctr`, `.lid`, `.lay`, `.gltf`, `.dat`, `.json` |
| 4 | [Deck Layout System](04-Deck-Layout-System.md) | How the `.dck` file defines the instrument deck: tracks, sites, external sites, target points, and how carriers snap to tracks |
| 5 | [Carrier & Pedestal System](05-Carrier-and-Pedestal-System.md) | MultiFlex carrier creation, pedestal types, XML config for `StarCarriers.xml` / `StarCarrierPedestals.xml`, offset overrides, oversizing rules |
| 6 | [Labware Hierarchy](06-Labware-Hierarchy.md) | The Template → Carrier → Rack → Container → Lid hierarchy, how sites link to labware files, the catalog system (`.dat` files) |
| 7 | [Waste System Rendering](07-Waste-System-Rendering.md) | Waste block templates, waste rack definitions, cutout panels, chute models, deck fixture positioning, teaching needle blocks |
| 8 | [3D Model Loading Pipeline](08-3D-Model-Loading-Pipeline.md) | Step-by-step model loading: `.hxx` decompression → `.x` parsing → triangulation → material assignment → z-fighting fixes → scene placement |
| 9 | [Instrument Deck Models](09-Instrument-Deck-Models.md) | GLTF deck models for STAR/STARlet/STARplus/Vantage, model alignment, cover panels, back panels, debug positioning |

## Key Reference Tables

- **Track Spacing**: 22.5 mm center-to-center
- **Deck Surface Z**: 100.0 mm
- **SBS Footprint**: 127.76 × 85.48 mm (ANSI/SLAS 1-2004)
- **96-Well Spacing**: 9.0 mm
- **A1 Offset**: X=14.38, Y=11.24 mm
- **Units**: All coordinates in millimeters (mm)
- **Coordinate System**: Hamilton uses Y-up left-handed; Three.js uses Y-up right-handed

## Source Material

| Source | Location | Type |
|--------|----------|------|
| Hamilton VENUS Installation | `C:\Program Files (x86)\Hamilton\` | Binary + Config |
| 3D File Tools (X-File-Test) | Workspace: `X-File-Test-in-JS-App/` | JavaScript + HTML |
| Venus Library Manager | Workspace: `Labware Manager/` | NW.js + Node.js |
| COM Interface XML | `Hamilton\Bin\Hamilton.HxSys3DView.xml` | .NET XML Doc |
| Carrier Config XML | `Hamilton\Config\StarCarriers.xml` | XML |
| Pedestal Config XML | `Hamilton\Config\StarCarrierPedestals.xml` | XML |
| Deck Config | `Hamilton\Config\ML_STAR.dck` | HxCfgFile |
| Labware Templates | `Hamilton\Labware\ML_STAR\*.tml` | HxCfgFile |
