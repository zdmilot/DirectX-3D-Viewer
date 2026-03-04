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

        animId: null,
        loadedFileName: '',
    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    // Standard SBS microwell plate dimensions (mm)
    const PLATE = {
        length: 127.76,
        width:  85.48,
        height: 14.35,
        wallThickness: 1.0,
        wellDepth: 10.5,
        rows: 8,
        cols: 12,
        wellDiameter: 6.96,
        wellSpacing: 9.0,   // center-to-center
        cornerRadius: 3.18,
        a1OffsetX: 14.38,   // distance from left edge to center of A1
        a1OffsetY: 11.24,   // distance from top edge to center of A1
    };

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initPlacer() {
        ppState.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updatePlacerTheme();
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
            preserveDrawingBuffer: true
        });
        ppState.renderer.setPixelRatio(window.devicePixelRatio);
        ppState.renderer.setSize(w, h);

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

        // -- Grid --
        const gc = ppState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(400, 40, gc, gc);
        grid.name = '__ppgrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = ppState.gridVisible;
        ppState.scene.add(grid);

        // -- Create the microwell plate --
        createMicrowellPlate();

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
            ppState.renderer.render(ppState.scene, ppState.camera);
            drawPlacerGizmo();
            updatePlacerCamDisplay();
        }
        tick();

        // -- Wire controls --
        wirePlacerControls();
        wirePlacerToolbar();
        wireOffsetInputs();
    }

    // ================================================================
    //  Microwell Plate Builder  (96-well SBS standard)
    // ================================================================
    function createMicrowellPlate() {
        const group = new THREE.Group();
        group.name = '__plate__';

        const plateMat = new THREE.MeshPhongMaterial({
            color: 0xe8e8e8,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
        });

        const plateMatDark = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
        });

        // Base plate body (hollow box)
        const outerGeo = new THREE.BoxGeometry(PLATE.length, PLATE.height, PLATE.width);
        const outerMesh = new THREE.Mesh(outerGeo, plateMat);
        outerMesh.position.set(PLATE.length / 2, PLATE.height / 2, PLATE.width / 2);
        group.add(outerMesh);

        // Plate rim / lip at the top
        const rimHeight = 1.2;
        const rimGeo = new THREE.BoxGeometry(
            PLATE.length + 2,
            rimHeight,
            PLATE.width + 2
        );
        const rimMesh = new THREE.Mesh(rimGeo, plateMatDark);
        rimMesh.position.set(PLATE.length / 2, PLATE.height + rimHeight / 2, PLATE.width / 2);
        group.add(rimMesh);

        // Wells (cylindrical indentations = just cylinder meshes on top)
        const wellGeo = new THREE.CylinderGeometry(
            PLATE.wellDiameter / 2,
            PLATE.wellDiameter / 2,
            PLATE.wellDepth,
            16
        );
        const wellMat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });

        // Bottom of each well
        const wellBottomGeo = new THREE.CircleGeometry(PLATE.wellDiameter / 2 - 0.3, 16);
        const wellBottomMat = new THREE.MeshPhongMaterial({
            color: 0xd0d0d0,
            side: THREE.DoubleSide,
        });

        for (let row = 0; row < PLATE.rows; row++) {
            for (let col = 0; col < PLATE.cols; col++) {
                const cx = PLATE.a1OffsetX + col * PLATE.wellSpacing;
                const cz = PLATE.a1OffsetY + row * PLATE.wellSpacing;
                const cy = PLATE.height - PLATE.wellDepth / 2 + 0.5;

                // Well cylinder
                const well = new THREE.Mesh(wellGeo, wellMat);
                well.position.set(cx, cy, cz);
                group.add(well);

                // Well bottom
                const bottom = new THREE.Mesh(wellBottomGeo, wellBottomMat);
                bottom.rotation.x = -Math.PI / 2;
                bottom.position.set(cx, PLATE.height - PLATE.wellDepth + 0.6, cz);
                group.add(bottom);
            }
        }

        // Well labels on the rim
        // We'll skip canvas-based labels for performance — the grid pattern makes it clear

        // Position plate so its center is near origin
        group.position.set(
            -PLATE.length / 2 + ppState.platePos.x,
            ppState.platePos.y,
            -PLATE.width / 2 + ppState.platePos.z
        );

        ppState.plate = group;
        ppState.scene.add(group);
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
                    const applyOffset = (m, idx) => {
                        if (idx > 0) {
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = idx;
                            m.polygonOffsetUnits  = idx * 4;
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

                // Fit camera
                const fitDist = Math.max(maxDim, 150) * 1.8;
                ppState.camera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
                ppState.camera.near = 0.1;
                ppState.camera.far = fitDist * 20;
                ppState.camera.updateProjectionMatrix();

                ppState.controls.target.set(0, 0, 0);
                ppState.controls.update();

                // Resize grid
                const oldGrid = ppState.scene.getObjectByName('__ppgrid__');
                if (oldGrid) ppState.scene.remove(oldGrid);
                const gridSize = Math.max(maxDim * 3, 400);
                const gColor = ppState.isDark ? DARK_GRID : LIGHT_GRID;
                const newGrid = new THREE.GridHelper(gridSize, 40, gColor, gColor);
                newGrid.name = '__ppgrid__';
                newGrid.renderOrder = -1;
                newGrid.material.depthWrite = false;
                newGrid.visible = ppState.gridVisible;
                newGrid.position.y = -size.y / 2 - maxDim * 0.002;
                ppState.scene.add(newGrid);
            }

            ppState.model = group;
            // Store the centering offset for position input zeroing
            ppState._modelCenter = center.clone();

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
    //  Offset Management
    // ================================================================
    function updateOffsets() {
        const dx = ppState.platePos.x - ppState.modelPos.x;
        const dy = ppState.platePos.y - ppState.modelPos.y;
        const dz = ppState.platePos.z - ppState.modelPos.z;

        const dxEl = $('#pp-delta-x');
        const dyEl = $('#pp-delta-y');
        const dzEl = $('#pp-delta-z');
        if (dxEl) dxEl.textContent = dx.toFixed(1);
        if (dyEl) dyEl.textContent = dy.toFixed(1);
        if (dzEl) dzEl.textContent = dz.toFixed(1);

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
            ppState.plate.position.set(
                -PLATE.length / 2 + ppState.platePos.x,
                ppState.platePos.y,
                -PLATE.width / 2 + ppState.platePos.z
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

        // Reset button
        const resetBtn = $('#pp-reset-positions');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                ppState.modelPos = { x: 0, y: 0, z: 0 };
                ppState.platePos = { x: 0, y: 0, z: 0 };
                fields.forEach(f => {
                    const el = $('#' + f.id);
                    if (el) el.value = '0';
                });
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
                if (!file.name.toLowerCase().endsWith('.x')) {
                    alert('Please select a .x file.');
                    return;
                }
                ppState.loadedFileName = file.name;
                const url = URL.createObjectURL(file);
                loadXFilePlacer(url);
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
                if (file && file.name.toLowerCase().endsWith('.x')) {
                    ppState.loadedFileName = file.name;
                    loadXFilePlacer(URL.createObjectURL(file));
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
            toggle.addEventListener('click', () => {
                ppState.toolbarCollapsed = !ppState.toolbarCollapsed;
                toolbar.classList.toggle('collapsed', ppState.toolbarCollapsed);
            });
        }

        if (resetCam) {
            resetCam.addEventListener('click', () => {
                if (!ppState.camera || !ppState.controls) return;
                const fitDist = 200;
                ppState.camera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
                ppState.controls.target.set(0, 0, 0);
                ppState.controls.update();
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
                const fitDist = maxDim * 1.5;
                const dir = ppState.camera.position.clone().sub(ppState.controls.target).normalize();
                ppState.camera.position.copy(dir.multiplyScalar(fitDist));
                ppState.controls.target.set(0, 0, 0);
                ppState.camera.updateProjectionMatrix();
                ppState.controls.update();
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

                if (ppState.isPerspective) {
                    ppState.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
                    perspBtn.querySelector('i').className = 'fas fa-cube';
                } else {
                    const dist = pos.distanceTo(target);
                    const frustumSize = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
                    ppState.camera = new THREE.OrthographicCamera(
                        -frustumSize * (w / h), frustumSize * (w / h),
                        frustumSize, -frustumSize,
                        0.1, 10000
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
        const size = 44;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2, cy = size / 2, len = 14;

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

            const r = isBehind ? 3 : 5;
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
                ctx.font = 'bold 7px Inter, sans-serif';
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
        el.textContent =
            'X: ' + p.x.toFixed(1) +
            '  Y: ' + p.y.toFixed(1) +
            '  Z: ' + p.z.toFixed(1);
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
    };

})();
