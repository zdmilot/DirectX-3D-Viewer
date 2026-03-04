/* ============================================================
   X File Viewer - Theme Toggle + Splash + Three.js .x Viewer
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    const dom = {
        btnTheme: $('#btn-theme'),
        btnGrid: $('#btn-grid'),
        fileInput: $('#file-input'),
        btnSidebarToggle: $('#btn-sidebar-toggle'),
        sidebarNav: $('#sidebar-nav'),
        viewerHost: null,   // set in initViewer
        dropzone: $('#viewer-dropzone'),
        navSubtitle: null,  // set dynamically
        // Floating toolbar
        viewerToolbar: $('#viewer-toolbar'),
        vtToggle: $('#vt-toggle'),
        vtBody: $('#vt-body'),
        vtOpen: $('#vt-open'),
        vtResetCam: $('#vt-reset-cam'),
        vtZoomFit: $('#vt-zoom-fit'),
        vtWireframe: $('#vt-wireframe'),
        vtPerspective: $('#vt-perspective'),
        vtZoomIn: $('#vt-zoom-in'),
        vtZoomOut: $('#vt-zoom-out'),
        vtPan: $('#vt-pan'),
        gizmoCanvas: $('#gizmo-canvas'),
    };

    const state = {
        isDark: false,
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,
        activeView: 'viewer',
        loadedFileName: 'test',
    };

    const DEFAULT_X_FILENAME = 'teapot_simple.x';

    // -- Splash Screen -----------------------------------------------
    function initSplash() {
        const splash = $('#splash-screen');
        const app = $('#app');
        setTimeout(() => {
            splash.classList.add('splash-fade-out');
            app.classList.remove('app-hidden');
            app.classList.add('app-visible');
            // Initialize 3D viewer after app is visible so canvas has dimensions
            setTimeout(() => initViewer(), 100);
        }, 2200);
        splash.addEventListener('transitionend', () => {
            splash.style.display = 'none';
        });
    }

    // -- Theme Toggle ------------------------------------------------
    function toggleTheme() {
        state.isDark = !state.isDark;
        applyTheme();
        updateViewerTheme();
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

    // -- File Open ---------------------------------------------------
    function openFileDialog() {
        dom.fileInput.click();
    }

    function handleFileSelected(e) {
        const file = e.target.files[0];
        if (!file) return;
        loadUserFile(file);
        // Reset input so re-selecting the same file triggers change
        dom.fileInput.value = '';
    }

    function loadUserFile(file) {
        if (!file.name.toLowerCase().endsWith('.x')) {
            alert('Please select a .x file.');
            return;
        }
        const url = URL.createObjectURL(file);
        const loading = $('#viewer-loading');
        const errorEl = $('#viewer-error');

        // Track loaded file name for screenshot naming
        state.loadedFileName = file.name;

        // Clear previous model
        clearModel();

        // Show loading
        if (loading) {
            loading.classList.remove('viewer-hidden');
            const span = loading.querySelector('span');
            if (span) span.textContent = 'Loading ' + file.name + '…';
        }
        if (errorEl) errorEl.classList.add('viewer-hidden');

        // Update filename display
        setFilenameDisplay();

        loadXFile(url, loading, errorEl);
    }

    function clearModel() {
        if (!scene) return;
        const old = scene.getObjectByName('__xmodel__');
        if (old) {
            old.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            scene.remove(old);
        }
        // Clear animation mixers
        animMixers.length = 0;
    }

    function setFilenameDisplay() {
        // Keep navbar subtitle fixed for this app
        const subtitle = document.querySelector('.navbar-subtitle');
        if (subtitle) {
            subtitle.textContent = 'FOR DIRECT3D';
        }
    }

    // -- Drag & Drop -------------------------------------------------
    let dragCounter = 0;

    function initDragDrop() {
        const host = dom.viewerHost;
        if (!host) return;

        host.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (dragCounter === 1) dom.dropzone.classList.remove('viewer-hidden');
        });

        host.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        host.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                dom.dropzone.classList.add('viewer-hidden');
            }
        });

        host.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            dom.dropzone.classList.add('viewer-hidden');
            const file = e.dataTransfer.files[0];
            if (file) loadUserFile(file);
        });
    }

    // -- Grid Toggle ------------------------------------------------
    function toggleGrid() {
        state.gridVisible = !state.gridVisible;
        dom.btnGrid.classList.toggle('grid-off', !state.gridVisible);
        dom.btnGrid.setAttribute('data-tooltip', state.gridVisible ? 'Hide bottom gridlines' : 'Show bottom gridlines');
        dom.btnGrid.setAttribute('aria-label', state.gridVisible ? 'Hide bottom gridlines' : 'Show bottom gridlines');
        if (scene) {
            const grid = scene.getObjectByName('__grid__');
            if (grid) grid.visible = state.gridVisible;
        }
        // Propagate to other applets
        if (window.ConverterModule && window.ConverterModule.setGridVisible) {
            window.ConverterModule.setGridVisible(state.gridVisible);
        }
        if (window.ExporterModule && window.ExporterModule.setGridVisible) {
            window.ExporterModule.setGridVisible(state.gridVisible);
        }
    }

    // ================================================================
    //  3D Viewer  –  Native .x file rendering via Three.js + XFileLoader
    // ================================================================
    let camera, scene, renderer, controls;
    let animationId = null;
    let animMixers = [];
    let lastTime = Date.now();

    const LIGHT_BG  = 0xf0f0f0;
    const DARK_BG   = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    function initViewer() {
        const canvas  = $('#viewer-canvas');
        const card    = $('#viewer-host');
        const loading = $('#viewer-loading');
        const errorEl = $('#viewer-error');

        console.log('[Viewer] initViewer called, canvas:', !!canvas, 'card:', !!card);
        if (!canvas || !card) {
            console.error('[Viewer] Missing canvas or card element');
            return;
        }

        const w = card.clientWidth  || 800;
        const h = card.clientHeight || 600;
        console.log('[Viewer] card dimensions:', w, 'x', h);

        // ── Scene ────────────────────────────────────────────
        scene = new THREE.Scene();
        scene.background = new THREE.Color(state.isDark ? DARK_BG : LIGHT_BG);

        // ── Camera ───────────────────────────────────────────
        camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        camera.position.set(0, 50, 150);
        camera.up.set(0, 1, 0);

        // ── Renderer ─────────────────────────────────────────
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);

        // ── Controls (orbit / pan / zoom) ────────────────────
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.target.set(0, 0, 0);
        controls.update();

        // ── Lights ───────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0x808080));

        const dir1 = new THREE.DirectionalLight(0xffffff, 0.9);
        dir1.position.set(50, 100, 50);
        scene.add(dir1);

        const dir2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        dir2.position.set(-50, -20, -50);
        scene.add(dir2);

        // ── Grid helper ──────────────────────────────────────
        const gridColor = state.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(200, 20, gridColor, gridColor);
        grid.name = '__grid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = state.gridVisible;
        scene.add(grid);

        // ── Resize handler ───────────────────────────────────
        const ro = new ResizeObserver(() => {
            const cw = card.clientWidth;
            const ch = card.clientHeight;
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();
            renderer.setSize(cw, ch);
        });
        ro.observe(card);

        // ── Start render loop ────────────────────────────────
        function tick() {
            animationId = requestAnimationFrame(tick);
            const now = Date.now();
            const dt = now - lastTime;
            lastTime = now;
            // Update animation mixers if any
            animMixers.forEach(m => m.update(dt / 1000));
            controls.update();
            renderer.render(scene, camera);
            // Update orientation gizmo
            drawGizmo();
            // Update camera position/angle display
            updateCamDisplay();
        }
        tick();

        // ── Drag & drop support ──────────────────────────────
        dom.viewerHost = card;
        initDragDrop();

        // ── Load the default .x model ────────────────────────
        console.log('[Viewer] Starting loadXFile...');
        setFilenameDisplay();
        loadXFile(DEFAULT_X_FILENAME, loading, errorEl);
    }

    /**
     * Load a .x file via XFileLoader and add it to the scene.
     * Automatically centers and scales the model to fit the view.
     */
    function loadXFile(url, loadingEl, errorEl) {
        console.log('[Viewer] loadXFile called with:', url);
        const finalUrl = (typeof url === 'string' && !/^blob:|^data:/i.test(url))
            ? url + (url.includes('?') ? '&' : '?') + '_ts=' + Date.now()
            : url;
        const manager = new THREE.LoadingManager();
        // Resolve texture paths relative to the model location
        const basePath = url.substring(0, url.lastIndexOf('/') + 1);
        manager.setURLModifier((texUrl) => {
            if (/\.(png|jpg|jpeg|bmp|tga)$/i.test(texUrl)) {
                return basePath + texUrl.split('/').pop();
            }
            return texUrl;
        });

        const loader = new THREE.XFileLoader(manager);

        // Update loading text to show parsing is happening
        if (loadingEl) {
            const span = loadingEl.querySelector('span');
            if (span) span.textContent = 'Loading 3D Model…';
        }

        loader.load(finalUrl, function (object) {
            // Hide loading spinner
            if (loadingEl) loadingEl.classList.add('viewer-hidden');

            // Handle parse errors returned inline
            if (object.error) {
                showError(errorEl, 'Parse error: ' + (object.error.message || object.error));
                console.error('XFileLoader parse error:', object.error);
                return;
            }

            if (!object.models || object.models.length === 0) {
                showError(errorEl, 'No meshes found in .x file.');
                return;
            }

            console.log('XFileLoader: loaded', object.models.length, 'model(s)');

            // Wrap all models in a group for easy manipulation
            const group = new THREE.Group();
            group.name = '__xmodel__';

            for (let i = 0; i < object.models.length; i++) {
                const model = object.models[i];
                // Assign unique renderOrder per mesh to eliminate z-fighting
                // between overlapping meshes from different frames
                model.renderOrder = i;

                // Apply polygon offset to prevent z-fighting between
                // overlapping meshes.  Mesh 0 (outer shell) gets zero
                // offset; later meshes are pushed progressively behind
                // so the outer shell always wins at coplanar surfaces.
                // This is symmetric — the same GPU polygonOffset math
                // applies identically regardless of viewing direction.
                if (model.material) {
                    const applyOffset = (m, meshIdx) => {
                        if (meshIdx > 0) {
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = meshIdx;
                            m.polygonOffsetUnits  = meshIdx * 4;
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

            scene.add(group);

            // ── Auto-fit: center & scale model to fill view ──
            const box = new THREE.Box3().setFromObject(group);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            if (maxDim > 0) {
                // Center the group
                group.position.sub(center);

                // Position camera to see the whole model
                const fitDist = maxDim * 1.8;
                camera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
                camera.near = maxDim * 0.05;
                camera.far = maxDim * 20;
                camera.updateProjectionMatrix();

                controls.target.set(0, 0, 0);
                controls.minDistance = maxDim * 0.1;
                controls.maxDistance = maxDim * 10;
                controls.update();

                // Resize grid to match model scale
                const oldGrid = scene.getObjectByName('__grid__');
                if (oldGrid) scene.remove(oldGrid);
                const gridSize = maxDim * 3;
                const gridDiv = 20;
                const gColor = state.isDark ? DARK_GRID : LIGHT_GRID;
                const newGrid = new THREE.GridHelper(gridSize, gridDiv, gColor, gColor);
                newGrid.name = '__grid__';
                // Render grid behind everything & disable depth write
                // so grid lines never z-fight with model surfaces
                newGrid.renderOrder = -1;
                newGrid.material.depthWrite = false;
                newGrid.visible = state.gridVisible;
                // Position grid slightly below model bottom to avoid z-fighting
                newGrid.position.y = -size.y / 2 - maxDim * 0.002;
                scene.add(newGrid);
            }

            // ── Handle animations if present ─────────────────
            if (object.animations && object.animations.length > 0) {
                object.models.forEach((model) => {
                    if (model.isSkinnedMesh) {
                        const mixer = new THREE.AnimationMixer(model);
                        animMixers.push(mixer);
                        object.animations.forEach((clip) => {
                            mixer.clipAction(clip).play();
                        });
                    }
                });
            }

        }, function (xhr) {
            // progress callback
            if (loadingEl && xhr && xhr.total) {
                const pct = Math.round((xhr.loaded / xhr.total) * 100);
                const span = loadingEl.querySelector('span');
                if (span) span.textContent = pct < 100
                    ? 'Processing… ' + pct + '%'
                    : 'Parsing 3D Model…';
            }
        }, function (err) {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showError(errorEl, 'Error loading .x file: ' + (err && err.message ? err.message : String(err)));
            console.error('XFileLoader error:', err);
        });
    }

    function showError(el, msg) {
        if (!el) return;
        el.classList.remove('viewer-hidden');
        const msgEl = el.querySelector('#viewer-error-msg');
        if (msgEl) msgEl.textContent = msg;
    }

    /** Update scene colors when theme changes */
    function updateViewerTheme() {
        if (!scene) return;
        scene.background = new THREE.Color(state.isDark ? DARK_BG : LIGHT_BG);
        const grid = scene.getObjectByName('__grid__');
        if (grid) {
            const c = new THREE.Color(state.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
            if (grid.material.uniforms) grid.material.uniforms.diffuse.value.copy(c);
        }
        // Also update converter theme
        if (window.ConverterModule) window.ConverterModule.updateTheme();
        if (window.ExporterModule) window.ExporterModule.updateTheme();
    }

    // ================================================================
    //  Sidebar View Switching
    // ================================================================
    function switchView(viewName) {
        if (state.activeView === viewName) return;
        state.activeView = viewName;

        // Update sidebar active states
        document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
            btn.classList.toggle('is-active', btn.dataset.view === viewName);
        });

        // Switch visible panel
        document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.toggle('is-active', panel.dataset.viewPanel === viewName);
        });

        // Initialize converter on first switch
        if (viewName === 'converter' && window.ConverterModule) {
            // Small delay to ensure panel has dimensions
            setTimeout(() => window.ConverterModule.init(), 50);
        }

        // Initialize exporter on first switch
        if (viewName === 'exporter' && window.ExporterModule) {
            setTimeout(() => window.ExporterModule.init(), 50);
        }

        // Auto-collapse sidebar after navigation
        if (dom.sidebarNav) {
            dom.sidebarNav.classList.add('collapsed');
        }
    }

    // ================================================================
    //  Floating Toolbar Controls
    // ================================================================

    function toggleToolbar() {
        state.toolbarCollapsed = !state.toolbarCollapsed;
        dom.viewerToolbar.classList.toggle('collapsed', state.toolbarCollapsed);
    }

    function resetCamera() {
        if (!camera || !controls) return;
        const model = scene ? scene.getObjectByName('__xmodel__') : null;
        if (model) {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fitDist = maxDim * 1.8;
            camera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
            controls.target.set(0, 0, 0);
            controls.update();
        } else {
            camera.position.set(0, 50, 150);
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }

    function zoomToFit() {
        if (!camera || !controls || !scene) return;
        const model = scene.getObjectByName('__xmodel__');
        if (!model) return;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim <= 0) return;
        const fitDist = maxDim * 1.5;
        // Animate-like quick snap
        const dir = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(dir.multiplyScalar(fitDist));
        controls.target.set(0, 0, 0);
        camera.updateProjectionMatrix();
        controls.update();
    }

    function toggleWireframe() {
        state.wireframe = !state.wireframe;
        dom.vtWireframe.classList.toggle('is-active', state.wireframe);
        if (!scene) return;
        const model = scene.getObjectByName('__xmodel__');
        if (!model) return;
        model.traverse(function (child) {
            if (child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(function (m) {
                    m.wireframe = state.wireframe;
                });
            }
        });
    }

    function togglePerspective() {
        if (!camera || !controls) return;
        const card = $('#viewer-host');
        const w = card.clientWidth || 800;
        const h = card.clientHeight || 600;
        state.isPerspective = !state.isPerspective;
        dom.vtPerspective.classList.toggle('is-active', !state.isPerspective);

        const pos = camera.position.clone();
        const target = controls.target.clone();

        if (state.isPerspective) {
            camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
            dom.vtPerspective.querySelector('i').className = 'fas fa-cube';
        } else {
            const dist = pos.distanceTo(target);
            const frustumSize = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
            camera = new THREE.OrthographicCamera(
                -frustumSize * (w / h), frustumSize * (w / h),
                frustumSize, -frustumSize,
                0.1, 10000
            );
            dom.vtPerspective.querySelector('i').className = 'fas fa-vector-square';
        }

        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(target);

        controls.dispose();
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        controls.target.copy(target);
        controls.update();
    }

    function doZoom(factor) {
        if (!camera || !controls) return;
        const dir = camera.position.clone().sub(controls.target);
        dir.multiplyScalar(factor);
        camera.position.copy(controls.target.clone().add(dir));
        controls.update();
    }

    function togglePanMode() {
        state.isPanning = !state.isPanning;
        dom.vtPan.classList.toggle('is-active', state.isPanning);
        if (controls) {
            // In pan mode, left mouse = pan; otherwise left mouse = orbit
            controls.mouseButtons.LEFT = state.isPanning
                ? THREE.MOUSE.PAN
                : THREE.MOUSE.ROTATE;
        }
    }

    // ================================================================
    //  Screenshot Export
    // ================================================================
    function saveScreenshot(format) {
        if (!renderer || !scene || !camera) return;

        // Render one fresh frame to ensure canvas is up-to-date
        renderer.render(scene, camera);

        const canvas = renderer.domElement;
        const fileName = (state.loadedFileName || 'screenshot').replace(/\.[^.]+$/, '');

        if (format === 'svg') {
            // SVG: embed the raster as a base64 image inside an SVG wrapper
            const dataURL = canvas.toDataURL('image/png');
            const w = canvas.width;
            const h = canvas.height;
            const svgContent =
                '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' +
                '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
                'width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">\n' +
                '  <image width="' + w + '" height="' + h + '" xlink:href="' + dataURL + '"/>\n' +
                '</svg>';
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            downloadBlob(blob, fileName + '.svg');
        } else if (format === 'jpg') {
            canvas.toBlob(function(blob) {
                if (blob) downloadBlob(blob, fileName + '.jpg');
            }, 'image/jpeg', 0.92);
        } else {
            // PNG (default)
            canvas.toBlob(function(blob) {
                if (blob) downloadBlob(blob, fileName + '.png');
            }, 'image/png');
        }
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    // ================================================================
    //  Camera Position / Angle Display
    // ================================================================
    function updateCamDisplay() {
        if (!camera) return;
        const el = $('#viewer-cam-display');
        if (!el) return;
        const p = camera.position;
        // Compute pitch (elevation) and yaw (azimuth) from camera direction
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        const pitch = THREE.MathUtils.radToDeg(Math.asin(dir.y));
        const yaw = THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z));
        const roll = THREE.MathUtils.radToDeg(camera.rotation.z);
        el.textContent =
            'X: ' + p.x.toFixed(1) +
            '  Y: ' + p.y.toFixed(1) +
            '  Z: ' + p.z.toFixed(1) +
            '  |  Pitch: ' + pitch.toFixed(1) + '\u00b0' +
            '  Yaw: ' + yaw.toFixed(1) + '\u00b0' +
            '  Roll: ' + roll.toFixed(1) + '\u00b0';
    }

    // ================================================================
    //  Axis Orientation Gizmo
    // ================================================================
    function drawGizmo() {
        if (!dom.gizmoCanvas || !camera) return;
        const ctx = dom.gizmoCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const size = 44;
        dom.gizmoCanvas.width = size * dpr;
        dom.gizmoCanvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2;
        const len = 14;

        // Get camera direction to compute axis projections
        const camDir = new THREE.Vector3();
        camera.getWorldDirection(camDir);
        const camUp = camera.up.clone().normalize();
        const camRight = new THREE.Vector3().crossVectors(camDir, camUp).normalize();
        const camActualUp = new THREE.Vector3().crossVectors(camRight, camDir).normalize();

        const axes = [
            { label: 'X', color: '#e74c6f', dir: new THREE.Vector3(1, 0, 0) },
            { label: 'Y', color: '#8bc34a', dir: new THREE.Vector3(0, 1, 0) },
            { label: 'Z', color: '#4a90d9', dir: new THREE.Vector3(0, 0, 1) },
        ];

        // Project each axis onto screen-space
        const projected = axes.map(function (a) {
            const x2d = a.dir.dot(camRight);
            const y2d = -a.dir.dot(camActualUp);
            const depth = a.dir.dot(camDir);
            return { label: a.label, color: a.color, x: x2d, y: y2d, depth: depth };
        });

        // Sort by depth so farthest axes draw first
        projected.sort(function (a, b) { return b.depth - a.depth; });

        projected.forEach(function (p) {
            const ex = cx + p.x * len;
            const ey = cy + p.y * len;
            const isBehind = p.depth > 0.3;

            // Draw axis line
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = isBehind ? 'rgba(120,130,145,0.25)' : p.color;
            ctx.lineWidth = isBehind ? 1 : 2;
            ctx.stroke();

            // Draw endpoint circle
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
                // Label
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 7px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(p.label, ex, ey + 0.5);
            }
        });

        // Center dot
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,190,200,0.5)';
        ctx.fill();
    }

    // -- Init --------------------------------------------------------
    function init() {
        try {
            state.isDark = localStorage.getItem('dilution-dark-mode') === '1';
        } catch(e) {}
        applyTheme();

        dom.btnTheme.addEventListener('click', toggleTheme);
        dom.btnGrid.addEventListener('click', toggleGrid);
        dom.fileInput.addEventListener('change', handleFileSelected);

        // Sidebar toggle – overlay style, no layout shift
        dom.btnSidebarToggle.addEventListener('click', () => {
            dom.sidebarNav.classList.toggle('collapsed');
        });

        // Sidebar view switching
        document.querySelectorAll('.sidebar-nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                switchView(btn.dataset.view);
            });
        });

        // Floating toolbar events
        if (dom.vtToggle) dom.vtToggle.addEventListener('click', toggleToolbar);
        if (dom.vtOpen) dom.vtOpen.addEventListener('click', openFileDialog);
        if (dom.vtResetCam) dom.vtResetCam.addEventListener('click', resetCamera);
        if (dom.vtZoomFit) dom.vtZoomFit.addEventListener('click', zoomToFit);
        if (dom.vtWireframe) dom.vtWireframe.addEventListener('click', toggleWireframe);
        if (dom.vtPerspective) dom.vtPerspective.addEventListener('click', togglePerspective);
        if (dom.vtZoomIn) dom.vtZoomIn.addEventListener('click', () => doZoom(0.75));
        if (dom.vtZoomOut) dom.vtZoomOut.addEventListener('click', () => doZoom(1.35));
        if (dom.vtPan) dom.vtPan.addEventListener('click', togglePanMode);

        // Screenshot button & dropdown
        const ssBtn = $('#vt-screenshot');
        const ssDrop = $('#screenshot-dropdown');
        if (ssBtn && ssDrop) {
            ssBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                ssDrop.classList.toggle('is-open');
            });
            document.addEventListener('click', () => ssDrop.classList.remove('is-open'));
            ssDrop.addEventListener('click', (e) => e.stopPropagation());
            ssDrop.querySelectorAll('.screenshot-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    saveScreenshot(btn.dataset.format);
                    ssDrop.classList.remove('is-open');
                });
            });
        }

        initSplash();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
