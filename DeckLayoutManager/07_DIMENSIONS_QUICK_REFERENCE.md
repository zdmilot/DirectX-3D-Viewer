# Hamilton Deck Dimensions — Quick Reference for 3D Reconstruction

## Key Dimensions Summary

This document provides all essential measurements needed to reconstruct the Hamilton STAR deck in a 3D modeling application.

## Fundamental Constants

| Constant | Value | Description |
|----------|-------|-------------|
| **1T (Track Unit)** | **22.5 mm** | Fundamental unit of deck positioning |
| Track slot width | 22.0 mm | Physical groove width |
| Track gap | 0.5 mm | Gap between adjacent tracks |
| Track depth | 497.0 mm | Front-to-back rail length |
| Deck surface Z | 100.0 mm | Z-height of the track surface |

## Deck Canvas

| Measurement | Value (mm) |
|------------|------------|
| Canvas Width (Dx) | 1600 |
| Canvas Depth (Dy) | 520 |
| Origin Offset X | -80 |
| Origin Offset Y | 51 |

## Track Positions (All 54)

Formula: `X = 100.25 + (track_number - 1) × 22.5`

All tracks: Y=63.0, Dy=497.0, Dz=22.0×497.0, Z=100.0

```
Track  1: X = 100.25     Track 19: X = 505.25     Track 37: X = 910.25
Track  2: X = 122.75     Track 20: X = 527.75     Track 38: X = 932.75
Track  3: X = 145.25     Track 21: X = 550.25     Track 39: X = 955.25
Track  4: X = 167.75     Track 22: X = 572.75     Track 40: X = 977.75
Track  5: X = 190.25     Track 23: X = 595.25     Track 41: X = 1000.25
Track  6: X = 212.75     Track 24: X = 617.75     Track 42: X = 1022.75
Track  7: X = 235.25     Track 25: X = 640.25     Track 43: X = 1045.25
Track  8: X = 257.75     Track 26: X = 662.75     Track 44: X = 1067.75
Track  9: X = 280.25     Track 27: X = 685.25     Track 45: X = 1090.25
Track 10: X = 302.75     Track 28: X = 707.75     Track 46: X = 1112.75
Track 11: X = 325.25     Track 29: X = 730.25     Track 47: X = 1135.25
Track 12: X = 347.75     Track 30: X = 752.75     Track 48: X = 1157.75
Track 13: X = 370.25     Track 31: X = 775.25     Track 49: X = 1180.25
Track 14: X = 392.75     Track 32: X = 797.75     Track 50: X = 1202.75
Track 15: X = 415.25     Track 33: X = 820.25     Track 51: X = 1225.25
Track 16: X = 437.75     Track 34: X = 842.75     Track 52: X = 1247.75
Track 17: X = 460.25     Track 35: X = 865.25     Track 53: X = 1270.25
Track 18: X = 482.75     Track 36: X = 887.75     Track 54: X = 1292.75
```

## 9 Standard Carrier Columns (6T Width)

| Column | Start Track | X Start | X End | Center X |
|--------|-------------|---------|-------|----------|
| 1 | Track 1 | 100.25 | 235.25 | 167.75 |
| 2 | Track 7 | 235.25 | 370.25 | 302.75 |
| 3 | Track 13 | 370.25 | 505.25 | 437.75 |
| 4 | Track 19 | 505.25 | 640.25 | 572.75 |
| 5 | Track 25 | 640.25 | 775.25 | 707.75 |
| 6 | Track 31 | 775.25 | 910.25 | 842.75 |
| 7 | Track 37 | 910.25 | 1045.25 | 977.75 |
| 8 | Track 43 | 1045.25 | 1180.25 | 1112.75 |
| 9 | Track 49 | 1180.25 | 1315.25 | 1247.75 |

## Standard Carrier Dimensions

| Type | Width (mm) | Depth (mm) | Height (mm) | T-Width |
|------|-----------|-----------|-------------|---------|
| **5-Pos Plate (PLT_CAR_L5AC)** | 135 | 497 | 130 | 6T |
| **5-Pos Tip (TIP_CAR_480)** | 135 | 497 | 130 | 6T |
| **5-Pos DWP (PLT_CAR_L5_DWP)** | 135 | 497 | 91.57 | 6T |
| **5-Pos MTP (PLT_CAR_L5_MTP)** | 135 | 497 | 117.1 | 6T |
| **5-Pos PCR (PLT_CAR_L5PCR)** | 135 | 497 | 130 | 6T |
| **4-Pos HD (PLT_CAR_L4HD)** | 135 | 497 | — | 6T |
| **3-Pos Portrait (PLT_CAR_P3AC)** | 112.5 | 497 | — | 5T |
| **3-Pos Reagent (REA_CAR_L3AT)** | 135 | 497 | 130 | 6T |
| **12-Pos Reagent (RGT_CAR_12R)** | 135 | 497 | 130 | 6T |
| **32-Pos Sample (SMP_CAR_32)** | 22.5 | 497 | 140 | 1T |
| **FLEX Carrier** | 157.5 | 497 | 130 | 7T |
| **Waste Block** | 30 | 445 | 122 | ~1.3T |

## Site Positions within Standard 5-Position Landscape Carrier

Y-offsets from carrier origin (bottom-left corner):

| Position (Site.Id) | Y Offset | Physical Location |
|-----------------------|----------|-------------------|
| 1 | 392.5 mm | Rear (closest to pipetting arm) |
| 2 | 296.5 mm | Second from rear |
| 3 | 200.5 mm | Middle |
| 4 | 104.5 mm | Second from front |
| 5 | 8.5 mm | Front (closest to user) |

Site dimensions for landscape plate: Dx=127, Dy=86, X-offset from carrier left=4mm

## Site Z-Heights (Absolute from Deck Surface)

| Carrier Type | Site Z in TML | Deck Z | Absolute Z |
|-------------|--------------|--------|------------|
| Plate carrier (PLT_CAR_L5AC) | 86.15 | + 100.0 | 186.15 |
| PCR carrier (PLT_CAR_L5PCR) | 107.5 | + 100.0 | 207.5 |
| Medium deck carrier (PLT_CAR_L5MD) | 111.75 | + 100.0 | 211.75 |
| Tip carrier (TIP_CAR_480) | 114.95 | + 100.0 | 214.95 |
| DWP carrier (PLT_CAR_L5_DWP) | 81.77 | + 100.0 | 181.77 |
| MTP carrier (PLT_CAR_L5_MTP) | 107.3 | + 100.0 | 207.3 |
| Reagent carrier (REA_CAR_L3AT) | 77.52 | + 100.0 | 177.52 |
| Wash carrier | 98.8 | + 100.0 | 198.8 |
| Reagent trough (RGT_CAR_12R) | 81.0 | + 100.0 | 181.0 |
| MFX Pedestal MTP | 94.0 | + 100.0 | 194.0 |

## Standard Labware Footprints (SBS Standard)

| Labware Type | Footprint (mm) | Used in ExSite |
|-------------|---------------|----------------|
| Standard plate (landscape) | 127 × 86 | PL |
| Standard plate (portrait) | 86 × 127 | PP |
| Deep well plate (landscape) | 127 × 87 | DWL |
| Deep well plate (portrait) | 87 × 127 | DWP |
| High-density plate (landscape) | 128 × 86 | HDL |
| High-density plate (portrait) | 86 × 128 | HDP |
| Tip rack | 122 × 82 | Tip |
| Reagent trough | 116 × 117 | AT |

## Waste Block Area (STAR)

```
Position: X = 1318, Y = 115 (TForm translation from ML_STAR2.tpl)
Dimensions: 30 × 445 × 122 mm
Target Position: X = 1147.75 (autoload reference)

Components:
  - Teaching needle block: 20×75 at Y=347, Z=75
  - Waste trough: 150×220 at Y=87.5, Z=86
  - Rear verification: 30×30 at Y=308, Z=87
  - Front verification: 30×30 at Y=28, Z=87
```

## STARlet vs STAR Deck Comparison

| Feature | STARlet | Full STAR |
|---------|---------|-----------|
| Track Count | ~24 | 54 |
| Carrier Columns | ~4 | 9 |
| Waste Block X | ~778 mm | ~1318 mm |
| Total Width | ~680-700 mm | 1215 mm |
| Depth | 497 mm | 497 mm |

## FlexStar (STARplus) Additions

- Uses `StarPlusWasteBlock` template with extra sites for Core 96 and Core 384 waste
- Resources include left arm and right arm (Res_RightArm, Res_LeftArm)
- Waste block at X ≈ 778 mm
