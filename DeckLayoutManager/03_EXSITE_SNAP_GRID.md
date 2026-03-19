# Hamilton STAR — Extended Sites (ExSites) & Snap Grid System

## What Are ExSites?

ExSites (Extended Sites) are **invisible snap grid positions** defined in the `.dck` file. When a user drags a carrier onto the deck in the Layout Editor, the carrier **snaps to the nearest ExSite** that matches its type and orientation.

ExSites are NOT the same as tracks. Tracks define where carriers physically sit; ExSites define where the carrier's **site positions** (plate sites, tip sites, reagent sites) align within the carrier.

## ExSite Types — ML_STAR.dck (279 Total)

The ML_STAR deck defines 279 ExSites across 8 categories:

| Type | Prefix | Count | Site Dim (Dx × Dy) | Z Height | Grid | Description |
|------|--------|-------|--------------------|----------|------|-------------|
| Plate Landscape | **PL** | 45 | 127 × 86 mm | 211.75 | 9 cols × 5 rows | Standard plate in landscape orientation |
| Plate Portrait | **PP** | 27 | 86 × 127 mm | 211.75 | 9 cols × 3 rows | Standard plate in portrait orientation |
| Deep Well Landscape | **DWL** | 45 | 127 × 87 mm | 186.15 | 9 cols × 5 rows | Deep well plate, landscape |
| Deep Well Portrait | **DWP** | 27 | 87 × 127 mm | 186.15 | 9 cols × 3 rows | Deep well plate, portrait |
| High-Density Landscape | **HDL** | 36 | 128 × 86 mm | 217.65 | 9 cols × 4 rows | High-density plate, landscape |
| High-Density Portrait | **HDP** | 27 | 86 × 128 mm | 217.65 | 9 cols × 3 rows | High-density plate, portrait |
| Auto Trough | **AT** | 27 | 116 × 117 mm | 177.75 | 9 cols × 3 rows | Reagent trough positions |
| Tip Rack | **Tip** | 45 | 122 × 82 mm | 214.9 | 9 cols × 5 rows | Tip rack positions (SnapBase=1) |

## ExSite Coordinate Grid

### Column X Positions (9 columns, aligned to 6T carrier positions)

| Column | Carrier Position | PL / DWL X | PP / DWP / HDP X | HDL X | AT X | Tip X |
|--------|-----------------|------------|-------------------|-------|------|-------|
| 1 | Track 1 | 104.0 | 143.9 | 104.1 | 110.0 | 106.375 |
| 2 | Track 7 | 239.0 | 278.9 | 239.1 | 245.0 | 241.375 |
| 3 | Track 13 | 374.0 | 413.9 | 374.1 | 380.0 | 376.375 |
| 4 | Track 19 | 509.0 | 548.9 | 509.1 | 515.0 | 511.375 |
| 5 | Track 25 | 644.0 | 683.9 | 644.1 | 650.0 | 646.375 |
| 6 | Track 31 | 779.0 | 818.9 | 779.1 | 785.0 | 781.375 |
| 7 | Track 37 | 914.0 | 953.9 | 914.1 | 920.0 | 916.375 |
| 8 | Track 43 | 1049.0 | 1088.9 | 1049.1 | 1055.0 | 1051.375 |
| 9 | Track 49 | 1184.0 | 1223.9 | 1184.1 | 1190.0 | 1186.375 |

**Column spacing**: 135.0 mm (= 6T) for all types.

### Row Y Positions (varies by type)

#### 5-Row Types (PL, DWL, Tip) — 45 positions each
| Row | PL Y | DWL Y | Tip Y | Spacing |
|-----|------|-------|-------|---------|
| 1 (rear) | 455.4 | 455.4 | 457.15 | — |
| 2 | 359.4 | 359.4 | 361.15 | 96.0 |
| 3 | 263.4 | 263.4 | 265.15 | 96.0 |
| 4 | 167.4 | 167.4 | 169.15 | 96.0 |
| 5 (front) | 71.4 | 71.4 | 73.15 | 96.0 |

#### 4-Row Types (HDL) — 36 positions
| Row | HDL Y | Spacing |
|-----|-------|---------|
| 1 (rear) | 428.7 | — |
| 2 | 318.7 | 110.0 |
| 3 | 208.7 | 110.0 |
| 4 (front) | 98.7 | 110.0 |

#### 3-Row Types (PP, DWP, HDP, AT) — 27 positions each
| Row | PP/DWP/HDP Y | AT Y | Spacing (PP) | Spacing (AT) |
|-----|-------------|------|-------------|-------------|
| 1 (rear) | 381.05 | 403.75 | — | — |
| 2 | 235.05 | 248.05 | 146.0 | 155.7 |
| 3 (front) | 89.05 | 92.35 | 146.0 | 155.7 |

## Z Heights by ExSite Type

```
Tip:  214.9 mm   ← Highest (tip racks sit on raised positions)
HDL:  217.65 mm  ← High-density plates  
PL:   211.75 mm  ← Standard plates
DWL:  186.15 mm  ← Deep well plates (lower deck carrier)
AT:   177.75 mm  ← Auto trough / reagent (lowest)
```

## ExSite Properties

Each ExSite entry in the `.dck` file:
```
ExSite.N.Dx,        "127"        // Width (mm)
ExSite.N.Dy,        "86"         // Depth (mm) 
ExSite.N.Id,        "PL1"        // Unique identifier (type + number)
ExSite.N.Label,     "1"          // Always "1" (visible)
ExSite.N.SnapBase,  "0|1"        // 0=free snap, 1=fixed snap (Tip only)
ExSite.N.X,         "104.0"      // X position (mm)
ExSite.N.Y,         "455.4"      // Y position (mm) 
ExSite.N.Z,         "211.75"     // Z position (mm)
```

## How Carriers Use ExSites

When a carrier (`.tml` file) is placed on the deck, the Layout Editor matches the carrier's internal site dimensions to the appropriate ExSite type:

| Carrier Site Dims | Maps to ExSite | Example Carrier |
|-------------------|----------------|-----------------|
| Dx=127, Dy=86 | **PL** (landscape plate) | PLT_CAR_L5AC (5-position plate carrier) |
| Dx=86, Dy=127 | **PP** (portrait plate) | PLT_CAR_P3AC (3-position portrait) |
| Dx=127, Dy=87 | **DWL** (landscape deep well) | PLT_CAR_L5_DWP (deep well carrier) |
| Dx=87, Dy=127 | **DWP** (portrait deep well) | PLT_CAR_L5_DWP portrait variants |
| Dx=128, Dy=86 | **HDL** (high-density landscape) | PLT_CAR_L4HD (4-position HD carrier) |
| Dx=86, Dy=128 | **HDP** (high-density portrait) | HD portrait carriers |
| Dx=116, Dy=117 | **AT** (auto trough) | REA_CAR_L3AT (reagent carrier) |
| Dx=122, Dy=82 | **Tip** (tip rack) | TIP_CAR_480 (5-position tip carrier) |

## Snap Behavior

- **SnapBase=0** (most ExSites): Carrier aligns to the ExSite grid but Z is determined by the carrier's site Z value
- **SnapBase=1** (Tip ExSites and all Tracks): Position is rigidly snapped — both XY and Z are locked to the ExSite/Track position
