# Hamilton VENUS File Reference — Complete Paths

## Deck Configuration Files

```
C:\Program Files (x86)\Hamilton\Config\
├── ML_STAR.dck              ← Master STAR deck (54 tracks, text format)
├── ML_STAR2.dck             ← Extended STAR deck (binary)
├── ML_Starlet.dck           ← STARlet deck (binary)
├── ML_FlexStar.dck          ← FlexStar/STARplus deck (binary)
├── Diagnostic.dck           ← Diagnostic deck (1 track, text)
├── ML_STAR2.tpl             ← Default STAR layout template
├── ML_Starlet.tpl           ← Default STARlet layout template
├── ML_FlexStar.tpl          ← Default FlexStar layout template
├── VStar.tpl                ← Vantage layout template (binary)
├── StarCarriers.xml         ← MultiFlex base carrier definitions
├── StarCarrierPedestals.xml ← MultiFlex pedestal definitions
├── NimbusCarriers.xml       ← Nimbus base carrier definitions
├── NimbusCarrierPedestals.xml ← Nimbus pedestal definitions
├── HxMetEd.cfg              ← Method Editor UI config
├── HxHslMetEd.ini           ← HSL editor config
├── ML_STAR.cfg              ← STAR instrument config (binary)
├── ML_STARlet.cfg           ← STARlet instrument config (binary)
├── ML_FlexStar.cfg          ← FlexStar instrument config (binary)
├── ML_STARType.cfg          ← STAR type definitions (binary)
├── ML_STARTypeEnu.cfg       ← STAR type English descriptions (binary)
├── VantageType.cfg          ← Vantage type definitions (binary)
├── VantageTypeEnu.cfg       ← Vantage type English descriptions (binary)
├── VStar.cfg                ← Vantage config (binary)
├── VStarCabinet.cfg         ← Vantage cabinet config
├── StarToVantageTranslation.cfg     ← STAR→Vantage carrier translation
├── VantageToStarTranslation.cfg     ← Vantage→STAR carrier translation
├── VOVExtConfig.cfg         ← VOV extended config (binary)
├── VOVEntryExit.cfg         ← VOV entry/exit config
├── VOVTrackGripper.cfg      ← VOV track gripper config
└── CollisionController.cfg  ← Collision detection config
```

## Labware Files

```
C:\Program Files (x86)\Hamilton\Labware\
├── ML_STAR\                         ← Root ML_STAR carriers & labware
│   ├── PLT_CAR_L5AC.tml            ← Plate carrier 5-pos landscape
│   ├── PLT_CAR_L5AC_A00.tml        ← Same + 3D model + barcode
│   ├── PLT_CAR_L5MD.tml            ← Medium deck plate carrier
│   ├── PLT_CAR_L5PCR.tml           ← PCR plate carrier
│   ├── PLT_CAR_L5FLEX_AC.tml       ← FLEX carrier (7T wide)
│   ├── PLT_CAR_L5_DWP.tml          ← Deep well plate carrier
│   ├── PLT_CAR_L5_MTP.tml          ← MTP carrier
│   ├── PLT_CAR_L4HD.tml            ← 4-pos HD carrier
│   ├── PLT_CAR_P3AC_A00.tml        ← 3-pos portrait carrier
│   ├── TIP_CAR_480.tml             ← 5-pos tip carrier
│   ├── TIP_CAR_480_A00.tml         ← Same + 3D model
│   ├── TIP_CAR_480BC_A00.tml       ← With barcode reading
│   ├── TIP_CAR_384_A00.tml         ← 4-pos tip carrier
│   ├── TIP_CAR_288_A00.tml         ← 3-pos portrait tip carrier (4T)
│   ├── Car_Reagenz.tml              ← Reagent carrier
│   ├── REA_CAR_L3AT.tml            ← Reagent carrier 3-pos
│   ├── RGT_CAR_12R.tml             ← 12-trough reagent carrier
│   ├── SMP_CAR_32_A00.rck          ← 32-pos sample carrier (1T)
│   ├── Car_Wash_*.tml              ← Wash station carriers
│   ├── WasteBlock.tml              ← Legacy waste block
│   ├── PCR_CAR_L5_384_A00.tml      ← 384 PCR carrier
│   │
│   ├── CORE\                        ← Core system components
│   │   ├── WasteBlock.tml           ← Enhanced waste block (8 sites)
│   │   ├── StarPlusWasteBlock.tml   ← FlexStar waste block
│   │   ├── Waste2.rck              ← Waste container rack
│   │   ├── Verification.rck        ← Verification rack
│   │   ├── TeachingNeedleBlock.rck  ← Teaching needle rack
│   │   ├── TeachingNeedle5ml.rck   ← 5mL teaching needle
│   │   ├── *.hxx, *.x, *.gltf     ← 3D models
│   │   └── VStarWasteBlock_*.tml   ← Vantage waste block variants
│   │
│   ├── MFXCreation\                  ← MultiFlex creation components
│   │   ├── Base - 5 Position.tml    ← 5-pos base template
│   │   ├── Base - 4 Position.tml    ← 4-pos base template
│   │   ├── Base - 4 Position (Shaker).tml
│   │   ├── Base - 3 Position (Portrait).tml
│   │   ├── Pedestal - MTP.tml       ← MTP pedestal template
│   │   ├── Pedestal - DWP.tml       ← DWP pedestal template
│   │   ├── Pedestal - *.tml         ← ~80 pedestal templates
│   │   ├── Rack - *.rck             ← Pedestal-specific racks
│   │   ├── Container - *.ctr        ← Container definitions
│   │   └── *.x, *.png              ← 3D models and images
│   │
│   ├── MultiFlexCarrier\            ← Pre-built MFX carrier combos (50+)
│   │   └── MFX_CAR_*.tml           ← Ready-to-use MFX carriers
│   │
│   ├── DECK-ADAPTOR-TEMPLATES\     ← Deck adaptor templates
│   ├── Tips\                        ← Tip definitions
│   ├── WASHSTATION\                 ← Wash station labware
│   ├── 96CoReHead\                  ← 96-channel CO-RE head
│   ├── 384CoReHead\                 ← 384-channel CO-RE head
│   └── ...                          ← Other subdirectories
│
├── 3D Models\                       ← General 3D models
│   ├── Devices\VSpin\
│   └── Tools\CORE_Grips\
│
├── VRTX\                           ← Vantage-specific labware
├── Nimbus\                         ← Nimbus-specific labware
├── ML_STAR-Category.dat            ← STAR labware category index
├── Category.dat                    ← Global category index
├── BaseCategory.dat                ← Base category definitions
├── Index.dat                       ← Labware index
└── Labware.json                    ← Installer metadata (JSON)
```

## Binary vs Text File Summary

### Text-Readable Config Files
- `ML_STAR.dck` — Full deck definition
- `Diagnostic.dck` — Diagnostic deck
- `ML_STAR2.tpl` — Default STAR layout
- `ML_Starlet.tpl` — Default STARlet layout
- `ML_FlexStar.tpl` — Default FlexStar layout
- `StarCarriers.xml` — MFX carrier definitions
- `StarCarrierPedestals.xml` — MFX pedestal definitions
- `NimbusCarriers.xml` — Nimbus carrier definitions
- `NimbusCarrierPedestals.xml` — Nimbus pedestal definitions
- `HxMetEd.cfg` — Method Editor UI config
- `HxHslMetEd.ini` — HSL editor config
- All `.tml` files — Carrier/pedestal templates
- All `.rck` files — Rack definitions
- All `.ctr` files — Container definitions

### Binary Files (Not Text-Readable)
- `ML_STAR2.dck`, `ML_Starlet.dck`, `ML_FlexStar.dck`
- `ML_STAR.cfg`, `ML_STARlet.cfg`, `ML_FlexStar.cfg`
- `ML_STARType.cfg`, `ML_STARTypeEnu.cfg`
- `VStar.tpl`, `VStar.cfg`, `VStarCabinet.cfg`
- `VOVExtConfig.cfg`
- All `.lay` files (saved deck layouts)
- Some `.tml` files in `MultiFlexCarrier\` subfolder
