/* ============================================================
   Carrier Editor -- Create and edit Hamilton carrier definitions
   (.tml) with 3D site visualization and file I/O.
   Simplified MFX-style viewport: gesture-based orbit/zoom/pan,
   no grid, minimal toolbar.
   ============================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ================================================================
    //  Constants
    // ================================================================
    const LIGHT_BG      = 0xf0f0f0;
    const DARK_BG       = 0x1b2838;
    const SNAP_ACTIVE   = 0x22cc66;
    const SNAP_HOVER    = 0x66aaff;
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
        isPerspective: true,
        toolbarCollapsed: false,
        animId: null,
        dirty: false,
        carrier: null,
        selectedSiteIdx: -1,
        hoveredSiteIdx: -1,
        siteBoxes: [],
        fileName: '',
        fileContent: null,
    };

    // ================================================================
    //  Default data
    // ================================================================
    function defaultCarrier() {
        return {
            viewName: 'New Carrier',
            description: '',
            dimDx: 135.0, dimDy: 497.0, dimDz: 130.0,
            backgroundColor: '#607080',
            bitmap: '', image3D: '', model3D: '',
            readOnly: false, categories: [], properties: [],
            sites: [{
                id: 1, label: '1',
                x: 4.0, y: 8.5, z: 112.0, dx: 127.0, dy: 86.0,
                labwareFile: '', isCovered: false, visible: true,
                snapBase: true, isStack: false, stackSize: 1,
            }],
        };
    }

    // ================================================================
    //  Initialization
    // ================================================================
    var initialized = false;

    function initCarrierEditor() {
        st.isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (initialized) { updateTheme(); return; }
        initialized = true;

        var host = $('#carrier-editor-host');
        var canvas = $('#ce-canvas');
        if (!host || !canvas) return;

        var w = host.clientWidth || 800;
        var h = host.clientHeight || 600;

        // -- Scene (no grid) --
        st.scene = new THREE.Scene();
        st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        st.camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
        st.camera.position.set(160, 120, 200);

        // -- Renderer --
        st.renderer = new THREE.WebGLRenderer({
            canvas: canvas, antialias: true,
            preserveDrawingBuffer: true, logarithmicDepthBuffer: true,
        });
        st.renderer.setPixelRatio(window.devicePixelRatio);
        st.renderer.setSize(w, h);

        // -- Controls (gesture-based: left-drag rotate, right-drag pan, scroll zoom) --
        st.controls = new THREE.OrbitControls(st.camera, canvas);
        st.controls.enableDamping = true;
        st.controls.dampingFactor = 0.12;
        st.controls.target.set(0, 0, 0);
        st.controls.update();

        // -- Lights --
        st.scene.add(new THREE.AmbientLight(0xaaaaaa, 1.2));
        var d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(200, 400, 200);
        st.scene.add(d1);
        var d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-100, -50, -200);
        st.scene.add(d2);

        // -- Resize --
        new ResizeObserver(function () {
            var cw = host.clientWidth, ch = host.clientHeight;
            if (cw <= 0 || ch <= 0) return;
            st.camera.aspect = cw / ch;
            st.camera.updateProjectionMatrix();
            st.renderer.setSize(cw, ch);
        }).observe(host);

        // -- Render loop --
        (function tick() {
            st.animId = requestAnimationFrame(tick);
            st.controls.update();
            st.renderer.render(st.scene, st.camera);
            drawGizmo();
        })();

        // -- Init state & UI --
        st.carrier = defaultCarrier();
        wireCarrierForm();
        wireToolbar();
        wireFileControls();
        wireSiteInteraction();
        wireScreenshotButton();

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
        if (st.scene) st.scene.background = new THREE.Color(st.isDark ? DARK_BG : LIGHT_BG);
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
        var lineRe = /^\s*([A-Za-z0-9_.]+)\s*,\s*"([^"]*)"/gm;
        var m;
        while ((m = lineRe.exec(body)) !== null) {
            map[m[1]] = m[2];
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

        var propCnt = parseInt(cfg['PropertyCnt']) || 0;
        for (var i = 1; i <= propCnt; i++) {
            var pn = cfg['Property.' + i], pv = cfg['PropertyValue.' + i];
            if (pn) car.properties.push({ name: pn, value: pv || '' });
        }

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
        for (var i = 0; i < car.categories.length; i++) w('Category.' + i + '.Id', car.categories[i]);
        w('Description', car.description);
        w('Dim.Dx', round3(car.dimDx));
        w('Dim.Dy', round3(car.dimDy));
        w('Dim.Dz', round3(car.dimDz));
        w('PropertyCnt', String(car.properties.length));
        for (var i = 0; i < car.properties.length; i++) {
            w('Property.' + (i + 1), car.properties[i].name);
            w('PropertyValue.' + (i + 1), car.properties[i].value);
        }
        w('ReadOnly', car.readOnly ? '1' : '0');
        for (var i = 0; i < car.sites.length; i++) {
            var site = car.sites[i], idx = i + 1;
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
        var now = new Date();
        var time = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0') + ' ' +
            String(now.getHours()).padStart(2, '0') + ':' +
            String(now.getMinutes()).padStart(2, '0');
        lines.push('* $$author=CarrierEditor$$valid=1$$time=' + time + '$$checksum=00000000$$length=000$$');
        return lines.join('\r\n') + '\r\n';
    }

    // ================================================================
    //  3D Model
    // ================================================================
    function clearModel() {
        if (st.model && st.scene) {
            st.model.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(function (m) { m.dispose(); });
                    else child.material.dispose();
                }
            });
            st.scene.remove(st.model);
            st.model = null;
        }
        st.siteBoxes = [];
    }

    function displayModel(group) {
        clearModel();
        st.model = group;
        st.scene.add(group);

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

    function regeneratePreview() { generateCarrier3D(st.carrier); }

    // ================================================================
    //  Carrier 3D Generation
    // ================================================================
    function generateCarrier3D(car) {
        var group = new THREE.Group();
        group.name = '__ce_model__';

        var carW = car.dimDx, carD = car.dimDy, carH = car.dimDz;

        // Carrier body
        var bodyGeo = new THREE.BoxGeometry(carW, carH, carD);
        var bodyMat = new THREE.MeshPhongMaterial({
            color: CARRIER_COLOR, transparent: true, opacity: 0.3,
            side: THREE.DoubleSide, depthWrite: false,
        });
        var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.renderOrder = 1;
        bodyMesh.position.set(carW / 2, carH / 2, carD / 2);
        group.add(bodyMesh);

        // Carrier edges
        var edgeMat = new THREE.LineBasicMaterial({ color: 0x444444 });
        var edgeMesh = new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat);
        edgeMesh.position.copy(bodyMesh.position);
        group.add(edgeMesh);

        // Sites
        st.siteBoxes = [];
        for (var i = 0; i < car.sites.length; i++) {
            var site = car.sites[i];
            if (!site.visible) continue;

            var siteW = site.dx, siteD = site.dy, siteH = 5;
            var siteColor = SITE_COLORS[i % SITE_COLORS.length];
            var isSelected = i === st.selectedSiteIdx;
            var isHovered  = i === st.hoveredSiteIdx;
            if (isSelected) siteColor = SNAP_ACTIVE;
            else if (isHovered) siteColor = SNAP_HOVER;

            var siteGeo = new THREE.BoxGeometry(siteW, siteH, siteD);
            var siteMat = new THREE.MeshPhongMaterial({
                color: siteColor, transparent: true,
                opacity: isSelected ? 0.7 : 0.45,
                side: THREE.DoubleSide, depthWrite: false,
            });
            var siteMesh = new THREE.Mesh(siteGeo, siteMat);
            siteMesh.renderOrder = 2;
            siteMesh.position.set(site.x + siteW / 2, site.z + siteH / 2, site.y + siteD / 2);
            siteMesh.userData = { siteIdx: i };
            group.add(siteMesh);
            st.siteBoxes.push(siteMesh);

            // Site edges
            var sEdge = new THREE.LineSegments(
                new THREE.EdgesGeometry(siteGeo),
                new THREE.LineBasicMaterial({ color: isSelected ? 0x00ff00 : 0x333333 })
            );
            sEdge.position.copy(siteMesh.position);
            group.add(sEdge);

            // Site label
            var lc = createLabelCanvas('Site ' + site.id, isSelected ? '#22cc66' : '#ffffff');
            var lt = new THREE.CanvasTexture(lc);
            var lm = new THREE.Mesh(
                new THREE.PlaneGeometry(lc.width / 8, lc.height / 8),
                new THREE.MeshBasicMaterial({ map: lt, transparent: true, depthTest: false })
            );
            lm.position.set(site.x + siteW / 2, site.z + siteH + 8, site.y + siteD / 2);
            lm.renderOrder = 100;
            group.add(lm);
        }

        displayModel(group);
    }

    function createLabelCanvas(text, color) {
        var c = document.createElement('canvas');
        c.width = 128; c.height = 32;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 128, 32);
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = color || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 16);
        return c;
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
            item.className = 'mfx-slot-row' + (i === st.selectedSiteIdx ? ' is-selected' : '');
            item.dataset.idx = i;
            item.innerHTML =
                '<span class="lwe-site-color" style="background:#' +
                (SITE_COLORS[i % SITE_COLORS.length]).toString(16).padStart(6, '0') + '"></span>' +
                '<strong>Site ' + site.id + '</strong>' +
                '<span class="lwe-site-dims">' +
                site.dx.toFixed(0) + '\u00d7' + site.dy.toFixed(0) + 'mm</span>';
            (function(idx) {
                item.addEventListener('click', function() { selectSite(idx); });
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
        var el;
        if ((el = $('#ce-site-labware'))) el.value = site.labwareFile || '';
        if ((el = $('#ce-site-covered'))) el.checked = site.isCovered;
        if ((el = $('#ce-site-visible'))) el.checked = site.visible;
        if ((el = $('#ce-site-snap'))) el.checked = site.snapBase;
        if ((el = $('#ce-site-stack'))) el.checked = site.isStack;
        valById('ce-site-stack-size', site.stackSize);
    }

    // ================================================================
    //  Form <-> Data
    // ================================================================
    function readCarrierForm() {
        st.carrier.viewName    = valById('ce-car-name') || 'New Carrier';
        st.carrier.description = valById('ce-car-desc') || '';
        st.carrier.dimDx = parseFloat(valById('ce-car-dx')) || 135;
        st.carrier.dimDy = parseFloat(valById('ce-car-dy')) || 497;
        st.carrier.dimDz = parseFloat(valById('ce-car-dz')) || 130;

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
        ['ce-car-name', 'ce-car-desc', 'ce-car-dx', 'ce-car-dy', 'ce-car-dz'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() { readCarrierForm(); regeneratePreview(); st.dirty = true; });
        });

        ['ce-site-id', 'ce-site-x', 'ce-site-y', 'ce-site-z', 'ce-site-dx', 'ce-site-dy',
         'ce-site-labware', 'ce-site-stack-size'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() { readCarrierForm(); regeneratePreview(); st.dirty = true; });
        });

        ['ce-site-covered', 'ce-site-visible', 'ce-site-snap', 'ce-site-stack'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('change', function() { readCarrierForm(); regeneratePreview(); st.dirty = true; });
        });

        bindClick('#ce-add-site', function() {
            var nextId = st.carrier.sites.length + 1;
            var last = st.carrier.sites[st.carrier.sites.length - 1] || { x: 4, y: 0, z: 112, dx: 127, dy: 86 };
            st.carrier.sites.push({
                id: nextId, label: String(nextId),
                x: last.x, y: last.y + last.dy + 10, z: last.z,
                dx: last.dx, dy: last.dy,
                labwareFile: '', isCovered: false, visible: true,
                snapBase: true, isStack: false, stackSize: 1,
            });
            st.selectedSiteIdx = st.carrier.sites.length - 1;
            populateCarrierSiteForm(st.selectedSiteIdx);
            regeneratePreview();
            st.dirty = true;
        });

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
    //  Site Click/Hover in 3D
    // ================================================================
    function wireSiteInteraction() {
        var canvas = $('#ce-canvas');
        if (!canvas) return;

        canvas.addEventListener('click', function(e) {
            if (st.siteBoxes.length === 0) return;
            var rect = canvas.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            var ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, st.camera);
            var hits = ray.intersectObjects(st.siteBoxes, false);
            if (hits.length > 0 && hits[0].object.userData.siteIdx !== undefined) {
                selectSite(hits[0].object.userData.siteIdx);
            }
        });

        canvas.addEventListener('mousemove', function(e) {
            if (st.siteBoxes.length === 0) return;
            var rect = canvas.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            var ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, st.camera);
            var hits = ray.intersectObjects(st.siteBoxes, false);
            var idx = hits.length > 0 ? hits[0].object.userData.siteIdx : -1;
            if (idx !== st.hoveredSiteIdx) {
                st.hoveredSiteIdx = idx;
                canvas.style.cursor = idx >= 0 ? 'pointer' : '';
                regeneratePreview();
            }
        });
    }

    // ================================================================
    //  File Controls
    // ================================================================
    function wireFileControls() {
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

        var fileInput = $('#ce-file-input');
        bindClick('#ce-open-btn', function() { if (fileInput) fileInput.click(); });
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                if (e.target.files[0]) readCarrierFile(e.target.files[0]);
                fileInput.value = '';
            });
        }

        bindClick('#ce-save-btn', function() { saveCurrentFile(); });
        bindClick('#ce-export-x-btn', function() { exportAsXFile(); });
        bindClick('#ce-export-btn', function() { exportAsXFile(); });

        // Drag and drop
        var host = $('#carrier-editor-host');
        if (host) {
            var dragCount = 0;
            var dropzone = $('#ce-dropzone');
            host.addEventListener('dragenter', function(e) { e.preventDefault(); dragCount++; if (dragCount === 1 && dropzone) dropzone.classList.remove('viewer-hidden'); });
            host.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
            host.addEventListener('dragleave', function(e) { e.preventDefault(); dragCount--; if (dragCount <= 0) { dragCount = 0; if (dropzone) dropzone.classList.add('viewer-hidden'); } });
            host.addEventListener('drop', function(e) { e.preventDefault(); dragCount = 0; if (dropzone) dropzone.classList.add('viewer-hidden'); if (e.dataTransfer.files.length > 0) readCarrierFile(e.dataTransfer.files[0]); });
        }
    }

    function readCarrierFile(file) {
        if (!file.name.toLowerCase().endsWith('.tml')) { setStatus('Only .tml files supported', true); return; }
        var reader = new FileReader();
        reader.onload = function(ev) {
            var text = ev.target.result;
            if (text.charCodeAt(0) === 0xFFFE || text.charCodeAt(0) === 0xFEFF || (text.length > 4 && text.charCodeAt(1) === 0)) {
                var r2 = new FileReader();
                r2.onload = function(ev2) { processCarrierText(ev2.target.result, file.name); };
                r2.readAsText(file, 'utf-16le');
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
        setStatus('Loaded: ' + originalName);
        st.dirty = false;
        regeneratePreview();
    }

    function saveCurrentFile() {
        readCarrierForm();
        var content = writeTmlFile(st.carrier);
        var name = (st.carrier.viewName || 'carrier').replace(/[^a-zA-Z0-9_ -]/g, '_');
        var fileName = st.fileName || (name + '.tml');
        downloadText(content, fileName);
        st.dirty = false;
        setStatus('Saved: ' + fileName);
    }

    function exportAsXFile() {
        if (!st.model) { setStatus('No model to export.', true); return; }
        var LGM = window.LabwareGenModule;
        if (LGM && LGM.exportToXFile) {
            var name = st.carrier.viewName;
            var xContent = LGM.exportToXFile(st.model, name);
            if (xContent) {
                var safeName = (name || 'carrier').replace(/[^a-zA-Z0-9_ -]/g, '_');
                downloadText(xContent, safeName + '.x');
                setStatus('Exported: ' + safeName + '.x');
            } else {
                setStatus('Export failed.', true);
            }
        } else {
            setStatus('Export module not available.', true);
        }
    }

    // ================================================================
    //  Toolbar (minimal -- MFX parity)
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

        bindClick('#ce-vt-perspective', function () {
            st.isPerspective = !st.isPerspective;
            var btn = $('#ce-vt-perspective');
            if (btn) btn.classList.toggle('is-active', !st.isPerspective);
        });
    }

    // ================================================================
    //  Screenshot
    // ================================================================
    function saveScreenshot(format, opts) {
        if (!st.renderer || !st.scene || !st.camera) return;
        var showBg = opts ? opts.showBg : true;
        var origBg = st.scene.background;
        if (!showBg) { st.scene.background = null; st.renderer.setClearColor(0x000000, 0); }
        st.renderer.render(st.scene, st.camera);
        var canvas = st.renderer.domElement;
        var name = (st.carrier.viewName || 'carrier_screenshot').replace(/[^a-zA-Z0-9_ -]/g, '_');
        if (format === 'jpg') canvas.toBlob(function(b) { if (b) downloadBlob(b, name + '.jpg'); }, 'image/jpeg', 0.92);
        else canvas.toBlob(function(b) { if (b) downloadBlob(b, name + '.png'); }, 'image/png');
        st.scene.background = origBg;
        if (!showBg) { st.renderer.setClearColor(st.isDark ? DARK_BG : LIGHT_BG, 1); }
        st.renderer.render(st.scene, st.camera);
    }

    function screenshotPreviewDataURL(opts) {
        if (!st.renderer || !st.scene || !st.camera) return '';
        var showBg = opts ? opts.showBg : true;
        var origBg = st.scene.background;
        if (!showBg) { st.scene.background = null; st.renderer.setClearColor(0x000000, 0); }
        st.renderer.render(st.scene, st.camera);
        var dataURL = st.renderer.domElement.toDataURL('image/png');
        st.scene.background = origBg;
        if (!showBg) { st.renderer.setClearColor(st.isDark ? DARK_BG : LIGHT_BG, 1); }
        st.renderer.render(st.scene, st.camera);
        return dataURL;
    }

    // ================================================================
    //  Gizmo
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
        var right = new THREE.Vector3().crossVectors(cam.up, dir).normalize();
        var up = new THREE.Vector3().crossVectors(dir, right).normalize();
        var cx = w / 2, cy = h / 2, len = Math.min(w, h) * 0.35;

        [
            { label: 'X', color: '#e74c3c', v: new THREE.Vector3(1, 0, 0) },
            { label: 'Y', color: '#2ecc71', v: new THREE.Vector3(0, 1, 0) },
            { label: 'Z', color: '#3498db', v: new THREE.Vector3(0, 0, 1) },
        ].forEach(function (a) {
            var px = a.v.dot(right) * len;
            var py = -a.v.dot(up) * len;
            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + px, cy + py);
            ctx.strokeStyle = a.color; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = a.color; ctx.font = 'bold 9px sans-serif';
            ctx.fillText(a.label, cx + px * 1.15 - 3, cy + py * 1.15 + 3);
        });
    }

    // ================================================================
    //  Helpers
    // ================================================================
    function bindClick(sel, fn) { var el = $(sel); if (el) el.addEventListener('click', fn); }
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
        el.className = 'vl-status-msg' + (isError ? ' vl-status-err' : '');
    }
    function round3(v) { return (Math.round(parseFloat(v) * 1000) / 1000).toString(); }
    function intToColor(intVal) {
        var r = (intVal >> 16) & 0xff, g = (intVal >> 8) & 0xff, b = intVal & 0xff;
        return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
    }
    function colorToInt(hex) {
        if (!hex || hex[0] !== '#') return '16777215';
        return String(parseInt(hex.slice(1), 16));
    }
    function downloadText(content, filename) { downloadBlob(new Blob([content], { type: 'text/plain;charset=utf-8' }), filename); }
    function downloadBlob(blob, filename) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
    }

    function wireScreenshotButton() {
        bindClick('#ce-screenshot', function() {
            if (typeof window.openScreenshotModal === 'function') window.openScreenshotModal('carrier-editor');
            else saveScreenshot('png', { showBg: true });
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
