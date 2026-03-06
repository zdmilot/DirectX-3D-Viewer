# Hamilton MultiFlex Carrier System

## Overview

The MultiFlex (MFX) carrier system is Hamilton's modular carrier platform. It consists of:
1. **Base carriers** — the main frame that sits on deck tracks
2. **Pedestals** — modular site modules that snap onto the base
3. **Containers/Racks** — labware that sits on the pedestals

Configuration is defined in two XML files:
- `Config\StarCarriers.xml` — Base carrier definitions
- `Config\StarCarrierPedestals.xml` — Pedestal module definitions

Physical templates and 3D models live in:
- `Labware\ML_STAR\MFXCreation\` — Templates, 3D models, containers
- `Labware\ML_STAR\MultiFlexCarrier\` — Pre-built MFX carrier combinations

## Base Carriers (StarCarriers.xml)

| Display Name | Part # | Dimensions (mm) | Pedestal Count | Pedestal Y Positions |
|-------------|--------|-----------------|----------------|---------------------|
| **5 Position** | 188039 | 135 × 497 × 18 | 5 | 435.5, 339.5, 243.5, 147.5, 51.5 |
| **4 Position** | 188039 | 135 × 497 × 18 | 4 | 387.5, 291.5, 195.5, 99.5 |
| **4 Position (Shaker)** | 187001/55574-01 | 157.5 × 497 × 8 | 4 | 418.05, 298.05, 178.05, 58.05 |
| **3 Position (Portrait)** | 188053 | 112.5 × 497 × 18 | 3 | 393, 247, 101 |

### Base Carrier Properties

Each carrier in `StarCarriers.xml` defines:

```xml
<carrier 
    displayName="5 Position"                  <!-- User-visible name -->
    displayPartNumber="188039"                <!-- Part number -->
    dimensions="135,497,18"                   <!-- X,Y,Z in mm -->
    templateFilePath="ML_STAR\MFXCreation\Base - 5 Position.tml"
    imageFilePath="ML_STAR\MFXCreation\Base - 5 Position.png"
    modelFilePath="ML_STAR\MFXCreation\Base - 5 Position.x"
    sitePedestalOffsets="[67.5,435.5,0];[67.5,339.5,0];[67.5,243.5,0];[67.5,147.5,0];[67.5,51.5,0]"
    sitePedestalTypes="[TurnTable,LidParkBack,Standard];[HeatCool,Standard];[HeatCool,Standard];[HeatCool,Standard];[HeatCool,LidPark,Standard]"
    modelOffsets="0,0,0"
    modelEdgeOffsets="0,-2.5,0" />
```

- **sitePedestalOffsets**: Center X,Y,Z for each pedestal position (in carrier-relative coords)
- **sitePedestalTypes**: What pedestal types are compatible with each position
- **modelOffsets**: 3D model alignment adjustment
- **modelEdgeOffsets**: Edge alignment for 3D model vs template rectangle

## Pedestal Modules (StarCarrierPedestals.xml)

### Standard Pedestals

| Display Name | Part # | Type Key | Oversized? |
|-------------|--------|----------|-----------|
| Heating Module | 188045 | HeatCool | Yes (-1: blocks previous) |
| Cooling Module | 188046 | HeatCool | Yes (-1: blocks previous) |
| Turn Table Module | 188055APE | TurnTable | Yes (+1: blocks next) |
| Lid Park Module | 188058APE | LidPark | No |
| Lid Park Module (Back) | 188058APE | LidParkBack | No |
| Standard Pedestal | — | Standard | No |

### Shaker-Compatible Pedestals (Brackets Variant)

| Display Name | Part # | Type Key |
|-------------|--------|----------|
| Heating Module (Brackets) | 188045 | HeatCoolShaker |
| Cooling Module (Brackets) | 188046 | HeatCoolShaker |
| Lid Park (Brackets) | 188058APE | LidParkShaker |
| Lid Park (Back, Brackets) | 188058APE | LidParkBackShaker |
| Standard (Brackets) | — | StandardShaker |

### Pedestal Properties

```xml
<pedestal 
    displayName="Heating Module"              <!-- User-visible name -->
    displayPartNumber="188045"                <!-- Part number -->
    pedestalType="HeatCool"                   <!-- Type key for carrier matching -->
    templateFilePath="ML_STAR\MFXCreation\Pedestal - Heating Module.tml"
    modelFilePath="ML_STAR\MFXCreation\Pedestal - Heating Module.x"
    imageFilePath="ML_STAR\MFXCreation\Pedestal - Heating Module.png"
    modelOffsetsOverride="0,47"               <!-- X,Y offset for 3D model -->
    sitesOffsetsOverride="0,16.5"             <!-- X,Y offset for template sites -->
    oversized="-1" />                         <!-- Blocks neighbor: -1=previous, +1=next -->
```

- **pedestalType**: Links the pedestal to compatible carrier positions
- **modelOffsetsOverride**: Adjusts 3D model position relative to pedestal center
- **sitesOffsetsOverride**: Adjusts template placement relative to pedestal center
- **oversized**: Negative = blocks previous position, Positive = blocks next position

## MFX Pedestal Template Example (Pedestal - MTP.tml)

```
Dimensions: 137 × 96 × 94 mm
1 Site: Dx=127, Dy=86, Id="1", X=5, Y=5, Z=94
ViewName: "Pedestal - MTP"
PropertyValue for part number: "188041"
```

## Available Pedestal Types (MFXCreation Folder)

### Plate/Labware Pedestals
- **MTP** — Microplate (standard)
- **MTP HP Flat / Raised / Tabbed** — High-precision variants
- **DWP** — Deep well plate
- **DWP HP Flat / Raised / Tabbed** — High-precision deep well
- **DWP Nest Container/Rack Based** — Nested deep well
- **MIDI HP Flat / Tabbed / Raised** — MIDI plate
- **PCR 96 / PCR 96 ABI / PCR 384** — PCR plate pedestals
- **Matrix 1.4mL DH** — Matrix tube rack
- **Base HP Tabbed** — Base high-precision tabbed

### Tip Pedestals
- **Tip Module** — Standard tips
- **Tip Module BC** — Tips with barcode reading
- **Tip Isolator** — Tip isolation module
- **Tip Park Module** — Tip parking
- **Tip Stack Low / Standard** — Tip stacking (low/standard height)
- **NTR1 / NTR4** — Nested Tip Rack (1-layer / 4-layer)
- **NTR1 384** — Nested Tip Rack for 384 format

### Functional Pedestals
- **Heating Module** — Temperature control (heat)
- **Cooling Module** — Temperature control (cool)
- **CPAC 2mL / CPAC Flat** — CPAC module
- **HHS / HHC** — Hamilton Heater Shaker / Heater Cooler
- **Teleshake 95 MTP / DWP** — Teleshake module
- **Teleshake MTP / DWP** — Teleshake module (alternative)
- **Tilt Module** — Plate tilting module
- **Turn Table Module** — Plate rotation module
- **Lid Park Module** — Lid parking module
- **Stacker Module** — Plate stacking module
- **Byonoy Park / Reader** — Byonoy absorbance reader

### Reagent Pedestals
- **RGT** — Standard reagent trough
- **RGT 8 Refill** — 8-position refill reagent
- **RGT 96 Refill** — 96-position refill reagent
- **RGT 20mL Lid Parking** — 20mL with lid parking
- **Gravity Waste** — Gravity waste module
- **Downholder** — Plate downholder

### Tube Pedestals
- **Tube Module** — Standard tube holder
- **Tube Module Mixed** — Mixed tube sizes

### Portrait Variants
Most pedestals have `(Portrait)` variants with dimensions rotated for portrait carriers (3 Position Portrait base).

### Brackets Variants
Most pedestals have `(Brackets)` variants for use with the 4 Position (Shaker) base carrier.

## Pre-Built MultiFlex Carriers

The `ML_STAR\MultiFlexCarrier\` folder contains 50+ pre-built carrier configurations combining bases with specific pedestal arrangements. These appear in the labware catalog as ready-to-use carriers (e.g., `MFX_CAR_5DWP_HPFlat`).

## Nimbus Carrier System (for comparison)

The Nimbus uses a similar but distinct carrier system:

| Property | STAR | Nimbus |
|----------|------|--------|
| Base Carrier Depth | 497 mm | 402.844 mm |
| Base Carrier Width | 135 mm typical | 134.724 mm |
| Config Format | XML | XML |
| Pedestal Type Keys | HeatCool, Standard, etc. | Standard, Stack, HHS, CPAC |
| Carrier Count | 4 bases | 9 bases |
| Loadable Flag | MlStarCarIsAutoLoad | isLoadable attribute |
| Barcode Pattern | Carrier-specific | CAR-****, 8CH-****, CCR-**** |
