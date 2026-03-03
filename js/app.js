/* ============================================================
   X File Viewer - Theme Toggle + Splash + Three.js .x Viewer
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    const dom = {
        btnTheme: $('#btn-theme'),
        btnSidebarToggle: $('#btn-sidebar-toggle'),
        sidebarNav: $('#sidebar-nav'),
    };

    const state = {
        isDark: false,
    };

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

    // ================================================================
    //  3D Viewer  –  Native .x file rendering via Three.js + XFileLoader
    // ================================================================
    let camera, scene, renderer, controls;
    let animationId = null;
    let animMixers = [];
    let lastTime = Date.now();

    const LIGHT_BG  = 0xe9eef2;
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
            antialias: true
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
        }
        tick();

        // ── Load the .x model ────────────────────────────────
        console.log('[Viewer] Starting loadXFile...');
        loadXFile('test.x', loading, errorEl);
    }

    /**
     * Load a .x file via XFileLoader and add it to the scene.
     * Automatically centers and scales the model to fit the view.
     */
    function loadXFile(url, loadingEl, errorEl) {
        console.log('[Viewer] loadXFile called with:', url);
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

        loader.load(url, function (object) {
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
                    ? 'Downloading… ' + pct + '%'
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
    }

    // -- Init --------------------------------------------------------
    function init() {
        try {
            state.isDark = localStorage.getItem('dilution-dark-mode') === '1';
        } catch(e) {}
        applyTheme();

        dom.btnTheme.addEventListener('click', toggleTheme);

        // Sidebar toggle – overlay style, no layout shift
        dom.btnSidebarToggle.addEventListener('click', () => {
            dom.sidebarNav.classList.toggle('collapsed');
        });

        initSplash();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
