/* ============================================================
   Plate Placer — 3D Viewer with microwell plate for offset calc
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  State
    // ================================================================
    const ppState = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        model: null,           // loaded .x model group
        plate: null,           // microwell plate group
        isDark: false,
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,

        modelPos: { x: 0, y: 0, z: 0 },
        platePos: { x: 0, y: 0, z: 0 },
        plateScale: 1.0,

        animId: null,
        loadedFileName: '',
    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    const PLATE_X_FILENAME = '96WellPlate.x';

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initPlacer(autoLoadUrl, autoLoadName) {
        ppState.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updatePlacerTheme();
            // If a new file was loaded in the main viewer, auto-load it
            if (autoLoadUrl && autoLoadUrl !== ppState._lastAutoUrl) {
                ppState._lastAutoUrl = autoLoadUrl;
                if (autoLoadName) ppState.loadedFileName = autoLoadName;
                loadXFilePlacer(autoLoadUrl);
            }
            return;
        }
        initialized = true;

        const canvas = $('#pp-canvas');
        const host   = $('#placer-host');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 800;
        const h = host.clientHeight || 600;

        // -- Scene --
        ppState.scene = new THREE.Scene();
        ppState.scene.background = new THREE.Color(ppState.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        ppState.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        ppState.camera.position.set(120, 100, 200);
        ppState.camera.up.set(0, 1, 0);

        // -- Renderer --
        ppState.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        ppState.renderer.setPixelRatio(window.devicePixelRatio);
        ppState.renderer.setSize(w, h);
        ppState.renderer.sortObjects = true;

        // -- Controls --
        ppState.controls = new THREE.OrbitControls(ppState.camera, ppState.renderer.domElement);
        ppState.controls.enableDamping = true;
        ppState.controls.dampingFactor = 0.12;
        ppState.controls.target.set(0, 0, 0);
        ppState.controls.update();

        // -- Lights --
        ppState.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(50, 100, 50);
        ppState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-50, -20, -50);
        ppState.scene.add(d2);

        // -- Grid (mm-based via DeckUnits) --
        const gc = ppState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = DeckUnits.createGrid(400, 10, gc, { name: '__ppgrid__', visible: ppState.gridVisible });
        ppState.scene.add(grid);

        // -- Create the microwell plate (load from .x file) --
        loadPlateModel();

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const cw = host.clientWidth;
            const ch = host.clientHeight;
            ppState.camera.aspect = cw / ch;
            ppState.camera.updateProjectionMatrix();
            ppState.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Render loop --
        function tick() {
            ppState.animId = requestAnimationFrame(tick);
            ppState.controls.update();

            // Dynamically tighten near/far planes based on camera distance.
            // Tight 1:1000 ratio ensures polygon offset resolves coplanar
            // label meshes (text, barcodes) against the body at any distance.
            if (ppState.camera.isPerspectiveCamera) {
                var dist = ppState.camera.position.distanceTo(ppState.controls.target);
                if (dist > 0) {
                    var newNear = Math.max(dist * 0.01, 0.01);
                    var newFar  = Math.max(dist * 10, 1000);
                    ppState.camera.near = newNear;
                    ppState.camera.far  = newFar;
                    ppState.camera.updateProjectionMatrix();
                }
            }

            ppState.renderer.render(ppState.scene, ppState.camera);
            drawPlacerGizmo();
            updatePlacerCamDisplay();
        }
        tick();

        // -- Wire controls --
        wirePlacerControls();
        wirePlacerToolbar();
        wireScreenshotExport();
        wireOffsetInputs();

        // Auto-load file from main viewer if provided
        if (autoLoadUrl) {
            ppState._lastAutoUrl = autoLoadUrl;
            if (autoLoadName) ppState.loadedFileName = autoLoadName;
            loadXFilePlacer(autoLoadUrl);
        }
    }

    // ================================================================
    //  Load 96-well plate from .x file
    // ================================================================
    function loadPlateModel() {
        const url = PLATE_X_FILENAME + '?_ts=' + Date.now();
        const manager = new THREE.LoadingManager();
        // Resolve texture paths relative to the model location (match main viewer)
        const basePath = PLATE_X_FILENAME.substring(0, PLATE_X_FILENAME.lastIndexOf('/') + 1);
        manager.setURLModifier(function (texUrl) {
            if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                return basePath + texUrl.split('/').pop();
            }
            return texUrl;
        });
        const loader = new THREE.XFileLoader(manager);

        loader.load(url, function (object) {
            if (object.error || !object.models || object.models.length === 0) {
                console.error('[PlatePlacer] Failed to load plate model:', object.error || 'no meshes');
                return;
            }

            const group = new THREE.Group();
            group.name = '__plate__';

            for (let i = 0; i < object.models.length; i++) {
                const model = object.models[i];
                model.renderOrder = i + 100; // offset to avoid z-fighting with main model
                if (model.material) {
                    const applyOffset = (m, meshIdx) => {
                        if (meshIdx === 0) {
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = 1;
                            m.polygonOffsetUnits  = 1;
                        } else {
                            const capped = Math.min(meshIdx, 10);
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = -capped;
                            m.polygonOffsetUnits  = -capped * 4;
                        }
                    };
                    if (Array.isArray(model.material)) {
                        model.material.forEach(m => applyOffset(m, i));
                    } else {
                        applyOffset(model.material, i);
                    }
                }
                group.add(model);
            }

            // ── Add to scene FIRST (matches main viewer order) ──
            ppState.scene.add(group);

            // ── Left-handed → right-handed coordinate fix ──
            if (window._fixLeftHandedCoords) window._fixLeftHandedCoords(group);

            // ── Nudge label/decal meshes outward ──
            if (window._nudgeDecalMeshes) window._nudgeDecalMeshes(group);

            // ── Disable frustum culling & handle blue-dominant transparency ──
            group.traverse(function (child) {
                if (!child.isMesh) return;
                child.frustumCulled = false;
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                var isTransparent = false;
                mats.forEach(function (m) {
                    if (!m || !m.color) return;
                    var r = m.color.r, g = m.color.g, b = m.color.b;
                    if (b > r * 1.5 && b > 0.1) {
                        m.transparent = true;
                        if (m.opacity >= 1.0) m.opacity = 0.4;
                        m.depthWrite = false;
                        m.side = THREE.DoubleSide;
                        isTransparent = true;
                    }
                });
                if (isTransparent) {
                    child.renderOrder = 999;
                }
            });

            // ── Compute bounding box AFTER coord fix (matches main viewer) ──
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            ppState.plate = group;
            ppState._plateCenter = center.clone();
            ppState._plateNativeSize = size.clone();

            // Center the plate
            group.position.sub(center);

            // Apply stored plate offset
            group.position.x += ppState.platePos.x;
            group.position.y += ppState.platePos.y;
            group.position.z += ppState.platePos.z;

            // Auto-scale plate to match model if model is already loaded
            autoScalePlateToModel();
            applyScales();
            updateOffsets();   // apply the computed position to the plate group

            console.log('[PlatePlacer] Plate loaded successfully');
        }, null, function (err) {
            console.error('[PlatePlacer] Error loading plate .x file:', err);
        });
    }

    // ================================================================
    //  Load X file into the placer scene
    // ================================================================
    function loadXFilePlacer(url) {
        const loadingEl = $('#pp-loading');
        const errorEl   = $('#pp-error');

        // Clear previous model
        if (ppState.model && ppState.scene) {
            ppState.model.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => m.dispose());
                }
            });
            ppState.scene.remove(ppState.model);
            ppState.model = null;
            ppState._modelNativeSize = null;
            ppState._autoScaled = false; // allow re-auto-scale for new model
        }

        if (loadingEl) {
            loadingEl.classList.remove('viewer-hidden');
            const span = loadingEl.querySelector('span');
            if (span) span.textContent = 'Loading 3D Model…';
        }
        if (errorEl) errorEl.classList.add('viewer-hidden');

        const finalUrl = (typeof url === 'string' && !/^blob:|^data:/i.test(url))
            ? url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now()
            : url;

        const manager = new THREE.LoadingManager();
        const basePath = url.substring(0, url.lastIndexOf('/') + 1);
        manager.setURLModifier(texUrl => {
            if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                return basePath + texUrl.split('/').pop();
            }
            return texUrl;
        });

        const loader = new THREE.XFileLoader(manager);

        loader.load(finalUrl, function (object) {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');

            if (object.error) {
                showPlacerError(errorEl, 'Parse error: ' + (object.error.message || object.error));
                return;
            }
            if (!object.models || object.models.length === 0) {
                showPlacerError(errorEl, 'No meshes found in .x file.');
                return;
            }

            const group = new THREE.Group();
            group.name = '__ppmodel__';

            for (let i = 0; i < object.models.length; i++) {
                const model = object.models[i];
                model.renderOrder = i;
                if (model.material) {
                    const applyOffset = (m, meshIdx) => {
                        if (meshIdx === 0) {
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = 1;
                            m.polygonOffsetUnits  = 1;
                        } else {
                            const capped = Math.min(meshIdx, 10);
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = -capped;
                            m.polygonOffsetUnits  = -capped * 4;
                        }
                    };
                    if (Array.isArray(model.material)) {
                        model.material.forEach(m => applyOffset(m, i));
                    } else {
                        applyOffset(model.material, i);
                    }
                }
                group.add(model);
            }

            ppState.scene.add(group);

            // Fix left-handed DirectX coords
            if (window._fixLeftHandedCoords) window._fixLeftHandedCoords(group);

            // Nudge label/decal meshes outward
            if (window._nudgeDecalMeshes) window._nudgeDecalMeshes(group);

            // Disable frustum culling & handle blue-dominant transparency
            group.traverse(function (child) {
                if (!child.isMesh) return;
                child.frustumCulled = false;
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                var isTransparent = false;
                mats.forEach(function (m) {
                    if (!m || !m.color) return;
                    var r = m.color.r, g = m.color.g, b = m.color.b;
                    if (b > r * 1.5 && b > 0.1) {
                        m.transparent = true;
                        if (m.opacity >= 1.0) m.opacity = 0.4;
                        m.depthWrite = false;
                        m.side = THREE.DoubleSide;
                        isTransparent = true;
                    }
                });
                if (isTransparent) {
                    child.renderOrder = 999;
                }
            });

            // Center model
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            if (maxDim > 0) {
                group.position.sub(center);
                // Apply stored model offset
                group.position.x += ppState.modelPos.x;
                group.position.y += ppState.modelPos.y;
                group.position.z += ppState.modelPos.z;

                // Fit camera — match the main viewer exactly
                // Fit camera (mm units)
                DeckUnits.fitCamera(ppState.camera, ppState.controls, maxDim, { fitMultiplier: 1.8 });

                // Resize grid — mm-based
                const oldGrid = ppState.scene.getObjectByName('__ppgrid__');
                if (oldGrid) ppState.scene.remove(oldGrid);
                const gColor = ppState.isDark ? DARK_GRID : LIGHT_GRID;
                const newGrid = DeckUnits.createModelGrid(maxDim, gColor, { name: '__ppgrid__', visible: ppState.gridVisible });
                newGrid.position.y = -size.y / 2 - maxDim * 0.002;
                ppState.scene.add(newGrid);
            }

            ppState.model = group;
            // Store the centering offset for position input zeroing
            ppState._modelCenter = center.clone();
            ppState._modelNativeSize = size.clone();

            // Auto-scale plate to match model if plate is already loaded
            autoScalePlateToModel();
            applyScales();

            // Update offset display
            updateOffsets();

        }, function (xhr) {
            if (loadingEl && xhr && xhr.total) {
                const pct = Math.round((xhr.loaded / xhr.total) * 100);
                const span = loadingEl.querySelector('span');
                if (span) span.textContent = pct < 100
                    ? 'Processing… ' + pct + '%'
                    : 'Parsing 3D Model…';
            }
        }, function (err) {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showPlacerError(errorEl, 'Error loading .x file: ' + (err && err.message ? err.message : String(err)));
        });
    }

    function showPlacerError(el, msg) {
        if (!el) return;
        el.classList.remove('viewer-hidden');
        const msgEl = el.querySelector('#pp-error-msg');
        if (msgEl) msgEl.textContent = msg;
    }

    // ================================================================
    //  Scale Management
    // ================================================================

    /**
     * Auto-scale the plate so it is smaller than the imported model,
     * then offset it along X so they don't overlap (≥ 1 grid square gap).
     * Model always stays at native scale (1:1 with the main viewer).
     * Only runs once per model load.
     */
    function autoScalePlateToModel() {
        if (!ppState._modelNativeSize || !ppState._plateNativeSize) return;
        if (ppState._autoScaled) return;  // only auto-scale once
        ppState._autoScaled = true;

        const modelMax = Math.max(
            ppState._modelNativeSize.x,
            ppState._modelNativeSize.y,
            ppState._modelNativeSize.z
        );
        const plateMax = Math.max(
            ppState._plateNativeSize.x,
            ppState._plateNativeSize.y,
            ppState._plateNativeSize.z
        );
        if (plateMax <= 0 || modelMax <= 0) return;

        // Scale plate to ~40% of model's largest dimension
        const targetRatio = 0.4;
        const autoScale = (modelMax * targetRatio) / plateMax;

        ppState.plateScale = parseFloat(autoScale.toFixed(4));

        // Update the scale input field
        const el = $('#pp-plate-scale');
        if (el) el.value = ppState.plateScale;
        const pctEl = $('#pp-plate-scale-pct');
        if (pctEl) pctEl.textContent = (ppState.plateScale * 100).toFixed(0) + '%';

        // ── Offset the plate so it sits at least 1 grid square away ──
        // Grid: gridSize / 20 divisions = 1 square width (matches main viewer)
        const gridSize = modelMax * 3;
        const gridSquare = gridSize / 20;

        // Half-widths along X at their respective scales
        const modelHalfX = ppState._modelNativeSize.x / 2;
        const plateHalfX = (ppState._plateNativeSize.x * ppState.plateScale) / 2;

        // Place plate so its nearest edge is 1 grid square from model's edge
        const offsetX = modelHalfX + gridSquare + plateHalfX;

        ppState.platePos.x = offsetX;
        ppState.platePos.y = 0;
        ppState.platePos.z = 0;

        // Sync UI inputs
        const pxEl = $('#pp-plate-x');
        if (pxEl) pxEl.value = ppState.platePos.x.toFixed(1);
        const pyEl = $('#pp-plate-y');
        if (pyEl) pyEl.value = '0';
        const pzEl = $('#pp-plate-z');
        if (pzEl) pzEl.value = '0';
    }

    function applyScales() {
        // Model always stays at native scale (1.0)
        if (ppState.plate) {
            ppState.plate.scale.setScalar(ppState.plateScale);
        }
    }

    // ================================================================
    //  Offset Management
    // ================================================================
    function updateOffsets() {
        const dx = ppState.platePos.x - ppState.modelPos.x;
        const dy = ppState.platePos.y - ppState.modelPos.y;
        const dz = ppState.platePos.z - ppState.modelPos.z;

        const dxEl = $('#pp-delta-x');
        const dyEl = $('#pp-delta-y');
        const dzEl = $('#pp-delta-z');
        if (dxEl) dxEl.textContent = dx.toFixed(1) + ' mm';
        if (dyEl) dyEl.textContent = dy.toFixed(1) + ' mm';
        if (dzEl) dzEl.textContent = dz.toFixed(1) + ' mm';

        // Move model in scene
        if (ppState.model) {
            const c = ppState._modelCenter || new THREE.Vector3();
            ppState.model.position.set(
                -c.x + ppState.modelPos.x,
                -c.y + ppState.modelPos.y,
                -c.z + ppState.modelPos.z
            );
        }

        // Move plate in scene
        if (ppState.plate) {
            const c = ppState._plateCenter || new THREE.Vector3();
            ppState.plate.position.set(
                -c.x + ppState.platePos.x,
                -c.y + ppState.platePos.y,
                -c.z + ppState.platePos.z
            );
        }
    }

    function wireOffsetInputs() {
        const fields = [
            { id: 'pp-model-x', target: 'modelPos', axis: 'x' },
            { id: 'pp-model-y', target: 'modelPos', axis: 'y' },
            { id: 'pp-model-z', target: 'modelPos', axis: 'z' },
            { id: 'pp-plate-x', target: 'platePos', axis: 'x' },
            { id: 'pp-plate-y', target: 'platePos', axis: 'y' },
            { id: 'pp-plate-z', target: 'platePos', axis: 'z' },
        ];

        fields.forEach(f => {
            const el = $('#' + f.id);
            if (!el) return;
            el.addEventListener('input', () => {
                const val = parseFloat(el.value) || 0;
                ppState[f.target][f.axis] = val;
                updateOffsets();
            });
        });

        // Scale input (plate only — model stays at native scale)
        const plateScaleEl = $('#pp-plate-scale');

        if (plateScaleEl) {
            plateScaleEl.addEventListener('input', () => {
                ppState.plateScale = parseFloat(plateScaleEl.value) || 1;
                const pctEl = $('#pp-plate-scale-pct');
                if (pctEl) pctEl.textContent = (ppState.plateScale * 100).toFixed(0) + '%';
                applyScales();
                updateOffsets();
            });
        }

        // Reset button
        const resetBtn = $('#pp-reset-positions');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                ppState.modelPos = { x: 0, y: 0, z: 0 };
                ppState.platePos = { x: 0, y: 0, z: 0 };
                ppState.plateScale = 1.0;
                ppState._autoScaled = false;
                fields.forEach(f => {
                    const el = $('#' + f.id);
                    if (el) el.value = '0';
                });
                if (plateScaleEl) plateScaleEl.value = '1';
                const pPct = $('#pp-plate-scale-pct');
                if (pPct) pPct.textContent = '100%';
                autoScalePlateToModel();
                applyScales();
                updateOffsets();
            });
        }
    }

    // ================================================================
    //  Controls Wiring
    // ================================================================
    function wirePlacerControls() {
        // File input
        const fileInput = $('#pp-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', e => {
                const file = e.target.files[0];
                if (!file) return;
                if (!(window.HXXLoader && HXXLoader.isXOrHXX(file.name))) {
                    alert('Please select a .x or .hxx file.');
                    return;
                }
                ppState.loadedFileName = file.name;
                if (HXXLoader.isHXXFilename(file.name)) {
                    const reader = new FileReader();
                    reader.onload = function () {
                        HXXLoader.toXFileBlob(reader.result).then(function (blob) {
                            loadXFilePlacer(URL.createObjectURL(blob));
                        }).catch(function (err) {
                            console.error('[PlatePlacer] HXX error:', err);
                            alert('Failed to parse .hxx file: ' + (err.message || err));
                        });
                    };
                    reader.readAsArrayBuffer(file);
                } else {
                    const url = URL.createObjectURL(file);
                    loadXFilePlacer(url);
                }
                fileInput.value = '';
            });
        }

        // Open button
        const openBtn = $('#pp-open');
        if (openBtn && fileInput) {
            openBtn.addEventListener('click', () => fileInput.click());
        }

        // Drag & drop
        const host = $('#placer-host');
        const dropzone = $('#pp-dropzone');
        if (host) {
            let dragCtr = 0;
            host.addEventListener('dragenter', e => {
                e.preventDefault();
                dragCtr++;
                if (dragCtr === 1 && dropzone) dropzone.classList.remove('viewer-hidden');
            });
            host.addEventListener('dragover', e => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            host.addEventListener('dragleave', e => {
                e.preventDefault();
                dragCtr--;
                if (dragCtr <= 0) {
                    dragCtr = 0;
                    if (dropzone) dropzone.classList.add('viewer-hidden');
                }
            });
            host.addEventListener('drop', e => {
                e.preventDefault();
                dragCtr = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');
                const file = e.dataTransfer.files[0];
                if (file && window.HXXLoader && HXXLoader.isXOrHXX(file.name)) {
                    ppState.loadedFileName = file.name;
                    if (HXXLoader.isHXXFilename(file.name)) {
                        const reader = new FileReader();
                        reader.onload = function () {
                            HXXLoader.toXFileBlob(reader.result).then(function (blob) {
                                loadXFilePlacer(URL.createObjectURL(blob));
                            }).catch(function (err) {
                                console.error('[PlatePlacer] HXX drop error:', err);
                            });
                        };
                        reader.readAsArrayBuffer(file);
                    } else {
                        loadXFilePlacer(URL.createObjectURL(file));
                    }
                }
            });
        }
    }

    // ================================================================
    //  Floating Toolbar
    // ================================================================
    function wirePlacerToolbar() {
        const toolbar  = $('#pp-toolbar');
        const toggle   = $('#pp-vt-toggle');
        const resetCam = $('#pp-vt-reset-cam');
        const zoomFit  = $('#pp-vt-zoom-fit');
        const wireBtn  = $('#pp-vt-wireframe');
        const perspBtn = $('#pp-vt-perspective');
        const gridBtn  = $('#pp-btn-grid');
        const zoomIn   = $('#pp-vt-zoom-in');
        const zoomOut  = $('#pp-vt-zoom-out');
        const panBtn   = $('#pp-vt-pan');

        if (toggle && toolbar) {
            const ppBody = $('#pp-vt-body');
            toggle.addEventListener('click', () => {
                ppState.toolbarCollapsed = !ppState.toolbarCollapsed;
                if (ppBody) ppBody.classList.toggle('collapsed', ppState.toolbarCollapsed);
            });
        }

        if (resetCam) {
            resetCam.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls) return;
                const mdl = ppState.scene ? ppState.scene.getObjectByName('__ppmodel__') : null;
                if (mdl) {
                    const box = new THREE.Box3().setFromObject(mdl);
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    DeckUnits.fitCamera(ppState.camera, ppState.controls, maxDim, { fitMultiplier: 1.8 });
                } else {
                    ppState.camera.position.set(120, 100, 200);
                    ppState.camera.near = 0.01;
                    ppState.camera.far  = 100000;
                    ppState.camera.updateProjectionMatrix();
                    ppState.controls.target.set(0, 0, 0);
                    ppState.controls.update();
                }
            });
        }

        if (zoomFit) {
            zoomFit.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls || !ppState.scene) return;
                // Fit to encompass both model and plate
                const box = new THREE.Box3();
                if (ppState.model) box.expandByObject(ppState.model);
                if (ppState.plate) box.expandByObject(ppState.plate);
                if (box.isEmpty()) return;
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                if (maxDim <= 0) return;
                DeckUnits.fitCamera(ppState.camera, ppState.controls, maxDim, { fitMultiplier: 1.5 });
            });
        }

        if (wireBtn) {
            wireBtn.addEventListener('click', () => {
                ppState.wireframe = !ppState.wireframe;
                wireBtn.classList.toggle('is-active', ppState.wireframe);
                const toggleWire = obj => {
                    if (!obj) return;
                    obj.traverse(child => {
                        if (child.material) {
                            const mats = Array.isArray(child.material) ? child.material : [child.material];
                            mats.forEach(m => { m.wireframe = ppState.wireframe; });
                        }
                    });
                };
                toggleWire(ppState.model);
                toggleWire(ppState.plate);
            });
        }

        if (perspBtn) {
            perspBtn.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls) return;
                const host = $('#placer-host');
                const w = host.clientWidth || 800;
                const h = host.clientHeight || 600;
                ppState.isPerspective = !ppState.isPerspective;
                perspBtn.classList.toggle('is-active', !ppState.isPerspective);

                const pos = ppState.camera.position.clone();
                const target = ppState.controls.target.clone();

                // Compute model-aware near/far to prevent clipping
                let nearPlane = 0.01, farPlane = 100000;
                const mdl = ppState.scene ? ppState.scene.getObjectByName('__ppmodel__') : null;
                if (mdl) {
                    const mdlBox = new THREE.Box3().setFromObject(mdl);
                    const mdlSize = mdlBox.getSize(new THREE.Vector3());
                    const mdlMax = Math.max(mdlSize.x, mdlSize.y, mdlSize.z);
                    if (mdlMax > 0) { nearPlane = mdlMax * 0.001; farPlane = mdlMax * 100; }
                }

                if (ppState.isPerspective) {
                    ppState.camera = new THREE.PerspectiveCamera(45, w / h, nearPlane, farPlane);
                    perspBtn.querySelector('i').className = 'fas fa-cube';
                } else {
                    const dist = pos.distanceTo(target);
                    const frustumSize = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
                    ppState.camera = new THREE.OrthographicCamera(
                        -frustumSize * (w / h), frustumSize * (w / h),
                        frustumSize, -frustumSize,
                        nearPlane, farPlane
                    );
                    perspBtn.querySelector('i').className = 'fas fa-vector-square';
                }

                ppState.camera.position.copy(pos);
                ppState.camera.up.set(0, 1, 0);
                ppState.camera.lookAt(target);

                ppState.controls.dispose();
                ppState.controls = new THREE.OrbitControls(ppState.camera, ppState.renderer.domElement);
                ppState.controls.enableDamping = true;
                ppState.controls.dampingFactor = 0.12;
                ppState.controls.target.copy(target);
                ppState.controls.update();
            });
        }

        if (gridBtn) {
            gridBtn.addEventListener('click', () => {
                ppState.gridVisible = !ppState.gridVisible;
                gridBtn.classList.toggle('grid-off', !ppState.gridVisible);
                if (ppState.scene) {
                    const grid = ppState.scene.getObjectByName('__ppgrid__');
                    if (grid) grid.visible = ppState.gridVisible;
                }
            });
        }

        if (zoomIn) {
            zoomIn.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls) return;
                const dir = ppState.camera.position.clone().sub(ppState.controls.target);
                dir.multiplyScalar(0.75);
                ppState.camera.position.copy(ppState.controls.target.clone().add(dir));
                ppState.controls.update();
            });
        }

        if (zoomOut) {
            zoomOut.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls) return;
                const dir = ppState.camera.position.clone().sub(ppState.controls.target);
                dir.multiplyScalar(1.35);
                ppState.camera.position.copy(ppState.controls.target.clone().add(dir));
                ppState.controls.update();
            });
        }

        if (panBtn) {
            panBtn.addEventListener('click', () => {
                ppState.isPanning = !ppState.isPanning;
                panBtn.classList.toggle('is-active', ppState.isPanning);
                if (ppState.controls) {
                    ppState.controls.mouseButtons.LEFT = ppState.isPanning
                        ? THREE.MOUSE.PAN
                        : THREE.MOUSE.ROTATE;
                }
            });
        }
    }

    // ================================================================
    //  Gizmo
    // ================================================================
    function drawPlacerGizmo() {
        const canvas = $('#pp-gizmo-canvas');
        if (!canvas || !ppState.camera) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 28;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2, cy = size / 2, len = 9;

        const camDir = new THREE.Vector3();
        ppState.camera.getWorldDirection(camDir);
        const camUp = ppState.camera.up.clone().normalize();
        const camRight = new THREE.Vector3().crossVectors(camDir, camUp).normalize();
        const camActualUp = new THREE.Vector3().crossVectors(camRight, camDir).normalize();

        const axes = [
            { label: 'X', color: '#e74c6f', dir: new THREE.Vector3(1, 0, 0) },
            { label: 'Y', color: '#8bc34a', dir: new THREE.Vector3(0, 1, 0) },
            { label: 'Z', color: '#4a90d9', dir: new THREE.Vector3(0, 0, 1) },
        ];

        const projected = axes.map(a => {
            const x2d = a.dir.dot(camRight);
            const y2d = -a.dir.dot(camActualUp);
            const depth = a.dir.dot(camDir);
            return { label: a.label, color: a.color, x: x2d, y: y2d, depth: depth };
        });
        projected.sort((a, b) => b.depth - a.depth);

        projected.forEach(p => {
            const ex = cx + p.x * len;
            const ey = cy + p.y * len;
            const isBehind = p.depth > 0.3;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = isBehind ? 'rgba(120,130,145,0.25)' : p.color;
            ctx.lineWidth = isBehind ? 1 : 2;
            ctx.stroke();

            const r = isBehind ? 2 : 3.5;
            ctx.beginPath();
            ctx.arc(ex, ey, r, 0, Math.PI * 2);
            if (isBehind) {
                ctx.fillStyle = 'rgba(120,130,145,0.2)';
                ctx.strokeStyle = 'rgba(120,130,145,0.35)';
                ctx.lineWidth = 1;
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 5px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.label, ex, ey + 0.5);
            }
        });

        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,190,200,0.5)';
        ctx.fill();
    }

    // ================================================================
    //  Camera Display
    // ================================================================
    function updatePlacerCamDisplay() {
        const el = $('#pp-cam-display');
        if (!el || !ppState.camera) return;
        const p = ppState.camera.position;
        const dir = new THREE.Vector3();
        ppState.camera.getWorldDirection(dir);
        const pitch = THREE.MathUtils.radToDeg(Math.asin(dir.y));
        const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
        const roll = THREE.MathUtils.radToDeg(ppState.camera.rotation.z);
        el.textContent =
            'X: ' + p.x.toFixed(1) + ' mm' +
            '  Y: ' + p.y.toFixed(1) + ' mm' +
            '  Z: ' + p.z.toFixed(1) + ' mm' +
            '  |  Pitch: ' + pitch.toFixed(1) + '\u00b0' +
            '  Yaw: ' + yaw.toFixed(1) + '\u00b0' +
            '  Roll: ' + roll.toFixed(1) + '\u00b0';
    }

    // ================================================================
    //  Screenshot & Export
    // ================================================================

    function ppDownloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    function ppFileName() {
        return (ppState.loadedFileName || 'plate-placer').replace(/\.[^.]+$/, '');
    }

    function ppGetModel() {
        return ppState.scene ? ppState.scene.getObjectByName('__ppmodel__') : null;
    }

    /** Vector SVG export – projects every visible triangle through the camera */
    function ppExportVectorSVG() {
        if (!ppState.scene || !ppState.camera) return '';
        const w = ppState.renderer.domElement.width;
        const h = ppState.renderer.domElement.height;
        ppState.scene.updateMatrixWorld(true);
        ppState.camera.updateMatrixWorld(true);
        const viewMatrix = ppState.camera.matrixWorldInverse.clone();
        const projMatrix = ppState.camera.projectionMatrix.clone();
        const vpMatrix = new THREE.Matrix4().multiplyMatrices(projMatrix, viewMatrix);
        const tris = [];

        ppState.scene.traverse(function (obj) {
            if (!obj.isMesh) return;
            if (obj.name === '__ppgrid__' || obj.name === '__exgrid__') return;
            let skip = false;
            let par = obj.parent;
            while (par) {
                if (par.isGridHelper || par.name === '__ppgrid__' || par.name === '__exgrid__') { skip = true; break; }
                par = par.parent;
            }
            if (skip) return;

            const geom = obj.geometry;
            if (!geom || !geom.attributes || !geom.attributes.position) return;
            const worldMatrix = obj.matrixWorld;
            const mvp = new THREE.Matrix4().multiplyMatrices(vpMatrix, worldMatrix);
            const pos = geom.attributes.position;
            const mat = obj.material;
            const mats = Array.isArray(mat) ? mat : [mat];
            const m = mats[0];
            let baseR = 0.7, baseG = 0.7, baseB = 0.7, baseA = 1.0;
            if (m && m.color) { baseR = m.color.r; baseG = m.color.g; baseB = m.color.b; }
            if (m && m.opacity !== undefined) baseA = m.opacity;

            let indices = geom.index;
            if (!indices) {
                const arr = [];
                for (let i = 0; i < pos.count; i++) arr.push(i);
                geom.setIndex(arr);
                indices = geom.index;
            }
            const faceCount = indices.count / 3;
            const v3a = new THREE.Vector3(), v3b = new THREE.Vector3(), v3c = new THREE.Vector3();

            for (let f = 0; f < faceCount; f++) {
                const i0 = indices.getX(f * 3), i1 = indices.getX(f * 3 + 1), i2 = indices.getX(f * 3 + 2);
                v3a.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0)).applyMatrix4(worldMatrix);
                v3b.set(pos.getX(i1), pos.getY(i1), pos.getZ(i1)).applyMatrix4(worldMatrix);
                v3c.set(pos.getX(i2), pos.getY(i2), pos.getZ(i2)).applyMatrix4(worldMatrix);
                const edge1 = new THREE.Vector3().subVectors(v3b, v3a);
                const edge2 = new THREE.Vector3().subVectors(v3c, v3a);
                const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
                const centroidWorld = new THREE.Vector3().addVectors(v3a, v3b).add(v3c).multiplyScalar(1 / 3);
                const viewDir = new THREE.Vector3().subVectors(ppState.camera.position, centroidWorld).normalize();
                if (faceNormal.dot(viewDir) < 0) continue;
                const p0 = new THREE.Vector3(pos.getX(i0), pos.getY(i0), pos.getZ(i0)).applyMatrix4(mvp);
                const p1 = new THREE.Vector3(pos.getX(i1), pos.getY(i1), pos.getZ(i1)).applyMatrix4(mvp);
                const p2 = new THREE.Vector3(pos.getX(i2), pos.getY(i2), pos.getZ(i2)).applyMatrix4(mvp);
                if (p0.z < -1 || p1.z < -1 || p2.z < -1) continue;
                if (p0.z > 1 || p1.z > 1 || p2.z > 1) continue;
                const sx0 = (p0.x * 0.5 + 0.5) * w, sy0 = (-p0.y * 0.5 + 0.5) * h;
                const sx1 = (p1.x * 0.5 + 0.5) * w, sy1 = (-p1.y * 0.5 + 0.5) * h;
                const sx2 = (p2.x * 0.5 + 0.5) * w, sy2 = (-p2.y * 0.5 + 0.5) * h;
                const shade = Math.max(0.15, faceNormal.dot(viewDir));
                const cr = Math.min(255, Math.round(baseR * shade * 255));
                const cg = Math.min(255, Math.round(baseG * shade * 255));
                const cb = Math.min(255, Math.round(baseB * shade * 255));
                tris.push({
                    points: sx0.toFixed(2) + ',' + sy0.toFixed(2) + ' ' + sx1.toFixed(2) + ',' + sy1.toFixed(2) + ' ' + sx2.toFixed(2) + ',' + sy2.toFixed(2),
                    fill: 'rgb(' + cr + ',' + cg + ',' + cb + ')',
                    opacity: baseA,
                    depth: (p0.z + p1.z + p2.z) / 3,
                });
            }
        });

        tris.sort(function (a, b) { return b.depth - a.depth; });
        const bgColor = ppState.isDark ? '#1b2838' : '#f0f0f0';
        const parts = [];
        parts.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
        parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">');
        parts.push('<rect width="100%" height="100%" fill="' + bgColor + '"/>');
        for (let i = 0; i < tris.length; i++) {
            const t = tris[i];
            parts.push('<polygon points="' + t.points + '" fill="' + t.fill + '"' + (t.opacity < 1 ? ' opacity="' + t.opacity.toFixed(3) + '"' : '') + ' stroke="' + t.fill + '" stroke-width="0.5"/>');
        }
        parts.push('</svg>');
        return parts.join('\n');
    }

    function ppSaveScreenshot(format, opts) {
        if (!ppState.renderer || !ppState.scene || !ppState.camera) return;

        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = ppState.scene.getObjectByName('__ppgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && ppState.gridVisible;

        const origBg = ppState.scene.background;
        if (!showBg) {
            ppState.scene.background = null;
            ppState.renderer.setClearColor(0x000000, 0);
        }

        ppState.renderer.render(ppState.scene, ppState.camera);
        const canvas = ppState.renderer.domElement;
        const fileName = ppFileName();
        if (format === 'svg') {
            const svgContent = ppExportVectorSVG();
            ppDownloadBlob(new Blob([svgContent], { type: 'image/svg+xml' }), fileName + '.svg');
        } else if (format === 'jpg') {
            canvas.toBlob(function (blob) { if (blob) ppDownloadBlob(blob, fileName + '.jpg'); }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function (blob) { if (blob) ppDownloadBlob(blob, fileName + '.png'); }, 'image/png');
        }

        // Restore
        if (grid) grid.visible = origGridVis;
        ppState.scene.background = origBg;
        if (!showBg) ppState.renderer.setClearColor(ppState.isDark ? DARK_BG : LIGHT_BG, 1);
        ppState.renderer.render(ppState.scene, ppState.camera);
    }

    function ppScreenshotPreviewDataURL(opts) {
        if (!ppState.renderer || !ppState.scene || !ppState.camera) return '';

        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = ppState.scene.getObjectByName('__ppgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && ppState.gridVisible;

        const origBg = ppState.scene.background;
        if (!showBg) {
            ppState.scene.background = null;
            ppState.renderer.setClearColor(0x000000, 0);
        }

        ppState.renderer.render(ppState.scene, ppState.camera);
        const dataURL = ppState.renderer.domElement.toDataURL('image/png');

        if (grid) grid.visible = origGridVis;
        ppState.scene.background = origBg;
        if (!showBg) ppState.renderer.setClearColor(ppState.isDark ? DARK_BG : LIGHT_BG, 1);
        ppState.renderer.render(ppState.scene, ppState.camera);

        return dataURL;
    }

    // ── OBJ ──────────────────────────────────────────────────────
    function ppExportOBJ() {
        const model = ppGetModel();
        if (!model) return;
        const lines = [], mtlLines = [];
        const baseName = ppFileName();
        lines.push('# Exported from Direct3D Tools – Plate Placer');
        lines.push('mtllib ' + baseName + '.mtl');
        lines.push('');
        let vertOffset = 1, normOffset = 1, uvOffset = 1, meshIdx = 0;
        model.updateMatrixWorld(true);
        model.traverse(function (child) {
            if (!child.isMesh) return;
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);
            if (!geom.index) { const idx = []; for (let i = 0; i < geom.attributes.position.count; i++) idx.push(i); geom.setIndex(idx); }
            const pos = geom.attributes.position, norm = geom.attributes.normal, uv = geom.attributes.uv, idx = geom.index;
            const faceCount = idx.count / 3;
            const matName = 'Material_' + meshIdx++;
            const mat = child.material || new THREE.MeshStandardMaterial();
            const m = Array.isArray(mat) ? mat[0] : mat;
            const r = m.color ? m.color.r : 0.7, g = m.color ? m.color.g : 0.7, b = m.color ? m.color.b : 0.7;
            mtlLines.push('newmtl ' + matName, 'Kd ' + r.toFixed(6) + ' ' + g.toFixed(6) + ' ' + b.toFixed(6));
            if (m.specular) mtlLines.push('Ks ' + m.specular.r.toFixed(6) + ' ' + m.specular.g.toFixed(6) + ' ' + m.specular.b.toFixed(6));
            mtlLines.push('d ' + (m.opacity !== undefined ? m.opacity : 1).toFixed(6), '');
            lines.push('g Mesh_' + (meshIdx - 1), 'usemtl ' + matName);
            for (let i = 0; i < pos.count; i++) lines.push('v ' + pos.getX(i).toFixed(6) + ' ' + pos.getY(i).toFixed(6) + ' ' + pos.getZ(i).toFixed(6));
            if (norm) for (let i = 0; i < norm.count; i++) lines.push('vn ' + norm.getX(i).toFixed(6) + ' ' + norm.getY(i).toFixed(6) + ' ' + norm.getZ(i).toFixed(6));
            if (uv) for (let i = 0; i < uv.count; i++) lines.push('vt ' + uv.getX(i).toFixed(6) + ' ' + uv.getY(i).toFixed(6));
            for (let f = 0; f < faceCount; f++) {
                const a = idx.getX(f * 3) + vertOffset, b2 = idx.getX(f * 3 + 1) + vertOffset, c = idx.getX(f * 3 + 2) + vertOffset;
                if (norm && uv) {
                    const na = idx.getX(f * 3) + normOffset, nb = idx.getX(f * 3 + 1) + normOffset, nc = idx.getX(f * 3 + 2) + normOffset;
                    const ta = idx.getX(f * 3) + uvOffset, tb = idx.getX(f * 3 + 1) + uvOffset, tc = idx.getX(f * 3 + 2) + uvOffset;
                    lines.push('f ' + a + '/' + ta + '/' + na + ' ' + b2 + '/' + tb + '/' + nb + ' ' + c + '/' + tc + '/' + nc);
                } else if (norm) {
                    const na = idx.getX(f * 3) + normOffset, nb = idx.getX(f * 3 + 1) + normOffset, nc = idx.getX(f * 3 + 2) + normOffset;
                    lines.push('f ' + a + '//' + na + ' ' + b2 + '//' + nb + ' ' + c + '//' + nc);
                } else {
                    lines.push('f ' + a + ' ' + b2 + ' ' + c);
                }
            }
            vertOffset += pos.count;
            if (norm) normOffset += norm.count;
            if (uv) uvOffset += uv.count;
            lines.push('');
            geom.dispose();
        });
        ppDownloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), baseName + '.obj');
        if (mtlLines.length > 0) ppDownloadBlob(new Blob([mtlLines.join('\n')], { type: 'text/plain' }), baseName + '.mtl');
    }

    // ── STL (binary) ─────────────────────────────────────────────
    function ppExportSTL() {
        const model = ppGetModel();
        if (!model) return;
        model.updateMatrixWorld(true);
        let totalTris = 0;
        model.traverse(child => { if (!child.isMesh) return; const g = child.geometry; totalTris += Math.floor((g.index ? g.index.count : g.attributes.position.count) / 3); });
        const bufLen = 80 + 4 + totalTris * 50;
        const buffer = new ArrayBuffer(bufLen);
        const dv = new DataView(buffer);
        const headerStr = 'Exported from Direct3D Tools – Plate Placer';
        for (let i = 0; i < headerStr.length && i < 80; i++) dv.setUint8(i, headerStr.charCodeAt(i));
        dv.setUint32(80, totalTris, true);
        let offset = 84;
        model.traverse(child => {
            if (!child.isMesh) return;
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);
            if (!geom.index) { const indices = []; for (let i = 0; i < geom.attributes.position.count; i++) indices.push(i); geom.setIndex(indices); }
            if (!geom.attributes.normal) geom.computeVertexNormals();
            const pos = geom.attributes.position, norm = geom.attributes.normal, idx = geom.index;
            const faceCount = idx.count / 3;
            for (let f = 0; f < faceCount; f++) {
                const i0 = idx.getX(f * 3), i1 = idx.getX(f * 3 + 1), i2 = idx.getX(f * 3 + 2);
                dv.setFloat32(offset, (norm.getX(i0) + norm.getX(i1) + norm.getX(i2)) / 3, true); offset += 4;
                dv.setFloat32(offset, (norm.getY(i0) + norm.getY(i1) + norm.getY(i2)) / 3, true); offset += 4;
                dv.setFloat32(offset, (norm.getZ(i0) + norm.getZ(i1) + norm.getZ(i2)) / 3, true); offset += 4;
                for (const vi of [i0, i1, i2]) {
                    dv.setFloat32(offset, pos.getX(vi), true); offset += 4;
                    dv.setFloat32(offset, pos.getY(vi), true); offset += 4;
                    dv.setFloat32(offset, pos.getZ(vi), true); offset += 4;
                }
                dv.setUint16(offset, 0, true); offset += 2;
            }
            geom.dispose();
        });
        ppDownloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), ppFileName() + '.stl');
    }

    // ── GLB ──────────────────────────────────────────────────────
    function ppExportGLB() {
        const model = ppGetModel();
        if (!model) return;
        model.updateMatrixWorld(true);
        const meshes = [];
        model.traverse(child => { if (child.isMesh) meshes.push(child); });
        if (meshes.length === 0) return;
        const bufferParts = [];
        let totalBufSize = 0;
        const accessors = [], bufferViews = [], gltfMeshes = [], gltfNodes = [], materials = [];
        function padTo4(buf) { const rem = buf.byteLength % 4; if (rem === 0) return buf; const padded = new ArrayBuffer(buf.byteLength + (4 - rem)); new Uint8Array(padded).set(new Uint8Array(buf)); return padded; }
        meshes.forEach((child, mi) => {
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);
            if (!geom.index) { const idx = []; for (let i = 0; i < geom.attributes.position.count; i++) idx.push(i); geom.setIndex(idx); }
            const pos = geom.attributes.position, norm = geom.attributes.normal, idx = geom.index;
            const srcMat = child.material || new THREE.MeshStandardMaterial();
            const m = Array.isArray(srcMat) ? srcMat[0] : srcMat;
            materials.push({ pbrMetallicRoughness: { baseColorFactor: [m.color ? m.color.r : 0.7, m.color ? m.color.g : 0.7, m.color ? m.color.b : 0.7, m.opacity !== undefined ? m.opacity : 1.0], metallicFactor: m.metalness !== undefined ? m.metalness : 0.0, roughnessFactor: m.roughness !== undefined ? m.roughness : 0.8 }, name: 'Material_' + mi });
            // Indices
            const idxArr = new Uint32Array(idx.count);
            for (let i = 0; i < idx.count; i++) idxArr[i] = idx.getX(i);
            const idxBuf = padTo4(idxArr.buffer);
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: idxArr.byteLength, target: 34963 });
            accessors.push({ bufferView: bufferViews.length - 1, componentType: 5125, count: idx.count, type: 'SCALAR', max: [pos.count - 1], min: [0] });
            const idxAccIdx = accessors.length - 1;
            bufferParts.push(idxBuf); totalBufSize += idxBuf.byteLength;
            // Positions
            const posArr = new Float32Array(pos.count * 3);
            let pMin = [Infinity, Infinity, Infinity], pMax = [-Infinity, -Infinity, -Infinity];
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                posArr[i * 3] = x; posArr[i * 3 + 1] = y; posArr[i * 3 + 2] = z;
                pMin[0] = Math.min(pMin[0], x); pMin[1] = Math.min(pMin[1], y); pMin[2] = Math.min(pMin[2], z);
                pMax[0] = Math.max(pMax[0], x); pMax[1] = Math.max(pMax[1], y); pMax[2] = Math.max(pMax[2], z);
            }
            const posBuf = padTo4(posArr.buffer);
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: posArr.byteLength, target: 34962, byteStride: 12 });
            accessors.push({ bufferView: bufferViews.length - 1, componentType: 5126, count: pos.count, type: 'VEC3', min: pMin, max: pMax });
            const posAccIdx = accessors.length - 1;
            bufferParts.push(posBuf); totalBufSize += posBuf.byteLength;
            // Normals
            let normAccIdx;
            if (norm) {
                const normArr = new Float32Array(norm.count * 3);
                for (let i = 0; i < norm.count; i++) { normArr[i * 3] = norm.getX(i); normArr[i * 3 + 1] = norm.getY(i); normArr[i * 3 + 2] = norm.getZ(i); }
                const normBuf = padTo4(normArr.buffer);
                bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: normArr.byteLength, target: 34962, byteStride: 12 });
                accessors.push({ bufferView: bufferViews.length - 1, componentType: 5126, count: norm.count, type: 'VEC3' });
                normAccIdx = accessors.length - 1;
                bufferParts.push(normBuf); totalBufSize += normBuf.byteLength;
            }
            const attributes = { POSITION: posAccIdx };
            if (normAccIdx !== undefined) attributes.NORMAL = normAccIdx;
            gltfMeshes.push({ primitives: [{ attributes, indices: idxAccIdx, material: mi }], name: 'Mesh_' + mi });
            gltfNodes.push({ mesh: mi, name: 'Node_' + mi });
            geom.dispose();
        });
        const gltfJson = { asset: { version: '2.0', generator: 'Direct3D Tools – Plate Placer' }, scene: 0, scenes: [{ nodes: gltfNodes.map((_, i) => i) }], nodes: gltfNodes, meshes: gltfMeshes, accessors, bufferViews, buffers: [{ byteLength: totalBufSize }], materials };
        const jsonStr = JSON.stringify(gltfJson);
        const jsonBuf = padTo4(new TextEncoder().encode(jsonStr).buffer);
        const binBuf = new ArrayBuffer(totalBufSize);
        const binView = new Uint8Array(binBuf);
        let off = 0;
        bufferParts.forEach(part => { binView.set(new Uint8Array(part), off); off += part.byteLength; });
        const binPadded = padTo4(binBuf);
        const glbLen = 12 + 8 + jsonBuf.byteLength + 8 + binPadded.byteLength;
        const glb = new ArrayBuffer(glbLen);
        const glbDV = new DataView(glb);
        glbDV.setUint32(0, 0x46546C67, true); glbDV.setUint32(4, 2, true); glbDV.setUint32(8, glbLen, true);
        let gp = 12;
        glbDV.setUint32(gp, jsonBuf.byteLength, true); gp += 4;
        glbDV.setUint32(gp, 0x4E4F534A, true); gp += 4;
        new Uint8Array(glb, gp, jsonBuf.byteLength).set(new Uint8Array(jsonBuf)); gp += jsonBuf.byteLength;
        glbDV.setUint32(gp, binPadded.byteLength, true); gp += 4;
        glbDV.setUint32(gp, 0x004E4942, true); gp += 4;
        new Uint8Array(glb, gp, binPadded.byteLength).set(new Uint8Array(binPadded));
        ppDownloadBlob(new Blob([glb], { type: 'model/gltf-binary' }), ppFileName() + '.glb');
    }

    function ppDoExport(fmt) {
        const model = ppGetModel();
        if (!model) { alert('No model loaded.'); return; }
        try {
            switch (fmt) {
                case 'obj': ppExportOBJ(); break;
                case 'stl': ppExportSTL(); break;
                case 'glb': ppExportGLB(); break;
                default: alert('Unknown format: ' + fmt);
            }
        } catch (err) {
            console.error('Placer export error:', err);
            alert('Export error: ' + err.message);
        }
    }

    function wireScreenshotExport() {
        // Screenshot button & dropdown
        // Screenshot button → open modal
        const ssBtn = $('#pp-screenshot');
        if (ssBtn) {
            ssBtn.addEventListener('click', () => {
                if (window.openScreenshotModal) window.openScreenshotModal('placer');
            });
        }

        // Export button & dropdown
        const exBtn = $('#pp-export');
        const exDrop = $('#pp-export-dropdown');
        if (exBtn && exDrop) {
            exBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exDrop.classList.toggle('is-open');
            });
            document.addEventListener('click', () => {
                if (exDrop) exDrop.classList.remove('is-open');
            });
            exDrop.addEventListener('click', (e) => e.stopPropagation());
            exDrop.querySelectorAll('.export-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    ppDoExport(btn.dataset.format);
                    exDrop.classList.remove('is-open');
                });
            });
        }
    }

    // ================================================================
    //  Theme sync
    // ================================================================
    function updatePlacerTheme() {
        ppState.isDark = document.documentElement.hasAttribute('data-theme');
        if (ppState.scene) {
            ppState.scene.background = new THREE.Color(ppState.isDark ? DARK_BG : LIGHT_BG);
            const grid = ppState.scene.getObjectByName('__ppgrid__');
            if (grid) {
                const c = new THREE.Color(ppState.isDark ? DARK_GRID : LIGHT_GRID);
                grid.material.color.copy(c);
            }
        }
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.PlacerModule = {
        init: initPlacer,
        updateTheme: updatePlacerTheme,
        saveScreenshot: ppSaveScreenshot,
        screenshotPreviewDataURL: ppScreenshotPreviewDataURL,
    };

})();
