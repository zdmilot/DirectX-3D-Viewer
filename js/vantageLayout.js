/* ============================================================
   Deck Layout — Place carriers on the Hamilton Vantage
   deck using .tml metadata, track-snapping, and SBS plate
   auto-placement.
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  Hamilton Deck Constants  (from shared DeckUnits module, all mm)
    // ================================================================
    const DECK = DeckUnits.DECK;

    // ================================================================
    //  Track Placement Limits
    // ================================================================
    // Carriers can be placed from track 4 through track 60.
    // Tracks 61-80 are reserved for waste chute and entry/exit drawer.
    const MAX_USABLE_TRACK = 60;

    // ================================================================
    //  Waste Cutout Positions  (4 removable deck panels)
    // ================================================================
    // Each cutout spans ~9 tracks (≈201mm) matching the physical GLTF
    // VANTAGE_DECK_COVER panels.  The waste chute model sits through
    // the deck in one of these openings.
    const DECK_CUTOUTS = [
        { id: 0, label: 'Panel 1', trackStart: 20, trackSpan: 9 },
        { id: 1, label: 'Panel 2', trackStart: 36, trackSpan: 9 },
        { id: 2, label: 'Panel 3', trackStart: 46, trackSpan: 9 },
        { id: 3, label: 'Panel 4', trackStart: 56, trackSpan: 9 },
    ];

    // Server path to the VStarWasteBlock TML (auto-loaded on init)
    const WASTE_TML_PATH = 'Base Hamilton Files/Labware/ML_STAR/CORE/VStarWasteBlock_Config.tml';
    const DRAWER_TML_PATH = 'Base Hamilton Files/Labware/ML_STAR/CORE/EntryExitDrawer.tml';

    // Carrier library — populated from parsed .tml files + built-ins
    const CARRIER_LIBRARY = {
        PLT_CAR_L5AC: {
            viewName: 'PLT_CAR_L5AC',
            description: 'Plate Carrier L5 Landscape (AC)',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x607080,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/PLT_CAR_L5AC_A00.hxx',
            sites: [
                { id:1, x:4, y:392.5, z:86.15, dx:127, dy:86 },
                { id:2, x:4, y:296.5, z:86.15, dx:127, dy:86 },
                { id:3, x:4, y:200.5, z:86.15, dx:127, dy:86 },
                { id:4, x:4, y:104.5, z:86.15, dx:127, dy:86 },
                { id:5, x:4, y:8.5,   z:86.15, dx:127, dy:86 },
            ],
        },
        PLT_CAR_L5PCR: {
            viewName: 'PLT_CAR_L5PCR',
            description: 'Plate Carrier L5 PCR Landscape',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x506070,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/PLT_CAR_L5PCR_A00.x',
            sites: [
                { id:4, x:5, y:393.5, z:109.2, dx:127, dy:86 },
                { id:5, x:5, y:297.5, z:109.2, dx:127, dy:86 },
                { id:1, x:5, y:201.5, z:109.2, dx:127, dy:86 },
                { id:2, x:5, y:105.5, z:109.2, dx:127, dy:86 },
                { id:3, x:5, y:9.5,   z:109.2, dx:127, dy:86 },
            ],
        },
        PLT_CAR_L5MD: {
            viewName: 'PLT_CAR_L5MD',
            description: 'Plate Carrier L5 Medium Deck',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x556677,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/PLT_CAR_L5MD_A00.hxx',
            sites: [
                { id:1, x:4, y:392.5, z:86.15, dx:127, dy:86 },
                { id:2, x:4, y:296.5, z:86.15, dx:127, dy:86 },
                { id:3, x:4, y:200.5, z:86.15, dx:127, dy:86 },
                { id:4, x:4, y:104.5, z:86.15, dx:127, dy:86 },
                { id:5, x:4, y:8.5,   z:86.15, dx:127, dy:86 },
            ],
        },
        PLT_CAR_L5_DWP: {
            viewName: 'PLT_CAR_L5_DWP',
            description: 'Plate Carrier L5 Deep Well',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x4a6070,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/PLT_CAR_L5_DWP.hxx',
            sites: [
                { id:1, x:4, y:392.5, z:77.15, dx:127, dy:86 },
                { id:2, x:4, y:296.5, z:77.15, dx:127, dy:86 },
                { id:3, x:4, y:200.5, z:77.15, dx:127, dy:86 },
                { id:4, x:4, y:104.5, z:77.15, dx:127, dy:86 },
                { id:5, x:4, y:8.5,   z:77.15, dx:127, dy:86 },
            ],
        },
        TIP_CAR_480: {
            viewName: 'TIP_CAR_480',
            description: 'Tip Carrier 480 (5 tip boxes)',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x405060,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/TIP_CAR_480_A00.hxx',
            sites: [
                { id:1, x:6.5, y:391.15, z:114.95, dx:122, dy:82 },
                { id:2, x:6.5, y:295.15, z:114.95, dx:122, dy:82 },
                { id:3, x:6.5, y:199.15, z:114.95, dx:122, dy:82 },
                { id:4, x:6.5, y:103.15, z:114.95, dx:122, dy:82 },
                { id:5, x:6.5, y:7.15,   z:114.95, dx:122, dy:82 },
            ],
        },
        RGT_CAR_12R: {
            viewName: 'RGT_CAR_12R',
            description: 'Reagent Carrier 12 Trough',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x6d4a20,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/RGT_CAR_12R_A00.x',
            sites: [
                { id:1,  x:4,  y:437, z:81, dx:25, dy:105 },
                { id:2,  x:4,  y:327, z:81, dx:25, dy:105 },
                { id:3,  x:4,  y:217, z:81, dx:25, dy:105 },
                { id:4,  x:4,  y:107, z:81, dx:25, dy:105 },
                { id:5,  x:36, y:437, z:81, dx:25, dy:105 },
                { id:6,  x:36, y:327, z:81, dx:25, dy:105 },
                { id:7,  x:36, y:217, z:81, dx:25, dy:105 },
                { id:8,  x:36, y:107, z:81, dx:25, dy:105 },
                { id:9,  x:68, y:437, z:81, dx:25, dy:105 },
                { id:10, x:68, y:327, z:81, dx:25, dy:105 },
                { id:11, x:68, y:217, z:81, dx:25, dy:105 },
                { id:12, x:68, y:107, z:81, dx:25, dy:105 },
            ],
        },
        PLT_CAR_P3AC: {
            viewName: 'PLT_CAR_P3AC',
            description: 'Plate Carrier P3 Portrait (6T)',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x607080,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/PLT_CAR_P3AC_A00.hxx',
            sites: [
                { id:1, x:43.85, y:329.5, z:86.15, dx:86, dy:127 },
                { id:2, x:43.85, y:183.5, z:86.15, dx:86, dy:127 },
                { id:3, x:43.85, y:37.5,  z:86.15, dx:86, dy:127 },
            ],
        },
        TIP_CAR_288: {
            viewName: 'TIP_CAR_288',
            description: 'Tip Carrier 288 Portrait (4T)',
            tWidth: 4, dx: 90, dy: 497, dz: 130,
            color: 0x405060,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/TIP_CAR_288_C00.hxx',
            sites: [
                { id:1, x:7, y:358.5, z:114.7, dx:82, dy:122 },
                { id:2, x:7, y:212.5, z:114.7, dx:82, dy:122 },
                { id:3, x:7, y:66.5,  z:114.7, dx:82, dy:122 },
            ],
        },
        SMP_CAR_32: {
            viewName: 'SMP_CAR_32',
            description: 'Sample Carrier 32 (1T)',
            tWidth: 1, dx: 22.5, dy: 497, dz: 140,
            color: 0x708090,
            modelFile: 'Base Hamilton Files/Labware/ML_STAR/SMP_CAR_32_A00.hxx',
            sites: [], // tube positions, not SBS plates
        },
    };

    // SBS plate dimensions (mm, from shared DeckUnits)
    const SBS_PLATE = { dx: DeckUnits.SBS.footprintLength, dy: DeckUnits.SBS.footprintWidth, dz: 14.35 };

    // ================================================================
    //  Module State
    // ================================================================
    const vlState = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        isDark: false,
        gridVisible: false,
        labelsVisible: true,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,
        animId: null,

        // Placed carriers: [{id, type, trackStart, mesh, siteMeshes[], tmlData}]
        placedCarriers: [],
        nextCarrierId: 1,

        // Drag state
        dragging: null,       // {carrierId, offsetX, offsetZ}
        hoveredTrack: null,   // track number 1-54
        ghostMesh: null,      // preview mesh while dragging from palette

        // Palette drag-to-place state
        dragToPlaceEnabled: true,
        paletteDrag: null,    // { type, def } while dragging from palette
        rackDrag: null,       // { rackKey, rackDef } while dragging rack onto sites

        // Canvas carrier drag state (moving a placed carrier)
        canvasCarrierDrag: null,  // { carrier } while dragging placed carrier
        _carrierDragOffDeck: false,  // true when cursor is pulled far enough off-deck for removal

        // GLTF deck model reference (for debug positioning)
        gltfModel: null,
        debugDeckMode: false,
        sitesPanelOpen: false,

        // TML import state
        importedCarrier: null,

        // Currently selected carrier
        selectedCarrierId: null,

        // Rack / Container library:  keyed by user-chosen name
        // Each entry: { name, description, dx, dy, dz, model, modelRel,
        //               xOff, yOff, zOff, fileName, source:'file'|'server' }
        rackLibrary: {},
        rackModelCache: {},    // keyed same as rackLibrary → THREE.Group
        rackModelLoading: {},

        // Cache of THREE.Group models loaded from .x files, keyed by carrier key
        xModelCache: {},

        // Cache of site labware 3D models, keyed by normalized Hamilton path
        siteModelCache: {},
        siteModelLoading: {},

        // Raycaster helpers
        _raycaster: null,
        _mouse: new THREE.Vector2(),
        _deckPlane: null,

        // Canvas / host refs
        canvas: null,
        host: null,

        // Settings: deck cutout cover visibility [cover0, cover1, cover2, cover3]
        deckCutouts: [true, true, true, true],
        // Cached Three.js object references for the 4 cover panels (populated after GLTF loads)
        deckCoverNodes: null,

        // Waste chute state: which cutout has waste installed (-1 = none, 0-3 = cutout index)
        wasteCutoutIdx: 2,   // Default to Panel 3
        // Parsed waste TML data (loaded from server on init)
        wasteTmlDef: null,
        // Three.js group for the installed waste chute (removed/rebuilt on change)
        wasteMesh: null,
        // Waste carrier 3D model cache key
        wasteModelCacheKey: '__WASTE_CHUTE__',

        // Entry Exit Drawer state
        drawerCutoutIdx: -1,
        drawerTmlDef: null,
        drawerMesh: null,
        drawerModelCacheKey: '__ENTRY_EXIT_DRAWER__',

        // EE drawer debug state
        eeDebugMode: false,
        _eeBasePos: null,

        // Back shield references (lighter panels on back side)
        backShieldNodes: [[], [], [], []],  // per-section arrays of meshes
        backShieldVisible: [true, true, true, false],

        // Waste unit debug state
        fixtureDebugMode: false,
        fixtureDebugTarget: 'body',   // 'body' | 'accessories' | 'group' | 'component'
        fixtureDebugComponent: '',    // child name when target === 'component'
        fixtureDebugOffsets: {
            body: { x: 0, y: 0, z: 0 },
            accessories: { x: 0, y: 0, z: 0 },
            group: { x: 0, y: 0, z: 0 }
        },
        fixtureDebugComponentOffsets: {},  // keyed by child.name → {x,y,z},

        // Settings: use generic (procedural) carrier rendering instead of .x models
        useGenericCarriers: false,

        // Settings: deck repositioning offset (applied on top of auto-calculated base pos)

    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    let initialized = false;

    // ================================================================
    //  Screenshot
    // ================================================================
    function vlSaveScreenshot(format, opts) {
        if (!vlState.renderer || !vlState.scene || !vlState.camera) return;
        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = vlState.scene.getObjectByName('__vlgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && vlState.gridVisible;

        const origBg = vlState.scene.background;
        if (!showBg) {
            vlState.scene.background = null;
            vlState.renderer.setClearColor(0x000000, 0);
        }

        vlState.renderer.render(vlState.scene, vlState.camera);
        const canvas = vlState.renderer.domElement;
        const fileName = 'vantage_layout';

        if (format === 'jpg') {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.jpg'); }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.png'); }, 'image/png');
        }

        if (grid) grid.visible = origGridVis;
        vlState.scene.background = origBg;
        if (!showBg) vlState.renderer.setClearColor(vlState.isDark ? DARK_BG : LIGHT_BG, 1);
        vlState.renderer.render(vlState.scene, vlState.camera);
    }

    function vlScreenshotPreviewDataURL(opts) {
        if (!vlState.renderer || !vlState.scene || !vlState.camera) return '';
        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = vlState.scene.getObjectByName('__vlgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && vlState.gridVisible;

        const origBg = vlState.scene.background;
        if (!showBg) {
            vlState.scene.background = null;
            vlState.renderer.setClearColor(0x000000, 0);
        }

        vlState.renderer.render(vlState.scene, vlState.camera);
        const dataURL = vlState.renderer.domElement.toDataURL('image/png');

        if (grid) grid.visible = origGridVis;
        vlState.scene.background = origBg;
        if (!showBg) vlState.renderer.setClearColor(vlState.isDark ? DARK_BG : LIGHT_BG, 1);
        vlState.renderer.render(vlState.scene, vlState.camera);

        return dataURL;
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.VantageLayoutModule = {
        init: initVantageLayout,
        updateTheme: updateVLTheme,
        saveScreenshot: vlSaveScreenshot,
        screenshotPreviewDataURL: vlScreenshotPreviewDataURL,
    };

    // ================================================================
    //  Init
    // ================================================================
    function initVantageLayout() {
        vlState.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updateVLTheme();
            return;
        }
        initialized = true;

        const canvas = $('#vl-canvas');
        const host   = $('#vl-host');
        if (!canvas || !host) return;

        vlState.canvas = canvas;
        vlState.host   = host;

        const w = host.clientWidth  || 1000;
        const h = host.clientHeight ||  700;

        // -- Scene --
        vlState.scene = new THREE.Scene();
        vlState.scene.background = new THREE.Color(vlState.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera -- (orthographic top-down by default for deck layout clarity)
        vlState.isPerspective = true;
        vlState.camera = new THREE.PerspectiveCamera(45, w / h, 1, 100000);
        // Position camera top-down, slightly tilted so it reads naturally
        const deckCX = DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT * DECK.TRACK_SPACING) / 2;
        vlState.camera.position.set(deckCX, 1600, 600);
        vlState.camera.up.set(0, 1, 0);

        // -- Renderer --
        vlState.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true,
        });
        vlState.renderer.setPixelRatio(window.devicePixelRatio);
        vlState.renderer.setSize(w, h);
        vlState.renderer.sortObjects = true;

        // -- Controls --
        vlState.controls = new THREE.OrbitControls(vlState.camera, vlState.renderer.domElement);
        vlState.controls.enableDamping = true;
        vlState.controls.dampingFactor = 0.12;
        vlState.controls.target.set(deckCX, 0, 280);
        vlState.controls.update();

        // -- Lights --
        vlState.scene.add(new THREE.AmbientLight(0xaaaaaa));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.8);
        d1.position.set(500, 800, 400);
        vlState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.4);
        d2.position.set(-200, -100, -300);
        vlState.scene.add(d2);

        // -- Invisible deck plane for raycasting drag --
        const planeGeo = new THREE.PlaneGeometry(3000, 3000);
        const planeMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
        vlState._deckPlane = new THREE.Mesh(planeGeo, planeMat);
        vlState._deckPlane.rotation.x = -Math.PI / 2;
        vlState._deckPlane.position.set(deckCX, DECK.SURFACE_Z + 1, 280);
        vlState._deckPlane.name = '__deckplane__';
        vlState.scene.add(vlState._deckPlane);

        // -- Raycaster --
        vlState._raycaster = new THREE.Raycaster();

        // -- Build deck geometry --
        buildDeckGeometry();

        // -- Load GLTF deck model (supplements procedural geometry) --
        loadDeckModel();

        // -- Preload .x/.hxx 3D models for built-in carriers --
        preloadBuiltinCarrierModels();

        // -- Preload waste chute & drawer TML and 3D models from server --
        loadWasteTmlFromServer();
        loadDrawerTmlFromServer();

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const cw = host.clientWidth;
            const ch = host.clientHeight;
            vlState.camera.aspect = cw / ch;
            vlState.camera.updateProjectionMatrix();
            vlState.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Render loop --
        function tick() {
            vlState.animId = requestAnimationFrame(tick);
            vlState.controls.update();
            vlState.renderer.render(vlState.scene, vlState.camera);
            drawVLGizmo();
        }
        tick();

        // -- Wire UI --
        wireVLControls();
        wireVLToolbar();
        wireTMLImport();
        wireRackImport();
        wireCarrierPalette();
        wireCanvasEvents();

        // Enable drag-to-place by default
        setDragToPlace(true);
        wireVLPanelToggles();
        populateCarrierPalette();
        populateRackPalette();
        resetVLCamera();
    }

    // ================================================================
    //  Build Deck Geometry (procedural — no external file needed)
    // ================================================================
    function buildDeckGeometry() {
        const scene = vlState.scene;
        const isDark = vlState.isDark;

        // Deck surface base
        const deckColor = isDark ? 0x1a2530 : 0xd0dce8;
        const deckW = DECK.CANVAS_W;
        const deckD = DECK.CANVAS_D;
        const surfaceGeo = new THREE.BoxGeometry(deckW, 4, deckD);
        const surfaceMat = new THREE.MeshLambertMaterial({ color: deckColor });
        const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
        surfaceMesh.position.set(deckW / 2 + (-80), DECK.SURFACE_Z - 2, DECK.CANVAS_D / 2 + 51);
        surfaceMesh.name = '__decksurf__';
        scene.add(surfaceMesh);

        // Track slots (80 tracks — tracks 61-80 shown as blocked)
        const trackColor = isDark ? 0x151f2a : 0xb0bfcf;
        const blockedTrackColor = isDark ? 0x2a1515 : 0xc09090;
        for (let i = 1; i <= DECK.TRACK_COUNT; i++) {
            const x = DECK.FIRST_TRACK_X + (i - 1) * DECK.TRACK_SPACING;
            const isLabeled = DECK.LABELED_TRACKS.has(i);
            const isBlocked = i > MAX_USABLE_TRACK;
            const geo = new THREE.BoxGeometry(DECK.TRACK_WIDTH, 2.5, DECK.TRACK_DEPTH);
            const baseColor = isBlocked ? blockedTrackColor
                : isLabeled ? (isDark ? 0x2a3d55 : 0x8fa8c0)
                : trackColor;
            const mat = new THREE.MeshLambertMaterial({ color: baseColor });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, DECK.SURFACE_Z + 1.25, DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2);
            mesh.name = `__track_${i}__`;
            mesh.userData.trackNum = i;
            scene.add(mesh);
        }

        // Track number labels (sprite-based text above every track)
        for (let i = 1; i <= DECK.TRACK_COUNT; i++) {
            const x = DECK.FIRST_TRACK_X + (i - 1) * DECK.TRACK_SPACING;
            const color = (i === 4) ? '#ee2222' : (i > MAX_USABLE_TRACK) ? '#aa4444' : undefined;
            addTrackLabel(String(i), x, isDark, color);
        }

        // Deck frame walls (side rails)
        const railColor = isDark ? 0x202d3a : 0xa0aec0;
        const railMat = new THREE.MeshLambertMaterial({ color: railColor });
        // Front rail
        const frontGeo = new THREE.BoxGeometry(deckW, 8, 6);
        const frontMesh = new THREE.Mesh(frontGeo, railMat);
        frontMesh.position.set(deckW / 2 + (-80), DECK.SURFACE_Z + 4, DECK.TRACK_Y_START - 4);
        frontMesh.name = '__rail_front__';
        scene.add(frontMesh);
        // Back rail
        const backGeo = new THREE.BoxGeometry(deckW, 8, 6);
        const backMesh = new THREE.Mesh(backGeo, railMat.clone());
        backMesh.position.set(deckW / 2 + (-80), DECK.SURFACE_Z + 4, DECK.TRACK_Y_START + DECK.TRACK_DEPTH + 4);
        backMesh.name = '__rail_back__';
        scene.add(backMesh);

        // Grid overlay on deck surface (mm-based via DeckUnits)
        const gridColor = isDark ? DARK_GRID : LIGHT_GRID;
        const grid = DeckUnits.createGrid(2000, 22.5, gridColor, { name: '__vlgrid__', visible: vlState.gridVisible });
        grid.position.set(DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT * DECK.TRACK_SPACING) / 2, DECK.SURFACE_Z + 4.1, 310);
        scene.add(grid);

        // Orientation labels (Front / Back / Left / Right)
        addOrientationLabels();
    }

    // ================================================================
    //  Load Real GLTF Deck Model
    // ================================================================
    function loadDeckModel() {
        if (typeof THREE.GLTFLoader === 'undefined') return;

        const loader = new THREE.GLTFLoader();
        loader.load(
            'DeckLayoutManager/vantage_20_deck.gltf',
            function (gltf) {
                const model = gltf.scene;
                model.name = '__vantage_gltf__';

                // Make all meshes slightly transparent so track slots / carriers
                // placed on top remain visually distinct.
                model.traverse(function (child) {
                    if (child.isMesh && child.material) {
                        const mats = Array.isArray(child.material)
                            ? child.material
                            : [child.material];
                        mats.forEach(function (m) {
                            m.transparent = true;
                            m.opacity = 0.88;
                            m.depthWrite = true;
                        });
                    }
                });

                // Compute world-space bounds with model at origin (before placing in scene)
                // --- Robust deck alignment: use geometry, not mesh name/color ---
                model.updateMatrixWorld(true);
                let deckSurf = null;
                let maxArea = 0;
                let deckBox = null;
                model.traverse(function(child) {
                    if (!child.isMesh) return;
                    const b = new THREE.Box3().setFromObject(child);
                    const size = new THREE.Vector3();
                    b.getSize(size);
                    // Look for the largest flat mesh (biggest X*Z, minimal Y thickness)
                    const area = size.x * size.z;
                    const flatness = size.y;
                    if (area > maxArea && flatness < 30 && size.x > 1000 && size.z > 400) {
                        maxArea = area;
                        deckSurf = child;
                        deckBox = b;
                    }
                });
                if (!deckBox) {
                    // fallback: use widest mesh
                    model.traverse(function(child) {
                        if (!child.isMesh) return;
                        const b = new THREE.Box3().setFromObject(child);
                        const size = new THREE.Vector3();
                        b.getSize(size);
                        if (size.x > maxArea) { maxArea = size.x; deckSurf = child; deckBox = b; }
                    });
                }
                const center = deckBox ? deckBox.getCenter(new THREE.Vector3()) : new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
                // Align GLTF so its TOP surface sits at DECK.SURFACE_Z.
                // Use PHYSICAL_TRACKS — the GLTF model only covers the original deck hardware.
                const deckCenterX = DECK.FIRST_TRACK_X + ((DECK.PHYSICAL_TRACKS - 1) * DECK.TRACK_SPACING) / 2;
                const deckCenterZ = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;
                const yTop = deckBox ? deckBox.max.y : new THREE.Box3().setFromObject(model).max.y;
                model.position.set(
                    deckCenterX - center.x,
                    DECK.SURFACE_Z - yTop,
                    deckCenterZ - center.z
                );

                vlState.gltfModel = model;
                vlState._gltfOriginalBasePos = model.position.clone();
                vlState._gltfBasePos = model.position.clone();
                vlState.scene.add(model);

                // Restore any saved debug offsets from a previous session
                try {
                    const saved = JSON.parse(localStorage.getItem('vl-deck-debug-offsets'));
                    if (saved && (saved.x || saved.y || saved.z)) {
                        model.position.set(
                            vlState._gltfBasePos.x + (saved.x || 0),
                            vlState._gltfBasePos.y + (saved.y || 0),
                            vlState._gltfBasePos.z + (saved.z || 0)
                        );
                        vlState._gltfBasePos = model.position.clone();
                    }
                } catch (_) { /* ignore */ }

                // Collect cover node references by traversal (robust — avoids getObjectByName issues)
                collectDeckCoverNodes();

                // Apply any pre-set settings (cutout visibility)
                applyCutoutVisibility();

                // Hide procedural geometry — GLTF provides authentic deck visuals
                const procNames = ['__decksurf__', '__rail_front__', '__rail_back__', '__wastearea__'];
                procNames.forEach(n => {
                    const o = vlState.scene.getObjectByName(n);
                    if (o) o.visible = false;
                });
                for (let i = 1; i <= DECK.TRACK_COUNT; i++) {
                    const o = vlState.scene.getObjectByName(`__track_${i}__`);
                    if (o) o.visible = false;
                }

                // Reposition orientation labels to sit outside the actual GLTF bounds
                repositionOrientationLabels(model);

                showVLStatus('Vantage deck model loaded', 'ok');
            },
            undefined,
            function (err) {
                console.warn('VantageLayout: GLTF load failed', err);
                // Procedural geometry remains visible as fallback
            }
        );
    }

    // ================================================================
    //  Preload .x/.hxx 3D Models for Built-in Carriers
    // ================================================================
    function preloadBuiltinCarrierModels() {
        if (typeof THREE.XFileLoader === 'undefined') return;

        Object.keys(CARRIER_LIBRARY).forEach(function (key) {
            var def = CARRIER_LIBRARY[key];
            if (!def.modelFile) return;

            var filePath = def.modelFile;
            var isHxx = /\.hxx$/i.test(filePath);

            fetch(filePath).then(function (resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                // Always fetch as arrayBuffer to preserve binary .x files
                return resp.arrayBuffer();
            }).then(function (data) {
                if (isHxx) {
                    // Use HXXLoader to extract .x data from .hxx container
                    if (typeof HXXLoader === 'undefined') {
                        console.warn('[VantageLayout] HXXLoader not available, skipping', key);
                        return;
                    }
                    return HXXLoader.parse(data).then(function (result) {
                        // Return binary ArrayBuffer or text string
                        return result.xFileBinary || result.xFileText;
                    });
                }
                return data; // raw .x bytes (may be binary or text format)
            }).then(function (xData) {
                if (!xData) return;
                // Create blob preserving original bytes (binary or text .x)
                var blob = new Blob([xData], { type: 'application/octet-stream' });
                var url = URL.createObjectURL(blob);
                var manager = new THREE.LoadingManager();
                // Resolve texture paths relative to the original model file location
                var basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
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
                        console.warn('[VantageLayout] No geometry in model for', key);
                        return;
                    }

                    var group = new THREE.Group();
                    group.name = '__xmodel_template_' + key + '__';
                    object.models.forEach(function (m, idx) {
                        m.renderOrder = idx;
                        if (m.material) {
                            var mats = Array.isArray(m.material) ? m.material : [m.material];
                            mats.forEach(function (mat) {
                                if (!mat) return;
                                mat.polygonOffset = true;
                                mat.polygonOffsetFactor = idx === 0 ? 1 : -(idx + 1);
                                mat.polygonOffsetUnits  = idx === 0 ? 1 : -(idx + 1) * 2;
                            });
                        }
                        group.add(m);
                    });

                    fixXFileCoords(group);
                    vlState.xModelCache[key] = group;

                    // Rebuild any already-placed carriers of this type
                    rebuildPlacedCarriersOfType(key);

                    console.log('[VantageLayout] Preloaded model for', key);
                }, undefined, function (err) {
                    URL.revokeObjectURL(url);
                    console.warn('[VantageLayout] Failed to parse .x for', key, err);
                });
            }).catch(function (err) {
                console.warn('[VantageLayout] Could not preload model for', key, ':', err.message);
            });
        });
    }

    /**
     * Rebuild all placed carriers of a given type (after model load or setting change).
     */
    function rebuildPlacedCarriersOfType(carrierKey) {
        // If this is a waste model update, rebuild the waste mesh instead
        if (carrierKey === vlState.wasteModelCacheKey) {
            rebuildWasteMesh();
            return;
        }

        var toRefresh = vlState.placedCarriers.filter(function (c) { return c.type === carrierKey; });
        toRefresh.forEach(function (carrier) {
            var trackStart = carrier.trackStart;
            var def = carrier.def;

            // Dispose old mesh
            carrier.mesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(function (m) { if (m) m.dispose(); });
                }
            });
            vlState.scene.remove(carrier.mesh);

            // Build new mesh
            var result = buildCarrierMesh(def, trackStart);
            vlState.scene.add(result.group);

            // Re-attach any existing plates
            var plateMeshes = [];
            carrier.plateMeshes.forEach(function (pm) {
                var site = def.sites.find(function (s) { return s.id === pm.siteId; });
                if (site) {
                    var newPm = buildPlateMesh(site, def);
                    result.group.add(newPm);
                    plateMeshes.push({ siteId: pm.siteId, mesh: newPm });
                }
            });

            carrier.mesh = result.group;
            carrier.siteMeshes = result.siteMeshes;
            carrier.plateMeshes = plateMeshes;

            // Re-attach any assigned containers
            if (carrier.siteContainers) {
                carrier.containerMeshes = [];
                Object.keys(carrier.siteContainers).forEach(function (siteIdStr) {
                    var rackKey = carrier.siteContainers[siteIdStr];
                    var rackDef = vlState.rackLibrary[rackKey];
                    var site = def.sites.find(function (s) { return s.id === parseInt(siteIdStr, 10); });
                    if (rackDef && site) {
                        var cm = buildContainerMesh(rackKey, rackDef, site, def);
                        if (cm) {
                            result.group.add(cm);
                            carrier.containerMeshes.push({ siteId: parseInt(siteIdStr, 10), rackKey: rackKey, mesh: cm });
                        }
                    }
                });
            }
        });
    }

    /**
     * Rebuild ALL placed carriers (used when toggling generic carrier mode).
     */
    function rebuildAllPlacedCarriers() {
        var types = {};
        vlState.placedCarriers.forEach(function (c) { types[c.type] = true; });
        Object.keys(types).forEach(function (key) {
            rebuildPlacedCarriersOfType(key);
        });
        // Also rebuild waste mesh if installed
        rebuildWasteMesh();
    }

    function addTrackLabel(text, xPos, isDark, overrideColor) {
        const size = 64;
        const cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = overrideColor || '#ffffff';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2);
        const tex = new THREE.CanvasTexture(cv);
        tex.premultiplyAlpha = false;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, alphaTest: 0.1 });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(14, 14, 1);
        sprite.position.set(xPos, DECK.SURFACE_Z + 12, DECK.TRACK_Y_START + DECK.TRACK_DEPTH + 12);
        sprite.name = `__tracklabel_${text}__`;
        vlState.scene.add(sprite);
    }

    function addOrientationLabel(text, x, y, z, scaleFactor) {
        const cvW = 512;
        const cvH = 128;
        const cv = document.createElement('canvas');
        cv.width = cvW; cv.height = cvH;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, cvW, cvH);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cvW / 2, cvH / 2);
        const tex = new THREE.CanvasTexture(cv);
        tex.premultiplyAlpha = false;
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            alphaTest: 0.1,
            depthTest: false,
            depthWrite: false
        });
        const sprite = new THREE.Sprite(mat);
        sprite.renderOrder = 9999;
        sprite.scale.set(scaleFactor * 4, scaleFactor, 1);
        sprite.position.set(x, y, z);
        sprite.name = `__orientlabel_${text.toLowerCase()}__`;
        vlState.scene.add(sprite);
    }

    function addOrientationLabels() {
        const centerX = DECK.FIRST_TRACK_X + ((DECK.PHYSICAL_TRACKS - 1) * DECK.TRACK_SPACING) / 2;
        const centerZ = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;
        const labelY = DECK.SURFACE_Z + 20;
        const scale = 18;

        // Place labels well outside the track area as initial fallback;
        // repositionOrientationLabels() will update them once the GLTF loads.
        const padFB = 300;
        const padLR = 300;

        addOrientationLabel('FRONT', centerX, labelY, DECK.TRACK_Y_START + DECK.TRACK_DEPTH + padFB, scale);
        addOrientationLabel('BACK', centerX, labelY, DECK.TRACK_Y_START - padFB, scale);
        addOrientationLabel('LEFT', DECK.FIRST_TRACK_X - padLR, labelY, centerZ, scale);
        addOrientationLabel('RIGHT', DECK.FIRST_TRACK_X + (DECK.PHYSICAL_TRACKS - 1) * DECK.TRACK_SPACING + padLR, labelY, centerZ, scale);
    }

    function toggleOrientationLabels() {
        vlState.labelsVisible = !vlState.labelsVisible;
        const names = ['__orientlabel_front__', '__orientlabel_back__', '__orientlabel_left__', '__orientlabel_right__'];
        names.forEach(function (n) {
            const obj = vlState.scene.getObjectByName(n);
            if (obj) obj.visible = vlState.labelsVisible;
        });
        const btn = vlState.host.querySelector('#vl-vt-labels');
        if (btn) btn.classList.toggle('vt-active', vlState.labelsVisible);
    }

    /**
     * Reposition orientation labels so they sit outside the actual GLTF
     * bounding box with equal symmetric padding on each axis pair.
     */
    function repositionOrientationLabels(gltfModel) {
        // Compute world-space bounding box of the placed GLTF model
        const box = new THREE.Box3().setFromObject(gltfModel);
        const pad = 80;  // mm clearance outside the model on every side
        const labelY = DECK.SURFACE_Z + 20;
        const centerX = (box.min.x + box.max.x) / 2;
        const centerZ = (box.min.z + box.max.z) / 2;

        const names = {
            front: vlState.scene.getObjectByName('__orientlabel_front__'),
            back:  vlState.scene.getObjectByName('__orientlabel_back__'),
            left:  vlState.scene.getObjectByName('__orientlabel_left__'),
            right: vlState.scene.getObjectByName('__orientlabel_right__'),
        };
        if (names.front) names.front.position.set(centerX, labelY, box.max.z + pad);
        if (names.back)  names.back.position.set(centerX, labelY, box.min.z - pad);
        if (names.left)  names.left.position.set(box.min.x - pad, labelY, centerZ);
        if (names.right)  names.right.position.set(box.max.x + pad, labelY, centerZ);
    }

    // ================================================================
    //  Hamilton Path Resolver
    // ================================================================
    const HAMILTON_LABWARE_BASE = 'Base Hamilton Files/Labware/';

    /**
     * Convert a Hamilton-relative path (e.g. "ML_STAR\\CORE\\foo.x")
     * to a server-relative path (e.g. "Base Hamilton Files/Labware/ML_STAR/CORE/foo.x").
     */
    function resolveHamiltonPath(hamiltonPath) {
        if (!hamiltonPath) return null;
        return HAMILTON_LABWARE_BASE + hamiltonPath.replace(/\\/g, '/');
    }

    // ================================================================
    //  RCK Labware File Parser — extract 3D model info
    // ================================================================

    /**
     * Parse a text-format .rck file (HxCfgFile header) and extract 3D model info.
     */
    function parseRCKText(text) {
        var result = { model: null, modelRel: null, xOff: 0, yOff: 0, zOff: 0 };
        var kvRe = /^(\S+),\s*"([^"]*)"[;,]?\s*$/gm;
        var m;
        while ((m = kvRe.exec(text)) !== null) {
            switch (m[1]) {
                case '3DModel':    result.model    = m[2]; break;
                case '3DModelRel': result.modelRel = m[2]; break;
                case '3DxOffset':  result.xOff     = parseFloat(m[2]) || 0; break;
                case '3DyOffset':  result.yOff     = parseFloat(m[2]) || 0; break;
                case '3DzOffset':  result.zOff     = parseFloat(m[2]) || 0; break;
            }
        }
        return result;
    }

    /**
     * Parse a binary-format .rck file (no HxCfgFile header) and extract 3D model info.
     * Binary format: length-prefixed key-value pairs where each
     * entry is: [keyLen:1 byte][key string][valLen:1 byte][value string]
     */
    function parseRCKBinary(arrayBuffer) {
        var result = { model: null, modelRel: null, xOff: 0, yOff: 0, zOff: 0 };
        var bytes = new Uint8Array(arrayBuffer);
        // Use strings extraction approach: find 3DModel and offset keys
        var text = '';
        for (var i = 0; i < bytes.length; i++) {
            text += (bytes[i] >= 32 && bytes[i] < 127) ? String.fromCharCode(bytes[i]) : '\n';
        }
        // Extract key-value pairs from the cleaned text
        var modelMatch = text.match(/3DModel\n([^\n]+)/);
        if (modelMatch) result.model = modelMatch[1];
        var modelRelMatch = text.match(/3DModelRel\n([^\n]+)/);
        if (modelRelMatch) result.modelRel = modelRelMatch[1];
        var xOffMatch = text.match(/3DxOffset\n([^\n]+)/);
        if (xOffMatch) result.xOff = parseFloat(xOffMatch[1]) || 0;
        var yOffMatch = text.match(/3DyOffset\n([^\n]+)/);
        if (yOffMatch) result.yOff = parseFloat(yOffMatch[1]) || 0;
        var zOffMatch = text.match(/3DzOffset\n([^\n]+)/);
        if (zOffMatch) result.zOff = parseFloat(zOffMatch[1]) || 0;
        return result;
    }

    /**
     * Fetch and parse a .rck file (text or binary) to extract its 3D model info.
     * Returns a Promise<{model, modelRel, xOff, yOff, zOff}>.
     */
    function fetchAndParseRCK(serverPath) {
        return fetch(serverPath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (ab) {
            // Check if text format (starts with 'HxCfgFile')
            var header = new Uint8Array(ab, 0, Math.min(ab.byteLength, 20));
            var headerStr = String.fromCharCode.apply(null, header);
            if (headerStr.indexOf('HxCfgFile') >= 0) {
                var text = new TextDecoder().decode(ab);
                return parseRCKText(text);
            } else {
                return parseRCKBinary(ab);
            }
        });
    }

    // ================================================================
    //  Site Labware 3D Model Loading
    // ================================================================

    /**
     * Load 3D models for all sites that have LabwareFile references.
     * Fetches .rck → extracts 3DModel → fetches .x/.hxx → caches in vlState.siteModelCache.
     * carrierKey: the CARRIER_LIBRARY key
     * sites: array of site objects (parsed from TML, with labwareFile property)
     */
    function loadSiteLabwareModels(carrierKey, sites) {
        if (!sites || !sites.length) return;

        sites.forEach(function (site) {
            if (!site.labwareFile) return;

            var rckPath = resolveHamiltonPath(site.labwareFile);
            if (!rckPath) return;

            var cacheKey = site.labwareFile.replace(/\\/g, '/').toLowerCase();
            // Skip if already cached or in-flight
            if (vlState.siteModelCache[cacheKey] || vlState.siteModelLoading[cacheKey]) return;
            vlState.siteModelLoading[cacheKey] = true;

            fetchAndParseRCK(rckPath).then(function (rckInfo) {
                if (!rckInfo.model && !rckInfo.modelRel) {
                    console.log('[VantageLayout] No 3D model in', rckPath);
                    return;
                }

                var modelHamiltonPath = rckInfo.model;
                var modelServerPath = resolveHamiltonPath(modelHamiltonPath);
                if (!modelServerPath) return;

                var isHxx = /\.hxx$/i.test(modelServerPath);

                return fetch(modelServerPath).then(function (resp) {
                    if (!resp.ok) throw new Error('HTTP ' + resp.status + ' for ' + modelServerPath);
                    return resp.arrayBuffer();
                }).then(function (data) {
                    if (isHxx && typeof HXXLoader !== 'undefined') {
                        return HXXLoader.parse(data).then(function (result) {
                            return result.xFileBinary || result.xFileText;
                        });
                    }
                    return data;
                }).then(function (xData) {
                    if (!xData) return;

                    var blob = new Blob([xData], { type: 'application/octet-stream' });
                    var url = URL.createObjectURL(blob);
                    var manager = new THREE.LoadingManager();
                    var basePath = modelServerPath.substring(0, modelServerPath.lastIndexOf('/') + 1);
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
                            console.warn('[VantageLayout] No geometry in site model', modelServerPath);
                            return;
                        }

                        var group = new THREE.Group();
                        group.name = '__site_model_' + cacheKey + '__';
                        object.models.forEach(function (mdl, idx) {
                            mdl.renderOrder = idx + 50;
                            if (mdl.material) {
                                var mats = Array.isArray(mdl.material) ? mdl.material : [mdl.material];
                                mats.forEach(function (mat) {
                                    if (!mat) return;
                                    mat.polygonOffset = true;
                                    mat.polygonOffsetFactor = -2;
                                    mat.polygonOffsetUnits = -4;
                                });
                            }
                            group.add(mdl);
                        });

                        fixXFileCoords(group);

                        // Store model info with offsets from the .rck
                        vlState.siteModelCache[cacheKey] = {
                            group: group,
                            xOff: rckInfo.xOff,
                            yOff: rckInfo.yOff,
                            zOff: rckInfo.zOff,
                        };

                        console.log('[VantageLayout] Loaded site model:', cacheKey);

                        // Rebuild carriers that use this labware
                        rebuildPlacedCarriersOfType(carrierKey);
                    }, undefined, function (err) {
                        URL.revokeObjectURL(url);
                        console.warn('[VantageLayout] Failed to load site model:', modelServerPath, err);
                    });
                });
            }).catch(function (err) {
                console.warn('[VantageLayout] Could not load labware', rckPath, ':', err.message);
            }).finally(function () {
                vlState.siteModelLoading[cacheKey] = false;
            });
        });
    }

    // ================================================================
    //  TML Parser
    // ================================================================
    function parseTML(text) {
        const result = {
            viewName: '', description: '', tWidth: 6,
            dx: 135, dy: 497, dz: 130, color: 0x607080,
            sites: [], raw: {},
        };

        // Extract all key → value pairs
        const kvRe = /^(\S+),\s*"([^"]*)"[;,]?\s*$/gm;
        let m;
        const kv = {};
        while ((m = kvRe.exec(text)) !== null) {
            kv[m[1]] = m[2];
        }
        result.raw = kv;

        if (kv['ViewName'])    result.viewName    = kv['ViewName'];
        if (kv['Description']) result.description = kv['Description'];
        if (kv['Dim.Dx'])      result.dx          = parseFloat(kv['Dim.Dx']);
        if (kv['Dim.Dy'])      result.dy          = parseFloat(kv['Dim.Dy']);
        if (kv['Dim.Dz'])      result.dz          = parseFloat(kv['Dim.Dz']);

        // Find MlStarCarWidthAsT
        let propCnt = parseInt(kv['PropertyCnt'] || '0', 10);
        for (let pi = 1; pi <= propCnt; pi++) {
            if (kv[`Property.${pi}`] === 'MlStarCarWidthAsT') {
                result.tWidth = parseInt(kv[`PropertyValue.${pi}`] || '6', 10);
            }
        }

        // Parse sites
        let siteCnt = parseInt(kv['Site.Cnt'] || '0', 10);
        for (let si = 1; si <= siteCnt; si++) {
            const siteId = parseInt(kv[`Site.${si}.Id`] || String(si), 10);
            const sx     = parseFloat(kv[`Site.${si}.X`]  || '4');
            const sy     = parseFloat(kv[`Site.${si}.Y`]  || '0');
            const sz     = parseFloat(kv[`Site.${si}.Z`]  || '86.15');
            const sdx    = parseFloat(kv[`Site.${si}.Dx`] || '127');
            const sdy    = parseFloat(kv[`Site.${si}.Dy`] || '86');
            const siteEntry = { id: siteId, x: sx, y: sy, z: sz, dx: sdx, dy: sdy };
            // Extract labware file reference for this site
            if (kv[`Site.${si}.LabwareFile`]) {
                siteEntry.labwareFile = kv[`Site.${si}.LabwareFile`];
            }
            if (kv[`Site.${si}.LabwareFileRel`]) {
                siteEntry.labwareFileRel = kv[`Site.${si}.LabwareFileRel`];
            }
            result.sites.push(siteEntry);
        }

        // Extract 3D model relative path (used to auto-load .x/.hxx companion)
        if (kv['3DModelRel']) {
            result.modelFileRel = kv['3DModelRel'].replace(/\\/g, '/').replace(/^\.\//, '');
        }
        // Extract absolute Hamilton path for 3D model (for server auto-fetch)
        if (kv['3DModel']) {
            result.modelFileHamilton = kv['3DModel'];
        }
        // Extract 3D offsets for the carrier body model
        if (kv['3DxOffset']) result.model3DxOff = parseFloat(kv['3DxOffset']) || 0;
        if (kv['3DyOffset']) result.model3DyOff = parseFloat(kv['3DyOffset']) || 0;
        if (kv['3DzOffset']) result.model3DzOff = parseFloat(kv['3DzOffset']) || 0;

        return result;
    }

    // ================================================================
    //  Rack / Container Library — parse .rck & load 3D model
    // ================================================================

    /**
     * Parse a text-format .rck and extract full rack metadata
     * (dimensions, description, 3D model, container references, etc.).
     */
    function parseRCKFull(text) {
        var result = {
            name: '', description: '',
            dx: 0, dy: 0, dz: 0,
            model: null, modelRel: null,
            xOff: 0, yOff: 0, zOff: 0,
            viewName: '', rows: 0, columns: 0,
        };
        var kvRe = /^(\S+),\s*"([^"]*)"[;,]?\s*$/gm;
        var m;
        while ((m = kvRe.exec(text)) !== null) {
            switch (m[1]) {
                case '3DModel':     result.model      = m[2]; break;
                case '3DModelRel':  result.modelRel   = m[2]; break;
                case '3DxOffset':   result.xOff       = parseFloat(m[2]) || 0; break;
                case '3DyOffset':   result.yOff       = parseFloat(m[2]) || 0; break;
                case '3DzOffset':   result.zOff       = parseFloat(m[2]) || 0; break;
                case 'Description': result.description = m[2]; break;
                case 'ViewName':    result.viewName   = m[2]; break;
                case 'Dim.Dx':      result.dx         = parseFloat(m[2]) || 0; break;
                case 'Dim.Dy':      result.dy         = parseFloat(m[2]) || 0; break;
                case 'Dim.Dz':      result.dz         = parseFloat(m[2]) || 0; break;
                case 'Rows':        result.rows       = parseInt(m[2], 10) || 0; break;
                case 'Columns':     result.columns    = parseInt(m[2], 10) || 0; break;
            }
        }
        if (!result.name) result.name = result.viewName || 'Unnamed Rack';
        return result;
    }

    /**
     * Parse a binary .rck into full rack metadata (same fields as parseRCKFull).
     */
    function parseRCKFullBinary(arrayBuffer) {
        var bytes = new Uint8Array(arrayBuffer);
        var text = '';
        for (var i = 0; i < bytes.length; i++) {
            text += (bytes[i] >= 32 && bytes[i] < 127) ? String.fromCharCode(bytes[i]) : '\n';
        }
        var result = {
            name: '', description: '',
            dx: 0, dy: 0, dz: 0,
            model: null, modelRel: null,
            xOff: 0, yOff: 0, zOff: 0,
            viewName: '', rows: 0, columns: 0,
        };
        var match;
        match = text.match(/3DModel\n([^\n]+)/);     if (match) result.model = match[1];
        match = text.match(/3DModelRel\n([^\n]+)/);  if (match) result.modelRel = match[1];
        match = text.match(/3DxOffset\n([^\n]+)/);   if (match) result.xOff = parseFloat(match[1]) || 0;
        match = text.match(/3DyOffset\n([^\n]+)/);   if (match) result.yOff = parseFloat(match[1]) || 0;
        match = text.match(/3DzOffset\n([^\n]+)/);   if (match) result.zOff = parseFloat(match[1]) || 0;
        match = text.match(/Description\n([^\n]+)/); if (match) result.description = match[1];
        match = text.match(/ViewName\n([^\n]+)/);    if (match) result.viewName = match[1];
        match = text.match(/Dim\.Dx\n([^\n]+)/);     if (match) result.dx = parseFloat(match[1]) || 0;
        match = text.match(/Dim\.Dy\n([^\n]+)/);     if (match) result.dy = parseFloat(match[1]) || 0;
        match = text.match(/Dim\.Dz\n([^\n]+)/);     if (match) result.dz = parseFloat(match[1]) || 0;
        match = text.match(/Rows\n([^\n]+)/);        if (match) result.rows = parseInt(match[1], 10) || 0;
        match = text.match(/Columns\n([^\n]+)/);     if (match) result.columns = parseInt(match[1], 10) || 0;
        if (!result.name) result.name = result.viewName || 'Unnamed Rack';
        return result;
    }

    /**
     * Import a .rck file (from File object) into the rack library.
     * Optionally also receives a companion .x/.hxx file.
     */
    function importRackFile(rckFile, companionXFile) {
        var reader = new FileReader();
        reader.onload = function () {
            var ab = reader.result;
            var header = new Uint8Array(ab, 0, Math.min(ab.byteLength, 20));
            var headerStr = String.fromCharCode.apply(null, header);
            var rackInfo;
            if (headerStr.indexOf('HxCfgFile') >= 0) {
                rackInfo = parseRCKFull(new TextDecoder().decode(ab));
            } else {
                rackInfo = parseRCKFullBinary(ab);
            }

            var rackKey = rckFile.name.replace(/\.rck$/i, '');
            rackInfo.name = rackInfo.viewName || rackKey;
            rackInfo.fileName = rckFile.name;
            rackInfo.source = 'file';

            vlState.rackLibrary[rackKey] = rackInfo;
            showVLStatus('Imported rack: ' + rackInfo.name, 'ok');
            populateRackPalette();

            // If companion .x/.hxx is provided, load it immediately
            if (companionXFile) {
                loadXModelForRack(rackKey, companionXFile);
            } else if (rackInfo.model) {
                // Try auto-fetch from Hamilton server path
                autoFetchRackModel(rackKey, rackInfo.model);
            }
        };
        reader.readAsArrayBuffer(rckFile);
    }

    /**
     * Load a .x/.hxx model file for a rack definition and cache it.
     */
    function loadXModelForRack(rackKey, file) {
        if (!vlState.rackLibrary[rackKey]) return;
        var reader = new FileReader();
        reader.onload = function () {
            var ab = reader.result;
            var isHxx = /\.hxx$/i.test(file.name);

            var dataPromise;
            if (isHxx && typeof HXXLoader !== 'undefined') {
                dataPromise = HXXLoader.parse(ab).then(function (result) {
                    return result.xFileBinary || result.xFileText;
                });
            } else {
                dataPromise = Promise.resolve(ab);
            }

            dataPromise.then(function (xData) {
                if (!xData) return;
                var blob = new Blob([xData], { type: 'application/octet-stream' });
                var url = URL.createObjectURL(blob);
                var loader = new THREE.XFileLoader(new THREE.LoadingManager());
                loader.load(url, function (object) {
                    URL.revokeObjectURL(url);
                    if (!object || !object.models || object.models.length === 0) return;
                    var group = new THREE.Group();
                    group.name = '__rack_model_' + rackKey + '__';
                    object.models.forEach(function (mdl, idx) {
                        mdl.renderOrder = idx + 50;
                        if (mdl.material) {
                            var mats = Array.isArray(mdl.material) ? mdl.material : [mdl.material];
                            mats.forEach(function (mat) {
                                if (!mat) return;
                                mat.polygonOffset = true;
                                mat.polygonOffsetFactor = -2;
                                mat.polygonOffsetUnits = -4;
                            });
                        }
                        group.add(mdl);
                    });
                    fixXFileCoords(group);
                    vlState.rackModelCache[rackKey] = group;
                    showVLStatus('Loaded 3D model for rack: ' + rackKey, 'ok');
                    populateRackPalette();
                    // Rebuild any carriers that have this rack assigned
                    rebuildCarriersWithRack(rackKey);
                }, undefined, function () {
                    URL.revokeObjectURL(url);
                });
            });
        };
        reader.readAsArrayBuffer(file);
    }

    /**
     * Auto-fetch rack 3D model from server using its Hamilton path.
     */
    function autoFetchRackModel(rackKey, hamiltonPath) {
        var serverPath = resolveHamiltonPath(hamiltonPath);
        if (!serverPath) return;
        if (vlState.rackModelLoading[rackKey]) return;
        vlState.rackModelLoading[rackKey] = true;

        var isHxx = /\.hxx$/i.test(serverPath);
        fetch(serverPath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (data) {
            if (isHxx && typeof HXXLoader !== 'undefined') {
                return HXXLoader.parse(data).then(function (result) {
                    return result.xFileBinary || result.xFileText;
                });
            }
            return data;
        }).then(function (xData) {
            if (!xData) return;
            var blob = new Blob([xData], { type: 'application/octet-stream' });
            var url = URL.createObjectURL(blob);
            var basePath = serverPath.substring(0, serverPath.lastIndexOf('/') + 1);
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
                if (!object || !object.models || object.models.length === 0) return;
                var group = new THREE.Group();
                group.name = '__rack_model_' + rackKey + '__';
                object.models.forEach(function (mdl, idx) {
                    mdl.renderOrder = idx + 50;
                    if (mdl.material) {
                        var mats = Array.isArray(mdl.material) ? mdl.material : [mdl.material];
                        mats.forEach(function (mat) {
                            if (!mat) return;
                            mat.polygonOffset = true;
                            mat.polygonOffsetFactor = -2;
                            mat.polygonOffsetUnits = -4;
                        });
                    }
                    group.add(mdl);
                });
                fixXFileCoords(group);
                vlState.rackModelCache[rackKey] = group;
                populateRackPalette();
                rebuildCarriersWithRack(rackKey);
            }, undefined, function () {
                URL.revokeObjectURL(url);
            });
        }).catch(function (err) {
            console.warn('[VantageLayout] Could not fetch rack model:', serverPath, err.message);
        }).finally(function () {
            vlState.rackModelLoading[rackKey] = false;
        });
    }

    /**
     * Import a .rck from a server Hamilton path (e.g. browsing available racks).
     */
    function importRackFromServer(hamiltonPath) {
        var serverPath = resolveHamiltonPath(hamiltonPath);
        if (!serverPath) return Promise.reject(new Error('Invalid path'));

        return fetch(serverPath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (ab) {
            var header = new Uint8Array(ab, 0, Math.min(ab.byteLength, 20));
            var headerStr = String.fromCharCode.apply(null, header);
            var rackInfo;
            if (headerStr.indexOf('HxCfgFile') >= 0) {
                rackInfo = parseRCKFull(new TextDecoder().decode(ab));
            } else {
                rackInfo = parseRCKFullBinary(ab);
            }

            var fileName = hamiltonPath.replace(/\\/g, '/').split('/').pop();
            var rackKey = fileName.replace(/\.rck$/i, '');
            rackInfo.name = rackInfo.viewName || rackKey;
            rackInfo.fileName = fileName;
            rackInfo.source = 'server';
            rackInfo.hamiltonPath = hamiltonPath;

            vlState.rackLibrary[rackKey] = rackInfo;
            populateRackPalette();

            // Auto-load 3D model if referenced
            if (rackInfo.model) {
                autoFetchRackModel(rackKey, rackInfo.model);
            }

            return rackKey;
        });
    }

    /**
     * Assign a rack from the rack library to a carrier site.
     */
    function assignRackToSite(carrierId, siteId, rackKey) {
        var carrier = vlState.placedCarriers.find(function (c) { return c.id === carrierId; });
        if (!carrier) return;
        var site = carrier.def.sites.find(function (s) { return s.id === siteId; });
        if (!site) return;
        var rackDef = vlState.rackLibrary[rackKey];
        if (!rackDef) return;

        // Remove existing plate mesh on this site if any
        var existingPlate = carrier.plateMeshes.find(function (p) { return p.siteId === siteId; });
        if (existingPlate) {
            carrier.mesh.remove(existingPlate.mesh);
            existingPlate.mesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material]).forEach(function (m) { if (m) m.dispose(); });
                }
            });
            carrier.plateMeshes = carrier.plateMeshes.filter(function (p) { return p.siteId !== siteId; });
        }

        // Remove existing container model on this site if any
        removeContainerFromSite(carrier, siteId);

        // Store assignment on the carrier entry
        if (!carrier.siteContainers) carrier.siteContainers = {};
        carrier.siteContainers[siteId] = rackKey;

        // Build container mesh at site
        var containerMesh = buildContainerMesh(rackKey, rackDef, site, carrier.def);
        if (containerMesh) {
            carrier.mesh.add(containerMesh);
            if (!carrier.containerMeshes) carrier.containerMeshes = [];
            carrier.containerMeshes.push({ siteId: siteId, rackKey: rackKey, mesh: containerMesh });
        }

        showVLStatus('Placed ' + rackDef.name + ' on site ' + siteId + '.', 'ok');
        updateSitePanel(carrier);
    }

    /**
     * Remove a container/rack from a carrier site.
     */
    function removeContainerFromSite(carrier, siteId) {
        if (!carrier.containerMeshes) return;
        var existing = carrier.containerMeshes.find(function (c) { return c.siteId === siteId; });
        if (!existing) return;
        carrier.mesh.remove(existing.mesh);
        existing.mesh.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                (Array.isArray(child.material) ? child.material : [child.material]).forEach(function (m) { if (m) m.dispose(); });
            }
        });
        carrier.containerMeshes = carrier.containerMeshes.filter(function (c) { return c.siteId !== siteId; });
        if (carrier.siteContainers) delete carrier.siteContainers[siteId];
    }

    /**
     * Build a 3D mesh for a container/rack placed on a carrier site.
     */
    function buildContainerMesh(rackKey, rackDef, site, carrierDef) {
        var cachedModel = vlState.rackModelCache[rackKey];
        var mesh;

        if (cachedModel) {
            // Clone cached 3D model
            mesh = cachedModel.clone(true);
            mesh.name = '__container_site' + site.id + '_' + rackKey + '__';

            // Deep-clone materials
            mesh.traverse(function (child) {
                if (!child.isMesh) return;
                child.frustumCulled = false;
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(function (m) { return m ? m.clone() : m; });
                } else if (child.material) {
                    child.material = child.material.clone();
                }
            });

            // Position at site: center on site, bottom at site.z
            // Add tiny Y lift (+0.15) to prevent coplanar z-fighting with carrier shelf surfaces
            var box = new THREE.Box3().setFromObject(mesh);
            var center = box.getCenter(new THREE.Vector3());
            var xOff = rackDef.xOff || 0;
            var yOff = rackDef.yOff || 0;
            var zOff = rackDef.zOff || 0;

            mesh.position.set(
                site.x + site.dx / 2 - center.x + xOff,
                site.z - box.min.y + zOff + 0.15,
                site.y + site.dy / 2 - center.z + yOff
            );
        } else {
            // Procedural fallback: box matching rack dimensions
            var rdx = rackDef.dx || site.dx;
            var rdy = rackDef.dy || site.dy;
            var rdz = rackDef.dz || 14;

            var geo = new THREE.BoxGeometry(rdx, rdz, rdy);
            var mat = new THREE.MeshLambertMaterial({
                color: 0xc8b080,
                transparent: true,
                opacity: 0.85,
                depthWrite: true,
                polygonOffset: true,
                polygonOffsetFactor: -2,
                polygonOffsetUnits: -2,
            });
            mesh = new THREE.Mesh(geo, mat);
            mesh.renderOrder = 100;
            mesh.name = '__container_site' + site.id + '_' + rackKey + '__';
            mesh.position.set(
                site.x + site.dx / 2,
                site.z + rdz / 2,
                site.y + site.dy / 2
            );

            // Add label sprite on top
            var labelCv = document.createElement('canvas');
            labelCv.width = 256; labelCv.height = 64;
            var ctx = labelCv.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(rackDef.name.substring(0, 20), 128, 32);
            var tex = new THREE.CanvasTexture(labelCv);
            var spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
            var sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(Math.min(rdx, 60), 15, 1);
            sprite.position.y = rdz / 2 + 8;
            mesh.add(sprite);
        }

        return mesh;
    }

    /**
     * Rebuild all placed carriers that have a specific rack assigned.
     */
    function rebuildCarriersWithRack(rackKey) {
        vlState.placedCarriers.forEach(function (carrier) {
            if (!carrier.siteContainers) return;
            var needsRebuild = false;
            Object.keys(carrier.siteContainers).forEach(function (siteIdStr) {
                if (carrier.siteContainers[siteIdStr] === rackKey) needsRebuild = true;
            });
            if (needsRebuild) {
                // Re-assign to trigger mesh rebuild
                Object.keys(carrier.siteContainers).forEach(function (siteIdStr) {
                    if (carrier.siteContainers[siteIdStr] === rackKey) {
                        assignRackToSite(carrier.id, parseInt(siteIdStr, 10), rackKey);
                    }
                });
            }
        });
    }

    // ================================================================
    //  Rack Palette UI
    // ================================================================

    function populateRackPalette() {
        var list = document.getElementById('vl-rack-list');
        if (!list) return;
        list.innerHTML = '';

        var keys = Object.keys(vlState.rackLibrary);
        if (keys.length === 0) {
            list.innerHTML = '<div class="vl-empty-hint">No racks imported yet.</div>';
            return;
        }

        keys.forEach(function (key) {
            var def = vlState.rackLibrary[key];
            var has3D = !!(vlState.rackModelCache[key] || def.model);
            var item = document.createElement('div');
            item.className = 'vl-rack-item';
            item.dataset.rackKey = key;
            item.innerHTML =
                '<span class="vl-rack-icon"><i class="fas fa-box"></i></span>' +
                '<span class="vl-rack-name">' + (def.name || key) +
                    (has3D ? ' <i class="fas fa-cube" title="3D model available"></i>' : '') +
                '</span>' +
                '<span class="vl-rack-desc">' + (def.description || (def.dx + '×' + def.dy + '×' + def.dz + 'mm')) + '</span>' +
                '<button class="vl-rack-del" data-rack="' + key + '" title="Remove rack"><i class="fas fa-times"></i></button>';

            // Allow dropping .x file onto a rack item to attach a model
            item.addEventListener('dragover', function (e) { e.preventDefault(); item.classList.add('drag-over'); });
            item.addEventListener('dragleave', function () { item.classList.remove('drag-over'); });
            item.addEventListener('drop', function (e) {
                e.preventDefault();
                item.classList.remove('drag-over');
                var files = Array.from(e.dataTransfer.files).filter(function (f) { return /\.(x|hxx)$/i.test(f.name); });
                if (files.length > 0) loadXModelForRack(key, files[0]);
            });

            // Delete button
            item.querySelector('.vl-rack-del').addEventListener('click', function (e) {
                e.stopPropagation();
                delete vlState.rackLibrary[key];
                delete vlState.rackModelCache[key];
                populateRackPalette();
                showVLStatus('Removed rack: ' + key);
            });

            // Drag rack onto carrier sites
            item.addEventListener('mousedown', function (e) {
                if (e.button !== 0) return;
                e.preventDefault();
                startRackDrag(e, key);
            });

            list.appendChild(item);
        });
    }

    // ================================================================
    //  Rack Drag-to-Place (drag rack from palette onto carrier sites)
    // ================================================================

    /**
     * Hit-test carrier site wells. Returns { carrier, site, siteMesh } or null.
     */
    function hitTestSites(e) {
        if (!vlState.scene || !vlState.camera || !vlState.canvas) return null;
        var rect = vlState.canvas.getBoundingClientRect();
        vlState._mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        vlState._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        vlState._raycaster.setFromCamera(vlState._mouse, vlState.camera);

        // Collect all site well meshes from placed carriers
        var siteObjects = [];
        vlState.placedCarriers.forEach(function (c) {
            if (c.siteMeshes) {
                c.siteMeshes.forEach(function (sm) { siteObjects.push(sm); });
            }
        });
        if (siteObjects.length === 0) return null;

        var hits = vlState._raycaster.intersectObjects(siteObjects, false);
        if (!hits.length) return null;

        var hitMesh = hits[0].object;
        for (var i = 0; i < vlState.placedCarriers.length; i++) {
            var carrier = vlState.placedCarriers[i];
            if (!carrier.siteMeshes) continue;
            for (var j = 0; j < carrier.siteMeshes.length; j++) {
                if (carrier.siteMeshes[j] === hitMesh) {
                    var siteId = hitMesh.userData.siteId;
                    var site = carrier.def.sites.find(function (s) { return s.id === siteId; });
                    return { carrier: carrier, site: site, siteMesh: hitMesh };
                }
            }
        }
        return null;
    }

    var _rackDragHighlighted = null; // currently highlighted site mesh

    function clearRackDragHighlight() {
        if (_rackDragHighlighted) {
            _rackDragHighlighted.material.emissive.set(0x000000);
            _rackDragHighlighted = null;
        }
    }

    function startRackDrag(e, rackKey) {
        var rackDef = vlState.rackLibrary[rackKey];
        if (!rackDef) return;

        // Disable orbit controls during drag
        if (vlState.controls) vlState.controls.enabled = false;

        vlState.rackDrag = { rackKey: rackKey, rackDef: rackDef };

        // Show cursor ghost div
        var ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        var ghostLabel = document.getElementById('vl-drag-ghost-label');
        if (ghostDiv && ghostLabel) {
            ghostLabel.textContent = (rackDef.name || rackKey);
            ghostDiv.style.display = 'flex';
            ghostDiv.style.left = (e.clientX + 14) + 'px';
            ghostDiv.style.top  = (e.clientY + 8)  + 'px';
        }

        document.addEventListener('mousemove', onRackDragMove);
        document.addEventListener('mouseup',   onRackDragEnd);
    }

    function onRackDragMove(e) {
        if (!vlState.rackDrag) return;

        // Move cursor ghost
        var ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        if (ghostDiv) {
            ghostDiv.style.left = (e.clientX + 14) + 'px';
            ghostDiv.style.top  = (e.clientY + 8)  + 'px';
        }

        // Check if we're over the canvas
        var canvas = vlState.canvas;
        if (!canvas) { clearRackDragHighlight(); return; }
        var rect = canvas.getBoundingClientRect();
        var overCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                         e.clientY >= rect.top  && e.clientY <= rect.bottom;
        if (!overCanvas) { clearRackDragHighlight(); return; }

        // Hit-test carrier sites
        var hit = hitTestSites(e);
        if (hit) {
            if (_rackDragHighlighted !== hit.siteMesh) {
                clearRackDragHighlight();
                hit.siteMesh.material.emissive.set(0x226644);
                _rackDragHighlighted = hit.siteMesh;
            }
        } else {
            clearRackDragHighlight();
        }
    }

    function onRackDragEnd(e) {
        document.removeEventListener('mousemove', onRackDragMove);
        document.removeEventListener('mouseup',   onRackDragEnd);

        // Re-enable orbit controls
        if (vlState.controls) vlState.controls.enabled = true;

        // Hide cursor ghost
        var ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        if (ghostDiv) ghostDiv.style.display = 'none';

        clearRackDragHighlight();

        if (!vlState.rackDrag) return;
        var rackKey = vlState.rackDrag.rackKey;
        vlState.rackDrag = null;

        // Check if dropped over a carrier site
        var hit = hitTestSites(e);
        if (hit && hit.carrier && hit.site) {
            assignRackToSite(hit.carrier.id, hit.site.id, rackKey);
        }
    }

    /**
     * Wire the rack import drop zone and browse button.
     */
    function wireRackImport() {
        var fileInput = document.getElementById('vl-rack-input');
        var openBtn   = document.getElementById('vl-rack-open');
        var dropZone  = document.getElementById('vl-rack-drop');

        if (openBtn && fileInput) {
            openBtn.addEventListener('click', function () { fileInput.click(); });
            fileInput.addEventListener('change', function (e) {
                var files = Array.from(e.target.files);
                if (files.length > 0) processRackDrop(files);
                fileInput.value = '';
            });
        }

        if (dropZone) {
            dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('drag-over'); });
            dropZone.addEventListener('drop', function (e) {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                var files = Array.from(e.dataTransfer.files);
                if (files.length > 0) processRackDrop(files);
            });
        }
    }

    function processRackDrop(files) {
        var rckFiles = files.filter(function (f) { return /\.rck$/i.test(f.name); });
        var xFiles   = files.filter(function (f) { return /\.(x|hxx)$/i.test(f.name); });

        if (rckFiles.length === 0 && xFiles.length === 0) {
            showVLStatus('Please drop .rck file(s) (optionally with .x/.hxx model).', 'error');
            return;
        }

        rckFiles.forEach(function (rckFile) {
            var baseName = rckFile.name.replace(/\.rck$/i, '').toLowerCase();
            var companionX = xFiles.find(function (f) {
                return f.name.replace(/\.(x|hxx)$/i, '').toLowerCase() === baseName;
            });
            if (!companionX && rckFiles.length === 1 && xFiles.length === 1) {
                companionX = xFiles[0];
            }
            importRackFile(rckFile, companionX || null);
        });

        // Standalone .x files: attach to most recently added rack
        if (rckFiles.length === 0 && xFiles.length > 0) {
            var lastKey = Object.keys(vlState.rackLibrary).pop();
            if (lastKey) {
                xFiles.forEach(function (f) { loadXModelForRack(lastKey, f); });
            } else {
                showVLStatus('Drop a .rck alongside the .x/.hxx to create a rack definition.', 'error');
            }
        }
    }

    /**
     * Show the container picker dialog for assigning a rack to a site.
     */
    function showContainerPicker(carrierId, siteId) {
        var dialog = document.getElementById('vl-container-dialog');
        if (!dialog) return;

        dialog.dataset.carrierId = carrierId;
        dialog.dataset.siteId = siteId;

        var carrier = vlState.placedCarriers.find(function (c) { return c.id === carrierId; });
        var siteName = carrier ? carrier.def.viewName + ' — Site ' + siteId : 'Site ' + siteId;
        var titleEl = document.getElementById('vl-cd-title');
        if (titleEl) titleEl.textContent = 'Assign Container to ' + siteName;

        // Populate container list
        var listEl = document.getElementById('vl-cd-list');
        if (!listEl) return;
        listEl.innerHTML = '';

        var keys = Object.keys(vlState.rackLibrary);
        if (keys.length === 0) {
            listEl.innerHTML = '<div class="vl-empty-hint">No racks loaded yet.<br>Import a .rck file first.</div>';
        } else {
            keys.forEach(function (key) {
                var def = vlState.rackLibrary[key];
                var has3D = !!(vlState.rackModelCache[key] || def.model);
                var btn = document.createElement('button');
                btn.className = 'vl-cd-item';
                btn.innerHTML =
                    '<i class="fas fa-box"></i> ' +
                    '<span class="vl-cd-item-name">' + (def.name || key) + '</span>' +
                    (has3D ? ' <i class="fas fa-cube" style="color:var(--accent);font-size:9px"></i>' : '') +
                    '<span class="vl-cd-item-dim">' + def.dx + '×' + def.dy + '×' + def.dz + '</span>';
                btn.addEventListener('click', function () {
                    assignRackToSite(carrierId, siteId, key);
                    dialog.classList.remove('is-visible');
                });
                listEl.appendChild(btn);
            });
        }

        // Also allow browsing server racks
        var serverBrowse = document.getElementById('vl-cd-browse-server');
        if (serverBrowse) {
            serverBrowse.onclick = function () {
                showServerRackBrowser(carrierId, siteId);
            };
        }

        dialog.classList.add('is-visible');
    }

    /**
     * Browse available .rck files from the Hamilton server path.
     */
    function showServerRackBrowser(carrierId, siteId) {
        var dialog = document.getElementById('vl-container-dialog');
        var listEl = document.getElementById('vl-cd-list');
        if (!listEl) return;

        listEl.innerHTML = '<div class="vl-empty-hint"><i class="fas fa-spinner fa-spin"></i> Scanning server for .rck files…</div>';

        // Fetch a directory listing from the server
        var basePaths = [
            'Base Hamilton Files/Labware/ML_STAR/',
            'Base Hamilton Files/Labware/GREINER/',
            'Base Hamilton Files/Labware/KAYCO_DALLAS/',
        ];

        var allFiles = [];
        var pending = basePaths.length;

        basePaths.forEach(function (basePath) {
            fetch(basePath).then(function (resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                return resp.text();
            }).then(function (html) {
                // Parse directory listing for .rck links
                var re = /href="([^"]*\.rck)"/gi;
                var m;
                while ((m = re.exec(html)) !== null) {
                    var fileName = decodeURIComponent(m[1]);
                    if (fileName.startsWith('/')) fileName = fileName.substring(1);
                    if (!fileName.startsWith('Base Hamilton')) fileName = basePath + fileName;
                    allFiles.push(fileName);
                }
            }).catch(function () {
                // Directory not browseable, try scanning known files
            }).finally(function () {
                pending--;
                if (pending <= 0) displayServerRacks(allFiles, carrierId, siteId);
            });
        });
    }

    function displayServerRacks(files, carrierId, siteId) {
        var dialog = document.getElementById('vl-container-dialog');
        var listEl = document.getElementById('vl-cd-list');
        if (!listEl) return;

        if (files.length === 0) {
            listEl.innerHTML = '<div class="vl-empty-hint">No .rck files found on server.<br>Import from file instead.</div>';
            return;
        }

        listEl.innerHTML = '';

        // Sort files alphabetically
        files.sort();

        // Add a search filter
        var filterInput = document.createElement('input');
        filterInput.type = 'text';
        filterInput.className = 'vl-cd-filter';
        filterInput.placeholder = 'Filter racks…';
        listEl.appendChild(filterInput);

        var itemContainer = document.createElement('div');
        itemContainer.className = 'vl-cd-items-scroll';
        listEl.appendChild(itemContainer);

        function renderItems(filter) {
            itemContainer.innerHTML = '';
            var filtered = filter
                ? files.filter(function (f) { return f.toLowerCase().indexOf(filter.toLowerCase()) >= 0; })
                : files;

            filtered.slice(0, 100).forEach(function (filePath) {
                var fileName = filePath.split('/').pop();
                var btn = document.createElement('button');
                btn.className = 'vl-cd-item';
                btn.innerHTML = '<i class="fas fa-file"></i> <span class="vl-cd-item-name">' + fileName + '</span>';
                btn.title = filePath;
                btn.addEventListener('click', function () {
                    // Derive Hamilton path from server path
                    var hamiltonPath = filePath.replace('Base Hamilton Files/Labware/', '').replace(/\//g, '\\');
                    importRackFromServer(hamiltonPath).then(function (rackKey) {
                        assignRackToSite(carrierId, siteId, rackKey);
                        dialog.classList.remove('is-visible');
                    }).catch(function (err) {
                        showVLStatus('Failed to load rack: ' + err.message, 'error');
                    });
                });
                itemContainer.appendChild(btn);
            });

            if (filtered.length > 100) {
                var more = document.createElement('div');
                more.className = 'vl-empty-hint';
                more.textContent = (filtered.length - 100) + ' more — use filter to narrow results';
                itemContainer.appendChild(more);
            }
        }

        renderItems('');
        filterInput.addEventListener('input', function () { renderItems(filterInput.value); });
    }

    // ================================================================
    //  Waste Chute — install / remove / build mesh
    // ================================================================

    /**
     * Return the Set of tracks occupied by the installed waste chute.
     * Returns an empty Set when no waste is installed.
     */
    function getWasteOccupiedTracks() {
        var result = new Set();
        if (vlState.wasteCutoutIdx < 0 || vlState.wasteCutoutIdx >= DECK_CUTOUTS.length) return result;
        var slot = DECK_CUTOUTS[vlState.wasteCutoutIdx];
        for (var t = slot.trackStart; t < slot.trackStart + slot.trackSpan; t++) {
            result.add(t);
        }
        return result;
    }

    /**
     * Generic builder for deck-architecture items (waste chute, drawer).
     * Uses 3D offsets from TML to position the body model relative to the
     * TML footprint origin — identical coordinate space as site positions.
     * The group is then positioned so the TML footprint centre aligns with
     * the physical cutout centre on the deck.
     */
    function buildDeckFixtureMesh(cutoutIdx, tmlDef, cacheKey, groupName) {
        var slot = DECK_CUTOUTS[cutoutIdx];
        var def = tmlDef;
        if (!def) return null;

        var group = new THREE.Group();
        group.name = groupName;

        var cutoutWidth = slot.trackSpan * DECK.TRACK_SPACING;
        var slotX = DECK.FIRST_TRACK_X + (slot.trackStart - 1) * DECK.TRACK_SPACING;
        // Shift group so the TML footprint centre aligns with the cutout centre
        var groupX = slotX + cutoutWidth / 2 - (def.dx || 20) / 2;

        // Hamilton 3D offsets: X = width offset, Y = depth offset, Z = height offset
        // Three.js mapping: Ham X → Three X, Ham Y → Three Z, Ham Z → Three Y
        var hamXOff = def.model3DxOff || 0;
        var hamYOff = def.model3DyOff || 0;
        var hamZOff = def.model3DzOff || 0;

        var cached = vlState.xModelCache[cacheKey];
        if (cached && !vlState.useGenericCarriers) {
            var xModel = cached.clone(true);
            xModel.name = groupName + '_body_x__';

            xModel.traverse(function (child) {
                if (!child.isMesh) return;
                child.frustumCulled = false;
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(function (m) { return m ? m.clone() : m; });
                } else if (child.material) {
                    child.material = child.material.clone();
                }
            });

            // Position body using 3D offsets from TML (same coord space as sites).
            // fixXFileCoords already converted the model from DirectX LH to Three.js RH.
            // We centre on the TML footprint then apply offsets.
            var box = new THREE.Box3().setFromObject(xModel);
            var center = box.getCenter(new THREE.Vector3());

            xModel.position.set(
                def.dx / 2 - center.x + hamXOff,
                -box.min.y + hamZOff,
                def.dy / 2 - center.z + hamYOff
            );
            group.add(xModel);
        } else {
            // Procedural fallback
            var fbW = Math.max(def.dx, cutoutWidth);
            var fbD = def.dy || 471.5;
            var fbGeo = new THREE.BoxGeometry(fbW, 200, fbD);
            var fbMat = new THREE.MeshLambertMaterial({
                color: 0x404040, transparent: true, opacity: 0.7,
            });
            var fbMesh = new THREE.Mesh(fbGeo, fbMat);
            fbMesh.position.set(def.dx / 2, -100, fbD / 2);
            fbMesh.name = groupName + '_body__';
            group.add(fbMesh);
        }

        // Site labware — mirror Y (front-to-back) like Hamilton coordinate system
        if (!vlState.useGenericCarriers && def.sites) {
            def.sites.forEach(function (site) {
                if (!site.labwareFile) return;
                var lwKey = site.labwareFile.replace(/\\/g, '/').toLowerCase();
                var cachedLw = vlState.siteModelCache[lwKey];
                if (!cachedLw || !cachedLw.group) return;

                var siteModel = cachedLw.group.clone(true);
                siteModel.name = groupName + '_labware_' + site.id + '__';
                siteModel.traverse(function (child) {
                    if (!child.isMesh) return;
                    child.frustumCulled = false;
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(function (m) { return m ? m.clone() : m; });
                    } else if (child.material) {
                        child.material = child.material.clone();
                    }
                });

                var mirroredY = (def.dy || 471.5) - site.y - site.dy;
                var sBox = new THREE.Box3().setFromObject(siteModel);
                var sCenter = sBox.getCenter(new THREE.Vector3());
                siteModel.position.set(
                    site.x + site.dx / 2 - sCenter.x + (cachedLw.xOff || 0),
                    site.z - sBox.min.y + (cachedLw.zOff || 0),
                    mirroredY + site.dy / 2 - sCenter.z + (cachedLw.yOff || 0)
                );
                group.add(siteModel);
            });
        }

        group.position.set(groupX, DECK.SURFACE_Z, DECK.TRACK_Y_START);
        return group;
    }

    function buildWasteMesh(cutoutIdx) {
        var group = buildDeckFixtureMesh(cutoutIdx, vlState.wasteTmlDef,
            vlState.wasteModelCacheKey, '__waste_chute__');
        if (group) {
            // Base repositioning: align TML origin with the right edge of the cutout
            var slot = DECK_CUTOUTS[cutoutIdx];
            var slotX = DECK.FIRST_TRACK_X + (slot.trackStart - 1) * DECK.TRACK_SPACING;
            var cutoutWidth = slot.trackSpan * DECK.TRACK_SPACING;
            group.position.x = slotX + cutoutWidth;

            // Shift group 8 tracks left for accessories base alignment
            var accessoryShift = -8 * DECK.TRACK_SPACING;   // -180mm
            var bodyShift      = -3 * DECK.TRACK_SPACING;   // -67.5mm
            group.position.x += accessoryShift;

            // Apply per-child offsets
            group.traverse(function (child) {
                if (!child.name) return;
                if (child.name.indexOf('_body_x__') !== -1 || child.name.indexOf('_body__') !== -1) {
                    // Body: +5 tracks right relative to group (nets 3 left overall)
                    child.position.x += (accessoryShift - bodyShift) * -1; // +112.5
                    child.position.z += DECK.TRACK_Y_START / 2;           // +31.5
                    // Fine-tune from debug: body { x: -10, y: 0, z: -10 }
                    child.position.x += -10.0;
                    child.position.z += -10.0;
                } else if (child.name.indexOf('_labware_') !== -1) {
                    // Fine-tune from debug: accessories { x: -15, y: 0, z: -3.5 }
                    child.position.x += -15.0;
                    child.position.z += -3.5;
                    // Per-component fix for labware_10: { x: 15, y: 8, z: 0 }
                    if (child.name.indexOf('_labware_10__') !== -1) {
                        child.position.x += 15.0;
                        child.position.y += 8.0;
                    }
                }
            });

            // Fine-tune from debug: group { x: -14, y: -16, z: 8 }
            group.position.x += -14.0;
            group.position.y += -16.0;
            group.position.z += 8.0;
        }
        return group;
    }

    /**
     * Install the waste chute at the given cutout index (0-3).
     * Removes any existing waste installation first.
     * Hides the cover panel and evicts overlapping carriers.
     */
    function installWasteAtCutout(cutoutIdx) {
        if (cutoutIdx < 0 || cutoutIdx >= DECK_CUTOUTS.length) return;

        removeWaste();

        // If drawer is at this cutout, remove it and sync its dropdown
        if (vlState.drawerCutoutIdx === cutoutIdx) {
            removeDrawer();
            var ds = document.getElementById('settings-drawer-position');
            if (ds) ds.value = '-1';
        }

        vlState.wasteCutoutIdx = cutoutIdx;

        // Hide the cover panel for this cutout
        vlState.deckCutouts[cutoutIdx] = false;
        applyCutoutVisibility();

        // Build and add the waste mesh
        var mesh = buildWasteMesh(cutoutIdx);
        if (mesh) {
            vlState.wasteMesh = mesh;
            vlState.scene.add(mesh);
            snapshotFixtureBasePositions(mesh);
            restoreFixtureDebugOffsets();
            // Apply saved deck debug offsets so fixture stays aligned with deck
            applySavedDeckOffsetsToMesh(mesh);
            mesh.userData._deckBasePos = mesh.position.clone();
            applyDebugDeckOffset();
            if (vlState.fixtureDebugMode) refreshFixtureDebugReadout();
        }

        // Load site labware models if waste def available
        if (vlState.wasteTmlDef) {
            loadSiteLabwareModels(vlState.wasteModelCacheKey, vlState.wasteTmlDef.sites);
        }

        // Sync UI
        updateCoverPanelCheckbox(cutoutIdx, false);
        showVLStatus('Waste chute installed at ' + DECK_CUTOUTS[cutoutIdx].label +
            ' (tracks ' + DECK_CUTOUTS[cutoutIdx].trackStart + '\u2013' +
            (DECK_CUTOUTS[cutoutIdx].trackStart + DECK_CUTOUTS[cutoutIdx].trackSpan - 1) + ')', 'ok');
    }

    /** Remove the installed waste chute (if any). */
    function removeWaste() {
        if (vlState.wasteCutoutIdx < 0) return;

        if (vlState.wasteMesh) {
            vlState.wasteMesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(function (m) { if (m) m.dispose(); });
                }
            });
            vlState.scene.remove(vlState.wasteMesh);
            vlState.wasteMesh = null;
        }

        var oldIdx = vlState.wasteCutoutIdx;
        vlState.deckCutouts[oldIdx] = true;
        applyCutoutVisibility();
        updateCoverPanelCheckbox(oldIdx, true);

        vlState.wasteCutoutIdx = -1;
        showVLStatus('Waste chute removed.', '');
    }

    // ================================================================
    //  Entry/Exit Drawer — install / remove / build / load
    // ================================================================

    function getDrawerOccupiedTracks() {
        var result = new Set();
        if (vlState.drawerCutoutIdx < 0 || vlState.drawerCutoutIdx >= DECK_CUTOUTS.length) return result;
        var slot = DECK_CUTOUTS[vlState.drawerCutoutIdx];
        for (var t = slot.trackStart; t < slot.trackStart + slot.trackSpan; t++) {
            result.add(t);
        }
        return result;
    }

    function buildDrawerMesh(cutoutIdx) {
        return buildDeckFixtureMesh(cutoutIdx, vlState.drawerTmlDef,
            vlState.drawerModelCacheKey, '__entry_exit_drawer__');
    }

    function installDrawerAtCutout(cutoutIdx) {
        if (cutoutIdx < 0 || cutoutIdx >= DECK_CUTOUTS.length) return;

        removeDrawer();

        // If waste is at this cutout, remove it and sync its dropdown
        if (vlState.wasteCutoutIdx === cutoutIdx) {
            removeWaste();
            var ws = document.getElementById('settings-waste-position');
            if (ws) ws.value = '-1';
        }

        vlState.drawerCutoutIdx = cutoutIdx;

        vlState.deckCutouts[cutoutIdx] = false;
        applyCutoutVisibility();

        var mesh = buildDrawerMesh(cutoutIdx);
        if (mesh) {
            vlState.drawerMesh = mesh;
            vlState.scene.add(mesh);
            snapshotFixtureBasePositions(mesh);
            restoreFixtureDebugOffsets();
            snapshotEEBasePos();
            // Apply saved deck debug offsets so fixture stays aligned with deck
            applySavedDeckOffsetsToMesh(mesh);
            mesh.userData._deckBasePos = mesh.position.clone();
            applyDebugDeckOffset();
            restoreEEDebugOffsets();
            if (vlState.fixtureDebugMode) refreshFixtureDebugReadout();
            if (vlState.eeDebugMode) refreshEEDebugReadout();
        }

        if (vlState.drawerTmlDef) {
            loadSiteLabwareModels(vlState.drawerModelCacheKey, vlState.drawerTmlDef.sites);
        }

        updateCoverPanelCheckbox(cutoutIdx, false);
        showVLStatus('Entry/Exit Drawer installed at ' + DECK_CUTOUTS[cutoutIdx].label, 'ok');
    }

    function removeDrawer() {
        if (vlState.drawerCutoutIdx < 0) return;

        if (vlState.drawerMesh) {
            vlState.drawerMesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(function (m) { if (m) m.dispose(); });
                }
            });
            vlState.scene.remove(vlState.drawerMesh);
            vlState.drawerMesh = null;
            vlState._eeBasePos = null;
        }

        var oldIdx = vlState.drawerCutoutIdx;
        vlState.deckCutouts[oldIdx] = true;
        applyCutoutVisibility();
        updateCoverPanelCheckbox(oldIdx, true);

        vlState.drawerCutoutIdx = -1;
        showVLStatus('Entry/Exit Drawer removed.', '');
    }

    function rebuildDrawerMesh() {
        if (vlState.drawerCutoutIdx < 0) return;
        if (vlState.drawerMesh) {
            vlState.drawerMesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(function (m) { if (m) m.dispose(); });
                }
            });
            vlState.scene.remove(vlState.drawerMesh);
        }
        var mesh = buildDrawerMesh(vlState.drawerCutoutIdx);
        if (mesh) {
            vlState.drawerMesh = mesh;
            vlState.scene.add(mesh);
            snapshotFixtureBasePositions(mesh);
            restoreFixtureDebugOffsets();
            snapshotEEBasePos();
            applySavedDeckOffsetsToMesh(mesh);
            mesh.userData._deckBasePos = mesh.position.clone();
            applyDebugDeckOffset();
            restoreEEDebugOffsets();
            if (vlState.fixtureDebugMode) refreshFixtureDebugReadout();
            if (vlState.eeDebugMode) refreshEEDebugReadout();
        }
    }

    function loadDrawerTmlFromServer() {
        fetch(DRAWER_TML_PATH).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
        }).then(function (text) {
            var parsed = parseTML(text);
            if (!parsed.viewName) parsed.viewName = 'Entry Exit Drawer';
            vlState.drawerTmlDef = parsed;

            console.log('[VantageLayout] Loaded drawer TML:', parsed.viewName,
                parsed.sites.length, 'sites');

            if (parsed.modelFileHamilton) {
                var serverPath = resolveHamiltonPath(parsed.modelFileHamilton);
                if (serverPath) {
                    fetchAndCacheXModel(vlState.drawerModelCacheKey, serverPath, function () {
                        // Default to Position 4 (cutout index 3) if no drawer placed yet
                        if (vlState.drawerCutoutIdx < 0) {
                            installDrawerAtCutout(3);
                            var ds = document.getElementById('settings-drawer-position');
                            if (ds) ds.value = '3';
                        } else {
                            rebuildDrawerMesh();
                        }
                    });
                }
            }

            if (vlState.drawerCutoutIdx >= 0) {
                loadSiteLabwareModels(vlState.drawerModelCacheKey, parsed.sites);
            }
        }).catch(function (err) {
            console.warn('[VantageLayout] Could not load drawer TML:', err.message);
        });
    }

    /** Rebuild the waste 3D mesh (called when models finish loading). */
    function rebuildWasteMesh() {
        if (vlState.wasteCutoutIdx < 0) return;
        if (vlState.wasteMesh) {
            vlState.wasteMesh.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material])
                        .forEach(function (m) { if (m) m.dispose(); });
                }
            });
            vlState.scene.remove(vlState.wasteMesh);
        }
        var mesh = buildWasteMesh(vlState.wasteCutoutIdx);
        if (mesh) {
            vlState.wasteMesh = mesh;
            vlState.scene.add(mesh);
            snapshotFixtureBasePositions(mesh);
            restoreFixtureDebugOffsets();
            applySavedDeckOffsetsToMesh(mesh);
            mesh.userData._deckBasePos = mesh.position.clone();
            applyDebugDeckOffset();
            if (vlState.fixtureDebugMode) refreshFixtureDebugReadout();
        }
    }

    /** Helper to sync a cover-panel checkbox in the settings UI. */
    function updateCoverPanelCheckbox(idx, checked) {
        var cb = document.getElementById('settings-cover-' + idx);
        if (cb) cb.checked = checked;
    }

    /**
     * Auto-fetch and parse the waste TML from the server.
     * Caches the parsed def in vlState.wasteTmlDef, then
     * fetches the carrier 3D model and site labware models.
     */
    function loadWasteTmlFromServer() {
        fetch(WASTE_TML_PATH).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.text();
        }).then(function (text) {
            var parsed = parseTML(text);
            if (!parsed.viewName) parsed.viewName = 'Universal Waste';
            vlState.wasteTmlDef = parsed;

            console.log('[VantageLayout] Loaded waste TML:', parsed.viewName,
                parsed.sites.length, 'sites',
                'modelFileHamilton:', parsed.modelFileHamilton || 'NONE');

            // Fetch the carrier body 3D model
            if (parsed.modelFileHamilton) {
                var serverPath = resolveHamiltonPath(parsed.modelFileHamilton);
                console.log('[VantageLayout] Fetching waste 3D model:', serverPath);
                if (serverPath) {
                    fetchAndCacheXModel(vlState.wasteModelCacheKey, serverPath, function () {
                        console.log('[VantageLayout] Waste 3D model cached, rebuilding mesh');
                        rebuildWasteMesh();
                    });
                }
            } else {
                console.warn('[VantageLayout] No modelFileHamilton found in waste TML');
            }

            // Auto-install waste at default cutout if set
            if (vlState.wasteCutoutIdx >= 0) {
                installWasteAtCutout(vlState.wasteCutoutIdx);
                loadSiteLabwareModels(vlState.wasteModelCacheKey, parsed.sites);
            }
        }).catch(function (err) {
            console.warn('[VantageLayout] Could not load waste TML:', err.message);
        });
    }

    /**
     * Generic helper: fetch a .x or .hxx file from serverPath, parse it,
     * store in vlState.xModelCache[cacheKey], then call onDone().
     */
    function fetchAndCacheXModel(cacheKey, serverPath, onDone) {
        var isHxx = /\.hxx$/i.test(serverPath);
        console.log('[VantageLayout] fetchAndCacheXModel:', cacheKey, serverPath, 'isHxx:', isHxx);

        fetch(serverPath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (data) {
            if (isHxx && typeof HXXLoader !== 'undefined') {
                return HXXLoader.parse(data).then(function (result) {
                    return result.xFileBinary || result.xFileText;
                });
            }
            return data;
        }).then(function (xData) {
            if (!xData) return;

            var blob = new Blob([xData], { type: 'application/octet-stream' });
            var url = URL.createObjectURL(blob);
            var manager = new THREE.LoadingManager();
            var basePath = serverPath.substring(0, serverPath.lastIndexOf('/') + 1);
            manager.setURLModifier(function (texUrl) {
                if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                    return basePath + texUrl.split('/').pop();
                }
                return texUrl;
            });
            var loader = new THREE.XFileLoader(manager);

            loader.load(url, function (object) {
                URL.revokeObjectURL(url);
                if (!object || !object.models || object.models.length === 0) return;

                var group = new THREE.Group();
                group.name = '__xmodel_template_' + cacheKey + '__';
                object.models.forEach(function (m, idx) {
                    m.renderOrder = idx;
                    if (m.material) {
                        var mats = Array.isArray(m.material) ? m.material : [m.material];
                        mats.forEach(function (mat) {
                            if (!mat) return;
                            mat.polygonOffset = true;
                            mat.polygonOffsetFactor = idx === 0 ? 1 : -Math.min(idx, 10);
                            mat.polygonOffsetUnits  = idx === 0 ? 1 : -Math.min(idx, 10) * 4;
                        });
                    }
                    group.add(m);
                });

                fixXFileCoords(group);
                vlState.xModelCache[cacheKey] = group;
                console.log('[VantageLayout] Cached model:', cacheKey);
                if (onDone) onDone();
            }, undefined, function (err) {
                URL.revokeObjectURL(url);
                console.warn('[VantageLayout] Failed to load model:', serverPath, err);
            });
        }).catch(function (err) {
            console.warn('[VantageLayout] Could not fetch model:', serverPath, err.message);
        });
    }

    // ================================================================
    //  3D Carrier Builder
    // ================================================================

    /**
     * Return the cache key used to look up a carrier's .x model.
     */
    function getCarrierCacheKey(def) {
        return (def.viewName || '').toUpperCase().replace(/\s+/g, '_');
    }

    /**
     * Apply a left-handed (DirectX) → right-handed (Three.js) fix to a group.
     * Negates Z on all vertex positions and normals, flips winding order.
     * Mirrors window._fixLeftHandedCoords from app.js (which loads after this
     * module, so we keep a local copy here).
     */
    function fixXFileCoords(group) {
        group.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;
            const pos = child.geometry.attributes.position;
            if (pos) {
                for (let i = 0; i < pos.count; i++) pos.setZ(i, -pos.getZ(i));
                pos.needsUpdate = true;
            }
            const norm = child.geometry.attributes.normal;
            if (norm) {
                for (let i = 0; i < norm.count; i++) norm.setZ(i, -norm.getZ(i));
                norm.needsUpdate = true;
            }
            const idx = child.geometry.index;
            if (idx) {
                for (let f = 0; f < idx.count; f += 3) {
                    const a = idx.getX(f), b = idx.getX(f + 1);
                    idx.setX(f, b); idx.setX(f + 1, a);
                }
                idx.needsUpdate = true;
            }
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
        });
    }

    function buildCarrierMesh(carrierDef, trackStart) {
        const group = new THREE.Group();
        const x0 = DECK.FIRST_TRACK_X + (trackStart - 1) * DECK.TRACK_SPACING;
        const y0 = DECK.TRACK_Y_START;
        const z0 = DECK.SURFACE_Z;

        // Check for a cached .x model first (skip if generic mode is on)
        const cacheKey = getCarrierCacheKey(carrierDef);
        const cachedXModel = (!vlState.useGenericCarriers && cacheKey) ? vlState.xModelCache[cacheKey] : null;

        if (cachedXModel) {
            // Clone the cached model so each placed carrier is independent
            const xModel = cachedXModel.clone(true);
            xModel.name = '__carrier_body_x__';

            // Deep-clone materials so selection highlight is per-carrier
            xModel.traverse(function (child) {
                if (!child.isMesh) return;
                child.frustumCulled = false;
                if (Array.isArray(child.material)) {
                    child.material = child.material.map(function (m) { return m ? m.clone() : m; });
                } else if (child.material) {
                    child.material = child.material.clone();
                }
                // Treat blue-dominant materials as translucent (polycarbonate covers)
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    if (!m || !m.color) return;
                    if (m.color.b > m.color.r * 1.5 && m.color.b > 0.1) {
                        m.transparent = true;
                        if (m.opacity >= 1.0) m.opacity = 0.4;
                        m.depthWrite = false;
                        m.side = THREE.DoubleSide;
                    }
                });
            });

            // Fit the model: center it over the TML footprint, bottom at y=0
            const box = new THREE.Box3().setFromObject(xModel);
            const modelCenter = box.getCenter(new THREE.Vector3());
            xModel.position.set(
                carrierDef.dx / 2 - modelCenter.x,
                -box.min.y,                           // lift so base is at y=0
                carrierDef.dy / 2 - modelCenter.z
            );
            group.add(xModel);
        } else {
            // ── Procedural fallback (box + rails) ─────────────────────
            const bodyGeo = new THREE.BoxGeometry(carrierDef.dx, carrierDef.dz * 0.15, carrierDef.dy);
            const bodyMat = new THREE.MeshLambertMaterial({
                color: carrierDef.color || 0x607080,
                transparent: true,
                opacity: 0.92,
            });
            const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.set(
                carrierDef.dx / 2,
                carrierDef.dz * 0.075,
                carrierDef.dy / 2,
            );
            bodyMesh.name = '__carrier_body__';
            group.add(bodyMesh);

            const railH = carrierDef.dz * 0.65;
            const railGeo = new THREE.BoxGeometry(4, railH, carrierDef.dy);
            const railMat = new THREE.MeshLambertMaterial({ color: 0x304050 });
            [-1, 1].forEach(side => {
                const rail = new THREE.Mesh(railGeo, railMat);
                rail.position.set(side === -1 ? 2 : carrierDef.dx - 2, railH / 2 + carrierDef.dz * 0.15, carrierDef.dy / 2);
                group.add(rail);
            });
        }

        // Site wells — always added on top of whichever body is used.
        // When a .x model is present, make them invisible (raycast-only).
        const hasXModel = !!cachedXModel;
        const siteMeshes = [];
        carrierDef.sites.forEach(site => {
            const wellGeo = new THREE.BoxGeometry(site.dx, 6, site.dy);
            const wellMat = new THREE.MeshLambertMaterial({
                color: 0x1a2530,
                visible: !hasXModel,
            });
            const wellMesh = new THREE.Mesh(wellGeo, wellMat);
            wellMesh.position.set(
                site.x + site.dx / 2,
                site.z - carrierDef.dz * 0.10,
                site.y + site.dy / 2,
            );
            wellMesh.name = `__site_${site.id}__`;
            wellMesh.userData.siteId = site.id;
            wellMesh.userData.siteData = site;
            group.add(wellMesh);
            siteMeshes.push(wellMesh);
        });

        // Add site labware 3D models from cache
        if (!vlState.useGenericCarriers) {
            carrierDef.sites.forEach(function (site) {
                if (!site.labwareFile) return;
                var lwKey = site.labwareFile.replace(/\\/g, '/').toLowerCase();
                var cached = vlState.siteModelCache[lwKey];
                if (!cached || !cached.group) return;

                var siteModel = cached.group.clone(true);
                siteModel.name = '__site_labware_' + site.id + '__';

                // Deep-clone materials for independent coloring
                siteModel.traverse(function (child) {
                    if (!child.isMesh) return;
                    child.frustumCulled = false;
                    if (Array.isArray(child.material)) {
                        child.material = child.material.map(function (m) { return m ? m.clone() : m; });
                    } else if (child.material) {
                        child.material = child.material.clone();
                    }
                });

                // Position at site location within carrier local space
                // Hamilton coords: X=width, Y=depth, Z=height
                // Three.js coords: X=width, Y=height, Z=depth
                var box = new THREE.Box3().setFromObject(siteModel);
                var center = box.getCenter(new THREE.Vector3());

                // Center on site position, bottom at site.z
                var xOff = cached.xOff || 0;
                var yOff = cached.yOff || 0;
                var zOff = cached.zOff || 0;

                siteModel.position.set(
                    site.x + site.dx / 2 - center.x + xOff,
                    site.z - box.min.y + zOff,
                    site.y + site.dy / 2 - center.z + yOff
                );

                group.add(siteModel);
            });
        }

        // Place group at track position
        group.position.set(x0, z0, y0);
        group.name = '__carrier__';

        return { group, siteMeshes };
    }

    function buildPlateMesh(site, carrierDef) {
        // Creates an SBS plate box at the given site
        const geo = new THREE.BoxGeometry(SBS_PLATE.dx, SBS_PLATE.dz, SBS_PLATE.dy);
        const mat = new THREE.MeshLambertMaterial({
            color: 0xd0e8f8,
            transparent: true,
            opacity: 0.85,
            depthWrite: true,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 100;
        mesh.name = `__plate_site${site.id}__`;
        mesh.userData.siteId = site.id;
        // Position within the carrier group's local space
        mesh.position.set(
            site.x + site.dx / 2,
            site.z + SBS_PLATE.dz / 2,
            site.y + site.dy / 2,
        );

        // Add a thin well-pattern overlay (visual indicator)
        const topGeo = new THREE.BoxGeometry(SBS_PLATE.dx - 2, 1, SBS_PLATE.dy - 2);
        const topMat = new THREE.MeshLambertMaterial({
            color: 0x88c0e0,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            polygonOffsetUnits: -3,
        });
        const topMesh = new THREE.Mesh(topGeo, topMat);
        topMesh.renderOrder = 101;
        topMesh.position.y = SBS_PLATE.dz / 2 + 0.5;
        mesh.add(topMesh);

        return mesh;
    }

    // ================================================================
    //  Carrier Placement
    // ================================================================
    function placeCarrier(carrierType, trackStart, autoFillPlates) {
        const def = CARRIER_LIBRARY[carrierType];
        if (!def) return null;

        // Validate track range — placement allowed from track 4 to MAX_USABLE_TRACK
        if (trackStart < 4 || trackStart + def.tWidth - 1 > MAX_USABLE_TRACK) {
            showVLStatus('Cannot place: track out of range (tracks 4–60).', 'error');
            return null;
        }

        // Collision check
        if (checkCarrierCollision(trackStart, def.tWidth, -1)) {
            showVLStatus('Cannot place: track position occupied.', 'error');
            return null;
        }

        const { group, siteMeshes } = buildCarrierMesh(def, trackStart);
        vlState.scene.add(group);

        const plateMeshes = [];
        if (autoFillPlates && def.sites.length > 0) {
            def.sites.forEach(site => {
                // Skip sites that have built-in labware (rendered as part of the carrier)
                if (site.labwareFile) return;
                const pm = buildPlateMesh(site, def);
                group.add(pm);
                plateMeshes.push({ siteId: site.id, mesh: pm, hasPending: false });
            });
        }

        const entry = {
            id:          vlState.nextCarrierId++,
            type:        carrierType,
            trackStart:  trackStart,
            def:         def,
            mesh:        group,
            siteMeshes:  siteMeshes,
            plateMeshes: plateMeshes,
        };

        vlState.placedCarriers.push(entry);
        updateCarrierList();
        showVLStatus(`Placed ${def.viewName} at track ${trackStart}.`);
        return entry;
    }

    function removeCarrier(carrierId) {
        const idx = vlState.placedCarriers.findIndex(c => c.id === carrierId);
        if (idx === -1) return;
        const entry = vlState.placedCarriers[idx];
        entry.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                (Array.isArray(child.material) ? child.material : [child.material])
                    .forEach(m => m.dispose());
            }
        });
        vlState.scene.remove(entry.mesh);
        vlState.placedCarriers.splice(idx, 1);
        if (vlState.selectedCarrierId === carrierId) {
            vlState.selectedCarrierId = null;
        }
        updateCarrierList();
        updateSitePanel(null);
        showVLStatus('Carrier removed.');
    }

    function togglePlateOnSite(carrierId, siteId) {
        const carrier = vlState.placedCarriers.find(c => c.id === carrierId);
        if (!carrier) return;
        const existing = carrier.plateMeshes.find(p => p.siteId === siteId);
        if (existing) {
            // Remove plate
            carrier.mesh.remove(existing.mesh);
            existing.mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    (Array.isArray(child.material) ? child.material : [child.material]).forEach(m => m.dispose());
                }
            });
            carrier.plateMeshes = carrier.plateMeshes.filter(p => p.siteId !== siteId);
            showVLStatus(`Removed plate from site ${siteId}.`);
        } else {
            // Add plate
            const site = carrier.def.sites.find(s => s.id === siteId);
            if (!site) return;
            const pm = buildPlateMesh(site, carrier.def);
            carrier.mesh.add(pm);
            carrier.plateMeshes.push({ siteId: siteId, mesh: pm });
            showVLStatus(`Placed plate on site ${siteId}.`);
        }
        updateSitePanel(carrier);
    }

    function checkCarrierCollision(trackStart, tWidth, excludeId) {
        const newRange = new Set();
        for (let t = trackStart; t < trackStart + tWidth; t++) newRange.add(t);

        // Block tracks beyond usable range (61-80 reserved for waste/entry-exit)
        for (let t of newRange) {
            if (t > MAX_USABLE_TRACK) return 'out_of_range';
        }

        // Only check against other placed carriers (tracks 4-60 are fully open)
        for (const carrier of vlState.placedCarriers) {
            if (carrier.id === excludeId) continue;
            for (let t = carrier.trackStart; t < carrier.trackStart + carrier.def.tWidth; t++) {
                if (newRange.has(t)) return 'carrier:' + (carrier.def.viewName || carrier.type);
            }
        }
        return false;
    }

    function snapToTrack(worldX) {
        // Convert world X → track number (1-based)
        const raw = (worldX - DECK.FIRST_TRACK_X) / DECK.TRACK_SPACING;
        return Math.max(1, Math.min(DECK.TRACK_COUNT, Math.round(raw) + 1));
    }

    // ================================================================
    //  Carrier selection highlight
    // ================================================================

    /** Apply or clear a selection emissive highlight on a carrier group. */
    function setCarrierHighlight(carrierMesh, highlight) {
        const emissiveColor = highlight
            ? new THREE.Color(vlState.isDark ? 0x103050 : 0x2060a0)
            : new THREE.Color(0x000000);

        carrierMesh.traverse(function (child) {
            if (!child.isMesh) return;
            // Skip site-well meshes (names start with __site_)
            if (child.name && child.name.startsWith('__site_')) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach(function (m) {
                if (m && m.emissive) m.emissive.copy(emissiveColor);
            });
        });
    }

    function selectCarrier(carrierId) {
        // Deselect all
        vlState.placedCarriers.forEach(c => setCarrierHighlight(c.mesh, false));

        vlState.selectedCarrierId = carrierId;
        const carrier = vlState.placedCarriers.find(c => c.id === carrierId);
        if (carrier) {
            setCarrierHighlight(carrier.mesh, true);
            updateSitePanel(carrier);
        } else {
            updateSitePanel(null);
        }

        // Update carrier list selection
        document.querySelectorAll('.vl-carrier-item').forEach(el => {
            el.classList.toggle('is-selected', el.dataset.carrierId === String(carrierId));
        });
    }

    // ================================================================
    //  Site Panel open/close
    // ================================================================
    function setSitesPanelOpen(open) {
        vlState.sitesPanelOpen = open;
        const panel = $('#vl-right-panel');
        const host  = vlState.host;
        // Use is-collapsed on the panel when closed (CSS slides it out right)
        if (panel) panel.classList.toggle('is-collapsed', !open);
        if (host)  host.classList.toggle('vl-right-collapsed', !open);
        // Always clear any inline right override — CSS handles it
        const toolbar = $('#vl-toolbar');
        if (toolbar) toolbar.style.right = '';
        // Outer tab icon: chevron-left (close) when open, chevron-right (open) when closed
        const outerIcon = document.querySelector('#vl-right-toggle i');
        if (outerIcon) outerIcon.className = open ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
    }

    // ================================================================
    //  Canvas Mouse Events (click to select, drag placed carrier to move)
    // ================================================================

    // ---- VL Trash drop-zone helpers ----
    function showVLTrashZone(show) {
        var el = document.getElementById('vl-trash-zone');
        if (!el) return;
        el.classList.toggle('visible', !!show);
    }
    function updateVLTrashHover(e) {
        var el = document.getElementById('vl-trash-zone');
        if (!el) return;
        el.classList.toggle('hover', isVLTrashHit(e));
    }
    function isVLTrashHit(e) {
        var el = document.getElementById('vl-trash-zone');
        if (!el || !el.classList.contains('visible')) return false;
        var r = el.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right &&
               e.clientY >= r.top  && e.clientY <= r.bottom;
    }

    function wireCanvasEvents() {
        const canvas = vlState.canvas;
        if (!canvas) return;

        // Track mousedown position to distinguish click vs orbit drag
        let _downX = 0, _downY = 0;

        canvas.addEventListener('mousedown', e => {
            // Ignore if a palette drag is already active
            if (vlState.paletteDrag) return;
            _downX = e.clientX;
            _downY = e.clientY;

            // Check if pressing on a placed carrier → start carrier drag
            const hit = hitTestCarriers(e);
            if (hit) {
                // Prevent OrbitControls from rotating while we drag a carrier
                e.stopPropagation();
                vlState.controls.enabled = false;
                startCanvasCarrierDrag(e, hit.carrier);
            }
        });

        canvas.addEventListener('mouseup', e => {
            if (vlState.canvasCarrierDrag) return; // handled by drag end
            // Treat as click if mouse barely moved
            const dx = e.clientX - _downX;
            const dy = e.clientY - _downY;
            if (Math.sqrt(dx * dx + dy * dy) < 6) {
                onDeckClick(e);
            }
        });
    }

    // Hit-test placed carriers; returns { carrier } or null
    function hitTestCarriers(e) {
        if (!vlState.scene || !vlState.camera) return null;
        const rect = vlState.canvas.getBoundingClientRect();
        vlState._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
        vlState._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        vlState._raycaster.setFromCamera(vlState._mouse, vlState.camera);

        const carrierObjects = [];
        vlState.placedCarriers.forEach(c => {
            c.mesh.traverse(child => { if (child.isMesh) carrierObjects.push(child); });
        });

        const hits = vlState._raycaster.intersectObjects(carrierObjects, false);
        if (!hits.length) return null;

        for (const carrier of vlState.placedCarriers) {
            let found = false;
            carrier.mesh.traverse(child => { if (child === hits[0].object) found = true; });
            if (found) return { carrier };
        }
        return null;
    }

    // ── Drag a placed carrier to a new track ──────────────────────
    function startCanvasCarrierDrag(e, carrier) {
        selectCarrier(carrier.id);
        vlState.canvasCarrierDrag = { carrier };

        // Build a ghost at current track
        destroyGhostMesh();
        const { group } = buildCarrierMesh(carrier.def, carrier.trackStart);
        group.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.42;
                child.material.color.set(0x44aaee);
                child.material.depthWrite = false;
            }
        });
        vlState.ghostMesh = group;
        vlState.scene.add(group);

        // Hide the real carrier mesh while dragging
        carrier.mesh.visible = false;

        // Show trash drop zone
        showVLTrashZone(true);

        document.addEventListener('mousemove', onCanvasCarrierDragMove);
        document.addEventListener('mouseup',   onCanvasCarrierDragEnd);
    }

    // Distance (px) the cursor must be dragged outside the canvas to
    // trigger "pull off the deck" removal (similar to MFX module disposal).
    const VL_PULL_OFF_THRESHOLD = 80;

    /**
     * Compute how far (in pixels) the cursor is from the nearest canvas edge.
     * Returns 0 when inside the canvas, positive when outside.
     */
    function cursorDistanceFromCanvas(e) {
        const rect = vlState.canvas.getBoundingClientRect();
        let dx = 0, dy = 0;
        if (e.clientX < rect.left)       dx = rect.left - e.clientX;
        else if (e.clientX > rect.right) dx = e.clientX - rect.right;
        if (e.clientY < rect.top)        dy = rect.top - e.clientY;
        else if (e.clientY > rect.bottom) dy = e.clientY - rect.bottom;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onCanvasCarrierDragMove(e) {
        if (!vlState.canvasCarrierDrag || !vlState._deckPlane) return;

        // Always check trash zone hover (even when cursor is off-canvas)
        const overTrash = isVLTrashHit(e);
        updateVLTrashHover(e);

        // Detect "pull off the deck" — cursor far outside the 3D canvas
        const offDist = cursorDistanceFromCanvas(e);
        const pullingOff = offDist >= VL_PULL_OFF_THRESHOLD;
        vlState._carrierDragOffDeck = pullingOff || overTrash;

        const canvas = vlState.canvas;
        const rect = canvas.getBoundingClientRect();
        vlState._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
        vlState._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        vlState._raycaster.setFromCamera(vlState._mouse, vlState.camera);

        const hits = vlState._raycaster.intersectObject(vlState._deckPlane, false);

        if (pullingOff || overTrash) {
            // Show ghost at last valid position but tinted red + faded
            if (vlState.ghostMesh) {
                vlState.ghostMesh.visible = true;
                // Fade opacity proportional to distance (min 0.15)
                const fadeAlpha = pullingOff
                    ? Math.max(0.15, 0.42 - (offDist - VL_PULL_OFF_THRESHOLD) * 0.003)
                    : 0.42;
                vlState.ghostMesh.traverse(child => {
                    if (child.isMesh) {
                        child.material.color.set(0xdd3c3c);
                        child.material.opacity = fadeAlpha;
                    }
                });
            }
            return;
        }

        if (!hits.length) {
            // Off-canvas but not far enough to remove — hide ghost
            if (vlState.ghostMesh) vlState.ghostMesh.visible = false;
            return;
        }

        const { carrier } = vlState.canvasCarrierDrag;
        const trackNum    = snapToTrack(hits[0].point.x);
        const clamped     = Math.max(4, Math.min(MAX_USABLE_TRACK - carrier.def.tWidth + 1, trackNum));
        const snappedX    = DECK.FIRST_TRACK_X + (clamped - 1) * DECK.TRACK_SPACING;

        if (vlState.ghostMesh) {
            vlState.ghostMesh.position.set(snappedX, DECK.SURFACE_Z, DECK.TRACK_Y_START);
            vlState.ghostMesh.visible = true;
            const collision = checkCarrierCollision(clamped, carrier.def.tWidth, carrier.id);
            vlState.ghostMesh.traverse(child => {
                if (child.isMesh) {
                    child.material.color.set(collision ? 0xee4444 : 0x44aaee);
                    child.material.opacity = 0.42;
                }
            });
            // Show collision reason in status bar
            if (collision) {
                const reason = typeof collision === 'string' && collision.startsWith('carrier:')
                    ? 'Blocked by ' + collision.slice(8)
                    : 'Tracks 61-80 reserved (waste / entry-exit)';
                showVLStatus('Track ' + clamped + ': ' + reason, 'error');
            } else {
                showVLStatus('Track ' + clamped + ' — free');
            }
        }
        vlState.hoveredTrack = clamped;
    }

    function onCanvasCarrierDragEnd(e) {
        document.removeEventListener('mousemove', onCanvasCarrierDragMove);
        document.removeEventListener('mouseup',   onCanvasCarrierDragEnd);

        if (!vlState.canvasCarrierDrag) return;
        const { carrier } = vlState.canvasCarrierDrag;

        // Check trash zone hit BEFORE hiding it
        const trashHit = e && isVLTrashHit(e);
        // Check "pulled off deck" state (cursor was far enough from canvas)
        const pulledOff = vlState._carrierDragOffDeck;

        vlState.canvasCarrierDrag = null;
        vlState._carrierDragOffDeck = false;

        // Re-enable orbit controls
        vlState.controls.enabled = true;

        const newTrack = vlState.hoveredTrack;
        destroyGhostMesh();
        vlState.hoveredTrack = null;
        showVLTrashZone(false);

        // If dropped on trash zone OR pulled off the deck, remove the carrier
        if (trashHit || pulledOff) {
            carrier.mesh.visible = true;
            removeCarrier(carrier.id);
            showVLStatus('Carrier removed.');
            return;
        }

        // Restore carrier mesh visibility
        carrier.mesh.visible = true;

        if (newTrack !== null && newTrack !== carrier.trackStart) {
            if (!checkCarrierCollision(newTrack, carrier.def.tWidth, carrier.id)) {
                // Remove old mesh and rebuild at new track
                vlState.scene.remove(carrier.mesh);
                carrier.mesh.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        (Array.isArray(child.material) ? child.material : [child.material])
                            .forEach(m => m.dispose());
                    }
                });
                const { group, siteMeshes } = buildCarrierMesh(carrier.def, newTrack);
                // Re-add any plates
                carrier.plateMeshes.forEach(pm => {
                    const site = carrier.def.sites.find(s => s.id === pm.siteId);
                    if (site) {
                        const newPm = buildPlateMesh(site, carrier.def);
                        group.add(newPm);
                        pm.mesh = newPm;
                    }
                });
                // Re-add any assigned containers/racks
                if (carrier.siteContainers) {
                    carrier.containerMeshes = [];
                    Object.keys(carrier.siteContainers).forEach(siteIdStr => {
                        const rackKey = carrier.siteContainers[siteIdStr];
                        const rackDef = vlState.rackLibrary[rackKey];
                        const site = carrier.def.sites.find(s => s.id === parseInt(siteIdStr, 10));
                        if (rackDef && site) {
                            const cm = buildContainerMesh(rackKey, rackDef, site, carrier.def);
                            if (cm) {
                                group.add(cm);
                                carrier.containerMeshes.push({ siteId: parseInt(siteIdStr, 10), rackKey: rackKey, mesh: cm });
                            }
                        }
                    });
                }
                vlState.scene.add(group);
                carrier.mesh = group;
                carrier.siteMeshes = siteMeshes;
                carrier.trackStart = newTrack;
                selectCarrier(carrier.id);
                updateCarrierList();
                showVLStatus(`Moved ${carrier.def.viewName} to track ${newTrack}.`);
            } else {
                showVLStatus('Cannot move: track position occupied.', 'error');
            }
        }
    }

    function onDeckClick(e) {
        if (!vlState.scene || !vlState.camera) return;
        const hit = hitTestCarriers(e);
        if (hit) {
            selectCarrier(hit.carrier.id);
            return;
        }
        // Deselect if clicked empty space
        selectCarrier(null);
        updateSitePanel(null);
    }

    // Keyboard: Backspace / Delete removes the selected carrier
    document.addEventListener('keydown', e => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
            // Don't intercept when typing in an input/textarea
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return;
            if (vlState.selectedCarrierId != null) {
                e.preventDefault();
                removeCarrier(vlState.selectedCarrierId);
            }
        }
    });

    // ================================================================
    //  UI: Carrier Palette
    // ================================================================
    function populateCarrierPalette() {
        const list = $('#vl-palette-list');
        if (!list) return;
        list.innerHTML = '';

        Object.entries(CARRIER_LIBRARY).forEach(([key, def]) => {
            const item = document.createElement('button');
            item.className = 'vl-palette-item';
            item.dataset.carrierType = key;
            const has3D = !!(def.modelFile || def.modelFileRel || vlState.xModelCache[key]);
            item.innerHTML = `
                <span class="vl-palette-icon"><i class="fas fa-th-large"></i></span>
                <span class="vl-palette-name">${def.viewName}${has3D ? ' <i class="fas fa-cube" title="3D model available"></i>' : ''}</span>
                <span class="vl-palette-desc">${def.description}</span>
                <span class="vl-palette-size">${def.tWidth}T</span>`;
            // Click opens the dialog; mousedown starts a palette drag
            item.addEventListener('click', () => {
                if (!vlState.paletteDragJustFinished) showPlaceDialog(key);
            });
            item.addEventListener('mousedown', e => {
                if (!vlState.dragToPlaceEnabled) return;
                e.preventDefault();
                startPaletteDrag(e, key);
            });
            list.appendChild(item);
        });
    }

    // ================================================================
    //  Drag-to-Place
    // ================================================================

    function setDragToPlace(enabled) {
        vlState.dragToPlaceEnabled = enabled;
        const host = vlState.host;
        if (host) host.classList.toggle('drag-place-enabled', enabled);
        const btn = $('#vl-vt-drag-place');
        if (btn) btn.classList.toggle('is-active', enabled);
    }

    function destroyGhostMesh() {
        if (!vlState.ghostMesh) return;
        vlState.scene.remove(vlState.ghostMesh);
        vlState.ghostMesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                (Array.isArray(child.material) ? child.material : [child.material])
                    .forEach(m => m.dispose());
            }
        });
        vlState.ghostMesh = null;
    }

    function startPaletteDrag(e, carrierType) {
        const def = CARRIER_LIBRARY[carrierType];
        if (!def) return;

        // Disable orbit controls so camera doesn't pan during palette drag
        if (vlState.controls) vlState.controls.enabled = false;

        // Exit pan mode so the deck is interactive under the ghost
        if (vlState.isPanning) toggleVLPan();

        // Build ghost mesh – same as carrier but semi-transparent blue
        destroyGhostMesh();
        const { group } = buildCarrierMesh(def, 1);
        group.visible = false;
        group.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.42;
                child.material.color.set(0x4499ee);
                child.material.depthWrite = false;
            }
        });
        vlState.ghostMesh = group;
        vlState.scene.add(group);

        vlState.paletteDrag = { type: carrierType, def };
        vlState.paletteDragJustFinished = false;

        // Show cursor ghost div
        const ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        const ghostLabel = document.getElementById('vl-drag-ghost-label');
        if (ghostDiv && ghostLabel) {
            ghostLabel.textContent = def.viewName + ' (' + def.tWidth + 'T)';
            ghostDiv.style.display = 'flex';
            ghostDiv.style.left = (e.clientX + 14) + 'px';
            ghostDiv.style.top  = (e.clientY + 8) + 'px';
        }

        document.addEventListener('mousemove', onPaletteDragMove);
        document.addEventListener('mouseup',   onPaletteDragEnd);
    }

    function onPaletteDragMove(e) {
        if (!vlState.paletteDrag) return;

        // Move cursor ghost
        const ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        if (ghostDiv) {
            ghostDiv.style.left = (e.clientX + 14) + 'px';
            ghostDiv.style.top  = (e.clientY + 8)  + 'px';
        }

        const canvas = vlState.canvas;
        if (!canvas || !vlState.scene || !vlState._deckPlane) return;

        const rect = canvas.getBoundingClientRect();
        const overCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                           e.clientY >= rect.top  && e.clientY <= rect.bottom;

        if (!overCanvas) {
            if (vlState.ghostMesh) vlState.ghostMesh.visible = false;
            return;
        }

        // Raycast onto the invisible deck plane
        vlState._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
        vlState._mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
        vlState._raycaster.setFromCamera(vlState._mouse, vlState.camera);
        const hits = vlState._raycaster.intersectObject(vlState._deckPlane, false);

        if (hits.length === 0) {
            if (vlState.ghostMesh) vlState.ghostMesh.visible = false;
            return;
        }

        const point = hits[0].point;
        const def   = vlState.paletteDrag.def;
        const trackNum    = snapToTrack(point.x);
        const clampedTrack = Math.max(4, Math.min(MAX_USABLE_TRACK - def.tWidth + 1, trackNum));
        const snappedX     = DECK.FIRST_TRACK_X + (clampedTrack - 1) * DECK.TRACK_SPACING;

        if (vlState.ghostMesh) {
            vlState.ghostMesh.position.set(snappedX, DECK.SURFACE_Z, DECK.TRACK_Y_START);
            vlState.ghostMesh.visible = true;

            // Red tint if occupied, blue if free
            const collision = checkCarrierCollision(clampedTrack, def.tWidth, -1);
            const ghostColor = collision ? 0xee4444 : 0x4499ee;
            vlState.ghostMesh.traverse(child => {
                if (child.isMesh) child.material.color.set(ghostColor);
            });
            // Show collision reason in status bar
            if (collision) {
                const reason = typeof collision === 'string' && collision.startsWith('carrier:')
                    ? 'Blocked by ' + collision.slice(8)
                    : 'Tracks 61-80 reserved (waste / entry-exit)';
                showVLStatus('Track ' + clampedTrack + ': ' + reason, 'error');
            } else {
                showVLStatus('Track ' + clampedTrack + ' — free');
            }
        }
        vlState.hoveredTrack = clampedTrack;
    }

    function onPaletteDragEnd(e) {
        document.removeEventListener('mousemove', onPaletteDragMove);
        document.removeEventListener('mouseup',   onPaletteDragEnd);

        // Re-enable orbit controls
        if (vlState.controls) vlState.controls.enabled = true;

        // Hide cursor ghost
        const ghostDiv = document.getElementById('vl-drag-cursor-ghost');
        if (ghostDiv) ghostDiv.style.display = 'none';

        if (!vlState.paletteDrag) return;

        const { type, def } = vlState.paletteDrag;
        vlState.paletteDrag = null;

        // Check drop position
        const canvas = vlState.canvas;
        const droppedOnCanvas = (() => {
            if (!canvas) return false;
            const rect = canvas.getBoundingClientRect();
            return e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top  && e.clientY <= rect.bottom;
        })();

        if (droppedOnCanvas && vlState.ghostMesh?.visible && vlState.hoveredTrack !== null) {
            const track = vlState.hoveredTrack;
            destroyGhostMesh();
            if (!checkCarrierCollision(track, def.tWidth, -1)) {
                const entry = placeCarrier(type, track, false);
                if (entry) selectCarrier(entry.id);
                // Suppress the click event that fires right after mouseup
                vlState.paletteDragJustFinished = true;
                setTimeout(() => { vlState.paletteDragJustFinished = false; }, 150);
            } else {
                showVLStatus('Cannot place: track position occupied.', 'error');
            }
        } else {
            destroyGhostMesh();
        }

        vlState.hoveredTrack = null;
    }

    function showPlaceDialog(carrierType) {
        const def = CARRIER_LIBRARY[carrierType];
        if (!def) return;

        const dialog = $('#vl-place-dialog');
        if (!dialog) return;

        $('#vl-pd-carrier-name').textContent = def.viewName;
        $('#vl-pd-carrier-desc').textContent = def.description;
        $('#vl-pd-twidth').textContent = `${def.tWidth}T wide (${def.dx}mm)`;
        $('#vl-pd-sites').textContent = `${def.sites.length} site${def.sites.length !== 1 ? 's' : ''}`;

        // Set default track (next available, min track 4)
        const track = findNextFreeTrack(def.tWidth);
        $('#vl-pd-track').value = track;
        $('#vl-pd-track').min = '4';
        $('#vl-pd-track').max = String(MAX_USABLE_TRACK - def.tWidth + 1);

        dialog.dataset.carrierType = carrierType;
        dialog.classList.add('is-visible');
    }

    function findNextFreeTrack(tWidth) {
        for (let t = 4; t <= MAX_USABLE_TRACK - tWidth + 1; t++) {
            if (!checkCarrierCollision(t, tWidth, -1)) return t;
        }
        return 4;
    }

    // ================================================================
    //  UI: Carrier List
    // ================================================================
    function updateCarrierList() {
        const list = $('#vl-carrier-list');
        if (!list) return;
        list.innerHTML = '';

        if (vlState.placedCarriers.length === 0) {
            list.innerHTML = '<div class="vl-empty-hint">No carriers placed yet.<br>Select a carrier from the palette above and click Place.</div>';
            return;
        }

        vlState.placedCarriers.forEach(carrier => {
            const item = document.createElement('div');
            item.className = 'vl-carrier-item';
            item.dataset.carrierId = carrier.id;
            if (carrier.id === vlState.selectedCarrierId) item.classList.add('is-selected');

            const platesOn = carrier.plateMeshes.length;
            const totalSites = carrier.def.sites.length;

            item.innerHTML = `
                <div class="vl-ci-header">
                    <i class="fas fa-th-large vl-ci-icon"></i>
                    <span class="vl-ci-name">${carrier.def.viewName}</span>
                    <span class="vl-ci-track">T${carrier.trackStart}</span>
                    <button class="vl-ci-del" data-id="${carrier.id}" title="Remove carrier"><i class="fas fa-trash"></i></button>
                </div>
                <div class="vl-ci-meta">${carrier.def.tWidth}T &mdash; ${platesOn}/${totalSites} plates</div>`;

            item.addEventListener('click', (e) => {
                if (e.target.closest('.vl-ci-del')) return;
                selectCarrier(carrier.id);
            });
            item.querySelector('.vl-ci-del').addEventListener('click', (e) => {
                e.stopPropagation();
                removeCarrier(carrier.id);
            });

            list.appendChild(item);
        });
    }

    // ================================================================
    //  UI: Site Panel (shows carrier sites, toggle plates)
    // ================================================================
    function updateSitePanel(carrier) {
        const panel = $('#vl-site-panel');
        const title = $('#vl-site-panel-title');
        if (!panel) return;

        if (!carrier) {
            panel.innerHTML = '<div class="vl-empty-hint">Select a carrier to manage its plate sites.</div>';
            if (title) title.textContent = 'Site Positions';
            return;
        }

        if (title) title.textContent = `${carrier.def.viewName} — Sites`;

        if (carrier.def.sites.length === 0) {
            panel.innerHTML = '<div class="vl-empty-hint">This carrier has no SBS plate sites.</div>';
            return;
        }

        panel.innerHTML = '';

        // Sort sites by id for display
        const sorted = [...carrier.def.sites].sort((a, b) => a.id - b.id);

        sorted.forEach(site => {
            const hasPlate = carrier.plateMeshes.some(p => p.siteId === site.id);
            const assignedRack = carrier.siteContainers ? carrier.siteContainers[site.id] : null;
            const rackDef = assignedRack ? vlState.rackLibrary[assignedRack] : null;

            const row = document.createElement('div');
            row.className = 'vl-site-row' + (hasPlate ? ' has-plate' : '') + (assignedRack ? ' has-container' : '');

            // Build row content
            var rowHTML = '<span class="vl-site-label">Site ' + site.id + '</span>' +
                '<span class="vl-site-pos">Y: ' + site.y.toFixed(1) + 'mm</span>';

            if (assignedRack && rackDef) {
                // Show assigned container with remove button
                rowHTML += '<span class="vl-site-container-name"><i class="fas fa-box"></i> ' +
                    (rackDef.name || assignedRack) + '</span>' +
                    '<button class="vl-site-btn vl-site-btn-remove" data-carrier="' + carrier.id + '" data-site="' + site.id + '">' +
                    '<i class="fas fa-times-circle"></i> Remove</button>';
            } else {
                // Show plate toggle + container assign button
                rowHTML += '<button class="vl-site-btn' + (hasPlate ? ' plate-on' : '') + '" data-carrier="' + carrier.id + '" data-site="' + site.id + '">' +
                    '<i class="fas ' + (hasPlate ? 'fa-minus-circle' : 'fa-plus-circle') + '"></i> ' +
                    (hasPlate ? 'Remove' : 'Place') + ' Plate</button>' +
                    '<button class="vl-site-btn vl-site-btn-rack" data-carrier="' + carrier.id + '" data-site="' + site.id + '" title="Assign rack / container">' +
                    '<i class="fas fa-box"></i></button>';
            }

            row.innerHTML = rowHTML;

            // Wire events
            if (assignedRack) {
                row.querySelector('.vl-site-btn-remove').addEventListener('click', function () {
                    removeContainerFromSite(carrier, site.id);
                    showVLStatus('Removed container from site ' + site.id + '.');
                    updateSitePanel(carrier);
                });
            } else {
                row.querySelector('.vl-site-btn:not(.vl-site-btn-rack)').addEventListener('click', function () {
                    togglePlateOnSite(carrier.id, site.id);
                });
                var rackBtn = row.querySelector('.vl-site-btn-rack');
                if (rackBtn) {
                    rackBtn.addEventListener('click', function () {
                        showContainerPicker(carrier.id, site.id);
                    });
                }
            }

            panel.appendChild(row);
        });
    }

    // ================================================================
    //  TML Import
    // ================================================================
    function wireTMLImport() {
        const fileInput = $('#vl-tml-input');
        const openBtn   = $('#vl-tml-open');
        const dropZone  = $('#vl-tml-drop');

        if (openBtn && fileInput) {
            openBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', e => {
                const files = Array.from(e.target.files);
                if (files.length > 0) processTMLDrop(files);
                fileInput.value = '';
            });
        }

        if (dropZone) {
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) processTMLDrop(files);
            });
        }
    }

    /**
     * Process a batch of dropped/selected files, routing .tml files through
     * loadTMLFile() and .x files through loadXModelForCarrierKey().
     * When a .tml and .x share the same base name (or only one of each is
     * present), the .x model is associated with that carrier automatically.
     */
    function processTMLDrop(files) {
        const tmlFiles = files.filter(f => /\.tml$/i.test(f.name));
        const xFiles   = files.filter(f => /\.(x|hxx)$/i.test(f.name));

        if (tmlFiles.length === 0 && xFiles.length === 0) {
            showVLStatus('Please drop a .tml carrier template file (optionally with a .x/.hxx model).', 'error');
            return;
        }

        // Match each .tml with its companion .x/.hxx by base name, or by sole-file pairing
        tmlFiles.forEach(function (tmlFile) {
            const baseName = tmlFile.name.replace(/\.tml$/i, '').toLowerCase();
            let companionX = xFiles.find(f => f.name.replace(/\.(x|hxx)$/i, '').toLowerCase() === baseName);
            // Fall back: if exactly one .tml and one .x/.hxx are dropped together, pair them
            if (!companionX && tmlFiles.length === 1 && xFiles.length === 1) {
                companionX = xFiles[0];
            }
            loadTMLFile(tmlFile, companionX || null);
        });

        // If only .x/.hxx files were dropped (no .tml), attach to the most-recently imported carrier
        if (tmlFiles.length === 0 && xFiles.length > 0) {
            if (vlState.importedCarrier) {
                xFiles.forEach(f => loadXOrHxxModelForCarrierKey(vlState.importedCarrier, f));
            } else {
                showVLStatus('Drop a .tml alongside the .x/.hxx to assign the 3D model.', 'error');
            }
        }
    }

    /**
     * Auto-fetch a carrier's 3D model from the server using its Hamilton path.
     * E.g. "ML_STAR\\CORE\\universal_waste_chute.x" → fetch from Base Hamilton Files/Labware/...
     */
    function autoFetchCarrierModel(carrierKey, hamiltonPath, parsed) {
        var serverPath = resolveHamiltonPath(hamiltonPath);
        if (!serverPath) return;

        var isHxx = /\.hxx$/i.test(serverPath);

        fetch(serverPath).then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.arrayBuffer();
        }).then(function (data) {
            if (isHxx && typeof HXXLoader !== 'undefined') {
                return HXXLoader.parse(data).then(function (result) {
                    return result.xFileBinary || result.xFileText;
                });
            }
            return data;
        }).then(function (xData) {
            if (!xData) return;

            var blob = new Blob([xData], { type: 'application/octet-stream' });
            var url = URL.createObjectURL(blob);
            var manager = new THREE.LoadingManager();
            var basePath = serverPath.substring(0, serverPath.lastIndexOf('/') + 1);
            manager.setURLModifier(function (texUrl) {
                if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                    return basePath + texUrl.split('/').pop();
                }
                return texUrl;
            });
            var loader = new THREE.XFileLoader(manager);

            loader.load(url, function (object) {
                URL.revokeObjectURL(url);
                if (!object || !object.models || object.models.length === 0) return;

                var group = new THREE.Group();
                group.name = '__xmodel_template_' + carrierKey + '__';
                object.models.forEach(function (m, idx) {
                    m.renderOrder = idx;
                    if (m.material) {
                        var mats = Array.isArray(m.material) ? m.material : [m.material];
                        mats.forEach(function (mat) {
                            if (!mat) return;
                            mat.polygonOffset = true;
                            mat.polygonOffsetFactor = idx === 0 ? 1 : -Math.min(idx, 10);
                            mat.polygonOffsetUnits  = idx === 0 ? 1 : -Math.min(idx, 10) * 4;
                        });
                    }
                    group.add(m);
                });

                fixXFileCoords(group);

                vlState.xModelCache[carrierKey] = group;
                rebuildPlacedCarriersOfType(carrierKey);
                populateCarrierPalette();

                var refreshCount = vlState.placedCarriers.filter(function (c) { return c.type === carrierKey; }).length;
                if (refreshCount > 0) {
                    showVLStatus('3D model auto-loaded for ' + carrierKey, 'ok');
                }
            }, undefined, function (err) {
                URL.revokeObjectURL(url);
                console.warn('[VantageLayout] Auto-fetch carrier model failed:', serverPath, err);
            });
        }).catch(function (err) {
            console.warn('[VantageLayout] Could not auto-fetch carrier model:', serverPath, err.message);
        });
    }

    function loadTMLFile(tmlFile, xFile) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result;
            const parsed = parseTML(text);
            if (!parsed.viewName) parsed.viewName = tmlFile.name.replace(/\.tml$/i, '');
            if (!parsed.description) parsed.description = 'Imported carrier';

            // Register in library
            const key = parsed.viewName.toUpperCase().replace(/\s+/g, '_');
            CARRIER_LIBRARY[key] = parsed;
            vlState.importedCarrier = key;

            showVLStatus(`Loaded ${parsed.viewName}: ${parsed.sites.length} sites, ${parsed.tWidth}T`, 'ok');
            populateCarrierPalette();

            // Load companion .x/.hxx model if provided
            if (xFile) {
                loadXOrHxxModelForCarrierKey(key, xFile);
            } else if (parsed.modelFileHamilton) {
                // Auto-fetch carrier 3D model from Hamilton path
                autoFetchCarrierModel(key, parsed.modelFileHamilton, parsed);
            }

            // Load site labware 3D models (rck → 3DModel → .x/.hxx)
            loadSiteLabwareModels(key, parsed.sites);

            // Auto-open place dialog
            showPlaceDialog(key);
        };
        reader.readAsText(tmlFile);
    }

    /**
     * Load a .x or .hxx file and cache its geometry under the given carrier key.
     * For .hxx files, extracts the embedded .x data using HXXLoader first.
     */
    function loadXOrHxxModelForCarrierKey(carrierKey, file) {
        if (/\.hxx$/i.test(file.name) && typeof HXXLoader !== 'undefined') {
            // Read as ArrayBuffer, extract .x text, then load
            var hxxReader = new FileReader();
            hxxReader.onload = function (ev) {
                HXXLoader.parse(ev.target.result).then(function (result) {
                    var blob = new Blob([result.xFileText], { type: 'text/plain' });
                    var syntheticFile = new File([blob], carrierKey + '.x', { type: 'text/plain' });
                    loadXModelForCarrierKey(carrierKey, syntheticFile);
                }).catch(function (err) {
                    showVLStatus('Failed to parse .hxx file: ' + err.message, 'error');
                });
            };
            hxxReader.readAsArrayBuffer(file);
        } else {
            loadXModelForCarrierKey(carrierKey, file);
        }
    }

    /**
     * Load a .x file and cache its geometry under the given carrier key.
     * Any already-placed carriers of that type are rebuilt with the new model.
     */
    function loadXModelForCarrierKey(carrierKey, file) {
        const fileURL = URL.createObjectURL(file);
        showVLStatus('Loading 3D model for ' + carrierKey + '…');

        const manager = new THREE.LoadingManager();
        const loader = new THREE.XFileLoader(manager);

        loader.load(fileURL, function (object) {
            URL.revokeObjectURL(fileURL);

            if (!object || !object.models || object.models.length === 0) {
                showVLStatus('No geometry found in .x file.', 'error');
                return;
            }

            const group = new THREE.Group();
            group.name = '__xmodel_template_' + carrierKey + '__';
            object.models.forEach(function (m, idx) {
                m.renderOrder = idx;
                if (m.material) {
                    const mats = Array.isArray(m.material) ? m.material : [m.material];
                    mats.forEach(function (mat, mi) {
                        if (!mat) return;
                        mat.polygonOffset = true;
                        mat.polygonOffsetFactor = idx === 0 ? 1 : -Math.min(idx, 10);
                        mat.polygonOffsetUnits  = idx === 0 ? 1 : -Math.min(idx, 10) * 4;
                    });
                }
                group.add(m);
            });

            // Convert DirectX left-handed coords → Three.js right-handed
            fixXFileCoords(group);

            // Store as the template (will be cloned on each placement)
            vlState.xModelCache[carrierKey] = group;

            // Rebuild any already-placed carriers of this type
            rebuildPlacedCarriersOfType(carrierKey);

            // Refresh palette so 3D icon appears
            populateCarrierPalette();

            var refreshCount = vlState.placedCarriers.filter(function (c) { return c.type === carrierKey; }).length;
            if (refreshCount > 0) {
                showVLStatus('3D model applied to ' + refreshCount + ' carrier(s).', 'ok');
            } else {
                showVLStatus('3D model cached — place ' + carrierKey + ' to see it.', 'ok');
            }
        }, undefined, function (err) {
            URL.revokeObjectURL(fileURL);
            showVLStatus('Failed to load .x model.', 'error');
            console.error('VantageLayout: xModel load error for', carrierKey, err);
        });
    }

    // ================================================================
    //  Carrier Palette Wire-up
    // ================================================================
    function wireCarrierPalette() {
        // Place dialog confirm
        const confirmBtn = $('#vl-pd-confirm');
        const cancelBtn  = $('#vl-pd-cancel');
        const dialog     = $('#vl-place-dialog');

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const carrierType = dialog.dataset.carrierType;
                const trackInput  = $('#vl-pd-track');
                const trackNum    = parseInt(trackInput ? trackInput.value : '1', 10);
                const autoFill    = $('#vl-pd-autofill') ? $('#vl-pd-autofill').checked : true;
                placeCarrier(carrierType, trackNum, autoFill);
                dialog.classList.remove('is-visible');
            });
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                dialog.classList.remove('is-visible');
            });
        }

        // Fill-all / clear-all buttons in site panel
        const fillAll = $('#vl-fill-all');
        const clearAll = $('#vl-clear-all');

        if (fillAll) {
            fillAll.addEventListener('click', () => {
                if (vlState.selectedCarrierId == null) return;
                const carrier = vlState.placedCarriers.find(c => c.id === vlState.selectedCarrierId);
                if (!carrier) return;
                carrier.def.sites.forEach(site => {
                    if (!carrier.plateMeshes.some(p => p.siteId === site.id)) {
                        togglePlateOnSite(carrier.id, site.id);
                    }
                });
            });
        }
        if (clearAll) {
            clearAll.addEventListener('click', () => {
                if (vlState.selectedCarrierId == null) return;
                const carrier = vlState.placedCarriers.find(c => c.id === vlState.selectedCarrierId);
                if (!carrier) return;
                [...carrier.plateMeshes].forEach(p => togglePlateOnSite(carrier.id, p.siteId));
            });
        }

        // Container picker dialog cancel
        const cdCancel = document.getElementById('vl-cd-cancel');
        const cdDialog = document.getElementById('vl-container-dialog');
        if (cdCancel && cdDialog) {
            cdCancel.addEventListener('click', function () {
                cdDialog.classList.remove('is-visible');
            });
        }

        // Container dialog: import .rck inline
        const cdImportBtn = document.getElementById('vl-cd-import-btn');
        const cdImportInput = document.getElementById('vl-cd-import-input');
        if (cdImportBtn && cdImportInput) {
            cdImportBtn.addEventListener('click', function () { cdImportInput.click(); });
            cdImportInput.addEventListener('change', function (e) {
                var files = Array.from(e.target.files);
                if (files.length > 0) {
                    processRackDrop(files);
                    // Refresh the dialog
                    var cId = parseInt(cdDialog.dataset.carrierId, 10);
                    var sId = parseInt(cdDialog.dataset.siteId, 10);
                    setTimeout(function () { showContainerPicker(cId, sId); }, 300);
                }
                cdImportInput.value = '';
            });
        }
    }

    // ================================================================
    //  Export Layout JSON
    // ================================================================
    function exportLayout() {
        const layout = {
            instrument: 'Hamilton Vantage',
            generated: new Date().toISOString(),
            deck: {
                trackCount: DECK.TRACK_COUNT,
                trackSpacing: DECK.TRACK_SPACING,
            },
            carriers: vlState.placedCarriers.map(c => ({
                id: c.id,
                type: c.def.viewName,
                trackStart: c.trackStart,
                tWidth: c.def.tWidth,
                sites: c.def.sites.map(s => ({
                    siteId: s.id,
                    hasPlate: c.plateMeshes.some(p => p.siteId === s.id),
                    container: (c.siteContainers && c.siteContainers[s.id])
                        ? { rackKey: c.siteContainers[s.id], name: (vlState.rackLibrary[c.siteContainers[s.id]] || {}).name || '' }
                        : null,
                    absoluteX: (DECK.FIRST_TRACK_X + (c.trackStart - 1) * DECK.TRACK_SPACING) + s.x,
                    absoluteY: DECK.TRACK_Y_START + s.y,
                    absoluteZ: DECK.SURFACE_Z + s.z,
                })),
            })),
        };

        const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = 'vantage_layout.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showVLStatus('Layout exported as JSON.', 'ok');
    }

    // ================================================================
    //  Bottom Controls + Main Toolbar Wire-up
    // ================================================================
    function wireVLControls() {
        const exportBtn = $('#vl-export-btn');
        if (exportBtn) exportBtn.addEventListener('click', exportLayout);

        const clearAllBtn = $('#vl-clear-deck');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (!confirm('Remove all carriers from the deck?')) return;
                [...vlState.placedCarriers].forEach(c => removeCarrier(c.id));
            });
        }

        const resetCamBtn = $('#vl-reset-cam-btn');
        if (resetCamBtn) resetCamBtn.addEventListener('click', resetVLCamera);

        wireDeckDebugPanel();
        wireFixtureDebugPanel();
        wireEEDebugPanel();
        wireVLSettingsPanel();
    }

    // ================================================================
    //  GLTF Deck Debug / Alignment Panel
    // ================================================================
    function wireDeckDebugPanel() {
        const panel = document.getElementById('vl-deck-debug-panel');
        if (!panel) return;

        // Wire XYZ step inputs
        ['x', 'y', 'z'].forEach(axis => {
            const input = document.getElementById(`vl-dbg-${axis}`);
            if (!input) return;
            input.addEventListener('input', () => applyDebugDeckOffset());
            input.addEventListener('change', () => applyDebugDeckOffset());
        });

        // Step buttons
        document.querySelectorAll('#vl-deck-debug-panel .dbg-step-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const axis  = btn.dataset.axis;
                const delta = parseFloat(btn.dataset.delta);
                const inp   = document.getElementById(`vl-dbg-${axis}`);
                if (inp) {
                    inp.value = (parseFloat(inp.value) || 0) + delta;
                    applyDebugDeckOffset();
                }
            });
        });

        // Copy button
        const copyBtn = document.getElementById('vl-dbg-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const x = document.getElementById('vl-dbg-x')?.value || 0;
                const y = document.getElementById('vl-dbg-y')?.value || 0;
                const z = document.getElementById('vl-dbg-z')?.value || 0;
                const txt = `deckCenterX + (${x}),  DECK.SURFACE_Z - box.max.y + (${y}),  deckCenterZ + (${z})`;
                navigator.clipboard?.writeText(txt).then(() => showVLStatus('Offset copied to clipboard', 'ok'))
                    .catch(() => showVLStatus(txt, 'ok'));
            });
        }

        // Apply offsets button – bake current debug offsets into the base position
        const applyBtn = document.getElementById('vl-dbg-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const model = vlState.gltfModel;
                if (!model || !vlState._gltfBasePos) {
                    showVLStatus('No GLTF deck model loaded yet.', 'error');
                    return;
                }
                const dx = parseFloat(document.getElementById('vl-dbg-x')?.value) || 0;
                const dy = parseFloat(document.getElementById('vl-dbg-y')?.value) || 0;
                const dz = parseFloat(document.getElementById('vl-dbg-z')?.value) || 0;
                // Save cumulative offsets to localStorage
                try {
                    const prev = JSON.parse(localStorage.getItem('vl-deck-debug-offsets')) || { x: 0, y: 0, z: 0 };
                    const cumulative = {
                        x: (prev.x || 0) + dx,
                        y: (prev.y || 0) + dy,
                        z: (prev.z || 0) + dz
                    };
                    localStorage.setItem('vl-deck-debug-offsets', JSON.stringify(cumulative));
                } catch (_) { /* ignore */ }
                // Bake current position as new base
                vlState._gltfBasePos = model.position.clone();
                // Also bake waste/drawer base positions
                if (vlState.wasteMesh) vlState.wasteMesh.userData._deckBasePos = vlState.wasteMesh.position.clone();
                if (vlState.drawerMesh) vlState.drawerMesh.userData._deckBasePos = vlState.drawerMesh.position.clone();
                // Reset debug inputs to 0
                ['x', 'y', 'z'].forEach(a => {
                    const inp = document.getElementById(`vl-dbg-${a}`);
                    if (inp) inp.value = 0;
                });
                refreshDeckDebugReadout();
                showVLStatus('Offsets applied and saved', 'ok');
            });
        }

        // Reset button
        const resetBtn = document.getElementById('vl-dbg-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                ['x', 'y', 'z'].forEach(a => {
                    const inp = document.getElementById(`vl-dbg-${a}`);
                    if (inp) inp.value = 0;
                });
                applyDebugDeckOffset();
            });
        }
    }

    /** Apply previously-baked deck debug offsets to a newly-created fixture mesh
     *  so it starts aligned with the deck model (which already has these offsets baked in). */
    function applySavedDeckOffsetsToMesh(mesh) {
        try {
            var saved = JSON.parse(localStorage.getItem('vl-deck-debug-offsets'));
            if (saved && (saved.x || saved.y || saved.z)) {
                mesh.position.x += saved.x || 0;
                mesh.position.y += saved.y || 0;
                mesh.position.z += saved.z || 0;
                // Re-snapshot fixture base positions with the offset applied
                snapshotFixtureBasePositions(mesh);
            }
        } catch (_) { /* ignore */ }
    }

    function applyDebugDeckOffset() {
        const model = vlState.gltfModel;
        if (!model) { showVLStatus('No GLTF deck model loaded yet.', 'error'); return; }

        const dx = parseFloat(document.getElementById('vl-dbg-x')?.value) || 0;
        const dy = parseFloat(document.getElementById('vl-dbg-y')?.value) || 0;
        const dz = parseFloat(document.getElementById('vl-dbg-z')?.value) || 0;

        // Re-compute base position (same as loadDeckModel)
        const box = new THREE.Box3().setFromObject(model);
        // Note: box changes as model moves, so store the original base offset
        if (!vlState._gltfBasePos) {
            vlState._gltfBasePos = model.position.clone();
        }
        model.position.set(
            vlState._gltfBasePos.x + dx,
            vlState._gltfBasePos.y + dy,
            vlState._gltfBasePos.z + dz
        );

        // Move waste and drawer meshes by the same delta so everything stays as a single unit
        if (vlState.wasteMesh && vlState.wasteMesh.userData._deckBasePos) {
            var wBase = vlState.wasteMesh.userData._deckBasePos;
            vlState.wasteMesh.position.set(wBase.x + dx, wBase.y + dy, wBase.z + dz);
            // Update fixture debug base positions so fixture offsets layer on top
            snapshotFixtureBasePositions(vlState.wasteMesh);
            if (vlState.fixtureDebugMode) {
                applyFixtureDebugOffsets();
                refreshFixtureDebugReadout();
            }
        }
        if (vlState.drawerMesh && vlState.drawerMesh.userData._deckBasePos) {
            var dBase = vlState.drawerMesh.userData._deckBasePos;
            vlState.drawerMesh.position.set(dBase.x + dx, dBase.y + dy, dBase.z + dz);
            // Update fixture and EE debug base positions so their offsets layer on top
            snapshotFixtureBasePositions(vlState.drawerMesh);
            vlState._eeBasePos = vlState.drawerMesh.position.clone();
            if (vlState.fixtureDebugMode) {
                applyFixtureDebugOffsets();
                refreshFixtureDebugReadout();
            }
            if (vlState.eeDebugMode) {
                applyEEDebugOffset();
            }
        }

        refreshDeckDebugReadout();
    }

    function refreshDeckDebugReadout() {
        const el = document.getElementById('vl-dbg-readout');
        if (!el) return;
        const model = vlState.gltfModel;
        if (!model) { el.textContent = 'No model'; return; }
        const p = model.position;
        el.textContent = `pos  X: ${p.x.toFixed(2)}  Y: ${p.y.toFixed(2)}  Z: ${p.z.toFixed(2)}`;
    }

    // ================================================================
    //  Settings Panel — Cutout Visibility + Deck Repositioning
    // ================================================================

    // Collect the 4 VANTAGE_DECK_COVER Object3D references by traversal.
    // Stored in vlState.deckCoverNodes sorted by name (panel 1..4).
    // Called once after the GLTF finishes loading.
    function collectDeckCoverNodes() {
        const covers = [];
        if (!vlState.gltfModel) return;
        vlState.gltfModel.traverse(function (obj) {
            if (/^VANTAGE_DECK_COVER/i.test(obj.name)) {
                covers.push(obj);
            }

        });
        covers.sort(function (a, b) { return a.name.localeCompare(b.name); });
        vlState.deckCoverNodes = covers;

        // Compute cutout track positions from cover panel bounding boxes.
        // Subtract any debug offset so the computation uses the original
        // (un-shifted) model coordinates — prevents wrong tracks after reload.
        vlState.gltfModel.updateMatrixWorld(true);
        var debugOffsetX = vlState.gltfModel.position.x - (vlState._gltfOriginalBasePos ? vlState._gltfOriginalBasePos.x : vlState.gltfModel.position.x);
        covers.forEach(function (node, i) {
            if (i >= DECK_CUTOUTS.length) return;
            var bb = new THREE.Box3().setFromObject(node);
            // Remove debug offset so track calc matches logical deck coordinates
            var minX = bb.min.x - debugOffsetX;
            var maxX = bb.max.x - debugOffsetX;
            var tStart = Math.round((minX - DECK.FIRST_TRACK_X) / DECK.TRACK_SPACING) + 1;
            var tEnd   = Math.round((maxX - DECK.FIRST_TRACK_X) / DECK.TRACK_SPACING) + 1;
            DECK_CUTOUTS[i].trackStart = tStart;
            DECK_CUTOUTS[i].trackSpan  = tEnd - tStart;
            console.log('[VantageLayout] Cutout', i, ': tracks', tStart, '-',
                (tStart + tEnd - tStart - 1),
                '(local X:', minX.toFixed(1), 'to', maxX.toFixed(1), ')');
        });

        console.log('[VantageLayout] deck cover nodes:', covers.map(function (n) { return n.name; }));

        // Collect the back cutout objects (backCutout1..backCutout4).
        collectBackShields();
    }

    // ================================================================
    //  Back cutout collection
    // ================================================================
    // Finds the 4 named backCutout objects (backCutout1..backCutout4)
    // in the GLTF model and stores them for per-section toggle.

    function collectBackShields() {
        if (!vlState.gltfModel) return;

        var backCutouts = [null, null, null, null];
        vlState.gltfModel.traverse(function (obj) {
            var match = /^backCutout(\d)$/.exec(obj.name);
            if (match) {
                var idx = parseInt(match[1], 10) - 1;
                if (idx >= 0 && idx < 4) backCutouts[idx] = obj;
            }
        });

        vlState.backShieldNodes = backCutouts.map(function (node) {
            return node ? [node] : [];
        });
        vlState.backShieldVisible = [true, true, true, false];
        // Hide shield 4 by default
        if (backCutouts[3]) backCutouts[3].visible = false;
        console.log('[VantageLayout] back cutouts:',
            backCutouts.map(function (n) { return n ? n.name : '(missing)'; }).join(', '));
    }

    // ================================================================
    //  Back shield visibility
    // ================================================================

    function setBackShieldVisible(idx, visible) {
        if (idx < 0 || idx >= vlState.backShieldNodes.length) return;
        vlState.backShieldVisible[idx] = visible;
        vlState.backShieldNodes[idx].forEach(function (m) {
            if (m) m.visible = visible;
        });
    }

    function applyCutoutVisibility() {
        if (!vlState.gltfModel) return;
        // Lazy-collect if not yet done (unlikely path, but safe)
        if (!vlState.deckCoverNodes) collectDeckCoverNodes();
        vlState.deckCoverNodes.forEach(function (node, i) {
            node.visible = !!vlState.deckCutouts[i];
        });
        showVLStatus('Cover panel ' + (vlState.deckCutouts.map(function (v, i) { return v ? null : 'Panel ' + (i + 1); }).filter(Boolean).join(', ') || 'none') + ' hidden', '');
    }

    // ================================================================
    //  Waste Unit Debug (body vs accessories independent movement)
    // ================================================================

    /**
     * Get the currently-active fixture mesh (waste or drawer, whichever is installed).
     * Returns { mesh, name } or null.
     */
    function getActiveFixtureMesh() {
        if (vlState.wasteMesh) return { mesh: vlState.wasteMesh, name: 'Waste Chute' };
        if (vlState.drawerMesh) return { mesh: vlState.drawerMesh, name: 'Entry/Exit Drawer' };
        return null;
    }

    /**
     * Apply the current fixture debug offsets to the fixture mesh children.
     * Body children have '_body_x__' in their name.
     * Labware/accessories children have '_labware_' in their name.
     */
    function applyFixtureDebugOffsets() {
        var fix = getActiveFixtureMesh();
        if (!fix) return;
        var mesh = fix.mesh;
        var off = vlState.fixtureDebugOffsets;
        var compOff = vlState.fixtureDebugComponentOffsets;

        // Apply group-level offset to the mesh itself
        if (mesh.userData._fixBasePos) {
            mesh.position.set(
                mesh.userData._fixBasePos.x + off.group.x,
                mesh.userData._fixBasePos.y + off.group.y,
                mesh.userData._fixBasePos.z + off.group.z
            );
        }

        mesh.children.forEach(function (child) {
            if (!child.userData._fixBasePos) return;
            var base = child.userData._fixBasePos;
            var cx = 0, cy = 0, cz = 0;

            // Per-component offset (if any)
            if (child.name && compOff[child.name]) {
                cx = compOff[child.name].x || 0;
                cy = compOff[child.name].y || 0;
                cz = compOff[child.name].z || 0;
            }

            if (child.name && (child.name.indexOf('_body_x__') !== -1 || child.name.indexOf('_body__') !== -1)) {
                child.position.set(
                    base.x + off.body.x + cx,
                    base.y + off.body.y + cy,
                    base.z + off.body.z + cz
                );
            } else if (child.name && child.name.indexOf('_labware_') !== -1) {
                child.position.set(
                    base.x + off.accessories.x + cx,
                    base.y + off.accessories.y + cy,
                    base.z + off.accessories.z + cz
                );
            }
        });
    }

    /**
     * Store the original positions of all fixture children so offsets can be applied
     * non-destructively.  Called whenever a fixture mesh is built/rebuilt.
     */
    function snapshotFixtureBasePositions(mesh) {
        if (!mesh) return;
        mesh.userData._fixBasePos = mesh.position.clone();
        mesh.children.forEach(function (child) {
            child.userData._fixBasePos = child.position.clone();
        });
    }

    /** Refresh the readout text in the fixture debug panel. */
    function refreshFixtureDebugReadout() {
        var el = document.getElementById('vl-fix-readout');
        if (!el) return;
        var fix = getActiveFixtureMesh();
        if (!fix) { el.textContent = 'No fixture installed'; return; }
        var mesh = fix.mesh;
        var off = vlState.fixtureDebugOffsets;
        var compOff = vlState.fixtureDebugComponentOffsets;
        var fmt = function (o) { return 'X:' + o.x.toFixed(1) + ' Y:' + o.y.toFixed(1) + ' Z:' + o.z.toFixed(1); };

        var lines = [fix.name];
        lines.push('Group: ' + fmt(mesh.position) + '  off: ' + fmt(off.group));

        mesh.children.forEach(function (child) {
            if (!child.name) return;
            var wp = new THREE.Vector3();
            child.getWorldPosition(wp);
            var label = child.name.replace(/__/g, '').replace('waste_chute_', '');
            var co = compOff[child.name];
            var coStr = co ? '  comp: ' + fmt(co) : '';
            if (child.name.indexOf('_body_x__') !== -1 || child.name.indexOf('_body__') !== -1) {
                lines.push('Body: ' + fmt(wp) + coStr);
            } else if (child.name.indexOf('_labware_') !== -1) {
                var selected = (vlState.fixtureDebugTarget === 'component' && vlState.fixtureDebugComponent === child.name);
                lines.push((selected ? '> ' : '  ') + label + ': ' + fmt(wp) + coStr);
            }
        });

        el.textContent = lines.join('\n');
    }

    /** Update the input values to match the currently selected target. */
    function syncFixtureDebugInputs() {
        var target = vlState.fixtureDebugTarget;
        var off;
        if (target === 'component' && vlState.fixtureDebugComponent) {
            var cname = vlState.fixtureDebugComponent;
            if (!vlState.fixtureDebugComponentOffsets[cname]) {
                vlState.fixtureDebugComponentOffsets[cname] = { x: 0, y: 0, z: 0 };
            }
            off = vlState.fixtureDebugComponentOffsets[cname];
        } else {
            off = vlState.fixtureDebugOffsets[target];
        }
        if (!off) return;
        var xi = document.getElementById('vl-fix-x');
        var yi = document.getElementById('vl-fix-y');
        var zi = document.getElementById('vl-fix-z');
        if (xi) xi.value = off.x;
        if (yi) yi.value = off.y;
        if (zi) zi.value = off.z;
    }

    /** Populate the component dropdown with current fixture children. */
    function populateComponentSelect() {
        var sel = document.getElementById('vl-fix-component-select');
        if (!sel) return;
        sel.innerHTML = '<option value="">(none — use target above)</option>';
        var fix = getActiveFixtureMesh();
        if (!fix) return;
        fix.mesh.children.forEach(function (child) {
            if (!child.name) return;
            var label = child.name.replace(/__/g, '').replace('waste_chute_', '').replace('entry_exit_drawer_', '');
            var opt = document.createElement('option');
            opt.value = child.name;
            opt.textContent = label;
            sel.appendChild(opt);
        });
    }

    /** Wire up the fixture debug panel controls. */
    function wireFixtureDebugPanel() {
        // Target buttons
        ['body', 'accessories', 'group'].forEach(function (t) {
            var btn = document.getElementById('vl-fix-target-' + (t === 'accessories' ? 'acc' : t));
            if (!btn) return;
            btn.addEventListener('click', function () {
                vlState.fixtureDebugTarget = t;
                vlState.fixtureDebugComponent = '';
                var compSel = document.getElementById('vl-fix-component-select');
                if (compSel) compSel.value = '';
                document.querySelectorAll('.vl-fix-target-btn').forEach(function (b) {
                    b.classList.toggle('is-active', b.dataset.target === t);
                });
                syncFixtureDebugInputs();
            });
        });

        // Component dropdown
        var compSel = document.getElementById('vl-fix-component-select');
        if (compSel) {
            compSel.addEventListener('change', function () {
                var val = compSel.value;
                if (val) {
                    vlState.fixtureDebugTarget = 'component';
                    vlState.fixtureDebugComponent = val;
                    document.querySelectorAll('.vl-fix-target-btn').forEach(function (b) {
                        b.classList.remove('is-active');
                    });
                } else {
                    vlState.fixtureDebugTarget = 'body';
                    vlState.fixtureDebugComponent = '';
                    var bodyBtn = document.getElementById('vl-fix-target-body');
                    if (bodyBtn) bodyBtn.classList.add('is-active');
                }
                syncFixtureDebugInputs();
                refreshFixtureDebugReadout();
            });
        }

        // Step buttons
        document.querySelectorAll('.fix-step').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var axis = btn.dataset.axis;
                var delta = parseFloat(btn.dataset.delta);
                var target = vlState.fixtureDebugTarget;
                if (target === 'component' && vlState.fixtureDebugComponent) {
                    var cname = vlState.fixtureDebugComponent;
                    if (!vlState.fixtureDebugComponentOffsets[cname]) {
                        vlState.fixtureDebugComponentOffsets[cname] = { x: 0, y: 0, z: 0 };
                    }
                    vlState.fixtureDebugComponentOffsets[cname][axis] += delta;
                } else {
                    vlState.fixtureDebugOffsets[target][axis] += delta;
                }
                syncFixtureDebugInputs();
                applyFixtureDebugOffsets();
                refreshFixtureDebugReadout();
            });
        });

        // Direct input
        ['x', 'y', 'z'].forEach(function (axis) {
            var input = document.getElementById('vl-fix-' + axis);
            if (!input) return;
            input.addEventListener('input', function () {
                var target = vlState.fixtureDebugTarget;
                if (target === 'component' && vlState.fixtureDebugComponent) {
                    var cname = vlState.fixtureDebugComponent;
                    if (!vlState.fixtureDebugComponentOffsets[cname]) {
                        vlState.fixtureDebugComponentOffsets[cname] = { x: 0, y: 0, z: 0 };
                    }
                    vlState.fixtureDebugComponentOffsets[cname][axis] = parseFloat(input.value) || 0;
                } else {
                    vlState.fixtureDebugOffsets[target][axis] = parseFloat(input.value) || 0;
                }
                applyFixtureDebugOffsets();
                refreshFixtureDebugReadout();
            });
        });

        // Reset
        var resetBtn = document.getElementById('vl-fix-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                vlState.fixtureDebugOffsets = {
                    body: { x: 0, y: 0, z: 0 },
                    accessories: { x: 0, y: 0, z: 0 },
                    group: { x: 0, y: 0, z: 0 }
                };
                vlState.fixtureDebugComponentOffsets = {};
                syncFixtureDebugInputs();
                applyFixtureDebugOffsets();
                refreshFixtureDebugReadout();
            });
        }

        // Copy offsets
        var copyBtn = document.getElementById('vl-fix-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var off = vlState.fixtureDebugOffsets;
                var compOff = vlState.fixtureDebugComponentOffsets;
                var fmt = function (o) { return '{ x: ' + o.x.toFixed(1) + ', y: ' + o.y.toFixed(1) + ', z: ' + o.z.toFixed(1) + ' }'; };
                var text = 'Waste Unit Debug Offsets:\n'
                    + '  body:        ' + fmt(off.body) + '\n'
                    + '  accessories: ' + fmt(off.accessories) + '\n'
                    + '  group:       ' + fmt(off.group);
                var compKeys = Object.keys(compOff);
                if (compKeys.length > 0) {
                    text += '\n  Per-component:';
                    compKeys.forEach(function (k) {
                        text += '\n    ' + k + ': ' + fmt(compOff[k]);
                    });
                }
                navigator.clipboard.writeText(text).then(function () {
                    showVLStatus('Waste unit offsets copied to clipboard', '');
                });
            });
        }

        // Set (Apply) button – bake current debug offsets into localStorage
        var applyBtn = document.getElementById('vl-fix-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                var fix = getActiveFixtureMesh();
                if (!fix) {
                    showVLStatus('No fixture installed yet.', 'error');
                    return;
                }
                var off = vlState.fixtureDebugOffsets;
                var compOff = vlState.fixtureDebugComponentOffsets;
                // Save cumulative offsets to localStorage
                try {
                    var prev = JSON.parse(localStorage.getItem('vl-fixture-debug-offsets')) || {
                        body: { x: 0, y: 0, z: 0 },
                        accessories: { x: 0, y: 0, z: 0 },
                        group: { x: 0, y: 0, z: 0 }
                    };
                    var cumulative = {
                        body: { x: (prev.body.x || 0) + off.body.x, y: (prev.body.y || 0) + off.body.y, z: (prev.body.z || 0) + off.body.z },
                        accessories: { x: (prev.accessories.x || 0) + off.accessories.x, y: (prev.accessories.y || 0) + off.accessories.y, z: (prev.accessories.z || 0) + off.accessories.z },
                        group: { x: (prev.group.x || 0) + off.group.x, y: (prev.group.y || 0) + off.group.y, z: (prev.group.z || 0) + off.group.z }
                    };
                    // Also accumulate per-component offsets
                    var prevComp = JSON.parse(localStorage.getItem('vl-fixture-debug-comp-offsets')) || {};
                    Object.keys(compOff).forEach(function (k) {
                        var pc = prevComp[k] || { x: 0, y: 0, z: 0 };
                        prevComp[k] = {
                            x: (pc.x || 0) + (compOff[k].x || 0),
                            y: (pc.y || 0) + (compOff[k].y || 0),
                            z: (pc.z || 0) + (compOff[k].z || 0)
                        };
                    });
                    localStorage.setItem('vl-fixture-debug-offsets', JSON.stringify(cumulative));
                    localStorage.setItem('vl-fixture-debug-comp-offsets', JSON.stringify(prevComp));
                } catch (_) { /* ignore */ }
                // Bake current positions as new base
                snapshotFixtureBasePositions(fix.mesh);
                // Reset debug offsets to 0
                vlState.fixtureDebugOffsets = {
                    body: { x: 0, y: 0, z: 0 },
                    accessories: { x: 0, y: 0, z: 0 },
                    group: { x: 0, y: 0, z: 0 }
                };
                vlState.fixtureDebugComponentOffsets = {};
                syncFixtureDebugInputs();
                refreshFixtureDebugReadout();
                showVLStatus('Waste unit offsets applied and saved', 'ok');
            });
        }
    }

    /** Restore saved fixture debug offsets from localStorage. */
    function restoreFixtureDebugOffsets() {
        var fix = getActiveFixtureMesh();
        if (!fix) return;
        try {
            var saved = JSON.parse(localStorage.getItem('vl-fixture-debug-offsets'));
            var savedComp = JSON.parse(localStorage.getItem('vl-fixture-debug-comp-offsets'));
            if (saved) {
                vlState.fixtureDebugOffsets = {
                    body: saved.body || { x: 0, y: 0, z: 0 },
                    accessories: saved.accessories || { x: 0, y: 0, z: 0 },
                    group: saved.group || { x: 0, y: 0, z: 0 }
                };
            }
            if (savedComp) {
                vlState.fixtureDebugComponentOffsets = savedComp;
            }
            if (saved || savedComp) {
                applyFixtureDebugOffsets();
                snapshotFixtureBasePositions(fix.mesh);
                // Reset in-memory offsets back to 0 since they are now baked in
                vlState.fixtureDebugOffsets = {
                    body: { x: 0, y: 0, z: 0 },
                    accessories: { x: 0, y: 0, z: 0 },
                    group: { x: 0, y: 0, z: 0 }
                };
                vlState.fixtureDebugComponentOffsets = {};
            }
        } catch (_) { /* ignore */ }
    }

    // ================================================================
    //  EE Drawer Debug / Alignment Panel
    // ================================================================
    function wireEEDebugPanel() {
        const panel = document.getElementById('vl-ee-debug-panel');
        if (!panel) return;

        // Wire XYZ inputs
        ['x', 'y', 'z'].forEach(axis => {
            const input = document.getElementById(`vl-ee-${axis}`);
            if (!input) return;
            input.addEventListener('input', () => applyEEDebugOffset());
            input.addEventListener('change', () => applyEEDebugOffset());
        });

        // Step buttons
        document.querySelectorAll('#vl-ee-debug-panel .ee-step').forEach(btn => {
            btn.addEventListener('click', () => {
                const axis  = btn.dataset.axis;
                const delta = parseFloat(btn.dataset.delta);
                const inp   = document.getElementById(`vl-ee-${axis}`);
                if (inp) {
                    inp.value = (parseFloat(inp.value) || 0) + delta;
                    applyEEDebugOffset();
                }
            });
        });

        // Copy button
        const copyBtn = document.getElementById('vl-ee-copy');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const x = document.getElementById('vl-ee-x')?.value || 0;
                const y = document.getElementById('vl-ee-y')?.value || 0;
                const z = document.getElementById('vl-ee-z')?.value || 0;
                const txt = `EE Drawer offset: X: ${x}, Y: ${y}, Z: ${z}`;
                navigator.clipboard?.writeText(txt).then(() => showVLStatus('EE offsets copied to clipboard', 'ok'))
                    .catch(() => showVLStatus(txt, 'ok'));
            });
        }

        // Set (Apply) button – bake current debug offsets into localStorage
        const applyBtn = document.getElementById('vl-ee-apply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const mesh = vlState.drawerMesh;
                if (!mesh || !vlState._eeBasePos) {
                    showVLStatus('No EE drawer installed yet.', 'error');
                    return;
                }
                const dx = parseFloat(document.getElementById('vl-ee-x')?.value) || 0;
                const dy = parseFloat(document.getElementById('vl-ee-y')?.value) || 0;
                const dz = parseFloat(document.getElementById('vl-ee-z')?.value) || 0;
                // Save cumulative offsets to localStorage
                try {
                    const prev = JSON.parse(localStorage.getItem('vl-ee-debug-offsets')) || { x: 0, y: 0, z: 0 };
                    const cumulative = {
                        x: (prev.x || 0) + dx,
                        y: (prev.y || 0) + dy,
                        z: (prev.z || 0) + dz
                    };
                    localStorage.setItem('vl-ee-debug-offsets', JSON.stringify(cumulative));
                } catch (_) { /* ignore */ }
                // Bake current position as new base
                vlState._eeBasePos = mesh.position.clone();
                // Reset debug inputs to 0
                ['x', 'y', 'z'].forEach(a => {
                    const inp = document.getElementById(`vl-ee-${a}`);
                    if (inp) inp.value = 0;
                });
                refreshEEDebugReadout();
                showVLStatus('EE offsets applied and saved', 'ok');
            });
        }

        // Reset button
        const resetBtn = document.getElementById('vl-ee-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                ['x', 'y', 'z'].forEach(a => {
                    const inp = document.getElementById(`vl-ee-${a}`);
                    if (inp) inp.value = 0;
                });
                applyEEDebugOffset();
            });
        }
    }

    function applyEEDebugOffset() {
        const mesh = vlState.drawerMesh;
        if (!mesh) { showVLStatus('No EE drawer installed.', 'error'); return; }

        const dx = parseFloat(document.getElementById('vl-ee-x')?.value) || 0;
        const dy = parseFloat(document.getElementById('vl-ee-y')?.value) || 0;
        const dz = parseFloat(document.getElementById('vl-ee-z')?.value) || 0;

        if (!vlState._eeBasePos) {
            vlState._eeBasePos = mesh.position.clone();
        }
        mesh.position.set(
            vlState._eeBasePos.x + dx,
            vlState._eeBasePos.y + dy,
            vlState._eeBasePos.z + dz
        );
        refreshEEDebugReadout();
    }

    function refreshEEDebugReadout() {
        const el = document.getElementById('vl-ee-readout');
        if (!el) return;
        const mesh = vlState.drawerMesh;
        if (!mesh) { el.textContent = 'No drawer installed'; return; }
        const p = mesh.position;
        el.textContent = `pos  X: ${p.x.toFixed(2)}  Y: ${p.y.toFixed(2)}  Z: ${p.z.toFixed(2)}`;
    }

    // Hardcoded EE Drawer position offset (mm)
    const EE_DRAWER_OFFSET = { x: 7, y: -15, z: -39 };

    function snapshotEEBasePos() {
        if (vlState.drawerMesh) {
            vlState._eeBasePos = vlState.drawerMesh.position.clone();
            // Apply permanent offset
            vlState.drawerMesh.position.set(
                vlState._eeBasePos.x + EE_DRAWER_OFFSET.x,
                vlState._eeBasePos.y + EE_DRAWER_OFFSET.y,
                vlState._eeBasePos.z + EE_DRAWER_OFFSET.z
            );
            vlState._eeBasePos = vlState.drawerMesh.position.clone();
        }
    }

    function restoreEEDebugOffsets() {
        if (!vlState.drawerMesh) return;
        try {
            const saved = JSON.parse(localStorage.getItem('vl-ee-debug-offsets'));
            if (saved && (saved.x || saved.y || saved.z)) {
                vlState.drawerMesh.position.set(
                    vlState._eeBasePos.x + (saved.x || 0),
                    vlState._eeBasePos.y + (saved.y || 0),
                    vlState._eeBasePos.z + (saved.z || 0)
                );
                vlState._eeBasePos = vlState.drawerMesh.position.clone();
            }
        } catch (_) { /* ignore */ }
    }

    function wireVLSettingsPanel() {
        // ── Cutout toggles ───────────────────────────────────────────
        for (let i = 0; i < 4; i++) {
            (function (idx) {
                const cb = document.getElementById('settings-cover-' + idx);
                if (!cb) return;
                cb.checked = !!vlState.deckCutouts[idx];
                cb.addEventListener('change', function () {
                    // Prevent re-enabling cover if waste or drawer is installed at this cutout
                    if (cb.checked && vlState.wasteCutoutIdx === idx) {
                        cb.checked = false;
                        showVLStatus('Cannot restore cover \u2014 waste chute is installed here.', 'error');
                        return;
                    }
                    if (cb.checked && vlState.drawerCutoutIdx === idx) {
                        cb.checked = false;
                        showVLStatus('Cannot restore cover \u2014 Entry/Exit Drawer is installed here.', 'error');
                        return;
                    }
                    vlState.deckCutouts[idx] = cb.checked;
                    applyCutoutVisibility();
                });
            })(i);
        }

        // ── Waste chute position dropdown ────────────────────────────
        var wasteSelect = document.getElementById('settings-waste-position');
        if (wasteSelect) {
            wasteSelect.value = String(vlState.wasteCutoutIdx);
            wasteSelect.addEventListener('change', function () {
                var val = parseInt(wasteSelect.value, 10);
                if (val < 0) {
                    removeWaste();
                } else {
                    installWasteAtCutout(val);
                }
                // Sync the waste dropdown value (installWaste may change state)
                wasteSelect.value = String(vlState.wasteCutoutIdx);
            });
        }

        // ── Entry/Exit Drawer position dropdown ──────────────────────
        var drawerSelect = document.getElementById('settings-drawer-position');
        if (drawerSelect) {
            drawerSelect.value = String(vlState.drawerCutoutIdx);
            drawerSelect.addEventListener('change', function () {
                var val = parseInt(drawerSelect.value, 10);
                if (val < 0) {
                    removeDrawer();
                } else {
                    installDrawerAtCutout(val);
                }
                drawerSelect.value = String(vlState.drawerCutoutIdx);
            });
        }

        // ── Back Shield toggles ──────────────────────────────────────
        for (var si = 0; si < 4; si++) {
            (function (idx) {
                var cb = document.getElementById('settings-back-shield-' + idx);
                if (cb) {
                    cb.checked = vlState.backShieldVisible[idx];
                    cb.addEventListener('change', function () {
                        setBackShieldVisible(idx, cb.checked);
                    });
                }
            })(si);
        }

        // ── Grid toggle ──────────────────────────────────────────────
        const gridToggle = document.getElementById('settings-grid-toggle');
        if (gridToggle) {
            gridToggle.checked = vlState.gridVisible;
            gridToggle.addEventListener('change', function () {
                vlState.gridVisible = gridToggle.checked;
                const grid = vlState.scene.getObjectByName('__vlgrid__');
                if (grid) grid.visible = vlState.gridVisible;
            });
        }

        // ── Drag-to-Place toggle ─────────────────────────────────────
        const dragPlaceToggle = document.getElementById('settings-drag-place-toggle');
        if (dragPlaceToggle) {
            dragPlaceToggle.checked = vlState.dragToPlaceEnabled;
            dragPlaceToggle.addEventListener('change', function () {
                setDragToPlace(dragPlaceToggle.checked);
            });
        }

        // ── Deck Alignment Debug toggle ──────────────────────────────
        const deckDebugToggle = document.getElementById('settings-deck-debug-toggle');
        if (deckDebugToggle) {
            deckDebugToggle.checked = vlState.debugDeckMode;
            deckDebugToggle.addEventListener('change', function () {
                vlState.debugDeckMode = deckDebugToggle.checked;
                const panel = document.getElementById('vl-deck-debug-panel');
                if (panel) panel.classList.toggle('is-open', vlState.debugDeckMode);
                if (vlState.debugDeckMode) refreshDeckDebugReadout();
            });
        }

        // ── Waste Unit Debug toggle ──────────────────────────────────
        const fixtureDebugToggle = document.getElementById('settings-fixture-debug-toggle');
        if (fixtureDebugToggle) {
            fixtureDebugToggle.checked = vlState.fixtureDebugMode;
            fixtureDebugToggle.addEventListener('change', function () {
                vlState.fixtureDebugMode = fixtureDebugToggle.checked;
                const panel = document.getElementById('vl-fixture-debug-panel');
                if (panel) panel.classList.toggle('is-open', vlState.fixtureDebugMode);
                if (vlState.fixtureDebugMode) {
                    // Snapshot positions so debug offsets work from current state
                    var fix = getActiveFixtureMesh();
                    if (fix) snapshotFixtureBasePositions(fix.mesh);
                    populateComponentSelect();
                    syncFixtureDebugInputs();
                    refreshFixtureDebugReadout();
                }
            });
        }

        // ── EE Drawer Debug toggle ───────────────────────────────────
        const eeDebugToggle = document.getElementById('settings-ee-debug-toggle');
        if (eeDebugToggle) {
            eeDebugToggle.checked = vlState.eeDebugMode;
            eeDebugToggle.addEventListener('change', function () {
                vlState.eeDebugMode = eeDebugToggle.checked;
                const panel = document.getElementById('vl-ee-debug-panel');
                if (panel) panel.classList.toggle('is-open', vlState.eeDebugMode);
                if (vlState.eeDebugMode) {
                    snapshotEEBasePos();
                    refreshEEDebugReadout();
                }
            });
        }

        // ── Generic Carrier toggle ───────────────────────────────────
        const genericCarrierToggle = document.getElementById('settings-generic-carrier-toggle');
        if (genericCarrierToggle) {
            genericCarrierToggle.checked = vlState.useGenericCarriers;
            genericCarrierToggle.addEventListener('change', function () {
                vlState.useGenericCarriers = genericCarrierToggle.checked;
                rebuildAllPlacedCarriers();
            });
        }

        // ── Relocate toggle ──────────────────────────────────────────
        const relocateToggle = document.getElementById('settings-relocate-toggle');
        const relocatePanel  = document.getElementById('settings-relocate-panel');
        if (relocateToggle && relocatePanel) {
            relocateToggle.addEventListener('change', function () {
                relocatePanel.classList.toggle('is-open', relocateToggle.checked);
            });
        }

        // ── X / Y / Z inputs ────────────────────────────────────────
        ['x', 'y', 'z'].forEach(function (axis) {
            const input = document.getElementById('settings-deck-' + axis);
            if (!input) return;
            input.value = vlState.deckRelocateOffset[axis];
            input.addEventListener('input', function () {
                vlState.deckRelocateOffset[axis] = parseFloat(input.value) || 0;
                applySettingsDeckOffset();
            });
        });

        // ── Step buttons ─────────────────────────────────────────────
        if (relocatePanel) {
            relocatePanel.querySelectorAll('.settings-step-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const axis  = btn.dataset.axis;
                    const delta = parseFloat(btn.dataset.delta);
                    const input = document.getElementById('settings-deck-' + axis);
                    if (input) {
                        const newVal = (parseFloat(input.value) || 0) + delta;
                        input.value = newVal;
                        vlState.deckRelocateOffset[axis] = newVal;
                        applySettingsDeckOffset();
                    }
                });
            });
        }

        // ── Reset position ───────────────────────────────────────────
        const resetBtn = document.getElementById('settings-deck-reset-pos');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                vlState.deckRelocateOffset = { x: 0, y: 0, z: 0 };
                ['x', 'y', 'z'].forEach(function (axis) {
                    const input = document.getElementById('settings-deck-' + axis);
                    if (input) input.value = 0;
                });
                if (vlState.gltfModel && vlState._gltfBasePos) {
                    vlState.gltfModel.position.copy(vlState._gltfBasePos);
                }
            });
        }
    }

    function applySettingsDeckOffset() {
        const model = vlState.gltfModel;
        if (!model) return;
        if (!vlState._gltfBasePos) vlState._gltfBasePos = model.position.clone();
        const o = vlState.deckRelocateOffset;
        model.position.set(
            vlState._gltfBasePos.x + o.x,
            vlState._gltfBasePos.y + o.y,
            vlState._gltfBasePos.z + o.z
        );
    }

    // ================================================================
    //  Panel Collapse Toggles
    // ================================================================
    function wireVLPanelToggles() {
        const host        = $('#vl-host');
        const leftPanel   = $('#vl-left-panel');
        const rightPanel  = $('#vl-right-panel');
        const leftToggle  = $('#vl-left-toggle');
        const rightToggle = $('#vl-right-toggle');

        if (leftToggle && leftPanel && host) {
            leftToggle.addEventListener('click', () => {
                const collapsed = leftPanel.classList.toggle('is-collapsed');
                host.classList.toggle('vl-left-collapsed', collapsed);
                const icon = $('#vl-left-toggle-icon');
                if (icon) icon.className = collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
            });
        }

        if (rightToggle && rightPanel && host) {
            rightToggle.addEventListener('click', () => {
                setSitesPanelOpen(!vlState.sitesPanelOpen);
            });
        }
        // Also wire the in-header close button
        const rightClose = document.getElementById('vl-right-panel-close');
        if (rightClose) {
            rightClose.addEventListener('click', () => setSitesPanelOpen(false));
        }
        // Default: both panels collapsed on launch
        setSitesPanelOpen(false);
        if (leftPanel && host) {
            leftPanel.classList.add('is-collapsed');
            host.classList.add('vl-left-collapsed');
            const icon = $('#vl-left-toggle-icon');
            if (icon) icon.className = 'fas fa-chevron-right';
        }
    }

    function wireVLToolbar() {
        // Toggle collapse
        const toggle = $('#vl-vt-toggle');
        const body   = $('#vl-vt-body');
        if (toggle && body) {
            toggle.addEventListener('click', () => {
                vlState.toolbarCollapsed = !vlState.toolbarCollapsed;
                body.classList.toggle('collapsed', vlState.toolbarCollapsed);
                const icon = toggle.querySelector('i');
                if (icon) icon.className = vlState.toolbarCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            });
        }

        // Labels toggle
        wireBtn('#vl-vt-labels', toggleOrientationLabels);

        // Reset camera
        wireBtn('#vl-vt-reset-cam', resetVLCamera);

        // Zoom to fit
        wireBtn('#vl-vt-zoom-fit', zoomToFitDeck);

        // Perspective toggle
        wireBtn('#vl-vt-perspective', toggleVLPerspective);

        // Top-down view
        wireBtn('#vl-vt-topdown', setTopDownView);

        // Zoom in/out
        wireBtn('#vl-vt-zoom-in',  () => doVLZoom(0.8));
        wireBtn('#vl-vt-zoom-out', () => doVLZoom(1.25));

        // Pan mode
        wireBtn('#vl-vt-pan', toggleVLPan);

        // Drag-to-move toolbar
        wireDragHandle('#vl-vt-grab-handle', '#vl-toolbar');

        // Wire JS tooltips (bypasses vt-collapsible overflow:hidden clip)
        wireVLTooltips();
    }

    // ================================================================
    //  Toolbar tooltip portal (avoids overflow:hidden clipping)
    // ================================================================
    function wireVLTooltips() {
        const toolbarEl = $('#vl-toolbar');
        const host      = vlState.host;
        if (!toolbarEl || !host) return;

        // Create a floating tooltip div inside the host
        let tipEl = document.getElementById('vl-tip-portal');
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.id = 'vl-tip-portal';
            tipEl.className = 'vl-tip-portal';
            host.appendChild(tipEl);
        }

        let hideTimer = null;

        toolbarEl.querySelectorAll('.vt-btn[title], .vt-toggle[title]').forEach(btn => {
            const label = btn.title;
            // Remove title so native browser tooltip doesn't double-show
            btn.removeAttribute('title');
            btn.dataset.vtLabel = label;

            btn.addEventListener('mouseenter', () => {
                clearTimeout(hideTimer);
                const hostRect = host.getBoundingClientRect();
                const btnRect  = btn.getBoundingClientRect();
                tipEl.textContent = label;
                tipEl.style.top   = (btnRect.top  - hostRect.top  + btnRect.height / 2) + 'px';
                tipEl.style.right = (hostRect.right - btnRect.left + 10) + 'px';
                tipEl.classList.add('visible');
            });
            btn.addEventListener('mouseleave', () => {
                hideTimer = setTimeout(() => tipEl.classList.remove('visible'), 80);
            });
        });
    }

    function wireBtn(selector, fn) {
        const el = $(selector);
        if (el) el.addEventListener('click', fn);
    }

    // ================================================================
    //  Camera Helpers
    // ================================================================
    function resetVLCamera() {
        if (!vlState.camera || !vlState.controls) return;
        const cx = DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT * DECK.TRACK_SPACING) / 2;
        const cy = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;
        vlState.controls.target.set(cx, DECK.SURFACE_Z, cy);
        const maxDim = DECK.TRACK_COUNT * DECK.TRACK_SPACING;
        const fov = vlState.camera.fov || 45;
        const dist = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.15;
        vlState.camera.position.set(cx, DECK.SURFACE_Z + dist, cy + dist * 0.15);
        vlState.camera.up.set(0, 1, 0);
        vlState.camera.near = 1;
        vlState.camera.far  = 100000;
        vlState.camera.updateProjectionMatrix();
        vlState.controls.update();
    }

    function setTopDownView() {
        if (!vlState.camera || !vlState.controls) return;
        const cx = DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT * DECK.TRACK_SPACING) / 2;
        const cy = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;
        vlState.controls.target.set(cx, DECK.SURFACE_Z, cy);
        const maxDimTD = DECK.TRACK_COUNT * DECK.TRACK_SPACING;
        const fovTD = vlState.camera.fov || 45;
        const distTD = (maxDimTD / 2) / Math.tan(THREE.MathUtils.degToRad(fovTD / 2)) * 1.15;
        vlState.camera.position.set(cx, DECK.SURFACE_Z + distTD, cy + 0.01); // near-zero Z offset avoids gimbal lock
        vlState.camera.up.set(0, 0, -1);
        vlState.camera.updateProjectionMatrix();
        vlState.controls.update();
    }

    function zoomToFitDeck() {
        if (!vlState.camera || !vlState.controls) return;

        // Compute bounding box of all visible scene objects (deck model + carriers)
        const box = new THREE.Box3();
        vlState.scene.traverse(function (obj) {
            if (!obj.visible) return;
            if (obj.name === '__deckplane__' || obj.name === '__vlgrid__') return;
            if (obj.isMesh) box.expandByObject(obj);
        });

        // Fallback to deck track extents if scene is empty
        if (box.isEmpty()) {
            const x0 = DECK.FIRST_TRACK_X;
            const x1 = DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT - 1) * DECK.TRACK_SPACING + DECK.TRACK_WIDTH;
            const z0 = DECK.TRACK_Y_START;
            const z1 = DECK.TRACK_Y_START + DECK.TRACK_DEPTH;
            box.set(
                new THREE.Vector3(x0, DECK.SURFACE_Z - 10, z0),
                new THREE.Vector3(x1, DECK.SURFACE_Z + 200, z1)
            );
        }

        const center = box.getCenter(new THREE.Vector3());
        const size   = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.z);

        // Camera distance for perspective FOV to fully contain the deck
        const fov = vlState.camera.fov || 45;
        const dist = (maxDim / 2) / Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 1.15;

        vlState.controls.target.set(center.x, DECK.SURFACE_Z, center.z);
        vlState.camera.position.set(center.x, DECK.SURFACE_Z + dist, center.z + dist * 0.15);
        vlState.camera.up.set(0, 1, 0);
        vlState.camera.near = 1;
        vlState.camera.far  = 100000;
        vlState.camera.updateProjectionMatrix();
        vlState.controls.update();
    }

    function doVLZoom(factor) {
        if (!vlState.camera || !vlState.controls) return;
        const dir = vlState.camera.position.clone().sub(vlState.controls.target);
        dir.multiplyScalar(factor);
        vlState.camera.position.copy(vlState.controls.target.clone().add(dir));
        vlState.controls.update();
    }

    function toggleVLPerspective() {
        const host = vlState.host;
        if (!host || !vlState.camera) return;
        const w = host.clientWidth || 1000;
        const h = host.clientHeight || 700;

        vlState.isPerspective = !vlState.isPerspective;
        const pos    = vlState.camera.position.clone();
        const target = vlState.controls.target.clone();

        if (vlState.isPerspective) {
            vlState.camera = new THREE.PerspectiveCamera(45, w / h, 1, 100000);
        } else {
            const dist = pos.distanceTo(target);
            const fs = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
            vlState.camera = new THREE.OrthographicCamera(
                -fs * (w/h), fs * (w/h), fs, -fs, 1, 100000
            );
        }
        vlState.camera.position.copy(pos);
        vlState.camera.up.set(0, 1, 0);
        vlState.camera.lookAt(target);

        vlState.controls.dispose();
        vlState.controls = new THREE.OrbitControls(vlState.camera, vlState.renderer.domElement);
        vlState.controls.enableDamping = true;
        vlState.controls.dampingFactor = 0.12;
        vlState.controls.target.copy(target);
        vlState.controls.update();

        const btn = $('#vl-vt-perspective');
        if (btn) btn.classList.toggle('is-active', !vlState.isPerspective);
    }

    function toggleVLGrid() {
        vlState.gridVisible = !vlState.gridVisible;
        const grid = vlState.scene.getObjectByName('__vlgrid__');
        if (grid) grid.visible = vlState.gridVisible;
        const btn = $('#vl-btn-grid');
        if (btn) btn.classList.toggle('grid-off', !vlState.gridVisible);
    }

    function toggleVLPan() {
        vlState.isPanning = !vlState.isPanning;
        if (vlState.controls) {
            vlState.controls.mouseButtons.LEFT = vlState.isPanning
                ? THREE.MOUSE.PAN
                : THREE.MOUSE.ROTATE;
        }
        const btn = $('#vl-vt-pan');
        if (btn) btn.classList.toggle('is-active', vlState.isPanning);
    }

    // ================================================================
    //  Theme Update
    // ================================================================
    function updateVLTheme() {
        if (!vlState.scene) return;
        vlState.isDark = document.documentElement.hasAttribute('data-theme');
        vlState.scene.background = new THREE.Color(vlState.isDark ? DARK_BG : LIGHT_BG);

        const grid = vlState.scene.getObjectByName('__vlgrid__');
        if (grid) {
            const c = new THREE.Color(vlState.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
        }
    }

    // ================================================================
    //  Gizmo (orientation indicator)
    // ================================================================
    function drawVLGizmo() {
        const canvas = $('#vl-gizmo-canvas');
        if (!canvas || !vlState.camera) return;
        const size = canvas.width;
        const ctx  = canvas.getContext('2d');
        ctx.clearRect(0, 0, size, size);

        const axes = [
            { dir: new THREE.Vector3(1,0,0), color: '#e05555', label: 'X' },
            { dir: new THREE.Vector3(0,1,0), color: '#55bb55', label: 'Y' },
            { dir: new THREE.Vector3(0,0,1), color: '#5588e0', label: 'Z' },
        ];

        const quat = vlState.camera.quaternion.clone().invert();
        const cx = size / 2, cy = size / 2, r = size * 0.38;

        axes.forEach(({ dir, color, label }) => {
            const v = dir.clone().applyQuaternion(vlState.camera.quaternion);
            const ex = cx + v.x * r;
            const ey = cy - v.y * r;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, ex + (ex - cx) * 0.18, ey + (ey - cy) * 0.18);
        });

        ctx.beginPath();
        ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#999';
        ctx.fill();
    }

    // ================================================================
    //  Status bar
    // ================================================================
    function showVLStatus(msg, type) {
        const el = $('#vl-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'vl-status-msg' + (type === 'error' ? ' is-error' : type === 'ok' ? ' is-ok' : '');
        clearTimeout(vlState._statusTimer);
        vlState._statusTimer = setTimeout(() => {
            el.textContent = 'Ready';
            el.className = 'vl-status-msg';
        }, 4000);
    }

    // ================================================================
    //  Toolbar drag-to-reposition
    // ================================================================
    function wireDragHandle(handleSel, toolbarSel) {
        const handle = $(handleSel);
        const toolbar = $(toolbarSel);
        if (!handle || !toolbar) return;
        let dragging = false, ox = 0, oy = 0, tx = 0, ty = 0;

        handle.addEventListener('mousedown', e => {
            dragging = true;
            const rect = toolbar.getBoundingClientRect();
            tx = rect.left; ty = rect.top;
            ox = e.clientX - tx; oy = e.clientY - ty;
            toolbar.style.position = 'fixed';
            toolbar.style.right = 'unset';
            toolbar.style.top = ty + 'px';
            toolbar.style.left = tx + 'px';
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            toolbar.style.left = (e.clientX - ox) + 'px';
            toolbar.style.top  = (e.clientY - oy) + 'px';
        });
        document.addEventListener('mouseup', () => { dragging = false; });
    }

}());
