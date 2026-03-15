/* ============================================================
   Labware Editor — Create, edit and modify Hamilton labware
   definitions (racks, containers, carriers) with 3D preview,
   snap regions, and full file I/O.
   Supports: .rck, .ctr, .tml file formats
   ============================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ================================================================
    //  Constants
    // ================================================================
    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    const SNAP_COLOR    = 0x4488ff;
    const SNAP_HOVER    = 0x66aaff;
    const SNAP_ACTIVE   = 0x22cc66;
    const SITE_COLORS   = [0x5588cc, 0x55aa77, 0xcc8855, 0xaa5577, 0x7766aa, 0x88aa55];
    const WELL_COLOR    = 0x3399dd;
    const PLATE_COLOR   = 0xc0c8d0;
    const CARRIER_COLOR = 0x607080;

    // Container shape enums (match Hamilton's encoding)
    const SHAPE = {
        CYLINDER:       0,
        RECTANGLE:      1,
        INVERTED_VCONE: 2,
        VCONE:          3,
        ROUND_BASE:     4,
        VCONE_BASE:     5,
        FLAT_BASE:      6,
    };

    const SHAPE_LABELS = {
        0: 'Cylinder',
        1: 'Rectangle',
        2: 'Inverted V-Cone',
        3: 'V-Cone',
        4: 'Round Base',
        5: 'V-Cone Base',
        6: 'Flat Base',
    };

    // ================================================================
    //  State
    // ================================================================
    const st = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,
        isDark: false,
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,
        animId: null,

        // Editor mode: 'rack', 'container', 'carrier'
        mode: 'rack',
        dirty: false,

        // Current labware data
        rack: null,
        container: null,
        carrier: null,

        // Snap/selection
        selectedSiteIdx: -1,
        hoveredSiteIdx: -1,
        snapHelpers: [],
        siteBoxes: [],

        // Ruler state
        rulerActive: false,
        rulerStart: null,
        rulerEnd: null,
        rulerLine: null,
        rulerMarkers: [],
        rulerAxisLock: null,
        _savedMouseButtons: null,

        // File state
        fileName: '',
        fileContent: null,
    };

    // ================================================================
    //  Default data structures
    // ================================================================
    function defaultRack() {
        return {
            viewName: 'New Rack',
            description: '',
            dimDx: 127.76,
            dimDy: 85.48,
            dimDz: 14.0,
            rows: 8,
            columns: 12,
            dx: 9.0,    // column spacing
            dy: 9.0,    // row spacing
            bndryX: 14.38,
            bndryY: 11.24,
            holeShape: 0,   // 0=cylinder, 1=rectangle
            holeX: 7.0,
            holeY: 7.0,
            holeZ: 7.0,
            shape: 0,
            stackHt: 0,
            bitmap: '',
            image3D: '',
            model3D: '',
            ctrFile: '',
            ctrBase: 0,
            segCountX: 0,
            segCountY: 0,
            segX: [],
            segY: [],
            backgroundColor: '#ffffff',
            readOnly: false,
            categories: [],
            properties: [],
            stagger: 0,        // 0=none, 1=in, 2=out
            staggerValue: 0,
            useBndry: 0,
            coverEnable: false,
            coverHeight: 0,
            // Irregular well positions
            irregular: false,
            irregularWells: [],
        };
    }

    function defaultContainer() {
        return {
            shape: 0,        // top aperture shape
            depth: 10.0,
            dimDx: 7.0,
            dimDy: 7.0,
            baseThickness: 0.5,
            deadVolumeHeight: 0,
            touchOffHeight: 0,
            lldEnabled: false,
            lldSeekHeight: 0,
            lldSensitivity: 2,
            wickEnabled: false,
            wickHeight: 0,
            wickFront: 0,
            wickBack: 0,
            wickLeft: 0,
            wickRight: 0,
            segments: [
                {
                    shape: 0,  // cylinder
                    dx: 7.0,
                    dy: 7.0,
                    dz: 7.0,
                    height: 10.0,
                    minHeight: 0,
                    maxHeight: 10.0,
                },
            ],
        };
    }

    function defaultCarrier() {
        return {
            viewName: 'New Carrier',
            description: '',
            dimDx: 135.0,
            dimDy: 497.0,
            dimDz: 130.0,
            backgroundColor: '#607080',
            bitmap: '',
            image3D: '',
            model3D: '',
            readOnly: false,
            categories: [],
            properties: [],
            sites: [
                {
                    id: 1,
                    label: '1',
                    x: 4.0,
                    y: 8.5,
                    z: 112.0,
                    dx: 127.0,
                    dy: 86.0,
                    labwareFile: '',
                    isCovered: false,
                    visible: true,
                    snapBase: true,
                    isStack: false,
                    stackSize: 1,
                },
            ],
        };
    }

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initLabwareEditor() {
        st.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updateTheme();
            return;
        }
        initialized = true;

        const canvas = $('#lwe-canvas');
        const host   = $('#labware-editor-host');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 800;
        const h = host.clientHeight || 600;

        // -- Scene --
        st.scene = new THREE.Scene();
        st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        st.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        st.camera.position.set(160, 120, 200);
        st.camera.up.set(0, 1, 0);

        // -- Renderer --
        st.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true,
            logarithmicDepthBuffer: true,
        });
        st.renderer.setPixelRatio(window.devicePixelRatio);
        st.renderer.setSize(w, h);

        // -- Controls --
        st.controls = new THREE.OrbitControls(st.camera, st.renderer.domElement);
        st.controls.enableDamping = true;
        st.controls.dampingFactor = 0.12;
        st.controls.target.set(0, 0, 0);
        st.controls.update();

        // -- Lights --
        st.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(80, 150, 80);
        st.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-80, -30, -80);
        st.scene.add(d2);

        // -- Grid --
        const gc = st.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(600, 60, gc, gc);
        grid.name = '__lwegrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = st.gridVisible;
        st.scene.add(grid);

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const previewCol = host.querySelector('.lwe-preview-col');
            if (!previewCol) return;
            const cw = previewCol.clientWidth;
            const ch = previewCol.clientHeight;
            if (cw <= 0 || ch <= 0) return;
            st.camera.aspect = cw / ch;
            st.camera.updateProjectionMatrix();
            st.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Render loop --
        function tick() {
            st.animId = requestAnimationFrame(tick);
            st.controls.update();
            st.renderer.render(st.scene, st.camera);
            drawGizmo();
            updateCamDisplay();
        }
        tick();

        // -- Initialize default state --
        st.rack = defaultRack();
        st.container = defaultContainer();
        st.carrier = defaultCarrier();

        // -- Wire UI --
        wireModeTabs();
        wireRackForm();
        wireContainerForm();
        wireCarrierForm();
        wireToolbar();
        wireFileControls();
        wireSiteInteraction();
        wireScreenshotButton();

        // Load initial mode
        switchMode('rack');
    }

    // ================================================================
    //  Theme
    // ================================================================
    function updateTheme() {
        st.isDark = document.documentElement.hasAttribute('data-theme');
        if (!st.scene) return;
        st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);
        const grid = st.scene.getObjectByName('__lwegrid__');
        if (grid) {
            const c = new THREE.Color(st.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
        }
    }

    // ================================================================
    //  Mode Switching (rack / container / carrier)
    // ================================================================
    function switchMode(mode) {
        st.mode = mode;

        // Toggle tab active states
        $$('.lwe-mode-tab').forEach(tab => {
            tab.classList.toggle('is-active', tab.dataset.mode === mode);
        });

        // Toggle form sections
        const rackForm = $('#lwe-rack-section');
        const ctrForm  = $('#lwe-container-section');
        const carForm  = $('#lwe-carrier-section');

        if (rackForm) rackForm.style.display = mode === 'rack' ? '' : 'none';
        if (ctrForm)  ctrForm.style.display  = mode === 'container' ? '' : 'none';
        if (carForm)  carForm.style.display  = mode === 'carrier' ? '' : 'none';

        // Update status
        setStatus('Editing ' + mode);

        // Regenerate preview
        regeneratePreview();
    }

    function wireModeTabs() {
        $$('.lwe-mode-tab').forEach(tab => {
            tab.addEventListener('click', () => switchMode(tab.dataset.mode));
        });
    }

    // ================================================================
    //  HxCfgFile Parser (text format — handles .rck, .ctr, .tml)
    // ================================================================
    function parseHxCfg(text) {
        const map = {};
        const openIdx = text.indexOf('{');
        const closeIdx = text.lastIndexOf('}');
        if (openIdx < 0 || closeIdx < 0) return map;
        const body = text.substring(openIdx + 1, closeIdx);
        const lineRe = /^\s*([A-Za-z0-9_.]+)\s*,\s*"([^"]*)"/gm;
        let m;
        while ((m = lineRe.exec(body)) !== null) {
            map[m[1]] = m[2];
        }
        return map;
    }

    // ================================================================
    //  File Parsers
    // ================================================================

    /** Parse .rck rack file → rack definition */
    function parseRckFile(text) {
        const cfg = parseHxCfg(text);
        const rck = defaultRack();

        rck.viewName    = cfg['ViewName'] || cfg['Description'] || 'Imported Rack';
        rck.description = cfg['Description'] || '';
        rck.dimDx       = parseFloat(cfg['Dim.Dx']) || 127;
        rck.dimDy       = parseFloat(cfg['Dim.Dy']) || 86;
        rck.dimDz       = parseFloat(cfg['Dim.Dz']) || 14;
        rck.rows        = parseInt(cfg['Rows']) || 8;
        rck.columns     = parseInt(cfg['Columns']) || 12;
        rck.dx          = parseFloat(cfg['Dx']) || 9;
        rck.dy          = parseFloat(cfg['Dy']) || 9;
        rck.bndryX      = parseFloat(cfg['BndryX']) || 14;
        rck.bndryY      = parseFloat(cfg['BndryY']) || 11.5;
        rck.ctrBase     = parseFloat(cfg['Cntr.1.base']) || 0;
        rck.ctrFile     = cfg['Cntr.1.file'] || '';
        rck.holeShape   = parseInt(cfg['Hole.Shape']) || 0;
        rck.holeX       = parseFloat(cfg['Hole.X']) || 0;
        rck.holeY       = parseFloat(cfg['Hole.Y']) || 0;
        rck.holeZ       = parseFloat(cfg['Hole.Z']) || 0;
        rck.shape       = parseInt(cfg['Shape']) || 0;
        rck.stackHt     = parseFloat(cfg['StackHt']) || 0;
        rck.bitmap      = cfg['Bitmap'] || cfg['BitmapRel'] || '';
        rck.image3D     = cfg['Image3D'] || cfg['ImageRel'] || '';
        rck.model3D     = cfg['3DModel'] || cfg['3DModelRel'] || '';
        rck.stagger     = parseInt(cfg['Options']) || 0;
        rck.staggerValue = parseFloat(cfg['Stagger']) || 0;
        rck.useBndry    = parseInt(cfg['UseBndry']) || 0;
        rck.backgroundColor = intToColor(parseInt(cfg['BackgrndClr']) || 16777215);
        rck.readOnly    = cfg['ReadOnly'] === '1';

        // Grip segments
        rck.segCountX = parseInt(cfg['SegmentCount_x']) || 0;
        rck.segCountY = parseInt(cfg['SegmentCount_y']) || 0;
        for (let i = 0; i < rck.segCountX; i++) {
            rck.segX.push({
                lowerWidth:    parseFloat(cfg['Seg_x.' + i + '.LowerWidth']) || rck.dimDx,
                upperWidth:    parseFloat(cfg['Seg_x.' + i + '.UpperWidth']) || rck.dimDx,
                segmentHeight: parseFloat(cfg['Seg_x.' + i + '.SegmentHeight']) || 0,
            });
        }
        for (let i = 0; i < rck.segCountY; i++) {
            rck.segY.push({
                lowerWidth:    parseFloat(cfg['Seg_y.' + i + '.LowerWidth']) || rck.dimDy,
                upperWidth:    parseFloat(cfg['Seg_y.' + i + '.UpperWidth']) || rck.dimDy,
                segmentHeight: parseFloat(cfg['Seg_y.' + i + '.SegmentHeight']) || 0,
            });
        }

        // Irregular wells
        var holeCnt = parseInt(cfg['HoleCnt']) || 0;
        if (holeCnt > 0) {
            rck.irregular = true;
            rck.irregularWells = [];
            for (let i = 1; i <= holeCnt; i++) {
                rck.irregularWells.push({
                    x: parseFloat(cfg[i + '.X']) || 0,
                    y: parseFloat(cfg[i + '.Y']) || 0,
                    id: cfg[i + '.ID'] || String(i),
                });
            }
        }

        // Categories
        var catCnt = parseInt(cfg['CategoryCnt']) || 0;
        for (let i = 0; i < catCnt; i++) {
            var catId = cfg['Category.' + i + '.Id'];
            if (catId) rck.categories.push(catId);
        }

        // Properties
        var propCnt = parseInt(cfg['PropertyCnt']) || 0;
        for (let i = 1; i <= propCnt; i++) {
            var propName = cfg['Property.' + i];
            var propVal  = cfg['PropertyValue.' + i];
            if (propName) rck.properties.push({ name: propName, value: propVal || '' });
        }

        return rck;
    }

    /** Parse .ctr container file → container definition */
    function parseCtrFile(text) {
        const cfg = parseHxCfg(text);
        const ctr = defaultContainer();

        ctr.shape           = parseInt(cfg['Shape']) || 0;
        ctr.depth           = parseFloat(cfg['Depth']) || 10;
        ctr.dimDx           = parseFloat(cfg['Dim.Dx']) || 7;
        ctr.dimDy           = parseFloat(cfg['Dim.Dy']) || 7;
        ctr.baseThickness   = parseFloat(cfg['BaseMM']) || 0;
        ctr.deadVolumeHeight = parseFloat(cfg['MaxDepth']) || 0;
        ctr.touchOffHeight  = parseFloat(cfg['TchBase']) || 0;
        ctr.lldEnabled      = cfg['LS'] === '1';
        ctr.lldSeekHeight   = parseFloat(cfg['LSHt']) || 0;
        ctr.lldSensitivity  = parseInt(cfg['cLLD']) || 2;
        ctr.wickEnabled     = cfg['TchOff'] === '1';
        ctr.wickHeight      = parseFloat(cfg['TchHt']) || 0;
        ctr.wickFront       = parseFloat(cfg['TchFront']) || 0;
        ctr.wickBack        = parseFloat(cfg['TchBack']) || 0;
        ctr.wickLeft        = parseFloat(cfg['TchLeft']) || 0;
        ctr.wickRight       = parseFloat(cfg['TchRight']) || 0;

        // Parse segments
        var numSeg = parseInt(cfg['Segments']) || 1;
        ctr.segments = [];
        for (let i = 1; i <= numSeg; i++) {
            var segShape = parseInt(cfg[i + '.Shape']) || 0;
            ctr.segments.push({
                shape: segShape,
                dx: parseFloat(cfg[i + '.DX']) || ctr.dimDx,
                dy: parseFloat(cfg[i + '.DY']) || ctr.dimDy,
                dz: parseFloat(cfg[i + '.DZ']) || ctr.dimDx,
                height: 0,
                minHeight: parseFloat(cfg[i + '.Min']) || 0,
                maxHeight: parseFloat(cfg[i + '.Max']) || ctr.depth,
            });
        }
        // Compute heights
        for (let i = 0; i < ctr.segments.length; i++) {
            var seg = ctr.segments[i];
            seg.height = seg.maxHeight - seg.minHeight;
        }

        return ctr;
    }

    /** Parse .tml carrier template file → carrier definition */
    function parseTmlFile(text) {
        const cfg = parseHxCfg(text);
        const car = defaultCarrier();

        car.viewName    = cfg['ViewName'] || 'Imported Carrier';
        car.description = cfg['Description'] || '';
        car.dimDx       = parseFloat(cfg['Dim.Dx']) || 135;
        car.dimDy       = parseFloat(cfg['Dim.Dy']) || 497;
        car.dimDz       = parseFloat(cfg['Dim.Dz']) || 130;
        car.bitmap      = cfg['Bitmap'] || '';
        car.image3D     = cfg['Image3D'] || '';
        car.model3D     = cfg['3DModel'] || '';
        car.backgroundColor = intToColor(parseInt(cfg['BackgrndClr']) || 6324096);
        car.readOnly    = cfg['ReadOnly'] === '1';

        // Properties
        var propCnt = parseInt(cfg['PropertyCnt']) || 0;
        for (let i = 1; i <= propCnt; i++) {
            var propName = cfg['Property.' + i];
            var propVal  = cfg['PropertyValue.' + i];
            if (propName) car.properties.push({ name: propName, value: propVal || '' });
        }

        // Parse sites
        var siteCnt = parseInt(cfg['Site.Cnt']) || 0;
        car.sites = [];
        for (let i = 1; i <= siteCnt; i++) {
            car.sites.push({
                id: parseInt(cfg['Site.' + i + '.Id']) || i,
                label: cfg['Site.' + i + '.Label'] || String(i),
                x: parseFloat(cfg['Site.' + i + '.X']) || 0,
                y: parseFloat(cfg['Site.' + i + '.Y']) || 0,
                z: parseFloat(cfg['Site.' + i + '.Z']) || 0,
                dx: parseFloat(cfg['Site.' + i + '.Dx']) || 127,
                dy: parseFloat(cfg['Site.' + i + '.Dy']) || 86,
                labwareFile: cfg['Site.' + i + '.LabwareFile'] || '',
                isCovered: cfg['Site.' + i + '.IsCovered'] === '1',
                visible: cfg['Site.' + i + '.Visible'] !== '0',
                snapBase: cfg['Site.' + i + '.SnapBase'] === '1',
                isStack: cfg['Site.' + i + '.Stack'] === '1',
                stackSize: parseInt(cfg['Site.' + i + '.StackSize']) || 1,
            });
        }

        return car;
    }

    // ================================================================
    //  File Writers — generate HxCfgFile text output
    // ================================================================

    /** Write .rck file text from rack definition */
    function writeRckFile(rck) {
        var lines = [];
        lines.push('HxCfgFile,3;');
        lines.push('');
        lines.push('ConfigIsValid,Y;');
        lines.push('');
        lines.push('DataDef,RECTRACK,3,default,');
        lines.push('{');

        function w(key, val) { lines.push(key + ', "' + val + '",'); }

        w('BackgrndClr', colorToInt(rck.backgroundColor));
        w('Barcode.Unique', '0');
        w('Barcode.Value', '');
        w('Bitmap', rck.bitmap);
        w('BitmapRel', '');
        w('BndryX', round3(rck.bndryX));
        w('BndryY', round3(rck.bndryY));

        // Categories
        for (let i = 0; i < rck.categories.length; i++) {
            w('Category.' + i + '.Id', rck.categories[i]);
        }
        w('CategoryCnt', String(rck.categories.length));

        w('Cntr.1.base', round3(rck.ctrBase));
        w('Cntr.1.file', rck.ctrFile);
        w('Cntr.1.fileRel', '');
        w('Cntr.1.offsetx', '0');
        w('Cntr.1.offsety', '0');
        w('Columns', String(rck.columns));
        w('ConnectedCtr', '0');
        w('DataType', '2');
        w('Description', rck.description);
        w('Dim.Dx', round3(rck.dimDx));
        w('Dim.Dy', round3(rck.dimDy));
        w('Dim.Dz', round3(rck.dimDz));
        w('Dx', round3(rck.dx));
        w('Dy', round3(rck.dy));
        w('GrpCnt', '0');
        w('Hole.Shape', String(rck.holeShape));
        w('Hole.X', round3(rck.holeX));
        w('Hole.Y', round3(rck.holeY));
        w('Hole.Z', round3(rck.holeZ));
        w('IX.First', '1');
        w('IX.Inc', '1');
        w('IX.Index', '0');
        w('IX.Start', '0');
        w('Image3D', rck.image3D);
        w('ImageRel', '');
        w('Options', String(rck.stagger));
        // Properties
        w('PropertyCnt', String(rck.properties.length));
        for (let i = 0; i < rck.properties.length; i++) {
            w('Property.' + (i + 1), rck.properties[i].name);
            w('PropertyValue.' + (i + 1), rck.properties[i].value);
        }
        w('ReadOnly', rck.readOnly ? '1' : '0');
        w('Rows', String(rck.rows));

        // Grip segments X
        w('SegmentCount_x', String(rck.segCountX));
        for (let i = 0; i < rck.segX.length; i++) {
            w('Seg_x.' + i + '.LowerWidth', round3(rck.segX[i].lowerWidth));
            w('Seg_x.' + i + '.SegmentHeight', round3(rck.segX[i].segmentHeight));
            w('Seg_x.' + i + '.UpperWidth', round3(rck.segX[i].upperWidth));
        }
        w('SegmentCount_y', String(rck.segCountY));
        for (let i = 0; i < rck.segY.length; i++) {
            w('Seg_y.' + i + '.LowerWidth', round3(rck.segY[i].lowerWidth));
            w('Seg_y.' + i + '.SegmentHeight', round3(rck.segY[i].segmentHeight));
            w('Seg_y.' + i + '.UpperWidth', round3(rck.segY[i].upperWidth));
        }

        w('Shape', String(rck.shape));
        w('StackHt', round3(rck.stackHt));
        w('Stagger', round3(rck.staggerValue));
        w('UseBndry', String(rck.useBndry));
        w('ViewName', rck.viewName);
        w('Visible', '0');

        // 3D model
        if (rck.model3D) w('3DModel', rck.model3D);

        lines.push('};');
        lines.push('');
        lines.push(generateFooter());
        return lines.join('\r\n') + '\r\n';
    }

    /** Write .ctr file text from container definition */
    function writeCtrFile(ctr) {
        var lines = [];
        lines.push('HxCfgFile,3;');
        lines.push('');
        lines.push('ConfigIsValid,Y;');
        lines.push('');
        lines.push('DataDef,RECTRACK,3,default,');
        lines.push('{');

        function w(key, val) { lines.push(key + ', "' + val + '",'); }

        w('BaseMM', round3(ctr.baseThickness));
        w('Depth', round3(ctr.depth));
        w('Dim.Dx', round3(ctr.dimDx));
        w('Dim.Dy', round3(ctr.dimDy));
        w('LS', ctr.lldEnabled ? '1' : '0');
        w('LSHt', round3(ctr.lldSeekHeight));
        w('MaxDepth', round3(ctr.deadVolumeHeight));
        w('Segments', String(ctr.segments.length));
        w('Shape', String(ctr.shape));
        w('TchBase', round3(ctr.touchOffHeight));
        w('TchOff', ctr.wickEnabled ? '1' : '0');
        w('TchHt', round3(ctr.wickHeight));
        w('TchFront', round3(ctr.wickFront));
        w('TchBack', round3(ctr.wickBack));
        w('TchLeft', round3(ctr.wickLeft));
        w('TchRight', round3(ctr.wickRight));
        w('cLLD', String(ctr.lldSensitivity));

        for (let i = 0; i < ctr.segments.length; i++) {
            var seg = ctr.segments[i];
            var idx = i + 1;
            w(idx + '.DX', round3(seg.dx));
            w(idx + '.DY', round3(seg.dy));
            w(idx + '.DZ', round3(seg.dz));
            w(idx + '.Max', round3(seg.maxHeight));
            w(idx + '.Min', round3(seg.minHeight));
            w(idx + '.Shape', String(seg.shape));
        }

        lines.push('};');
        lines.push('');
        lines.push(generateFooter());
        return lines.join('\r\n') + '\r\n';
    }

    /** Write .tml file text from carrier definition */
    function writeTmlFile(car) {
        var lines = [];
        lines.push('HxCfgFile,3;');
        lines.push('');
        lines.push('ConfigIsValid,Y;');
        lines.push('');
        lines.push('DataDef,TEMPLATE,1,default,');
        lines.push('{');

        function w(key, val) { lines.push(key + ', "' + val + '",'); }

        w('BackgrndClr', colorToInt(car.backgroundColor));
        w('Barcode.Value', '');
        w('Bitmap', car.bitmap || '');
        w('CategoryCnt', String(car.categories.length));
        for (let i = 0; i < car.categories.length; i++) {
            w('Category.' + i + '.Id', car.categories[i]);
        }
        w('Description', car.description);
        w('Dim.Dx', round3(car.dimDx));
        w('Dim.Dy', round3(car.dimDy));
        w('Dim.Dz', round3(car.dimDz));

        // Properties
        w('PropertyCnt', String(car.properties.length));
        for (let i = 0; i < car.properties.length; i++) {
            w('Property.' + (i + 1), car.properties[i].name);
            w('PropertyValue.' + (i + 1), car.properties[i].value);
        }

        w('ReadOnly', car.readOnly ? '1' : '0');

        // Sites
        for (let i = 0; i < car.sites.length; i++) {
            var site = car.sites[i];
            var idx = i + 1;
            w('Site.' + idx + '.Dx', round3(site.dx));
            w('Site.' + idx + '.Dy', round3(site.dy));
            w('Site.' + idx + '.Id', String(site.id));
            w('Site.' + idx + '.IsCovered', site.isCovered ? '1' : '0');
            w('Site.' + idx + '.Label', site.label || String(idx));
            w('Site.' + idx + '.LabwareFile', site.labwareFile || '');
            w('Site.' + idx + '.SnapBase', site.snapBase ? '1' : '0');
            w('Site.' + idx + '.Stack', site.isStack ? '1' : '0');
            w('Site.' + idx + '.StackSize', String(site.stackSize));
            w('Site.' + idx + '.Visible', site.visible ? '1' : '0');
            w('Site.' + idx + '.X', round3(site.x));
            w('Site.' + idx + '.Y', round3(site.y));
            w('Site.' + idx + '.Z', round3(site.z));
        }
        w('Site.Cnt', String(car.sites.length));

        w('UseBndry', '0');
        w('ViewName', car.viewName);
        w('Visible', '0');

        if (car.model3D) w('3DModel', car.model3D);

        lines.push('};');
        lines.push('');
        lines.push(generateFooter());
        return lines.join('\r\n') + '\r\n';
    }

    function generateFooter() {
        var now = new Date();
        var time = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        return '* $$author=LabwareEditor$$valid=1$$time=' + time + '$$checksum=00000000$$length=000$$';
    }

    // ================================================================
    //  3D Model Generation
    // ================================================================

    function clearModel() {
        if (!st.scene) return;
        const old = st.scene.getObjectByName('__lwe_model__');
        if (old) {
            old.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            st.scene.remove(old);
        }
        // Clear snap helpers
        st.snapHelpers.forEach(h => {
            st.scene.remove(h);
            if (h.geometry) h.geometry.dispose();
            if (h.material) h.material.dispose();
        });
        st.snapHelpers = [];
        st.siteBoxes = [];
        st.model = null;
    }

    function displayModel(group) {
        clearModel();
        group.name = '__lwe_model__';
        st.model = group;
        st.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        st.controls.target.copy(center);
        const dist = maxDim * 1.8;
        st.camera.position.set(
            center.x + dist * 0.6,
            center.y + dist * 0.5,
            center.z + dist * 0.8
        );
        st.controls.update();
    }

    function regeneratePreview() {
        if (st.mode === 'rack') {
            generateRack3D(st.rack, st.container);
        } else if (st.mode === 'container') {
            generateContainer3D(st.container);
        } else if (st.mode === 'carrier') {
            generateCarrier3D(st.carrier);
        }
    }

    // ================================================================
    //  Rack 3D Generation
    // ================================================================
    function generateRack3D(rck, ctr) {
        var group = new THREE.Group();
        group.name = '__lwe_model__';

        // -- Plate body --
        var plateW = rck.dimDx;
        var plateD = rck.dimDy;
        var plateH = rck.dimDz;

        var plateGeo = new THREE.BoxGeometry(plateW, plateH, plateD);
        var plateMat = new THREE.MeshPhongMaterial({
            color: PLATE_COLOR,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
        });
        var plateMesh = new THREE.Mesh(plateGeo, plateMat);
        plateMesh.position.set(plateW / 2, plateH / 2, plateD / 2);
        group.add(plateMesh);

        // -- Wells --
        var wellRadius = (ctr && ctr.dimDx > 0) ? ctr.dimDx / 2 : (rck.holeX > 0 ? rck.holeX / 2 : 3.5);
        var wellDepth  = (ctr && ctr.depth > 0) ? ctr.depth : 10;
        var isSquare   = rck.holeShape === 1 || (ctr && ctr.shape === 1);

        var rows = rck.rows;
        var cols = rck.columns;

        for (var r = 0; r < rows; r++) {
            for (var c = 0; c < cols; c++) {
                var wx = rck.bndryX + c * rck.dx;
                var wz = rck.bndryY + r * rck.dy;

                // Apply stagger
                if (rck.stagger === 1 && r % 2 === 1) wx += rck.staggerValue;
                else if (rck.stagger === 2 && r % 2 === 1) wx -= rck.staggerValue;

                var wellMesh;
                if (isSquare) {
                    var wGeo = new THREE.BoxGeometry(
                        wellRadius * 2, wellDepth, wellRadius * 2
                    );
                    wellMesh = new THREE.Mesh(wGeo, new THREE.MeshPhongMaterial({
                        color: WELL_COLOR,
                        transparent: true,
                        opacity: 0.5,
                    }));
                } else {
                    var wGeo = new THREE.CylinderGeometry(
                        wellRadius, wellRadius * 0.85, wellDepth, 16
                    );
                    wellMesh = new THREE.Mesh(wGeo, new THREE.MeshPhongMaterial({
                        color: WELL_COLOR,
                        transparent: true,
                        opacity: 0.5,
                    }));
                }

                wellMesh.position.set(wx, plateH - wellDepth / 2, wz);
                group.add(wellMesh);
            }
        }

        // -- Rim/edge lines --
        var edges = new THREE.EdgesGeometry(plateGeo);
        var edgeMat = new THREE.LineBasicMaterial({ color: 0x555555 });
        var edgeMesh = new THREE.LineSegments(edges, edgeMat);
        edgeMesh.position.copy(plateMesh.position);
        group.add(edgeMesh);

        displayModel(group);
        updateDimensionDisplay('rack');
    }

    // ================================================================
    //  Container 3D Generation (cross-section profile)
    // ================================================================
    function generateContainer3D(ctr) {
        var group = new THREE.Group();
        group.name = '__lwe_model__';

        var scale = 5; // Scale up for visibility
        var yOff = 0;

        // Color gradient from bottom to top
        for (var i = 0; i < ctr.segments.length; i++) {
            var seg = ctr.segments[i];
            var h = seg.height > 0 ? seg.height : (seg.maxHeight - seg.minHeight);
            if (h <= 0) h = ctr.depth / ctr.segments.length;

            var t = ctr.segments.length > 1 ? i / (ctr.segments.length - 1) : 0;
            var red   = Math.round(25 + t * 160);
            var green = Math.round(140 + t * 80);
            var blue  = 255;
            var segColor = (red << 16) | (green << 8) | blue;

            var segMesh;
            var topR, botR;

            switch (seg.shape) {
                case SHAPE.CYLINDER:
                case SHAPE.ROUND_BASE:
                    topR = (seg.dz || seg.dx) / 2 * scale;
                    botR = topR * 0.9;
                    if (seg.shape === SHAPE.ROUND_BASE) {
                        // Hemispherical bottom
                        var sphereGeo = new THREE.SphereGeometry(topR, 16, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
                        segMesh = new THREE.Mesh(sphereGeo, new THREE.MeshPhongMaterial({
                            color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                        }));
                        segMesh.position.set(0, yOff, 0);
                    } else {
                        var cylGeo = new THREE.CylinderGeometry(topR, botR, h * scale, 24);
                        segMesh = new THREE.Mesh(cylGeo, new THREE.MeshPhongMaterial({
                            color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                        }));
                        segMesh.position.set(0, yOff + h * scale / 2, 0);
                    }
                    break;

                case SHAPE.RECTANGLE:
                    var rw = seg.dx * scale;
                    var rd = seg.dy * scale;
                    var rh = h * scale;
                    var boxGeo = new THREE.BoxGeometry(rw, rh, rd);
                    segMesh = new THREE.Mesh(boxGeo, new THREE.MeshPhongMaterial({
                        color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                    }));
                    segMesh.position.set(0, yOff + rh / 2, 0);
                    break;

                case SHAPE.VCONE:
                case SHAPE.VCONE_BASE:
                    topR = (seg.dz || seg.dx) / 2 * scale;
                    var coneGeo = new THREE.ConeGeometry(topR, h * scale, 16);
                    segMesh = new THREE.Mesh(coneGeo, new THREE.MeshPhongMaterial({
                        color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                    }));
                    segMesh.position.set(0, yOff + h * scale / 2, 0);
                    break;

                case SHAPE.INVERTED_VCONE:
                    topR = (seg.dz || seg.dx) / 2 * scale;
                    var iconeGeo = new THREE.ConeGeometry(topR, h * scale, 16);
                    segMesh = new THREE.Mesh(iconeGeo, new THREE.MeshPhongMaterial({
                        color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                    }));
                    segMesh.rotation.x = Math.PI;
                    segMesh.position.set(0, yOff + h * scale / 2, 0);
                    break;

                default: // FLAT_BASE or unknown
                    topR = (seg.dz || seg.dx) / 2 * scale;
                    var discGeo = new THREE.CylinderGeometry(topR, topR, 1, 24);
                    segMesh = new THREE.Mesh(discGeo, new THREE.MeshPhongMaterial({
                        color: segColor, transparent: true, opacity: 0.6, side: THREE.DoubleSide,
                    }));
                    segMesh.position.set(0, yOff + 0.5, 0);
                    break;
            }

            if (segMesh) group.add(segMesh);
            yOff += h * scale;
        }

        // Outer shell (aperture wireframe)
        var outerR = Math.max(ctr.dimDx, ctr.dimDy) / 2 * scale;
        var outerH = ctr.depth * scale;
        var shellGeo = new THREE.CylinderGeometry(outerR, outerR, outerH, 24, 1, true);
        var shellMat = new THREE.MeshPhongMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            wireframe: true,
        });
        var shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.set(0, outerH / 2, 0);
        group.add(shell);

        displayModel(group);
        updateDimensionDisplay('container');
    }

    // ================================================================
    //  Carrier 3D Generation with Snap Regions
    // ================================================================
    function generateCarrier3D(car) {
        var group = new THREE.Group();
        group.name = '__lwe_model__';

        // -- Carrier body --
        var carW = car.dimDx;
        var carD = car.dimDy;
        var carH = car.dimDz;

        // Main carrier body — slightly darker
        var bodyGeo = new THREE.BoxGeometry(carW, carH, carD);
        var bodyMat = new THREE.MeshPhongMaterial({
            color: CARRIER_COLOR,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
        });
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.position.set(carW / 2, carH / 2, carD / 2);
        group.add(bodyMesh);

        // Carrier body edges
        var bodyEdges = new THREE.EdgesGeometry(bodyGeo);
        var bodyEdgeMat = new THREE.LineBasicMaterial({ color: 0x444444 });
        var bodyEdgeMesh = new THREE.LineSegments(bodyEdges, bodyEdgeMat);
        bodyEdgeMesh.position.copy(bodyMesh.position);
        group.add(bodyEdgeMesh);

        // -- Snap Region Sites --
        st.siteBoxes = [];
        for (var i = 0; i < car.sites.length; i++) {
            var site = car.sites[i];
            if (!site.visible) continue;

            var siteW = site.dx;
            var siteD = site.dy;
            var siteH = 5; // Visual indicator height

            var siteColor = SITE_COLORS[i % SITE_COLORS.length];
            var isSelected = i === st.selectedSiteIdx;
            var isHovered  = i === st.hoveredSiteIdx;

            if (isSelected) siteColor = SNAP_ACTIVE;
            else if (isHovered) siteColor = SNAP_HOVER;

            // Site platform
            var siteGeo = new THREE.BoxGeometry(siteW, siteH, siteD);
            var siteMat = new THREE.MeshPhongMaterial({
                color: siteColor,
                transparent: true,
                opacity: isSelected ? 0.7 : 0.45,
                side: THREE.DoubleSide,
            });
            var siteMesh = new THREE.Mesh(siteGeo, siteMat);
            siteMesh.position.set(
                site.x + siteW / 2,
                site.z + siteH / 2,
                site.y + siteD / 2
            );
            siteMesh.userData = { siteIdx: i };
            group.add(siteMesh);
            st.siteBoxes.push(siteMesh);

            // Site edges
            var siteEdges = new THREE.EdgesGeometry(siteGeo);
            var siteEdgeMat = new THREE.LineBasicMaterial({
                color: isSelected ? 0x00ff00 : 0x333333,
                linewidth: isSelected ? 2 : 1,
            });
            var siteEdgeMesh = new THREE.LineSegments(siteEdges, siteEdgeMat);
            siteEdgeMesh.position.copy(siteMesh.position);
            group.add(siteEdgeMesh);

            // Site label
            var labelCanvas = createLabelCanvas(
                'Site ' + site.id,
                isSelected ? '#22cc66' : '#ffffff'
            );
            var labelTex = new THREE.CanvasTexture(labelCanvas);
            var labelGeo = new THREE.PlaneGeometry(
                labelCanvas.width / 8, labelCanvas.height / 8
            );
            var labelMat = new THREE.MeshBasicMaterial({
                map: labelTex,
                transparent: true,
                depthTest: false,
            });
            var labelMesh = new THREE.Mesh(labelGeo, labelMat);
            labelMesh.position.set(
                site.x + siteW / 2,
                site.z + siteH + 8,
                site.y + siteD / 2
            );
            labelMesh.renderOrder = 100;
            group.add(labelMesh);

            // Snap indicators (corner dots)
            addSnapIndicators(group, site, siteColor);
        }

        displayModel(group);
        updateDimensionDisplay('carrier');
        updateSiteList();
    }

    function addSnapIndicators(group, site, color) {
        var corners = [
            [site.x, site.z, site.y],
            [site.x + site.dx, site.z, site.y],
            [site.x, site.z, site.y + site.dy],
            [site.x + site.dx, site.z, site.y + site.dy],
        ];
        corners.forEach(function(c) {
            var dotGeo = new THREE.SphereGeometry(1.5, 8, 8);
            var dotMat = new THREE.MeshBasicMaterial({ color: color, depthTest: false });
            var dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(c[0], c[1], c[2]);
            dot.renderOrder = 50;
            group.add(dot);
            st.snapHelpers.push(dot);
        });
    }

    function createLabelCanvas(text, color) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        ctx.font = 'bold 24px sans-serif';
        var metrics = ctx.measureText(text);
        canvas.width = Math.ceil(metrics.width) + 16;
        canvas.height = 32;
        ctx.font = 'bold 24px sans-serif';
        ctx.fillStyle = color || '#ffffff';
        ctx.fillText(text, 8, 24);
        return canvas;
    }

    // ================================================================
    //  Dimension Display
    // ================================================================
    function updateDimensionDisplay(mode) {
        var el = $('#lwe-dim-display');
        if (!el) return;
        if (mode === 'rack') {
            var r = st.rack;
            el.innerHTML =
                '<b>' + r.viewName + '</b><br>' +
                r.dimDx.toFixed(1) + ' × ' + r.dimDy.toFixed(1) + ' × ' + r.dimDz.toFixed(1) + ' mm<br>' +
                r.rows + ' × ' + r.columns + ' = ' + (r.rows * r.columns) + ' wells';
        } else if (mode === 'container') {
            var c = st.container;
            el.innerHTML =
                '<b>Container</b><br>' +
                'Aperture: ' + c.dimDx.toFixed(1) + ' × ' + c.dimDy.toFixed(1) + ' mm<br>' +
                'Depth: ' + c.depth.toFixed(1) + ' mm<br>' +
                c.segments.length + ' segment(s)';
        } else if (mode === 'carrier') {
            var cr = st.carrier;
            el.innerHTML =
                '<b>' + cr.viewName + '</b><br>' +
                cr.dimDx.toFixed(1) + ' × ' + cr.dimDy.toFixed(1) + ' × ' + cr.dimDz.toFixed(1) + ' mm<br>' +
                cr.sites.length + ' site(s)';
        }
    }

    // ================================================================
    //  Site List (Carrier mode)
    // ================================================================
    function updateSiteList() {
        var list = $('#lwe-site-list');
        if (!list) return;
        list.innerHTML = '';

        var car = st.carrier;
        for (var i = 0; i < car.sites.length; i++) {
            var site = car.sites[i];
            var item = document.createElement('div');
            item.className = 'lwe-site-item' + (i === st.selectedSiteIdx ? ' is-selected' : '');
            item.dataset.idx = i;
            item.innerHTML =
                '<div class="lwe-site-item-header">' +
                '<span class="lwe-site-color" style="background:' +
                '#' + (SITE_COLORS[i % SITE_COLORS.length]).toString(16).padStart(6, '0') + '"></span>' +
                '<strong>Site ' + site.id + '</strong>' +
                '<span class="lwe-site-dims">' +
                site.dx.toFixed(0) + '×' + site.dy.toFixed(0) + 'mm' +
                '</span>' +
                '</div>' +
                '<div class="lwe-site-item-detail">' +
                'Position: X=' + site.x.toFixed(1) + ' Y=' + site.y.toFixed(1) + ' Z=' + site.z.toFixed(1) +
                '</div>';

            (function(idx) {
                item.addEventListener('click', function() {
                    selectSite(idx);
                });
            })(i);

            list.appendChild(item);
        }
    }

    function selectSite(idx) {
        st.selectedSiteIdx = idx;
        populateCarrierSiteForm(idx);
        regeneratePreview();
    }

    function populateCarrierSiteForm(idx) {
        if (idx < 0 || idx >= st.carrier.sites.length) return;
        var site = st.carrier.sites[idx];

        valById('lwe-site-id', site.id);
        valById('lwe-site-x', site.x.toFixed(2));
        valById('lwe-site-y', site.y.toFixed(2));
        valById('lwe-site-z', site.z.toFixed(2));
        valById('lwe-site-dx', site.dx.toFixed(2));
        valById('lwe-site-dy', site.dy.toFixed(2));

        var labwareEl = $('#lwe-site-labware');
        if (labwareEl) labwareEl.value = site.labwareFile || '';

        var coveredEl = $('#lwe-site-covered');
        if (coveredEl) coveredEl.checked = site.isCovered;

        var visibleEl = $('#lwe-site-visible');
        if (visibleEl) visibleEl.checked = site.visible;

        var snapEl = $('#lwe-site-snap');
        if (snapEl) snapEl.checked = site.snapBase;

        var stackEl = $('#lwe-site-stack');
        if (stackEl) stackEl.checked = site.isStack;

        valById('lwe-site-stack-size', site.stackSize);
    }

    // ================================================================
    //  Form → Data (read forms)
    // ================================================================
    function readRackForm() {
        st.rack.viewName   = valById('lwe-rack-name') || 'New Rack';
        st.rack.description = valById('lwe-rack-desc') || '';
        st.rack.dimDx      = parseFloat(valById('lwe-rack-dx')) || 127.76;
        st.rack.dimDy      = parseFloat(valById('lwe-rack-dy')) || 85.48;
        st.rack.dimDz      = parseFloat(valById('lwe-rack-dz')) || 14;
        st.rack.rows       = parseInt(valById('lwe-rack-rows')) || 8;
        st.rack.columns    = parseInt(valById('lwe-rack-cols')) || 12;
        st.rack.dx         = parseFloat(valById('lwe-rack-col-spacing')) || 9;
        st.rack.dy         = parseFloat(valById('lwe-rack-row-spacing')) || 9;
        st.rack.bndryX     = parseFloat(valById('lwe-rack-bndry-x')) || 14;
        st.rack.bndryY     = parseFloat(valById('lwe-rack-bndry-y')) || 11;
        st.rack.holeShape  = parseInt(valById('lwe-rack-hole-shape')) || 0;
        st.rack.holeX      = parseFloat(valById('lwe-rack-hole-x')) || 7;
        st.rack.holeY      = parseFloat(valById('lwe-rack-hole-y')) || 7;
        st.rack.holeZ      = parseFloat(valById('lwe-rack-hole-z')) || 7;
        st.rack.stackHt    = parseFloat(valById('lwe-rack-stack-ht')) || 0;
    }

    function readContainerForm() {
        st.container.shape = parseInt(valById('lwe-ctr-shape')) || 0;
        st.container.depth = parseFloat(valById('lwe-ctr-depth')) || 10;
        st.container.dimDx = parseFloat(valById('lwe-ctr-dx')) || 7;
        st.container.dimDy = parseFloat(valById('lwe-ctr-dy')) || 7;
        st.container.baseThickness = parseFloat(valById('lwe-ctr-base-thick')) || 0;
        st.container.lldEnabled = !!$('#lwe-ctr-lld-enable')?.checked;
        st.container.lldSeekHeight = parseFloat(valById('lwe-ctr-lld-height')) || 0;

        // Read first segment from form (simplified)
        if (st.container.segments.length === 0) {
            st.container.segments.push({
                shape: 0, dx: 7, dy: 7, dz: 7, height: 10, minHeight: 0, maxHeight: 10,
            });
        }
        st.container.segments[0].shape = parseInt(valById('lwe-ctr-seg-shape')) || 0;
        st.container.segments[0].dx = parseFloat(valById('lwe-ctr-seg-dx')) || st.container.dimDx;
        st.container.segments[0].dy = parseFloat(valById('lwe-ctr-seg-dy')) || st.container.dimDy;
        st.container.segments[0].dz = parseFloat(valById('lwe-ctr-seg-dz')) || st.container.dimDx;
        st.container.segments[0].height = st.container.depth;
        st.container.segments[0].maxHeight = st.container.depth;
    }

    function readCarrierForm() {
        st.carrier.viewName   = valById('lwe-car-name') || 'New Carrier';
        st.carrier.description = valById('lwe-car-desc') || '';
        st.carrier.dimDx      = parseFloat(valById('lwe-car-dx')) || 135;
        st.carrier.dimDy      = parseFloat(valById('lwe-car-dy')) || 497;
        st.carrier.dimDz      = parseFloat(valById('lwe-car-dz')) || 130;

        // Update selected site from site form
        if (st.selectedSiteIdx >= 0 && st.selectedSiteIdx < st.carrier.sites.length) {
            var site = st.carrier.sites[st.selectedSiteIdx];
            site.id = parseInt(valById('lwe-site-id')) || site.id;
            site.x  = parseFloat(valById('lwe-site-x')) || 0;
            site.y  = parseFloat(valById('lwe-site-y')) || 0;
            site.z  = parseFloat(valById('lwe-site-z')) || 0;
            site.dx = parseFloat(valById('lwe-site-dx')) || 127;
            site.dy = parseFloat(valById('lwe-site-dy')) || 86;
            site.labwareFile = valById('lwe-site-labware') || '';
            site.isCovered = !!$('#lwe-site-covered')?.checked;
            site.visible   = !!$('#lwe-site-visible')?.checked;
            site.snapBase  = !!$('#lwe-site-snap')?.checked;
            site.isStack   = !!$('#lwe-site-stack')?.checked;
            site.stackSize = parseInt(valById('lwe-site-stack-size')) || 1;
        }
    }

    // ================================================================
    //  Data → Form (populate)
    // ================================================================
    function populateRackForm() {
        var r = st.rack;
        valById('lwe-rack-name', r.viewName);
        valById('lwe-rack-desc', r.description);
        valById('lwe-rack-dx', r.dimDx.toFixed(2));
        valById('lwe-rack-dy', r.dimDy.toFixed(2));
        valById('lwe-rack-dz', r.dimDz.toFixed(2));
        valById('lwe-rack-rows', r.rows);
        valById('lwe-rack-cols', r.columns);
        valById('lwe-rack-col-spacing', r.dx.toFixed(2));
        valById('lwe-rack-row-spacing', r.dy.toFixed(2));
        valById('lwe-rack-bndry-x', r.bndryX.toFixed(2));
        valById('lwe-rack-bndry-y', r.bndryY.toFixed(2));
        valById('lwe-rack-hole-shape', r.holeShape);
        valById('lwe-rack-hole-x', r.holeX.toFixed(2));
        valById('lwe-rack-hole-y', r.holeY.toFixed(2));
        valById('lwe-rack-hole-z', r.holeZ.toFixed(2));
        valById('lwe-rack-stack-ht', r.stackHt.toFixed(2));

        // Well count
        var wcEl = $('#lwe-rack-well-count');
        if (wcEl) wcEl.textContent = (r.rows * r.columns) + ' wells (' + r.rows + '×' + r.columns + ')';
    }

    function populateContainerForm() {
        var c = st.container;
        valById('lwe-ctr-shape', c.shape);
        valById('lwe-ctr-depth', c.depth.toFixed(2));
        valById('lwe-ctr-dx', c.dimDx.toFixed(2));
        valById('lwe-ctr-dy', c.dimDy.toFixed(2));
        valById('lwe-ctr-base-thick', c.baseThickness.toFixed(2));

        var lldEl = $('#lwe-ctr-lld-enable');
        if (lldEl) lldEl.checked = c.lldEnabled;
        valById('lwe-ctr-lld-height', c.lldSeekHeight.toFixed(2));

        // First segment
        if (c.segments.length > 0) {
            var seg = c.segments[0];
            valById('lwe-ctr-seg-shape', seg.shape);
            valById('lwe-ctr-seg-dx', seg.dx.toFixed(2));
            valById('lwe-ctr-seg-dy', seg.dy.toFixed(2));
            valById('lwe-ctr-seg-dz', seg.dz.toFixed(2));
        }

        // Segment list
        updateSegmentList();

        // Volume
        updateVolumeDisplay();
    }

    function populateCarrierForm() {
        var cr = st.carrier;
        valById('lwe-car-name', cr.viewName);
        valById('lwe-car-desc', cr.description);
        valById('lwe-car-dx', cr.dimDx.toFixed(2));
        valById('lwe-car-dy', cr.dimDy.toFixed(2));
        valById('lwe-car-dz', cr.dimDz.toFixed(2));
    }

    // ================================================================
    //  Segment List (Container mode)
    // ================================================================
    function updateSegmentList() {
        var list = $('#lwe-seg-list');
        if (!list) return;
        list.innerHTML = '';

        for (var i = 0; i < st.container.segments.length; i++) {
            var seg = st.container.segments[i];
            var item = document.createElement('div');
            item.className = 'lwe-seg-item';
            item.innerHTML =
                '<span class="lwe-seg-num">' + (i + 1) + '</span>' +
                '<span class="lwe-seg-type">' + (SHAPE_LABELS[seg.shape] || 'Unknown') + '</span>' +
                '<span class="lwe-seg-dims">' +
                seg.dx.toFixed(1) + '×' + seg.dy.toFixed(1) +
                ' h=' + (seg.maxHeight - seg.minHeight).toFixed(1) +
                '</span>' +
                '<button class="lwe-seg-del" data-idx="' + i + '" title="Remove segment">' +
                '<i class="fas fa-times"></i></button>';
            list.appendChild(item);
        }

        // Delete handlers
        list.querySelectorAll('.lwe-seg-del').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var idx = parseInt(btn.dataset.idx);
                if (st.container.segments.length > 1) {
                    st.container.segments.splice(idx, 1);
                    recalcSegmentHeights();
                    updateSegmentList();
                    regeneratePreview();
                }
            });
        });
    }

    function recalcSegmentHeights() {
        var totalDepth = st.container.depth;
        var segCount = st.container.segments.length;
        if (segCount === 0) return;

        var hEach = totalDepth / segCount;
        var y = 0;
        for (var i = 0; i < segCount; i++) {
            st.container.segments[i].minHeight = round3val(y);
            y += hEach;
            st.container.segments[i].maxHeight = round3val(y);
            st.container.segments[i].height = round3val(hEach);
        }
    }

    function updateVolumeDisplay() {
        var el = $('#lwe-ctr-volume');
        if (!el) return;
        var vol = calcContainerVolume(st.container);
        el.textContent = vol.toFixed(2) + ' µL';
    }

    function calcContainerVolume(ctr) {
        var totalVol = 0;
        for (var i = 0; i < ctr.segments.length; i++) {
            var seg = ctr.segments[i];
            var h = seg.maxHeight - seg.minHeight;
            if (h <= 0) continue;

            switch (seg.shape) {
                case SHAPE.CYLINDER:
                case SHAPE.ROUND_BASE:
                    var r = (seg.dz || seg.dx) / 2;
                    totalVol += Math.PI * r * r * h;
                    break;
                case SHAPE.RECTANGLE:
                    totalVol += seg.dx * seg.dy * h;
                    break;
                case SHAPE.VCONE:
                case SHAPE.VCONE_BASE:
                case SHAPE.INVERTED_VCONE:
                    var r2 = (seg.dz || seg.dx) / 2;
                    totalVol += (1 / 3) * Math.PI * r2 * r2 * h;
                    break;
                default:
                    totalVol += seg.dx * seg.dy * h;
            }
        }
        return totalVol; // in mm³ ≈ µL
    }

    // ================================================================
    //  Wire Form Handlers
    // ================================================================
    function wireRackForm() {
        // Auto-update on change
        var fields = [
            'lwe-rack-name', 'lwe-rack-desc', 'lwe-rack-dx', 'lwe-rack-dy', 'lwe-rack-dz',
            'lwe-rack-rows', 'lwe-rack-cols', 'lwe-rack-col-spacing', 'lwe-rack-row-spacing',
            'lwe-rack-bndry-x', 'lwe-rack-bndry-y', 'lwe-rack-hole-shape',
            'lwe-rack-hole-x', 'lwe-rack-hole-y', 'lwe-rack-hole-z', 'lwe-rack-stack-ht',
        ];
        fields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readRackForm();
                regeneratePreview();
                st.dirty = true;
            });
        });
    }

    function wireContainerForm() {
        var fields = [
            'lwe-ctr-shape', 'lwe-ctr-depth', 'lwe-ctr-dx', 'lwe-ctr-dy',
            'lwe-ctr-base-thick', 'lwe-ctr-lld-height',
            'lwe-ctr-seg-shape', 'lwe-ctr-seg-dx', 'lwe-ctr-seg-dy', 'lwe-ctr-seg-dz',
        ];
        fields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readContainerForm();
                updateVolumeDisplay();
                regeneratePreview();
                st.dirty = true;
            });
        });

        // LLD checkbox
        var lldEl = $('#lwe-ctr-lld-enable');
        if (lldEl) lldEl.addEventListener('change', function() {
            readContainerForm();
            st.dirty = true;
        });

        // Add segment button
        bindClick('#lwe-add-segment', function() {
            var totalDepth = st.container.depth;
            st.container.segments.push({
                shape: 0,
                dx: st.container.dimDx,
                dy: st.container.dimDy,
                dz: st.container.dimDx,
                height: 0,
                minHeight: totalDepth / 2,
                maxHeight: totalDepth,
            });
            recalcSegmentHeights();
            updateSegmentList();
            regeneratePreview();
            st.dirty = true;
        });
    }

    function wireCarrierForm() {
        var fields = [
            'lwe-car-name', 'lwe-car-desc', 'lwe-car-dx', 'lwe-car-dy', 'lwe-car-dz',
        ];
        fields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readCarrierForm();
                regeneratePreview();
                st.dirty = true;
            });
        });

        // Site form fields
        var siteFields = [
            'lwe-site-id', 'lwe-site-x', 'lwe-site-y', 'lwe-site-z',
            'lwe-site-dx', 'lwe-site-dy', 'lwe-site-labware',
            'lwe-site-stack-size',
        ];
        siteFields.forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readCarrierForm();
                regeneratePreview();
                st.dirty = true;
            });
        });

        // Site checkboxes
        ['lwe-site-covered', 'lwe-site-visible', 'lwe-site-snap', 'lwe-site-stack'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readCarrierForm();
                regeneratePreview();
                st.dirty = true;
            });
        });

        // Add site
        bindClick('#lwe-add-site', function() {
            var nextId = st.carrier.sites.length + 1;
            var lastSite = st.carrier.sites[st.carrier.sites.length - 1] || { x: 4, y: 0, z: 112, dx: 127, dy: 86 };
            st.carrier.sites.push({
                id: nextId,
                label: String(nextId),
                x: lastSite.x,
                y: lastSite.y + lastSite.dy + 10,
                z: lastSite.z,
                dx: lastSite.dx,
                dy: lastSite.dy,
                labwareFile: '',
                isCovered: false,
                visible: true,
                snapBase: true,
                isStack: false,
                stackSize: 1,
            });
            st.selectedSiteIdx = st.carrier.sites.length - 1;
            populateCarrierSiteForm(st.selectedSiteIdx);
            regeneratePreview();
            st.dirty = true;
        });

        // Delete selected site
        bindClick('#lwe-del-site', function() {
            if (st.selectedSiteIdx >= 0 && st.carrier.sites.length > 1) {
                st.carrier.sites.splice(st.selectedSiteIdx, 1);
                st.selectedSiteIdx = Math.min(st.selectedSiteIdx, st.carrier.sites.length - 1);
                populateCarrierSiteForm(st.selectedSiteIdx);
                regeneratePreview();
                st.dirty = true;
            }
        });
    }

    // ================================================================
    //  Site Interaction (Click to select in 3D)
    // ================================================================
    function wireSiteInteraction() {
        var canvas = $('#lwe-canvas');
        if (!canvas) return;

        canvas.addEventListener('click', function(e) {
            if (st.mode !== 'carrier' || st.rulerActive) return;
            if (st.siteBoxes.length === 0) return;

            var rect = canvas.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, st.camera);
            var hits = raycaster.intersectObjects(st.siteBoxes, false);
            if (hits.length > 0 && hits[0].object.userData.siteIdx !== undefined) {
                selectSite(hits[0].object.userData.siteIdx);
            }
        });

        // Hover effect
        canvas.addEventListener('mousemove', function(e) {
            if (st.mode !== 'carrier') return;
            if (st.siteBoxes.length === 0) return;

            var rect = canvas.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );

            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, st.camera);
            var hits = raycaster.intersectObjects(st.siteBoxes, false);
            var newHovered = hits.length > 0 ? hits[0].object.userData.siteIdx : -1;
            if (newHovered !== st.hoveredSiteIdx) {
                st.hoveredSiteIdx = newHovered;
                canvas.style.cursor = newHovered >= 0 ? 'pointer' : '';
                regeneratePreview();
            }
        });
    }

    // ================================================================
    //  File Controls (New, Open, Save, Export)
    // ================================================================
    function wireFileControls() {
        // New
        bindClick('#lwe-new-btn', function() {
            var mode = st.mode;
            if (mode === 'rack') {
                st.rack = defaultRack();
                populateRackForm();
            } else if (mode === 'container') {
                st.container = defaultContainer();
                populateContainerForm();
            } else if (mode === 'carrier') {
                st.carrier = defaultCarrier();
                st.selectedSiteIdx = 0;
                populateCarrierForm();
                populateCarrierSiteForm(0);
            }
            st.fileName = '';
            st.dirty = false;
            setStatus('New ' + mode + ' created');
            regeneratePreview();
        });

        // Open file
        var fileInput = $('#lwe-file-input');
        bindClick('#lwe-open-btn', function() {
            if (fileInput) fileInput.click();
        });

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                readLabwareFile(file);
                fileInput.value = '';
            });
        }

        // Save
        bindClick('#lwe-save-btn', function() {
            saveCurrentFile();
        });

        // Export .x
        bindClick('#lwe-export-x-btn', function() {
            exportAsXFile();
        });

        // Drag and drop
        var host = $('#labware-editor-host');
        if (host) {
            var dragCounter = 0;
            var dropzone = $('#lwe-dropzone');

            host.addEventListener('dragenter', function(e) {
                e.preventDefault();
                dragCounter++;
                if (dragCounter === 1 && dropzone) dropzone.classList.remove('viewer-hidden');
            });
            host.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            host.addEventListener('dragleave', function(e) {
                e.preventDefault();
                dragCounter--;
                if (dragCounter <= 0) {
                    dragCounter = 0;
                    if (dropzone) dropzone.classList.add('viewer-hidden');
                }
            });
            host.addEventListener('drop', function(e) {
                e.preventDefault();
                dragCounter = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');
                var files = e.dataTransfer.files;
                if (files.length > 0) readLabwareFile(files[0]);
            });
        }
    }

    function readLabwareFile(file) {
        var name = file.name.toLowerCase();
        var reader = new FileReader();
        reader.onload = function(ev) {
            var text = ev.target.result;
            // Handle UTF-16LE BOM
            if (text.charCodeAt(0) === 0xFFFE || text.charCodeAt(0) === 0xFEFF ||
                (text.length > 4 && text.charCodeAt(1) === 0)) {
                var reader2 = new FileReader();
                reader2.onload = function(ev2) { processLabwareText(ev2.target.result, name, file.name); };
                reader2.readAsText(file, 'utf-16le');
                return;
            }
            processLabwareText(text, name, file.name);
        };
        reader.readAsText(file, 'utf-8');
    }

    function processLabwareText(text, nameLower, originalName) {
        st.fileContent = text;
        st.fileName = originalName;

        if (nameLower.endsWith('.rck')) {
            st.rack = parseRckFile(text);
            switchMode('rack');
            populateRackForm();
            setStatus('Loaded rack: ' + originalName);
        } else if (nameLower.endsWith('.ctr')) {
            st.container = parseCtrFile(text);
            switchMode('container');
            populateContainerForm();
            setStatus('Loaded container: ' + originalName);
        } else if (nameLower.endsWith('.tml')) {
            st.carrier = parseTmlFile(text);
            st.selectedSiteIdx = st.carrier.sites.length > 0 ? 0 : -1;
            switchMode('carrier');
            populateCarrierForm();
            if (st.selectedSiteIdx >= 0) populateCarrierSiteForm(0);
            setStatus('Loaded carrier: ' + originalName);
        } else {
            setStatus('Unsupported file type: ' + originalName, true);
            return;
        }

        st.dirty = false;
        regeneratePreview();
    }

    function saveCurrentFile() {
        var content, ext, defaultName;

        if (st.mode === 'rack') {
            readRackForm();
            content = writeRckFile(st.rack);
            ext = '.rck';
            defaultName = (st.rack.viewName || 'rack').replace(/[^a-zA-Z0-9_ -]/g, '_');
        } else if (st.mode === 'container') {
            readContainerForm();
            content = writeCtrFile(st.container);
            ext = '.ctr';
            defaultName = 'container';
        } else if (st.mode === 'carrier') {
            readCarrierForm();
            content = writeTmlFile(st.carrier);
            ext = '.tml';
            defaultName = (st.carrier.viewName || 'carrier').replace(/[^a-zA-Z0-9_ -]/g, '_');
        } else {
            return;
        }

        var fileName = st.fileName || (defaultName + ext);
        downloadText(content, fileName);
        st.dirty = false;
        setStatus('Saved: ' + fileName);
    }

    function exportAsXFile() {
        if (!st.model) {
            setStatus('No model to export. Generate a preview first.', true);
            return;
        }

        var LGM = window.LabwareGenModule;
        if (LGM && LGM.exportToXFile) {
            var name = st.mode === 'rack' ? st.rack.viewName :
                       st.mode === 'carrier' ? st.carrier.viewName : 'container';
            var xContent = LGM.exportToXFile(st.model, name);
            if (xContent) {
                var safeName = (name || 'labware').replace(/[^a-zA-Z0-9_ -]/g, '_');
                downloadText(xContent, safeName + '.x');
                setStatus('Exported: ' + safeName + '.x');
            }
        } else {
            // Fallback: simple .x export from Three.js geometry
            exportModelToX();
        }
    }

    /** Fallback .x file exporter using raw Three.js geometry */
    function exportModelToX() {
        if (!st.model) return;

        var name = st.mode === 'rack' ? st.rack.viewName :
                   st.mode === 'carrier' ? st.carrier.viewName : 'container';
        var safeName = (name || 'labware').replace(/[^a-zA-Z0-9_ -]/g, '_');

        var meshes = [];
        st.model.traverse(function(c) {
            if (c.isMesh && c.geometry) meshes.push(c);
        });

        var xLines = [];
        xLines.push('xof 0303txt 0032');
        xLines.push('');

        var frameIdx = 0;
        meshes.forEach(function(mesh) {
            var geo = mesh.geometry;
            if (!geo.attributes || !geo.attributes.position) return;

            var pos = geo.attributes.position;
            var idx = geo.index;
            var vertCount = pos.count;
            var faceCount = idx ? idx.count / 3 : vertCount / 3;

            xLines.push('Frame Frame' + frameIdx + ' {');
            xLines.push('  FrameTransformMatrix {');
            var m = mesh.matrixWorld.elements;
            xLines.push('    ' + m[0].toFixed(6) + ',' + m[1].toFixed(6) + ',' + m[2].toFixed(6) + ',' + m[3].toFixed(6) + ',');
            xLines.push('    ' + m[4].toFixed(6) + ',' + m[5].toFixed(6) + ',' + m[6].toFixed(6) + ',' + m[7].toFixed(6) + ',');
            xLines.push('    ' + m[8].toFixed(6) + ',' + m[9].toFixed(6) + ',' + m[10].toFixed(6) + ',' + m[11].toFixed(6) + ',');
            xLines.push('    ' + m[12].toFixed(6) + ',' + m[13].toFixed(6) + ',' + m[14].toFixed(6) + ',' + m[15].toFixed(6) + ';;');
            xLines.push('  }');
            xLines.push('  Mesh Mesh' + frameIdx + ' {');
            xLines.push('    ' + vertCount + ';');

            for (var v = 0; v < vertCount; v++) {
                var x = pos.getX(v), y = pos.getY(v), z = pos.getZ(v);
                var sep = v < vertCount - 1 ? ',' : ';';
                xLines.push('    ' + x.toFixed(6) + ';' + y.toFixed(6) + ';' + z.toFixed(6) + ';' + sep);
            }

            xLines.push('    ' + Math.floor(faceCount) + ';');
            for (var f = 0; f < faceCount; f++) {
                var i0, i1, i2;
                if (idx) {
                    i0 = idx.getX(f * 3);
                    i1 = idx.getX(f * 3 + 1);
                    i2 = idx.getX(f * 3 + 2);
                } else {
                    i0 = f * 3; i1 = f * 3 + 1; i2 = f * 3 + 2;
                }
                var sep = f < faceCount - 1 ? ',' : ';';
                xLines.push('    3;' + i0 + ',' + i1 + ',' + i2 + ';;' + sep);
            }

            // Material
            var color = mesh.material && mesh.material.color ? mesh.material.color : new THREE.Color(0x808080);
            xLines.push('    MeshMaterialList {');
            xLines.push('      1;');
            xLines.push('      ' + Math.floor(faceCount) + ';');
            for (var f2 = 0; f2 < faceCount; f2++) {
                xLines.push('      0' + (f2 < faceCount - 1 ? ',' : ';'));
            }
            xLines.push('      Material {');
            xLines.push('        ' + color.r.toFixed(6) + ';' + color.g.toFixed(6) + ';' + color.b.toFixed(6) + ';1.000000;;');
            xLines.push('        0.000000;');
            xLines.push('        0.000000;0.000000;0.000000;;');
            xLines.push('        0.000000;0.000000;0.000000;;');
            xLines.push('      }');
            xLines.push('    }');

            xLines.push('  }');
            xLines.push('}');
            xLines.push('');
            frameIdx++;
        });

        downloadText(xLines.join('\n'), safeName + '.x');
        setStatus('Exported: ' + safeName + '.x');
    }

    // ================================================================
    //  Toolbar
    // ================================================================
    function wireToolbar() {
        var body = $('#lwe-vt-body');
        var toggle = $('#lwe-vt-toggle');
        if (toggle && body) {
            toggle.addEventListener('click', function () {
                st.toolbarCollapsed = !st.toolbarCollapsed;
                body.classList.toggle('collapsed', st.toolbarCollapsed);
            });
        }

        // Reset camera
        bindClick('#lwe-vt-reset-cam', function () {
            if (!st.model) return;
            var box = new THREE.Box3().setFromObject(st.model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            st.controls.target.copy(center);
            st.camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim);
            st.controls.update();
        });

        // Zoom fit
        bindClick('#lwe-vt-zoom-fit', function () {
            if (!st.model) return;
            var box = new THREE.Box3().setFromObject(st.model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            st.controls.target.copy(center);
            var dist = maxDim * 1.5;
            st.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.7);
            st.controls.update();
        });

        // Top-down view
        bindClick('#lwe-vt-topdown', function () {
            if (!st.model) return;
            var box = new THREE.Box3().setFromObject(st.model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.z);
            st.controls.target.copy(center);
            st.camera.position.set(center.x, center.y + maxDim * 2, center.z + 0.01);
            st.controls.update();
        });

        // Wireframe
        bindClick('#lwe-vt-wireframe', function () {
            st.wireframe = !st.wireframe;
            if (st.model) {
                st.model.traverse(function (c) {
                    if (c.isMesh && c.material) {
                        if (Array.isArray(c.material)) c.material.forEach(m => { m.wireframe = st.wireframe; });
                        else c.material.wireframe = st.wireframe;
                    }
                });
            }
            var btn = $('#lwe-vt-wireframe');
            if (btn) btn.classList.toggle('is-active', st.wireframe);
        });

        // Perspective toggle
        bindClick('#lwe-vt-perspective', function () {
            st.isPerspective = !st.isPerspective;
            var btn = $('#lwe-vt-perspective');
            if (btn) btn.classList.toggle('is-active', !st.isPerspective);
        });

        // Grid toggle
        bindClick('#lwe-btn-grid', function () {
            st.gridVisible = !st.gridVisible;
            var grid = st.scene ? st.scene.getObjectByName('__lwegrid__') : null;
            if (grid) grid.visible = st.gridVisible;
            var btn = $('#lwe-btn-grid');
            if (btn) btn.classList.toggle('grid-off', !st.gridVisible);
        });

        // Zoom in/out
        bindClick('#lwe-vt-zoom-in', function () {
            if (st.controls) st.controls.dollyIn(1.3);
            if (st.controls) st.controls.update();
        });
        bindClick('#lwe-vt-zoom-out', function () {
            if (st.controls) st.controls.dollyOut(1.3);
            if (st.controls) st.controls.update();
        });

        // Pan mode
        bindClick('#lwe-vt-pan', function () {
            st.isPanning = !st.isPanning;
            if (st.controls) {
                st.controls.mouseButtons.LEFT = st.isPanning
                    ? THREE.MOUSE.PAN
                    : THREE.MOUSE.ROTATE;
            }
            var btn = $('#lwe-vt-pan');
            if (btn) btn.classList.toggle('is-active', st.isPanning);
        });

        // Ruler
        wireRuler();

        // Make toolbar draggable
        makeDraggable($('#lwe-toolbar'), $('#lwe-vt-grab-handle'));
    }

    // ================================================================
    //  Ruler Tool
    // ================================================================
    function wireRuler() {
        bindClick('#lwe-vt-ruler', function () {
            st.rulerActive = !st.rulerActive;
            var btn = $('#lwe-vt-ruler');
            if (btn) btn.classList.toggle('is-active', st.rulerActive);
            var readout = $('#lwe-ruler-readout');

            if (st.rulerActive) {
                if (st.controls) {
                    st._savedMouseButtons = {
                        LEFT: st.controls.mouseButtons.LEFT,
                        MIDDLE: st.controls.mouseButtons.MIDDLE,
                        RIGHT: st.controls.mouseButtons.RIGHT,
                    };
                    st.controls.mouseButtons.LEFT = -1;
                }
                if (st.renderer) st.renderer.domElement.style.cursor = 'crosshair';
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = 'Click first point on model…';
                }
            } else {
                if (st.controls && st._savedMouseButtons) {
                    st.controls.mouseButtons.LEFT = st._savedMouseButtons.LEFT;
                    st.controls.mouseButtons.MIDDLE = st._savedMouseButtons.MIDDLE;
                    st.controls.mouseButtons.RIGHT = st._savedMouseButtons.RIGHT;
                    st._savedMouseButtons = null;
                }
                clearRuler();
                st.rulerAxisLock = null;
                if (st.renderer) st.renderer.domElement.style.cursor = '';
                if (readout) readout.style.display = 'none';
            }
        });

        document.addEventListener('pointerdown', function (e) {
            if (!st.rulerActive || !st.renderer) return;
            var cvs = st.renderer.domElement;
            if (e.target !== cvs) return;

            if (e.metaKey || e.ctrlKey) {
                if (st.controls) st.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
                var onUp = function () {
                    if (st.rulerActive && st.controls) st.controls.mouseButtons.LEFT = -1;
                    document.removeEventListener('pointerup', onUp);
                };
                document.addEventListener('pointerup', onUp);
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            var point = rulerRaycast(e);
            if (!point) return;
            var readout = $('#lwe-ruler-readout');

            if (!st.rulerStart) {
                clearRuler();
                st.rulerStart = point;
                st.rulerAxisLock = null;
                addRulerMarker(point);
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = 'Move to second point… (X/Y/Z to lock axis)';
                }
            } else {
                var lockedPt = applyAxisLock(st.rulerStart, point);
                st.rulerEnd = lockedPt;
                if (st.rulerMarkers.length > 1) {
                    var lm = st.rulerMarkers.pop();
                    st.scene.remove(lm);
                    lm.geometry.dispose();
                    lm.material.dispose();
                }
                addRulerMarker(lockedPt);
                drawRulerLine(st.rulerStart, lockedPt);
                var dist = st.rulerStart.distanceTo(lockedPt);
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = '\ud83d\udccf ' + dist.toFixed(2) + ' mm' + axisLabel() +
                        '  — click to start new measurement';
                }
                st.rulerStart = null;
                st.rulerEnd = null;
                st.rulerAxisLock = null;
            }
        }, true);

        document.addEventListener('pointermove', function (e) {
            if (!st.rulerActive || !st.rulerStart || !st.renderer) return;
            var cvs = st.renderer.domElement;
            if (e.target !== cvs) return;
            var point = rulerRaycast(e);
            if (!point) return;
            var lockedPt = applyAxisLock(st.rulerStart, point);
            drawRulerLine(st.rulerStart, lockedPt);
            if (st.rulerMarkers.length > 1) {
                st.rulerMarkers[1].position.copy(lockedPt);
            } else {
                addRulerMarker(lockedPt);
            }
            var dist = st.rulerStart.distanceTo(lockedPt);
            var readout = $('#lwe-ruler-readout');
            if (readout) {
                readout.style.display = 'block';
                readout.textContent = '\ud83d\udccf ' + dist.toFixed(2) + ' mm' + axisLabel();
            }
        }, false);

        document.addEventListener('keydown', function (e) {
            if (!st.rulerActive || !st.rulerStart) return;
            var key = e.key.toLowerCase();
            if (key === 'x' || key === 'y' || key === 'z') {
                st.rulerAxisLock = (st.rulerAxisLock === key) ? null : key;
                e.preventDefault();
            } else if (key === 'escape') {
                clearRuler();
                st.rulerAxisLock = null;
                var rd = $('#lwe-ruler-readout');
                if (rd) rd.textContent = 'Click first point on model…';
            }
        }, false);
    }

    function rulerRaycast(e) {
        if (!st.renderer || !st.model) return null;
        var cvs = st.renderer.domElement;
        var rect = cvs.getBoundingClientRect();
        var mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        var raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, st.camera);
        var meshes = [];
        st.model.traverse(function (c) { if (c.isMesh) meshes.push(c); });
        var hits = raycaster.intersectObjects(meshes, false);
        return hits.length > 0 ? hits[0].point.clone() : null;
    }

    function applyAxisLock(start, end) {
        if (!st.rulerAxisLock || !start) return end;
        var locked = end.clone();
        if (st.rulerAxisLock === 'x') { locked.y = start.y; locked.z = start.z; }
        else if (st.rulerAxisLock === 'y') { locked.x = start.x; locked.z = start.z; }
        else if (st.rulerAxisLock === 'z') { locked.x = start.x; locked.y = start.y; }
        return locked;
    }

    function axisLabel() {
        return st.rulerAxisLock ? ' [locked ' + st.rulerAxisLock.toUpperCase() + ']' : '';
    }

    function clearRuler() {
        if (st.rulerLine && st.scene) {
            st.scene.remove(st.rulerLine);
            if (st.rulerLine.geometry) st.rulerLine.geometry.dispose();
            if (st.rulerLine.material) st.rulerLine.material.dispose();
            st.rulerLine = null;
        }
        st.rulerMarkers.forEach(function (m) {
            if (st.scene) st.scene.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
        });
        st.rulerMarkers = [];
        st.rulerStart = null;
        st.rulerEnd = null;
    }

    function addRulerMarker(point) {
        var geo = new THREE.SphereGeometry(0.4, 12, 8);
        var mat = new THREE.MeshBasicMaterial({ color: 0xff4444, depthTest: false });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(point);
        mesh.renderOrder = 999;
        st.scene.add(mesh);
        st.rulerMarkers.push(mesh);
    }

    function drawRulerLine(a, b) {
        if (st.rulerLine && st.scene) {
            st.scene.remove(st.rulerLine);
            if (st.rulerLine.geometry) st.rulerLine.geometry.dispose();
            if (st.rulerLine.material) st.rulerLine.material.dispose();
        }
        var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
        var mat = new THREE.LineBasicMaterial({ color: 0xff4444, depthTest: false, linewidth: 2 });
        var line = new THREE.Line(geo, mat);
        line.renderOrder = 999;
        st.scene.add(line);
        st.rulerLine = line;
    }

    // ================================================================
    //  Screenshot
    // ================================================================
    function saveScreenshot(format, opts) {
        if (!st.renderer || !st.scene || !st.camera) return;
        var showGrid = opts ? opts.showGrid : true;
        var showBg   = opts ? opts.showBg   : true;

        var grid = st.scene.getObjectByName('__lwegrid__');
        var origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && st.gridVisible;

        var origBg = st.scene.background;
        if (!showBg) {
            st.scene.background = null;
            st.renderer.setClearColor(0x000000, 0);
        }

        st.renderer.render(st.scene, st.camera);
        var canvas = st.renderer.domElement;
        var name = st.mode === 'rack' ? st.rack.viewName :
                   st.mode === 'carrier' ? st.carrier.viewName : 'container';
        var fileName = (name || 'labware_screenshot').replace(/[^a-zA-Z0-9_ -]/g, '_');

        if (format === 'jpg') {
            canvas.toBlob(function(blob) { if (blob) downloadBlob(blob, fileName + '.jpg'); }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function(blob) { if (blob) downloadBlob(blob, fileName + '.png'); }, 'image/png');
        }

        if (grid) grid.visible = origGridVis;
        st.scene.background = origBg;
        if (!showBg) st.renderer.setClearColor(st.isDark ? DARK_BG : LIGHT_BG, 1);
        st.renderer.render(st.scene, st.camera);
    }

    function screenshotPreviewDataURL(opts) {
        if (!st.renderer || !st.scene || !st.camera) return '';
        var showGrid = opts ? opts.showGrid : true;
        var showBg   = opts ? opts.showBg   : true;

        var grid = st.scene.getObjectByName('__lwegrid__');
        var origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && st.gridVisible;

        var origBg = st.scene.background;
        if (!showBg) {
            st.scene.background = null;
            st.renderer.setClearColor(0x000000, 0);
        }

        st.renderer.render(st.scene, st.camera);
        var dataURL = st.renderer.domElement.toDataURL('image/png');

        if (grid) grid.visible = origGridVis;
        st.scene.background = origBg;
        if (!showBg) st.renderer.setClearColor(st.isDark ? DARK_BG : LIGHT_BG, 1);
        st.renderer.render(st.scene, st.camera);
        return dataURL;
    }

    // ================================================================
    //  Gizmo + Camera Display
    // ================================================================
    function drawGizmo() {
        var canvas = $('#lwe-gizmo-canvas');
        if (!canvas || !st.camera) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        var cam = st.camera;
        var dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        var right = new THREE.Vector3();
        right.crossVectors(cam.up, dir).normalize();
        var up = new THREE.Vector3();
        up.crossVectors(dir, right).normalize();

        var cx = w / 2, cy = h / 2;
        var len = Math.min(w, h) * 0.35;

        [
            { label: 'X', color: '#e74c3c', v: new THREE.Vector3(1, 0, 0) },
            { label: 'Y', color: '#2ecc71', v: new THREE.Vector3(0, 1, 0) },
            { label: 'Z', color: '#3498db', v: new THREE.Vector3(0, 0, 1) },
        ].forEach(function (a) {
            var px = a.v.dot(right) * len;
            var py = -a.v.dot(up) * len;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + px, cy + py);
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = a.color;
            ctx.font = 'bold 9px sans-serif';
            ctx.fillText(a.label, cx + px * 1.15 - 3, cy + py * 1.15 + 3);
        });
    }

    function updateCamDisplay() {
        var el = $('#lwe-cam-display');
        if (!el || !st.camera) return;
        var p = st.camera.position;
        el.textContent = 'X: ' + p.x.toFixed(1) + '  Y: ' + p.y.toFixed(1) + '  Z: ' + p.z.toFixed(1);
    }

    // ================================================================
    //  Helpers
    // ================================================================
    function bindClick(sel, fn) {
        var el = $(sel);
        if (el) el.addEventListener('click', fn);
    }

    function valById(id, val) {
        var el = document.getElementById(id);
        if (!el) return '';
        if (val !== undefined) { el.value = val; return val; }
        return el.value;
    }

    function setStatus(msg, isError) {
        var el = $('#lwe-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'lwe-status' + (isError ? ' lwe-status-err' : '');
    }

    function round3(v) {
        return (Math.round(parseFloat(v) * 1000) / 1000).toString();
    }

    function round3val(v) {
        return Math.round(v * 1000) / 1000;
    }

    function intToColor(intVal) {
        var r = (intVal >> 16) & 0xff;
        var g = (intVal >> 8) & 0xff;
        var b = intVal & 0xff;
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }

    function colorToInt(hex) {
        if (!hex || hex[0] !== '#') return '16777215';
        var val = parseInt(hex.slice(1), 16);
        return String(val);
    }

    function downloadText(content, filename) {
        var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        downloadBlob(blob, filename);
    }

    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function makeDraggable(panel, handle) {
        if (!panel || !handle) return;
        var dragging = false, startX, startY, origX, origY;
        handle.addEventListener('pointerdown', function (e) {
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            var rect = panel.getBoundingClientRect();
            origX = rect.left; origY = rect.top;
            handle.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        handle.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            panel.style.position = 'fixed';
            panel.style.left = (origX + e.clientX - startX) + 'px';
            panel.style.top = (origY + e.clientY - startY) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
        handle.addEventListener('pointerup', function () { dragging = false; });
        handle.addEventListener('pointercancel', function () { dragging = false; });
    }

    // ================================================================
    //  Screenshot Button
    // ================================================================
    function wireScreenshotButton() {
        bindClick('#lwe-screenshot', function() {
            if (typeof window.openScreenshotModal === 'function') {
                window.openScreenshotModal('labware-editor');
            } else {
                saveScreenshot('png', { showGrid: true, showBg: true });
            }
        });
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.LabwareEditorModule = {
        init: initLabwareEditor,
        updateTheme: updateTheme,
        saveScreenshot: saveScreenshot,
        screenshotPreviewDataURL: screenshotPreviewDataURL,
    };

})();
