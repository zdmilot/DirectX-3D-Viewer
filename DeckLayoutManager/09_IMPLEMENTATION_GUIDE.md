# Recapitulating Hamilton Track Logic — Implementation Guide

## Goal

Rebuild the Hamilton VENUS deck layout track logic in a new 3D application, faithfully reproducing the carrier placement, snap grid, and spatial relationships from the original Layout Editor.

## Step 1: Build the Deck Frame

Create a 3D surface representing the deck:

```
Deck width:   1600 mm (canvas), 1215 mm (usable track area)
Deck depth:   520 mm (canvas), 497 mm (track depth)
Deck surface: Z = 100 mm (all tracks sit at this height)

Track area origin: X = 100.25, Y = 63.0
Track area end:    X = 1314.75, Y = 560.0
```

## Step 2: Generate Track Slots

Create 54 track slot geometries:

```python
TRACK_WIDTH = 22.0      # mm (physical slot width)
TRACK_SPACING = 22.5    # mm (center-to-center)
TRACK_GAP = 0.5         # mm (gap between tracks)
TRACK_DEPTH = 497.0     # mm (Y-axis length)
TRACK_Y_START = 63.0    # mm
TRACK_Z = 100.0         # mm (deck surface height)
FIRST_TRACK_X = 100.25  # mm
TRACK_COUNT = 54

# Labeled tracks (every 6th, starting at 1) — these show track numbers
LABELED_TRACKS = [1, 7, 13, 19, 25, 31, 37, 43, 49]

for i in range(1, TRACK_COUNT + 1):
    x = FIRST_TRACK_X + (i - 1) * TRACK_SPACING
    labeled = i in LABELED_TRACKS
    # Create slot at (x, TRACK_Y_START, TRACK_Z) with dimensions (TRACK_WIDTH, TRACK_DEPTH)
```

## Step 3: Define Carrier Types with T-Unit Widths

```python
CARRIERS = {
    "PLT_CAR_L5AC": {"t_width": 6, "dx": 135, "dy": 497, "dz": 130, "sites": 5, "site_z": 86.15},
    "TIP_CAR_480":  {"t_width": 6, "dx": 135, "dy": 497, "dz": 130, "sites": 5, "site_z": 114.95},
    "REA_CAR_L3AT": {"t_width": 6, "dx": 135, "dy": 497, "dz": 130, "sites": 3, "site_z": 77.52},
    "RGT_CAR_12R":  {"t_width": 6, "dx": 135, "dy": 497, "dz": 130, "sites": 12, "site_z": 81},
    "PLT_CAR_P3AC": {"t_width": 5, "dx": 112.5, "dy": 497, "dz": 130, "sites": 3, "site_z": 86.15},
    "SMP_CAR_32":   {"t_width": 1, "dx": 22.5, "dy": 497, "dz": 140, "sites": 32, "site_z": 10.8},
    "TIP_CAR_288":  {"t_width": 4, "dx": 90, "dy": 497, "dz": 130, "sites": 3, "site_z": 114.7},
    "PLT_CAR_L5FLEX":{"t_width": 7, "dx": 157.5, "dy": 497, "dz": 130, "sites": 5, "site_z": 89.1},
}
```

## Step 4: Implement Carrier Snap Logic

```python
def snap_to_track(carrier_x, carrier_t_width):
    """
    Given a desired X position and carrier width in T-units,
    snap to the nearest valid track position.
    """
    # Find nearest track
    nearest_track = round((carrier_x - FIRST_TRACK_X) / TRACK_SPACING) + 1
    nearest_track = max(1, min(nearest_track, TRACK_COUNT - carrier_t_width + 1))
    
    snapped_x = FIRST_TRACK_X + (nearest_track - 1) * TRACK_SPACING
    return snapped_x, nearest_track

def check_collision(existing_carriers, new_track_start, new_t_width):
    """
    Check if placing a carrier at track_start with t_width tracks
    would overlap with any existing carrier.
    """
    new_range = range(new_track_start, new_track_start + new_t_width)
    for carrier in existing_carriers:
        existing_range = range(carrier.track_start, carrier.track_start + carrier.t_width)
        if set(new_range) & set(existing_range):
            return True  # Collision detected
    return False
```

## Step 5: Build ExSite Snap Grid

ExSites determine where labware within carriers snaps to:

```python
EXSITE_COLUMNS = {
    # column: {type: x_position}
    1: {"PL": 104.0, "PP": 143.9, "DWL": 104.0, "DWP": 143.9, "HDL": 104.1, "HDP": 143.9, "AT": 110.0, "Tip": 106.375},
    2: {"PL": 239.0, "PP": 278.9, "DWL": 239.0, "DWP": 278.9, "HDL": 239.1, "HDP": 278.9, "AT": 245.0, "Tip": 241.375},
    # ... columns 3-9 each offset by 135.0mm
}

EXSITE_ROWS = {
    "PL":  [455.4, 359.4, 263.4, 167.4, 71.4],      # 5 rows, spacing 96.0
    "DWL": [455.4, 359.4, 263.4, 167.4, 71.4],       # 5 rows, spacing 96.0
    "Tip": [457.15, 361.15, 265.15, 169.15, 73.15],  # 5 rows, spacing 96.0
    "HDL": [428.7, 318.7, 208.7, 98.7],              # 4 rows, spacing 110.0
    "PP":  [381.05, 235.05, 89.05],                   # 3 rows, spacing 146.0
    "DWP": [381.05, 235.05, 89.05],                   # 3 rows, spacing 146.0
    "HDP": [381.05, 235.05, 89.05],                   # 3 rows, spacing 146.0
    "AT":  [403.75, 248.05, 92.35],                   # 3 rows, spacing ~155.7
}

EXSITE_DIMS = {
    "PL":  {"dx": 127, "dy": 86,  "z": 211.75},
    "PP":  {"dx": 86,  "dy": 127, "z": 211.75},
    "DWL": {"dx": 127, "dy": 87,  "z": 186.15},
    "DWP": {"dx": 87,  "dy": 127, "z": 186.15},
    "HDL": {"dx": 128, "dy": 86,  "z": 217.65},
    "HDP": {"dx": 86,  "dy": 128, "z": 217.65},
    "AT":  {"dx": 116, "dy": 117, "z": 177.75},
    "Tip": {"dx": 122, "dy": 82,  "z": 214.9},
}
```

## Step 6: Site Positions within Carriers

Standard 5-position landscape carrier site layout:

```python
LANDSCAPE_5POS_SITES = [
    # (site_id, x_offset, y_offset) relative to carrier origin
    (1, 4, 392.5),   # Rear
    (2, 4, 296.5),   # Second from rear  
    (3, 4, 200.5),   # Middle
    (4, 4, 104.5),   # Second from front
    (5, 4, 8.5),     # Front
]

# Absolute position = carrier_position + site_offset
# carrier_x = track X position
# carrier_y = 63.0 (track Y start)
# site_absolute_x = carrier_x + site.x_offset
# site_absolute_y = carrier_y + site.y_offset
# site_absolute_z = TRACK_Z + site.z_offset (e.g., 100 + 86.15 = 186.15)
```

## Step 7: Coordinate Transform for Layout

The `.tpl` and `.lay` files use a 3×3 transform matrix:

```python
# TForm matrix (row-major):
# [TForm.1.X, TForm.1.Y, TForm.1.Z]   = [ScaleX, 0,      0]
# [TForm.2.X, TForm.2.Y, TForm.2.Z]   = [0,      ScaleY, 0]  
# [TForm.3.X, TForm.3.Y, TForm.3.Z]   = [TransX, TransY, 1]

# For standard placement (no rotation):
# ScaleX = 1, ScaleY = 1
# TransX, TransY = absolute deck position in mm
```

## Step 8: Reconstruction Checklist

- [ ] Deck frame: 1600 × 520 mm canvas, origin offset (-80, 51)
- [ ] 54 track slots: 22.0mm wide, 22.5mm spacing, starting at X=100.25
- [ ] Track labels on tracks 1, 7, 13, 19, 25, 31, 37, 43, 49
- [ ] 279 ExSite snap positions (8 types × row/column grid)
- [ ] Carrier placement with T-unit snap
- [ ] Carrier collision detection
- [ ] Site positions within carriers (Id-based, not index-based)
- [ ] Z-height calculation per carrier type
- [ ] Waste block area at X≈1318 (STAR) or X≈778 (STARlet/FlexStar)
- [ ] 3D models from .hxx / .x / .gltf files
- [ ] Barcode patterns and autoload properties
