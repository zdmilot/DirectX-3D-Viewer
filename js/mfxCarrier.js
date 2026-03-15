/* ============================================================
   MFX Carrier Creator — Build and visualize Hamilton Multiplex
   (MFX) carrier configurations with 3D module placement.
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  Carrier Definitions
    //  slot coords: x=width offset(mm), y=depth offset(mm), z=height(mm)
    //  (Hamilton coordinate convention — mapped to Three.js in rendering)
    // ================================================================
    const MFX_CARRIER_DEFS = {
        MFX_CAR_L5: {
            key: 'MFX_CAR_L5',
            label: 'MFX CAR L5',
            description: 'MFX Carrier L5 — 5 landscape positions, 6-track (135 mm)',
            dx: 135, dy: 497, dz: 130,
            color: 0x607080,
            modelFile: 'mfx_assets/MFX_CAR_L5_XXX_A00.x',
            slots: [
                { id: 1, label: 'Pos 5', x: 4, y:   8.5, z: 112, dx: 127, dy: 86 },
                { id: 2, label: 'Pos 4', x: 4, y: 104.5, z: 112, dx: 127, dy: 86 },
                { id: 3, label: 'Pos 3', x: 4, y: 200.5, z: 112, dx: 127, dy: 86 },
                { id: 4, label: 'Pos 2', x: 4, y: 296.5, z: 112, dx: 127, dy: 86 },
                { id: 5, label: 'Pos 1', x: 4, y: 392.5, z: 112, dx: 127, dy: 86 },
            ],
        },
        MFX_CAR_L4: {
            key: 'MFX_CAR_L4',
            label: 'MFX CAR L4',
            description: 'MFX Carrier L4 — 4 landscape positions, 6-track (135 mm)',
            dx: 135, dy: 497, dz: 130,
            color: 0x5a6a7a,
            modelFile: 'mfx_assets/MFX_CAR_L4_XXX_A00.x',
            slots: [
                { id: 1, label: 'Pos 4', x: 4, y:   8.5, z: 112, dx: 127, dy: 86 },
                { id: 2, label: 'Pos 3', x: 4, y: 136.5, z: 112, dx: 127, dy: 86 },
                { id: 3, label: 'Pos 2', x: 4, y: 264.5, z: 112, dx: 127, dy: 86 },
                { id: 4, label: 'Pos 1', x: 4, y: 392.5, z: 112, dx: 127, dy: 86 },
            ],
        },
        MFX_CAR_P3: {
            key: 'MFX_CAR_P3',
            label: 'MFX CAR P3',
            description: 'MFX Carrier P3 — 3 portrait positions, 6-track (135 mm)',
            dx: 135, dy: 497, dz: 130,
            color: 0x6a607a,
            modelFile: 'mfx_assets/MFX_CAR_P3_XXX_A00.x',
            slots: [
                { id: 1, label: 'Pos 3', x: 22.5, y:  37.5, z: 112, dx: 86, dy: 127 },
                { id: 2, label: 'Pos 2', x: 22.5, y: 183.5, z: 112, dx: 86, dy: 127 },
                { id: 3, label: 'Pos 1', x: 22.5, y: 329.5, z: 112, dx: 86, dy: 127 },
            ],
        },
        MFX_CAR_5: {
            key: 'MFX_CAR_5',
            label: 'MFX CAR 5T',
            description: 'MFX Carrier 5T — 5 positions, 5-track (112.5 mm)',
            dx: 112.5, dy: 497, dz: 130,
            color: 0x507060,
            modelFile: 'mfx_assets/MFX_CAR_5_XXX_A00.x',
            slots: [
                { id: 1, label: 'Pos 5', x: 4, y:   8.5, z: 112, dx: 104, dy: 86 },
                { id: 2, label: 'Pos 4', x: 4, y: 104.5, z: 112, dx: 104, dy: 86 },
                { id: 3, label: 'Pos 3', x: 4, y: 200.5, z: 112, dx: 104, dy: 86 },
                { id: 4, label: 'Pos 2', x: 4, y: 296.5, z: 112, dx: 104, dy: 86 },
                { id: 5, label: 'Pos 1', x: 4, y: 392.5, z: 112, dx: 104, dy: 86 },
            ],
        },
        MFX_CAR_7T: {
            key: 'MFX_CAR_7T',
            label: 'MFX CAR 7T',
            description: 'MFX Carrier 7T — 5 positions, 7-track (157.5 mm)',
            dx: 157.5, dy: 497, dz: 90,
            color: 0x607550,
            modelFile: 'mfx_assets/MFX_CAR_7T_XXX_A00.x',
            slots: [
                { id: 1, label: 'Pos 5', x: 15.25, y:   8.5, z: 75.5, dx: 127, dy: 86 },
                { id: 2, label: 'Pos 4', x: 15.25, y: 104.5, z: 75.5, dx: 127, dy: 86 },
                { id: 3, label: 'Pos 3', x: 15.25, y: 200.5, z: 75.5, dx: 127, dy: 86 },
                { id: 4, label: 'Pos 2', x: 15.25, y: 296.5, z: 75.5, dx: 127, dy: 86 },
                { id: 5, label: 'Pos 1', x: 15.25, y: 392.5, z: 75.5, dx: 127, dy: 86 },
            ],
        },
    };

    // ================================================================
    //  Module Catalog
    // ================================================================
    const MFX_MODULE_CATALOG = [
        // ── Plate Handling ──────────────────────────────────────────
        { key: 'PCR96Module',           label: 'PCR 96 Module',             category: 'Plate Handling',     modelFile: 'mfx_assets/PCR96Module.x',           previewImg: 'mfx_assets/PCR96Module.jpg' },
        { key: 'PCR384Module',          label: 'PCR 384 Module',            category: 'Plate Handling',     modelFile: 'mfx_assets/PCR384Module.x',          previewImg: 'mfx_assets/PCR384Module.jpg' },
        { key: 'MTPModule',             label: 'MTP Module',                category: 'Plate Handling',     modelFile: 'mfx_assets/MTPModule.x',             previewImg: 'mfx_assets/MTPModule.jpg' },
        { key: 'DWPModule',             label: 'DWP Module',                category: 'Plate Handling',     modelFile: 'mfx_assets/DWPModule.x',             previewImg: 'mfx_assets/DWPModule.jpg' },
        { key: 'NTR1Module',            label: 'NTR 1 Module',              category: 'Plate Handling',     modelFile: 'mfx_assets/NTR1Module.x',            previewImg: 'mfx_assets/NTR1Module.jpg' },
        { key: 'NTR1_384Module',        label: 'NTR 1 384 Module',          category: 'Plate Handling',     modelFile: 'mfx_assets/NTR1_384Module.x',        previewImg: 'mfx_assets/NTR1_384Module.jpg' },
        { key: 'NTR4Module',            label: 'NTR 4 Module',              category: 'Plate Handling',     modelFile: 'mfx_assets/NTR4Module.x',            previewImg: 'mfx_assets/NTR4Module.jpg' },
        { key: 'MTPNestCB',             label: 'MTP Nest CB',               category: 'Plate Handling',     modelFile: 'mfx_assets/MTPNestCB.x',             previewImg: 'mfx_assets/MTPNestCB.jpg' },
        { key: 'MTPNestRB',             label: 'MTP Nest RB',               category: 'Plate Handling',     modelFile: 'mfx_assets/MTPNestRB.x',             previewImg: 'mfx_assets/MTPNestRB.jpg' },
        { key: 'DWPNestCB',             label: 'DWP Nest CB',               category: 'Plate Handling',     modelFile: 'mfx_assets/DWPNestCB.x',             previewImg: 'mfx_assets/DWPNestCB.jpg' },
        { key: 'DWPNestRB',             label: 'DWP Nest RB',               category: 'Plate Handling',     modelFile: 'mfx_assets/DWPNestRB.x',             previewImg: 'mfx_assets/DWPNestRB.jpg' },
        { key: 'RGTModule',             label: 'Reagent Module',            category: 'Plate Handling',     modelFile: 'mfx_assets/RGTModule.x',             previewImg: 'mfx_assets/RGTModule.jpg' },
        // ── Temperature Control ─────────────────────────────────────
        { key: 'HeatingModule',         label: 'Heating Module',            category: 'Temp Control',       modelFile: 'mfx_assets/HeatingModule.x',         previewImg: 'mfx_assets/HeatingModule.jpg' },
        { key: 'HeatingModule_noLid',   label: 'Heating Module (no lid)',   category: 'Temp Control',       modelFile: 'mfx_assets/HeatingModule_withoutLid.x', previewImg: 'mfx_assets/HeatingModule.jpg' },
        { key: 'CoolingModule',         label: 'Cooling Module',            category: 'Temp Control',       modelFile: 'mfx_assets/CoolingModule.x',         previewImg: 'mfx_assets/CoolingModule.jpg' },
        { key: 'CoolingModule_noLid',   label: 'Cooling Module (no lid)',   category: 'Temp Control',       modelFile: 'mfx_assets/CoolingModule_withoutLid.x', previewImg: 'mfx_assets/CoolingModule.jpg' },
        // ── Shakers ─────────────────────────────────────────────────
        { key: 'Teleshake95MTP',        label: 'Teleshake 95 MTP',          category: 'Shakers',            modelFile: 'mfx_assets/Teleshake95MTP.x',        previewImg: 'mfx_assets/Teleshake95MTP.jpg' },
        { key: 'Teleshake95DWP',        label: 'Teleshake 95 DWP',          category: 'Shakers',            modelFile: 'mfx_assets/Teleshake95DWP.x',        previewImg: 'mfx_assets/Teleshake95DWP.jpg' },
        { key: 'VariomagShakerMTP',     label: 'Variomag Shaker MTP',       category: 'Shakers',            modelFile: 'mfx_assets/VariomagShakerMTP.x',     previewImg: null },
        { key: 'VariomagShakerDWP',     label: 'Variomag Shaker DWP',       category: 'Shakers',            modelFile: 'mfx_assets/VariomagShakerDWP.x',     previewImg: null },
        { key: 'HHSPCR96ABI',           label: 'HHS PCR 96 ABI',            category: 'Shakers',            modelFile: 'mfx_assets/HHSPCR96ABI.x',           previewImg: 'mfx_assets/HHSPCR96ABI.jpg' },
        { key: 'HHS_DWP_Nunc',          label: 'HHS DWP Nunc',              category: 'Shakers',            modelFile: 'mfx_assets/HHS_DWP_Nunc.x',          previewImg: 'mfx_assets/HHS_DWP_Nunc.jpg' },
        { key: 'HHS_FlatDWP',           label: 'HHS Flat DWP',              category: 'Shakers',            modelFile: 'mfx_assets/HHS_FlatDWP.x',           previewImg: 'mfx_assets/HHS_FlatDWP.jpg' },
        { key: 'HHS_FlatMTP',           label: 'HHS Flat MTP',              category: 'Shakers',            modelFile: 'mfx_assets/HHS_FlatMTP.x',           previewImg: 'mfx_assets/HHS_FlatMTP.jpg' },
        { key: 'HHS_Sarstedt',          label: 'HHS Sarstedt',              category: 'Shakers',            modelFile: 'mfx_assets/HHS_Sarstedt.x',          previewImg: 'mfx_assets/HHS_Sarstedt.jpg' },
        // ── Tips & Lids ─────────────────────────────────────────────
        { key: 'TipModule',             label: 'Tip Module',                category: 'Tips & Lids',        modelFile: 'mfx_assets/TipModule.x',             previewImg: 'mfx_assets/TipModule.jpg' },
        { key: 'TipParkModule',         label: 'Tip Park Module',           category: 'Tips & Lids',        modelFile: 'mfx_assets/TipParkModule.x',         previewImg: 'mfx_assets/TipParkModule.jpg' },
        { key: 'TipStackModuleLow',     label: 'Tip Stack Module (Low)',    category: 'Tips & Lids',        modelFile: 'mfx_assets/TipStackModuleLow.x',     previewImg: 'mfx_assets/TipStackModuleLow.jpg' },
        { key: 'TipStackModuleST',      label: 'Tip Stack Module (ST)',     category: 'Tips & Lids',        modelFile: 'mfx_assets/TipStackModuleST.x',      previewImg: 'mfx_assets/TipStackModuleST.jpg' },
        { key: 'LIDParkModule',         label: 'Lid Park Module',           category: 'Tips & Lids',        modelFile: 'mfx_assets/LIDParkModule.x',         previewImg: 'mfx_assets/LIDParkModule.jpg' },
        { key: 'LIDParkModuleF',        label: 'Lid Park Module Flat',      category: 'Tips & Lids',        modelFile: 'mfx_assets/LIDParkModuleF.x',        previewImg: 'mfx_assets/LIDParkModule.jpg' },
        { key: 'LIDParkModule7T',       label: 'Lid Park Module 7T',        category: 'Tips & Lids',        modelFile: 'mfx_assets/LIDParkModule7T.x',       previewImg: 'mfx_assets/LIDParkModule7T.jpg' },
        { key: 'LIDParkModule7TF',      label: 'Lid Park Module 7T Flat',   category: 'Tips & Lids',        modelFile: 'mfx_assets/LIDParkModule7TF.x',      previewImg: 'mfx_assets/LIDParkModule7T.jpg' },
        // ── Tubes ───────────────────────────────────────────────────
        { key: 'cpac',                  label: 'CPAC Module',               category: 'Tubes',              modelFile: 'mfx_assets/cpac.x',                  previewImg: 'mfx_assets/cpac.jpg' },
        { key: 'cpac2mL',               label: 'CPAC 2 mL Module',          category: 'Tubes',              modelFile: 'mfx_assets/cpac2mL.x',               previewImg: 'mfx_assets/cpac2mL.jpg' },
        { key: 'CPACTubeModule',        label: 'CPAC Tube Module',          category: 'Tubes',              modelFile: 'mfx_assets/CPACTubeModule.x',        previewImg: null },
        { key: 'MFX_EPPENDORF_TUBE',    label: 'Eppendorf Tube Module',     category: 'Tubes',              modelFile: 'mfx_assets/MFX_EPPENDORF_TUBE_MODUL.x', previewImg: null },
        { key: 'MFX_ABI_EPPENDORF',     label: 'ABI Eppendorf Tube Module', category: 'Tubes',              modelFile: 'mfx_assets/MFX_ABI_EPPENDORF_TUBE_MODUL.x', previewImg: 'mfx_assets/MFX_ABI_EPPENDORF_TUBE_MODUL.png' },
        { key: 'TUCUModule',            label: 'TUCU Module',               category: 'Tubes',              modelFile: 'mfx_assets/TUCUModule.x',            previewImg: 'mfx_assets/TUCUModule.jpg' },
        { key: 'TUCUModuleABI',         label: 'TUCU Module ABI',           category: 'Tubes',              modelFile: 'mfx_assets/TUCUModuleABI.x',         previewImg: 'mfx_assets/TUCUModuleABI.jpg' },
        { key: 'Ham24TuR',              label: 'Ham 24 RB TuR 1.5 mL',     category: 'Tubes',              modelFile: 'mfx_assets/Ham_24_RB_TuR_1.5ml.hxx', previewImg: 'mfx_assets/Ham_24_RB_TuR_1.5ml.png' },
        { key: 'MFX_Mrx2DBC',          label: 'MFX Mrx2DBC TR 1.4 mL',    category: 'Tubes',              modelFile: 'mfx_assets/MFX_Mrx2DBC_TR_1_4ml_dwnh.x', previewImg: 'mfx_assets/MFX_Mrx2DBC_TR_1_4ml_dwnh.jpg' },
        { key: 'RGT8REFILL',            label: 'Reagent Refill 8-ch',       category: 'Tubes',              modelFile: 'mfx_assets/RGT8REFILLnew.x',         previewImg: 'mfx_assets/RGT8REFILL.jpg' },
        { key: 'RGT96REFILL',           label: 'Reagent Refill 96-ch',      category: 'Tubes',              modelFile: 'mfx_assets/RGT96REFILLnew.x',        previewImg: 'mfx_assets/RGT96REFILL.jpg' },
        // ── Stackers & Motion ───────────────────────────────────────
        { key: 'StackerModule',         label: 'Stacker Module',            category: 'Stackers & Motion',  modelFile: 'mfx_assets/StackerModule.x',         previewImg: 'mfx_assets/StackerModule.jpg' },
        { key: 'StackerModulePortrait', label: 'Stacker Module Portrait',   category: 'Stackers & Motion',  modelFile: 'mfx_assets/StackerModulePortrait.x', previewImg: 'mfx_assets/StackerModulePortrait.jpg' },
        { key: 'TiltModule',            label: 'Tilt Module',               category: 'Stackers & Motion',  modelFile: 'mfx_assets/TiltModule.x',            previewImg: 'mfx_assets/TiltModule.jpg' },
        { key: 'TurnTableModule',       label: 'Turn Table Module',         category: 'Stackers & Motion',  modelFile: 'mfx_assets/TurnTableModule.x',       previewImg: 'mfx_assets/TurnTableModule.jpg' },
        // ── HP Modules (numbered part IDs) ──────────────────────────
        { key: 'HP_MTPRaised',          label: 'HP MTP Raised (5836301)',   category: 'HP Modules',         modelFile: 'mfx_assets/5836301MFXHPMTPRAISED.x', previewImg: 'mfx_assets/5836301MFXHPMTPRAISED.jpg' },
        { key: 'HP_MTPFlat',            label: 'HP MTP Flat (5836302)',     category: 'HP Modules',         modelFile: 'mfx_assets/5836302MFXHPMTPFLAT.x',  previewImg: 'mfx_assets/5836302MFXHPMTPFLAT.jpg' },
        { key: 'HP_DWPRaised',          label: 'HP DWP Raised (5836401)',   category: 'HP Modules',         modelFile: 'mfx_assets/5836401MFXHPDWPRAISED.x', previewImg: 'mfx_assets/5836401MFXHPDWPRAISED.jpg' },
        { key: 'HP_DWPFlat',            label: 'HP DWP Flat (5836402)',     category: 'HP Modules',         modelFile: 'mfx_assets/5836402MFXHPDWPFLAT.x',  previewImg: 'mfx_assets/5836402MFXHPDWPFLAT.jpg' },
        { key: 'HP_MTPFlatSloped',      label: 'HP MTP Flat Sloped (9258501)', category: 'HP Modules',     modelFile: 'mfx_assets/9258501MFXHPMTPFLATSLOPED.x', previewImg: 'mfx_assets/9258501MFXHPMTPFLATSLOPED.jpg' },
        { key: 'HP_DWPFlatSloped',      label: 'HP DWP Flat Sloped (9258601)', category: 'HP Modules',     modelFile: 'mfx_assets/9258601MFXHPDWPFLATSLOPED.x', previewImg: 'mfx_assets/9258601MFXHPDWPFLATSLOPED.JPG' },
        { key: 'HP_MTPTab',             label: 'HP MTP Tab (9855201)',      category: 'HP Modules',         modelFile: 'mfx_assets/9855201MFXHPMTPTAB.x',    previewImg: 'mfx_assets/9855201MFXHPMTPTAB.jpg' },
        { key: 'HP_DWPTab',             label: 'HP DWP Tab (9855301)',      category: 'HP Modules',         modelFile: 'mfx_assets/9855301MFXHPDWPTAB.x',    previewImg: 'mfx_assets/9855301MFXHPDWPTAB.jpg' },
        { key: 'HP_MidiRaised',         label: 'HP MIDI Raised (9356101)',  category: 'HP Modules',         modelFile: 'mfx_assets/9356101MFXMIDIRAISED.x',  previewImg: 'mfx_assets/9356101MFXMIDIRAISED.jpg' },
        { key: 'HP_MidiFlat',           label: 'HP MIDI Flat (9529801)',    category: 'HP Modules',         modelFile: 'mfx_assets/9529801MFXHPMIDIFLAT.x',  previewImg: 'mfx_assets/9529801MFXHPMIDIFLAT.JPG' },
        { key: 'HP_TallFlat',           label: 'HP Tall Flat (6754001)',    category: 'HP Modules',         modelFile: 'mfx_assets/6754001MFXHPTALLFLAT.x',  previewImg: 'mfx_assets/6754001MFXHPTALLFLAT.jpg' },
        { key: 'HP_TipIsolator',        label: 'HP Tip Isolator (92882)',   category: 'HP Modules',         modelFile: 'mfx_assets/92882_01MFXTIPISOLATOR.x', previewImg: 'mfx_assets/92882_01MFXTIPISOLATOR.jpg' },
        // ── Misc ────────────────────────────────────────────────────
        { key: 'BracketCTHT',           label: 'Bracket CTHT',              category: 'Misc',               modelFile: 'mfx_assets/BracketCTHT.x',           previewImg: null },
        { key: 'BracketShakerBase',     label: 'Bracket Shaker Base',       category: 'Misc',               modelFile: 'mfx_assets/BracketShakerBase.x',     previewImg: null },
        { key: 'BracketShakerBaseCPAC', label: 'Bracket Shaker CPAC',      category: 'Misc',               modelFile: 'mfx_assets/BracketShakerBaseCPAC.x', previewImg: null },
        { key: 'rackL5_RGT5',           label: 'Rack MFX CAR L5 RGT5',     category: 'Misc',               modelFile: 'mfx_assets/rackformfx_car_l5_rgt5.x', previewImg: null },
    ];

    // Lookup module by key
    const _moduleByKey = {};
    MFX_MODULE_CATALOG.forEach(function (m) { _moduleByKey[m.key] = m; });

    // ================================================================
    //  Pedestal-type rules per carrier slot (from StarVantageCarriers.xml)
    //  Keyed by carrier key → slot id → array of allowed pedestal types.
    // ================================================================
    const MFX_SLOT_RULES = {
        MFX_CAR_L5: {
            1: ['HeatCool', 'LidPark', 'Standard'],
            2: ['HeatCool', 'Standard'],
            3: ['HeatCool', 'Standard'],
            4: ['HeatCool', 'Standard'],
            5: ['TurnTable', 'LidParkBack', 'Standard'],
        },
        MFX_CAR_L4: {
            1: ['Standard'],
            2: ['Standard'],
            3: ['Standard'],
            4: ['Standard'],
        },
        MFX_CAR_P3: {
            1: ['StandardPortrait'],
            2: ['StandardPortrait'],
            3: ['StandardPortrait'],
        },
        MFX_CAR_5: {
            1: ['HeatCool', 'LidPark', 'Standard'],
            2: ['HeatCool', 'Standard'],
            3: ['HeatCool', 'Standard'],
            4: ['HeatCool', 'Standard'],
            5: ['TurnTable', 'LidParkBack', 'Standard'],
        },
        MFX_CAR_7T: {
            1: ['HeatCool', 'HeatCoolShaker', 'LidPark', 'LidParkShaker', 'Standard', 'StandardShaker'],
            2: ['HeatCool', 'HeatCoolShaker', 'Standard', 'StandardShaker'],
            3: ['HeatCool', 'HeatCoolShaker', 'Standard', 'StandardShaker'],
            4: ['HeatCool', 'HeatCoolShaker', 'Standard', 'StandardShaker'],
            5: ['TurnTable', 'LidParkBack', 'LidParkBackShaker', 'Standard', 'StandardShaker'],
        },
    };

    // ================================================================
    //  Module → pedestal type compatibility & oversized blocking
    //  types:     pedestal type keys this module is compatible with
    //  oversized: signed offset in position-number space
    //             -1 = blocks previous position, +1 = blocks next
    //             (matches StarVantageCarrierPedestals.xml convention)
    // ================================================================
    const MFX_MODULE_TYPES = {
        // Plate Handling
        'PCR96Module':           { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'PCR384Module':          { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'MTPModule':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'DWPModule':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'NTR1Module':            { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'NTR1_384Module':        { types: ['Standard', 'StandardShaker'] },
        'NTR4Module':            { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'MTPNestCB':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'MTPNestRB':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'DWPNestCB':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'DWPNestRB':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'RGTModule':             { types: ['Standard', 'StandardShaker'] },
        // Temp Control
        'HeatingModule':         { types: ['HeatCool', 'HeatCoolShaker'], oversized: -1 },
        'HeatingModule_noLid':   { types: ['HeatCool', 'HeatCoolShaker'], oversized: -1 },
        'CoolingModule':         { types: ['HeatCool', 'HeatCoolShaker'], oversized: -1 },
        'CoolingModule_noLid':   { types: ['HeatCool', 'HeatCoolShaker'], oversized: -1 },
        // Shakers
        'Teleshake95MTP':        { types: ['StandardShaker'] },
        'Teleshake95DWP':        { types: ['StandardShaker'] },
        'VariomagShakerMTP':     { types: ['StandardShaker'] },
        'VariomagShakerDWP':     { types: ['StandardShaker'] },
        'HHSPCR96ABI':           { types: ['StandardShaker'] },
        'HHS_DWP_Nunc':          { types: ['StandardShaker'] },
        'HHS_FlatDWP':           { types: ['StandardShaker'] },
        'HHS_FlatMTP':           { types: ['StandardShaker'] },
        'HHS_Sarstedt':          { types: ['StandardShaker'] },
        // Tips & Lids
        'TipModule':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'TipParkModule':         { types: ['Standard', 'StandardShaker'] },
        'TipStackModuleLow':     { types: ['Standard', 'StandardShaker'] },
        'TipStackModuleST':      { types: ['Standard', 'StandardShaker'] },
        'LIDParkModule':         { types: ['LidPark', 'LidParkBack', 'LidParkShaker', 'LidParkBackShaker'] },
        'LIDParkModuleF':        { types: ['LidPark', 'LidParkBack', 'LidParkShaker', 'LidParkBackShaker'] },
        'LIDParkModule7T':       { types: ['LidPark', 'LidParkBack', 'LidParkShaker', 'LidParkBackShaker'] },
        'LIDParkModule7TF':      { types: ['LidPark', 'LidParkBack', 'LidParkShaker', 'LidParkBackShaker'] },
        // Tubes
        'cpac':                  { types: ['Standard', 'StandardShaker'] },
        'cpac2mL':               { types: ['Standard', 'StandardShaker'] },
        'CPACTubeModule':        { types: ['Standard', 'StandardShaker'] },
        'MFX_EPPENDORF_TUBE':    { types: ['Standard', 'StandardShaker'] },
        'MFX_ABI_EPPENDORF':     { types: ['Standard', 'StandardShaker'] },
        'TUCUModule':            { types: ['Standard', 'StandardShaker'] },
        'TUCUModuleABI':         { types: ['Standard', 'StandardShaker'] },
        'Ham24TuR':              { types: ['Standard', 'StandardShaker'] },
        'MFX_Mrx2DBC':           { types: ['Standard', 'StandardShaker'] },
        'RGT8REFILL':            { types: ['Standard', 'StandardShaker'] },
        'RGT96REFILL':           { types: ['Standard', 'StandardShaker'] },
        // Stackers & Motion
        'StackerModule':         { types: ['Standard', 'StandardShaker'] },
        'StackerModulePortrait': { types: ['StandardPortrait'] },
        'TiltModule':            { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'TurnTableModule':       { types: ['TurnTable'], oversized: 1 },
        // HP Modules
        'HP_MTPRaised':          { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_MTPFlat':            { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_DWPRaised':          { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_DWPFlat':            { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_MTPFlatSloped':      { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_DWPFlatSloped':      { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_MTPTab':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_DWPTab':             { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_MidiRaised':         { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_MidiFlat':           { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_TallFlat':           { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        'HP_TipIsolator':        { types: ['Standard', 'StandardShaker', 'StandardPortrait'] },
        // Misc
        'BracketCTHT':           { types: ['Standard'] },
        'BracketShakerBase':     { types: ['StandardShaker'] },
        'BracketShakerBaseCPAC': { types: ['StandardShaker'] },
        'rackL5_RGT5':           { types: ['Standard'] },
    };

    // ================================================================
    //  Position-rule helpers
    // ================================================================

    /** Extract position number from slot label, e.g. 'Pos 3' → 3 */
    function _posNum(slot) {
        var m = slot.label.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
    }

    /** Get the allowed pedestal types for a given carrier slot */
    function _allowedTypes(carrierKey, slotId) {
        var rules = MFX_SLOT_RULES[carrierKey];
        return (rules && rules[slotId]) || null;
    }

    /** Get the module's pedestal compatibility info */
    function _moduleTypeInfo(moduleKey) {
        return MFX_MODULE_TYPES[moduleKey] || null;
    }

    /**
     * Check whether a slot is blocked by an oversized module in a
     * neighbouring position.  Returns the blocking module label or null.
     */
    function _blockedBy(carrierKey, slotId, slotState) {
        var def = MFX_CARRIER_DEFS[carrierKey];
        if (!def) return null;
        var targetSlot = null;
        def.slots.forEach(function (s) { if (s.id === slotId) targetSlot = s; });
        if (!targetSlot) return null;
        var targetPos = _posNum(targetSlot);

        var ids = Object.keys(slotState);
        for (var i = 0; i < ids.length; i++) {
            var entry = slotState[ids[i]];
            if (!entry || !entry.moduleKey) continue;
            var info = _moduleTypeInfo(entry.moduleKey);
            if (!info || !info.oversized) continue;
            var blockerPos = _posNum(entry.slot);
            if (blockerPos + info.oversized === targetPos) {
                return (_moduleByKey[entry.moduleKey] || {}).label || entry.moduleKey;
            }
        }
        return null;
    }

    /**
     * Validate whether a module can be placed in a slot.
     * Returns { allowed:true } or { allowed:false, reason:string }.
     */
    function canPlaceModule(carrierKey, slotId, moduleKey, slotState) {
        var def = MFX_CARRIER_DEFS[carrierKey];
        var moduleDef = _moduleByKey[moduleKey];
        if (!def || !moduleDef) return { allowed: false, reason: 'Invalid slot or module.' };

        var slot = null;
        def.slots.forEach(function (s) { if (s.id === slotId) slot = s; });
        if (!slot) return { allowed: false, reason: 'Slot not found.' };

        // 1. Check oversized-blocking by neighbours
        var blocker = _blockedBy(carrierKey, slotId, slotState);
        if (blocker) {
            return { allowed: false, reason: slot.label + ' is blocked by the oversized ' + blocker + ' in an adjacent position.' };
        }

        // 2. Pedestal type compatibility
        var allowed = _allowedTypes(carrierKey, slotId);
        var info    = _moduleTypeInfo(moduleKey);
        if (allowed && info) {
            var ok = false;
            for (var i = 0; i < info.types.length; i++) {
                if (allowed.indexOf(info.types[i]) !== -1) { ok = true; break; }
            }
            if (!ok) {
                return { allowed: false, reason: moduleDef.label + ' is not compatible with ' + slot.label + ' on this carrier.' };
            }
        }

        // 3. If this module is oversized, make sure it won't block an occupied slot
        if (info && info.oversized) {
            var thisPos = _posNum(slot);
            var blockedPos = thisPos + info.oversized;
            for (var j = 0; j < def.slots.length; j++) {
                if (_posNum(def.slots[j]) === blockedPos) {
                    var adj = slotState[def.slots[j].id];
                    if (adj && adj.moduleKey) {
                        return { allowed: false, reason: moduleDef.label + ' is oversized and would block ' + def.slots[j].label + ', which already has a module.' };
                    }
                    break;
                }
            }
        }

        return { allowed: true };
    }

    /**
     * Quick check: is moduleKey compatible with this slot
     * (ignoring oversized / neighbour state — used for catalog filtering).
     */
    function isModuleCompatibleWithSlot(carrierKey, slotId, moduleKey) {
        var allowed = _allowedTypes(carrierKey, slotId);
        var info    = _moduleTypeInfo(moduleKey);
        if (!allowed || !info) return true;  // no rules → allow
        for (var i = 0; i < info.types.length; i++) {
            if (allowed.indexOf(info.types[i]) !== -1) return true;
        }
        return false;
    }

    // ================================================================
    //  Module State
    // ================================================================
    const mfxState = {
        scene:    null,
        camera:   null,
        renderer: null,
        controls: null,
        animId:   null,
        isDark:   false,
        canvas:   null,
        host:     null,

        // Current carrier definition
        carrierKey: 'MFX_CAR_L5',

        // Carrier body group (Three.js Group)
        carrierGroup: null,

        // Per-slot state: { slotMesh, moduleMesh, moduleKey }
        slotState: {},   // keyed by slot.id

        // Selected slot id (null if none)
        selectedSlotId: null,

        // Pending module to place (key or null)
        pendingModuleKey: null,

        // Y value of the carrier nesting surface (top of base model)
        nestingY: 23,

        // Model cache: modelFile path → THREE.Group template
        xModelCache: {},

        // Raycaster
        _raycaster: null,
        _mouse: new THREE.Vector2(),

        // Toolbar state
        toolbarCollapsed: false,
        isPerspective: true,
        isPanning: false,
        isReorderMode: true,
        _dragHoveredSlot: null,
        _dragModuleKey: null,
        _reorderDragSlotId: null,

        // 3D canvas reorder drag state
        _canvasDragSourceSlot: null,
        _canvasDragging: false,
        _canvasDragStartPos: null,
        _canvasDragDidMove: false,
        _canvasReorderHoveredSlot: null,
        _hoveredModuleSlot: null,    // slot id whose module is glow-hovered
        _dragOrigPos: null,          // THREE.Vector3 — original module position before drag
        _dragPlane: null,            // THREE.Plane used to project mouse onto carrier surface
        _dragMeshOffset: null,       // {x,z} offset from slot center to mesh.position

        // Catalog drag-to-place 3D preview state
        _catalogPreviewMesh: null,   // THREE.Group — semi-transparent preview in scene
        _catalogPreviewKey: null,    // module key being previewed
        _catalogDragPlane: null,     // THREE.Plane for cursor projection

        // Auto-generated thumbnail cache: moduleKey → dataURL
        _thumbnailCache: {},

        // ── Carrier metadata (for TML export) ──────────────────
        carrierMeta: {
            viewName: '',
            description: '',
            barcodeMask: '',
            barcodeUnique: false,
            categories: [],     // array of category ID strings
            properties: [],     // array of {name, value}
        },

        // ── Per-slot labware assignment ─────────────────────────
        // slotLabware[slotId] = { rackText, rackFileName, rackDef,
        //                         ctrText, ctrFileName, ctrDef,
        //                         labwareMesh } | null
        slotLabware: {},

        // ── Labware catalog (scanned from Hamilton dir) ─────────
        labwareCatalog: [],       // [{name, displayName, description, path, categories:[]}]
        labwareCategories: {},    // {id: {id, parentId, name}}
        _labwareMeshCache: {},    // rckPath → THREE.Group template
        _labwareScanned: false,
    };

    const LIGHT_BG = 0xf0f0f0;
    const DARK_BG  = 0x1b2838;

    // ================================================================
    //  Auto-generate thumbnails for modules with no preview image
    // ================================================================

    // Shared offscreen renderer (created lazily)
    var _thumbRenderer = null;
    var _thumbScene    = null;
    var _thumbCamera   = null;

    /**
     * Create (or reuse) a small offscreen WebGL renderer for thumbnail capture.
     */
    function _ensureThumbRenderer() {
        if (_thumbRenderer) return;
        var size = 256;
        _thumbRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
        _thumbRenderer.setSize(size, size);
        _thumbRenderer.setClearColor(0x000000, 0);

        _thumbScene = new THREE.Scene();
        // No background → transparent PNG
        _thumbScene.add(new THREE.AmbientLight(0xffffff, 1.0));
        var d1 = new THREE.DirectionalLight(0xffffff, 0.8);
        d1.position.set(1, 2, 1).normalize();
        _thumbScene.add(d1);
        var d2 = new THREE.DirectionalLight(0x8899bb, 0.4);
        d2.position.set(-1, -0.5, -1).normalize();
        _thumbScene.add(d2);

        _thumbCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
    }

    /**
     * Render a model group from a 45-degree elevation / 45-degree azimuth
     * and return a data-URL PNG.
     */
    function _renderThumbnail(group) {
        _ensureThumbRenderer();

        // Clone the group so we don't disturb the cached original
        var clone = group.clone(true);
        _thumbScene.add(clone);

        // Compute bounding box/sphere for framing
        var box = new THREE.Box3().setFromObject(clone);
        var center = box.getCenter(new THREE.Vector3());
        var sphere = box.getBoundingSphere(new THREE.Sphere());
        var r = sphere.radius || 1;

        // 45-degree elevation, 45-degree azimuth (matching existing preview style)
        var dist = r * 2.8;
        var elev = Math.PI / 4;   // 45° above horizon
        var azim = Math.PI / 4;   // 45° from front
        _thumbCamera.position.set(
            center.x + dist * Math.cos(elev) * Math.sin(azim),
            center.y + dist * Math.sin(elev),
            center.z + dist * Math.cos(elev) * Math.cos(azim)
        );
        _thumbCamera.lookAt(center);
        _thumbCamera.updateProjectionMatrix();

        _thumbRenderer.render(_thumbScene, _thumbCamera);
        var dataURL = _thumbRenderer.domElement.toDataURL('image/png');

        _thumbScene.remove(clone);
        return dataURL;
    }

    /**
     * Try to load from localStorage first; returns dataURL string or null.
     */
    function _loadCachedThumbnail(moduleKey) {
        if (mfxState._thumbnailCache[moduleKey]) return mfxState._thumbnailCache[moduleKey];
        try {
            var stored = localStorage.getItem('mfx_thumb_' + moduleKey);
            if (stored) {
                mfxState._thumbnailCache[moduleKey] = stored;
                return stored;
            }
        } catch (e) { /* localStorage unavailable */ }
        return null;
    }

    /**
     * Persist a generated thumbnail to localStorage and in-memory cache.
     */
    function _saveThumbnail(moduleKey, dataURL) {
        mfxState._thumbnailCache[moduleKey] = dataURL;
        try { localStorage.setItem('mfx_thumb_' + moduleKey, dataURL); } catch (e) { /* quota */ }
    }

    /**
     * Update the DOM card for a module that just got a generated thumbnail.
     */
    function _updateCardImage(moduleKey, dataURL) {
        var cards = document.querySelectorAll('.mfx-module-card[data-module-key="' + moduleKey + '"]');
        cards.forEach(function (card) {
            var imgDiv = card.querySelector('.mfx-module-img');
            if (!imgDiv) return;
            imgDiv.innerHTML = '';
            var img = document.createElement('img');
            img.src = dataURL;
            img.alt = moduleKey;
            imgDiv.appendChild(img);
        });
    }

    /**
     * Generate thumbnail for a single module definition.
     * Returns a Promise that resolves when done (or immediately if cached).
     */
    function generateModuleThumbnail(moduleDef) {
        var cached = _loadCachedThumbnail(moduleDef.key);
        if (cached) {
            _updateCardImage(moduleDef.key, cached);
            return Promise.resolve();
        }
        return new Promise(function (resolve) {
            loadXModelFromServer(moduleDef.modelFile, moduleDef.key, function (group) {
                var dataURL = _renderThumbnail(group);
                _saveThumbnail(moduleDef.key, dataURL);
                _updateCardImage(moduleDef.key, dataURL);
                resolve();
            }, function () {
                // Model failed to load — leave the cube icon
                resolve();
            });
        });
    }

    /**
     * Scan the catalog for entries with a 3D model but no preview image
     * and generate thumbnails for each, sequentially (to avoid GPU contention).
     */
    function resolveAllMissingThumbnails() {
        var missing = MFX_MODULE_CATALOG.filter(function (m) {
            return m.modelFile && !m.previewImg;
        });
        if (missing.length === 0) return;
        console.log('[MFXCarrier] Generating thumbnails for', missing.length, 'module(s) with no preview image');

        // Process sequentially so the offscreen renderer isn't overwhelmed
        var chain = Promise.resolve();
        missing.forEach(function (m) {
            chain = chain.then(function () { return generateModuleThumbnail(m); });
        });
        chain.then(function () {
            console.log('[MFXCarrier] All missing thumbnails generated');
        });
    }

    // ================================================================
    //  Screenshot
    // ================================================================
    function mfxSaveScreenshot(format, opts) {
        if (!mfxState.renderer || !mfxState.scene || !mfxState.camera) return;
        const showBg = opts ? opts.showBg : true;

        const origBg = mfxState.scene.background;
        if (!showBg) {
            mfxState.scene.background = null;
            mfxState.renderer.setClearColor(0x000000, 0);
        }

        mfxState.renderer.render(mfxState.scene, mfxState.camera);
        const canvas = mfxState.renderer.domElement;
        const fileName = 'mfx_carrier';

        if (format === 'jpg') {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.jpg'); }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.png'); }, 'image/png');
        }

        mfxState.scene.background = origBg;
        if (!showBg) mfxState.renderer.setClearColor(mfxState.isDark ? DARK_BG : LIGHT_BG, 1);
        mfxState.renderer.render(mfxState.scene, mfxState.camera);
    }

    function mfxScreenshotPreviewDataURL(opts) {
        if (!mfxState.renderer || !mfxState.scene || !mfxState.camera) return '';
        const showBg = opts ? opts.showBg : true;

        const origBg = mfxState.scene.background;
        if (!showBg) {
            mfxState.scene.background = null;
            mfxState.renderer.setClearColor(0x000000, 0);
        }

        mfxState.renderer.render(mfxState.scene, mfxState.camera);
        const dataURL = mfxState.renderer.domElement.toDataURL('image/png');

        mfxState.scene.background = origBg;
        if (!showBg) mfxState.renderer.setClearColor(mfxState.isDark ? DARK_BG : LIGHT_BG, 1);
        mfxState.renderer.render(mfxState.scene, mfxState.camera);

        return dataURL;
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.MFXCarrierModule = {
        init: initMFXCarrier,
        updateTheme: updateMFXTheme,
        saveScreenshot: mfxSaveScreenshot,
        screenshotPreviewDataURL: mfxScreenshotPreviewDataURL,
        exportTml: exportMfxTml,
        exportPackageZip: exportMfxPackageZip,
    };

    // ================================================================
    //  Init
    // ================================================================
    function initMFXCarrier() {
        try { _initMFXCarrierInner(); } catch(e) { console.error('[MFXCarrier] init failed:', e); }
    }
    function _initMFXCarrierInner() {
        console.log('[MFXCarrier] init start');
        mfxState.isDark = document.documentElement.hasAttribute('data-theme');

        const canvas = $('#mfx-canvas');
        const host   = $('#mfx-host');
        console.log('[MFXCarrier] canvas=', canvas, 'host=', host);
        if (!canvas || !host) return;

        // Guard: only initialise once
        if (mfxState.renderer) {
            console.log('[MFXCarrier] already initialized, skipping');
            updateMFXTheme();
            return;
        }

        mfxState.canvas = canvas;
        mfxState.host   = host;

        const w = host.clientWidth  || 800;
        const h = host.clientHeight || 600;
        console.log('[MFXCarrier] host dimensions:', w, 'x', h);

        // Scene
        mfxState.scene = new THREE.Scene();
        mfxState.scene.background = new THREE.Color(mfxState.isDark ? DARK_BG : LIGHT_BG);

        // Camera
        mfxState.camera = new THREE.PerspectiveCamera(45, w / h, 1, 50000);
        resetMFXCamera();

        // Renderer
        mfxState.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, logarithmicDepthBuffer: true });
        mfxState.renderer.setPixelRatio(window.devicePixelRatio);
        mfxState.renderer.setSize(w, h);
        mfxState.renderer.sortObjects = true;

        // OrbitControls
        mfxState.controls = new THREE.OrbitControls(mfxState.camera, mfxState.renderer.domElement);
        mfxState.controls.enableDamping = true;
        mfxState.controls.dampingFactor = 0.12;
        mfxState.controls.update();

        // Lights
        mfxState.scene.add(new THREE.AmbientLight(0xaaaaaa, 1.2));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(200, 400, 200);
        mfxState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-100, -50, -200);
        mfxState.scene.add(d2);

        // Raycaster
        mfxState._raycaster = new THREE.Raycaster();

        // Resize observer
        var ro = new ResizeObserver(function () {
            var cw = host.clientWidth;
            var ch = host.clientHeight;
            mfxState.camera.aspect = cw / ch;
            mfxState.camera.updateProjectionMatrix();
            mfxState.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // Render loop
        (function tick() {
            mfxState.animId = requestAnimationFrame(tick);
            mfxState.controls.update();
            mfxState.renderer.render(mfxState.scene, mfxState.camera);
            drawMFXGizmo();
        }());

        // Build initial scene
        buildCarrierScene(mfxState.carrierKey);
        console.log('[MFXCarrier] scene built');

        // Wire UI
        wireMFXControls();
        wireMFXCanvas();
        wireMFXToolbar();
        wireMFXDragDrop();
        wireCarrierMetadata();
        wireLabwareAssignment();
        wireLabwareCatalog();
        wireRightPanelSections();
        populateCarrierSelector();
        populateModuleCatalog();
        makeModuleCardsDraggable();
        resolveAllMissingThumbnails();
        initCarrierMetaFromDef();

        // Apply initial reorder mode orbit restrictions
        applyReorderOrbitState();
        console.log('[MFXCarrier] init complete');
    }

    // ================================================================
    //  Theme update
    // ================================================================
    function updateMFXTheme() {
        mfxState.isDark = document.documentElement.hasAttribute('data-theme');
        if (mfxState.scene) {
            mfxState.scene.background = new THREE.Color(mfxState.isDark ? DARK_BG : LIGHT_BG);
        }
    }

    // ================================================================
    //  Reset camera to a good view of the current carrier
    // ================================================================
    function resetMFXCamera() {
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        if (!def) def = MFX_CARRIER_DEFS.MFX_CAR_L5;
        var cx = def.dx / 2;
        var cy = def.dy / 2;
        var dist = Math.max(def.dx, def.dy, def.dz) * 2.5;
        mfxState.camera.position.set(cx + dist * 0.4, def.dz + dist * 0.8, cy + dist * 0.4);
        mfxState.camera.lookAt(cx, def.dz * 0.5, cy);
        if (mfxState.controls) {
            mfxState.controls.target.set(cx, def.dz * 0.5, cy);
            mfxState.controls.update();
        }
    }

    // ================================================================
    //  Build carrier scene (called when carrier type changes)
    // ================================================================
    function buildCarrierScene(carrierKey) {
        var def = MFX_CARRIER_DEFS[carrierKey];
        if (!def) return;

        mfxState.carrierKey = carrierKey;

        // Remove old carrier group from scene
        if (mfxState.carrierGroup) {
            mfxState.scene.remove(mfxState.carrierGroup);
            mfxState.carrierGroup = null;
        }

        // Clear slot state
        mfxState.slotState = {};
        mfxState.slotLabware = {};
        mfxState.selectedSlotId = null;
        mfxState.pendingModuleKey = null;

        // Create new carrier group
        var group = new THREE.Group();
        group.name = '__mfx_carrier__';
        mfxState.carrierGroup = group;
        mfxState.scene.add(group);

        // Build procedural carrier body (always shown; replaced by .x model when loaded)
        buildProceduralCarrier(def, group);

        // Set initial nesting Y from procedural base height
        mfxState.nestingY = def.dz * 0.18;

        // Attempt to load .x model from server
        loadXModelFromServer(def.modelFile, def.key, function (xGroup) {
            if (!mfxState.carrierGroup || mfxState.carrierGroup.name !== '__mfx_carrier__') return;
            // Remove procedural body and rails, add .x model
            var proc = mfxState.carrierGroup.getObjectByName('__proc_body__');
            if (proc) mfxState.carrierGroup.remove(proc);
            var rails = [];
            mfxState.carrierGroup.children.forEach(function (c) { if (c.name === '__proc_rail__') rails.push(c); });
            rails.forEach(function (r) { mfxState.carrierGroup.remove(r); });
            var xClone = xGroup.clone(true);
            xClone.name = '__x_body__';
            cloneMaterials(xClone);
            fitModelIntoCarrier(xClone, def);
            mfxState.carrierGroup.add(xClone);

            // Find the largest flat horizontal surface in the model.
            // Scan all upward-facing triangles, bucket by Y, pick the Y with the most area.
            var yBuckets = {};  // rounded Y → total area
            var BUCKET_RES = 0.5; // mm precision
            xClone.traverse(function (child) {
                if (!child.isMesh || !child.geometry) return;
                var geo = child.geometry;
                var posAttr = geo.attributes.position;
                var normAttr = geo.attributes.normal;
                if (!posAttr || !normAttr) return;
                // Get world matrix for this mesh
                child.updateWorldMatrix(true, false);
                var wm = child.matrixWorld;
                var idx = geo.index;
                var triCount = idx ? idx.count / 3 : posAttr.count / 3;
                var vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
                var nA = new THREE.Vector3();
                for (var t = 0; t < triCount; t++) {
                    var i0, i1, i2;
                    if (idx) { i0 = idx.getX(t*3); i1 = idx.getX(t*3+1); i2 = idx.getX(t*3+2); }
                    else { i0 = t*3; i1 = t*3+1; i2 = t*3+2; }
                    // Check if face normal points up (Y > 0.9)
                    nA.set(normAttr.getX(i0), normAttr.getY(i0), normAttr.getZ(i0));
                    if (nA.y < 0.9) continue;
                    // Get world-space vertices
                    vA.set(posAttr.getX(i0), posAttr.getY(i0), posAttr.getZ(i0)).applyMatrix4(wm);
                    vB.set(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1)).applyMatrix4(wm);
                    vC.set(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2)).applyMatrix4(wm);
                    // Triangle area
                    var ab = new THREE.Vector3().subVectors(vB, vA);
                    var ac = new THREE.Vector3().subVectors(vC, vA);
                    var area = ab.cross(ac).length() * 0.5;
                    // Average Y of the triangle
                    var avgY = (vA.y + vB.y + vC.y) / 3;
                    var bucketKey = Math.round(avgY / BUCKET_RES) * BUCKET_RES;
                    yBuckets[bucketKey] = (yBuckets[bucketKey] || 0) + area;
                }
            });
            // Find the Y bucket with the largest total area
            var bestY = 0, bestArea = 0;
            Object.keys(yBuckets).forEach(function (k) {
                if (yBuckets[k] > bestArea) {
                    bestArea = yBuckets[k];
                    bestY = parseFloat(k);
                }
            });
            if (bestArea > 0) {
                mfxState.nestingY = bestY;
            } else {
                var modelBox = new THREE.Box3().setFromObject(xClone);
                mfxState.nestingY = modelBox.max.y;
            }

            // Reposition all existing slot meshes and modules to the correct height
            repositionAllSlots();
        });

        // Build slot meshes
        def.slots.forEach(function (slot) {
            var slotMesh = buildSlotMesh(slot, false);
            group.add(slotMesh);
            mfxState.slotState[slot.id] = {
                slot: slot,
                slotMesh: slotMesh,
                moduleMesh: null,
                moduleKey: null,
            };
        });

        resetMFXCamera();
        updateSlotList();
        updatePendingModuleHint();
        // Re-sync carrier metadata fields when carrier type changes
        mfxState.carrierMeta.viewName = def.key;
        mfxState.carrierMeta.description = def.description || '';
        initCarrierMetaFromDef();
        setMFXStatus('Carrier loaded: ' + def.label);
    }

    // ----------------------------------------------------------------
    //  Procedural carrier body (box + rails)
    // ----------------------------------------------------------------
    function buildProceduralCarrier(def, group) {
        var baseH = def.dz * 0.18;
        var bodyGeo = new THREE.BoxGeometry(def.dx, baseH, def.dy);
        var bodyMat = new THREE.MeshLambertMaterial({ color: def.color || 0x607080, transparent: true, opacity: 0.85 });
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.set(def.dx / 2, baseH / 2, def.dy / 2);
        bodyMesh.name = '__proc_body__';
        group.add(bodyMesh);

        // Side rails
        var railH = def.dz * 0.7;
        var railGeo = new THREE.BoxGeometry(4, railH, def.dy);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x304050 });
        [-1, 1].forEach(function (side) {
            var rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(side === -1 ? 2 : def.dx - 2, baseH + railH / 2, def.dy / 2);
            rail.name = '__proc_rail__';
            group.add(rail);
        });
    }

    // ----------------------------------------------------------------
    //  Fit a loaded .x model into the carrier footprint
    //  (same centering algorithm as vantageLayout.js)
    // ----------------------------------------------------------------
    function fitModelIntoCarrier(xModel, def) {
        var box = new THREE.Box3().setFromObject(xModel);
        var center = box.getCenter(new THREE.Vector3());
        xModel.position.set(
            def.dx / 2 - center.x,
            -box.min.y,
            def.dy / 2 - center.z
        );
    }

    // ----------------------------------------------------------------
    //  Nesting surface Y (top of the carrier base model)
    // ----------------------------------------------------------------
    function getNestingY() {
        return mfxState.nestingY || 23;
    }

    // ----------------------------------------------------------------
    //  Reposition all slot meshes and placed modules after model loads
    // ----------------------------------------------------------------
    function repositionAllSlots() {
        var ny = getNestingY();
        Object.keys(mfxState.slotState).forEach(function (id) {
            var entry = mfxState.slotState[id];
            if (entry.slotMesh) {
                entry.slotMesh.position.y = ny + 0.5; // just above nesting surface
            }
            if (entry.moduleMesh) {
                positionModuleInSlot(entry.moduleMesh, entry.slot);
            }
        });
    }

    // ----------------------------------------------------------------
    //  Slot placeholder mesh
    // ----------------------------------------------------------------
    function buildSlotMesh(slot, isSelected) {
        var geo = new THREE.PlaneGeometry(slot.dx, slot.dy);
        var color = isSelected ? 0x2288ff : 0x1a2a3a;
        var mat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: isSelected ? 0.75 : 0.55,
            side: THREE.DoubleSide,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            polygonOffsetUnits: -4,
        });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 1;
        // PlaneGeometry faces along XY — rotate to lie flat on XZ
        mesh.rotation.x = -Math.PI / 2;
        // Three.js coords: X=width, Y=height(z), Z=depth(y)
        // Place slot plane on top of the carrier nesting surface
        mesh.position.set(
            slot.x + slot.dx / 2,
            getNestingY() + 0.5,
            slot.y + slot.dy / 2
        );
        mesh.name = '__slot_' + slot.id + '__';
        mesh.userData.slotId = slot.id;
        mesh.userData.isSlot = true;
        // Wireframe outline (rectangle)
        var outlineGeo = new THREE.EdgesGeometry(geo);
        var edgesMat = new THREE.LineBasicMaterial({
            color: isSelected ? 0x66aaff : 0x4488aa,
            linewidth: 1,
        });
        var edges = new THREE.LineSegments(outlineGeo, edgesMat);
        edges.renderOrder = 1;
        mesh.add(edges);
        return mesh;
    }

    // ----------------------------------------------------------------
    //  Place a module in a slot
    // ----------------------------------------------------------------
    function placeModuleInSlot(slotId, moduleKey) {
        var entry = mfxState.slotState[slotId];
        var moduleDef = _moduleByKey[moduleKey];
        if (!entry || !moduleDef) return;

        // Validate placement against position rules
        var check = canPlaceModule(mfxState.carrierKey, slotId, moduleKey, mfxState.slotState);
        if (!check.allowed) {
            setMFXStatus('\u26A0 ' + check.reason);
            return;
        }

        // Remove existing module mesh if any
        removeModuleMeshFromSlot(slotId);

        entry.moduleKey = moduleKey;

        // Try to load the module model
        loadXModelFromServer(moduleDef.modelFile, moduleKey, function (xGroup) {
            var e = mfxState.slotState[slotId];
            if (!e || e.moduleKey !== moduleKey) return; // slot changed while loading
            var xClone = xGroup.clone(true);
            xClone.name = '__module_' + slotId + '_' + moduleKey + '__';
            cloneMaterials(xClone);
            positionModuleInSlot(xClone, entry.slot);
            mfxState.carrierGroup.add(xClone);
            e.moduleMesh = xClone;
            updateSlotList();
        }, function () {
            // Failed to load — place a placeholder box
            var e = mfxState.slotState[slotId];
            if (!e || e.moduleKey !== moduleKey) return;
            var placeholder = buildModulePlaceholder(entry.slot);
            mfxState.carrierGroup.add(placeholder);
            e.moduleMesh = placeholder;
            updateSlotList();
        });

        updateSlotList();
        _refreshAllSlotHighlights();
        setMFXStatus('Placed ' + moduleDef.label + ' at ' + entry.slot.label);
    }

    // ----------------------------------------------------------------
    //  Position a module model at a carrier slot
    // ----------------------------------------------------------------
    function positionModuleInSlot(xModel, slot) {
        var box = new THREE.Box3().setFromObject(xModel);
        var center = box.getCenter(new THREE.Vector3());
        xModel.position.set(
            slot.x + slot.dx / 2 - center.x,
            getNestingY() - box.min.y,
            slot.y + slot.dy / 2 - center.z
        );
    }

    // ----------------------------------------------------------------
    //  Placeholder box when .x file is missing / fails to load
    // ----------------------------------------------------------------
    function buildModulePlaceholder(slot) {
        var h = Math.max(slot.dz || 80, 50);
        var geo = new THREE.BoxGeometry(slot.dx * 0.9, h, slot.dy * 0.9);
        var mat = new THREE.MeshLambertMaterial({ color: 0x445566, transparent: true, opacity: 0.7, wireframe: false });
        var mesh = new THREE.Mesh(geo, mat);
        // Wireframe overlay
        var wfGeo = new THREE.BoxGeometry(slot.dx * 0.9, h, slot.dy * 0.9);
        var wfMat = new THREE.MeshBasicMaterial({ color: 0x88bbdd, wireframe: true });
        var wfMesh = new THREE.Mesh(wfGeo, wfMat);
        mesh.add(wfMesh);
        mesh.position.set(
            slot.x + slot.dx / 2,
            getNestingY() + h / 2,
            slot.y + slot.dy / 2
        );
        mesh.name = '__placeholder__';
        return mesh;
    }

    // ----------------------------------------------------------------
    //  Remove module from slot
    // ----------------------------------------------------------------
    function removeModuleMeshFromSlot(slotId) {
        var entry = mfxState.slotState[slotId];
        if (!entry) return;
        if (entry.moduleMesh && mfxState.carrierGroup) {
            mfxState.carrierGroup.remove(entry.moduleMesh);
            disposeGroup(entry.moduleMesh);
        }
        entry.moduleMesh = null;
        entry.moduleKey  = null;
        // Refresh all slot highlights (oversized blocking may have changed)
        _refreshAllSlotHighlights();
    }

    /** Re-apply highlight state for every slot (e.g. after oversized change) */
    function _refreshAllSlotHighlights() {
        Object.keys(mfxState.slotState).forEach(function (id) {
            var sid = parseInt(id, 10);
            setSlotHighlight(sid, mfxState.selectedSlotId === sid);
        });
    }

    // ================================================================
    //  Slot selection
    // ================================================================
    function selectSlot(slotId) {
        // Deselect previous
        if (mfxState.selectedSlotId !== null) {
            setSlotHighlight(mfxState.selectedSlotId, false);
        }
        mfxState.selectedSlotId = slotId;
        if (slotId !== null) {
            setSlotHighlight(slotId, true);
        }
        updateSlotList();
        updateModuleCatalogSelection();
        // Refresh catalog to show compatibility with newly selected slot
        populateModuleCatalog();

        // If a pending module is waiting, place it now
        if (slotId !== null && mfxState.pendingModuleKey) {
            placeModuleInSlot(slotId, mfxState.pendingModuleKey);
            mfxState.pendingModuleKey = null;
            updatePendingModuleHint();
        }
    }

    function setSlotHighlight(slotId, active) {
        var entry = mfxState.slotState[slotId];
        if (!entry || !entry.slotMesh) return;
        var mat = entry.slotMesh.material;
        var blocked = !entry.moduleKey && !!_blockedBy(mfxState.carrierKey, slotId, mfxState.slotState);
        if (active) {
            mat.color.setHex(blocked ? 0x884422 : 0x2288ff);
            mat.opacity = 0.75;
        } else if (blocked) {
            mat.color.setHex(0x442222);
            mat.opacity = 0.55;
        } else {
            // Occupied slots get a subtle green tint
            if (entry.moduleKey) {
                mat.color.setHex(0x224422);
                mat.opacity = 0.5;
            } else {
                mat.color.setHex(0x1a2a3a);
                mat.opacity = 0.55;
            }
        }
        // Update edge color
        var edgeColor = active ? 0x66aaff : (blocked ? 0xaa6644 : (entry.moduleKey ? 0x44aa44 : 0x4488aa));
        entry.slotMesh.children.forEach(function (child) {
            if (child.isLineSegments) {
                child.material.color.setHex(edgeColor);
            }
        });
    }

    // ================================================================
    //  Load .x / .hxx model from server, cache result
    // ================================================================
    function loadXModelFromServer(filePath, cacheKey, onDone, onFail) {
        if (!filePath) { if (onFail) onFail(); return; }

        // Normalise cacheKey
        var key = cacheKey || filePath;

        if (mfxState.xModelCache[key]) {
            onDone(mfxState.xModelCache[key]);
            return;
        }

        var isHxx = /\.hxx$/i.test(filePath);

        fetch(filePath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (data) {
            if (isHxx) {
                if (typeof HXXLoader === 'undefined') throw new Error('HXXLoader not available');
                return HXXLoader.parse(data).then(function (result) {
                    return result.xFileBinary || result.xFileText;
                });
            }
            return data;
        }).then(function (xData) {
            if (!xData) throw new Error('No data');
            var blob = new Blob([xData], { type: 'application/octet-stream' });
            var url  = URL.createObjectURL(blob);
            // Texture path resolver
            var basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
            var manager = new THREE.LoadingManager();
            manager.setURLModifier(function (texUrl) {
                if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                    return basePath + texUrl.split('/').pop();
                }
                return texUrl;
            });
            var loader = new THREE.XFileLoader(manager);
            loader.load(url, function (object) {
                URL.revokeObjectURL(url);
                if (!object || !object.models || object.models.length === 0) {
                    if (onFail) onFail();
                    return;
                }
                var group = new THREE.Group();
                group.name = '__xmodel_' + key + '__';
                object.models.forEach(function (m, idx) {
                    m.renderOrder = idx;
                    var mats = Array.isArray(m.material) ? m.material : [m.material];
                    mats.forEach(function (mat) {
                        if (!mat) return;
                        mat.polygonOffset = true;
                        mat.polygonOffsetFactor = idx === 0 ? 1 : -Math.min(idx, 10);
                        mat.polygonOffsetUnits  = idx === 0 ? 1 : -Math.min(idx, 10) * 4;
                    });
                    group.add(m);
                });
                fixXFileCoords(group);
                mfxState.xModelCache[key] = group;
                onDone(group);
            }, undefined, function (err) {
                URL.revokeObjectURL(url);
                console.warn('[MFXCarrier] Failed to parse .x for', key, err);
                if (onFail) onFail();
            });
        }).catch(function (err) {
            console.warn('[MFXCarrier] Could not load model', filePath, ':', err.message);
            if (onFail) onFail();
        });
    }

    // ================================================================
    //  Convert DirectX left-hand coords → Three.js right-hand
    //  (identical to vantageLayout.js fixXFileCoords)
    // ================================================================
    function fixXFileCoords(group) {
        group.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;
            var pos = child.geometry.attributes.position;
            if (pos) {
                for (var i = 0; i < pos.count; i++) pos.setZ(i, -pos.getZ(i));
                pos.needsUpdate = true;
            }
            var norm = child.geometry.attributes.normal;
            if (norm) {
                for (var j = 0; j < norm.count; j++) norm.setZ(j, -norm.getZ(j));
                norm.needsUpdate = true;
            }
            var idx = child.geometry.index;
            if (idx) {
                for (var f = 0; f < idx.count; f += 3) {
                    var a = idx.getX(f), b = idx.getX(f + 1);
                    idx.setX(f, b); idx.setX(f + 1, a);
                }
                idx.needsUpdate = true;
            }
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
        });
    }

    // ================================================================
    //  Deep-clone materials so each instance can be independently styled
    // ================================================================
    function cloneMaterials(group) {
        group.traverse(function (child) {
            if (!child.isMesh) return;
            child.frustumCulled = false;
            if (Array.isArray(child.material)) {
                child.material = child.material.map(function (m) { return m ? m.clone() : m; });
            } else if (child.material) {
                child.material = child.material.clone();
            }
        });
    }

    // ================================================================
    //  Dispose Three.js geometry / material from a group
    // ================================================================
    function disposeGroup(obj) {
        obj.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) { if (m) m.dispose(); });
            }
        });
    }

    // ================================================================
    //  Canvas mouse interactions — slot picking & reorder dragging
    // ================================================================
    function wireMFXCanvas() {
        var canvas = mfxState.canvas;
        if (!canvas) return;

        // --- Helpers to raycast through modules and slot meshes ---
        function getAllPickables() {
            var pickables = [];
            Object.keys(mfxState.slotState).forEach(function (id) {
                var e2 = mfxState.slotState[id];
                if (e2.slotMesh) pickables.push(e2.slotMesh);
                if (e2.moduleMesh) pickables.push(e2.moduleMesh);
            });
            return pickables;
        }

        function resolveHitToSlotId(hitObject) {
            // Direct slot mesh hit
            if (hitObject.userData && hitObject.userData.slotId !== undefined) {
                return parseInt(hitObject.userData.slotId, 10);
            }
            // Walk up parents for slot mesh hit
            var parent = hitObject.parent;
            while (parent) {
                if (parent.userData && parent.userData.slotId !== undefined) {
                    return parseInt(parent.userData.slotId, 10);
                }
                parent = parent.parent;
            }
            // Check if it's part of a module mesh in any slot
            var ids = Object.keys(mfxState.slotState);
            for (var i = 0; i < ids.length; i++) {
                var entry = mfxState.slotState[ids[i]];
                if (entry.moduleMesh) {
                    var obj = hitObject;
                    while (obj) {
                        if (obj === entry.moduleMesh) return parseInt(ids[i], 10);
                        obj = obj.parent;
                    }
                }
            }
            return null;
        }

        function pickSlotAt(e) {
            var rect = canvas.getBoundingClientRect();
            mfxState._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
            mfxState._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            mfxState._raycaster.setFromCamera(mfxState._mouse, mfxState.camera);
            var hits = mfxState._raycaster.intersectObjects(getAllPickables(), true);
            if (hits.length > 0) {
                return resolveHitToSlotId(hits[0].object);
            }
            return null;
        }

        // Expose resolveHitToSlotId and pickSlotAt for getSlotIdUnderMouse
        mfxState._pickSlotAt = pickSlotAt;

        // --- CLICK: select slot (only fires if we didn't drag) ---
        canvas.addEventListener('click', function (e) {
            // If we just completed a canvas drag, don't also select
            if (mfxState._canvasDragDidMove) {
                mfxState._canvasDragDidMove = false;
                return;
            }
            var slotId = pickSlotAt(e);
            if (slotId !== null) {
                selectSlot(slotId);
            }
        });

        // --- Block ALL OrbitControls pointer events in reorder mode ---
        // OrbitControls registers pointerdown/pointermove/pointerup on this
        // same canvas element.  stopPropagation only blocks parent elements;
        // stopImmediatePropagation is required to prevent later same-element
        // listeners (OrbitControls) from seeing the event AND from calling
        // setPointerCapture which steals all future pointer events.
        ['pointerdown', 'pointermove', 'pointerup'].forEach(function (evtName) {
            canvas.addEventListener(evtName, function (e) {
                if (!mfxState.isReorderMode) return;
                // Block left button interactions entirely; allow right-click
                // context menu through but still prevent orbit
                if (e.button === 2 && evtName === 'pointerdown') {
                    // let context menu work, but stop orbit
                }
                e.stopImmediatePropagation();
            }, true); // capture phase — fires before OrbitControls
        });

        // --- MOUSEDOWN: start 3D reorder drag if in reorder mode ---
        canvas.addEventListener('mousedown', function (e) {
            if (!mfxState.isReorderMode) return;
            if (e.button !== 0) return; // only left mouse

            var slotId = pickSlotAt(e);
            if (slotId === null) return;
            var entry = mfxState.slotState[slotId];
            if (!entry || !entry.moduleKey) return; // must have a module to drag

            mfxState._canvasDragSourceSlot = slotId;
            mfxState._canvasDragging = false;
            mfxState._canvasDragDidMove = false;
            mfxState._canvasDragStartPos = { x: e.clientX, y: e.clientY };
            mfxState._dragSnappedSlot = null; // track which slot the mesh visually snapped to

            // Store original 3D position so we can snap back
            if (entry.moduleMesh) {
                mfxState._dragOrigPos = entry.moduleMesh.position.clone();
                // Store offset from slot center to mesh position for smooth drag
                var slotCX = entry.slot.x + entry.slot.dx / 2;
                var slotCZ = entry.slot.y + entry.slot.dy / 2;
                mfxState._dragMeshOffset = {
                    x: entry.moduleMesh.position.x - slotCX,
                    z: entry.moduleMesh.position.z - slotCZ
                };
            }
            // Create a horizontal plane at nesting height for projection
            mfxState._dragPlane = new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                -getNestingY()
            );
        });

        // --- Shared drag-completion logic (used by both mouseup and document handlers) ---
        function completeDrag(e) {
            if (mfxState._canvasDragSourceSlot === null) return;
            var sourceSlotId = mfxState._canvasDragSourceSlot;
            var wasDragging = mfxState._canvasDragging;

            // Save mesh position + offset BEFORE clearing state
            var origPos = mfxState._dragOrigPos;
            var savedDragOffset = mfxState._dragMeshOffset;
            var srcEntry = mfxState.slotState[sourceSlotId];
            var savedMeshPos = (srcEntry && srcEntry.moduleMesh)
                ? srcEntry.moduleMesh.position.clone() : null;
            var lastHoveredSlot = mfxState._canvasReorderHoveredSlot;
            var snappedSlot = mfxState._dragSnappedSlot;

            // Check trash zone hit BEFORE hiding it (isMFXTrashHit requires .visible)
            var trashHit = wasDragging && e && isMFXTrashHit(e);

            // Clean up state
            mfxState._canvasDragSourceSlot = null;
            mfxState._canvasDragging = false;
            mfxState._canvasDragStartPos = null;
            mfxState._hoveredModuleSlot = null;
            mfxState._dragOrigPos = null;
            mfxState._dragPlane = null;
            mfxState._dragMeshOffset = null;
            mfxState._dragSnappedSlot = null;
            canvas.style.cursor = 'default';
            document.body.style.cursor = '';
            clearAllModuleGlows();
            clearCanvasReorderHighlights();
            showMFXTrashZone(false);
            showMFXDragLabel(false);
            // Remove document-level drag listeners
            document.removeEventListener('mousemove', onDocDragMove, true);
            document.removeEventListener('mouseup', onDocDragUp, true);

            if (!wasDragging) return;

            // Check if dropped on trash zone
            if (trashHit) {
                removeModuleMeshFromSlot(sourceSlotId);
                setSlotHighlight(sourceSlotId, mfxState.selectedSlotId === sourceSlotId);
                updateSlotList();
                setMFXStatus('Removed module from slot');
                return;
            }

            // 1) Primary: use the slot the mesh visually snapped to (this is what the user sees)
            var targetSlot = (snappedSlot !== null && snappedSlot !== sourceSlotId) ? snappedSlot : null;

            // 2) Fallback: cursor-based pick
            if (targetSlot === null && e) {
                var cursorSlot = pickSlotAt(e);
                if (cursorSlot !== null && cursorSlot !== sourceSlotId) {
                    targetSlot = cursorSlot;
                }
            }

            // 3) Fallback: check where the module mesh actually is (handles fast drags)
            if (targetSlot === null && savedMeshPos) {
                var meshTarget = findSlotByMeshPosition(sourceSlotId, savedMeshPos, savedDragOffset);
                if (meshTarget !== null) {
                    targetSlot = meshTarget;
                }
            }

            // 4) Fallback: use the last hovered slot from mousemove
            if (targetSlot === null && lastHoveredSlot !== null && lastHoveredSlot !== sourceSlotId) {
                targetSlot = lastHoveredSlot;
            }

            if (targetSlot !== null && targetSlot !== sourceSlotId) {
                // Snap source module back first (swap will reposition both)
                var srcE = mfxState.slotState[sourceSlotId];
                if (srcE && srcE.moduleMesh && origPos) {
                    srcE.moduleMesh.position.copy(origPos);
                }
                swapModulesBetweenSlots(sourceSlotId, targetSlot);
            } else {
                // Invalid drop — snap back to original position
                var srcE2 = mfxState.slotState[sourceSlotId];
                if (srcE2 && srcE2.moduleMesh && origPos) {
                    srcE2.moduleMesh.position.copy(origPos);
                }
                setSlotHighlight(sourceSlotId, mfxState.selectedSlotId === sourceSlotId);
            }
        }

        // --- Document-level handlers (attached once dragging is confirmed) ---
        function onDocDragMove(e) {
            if (mfxState._canvasDragSourceSlot === null) return;

            // --- Move the module mesh to follow the cursor ---
            var srcEntry = mfxState.slotState[mfxState._canvasDragSourceSlot];
            if (srcEntry && srcEntry.moduleMesh && mfxState._dragPlane && mfxState._dragMeshOffset) {
                var rect2 = canvas.getBoundingClientRect();
                var ndcX =  ((e.clientX - rect2.left)  / rect2.width)  * 2 - 1;
                var ndcY = -((e.clientY - rect2.top) / rect2.height) * 2 + 1;
                mfxState._raycaster.setFromCamera({ x: ndcX, y: ndcY }, mfxState.camera);
                var hitPt = new THREE.Vector3();
                if (mfxState._raycaster.ray.intersectPlane(mfxState._dragPlane, hitPt)) {
                    // Check if hitPt is within any OTHER slot's bounds — snap there
                    var snappedSlot = null;
                    var ids = Object.keys(mfxState.slotState);
                    for (var si = 0; si < ids.length; si++) {
                        var sid = parseInt(ids[si], 10);
                        if (sid === mfxState._canvasDragSourceSlot) continue;
                        var sEntry = mfxState.slotState[sid];
                        if (!sEntry || !sEntry.slot) continue;
                        var sl = sEntry.slot;
                        var cx = sl.x + sl.dx / 2;
                        var cz = sl.y + sl.dy / 2;
                        if (Math.abs(hitPt.x - cx) <= sl.dx / 2 &&
                            Math.abs(hitPt.z - cz) <= sl.dy / 2) {
                            snappedSlot = sid;
                            break;
                        }
                    }
                    if (snappedSlot !== null) {
                        // Snap: position module at target slot using stored offset
                        var tsl = mfxState.slotState[snappedSlot].slot;
                        srcEntry.moduleMesh.position.x = tsl.x + tsl.dx / 2 + mfxState._dragMeshOffset.x;
                        srcEntry.moduleMesh.position.z = tsl.y + tsl.dy / 2 + mfxState._dragMeshOffset.z;
                        mfxState._dragSnappedSlot = snappedSlot; // remember visual snap
                    } else {
                        // Free follow: use hitPt + stored offset
                        srcEntry.moduleMesh.position.x = hitPt.x + mfxState._dragMeshOffset.x;
                        srcEntry.moduleMesh.position.z = hitPt.z + mfxState._dragMeshOffset.z;
                        mfxState._dragSnappedSlot = null; // no longer snapped
                    }
                }
            }

            // Highlight target slot under mouse
            clearCanvasReorderHighlights();
            var targetSlot = pickSlotAt(e);
            if (targetSlot !== null && targetSlot !== mfxState._canvasDragSourceSlot) {
                mfxState._canvasReorderHoveredSlot = targetSlot;
                var tEntry = mfxState.slotState[targetSlot];
                if (tEntry && tEntry.slotMesh) {
                    tEntry.slotMesh.material.color.setHex(0x44cc44);
                    tEntry.slotMesh.material.opacity = 0.8;
                }
                // Glow the target module too (lighter green)
                if (tEntry && tEntry.moduleKey) {
                    setModuleGlow(targetSlot, 0x44cc44, 0.25);
                }
            }
            // Update floating label position
            updateMFXDragLabel(e);
            // Check if hovering over trash zone — apply red glow to 3D module
            var overTrash = isMFXTrashHit(e);
            updateMFXTrashHover(e);
            if (overTrash) {
                setModuleGlow(mfxState._canvasDragSourceSlot, 0xdd3c3c, 0.6);
            } else {
                setModuleGlow(mfxState._canvasDragSourceSlot, 0x00ff66, 0.5);
            }
        }

        function onDocDragUp(e) {
            completeDrag(e);
        }

        // --- MOUSEMOVE on canvas: hover effects + drag threshold detection ---
        canvas.addEventListener('mousemove', function (e) {
            // Show pointer cursor + green glow on hover over modules (only when not dragging)
            if (mfxState.isReorderMode && mfxState._canvasDragSourceSlot === null) {
                var hoverSlot = pickSlotAt(e);
                var prevHover = mfxState._hoveredModuleSlot;
                if (hoverSlot !== null) {
                    var hEntry = mfxState.slotState[hoverSlot];
                    var hasModule = hEntry && hEntry.moduleKey;
                    canvas.style.cursor = hasModule ? 'grab' : 'default';
                    if (hasModule && hoverSlot !== prevHover) {
                        if (prevHover != null) clearModuleGlow(prevHover);
                        setModuleGlow(hoverSlot, 0x00cc66, 0.3);
                        mfxState._hoveredModuleSlot = hoverSlot;
                    } else if (!hasModule && prevHover != null) {
                        clearModuleGlow(prevHover);
                        mfxState._hoveredModuleSlot = null;
                    }
                } else {
                    canvas.style.cursor = 'default';
                    if (prevHover != null) {
                        clearModuleGlow(prevHover);
                        mfxState._hoveredModuleSlot = null;
                    }
                }
            }
            // If already actively dragging, the document-level handler takes over
            if (mfxState._canvasDragging) return;
            if (mfxState._canvasDragSourceSlot === null) return;
            if (!mfxState._canvasDragging) {
                // Only start dragging after threshold (5px) to avoid accidental drags
                var dx = e.clientX - mfxState._canvasDragStartPos.x;
                var dy = e.clientY - mfxState._canvasDragStartPos.y;
                if (Math.sqrt(dx * dx + dy * dy) < 5) return;
                mfxState._canvasDragging = true;
                mfxState._canvasDragDidMove = true;
                // Highlight the source slot + module glow
                setSlotHighlight(mfxState._canvasDragSourceSlot, true);
                setModuleGlow(mfxState._canvasDragSourceSlot, 0x00ff66, 0.5);
                canvas.style.cursor = 'grabbing';
                document.body.style.cursor = 'grabbing';
                // Show trash drop zone
                showMFXTrashZone(true);
                // Show floating drag label
                showMFXDragLabel(true, mfxState._canvasDragSourceSlot);
                // Attach document-level listeners so drag continues outside canvas
                document.addEventListener('mousemove', onDocDragMove, true);
                document.addEventListener('mouseup', onDocDragUp, true);
            }
        });

        // --- Helper: find the best slot overlapping the module mesh's current position ---
        // Uses the mesh center (minus drag offset) and checks >50% overlap with each slot.
        function findSlotByMeshPosition(sourceSlotId, meshPos, dragOffset) {
            if (!meshPos) return null;
            // Effective center of the dragged module in slot-space
            var effX = meshPos.x - (dragOffset ? dragOffset.x : 0);
            var effZ = meshPos.z - (dragOffset ? dragOffset.z : 0);
            var bestSlot = null;
            var bestDist = Infinity;
            var ids = Object.keys(mfxState.slotState);
            for (var i = 0; i < ids.length; i++) {
                var sid = parseInt(ids[i], 10);
                if (sid === sourceSlotId) continue;
                var sEntry = mfxState.slotState[sid];
                if (!sEntry || !sEntry.slot) continue;
                var sl = sEntry.slot;
                var cx = sl.x + sl.dx / 2;
                var cz = sl.y + sl.dy / 2;
                var overlapX = Math.max(0, (sl.dx / 2) - Math.abs(effX - cx));
                var overlapZ = Math.max(0, (sl.dy / 2) - Math.abs(effZ - cz));
                // Must overlap >50% of the slot dimension on both axes
                if (overlapX > sl.dx * 0.5 && overlapZ > sl.dy * 0.5) {
                    var dist = Math.abs(effX - cx) + Math.abs(effZ - cz);
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestSlot = sid;
                    }
                }
            }
            return bestSlot;
        }

        // --- MOUSEUP on canvas: complete the reorder drag (for drops landing on canvas) ---
        canvas.addEventListener('mouseup', function (e) {
            completeDrag(e);
        });

        // If mouse leaves canvas during drag, let the document-level handlers
        // continue tracking so the user can reach the trash zone.
        // Only cancel if NOT actively dragging (e.g. pre-threshold).
        canvas.addEventListener('mouseleave', function () {
            if (mfxState._canvasDragSourceSlot !== null && !mfxState._canvasDragging) {
                // Pre-threshold: cancel the pending drag
                mfxState._canvasDragSourceSlot = null;
                mfxState._canvasDragStartPos = null;
                mfxState._dragOrigPos = null;
                mfxState._dragPlane = null;
                mfxState._dragMeshOffset = null;
                canvas.style.cursor = 'default';
            }
            // If actively dragging, do nothing — document-level handlers continue the drag
        });
    }

    function clearCanvasReorderHighlights() {
        if (mfxState._canvasReorderHoveredSlot != null) {
            var prev = mfxState._canvasReorderHoveredSlot;
            mfxState._canvasReorderHoveredSlot = null;
            setSlotHighlight(prev, mfxState.selectedSlotId === prev);
            clearModuleGlow(prev);
        }
    }

    // ---- Module 3D glow helpers ----
    // Traverse every Mesh child under moduleMesh and set emissive
    function setModuleGlow(slotId, hexColor, intensity) {
        var entry = mfxState.slotState[slotId];
        if (!entry || !entry.moduleMesh) return;
        entry.moduleMesh.traverse(function (child) {
            if (child.isMesh && child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    if (m.emissive) {
                        m.emissive.setHex(hexColor);
                        m.emissiveIntensity = intensity != null ? intensity : 0.35;
                    }
                });
            }
        });
    }
    function clearModuleGlow(slotId) {
        var entry = mfxState.slotState[slotId];
        if (!entry || !entry.moduleMesh) return;
        entry.moduleMesh.traverse(function (child) {
            if (child.isMesh && child.material) {
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    if (m.emissive) {
                        m.emissive.setHex(0x000000);
                        m.emissiveIntensity = 1;
                    }
                });
            }
        });
    }
    function clearAllModuleGlows() {
        Object.keys(mfxState.slotState).forEach(function (id) {
            clearModuleGlow(parseInt(id, 10));
        });
    }

    // ---- Trash drop-zone helpers ----
    function _getTrashEl() {
        return document.getElementById('mfx-trash-zone');
    }
    function showMFXTrashZone(show) {
        var el = _getTrashEl();
        if (!el) return;
        el.classList.toggle('visible', !!show);
    }
    function updateMFXTrashHover(e) {
        var el = _getTrashEl();
        if (!el) return;
        el.classList.toggle('hover', isMFXTrashHit(e));
    }
    function isMFXTrashHit(e) {
        var el = _getTrashEl();
        if (!el || !el.classList.contains('visible')) return false;
        var r = el.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top  && e.clientY <= r.bottom;
    }

    // ---- Floating drag label helpers ----
    function _getDragLabelEl() {
        var el = document.getElementById('mfx-drag-label');
        if (!el) {
            el = document.createElement('div');
            el.id = 'mfx-drag-label';
            el.className = 'mfx-drag-label';
            document.getElementById('mfx-host').appendChild(el);
        }
        return el;
    }
    function showMFXDragLabel(show, slotId) {
        var el = _getDragLabelEl();
        if (show && slotId != null) {
            var entry = mfxState.slotState[slotId];
            var name = (entry && entry.moduleKey) || 'Module';
            el.textContent = name;
            el.classList.add('visible');
        } else {
            el.classList.remove('visible');
        }
    }
    function updateMFXDragLabel(e) {
        var el = _getDragLabelEl();
        if (!el.classList.contains('visible')) return;
        var host = document.getElementById('mfx-host');
        var hr = host.getBoundingClientRect();
        el.style.left = (e.clientX - hr.left + 14) + 'px';
        el.style.top  = (e.clientY - hr.top  + 14) + 'px';
    }

    // ================================================================
    //  Wire UI controls
    // ================================================================
    function wireMFXControls() {
        // Carrier selector tabs
        var tabs = document.querySelectorAll('.mfx-carrier-tab');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var key = tab.dataset.carrierKey;
                if (!key || key === mfxState.carrierKey) return;
                document.querySelectorAll('.mfx-carrier-tab').forEach(function (t) { t.classList.remove('is-active'); });
                tab.classList.add('is-active');
                buildCarrierScene(key);
            });
        });

        // Reset camera button
        var resetBtn = $('#mfx-reset-cam');
        if (resetBtn) resetBtn.addEventListener('click', resetMFXCamera);

        // Clear all slots button
        var clearBtn = $('#mfx-clear-all');
        if (clearBtn) clearBtn.addEventListener('click', function () {
            Object.keys(mfxState.slotState).forEach(function (id) {
                removeModuleMeshFromSlot(parseInt(id, 10));
            });
            mfxState.selectedSlotId = null;
            mfxState.pendingModuleKey = null;
            // Reset all slot highlights
            Object.keys(mfxState.slotState).forEach(function (id) {
                setSlotHighlight(parseInt(id, 10), false);
            });
            updateSlotList();
            updateModuleCatalogSelection();
            updatePendingModuleHint();
            setMFXStatus('All slots cleared');
        });

        // Export button
        var exportBtn = $('#mfx-export-btn');
        if (exportBtn) exportBtn.addEventListener('click', exportConfiguration);

        // Export .tml button
        var tmlBtn = $('#mfx-export-tml-btn');
        if (tmlBtn) tmlBtn.addEventListener('click', exportMfxTml);

        // Export package (.zip) button
        var zipBtn = $('#mfx-export-zip-btn');
        if (zipBtn) zipBtn.addEventListener('click', exportMfxPackageZip);

        // Cancel pending module placement
        var cancelPendingBtn = $('#mfx-cancel-pending');
        if (cancelPendingBtn) cancelPendingBtn.addEventListener('click', function () {
            mfxState.pendingModuleKey = null;
            updatePendingModuleHint();
            updateModuleCatalogSelection();
        });

        // Module category filter
        var catFilter = $('#mfx-cat-filter');
        if (catFilter) {
            catFilter.addEventListener('change', function () {
                populateModuleCatalog();
            });
        }

        // Module search filter
        var searchInput = $('#mfx-module-search');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                populateModuleCatalog();
            });
        }

        // Left panel toggle
        var leftToggle = $('#mfx-left-toggle');
        var leftPanel  = $('#mfx-left-panel');
        var host       = $('#mfx-host');
        if (leftToggle && leftPanel && host) {
            leftToggle.addEventListener('click', function () {
                var collapsed = leftPanel.classList.toggle('is-collapsed');
                host.classList.toggle('vl-left-collapsed', collapsed);
                var icon = document.querySelector('#mfx-left-toggle-icon');
                if (icon) icon.className = collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            });
        }

        // No right panel — start with right collapsed class
        if (host) host.classList.add('vl-right-collapsed');
    }

    // ================================================================
    //  Populate carrier selector tabs
    // ================================================================
    function populateCarrierSelector() {
        var container = $('#mfx-carrier-tabs');
        if (!container) return;
        container.innerHTML = '';
        Object.keys(MFX_CARRIER_DEFS).forEach(function (key) {
            var def = MFX_CARRIER_DEFS[key];
            var btn = document.createElement('button');
            btn.className = 'mfx-carrier-tab' + (key === mfxState.carrierKey ? ' is-active' : '');
            btn.dataset.carrierKey = key;
            btn.textContent = def.label;
            btn.title = def.description;
            btn.addEventListener('click', function () {
                document.querySelectorAll('.mfx-carrier-tab').forEach(function (t) { t.classList.remove('is-active'); });
                btn.classList.add('is-active');
                buildCarrierScene(key);
            });
            container.appendChild(btn);
        });
    }

    // ================================================================
    //  Populate module catalog
    // ================================================================
    function populateModuleCatalog() {
        var container = $('#mfx-module-list');
        if (!container) return;

        var catFilter  = ($('#mfx-cat-filter')     || {}).value || 'All';
        var searchText = (($('#mfx-module-search') || {}).value || '').toLowerCase();

        // Build category filter dropdown options
        var catSel = $('#mfx-cat-filter');
        if (catSel && catSel.options.length <= 1) {
            var cats = [];
            MFX_MODULE_CATALOG.forEach(function (m) {
                if (cats.indexOf(m.category) === -1) cats.push(m.category);
            });
            cats.forEach(function (c) {
                var opt = document.createElement('option');
                opt.value = c; opt.textContent = c;
                catSel.appendChild(opt);
            });
        }

        container.innerHTML = '';

        var filtered = MFX_MODULE_CATALOG.filter(function (m) {
            var catOk  = catFilter === 'All' || m.category === catFilter;
            var searchOk = !searchText || m.label.toLowerCase().indexOf(searchText) !== -1;
            return catOk && searchOk;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="mfx-empty-hint">No modules match filter.</div>';
            return;
        }

        filtered.forEach(function (moduleDef) {
            var isPending = mfxState.pendingModuleKey === moduleDef.key;
            // Check compatibility with the currently selected slot
            var compat = true;
            if (mfxState.selectedSlotId !== null) {
                compat = isModuleCompatibleWithSlot(mfxState.carrierKey, mfxState.selectedSlotId, moduleDef.key);
            }
            var card = document.createElement('div');
            card.className = 'mfx-module-card' + (isPending ? ' is-pending' : '') + (!compat ? ' is-incompatible' : '');
            card.dataset.moduleKey = moduleDef.key;
            if (!compat) card.title = moduleDef.label + ' is not compatible with this slot position';

            var imgEl = document.createElement('div');
            imgEl.className = 'mfx-module-img';
            var cachedThumb = !moduleDef.previewImg ? _loadCachedThumbnail(moduleDef.key) : null;
            if (moduleDef.previewImg || cachedThumb) {
                var img = document.createElement('img');
                img.src = cachedThumb || moduleDef.previewImg;
                img.alt = moduleDef.label;
                img.onerror = function () { imgEl.innerHTML = '<i class="fas fa-cube mfx-module-noimg"></i>'; };
                imgEl.appendChild(img);
            } else {
                imgEl.innerHTML = '<i class="fas fa-cube mfx-module-noimg"></i>';
            }

            var labelEl = document.createElement('div');
            labelEl.className = 'mfx-module-label';
            labelEl.textContent = moduleDef.label;

            var catEl = document.createElement('div');
            catEl.className = 'mfx-module-cat';
            catEl.textContent = moduleDef.category;

            card.appendChild(imgEl);
            card.appendChild(labelEl);
            card.appendChild(catEl);

            card.addEventListener('click', function () {
                onModuleCardClick(moduleDef.key);
            });

            container.appendChild(card);
        });

        makeModuleCardsDraggable();
    }

    function onModuleCardClick(moduleKey) {
        if (mfxState.selectedSlotId !== null) {
            // Place immediately on selected slot
            placeModuleInSlot(mfxState.selectedSlotId, moduleKey);
            mfxState.pendingModuleKey = null;
            updateSlotHighlightForState(mfxState.selectedSlotId);
        } else {
            // No slot selected — set as pending
            mfxState.pendingModuleKey = moduleKey;
            setMFXStatus('Module selected: ' + (_moduleByKey[moduleKey] || {}).label + ' — click a slot to place it');
        }
        updatePendingModuleHint();
        updateModuleCatalogSelection();
    }

    function updateModuleCatalogSelection() {
        document.querySelectorAll('.mfx-module-card').forEach(function (card) {
            var isPending = card.dataset.moduleKey === mfxState.pendingModuleKey;
            card.classList.toggle('is-pending', isPending);
        });
    }

    function updateSlotHighlightForState(slotId) {
        var entry = mfxState.slotState[slotId];
        if (!entry) return;
        var isSelected = mfxState.selectedSlotId === slotId;
        setSlotHighlight(slotId, isSelected);
    }

    // ================================================================
    //  Update slot list panel
    // ================================================================
    function updateSlotList() {
        // Right panel slot list was removed — this is now a no-op.
        // Slot state is managed directly in mfxState.slotState / slotLabware.
    }
            });

            container.appendChild(row);
        });
    }

    // ================================================================
    //  Swap modules between two slots (reorder)
    // ================================================================
    function swapModulesBetweenSlots(slotIdA, slotIdB) {
        var entryA = mfxState.slotState[slotIdA];
        var entryB = mfxState.slotState[slotIdB];
        if (!entryA || !entryB) return;

        var keyA = entryA.moduleKey;
        var keyB = entryB.moduleKey;

        // Pre-validate: simulate the swap by temporarily clearing both slots
        // and checking if each module is compatible with its target slot.
        // (We build a temporary state with both slots empty.)
        var tmpState = {};
        Object.keys(mfxState.slotState).forEach(function (id) {
            var orig = mfxState.slotState[id];
            tmpState[id] = { slot: orig.slot, moduleKey: orig.moduleKey };
        });
        tmpState[slotIdA].moduleKey = null;
        tmpState[slotIdB].moduleKey = null;
        if (keyA) {
            var chkA = canPlaceModule(mfxState.carrierKey, slotIdB, keyA, tmpState);
            if (!chkA.allowed) {
                setMFXStatus('\u26A0 Cannot swap: ' + chkA.reason);
                return;
            }
        }
        if (keyB) {
            // If keyA will go to slotIdB, simulate that before checking keyB at slotIdA
            if (keyA) {
                tmpState[slotIdB].moduleKey = keyA;
            }
            var chkB = canPlaceModule(mfxState.carrierKey, slotIdA, keyB, tmpState);
            if (!chkB.allowed) {
                setMFXStatus('\u26A0 Cannot swap: ' + chkB.reason);
                return;
            }
        }

        // Remove both module meshes from the scene
        if (entryA.moduleMesh && mfxState.carrierGroup) {
            mfxState.carrierGroup.remove(entryA.moduleMesh);
            disposeGroup(entryA.moduleMesh);
        }
        if (entryB.moduleMesh && mfxState.carrierGroup) {
            mfxState.carrierGroup.remove(entryB.moduleMesh);
            disposeGroup(entryB.moduleMesh);
        }
        entryA.moduleMesh = null;
        entryA.moduleKey = null;
        entryB.moduleMesh = null;
        entryB.moduleKey = null;

        // Re-place swapped modules
        if (keyA) placeModuleInSlot(slotIdB, keyA);
        if (keyB) placeModuleInSlot(slotIdA, keyB);

        // Update highlights
        setSlotHighlight(slotIdA, mfxState.selectedSlotId === slotIdA);
        setSlotHighlight(slotIdB, mfxState.selectedSlotId === slotIdB);

        updateSlotList();

        var labelA = entryA.slot.label;
        var labelB = entryB.slot.label;
        setMFXStatus('Swapped modules: ' + labelA + ' \u2194 ' + labelB);
    }

    // ================================================================
    //  Pending module hint banner
    // ================================================================
    function updatePendingModuleHint() {
        var banner = $('#mfx-pending-banner');
        if (!banner) return;
        if (mfxState.pendingModuleKey) {
            var mod = _moduleByKey[mfxState.pendingModuleKey];
            banner.style.display = '';
            var nameEl = $('#mfx-pending-name');
            if (nameEl) nameEl.textContent = mod ? mod.label : mfxState.pendingModuleKey;
        } else {
            banner.style.display = 'none';
        }
    }

    // ================================================================
    //  Export configuration
    // ================================================================
    function exportConfiguration() {
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        if (!def) return;

        var lines = [];
        lines.push('[MFX Carrier Configuration]');
        lines.push('CarrierType=' + def.key);
        lines.push('CarrierLabel=' + def.label);
        lines.push('CarrierDimensions=' + def.dx + 'x' + def.dy + 'x' + def.dz + ' mm');
        lines.push('Slots=' + def.slots.length);
        lines.push('');
        def.slots.forEach(function (slot) {
            var entry = mfxState.slotState[slot.id];
            var moduleKey  = (entry && entry.moduleKey) ? entry.moduleKey : '';
            var moduleLabel = moduleKey ? ((_moduleByKey[moduleKey] || {}).label || moduleKey) : '(empty)';
            lines.push('[Slot ' + slot.label + ']');
            lines.push('SlotId=' + slot.id);
            lines.push('Module=' + moduleLabel);
            if (moduleKey) lines.push('ModuleKey=' + moduleKey);
            lines.push('Position_X=' + slot.x + ' mm');
            lines.push('Position_Y=' + slot.y + ' mm');
            lines.push('Position_Z=' + slot.z + ' mm');
            lines.push('');
        });

        var blob = new Blob([lines.join('\r\n')], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = def.key + '_config.ini';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        setMFXStatus('Configuration exported.');
    }

    // ================================================================
    //  Status bar
    // ================================================================
    function setMFXStatus(msg) {
        var el = $('#mfx-status');
        if (el) el.textContent = msg;
    }

    // ================================================================
    //  Gizmo (orientation indicator) — same pattern as vantageLayout
    // ================================================================
    function drawMFXGizmo() {
        var canvas = $('#mfx-gizmo-canvas');
        if (!canvas || !mfxState.camera) return;
        var size = canvas.width;
        var ctx  = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        var axes = [
            { dir: new THREE.Vector3(1,0,0), color: '#e05555', label: 'X' },
            { dir: new THREE.Vector3(0,1,0), color: '#55bb55', label: 'Y' },
            { dir: new THREE.Vector3(0,0,1), color: '#5588e0', label: 'Z' },
        ];

        var cx = size / 2, cy = size / 2, r = size * 0.38;

        axes.forEach(function (axis) {
            var v = axis.dir.clone().applyQuaternion(mfxState.camera.quaternion);
            var ex = cx + v.x * r;
            var ey = cy - v.y * r;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = axis.color;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = axis.color;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(axis.label, ex + (ex - cx) * 0.18, ey + (ey - cy) * 0.18);
        });

        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#999';
        ctx.fill();
    }

    // ================================================================
    //  Toolbar wiring
    // ================================================================
    function wireMFXToolbar() {
        // Toggle collapse
        var toggle = $('#mfx-vt-toggle');
        var body   = $('#mfx-vt-body');
        if (toggle && body) {
            toggle.addEventListener('click', function () {
                mfxState.toolbarCollapsed = !mfxState.toolbarCollapsed;
                body.classList.toggle('collapsed', mfxState.toolbarCollapsed);
                var icon = toggle.querySelector('i');
                if (icon) icon.className = mfxState.toolbarCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            });
        }

        // Reset camera
        wireBtn('#mfx-vt-reset-cam', resetMFXCamera);

        // Zoom to fit
        wireBtn('#mfx-vt-zoom-fit', zoomMFXToFit);

        // Top-down view
        wireBtn('#mfx-vt-topdown', setMFXTopDown);

        // Perspective toggle
        wireBtn('#mfx-vt-perspective', toggleMFXPerspective);

        // Zoom in/out
        wireBtn('#mfx-vt-zoom-in',  function () { doMFXZoom(0.8); });
        wireBtn('#mfx-vt-zoom-out', function () { doMFXZoom(1.25); });

        // Pan mode
        wireBtn('#mfx-vt-pan', toggleMFXPan);

        // Reorder mode toggle
        wireBtn('#mfx-vt-reorder', toggleMFXReorder);

        // Drag-to-move toolbar
        wireMFXDragHandle('#mfx-vt-grab-handle', '#mfx-toolbar');
    }

    function wireBtn(sel, fn) {
        var el = $(sel);
        if (el) el.addEventListener('click', fn);
    }

    // ================================================================
    //  Camera helpers
    // ================================================================
    function zoomMFXToFit() {
        resetMFXCamera();
    }

    function setMFXTopDown() {
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey] || MFX_CARRIER_DEFS.MFX_CAR_L5;
        var cx = def.dx / 2;
        var cy = def.dy / 2;
        var dist = Math.max(def.dx, def.dy) * 1.8;
        mfxState.camera.position.set(cx, dist, cy);
        mfxState.camera.up.set(0, 0, -1);
        if (mfxState.controls) {
            mfxState.controls.target.set(cx, 0, cy);
            mfxState.controls.update();
        }
    }

    function doMFXZoom(factor) {
        if (!mfxState.camera || !mfxState.controls) return;
        var dir = mfxState.camera.position.clone().sub(mfxState.controls.target);
        dir.multiplyScalar(factor);
        mfxState.camera.position.copy(mfxState.controls.target.clone().add(dir));
        mfxState.controls.update();
    }

    function toggleMFXPerspective() {
        var host = mfxState.host;
        if (!host || !mfxState.camera) return;
        var w = host.clientWidth || 800;
        var h = host.clientHeight || 600;

        mfxState.isPerspective = !mfxState.isPerspective;
        var pos    = mfxState.camera.position.clone();
        var target = mfxState.controls.target.clone();

        if (mfxState.isPerspective) {
            mfxState.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50000);
        } else {
            var dist = pos.distanceTo(target);
            var fs = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
            mfxState.camera = new THREE.OrthographicCamera(
                -fs * (w/h), fs * (w/h), fs, -fs, 0.1, 50000
            );
        }
        mfxState.camera.position.copy(pos);
        mfxState.camera.up.set(0, 1, 0);
        mfxState.camera.lookAt(target);

        mfxState.controls.dispose();
        mfxState.controls = new THREE.OrbitControls(mfxState.camera, mfxState.renderer.domElement);
        mfxState.controls.enableDamping = true;
        mfxState.controls.dampingFactor = 0.12;
        mfxState.controls.target.copy(target);
        mfxState.controls.update();

        // Re-apply reorder orbit state after controls recreation
        applyReorderOrbitState();

        var btn = $('#mfx-vt-perspective');
        if (btn) btn.classList.toggle('is-active', !mfxState.isPerspective);
    }

    function toggleMFXPan() {
        mfxState.isPanning = !mfxState.isPanning;
        // Only apply mouse button change if not in reorder mode
        // (reorder mode disables rotate/pan entirely)
        if (mfxState.controls && !mfxState.isReorderMode) {
            mfxState.controls.mouseButtons.LEFT = mfxState.isPanning
                ? THREE.MOUSE.PAN
                : THREE.MOUSE.ROTATE;
        }
        var btn = $('#mfx-vt-pan');
        if (btn) btn.classList.toggle('is-active', mfxState.isPanning);
    }

    function toggleMFXReorder() {
        mfxState.isReorderMode = !mfxState.isReorderMode;
        var btn = $('#mfx-vt-reorder');
        if (btn) btn.classList.toggle('is-active', mfxState.isReorderMode);

        // Toggle orbit controls: disable rotation/pan when in reorder mode
        // so the scene doesn't move while the user drags labware
        applyReorderOrbitState();

        updateSlotList();
        setMFXStatus(mfxState.isReorderMode
            ? 'Reorder mode ON — click and drag modules in the 3D view to rearrange'
            : 'Reorder mode OFF — orbit controls restored');
    }

    // Apply orbit control restrictions based on reorder mode
    function applyReorderOrbitState() {
        if (!mfxState.controls) return;
        if (mfxState.isReorderMode) {
            // Disable every mouse-button action so OrbitControls does nothing
            // even if a pointer event somehow slips through the
            // stopImmediatePropagation guard.  Scroll-wheel zoom uses a
            // separate 'wheel' event listener and is NOT affected here.
            mfxState.controls.mouseButtons.LEFT   = -1;
            mfxState.controls.mouseButtons.MIDDLE = -1;
            mfxState.controls.mouseButtons.RIGHT  = -1;
            mfxState.controls.enableRotate = false;
            mfxState.controls.enablePan    = false;
            // enableZoom remains true so scroll-wheel still zooms
            mfxState.controls.enableZoom   = true;
            if (mfxState.canvas) mfxState.canvas.style.cursor = 'default';
        } else {
            // Restore normal orbit: rotate on left, pan if pan-mode active
            mfxState.controls.enableRotate = true;
            mfxState.controls.enablePan    = true;
            mfxState.controls.enableZoom   = true;
            mfxState.controls.mouseButtons.LEFT = mfxState.isPanning
                ? THREE.MOUSE.PAN
                : THREE.MOUSE.ROTATE;
            mfxState.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
            mfxState.controls.mouseButtons.RIGHT  = THREE.MOUSE.PAN;
            if (mfxState.canvas) mfxState.canvas.style.cursor = '';
        }
    }

    // ================================================================
    //  Toolbar drag-to-reposition
    // ================================================================
    function wireMFXDragHandle(handleSel, toolbarSel) {
        var handle = $(handleSel);
        var toolbar = $(toolbarSel);
        if (!handle || !toolbar) return;
        var dragging = false, ox = 0, oy = 0, tx = 0, ty = 0;

        handle.addEventListener('mousedown', function (e) {
            dragging = true;
            var rect = toolbar.getBoundingClientRect();
            tx = rect.left; ty = rect.top;
            ox = e.clientX - tx; oy = e.clientY - ty;
            toolbar.style.position = 'fixed';
            toolbar.style.right = 'unset';
            toolbar.style.top = ty + 'px';
            toolbar.style.left = tx + 'px';
            e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
            if (!dragging) return;
            toolbar.style.left = (e.clientX - ox) + 'px';
            toolbar.style.top  = (e.clientY - oy) + 'px';
        });
        document.addEventListener('mouseup', function () { dragging = false; });
    }

    // ================================================================
    //  Drag-and-drop: module catalog → carrier slots
    // ================================================================
    function wireMFXDragDrop() {
        var canvas = mfxState.canvas;
        if (!canvas) return;

        var ghost = document.getElementById('mfx-drag-cursor-ghost');

        // Helper: position a preview mesh at the cursor / snap to slot
        function positionPreview(e) {
            var preview = mfxState._catalogPreviewMesh;
            if (!preview || !mfxState._catalogDragPlane) return;
            var rect = canvas.getBoundingClientRect();
            var ndcX =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
            var ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            mfxState._raycaster.setFromCamera({ x: ndcX, y: ndcY }, mfxState.camera);
            var hitPt = new THREE.Vector3();
            if (!mfxState._raycaster.ray.intersectPlane(mfxState._catalogDragPlane, hitPt)) return;

            // Find slot under hitPt
            var snappedSlot = null;
            var ids = Object.keys(mfxState.slotState);
            for (var i = 0; i < ids.length; i++) {
                var sid = parseInt(ids[i], 10);
                var sEntry = mfxState.slotState[sid];
                if (!sEntry || !sEntry.slot) continue;
                var sl = sEntry.slot;
                var cx = sl.x + sl.dx / 2;
                var cz = sl.y + sl.dy / 2;
                if (Math.abs(hitPt.x - cx) <= sl.dx / 2 &&
                    Math.abs(hitPt.z - cz) <= sl.dy / 2) {
                    snappedSlot = sid;
                    break;
                }
            }

            if (snappedSlot !== null) {
                // Snap preview to slot center
                var tsl = mfxState.slotState[snappedSlot].slot;
                var box = new THREE.Box3().setFromObject(preview);
                var center = box.getCenter(new THREE.Vector3());
                preview.position.set(
                    tsl.x + tsl.dx / 2 - center.x + preview.position.x,
                    getNestingY() - box.min.y + preview.position.y,
                    tsl.y + tsl.dy / 2 - center.z + preview.position.z
                );
            } else {
                // Free follow on drag plane
                var box2 = new THREE.Box3().setFromObject(preview);
                var center2 = box2.getCenter(new THREE.Vector3());
                preview.position.x += hitPt.x - center2.x;
                preview.position.z += hitPt.z - center2.z;
            }
        }

        // Helper: remove 3D preview from scene
        function removeCatalogPreview() {
            if (mfxState._catalogPreviewMesh) {
                mfxState.carrierGroup.remove(mfxState._catalogPreviewMesh);
                disposeGroup(mfxState._catalogPreviewMesh);
                mfxState._catalogPreviewMesh = null;
            }
            mfxState._catalogPreviewKey = null;
            mfxState._catalogDragPlane = null;
        }

        // Helper: make a mesh semi-transparent for preview
        function makePreviewTransparent(group) {
            group.traverse(function (child) {
                if (child.isMesh && child.material) {
                    var mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(function (m) {
                        m.transparent = true;
                        m.opacity = 0.55;
                        if (m.emissive) {
                            m.emissive.setHex(0x00cc66);
                            m.emissiveIntensity = 0.25;
                        }
                    });
                }
            });
        }

        // Make module cards draggable
        document.addEventListener('dragstart', function (e) {
            var card = e.target.closest && e.target.closest('.mfx-module-card');
            if (!card) return;
            var key = card.dataset.moduleKey;
            if (!key) return;
            e.dataTransfer.setData('text/plain', key);
            e.dataTransfer.effectAllowed = 'copy';
            mfxState._dragModuleKey = key;

            // Use small ghost (browser requires one for DnD)
            if (ghost) {
                var mod = _moduleByKey[key];
                var label = ghost.querySelector('#mfx-drag-ghost-label');
                if (label) label.textContent = mod ? mod.label : key;
                ghost.style.display = '';
                e.dataTransfer.setDragImage(ghost, 16, 16);
                setTimeout(function () { ghost.style.display = 'none'; }, 0);
            }

            // Create drag plane
            mfxState._catalogDragPlane = new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                -getNestingY()
            );

            // Load 3D preview model
            var moduleDef = _moduleByKey[key];
            if (moduleDef && moduleDef.modelFile) {
                mfxState._catalogPreviewKey = key;
                loadXModelFromServer(moduleDef.modelFile, key, function (xGroup) {
                    if (mfxState._catalogPreviewKey !== key) return; // drag ended
                    var clone = xGroup.clone(true);
                    clone.name = '__catalog_preview__';
                    cloneMaterials(clone);
                    makePreviewTransparent(clone);
                    // Start at center of carrier
                    clone.position.set(0, getNestingY(), 0);
                    mfxState.carrierGroup.add(clone);
                    mfxState._catalogPreviewMesh = clone;
                });
            }
        });

        // Allow drop on canvas
        canvas.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            // Position 3D preview
            positionPreview(e);
            // Highlight hovered slot
            highlightSlotUnderMouse(e);
        });

        canvas.addEventListener('dragleave', function () {
            clearDragHighlights();
        });

        document.addEventListener('dragend', function () {
            // Always clean up preview on drag end (cancelled or completed)
            removeCatalogPreview();
            clearDragHighlights();
            mfxState._dragModuleKey = null;
        });

        canvas.addEventListener('drop', function (e) {
            e.preventDefault();
            var moduleKey = e.dataTransfer.getData('text/plain');
            mfxState._dragModuleKey = null;
            removeCatalogPreview();
            if (!moduleKey || !_moduleByKey[moduleKey]) return;

            var slotId = getSlotIdUnderMouse(e);
            if (slotId !== null) {
                placeModuleInSlot(slotId, moduleKey);
                setMFXStatus('Dropped ' + (_moduleByKey[moduleKey] || {}).label + ' at slot ' + slotId);
            } else {
                setMFXStatus('Module not placed \u2014 drop on a carrier slot');
            }
            clearDragHighlights();
        });
    }

    function getSlotIdUnderMouse(e) {
        // Use the shared picker if available (picks through module meshes)
        if (mfxState._pickSlotAt) return mfxState._pickSlotAt(e);
        // Fallback
        var rect = mfxState.canvas.getBoundingClientRect();
        mfxState._mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mfxState._mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        mfxState._raycaster.setFromCamera(mfxState._mouse, mfxState.camera);

        var slotMeshes = [];
        Object.keys(mfxState.slotState).forEach(function (id) {
            var e2 = mfxState.slotState[id];
            if (e2.slotMesh) slotMeshes.push(e2.slotMesh);
        });
        var hits = mfxState._raycaster.intersectObjects(slotMeshes, false);
        if (hits.length > 0) {
            var sid = hits[0].object.userData.slotId;
            if (sid !== undefined) return parseInt(sid, 10);
        }
        return null;
    }

    function highlightSlotUnderMouse(e) {
        clearDragHighlights();
        var slotId = getSlotIdUnderMouse(e);
        if (slotId !== null) {
            mfxState._dragHoveredSlot = slotId;
            var entry = mfxState.slotState[slotId];
            if (entry && entry.slotMesh) {
                // Show green if compatible, red if not
                var dragKey = mfxState._dragModuleKey;
                var compatible = !dragKey || isModuleCompatibleWithSlot(mfxState.carrierKey, slotId, dragKey);
                if (!compatible || _blockedBy(mfxState.carrierKey, slotId, mfxState.slotState)) {
                    entry.slotMesh.material.color.setHex(0xcc4444);
                } else {
                    entry.slotMesh.material.color.setHex(0x44cc44);
                }
                entry.slotMesh.material.opacity = 0.8;
            }
        }
    }

    function clearDragHighlights() {
        if (mfxState._dragHoveredSlot !== null && mfxState._dragHoveredSlot !== undefined) {
            var prev = mfxState._dragHoveredSlot;
            mfxState._dragHoveredSlot = null;
            var isSelected = mfxState.selectedSlotId === prev;
            setSlotHighlight(prev, isSelected);
        }
    }

    // ================================================================
    //  Make module cards draggable (called after populateModuleCatalog)
    // ================================================================
    function makeModuleCardsDraggable() {
        document.querySelectorAll('.mfx-module-card').forEach(function (card) {
            card.setAttribute('draggable', 'true');
        });
    }

    // ================================================================
    //  Wire collapsible right-panel / left-panel section toggles
    // ================================================================
    function wireRightPanelSections() {
        var pairs = [
            ['#mfx-meta-toggle',         '#mfx-meta-body'],
            ['#mfx-carrier-type-toggle',  '#mfx-carrier-type-body'],
            ['#mfx-catalog-toggle',       '#mfx-catalog-body'],
            ['#mfx-labware-toggle',       '#mfx-labware-body'],
        ];
        pairs.forEach(function (p) {
            var header = $(p[0]);
            var body   = $(p[1]);
            if (!header || !body) return;
            header.addEventListener('click', function () {
                body.classList.toggle('is-hidden');
                var chevron = header.querySelector('.mfx-rp-chevron');
                if (chevron) {
                    if (body.classList.contains('is-hidden')) {
                        chevron.classList.remove('fa-chevron-down');
                        chevron.classList.add('fa-chevron-right');
                    } else {
                        chevron.classList.remove('fa-chevron-right');
                        chevron.classList.add('fa-chevron-down');
                    }
                }
            });
        });
    }

    // ================================================================
    //  Wire carrier metadata form fields ↔ mfxState.carrierMeta
    // ================================================================
    function wireCarrierMetadata() {
        var nameEl  = $('#mfx-car-name');
        var descEl  = $('#mfx-car-desc');
        var bcEl    = $('#mfx-car-barcode');
        var bcuEl   = $('#mfx-car-bc-unique');
        var catEl   = $('#mfx-car-categories');
        var propEl  = $('#mfx-car-properties');
        var propPickerBtn = $('#mfx-car-prop-picker');

        function sync(el, field) {
            if (!el) return;
            el.addEventListener('input', function () {
                mfxState.carrierMeta[field] = el.value;
            });
        }
        sync(nameEl,  'viewName');
        sync(descEl,  'description');
        sync(bcEl,    'barcodeMask');

        // Category picker button
        var catPickerBtn = $('#mfx-car-cat-picker');
        if (catPickerBtn && catEl) {
            catPickerBtn.addEventListener('click', function () {
                if (typeof window.CategoryEditorModule !== 'undefined' && window.CategoryEditorModule.openCategoryPicker) {
                    window.CategoryEditorModule.openCategoryPicker(mfxState.carrierMeta.categories).then(function (result) {
                        if (result !== null) {
                            mfxState.carrierMeta.categories = result;
                            catEl.value = result.join(', ');
                        }
                    });
                } else {
                    // Fallback: prompt for comma-separated IDs
                    var ids = prompt('Enter category IDs (comma-separated):', mfxState.carrierMeta.categories.join(', '));
                    if (ids !== null) {
                        mfxState.carrierMeta.categories = ids.split(',').map(function(s){ return s.trim(); }).filter(Boolean);
                        catEl.value = mfxState.carrierMeta.categories.join(', ');
                    }
                }
            });
        }
        if (bcuEl) {
            bcuEl.addEventListener('change', function () {
                mfxState.carrierMeta.barcodeUnique = bcuEl.checked;
            });
        }
        if (propPickerBtn && propEl) {
            propPickerBtn.addEventListener('click', function () {
                openPropertyPickerDialog(mfxState.carrierMeta.properties).then(function (result) {
                    if (result !== null) {
                        mfxState.carrierMeta.properties = result;
                        updatePropertiesSummary();
                    }
                });
            });
        }
    }

    function updatePropertiesSummary() {
        var el = $('#mfx-car-properties');
        if (!el) return;
        var props = mfxState.carrierMeta.properties;
        if (!props || props.length === 0) {
            el.value = '';
        } else {
            el.value = props.length + ' propert' + (props.length === 1 ? 'y' : 'ies');
        }
    }

    function openPropertyPickerDialog(currentProps) {
        return new Promise(function (resolve) {
            // Deep-copy working set
            var working = [];
            for (var i = 0; i < currentProps.length; i++) {
                working.push({ name: currentProps[i].name, value: currentProps[i].value });
            }

            var overlay = document.createElement('div');
            overlay.className = 'prop-picker-overlay';

            var modal = document.createElement('div');
            modal.className = 'prop-picker-modal';

            var header = '<div class="prop-picker-header">';
            header += '<i class="fas fa-list"></i> Edit Properties';
            header += '<button class="prop-picker-close" title="Cancel">&times;</button>';
            header += '</div>';

            var body = '<div class="prop-picker-body">';
            body += '<div class="prop-picker-list" id="prop-picker-list"></div>';
            body += '</div>';

            var footer = '<div class="prop-picker-footer">';
            footer += '<button class="lwe-btn lwe-btn-sm" id="prop-picker-add"><i class="fas fa-plus"></i> Add</button>';
            footer += '<span style="flex:1"></span>';
            footer += '<span class="prop-picker-count" id="prop-picker-count">0 properties</span>';
            footer += '<button class="lwe-btn" id="prop-picker-cancel">Cancel</button>';
            footer += '<button class="lwe-btn lwe-btn-accent" id="prop-picker-ok">OK</button>';
            footer += '</div>';

            modal.innerHTML = header + body + footer;
            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            function renderList() {
                var list = document.getElementById('prop-picker-list');
                if (!list) return;
                list.innerHTML = '';
                if (working.length === 0) {
                    list.innerHTML = '<div class="prop-picker-empty">No properties defined. Click <strong>Add</strong> to create one.</div>';
                }
                for (var j = 0; j < working.length; j++) {
                    (function (idx) {
                        var row = document.createElement('div');
                        row.className = 'prop-picker-row';

                        var nameInp = document.createElement('input');
                        nameInp.type = 'text';
                        nameInp.className = 'lwe-input';
                        nameInp.placeholder = 'Name';
                        nameInp.value = working[idx].name;
                        nameInp.addEventListener('input', function () {
                            working[idx].name = nameInp.value;
                        });

                        var valInp = document.createElement('input');
                        valInp.type = 'text';
                        valInp.className = 'lwe-input';
                        valInp.placeholder = 'Value';
                        valInp.value = working[idx].value;
                        valInp.addEventListener('input', function () {
                            working[idx].value = valInp.value;
                        });

                        var delBtn = document.createElement('button');
                        delBtn.className = 'lwe-btn lwe-btn-sm lwe-btn-danger';
                        delBtn.innerHTML = '<i class="fas fa-times"></i>';
                        delBtn.title = 'Remove property';
                        delBtn.addEventListener('click', function () {
                            working.splice(idx, 1);
                            renderList();
                            updateCnt();
                        });

                        row.appendChild(nameInp);
                        row.appendChild(valInp);
                        row.appendChild(delBtn);
                        list.appendChild(row);
                    })(j);
                }
            }

            function updateCnt() {
                var cnt = document.getElementById('prop-picker-count');
                if (cnt) cnt.textContent = working.length + ' propert' + (working.length === 1 ? 'y' : 'ies');
            }

            renderList();
            updateCnt();

            // Add button
            document.getElementById('prop-picker-add').addEventListener('click', function () {
                working.push({ name: '', value: '' });
                renderList();
                updateCnt();
                // Focus the new name input
                var list = document.getElementById('prop-picker-list');
                var inputs = list.querySelectorAll('input[placeholder="Name"]');
                if (inputs.length) inputs[inputs.length - 1].focus();
            });

            // OK
            document.getElementById('prop-picker-ok').addEventListener('click', function () {
                document.body.removeChild(overlay);
                resolve(working);
            });

            // Cancel
            document.getElementById('prop-picker-cancel').addEventListener('click', function () {
                document.body.removeChild(overlay);
                resolve(null);
            });

            // Close X
            overlay.querySelector('.prop-picker-close').addEventListener('click', function () {
                document.body.removeChild(overlay);
                resolve(null);
            });

            // Backdrop click
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    document.body.removeChild(overlay);
                    resolve(null);
                }
            });
        });
    }

    // ================================================================
    //  Wire inline labware assignment file inputs
    // ================================================================
    function wireLabwareAssignment() {
        var rackInput = $('#mfx-lw-rack-input');
        var ctrInput  = $('#mfx-lw-ctr-input');

        if (rackInput) {
            rackInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                var slotId = mfxState._pendingLabwareSlot;
                if (slotId == null) return;
                var reader = new FileReader();
                reader.onload = function () {
                    if (!mfxState.slotLabware[slotId]) {
                        mfxState.slotLabware[slotId] = {};
                    }
                    mfxState.slotLabware[slotId].rackText = reader.result;
                    mfxState.slotLabware[slotId].rackFileName = file.name;
                    mfxState._pendingLabwareSlot = null;
                    mfxState._pendingLabwareType = null;
                    updateSlotList();
                    setMFXStatus('Loaded rack: ' + file.name);
                };
                reader.readAsText(file);
                rackInput.value = '';
            });
        }
        if (ctrInput) {
            ctrInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;
                var slotId = mfxState._pendingLabwareSlot;
                if (slotId == null) return;
                var reader = new FileReader();
                reader.onload = function () {
                    if (!mfxState.slotLabware[slotId]) {
                        mfxState.slotLabware[slotId] = {};
                    }
                    mfxState.slotLabware[slotId].ctrText = reader.result;
                    mfxState.slotLabware[slotId].ctrFileName = file.name;
                    mfxState._pendingLabwareSlot = null;
                    mfxState._pendingLabwareType = null;
                    updateSlotList();
                    setMFXStatus('Loaded container: ' + file.name);
                };
                reader.readAsText(file);
                ctrInput.value = '';
            });
        }
    }

    // ================================================================
    //  Populate carrier metadata from current carrier definition
    // ================================================================
    function initCarrierMetaFromDef() {
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        if (!def) return;

        var meta = mfxState.carrierMeta;
        if (!meta.viewName) meta.viewName = def.key;
        if (!meta.description) meta.description = def.description || '';

        // Sync form fields
        var nameEl = $('#mfx-car-name');
        var descEl = $('#mfx-car-desc');
        var bcEl   = $('#mfx-car-barcode');
        var bcuEl  = $('#mfx-car-bc-unique');
        var catEl  = $('#mfx-car-categories');

        if (nameEl) nameEl.value = meta.viewName;
        if (descEl) descEl.value = meta.description;
        if (bcEl)   bcEl.value   = meta.barcodeMask;
        if (bcuEl)  bcuEl.checked = meta.barcodeUnique;
        if (catEl)  catEl.value  = meta.categories.join(', ');

        updatePropertiesSummary();
    }

    // ================================================================
    //  Export .tml file (Hamilton HxCfgFile v3 TEMPLATE format)
    // ================================================================
    function _round3(v) {
        return (Math.round(parseFloat(v) * 1000) / 1000).toString();
    }

    function exportMfxTml() {
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        if (!def) { setMFXStatus('No carrier selected.'); return null; }

        var meta = mfxState.carrierMeta;
        var lines = [];
        lines.push('HxCfgFile,3;');
        lines.push('');
        lines.push('ConfigIsValid,Y;');
        lines.push('');
        lines.push('DataDef,TEMPLATE,1,default,');
        lines.push('{');

        function w(key, val) { lines.push(key + ', "' + val + '",'); }

        w('BackgrndClr', '16777215');
        w('Barcode.Value', meta.barcodeMask || '');
        w('Bitmap', '');
        w('CategoryCnt', String(meta.categories.length));
        for (var i = 0; i < meta.categories.length; i++) {
            w('Category.' + i + '.Id', meta.categories[i]);
        }
        w('Description', meta.description || '');
        w('Dim.Dx', _round3(def.dx));
        w('Dim.Dy', _round3(def.dy));
        w('Dim.Dz', _round3(def.dz));
        w('PropertyCnt', String(meta.properties.length));
        for (var i = 0; i < meta.properties.length; i++) {
            w('Property.' + (i + 1), meta.properties[i].name);
            w('PropertyValue.' + (i + 1), meta.properties[i].value);
        }
        w('ReadOnly', '0');

        // Build sites from carrier slots + placed modules
        var siteIdx = 0;
        def.slots.forEach(function (slot) {
            var entry = mfxState.slotState[slot.id];
            var moduleKey = entry ? entry.moduleKey : null;
            var moduleDef = moduleKey ? _moduleByKey[moduleKey] : null;
            siteIdx++;
            var siteDx = moduleDef ? (moduleDef.siteDx || slot.dx) : slot.dx;
            var siteDy = moduleDef ? (moduleDef.siteDy || slot.dy) : slot.dy;
            var lw = mfxState.slotLabware[slot.id];
            var labwareFile = (lw && lw.rackFileName) ? lw.rackFileName : '';

            w('Site.' + siteIdx + '.Dx', _round3(siteDx));
            w('Site.' + siteIdx + '.Dy', _round3(siteDy));
            w('Site.' + siteIdx + '.Id', String(slot.id));
            w('Site.' + siteIdx + '.IsCovered', '0');
            w('Site.' + siteIdx + '.Label', slot.label || String(siteIdx));
            w('Site.' + siteIdx + '.LabwareFile', labwareFile);
            w('Site.' + siteIdx + '.SnapBase', '0');
            w('Site.' + siteIdx + '.Stack', '0');
            w('Site.' + siteIdx + '.StackSize', '0');
            w('Site.' + siteIdx + '.Visible', '1');
            w('Site.' + siteIdx + '.X', _round3(slot.x));
            w('Site.' + siteIdx + '.Y', _round3(slot.y));
            w('Site.' + siteIdx + '.Z', _round3(slot.z));
        });
        w('Site.Cnt', String(siteIdx));
        w('UseBndry', '0');
        w('ViewName', meta.viewName || def.key);
        w('Visible', '0');
        if (def.modelFile) w('3DModel', def.modelFile);
        lines.push('};');
        lines.push('');

        var now = new Date();
        var time = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        lines.push('* $$author=MFXCarrierCreator$$valid=1$$time=' + time + '$$checksum=00000000$$length=000$$');

        var text = lines.join('\r\n') + '\r\n';
        var fileName = (meta.viewName || def.key) + '.tml';

        var blob = new Blob([text], { type: 'text/plain' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        setMFXStatus('Exported ' + fileName);
        return text;
    }

    // ================================================================
    //  Export full package as .zip (TML + RCK + CTR files)
    //  Uses pako for deflation — builds a minimal ZIP manually
    // ================================================================
    function exportMfxPackageZip() {
        var tmlText = exportMfxTml();
        if (!tmlText) return;

        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        var meta = mfxState.carrierMeta;
        var baseName = meta.viewName || def.key;

        // Collect files for the zip
        var files = [];
        files.push({ name: baseName + '.tml', data: _strToU8(tmlText) });

        // Add labware files from slot assignments
        var addedFiles = {};
        def.slots.forEach(function (slot) {
            var lw = mfxState.slotLabware[slot.id];
            if (!lw) return;
            if (lw.rackText && lw.rackFileName && !addedFiles[lw.rackFileName]) {
                files.push({ name: lw.rackFileName, data: _strToU8(lw.rackText) });
                addedFiles[lw.rackFileName] = true;
            }
            if (lw.ctrText && lw.ctrFileName && !addedFiles[lw.ctrFileName]) {
                files.push({ name: lw.ctrFileName, data: _strToU8(lw.ctrText) });
                addedFiles[lw.ctrFileName] = true;
            }
        });

        // Build ZIP
        var zipData = _buildZip(files);
        var blob = new Blob([zipData], { type: 'application/zip' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = baseName + '_package.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        setMFXStatus('Exported package: ' + baseName + '_package.zip');
    }

    // ── Minimal ZIP builder (uses pako for DEFLATE) ────────────────
    function _strToU8(str) {
        var enc = new TextEncoder();
        return enc.encode(str);
    }

    function _buildZip(files) {
        var localHeaders = [];
        var centralHeaders = [];
        var offset = 0;

        files.forEach(function (f) {
            var nameBytes = _strToU8(f.name);
            var compressed = (typeof pako !== 'undefined')
                ? pako.deflateRaw(f.data)
                : f.data; // fallback: store if no pako
            var method = (typeof pako !== 'undefined') ? 8 : 0;
            var crc = _crc32(f.data);

            // Local file header (30 + name + compressed data)
            var local = new Uint8Array(30 + nameBytes.length + compressed.length);
            var dv = new DataView(local.buffer);
            dv.setUint32(0,  0x04034b50, true);   // signature
            dv.setUint16(4,  20, true);            // version needed
            dv.setUint16(6,  0, true);             // flags
            dv.setUint16(8,  method, true);        // compression
            dv.setUint16(10, 0, true);             // mod time
            dv.setUint16(12, 0, true);             // mod date
            dv.setUint32(14, crc, true);           // crc32
            dv.setUint32(18, compressed.length, true); // compressed size
            dv.setUint32(22, f.data.length, true);     // uncompressed size
            dv.setUint16(26, nameBytes.length, true);  // name length
            dv.setUint16(28, 0, true);             // extra length
            local.set(nameBytes, 30);
            local.set(compressed, 30 + nameBytes.length);
            localHeaders.push(local);

            // Central directory header (46 + name)
            var central = new Uint8Array(46 + nameBytes.length);
            var cdv = new DataView(central.buffer);
            cdv.setUint32(0,  0x02014b50, true);   // signature
            cdv.setUint16(4,  20, true);            // version made by
            cdv.setUint16(6,  20, true);            // version needed
            cdv.setUint16(8,  0, true);             // flags
            cdv.setUint16(10, method, true);        // compression
            cdv.setUint16(12, 0, true);             // mod time
            cdv.setUint16(14, 0, true);             // mod date
            cdv.setUint32(16, crc, true);           // crc32
            cdv.setUint32(20, compressed.length, true);
            cdv.setUint32(24, f.data.length, true);
            cdv.setUint16(28, nameBytes.length, true);
            cdv.setUint16(30, 0, true);             // extra length
            cdv.setUint16(32, 0, true);             // comment length
            cdv.setUint16(34, 0, true);             // disk number
            cdv.setUint16(36, 0, true);             // internal attr
            cdv.setUint32(38, 0, true);             // external attr
            cdv.setUint32(42, offset, true);        // local header offset
            central.set(nameBytes, 46);
            centralHeaders.push(central);

            offset += local.length;
        });

        // End of central directory
        var cdOffset = offset;
        var cdSize = 0;
        centralHeaders.forEach(function (c) { cdSize += c.length; });

        var eocd = new Uint8Array(22);
        var edv = new DataView(eocd.buffer);
        edv.setUint32(0,  0x06054b50, true);       // signature
        edv.setUint16(4,  0, true);                 // disk number
        edv.setUint16(6,  0, true);                 // cd disk
        edv.setUint16(8,  files.length, true);      // entries on disk
        edv.setUint16(10, files.length, true);      // total entries
        edv.setUint32(12, cdSize, true);            // cd size
        edv.setUint32(16, cdOffset, true);          // cd offset
        edv.setUint16(20, 0, true);                 // comment length

        // Combine
        var total = offset + cdSize + 22;
        var result = new Uint8Array(total);
        var pos = 0;
        localHeaders.forEach(function (l) { result.set(l, pos); pos += l.length; });
        centralHeaders.forEach(function (c) { result.set(c, pos); pos += c.length; });
        result.set(eocd, pos);
        return result;
    }

    function _crc32(data) {
        var table = _crc32.table;
        if (!table) {
            table = new Uint32Array(256);
            for (var n = 0; n < 256; n++) {
                var c = n;
                for (var k = 0; k < 8; k++) {
                    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
                }
                table[n] = c;
            }
            _crc32.table = table;
        }
        var crc = 0xFFFFFFFF;
        for (var i = 0; i < data.length; i++) {
            crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

}());
