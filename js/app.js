/* ============================================================
   X File Viewer - Theme Toggle + Splash + Three.js .x Viewer
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    const dom = {
        btnTheme: $('#btn-theme'),
        btnAbout: $('#btn-about'),
        btnDebug: $('#btn-debug'),
        aboutOverlay: $('#about-overlay'),
        aboutClose: $('#about-close'),
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
        debugVisible: false,
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        toolbarCollapsed: false,
        activeView: 'viewer',
        loadedFileName: 'test',
    };

    const DEFAULT_X_FILENAME = 'test.x';

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

    // -- Debug Panel -------------------------------------------------
    function toggleDebug() {
        state.debugVisible = !state.debugVisible;
        document.querySelectorAll('.debug-panel').forEach(p => {
            p.classList.toggle('is-visible', state.debugVisible);
        });
        if (dom.btnDebug) {
            dom.btnDebug.classList.toggle('is-active', state.debugVisible);
        }
    }

    function updateDebugPanel(panelId, object, group, box, size, maxDim, sceneChildCount) {
        const el = document.getElementById(panelId);
        if (!el) return;
        const info = [];
        info.push('Models: ' + object.models.length);
        info.push('Animations: ' + (object.animations ? object.animations.length : 0));
        if (object.error) info.push('ERROR: ' + object.error);
        for (let mi = 0; mi < Math.min(object.models.length, 5); mi++) {
            const m = object.models[mi];
            const g = m.geometry;
            const posAttr = g ? g.getAttribute('position') : null;
            info.push('  mesh[' + mi + '] name="' + (m.name||'') + '" verts=' + (posAttr ? posAttr.count : 'none'));
            if (posAttr && posAttr.count > 0) {
                info.push('    v[0]=(' + posAttr.array[0].toFixed(3) + ',' + posAttr.array[1].toFixed(3) + ',' + posAttr.array[2].toFixed(3) + ')');
                let nanCount = 0;
                for (let vi = 0; vi < Math.min(posAttr.array.length, 300); vi++) {
                    if (isNaN(posAttr.array[vi])) nanCount++;
                }
                if (nanCount > 0) info.push('    ⚠ NaN count in first 100 verts: ' + nanCount);
            }
            let mat = m.material;
            if (Array.isArray(mat)) mat = mat[0];
            if (mat) info.push('    mat: color=' + (mat.color ? mat.color.getHexString() : '?') + ' side=' + mat.side + ' visible=' + mat.visible);
        }
        if (box) {
            info.push('--- Bounding Box ---');
            info.push('min: (' + box.min.x.toFixed(2) + ', ' + box.min.y.toFixed(2) + ', ' + box.min.z.toFixed(2) + ')');
            info.push('max: (' + box.max.x.toFixed(2) + ', ' + box.max.y.toFixed(2) + ', ' + box.max.z.toFixed(2) + ')');
            info.push('size: (' + size.x.toFixed(2) + ', ' + size.y.toFixed(2) + ', ' + size.z.toFixed(2) + ')');
            info.push('maxDim: ' + maxDim.toFixed(2));
        }
        if (group) info.push('children in group: ' + group.children.length);
        if (sceneChildCount !== undefined) info.push('scene children: ' + sceneChildCount);
        el.textContent = info.join('\n');
    }

    // Expose for converter/placer modules
    window._updateDebugPanel = updateDebugPanel;

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

            // ── Update debug panel ──
            updateDebugPanel('debug-content-viewer', object, group, box, size, maxDim, scene.children.length);

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
        // Also update placer theme
        if (window.PlacerModule) window.PlacerModule.updateTheme();

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

        // Initialize plate placer on first switch
        if (viewName === 'placer' && window.PlacerModule) {
            setTimeout(() => window.PlacerModule.init(), 50);
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

    /**
     * Project the current 3D scene into a true vector SVG.
     * Each visible triangle is projected through the camera, depth-sorted
     * (painter's algorithm), and emitted as a filled <polygon>.
     * Grid helpers and non-mesh objects are excluded.
     */
    function exportVectorSVG() {
        if (!scene || !camera) return '';

        const w = renderer.domElement.width;
        const h = renderer.domElement.height;

        // Ensure world matrices are current
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld(true);

        // Build the combined view-projection matrix
        const viewMatrix = camera.matrixWorldInverse.clone();
        const projMatrix = camera.projectionMatrix.clone();
        const vpMatrix   = new THREE.Matrix4().multiplyMatrices(projMatrix, viewMatrix);

        // Collect projected triangles
        const tris = [];

        scene.traverse(function (obj) {
            if (!obj.isMesh) return;
            // Skip grid helpers
            if (obj.name === '__grid__' || obj.name === '__exgrid__') return;
            // Walk up to check if any ancestor is a grid
            let skip = false;
            let p = obj.parent;
            while (p) {
                if (p.isGridHelper || p.name === '__grid__' || p.name === '__exgrid__') { skip = true; break; }
                p = p.parent;
            }
            if (skip) return;

            const geom = obj.geometry;
            if (!geom || !geom.attributes || !geom.attributes.position) return;

            const worldMatrix = obj.matrixWorld;
            const mvp = new THREE.Matrix4().multiplyMatrices(vpMatrix, worldMatrix);

            // Compute normal matrix for back-face culling
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(worldMatrix);

            const pos  = geom.attributes.position;
            const norm = geom.attributes.normal;

            // Resolve face colour
            const mat  = obj.material;
            const mats = Array.isArray(mat) ? mat : [mat];
            const m    = mats[0];
            let baseR = 0.7, baseG = 0.7, baseB = 0.7, baseA = 1.0;
            if (m && m.color) { baseR = m.color.r; baseG = m.color.g; baseB = m.color.b; }
            if (m && m.opacity !== undefined) baseA = m.opacity;

            // Build index array (handle both indexed and non-indexed geometry)
            let indices;
            if (geom.index) {
                indices = geom.index;
            } else {
                // Non-indexed: every 3 verts is a face
                const arr = [];
                for (let i = 0; i < pos.count; i++) arr.push(i);
                geom.setIndex(arr);
                indices = geom.index;
            }

            const faceCount = indices.count / 3;
            const v3a = new THREE.Vector3();
            const v3b = new THREE.Vector3();
            const v3c = new THREE.Vector3();

            for (let f = 0; f < faceCount; f++) {
                const i0 = indices.getX(f * 3);
                const i1 = indices.getX(f * 3 + 1);
                const i2 = indices.getX(f * 3 + 2);

                // World-space vertices
                v3a.set(pos.getX(i0), pos.getY(i0), pos.getZ(i0)).applyMatrix4(worldMatrix);
                v3b.set(pos.getX(i1), pos.getY(i1), pos.getZ(i1)).applyMatrix4(worldMatrix);
                v3c.set(pos.getX(i2), pos.getY(i2), pos.getZ(i2)).applyMatrix4(worldMatrix);

                // Compute face normal in world space for back-face culling
                const edge1 = new THREE.Vector3().subVectors(v3b, v3a);
                const edge2 = new THREE.Vector3().subVectors(v3c, v3a);
                const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

                // View direction (from face centroid toward camera)
                const centroidWorld = new THREE.Vector3().addVectors(v3a, v3b).add(v3c).multiplyScalar(1 / 3);
                const viewDir = new THREE.Vector3().subVectors(camera.position, centroidWorld).normalize();

                // Back-face cull
                if (faceNormal.dot(viewDir) < 0) continue;

                // Project to NDC
                const p0 = new THREE.Vector3(pos.getX(i0), pos.getY(i0), pos.getZ(i0)).applyMatrix4(mvp);
                const p1 = new THREE.Vector3(pos.getX(i1), pos.getY(i1), pos.getZ(i1)).applyMatrix4(mvp);
                const p2 = new THREE.Vector3(pos.getX(i2), pos.getY(i2), pos.getZ(i2)).applyMatrix4(mvp);

                // Clip: skip if any vertex is behind camera (z < -1 in NDC)
                if (p0.z < -1 || p1.z < -1 || p2.z < -1) continue;
                if (p0.z >  1 || p1.z >  1 || p2.z >  1) continue;

                // NDC → screen
                const sx0 = ( p0.x * 0.5 + 0.5) * w;
                const sy0 = (-p0.y * 0.5 + 0.5) * h;
                const sx1 = ( p1.x * 0.5 + 0.5) * w;
                const sy1 = (-p1.y * 0.5 + 0.5) * h;
                const sx2 = ( p2.x * 0.5 + 0.5) * w;
                const sy2 = (-p2.y * 0.5 + 0.5) * h;

                // Simple directional-light shading: use the face normal
                // Light direction from camera (simple headlight model)
                const shade = Math.max(0.15, faceNormal.dot(viewDir));
                const cr = Math.min(255, Math.round(baseR * shade * 255));
                const cg = Math.min(255, Math.round(baseG * shade * 255));
                const cb = Math.min(255, Math.round(baseB * shade * 255));

                // Average depth for painter's sort
                const avgZ = (p0.z + p1.z + p2.z) / 3;

                tris.push({
                    points: sx0.toFixed(2) + ',' + sy0.toFixed(2) + ' ' +
                            sx1.toFixed(2) + ',' + sy1.toFixed(2) + ' ' +
                            sx2.toFixed(2) + ',' + sy2.toFixed(2),
                    fill: 'rgb(' + cr + ',' + cg + ',' + cb + ')',
                    opacity: baseA,
                    depth: avgZ,
                });
            }
        });

        // Painter's algorithm: sort far-to-near (largest depth first)
        tris.sort(function (a, b) { return b.depth - a.depth; });

        // Build the SVG document
        const bgColor = state.isDark ? '#1b2838' : '#f0f0f0';
        const parts = [];
        parts.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
        parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
                   '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">');
        parts.push('<rect width="100%" height="100%" fill="' + bgColor + '"/>');

        for (let i = 0; i < tris.length; i++) {
            const t = tris[i];
            parts.push('<polygon points="' + t.points + '" fill="' + t.fill + '"' +
                       (t.opacity < 1 ? ' opacity="' + t.opacity.toFixed(3) + '"' : '') +
                       ' stroke="' + t.fill + '" stroke-width="0.5"/>');
        }

        parts.push('</svg>');
        return parts.join('\n');
    }

    function saveScreenshot(format) {
        if (!renderer || !scene || !camera) return;

        // Render one fresh frame to ensure canvas is up-to-date
        renderer.render(scene, camera);

        const canvas = renderer.domElement;
        const fileName = (state.loadedFileName || 'screenshot').replace(/\.[^.]+$/, '');

        if (format === 'svg') {
            // True vector SVG: project geometry through the camera
            const svgContent = exportVectorSVG();
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
    //  Model Export  –  OBJ / STL / GLB  (from the main viewer)
    // ================================================================

    function getViewerModel() {
        return scene ? scene.getObjectByName('__xmodel__') : null;
    }

    function viewerFileName() {
        return (state.loadedFileName || 'model').replace(/\.[^.]+$/, '');
    }

    // ── OBJ ──────────────────────────────────────────────────────
    function exportViewerOBJ() {
        const model = getViewerModel();
        if (!model) return;
        const lines = [];
        const mtlLines = [];
        const baseName = viewerFileName();
        const mtlName = baseName + '.mtl';
        lines.push('# Exported from Direct3D Tools');
        lines.push('mtllib ' + mtlName);
        lines.push('');

        let vertOffset = 1;
        let normOffset = 1;
        let uvOffset = 1;
        let meshIdx = 0;

        model.updateMatrixWorld(true);

        model.traverse(function (child) {
            if (!child.isMesh) return;

            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);

            if (!geom.index) {
                const idx = [];
                for (let i = 0; i < geom.attributes.position.count; i++) idx.push(i);
                geom.setIndex(idx);
            }

            const pos  = geom.attributes.position;
            const norm = geom.attributes.normal;
            const uv   = geom.attributes.uv;
            const idx  = geom.index;
            const faceCount = idx.count / 3;

            const matName = 'Material_' + meshIdx;
            meshIdx++;

            const mat = child.material || new THREE.MeshStandardMaterial();
            const mats = Array.isArray(mat) ? mat : [mat];
            const m = mats[0];
            const r = m.color ? m.color.r : 0.7;
            const g = m.color ? m.color.g : 0.7;
            const b = m.color ? m.color.b : 0.7;
            mtlLines.push('newmtl ' + matName);
            mtlLines.push('Kd ' + r.toFixed(6) + ' ' + g.toFixed(6) + ' ' + b.toFixed(6));
            if (m.specular) {
                mtlLines.push('Ks ' + m.specular.r.toFixed(6) + ' ' + m.specular.g.toFixed(6) + ' ' + m.specular.b.toFixed(6));
            }
            mtlLines.push('d ' + (m.opacity !== undefined ? m.opacity : 1).toFixed(6));
            mtlLines.push('');

            lines.push('g Mesh_' + (meshIdx - 1));
            lines.push('usemtl ' + matName);

            for (let i = 0; i < pos.count; i++) {
                lines.push('v ' + pos.getX(i).toFixed(6) + ' ' + pos.getY(i).toFixed(6) + ' ' + pos.getZ(i).toFixed(6));
            }
            if (norm) {
                for (let i = 0; i < norm.count; i++) {
                    lines.push('vn ' + norm.getX(i).toFixed(6) + ' ' + norm.getY(i).toFixed(6) + ' ' + norm.getZ(i).toFixed(6));
                }
            }
            if (uv) {
                for (let i = 0; i < uv.count; i++) {
                    lines.push('vt ' + uv.getX(i).toFixed(6) + ' ' + uv.getY(i).toFixed(6));
                }
            }

            for (let f = 0; f < faceCount; f++) {
                const i0 = idx.getX(f * 3) + vertOffset;
                const i1 = idx.getX(f * 3 + 1) + vertOffset;
                const i2 = idx.getX(f * 3 + 2) + vertOffset;

                if (norm && uv) {
                    const n0 = idx.getX(f * 3) + normOffset;
                    const n1 = idx.getX(f * 3 + 1) + normOffset;
                    const n2 = idx.getX(f * 3 + 2) + normOffset;
                    const t0 = idx.getX(f * 3) + uvOffset;
                    const t1 = idx.getX(f * 3 + 1) + uvOffset;
                    const t2 = idx.getX(f * 3 + 2) + uvOffset;
                    lines.push('f ' + i0 + '/' + t0 + '/' + n0 + ' ' + i1 + '/' + t1 + '/' + n1 + ' ' + i2 + '/' + t2 + '/' + n2);
                } else if (norm) {
                    const n0 = idx.getX(f * 3) + normOffset;
                    const n1 = idx.getX(f * 3 + 1) + normOffset;
                    const n2 = idx.getX(f * 3 + 2) + normOffset;
                    lines.push('f ' + i0 + '//' + n0 + ' ' + i1 + '//' + n1 + ' ' + i2 + '//' + n2);
                } else {
                    lines.push('f ' + i0 + ' ' + i1 + ' ' + i2);
                }
            }

            vertOffset += pos.count;
            if (norm) normOffset += norm.count;
            if (uv) uvOffset += uv.count;
            lines.push('');
            geom.dispose();
        });

        downloadBlob(new Blob([lines.join('\n')], { type: 'text/plain' }), baseName + '.obj');
        if (mtlLines.length > 0) {
            downloadBlob(new Blob([mtlLines.join('\n')], { type: 'text/plain' }), baseName + '.mtl');
        }
    }

    // ── STL (binary) ─────────────────────────────────────────────
    function exportViewerSTL() {
        const model = getViewerModel();
        if (!model) return;
        model.updateMatrixWorld(true);

        let totalTris = 0;
        model.traverse(child => {
            if (!child.isMesh) return;
            const g = child.geometry;
            const count = g.index ? g.index.count : g.attributes.position.count;
            totalTris += Math.floor(count / 3);
        });

        const bufLen = 80 + 4 + totalTris * 50;
        const buffer = new ArrayBuffer(bufLen);
        const dv = new DataView(buffer);

        const headerStr = 'Exported from Direct3D Tools';
        for (let i = 0; i < headerStr.length && i < 80; i++) dv.setUint8(i, headerStr.charCodeAt(i));
        dv.setUint32(80, totalTris, true);

        let offset = 84;
        model.traverse(child => {
            if (!child.isMesh) return;
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);

            if (!geom.index) {
                const indices = [];
                for (let i = 0; i < geom.attributes.position.count; i++) indices.push(i);
                geom.setIndex(indices);
            }
            if (!geom.attributes.normal) geom.computeVertexNormals();

            const pos = geom.attributes.position;
            const norm = geom.attributes.normal;
            const idx = geom.index;
            const faceCount = idx.count / 3;

            for (let f = 0; f < faceCount; f++) {
                const i0 = idx.getX(f * 3);
                const i1 = idx.getX(f * 3 + 1);
                const i2 = idx.getX(f * 3 + 2);

                const nx = (norm.getX(i0) + norm.getX(i1) + norm.getX(i2)) / 3;
                const ny = (norm.getY(i0) + norm.getY(i1) + norm.getY(i2)) / 3;
                const nz = (norm.getZ(i0) + norm.getZ(i1) + norm.getZ(i2)) / 3;

                dv.setFloat32(offset, nx, true); offset += 4;
                dv.setFloat32(offset, ny, true); offset += 4;
                dv.setFloat32(offset, nz, true); offset += 4;

                dv.setFloat32(offset, pos.getX(i0), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i0), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i0), true); offset += 4;

                dv.setFloat32(offset, pos.getX(i1), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i1), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i1), true); offset += 4;

                dv.setFloat32(offset, pos.getX(i2), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i2), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i2), true); offset += 4;

                dv.setUint16(offset, 0, true); offset += 2;
            }
            geom.dispose();
        });

        downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), viewerFileName() + '.stl');
    }

    // ── GLB ──────────────────────────────────────────────────────
    function exportViewerGLB() {
        const model = getViewerModel();
        if (!model) return;
        model.updateMatrixWorld(true);

        const meshes = [];
        model.traverse(child => { if (child.isMesh) meshes.push(child); });
        if (meshes.length === 0) return;

        const bufferParts = [];
        let totalBufSize = 0;
        const accessors = [];
        const bufferViews = [];
        const gltfMeshes = [];
        const gltfNodes = [];
        const materials = [];

        function padTo4(buf) {
            const rem = buf.byteLength % 4;
            if (rem === 0) return buf;
            const padded = new ArrayBuffer(buf.byteLength + (4 - rem));
            new Uint8Array(padded).set(new Uint8Array(buf));
            return padded;
        }

        meshes.forEach((child, mi) => {
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);
            if (!geom.index) {
                const idx = [];
                for (let i = 0; i < geom.attributes.position.count; i++) idx.push(i);
                geom.setIndex(idx);
            }

            const pos  = geom.attributes.position;
            const norm = geom.attributes.normal;
            const idx  = geom.index;

            const srcMat = child.material || new THREE.MeshStandardMaterial();
            const m = Array.isArray(srcMat) ? srcMat[0] : srcMat;
            const matIdx = materials.length;
            materials.push({
                pbrMetallicRoughness: {
                    baseColorFactor: [
                        m.color ? m.color.r : 0.7,
                        m.color ? m.color.g : 0.7,
                        m.color ? m.color.b : 0.7,
                        m.opacity !== undefined ? m.opacity : 1.0
                    ],
                    metallicFactor: m.metalness !== undefined ? m.metalness : 0.0,
                    roughnessFactor: m.roughness !== undefined ? m.roughness : 0.8,
                },
                name: 'Material_' + mi,
            });

            // Indices
            const idxArr = new Uint32Array(idx.count);
            for (let i = 0; i < idx.count; i++) idxArr[i] = idx.getX(i);
            const idxBuf = padTo4(idxArr.buffer);
            const idxBvIdx = bufferViews.length;
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: idxArr.byteLength, target: 34963 });
            accessors.push({ bufferView: idxBvIdx, componentType: 5125, count: idx.count, type: 'SCALAR', max: [pos.count - 1], min: [0] });
            const idxAccIdx = accessors.length - 1;
            bufferParts.push(idxBuf);
            totalBufSize += idxBuf.byteLength;

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
            const posBvIdx = bufferViews.length;
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: posArr.byteLength, target: 34962, byteStride: 12 });
            accessors.push({ bufferView: posBvIdx, componentType: 5126, count: pos.count, type: 'VEC3', min: pMin, max: pMax });
            const posAccIdx = accessors.length - 1;
            bufferParts.push(posBuf);
            totalBufSize += posBuf.byteLength;

            // Normals
            let normAccIdx = undefined;
            if (norm) {
                const normArr = new Float32Array(norm.count * 3);
                for (let i = 0; i < norm.count; i++) {
                    normArr[i * 3] = norm.getX(i);
                    normArr[i * 3 + 1] = norm.getY(i);
                    normArr[i * 3 + 2] = norm.getZ(i);
                }
                const normBuf = padTo4(normArr.buffer);
                const normBvIdx = bufferViews.length;
                bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: normArr.byteLength, target: 34962, byteStride: 12 });
                accessors.push({ bufferView: normBvIdx, componentType: 5126, count: norm.count, type: 'VEC3' });
                normAccIdx = accessors.length - 1;
                bufferParts.push(normBuf);
                totalBufSize += normBuf.byteLength;
            }

            const attributes = { POSITION: posAccIdx };
            if (normAccIdx !== undefined) attributes.NORMAL = normAccIdx;

            gltfMeshes.push({ primitives: [{ attributes: attributes, indices: idxAccIdx, material: matIdx }], name: 'Mesh_' + mi });
            gltfNodes.push({ mesh: mi, name: 'Node_' + mi });
            geom.dispose();
        });

        const gltfJson = {
            asset: { version: '2.0', generator: 'Direct3D Tools Viewer' },
            scene: 0,
            scenes: [{ nodes: gltfNodes.map((_, i) => i) }],
            nodes: gltfNodes,
            meshes: gltfMeshes,
            accessors: accessors,
            bufferViews: bufferViews,
            buffers: [{ byteLength: totalBufSize }],
            materials: materials,
        };

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

        glbDV.setUint32(0, 0x46546C67, true);
        glbDV.setUint32(4, 2, true);
        glbDV.setUint32(8, glbLen, true);

        let p = 12;
        glbDV.setUint32(p, jsonBuf.byteLength, true); p += 4;
        glbDV.setUint32(p, 0x4E4F534A, true); p += 4;
        new Uint8Array(glb, p, jsonBuf.byteLength).set(new Uint8Array(jsonBuf));
        p += jsonBuf.byteLength;

        glbDV.setUint32(p, binPadded.byteLength, true); p += 4;
        glbDV.setUint32(p, 0x004E4942, true); p += 4;
        new Uint8Array(glb, p, binPadded.byteLength).set(new Uint8Array(binPadded));

        downloadBlob(new Blob([glb], { type: 'model/gltf-binary' }), viewerFileName() + '.glb');
    }

    // ── Export dispatcher ────────────────────────────────────────
    function doViewerExport(fmt) {
        const model = getViewerModel();
        if (!model) { alert('No model loaded.'); return; }
        try {
            switch (fmt) {
                case 'obj': exportViewerOBJ(); break;
                case 'stl': exportViewerSTL(); break;
                case 'glb': exportViewerGLB(); break;
                default: alert('Unknown format: ' + fmt);
            }
        } catch (err) {
            console.error('Export error:', err);
            alert('Export error: ' + err.message);
        }
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

        // Debug panel toggle
        if (dom.btnDebug) dom.btnDebug.addEventListener('click', toggleDebug);

        // About modal
        if (dom.btnAbout) dom.btnAbout.addEventListener('click', () => {
            if (dom.aboutOverlay) dom.aboutOverlay.classList.add('is-open');
        });
        if (dom.aboutClose) dom.aboutClose.addEventListener('click', () => {
            if (dom.aboutOverlay) dom.aboutOverlay.classList.remove('is-open');
        });
        if (dom.aboutOverlay) dom.aboutOverlay.addEventListener('click', (e) => {
            if (e.target === dom.aboutOverlay) dom.aboutOverlay.classList.remove('is-open');
        });
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
                // Close export dropdown if open
                const exDrop = $('#export-dropdown');
                if (exDrop) exDrop.classList.remove('is-open');
            });
            document.addEventListener('click', () => {
                ssDrop.classList.remove('is-open');
                const exDrop = $('#export-dropdown');
                if (exDrop) exDrop.classList.remove('is-open');
            });
            ssDrop.addEventListener('click', (e) => e.stopPropagation());
            ssDrop.querySelectorAll('.screenshot-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    saveScreenshot(btn.dataset.format);
                    ssDrop.classList.remove('is-open');
                });
            });
        }

        // Export button & dropdown
        const exBtn = $('#vt-export');
        const exDrop = $('#export-dropdown');
        if (exBtn && exDrop) {
            exBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exDrop.classList.toggle('is-open');
                // Close screenshot dropdown if open
                if (ssDrop) ssDrop.classList.remove('is-open');
            });
            exDrop.addEventListener('click', (e) => e.stopPropagation());
            exDrop.querySelectorAll('.export-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    doViewerExport(btn.dataset.format);
                    exDrop.classList.remove('is-open');
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
