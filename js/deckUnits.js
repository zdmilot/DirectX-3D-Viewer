/* ================================================================
   Deck Units — Shared mm-based coordinate system for all applets
   ================================================================

   Hamilton VENUS .x / .hxx / .gltf files use a 1:1 millimeter
   coordinate system.  All Three.js scenes in this app therefore
   operate in **millimeters** — one Three.js unit === one mm.

   This module centralises:
     • The conversion identity (1 unit = 1 mm)
     • Hamilton deck constants (track spacing, surface Z, etc.)
     • SBS plate constants
     • Helpers for grid creation, camera fitting, and unit labels

   Every applet should reference DeckUnits instead of defining its
   own ad-hoc grid sizes, camera near/far planes, or scale factors.
   ================================================================ */

window.DeckUnits = (function () {
    'use strict';

    // ════════════════════════════════════════════════════════════
    //  Core unit identity
    // ════════════════════════════════════════════════════════════
    /** 1 Three.js unit = 1 mm.  Multiply by this to convert mm → scene units. */
    const MM_PER_UNIT = 1.0;

    /** Label string for display */
    const UNIT_LABEL = 'mm';

    // ════════════════════════════════════════════════════════════
    //  Hamilton Deck Constants  (ML_STAR / Vantage)
    // ════════════════════════════════════════════════════════════
    const DECK = Object.freeze({
        TRACK_SPACING:   22.5,     // mm  center-to-center
        TRACK_WIDTH:     22.0,     // mm  physical slot width
        TRACK_GAP:        0.5,     // mm  gap between adjacent tracks
        TRACK_DEPTH:    497.0,     // mm  front-to-back rail length
        TRACK_Y_START:   63.0,     // mm  Y of first track front edge
        FIRST_TRACK_X:  100.25,    // mm  X centre of Track 1
        TRACK_COUNT:     80,       // total placeable tracks (extended deck)
        PHYSICAL_TRACKS: 54,       // tracks on the physical GLTF deck
        SURFACE_Z:      100.0,     // mm  deck surface height
        CANVAS_W:       2200,      // mm  full canvas width  (extended)
        CANVAS_D:        520,      // mm  full canvas depth

        // 9 standard 6T carrier columns
        CARRIER_WIDTH_6T: 135.0,   // mm  (6 × 22.5)
        CARRIER_COLUMNS:    9,
        USABLE_TRACK_WIDTH: 1215.0, // mm  (54 × 22.5)

        LABELED_TRACKS: new Set([1,7,13,19,25,31,37,43,49,55,61,67,73,79]),
    });

    // ════════════════════════════════════════════════════════════
    //  SBS / ANSI Plate Constants  (all in mm)
    // ════════════════════════════════════════════════════════════
    const SBS = Object.freeze({
        footprintLength: 127.76,   // ANSI/SLAS 1-2004
        footprintWidth:   85.48,
        wellSpacing96:     9.0,
        wellSpacing384:    4.5,
        wellSpacing1536:   2.25,
        a1OffsetX:        14.38,
        a1OffsetY:        11.24,
        cornerRadius:      3.18,
        wallThickness:     1.27,
        flangeHeight:      2.41,
    });

    // ════════════════════════════════════════════════════════════
    //  Track position helpers
    // ════════════════════════════════════════════════════════════
    /** X centre (mm) of given 1-based track number */
    function trackX(trackNumber) {
        return DECK.FIRST_TRACK_X + (trackNumber - 1) * DECK.TRACK_SPACING;
    }

    /** Left edge X (mm) of a carrier placed at trackStart with tWidth tracks */
    function carrierLeftX(trackStart) {
        return trackX(trackStart) - DECK.TRACK_WIDTH / 2;
    }

    // ════════════════════════════════════════════════════════════
    //  Grid creation  (mm-based)
    // ════════════════════════════════════════════════════════════

    /**
     * Create a THREE.GridHelper sized in mm.
     *
     * @param {number} sizeMm        Total grid extent in mm
     *                                (default: 200 mm)
     * @param {number} divisionsMm   Desired spacing per grid line in mm
     *                                (default: 10 mm → 10 mm squares)
     * @param {number} color         Grid line colour (hex)
     * @param {object} [opts]
     * @param {string} [opts.name]   THREE object name (default '__grid__')
     * @param {boolean}[opts.visible] initial visibility (default true)
     * @returns {THREE.GridHelper}
     */
    function createGrid(sizeMm, divisionsMm, color, opts) {
        sizeMm       = sizeMm       || 200;
        divisionsMm  = divisionsMm  || 10;
        opts         = opts         || {};

        const divisions = Math.max(1, Math.round(sizeMm / divisionsMm));
        const grid = new THREE.GridHelper(sizeMm, divisions, color, color);
        grid.name    = opts.name    || '__grid__';
        grid.visible = opts.visible !== undefined ? opts.visible : true;
        return grid;
    }

    /**
     * Create a grid that adapts to the loaded model's bounding box.
     * Grid extent = max(modelMaxDim × 3, 100 mm) so it's always visible.
     * Grid spacing = nice round mm step (1, 2, 5, 10, 20, 50, 100…).
     *
     * @param {number} modelMaxDim   Largest axis of bounding box (mm)
     * @param {number} color         Grid line colour
     * @param {object} [opts]        Same as createGrid
     * @returns {THREE.GridHelper}
     */
    function createModelGrid(modelMaxDim, color, opts) {
        const extent  = Math.max(modelMaxDim * 3, 100);
        const step    = niceStep(extent / 20);      // ~20 grid lines
        return createGrid(extent, step, color, opts);
    }

    /**
     * Round a raw step to the nearest "nice" mm value:
     * 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500 …
     */
    function niceStep(raw) {
        if (raw <= 0) return 1;
        const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
        const residual  = raw / magnitude;
        if (residual <= 1.5) return magnitude;
        if (residual <= 3.5) return 2 * magnitude;
        if (residual <= 7.5) return 5 * magnitude;
        return 10 * magnitude;
    }

    // ════════════════════════════════════════════════════════════
    //  Camera fitting  (mm-based)
    // ════════════════════════════════════════════════════════════

    /**
     * Configure a PerspectiveCamera + OrbitControls to fit a model
     * whose bounding box has the given maxDim (in mm).
     *
     * @param {THREE.PerspectiveCamera} camera
     * @param {THREE.OrbitControls}     controls
     * @param {number}                  maxDimMm   largest axis of BB (mm)
     * @param {object}                  [opts]
     * @param {number}                  [opts.fitMultiplier]   camera dist = maxDim × this (default 2.0)
     * @param {THREE.Vector3}           [opts.target]          orbit target (default origin)
     */
    function fitCamera(camera, controls, maxDimMm, opts) {
        opts = opts || {};
        const mult   = opts.fitMultiplier || 2.0;
        const target = opts.target || new THREE.Vector3(0, 0, 0);

        const fitDist = maxDimMm * mult;
        camera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
        camera.near = Math.max(maxDimMm * 0.001, 0.01);   // at least 0.01 mm
        camera.far  = maxDimMm * 100;
        camera.updateProjectionMatrix();

        controls.target.copy(target);
        controls.minDistance = maxDimMm * 0.01;
        controls.maxDistance = maxDimMm * 50;
        controls.update();
    }

    // ════════════════════════════════════════════════════════════
    //  Formatting helpers
    // ════════════════════════════════════════════════════════════

    /**
     * Format a value with the mm unit label.
     * @param {number} val   value in mm
     * @param {number} [dp]  decimal places (default 2)
     * @returns {string}  e.g. "127.76 mm"
     */
    function fmtMm(val, dp) {
        dp = dp !== undefined ? dp : 2;
        return val.toFixed(dp) + ' ' + UNIT_LABEL;
    }

    /**
     * Format an XYZ position with mm labels.
     * @returns {string}  e.g. "X: 100.25 mm  Y: 63.00 mm  Z: 100.00 mm"
     */
    function fmtPos(x, y, z, dp) {
        dp = dp !== undefined ? dp : 1;
        return 'X: ' + fmtMm(x, dp) + '  Y: ' + fmtMm(y, dp) + '  Z: ' + fmtMm(z, dp);
    }

    /**
     * Format a bounding-box size with mm labels.
     * @returns {string}  e.g. "135.00 × 497.00 × 130.00 mm"
     */
    function fmtSize(sx, sy, sz, dp) {
        dp = dp !== undefined ? dp : 2;
        return sx.toFixed(dp) + ' × ' + sy.toFixed(dp) + ' × ' + sz.toFixed(dp) + ' ' + UNIT_LABEL;
    }

    // ════════════════════════════════════════════════════════════
    //  Public API
    // ════════════════════════════════════════════════════════════
    return Object.freeze({
        // Identity
        MM_PER_UNIT:  MM_PER_UNIT,
        UNIT_LABEL:   UNIT_LABEL,

        // Constants
        DECK: DECK,
        SBS:  SBS,

        // Track helpers
        trackX:        trackX,
        carrierLeftX:  carrierLeftX,

        // Grid
        createGrid:      createGrid,
        createModelGrid: createModelGrid,
        niceStep:        niceStep,

        // Camera
        fitCamera: fitCamera,

        // Formatting
        fmtMm:   fmtMm,
        fmtPos:  fmtPos,
        fmtSize: fmtSize,
    });

})();
