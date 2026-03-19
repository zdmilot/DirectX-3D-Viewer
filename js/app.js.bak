/* ============================================================
   Serial Dilution Calculator - Application Logic
   ============================================================ */

(function () {
    'use strict';

    // ── Color Schemes ──────────────────────────────────────────
    const COLOR_SCHEMES = {
        ocean:  { start: [0, 51, 102],    end: [0, 188, 215],   name: 'Ocean' },
        sunset: { start: [255, 86, 8],    end: [254, 239, 26],  name: 'Sunset' },
        berry:  { start: [157, 29, 178],  end: [236, 21, 98],   name: 'Berry' },
        forest: { start: [0, 151, 136],   end: [136, 197, 67],  name: 'Forest' },
        mono:   { start: [74, 74, 74],    end: [158, 158, 158], name: 'Monochrome' },
        plasma: { start: [104, 52, 188],  end: [0, 167, 246],   name: 'Plasma' },
    };

    // ── Concentration Unit Groups ──────────────────────────────
    const UNIT_GROUPS = [
        { units: ['M', 'mM', 'µM', 'nM'], toBase: { 'M': 1, 'mM': 1e-3, 'µM': 1e-6, 'nM': 1e-9 } },
        { units: ['mg/mL', 'µg/mL', 'ng/mL'], toBase: { 'mg/mL': 1, 'µg/mL': 1e-3, 'ng/mL': 1e-6 } },
        { units: ['%'], toBase: { '%': 1 } },
        { units: ['X'], toBase: { 'X': 1 } },
    ];

    const LIQUID_TYPE_OPTIONS = [
        'Water',
        'Glycerin',
        'DMSO',
    ];

    const LIQUID_TYPE_LABELS = {
    };

    // ── Tip Database (from TipDatabase.csv) ─────────────────
    // Unique nominal sizes sorted ascending, with their barcode label colors.
    // Volumes in µL. We pick the smallest tip that can hold the volume.
    const TIP_SIZES = [
        { nominal: 10,   color: '#F5A623', label: 'Orange' },      // Orange
        { nominal: 50,   color: '#E06070', label: 'Light Red' },   // Light Red
        { nominal: 300,  color: '#F5D547', label: 'Yellow' },      // Yellow
        { nominal: 1000, color: '#CCCCCC', label: 'White' },       // White
        { nominal: 5000, color: '#6BBF6B', label: 'Green' },       // Green
    ];

    // Derived colors for each tip class: soft cell background tint + icon fill + tooltip accent
    const TIP_STYLE = {
        'Orange':    { bg: 'rgba(245,166,35,0.15)',  icon: '#c8862a', accent: '#d4920f' },
        'Light Red': { bg: 'rgba(224,96,112,0.13)',  icon: '#c45568', accent: '#c94058' },
        'Yellow':    { bg: 'rgba(245,213,71,0.14)',  icon: '#bfa42e', accent: '#c4a81a' },
        'White':     { bg: 'rgba(180,180,180,0.14)', icon: '#888888', accent: '#777'    },
        'Green':     { bg: 'rgba(107,191,107,0.13)', icon: '#4a9e4e', accent: '#3a8c3f' },
    };

    /**
     * Given a volume in µL, return the matching tip object
     * (smallest tip whose nominal size >= volume).
     * Returns null if the volume exceeds all tip sizes.
     */
    function getTipForVolume(volUL) {
        if (volUL <= 0) return null;
        for (const tip of TIP_SIZES) {
            if (volUL <= tip.nominal) return tip;
        }
        return null; // exceeds largest tip
    }

    /** Look up a tip by its nominal size */
    function getTipByNominal(nominal) {
        return TIP_SIZES.find(t => t.nominal === nominal) || null;
    }

    /**
     * Return the effective tip for a tube/channel.
     * If an override is set, use it; otherwise auto-select.
     */
    function getEffectiveTipInfo(volUL, overrideNominal) {
        if (overrideNominal != null) {
            const tip = getTipByNominal(overrideNominal);
            if (!tip) return { tip: getTipForVolume(volUL), cycles: 1, perCycleVol: volUL };
            const cycles = Math.ceil(volUL / tip.nominal);
            const perCycleVol = volUL / cycles;
            return { tip, cycles, perCycleVol };
        }
        const tip = getTipForVolume(volUL);
        return { tip, cycles: 1, perCycleVol: volUL };
    }

    /** Ensure per-tube tip override arrays exist */
    function ensureTipOverrides() {
        if (!state.perTubeTransferTip) state.perTubeTransferTip = [];
        if (!state.perTubeDiluentTip) state.perTubeDiluentTip = [];
    }

    /** Return inline style string for the volume <td> background tint */
    function tipCellStyle(volUL, overrideNominal) {
        const info = getEffectiveTipInfo(volUL, overrideNominal);
        if (!info.tip) return '';
        const s = TIP_STYLE[info.tip.label];
        return s ? ` style="background:${s.bg}"` : '';
    }

    /**
     * Produce the tip cell contents: SVG icon with dropdown caret.
     * The dropdown lets users override the tip selection.
     * dataType = 'transfer' | 'diluent', dataIndex = tube index (int).
     */
    function tipIndicatorSVG(volUL, overrideNominal, dataType, dataIndex) {
        const info = getEffectiveTipInfo(volUL, overrideNominal);
        if (!info.tip) return '';
        const s = TIP_STYLE[info.tip.label] || { icon: '#888', accent: '#777' };
        const isOverride = overrideNominal != null;
        const overrideAttr = isOverride ? ' data-override="true"' : '';

        // Build dropdown options
        let opts = '';
        for (const t of TIP_SIZES) {
            const sel = t.nominal === info.tip.nominal ? ' selected' : '';
            opts += `<option value="${t.nominal}"${sel}>${t.nominal} µL – ${t.label}</option>`;
        }
        opts += `<option value="auto"${!isOverride ? ' selected' : ''}>Auto</option>`;

        return `<span class="tip-icon-wrap${isOverride ? ' tip-override' : ''}" data-tip-type="${dataType}" data-tip-index="${dataIndex}"${overrideAttr}>`
            + `<svg class="tip-icon" viewBox="0 0 10 44" xmlns="http://www.w3.org/2000/svg">`
            + `<rect x="0" y="0" width="10" height="11" rx="1.5" fill="${s.icon}"/>`
            + `<path d="M2.5,11 L2.5,35 Q2.5,40 5,44 Q7.5,40 7.5,35 L7.5,11 Z" fill="${s.icon}"/>`
            + `</svg>`
            + `<span class="tip-tooltip" style="border-color:${s.accent}">`
            + `<strong>${info.tip.nominal} µL</strong> tip`
            + (info.cycles > 1 ? `<br>${info.cycles} cycles × ${formatValue(info.perCycleVol)} ${state.volumeUnit}` : '')
            + `<br><span class="tip-tooltip-label" style="color:${s.accent}">● ${info.tip.label}</span> barcode class`
            + `<span class="tip-tooltip-arrow" style="border-top-color:${s.accent}"></span>`
            + `</span>`
            + `</span>`
            + `<span class="tip-caret" style="color:${s.icon}">&#9662;</span>`
            + `<select class="tip-select" data-tip-type="${dataType}" data-tip-index="${dataIndex}">${opts}</select>`;
    }

    // ── Labware Catalog ───────────────────────────────────────
    // Flat catalog of all selectable labware. Each entry has a unique id,
    // type (plate/tube/trough), size grouping key, holder info, and specs.
    // The modal wizard filters progressively: Type → Size → Holder → Definition → Position.
    // This array is mutable — it gets rebuilt when the user refreshes from the labware directory.
    let LABWARE_CATALOG = [
        // ── Plates: 6-Well ──────────────────────
        { id: 'cor_6_fl',   type: 'plate', size: '6',   sizeLabel: '6-Well',   holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 6-Well Flat Bottom',   rows: 2,  cols: 3,  maxVolumeUl: 16800, spec: 'Standard' },
        // ── Plates: 12-Well ─────────────────────
        { id: 'cor_12_fl',  type: 'plate', size: '12',  sizeLabel: '12-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 12-Well Flat Bottom',  rows: 3,  cols: 4,  maxVolumeUl: 6900,  spec: 'Standard' },
        // ── Plates: 24-Well ─────────────────────
        { id: 'cor_24_fl',  type: 'plate', size: '24',  sizeLabel: '24-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 24-Well Flat Bottom',  rows: 4,  cols: 6,  maxVolumeUl: 3400,  spec: 'Standard' },
        { id: 'gre_24_fl',  type: 'plate', size: '24',  sizeLabel: '24-Well',  holderFormat: 'sbs', manufacturer: 'Greiner',        label: 'Greiner 24-Well Flat Bottom',  rows: 4,  cols: 6,  maxVolumeUl: 3400,  spec: 'Standard' },
        // ── Plates: 48-Well ─────────────────────
        { id: 'cor_48_fl',  type: 'plate', size: '48',  sizeLabel: '48-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 48-Well Flat Bottom',  rows: 6,  cols: 8,  maxVolumeUl: 1600,  spec: 'Standard' },
        // ── Plates: 96-Well ─────────────────────
        { id: 'ham_96_fl',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Hamilton',       label: 'Hamilton 96 Flat Bottom',      rows: 8,  cols: 12, maxVolumeUl: 360,   spec: 'Standard' },
        { id: 'ham_96_dw',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Hamilton',       label: 'Hamilton 96 Deep Well',        rows: 8,  cols: 12, maxVolumeUl: 1000,  spec: 'Deep Well' },
        { id: 'cor_96_fl',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 96 Flat Bottom',       rows: 8,  cols: 12, maxVolumeUl: 360,   spec: 'Standard' },
        { id: 'cor_96_rd',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 96 Round Bottom',      rows: 8,  cols: 12, maxVolumeUl: 330,   spec: 'Round Bottom' },
        { id: 'cor_96_dw1', type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 96 Deep Well 1 mL',    rows: 8,  cols: 12, maxVolumeUl: 1000,  spec: 'Deep Well' },
        { id: 'cor_96_dw2', type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 96 Deep Well 2 mL',    rows: 8,  cols: 12, maxVolumeUl: 2000,  spec: 'Deep Well' },
        { id: 'gre_96_fl',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Greiner',        label: 'Greiner 96 Flat Bottom',       rows: 8,  cols: 12, maxVolumeUl: 340,   spec: 'Standard' },
        { id: 'gre_96_vb',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Greiner',        label: 'Greiner 96 V-Bottom',          rows: 8,  cols: 12, maxVolumeUl: 340,   spec: 'V-Bottom' },
        { id: 'gre_96_dw',  type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Greiner',        label: 'Greiner 96 Deep Well',         rows: 8,  cols: 12, maxVolumeUl: 1000,  spec: 'Deep Well' },
        { id: 'nunc_96_fl', type: 'plate', size: '96',  sizeLabel: '96-Well',  holderFormat: 'sbs', manufacturer: 'Nunc',           label: 'Nunc 96 Flat Bottom',          rows: 8,  cols: 12, maxVolumeUl: 360,   spec: 'Standard' },
        // ── Plates: 384-Well ────────────────────
        { id: 'ham_384',    type: 'plate', size: '384', sizeLabel: '384-Well', holderFormat: 'sbs', manufacturer: 'Hamilton',       label: 'Hamilton 384-Well',            rows: 16, cols: 24, maxVolumeUl: 80,    spec: 'Standard' },
        { id: 'cor_384_fl', type: 'plate', size: '384', sizeLabel: '384-Well', holderFormat: 'sbs', manufacturer: 'Corning-Costar', label: 'Corning 384 Flat Bottom',      rows: 16, cols: 24, maxVolumeUl: 112,   spec: 'Standard' },
        { id: 'gre_384',    type: 'plate', size: '384', sizeLabel: '384-Well', holderFormat: 'sbs', manufacturer: 'Greiner',        label: 'Greiner 384-Well',             rows: 16, cols: 24, maxVolumeUl: 112,   spec: 'Standard' },
        // ── Tubes: LVL 0.3 mL ───────────────────
        { id: 'lvl_300',  type: 'tube', size: '0.3 mL',  sizeLabel: '0.3 mL',  holderFormat: 'sbs',     holderLabel: 'LVL SBS Rack',         manufacturer: 'Hamilton', label: 'LVL 300 \u00B5L Tube',                  rows: 8,  cols: 12, maxVolumeUl: 300,   spec: 'LVL' },
        // ── Tubes: LVL 0.5 mL ───────────────────
        { id: 'lvl_500',  type: 'tube', size: '0.5 mL',  sizeLabel: '0.5 mL',  holderFormat: 'sbs',     holderLabel: 'LVL SBS Rack',         manufacturer: 'Hamilton', label: 'LVL 500 \u00B5L Tube',                  rows: 8,  cols: 12, maxVolumeUl: 500,   spec: 'LVL' },
        // ── Tubes: LVL 0.7 mL ───────────────────
        { id: 'lvl_700',  type: 'tube', size: '0.7 mL',  sizeLabel: '0.7 mL',  holderFormat: 'sbs',     holderLabel: 'LVL SBS Rack',         manufacturer: 'Hamilton', label: 'LVL 700 \u00B5L Tube',                  rows: 8,  cols: 12, maxVolumeUl: 700,   spec: 'LVL' },
        // ── Tubes: 1 mL ────────────────────────
        { id: 'tube_1ml_screw_sbs',     type: 'tube', size: '1 mL',   sizeLabel: '1 mL',   holderFormat: 'sbs',     holderLabel: 'SBS Tube Rack',        manufacturer: 'Hamilton', label: '1 mL Screw Cap (SBS Rack)',             rows: 8,  cols: 12, maxVolumeUl: 1000,  spec: 'Screw Cap' },
        { id: 'tube_1ml_screw_carrier', type: 'tube', size: '1 mL',   sizeLabel: '1 mL',   holderFormat: 'carrier', holderLabel: 'Sample Carrier 24',    manufacturer: 'Hamilton', label: '1 mL Screw Cap (Carrier)',              rows: 24, cols: 1,  maxVolumeUl: 1000,  spec: 'Screw Cap' },
        { id: 'tube_1ml_flip_sbs',      type: 'tube', size: '1 mL',   sizeLabel: '1 mL',   holderFormat: 'sbs',     holderLabel: 'SBS Cooling Block',    manufacturer: 'Hamilton', label: '1 mL Flip-Top (SBS Block)',             rows: 8,  cols: 12, maxVolumeUl: 1000,  spec: 'Flip-Top' },
        { id: 'tube_1ml_flip_carrier',  type: 'tube', size: '1 mL',   sizeLabel: '1 mL',   holderFormat: 'carrier', holderLabel: 'Sample Carrier 24',    manufacturer: 'Hamilton', label: '1 mL Flip-Top (Carrier)',               rows: 24, cols: 1,  maxVolumeUl: 1000,  spec: 'Flip-Top' },
        // ── Tubes: LVL 1.1 mL ───────────────────
        { id: 'lvl_1100', type: 'tube', size: '1.1 mL',  sizeLabel: '1.1 mL',  holderFormat: 'sbs',     holderLabel: 'LVL SBS Rack',         manufacturer: 'Hamilton', label: 'LVL 1100 \u00B5L Tube',                 rows: 8,  cols: 12, maxVolumeUl: 1100,  spec: 'LVL' },
        // ── Tubes: 1.5 mL ──────────────────────
        { id: 'tube_1.5ml_epp_sbs',     type: 'tube', size: '1.5 mL', sizeLabel: '1.5 mL', holderFormat: 'sbs',     holderLabel: 'SBS Tube Rack',        manufacturer: 'Hamilton', label: '1.5 mL Eppendorf (SBS Rack)',           rows: 8,  cols: 12, maxVolumeUl: 1500,  spec: 'Eppendorf' },
        { id: 'tube_1.5ml_epp_carrier', type: 'tube', size: '1.5 mL', sizeLabel: '1.5 mL', holderFormat: 'carrier', holderLabel: 'Sample Carrier 24',    manufacturer: 'Hamilton', label: '1.5 mL Eppendorf (Carrier)',            rows: 24, cols: 1,  maxVolumeUl: 1500,  spec: 'Eppendorf' },
        // ── Tubes: 2 mL ────────────────────────
        { id: 'tube_2ml_screw_sbs',     type: 'tube', size: '2 mL',   sizeLabel: '2 mL',   holderFormat: 'sbs',     holderLabel: 'SBS Tube Rack',        manufacturer: 'Hamilton', label: '2 mL Screw Cap (SBS Rack)',             rows: 8,  cols: 12, maxVolumeUl: 2000,  spec: 'Screw Cap' },
        { id: 'tube_2ml_screw_carrier', type: 'tube', size: '2 mL',   sizeLabel: '2 mL',   holderFormat: 'carrier', holderLabel: 'Sample Carrier 24',    manufacturer: 'Hamilton', label: '2 mL Screw Cap (Carrier)',              rows: 24, cols: 1,  maxVolumeUl: 2000,  spec: 'Screw Cap' },
        // ── Tubes: 15 mL ───────────────────────
        { id: 'tube_15ml_carrier',      type: 'tube', size: '15 mL',  sizeLabel: '15 mL',  holderFormat: 'carrier', holderLabel: 'Tube Carrier 15 mL',   manufacturer: 'Hamilton', label: '15 mL Conical Tube (Carrier)',           rows: 16, cols: 1,  maxVolumeUl: 15000, spec: 'Conical' },
        // ── Tubes: 50 mL ───────────────────────
        { id: 'tube_50ml_carrier',      type: 'tube', size: '50 mL',  sizeLabel: '50 mL',  holderFormat: 'carrier', holderLabel: 'Tube Carrier 50 mL',   manufacturer: 'Hamilton', label: '50 mL Conical Tube (Carrier)',           rows: 7,  cols: 1,  maxVolumeUl: 50000, spec: 'Conical' },
        // ── Troughs ─────────────────────────────
        { id: 'ham_rgt_trough',  type: 'trough', size: '300 mL', sizeLabel: '300 mL', holderFormat: 'sbs', manufacturer: 'Hamilton', label: 'Hamilton Deep Well Reagent Trough',   rows: 8,  cols: 1,  maxVolumeUl: 300000, spec: 'Deep Well' },
        { id: 'rgt_reservoir',   type: 'trough', size: '300 mL', sizeLabel: '300 mL', holderFormat: 'sbs', manufacturer: 'Hamilton', label: 'Single-Channel Reagent Reservoir',    rows: 1,  cols: 1,  maxVolumeUl: 300000, spec: 'Single Channel' },
    ];

    /** Default (hardcoded) catalog snapshot — used as fallback when scan fails */
    const DEFAULT_LABWARE_CATALOG = LABWARE_CATALOG.slice();

    // ── Labware Directory Scanner ─────────────────────────────
    // Scans the configured labware directory via HTTP, parses .rck/.ctr
    // files, and rebuilds LABWARE_CATALOG dynamically.

    /** Vendor folder name → clean manufacturer display name */
    const VENDOR_DISPLAY_NAMES = {
        'ansys': 'Ansys', 'corning-costar': 'Corning-Costar', 'dynex': 'Dynex',
        'falcon': 'Falcon', 'greiner': 'Greiner', 'hamilton': 'Hamilton',
        'ist': 'IST', 'kayco_dallas': 'Kayco Dallas', 'labsystems': 'Labsystems',
        'limbro': 'Limbro', 'macherey-nagel': 'Macherey-Nagel', 'matrix': 'Matrix',
        'mj_research': 'MJ Research', 'ml_star': 'Hamilton', 'nimbus': 'Hamilton',
        'nunc': 'Nunc', 'perkin-elmer': 'PerkinElmer', 'polyfiltronic': 'Polyfiltronic',
        'qiagen': 'Qiagen', 'rainin': 'Rainin',
    };

    /** Category IDs for classification */
    const CAT_TIPS  = new Set([165,170,172,173,20001,20005,20006,20008,20009,30003]);
    const CAT_WASTE = new Set([168,30016]);
    const CAT_TOOLS = new Set([169,136,20000,20003,176,20010,20011]);
    const CAT_WASH  = new Set([137,180,181,182,183,20002]);
    const CAT_CARRIER = new Set([142,144,145,146,147,148,149,150,151,152,153,184,20004,20007]);
    const CAT_TUBE_RACK = new Set([146,147,148,149,150,177,178]);
    const CAT_REAGENT = new Set([1008]);
    const CAT_PLATE = new Set([1000,1001,1002,1003,1004,1005,1006,1009,1010,1011,1012,
                               1015,1016,1019,1020,1021,1022,1023,1024,1025,1027,1028]);

    /** Container shape code → name */
    const CTR_SHAPES = { 0:'round', 1:'square', 3:'oval', 4:'sphere', 5:'conical' };

    /**
     * Parse Hamilton HxCfgFile content (.rck or .ctr) → flat key/value object.
     */
    function parseHxCfg(text) {
        const result = {};
        const m = text.match(/\{([\s\S]*?)\};/);
        if (!m) return result;
        const dd = text.match(/DataDef,(\w+)/);
        if (dd) result.__DataDef__ = dd[1];
        for (const line of m[1].split('\n')) {
            const trimmed = line.trim().replace(/,\s*$/, '');
            if (!trimmed || trimmed.startsWith('*')) continue;
            const idx = trimmed.indexOf(',');
            if (idx === -1) continue;
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
            result[key] = val;
        }
        return result;
    }

    /** Safely evaluate a Hamilton volume equation */
    function evalVolumeEqn(eqn, h) {
        if (!eqn || h <= 0) return 0;
        const s = eqn.replace(/\s/g, '');
        if (!/^[h0-9.+\-*/()]+$/.test(s)) return 0;
        try { return Function('"use strict"; var h=' + h + '; return (' + s + ')')(); }
        catch { return 0; }
    }

    /**
     * Parse a .ctr file's text and return { maxVolumeUl, bottomShape }.
     */
    function parseCtrContent(text) {
        const props = parseHxCfg(text);
        const segments = parseInt(props.Segments, 10) || 0;
        let totalVol = 0;
        let bottomShape = 'unknown';
        for (let i = 1; i <= segments; i++) {
            const max = parseFloat(props[`${i}.Max`]) || 0;
            const min = parseFloat(props[`${i}.Min`]) || 0;
            const eqn = props[`${i}.EqnOfVol`] || '';
            totalVol += evalVolumeEqn(eqn, max - min);
            if (i === segments) {
                const shapeCode = parseInt(props[`${i}.Shape`], 10);
                bottomShape = CTR_SHAPES[shapeCode] || 'unknown';
            }
        }
        return { maxVolumeUl: Math.round(totalVol), bottomShape };
    }

    /**
     * Classify a parsed .rck into a labware type relevant for the dilution app.
     * Returns null for items we don't care about (tips, tools, carriers, etc.).
     * Returns { type, spec } for plates, tubes, and troughs.
     */
    function classifyRck(props, catIds) {
        const catSet = new Set(catIds);
        const dataType = parseInt(props.DataType || '-1', 10);
        const rows = parseInt(props.Rows || '0', 10);
        const cols = parseInt(props.Columns || '0', 10);
        const connected = props.ConnectedCtr === '1';
        const ctrFile = (props['Cntr.1.file'] || '').toLowerCase();
        const filename = (props.__filename__ || '').toLowerCase();

        // Skip tips, waste, tools, wash stations, carriers
        if ([...catSet].some(c => CAT_TIPS.has(c))) return null;
        if ([...catSet].some(c => CAT_WASTE.has(c)) || filename.includes('waste')) return null;
        if ([...catSet].some(c => CAT_TOOLS.has(c))) return null;
        if ([...catSet].some(c => CAT_WASH.has(c)) || filename.replace(/_/g, '').includes('washstation')) return null;
        if (['caltool','teaching','verification','griptool','needles','touchoff','barcode'].some(k => filename.includes(k))) return null;
        if (filename.includes('downholder') || filename.includes('lid_park')) return null;
        // Skip tip-like files by name
        if (/\btip\b|^tip_|_tip_|^ftr_|^ntr_|^ltf_|^htf_|^stf_|piercin/i.test(filename)) return null;

        // Reagent trough
        if (connected || [...catSet].some(c => CAT_REAGENT.has(c))) return { type: 'trough', spec: connected ? 'Deep Well' : 'Reservoir' };
        if (/rgt|reagent|trough|reservoir/i.test(filename)) return { type: 'trough', spec: 'Reservoir' };

        // Tube rack / sample carrier
        if ([...catSet].some(c => CAT_TUBE_RACK.has(c))) return { type: 'tube', spec: _tubeSpec(ctrFile, filename) };
        if (dataType === 2 && cols === 1 && rows > 1) {
            if (/cup|smp|sample|tube|eppendorf|vial/i.test(ctrFile + ' ' + filename)) return { type: 'tube', spec: _tubeSpec(ctrFile, filename) };
        }
        if (dataType === 3 && /tube|eppendorf|multitube/i.test(filename)) return { type: 'tube', spec: _tubeSpec(ctrFile, filename) };

        // Plates
        if (dataType === 0 || dataType === 1 || [...catSet].some(c => CAT_PLATE.has(c))) {
            return { type: 'plate', spec: _plateSpec(catIds, filename) };
        }

        // DataType=2 with multi-well grid → likely plate
        if (dataType === 2 && rows > 1 && cols > 1) {
            const total = rows * cols;
            if (total >= 6 && total <= 1536) return { type: 'plate', spec: _plateSpec(catIds, filename) };
        }

        // Skip everything else (carriers without containers, etc.)
        // Only carriers with no useful container
        if ([...catSet].some(c => CAT_CARRIER.has(c))) return null;

        return null;
    }

    function _tubeSpec(ctrFile, filename) {
        if (/lvl/i.test(filename)) return 'LVL';
        if (/screw/i.test(filename) || /screw/i.test(ctrFile)) return 'Screw Cap';
        if (/flip/i.test(filename)) return 'Flip-Top';
        if (/epp/i.test(filename) || /eppendorf/i.test(ctrFile)) return 'Eppendorf';
        if (/conic|falcon/i.test(filename)) return 'Conical';
        return 'Standard';
    }

    function _plateSpec(catIds, filename) {
        const catSet = new Set(catIds);
        if (catSet.has(1006) || /dw|deep.?well/i.test(filename)) return 'Deep Well';
        if (catSet.has(1010) || /pcr/i.test(filename)) return 'PCR';
        if (catSet.has(1009) || /filter/i.test(filename)) return 'Filter';
        if (catSet.has(1028) || /cell.?cult/i.test(filename)) return 'Cell Culture';
        if (/rd|round/i.test(filename)) return 'Round Bottom';
        if (/vb|v.?bottom/i.test(filename)) return 'V-Bottom';
        if (/sq|square/i.test(filename)) return 'Square Well';
        return 'Standard';
    }

    /**
     * Determine size grouping label from rows × cols × volume.
     */
    function labwareSizeLabel(type, rows, cols, maxVolumeUl) {
        const total = rows * cols;
        if (type === 'plate') {
            if (total <= 6)        return { size: '6',    sizeLabel: '6-Well' };
            if (total <= 12)       return { size: '12',   sizeLabel: '12-Well' };
            if (total <= 24)       return { size: '24',   sizeLabel: '24-Well' };
            if (total <= 48)       return { size: '48',   sizeLabel: '48-Well' };
            if (total <= 96)       return { size: '96',   sizeLabel: '96-Well' };
            if (total <= 384)      return { size: '384',  sizeLabel: '384-Well' };
            if (total <= 1536)     return { size: '1536', sizeLabel: '1536-Well' };
            return { size: String(total), sizeLabel: total + '-Well' };
        }
        if (type === 'trough') {
            const mlLabel = maxVolumeUl >= 1000 ? Math.round(maxVolumeUl / 1000) + ' mL' : maxVolumeUl + ' \u00B5L';
            return { size: mlLabel, sizeLabel: mlLabel };
        }
        // Tubes: label by per-tube volume
        if (maxVolumeUl >= 1000) {
            const ml = maxVolumeUl / 1000;
            const label = (Number.isInteger(ml) ? ml : ml.toFixed(1)) + ' mL';
            return { size: label, sizeLabel: label };
        }
        const label = maxVolumeUl + ' \u00B5L';
        return { size: label, sizeLabel: label };
    }

    /**
     * Build a nice human-readable label from filename + manufacturer + spec.
     */
    function buildLabwareLabel(filename, manufacturer, type, rows, cols, spec) {
        // Strip extension and _L/_P suffix
        let base = filename.replace(/\.(rck|tml)$/i, '').replace(/_(L|P)$/i, '');
        // Replace underscores with spaces, capitalize words
        base = base.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        // Prefix with manufacturer if not already present
        if (manufacturer && !base.toLowerCase().startsWith(manufacturer.toLowerCase().slice(0, 3))) {
            base = manufacturer + ' ' + base;
        }
        return base;
    }

    /**
     * Determine holder format from rack dimensions and layout.
     */
    function detectHolderFormat(props, type, rows, cols) {
        const dx = parseFloat(props['Dim.Dx']) || 0;
        const dy = parseFloat(props['Dim.Dy']) || 0;
        // SBS standard footprint is approximately 127.76 × 85.48 mm
        if (dx >= 100 && dx <= 140 && dy >= 70 && dy <= 100) return 'sbs';
        if (dy >= 100 && dy <= 140 && dx >= 70 && dx <= 100) return 'sbs'; // rotated
        // Single-column racks with many rows are typically carriers
        if (type === 'tube' && cols === 1 && rows > 4) return 'carrier';
        return 'sbs'; // default assumption
    }

    /** Generate a unique stable id from vendor + filename */
    function makeLabwareId(vendor, filename) {
        const base = filename.replace(/\.(rck|tml)$/i, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        const v = vendor.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 6);
        return v + '_' + base;
    }

    /**
     * Fetch directory listing from python http.server HTML and extract file/folder names.
     * Returns { files: string[], dirs: string[] }
     */
    async function fetchDirListing(path) {
        const url = path.endsWith('/') ? path : path + '/';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status} fetching ${url}`);
        const html = await resp.text();
        const files = [], dirs = [];
        // Python http.server generates <a> or <li><a> links
        const linkRe = /<a\b[^>]*href="([^"]+)"[^>]*>/gi;
        let m;
        while ((m = linkRe.exec(html)) !== null) {
            const href = decodeURIComponent(m[1]);
            if (href === '../' || href === '.' || href === '..') continue;
            if (href.endsWith('/')) dirs.push(href);
            else files.push(href);
        }
        return { files, dirs };
    }

    /**
     * Recursively discover all .rck files under the labware directory.
     * Returns array of { rckUrl, vendor, filename }.
     */
    async function discoverRckFiles(baseUrl, onProgress) {
        const results = [];
        const listing = await fetchDirListing(baseUrl);

        // Scan subdirectories (vendor folders)
        for (const dir of listing.dirs) {
            const dirName = dir.replace(/\/$/, '');
            if (dirName.toLowerCase() === 'bitmaps') continue; // skip bitmaps
            const subUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + dir;
            try {
                const subListing = await fetchDirListing(subUrl);
                for (const file of subListing.files) {
                    if (/\.rck$/i.test(file) && !/_L\.rck$/i.test(file) && !/_P\.rck$/i.test(file)) {
                        results.push({ rckUrl: subUrl + file, vendor: dirName, filename: file });
                    }
                }
                // Also scan one level deeper (e.g., ML_STAR/CORE/)
                for (const subDir of subListing.dirs) {
                    const subSubUrl = subUrl + subDir;
                    try {
                        const subSubListing = await fetchDirListing(subSubUrl);
                        for (const file of subSubListing.files) {
                            if (/\.rck$/i.test(file) && !/_L\.rck$/i.test(file) && !/_P\.rck$/i.test(file)) {
                                results.push({ rckUrl: subSubUrl + file, vendor: dirName, filename: file });
                            }
                        }
                    } catch { /* skip inaccessible sub-subdirectories */ }
                }
            } catch { /* skip inaccessible directories */ }
            if (onProgress) onProgress(results.length);
        }

        // Also check top-level .rck files
        for (const file of listing.files) {
            if (/\.rck$/i.test(file) && !/_L\.rck$/i.test(file) && !/_P\.rck$/i.test(file)) {
                results.push({ rckUrl: baseUrl + (baseUrl.endsWith('/') ? '' : '/') + file, vendor: '', filename: file });
            }
        }

        return results;
    }

    /**
     * Main labware refresh function: scans directory, parses files, rebuilds catalog.
     * @param {string} labwareDir – relative path to labware folder (e.g. 'Labware')
     * @param {function} onStatus – callback(message, pct) for progress updates
     * @returns {Promise<{count: number, errors: number}>}
     */
    async function refreshLabwareCatalog(labwareDir, onStatus) {
        onStatus('Discovering labware files\u2026', 0);
        const baseUrl = labwareDir;
        const rckFiles = await discoverRckFiles(baseUrl, (n) => {
            onStatus(`Found ${n} labware files\u2026`, 10);
        });

        if (rckFiles.length === 0) {
            throw new Error('No .rck files found in the labware directory');
        }

        onStatus(`Parsing ${rckFiles.length} files\u2026`, 15);
        const newCatalog = [];
        let errors = 0;
        const batchSize = 10; // fetch in parallel batches

        for (let i = 0; i < rckFiles.length; i += batchSize) {
            const batch = rckFiles.slice(i, i + batchSize);
            const pct = 15 + Math.round((i / rckFiles.length) * 75);
            onStatus(`Parsing\u2026 ${i}/${rckFiles.length}`, pct);

            const results = await Promise.allSettled(batch.map(async ({ rckUrl, vendor, filename }) => {
                // Fetch and parse .rck
                const rckResp = await fetch(rckUrl);
                if (!rckResp.ok) throw new Error(`HTTP ${rckResp.status}`);
                const rckText = await rckResp.text();
                const props = parseHxCfg(rckText);
                props.__filename__ = filename;

                // Extract category IDs
                const catCnt = parseInt(props.CategoryCnt || '0', 10);
                const catIds = [];
                for (let c = 0; c < catCnt; c++) {
                    const cid = parseInt(props[`Category.${c}.Id`], 10);
                    if (!isNaN(cid)) catIds.push(cid);
                }

                // Classify
                const classification = classifyRck(props, catIds);
                if (!classification) return null; // not relevant labware

                const rows = parseInt(props.Rows || '0', 10);
                const cols = parseInt(props.Columns || '0', 10);
                if (rows === 0 || cols === 0) return null;

                // Get max volume from .ctr file
                let maxVolumeUl = 0;
                const ctrPath = props['Cntr.1.file'];
                if (ctrPath) {
                    // Container file path is relative to labware root
                    const ctrUrl = labwareDir + '/' + ctrPath.replace(/\\\\/g, '/').replace(/\\/g, '/');
                    try {
                        const ctrResp = await fetch(ctrUrl);
                        if (ctrResp.ok) {
                            const ctrText = await ctrResp.text();
                            const ctrData = parseCtrContent(ctrText);
                            maxVolumeUl = ctrData.maxVolumeUl;
                        }
                    } catch { /* volume stays 0 */ }
                }

                // Skip items with no volume info for plates/tubes (likely not useful)
                if (maxVolumeUl <= 0 && classification.type !== 'trough') return null;

                const manufacturer = VENDOR_DISPLAY_NAMES[vendor.toLowerCase()] || vendor || 'Unknown';
                const type = classification.type;
                const spec = classification.spec;
                const { size, sizeLabel } = labwareSizeLabel(type, rows, cols, maxVolumeUl);
                const holderFormat = detectHolderFormat(props, type, rows, cols);
                const id = makeLabwareId(vendor, filename);
                const label = buildLabwareLabel(filename, manufacturer, type, rows, cols, spec);

                return {
                    id, type, size, sizeLabel, holderFormat,
                    manufacturer, label, rows, cols, maxVolumeUl, spec
                };
            }));

            for (const r of results) {
                if (r.status === 'fulfilled' && r.value) newCatalog.push(r.value);
                else if (r.status === 'rejected') errors++;
            }
        }

        // Deduplicate by id (keep first occurrence)
        const seen = new Set();
        const deduped = [];
        for (const entry of newCatalog) {
            if (!seen.has(entry.id)) {
                seen.add(entry.id);
                deduped.push(entry);
            }
        }

        // Sort: type → size (numeric) → manufacturer → label
        deduped.sort((a, b) => {
            const typeOrder = { plate: 0, tube: 1, trough: 2 };
            const ta = typeOrder[a.type] ?? 3, tb = typeOrder[b.type] ?? 3;
            if (ta !== tb) return ta - tb;
            const sa = parseFloat(a.size) || 0, sb = parseFloat(b.size) || 0;
            if (sa !== sb) return sa - sb;
            if (a.manufacturer !== b.manufacturer) return a.manufacturer.localeCompare(b.manufacturer);
            return a.label.localeCompare(b.label);
        });

        onStatus(`Loaded ${deduped.length} labware definitions`, 100);
        LABWARE_CATALOG = deduped;

        // Persist to localStorage for faster loading next time
        try { localStorage.setItem('labwareCatalog', JSON.stringify(deduped)); }
        catch { /* ignore quota errors */ }

        return { count: deduped.length, errors };
    }

    /** Look up a labware catalog entry by its unique id */
    function findLabwareDef(defId) {
        if (!defId) return null;
        return LABWARE_CATALOG.find(d => d.id === defId) || null;
    }

    /** Returns a human-readable summary for a labware config object */
    function labwareSummary(cfg) {
        if (!cfg || !cfg.definition) return 'Configure...';
        const def = findLabwareDef(cfg.definition);
        if (!def) return 'Configure...';
        if (cfg.positions && cfg.positions.length > 0) {
            return `${def.label} \u00B7 ${formatSequenceRange(cfg.positions)}`;
        }
        const pos = cfg.position || (cfg.type === 'tube' ? 'Pos 1' : 'A1');
        return `${def.label} \u00B7 ${pos}`;
    }

    function defaultLabwareConfig() {
        return { type: '', size: '', holderFormat: '', definition: '', position: '', positions: [], maxVolumeUl: 0 };
    }

    /**
     * Get the max well/container volume for a configured labware target.
     * Returns Infinity when no labware is configured (no constraint).
     * @param {'stock'|'diluent'|'dilutions'} target
     */
    function getLabwareMaxVolume(target) {
        const cfg = state[target + 'Labware'];
        if (!cfg || !cfg.maxVolumeUl) return Infinity;
        return cfg.maxVolumeUl;
    }

    function getUnitGroup(unit) {
        return UNIT_GROUPS.find(g => g.units.includes(unit));
    }

    function getRelatedUnits(unit) {
        const group = getUnitGroup(unit);
        return group ? group.units : [unit];
    }

    function convertConc(value, fromUnit, toUnit) {
        const group = getUnitGroup(fromUnit);
        if (!group || !group.toBase[toUnit]) return value;
        return value * (group.toBase[fromUnit] / group.toBase[toUnit]);
    }

    // ── State ──────────────────────────────────────────────────
    // IMPORTANT: The dilutionFactor must NEVER be rounded, altered, or
    // recalculated by any code path. It is strictly user-specified.
    // Any volume-optimization logic (e.g. snapping to 0.5 µL increments)
    // must adjust totalVolume or transferVol — never the dilution factor.
    const state = {
        stockConcentration: 1000,
        stockUnit: 'mM',
        dilutionFactor: 10,
        numDilutions: 8,
        totalVolume: 1000,
        volumeUnit: 'µL',
        defaultNumDilutions: 8,
        colorScheme: 'ocean',
        tubeStyle: 'tube',
        animateTransfers: true,
        discardLastExcess: true,
        stockLiquidType: 'Water',
        diluentLiquidType: 'Water',
        dilutionsLiquidType: 'Water',
        stockLabware: defaultLabwareConfig(),
        diluentLabware: defaultLabwareConfig(),
        dilutionsLabware: defaultLabwareConfig(),
        stockName: '',
        diluentName: '',
        freshTipDiluent: false,
        tipType: 'nested',
        tipHasFilter: false,
        freshTipSample: true,

        mixEnabled: false,
        mixSteps: 3,
        mixVolume: 200,

        deadVolumeStock: 50,
        deadVolumeDiluent: 50,

        isDark: false,
        isAnimating: false,
        tubeNames: [],   // Custom dilution tube names
        allowMultipleFactors: false,
        perTubeFactors: [],  // Per-tube dilution factors (when multi-factor enabled)
        perTubeUnits: [],    // Per-tube concentration unit overrides
        allowMultipleVolumes: false,
        perTubeVolumes: [],  // Per-tube total volumes (when multi-volume enabled)

    };

    // ── Tube Naming Helpers ─────────────────────────────────
    /** Return the display name for dilution tube at 0-based index */
    function getTubeName(index) {
        return state.tubeNames[index] || ('Dilution ' + (index + 1));
    }

    /** Set a custom name for dilution tube at 0-based index and sync both views */
    function setTubeName(index, name) {
        // Ensure array is big enough
        while (state.tubeNames.length <= index) state.tubeNames.push('');
        state.tubeNames[index] = name.trim();
        syncTubeName(index);
    }

    /** Sync the name of tube `index` across the animation pane and table.
     *  Skips the element with focus so the cursor position isn't disturbed. */
    function syncTubeName(index) {
        const name = getTubeName(index);
        const focused = document.activeElement;
        // Update tube label in the viz area
        const tubeLabels = dom.dilutionTubes.querySelectorAll('.tube-slot:not(.waste-slot) .tube-label-top');
        if (tubeLabels[index] && tubeLabels[index] !== focused) {
            tubeLabels[index].textContent = name;
        }
        // Update table row (skip diluent + stock rows)
        const tableRows = dom.summaryTbody.querySelectorAll('tr');
        const tableRow = tableRows[index + 2]; // +2 because first two rows are diluent & stock
        if (tableRow) {
            const nameSpan = tableRow.querySelector('.tube-name-editable');
            if (nameSpan && nameSpan !== focused) nameSpan.textContent = name;
        }
    }

    /** Initialise the tubeNames array to match current numDilutions */
    function ensureTubeNames() {
        while (state.tubeNames.length < state.numDilutions) {
            state.tubeNames.push('');
        }
    }

    // ── DOM Cache ──────────────────────────────────────────────
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);

    const dom = {
        splash: $('#splash-screen'),
        app: $('#app'),
        stockLiquidType: $('#stock-liquid-type'),
        stockConc: $('#stock-concentration'),
        stockUnit: $('#stock-unit'),
        diluentLiquidType: $('#diluent-liquid-type'),
        dilutionsLiquidType: $('#dilutions-liquid-type'),

        btnStockLabware: $('#btn-stock-labware'),
        stockLabwareLabel: $('#stock-labware-label'),
        btnDiluentLabware: $('#btn-diluent-labware'),
        diluentLabwareLabel: $('#diluent-labware-label'),
        btnDilutionsLabware: $('#btn-dilutions-labware'),
        dilutionsLabwareLabel: $('#dilutions-labware-label'),

        labwareModal: $('#labware-modal'),
        labwareModalTitle: $('#labware-modal-title'),
        labwareModalClose: $('#labware-modal-close'),
        labwareStepType: $('#labware-step-type'),
        labwareDefOptions: $('#labware-def-options'),
        labwareWellGrid: $('#labware-well-grid'),
        labwarePositionDisplay: $('#labware-position-display'),
        labwareBtnBack: $('#labware-btn-back'),
        labwareBtnConfirm: $('#labware-btn-confirm'),
        diluentNameInput: $('#diluent-name'),
        stockNameInput: $('#stock-name'),
        dilFactor: $('#dilution-factor'),
        numDils: $('#num-dilutions'),
        totalVol: $('#total-volume'),
        btnMinus: $('#btn-minus'),
        btnPlus: $('#btn-plus'),
        transferVol: $('#transfer-volume'),
        diluentVol: $('#diluent-volume'),
        tubeRack: $('#tube-rack'),
        dilutionTubes: $('#dilution-tubes'),
        summaryTbody: $('#summary-tbody'),
        materialsCards: $('#materials-cards'),
        stockConcLabel: $('#stock-conc-label'),
        stockUnitLabel: $('#stock-unit-label'),
        diluentVolLabel: $('#diluent-vol-label'),
        diluentUnitLabel: $('#diluent-unit-label'),
        diluentConnectorLabel: $('#diluent-connector-label'),

        btnAnimate: $('#btn-animate'),
        btnReset: $('#btn-reset'),
        btnExport: $('#btn-export'),
        btnTheme: $('#btn-theme'),
        btnHelp: $('#btn-help'),
        btnSidebarToggle: $('#btn-sidebar-toggle'),
        configPanel: $('.config-panel'),
        helpModal: $('#help-modal'),
        exportModal: $('#export-modal'),
        helpClose: $('#help-modal-close'),
        exportClose: $('#export-modal-close'),
        toastContainer: $('#toast-container'),
        btnCopyTable: $('#btn-copy-table'),

        discardToggle: $('#config-discard-excess'),
        btnConfig: $('#btn-config'),
        configModal: $('#config-modal'),
        configClose: $('#config-modal-close'),
        configFreshTipDiluent: $('#config-fresh-tip-diluent'),
        configTipType: $('#config-tip-type'),
        configTipFilter: $('#config-tip-filter'),
        configTipFilterRow: $('#config-tip-filter-row'),
        configMixEnabled: $('#config-mix-enabled'),
        configMixSteps: $('#config-mix-steps'),
        configMixVolume: $('#config-mix-volume'),
        configMixOptions: $('#config-mix-options'),
        configDeadVolumeStock: $('#config-dead-volume-stock'),
        configDeadVolumeDiluent: $('#config-dead-volume-diluent'),
        allowMultipleFactorsToggle: $('#allow-multiple-factors'),
        allowMultipleVolumesToggle: $('#allow-multiple-volumes'),

        warningModal: $('#warning-modal'),
        warningModalClose: $('#warning-modal-close'),
        warningModalDismiss: $('#warning-modal-dismiss'),
        warningModalMessage: $('#warning-modal-message'),

        btnSettings: $('#btn-settings'),
        settingsModal: $('#settings-modal'),
        settingsClose: $('#settings-modal-close'),
        settingsLabwareDir: $('#settings-labware-dir'),
        settingsLabwareDirClear: $('#settings-labware-dir-clear'),
        settingsRefreshLabware: $('#settings-refresh-labware'),
        settingsRefreshStatus: $('#settings-refresh-status'),
        settingsSave: $('#settings-save'),
    };

    // ── Initialization ─────────────────────────────────────────
    function init() {
        // Start splash sequence
        setTimeout(() => {
            dom.splash.classList.add('splash-fade-out');
            dom.app.classList.add('app-visible');
            setTimeout(() => {
                dom.splash.style.display = 'none';
            }, 800);
        }, 2800);

        // Restore cached labware catalog from localStorage (if available)
        try {
            const cached = localStorage.getItem('labwareCatalog');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    LABWARE_CATALOG = parsed;
                }
            }
        } catch(e) { /* use default catalog */ }

        // Restore saved theme preference
        try {
            const saved = localStorage.getItem('dilution-dark-mode');
            if (saved === '1') state.isDark = true;
        } catch(e) {}
        applyTheme();
        populateSharedDropdowns();
        updateLabwareLabels();

        bindEvents();
        ensureSharedDropdownsPopulated();
        initPillInputSizing();
        applyColorScheme(state.colorScheme);
        recalculate();
        renderTubes();
        renderSummary();
        autoSizeTubes();

        // Resize observer for dynamic layout
        const ro = new ResizeObserver(debounce(autoSizeTubes, 60));
        ro.observe(document.querySelector('.tube-rack-wrapper'));
    }

    // ── Auto-size pill inputs ────────────────────────────────
    function autoSizeInput(input) {
        const len = (input.value || '').length;
        input.style.width = Math.max(1, len) + 'ch';
    }

    function initPillInputSizing() {
        document.querySelectorAll('.conc-pill-number').forEach(input => {
            autoSizeInput(input);
            input.addEventListener('input', () => autoSizeInput(input));
        });
    }

    // ── Strip Leading Zeroes ─────────────────────────────────────
    /** Remove leading zeroes from a numeric string, preserving decimals like "0.5" */
    function stripLeadingZeroes(str) {
        // Remove leading zeroes but keep "0" before a decimal point and lone "0"
        return str.replace(/^0+(?=\d)/, '');
    }

    /** Attach leading-zero stripping to all numeric inputs & contenteditable number fields */
    function initLeadingZeroStrip() {
        // For regular <input type="number"> fields: strip on input
        document.addEventListener('input', (e) => {
            const el = e.target;
            // Handle <input type="number"> fields
            if (el.tagName === 'INPUT' && (el.type === 'number' || el.inputMode === 'decimal')) {
                const raw = el.value;
                const stripped = stripLeadingZeroes(raw);
                if (stripped !== raw) {
                    el.value = stripped;
                }
                return;
            }
            // Handle contenteditable number fields (.conc-pill-number, .inline-editable)
            if (el.isContentEditable && (el.classList.contains('conc-pill-number') || el.classList.contains('inline-editable'))) {
                const raw = el.textContent;
                const stripped = stripLeadingZeroes(raw);
                if (stripped !== raw) {
                    // Preserve cursor at end after stripping
                    el.textContent = stripped;
                    // Move cursor to end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    if (el.childNodes.length) {
                        range.setStartAfter(el.lastChild);
                    } else {
                        range.setStart(el, 0);
                    }
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }, true);
    }

    function populateSelect(selectEl, values, config = {}) {
        if (!selectEl) return;
        const { includeEmpty = false, emptyLabel = 'Select...', selectedValue = '' } = config;

        selectEl.innerHTML = '';
        if (includeEmpty) {
            selectEl.add(new Option(emptyLabel, ''));
        }
        for (const value of values) {
            const label = LIQUID_TYPE_LABELS[value] || value;
            selectEl.add(new Option(label, value));
        }

        if (selectedValue && values.includes(selectedValue)) {
            selectEl.value = selectedValue;
        } else if (includeEmpty) {
            selectEl.value = '';
        } else if (values.length) {
            selectEl.value = values[0];
        }
    }

    function populateSharedDropdowns() {
        populateSelect(dom.stockLiquidType, LIQUID_TYPE_OPTIONS, { selectedValue: state.stockLiquidType });
        populateSelect(dom.diluentLiquidType, LIQUID_TYPE_OPTIONS, { selectedValue: state.diluentLiquidType });
        populateSelect(dom.dilutionsLiquidType, LIQUID_TYPE_OPTIONS, { selectedValue: state.dilutionsLiquidType });
    }

    function ensureSharedDropdownsPopulated() {
        const sharedSelects = [
            dom.stockLiquidType,
            dom.diluentLiquidType,
            dom.dilutionsLiquidType,
        ].filter(Boolean);

        const hasEmptySelect = sharedSelects.some(sel => sel.options.length === 0);
        if (hasEmptySelect) populateSharedDropdowns();
    }

    // ── Event Binding ──────────────────────────────────────────
    function bindEvents() {
        // Strip leading zeroes globally
        initLeadingZeroStrip();

        // Config inputs
        dom.stockLiquidType.addEventListener('change', onConfigChange);
        dom.stockConc.addEventListener('input', debounce(onConfigChange, 200));
        dom.stockUnit.addEventListener('change', onConfigChange);
        dom.diluentLiquidType.addEventListener('change', onConfigChange);
        if (dom.dilutionsLiquidType) dom.dilutionsLiquidType.addEventListener('change', onConfigChange);
        dom.diluentNameInput.addEventListener('input', debounce(() => { state.diluentName = dom.diluentNameInput.value.trim(); updateLiquidNames(); renderSummary(); }, 200));
        dom.stockNameInput.addEventListener('input', debounce(() => { state.stockName = dom.stockNameInput.value.trim(); updateLiquidNames(); renderSummary(); }, 200));
        dom.dilFactor.addEventListener('input', debounce(onConfigChange, 200));

        // Labware configure buttons (sidebar pencil icons)
        if (dom.btnDiluentLabware) dom.btnDiluentLabware.addEventListener('click', () => openLabwareModal('diluent'));
        if (dom.btnStockLabware) dom.btnStockLabware.addEventListener('click', () => openLabwareModal('stock'));
        if (dom.btnDilutionsLabware) dom.btnDilutionsLabware.addEventListener('click', () => openLabwareModal('dilutions'));

        // Clickable diluent & stock tubes in viz area → open labware modal
        document.querySelectorAll('.tube-configurable').forEach(slot => {
            slot.addEventListener('click', (e) => {
                // Don't intercept clicks on editable labels
                if (e.target.closest('[contenteditable]')) return;
                const target = slot.dataset.labwareTarget;
                if (target) openLabwareModal(target);
            });
        });

        // Labware modal controls
        dom.labwareModalClose.addEventListener('click', () => toggleModal(dom.labwareModal, false));
        dom.labwareModal.addEventListener('click', (e) => {
            if (e.target === dom.labwareModal) toggleModal(dom.labwareModal, false);
        });
        dom.labwareBtnBack.addEventListener('click', labwareModalBack);
        dom.labwareBtnConfirm.addEventListener('click', labwareModalConfirm);

        // Type cards
        dom.labwareStepType.addEventListener('click', (e) => {
            const card = e.target.closest('.labware-type-card');
            if (!card) return;
            dom.labwareStepType.querySelectorAll('.labware-type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            labwareModalState.type = card.dataset.type;
            labwareModalState.size = '';
            labwareModalState.holderFormat = '';
            labwareModalState.definition = '';
            labwareModalState.position = '';
            labwareModalState.positions = [];
            advanceToStep('size');
        });

        // Size cards (delegated)
        document.getElementById('labware-step-size').addEventListener('click', (e) => {
            const card = e.target.closest('.labware-size-card');
            if (!card) return;
            document.getElementById('labware-size-options').querySelectorAll('.labware-size-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            labwareModalState.size = card.dataset.size;
            labwareModalState.holderFormat = '';
            labwareModalState.definition = '';
            labwareModalState.position = '';
            labwareModalState.positions = [];
            // Next step depends on type: tubes go to holder, plates/troughs skip to definition
            const nextStep = labwareModalState.type === 'tube' ? 'holder' : 'definition';
            advanceToStep(nextStep);
        });

        // Holder cards (delegated, tubes only)
        document.getElementById('labware-step-holder').addEventListener('click', (e) => {
            const card = e.target.closest('.labware-holder-card');
            if (!card) return;
            document.getElementById('labware-holder-options').querySelectorAll('.labware-holder-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            labwareModalState.holderFormat = card.dataset.holder;
            labwareModalState.definition = '';
            labwareModalState.position = '';
            labwareModalState.positions = [];
            advanceToStep('definition');
        });

        // Definition cards (delegated)
        dom.labwareDefOptions.addEventListener('click', (e) => {
            const card = e.target.closest('.labware-def-card');
            if (!card) return;
            dom.labwareDefOptions.querySelectorAll('.labware-def-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            labwareModalState.definition = card.dataset.defId;
            labwareModalState.position = '';
            labwareModalState.positions = [];
            advanceToStep('position');
        });

        // Well grid clicks (delegated)
        dom.labwareWellGrid.addEventListener('click', (e) => {
            const cell = e.target.closest('.well-cell');
            if (!cell) return;

            const wellId = cell.dataset.well;

            if (labwareModalState.target === 'dilutions') {
                // Multi-select: toggle well in ordered positions list
                const idx = labwareModalState.positions.indexOf(wellId);
                if (idx >= 0) {
                    // Remove this well and renumber subsequent badges
                    labwareModalState.positions.splice(idx, 1);
                    cell.classList.remove('selected');
                    cell.removeAttribute('data-dil-num');
                } else {
                    // Add to the end of the ordered list
                    labwareModalState.positions.push(wellId);
                    cell.classList.add('selected');
                }
                // Update all badge numbers to reflect current order
                updateDilutionBadges();
                // Update display & button state
                updateDilutionsPositionDisplay();
            } else {
                // Single-select for stock/diluent
                dom.labwareWellGrid.querySelectorAll('.well-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                labwareModalState.position = wellId;
                dom.labwarePositionDisplay.textContent = `Selected: ${wellId}`;
                dom.labwareBtnConfirm.classList.remove('labware-btn-disabled');
            }
        });

        [
            dom.stockLiquidType,
            dom.diluentLiquidType,
            dom.dilutionsLiquidType,
        ].filter(Boolean).forEach(selectEl => {
            selectEl.addEventListener('focus', ensureSharedDropdownsPopulated);
        });

        // Prevent line breaks & restrict to numeric input in contenteditable dilution factor
        dom.dilFactor.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); dom.dilFactor.blur(); }
        });
        dom.dilFactor.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/[^0-9.]/g, '');
            document.execCommand('insertText', false, text);
        });
        dom.numDils.addEventListener('input', debounce(onTubeCountChange, 200));
        dom.totalVol.addEventListener('input', debounce(onConfigChange, 200));

        // Tube count buttons
        dom.btnMinus.addEventListener('click', () => {
            const v = Math.max(1, parseInt(dom.numDils.value) - 1);
            dom.numDils.value = v;
            onTubeCountChange();
        });
        dom.btnPlus.addEventListener('click', () => {
            const v = Math.min(24, parseInt(dom.numDils.value) + 1);
            dom.numDils.value = v;
            onTubeCountChange();
        });



        // Advanced config modal
        dom.btnConfig.addEventListener('click', () => {
            dom.configFreshTipDiluent.checked = state.freshTipDiluent;
            dom.configTipType.value = state.tipType;
            dom.configTipFilter.checked = state.tipHasFilter;
            dom.configTipFilterRow.style.display = state.tipType === 'standard' ? '' : 'none';
            dom.discardToggle.checked = state.discardLastExcess;
            dom.configMixEnabled.checked = state.mixEnabled;
            dom.configMixSteps.value = state.mixSteps;
            dom.configMixVolume.value = state.mixVolume;
            dom.configMixOptions.classList.toggle('mix-options-hidden', !state.mixEnabled);
            dom.configDeadVolumeStock.value = state.deadVolumeStock;
            dom.configDeadVolumeDiluent.value = state.deadVolumeDiluent;
            toggleModal(dom.configModal, true);
        });
        dom.configClose.addEventListener('click', () => toggleModal(dom.configModal, false));
        dom.configModal.addEventListener('click', (e) => {
            if (e.target === dom.configModal) toggleModal(dom.configModal, false);
        });
        dom.configFreshTipDiluent.addEventListener('change', () => {
            state.freshTipDiluent = dom.configFreshTipDiluent.checked;
        });
        dom.configTipType.addEventListener('change', () => {
            state.tipType = dom.configTipType.value;
            dom.configTipFilterRow.style.display = state.tipType === 'standard' ? '' : 'none';
            if (state.tipType === 'nested') {
                state.tipHasFilter = false;
                dom.configTipFilter.checked = false;
            }
        });
        dom.configTipFilter.addEventListener('change', () => {
            state.tipHasFilter = dom.configTipFilter.checked;
        });
        dom.configMixEnabled.addEventListener('change', () => {
            state.mixEnabled = dom.configMixEnabled.checked;
            dom.configMixOptions.classList.toggle('mix-options-hidden', !state.mixEnabled);
        });
        dom.configMixSteps.addEventListener('input', () => {
            const v = parseInt(dom.configMixSteps.value, 10);
            if (!isNaN(v) && v >= 1) state.mixSteps = v;
        });
        dom.configMixVolume.addEventListener('input', () => {
            const v = parseFloat(dom.configMixVolume.value);
            if (!isNaN(v) && v > 0) state.mixVolume = v;
        });
        dom.configDeadVolumeStock.addEventListener('input', () => {
            const v = parseFloat(dom.configDeadVolumeStock.value);
            if (!isNaN(v) && v >= 0) { state.deadVolumeStock = v; recalculate(); renderSummary(); }
        });
        dom.configDeadVolumeDiluent.addEventListener('input', () => {
            const v = parseFloat(dom.configDeadVolumeDiluent.value);
            if (!isNaN(v) && v >= 0) { state.deadVolumeDiluent = v; recalculate(); renderSummary(); }
        });
        dom.discardToggle.addEventListener('change', () => {
            state.discardLastExcess = dom.discardToggle.checked;
            readState();
            recalculate();
            if (state.discardLastExcess) {
                appendWasteIfEnabled();
            } else {
                removeWasteFromDOM();
            }
            updateExistingTubes();
            autoSizeTubes();
            renderSummary();
        });


        // Allow multiple dilution factors toggle
        dom.allowMultipleFactorsToggle.addEventListener('change', () => {
            state.allowMultipleFactors = dom.allowMultipleFactorsToggle.checked;
            if (state.allowMultipleFactors) {
                initPerTubeFactors();

            }
            // Smoothly collapse/expand the global dilution factor row
            const dfRow = document.getElementById('dilution-factor-row');
            if (dfRow) dfRow.classList.toggle('row-collapsed', state.allowMultipleFactors);
            recalculate();
            updateExistingTubes();
            renderSummary();
            requestConnectorRedraw();
        });

        // Allow multiple total volumes toggle
        dom.allowMultipleVolumesToggle.addEventListener('change', () => {
            state.allowMultipleVolumes = dom.allowMultipleVolumesToggle.checked;
            if (state.allowMultipleVolumes) {
                initPerTubeVolumes();
            }
            // Smoothly collapse/expand the global total volume row
            const tvRow = document.getElementById('total-volume-row');
            if (tvRow) tvRow.classList.toggle('row-collapsed', state.allowMultipleVolumes);
            recalculate();
            updateExistingTubes();
            renderSummary();
            requestConnectorRedraw();
        });

        // Editable tube names - delegate from both viz & table
        dom.dilutionTubes.addEventListener('input', (e) => {
            const el = e.target.closest('[data-tube-index][contenteditable]');
            if (!el) return;
            const idx = parseInt(el.dataset.tubeIndex, 10);
            if (!isNaN(idx)) setTubeName(idx, el.textContent);
        });
        dom.summaryTbody.addEventListener('input', (e) => {
            const el = e.target.closest('.tube-name-editable[data-tube-index]');
            if (!el) return;
            const idx = parseInt(el.dataset.tubeIndex, 10);
            if (!isNaN(idx)) setTubeName(idx, el.textContent);
        });

        // Inline editing of dilution factor / transfer volume in multi-factor mode
        // Use focusout (bubbles unlike blur) to commit edits from contenteditable spans
        dom.summaryTbody.addEventListener('focusout', (e) => {
            // Handle stock concentration edit (no data-tube-index)
            const stockEl = e.target.closest('.inline-edit-stock-conc');
            if (stockEl) {
                const val = parseFloat(stockEl.textContent);
                if (isNaN(val) || val <= 0) {
                    stockEl.textContent = formatConcentration(state.stockConcentration);
                    showWarningModal(
                        '<strong>Invalid stock concentration.</strong><br>' +
                        'The stock concentration must be greater than 0.'
                    );
                    return;
                }
                state.stockConcentration = val;
                dom.stockConc.value = val;
                recalculate();
                renderTubes();
                renderSummary();
                return;
            }

            const el = e.target.closest('.inline-editable[data-tube-index]');
            if (!el) return;
            const idx = parseInt(el.dataset.tubeIndex, 10);
            if (isNaN(idx)) return;
            const val = parseFloat(el.textContent);

            if (el.classList.contains('inline-edit-factor')) {
                if (isNaN(val) || val < 1) {
                    // Revert to previous valid factor
                    const prev = getEffectiveFactor(idx);
                    el.textContent = formatDilution(prev);
                    showWarningModal(
                        '<strong>Invalid dilution factor.</strong><br>' +
                        'The dilution factor must be greater than or equal to 1. ' +
                        'A factor of <strong>1:0</strong> is not physically possible.'
                    );
                    return;
                }
                if (val > 100000) {
                    const prev = getEffectiveFactor(idx);
                    el.textContent = formatDilution(prev);
                    showWarningModal(
                        '<strong>Dilution factor too large.</strong><br>' +
                        'The maximum allowed dilution factor is <strong>100,000</strong>.'
                    );
                    return;
                }
                setPerTubeFactor(idx, val);
            } else if (el.classList.contains('inline-edit-transfer')) {
                const tubeVol = getEffectiveVolume(idx);
                if (isNaN(val) || val <= 0 || val > tubeVol) {
                    // Revert to previous valid transfer volume
                    const prevFactor = getEffectiveFactor(idx);
                    const prevTransfer = tubeVol / prevFactor;
                    el.textContent = formatValue(prevTransfer);
                    showWarningModal(
                        '<strong>Invalid transfer volume.</strong><br>' +
                        'The transfer volume must be greater than 0 and no more than the total volume (' + tubeVol + ' µL).'
                    );
                    return;
                }
                setPerTubeTransferVol(idx, val);
            } else if (el.classList.contains('inline-edit-diluent')) {
                const tubeVol = getEffectiveVolume(idx);
                if (isNaN(val) || val < 0 || val >= tubeVol) {
                    const prevFactor = getEffectiveFactor(idx);
                    const prevDiluent = tubeVol - (tubeVol / prevFactor);
                    el.textContent = formatValue(prevDiluent);
                    showWarningModal(
                        '<strong>Invalid diluent volume.</strong><br>' +
                        'The diluent volume must be 0 or greater and less than the total volume (' + tubeVol + ' µL).'
                    );
                    return;
                }
                setPerTubeDiluentVol(idx, val);
            } else if (el.classList.contains('inline-edit-totalvol')) {
                if (isNaN(val) || val <= 0) {
                    const prevVol = getEffectiveVolume(idx);
                    el.textContent = formatValue(prevVol);
                    showWarningModal(
                        '<strong>Invalid total volume.</strong><br>' +
                        'The total volume must be greater than 0.'
                    );
                    return;
                }
                setPerTubeVolume(idx, val);
            } else if (el.classList.contains('inline-edit-conc')) {
                const unit = getEffectiveUnit(idx);
                if (isNaN(val) || val <= 0) {
                    // Revert
                    const data = getDilutionData();
                    const concInUnit = convertConc(data[idx].concentration, state.stockUnit, unit);
                    el.textContent = formatConcentration(concInUnit);
                    showWarningModal(
                        '<strong>Invalid concentration.</strong><br>' +
                        'The concentration must be greater than 0.'
                    );
                    return;
                }
                setPerTubeConcentration(idx, val, unit);
            } else if (el.classList.contains('inline-edit-cumulative')) {
                if (isNaN(val) || val < 1) {
                    const data = getDilutionData();
                    el.textContent = formatDilution(data[idx] ? data[idx].dilution : 1);
                    showWarningModal(
                        '<strong>Invalid cumulative dilution.</strong><br>' +
                        'The cumulative dilution must be 1 or greater.'
                    );
                    return;
                }
                setPerTubeCumulativeDilution(idx, val);
            }
        });

        // Prevent Enter key from inserting newlines in editable labels
        // and commit inline edits on Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (e.target.closest('[data-tube-index][contenteditable]') || e.target.closest('.inline-edit-stock-conc')) {
                    e.preventDefault();
                    e.target.blur();
                }
            }
        });

        // Play animation
        dom.btnAnimate.addEventListener('click', playDilutionSequence);

        // Toolbar
        dom.btnReset.addEventListener('click', resetToDefaults);
        dom.btnExport.addEventListener('click', () => toggleModal(dom.exportModal, true));
        dom.btnHelp.addEventListener('click', () => toggleModal(dom.helpModal, true));
        dom.btnTheme.addEventListener('click', toggleTheme);

        // Settings modal
        const DEFAULT_LABWARE_DIR = 'Labware';
        dom.btnSettings.addEventListener('click', () => {
            // Load saved labware dir from localStorage into the input
            dom.settingsLabwareDir.value = localStorage.getItem('labwareDir') || DEFAULT_LABWARE_DIR;
            toggleModal(dom.settingsModal, true);
        });
        dom.settingsClose.addEventListener('click', () => toggleModal(dom.settingsModal, false));
        dom.settingsModal.addEventListener('click', (e) => {
            if (e.target === dom.settingsModal) toggleModal(dom.settingsModal, false);
        });
        dom.settingsLabwareDirClear.addEventListener('click', () => {
            dom.settingsLabwareDir.value = '';
        });
        dom.settingsSave.addEventListener('click', () => {
            const dir = dom.settingsLabwareDir.value.trim();
            if (dir) {
                localStorage.setItem('labwareDir', dir);
            } else {
                localStorage.removeItem('labwareDir');
            }
            toggleModal(dom.settingsModal, false);
            showToast('Settings saved', 'success');
        });

        // Refresh labware button
        dom.settingsRefreshLabware.addEventListener('click', async () => {
            const btn = dom.settingsRefreshLabware;
            const statusEl = dom.settingsRefreshStatus;
            if (btn.disabled) return;

            btn.disabled = true;
            btn.classList.add('refreshing');
            statusEl.className = 'settings-refresh-status';
            statusEl.textContent = 'Starting\u2026';

            try {
                const dir = dom.settingsLabwareDir.value.trim() || localStorage.getItem('labwareDir') || 'Labware';
                const result = await refreshLabwareCatalog(dir, (msg, _pct) => {
                    statusEl.textContent = msg;
                });
                statusEl.className = 'settings-refresh-status status-success';
                statusEl.textContent = `\u2713 ${result.count} labware loaded` + (result.errors ? ` (${result.errors} errors)` : '');
                showToast(`Labware refreshed: ${result.count} definitions loaded`, 'success');
            } catch (err) {
                statusEl.className = 'settings-refresh-status status-error';
                statusEl.textContent = '\u2717 ' + (err.message || 'Scan failed');
                showToast('Labware refresh failed: ' + (err.message || 'Unknown error'), 'error');
            } finally {
                btn.disabled = false;
                btn.classList.remove('refreshing');
            }
        });

        // Sidebar toggle
        dom.btnSidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 680) {
                dom.configPanel.classList.toggle('open');
            } else {
                dom.configPanel.classList.toggle('collapsed');
            }
        });

        // Modal close
        dom.helpClose.addEventListener('click', () => toggleModal(dom.helpModal, false));
        dom.exportClose.addEventListener('click', () => toggleModal(dom.exportModal, false));
        dom.warningModalClose.addEventListener('click', () => toggleModal(dom.warningModal, false));
        dom.warningModalDismiss.addEventListener('click', () => toggleModal(dom.warningModal, false));

        // Close modals on overlay click
        [dom.helpModal, dom.exportModal, dom.warningModal, dom.settingsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) toggleModal(modal, false);
            });
        });

        // Export actions
        $('#export-csv').addEventListener('click', () => { exportCSV(); toggleModal(dom.exportModal, false); });
        $('#export-json').addEventListener('click', () => { exportJSON(); toggleModal(dom.exportModal, false); });
        $('#export-text').addEventListener('click', () => { exportText(); toggleModal(dom.exportModal, false); });
        
        // Copy table
        dom.btnCopyTable.addEventListener('click', copyTableToClipboard);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                toggleModal(dom.helpModal, false);
                toggleModal(dom.exportModal, false);
                toggleModal(dom.warningModal, false);
                toggleModal(dom.labwareModal, false);
            }
        });
    }

    // ── Configuration Changes ──────────────────────────────────
    function onConfigChange() {
        readState();
        recalculate();
        updateExistingTubes();
        requestConnectorRedraw();
        renderSummary();
    }

    function onTubeCountChange() {
        const newCount = Math.max(1, Math.min(24, parseInt(dom.numDils.value) || 1));
        dom.numDils.value = newCount;

        if (newCount !== state.numDilutions) {
            const oldCount = state.numDilutions;
            state.numDilutions = newCount;
            readState();
            recalculate();

            if (newCount > oldCount) {
                addTubes(oldCount, newCount);
            } else {
                removeTubes(oldCount, newCount);
            }
            renderSummary();
        }
    }

    function readState() {
        state.stockConcentration = parseFloat(dom.stockConc.value) || 1;
        state.stockUnit = dom.stockUnit.value;
        state.stockLiquidType = dom.stockLiquidType.value;
        state.diluentLiquidType = dom.diluentLiquidType.value;
        if (dom.dilutionsLiquidType) state.dilutionsLiquidType = dom.dilutionsLiquidType.value;

        const rawFactor = parseFloat(dom.dilFactor.textContent || dom.dilFactor.value);
        if (!isNaN(rawFactor) && rawFactor < 1) {
            dom.dilFactor.textContent = state.dilutionFactor; // revert to previous
            showWarningModal(
                '<strong>Invalid dilution factor.</strong><br>' +
                'The dilution factor must be greater than or equal to 1. ' +
                'A factor of <strong>1:0</strong> is not physically possible.'
            );
        } else if (!isNaN(rawFactor) && rawFactor > 100000) {
            dom.dilFactor.textContent = state.dilutionFactor; // revert to previous
            showWarningModal(
                '<strong>Dilution factor too large.</strong><br>' +
                'The maximum allowed dilution factor is <strong>100,000</strong>.'
            );
        } else {
            state.dilutionFactor = rawFactor || 2;
        }

        state.numDilutions = Math.max(1, Math.min(24, parseInt(dom.numDils.value) || 1));
        state.totalVolume = parseFloat(dom.totalVol.value) || 100;
        state.volumeUnit = 'µL';
    }

    // ── Per-tube factor helpers ──────────────────────────────
    function initPerTubeFactors() {
        // Reset per-tube factors from the current global dilution factor
        // so the user starts from their existing uniform dilution
        state.perTubeFactors = [];
        while (state.perTubeFactors.length < state.numDilutions) {
            state.perTubeFactors.push(state.dilutionFactor);
        }
    }

    function ensurePerTubeFactors() {
        while (state.perTubeFactors.length < state.numDilutions) {
            state.perTubeFactors.push(state.dilutionFactor);
        }
    }

    function getEffectiveFactor(index) {
        if (state.allowMultipleFactors && state.perTubeFactors[index] != null) {
            return state.perTubeFactors[index];
        }
        return state.dilutionFactor;
    }

    function setPerTubeFactor(index, factor) {
        ensurePerTubeFactors();
        state.perTubeFactors[index] = factor;
        recalculate();
        updateExistingTubes();
        renderSummary();
    }

    function setPerTubeTransferVol(index, transferVol) {
        // With remaining-volume model: factor = (desiredVol + transferVol) / transferVol
        const vol = getEffectiveVolume(index);
        const factor = (vol + transferVol) / transferVol;
        setPerTubeFactor(index, factor);
    }

    function setPerTubeDiluentVol(index, diluentVol) {
        // diluentVol = desiredVol in the new model, so changing diluent
        // changes the desired remaining volume (and thus the total volume)
        ensurePerTubeVolumes();
        state.perTubeVolumes[index] = diluentVol;
        recalculate();
        updateExistingTubes();
        renderSummary();
    }

    /** Set the dilution factor for tube `index` by specifying a desired
     *  concentration (in the given unit). Back-calculates the step factor. */
    function setPerTubeConcentration(index, newConc, unit) {
        // Convert the desired concentration to the stock unit
        const concInStockUnit = convertConc(newConc, unit, state.stockUnit);
        if (concInStockUnit <= 0 || concInStockUnit > state.stockConcentration) return;

        // Cumulative dilution needed: stock / desired
        const cumulativeDilNeeded = state.stockConcentration / concInStockUnit;

        // Cumulative dilution from previous tubes (product of factors 0..index-1)
        let prevCumulative = 1;
        ensurePerTubeFactors();
        for (let i = 0; i < index; i++) {
            prevCumulative *= getEffectiveFactor(i);
        }

        // Step factor for this tube
        const stepFactor = cumulativeDilNeeded / prevCumulative;
        if (stepFactor < 1 || !isFinite(stepFactor)) return;

        setPerTubeFactor(index, stepFactor);
    }

    /** Set the step factor for tube `index` by specifying a desired cumulative
     *  dilution. Back-calculates the step factor from cumulative / prev. */
    function setPerTubeCumulativeDilution(index, cumulativeDil) {
        if (cumulativeDil < 1 || !isFinite(cumulativeDil)) return;

        let prevCumulative = 1;
        ensurePerTubeFactors();
        for (let i = 0; i < index; i++) {
            prevCumulative *= getEffectiveFactor(i);
        }

        const stepFactor = cumulativeDil / prevCumulative;
        if (stepFactor < 1 || !isFinite(stepFactor)) return;

        setPerTubeFactor(index, stepFactor);
    }

    function getEffectiveUnit(index) {
        return state.perTubeUnits[index] || state.stockUnit;
    }

    function ensurePerTubeUnits() {
        while (state.perTubeUnits.length < state.numDilutions) {
            state.perTubeUnits.push('');
        }
    }

    // ── Per-tube volume helpers ──────────────────────────────
    function initPerTubeVolumes() {
        while (state.perTubeVolumes.length < state.numDilutions) {
            state.perTubeVolumes.push(state.totalVolume);
        }
    }

    function ensurePerTubeVolumes() {
        while (state.perTubeVolumes.length < state.numDilutions) {
            state.perTubeVolumes.push(state.totalVolume);
        }
    }

    function getEffectiveVolume(index) {
        if (state.allowMultipleVolumes && state.perTubeVolumes[index] != null) {
            return state.perTubeVolumes[index];
        }
        return state.totalVolume;
    }

    function setPerTubeVolume(index, volume) {
        ensurePerTubeVolumes();
        state.perTubeVolumes[index] = volume;
        recalculate();
        updateExistingTubes();
        renderSummary();
    }

    // ── Calculations ───────────────────────────────────────────
    function recalculate() {
        const transferVol = state.totalVolume / state.dilutionFactor;
        const diluentVol = state.totalVolume - transferVol;

        if (dom.transferVol) dom.transferVol.textContent = formatValue(transferVol) + ' ' + state.volumeUnit;
        if (dom.diluentVol) dom.diluentVol.textContent = formatValue(diluentVol) + ' ' + state.volumeUnit;
        
        dom.stockConcLabel.textContent = formatConcentration(state.stockConcentration);
        dom.stockUnitLabel.textContent = state.stockUnit;

        // Update diluent tube labels (no visible text – diluent has no concentration)
        if (dom.diluentVolLabel) dom.diluentVolLabel.innerHTML = '&nbsp;';
        if (dom.diluentUnitLabel) dom.diluentUnitLabel.innerHTML = '&nbsp;';
        if (dom.diluentConnectorLabel) dom.diluentConnectorLabel.textContent = formatValue(diluentVol) + ' ' + state.volumeUnit;
    }

    function getDilutionData() {
        const data = [];

        if (state.allowMultipleFactors || state.allowMultipleVolumes) {
            ensurePerTubeFactors();
            ensurePerTubeVolumes();
            let cumulativeDilution = 1;
            for (let i = 0; i < state.numDilutions; i++) {
                const factor = getEffectiveFactor(i);
                const desiredVol = getEffectiveVolume(i);
                cumulativeDilution *= factor;
                // desiredVol = volume remaining after outgoing transfer
                const transferVol = factor > 1 ? desiredVol / (factor - 1) : 0;
                const diluentVol = desiredVol;
                const totalVol = transferVol + diluentVol;
                const conc = state.stockConcentration / cumulativeDilution;
                data.push({
                    tube: i + 1,
                    concentration: conc,
                    dilution: cumulativeDilution,
                    stepDilution: factor,
                    transferVol: transferVol,
                    diluentVol: diluentVol,
                    totalVol: totalVol,
                });
            }
        } else {
            // desiredVol = volume remaining in each tube after outgoing transfer
            const desiredVol = state.totalVolume;
            const transferVol = state.dilutionFactor > 1 ? desiredVol / (state.dilutionFactor - 1) : 0;
            const diluentVol = desiredVol;
            const totalVol = transferVol + diluentVol;
            for (let i = 0; i < state.numDilutions; i++) {
                const conc = state.stockConcentration / Math.pow(state.dilutionFactor, i + 1);
                data.push({
                    tube: i + 1,
                    concentration: conc,
                    dilution: Math.pow(state.dilutionFactor, i + 1),
                    stepDilution: state.dilutionFactor,
                    transferVol: transferVol,
                    diluentVol: diluentVol,
                    totalVol: totalVol,
                });
            }
        }
        return data;
    }

    // ── Formatting ─────────────────────────────────────────────
    function formatValue(val) {
        if (Math.abs(val) < 1e-9) return '0.00';
        if (val >= 1000) return val.toFixed(2);
        if (val >= 100) return val.toFixed(2);
        if (val >= 10) return val.toFixed(2);
        if (val >= 1) return val.toFixed(3);
        if (val >= 0.01) return val.toFixed(4);
        return val.toExponential(2);
    }

    function formatConcentration(val) {
        if (val >= 1000) return val.toFixed(2);
        if (val >= 100) return val.toFixed(2);
        if (val >= 1) return val.toFixed(2);
        if (val >= 0.001) return val.toFixed(4);
        return val.toExponential(2);
    }

    function formatDilution(val) {
        if (val >= 1e6) return val.toExponential(1);
        if (Number.isInteger(val)) return val.toString();
        return val.toFixed(1);
    }

    // ── Color Interpolation ────────────────────────────────────
    function interpolateColor(scheme, t) {
        const s = COLOR_SCHEMES[scheme];
        const r = Math.round(s.start[0] + (s.end[0] - s.start[0]) * t);
        const g = Math.round(s.start[1] + (s.end[1] - s.start[1]) * t);
        const b = Math.round(s.start[2] + (s.end[2] - s.start[2]) * t);
        return { r, g, b, str: `rgb(${r},${g},${b})` };
    }

    /**
     * Compute a 0-1 "dilution intensity" for tube at `index` (0-based
     * among dilution tubes). Uses the real concentration ratio so the
     * visual color/alpha tracks the dilution factor.
     * Returns { t, alpha } where t drives color interpolation and
     * alpha drives opacity.
     *
     * When `dilutionData` is supplied (an array from getDilutionData()),
     * real per-tube cumulative dilutions are used so multi-factor mode
     * produces accurate colours (e.g. a 1:1 tube matches stock).
     */
    function getDilutionVisuals(index, total, dilutionData) {
        let cumulativeDilution, maxDilution;

        if (dilutionData && dilutionData.length) {
            // Use actual per-tube cumulative dilution values
            cumulativeDilution = dilutionData[index] ? dilutionData[index].dilution : 1;
            maxDilution = dilutionData[dilutionData.length - 1].dilution;
        } else {
            // Uniform factor fallback
            const df = state.dilutionFactor;
            cumulativeDilution = Math.pow(df, index + 1);
            maxDilution = Math.pow(df, total);
        }

        // concentration fraction relative to stock: 1 / cumulativeDilution
        const concFraction = 1 / cumulativeDilution;
        // Map via log scale so colour shift is perceptually even.
        // t goes from 0 (stock conc) → 1 (most dilute)
        const maxLog = Math.log(maxDilution);
        const curLog = Math.log(cumulativeDilution);
        const t = maxLog > 0 ? curLog / maxLog : 0;
        // Alpha: stock is 1, most dilute approaches 0.18
        const alpha = 0.18 + 0.82 * Math.pow(concFraction, 0.35);
        return { t: Math.min(1, t), alpha: Math.max(0.18, Math.min(1, alpha)) };
    }

    /**
     * Compute a bubble color that maintains consistent contrast against
     * the tube liquid.  Dark liquids get light (white-ish) bubbles;
     * light / transparent liquids get darker bubbles — mirroring the
     * contrast behaviour of the stock dilution animation.
     *
     * @param {number} r  Red   channel of the liquid base color (0-255)
     * @param {number} g  Green channel of the liquid base color (0-255)
     * @param {number} b  Blue  channel of the liquid base color (0-255)
     * @param {number} alpha  Opacity of the liquid (0-1)
     * @returns {string}  CSS rgba color string for the bubbles
     */
    function computeBubbleColor(r, g, b, alpha) {
        // Effective on-screen colour when composited over a white background
        const effR = alpha * r + (1 - alpha) * 255;
        const effG = alpha * g + (1 - alpha) * 255;
        const effB = alpha * b + (1 - alpha) * 255;

        // Perceived luminance (0 = black, 1 = white)
        const luminance = (0.299 * effR + 0.587 * effG + 0.114 * effB) / 255;

        // t: 0 → dark liquid (white bubbles), 1 → light liquid (slightly darker bubbles)
        const t = Math.max(0, Math.min(1, (luminance - 0.35) / 0.50));

        // For light liquids, nudge bubbles only slightly darker — never near black.
        // Mix toward a soft mid-tone version of the liquid hue (60% of original).
        const midR = Math.round(r * 0.60 + 80);
        const midG = Math.round(g * 0.60 + 80);
        const midB = Math.round(b * 0.60 + 80);

        const bubR = Math.min(255, Math.round(255 * (1 - t) + midR * t));
        const bubG = Math.min(255, Math.round(255 * (1 - t) + midG * t));
        const bubB = Math.min(255, Math.round(255 * (1 - t) + midB * t));

        // Low opacity so the effect stays subtle across the board
        const opacity = (0.20 + t * 0.15).toFixed(2);

        return `rgba(${bubR},${bubG},${bubB},${opacity})`;
    }

    function getAlphaForTube(index, total) {
        return getDilutionVisuals(index, total).alpha;
    }

    function applyColorScheme(scheme) {
        const s = COLOR_SCHEMES[scheme];
        document.documentElement.style.setProperty('--tube-start', `rgb(${s.start.join(',')})`);
        document.documentElement.style.setProperty('--tube-end', `rgb(${s.end.join(',')})`);
        document.documentElement.style.setProperty('--tube-start-rgb', s.start.join(','));
        document.documentElement.style.setProperty('--tube-end-rgb', s.end.join(','));
    }

    // ── Dynamic Tube Sizing ───────────────────────────────────
    function autoSizeTubes() {
        const wrapper = document.querySelector('.tube-rack-wrapper');
        if (!wrapper) return;

        const availableWidth = wrapper.clientWidth - 48; // padding
        const hasWaste = state.discardLastExcess;
        const numTubes = state.numDilutions + 2 + (hasWaste ? 1 : 0); // +1 stock, +1 diluent, +1 waste if enabled

        // Each tube slot needs roughly tube-width + padding on each side
        const slotPadding = 6;
        const gapSpace = (numTubes - 1) * 4; // CSS gap between tubes

        const maxTube = 60;
        const tubeWidth = Math.max(24, Math.min(maxTube,
            Math.floor((availableWidth - gapSpace) / numTubes) - slotPadding * 2));

        // Height is proportional to width, roughly 2.5x
        const tubeHeight = Math.round(tubeWidth * 2.5);

        document.documentElement.style.setProperty('--tube-width', tubeWidth + 'px');
        document.documentElement.style.setProperty('--tube-height', tubeHeight + 'px');

        // Scale font sizes relative to tube size
        const scale = tubeWidth / 56; // 56 is the default tube width
        const clampedScale = Math.max(0.4, Math.min(1, scale));
        document.documentElement.style.setProperty('--label-scale', clampedScale);
        const rack = document.querySelector('.tube-rack');
        if (rack) {
            rack.style.setProperty('--label-scale', clampedScale);
        }

        // Scale labels
        const labels = document.querySelectorAll('.tube-label-top, .conc-value, .conc-unit');
        labels.forEach(l => {
            l.style.fontSize = '';  // reset to CSS default, scaling handled via container
        });

        if (scale < 0.5) {
            document.querySelectorAll('.tube-graduations').forEach(g => g.style.display = 'none');
        } else {
            document.querySelectorAll('.tube-graduations').forEach(g => g.style.display = '');
        }

        // Redraw SVG connectors at new positions
        requestConnectorRedraw();
    }

    // ── SVG Transfer Connectors ──────────────────────────────────
    let _connectorRAF = null;
    function requestConnectorRedraw() {
        if (_connectorRAF) cancelAnimationFrame(_connectorRAF);
        _connectorRAF = requestAnimationFrame(drawTransferConnectors);
    }

    function drawTransferConnectors() {
        const rack = document.querySelector('.tube-rack');
        if (!rack) return;

        // Get or create the SVG overlay inside the tube-rack
        let svg = rack.querySelector('.transfer-connectors-svg');
        if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.classList.add('transfer-connectors-svg');
            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
            rack.appendChild(svg);
        }

        const rackRect = rack.getBoundingClientRect();
        // Size the SVG to cover the full rack area
        svg.setAttribute('width', rackRect.width);
        svg.setAttribute('height', rackRect.height + 40);
        svg.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;z-index:10;overflow:visible;';

        // Collect all tube slots in visual order (use full slot for bottom position)
        const allSlots = [];
        const stockSlot = document.querySelector('#stock-tube-slot');
        if (stockSlot) allSlots.push(stockSlot);

        const dilutionSlots = document.querySelectorAll('#dilution-tubes .tube-slot:not(.waste-slot)');
        dilutionSlots.forEach(s => allSlots.push(s));

        const wasteSlot = document.querySelector('.waste-slot');
        if (wasteSlot) allSlots.push(wasteSlot);

        if (allSlots.length < 2) {
            svg.innerHTML = '';
            return;
        }

        const data = getDilutionData();
        const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--label-scale')) || 1;
        const hideLabels = scale < 0.5;

        const arrowSize = 5;
        const fontSize = Math.max(8, Math.round(10 * scale));

        // Get the computed theme colors
        const style = getComputedStyle(document.documentElement);
        const strokeColor = style.getPropertyValue('--text-muted').trim() || '#888';
        const bgColor = style.getPropertyValue('--card-bg').trim() || '#ffffff';

        // Marker: solid filled downward-pointing triangle.
        // orient="0" keeps the marker unrotated — since the triangle is
        // drawn pointing down in marker coords, it always points straight down.
        let svgContent = `<defs>
            <marker id="conn-arrow-down" markerWidth="${arrowSize * 2}" markerHeight="${arrowSize * 2}"
                    refX="${arrowSize}" refY="0"
                    orient="0" markerUnits="userSpaceOnUse">
                <path d="M0,0 L${arrowSize * 2},0 L${arrowSize},${arrowSize * 2} Z"
                      fill="${strokeColor}" stroke="none"/>
            </marker>
        </defs>`;

        // ── PROPORTIONAL-ARC CONNECTORS ─────────────────────────
        // RULES:
        //   1. Every arrow departs and arrives at the SAME uniform Y
        //      (baseY), which is `clearance` px above the highest
        //      label in the entire rack → arrows NEVER touch text.
        //   2. Each arc's height is proportional to its own horizontal
        //      span so every arc has the same natural aspect ratio —
        //      no squished or stretched arcs.
        //   3. A minimum arc height prevents flat-looking arcs on
        //      very narrow spans.
        //
        // Two-pass: measure → draw.

        const clearance  = 6;  // min gap between arc endpoint and label text
        const minArc     = 28; // minimum arc diameter (px)

        // --- PASS 1: measure all label positions --------------------
        const slotInfo = [];
        for (let i = 0; i < allSlots.length - 1; i++) {
            const srcLabel = allSlots[i].querySelector('.tube-label-top');
            const dstLabel = allSlots[i + 1].querySelector('.tube-label-top');
            if (!srcLabel || !dstLabel) { slotInfo.push(null); continue; }
            slotInfo.push({
                srcRect: srcLabel.getBoundingClientRect(),
                dstRect: dstLabel.getBoundingClientRect(),
            });
        }

        // Find the HIGHEST label top (smallest Y) across every label
        let highestLabelTop = Infinity;
        for (const info of slotInfo) {
            if (!info) continue;
            highestLabelTop = Math.min(highestLabelTop, info.srcRect.top, info.dstRect.top);
        }
        const lastInfo = slotInfo[slotInfo.length - 1];
        if (lastInfo) highestLabelTop = Math.min(highestLabelTop, lastInfo.dstRect.top);

        // Uniform baseline: both ends of every arc sit here.
        // Position so the BOTTOM of the arrowhead (arrowSize*2 px below
        // the endpoint) aligns with the top of the pill labels.
        const uniformBaseY = Math.round(highestLabelTop - rackRect.top) - arrowSize * 2;

        // --- PASS 2: draw each connector ----------------------------
        for (let i = 0; i < allSlots.length - 1; i++) {
            const info = slotInfo[i];
            if (!info) continue;

            // X positions
            const srcX = Math.round(info.srcRect.left + info.srcRect.width * (2 / 3) - rackRect.left);
            const dstX = Math.round(info.dstRect.left + info.dstRect.width * (1 / 3) - rackRect.left);

            // Y positions: locked to uniform baseline
            const srcY = uniformBaseY;

            // Elliptical (oval) arc: rx = half horizontal span, ry = 55% of rx
            // giving a flatter, more natural-looking curve instead of a circle.
            const dist = Math.abs(dstX - srcX);
            const rx = Math.max(minArc / 2, dist / 2);
            const ry = Math.max(minArc / 2 * 0.55, rx * 0.55);

            // Clean arc from src to dst, both at the same Y.
            // orient="90" on the marker ensures the arrowhead always points
            // straight down without needing any extra path segments.
            svgContent += `<path d="M${srcX},${srcY} A${rx},${ry} 0 0,1 ${dstX},${srcY}"
                fill="none" stroke="${strokeColor}"
                stroke-width="1.5" opacity="0.4"
                marker-end="url(#conn-arrow-down)"/>`;

            // Volume label above the arc peak (top of semicircle = baseY - radius)
            // Two lines: number above, unit below. The unit line sits where
            // the old single label was so neither line crosses the arc.
            if (!hideLabels) {
                const labelX = (srcX + dstX) / 2;
                const peakY = srcY - ry;
                const unitLineY = peakY - 8;          // units well above the arc peak
                const numLineY  = unitLineY - fontSize - 2; // number above units

                let volNum = '';
                let volUnit = state.volumeUnit;
                const isTransferEditable = state.allowMultipleFactors && i < data.length;
                if (i < data.length) {
                    volNum = formatValue(data[i].transferVol);
                } else if (state.discardLastExcess) {
                    const transferVol = state.totalVolume / state.dilutionFactor;
                    volNum = formatValue(transferVol);
                }

                if (volNum) {
                    if (isTransferEditable) {
                        // Editable transfer volume using foreignObject
                        const foWidth = Math.max(50, dist * 0.8);
                        const foHeight = fontSize + 6;
                        const foX = labelX - foWidth / 2;
                        const foY = numLineY - fontSize;
                        svgContent += `<foreignObject x="${foX}" y="${foY}" width="${foWidth}" height="${foHeight}" style="overflow:visible;">
                            <input xmlns="http://www.w3.org/1999/xhtml" type="number" step="any" min="0.1"
                                class="connector-transfer-edit" data-tube-index="${i}"
                                value="${volNum}"
                                style="width:100%;text-align:center;background:transparent;border:none;outline:none;
                                       font-size:${fontSize}px;font-weight:600;color:${strokeColor};opacity:0.7;
                                       padding:0;margin:0;-moz-appearance:textfield;pointer-events:auto;cursor:text;" />
                        </foreignObject>`;
                        svgContent += `<text x="${labelX}" y="${unitLineY}" text-anchor="middle"
                            fill="${strokeColor}" font-size="${fontSize * 0.85}" font-weight="500"
                            opacity="0.55" font-family="inherit">${volUnit}</text>`;
                    } else {
                        svgContent += `<text x="${labelX}" y="${numLineY}" text-anchor="middle"
                            fill="${strokeColor}" font-size="${fontSize}" font-weight="600"
                            opacity="0.7" font-family="inherit">${volNum}</text>`;
                        svgContent += `<text x="${labelX}" y="${unitLineY}" text-anchor="middle"
                            fill="${strokeColor}" font-size="${fontSize * 0.85}" font-weight="500"
                            opacity="0.55" font-family="inherit">${volUnit}</text>`;
                    }
                }
            }
        }

        svg.innerHTML = svgContent;

        // Bind events for editable transfer volume inputs in the SVG
        if (state.allowMultipleFactors) {
            svg.style.pointerEvents = 'auto';
            svg.querySelectorAll('.connector-transfer-edit').forEach(input => {
                // Remove spinner buttons on webkit
                input.addEventListener('focus', () => { input.select(); });
                input.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.dataset.tubeIndex, 10);
                    const val = parseFloat(e.target.value);
                    if (isNaN(idx) || isNaN(val) || val <= 0) {
                        const prevFactor = getEffectiveFactor(idx);
                        e.target.value = formatValue(getEffectiveVolume(idx) / (prevFactor - 1));
                        return;
                    }
                    setPerTubeTransferVol(idx, val);
                });
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
                });
            });
        }
    }

    // ── Tube Rendering ─────────────────────────────────────────
    function renderTubes() {
        const data = getDilutionData();
        dom.dilutionTubes.innerHTML = '';

        data.forEach((d, i) => {
            const slot = createTubeSlot(d, i, data.length, data);
            dom.dilutionTubes.appendChild(slot);
        });

        // Append waste carboy when discard-last-excess is enabled
        if (state.discardLastExcess) {
            dom.dilutionTubes.appendChild(createWasteCarboy());
        }

        updateStockTube();
        autoSizeTubes();
    }

    function createTubeSlot(data, index, total, dilutionData) {
        const vis = getDilutionVisuals(index, total, dilutionData);
        const color = interpolateColor(state.colorScheme, vis.t);
        const alpha = vis.alpha;
        // When discard-last-excess is OFF the last tube keeps the transfer
        // aliquot that would otherwise go to waste, so its volume is
        // totalVolume instead of diluentVol → visually fuller.
        const isLastTube = (index === total - 1);
        let fillHeight = 80; // baseline fill representing diluentVol
        if (isLastTube && !state.discardLastExcess) {
            const factor = getEffectiveFactor(index);
            const ratio = factor / (factor - 1);
            fillHeight = Math.min(98, Math.round(80 * ratio));
        }
        // Bubble colour: contrast-matched to the liquid
        const bubbleColor = computeBubbleColor(color.r, color.g, color.b, alpha);

        ensureTubeNames();
        const tubeName = getTubeName(index);
        const fragment = document.createElement('div');
        fragment.innerHTML = `
            <div class="tube-slot" style="animation-delay: ${index * 60}ms">
                <div class="tube-label-top" contenteditable="true" spellcheck="false" data-tube-index="${index}">${tubeName}</div>
                <div class="tube-container" data-index="${index + 1}">
                    <div class="tube-body">
                        <div class="tube-glass">
                            <div class="tube-liquid" style="height: ${fillHeight}%; background: rgba(${color.r},${color.g},${color.b},${alpha}); --bubble-color: ${bubbleColor};">
                                <div class="tube-liquid-surface"></div>
                                <div class="tube-bubbles">
                                    <div class="bubble"></div>
                                    <div class="bubble"></div>
                                    <div class="bubble"></div>
                                </div>
                            </div>
                            <div class="tube-graduations">
                                <div class="graduation"></div>
                                <div class="graduation"></div>
                                <div class="graduation"></div>
                                <div class="graduation"></div>
                            </div>
                            <div class="tube-shine"></div>
                        </div>
                    </div>
                </div>
                <div class="tube-label-bottom">
                    <span class="conc-value">${formatConcentration(data.concentration)}</span>
                    <span class="conc-unit">${state.stockUnit}</span>
                </div>
            </div>
        `;

        // Return as document fragment
        const wrapper = document.createDocumentFragment();
        while (fragment.firstChild) {
            wrapper.appendChild(fragment.firstChild);
        }
        return wrapper;
    }

    /**
     * Create the waste carboy slot element (clear plastic bottle
     * with cap and biohazard logo). Shown as the last element
     * when "Discard last excess" is enabled.
     */
    function createWasteCarboy() {
        const fragment = document.createElement('div');
        fragment.innerHTML = `
            <div class="tube-slot waste-slot">
                <div class="tube-label-top">Waste</div>
                <div class="tube-container" data-index="waste">
                    <div class="carboy-body">
                        <svg class="carboy-svg" viewBox="0 0 80 105" preserveAspectRatio="xMidYMid meet">
                            <!-- Cap (1/3 wider) -->
                            <rect class="carboy-cap-rect" x="29.5" y="0" width="21" height="7" rx="2.5"/>
                            <!-- Cap rim (1/3 wider) -->
                            <rect class="carboy-rim-rect" x="26.5" y="5" width="27" height="4" rx="1.5"/>
                            <!-- Continuous bottle: wider neck \u2192 shoulder \u2192 compact body -->
                            <path class="carboy-bottle-path" d="M32,9 L32,27 L11,37 L11,97 Q11,105 19,105 L61,105 Q69,105 69,97 L69,37 L48,27 L48,9 Z"/>
                            <!-- Glass shine -->
                            <rect class="carboy-shine-rect" x="15" y="39" width="3" height="56" rx="1.5"/>
                        </svg>
                        <i class="fas fa-biohazard carboy-biohazard"></i>
                    </div>
                </div>
                <div class="tube-label-bottom">
                    <span class="conc-value">&nbsp;</span>
                    <span class="conc-unit">&nbsp;</span>
                </div>
            </div>
        `;

        const wrapper = document.createDocumentFragment();
        while (fragment.firstChild) {
            wrapper.appendChild(fragment.firstChild);
        }
        return wrapper;
    }

    function updateLiquidNames() {
        const diluentLabel = document.getElementById('diluent-liquid-name');
        if (diluentLabel) diluentLabel.textContent = state.diluentName || '';
        const stockLabel = document.getElementById('stock-liquid-name');
        if (stockLabel) stockLabel.textContent = state.stockName || '';
    }

    function updateStockTube() {
        const s = COLOR_SCHEMES[state.colorScheme];
        const stockLiquid = document.querySelector('#stock-tube-slot .tube-liquid');
        if (stockLiquid) {
            stockLiquid.style.background = `rgba(${s.start.join(',')}, 1)`;
            stockLiquid.style.height = '80%';
            stockLiquid.style.setProperty('--bubble-color', computeBubbleColor(s.start[0], s.start[1], s.start[2], 1));
        }
        // Update diluent tube - lightest shade of the scheme
        const diluentLiquid = document.querySelector('#diluent-tube-slot .tube-liquid');
        if (diluentLiquid) {
            diluentLiquid.style.background = `rgba(${s.end.join(',')}, 0.18)`;
            diluentLiquid.style.height = '80%';
            diluentLiquid.style.setProperty('--bubble-color', computeBubbleColor(s.end[0], s.end[1], s.end[2], 0.18));
        }
        updateLiquidNames();
        // Update diluent label (no visible text – diluent has no concentration)
        const diluentVolLabel = document.getElementById('diluent-vol-label');
        const diluentUnitLabel = document.getElementById('diluent-unit-label');
        if (diluentVolLabel) {
            diluentVolLabel.innerHTML = '&nbsp;';
        }
        if (diluentUnitLabel) {
            diluentUnitLabel.innerHTML = '&nbsp;';
        }
    }

    function updateExistingTubes() {
        const data = getDilutionData();
        const total = data.length;

        // Update stock tube
        updateStockTube();

        // Update dilution tubes
        const tubes = dom.dilutionTubes.querySelectorAll('.tube-slot:not(.waste-slot)');

        tubes.forEach((slot, i) => {
            if (i >= data.length) return;
            const d = data[i];
            const vis = getDilutionVisuals(i, total, data);
            const color = interpolateColor(state.colorScheme, vis.t);
            const alpha = vis.alpha;
            // Last tube keeps transfer aliquot when discard is OFF → fuller
            const isLastTube = (i === total - 1);
            let fillHeight = 80;
            if (isLastTube && !state.discardLastExcess) {
                const factor = getEffectiveFactor(i);
                const ratio = factor / (factor - 1);
                fillHeight = Math.min(98, Math.round(80 * ratio));
            }

            const liquid = slot.querySelector('.tube-liquid');
            if (liquid) {
                liquid.style.background = `rgba(${color.r},${color.g},${color.b},${alpha})`;
                liquid.style.height = fillHeight + '%';
                liquid.style.setProperty('--bubble-color', computeBubbleColor(color.r, color.g, color.b, alpha));
            }

            const concVal = slot.querySelector('.conc-value');
            if (concVal) concVal.textContent = formatConcentration(d.concentration);

            const concUnit = slot.querySelector('.conc-unit');
            if (concUnit) concUnit.textContent = state.stockUnit;
        });

        // SVG connectors will redraw via autoSizeTubes → requestConnectorRedraw
    }

    function addTubes(oldCount, newCount) {
        const data = getDilutionData();

        // Update existing tubes colors (since total changed)
        updateExistingTubes();

        // Find the insertion point: before the waste slot if present,
        // otherwise append to the end.
        const wasteSlot = dom.dilutionTubes.querySelector('.waste-slot');

        // Add new tubes (before the waste if it exists)
        for (let i = oldCount; i < newCount; i++) {
            const slot = createTubeSlot(data[i], i, data.length, data);
            if (wasteSlot) {
                dom.dilutionTubes.insertBefore(slot, wasteSlot);
            } else {
                dom.dilutionTubes.appendChild(slot);
            }
        }

        autoSizeTubes();
    }

    function removeTubes(oldCount, newCount) {
        const tubes = dom.dilutionTubes.querySelectorAll('.tube-slot:not(.waste-slot)');

        // Remove excess tubes with animation
        const toRemove = [];
        for (let i = newCount; i < oldCount; i++) {
            if (tubes[i]) {
                tubes[i].classList.add('removing');
                toRemove.push(tubes[i]);
            }
        }

        setTimeout(() => {
            toRemove.forEach(el => el.remove());
            // Update remaining tube colors
            updateExistingTubes();
            autoSizeTubes();
        }, 400);
    }

    /** Remove waste carboy from the DOM (if present). */
    function removeWasteFromDOM() {
        const wasteSlot = dom.dilutionTubes.querySelector('.waste-slot');
        if (wasteSlot) wasteSlot.remove();
    }

    /** Append a fresh waste carboy at the end of dilutionTubes if enabled. */
    function appendWasteIfEnabled() {
        if (state.discardLastExcess && !dom.dilutionTubes.querySelector('.waste-slot')) {
            dom.dilutionTubes.appendChild(createWasteCarboy());
        }
    }


    // ── Summary Table ──────────────────────────────────────────
    function renderSummary() {
        const data = getDilutionData();
        const s = COLOR_SCHEMES[state.colorScheme];
        ensureTubeNames();
        let html = '';
        const multi = state.allowMultipleFactors;
        const multiVol = state.allowMultipleVolumes;

        // Diluent total: sum all diluent volumes (may differ per tube in multi mode)
        const totalDiluentVol = data.reduce((sum, d) => sum + d.diluentVol, 0);
        const diluentRequired = totalDiluentVol + state.deadVolumeDiluent;

        // Diluent row
        const diluentDisplayName = state.diluentName ? `Diluent (${state.diluentName})` : 'Diluent';
        html += `<tr class="diluent-row">
            <td class="col-spacer"></td>
            <td><span class="tube-num"><span class="table-color-dot" style="background: var(--diluent-start)"></span>${diluentDisplayName}</span></td>
            <td class="col-spacer"></td>
            <td class="conc-cell">—</td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="tip-cell em-dash"></td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="tip-cell em-dash"></td>
            <td class="col-spacer"></td>
            <td><span class="vol-prefix">&gt; </span>${formatValue(diluentRequired)} ${state.volumeUnit}</td>
            <td class="col-spacer"></td>
        </tr>`;

        // Stock row – transfer vol = first tube's transfer vol
        const stockTransferVolume = data.length ? data[0].transferVol : state.totalVolume / state.dilutionFactor;
        const stockRequired = stockTransferVolume + state.deadVolumeStock;
        const stockDisplayName = state.stockName ? `Stock (${state.stockName})` : 'Stock';
        const stockRelatedUnits = getRelatedUnits(state.stockUnit);
        let stockUnitOptions = '';
        for (const u of stockRelatedUnits) {
            stockUnitOptions += `<option value="${u}"${u === state.stockUnit ? ' selected' : ''}>${u}</option>`;
        }
        html += `<tr class="stock-row">
            <td class="col-spacer"></td>
            <td><span class="tube-num"><span class="table-color-dot" style="background: rgb(${s.start.join(',')})"></span>${stockDisplayName}</span></td>
            <td class="col-spacer"></td>
            <td class="conc-cell"><span class="inline-editable inline-edit-stock-conc" contenteditable="true" spellcheck="false">${formatConcentration(state.stockConcentration)}</span> <select class="inline-unit-select stock-unit-select">${stockUnitOptions}</select></td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="tip-cell em-dash"></td>
            <td class="col-spacer"></td>
            <td class="em-dash">—</td>
            <td class="tip-cell em-dash"></td>
            <td class="col-spacer"></td>
            <td><span class="vol-prefix">&gt; </span>${formatValue(stockRequired)} ${state.volumeUnit}</td>
            <td class="col-spacer"></td>
        </tr>`;

        data.forEach((d, i) => {
            const total = data.length;
            const vis = getDilutionVisuals(i, total, data);
            const color = interpolateColor(state.colorScheme, vis.t);
            const tubeName = getTubeName(i);

            // Concentration cell – editable with unit selector in multi mode
            let concCell;
            if (multi) {
                ensurePerTubeUnits();
                const displayUnit = getEffectiveUnit(i);
                const concInUnit = convertConc(d.concentration, state.stockUnit, displayUnit);
                const relatedUnits = getRelatedUnits(state.stockUnit);
                let unitOptions = '';
                for (const u of relatedUnits) {
                    unitOptions += `<option value="${u}"${u === displayUnit ? ' selected' : ''}>${u}</option>`;
                }
                concCell = `<td class="conc-cell"><span class="inline-editable inline-edit-conc" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatConcentration(concInUnit)}</span> <select class="inline-unit-select" data-tube-index="${i}">${unitOptions}</select></td>`;
            } else {
                concCell = `<td class="conc-cell">${formatConcentration(d.concentration)} ${state.stockUnit}</td>`;
            }

            // Step dilution cell – editable in multi mode
            let stepDilutionCell;
            if (multi) {
                stepDilutionCell = `<td><div class="conc-pill-input"><span class="input-prefix-inline">1 :</span><span class="conc-pill-number inline-editable inline-edit-factor" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatDilution(d.stepDilution)}</span></div></td>`;
            } else {
                stepDilutionCell = `<td>1 : ${formatDilution(d.stepDilution)}</td>`;
            }

            // Cumulative dilution cell – editable in multi mode
            let cumulativeDilutionCell;
            if (multi) {
                cumulativeDilutionCell = `<td>1 : <span class="inline-editable inline-edit-cumulative" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatDilution(d.dilution)}</span></td>`;
            } else {
                cumulativeDilutionCell = `<td>1 : ${formatDilution(d.dilution)}</td>`;
            }

            // Transfer volume cell – editable in multi mode, with tip indicator
            ensureTipOverrides();
            const txOverride = state.perTubeTransferTip[i] != null ? state.perTubeTransferTip[i] : undefined;
            const txInfo = getEffectiveTipInfo(d.transferVol, txOverride);
            let transferTipCell = `<td class="tip-cell"${tipCellStyle(d.transferVol, txOverride)}>${tipIndicatorSVG(d.transferVol, txOverride, 'transfer', i)}</td>`;
            let transferCell;
            if (multi) {
                if (txInfo.cycles > 1) {
                    transferCell = `<td><span class="inline-editable inline-edit-transfer" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatValue(txInfo.perCycleVol)}</span> ${state.volumeUnit} × ${txInfo.cycles}</td>`;
                } else {
                    transferCell = `<td><span class="inline-editable inline-edit-transfer" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatValue(d.transferVol)}</span> ${state.volumeUnit}</td>`;
                }
            } else {
                if (txInfo.cycles > 1) {
                    transferCell = `<td>${formatValue(txInfo.perCycleVol)} ${state.volumeUnit} × ${txInfo.cycles}</td>`;
                } else {
                    transferCell = `<td>${formatValue(d.transferVol)} ${state.volumeUnit}</td>`;
                }
            }

            // Diluent volume cell – editable in multi mode, with tip indicator
            const dilOverride = state.perTubeDiluentTip[i] != null ? state.perTubeDiluentTip[i] : undefined;
            const dilInfo = getEffectiveTipInfo(d.diluentVol, dilOverride);
            let diluentTipCell = `<td class="tip-cell"${tipCellStyle(d.diluentVol, dilOverride)}>${tipIndicatorSVG(d.diluentVol, dilOverride, 'diluent', i)}</td>`;
            let diluentCell;
            if (multi) {
                if (dilInfo.cycles > 1) {
                    diluentCell = `<td><span class="inline-editable inline-edit-diluent" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatValue(dilInfo.perCycleVol)}</span> ${state.volumeUnit} × ${dilInfo.cycles}</td>`;
                } else {
                    diluentCell = `<td><span class="inline-editable inline-edit-diluent" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatValue(d.diluentVol)}</span> ${state.volumeUnit}</td>`;
                }
            } else {
                if (dilInfo.cycles > 1) {
                    diluentCell = `<td>${formatValue(dilInfo.perCycleVol)} ${state.volumeUnit} × ${dilInfo.cycles}</td>`;
                } else {
                    diluentCell = `<td>${formatValue(d.diluentVol)} ${state.volumeUnit}</td>`;
                }
            }

            // Validate volumes for this tube
            const MIN_VOL = 0.5; // µL – typical pipette minimum
            let rowErrors = [];
            if (d.transferVol < MIN_VOL) {
                rowErrors.push(`Transfer volume (${formatValue(d.transferVol)} ${state.volumeUnit}) is below pipettable minimum (${MIN_VOL} ${state.volumeUnit})`);
            }
            if (d.diluentVol < MIN_VOL && d.diluentVol > 0) {
                rowErrors.push(`Diluent volume (${formatValue(d.diluentVol)} ${state.volumeUnit}) is below pipettable minimum (${MIN_VOL} ${state.volumeUnit})`);
            }
            if (d.transferVol >= d.totalVol) {
                rowErrors.push(`Transfer volume (${formatValue(d.transferVol)} ${state.volumeUnit}) exceeds total volume (${formatValue(d.totalVol)} ${state.volumeUnit})`);
            }
            const hasError = rowErrors.length > 0;
            const errorIcon = hasError
                ? `<span class="row-error-icon"><i class="fas fa-exclamation-triangle"></i><span class="error-tooltip">${rowErrors.join('<br>')}</span></span>`
                : '';

            html += `<tr${hasError ? ' class="row-error"' : ''}>
                <td class="col-spacer"></td>
                <td><span class="tube-num"><span class="table-color-dot" style="background: rgba(${color.r},${color.g},${color.b},${vis.alpha})"></span><span class="tube-name-editable" contenteditable="true" spellcheck="false" data-tube-index="${i}">${tubeName}</span>${errorIcon}</span></td>
                <td class="col-spacer"></td>
                ${concCell}
                <td class="col-spacer"></td>
                ${stepDilutionCell}
                <td class="col-spacer"></td>
                ${cumulativeDilutionCell}
                <td class="col-spacer"></td>
                ${transferCell}
                ${transferTipCell}
                <td class="col-spacer"></td>
                ${diluentCell}
                ${diluentTipCell}
                <td class="col-spacer"></td>
                ${(() => {
                    // Resulting vol = totalVol minus outgoing transfer to next tube
                    let outgoing = 0;
                    if (i < data.length - 1) {
                        outgoing = data[i + 1].transferVol;
                    } else if (state.discardLastExcess) {
                        const lastFactor = getEffectiveFactor(i);
                        outgoing = d.totalVol / lastFactor;
                    }
                    const resultingVol = d.totalVol - outgoing;
                    return multiVol
                        ? `<td><span class="inline-editable inline-edit-totalvol" contenteditable="true" spellcheck="false" data-tube-index="${i}">${formatValue(d.totalVol)}</span> ${state.volumeUnit}<br><span class="resulting-vol">(${formatValue(resultingVol)} ${state.volumeUnit} remaining)</span></td>`
                        : `<td><span class="vol-prefix vol-prefix-hidden">&gt; </span>${formatValue(resultingVol)} ${state.volumeUnit}</td>`;
                })()}
                <td class="col-spacer"></td>
            </tr>`;
        });

        // Add waste row when discard last excess is enabled
        if (state.discardLastExcess) {
            // Waste transfer vol = same as last tube's incoming transfer vol
            const wasteTransferVol = data.length ? data[data.length - 1].transferVol : 0;
            ensureTipOverrides();
            const wasteOverride = state.perTubeTransferTip[data.length] != null ? state.perTubeTransferTip[data.length] : undefined;
            const wasteInfo = getEffectiveTipInfo(wasteTransferVol, wasteOverride);
            const wasteVolDisplay = wasteInfo.cycles > 1
                ? `${formatValue(wasteInfo.perCycleVol)} ${state.volumeUnit} × ${wasteInfo.cycles}`
                : `${formatValue(wasteTransferVol)} ${state.volumeUnit}`;
            html += `<tr class="waste-row">
                <td class="col-spacer"></td>
                <td><span class="tube-num"><span class="table-color-dot" style="background: #888"></span>Waste</span></td>
                <td class="col-spacer"></td>
                <td class="conc-cell em-dash">—</td>
                <td class="col-spacer"></td>
                <td class="em-dash">—</td>
                <td class="col-spacer"></td>
                <td class="em-dash">—</td>
                <td class="col-spacer"></td>
                <td>${wasteVolDisplay}</td>
                <td class="tip-cell"${tipCellStyle(wasteTransferVol, wasteOverride)}>${tipIndicatorSVG(wasteTransferVol, wasteOverride, 'transfer', data.length)}</td>
                <td class="col-spacer"></td>
                <td class="em-dash">—</td>
                <td class="tip-cell em-dash"></td>
                <td class="col-spacer"></td>
                <td><span class="vol-prefix">&gt; </span>${wasteVolDisplay}</td>
                <td class="col-spacer"></td>
            </tr>`;
        }

        dom.summaryTbody.innerHTML = html;

        // Bind stock unit selector change event
        const stockUnitSel = dom.summaryTbody.querySelector('.stock-unit-select');
        if (stockUnitSel) {
            stockUnitSel.addEventListener('change', (e) => {
                state.stockUnit = e.target.value;
                dom.stockUnit.value = e.target.value;
                recalculate();
                renderTubes();
                renderSummary();
            });
        }

        // Bind unit selector change events (multi-factor mode)
        if (multi) {
            dom.summaryTbody.querySelectorAll('.inline-unit-select:not(.stock-unit-select)').forEach(sel => {
                sel.addEventListener('change', (e) => {
                    const idx = parseInt(e.target.dataset.tubeIndex, 10);
                    if (isNaN(idx)) return;
                    ensurePerTubeUnits();
                    state.perTubeUnits[idx] = e.target.value;
                    // Re-render to update the displayed concentration value
                    renderSummary();
                });
            });
        }

        // Bind tip-select dropdown change events
        dom.summaryTbody.querySelectorAll('.tip-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const tipType  = e.target.dataset.tipType;   // 'transfer' | 'diluent'
                const tipIndex = parseInt(e.target.dataset.tipIndex, 10);
                if (isNaN(tipIndex)) return;
                ensureTipOverrides();
                const val = e.target.value;
                const arr = tipType === 'diluent' ? state.perTubeDiluentTip : state.perTubeTransferTip;
                if (val === 'auto') {
                    delete arr[tipIndex];
                } else {
                    arr[tipIndex] = parseInt(val, 10);
                }
                renderSummary();
            });
        });

        // Update materials overview
        renderMaterialsOverview(data);
    }

    // ── Materials Overview ─────────────────────────────────────
    function renderMaterialsOverview(data) {
        if (!dom.materialsCards) return;
        ensureTipOverrides();

        const n = data.length;
        const vUnit = state.volumeUnit;

        // ── 1. Solutions & Container Capacity ──
        // Stock needed: first tube's transfer vol + dead volume
        const stockNeeded = (n ? data[0].transferVol : 0) + state.deadVolumeStock;
        // Diluent needed: sum of all diluent volumes + dead volume
        const diluentNeeded = data.reduce((s, d) => s + d.diluentVol, 0) + state.deadVolumeDiluent;
        // Container capacity: max totalVol across tubes (transfer + diluent going IN)
        const containerCapacity = n ? Math.max(...data.map(d => d.totalVol)) : 0;

        // ── 2. Tip Counts ──
        // Count tips by category: each transfer step uses 1 tip (or same if no fresh tip)
        // Simple model: each tube gets 1 transfer tip + 1 diluent tip
        // Plus waste transfer tip if applicable
        const tipCounts = {};
        for (const t of TIP_SIZES) tipCounts[t.label] = 0;

        // Diluent tips
        // Multi-cycle: every cycle uses a brand new tip.
        // Single-cycle: depends on freshTipDiluent setting.
        let dilTipsUsed = 0;
        for (let i = 0; i < n; i++) {
            if (data[i].diluentVol <= 0) continue;
            const override = state.perTubeDiluentTip[i] != null ? state.perTubeDiluentTip[i] : undefined;
            const info = getEffectiveTipInfo(data[i].diluentVol, override);
            if (info.tip) {
                if (info.cycles > 1) {
                    // Multi-cycle: every single cycle is a brand new tip
                    tipCounts[info.tip.label] += info.cycles;
                } else if (state.freshTipDiluent || dilTipsUsed === 0) {
                    // Single cycle: 1 tip per tube (or 1 reused tip)
                    tipCounts[info.tip.label] += 1;
                }
                dilTipsUsed++;
            }
        }

        // Transfer tips (serial: each step uses fresh tip if freshTipSample)
        // Multi-cycle: every cycle uses a brand new tip.
        for (let i = 0; i < n; i++) {
            const override = state.perTubeTransferTip[i] != null ? state.perTubeTransferTip[i] : undefined;
            const info = getEffectiveTipInfo(data[i].transferVol, override);
            if (info.tip) {
                if (info.cycles > 1) {
                    // Multi-cycle: every single cycle is a brand new tip
                    tipCounts[info.tip.label] += info.cycles;
                } else if (state.freshTipSample || i === 0) {
                    tipCounts[info.tip.label] += 1;
                }
            }
        }

        // Waste transfer tip
        // Multi-cycle: every cycle uses a brand new tip.
        if (state.discardLastExcess && n > 0) {
            const wasteVol = data[n - 1].transferVol;
            const wasteOverride = state.perTubeTransferTip[n] != null ? state.perTubeTransferTip[n] : undefined;
            const wInfo = getEffectiveTipInfo(wasteVol, wasteOverride);
            if (wInfo.tip) {
                if (wInfo.cycles > 1) {
                    tipCounts[wInfo.tip.label] += wInfo.cycles;
                } else if (state.freshTipSample) {
                    tipCounts[wInfo.tip.label] += 1;
                }
            }
        }

        // Also count 1 extra tip for Phase1→Phase2 swap (always happens)
        // This is implicitly the first transfer tip, already counted

        // ── 3. Tube Counts ──
        const numStockTubes = 1;
        const numDiluentTubes = 1;
        const numDilutionTubes = n;
        const totalTubes = numStockTubes + numDiluentTubes + numDilutionTubes;

        // ── 4. Total Tips ──
        const totalTips = TIP_SIZES.reduce((sum, t) => sum + tipCounts[t.label], 0);

        // ── 5. Waste Volume ──
        let wasteVol = 0;
        if (state.discardLastExcess && n > 0) {
            wasteVol = data[n - 1].transferVol;
        }

        // ── Build HTML ──
        let html = '';

        // Card 1: Solutions
        html += `<div class="materials-card">
            <div class="materials-card-header">
                <i class="fas fa-flask"></i>
                <span>Solutions</span>
            </div>
            <div class="materials-card-body">
                <div class="materials-row">
                    <span class="materials-label">Stock Required</span>
                    <span class="materials-value">&gt; ${formatValue(stockNeeded)} ${vUnit}</span>
                </div>
                <div class="materials-row">
                    <span class="materials-label">Diluent Required</span>
                    <span class="materials-value">&gt; ${formatValue(diluentNeeded)} ${vUnit}</span>
                </div>
                <div class="materials-row">
                    <span class="materials-label">Dilution Container Capacity</span>
                    <span class="materials-value">${formatValue(containerCapacity)} ${vUnit}</span>
                </div>
            </div>
        </div>`;

        // Card 2: Tips
        const tipEntries = TIP_SIZES.filter(t => tipCounts[t.label] > 0);
        html += `<div class="materials-card">
            <div class="materials-card-header">
                <i class="fas fa-syringe"></i>
                <span>Tips</span>
            </div>
            <div class="materials-card-body">`;
        if (tipEntries.length === 0) {
            html += `<div class="materials-row"><span class="materials-label">No tips required</span></div>`;
        }
        for (const t of tipEntries) {
            const st = TIP_STYLE[t.label] || {};
            html += `<div class="materials-row">
                <span class="materials-label">
                    <span class="materials-tip-dot" style="background:${st.icon || t.color}"></span>
                    ${t.nominal} µL – ${t.label}
                </span>
                <span class="materials-value">${tipCounts[t.label]}</span>
            </div>`;
        }
        html += `<div class="materials-row materials-row-total">
                <span class="materials-label">Total Tips</span>
                <span class="materials-value">${totalTips}</span>
            </div>`;
        html += `</div></div>`;

        // Card 3: Tubes
        html += `<div class="materials-card">
            <div class="materials-card-header">
                <i class="fas fa-vial"></i>
                <span>Tubes</span>
            </div>
            <div class="materials-card-body">
                <div class="materials-row">
                    <span class="materials-label">Stock</span>
                    <span class="materials-value">${numStockTubes}</span>
                </div>
                <div class="materials-row">
                    <span class="materials-label">Diluent</span>
                    <span class="materials-value">${numDiluentTubes}</span>
                </div>
                <div class="materials-row">
                    <span class="materials-label">Dilution</span>
                    <span class="materials-value">${numDilutionTubes}</span>
                </div>
                <div class="materials-row materials-row-total">
                    <span class="materials-label">Total Tubes</span>
                    <span class="materials-value">${totalTubes}</span>
                </div>
            </div>
        </div>`;

        // Card 4: Waste
        html += `<div class="materials-card">
            <div class="materials-card-header">
                <i class="fas fa-trash-can"></i>
                <span>Waste</span>
            </div>
            <div class="materials-card-body">
                <div class="materials-row">
                    <span class="materials-label">Approx. Waste Volume</span>
                    <span class="materials-value">${wasteVol > 0 ? '&gt; ' + formatValue(wasteVol) + ' ' + vUnit : '—'}</span>
                </div>
            </div>
        </div>`;

        dom.materialsCards.innerHTML = html;
    }

    // ── Pipette Tip Element ───────────────────────────────────
    /**
     * Create a pipette tip DOM element.
     * @param {string} [tipGlowColor] - Optional CSS color for barcode-class glow.
     */
    function createPipetteElement(tipGlowColor) {
        const el = document.createElement('div');
        el.className = 'pipette-anim';
        el.innerHTML = `
            <svg viewBox="0 0 30 100" xmlns="http://www.w3.org/2000/svg" class="pip-svg">
                <defs>
                    <clipPath id="pipClip">
                        <path d="M7.5,1.5 L22.5,1.5 L22.5,21 L18,25 L18,75 L15.8,95 Q15,98 14.2,95 L12,75 L12,25 L7.5,21 Z"/>
                    </clipPath>
                    <linearGradient id="pipBodyGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stop-color="rgba(50,50,55,0.5)"/>
                        <stop offset="25%"  stop-color="rgba(25,25,30,0.7)"/>
                        <stop offset="50%"  stop-color="rgba(35,35,40,0.65)"/>
                        <stop offset="75%"  stop-color="rgba(25,25,30,0.7)"/>
                        <stop offset="100%" stop-color="rgba(50,50,55,0.5)"/>
                    </linearGradient>
                    <linearGradient id="pipShineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"  stop-color="rgba(255,255,255,0)"/>
                        <stop offset="15%" stop-color="rgba(255,255,255,0.45)"/>
                        <stop offset="30%" stop-color="rgba(255,255,255,0.12)"/>
                        <stop offset="60%" stop-color="rgba(255,255,255,0.02)"/>
                        <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
                    </linearGradient>
                </defs>
                <!-- Semi-transparent body -->
                <path class="pip-body" d="M6,0 L24,0 L24,22 L19,26 L19,76 L16,97 Q15,100 14,97 L11,76 L11,26 L6,22 Z"
                      fill="url(#pipBodyGrad)" stroke="rgba(0,0,0,0.18)" stroke-width="0.5"/>
                <!-- Liquid fill inside (clipped to interior) -->
                <g clip-path="url(#pipClip)">
                    <rect class="pip-liquid" x="7" y="1" width="16" height="98"/>
                </g>
                <!-- Glass-like shine -->
                <path class="pip-shine" d="M6,0 L24,0 L24,22 L19,26 L19,76 L16,97 Q15,100 14,97 L11,76 L11,26 L6,22 Z"
                      fill="url(#pipShineGrad)" opacity="0.85"/>
                <!-- Left edge highlight for 3D roundness -->
                <path class="pip-edge-hl" d="M7.5,2 L7.5,21 L12,25 L12,74"
                      fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="0.6"/>
                <!-- Right subtle rim -->
                <path class="pip-edge-rim" d="M22.5,2 L22.5,21 L18,25 L18,74"
                      fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="0.4"/>
            </svg>
        `;
        // Apply barcode-class glow if a tip color is provided
        if (tipGlowColor) {
            el.style.setProperty('--tip-glow-color', tipGlowColor);
            el.classList.add('tip-glow');
        }
        return el;
    }

    function setPipetteLiquidFill(pipette, color, fillFraction) {
        const rect = pipette.querySelector('.pip-liquid');
        if (!rect) return;
        if (color) rect.style.fill = color;
        // scaleY(0) = empty, scaleY(1) = full; grows from bottom via transform-origin
        rect.style.transform = `scaleY(${fillFraction})`;
    }

    function getGlassRect(slot) {
        return slot.querySelector('.tube-glass') || slot.querySelector('.carboy-body');
    }

    function getSlotCenter(slot, vizRect, vizArea) {
        const glass = getGlassRect(slot);
        if (!glass) return { x: 0, y: 0, h: 0, liquidH: 0 };
        const r = glass.getBoundingClientRect();
        // Grab the current liquid fill height so we can position the tip at the surface
        const liquid = slot.querySelector('.tube-liquid');
        const liquidPct = liquid ? (parseFloat(liquid.style.height) || 0) : 0;
        // Account for scroll offset so the pipette stays anchored to the content
        const scrollX = vizArea ? vizArea.scrollLeft : 0;
        const scrollY = vizArea ? vizArea.scrollTop  : 0;
        return {
            x: r.left + r.width / 2 - vizRect.left + scrollX,
            y: r.top - vizRect.top + scrollY,
            h: r.height,
            liquidH: liquidPct,
        };
    }

    // ── Dilution Sequence Animation (Two-Phase Protocol) ─────
    // Phase 1: Distribute diluent into every dilution tube
    // Phase 2: Serial transfer stock → D1 → D2 → … → waste
    // Each phase uses the pipette tip; "fresh tip" swaps tip between pipetting tasks.

    /**
     * Helper: perform a single pipette transfer cycle.
     * source/dest are tube-slot DOM elements.
     * liquidColor - CSS colour string for the liquid shown inside the tip.
     * fillInfo - { height, background, bubbleColor } to set on dest liquid, or null for waste.
     */
    /**
     * Clamp the pipette top so the tip (bottom of SVG) never goes below the
     * tube bottom and never sits entirely below the liquid surface.
     *   tubeY / tubeH  - bounding rect of the tube-glass in vizArea coords
     *   liquidH        - current liquid fill in % (0-100)
     *   pipH           - rendered pipette height in px
     */
    function safePipetteTop(tubeY, tubeH, liquidH, pipH) {
        const liquidSurface = tubeY + tubeH * (1 - liquidH / 100);
        const liquidColH    = tubeH * (liquidH / 100);
        // Dip just a small amount into the liquid (max 15 % of column or 8 px)
        const dip   = Math.min(liquidColH * 0.15, 8);
        const target = liquidSurface + dip - pipH;           // tip at surface + dip
        const floor  = tubeY + tubeH - pipH - 4;             // tip stays ≥ 4 px above tube bottom
        const ceil   = tubeY - pipH * 0.5;                   // don't float too far above tube
        return Math.max(ceil, Math.min(target, floor));
    }

    async function pipetteTransfer(pipette, vizArea, sourceSlot, destSlot, liquidColor, fillInfo, pipH, isFirstMove, aspirateDrop) {
        const vizRect = vizArea.getBoundingClientRect();
        const src = getSlotCenter(sourceSlot, vizRect, vizArea);
        const dst = getSlotCenter(destSlot, vizRect, vizArea);

        // ── 1. Position above source ──
        if (isFirstMove) {
            pipette.style.transition = 'none';
            pipette.style.left = src.x + 'px';
            pipette.style.top = (src.y - pipH - 8) + 'px';
            void pipette.offsetWidth;
            pipette.style.transition = '';
            pipette.style.opacity = '1';
            await sleep(200);
        } else {
            // Move over from wherever we are
            pipette.style.left = src.x + 'px';
            pipette.style.top = (src.y - pipH - 8) + 'px';
            await sleep(350);
        }

        // ── 2. Descend to liquid surface in source (clamped) ──
        sourceSlot.classList.add('tube-active');
        pipette.style.top = safePipetteTop(src.y, src.h, src.liquidH, pipH) + 'px';
        await sleep(350);

        // ── 3. Aspirate - tip follows liquid level down ──
        const sourceLiquid = sourceSlot.querySelector('.tube-liquid');
        if (sourceLiquid) {
            sourceLiquid.classList.add('extracting');
            const currentH = parseFloat(sourceLiquid.style.height) || 80;
            const drop = (aspirateDrop != null) ? aspirateDrop : 6;
            const newH = Math.max(2, currentH - drop);
            sourceLiquid.style.height = newH + '%';
            // Move tip to track the new (lower) liquid surface
            pipette.style.top = safePipetteTop(src.y, src.h, newH, pipH) + 'px';
        }
        setPipetteLiquidFill(pipette, liquidColor, 0.6);
        await sleep(400);
        if (sourceLiquid) sourceLiquid.classList.remove('extracting');


        // ── 4. Rise out ──
        pipette.style.top = (src.y - pipH - 8) + 'px';
        await sleep(300);
        sourceSlot.classList.remove('tube-active');

        // ── 5. Move to destination ──
        pipette.style.left = dst.x + 'px';
        pipette.style.top = (dst.y - pipH - 8) + 'px';
        await sleep(400);

        // ── 6. Descend into destination (clamped) ──
        destSlot.classList.add('tube-active');
        const isWaste = destSlot.classList.contains('waste-slot');
        pipette.style.top = safePipetteTop(dst.y, dst.h, dst.liquidH, pipH) + 'px';
        await sleep(350);

        // ── 7. Dispense ──
        setPipetteLiquidFill(pipette, liquidColor, 0);
        const destLiquid = destSlot.querySelector('.tube-liquid');

        if (destLiquid && !isWaste && fillInfo) {
            destLiquid.style.transition = 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.6s ease';
            destLiquid.style.background = fillInfo.background;
            destLiquid.style.height = fillInfo.height + '%';
            destLiquid.style.setProperty('--bubble-color', fillInfo.bubbleColor);
            destLiquid.classList.add('pouring');
            const glass = destSlot.querySelector('.tube-glass');
            if (glass) glass.classList.add('tube-pulse');
        } else if (isWaste) {
            const carboy = destSlot.querySelector('.carboy-body');
            if (carboy) carboy.classList.add('carboy-pulse');
        }

        // ── 8. Follow liquid up (clamped to new fill level) ──
        const newFillPct = (destLiquid && !isWaste) ? (parseFloat(destLiquid.style.height) || 0) : 0;
        pipette.style.top = safePipetteTop(dst.y, dst.h, newFillPct, pipH) + 'px';
        await sleep(550);

        // ── 9. Rise out ──
        pipette.style.top = (dst.y - pipH - 8) + 'px';
        destSlot.classList.remove('tube-active');
        if (destLiquid) destLiquid.classList.remove('pouring');
        const glass2 = destSlot.querySelector('.tube-glass');
        if (glass2) glass2.classList.remove('tube-pulse');
        const carboyEl = destSlot.querySelector('.carboy-body');
        if (carboyEl) carboyEl.classList.remove('carboy-pulse');
        await sleep(250);
    }

    /** Swap to a fresh tip: fade out old, create new, fade in.
     *  @param {string} [tipGlowColor] - CSS color for barcode-class glow ring. */
    async function swapTip(oldPipette, vizArea, tipGlowColor) {
        oldPipette.style.opacity = '0';
        await sleep(300);
        oldPipette.remove();
        const newPip = createPipetteElement(tipGlowColor);
        vizArea.appendChild(newPip);
        return newPip;
    }

    /**
     * Perform in-tube mixing: pipette moves with the liquid, aspirating and
     * re-dispensing `steps` times. The visible liquid oscillates proportionally
     * to mixFraction (= mixVolume / tubeVolume).
     *
     * @param {HTMLElement} pipette        - The current live pipette element
     * @param {HTMLElement} vizArea        - The visualisation container
     * @param {HTMLElement} slot           - The tube-slot being mixed
     * @param {string}      liquidColor    - CSS colour for the pipette fill
     * @param {number}      steps          - Number of aspirate/dispense cycles
     * @param {number}      mixFraction    - mixVolume / tubeVolume (0–1)
     * @param {number}      pipH           - Rendered height of the pipette SVG
     */
    async function performMix(pipette, vizArea, slot, liquidColor, steps, mixFraction, pipH, isFirstMove) {
        const vizRect  = vizArea.getBoundingClientRect();
        const liquid   = slot.querySelector('.tube-liquid');
        if (!liquid) return;

        // Clamp fraction so visual swing looks natural (max 40 % of tube height)
        const swing = Math.min(mixFraction, 0.40);

        // ── Position & reveal the pipette if this is the first action after tip swap ──
        const initInfo = getSlotCenter(slot, vizRect, vizArea);
        if (isFirstMove) {
            pipette.style.transition = 'none';
            pipette.style.left = initInfo.x + 'px';
            pipette.style.top  = (initInfo.y - pipH - 8) + 'px';
            void pipette.offsetWidth;               // force reflow
            pipette.style.transition = '';
            pipette.style.opacity = '1';
            await sleep(200);
        } else {
            // Move over to the tube from wherever we are
            pipette.style.left = initInfo.x + 'px';
            pipette.style.top  = (initInfo.y - pipH - 8) + 'px';
            await sleep(350);
        }

        slot.classList.add('tube-active');

        for (let i = 0; i < steps; i++) {
            // Re-read geometry each cycle as the tube may have shifted
            const info       = getSlotCenter(slot, vizRect, vizArea);
            const baseHeight = parseFloat(liquid.style.height) || 80;

            // ── Descend to current liquid surface ──
            pipette.style.transition = 'top 0.18s ease, left 0.18s ease';
            pipette.style.top = safePipetteTop(info.y, info.h, baseHeight, pipH) + 'px';
            await sleep(200);

            // ── Aspirate: liquid drops, pipette fills ──
            const aspiratedH = Math.max(6, baseHeight - swing * 80);
            liquid.style.transition = 'height 0.22s ease, background 0.3s ease';
            liquid.style.height     = aspiratedH + '%';
            setPipetteLiquidFill(pipette, liquidColor, swing * 1.2);          // slight over-fill for realism
            // Tip follows liquid surface down
            pipette.style.top = safePipetteTop(info.y, info.h, aspiratedH, pipH) + 'px';
            await sleep(240);

            // ── Dispense: liquid rises, pipette empties ──
            liquid.style.height = baseHeight + '%';
            setPipetteLiquidFill(pipette, liquidColor, 0);
            // Tip follows liquid surface back up
            pipette.style.top = safePipetteTop(info.y, info.h, baseHeight, pipH) + 'px';
            await sleep(220);
        }

        slot.classList.remove('tube-active');

        // Rise clear of the tube so the tip-swap / next-move looks clean
        const finalInfo = getSlotCenter(slot, vizRect, vizArea);
        pipette.style.top = (finalInfo.y - pipH - 8) + 'px';
        await sleep(220);
    }

    async function playDilutionSequence() {
        if (state.isAnimating) return;
        state.isAnimating = true;
        dom.btnAnimate.classList.add('animating');
        dom.btnAnimate.querySelector('i').className = 'fas fa-spinner fa-spin';
        dom.btnAnimate.querySelector('span').textContent = 'Animating...';

        const vizArea = document.querySelector('.viz-area');
        const diluentSlot = document.querySelector('#diluent-tube-slot');
        const stockSlot = document.querySelector('#stock-tube-slot');
        const dilutionSlots = [...dom.dilutionTubes.querySelectorAll('.tube-slot:not(.waste-slot)')];
        const wasteSlot = dom.dilutionTubes.querySelector('.waste-slot');

        const data = getDilutionData();
        const total = data.length;
        const s = COLOR_SCHEMES[state.colorScheme];

        // Diluent color - very light / translucent
        const diluentColor = `rgba(${s.end.join(',')}, 0.18)`;

        // ── Volume math for proportional liquid levels ──
        const totalDiluentUsed = data.reduce((s, d) => s + d.diluentVol, 0);
        const totalDiluentInTube = totalDiluentUsed + state.deadVolumeDiluent;
        const stockUsed = total ? data[0].transferVol : 0;
        const totalStockInTube = stockUsed + state.deadVolumeStock;

        // ── Reset all dilution tubes to empty ──
        dilutionSlots.forEach(slot => {
            const liquid = slot.querySelector('.tube-liquid');
            if (liquid) {
                liquid.style.transition = 'height 0.3s ease';
                liquid.style.height = '0%';
                liquid.style.background = diluentColor;
            }
        });
        await sleep(500);

        // Neutralise entrance-animation stacking contexts
        dom.tubeRack.classList.add('pipette-playing');

        let pipette = createPipetteElement();
        vizArea.appendChild(pipette);
        const pipH = 73;
        let isFirstMove = true;

        // ═════════════════════════════════════════════════════
        // PHASE 1 - Distribute diluent into each dilution tube
        //           (skip tubes with 0 diluent, e.g. 1:1 factor)
        // ═════════════════════════════════════════════════════
        let didAnyDiluent = false;
        for (let i = 0; i < dilutionSlots.length; i++) {
            // Determine per-tube diluent volume
            const tubeDiluentVol = (i < data.length) ? data[i].diluentVol : 0;
            if (tubeDiluentVol <= 0) continue;  // 1:1 factor → no diluent needed

            const destSlot = dilutionSlots[i];
            const diluentFrac = tubeDiluentVol / state.totalVolume;
            const diluentFillH = Math.max(8, diluentFrac * 80);
            const fillInfo = {
                height: diluentFillH,
                background: diluentColor,
                bubbleColor: computeBubbleColor(s.end[0], s.end[1], s.end[2], 0.18),
            };

            // ── Multi-cycle support for diluent transfers ──
            ensureTipOverrides();
            const dilOverride = state.perTubeDiluentTip[i] != null
                ? state.perTubeDiluentTip[i] : undefined;
            const dilInfo = getEffectiveTipInfo(tubeDiluentVol, dilOverride);
            const dilCycles = dilInfo.cycles || 1;

            for (let c = 0; c < dilCycles; c++) {
                // Only set fillInfo on last cycle so tube fills at the end
                const cycleFillInfo = (c === dilCycles - 1) ? fillInfo : null;
                // Volume-proportional drop for diluent aspiration
                const perCycleDilVol = tubeDiluentVol / dilCycles;
                const dilAspirateDrop = totalDiluentInTube > 0 ? 80 * perCycleDilVol / totalDiluentInTube : 6;
                await pipetteTransfer(
                    pipette, vizArea, diluentSlot, destSlot,
                    diluentColor, cycleFillInfo, pipH, isFirstMove, dilAspirateDrop
                );
                isFirstMove = false;
            }
            didAnyDiluent = true;

            // Fresh tip between diluent transfers if toggled
            if (state.freshTipDiluent && i < dilutionSlots.length - 1) {
                // Only swap if there's a future diluent transfer coming
                const hasMoreDiluent = data.slice(i + 1).some(d => d.diluentVol > 0);
                if (hasMoreDiluent) {
                    pipette = await swapTip(pipette, vizArea);
                    isFirstMove = true;
                }
            }
        }

        // ═════════════════════════════════════════════════════
        // PHASE 2 - Serial transfer: stock → D1 → D2 → … → waste
        // ═════════════════════════════════════════════════════
        // Always swap tip between Phase 1 and Phase 2
        // Determine glow color from first transfer tip
        const firstTxOverride = state.perTubeTransferTip[0] != null ? state.perTubeTransferTip[0] : undefined;
        const firstTxVol = data.length ? data[0].transferVol : 0;
        const firstTxInfo = getEffectiveTipInfo(firstTxVol, firstTxOverride);
        const firstTxGlow = firstTxInfo.tip ? firstTxInfo.tip.color : null;
        pipette = await swapTip(pipette, vizArea, firstTxGlow);
        isFirstMove = true;

        // Build the list of serial transfer sources/dests
        const serialSlots = [stockSlot, ...dilutionSlots];
        if (wasteSlot) serialSlots.push(wasteSlot);
        const serialSteps = wasteSlot ? dilutionSlots.length + 1 : dilutionSlots.length;

        for (let i = 0; i < serialSteps; i++) {
            const sourceSlot = serialSlots[i];
            const destSlot = serialSlots[i + 1];
            if (!sourceSlot || !destSlot) break;

            const isWaste = destSlot.classList.contains('waste-slot');

            // ── Mixing step BEFORE transfer (mix source tube, skip stock) ──
            if (state.mixEnabled && i > 0 && !sourceSlot.classList.contains('waste-slot')) {
                const srcLiquid  = sourceSlot.querySelector('.tube-liquid');
                const srcColor   = srcLiquid
                    ? (srcLiquid.style.background || getComputedStyle(srcLiquid).backgroundColor)
                    : `rgba(${s.start.join(',')}, 1)`;
                const srcIdx     = i - 1;  // dilution tube index for source
                const tubeVol    = getEffectiveVolume(srcIdx);
                const mixFrac    = tubeVol > 0 ? Math.min(1, state.mixVolume / tubeVol) : 0.2;
                await performMix(pipette, vizArea, sourceSlot, srcColor, state.mixSteps, mixFrac, pipH, isFirstMove);
                isFirstMove = false;
            }

            // Determine the liquid color that the tip picks up from the source
            const sourceLiquid = sourceSlot.querySelector('.tube-liquid');
            let liquidColor = `rgba(${s.start.join(',')}, 1)`;  // default stock color
            if (sourceLiquid) {
                liquidColor = sourceLiquid.style.background || getComputedStyle(sourceLiquid).backgroundColor;
            }

            // Determine what the destination looks like after transfer
            // For progressive color: diluent base color already in the tube
            const diluentR = s.end[0], diluentG = s.end[1], diluentB = s.end[2];
            const diluentAlpha = 0.18;

            // Final target colour for this tube
            let finalColor = null, finalAlpha = 1;
            if (!isWaste && i < data.length) {
                const vis = getDilutionVisuals(i, total, data);
                finalColor = interpolateColor(state.colorScheme, vis.t);
                finalAlpha = vis.alpha;
            }

            // ── Multi-cycle support: if tip override requires multiple aspirations ──
            ensureTipOverrides();
            const transferIdx = i;   // tube index for this transfer step
            const txOverride = state.perTubeTransferTip[transferIdx] != null
                ? state.perTubeTransferTip[transferIdx] : undefined;
            const transferVol = (i < data.length) ? data[i].transferVol
                : (data.length ? data[data.length - 1].transferVol : 0);
            const txInfo = getEffectiveTipInfo(transferVol, txOverride);
            const numCycles = txInfo.cycles || 1;
            const txGlow = txInfo.tip ? txInfo.tip.color : null;

            for (let c = 0; c < numCycles; c++) {
                // Each cycle in a multi-cycle transfer gets a brand new tip
                if (c > 0) {
                    pipette = await swapTip(pipette, vizArea, txGlow);
                    isFirstMove = true;
                }

                // Build progressive fillInfo: colour fades from diluent → final over cycles
                let cycleFillInfo = null;
                if (!isWaste && finalColor) {
                    const frac = (c + 1) / numCycles;  // 0→1 over cycles
                    // Linearly interpolate RGB and alpha from diluent base toward final
                    const cR = Math.round(diluentR + (finalColor.r - diluentR) * frac);
                    const cG = Math.round(diluentG + (finalColor.g - diluentG) * frac);
                    const cB = Math.round(diluentB + (finalColor.b - diluentB) * frac);
                    const cA = diluentAlpha + (finalAlpha - diluentAlpha) * frac;
                    const fillHeight = 80; // final fill height
                    cycleFillInfo = {
                        height: fillHeight,
                        background: `rgba(${cR},${cG},${cB},${cA})`,
                        bubbleColor: computeBubbleColor(cR, cG, cB, cA),
                    };
                }

                // Volume-proportional drop for stock aspiration (only first serial step sources from stock)
                let aspirateDrop;
                if (i === 0) {
                    const perCycleStockVol = transferVol / numCycles;
                    aspirateDrop = totalStockInTube > 0 ? 80 * perCycleStockVol / totalStockInTube : 6;
                }
                await pipetteTransfer(
                    pipette, vizArea, sourceSlot, destSlot,
                    liquidColor, cycleFillInfo, pipH, isFirstMove, aspirateDrop
                );
                isFirstMove = false;
            }

            // Fresh tip between sample dilutions if toggled
            if (state.freshTipSample && i < serialSteps - 1) {
                // Look ahead to next transfer step's tip color
                const nextI = i + 1;
                const nextTxOverride = state.perTubeTransferTip[nextI] != null ? state.perTubeTransferTip[nextI] : undefined;
                const nextTxVol = (nextI < data.length) ? data[nextI].transferVol
                    : (data.length ? data[data.length - 1].transferVol : 0);
                const nextTxInfo = getEffectiveTipInfo(nextTxVol, nextTxOverride);
                const nextTxGlow = nextTxInfo.tip ? nextTxInfo.tip.color : null;
                pipette = await swapTip(pipette, vizArea, nextTxGlow);
                isFirstMove = true;
            }
        }

        // ── Mix the last dilution tube after all transfers ──
        if (state.mixEnabled) {
            const lastIdx  = dilutionSlots.length - 1;
            const lastSlot = dilutionSlots[lastIdx];
            if (lastSlot) {
                const lastLiquid = lastSlot.querySelector('.tube-liquid');
                const lastColor  = lastLiquid
                    ? (lastLiquid.style.background || getComputedStyle(lastLiquid).backgroundColor)
                    : `rgba(${s.end.join(',')}, 0.18)`;
                const tubeVol    = getEffectiveVolume(lastIdx);
                const mixFrac    = tubeVol > 0 ? Math.min(1, state.mixVolume / tubeVol) : 0.2;
                await performMix(pipette, vizArea, lastSlot, lastColor, state.mixSteps, mixFrac, pipH, isFirstMove);
            }
        }

        // ── Cleanup ──
        pipette.style.opacity = '0';
        await sleep(400);
        pipette.remove();
        dom.tubeRack.classList.remove('pipette-playing');

        // Restore stock tube to dead-volume level (proportional)
        const stockLiquid = stockSlot.querySelector('.tube-liquid');
        if (stockLiquid) {
            const stockDeadPct = totalStockInTube > 0 ? 80 * state.deadVolumeStock / totalStockInTube : 2;
            stockLiquid.style.transition = 'height 0.6s ease';
            stockLiquid.style.height = Math.max(2, stockDeadPct) + '%';
        }
        // Restore diluent tube to dead-volume level (proportional)
        const diluentLiquid = diluentSlot.querySelector('.tube-liquid');
        if (diluentLiquid) {
            const diluentDeadPct = totalDiluentInTube > 0 ? 80 * state.deadVolumeDiluent / totalDiluentInTube : 2;
            diluentLiquid.style.transition = 'height 0.6s ease';
            diluentLiquid.style.height = Math.max(2, diluentDeadPct) + '%';
        }

        state.isAnimating = false;
        dom.btnAnimate.classList.remove('animating');
        dom.btnAnimate.querySelector('i').className = 'fas fa-play';
        dom.btnAnimate.querySelector('span').textContent = 'Play Dilution Sequence';
        showToast('Dilution sequence complete!', 'success');
    }

    // ── Theme Toggle ───────────────────────────────────────────
    function toggleTheme() {
        state.isDark = !state.isDark;
        applyTheme();
    }

    function applyTheme() {
        if (state.isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            dom.btnTheme.querySelector('i').className = 'fas fa-sun';
        } else {
            document.documentElement.removeAttribute('data-theme');
            dom.btnTheme.querySelector('i').className = 'fas fa-moon';
        }
        try { localStorage.setItem('dilution-dark-mode', state.isDark ? '1' : '0'); } catch(e) {}
    }

    // ── Labware Modal ──────────────────────────────────────────
    const labwareModalState = {
        target: '',         // 'diluent' | 'stock' | 'dilutions'
        type: '',           // 'tube' | 'plate' | 'trough'
        size: '',           // e.g. '96', '1 mL', '300 mL'
        holderFormat: '',   // 'sbs' | 'carrier'
        definition: '',     // catalog entry id
        position: '',       // e.g. 'A1', 'Pos 1'  (for stock/diluent single-select)
        positions: [],      // ordered array of well IDs (for dilutions multi-select)
        step: 'type',       // current visible step
        history: [],        // stack of previously shown steps (for Back)
    };

    /** Return list of step names for progress dots based on current type */
    function getLabwareSteps() {
        const type = labwareModalState.type;
        if (type === 'tube')   return ['type', 'size', 'holder', 'definition', 'position'];
        if (type === 'trough') return ['type', 'size', 'definition', 'position'];
        if (type === 'plate')  return ['type', 'size', 'definition', 'position'];
        return ['type']; // type not yet chosen
    }

    /** Human label for each step key */
    function getStepLabel(step) {
        return { type: 'Type', size: 'Size', holder: 'Holder', definition: 'Definition', position: 'Position' }[step] || step;
    }

    function openLabwareModal(target) {
        const titleMap = {
            diluent: 'Configure Diluent Labware',
            stock: 'Configure Stock Labware',
            dilutions: 'Configure Dilutions Labware',
        };
        labwareModalState.target = target;
        labwareModalState.history = [];

        // Pre-populate from existing config
        const existing = state[target + 'Labware'];
        if (existing && existing.definition) {
            labwareModalState.type = existing.type;
            labwareModalState.size = existing.size || '';
            labwareModalState.holderFormat = existing.holderFormat || '';
            labwareModalState.definition = existing.definition;
            labwareModalState.position = existing.position || '';
            labwareModalState.positions = existing.positions ? [...existing.positions] : [];
        } else {
            labwareModalState.type = '';
            labwareModalState.size = '';
            labwareModalState.holderFormat = '';
            labwareModalState.definition = '';
            labwareModalState.position = '';
            labwareModalState.positions = [];
        }

        dom.labwareModalTitle.textContent = titleMap[target] || 'Configure Labware';

        // Resume at the deepest valid step
        if (labwareModalState.definition) {
            const steps = getLabwareSteps();
            const posIdx = steps.indexOf('position');
            labwareModalState.history = steps.slice(0, posIdx);
            showLabwareStep('position');
        } else if (labwareModalState.holderFormat && labwareModalState.type === 'tube') {
            labwareModalState.history = ['type', 'size', 'holder'];
            showLabwareStep('definition');
        } else if (labwareModalState.size) {
            labwareModalState.history = ['type'];
            showLabwareStep(labwareModalState.type === 'tube' ? 'holder' : 'definition');
        } else if (labwareModalState.type) {
            showLabwareStep('size');
        } else {
            showLabwareStep('type');
        }

        toggleModal(dom.labwareModal, true);
    }

    /** Render the dynamic progress dots into the header bar */
    function renderProgressDots() {
        const steps = getLabwareSteps();
        const currentIdx = steps.indexOf(labwareModalState.step);

        let html = '';
        steps.forEach((step, i) => {
            const isActive = i === currentIdx;
            const isCompleted = i < currentIdx;
            const cls = isActive ? ' active' : (isCompleted ? ' completed' : '');
            if (i > 0) html += '<div class="labware-progress-connector"></div>';
            html += `<div class="labware-progress-dot${cls}" data-step="${step}">` +
                `<span class="progress-num">${i + 1}</span>` +
                `<span class="progress-label">${getStepLabel(step)}</span></div>`;
        });
        const bar = document.querySelector('.labware-step-progress');
        if (bar) bar.innerHTML = html;
    }

    /** Show a labware wizard step (directly, without auto-skip logic) */
    function showLabwareStep(step) {
        labwareModalState.step = step;

        // Toggle visibility of all step containers
        ['type', 'size', 'holder', 'definition', 'position'].forEach(s => {
            const el = document.getElementById('labware-step-' + s);
            if (el) el.classList.toggle('labware-step-hidden', s !== step);
        });

        // Back button
        dom.labwareBtnBack.classList.toggle('labware-btn-disabled', labwareModalState.history.length === 0);

        // Confirm button enabled only on position step with selection
        const hasSelection = labwareModalState.target === 'dilutions'
            ? labwareModalState.positions.length > 0
            : !!labwareModalState.position;
        dom.labwareBtnConfirm.classList.toggle('labware-btn-disabled', !hasSelection);

        renderProgressDots();

        // Render content for the active step
        if (step === 'type')       renderTypeStep();
        if (step === 'size')       renderSizeStep();
        if (step === 'holder')     renderHolderStep();
        if (step === 'definition') renderDefinitionStep();
        if (step === 'position')   renderPositionStep();
    }

    /**
     * Advance to `nextStep`, pushing current step onto history.
     * Auto-skips steps that have only one valid option.
     */
    function advanceToStep(nextStep) {
        labwareModalState.history.push(labwareModalState.step);

        // Auto-skip holder for non-tube types
        if (nextStep === 'holder' && labwareModalState.type !== 'tube') {
            labwareModalState.holderFormat = 'sbs';
            advanceToStep('definition');
            return;
        }

        // Auto-skip size if only one option
        if (nextStep === 'size') {
            const sizes = getAvailableSizes();
            if (sizes.length === 1) {
                labwareModalState.size = sizes[0].key;
                const next2 = labwareModalState.type === 'tube' ? 'holder' : 'definition';
                advanceToStep(next2);
                return;
            }
        }

        // Auto-skip holder if only one option
        if (nextStep === 'holder') {
            const holders = getAvailableHolders();
            if (holders.length === 1) {
                labwareModalState.holderFormat = holders[0];
                advanceToStep('definition');
                return;
            }
        }

        // Auto-skip definition if only one option
        if (nextStep === 'definition') {
            const defs = getFilteredCatalog();
            if (defs.length === 1) {
                labwareModalState.definition = defs[0].id;
                advanceToStep('position');
                return;
            }
        }

        showLabwareStep(nextStep);
    }

    // ── Step renderers ──────────────────────────────────────

    function renderTypeStep() {
        document.getElementById('labware-step-type').querySelectorAll('.labware-type-card').forEach(c => {
            c.classList.toggle('selected', c.dataset.type === labwareModalState.type);
        });
    }

    /** Distinct sizes available for the currently selected type, sorted numerically */
    function getAvailableSizes() {
        const filtered = LABWARE_CATALOG.filter(d => d.type === labwareModalState.type);
        const sizeMap = new Map();
        filtered.forEach(d => {
            if (!sizeMap.has(d.size)) {
                sizeMap.set(d.size, { key: d.size, label: d.sizeLabel, count: 0, sortVal: parseFloat(d.size) || 0 });
            }
            sizeMap.get(d.size).count++;
        });
        return Array.from(sizeMap.values()).sort((a, b) => a.sortVal - b.sortVal);
    }

    function renderSizeStep() {
        const sizes = getAvailableSizes();
        const container = document.getElementById('labware-size-options');
        const isPlate  = labwareModalState.type === 'plate';
        const icon = isPlate ? 'fa-table-cells' : (labwareModalState.type === 'trough' ? 'fa-fill-drip' : 'fa-vial');

        let html = '';
        sizes.forEach(s => {
            const sel = s.key === labwareModalState.size ? ' selected' : '';
            html += `<button class="labware-type-card labware-size-card${sel}" data-size="${s.key}">` +
                `<div class="type-card-icon"><i class="fas ${icon}"></i></div>` +
                `<span class="type-card-label">${s.label}</span>` +
                `<span class="type-card-desc">${s.count} option${s.count > 1 ? 's' : ''}</span>` +
                `</button>`;
        });
        container.innerHTML = html;
    }

    /** Distinct holder formats for the current type + size */
    function getAvailableHolders() {
        const filtered = LABWARE_CATALOG.filter(d =>
            d.type === labwareModalState.type && d.size === labwareModalState.size
        );
        return [...new Set(filtered.map(d => d.holderFormat))];
    }

    function renderHolderStep() {
        const holders = getAvailableHolders();
        const container = document.getElementById('labware-holder-options');
        const holderInfo = {
            sbs:     { label: 'SBS Rack / Block', desc: 'Standard microplate-format rack', icon: 'fa-table-cells' },
            carrier: { label: 'Carrier',          desc: 'Deck-mounted tube carrier',       icon: 'fa-grip-lines-vertical' },
        };

        let html = '';
        holders.forEach(h => {
            const info = holderInfo[h] || { label: h, desc: '', icon: 'fa-question' };
            const sel = h === labwareModalState.holderFormat ? ' selected' : '';
            html += `<button class="labware-type-card labware-holder-card${sel}" data-holder="${h}">` +
                `<div class="type-card-icon"><i class="fas ${info.icon}"></i></div>` +
                `<span class="type-card-label">${info.label}</span>` +
                `<span class="type-card-desc">${info.desc}</span>` +
                `</button>`;
        });
        container.innerHTML = html;
    }

    /** Filter catalog by current type + size + holderFormat selections */
    function getFilteredCatalog() {
        return LABWARE_CATALOG.filter(d => {
            if (d.type !== labwareModalState.type) return false;
            if (labwareModalState.size && d.size !== labwareModalState.size) return false;
            if (labwareModalState.type === 'tube' && labwareModalState.holderFormat && d.holderFormat !== labwareModalState.holderFormat) return false;
            return true;
        });
    }

    function renderDefinitionStep() {
        const defs = getFilteredCatalog();
        const container = dom.labwareDefOptions;

        let html = '';
        for (const def of defs) {
            const icon = def.type === 'tube' ? 'fa-vial' : (def.type === 'trough' ? 'fa-fill-drip' : 'fa-table-cells');
            const sel = def.id === labwareModalState.definition ? ' selected' : '';
            const volLabel = def.maxVolumeUl >= 1000
                ? (def.maxVolumeUl / 1000) + ' mL'
                : def.maxVolumeUl + ' \u00B5L';
            const posLabel = def.type === 'plate'
                ? `${def.rows}\u00d7${def.cols} \u2022 ${def.rows * def.cols} wells`
                : `${def.rows * def.cols} position${(def.rows * def.cols) > 1 ? 's' : ''}`;

            html += `<div class="labware-def-card${sel}" data-def-id="${def.id}">` +
                `<div class="def-icon"><i class="fas ${icon}"></i></div>` +
                `<div class="def-info">` +
                `<span class="def-label">${def.label}</span>` +
                `<span class="def-detail">${def.manufacturer} \u2022 ${posLabel} \u2022 ${volLabel} max</span>` +
                `</div></div>`;
        }
        container.innerHTML = html;
    }

    function renderPositionStep() {
        const def = findLabwareDef(labwareModalState.definition);
        if (!def) return;

        const { rows, cols } = def;
        const totalPos = rows * cols;
        const isDilutions = labwareModalState.target === 'dilutions';

        // Helper: check if a well is selected (single or multi mode)
        const isSelected = (wellId) => {
            if (isDilutions) return labwareModalState.positions.includes(wellId);
            return wellId === labwareModalState.position;
        };

        // Carrier-style tubes: vertical list of numbered positions
        if (def.type === 'tube' && cols === 1) {
            let wellSize = 32, plateGap = 4;
            if (totalPos > 24) { wellSize = 24; plateGap = 3; }

            dom.labwareWellGrid.style.cssText = `
                display: inline-grid;
                grid-template-columns: 36px ${wellSize}px;
                gap: ${plateGap}px;
                --well-size: ${wellSize}px;
                --plate-gap: ${plateGap}px;
            `;

            let html = '';
            for (let r = 0; r < totalPos; r++) {
                const posId = `Pos ${r + 1}`;
                const sel = isSelected(posId) ? ' selected' : '';
                const dilNum = isDilutions ? labwareModalState.positions.indexOf(posId) : -1;
                const badge = dilNum >= 0 ? ` data-dil-num="${dilNum + 1}"` : '';
                html += `<div class="well-header">${r + 1}</div>`;
                html += `<div class="well-cell${sel}"${badge} data-well="${posId}"></div>`;
            }
            dom.labwareWellGrid.innerHTML = html;

            if (isDilutions) {
                updateDilutionsPositionDisplay();
            } else {
                dom.labwarePositionDisplay.textContent = labwareModalState.position ? `Selected: ${labwareModalState.position}` : 'Click a position to select';
                dom.labwareBtnConfirm.classList.toggle('labware-btn-disabled', !labwareModalState.position);
            }
            return;
        }

        // Trough: simple channel selection
        if (def.type === 'trough') {
            if (totalPos === 1 && !isDilutions) {
                // Single reservoir — auto-select
                labwareModalState.position = 'Pos 1';
                dom.labwareWellGrid.innerHTML = '';
                dom.labwareWellGrid.style.cssText = '';
                dom.labwarePositionDisplay.innerHTML = `<div class="labware-tube-position">` +
                    `<div class="labware-tube-graphic">` +
                    `<div class="tube-gfx-cap"></div>` +
                    `<div class="tube-gfx-body"><div class="tube-gfx-liquid"></div></div>` +
                    `</div>` +
                    `<span>Position automatically set to <strong>Pos 1</strong></span></div>`;
                dom.labwareBtnConfirm.classList.remove('labware-btn-disabled');
                return;
            }
            // Multi-channel trough — vertical list
            let wellSize = 32, plateGap = 4;
            dom.labwareWellGrid.style.cssText = `
                display: inline-grid;
                grid-template-columns: 36px ${wellSize}px;
                gap: ${plateGap}px;
                --well-size: ${wellSize}px;
                --plate-gap: ${plateGap}px;
            `;
            let html = '';
            for (let r = 0; r < totalPos; r++) {
                const posId = `Ch ${r + 1}`;
                const sel = isSelected(posId) ? ' selected' : '';
                const dilNum = isDilutions ? labwareModalState.positions.indexOf(posId) : -1;
                const badge = dilNum >= 0 ? ` data-dil-num="${dilNum + 1}"` : '';
                html += `<div class="well-header">${r + 1}</div>`;
                html += `<div class="well-cell${sel}"${badge} data-well="${posId}"></div>`;
            }
            dom.labwareWellGrid.innerHTML = html;

            if (isDilutions) {
                updateDilutionsPositionDisplay();
            } else {
                dom.labwarePositionDisplay.textContent = labwareModalState.position ? `Selected: ${labwareModalState.position}` : 'Click a channel to select';
                dom.labwareBtnConfirm.classList.toggle('labware-btn-disabled', !labwareModalState.position);
            }
            return;
        }

        // Plate / SBS well grid
        const rowLabels = 'ABCDEFGHIJKLMNOP'.slice(0, rows).split('');
        let wellSize, plateGap, headerSize;
        if (cols <= 6)       { wellSize = 42; plateGap = 5; headerSize = 28; }
        else if (cols <= 8)  { wellSize = 36; plateGap = 4; headerSize = 26; }
        else if (cols <= 12) { wellSize = 30; plateGap = 3; headerSize = 24; }
        else                 { wellSize = 20; plateGap = 2; headerSize = 20; }

        dom.labwareWellGrid.style.cssText = `
            display: inline-grid;
            grid-template-columns: ${headerSize}px repeat(${cols}, ${wellSize}px);
            gap: ${plateGap}px;
            --well-size: ${wellSize}px;
            --plate-gap: ${plateGap}px;
        `;

        let html = '<div class="well-header"></div>';
        for (let c = 1; c <= cols; c++) {
            html += `<div class="well-header">${c}</div>`;
        }
        for (let r = 0; r < rows; r++) {
            html += `<div class="well-header">${rowLabels[r]}</div>`;
            for (let c = 1; c <= cols; c++) {
                const wellId = `${rowLabels[r]}${c}`;
                const sel = isSelected(wellId) ? ' selected' : '';
                const dilNum = isDilutions ? labwareModalState.positions.indexOf(wellId) : -1;
                const badge = dilNum >= 0 ? ` data-dil-num="${dilNum + 1}"` : '';
                html += `<div class="well-cell${sel}"${badge} data-well="${wellId}"></div>`;
            }
        }
        dom.labwareWellGrid.innerHTML = html;

        if (isDilutions) {
            updateDilutionsPositionDisplay();
        } else {
            dom.labwarePositionDisplay.textContent = labwareModalState.position ? `Selected: ${labwareModalState.position}` : 'Click a well to select';
            dom.labwareBtnConfirm.classList.toggle('labware-btn-disabled', !labwareModalState.position);
        }
    }

    /** Update the numbered badges on all selected wells (dilutions mode) */
    function updateDilutionBadges() {
        dom.labwareWellGrid.querySelectorAll('.well-cell').forEach(cell => {
            const wellId = cell.dataset.well;
            const idx = labwareModalState.positions.indexOf(wellId);
            if (idx >= 0) {
                cell.classList.add('selected');
                cell.setAttribute('data-dil-num', idx + 1);
            } else {
                cell.classList.remove('selected');
                cell.removeAttribute('data-dil-num');
            }
        });
    }

    /** Update the position display text and confirm button for dilutions multi-select */
    function updateDilutionsPositionDisplay() {
        const count = labwareModalState.positions.length;
        const numDils = state.numDilutions;

        if (count === 0) {
            dom.labwarePositionDisplay.innerHTML = `<span class="dilutions-pos-hint">Click wells in order for each dilution (${numDils} needed)</span>`;
        } else {
            const seqStr = formatSequenceRange(labwareModalState.positions);
            const countLabel = count === 1 ? '1 position' : `${count} positions`;
            const warningHtml = count !== numDils
                ? `<span class="dilutions-pos-warning"><i class="fas fa-exclamation-triangle"></i> ${count} of ${numDils} dilutions assigned</span>`
                : '';
            dom.labwarePositionDisplay.innerHTML =
                `<span class="dilutions-pos-sequence"><strong>Sequence:</strong> ${seqStr}</span>` +
                `<span class="dilutions-pos-count">${countLabel} selected</span>` +
                warningHtml;
        }

        dom.labwareBtnConfirm.classList.toggle('labware-btn-disabled', count === 0);
    }

    function labwareModalBack() {
        if (labwareModalState.history.length === 0) return;
        const prevStep = labwareModalState.history.pop();
        // Clear selections for steps after the one we're returning to
        const allSteps = ['type', 'size', 'holder', 'definition', 'position'];
        const prevIdx = allSteps.indexOf(prevStep);
        allSteps.forEach((s, i) => {
            if (i > prevIdx) {
                if (s === 'size')       labwareModalState.size = '';
                if (s === 'holder')     labwareModalState.holderFormat = '';
                if (s === 'definition') labwareModalState.definition = '';
                if (s === 'position')   { labwareModalState.position = ''; labwareModalState.positions = []; }
            }
        });
        showLabwareStep(prevStep);
    }

    function labwareModalConfirm() {
        if (labwareModalState.target === 'dilutions') {
            if (labwareModalState.positions.length === 0) return;
        } else {
            if (!labwareModalState.position) return;
        }

        const def = findLabwareDef(labwareModalState.definition);
        const cfg = {
            type: labwareModalState.type,
            size: labwareModalState.size,
            holderFormat: labwareModalState.holderFormat,
            definition: labwareModalState.definition,
            position: labwareModalState.target === 'dilutions' ? '' : labwareModalState.position,
            positions: labwareModalState.target === 'dilutions' ? [...labwareModalState.positions] : [],
            maxVolumeUl: def ? def.maxVolumeUl : 0,
        };

        state[labwareModalState.target + 'Labware'] = cfg;
        updateLabwareLabels();
        toggleModal(dom.labwareModal, false);

        // Warn if current total volume exceeds the labware capacity
        if (labwareModalState.target === 'dilutions' && def && state.totalVolume > def.maxVolumeUl) {
            showToast(`Total volume (${state.totalVolume} \u00B5L) exceeds well capacity (${def.maxVolumeUl} \u00B5L)`, 'warning');
        }
        onConfigChange();
    }

    function updateLabwareLabels() {
        updateLabwareDetailRows('diluent', state.diluentLabware);
        updateLabwareDetailRows('stock', state.stockLabware);
        updateDilutionsLabwareDetailRows();
    }

    /** Populate always-visible labware detail rows (Type / Well Number) for stock & diluent. */
    function updateLabwareDetailRows(prefix, cfg) {
        const typeEl = document.getElementById(prefix + '-lw-type');
        const wellEl = document.getElementById(prefix + '-lw-well');

        if (!typeEl || !wellEl) return;

        if (!cfg || !cfg.type) {
            typeEl.textContent = '\u2014';
            wellEl.textContent = '\u2014';
            return;
        }

        // Show richer type info from catalog
        const def = cfg.definition ? findLabwareDef(cfg.definition) : null;
        if (def) {
            const volLabel = def.maxVolumeUl >= 1000
                ? (def.maxVolumeUl / 1000) + ' mL'
                : def.maxVolumeUl + ' \u00B5L';
            typeEl.textContent = def.label;
            typeEl.title = `${def.manufacturer} \u2022 ${volLabel} max`;
        } else {
            typeEl.textContent = cfg.type === 'tube' ? 'Tube' : (cfg.type === 'trough' ? 'Trough' : 'Plate');
        }

        const position = (cfg.position || '').trim();
        if (!position) {
            wellEl.textContent = '\u2014';
            return;
        }

        // SBS tubes use alphanumeric positions (A1, B3…) just like plates;
        // carrier tubes and troughs use numbered positions (Pos 1, Ch 1…).
        const isSbsTube = cfg.type === 'tube' && cfg.holderFormat === 'sbs';
        if (cfg.type === 'plate' || isSbsTube) {
            wellEl.textContent = position.toUpperCase();
        } else {
            const tubeNumMatch = position.match(/(\d+)/);
            wellEl.textContent = tubeNumMatch ? tubeNumMatch[1] : '1';
        }
    }

    /** Populate dilutions labware detail rows (Type / Sequence). */
    function updateDilutionsLabwareDetailRows() {
        const typeEl = document.getElementById('dilutions-lw-type');
        const seqEl  = document.getElementById('dilutions-lw-seq');

        if (!typeEl || !seqEl) return;

        const cfg = state.dilutionsLabware;
        if (!cfg || !cfg.type) {
            typeEl.textContent = '\u2014';
            seqEl.textContent = '\u2014';
            return;
        }

        const def = cfg.definition ? findLabwareDef(cfg.definition) : null;
        if (def) {
            const volLabel = def.maxVolumeUl >= 1000
                ? (def.maxVolumeUl / 1000) + ' mL'
                : def.maxVolumeUl + ' \u00B5L';
            typeEl.textContent = def.label;
            typeEl.title = `${def.manufacturer} \u2022 ${volLabel} max`;
        } else {
            typeEl.textContent = cfg.type === 'tube' ? 'Tube' : (cfg.type === 'trough' ? 'Trough' : 'Plate');
        }

        const positions = cfg.positions || [];
        if (positions.length === 0) {
            seqEl.textContent = '\u2014';
            return;
        }

        seqEl.textContent = formatSequenceRange(positions);
    }

    /**
     * Formats an ordered list of well IDs into a compact sequence string.
     * Sequential runs are collapsed (e.g. A1, A2, A3 → A1\u2013A3).
     * Non-sequential items are comma-separated.
     */
    function formatSequenceRange(positions) {
        if (!positions || positions.length === 0) return '\u2014';
        if (positions.length === 1) return positions[0];

        // Try to detect if they can be grouped into ranges
        const parts = [];
        let runStart = 0;

        for (let i = 1; i <= positions.length; i++) {
            const isConsecutive = i < positions.length && areConsecutiveWells(positions[i - 1], positions[i]);
            if (!isConsecutive) {
                // End of a run from runStart to i-1
                if (i - 1 === runStart) {
                    parts.push(positions[runStart]);
                } else {
                    parts.push(positions[runStart] + '\u2013' + positions[i - 1]);
                }
                runStart = i;
            }
        }

        return parts.join(', ');
    }

    /**
     * Check if two well IDs are consecutive.
     * Supports: "Pos N" / "Pos N+1", pure numbers, and plate wells (A1→A2, A12→B1).
     */
    function areConsecutiveWells(a, b) {
        // Pos N format
        const posA = a.match(/^Pos\s+(\d+)$/i);
        const posB = b.match(/^Pos\s+(\d+)$/i);
        if (posA && posB) return parseInt(posB[1]) === parseInt(posA[1]) + 1;

        // Ch N format (troughs)
        const chA = a.match(/^Ch\s+(\d+)$/i);
        const chB = b.match(/^Ch\s+(\d+)$/i);
        if (chA && chB) return parseInt(chB[1]) === parseInt(chA[1]) + 1;

        // Pure number
        const numA = a.match(/^(\d+)$/);
        const numB = b.match(/^(\d+)$/);
        if (numA && numB) return parseInt(numB[1]) === parseInt(numA[1]) + 1;

        // Plate well format: letter + number (e.g. A1, B12)
        const wellA = a.match(/^([A-P])(\d+)$/i);
        const wellB = b.match(/^([A-P])(\d+)$/i);
        if (wellA && wellB) {
            const rowA = wellA[1].toUpperCase().charCodeAt(0);
            const colA = parseInt(wellA[2]);
            const rowB = wellB[1].toUpperCase().charCodeAt(0);
            const colB = parseInt(wellB[2]);
            // Same row, next column
            if (rowA === rowB && colB === colA + 1) return true;
            // Next row, column 1 (wrapping) — need to know total cols, assume consecutive if next row col 1
            // This is tricky without knowing total cols, so only collapse within same row
            return false;
        }

        return false;
    }

    // ── Reset ──────────────────────────────────────────────────
    function resetToDefaults() {
        dom.stockConc.value = 1000;
        dom.stockUnit.value = 'mM';
        dom.stockLiquidType.value = 'Water';
        dom.diluentLiquidType.value = 'Water';
        if (dom.dilutionsLiquidType) dom.dilutionsLiquidType.value = 'Water';
        state.stockLabware = defaultLabwareConfig();
        state.diluentLabware = defaultLabwareConfig();
        state.dilutionsLabware = defaultLabwareConfig();
        updateLabwareLabels();
        dom.stockNameInput.value = '';
        dom.diluentNameInput.value = '';
        state.stockName = '';
        state.deadVolumeStock = 50;
        state.deadVolumeDiluent = 50;
        state.diluentName = '';
        dom.dilFactor.textContent = 10;
        dom.numDils.value = state.defaultNumDilutions;
        dom.totalVol.value = 1000;

        state.numDilutions = state.defaultNumDilutions;
        state.tubeNames = [];   // Clear custom names
        readState();
        recalculate();
        renderTubes();
        renderSummary();
        autoSizeTubes();

        showToast('Reset to defaults', 'success');
    }

    // ── Modal Toggle ───────────────────────────────────────────
    function toggleModal(modal, show) {
        if (show) {
            modal.classList.add('active');
        } else {
            modal.classList.remove('active');
        }
    }

    // ── Warning Modal ──────────────────────────────────────────
    function showWarningModal(message) {
        dom.warningModalMessage.innerHTML = message;
        toggleModal(dom.warningModal, true);
    }

    // ── Toast Notifications ────────────────────────────────────
    function showToast(message, type = 'info') {
        const icons = {
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle',
            info: 'fa-info-circle',
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ── Export Functions ────────────────────────────────────────
    function exportCSV() {
        const data = getDilutionData();
        ensureTubeNames();
        let csv = 'Dilution,Concentration,Unit,Step Dilution,Cumulative Dilution,Transfer Volume,Transfer Tip,Diluent Volume,Diluent Tip,Total Volume,Volume Unit\n';
        if (state.stockLabware.definition) csv = `Stock Labware: ${labwareSummary(state.stockLabware)}\n` + csv;
        if (state.diluentLabware.definition) csv = `Diluent Labware: ${labwareSummary(state.diluentLabware)}\n` + csv;
        if (state.dilutionsLabware.definition) csv = `Dilutions Labware: ${labwareSummary(state.dilutionsLabware)}\n` + csv;
        if (state.dilutionsLiquidType) csv = `Dilutions Liquid Type: ${state.dilutionsLiquidType}\n` + csv;
        if (state.stockLiquidType) csv = `Stock Liquid Type: ${state.stockLiquidType}\n` + csv;
        if (state.diluentLiquidType) csv = `Diluent Liquid Type: ${state.diluentLiquidType}\n` + csv;
        csv += `Stock,${state.stockConcentration},${state.stockUnit},-,-,-,-,-,-,-,${state.volumeUnit}\n`;
        data.forEach((d, i) => {
            const trTip = getTipForVolume(d.transferVol);
            const dlTip = getTipForVolume(d.diluentVol);
            csv += `${getTubeName(i)},${d.concentration},${state.stockUnit},1:${d.stepDilution},1:${d.dilution},${d.transferVol},${trTip ? trTip.nominal + ' µL' : '-'},${d.diluentVol},${dlTip ? dlTip.nominal + ' µL' : '-'},${d.totalVol},${state.volumeUnit}\n`;
        });

        downloadFile(csv, 'serial_dilution.csv', 'text/csv');
        showToast('CSV exported successfully', 'success');
    }

    function exportJSON() {
        const data = getDilutionData();
        ensureTubeNames();
        const namedData = data.map((d, i) => {
            const trTip = getTipForVolume(d.transferVol);
            const dlTip = getTipForVolume(d.diluentVol);
            return {
                ...d,
                name: getTubeName(i),
                transferTip: trTip ? { nominal: trTip.nominal, label: trTip.label } : null,
                diluentTip: dlTip ? { nominal: dlTip.nominal, label: dlTip.label } : null,
            };
        });
        const json = JSON.stringify({
            configuration: {
                stockConcentration: state.stockConcentration,
                stockUnit: state.stockUnit,
                stockLiquidType: state.stockLiquidType,
                diluentLiquidType: state.diluentLiquidType,
                dilutionsLiquidType: state.dilutionsLiquidType,
                stockLabware: state.stockLabware,
                diluentLabware: state.diluentLabware,
                dilutionsLabware: state.dilutionsLabware,
                dilutionFactor: state.dilutionFactor,
                totalVolume: state.totalVolume,
                volumeUnit: state.volumeUnit,
            },
            dilutions: namedData,
        }, null, 2);

        downloadFile(json, 'serial_dilution.json', 'application/json');
        showToast('JSON exported successfully', 'success');
    }

    function exportText() {
        const data = getDilutionData();
        ensureTubeNames();
        const transferVol = state.totalVolume / state.dilutionFactor;
        const diluentVol = state.totalVolume - transferVol;

        let text = '═══════════════════════════════════════════════════\n';
        text += '         SERIAL DILUTION PROTOCOL\n';
        text += '═══════════════════════════════════════════════════\n\n';
        text += `Stock Concentration:  ${state.stockConcentration} ${state.stockUnit}\n`;
        if (state.stockLiquidType) text += `Stock Liquid Type:   ${state.stockLiquidType}\n`;
        if (state.diluentLiquidType) text += `Diluent Liquid Type: ${state.diluentLiquidType}\n`;
        if (state.dilutionsLiquidType) text += `Dilutions Liquid Type: ${state.dilutionsLiquidType}\n`;
        if (state.stockLabware.definition) text += `Stock Labware:        ${labwareSummary(state.stockLabware)}\n`;
        if (state.diluentLabware.definition) text += `Diluent Labware:      ${labwareSummary(state.diluentLabware)}\n`;
        if (state.dilutionsLabware.definition) text += `Dilutions Labware:    ${labwareSummary(state.dilutionsLabware)}\n`;
        text += `Dilution Factor:      1:${state.dilutionFactor}\n`;
        text += `Number of Dilutions:  ${state.numDilutions}\n`;
        text += `Total Volume/Tube:    ${state.totalVolume} ${state.volumeUnit}\n`;
        text += `Transfer Volume:      ${formatValue(transferVol)} ${state.volumeUnit}\n`;
        text += `Diluent Volume:       ${formatValue(diluentVol)} ${state.volumeUnit}\n\n`;
        text += '───────────────────────────────────────────────────\n';
        text += ' PROCEDURE\n';
        text += '───────────────────────────────────────────────────\n\n';

        data.forEach((d, i) => {
            const name = getTubeName(i);
            const source = i === 0 ? 'Stock' : getTubeName(i - 1);
            let stepNum = 1;
            text += `Step ${i + 1}:\n`;
            text += `  ${stepNum++}. Add ${formatValue(diluentVol)} ${state.volumeUnit} diluent to ${name}\n`;
            if (state.mixEnabled && i > 0) {
                text += `  ${stepNum++}. Mix ${source} (${state.mixSteps} cycles, ${formatValue(state.mixVolume)} ${state.volumeUnit})\n`;
            }
            text += `  ${stepNum++}. Transfer ${formatValue(transferVol)} ${state.volumeUnit} from ${source} to ${name}\n`;
            if (state.mixEnabled) {
                text += `  ${stepNum++}. Mix ${name} (${state.mixSteps} cycles, ${formatValue(state.mixVolume)} ${state.volumeUnit})\n`;
            }
            text += `  → Final concentration: ${formatConcentration(d.concentration)} ${state.stockUnit}\n\n`;
        });

        text += '───────────────────────────────────────────────────\n';
        text += ' SUMMARY TABLE\n';
        text += '───────────────────────────────────────────────────\n\n';
        text += 'Dil.    Concentration         Step       Cumulative Dilution\n';
        text += '─────   ───────────────────   ────────   ────────────────────\n';
        text += `Stock   ${(state.stockConcentration + ' ' + state.stockUnit).padEnd(22)}-          -\n`;
        data.forEach((d, i) => {
            const name = getTubeName(i);
            text += `${name.padEnd(8)}${(formatConcentration(d.concentration) + ' ' + state.stockUnit).padEnd(22)}1:${formatDilution(d.stepDilution).toString().padEnd(9)}1:${formatDilution(d.dilution)}\n`;
        });

        downloadFile(text, 'serial_dilution_protocol.txt', 'text/plain');
        showToast('Protocol exported successfully', 'success');
    }

    function copyTableToClipboard() {
        const data = getDilutionData();
        ensureTubeNames();
        let text = 'Dilution\tConcentration\tStep Dilution\tCumulative Dilution\tTransfer Vol.\tTransfer Tip\tDiluent Vol.\tDiluent Tip\tTotal Vol.\n';
        text += `Stock\t${state.stockConcentration} ${state.stockUnit}\t-\t-\t-\t-\t-\t-\t-\n`;
        data.forEach((d, i) => {
            const trTip = getTipForVolume(d.transferVol);
            const dlTip = getTipForVolume(d.diluentVol);
            text += `${getTubeName(i)}\t${formatConcentration(d.concentration)} ${state.stockUnit}\t1:${formatDilution(d.stepDilution)}\t1:${formatDilution(d.dilution)}\t${formatValue(d.transferVol)} ${state.volumeUnit}\t${trTip ? trTip.nominal + ' µL' : '-'}\t${formatValue(d.diluentVol)} ${state.volumeUnit}\t${dlTip ? dlTip.nominal + ' µL' : '-'}\t${formatValue(d.totalVol)} ${state.volumeUnit}\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            showToast('Table copied to clipboard', 'success');
        }).catch(() => {
            showToast('Failed to copy', 'error');
        });
    }

    // ── Utilities ──────────────────────────────────────────────
    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ── Boot ───────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
