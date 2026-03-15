/* ============================================================
   Carrier Editor — Create, edit and modify Hamilton carrier
   definitions (.tml) with 3D site visualization, snap regions,
   and full file I/O.
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
    const CARRIER_COLOR = 0x607080;

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

        dirty: false,

        // Current carrier data
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
    function initCarrierEditor() {
        var host = $('#carrier-editor-host');
        if (!host) return;

        st.isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        var canvas = $('#ce-canvas');
        if (!canvas) return;

        var w = canvas.parentElement.clientWidth || 800;
        var h = canvas.parentElement.clientHeight || 600;

        // -- Scene --
        st.scene = new THREE.Scene();
        st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        st.camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
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
        st.controls = new THREE.OrbitControls(st.camera, canvas);
        st.controls.enableDamping = true;
        st.controls.dampingFactor = 0.12;
        st.controls.target.set(0, 0, 0);
        st.controls.update();

        // -- Lights --
        st.scene.add(new THREE.AmbientLight(0x808080));
        var d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(80, 150, 80);
        st.scene.add(d1);
        var d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-80, -30, -80);
        st.scene.add(d2);

        // -- Grid --
        var gc = st.isDark ? DARK_GRID : LIGHT_GRID;
        var grid = new THREE.GridHelper(600, 60, gc, gc);
        grid.name = '__cegrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = st.gridVisible;
        st.scene.add(grid);

        // -- Resize observer --
        var ro = new ResizeObserver(function () {
            var previewCol = host.querySelector('.ce-preview-col');
            if (!previewCol) return;
            var cw = previewCol.clientWidth;
            var ch = previewCol.clientHeight;
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
        st.carrier = defaultCarrier();

        // -- Wire UI --
        wireCarrierForm();
        wireToolbar();
        wireFileControls();
        wireSiteInteraction();
        wireScreenshotButton();

        // Initial preview
        st.selectedSiteIdx = 0;
        populateCarrierForm();
        populateCarrierSiteForm(0);
        regeneratePreview();

        setStatus('Ready');
    }

    // ================================================================
    //  Theme
    // ================================================================
    function updateTheme() {
        st.isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (st.scene) {
            st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);
        }
        var grid = st.scene ? st.scene.getObjectByName('__cegrid__') : null;
        if (grid) {
            var gc = st.isDark ? DARK_GRID : LIGHT_GRID;
            grid.material.color.setHex(gc);
        }
    }

    // ================================================================
    //  HxCfgFile Parser
    // ================================================================
    function parseHxCfg(text) {
        var map = {};
        var openIdx = text.indexOf('{');
        var closeIdx = text.lastIndexOf('}');
        if (openIdx < 0 || closeIdx < 0) return map;
        var body = text.substring(openIdx + 1, closeIdx);
        var entries = body.split(',\n');
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i].trim();
            if (!entry) continue;
            var parts = entry.split(',');
            if (parts.length >= 2) {
                var key = parts[0].trim();
                var val = parts.slice(1).join(',').trim();
                if (val.startsWith('"') && val.endsWith('",')) val = val.slice(1, -2);
                else if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                else if (val.endsWith(',')) val = val.slice(0, -1).trim();
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                map[key] = val;
            }
        }
        return map;
    }

    // ================================================================
    //  .tml Parser / Writer
    // ================================================================
    function parseTmlFile(text) {
        var cfg = parseHxCfg(text);
        var car = defaultCarrier();

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
        for (var i = 1; i <= propCnt; i++) {
            var propName = cfg['Property.' + i];
            var propVal  = cfg['PropertyValue.' + i];
            if (propName) car.properties.push({ name: propName, value: propVal || '' });
        }

        // Parse sites
        var siteCnt = parseInt(cfg['Site.Cnt']) || 0;
        car.sites = [];
        for (var i = 1; i <= siteCnt; i++) {
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
        for (var i = 0; i < car.categories.length; i++) {
            w('Category.' + i + '.Id', car.categories[i]);
        }
        w('Description', car.description);
        w('Dim.Dx', round3(car.dimDx));
        w('Dim.Dy', round3(car.dimDy));
        w('Dim.Dz', round3(car.dimDz));

        // Properties
        w('PropertyCnt', String(car.properties.length));
        for (var i = 0; i < car.properties.length; i++) {
            w('Property.' + (i + 1), car.properties[i].name);
            w('PropertyValue.' + (i + 1), car.properties[i].value);
        }

        w('ReadOnly', car.readOnly ? '1' : '0');

        // Sites
        for (var i = 0; i < car.sites.length; i++) {
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
        return '* $$author=CarrierEditor$$valid=1$$time=' + time + '$$checksum=00000000$$length=000$$';
    }

    // ================================================================
    //  3D Model Management
    // ================================================================
    function clearModel() {
        if (st.model && st.scene) {
            st.model.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(function (m) {
                            if (m.map) m.map.dispose();
                            m.dispose();
                        });
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            });
            st.scene.remove(st.model);
            st.model = null;
        }
        st.snapHelpers = [];
        st.siteBoxes = [];
    }

    function displayModel(group) {
        clearModel();
        st.model = group;
        st.scene.add(group);

        // Auto-center camera
        var box = new THREE.Box3().setFromObject(group);
        var center = box.getCenter(new THREE.Vector3());
        var size = box.getSize(new THREE.Vector3());
        var maxDim = Math.max(size.x, size.y, size.z);
        st.controls.target.copy(center);
        var dist = maxDim * 1.5;
        st.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.7);
        st.controls.update();

        updateSiteList();
    }

    function regeneratePreview() {
        generateCarrier3D(st.carrier);
    }

    // ================================================================
    //  Carrier 3D Generation with Snap Regions
    // ================================================================
    function generateCarrier3D(car) {
        var group = new THREE.Group();
        group.name = '__ce_model__';

        // -- Carrier body --
        var carW = car.dimDx;
        var carD = car.dimDy;
        var carH = car.dimDz;

        var bodyGeo = new THREE.BoxGeometry(carW, carH, carD);
        var bodyMat = new THREE.MeshPhongMaterial({
            color: CARRIER_COLOR,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.renderOrder = 1;
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
            var siteH = 5;

            var siteColor = SITE_COLORS[i % SITE_COLORS.length];
            var isSelected = i === st.selectedSiteIdx;
            var isHovered  = i === st.hoveredSiteIdx;

            if (isSelected) siteColor = SNAP_ACTIVE;
            else if (isHovered) siteColor = SNAP_HOVER;

            var siteGeo = new THREE.BoxGeometry(siteW, siteH, siteD);
            var siteMat = new THREE.MeshPhongMaterial({
                color: siteColor,
                transparent: true,
                opacity: isSelected ? 0.7 : 0.45,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            var siteMesh = new THREE.Mesh(siteGeo, siteMat);
            siteMesh.renderOrder = 2;
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

            // Snap indicator dots
            addSnapIndicators(group, site, siteColor);
        }

        displayModel(group);
        updateDimensionDisplay();
    }

    function addSnapIndicators(group, site, color) {
        var dotGeo = new THREE.SphereGeometry(1.5, 8, 8);
        var dotMat = new THREE.MeshBasicMaterial({ color: color, depthTest: false });
        var corners = [
            [site.x, site.z, site.y],
            [site.x + site.dx, site.z, site.y],
            [site.x, site.z, site.y + site.dy],
            [site.x + site.dx, site.z, site.y + site.dy],
        ];
        for (var i = 0; i < corners.length; i++) {
            var dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(corners[i][0], corners[i][1], corners[i][2]);
            dot.renderOrder = 50;
            group.add(dot);
            st.snapHelpers.push(dot);
        }
    }

    function createLabelCanvas(text, color) {
        var c = document.createElement('canvas');
        c.width = 128; c.height = 32;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, c.width / 2, c.height / 2);
        return c;
    }

    // ================================================================
    //  Dimension Display
    // ================================================================
    function updateDimensionDisplay() {
        var el = $('#ce-dim-display');
        if (!el) return;
        var cr = st.carrier;
        el.textContent = cr.dimDx.toFixed(1) + ' × ' + cr.dimDy.toFixed(1) + ' × ' + cr.dimDz.toFixed(1) + ' mm';
    }

    // ================================================================
    //  Site List
    // ================================================================
    function updateSiteList() {
        var list = $('#ce-site-list');
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

        valById('ce-site-id', site.id);
        valById('ce-site-x', site.x.toFixed(2));
        valById('ce-site-y', site.y.toFixed(2));
        valById('ce-site-z', site.z.toFixed(2));
        valById('ce-site-dx', site.dx.toFixed(2));
        valById('ce-site-dy', site.dy.toFixed(2));

        var labwareEl = $('#ce-site-labware');
        if (labwareEl) labwareEl.value = site.labwareFile || '';

        var coveredEl = $('#ce-site-covered');
        if (coveredEl) coveredEl.checked = site.isCovered;

        var visibleEl = $('#ce-site-visible');
        if (visibleEl) visibleEl.checked = site.visible;

        var snapEl = $('#ce-site-snap');
        if (snapEl) snapEl.checked = site.snapBase;

        var stackEl = $('#ce-site-stack');
        if (stackEl) stackEl.checked = site.isStack;

        valById('ce-site-stack-size', site.stackSize);
    }

    // ================================================================
    //  Form → Data
    // ================================================================
    function readCarrierForm() {
        st.carrier.viewName   = valById('ce-car-name') || 'New Carrier';
        st.carrier.description = valById('ce-car-desc') || '';
        st.carrier.dimDx      = parseFloat(valById('ce-car-dx')) || 135;
        st.carrier.dimDy      = parseFloat(valById('ce-car-dy')) || 497;
        st.carrier.dimDz      = parseFloat(valById('ce-car-dz')) || 130;

        if (st.selectedSiteIdx >= 0 && st.selectedSiteIdx < st.carrier.sites.length) {
            var site = st.carrier.sites[st.selectedSiteIdx];
            site.id = parseInt(valById('ce-site-id')) || site.id;
            site.x  = parseFloat(valById('ce-site-x')) || 0;
            site.y  = parseFloat(valById('ce-site-y')) || 0;
            site.z  = parseFloat(valById('ce-site-z')) || 0;
            site.dx = parseFloat(valById('ce-site-dx')) || 127;
            site.dy = parseFloat(valById('ce-site-dy')) || 86;
            site.labwareFile = valById('ce-site-labware') || '';
            site.isCovered = !!$('#ce-site-covered')?.checked;
            site.visible   = !!$('#ce-site-visible')?.checked;
            site.snapBase  = !!$('#ce-site-snap')?.checked;
            site.isStack   = !!$('#ce-site-stack')?.checked;
            site.stackSize = parseInt(valById('ce-site-stack-size')) || 1;
        }
    }

    // ================================================================
    //  Data → Form
    // ================================================================
    function populateCarrierForm() {
        var cr = st.carrier;
        valById('ce-car-name', cr.viewName);
        valById('ce-car-desc', cr.description);
        valById('ce-car-dx', cr.dimDx.toFixed(2));
        valById('ce-car-dy', cr.dimDy.toFixed(2));
        valById('ce-car-dz', cr.dimDz.toFixed(2));
    }

    // ================================================================
    //  Form Wiring
    // ================================================================
    function wireCarrierForm() {
        var fields = [
            'ce-car-name', 'ce-car-desc', 'ce-car-dx', 'ce-car-dy', 'ce-car-dz',
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
            'ce-site-id', 'ce-site-x', 'ce-site-y', 'ce-site-z',
            'ce-site-dx', 'ce-site-dy', 'ce-site-labware',
            'ce-site-stack-size',
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
        ['ce-site-covered', 'ce-site-visible', 'ce-site-snap', 'ce-site-stack'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() {
                readCarrierForm();
                regeneratePreview();
                st.dirty = true;
            });
        });

        // Add site
        bindClick('#ce-add-site', function() {
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
        bindClick('#ce-del-site', function() {
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
        var canvas = $('#ce-canvas');
        if (!canvas) return;

        canvas.addEventListener('click', function(e) {
            if (st.rulerActive) return;
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
    //  File Controls
    // ================================================================
    function wireFileControls() {
        // New
        bindClick('#ce-new-btn', function() {
            st.carrier = defaultCarrier();
            st.selectedSiteIdx = 0;
            populateCarrierForm();
            populateCarrierSiteForm(0);
            st.fileName = '';
            st.dirty = false;
            setStatus('New carrier created');
            regeneratePreview();
        });

        // Open file
        var fileInput = $('#ce-file-input');
        bindClick('#ce-open-btn', function() {
            if (fileInput) fileInput.click();
        });

        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                readCarrierFile(file);
                fileInput.value = '';
            });
        }

        // Save
        bindClick('#ce-save-btn', function() {
            saveCurrentFile();
        });

        // Export .x
        bindClick('#ce-export-x-btn', function() {
            exportAsXFile();
        });

        // Drag and drop
        var host = $('#carrier-editor-host');
        if (host) {
            var dragCounter = 0;
            var dropzone = $('#ce-dropzone');

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
                if (files.length > 0) readCarrierFile(files[0]);
            });
        }
    }

    function readCarrierFile(file) {
        var name = file.name.toLowerCase();
        if (!name.endsWith('.tml')) {
            setStatus('Only .tml files are supported', true);
            return;
        }
        var reader = new FileReader();
        reader.onload = function(ev) {
            var text = ev.target.result;
            // Handle UTF-16LE BOM
            if (text.charCodeAt(0) === 0xFFFE || text.charCodeAt(0) === 0xFEFF ||
                (text.length > 4 && text.charCodeAt(1) === 0)) {
                var reader2 = new FileReader();
                reader2.onload = function(ev2) { processCarrierText(ev2.target.result, file.name); };
                reader2.readAsText(file, 'utf-16le');
                return;
            }
            processCarrierText(text, file.name);
        };
        reader.readAsText(file, 'utf-8');
    }

    function processCarrierText(text, originalName) {
        st.fileContent = text;
        st.fileName = originalName;

        st.carrier = parseTmlFile(text);
        st.selectedSiteIdx = st.carrier.sites.length > 0 ? 0 : -1;
        populateCarrierForm();
        if (st.selectedSiteIdx >= 0) populateCarrierSiteForm(0);
        setStatus('Loaded carrier: ' + originalName);

        st.dirty = false;
        regeneratePreview();
    }

    function saveCurrentFile() {
        readCarrierForm();
        var content = writeTmlFile(st.carrier);
        var defaultName = (st.carrier.viewName || 'carrier').replace(/[^a-zA-Z0-9_ -]/g, '_');
        var fileName = st.fileName || (defaultName + '.tml');
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
            var name = st.carrier.viewName;
            var xContent = LGM.exportToXFile(st.model, name);
            if (xContent) {
                var safeName = (name || 'carrier').replace(/[^a-zA-Z0-9_ -]/g, '_');
                downloadText(xContent, safeName + '.x');
                setStatus('Exported: ' + safeName + '.x');
            } else {
                setStatus('Export failed — no mesh data found.', true);
            }
        } else {
            setStatus('Export module not available.', true);
        }
    }

    // ================================================================
    //  Toolbar
    // ================================================================
    function wireToolbar() {
        var body = $('#ce-vt-body');
        var toggle = $('#ce-vt-toggle');
        if (toggle && body) {
            toggle.addEventListener('click', function () {
                st.toolbarCollapsed = !st.toolbarCollapsed;
                body.classList.toggle('collapsed', st.toolbarCollapsed);
            });
        }

        // Reset camera
        bindClick('#ce-vt-reset-cam', function () {
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
        bindClick('#ce-vt-zoom-fit', function () {
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
        bindClick('#ce-vt-topdown', function () {
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
        bindClick('#ce-vt-wireframe', function () {
            st.wireframe = !st.wireframe;
            if (st.model) {
                st.model.traverse(function (c) {
                    if (c.isMesh && c.material) {
                        if (Array.isArray(c.material)) c.material.forEach(function(m) { m.wireframe = st.wireframe; });
                        else c.material.wireframe = st.wireframe;
                    }
                });
            }
            var btn = $('#ce-vt-wireframe');
            if (btn) btn.classList.toggle('is-active', st.wireframe);
        });

        // Perspective toggle
        bindClick('#ce-vt-perspective', function () {
            st.isPerspective = !st.isPerspective;
            var btn = $('#ce-vt-perspective');
            if (btn) btn.classList.toggle('is-active', !st.isPerspective);
        });

        // Grid toggle
        bindClick('#ce-btn-grid', function () {
            st.gridVisible = !st.gridVisible;
            var grid = st.scene ? st.scene.getObjectByName('__cegrid__') : null;
            if (grid) grid.visible = st.gridVisible;
            var btn = $('#ce-btn-grid');
            if (btn) btn.classList.toggle('grid-off', !st.gridVisible);
        });

        // Zoom in/out
        bindClick('#ce-vt-zoom-in', function () {
            if (st.controls) st.controls.dollyIn(1.3);
            if (st.controls) st.controls.update();
        });
        bindClick('#ce-vt-zoom-out', function () {
            if (st.controls) st.controls.dollyOut(1.3);
            if (st.controls) st.controls.update();
        });

        // Pan mode
        bindClick('#ce-vt-pan', function () {
            st.isPanning = !st.isPanning;
            if (st.controls) {
                st.controls.mouseButtons.LEFT = st.isPanning
                    ? THREE.MOUSE.PAN
                    : THREE.MOUSE.ROTATE;
            }
            var btn = $('#ce-vt-pan');
            if (btn) btn.classList.toggle('is-active', st.isPanning);
        });

        // Ruler
        wireRuler();

        // Make toolbar draggable
        makeDraggable($('#ce-toolbar'), $('#ce-vt-grab-handle'));
    }

    // ================================================================
    //  Ruler Tool
    // ================================================================
    function wireRuler() {
        bindClick('#ce-vt-ruler', function () {
            st.rulerActive = !st.rulerActive;
            var btn = $('#ce-vt-ruler');
            if (btn) btn.classList.toggle('is-active', st.rulerActive);
            var readout = $('#ce-ruler-readout');

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

            var hit = rulerRaycast(e);
            if (!hit) return;

            if (!st.rulerStart) {
                st.rulerStart = hit.clone();
                addRulerMarker(hit);
                var readout = $('#ce-ruler-readout');
                if (readout) readout.textContent = 'Click second point… (hold Shift to axis-lock)';
            } else {
                st.rulerEnd = hit.clone();
                if (e.shiftKey && !st.rulerAxisLock) {
                    var dx = Math.abs(hit.x - st.rulerStart.x);
                    var dy = Math.abs(hit.y - st.rulerStart.y);
                    var dz = Math.abs(hit.z - st.rulerStart.z);
                    if (dx >= dy && dx >= dz) st.rulerAxisLock = 'x';
                    else if (dy >= dx && dy >= dz) st.rulerAxisLock = 'y';
                    else st.rulerAxisLock = 'z';
                }
                if (st.rulerAxisLock) {
                    st.rulerEnd = applyAxisLock(st.rulerStart, st.rulerEnd);
                }
                addRulerMarker(st.rulerEnd);
                drawRulerLine(st.rulerStart, st.rulerEnd);
                var dist = st.rulerStart.distanceTo(st.rulerEnd);
                var readout = $('#ce-ruler-readout');
                if (readout) {
                    readout.textContent = dist.toFixed(3) + ' mm' +
                        (st.rulerAxisLock ? ' (' + axisLabel() + ')' : '') +
                        '  — click to reset';
                }
                readout?.addEventListener('click', function resetOnce() {
                    clearRuler();
                    st.rulerAxisLock = null;
                    readout.textContent = 'Click first point on model…';
                    readout.removeEventListener('click', resetOnce);
                }, { once: true });
            }
        });
    }

    function rulerRaycast(e) {
        if (!st.model || !st.renderer) return null;
        var cvs = st.renderer.domElement;
        var rect = cvs.getBoundingClientRect();
        var mouse = new THREE.Vector2(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1
        );
        var ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, st.camera);
        var hits = ray.intersectObject(st.model, true);
        return hits.length > 0 ? hits[0].point : null;
    }

    function applyAxisLock(start, end) {
        var locked = end.clone();
        if (st.rulerAxisLock === 'x') { locked.y = start.y; locked.z = start.z; }
        else if (st.rulerAxisLock === 'y') { locked.x = start.x; locked.z = start.z; }
        else if (st.rulerAxisLock === 'z') { locked.x = start.x; locked.y = start.y; }
        return locked;
    }

    function axisLabel() {
        if (st.rulerAxisLock === 'x') return 'X-axis';
        if (st.rulerAxisLock === 'y') return 'Y-axis';
        if (st.rulerAxisLock === 'z') return 'Z-axis';
        return '';
    }

    function clearRuler() {
        st.rulerStart = null;
        st.rulerEnd = null;
        if (st.rulerLine && st.scene) {
            st.scene.remove(st.rulerLine);
            st.rulerLine.geometry.dispose();
            st.rulerLine.material.dispose();
            st.rulerLine = null;
        }
        for (var i = 0; i < st.rulerMarkers.length; i++) {
            if (st.scene) st.scene.remove(st.rulerMarkers[i]);
            st.rulerMarkers[i].geometry.dispose();
            st.rulerMarkers[i].material.dispose();
        }
        st.rulerMarkers = [];
    }

    function addRulerMarker(point) {
        var geo = new THREE.SphereGeometry(1.5, 12, 12);
        var mat = new THREE.MeshBasicMaterial({ color: 0xff4444, depthTest: false });
        var marker = new THREE.Mesh(geo, mat);
        marker.position.copy(point);
        marker.renderOrder = 999;
        st.scene.add(marker);
        st.rulerMarkers.push(marker);
    }

    function drawRulerLine(a, b) {
        if (st.rulerLine && st.scene) {
            st.scene.remove(st.rulerLine);
            st.rulerLine.geometry.dispose();
            st.rulerLine.material.dispose();
        }
        var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
        var mat = new THREE.LineBasicMaterial({ color: 0xff4444, depthTest: false, linewidth: 2 });
        st.rulerLine = new THREE.Line(geo, mat);
        st.rulerLine.renderOrder = 999;
        st.scene.add(st.rulerLine);
    }

    // ================================================================
    //  Screenshot
    // ================================================================
    function saveScreenshot(format, opts) {
        if (!st.renderer || !st.scene || !st.camera) return;
        var showGrid = opts ? opts.showGrid : true;
        var showBg   = opts ? opts.showBg   : true;

        var grid = st.scene.getObjectByName('__cegrid__');
        var origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && st.gridVisible;

        var origBg = st.scene.background;
        if (!showBg) {
            st.scene.background = null;
            st.renderer.setClearColor(0x000000, 0);
        }

        st.renderer.render(st.scene, st.camera);
        var canvas = st.renderer.domElement;
        var name = st.carrier.viewName;
        var fileName = (name || 'carrier_screenshot').replace(/[^a-zA-Z0-9_ -]/g, '_');

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

        var grid = st.scene.getObjectByName('__cegrid__');
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
        var canvas = $('#ce-gizmo-canvas');
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
        var el = $('#ce-cam-display');
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
        var el = $('#ce-status');
        if (!el) return;
        el.textContent = msg;
        el.className = 'lwe-status' + (isError ? ' lwe-status-err' : '');
    }

    function round3(v) {
        return (Math.round(parseFloat(v) * 1000) / 1000).toString();
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
        bindClick('#ce-screenshot', function() {
            if (typeof window.openScreenshotModal === 'function') {
                window.openScreenshotModal('carrier-editor');
            } else {
                saveScreenshot('png', { showGrid: true, showBg: true });
            }
        });
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.CarrierEditorModule = {
        init: initCarrierEditor,
        updateTheme: updateTheme,
        saveScreenshot: saveScreenshot,
        screenshotPreviewDataURL: screenshotPreviewDataURL,
    };

})();
