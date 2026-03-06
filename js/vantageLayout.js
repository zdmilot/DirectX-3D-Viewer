/* ============================================================
   Vantage Deck Layout — Place carriers on the Hamilton Vantage
   deck using .tml metadata, track-snapping, and SBS plate
   auto-placement.
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  Hamilton Deck Constants  (from DeckLayoutManager docs)
    // ================================================================
    const DECK = {
        TRACK_SPACING:  22.5,   // mm center-to-center
        TRACK_WIDTH:    22.0,   // mm physical slot width
        TRACK_DEPTH:   497.0,   // mm front-to-back
        TRACK_Y_START:  63.0,   // mm Y of first track
        FIRST_TRACK_X: 100.25,  // mm X of track 1
        TRACK_COUNT:    54,
        SURFACE_Z:     100.0,   // mm deck surface height
        CANVAS_W:      1600,
        CANVAS_D:       520,
        LABELED_TRACKS: new Set([1,7,13,19,25,31,37,43,49]),
    };

    // Carrier library — populated from parsed .tml files + built-ins
    const CARRIER_LIBRARY = {
        PLT_CAR_L5AC: {
            viewName: 'PLT_CAR_L5AC',
            description: 'Plate Carrier L5 Landscape (AC)',
            tWidth: 6, dx: 135, dy: 497, dz: 130,
            color: 0x607080,
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
            description: 'Plate Carrier P3 Portrait (5T)',
            tWidth: 5, dx: 112.5, dy: 497, dz: 130,
            color: 0x607080,
            sites: [
                { id:1, x:7.25, y:349, z:86.15, dx:86, dy:127 },
                { id:2, x:7.25, y:203, z:86.15, dx:86, dy:127 },
                { id:3, x:7.25, y:57,  z:86.15, dx:86, dy:127 },
            ],
        },
        TIP_CAR_288: {
            viewName: 'TIP_CAR_288',
            description: 'Tip Carrier 288 Portrait (4T)',
            tWidth: 4, dx: 90, dy: 497, dz: 130,
            color: 0x405060,
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
            sites: [], // tube positions, not SBS plates
        },
    };

    // SBS plate dimensions (ANSI/SBS standard)
    const SBS_PLATE = { dx: 127.76, dy: 85.48, dz: 14.35 };

    // ================================================================
    //  Module State
    // ================================================================
    const vlState = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        isDark: false,
        gridVisible: true,
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

        // TML import state
        importedCarrier: null,

        // Currently selected carrier
        selectedCarrierId: null,

        // Raycaster helpers
        _raycaster: null,
        _mouse: new THREE.Vector2(),
        _deckPlane: null,

        // Canvas / host refs
        canvas: null,
        host: null,
    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    let initialized = false;

    // ================================================================
    //  Public API
    // ================================================================
    window.VantageLayoutModule = {
        init: initVantageLayout,
        updateTheme: updateVLTheme,
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
        vlState.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100000);
        // Position camera top-down, slightly tilted so it reads naturally
        vlState.camera.position.set(700, 1200, 600);
        vlState.camera.up.set(0, 1, 0);

        // -- Renderer --
        vlState.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        vlState.renderer.setPixelRatio(window.devicePixelRatio);
        vlState.renderer.setSize(w, h);
        vlState.renderer.sortObjects = true;

        // -- Controls --
        vlState.controls = new THREE.OrbitControls(vlState.camera, vlState.renderer.domElement);
        vlState.controls.enableDamping = true;
        vlState.controls.dampingFactor = 0.12;
        vlState.controls.target.set(700, 0, 280);
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
        vlState._deckPlane.position.set(700, DECK.SURFACE_Z + 1, 280);
        vlState._deckPlane.name = '__deckplane__';
        vlState.scene.add(vlState._deckPlane);

        // -- Raycaster --
        vlState._raycaster = new THREE.Raycaster();

        // -- Build deck geometry --
        buildDeckGeometry();

        // -- Load GLTF deck model (supplements procedural geometry) --
        loadDeckModel();

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
        wireCarrierPalette();
        wireCanvasEvents();
        wireVLPanelToggles();
        populateCarrierPalette();
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

        // Track slots (54 tracks)
        const trackColor = isDark ? 0x151f2a : 0xb0bfcf;
        for (let i = 1; i <= DECK.TRACK_COUNT; i++) {
            const x = DECK.FIRST_TRACK_X + (i - 1) * DECK.TRACK_SPACING;
            const isLabeled = DECK.LABELED_TRACKS.has(i);
            const geo = new THREE.BoxGeometry(DECK.TRACK_WIDTH, 2.5, DECK.TRACK_DEPTH);
            const mat = new THREE.MeshLambertMaterial({
                color: isLabeled ? (isDark ? 0x2a3d55 : 0x8fa8c0) : trackColor,
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x + DECK.TRACK_WIDTH / 2, DECK.SURFACE_Z + 1.25, DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2);
            mesh.name = `__track_${i}__`;
            mesh.userData.trackNum = i;
            scene.add(mesh);
        }

        // Track number labels (sprite-based text above labeled tracks)
        for (let i = 1; i <= 9; i++) {
            const trackNum = 1 + (i - 1) * 6;
            const x = DECK.FIRST_TRACK_X + (trackNum - 1) * DECK.TRACK_SPACING;
            addTrackLabel(i.toString(), x, isDark);
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

        // Waste block area indicator (right end of deck, tracks ~50-54)
        const wasteX = DECK.FIRST_TRACK_X + 49 * DECK.TRACK_SPACING;
        const wasteGeo = new THREE.BoxGeometry(DECK.TRACK_SPACING * 4, 3, DECK.TRACK_DEPTH * 0.3);
        const wasteMat = new THREE.MeshLambertMaterial({ color: isDark ? 0x3a2020 : 0xc08080, transparent: true, opacity: 0.7 });
        const wasteMesh = new THREE.Mesh(wasteGeo, wasteMat);
        wasteMesh.position.set(wasteX + DECK.TRACK_SPACING * 2, DECK.SURFACE_Z + 2, DECK.TRACK_Y_START + DECK.TRACK_DEPTH * 0.15);
        wasteMesh.name = '__wastearea__';
        scene.add(wasteMesh);

        // Grid overlay on deck surface
        const gridColor = isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(2000, 80, gridColor, gridColor);
        grid.name = '__vlgrid__';
        grid.visible = vlState.gridVisible;
        grid.position.set(700, DECK.SURFACE_Z + 4.1, 310);
        scene.add(grid);
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
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());

                // Align GLTF so its TOP surface sits at DECK.SURFACE_Z,
                // so carriers placed at y = DECK.SURFACE_Z rest on top of the deck hardware.
                const deckCenterX = DECK.FIRST_TRACK_X + (DECK.TRACK_COUNT * DECK.TRACK_SPACING) / 2;
                const deckCenterZ = DECK.TRACK_Y_START + DECK.TRACK_DEPTH / 2;

                model.position.set(
                    deckCenterX - center.x,
                    DECK.SURFACE_Z - box.max.y,   // top of GLTF = deck surface level
                    deckCenterZ - center.z
                );

                vlState.scene.add(model);

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

                setStatus('Vantage deck model loaded');
            },
            undefined,
            function (err) {
                console.warn('VantageLayout: GLTF load failed', err);
                // Procedural geometry remains visible as fallback
            }
        );
    }

    function addTrackLabel(text, xPos, isDark) {
        const size = 64;
        const cv = document.createElement('canvas');
        cv.width = size; cv.height = size;
        const ctx = cv.getContext('2d');
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = isDark ? '#7aafdf' : '#2a5580';
        ctx.font = 'bold 28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, size / 2, size / 2);
        const tex = new THREE.CanvasTexture(cv);
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(18, 18, 1);
        sprite.position.set(xPos + DECK.TRACK_WIDTH / 2, DECK.SURFACE_Z + 16, DECK.TRACK_Y_START - 22);
        sprite.name = `__label_${text}__`;
        vlState.scene.add(sprite);
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
            result.sites.push({ id: siteId, x: sx, y: sy, z: sz, dx: sdx, dy: sdy });
        }

        return result;
    }

    // ================================================================
    //  3D Carrier Builder
    // ================================================================
    function buildCarrierMesh(carrierDef, trackStart) {
        const group = new THREE.Group();
        const x0 = DECK.FIRST_TRACK_X + (trackStart - 1) * DECK.TRACK_SPACING;
        const y0 = DECK.TRACK_Y_START;
        const z0 = DECK.SURFACE_Z;

        // Carrier body
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

        // Side rails
        const railH = carrierDef.dz * 0.65;
        const railGeo = new THREE.BoxGeometry(4, railH, carrierDef.dy);
        const railMat = new THREE.MeshLambertMaterial({ color: 0x304050 });
        [-1, 1].forEach(side => {
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(side === -1 ? 2 : carrierDef.dx - 2, railH / 2 + carrierDef.dz * 0.15, carrierDef.dy / 2);
            group.add(rail);
        });

        // Site wells
        const siteMeshes = [];
        carrierDef.sites.forEach(site => {
            // Site recess (empty slot)
            const wellGeo = new THREE.BoxGeometry(site.dx, 6, site.dy);
            const wellMat = new THREE.MeshLambertMaterial({ color: 0x1a2530 });
            const wellMesh = new THREE.Mesh(wellGeo, wellMat);
            // site.y is from carrier origin (Y = carrier front in Hamilton coords)
            // Hamilton Y = 0 at front, increases going rearward
            wellMesh.position.set(
                site.x + site.dx / 2,
                site.z - carrierDef.dz * 0.10,    // site surface height
                site.y + site.dy / 2,
            );
            wellMesh.name = `__site_${site.id}__`;
            wellMesh.userData.siteId = site.id;
            wellMesh.userData.siteData = site;
            group.add(wellMesh);
            siteMeshes.push(wellMesh);
        });

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
        });
        const mesh = new THREE.Mesh(geo, mat);
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
        const topMat = new THREE.MeshLambertMaterial({ color: 0x88c0e0 });
        const topMesh = new THREE.Mesh(topGeo, topMat);
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

        // Validate track range
        if (trackStart < 1 || trackStart + def.tWidth - 1 > DECK.TRACK_COUNT) {
            showVLStatus('Cannot place: track out of range.', 'error');
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

        for (const carrier of vlState.placedCarriers) {
            if (carrier.id === excludeId) continue;
            for (let t = carrier.trackStart; t < carrier.trackStart + carrier.def.tWidth; t++) {
                if (newRange.has(t)) return true;
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
    function selectCarrier(carrierId) {
        // Deselect previous
        vlState.placedCarriers.forEach(c => {
            c.mesh.traverse(child => {
                if (child.isMesh && child.name === '__carrier_body__') {
                    child.material.emissive = new THREE.Color(0x000000);
                }
            });
        });

        vlState.selectedCarrierId = carrierId;
        const carrier = vlState.placedCarriers.find(c => c.id === carrierId);
        if (carrier) {
            carrier.mesh.traverse(child => {
                if (child.isMesh && child.name === '__carrier_body__') {
                    child.material.emissive = new THREE.Color(vlState.isDark ? 0x103050 : 0x2060a0);
                }
            });
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
    //  Canvas Mouse Events (click to select, drag from palette)
    // ================================================================
    function wireCanvasEvents() {
        const canvas = vlState.canvas;
        if (!canvas) return;

        canvas.addEventListener('click', onDeckClick);
    }

    function onDeckClick(e) {
        if (!vlState.scene || !vlState.camera) return;
        const rect = vlState.canvas.getBoundingClientRect();
        vlState._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
        vlState._mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        vlState._raycaster.setFromCamera(vlState._mouse, vlState.camera);

        // Check if a placed carrier was clicked
        const carrierObjects = [];
        vlState.placedCarriers.forEach(c => {
            c.mesh.traverse(child => { if (child.isMesh) carrierObjects.push(child); });
        });

        const hits = vlState._raycaster.intersectObjects(carrierObjects, false);
        if (hits.length > 0) {
            // Find which carrier this mesh belongs to
            let target = hits[0].object;
            while (target.parent && !target.parent.name?.startsWith('__carrier')) {
                if (target.parent.userData?.carrierId) break;
                target = target.parent;
            }
            // Walk up scene graph to find the carrier group
            for (const carrier of vlState.placedCarriers) {
                let found = false;
                carrier.mesh.traverse(child => { if (child === hits[0].object) found = true; });
                if (found) {
                    selectCarrier(carrier.id);
                    return;
                }
            }
        }

        // Deselect if clicked empty space
        selectCarrier(null);
        updateSitePanel(null);
    }

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
            item.innerHTML = `
                <span class="vl-palette-icon"><i class="fas fa-th-large"></i></span>
                <span class="vl-palette-name">${def.viewName}</span>
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
        const clampedTrack = Math.max(1, Math.min(DECK.TRACK_COUNT - def.tWidth + 1, trackNum));
        const snappedX     = DECK.FIRST_TRACK_X + (clampedTrack - 1) * DECK.TRACK_SPACING;

        if (vlState.ghostMesh) {
            vlState.ghostMesh.position.set(snappedX, DECK.SURFACE_Z, DECK.TRACK_Y_START);
            vlState.ghostMesh.visible = true;

            // Red tint if occupied, blue if free
            const hasCollision = checkCarrierCollision(clampedTrack, def.tWidth, -1);
            const ghostColor = hasCollision ? 0xee4444 : 0x4499ee;
            vlState.ghostMesh.traverse(child => {
                if (child.isMesh) child.material.color.set(ghostColor);
            });
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

        // Set default track (next available)
        const track = findNextFreeTrack(def.tWidth);
        $('#vl-pd-track').value = track;
        $('#vl-pd-track').max = String(DECK.TRACK_COUNT - def.tWidth + 1);

        dialog.dataset.carrierType = carrierType;
        dialog.classList.add('is-visible');
    }

    function findNextFreeTrack(tWidth) {
        for (let t = 1; t <= DECK.TRACK_COUNT - tWidth + 1; t++) {
            if (!checkCarrierCollision(t, tWidth, -1)) return t;
        }
        return 1;
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
            const row = document.createElement('div');
            row.className = `vl-site-row${hasPlate ? ' has-plate' : ''}`;
            row.innerHTML = `
                <span class="vl-site-label">Site ${site.id}</span>
                <span class="vl-site-pos">Y: ${site.y.toFixed(1)}mm</span>
                <button class="vl-site-btn${hasPlate ? ' plate-on' : ''}" data-carrier="${carrier.id}" data-site="${site.id}">
                    <i class="fas ${hasPlate ? 'fa-minus-circle' : 'fa-plus-circle'}"></i>
                    ${hasPlate ? 'Remove' : 'Place'} Plate
                </button>`;
            row.querySelector('.vl-site-btn').addEventListener('click', () => {
                togglePlateOnSite(carrier.id, site.id);
            });
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
                const file = e.target.files[0];
                if (file) loadTMLFile(file);
                fileInput.value = '';
            });
        }

        if (dropZone) {
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && /\.tml$/i.test(file.name)) loadTMLFile(file);
                else showVLStatus('Please drop a .tml carrier template file.', 'error');
            });
        }
    }

    function loadTMLFile(file) {
        const reader = new FileReader();
        reader.onload = e => {
            const text = e.target.result;
            const parsed = parseTML(text);
            if (!parsed.viewName) parsed.viewName = file.name.replace(/\.tml$/i, '');
            if (!parsed.description) parsed.description = 'Imported carrier';

            // Register in library
            const key = parsed.viewName.toUpperCase().replace(/\s+/g, '_');
            CARRIER_LIBRARY[key] = parsed;
            vlState.importedCarrier = key;

            showVLStatus(`Loaded ${parsed.viewName}: ${parsed.sites.length} sites, ${parsed.tWidth}T`, 'ok');
            populateCarrierPalette();
            // Auto-open place dialog
            showPlaceDialog(key);
        };
        reader.readAsText(file);
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
                const collapsed = rightPanel.classList.toggle('is-collapsed');
                host.classList.toggle('vl-right-collapsed', collapsed);
                const icon = $('#vl-right-toggle-icon');
                if (icon) icon.className = collapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
            });
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

        // Reset camera
        wireBtn('#vl-vt-reset-cam', resetVLCamera);

        // Zoom to fit
        wireBtn('#vl-vt-zoom-fit', zoomToFitDeck);

        // Perspective toggle
        wireBtn('#vl-vt-perspective', toggleVLPerspective);

        // Grid toggle
        wireBtn('#vl-btn-grid', toggleVLGrid);

        // Top-down view
        wireBtn('#vl-vt-topdown', setTopDownView);

        // Zoom in/out
        wireBtn('#vl-vt-zoom-in',  () => doVLZoom(0.8));
        wireBtn('#vl-vt-zoom-out', () => doVLZoom(1.25));

        // Pan mode
        wireBtn('#vl-vt-pan', toggleVLPan);

        // Drag-to-place toggle
        wireBtn('#vl-vt-drag-place', () => setDragToPlace(!vlState.dragToPlaceEnabled));

        // Drag-to-move toolbar
        wireDragHandle('#vl-vt-grab-handle', '#vl-toolbar');
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
        vlState.camera.position.set(cx, 1400, cy + 200);
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
        vlState.camera.position.set(cx, 1800, cy + 0.01); // near-zero Z offset avoids gimbal lock
        vlState.camera.up.set(0, 0, -1);
        vlState.camera.updateProjectionMatrix();
        vlState.controls.update();
    }

    function zoomToFitDeck() {
        resetVLCamera();
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
