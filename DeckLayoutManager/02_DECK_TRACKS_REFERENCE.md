# Hamilton STAR Deck Tracks — Complete Reference

## What Are Deck Tracks?

Tracks are the **narrow vertical rail slots** that run front-to-back on the Hamilton STAR deck. Carriers (plate carriers, tip carriers, reagent carriers, etc.) slot into these tracks. Each track is a precisely spaced groove in the deck surface that holds carriers in position.

In the VENUS software, tracks are defined as `Site.*` entries in the `.dck` (deck configuration) file.

## Track Unit System (T-Units)

The Hamilton STAR uses a **T-unit** system as its fundamental measurement:

| Property | Value |
|----------|-------|
| **1T (one track unit)** | **22.5 mm** |
| Track slot width | 22.0 mm |
| Gap between tracks | 0.5 mm |
| Track depth (Y-axis) | 497.0 mm |
| Track Z (deck surface height) | 100.0 mm |

Carriers are sized in T-units via the `MlStarCarWidthAsT` property:

| T-Width | Physical Width | Carrier Type |
|---------|---------------|--------------|
| **1T** | 22.5 mm | Sample carrier (SMP_CAR_32) |
| **4T** | 90.0 mm | 3×96 portrait tip carrier (TIP_CAR_288) |
| **5T** | 112.5 mm | 3-position portrait plate carrier |
| **6T** | 135.0 mm | Standard 5-position landscape carrier (most common) |
| **7T** | 157.5 mm | FLEX carrier (wider variant) |
| **14T** | 315.0 mm | 10-plate deck adaptor (PLT_DAT_L10AC) |

## ML_STAR Deck: All 54 Tracks

The full STAR deck has **54 tracks** arranged left-to-right:

| Track # | X Position (mm) | Labeled? | Track # | X Position (mm) | Labeled? | Track # | X Position (mm) | Labeled? |
|---------|-----------------|----------|---------|-----------------|----------|---------|-----------------|----------|
| **1** | **100.25** | **Yes** | 19 | 505.25 | **Yes** | **37** | **910.25** | **Yes** |
| 2 | 122.75 | No | 20 | 527.75 | No | 38 | 932.75 | No |
| 3 | 145.25 | No | 21 | 550.25 | No | 39 | 955.25 | No |
| 4 | 167.75 | No | 22 | 572.75 | No | 40 | 977.75 | No |
| 5 | 190.25 | No | 23 | 595.25 | No | 41 | 1000.25 | No |
| 6 | 212.75 | No | 24 | 617.75 | No | 42 | 1022.75 | No |
| **7** | **235.25** | **Yes** | **25** | **640.25** | **Yes** | **43** | **1045.25** | **Yes** |
| 8 | 257.75 | No | 26 | 662.75 | No | 44 | 1067.75 | No |
| 9 | 280.25 | No | 27 | 685.25 | No | 45 | 1090.25 | No |
| 10 | 302.75 | No | 28 | 707.75 | No | 46 | 1112.75 | No |
| 11 | 325.25 | No | 29 | 730.25 | No | 47 | 1135.25 | No |
| 12 | 347.75 | No | 30 | 752.75 | No | 48 | 1157.75 | No |
| **13** | **370.25** | **Yes** | **31** | **775.25** | **Yes** | **49** | **1180.25** | **Yes** |
| 14 | 392.75 | No | 32 | 797.75 | No | 50 | 1202.75 | No |
| 15 | 415.25 | No | 33 | 820.25 | No | 51 | 1225.25 | No |
| 16 | 437.75 | No | 34 | 842.75 | No | 52 | 1247.75 | No |
| 17 | 460.25 | No | 35 | 865.25 | No | 53 | 1270.25 | No |
| 18 | 482.75 | No | 36 | 887.75 | No | 54 | 1292.75 | No |

### Track Position Formula

```
Track_X(n) = 100.25 + (n - 1) × 22.5 mm      where n = 1 to 54
```

### Labeled Track Pattern

Tracks with `Label=1` (displayed in the layout editor with track numbers):
- **Tracks 1, 7, 13, 19, 25, 31, 37, 43, 49** — every 6th track
- These correspond to the 9 standard **carrier positions** (for 6T-wide carriers)
- These are the user-visible "Track 1" through "Track 9" in the Method Editor

### Track Geometry

Each track (Site) entry in `ML_STAR.dck`:
```
Site.N.Dx,    "22.0"      // Width of one track slot
Site.N.Dy,    "497.0"     // Depth of track (front to back)
Site.N.Id,    "NT-N"      // Track identifier (e.g., "1T-1", "2T-2")
Site.N.Label, "0|1"       // 1 = visible label, 0 = unlabeled
Site.N.SnapBase, "1"      // Carriers snap to tracks
Site.N.X,     "XXX.XX"    // X position (mm)
Site.N.Y,     "63.0"      // Y position (always 63.0)
Site.N.Z,     "100.0"     // Z position (deck surface = 100.0)
```

## Standard Carrier Position Grid

When standard 6T-wide carriers are placed at each labeled track:

| Carrier Position | Starting Track | X Left Edge | X Right Edge | Column Width |
|-----------------|----------------|-------------|--------------|--------------|
| Position 1 | Track 1 | 100.25 mm | 235.25 mm | 135.0 mm |
| Position 2 | Track 7 | 235.25 mm | 370.25 mm | 135.0 mm |
| Position 3 | Track 13 | 370.25 mm | 505.25 mm | 135.0 mm |
| Position 4 | Track 19 | 505.25 mm | 640.25 mm | 135.0 mm |
| Position 5 | Track 25 | 640.25 mm | 775.25 mm | 135.0 mm |
| Position 6 | Track 31 | 775.25 mm | 910.25 mm | 135.0 mm |
| Position 7 | Track 37 | 910.25 mm | 1045.25 mm | 135.0 mm |
| Position 8 | Track 43 | 1045.25 mm | 1180.25 mm | 135.0 mm |
| Position 9 | Track 49 | 1180.25 mm | 1315.25 mm | 135.0 mm |

**Total usable deck width**: 1315.25 - 100.25 = **1215.0 mm** (= 54 tracks × 22.5 mm)

## Target Position

The deck has one defined target position for the waste/autoload area:

```
Target.1.X = 1147.75 mm    // Track 47 area
Target.1.Y = 0.0 mm
Target.1.Z = 0.0 mm
```

## Instrument-Specific Decks

### ML_STAR (Full STAR)
- **54 tracks**, usable range: X 100.25–1292.75 mm
- Deck size: 1600 × 520 mm

### ML_Starlet (STARlet)
- Compact deck — fewer tracks available
- Uses same TrackWidth (22.5mm) but shorter X range
- Waste block positioned at X ≈ 778mm (vs 1318mm on full STAR)

### ML_FlexStar (STARplus)
- Same track system as Starlet-class
- Uses enhanced waste block (StarPlusWasteBlock) with Core 96/384 waste
- Waste block at X ≈ 778mm

### Diagnostic Deck
- Single track: Site 1 at X=4.0mm
- Deck size: 30.5 × 653.5 × 900.0 mm
- Used for maintenance and diagnostic procedures

## AutoLoad Configuration

From the `HxGruCommand` section:
```
MaxInstrumentTrays = 54    // Maximum tracks on instrument
MaxLoadingTrays = 54       // Maximum loadable tray positions
```

Carriers with `MlStarCarIsAutoLoad=1` can be automatically loaded/unloaded via the Autoload mechanism. The autoload system uses the raster width (`MlStarCarRasterWidth`) for barcode scanning positioning.
