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
    };

    const LIGHT_BG = 0xf0f0f0;
    const DARK_BG  = 0x1b2838;

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
        populateCarrierSelector();
        populateModuleCatalog();
        makeModuleCardsDraggable();
        updateSlotList();

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

            // Store original 3D position so we can snap back
            if (entry.moduleMesh) {
                mfxState._dragOrigPos = entry.moduleMesh.position.clone();
            }
            // Create a horizontal plane at nesting height for projection
            mfxState._dragPlane = new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                -getNestingY()
            );
        });

        // --- MOUSEMOVE: update drag state + highlight target slot ---
        canvas.addEventListener('mousemove', function (e) {
            // Show pointer cursor + green glow on hover over modules
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
                // Show trash drop zone
                showMFXTrashZone(true);
                // Show floating drag label
                showMFXDragLabel(true, mfxState._canvasDragSourceSlot);
            }

            // --- Move the module mesh to follow the cursor ---
            var srcEntry = mfxState.slotState[mfxState._canvasDragSourceSlot];
            if (srcEntry && srcEntry.moduleMesh && mfxState._dragPlane) {
                var rect2 = canvas.getBoundingClientRect();
                var ndcX =  ((e.clientX - rect2.left)  / rect2.width)  * 2 - 1;
                var ndcY = -((e.clientY - rect2.top) / rect2.height) * 2 + 1;
                mfxState._raycaster.setFromCamera({ x: ndcX, y: ndcY }, mfxState.camera);
                var hitPt = new THREE.Vector3();
                if (mfxState._raycaster.ray.intersectPlane(mfxState._dragPlane, hitPt)) {
                    // Offset so the mesh center tracks to the hit point
                    var box = new THREE.Box3().setFromObject(srcEntry.moduleMesh);
                    var center = box.getCenter(new THREE.Vector3());
                    srcEntry.moduleMesh.position.x += hitPt.x - center.x;
                    srcEntry.moduleMesh.position.z += hitPt.z - center.z;
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
            // Check if hovering over trash zone
            updateMFXTrashHover(e);
        });

        // --- MOUSEUP: complete the reorder drag ---
        canvas.addEventListener('mouseup', function (e) {
            if (mfxState._canvasDragSourceSlot === null) return;
            var sourceSlotId = mfxState._canvasDragSourceSlot;
            var wasDragging = mfxState._canvasDragging;

            // Clean up state
            var origPos = mfxState._dragOrigPos;
            mfxState._canvasDragSourceSlot = null;
            mfxState._canvasDragging = false;
            mfxState._canvasDragStartPos = null;
            mfxState._hoveredModuleSlot = null;
            mfxState._dragOrigPos = null;
            mfxState._dragPlane = null;
            canvas.style.cursor = 'default';
            clearAllModuleGlows();
            clearCanvasReorderHighlights();
            showMFXTrashZone(false);
            showMFXDragLabel(false);

            if (!wasDragging) return;

            // Check if dropped on trash zone
            if (isMFXTrashHit(e)) {
                removeModuleMeshFromSlot(sourceSlotId);
                setSlotHighlight(sourceSlotId, mfxState.selectedSlotId === sourceSlotId);
                updateSlotList();
                setMFXStatus('Removed module from slot');
                return;
            }

            var targetSlot = pickSlotAt(e);
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
        });

        // If mouse leaves canvas during drag, cancel
        canvas.addEventListener('mouseleave', function () {
            if (mfxState._canvasDragSourceSlot !== null) {
                var src = mfxState._canvasDragSourceSlot;
                // Snap module back to original position
                var srcE3 = mfxState.slotState[src];
                if (srcE3 && srcE3.moduleMesh && mfxState._dragOrigPos) {
                    srcE3.moduleMesh.position.copy(mfxState._dragOrigPos);
                }
                mfxState._canvasDragSourceSlot = null;
                mfxState._canvasDragging = false;
                mfxState._canvasDragStartPos = null;
                mfxState._hoveredModuleSlot = null;
                mfxState._dragOrigPos = null;
                mfxState._dragPlane = null;
                canvas.style.cursor = 'default';
                clearAllModuleGlows();
                clearCanvasReorderHighlights();
                showMFXTrashZone(false);
                showMFXDragLabel(false);
                setSlotHighlight(src, mfxState.selectedSlotId === src);
            }
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

        // Right panel toggle
        var rightToggle = $('#mfx-right-toggle');
        var rightPanel  = $('#mfx-right-panel');
        if (rightToggle && rightPanel && host) {
            rightToggle.addEventListener('click', function () {
                var collapsed = rightPanel.classList.toggle('is-collapsed');
                host.classList.toggle('vl-right-collapsed', collapsed);
                var icon = document.querySelector('#mfx-right-toggle-icon');
                if (icon) icon.className = collapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            });
        }
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
            if (moduleDef.previewImg) {
                var img = document.createElement('img');
                img.src = moduleDef.previewImg;
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
        var container = $('#mfx-slot-list');
        if (!container) return;
        var def = MFX_CARRIER_DEFS[mfxState.carrierKey];
        if (!def) return;

        container.innerHTML = '';

        def.slots.forEach(function (slot) {
            var entry = mfxState.slotState[slot.id];
            if (!entry) return;
            var moduleKey = entry.moduleKey;
            var moduleDef = moduleKey ? _moduleByKey[moduleKey] : null;
            var isSelected = mfxState.selectedSlotId === slot.id;

            var row = document.createElement('div');
            row.className = 'mfx-slot-row' + (isSelected ? ' is-selected' : '') + (moduleKey ? ' is-occupied' : '');
            row.dataset.slotId = slot.id;

            // Drag handle for reorder mode
            if (mfxState.isReorderMode && moduleKey) {
                row.setAttribute('draggable', 'true');
                row.classList.add('mfx-reorderable');

                var dragHandle = document.createElement('div');
                dragHandle.className = 'mfx-slot-drag-handle';
                dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
                dragHandle.title = 'Drag to reorder';
                row.appendChild(dragHandle);

                row.addEventListener('dragstart', function (e) {
                    mfxState._reorderDragSlotId = slot.id;
                    e.dataTransfer.setData('application/mfx-reorder', String(slot.id));
                    e.dataTransfer.effectAllowed = 'move';
                    row.classList.add('mfx-slot-dragging');
                });
                row.addEventListener('dragend', function () {
                    mfxState._reorderDragSlotId = null;
                    row.classList.remove('mfx-slot-dragging');
                    // Remove all drop targets
                    container.querySelectorAll('.mfx-slot-drop-target').forEach(function (r) {
                        r.classList.remove('mfx-slot-drop-target');
                    });
                });
                row.addEventListener('dragover', function (e) {
                    // Only accept reorder drags (not catalog drags)
                    if (mfxState._reorderDragSlotId === null) return;
                    if (mfxState._reorderDragSlotId === slot.id) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    // Highlight drop target
                    container.querySelectorAll('.mfx-slot-drop-target').forEach(function (r) {
                        r.classList.remove('mfx-slot-drop-target');
                    });
                    row.classList.add('mfx-slot-drop-target');
                });
                row.addEventListener('dragleave', function () {
                    row.classList.remove('mfx-slot-drop-target');
                });
                row.addEventListener('drop', function (e) {
                    e.preventDefault();
                    row.classList.remove('mfx-slot-drop-target');
                    var sourceSlotId = mfxState._reorderDragSlotId;
                    if (sourceSlotId === null || sourceSlotId === slot.id) return;
                    swapModulesBetweenSlots(sourceSlotId, slot.id);
                    mfxState._reorderDragSlotId = null;
                });
            } else if (mfxState.isReorderMode) {
                // Empty slots can be drop targets in reorder mode
                row.addEventListener('dragover', function (e) {
                    if (mfxState._reorderDragSlotId === null) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    container.querySelectorAll('.mfx-slot-drop-target').forEach(function (r) {
                        r.classList.remove('mfx-slot-drop-target');
                    });
                    row.classList.add('mfx-slot-drop-target');
                });
                row.addEventListener('dragleave', function () {
                    row.classList.remove('mfx-slot-drop-target');
                });
                row.addEventListener('drop', function (e) {
                    e.preventDefault();
                    row.classList.remove('mfx-slot-drop-target');
                    var sourceSlotId = mfxState._reorderDragSlotId;
                    if (sourceSlotId === null || sourceSlotId === slot.id) return;
                    swapModulesBetweenSlots(sourceSlotId, slot.id);
                    mfxState._reorderDragSlotId = null;
                });
            }

            // Check if this slot is blocked by an oversized neighbour
            var blockedByLabel = _blockedBy(mfxState.carrierKey, slot.id, mfxState.slotState);
            if (blockedByLabel && !moduleKey) {
                row.classList.add('is-blocked');
            }

            var slotLabel = document.createElement('div');
            slotLabel.className = 'mfx-slot-label';
            slotLabel.textContent = slot.label;

            // Show allowed types as a subtle hint
            var allowed = _allowedTypes(mfxState.carrierKey, slot.id);
            var typeHint = null;
            if (allowed) {
                typeHint = document.createElement('div');
                typeHint.className = 'mfx-slot-type-hint';
                typeHint.textContent = allowed.join(', ');
                typeHint.title = 'Allowed pedestal types for this position';
            }

            var moduleInfo = document.createElement('div');
            moduleInfo.className = 'mfx-slot-module';
            if (blockedByLabel && !moduleKey) {
                moduleInfo.innerHTML = '<span class="mfx-slot-blocked"><i class="fas fa-ban"></i> Blocked by ' + blockedByLabel + '</span>';
            } else if (moduleDef) {
                moduleInfo.textContent = moduleDef.label;
            } else {
                moduleInfo.innerHTML = '<span class="mfx-slot-empty">\u2014 empty \u2014</span>';
            }

            var actions = document.createElement('div');
            actions.className = 'mfx-slot-actions';

            if (moduleKey) {
                var removeBtn = document.createElement('button');
                removeBtn.className = 'mfx-slot-remove';
                removeBtn.title = 'Remove module';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    removeModuleMeshFromSlot(slot.id);
                    if (mfxState.selectedSlotId === slot.id) {
                        setSlotHighlight(slot.id, true);
                    } else {
                        setSlotHighlight(slot.id, false);
                    }
                    updateSlotList();
                    setMFXStatus('Removed module from ' + slot.label);
                });
                actions.appendChild(removeBtn);
            } else {
                var placeBtn = document.createElement('button');
                placeBtn.className = 'mfx-slot-place';
                placeBtn.title = 'Select slot';
                placeBtn.innerHTML = '<i class="fas fa-plus"></i>';
                placeBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    selectSlot(slot.id);
                });
                actions.appendChild(placeBtn);
            }

            row.appendChild(slotLabel);
            if (typeHint) row.appendChild(typeHint);
            row.appendChild(moduleInfo);
            row.appendChild(actions);

            row.addEventListener('click', function () {
                selectSlot(slot.id);
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

        // Make module cards draggable
        document.addEventListener('dragstart', function (e) {
            var card = e.target.closest && e.target.closest('.mfx-module-card');
            if (!card) return;
            var key = card.dataset.moduleKey;
            if (!key) return;
            e.dataTransfer.setData('text/plain', key);
            e.dataTransfer.effectAllowed = 'copy';
            mfxState._dragModuleKey = key;
            if (ghost) {
                var mod = _moduleByKey[key];
                var label = ghost.querySelector('#mfx-drag-ghost-label');
                if (label) label.textContent = mod ? mod.label : key;
                ghost.style.display = '';
                e.dataTransfer.setDragImage(ghost, 16, 16);
                setTimeout(function () { ghost.style.display = 'none'; }, 0);
            }
        });

        // Allow drop on canvas
        canvas.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            // Highlight hovered slot
            highlightSlotUnderMouse(e);
        });

        canvas.addEventListener('dragleave', function () {
            clearDragHighlights();
            mfxState._dragModuleKey = null;
        });

        canvas.addEventListener('drop', function (e) {
            e.preventDefault();
            var moduleKey = e.dataTransfer.getData('text/plain');
            mfxState._dragModuleKey = null;
            if (!moduleKey || !_moduleByKey[moduleKey]) return;

            var slotId = getSlotIdUnderMouse(e);
            if (slotId !== null) {
                placeModuleInSlot(slotId, moduleKey);
                setMFXStatus('Dropped ' + (_moduleByKey[moduleKey] || {}).label + ' at slot ' + slotId);
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

}());
