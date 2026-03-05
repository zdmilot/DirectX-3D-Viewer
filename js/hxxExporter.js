/* ============================================================
   HXX Exporter — Convert OBJ/STL/GLB/.x to .hxx with orientation
   Mirrors the Convert-to-.x applet but outputs Hamilton .hxx
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ================================================================
    //  State
    // ================================================================
    const hxState = {
        scene: null,
        mainCamera: null,
        mainRenderer: null,
        mainControls: null,
        model: null,
        modelBox: null,
        modelMaxDim: 1,
        isDark: false,
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,

        // Six orthographic view renderers
        views: {},

        // Rotation (Euler in degrees, applied cumulatively)
        rotX: 0,
        rotY: 0,
        rotZ: 0,

        animId: null,
        originalFileName: '',
        fileExtension: '',
    };

    const LIGHT_BG  = 0xf0f0f0;
    const DARK_BG   = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initHxxExporter() {
        hxState.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updateHxxTheme();
            return;
        }
        initialized = true;

        const canvas = $('#hx-main-canvas');
        const host   = $('#hx-main-viewport');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 600;
        const h = host.clientHeight || 400;

        // -- Scene --
        hxState.scene = new THREE.Scene();
        hxState.scene.background = new THREE.Color(hxState.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        hxState.mainCamera = new THREE.PerspectiveCamera(45, w / h, 0.01, 50000);
        hxState.mainCamera.position.set(3, 2, 5);

        // -- Renderer --
        hxState.mainRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        hxState.mainRenderer.setPixelRatio(window.devicePixelRatio);
        hxState.mainRenderer.setSize(w, h);

        // -- Controls --
        hxState.mainControls = new THREE.OrbitControls(hxState.mainCamera, hxState.mainRenderer.domElement);
        hxState.mainControls.enableDamping = true;
        hxState.mainControls.dampingFactor = 0.12;

        // -- Lights --
        hxState.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(50, 100, 50);
        hxState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-50, -20, -50);
        hxState.scene.add(d2);

        // -- Grid --
        const gc = hxState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(10, 20, gc, gc);
        grid.name = '__hxgrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = hxState.gridVisible;
        hxState.scene.add(grid);

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const cw = host.clientWidth;
            const ch = host.clientHeight;
            hxState.mainCamera.aspect = cw / ch;
            hxState.mainCamera.updateProjectionMatrix();
            hxState.mainRenderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Init six-view panels --
        initSixViews();

        // -- Start render loop --
        function tick() {
            hxState.animId = requestAnimationFrame(tick);
            hxState.mainControls.update();
            hxState.mainRenderer.render(hxState.scene, hxState.mainCamera);
            renderSixViews();
            drawHxGizmo();
        }
        tick();

        // -- Wire controls --
        wireHxControls();
        wireHxToolbar();
    }

    // ================================================================
    //  Six Orthographic Views
    // ================================================================
    const VIEW_DEFS = {
        front:  { pos: [0, 0,  1], up: [0, 1, 0], label: 'Front'  },
        back:   { pos: [0, 0, -1], up: [0, 1, 0], label: 'Back'   },
        left:   { pos: [-1, 0, 0], up: [0, 1, 0], label: 'Left'   },
        right:  { pos: [1, 0, 0],  up: [0, 1, 0], label: 'Right'  },
        top:    { pos: [0, 1, 0],  up: [0, 0, -1], label: 'Top'    },
        bottom: { pos: [0, -1, 0], up: [0, 0, 1], label: 'Bottom' },
    };

    function initSixViews() {
        for (const key of Object.keys(VIEW_DEFS)) {
            const canvas = $('#hx-view-' + key);
            if (!canvas) continue;
            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            const bg = hxState.isDark ? DARK_BG : LIGHT_BG;
            renderer.setClearColor(bg);
            hxState.views[key] = { renderer };
        }
    }

    function renderSixViews() {
        if (!hxState.model) return;
        const box = new THREE.Box3().setFromObject(hxState.model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const halfMax = maxDim * 0.7;

        for (const key of Object.keys(VIEW_DEFS)) {
            const viewObj = hxState.views[key];
            if (!viewObj) continue;
            const def = VIEW_DEFS[key];
            const canvas = viewObj.renderer.domElement;
            const w = canvas.parentElement.clientWidth;
            const h = canvas.parentElement.clientHeight;
            if (w <= 0 || h <= 0) continue;
            viewObj.renderer.setSize(w, h);

            const aspect = w / h;
            const cam = new THREE.OrthographicCamera(
                -halfMax * aspect, halfMax * aspect,
                halfMax, -halfMax, 0.001, maxDim * 20
            );
            const dir = new THREE.Vector3(...def.pos).normalize();
            cam.position.copy(dir.multiplyScalar(maxDim * 3));
            cam.up.set(...def.up);
            cam.lookAt(0, 0, 0);
            cam.updateProjectionMatrix();

            viewObj.renderer.setClearColor(hxState.isDark ? DARK_BG : LIGHT_BG);
            viewObj.renderer.render(hxState.scene, cam);
        }
    }

    // ================================================================
    //  File Loading
    // ================================================================
    function loadFileIntoHx(file, companionFiles) {
        hxState.originalFileName = file.name.replace(/\.[^.]+$/, '');
        hxState.fileExtension = file.name.split('.').pop().toLowerCase();
        clearHxModel();
        showHxLoading(true, 'Loading ' + file.name + '…');

        // Build a map of companion files by name
        const fileMap = {};
        if (companionFiles) {
            for (let i = 0; i < companionFiles.length; i++) {
                fileMap[companionFiles[i].name.toLowerCase()] = companionFiles[i];
            }
        }

        switch (hxState.fileExtension) {
            case 'obj': loadOBJ(file, fileMap); break;
            case 'stl': loadSTL(file); break;
            case 'glb':
            case 'gltf': loadGLTF(file); break;
            case 'x':   loadXFile(file); break;
            case 'hxx':  loadHXXFile(file); break;
            default:
                showHxError('Unsupported format: .' + hxState.fileExtension);
        }
    }

    function loadOBJ(file, fileMap) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const objText = e.target.result;
            // Look for companion .mtl
            const baseName = file.name.replace(/\.obj$/i, '');
            const mtlFile = fileMap[baseName.toLowerCase() + '.mtl'];
            if (mtlFile) {
                const mtlReader = new FileReader();
                mtlReader.onload = function (me) {
                    parseMTLThenOBJ(me.target.result, objText, fileMap);
                };
                mtlReader.readAsText(mtlFile);
            } else {
                parseOBJText(objText, null);
            }
        };
        reader.readAsText(file);
    }

    function parseMTLThenOBJ(mtlText, objText, fileMap) {
        const mtlLoader = new THREE.MTLLoader();
        // Create texture URL map for MTL textures
        const texUrlMap = {};
        for (const key in fileMap) {
            const f = fileMap[key];
            if (/\.(png|jpg|jpeg|bmp)$/i.test(f.name)) {
                texUrlMap[f.name] = URL.createObjectURL(f);
            }
        }
        const materials = mtlLoader.parse(mtlText);
        // Patch texture URLs if companion textures were provided
        if (materials && materials.materialsInfo) {
            for (const name in materials.materialsInfo) {
                const info = materials.materialsInfo[name];
                if (info.map_kd && texUrlMap[info.map_kd]) {
                    info.map_kd = texUrlMap[info.map_kd];
                }
            }
        }
        if (materials) materials.preload();
        parseOBJText(objText, materials);
    }

    function parseOBJText(objText, materials) {
        const loader = new THREE.OBJLoader();
        if (materials) loader.setMaterials(materials);
        try {
            const obj = loader.parse(objText);
            addModelToScene(obj);
        } catch (err) {
            showHxError('OBJ parse error: ' + err.message);
        }
    }

    function loadSTL(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const loader = new THREE.STLLoader();
                const geom = loader.parse(e.target.result);
                const mat = new THREE.MeshStandardMaterial({ color: 0x888888, flatShading: false });
                geom.computeVertexNormals();
                const mesh = new THREE.Mesh(geom, mat);
                const group = new THREE.Group();
                group.add(mesh);
                addModelToScene(group);
            } catch (err) {
                showHxError('STL parse error: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    function loadGLTF(file) {
        const url = URL.createObjectURL(file);
        const loader = new THREE.GLTFLoader();
        loader.load(url, function (gltf) {
            URL.revokeObjectURL(url);
            addModelToScene(gltf.scene);
        }, undefined, function (err) {
            URL.revokeObjectURL(url);
            showHxError('GLTF load error: ' + (err && err.message || err));
        });
    }

    function loadXFile(file) {
        const url = URL.createObjectURL(file);
        const loader = new THREE.XFileLoader();
        loader.load(url, function (object) {
            URL.revokeObjectURL(url);
            if (object.error || !object.models || object.models.length === 0) {
                showHxError('X file parse error');
                return;
            }
            const group = new THREE.Group();
            object.models.forEach(m => group.add(m));
            if (window._fixLeftHandedCoords) window._fixLeftHandedCoords(group);
            addModelToScene(group);
        }, undefined, function (err) {
            URL.revokeObjectURL(url);
            showHxError('X file load error: ' + (err && err.message || err));
        });
    }

    function loadHXXFile(file) {
        const reader = new FileReader();
        reader.onload = function () {
            if (!window.HXXLoader) {
                showHxError('HXXLoader not available');
                return;
            }
            HXXLoader.toXFileBlob(reader.result).then(function (blob) {
                const url = URL.createObjectURL(blob);
                const loader = new THREE.XFileLoader();
                loader.load(url, function (object) {
                    URL.revokeObjectURL(url);
                    if (object.error || !object.models || object.models.length === 0) {
                        showHxError('X file parse error from .hxx');
                        return;
                    }
                    const group = new THREE.Group();
                    object.models.forEach(m => group.add(m));
                    if (window._fixLeftHandedCoords) window._fixLeftHandedCoords(group);
                    addModelToScene(group);
                }, undefined, function (err) {
                    URL.revokeObjectURL(url);
                    showHxError('X file load error: ' + (err && err.message || err));
                });
            }).catch(function (err) {
                showHxError('HXX parse error: ' + (err.message || err));
            });
        };
        reader.onerror = function () {
            showHxError('Failed to read .hxx file.');
        };
        reader.readAsArrayBuffer(file);
    }

    // ================================================================
    //  Scene Management
    // ================================================================
    function addModelToScene(object) {
        showHxLoading(false);

        const group = new THREE.Group();
        group.name = '__hxmodel__';
        group.add(object);
        hxState.model = group;
        hxState.scene.add(group);

        // Compute bounding box & fit
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        hxState.modelMaxDim = Math.max(size.x, size.y, size.z) || 1;
        hxState.modelBox = box;

        // Center model at origin
        group.position.sub(center);

        // Fit main camera
        const fitDist = hxState.modelMaxDim * 2.2;
        hxState.mainCamera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
        hxState.mainCamera.near = hxState.modelMaxDim * 0.001;
        hxState.mainCamera.far  = hxState.modelMaxDim * 50;
        hxState.mainCamera.updateProjectionMatrix();

        hxState.mainControls.target.set(0, 0, 0);
        hxState.mainControls.minDistance = hxState.modelMaxDim * 0.05;
        hxState.mainControls.maxDistance = hxState.modelMaxDim * 15;
        hxState.mainControls.update();

        // Resize grid
        const oldGrid = hxState.scene.getObjectByName('__hxgrid__');
        if (oldGrid) hxState.scene.remove(oldGrid);
        const gc = hxState.isDark ? DARK_GRID : LIGHT_GRID;
        const newGrid = new THREE.GridHelper(hxState.modelMaxDim * 3, 20, gc, gc);
        newGrid.name = '__hxgrid__';
        newGrid.renderOrder = -1;
        newGrid.material.depthWrite = false;
        newGrid.position.y = -size.y / 2 - hxState.modelMaxDim * 0.002;
        hxState.scene.add(newGrid);

        // Reset rotation state
        hxState.rotX = 0;
        hxState.rotY = 0;
        hxState.rotZ = 0;
        updateRotationDisplay();

        // Enable export button
        const exportBtn = $('#hx-export-btn');
        if (exportBtn) exportBtn.disabled = false;

        // Update format badge
        updateFormatBadge(hxState.fileExtension || 'x');

        // Update debug panel
        if (window._updateDebugPanel) {
            const meshes = [];
            group.traverse(c => { if (c.isMesh) meshes.push(c); });
            const fakeObj = { models: meshes, animations: [] };
            window._updateDebugPanel('debug-content-hxxexport', fakeObj, group, box, size, hxState.modelMaxDim, hxState.scene.children.length);
        }
    }

    function clearHxModel() {
        if (!hxState.scene) return;
        const old = hxState.scene.getObjectByName('__hxmodel__');
        if (old) {
            old.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => {
                        if (m.map) m.map.dispose();
                        m.dispose();
                    });
                }
            });
            hxState.scene.remove(old);
        }
        hxState.model = null;
        hxState.rotX = 0; hxState.rotY = 0; hxState.rotZ = 0;
        updateRotationDisplay();

        const exportBtn = $('#hx-export-btn');
        if (exportBtn) exportBtn.disabled = true;
    }

    // ================================================================
    //  Rotation Controls
    // ================================================================
    function rotateModel(axis, degrees) {
        if (!hxState.model) return;

        const rad = THREE.MathUtils.degToRad(degrees);
        switch (axis) {
            case 'x': hxState.model.rotateX(rad); hxState.rotX += degrees; break;
            case 'y': hxState.model.rotateY(rad); hxState.rotY += degrees; break;
            case 'z': hxState.model.rotateZ(rad); hxState.rotZ += degrees; break;
        }

        hxState.rotX = ((hxState.rotX % 360) + 360) % 360;
        hxState.rotY = ((hxState.rotY % 360) + 360) % 360;
        hxState.rotZ = ((hxState.rotZ % 360) + 360) % 360;

        updateRotationDisplay();
    }

    function resetRotation() {
        if (!hxState.model) return;
        hxState.model.rotation.set(0, 0, 0);
        hxState.rotX = 0; hxState.rotY = 0; hxState.rotZ = 0;
        updateRotationDisplay();
    }

    function updateRotationDisplay() {
        const el = $('#hx-rotation-display');
        if (el) {
            el.textContent = `X: ${Math.round(hxState.rotX)}°  Y: ${Math.round(hxState.rotY)}°  Z: ${Math.round(hxState.rotZ)}°`;
        }
    }

    // ================================================================
    //  .hxx File Export
    // ================================================================
    function exportToHXX() {
        if (!hxState.model) return;

        // Ensure the converter's generateXFileText is available
        if (!window.ConverterModule || !window.ConverterModule.generateXFileText) {
            showHxError('Converter module not loaded — cannot generate .x data');
            return;
        }
        if (!window.HXXLoader || !window.HXXLoader.composeHXX) {
            showHxError('HXXLoader.composeHXX not available');
            return;
        }

        showHxLoading(true, 'Exporting to .hxx…');

        requestAnimationFrame(() => {
            try {
                const xText = window.ConverterModule.generateXFileText(hxState.model);
                HXXLoader.composeHXX(xText).then(function (hxxBuffer) {
                    downloadBlob(
                        new Blob([hxxBuffer], { type: 'application/octet-stream' }),
                        hxState.originalFileName + '.hxx'
                    );
                    showHxLoading(false);
                }).catch(function (err) {
                    showHxLoading(false);
                    showHxError('HXX compose error: ' + (err.message || err));
                    console.error(err);
                });
            } catch (err) {
                showHxLoading(false);
                showHxError('Export error: ' + err.message);
                console.error(err);
            }
        });
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // ================================================================
    //  UI Helpers
    // ================================================================
    function showHxLoading(show, msg) {
        const el = $('#hx-loading');
        if (!el) return;
        if (show) {
            el.classList.remove('viewer-hidden');
            const span = el.querySelector('span');
            if (span && msg) span.textContent = msg;
        } else {
            el.classList.add('viewer-hidden');
        }
    }

    function showHxError(msg) {
        showHxLoading(false);
        const el = $('#hx-error');
        if (!el) return;
        el.classList.remove('viewer-hidden');
        const span = el.querySelector('#hx-error-msg');
        if (span) span.textContent = msg;
        setTimeout(() => el.classList.add('viewer-hidden'), 6000);
    }

    function updateFormatBadge(ext) {
        const badge = $('#hx-format-badge');
        if (badge) {
            badge.textContent = '.' + ext.toUpperCase();
            badge.style.display = 'block';
        }
    }

    // ================================================================
    //  Wire Controls
    // ================================================================
    function wireHxControls() {
        // File input
        const fileInput = $('#hx-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                let primary = null;
                const companions = [];
                for (let i = 0; i < files.length; i++) {
                    const ext = files[i].name.split('.').pop().toLowerCase();
                    if (['obj', 'stl', 'glb', 'gltf', 'x', 'hxx'].includes(ext)) {
                        primary = files[i];
                    } else {
                        companions.push(files[i]);
                    }
                }
                if (!primary && files.length > 0) {
                    primary = files[0];
                }
                if (primary) {
                    loadFileIntoHx(primary, files);
                }
                fileInput.value = '';
            });
        }

        // Open button
        const openBtn = $('#hx-open-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        // Rotation buttons
        $$('.hx-rot-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const axis = this.dataset.axis;
                const deg = parseInt(this.dataset.deg, 10);
                rotateModel(axis, deg);
            });
        });

        // Reset rotation
        const resetBtn = $('#hx-reset-rot');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetRotation);
        }

        // Export button
        const exportBtn = $('#hx-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportToHXX);
        }

        // Drag & drop on main viewport
        const viewport = $('#hx-main-viewport');
        if (viewport) {
            let dragCtr = 0;
            const dropzone = $('#hx-dropzone');

            viewport.addEventListener('dragenter', e => {
                e.preventDefault();
                dragCtr++;
                if (dragCtr === 1 && dropzone) dropzone.classList.remove('viewer-hidden');
            });
            viewport.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            viewport.addEventListener('dragleave', e => {
                e.preventDefault();
                dragCtr--;
                if (dragCtr <= 0) {
                    dragCtr = 0;
                    if (dropzone) dropzone.classList.add('viewer-hidden');
                }
            });
            viewport.addEventListener('drop', e => {
                e.preventDefault();
                dragCtr = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');

                const files = e.dataTransfer.files;
                if (!files || files.length === 0) return;

                let primary = null;
                for (let i = 0; i < files.length; i++) {
                    const ext = files[i].name.split('.').pop().toLowerCase();
                    if (['obj', 'stl', 'glb', 'gltf', 'x', 'hxx'].includes(ext)) {
                        primary = files[i];
                        break;
                    }
                }
                if (primary) {
                    loadFileIntoHx(primary, files);
                }
            });
        }
    }

    // ================================================================
    //  Theme sync
    // ================================================================
    function updateHxxTheme() {
        hxState.isDark = document.documentElement.hasAttribute('data-theme');
        if (hxState.scene) {
            hxState.scene.background = new THREE.Color(hxState.isDark ? DARK_BG : LIGHT_BG);
            const grid = hxState.scene.getObjectByName('__hxgrid__');
            if (grid) {
                const c = new THREE.Color(hxState.isDark ? DARK_GRID : LIGHT_GRID);
                grid.material.color.copy(c);
            }
        }
    }

    // ================================================================
    //  Floating Toolbar
    // ================================================================
    function wireHxToolbar() {
        const toggle   = $('#hx-vt-toggle');
        const resetCam = $('#hx-vt-reset-cam');
        const zoomFit  = $('#hx-vt-zoom-fit');
        const wireBtn  = $('#hx-vt-wireframe');
        const perspBtn = $('#hx-vt-perspective');
        const gridBtn  = $('#hx-btn-grid');
        const zoomIn   = $('#hx-vt-zoom-in');
        const zoomOut  = $('#hx-vt-zoom-out');
        const panBtn   = $('#hx-vt-pan');

        if (toggle) {
            const hxBody = $('#hx-vt-body');
            toggle.addEventListener('click', () => {
                hxState.toolbarCollapsed = !hxState.toolbarCollapsed;
                if (hxBody) hxBody.classList.toggle('collapsed', hxState.toolbarCollapsed);
            });
        }

        if (resetCam) {
            resetCam.addEventListener('click', () => {
                if (!hxState.mainCamera || !hxState.mainControls) return;
                if (hxState.model) {
                    const box = new THREE.Box3().setFromObject(hxState.model);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    const fitDist = maxDim * 1.8;
                    hxState.mainCamera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
                    hxState.mainControls.target.set(0, 0, 0);
                    hxState.mainControls.update();
                } else {
                    hxState.mainCamera.position.set(3, 2, 5);
                    hxState.mainControls.target.set(0, 0, 0);
                    hxState.mainControls.update();
                }
            });
        }

        if (zoomFit) {
            zoomFit.addEventListener('click', () => {
                if (!hxState.mainCamera || !hxState.mainControls || !hxState.model) return;
                const box = new THREE.Box3().setFromObject(hxState.model);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim <= 0) return;
                const fitDist = maxDim * 1.5;
                const dir = hxState.mainCamera.position.clone().sub(hxState.mainControls.target).normalize();
                hxState.mainCamera.position.copy(dir.multiplyScalar(fitDist));
                hxState.mainControls.target.set(0, 0, 0);
                hxState.mainCamera.updateProjectionMatrix();
                hxState.mainControls.update();
            });
        }

        if (wireBtn) {
            wireBtn.addEventListener('click', () => {
                hxState.wireframe = !hxState.wireframe;
                wireBtn.classList.toggle('is-active', hxState.wireframe);
                if (!hxState.model) return;
                hxState.model.traverse(child => {
                    if (child.material) {
                        const mats = Array.isArray(child.material) ? child.material : [child.material];
                        mats.forEach(m => { m.wireframe = hxState.wireframe; });
                    }
                });
            });
        }

        if (perspBtn) {
            perspBtn.addEventListener('click', () => {
                if (!hxState.mainCamera || !hxState.mainControls) return;
                const host = $('#hx-main-viewport');
                const w = host.clientWidth || 600;
                const h = host.clientHeight || 400;
                hxState.isPerspective = !hxState.isPerspective;
                perspBtn.classList.toggle('is-active', !hxState.isPerspective);

                const pos = hxState.mainCamera.position.clone();
                const target = hxState.mainControls.target.clone();

                if (hxState.isPerspective) {
                    hxState.mainCamera = new THREE.PerspectiveCamera(45, w / h, 0.01, 50000);
                    perspBtn.querySelector('i').className = 'fas fa-cube';
                } else {
                    const dist = pos.distanceTo(target);
                    const frustumSize = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
                    hxState.mainCamera = new THREE.OrthographicCamera(
                        -frustumSize * (w / h), frustumSize * (w / h),
                        frustumSize, -frustumSize,
                        0.01, 50000
                    );
                    perspBtn.querySelector('i').className = 'fas fa-vector-square';
                }

                hxState.mainCamera.position.copy(pos);
                hxState.mainCamera.up.set(0, 1, 0);
                hxState.mainCamera.lookAt(target);

                hxState.mainControls.dispose();
                hxState.mainControls = new THREE.OrbitControls(hxState.mainCamera, hxState.mainRenderer.domElement);
                hxState.mainControls.enableDamping = true;
                hxState.mainControls.dampingFactor = 0.12;
                hxState.mainControls.target.copy(target);
                hxState.mainControls.update();
            });
        }

        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                hxState.gridVisible = !hxState.gridVisible;
                gridBtn.classList.toggle('grid-off', !hxState.gridVisible);
                if (hxState.scene) {
                    const grid = hxState.scene.getObjectByName('__hxgrid__');
                    if (grid) grid.visible = hxState.gridVisible;
                }
            });
        }

        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                if (!hxState.mainCamera || !hxState.mainControls) return;
                const dir = hxState.mainCamera.position.clone().sub(hxState.mainControls.target);
                dir.multiplyScalar(0.75);
                hxState.mainCamera.position.copy(hxState.mainControls.target.clone().add(dir));
                hxState.mainControls.update();
            });
        }

        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                if (!hxState.mainCamera || !hxState.mainControls) return;
                const dir = hxState.mainCamera.position.clone().sub(hxState.mainControls.target);
                dir.multiplyScalar(1.35);
                hxState.mainCamera.position.copy(hxState.mainControls.target.clone().add(dir));
                hxState.mainControls.update();
            });
        }

        if (panBtn) {
            panBtn.addEventListener('click', () => {
                hxState.isPanning = !hxState.isPanning;
                panBtn.classList.toggle('is-active', hxState.isPanning);
                if (hxState.mainControls) {
                    hxState.mainControls.mouseButtons.LEFT = hxState.isPanning
                        ? THREE.MOUSE.PAN
                        : THREE.MOUSE.ROTATE;
                }
            });
        }

        // Toolbar drag handle
        const grabHandle = $('#hx-vt-grab-handle');
        const toolbar = $('#hx-viewer-toolbar');
        if (grabHandle && toolbar) {
            let dragging = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;

            grabHandle.addEventListener('mousedown', e => {
                dragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = toolbar.getBoundingClientRect();
                origLeft = rect.left;
                origTop = rect.top;
                e.preventDefault();
            });

            window.addEventListener('mousemove', e => {
                if (!dragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                toolbar.style.left = (origLeft + dx) + 'px';
                toolbar.style.top = (origTop + dy) + 'px';
                toolbar.style.right = 'auto';
                toolbar.style.bottom = 'auto';
            });

            window.addEventListener('mouseup', () => {
                dragging = false;
            });
        }
    }

    // -- Gizmo Drawing --
    function drawHxGizmo() {
        const canvas = $('#hx-gizmo-canvas');
        if (!canvas || !hxState.mainCamera) return;
        const ctx = canvas.getContext('2d');
        const size = 44;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2, cy = size / 2, len = 16;
        const vm = hxState.mainCamera.matrixWorldInverse;

        const axes = [
            { dir: [1, 0, 0], color: '#e74c3c', label: 'X' },
            { dir: [0, 1, 0], color: '#2ecc71', label: 'Y' },
            { dir: [0, 0, 1], color: '#3498db', label: 'Z' },
        ];

        const projected = axes.map(a => {
            const v = new THREE.Vector3(...a.dir).applyMatrix4(vm).normalize();
            return { x: v.x * len, y: -v.y * len, z: v.z, color: a.color, label: a.label };
        });
        projected.sort((a, b) => a.z - b.z);

        projected.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + p.x, cy + p.y);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = p.color;
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.label, cx + p.x * 1.25, cy + p.y * 1.25);
        });
    }

    // ================================================================
    //  Grid visibility helper
    // ================================================================
    function setHxGridVisible(visible) {
        hxState.gridVisible = visible;
        if (hxState.scene) {
            const grid = hxState.scene.getObjectByName('__hxgrid__');
            if (grid) grid.visible = visible;
        }
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.HxxExportModule = {
        init: initHxxExporter,
        updateTheme: updateHxxTheme,
        setGridVisible: setHxGridVisible,
    };

})();
