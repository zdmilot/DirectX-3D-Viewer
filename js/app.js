/* ============================================================
   X File Viewer - Theme Toggle + Splash + Three.js .x Viewer
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    const dom = {
        btnTheme: $('#btn-theme'),
        btnAbout: $('#btn-about'),
        aboutOverlay: $('#about-overlay'),
        aboutClose: $('#about-close'),
        aboutLogo: null,   // set after DOM query
        btnGrid: $('#btn-grid'),
        fileInput: $('#file-input'),
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
        vtProjection: $('#vt-projection'),
        vtZoomIn: $('#vt-zoom-in'),
        vtZoomOut: $('#vt-zoom-out'),
        vtPan: $('#vt-pan'),
        vtSave: $('#vt-save'),
        // Toolbar flyouts / dialogs
        vtAppearance: $('#vt-appearance'),
        vtHelp: $('#vt-help'),
        vtAbout: $('#vt-about'),
        projFlyout: $('#proj-flyout'),
        appearanceFlyout: $('#appearance-flyout'),
        helpOverlay: $('#help-overlay'),
        // Transform flyout
        vtTransformToggle: $('#vt-transform-toggle'),
        tfFlyout: $('#tf-flyout'),
        // Rotation/reflection buttons (inside flyout)
        vtRotXPos: $('#vt-rot-x-pos'),
        vtRotXNeg: $('#vt-rot-x-neg'),
        vtRotYPos: $('#vt-rot-y-pos'),
        vtRotYNeg: $('#vt-rot-y-neg'),
        vtRotZPos: $('#vt-rot-z-pos'),
        vtRotZNeg: $('#vt-rot-z-neg'),
        vtMirrorX: $('#vt-mirror-x'),
        vtMirrorY: $('#vt-mirror-y'),
        vtMirrorZ: $('#vt-mirror-z'),
        gizmoCanvas: $('#gizmo-canvas'),
    };

    const state = {
        isDark: false,
        debugVisible: false,
        teapotClicks: 0,    // 0-3, each click = 90°; 2 = upside-down = debug ON
        gridVisible: true,
        wireframe: false,
        isPerspective: true,
        isPanning: false,
        bgTransparent: false,
        toolbarCollapsed: false,
        activeView: 'viewer',
        loadedFileName: null,
        loadedFilePath: null,  // Full path or name of the loaded file for display
        lastLoadedUrl: null,   // URL of the last loaded .x file
        rawXFileContent: null, // Raw .x file text content for save/transform
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

    // -- Debug Panel -------------------------------------------------
    function setDebug(on) {
        state.debugVisible = on;
        document.querySelectorAll('.debug-panel').forEach(p => {
            p.classList.toggle('is-visible', on);
        });
    }

    function handleTeapotClick() {
        state.teapotClicks = (state.teapotClicks + 1) % 4;
        var deg = state.teapotClicks * 90;
        if (dom.aboutLogo) {
            dom.aboutLogo.style.transform = 'scaleY(-1) rotate(' + deg + 'deg)';
        }
        // Debug ON only when teapot is fully upside-down (180° from baseline)
        setDebug(state.teapotClicks === 2);
    }

    function resetTeapot() {
        if (state.teapotClicks !== 2) {
            state.teapotClicks = 0;
            if (dom.aboutLogo) {
                dom.aboutLogo.style.transform = 'scaleY(-1) rotate(0deg)';
            }
            setDebug(false);
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

    window._updateDebugPanel = updateDebugPanel;

    /**
     * Convert a Three.js Group loaded from a DirectX .x file from
     * left-handed (DirectX) to right-handed (Three.js) coordinates.
     * Negates Z positions and normals, flips triangle winding order.
     */
    function fixLeftHandedCoords(group) {
        group.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;
            var pos = child.geometry.attributes.position;
            if (pos) {
                for (var i = 0; i < pos.count; i++) {
                    pos.setZ(i, -pos.getZ(i));
                }
                pos.needsUpdate = true;
            }
            var norm = child.geometry.attributes.normal;
            if (norm) {
                for (var i = 0; i < norm.count; i++) {
                    norm.setZ(i, -norm.getZ(i));
                }
                norm.needsUpdate = true;
            }
            var idx = child.geometry.index;
            if (idx) {
                for (var f = 0; f < idx.count; f += 3) {
                    var a = idx.getX(f);
                    var b = idx.getX(f + 1);
                    idx.setX(f, b);
                    idx.setX(f + 1, a);
                }
                idx.needsUpdate = true;
            }
            child.geometry.computeBoundingBox();
            child.geometry.computeBoundingSphere();
        });
    }
    window._fixLeftHandedCoords = fixLeftHandedCoords;

    /**
     * Physically nudge label/decal meshes outward along their average
     * face normal so they sit slightly proud of the body surface.
     * This is a geometric fix — immune to depth buffer precision issues
     * that make polygon offset fail at large camera distances.
     *
     * Identifies the "body" mesh as the one with the most vertices
     * (the main shell) and nudges everything else outward.
     */
    function nudgeDecalMeshes(group) {
        var children = [];
        group.traverse(function (child) {
            if (child.isMesh && child.geometry) children.push(child);
        });
        if (children.length <= 1) return; // nothing to nudge

        // Find the body mesh — it has the most vertices
        var bodyIdx = 0;
        var maxVerts = 0;
        for (var ci = 0; ci < children.length; ci++) {
            var pos = children[ci].geometry.attributes.position;
            var count = pos ? pos.count : 0;
            if (count > maxVerts) {
                maxVerts = count;
                bodyIdx = ci;
            }
        }

        // Compute overall bounding box to scale the nudge distance
        var totalBox = new THREE.Box3().setFromObject(group);
        var totalSize = totalBox.getSize(new THREE.Vector3());
        var maxDim = Math.max(totalSize.x, totalSize.y, totalSize.z);
        if (maxDim <= 0) return;

        // Nudge distance: 0.1% of the model size — invisible to the eye
        // but more than enough for the depth buffer at any zoom level
        var nudgeDist = maxDim * 0.001;

        for (var ci = 0; ci < children.length; ci++) {
            if (ci === bodyIdx) continue; // skip the body mesh
            var mesh = children[ci];
            var geom = mesh.geometry;
            var pos = geom.attributes.position;
            var norm = geom.attributes.normal;
            if (!pos || !norm || pos.count === 0) continue;

            // Nudge each vertex along its own normal — handles text that
            // wraps around corners where an average normal would cancel out
            for (var i = 0; i < pos.count; i++) {
                var nx = norm.getX(i), ny = norm.getY(i), nz = norm.getZ(i);
                var nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
                if (nLen < 1e-6) continue;
                pos.setX(i, pos.getX(i) + (nx / nLen) * nudgeDist);
                pos.setY(i, pos.getY(i) + (ny / nLen) * nudgeDist);
                pos.setZ(i, pos.getZ(i) + (nz / nLen) * nudgeDist);
            }
            pos.needsUpdate = true;
            geom.computeBoundingBox();
            geom.computeBoundingSphere();
        }
    }
    window._nudgeDecalMeshes = nudgeDecalMeshes;

    // -- Theme Toggle ------------------------------------------------
    function toggleTheme() {
        state.isDark = !state.isDark;
        applyTheme();
        updateViewerTheme();
    }

    function applyTheme() {
        if (state.isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        if (dom.btnTheme) {
            const icon = dom.btnTheme.querySelector('i');
            if (icon) icon.className = state.isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
        try { localStorage.setItem('dilution-dark-mode', state.isDark ? '1' : '0'); } catch(e) {}
    }

    // -- File Open ---------------------------------------------------
    function openFileDialog() {
        // Always use the hidden <input type="file"> for maximum
        // cross-platform reliability.  The File System Access API
        // (showOpenFilePicker) can silently error after showing
        // its own dialog on some browser/OS combos, which falls
        // back to a SECOND native dialog — causing the user to
        // have to select the file twice.  A single <input> click
        // avoids this entirely and works on every browser.
        if (!dom.fileInput) return;
        dom.fileInput.click();
    }

    function handleFileSelected(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        // Find the primary 3D file (not .mtl, not texture)
        let primary = null;
        const companionMap = {};
        for (let i = 0; i < files.length; i++) {
            const ext = files[i].name.split('.').pop().toLowerCase();
            if (/^(x|hxx|obj|stl|glb|gltf)$/.test(ext) && !primary) {
                primary = files[i];
            }
            companionMap[files[i].name.toLowerCase()] = files[i];
        }
        if (!primary) primary = files[0];
        loadUserFile(primary, companionMap);
        // Reset input so re-selecting the same file triggers change
        dom.fileInput.value = '';
    }

    /** Supported 3D file extensions for the viewer */
    const VIEWER_3D_EXTS = /\.(x|hxx|obj|stl|glb|gltf)$/i;

    function loadUserFile(file, companionFiles) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!VIEWER_3D_EXTS.test(file.name)) {
            alert('Unsupported file format. Please select a .x, .hxx, .obj, .stl, .glb, or .gltf file.');
            return;
        }
        const loading = $('#viewer-loading');
        const errorEl = $('#viewer-error');

        // Track loaded file name and path for screenshot naming / display
        state.loadedFileName = file.name;
        state.loadedFilePath = file.path || file.webkitRelativePath || file.name;

        // Clear previous model
        clearModel();

        // Show loading
        if (loading) {
            loading.classList.remove('viewer-hidden');
            const span = loading.querySelector('span');
            if (span) span.textContent = 'Loading ' + file.name + '…';
        }
        if (errorEl) errorEl.classList.add('viewer-hidden');

        switch (ext) {
            case 'hxx':
                loadViewerHXX(file, loading, errorEl);
                break;
            case 'x':
                loadViewerXFile(file, loading, errorEl);
                break;
            case 'obj':
                loadViewerOBJ(file, companionFiles || {}, loading, errorEl);
                break;
            case 'stl':
                loadViewerSTL(file, loading, errorEl);
                break;
            case 'glb':
            case 'gltf':
                loadViewerGLTF(file, loading, errorEl);
                break;
            default:
                if (loading) loading.classList.add('viewer-hidden');
                showError(errorEl, 'Unsupported format: .' + ext);
        }
    }

    function loadViewerHXX(file, loadingEl, errorEl) {
        const reader = new FileReader();
        reader.onload = function () {
            HXXLoader.toXFileBlob(reader.result).then(function (blob) {
                const url = URL.createObjectURL(blob);
                state.lastLoadedUrl = url;
                setFilenameDisplay();
                loadXFile(url, loadingEl, errorEl);
            }).catch(function (err) {
                if (loadingEl) loadingEl.classList.add('viewer-hidden');
                showError(errorEl, 'HXX parse error: ' + (err.message || err));
                console.error('[HXX]', err);
            });
        };
        reader.onerror = function () {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showError(errorEl, 'Failed to read .hxx file.');
        };
        reader.readAsArrayBuffer(file);
    }

    function loadViewerXFile(file, loadingEl, errorEl) {
        const url = URL.createObjectURL(file);
        state.lastLoadedUrl = url;
        setFilenameDisplay();
        loadXFile(url, loadingEl, errorEl);
    }

    function loadViewerOBJ(file, fileMap, loadingEl, errorEl) {
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const objText = reader.result;
                const mtlMatch = objText.match(/^mtllib\s+(.+)$/m);
                const mtlFileName = mtlMatch ? mtlMatch[1].trim() : null;

                const finishOBJ = function (materials) {
                    const loader = new THREE.OBJLoader();
                    if (materials) loader.setMaterials(materials);
                    const object = loader.parse(objText);
                    const group = new THREE.Group();
                    group.add(object);
                    addModelToViewerScene(group, loadingEl, errorEl);
                };

                if (mtlFileName && fileMap[mtlFileName.toLowerCase()]) {
                    const mtlReader = new FileReader();
                    mtlReader.onload = function () {
                        try {
                            const mtlLoader = new THREE.MTLLoader();
                            const materials = mtlLoader.parse(mtlReader.result, '');
                            // Handle companion textures
                            if (fileMap) {
                                Object.keys(materials.materialsInfo).forEach(function (name) {
                                    const info = materials.materialsInfo[name];
                                    if (info.map_kd) {
                                        const texKey = info.map_kd.toLowerCase();
                                        if (fileMap[texKey]) {
                                            info.map_kd = URL.createObjectURL(fileMap[texKey]);
                                        }
                                    }
                                });
                            }
                            materials.preload();
                            finishOBJ(materials);
                        } catch (err) {
                            console.warn('MTL parse failed, loading OBJ without materials:', err);
                            finishOBJ(null);
                        }
                    };
                    mtlReader.readAsText(fileMap[mtlFileName.toLowerCase()]);
                } else {
                    finishOBJ(null);
                }
            } catch (err) {
                if (loadingEl) loadingEl.classList.add('viewer-hidden');
                showError(errorEl, 'OBJ parse error: ' + err.message);
                console.error('[OBJ]', err);
            }
        };
        reader.onerror = function () {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showError(errorEl, 'Failed to read .obj file.');
        };
        reader.readAsText(file);
    }

    function loadViewerSTL(file, loadingEl, errorEl) {
        const reader = new FileReader();
        reader.onload = function () {
            try {
                const loader = new THREE.STLLoader();
                const geometry = loader.parse(reader.result);
                const material = new THREE.MeshPhongMaterial({
                    color: 0x8899aa,
                    specular: 0x333333,
                    shininess: 30,
                    flatShading: false,
                });
                const mesh = new THREE.Mesh(geometry, material);
                const group = new THREE.Group();
                group.add(mesh);
                addModelToViewerScene(group, loadingEl, errorEl);
            } catch (err) {
                if (loadingEl) loadingEl.classList.add('viewer-hidden');
                showError(errorEl, 'STL parse error: ' + err.message);
                console.error('[STL]', err);
            }
        };
        reader.onerror = function () {
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showError(errorEl, 'Failed to read .stl file.');
        };
        reader.readAsArrayBuffer(file);
    }

    function loadViewerGLTF(file, loadingEl, errorEl) {
        const url = URL.createObjectURL(file);
        const loader = new THREE.GLTFLoader();
        loader.load(url, function (gltf) {
            URL.revokeObjectURL(url);
            addModelToViewerScene(gltf.scene, loadingEl, errorEl);
        }, undefined, function (err) {
            URL.revokeObjectURL(url);
            if (loadingEl) loadingEl.classList.add('viewer-hidden');
            showError(errorEl, 'GLTF load error: ' + (err.message || err));
            console.error('[GLTF]', err);
        });
    }

    /**
     * Add a generic 3D model (from OBJ/STL/GLB) to the main viewer scene.
     * Handles centering, camera fit, grid resize, and material processing,
     * but skips the left-handed coordinate fix (only needed for .x files).
     */
    function addModelToViewerScene(object, loadingEl, errorEl) {
        if (loadingEl) loadingEl.classList.add('viewer-hidden');

        const group = new THREE.Group();
        group.name = '__xmodel__';
        group.add(object);
        scene.add(group);

        // Disable frustum culling on all meshes
        group.traverse(function (child) {
            if (child.isMesh) child.frustumCulled = false;
        });

        // Auto-fit: center & scale model to fill view
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        if (maxDim > 0) {
            group.position.sub(center);
            DeckUnits.fitCamera(camera, controls, maxDim, { fitMultiplier: 1.8 });

            // Resize grid
            const oldGrid = scene.getObjectByName('__grid__');
            if (oldGrid) scene.remove(oldGrid);
            const gColor = state.isDark ? DARK_GRID : LIGHT_GRID;
            const newGrid = DeckUnits.createModelGrid(maxDim, gColor, { name: '__grid__', visible: state.gridVisible });
            newGrid.position.y = -size.y / 2 - maxDim * 0.002;
            scene.add(newGrid);
        }

        state.lastLoadedUrl = null; // Non-X files don't have a URL for the placer
        setFilenameDisplay();
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
            subtitle.textContent = 'DIRECTX MODEL VIEWER';
        }
        // Update loaded file path in bottom bar
        const pathText = $('#viewer-file-path-text');
        const pathWrap = $('#viewer-file-path');
        if (pathText) {
            let display = state.loadedFilePath || state.loadedFileName || 'No file loaded';
            // For server-loaded files (non blob/data URLs), show decoded URL as path
            if (display === state.loadedFileName && state.lastLoadedUrl
                && !/^blob:|^data:/i.test(state.lastLoadedUrl)) {
                try { display = decodeURIComponent(state.lastLoadedUrl.split('?')[0]); } catch(e) {}
            }
            pathText.textContent = display;
            if (pathWrap) pathWrap.title = display;
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
            const files = e.dataTransfer.files;
            if (!files || files.length === 0) return;
            // Find the primary 3D file
            let primary = null;
            const companionMap = {};
            for (let i = 0; i < files.length; i++) {
                const ext = files[i].name.split('.').pop().toLowerCase();
                if (/^(x|hxx|obj|stl|glb|gltf)$/.test(ext) && !primary) {
                    primary = files[i];
                }
                companionMap[files[i].name.toLowerCase()] = files[i];
            }
            if (!primary) primary = files[0];
            loadUserFile(primary, companionMap);
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
            alpha: true,
            preserveDrawingBuffer: true
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(w, h);
        renderer.sortObjects = true;

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

        // ── Grid helper (mm-based via DeckUnits) ─────────────
        const gridColor = state.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = DeckUnits.createGrid(200, 10, gridColor, { name: '__grid__', visible: state.gridVisible });
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

            // Dynamically tighten near/far planes based on camera distance
            // to maintain depth precision for labels at every zoom level.
            // Tight 1:1000 ratio ensures polygon offset resolves coplanar
            // label meshes (text, barcodes) against the body at any distance.
            if (camera.isPerspectiveCamera) {
                var dist = camera.position.distanceTo(controls.target);
                if (dist > 0) {
                    camera.near = Math.max(dist * 0.01, 0.01);
                    camera.far  = Math.max(dist * 10, 1000);
                    camera.updateProjectionMatrix();
                }
            }

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

        // Start with empty scene — user loads a file via toolbar or drag-and-drop
        if (loading) loading.classList.add('viewer-hidden');
        setFilenameDisplay();
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

            // Find body mesh (most vertices) for polygon offset
            let bodyMeshIdx = 0;
            let bodyMaxVerts = 0;
            for (let bi = 0; bi < object.models.length; bi++) {
                const pos = object.models[bi].geometry && object.models[bi].geometry.attributes.position;
                const cnt = pos ? pos.count : 0;
                if (cnt > bodyMaxVerts) { bodyMaxVerts = cnt; bodyMeshIdx = bi; }
            }

            for (let i = 0; i < object.models.length; i++) {
                const model = object.models[i];
                // Assign unique renderOrder per mesh to eliminate z-fighting
                // between overlapping meshes from different frames
                model.renderOrder = i;

                // Apply polygon offset to prevent z-fighting between
                // overlapping meshes.  The body (most vertices) is
                // pushed slightly back; label meshes are pulled toward
                // the camera so they always win the depth test.
                if (model.material) {
                    const applyOffset = (m, meshIdx) => {
                        if (meshIdx === bodyMeshIdx) {
                            // Push the body/shell slightly back
                            m.polygonOffset = true;
                            m.polygonOffsetFactor = 1;
                            m.polygonOffsetUnits  = 1;
                        } else {
                            // Pull labels/decals toward camera
                            const capped = Math.min(meshIdx + 1, 10);
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

            scene.add(group);

            // ── Left-handed → right-handed coordinate fix ────
            // DirectX .x files use a left-handed coordinate system;
            // Three.js is right-handed.  Negate the Z axis in all
            // vertex positions and normals, and flip winding order
            // so faces remain outward-pointing.
            fixLeftHandedCoords(group);

            // ── Nudge label/decal meshes outward ─────────────
            // Physically offset non-body meshes along their face
            // normals so they always sit proud of the body surface.
            // This is immune to depth buffer precision issues.
            nudgeDecalMeshes(group);

            // ── Make blue-dominant materials translucent ──────
            // channel.  Detect materials whose blue component is dominant
            // and force them to be translucent so enclosure panels look
            // like real polycarbonate covers.
            group.traverse(function (child) {
                if (!child.isMesh) return;
                // Disable frustum culling so small meshes (e.g. rack labels)
                // remain visible at all zoom levels
                child.frustumCulled = false;
                var mats = Array.isArray(child.material) ? child.material : [child.material];
                var isTransparent = false;
                mats.forEach(function (m) {
                    if (!m || !m.color) return;
                    var r = m.color.r, g = m.color.g, b = m.color.b;
                    // Blue-dominant heuristic: blue channel dominates red
                    if (b > r * 1.5 && b > 0.1) {
                        m.transparent = true;
                        // Keep file-specified opacity if already < 1, otherwise default 0.4
                        if (m.opacity >= 1.0) m.opacity = 0.4;
                        m.depthWrite = false;
                        m.side = THREE.DoubleSide;
                        isTransparent = true;
                    }
                });
                // Render transparent meshes after all opaque meshes
                if (isTransparent) {
                    child.renderOrder = 999;
                }
            });

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

                // Position camera to see the whole model (mm units)
                DeckUnits.fitCamera(camera, controls, maxDim, { fitMultiplier: 1.8 });

                // Resize grid to match model scale (mm-based)
                const oldGrid = scene.getObjectByName('__grid__');
                if (oldGrid) scene.remove(oldGrid);
                const gColor = state.isDark ? DARK_GRID : LIGHT_GRID;
                const newGrid = DeckUnits.createModelGrid(maxDim, gColor, { name: '__grid__', visible: state.gridVisible });
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
        if (state.bgTransparent) {
            scene.background = null;
        } else {
            scene.background = new THREE.Color(state.isDark ? DARK_BG : LIGHT_BG);
        }
        const grid = scene.getObjectByName('__grid__');
        if (grid) {
            const c = new THREE.Color(state.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
            if (grid.material.uniforms) grid.material.uniforms.diffuse.value.copy(c);
        }

    }

    // ================================================================
    //  Floating Toolbar Controls
    // ================================================================

    function toggleToolbar() {
        state.toolbarCollapsed = !state.toolbarCollapsed;
        dom.vtBody.classList.toggle('collapsed', state.toolbarCollapsed);
    }

    function resetCamera() {
        if (!camera || !controls) return;
        const model = scene ? scene.getObjectByName('__xmodel__') : null;
        if (model) {
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            DeckUnits.fitCamera(camera, controls, maxDim, { fitMultiplier: 1.8 });
        } else {
            camera.position.set(0, 50, 150);
            camera.near = 0.01;
            camera.far  = 100000;
            camera.updateProjectionMatrix();
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }

    function zoomToFit() {
        if (!camera || !controls || !scene) return;
        const model = scene.getObjectByName('__xmodel__');
        if (!model) return;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim <= 0) return;
        DeckUnits.fitCamera(camera, controls, maxDim, { fitMultiplier: 1.5 });
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

    function setProjection(isPerspective) {
        if (!camera || !controls) return;
        if (state.isPerspective === isPerspective) return;
        const card = $('#viewer-host');
        const w = card.clientWidth || 800;
        const h = card.clientHeight || 600;
        state.isPerspective = isPerspective;
        if (dom.vtProjection) {
            dom.vtProjection.classList.toggle('is-active', !isPerspective);
        }

        const pos = camera.position.clone();
        const target = controls.target.clone();

        // Compute model-aware near/far to prevent clipping
        let nearPlane = 0.01, farPlane = 100000;
        const mdl = scene ? scene.getObjectByName('__xmodel__') : null;
        if (mdl) {
            const mdlBox = new THREE.Box3().setFromObject(mdl);
            const mdlSize = mdlBox.getSize(new THREE.Vector3());
            const mdlMax = Math.max(mdlSize.x, mdlSize.y, mdlSize.z);
            if (mdlMax > 0) { nearPlane = mdlMax * 0.001; farPlane = mdlMax * 100; }
        }

        if (state.isPerspective) {
            camera = new THREE.PerspectiveCamera(45, w / h, nearPlane, farPlane);
        } else {
            const dist = pos.distanceTo(target);
            const frustumSize = dist * Math.tan(THREE.MathUtils.degToRad(22.5));
            camera = new THREE.OrthographicCamera(
                -frustumSize * (w / h), frustumSize * (w / h),
                frustumSize, -frustumSize,
                nearPlane, farPlane
            );
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

    // ── Appearance (Day / Night / Transparent) ──────────────
    function applyLook(look) {
        // 0 = Day (light), 1 = Night (dark), 2 = Transparent backdrop
        if (look === 2) {
            state.bgTransparent = true;
        } else {
            state.bgTransparent = false;
            state.isDark = (look === 1);
            applyTheme();
        }
        updateViewerTheme();
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
    //  Rotation & Reflection Tools — bake transforms into vertex data
    // ================================================================

    /**
     * Apply a Matrix4 transform to ALL vertex positions and normals
     * in the loaded model.  This permanently modifies the geometry
     * so the changes are captured when saving.
     *
     * @param {THREE.Matrix4} matrix  - The transformation to apply
     * @param {boolean}       flipWinding - If true, reverse triangle winding
     *                                      (needed for reflections with odd # of negative axes)
     */
    function applyTransformToModel(matrix, flipWinding) {
        if (!scene) return;
        const model = scene.getObjectByName('__xmodel__');
        if (!model) { alert('No model loaded.'); return; }

        const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

        model.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;
            const geom = child.geometry;

            // Transform positions
            const pos = geom.attributes.position;
            if (pos) {
                const v = new THREE.Vector3();
                for (let i = 0; i < pos.count; i++) {
                    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
                    v.applyMatrix4(matrix);
                    pos.setXYZ(i, v.x, v.y, v.z);
                }
                pos.needsUpdate = true;
            }

            // Transform normals
            const norm = geom.attributes.normal;
            if (norm) {
                const n = new THREE.Vector3();
                for (let i = 0; i < norm.count; i++) {
                    n.set(norm.getX(i), norm.getY(i), norm.getZ(i));
                    n.applyMatrix3(normalMatrix).normalize();
                    norm.setXYZ(i, n.x, n.y, n.z);
                }
                norm.needsUpdate = true;
            }

            // Flip winding order for reflections (swap index pairs)
            if (flipWinding && geom.index) {
                const idx = geom.index;
                for (let f = 0; f < idx.count; f += 3) {
                    const a = idx.getX(f);
                    const b = idx.getX(f + 1);
                    idx.setX(f, b);
                    idx.setX(f + 1, a);
                }
                idx.needsUpdate = true;
            }

            geom.computeBoundingBox();
            geom.computeBoundingSphere();
        });

        // Also mark raw content as modified (needs re-serialize on save)
        state.rawXFileContent = null;
    }

    /**
     * Rotate the model 90° around the given axis.
     * @param {'x'|'y'|'z'} axis
     * @param {number} sign  +1 or -1
     */
    function rotateModel(axis, sign) {
        const angle = sign * Math.PI / 2; // ±90°
        const mat = new THREE.Matrix4();
        switch (axis) {
            case 'x': mat.makeRotationX(angle); break;
            case 'y': mat.makeRotationY(angle); break;
            case 'z': mat.makeRotationZ(angle); break;
        }
        applyTransformToModel(mat, false);
    }

    /**
     * Mirror/reflect the model across the given axis plane.
     * @param {'x'|'y'|'z'} axis
     */
    function mirrorModel(axis) {
        const sx = axis === 'x' ? -1 : 1;
        const sy = axis === 'y' ? -1 : 1;
        const sz = axis === 'z' ? -1 : 1;
        const mat = new THREE.Matrix4().makeScale(sx, sy, sz);
        // A single-axis mirror flips winding order
        applyTransformToModel(mat, true);
    }

    // ================================================================
    //  Save .x File — serialize current model back to DirectX .x format
    // ================================================================

    function serializeModelToXFile() {
        if (!scene) return null;
        const model = scene.getObjectByName('__xmodel__');
        if (!model) return null;

        model.updateMatrixWorld(true);

        const lines = [];

        // Header
        lines.push('xof 0303txt 0032');
        lines.push('');

        // Standard template definitions
        lines.push('template ColorRGBA {');
        lines.push('  <35ff44e0-6c7c-11cf-8f52-0040333594a3>');
        lines.push('  FLOAT red; FLOAT green; FLOAT blue; FLOAT alpha;');
        lines.push('}');
        lines.push('');
        lines.push('template ColorRGB {');
        lines.push('  <d3e16e81-7835-11cf-8f52-0040333594a3>');
        lines.push('  FLOAT red; FLOAT green; FLOAT blue;');
        lines.push('}');
        lines.push('');
        lines.push('template Material {');
        lines.push('  <3d82ab4d-62da-11cf-ab39-0020af71e433>');
        lines.push('  ColorRGBA faceColor; FLOAT power; ColorRGB specularColor; ColorRGB emissiveColor; [...]');
        lines.push('}');
        lines.push('');
        lines.push('template MeshMaterialList {');
        lines.push('  <f6f23f42-7686-11cf-8f52-0040333594a3>');
        lines.push('  DWORD nMaterials; DWORD nFaceIndexes; array DWORD faceIndexes[nFaceIndexes]; [Material <3d82ab4d-62da-11cf-ab39-0020af71e433>]');
        lines.push('}');
        lines.push('');
        lines.push('template Vector {');
        lines.push('  <3d82ab5e-62da-11cf-ab39-0020af71e433>');
        lines.push('  FLOAT x; FLOAT y; FLOAT z;');
        lines.push('}');
        lines.push('');
        lines.push('template MeshFace {');
        lines.push('  <3d82ab5f-62da-11cf-ab39-0020af71e433>');
        lines.push('  DWORD nFaceVertexIndices; array DWORD faceVertexIndices[nFaceVertexIndices];');
        lines.push('}');
        lines.push('');
        lines.push('template Mesh {');
        lines.push('  <3d82ab44-62da-11cf-ab39-0020af71e433>');
        lines.push('  DWORD nVertices; array Vector vertices[nVertices]; DWORD nFaces; array MeshFace faces[nFaces]; [...]');
        lines.push('}');
        lines.push('');
        lines.push('template MeshNormals {');
        lines.push('  <f6f23f43-7686-11cf-8f52-0040333594a3>');
        lines.push('  DWORD nNormals; array Vector normals[nNormals]; DWORD nFaceNormals; array MeshFace faceNormals[nFaceNormals];');
        lines.push('}');
        lines.push('');
        lines.push('template MeshTextureCoords {');
        lines.push('  <f6f23f40-7686-11cf-8f52-0040333594a3>');
        lines.push('  DWORD nTextureCoords; array Coords2d textureCoords[nTextureCoords];');
        lines.push('}');
        lines.push('');
        lines.push('template Coords2d {');
        lines.push('  <f6f23f44-7686-11cf-8f52-0040333594a3>');
        lines.push('  FLOAT u; FLOAT v;');
        lines.push('}');
        lines.push('');

        // Serialize each mesh
        let meshIdx = 0;
        model.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;

            const geom = child.geometry.clone();
            // Apply any parent transforms into vertex data
            geom.applyMatrix4(child.matrixWorld);

            // Convert back from right-handed (Three.js) to left-handed (DirectX)
            // by negating Z positions and normals, and flipping winding order.
            const pos  = geom.attributes.position;
            if (pos) {
                for (let vi = 0; vi < pos.count; vi++) {
                    pos.setZ(vi, -pos.getZ(vi));
                }
            }
            const norm = geom.attributes.normal;
            if (norm) {
                for (let ni = 0; ni < norm.count; ni++) {
                    norm.setZ(ni, -norm.getZ(ni));
                }
            }
            const uv   = geom.attributes.uv;

            // Build index array & flip winding back to left-handed
            let indices;
            if (geom.index) {
                indices = geom.index;
                for (let fi = 0; fi < indices.count; fi += 3) {
                    const a = indices.getX(fi);
                    const b = indices.getX(fi + 1);
                    indices.setX(fi, b);
                    indices.setX(fi + 1, a);
                }
            } else {
                const arr = [];
                for (let i = 0; i < pos.count; i++) arr.push(i);
                geom.setIndex(arr);
                indices = geom.index;
            }

            const vertCount = pos.count;
            const faceCount = indices.count / 3;

            lines.push('Mesh Mesh_' + meshIdx + ' {');
            lines.push('  ' + vertCount + ';');

            // Vertices
            for (let i = 0; i < vertCount; i++) {
                const sep = (i < vertCount - 1) ? ',' : ';';
                lines.push('  ' + pos.getX(i).toFixed(6) + ';' + pos.getY(i).toFixed(6) + ';' + pos.getZ(i).toFixed(6) + ';' + sep);
            }

            // Faces
            lines.push('  ' + faceCount + ';');
            for (let f = 0; f < faceCount; f++) {
                const i0 = indices.getX(f * 3);
                const i1 = indices.getX(f * 3 + 1);
                const i2 = indices.getX(f * 3 + 2);
                const sep = (f < faceCount - 1) ? ',' : ';';
                lines.push('  3;' + i0 + ',' + i1 + ',' + i2 + ';' + sep);
            }

            // MeshMaterialList
            const mat = child.material;
            const mats = Array.isArray(mat) ? mat : [mat];
            lines.push('  MeshMaterialList {');
            lines.push('    ' + mats.length + ';');
            lines.push('    ' + faceCount + ';');
            // Material index per face (assign all faces to material 0 for single-material)
            for (let f = 0; f < faceCount; f++) {
                const matFaceIdx = 0; // Simplified: use first material
                const sep = (f < faceCount - 1) ? ',' : ';;';
                lines.push('    ' + matFaceIdx + sep);
            }
            mats.forEach(function (m, mi) {
                const r = m && m.color ? m.color.r : 0.7;
                const g = m && m.color ? m.color.g : 0.7;
                const b = m && m.color ? m.color.b : 0.7;
                const a = m && m.opacity !== undefined ? m.opacity : 1.0;
                const power = m && m.shininess !== undefined ? m.shininess : 20.0;
                const sr = m && m.specular ? m.specular.r : 0.0;
                const sg = m && m.specular ? m.specular.g : 0.0;
                const sb = m && m.specular ? m.specular.b : 0.0;
                const er = m && m.emissive ? m.emissive.r : 0.0;
                const eg = m && m.emissive ? m.emissive.g : 0.0;
                const eb = m && m.emissive ? m.emissive.b : 0.0;
                lines.push('    Material {');
                lines.push('      ' + r.toFixed(6) + ';' + g.toFixed(6) + ';' + b.toFixed(6) + ';' + a.toFixed(6) + ';;');
                lines.push('      ' + power.toFixed(6) + ';');
                lines.push('      ' + sr.toFixed(6) + ';' + sg.toFixed(6) + ';' + sb.toFixed(6) + ';;');
                lines.push('      ' + er.toFixed(6) + ';' + eg.toFixed(6) + ';' + eb.toFixed(6) + ';;');
                lines.push('    }');
            });
            lines.push('  }');

            // MeshNormals
            if (norm) {
                lines.push('  MeshNormals {');
                lines.push('    ' + norm.count + ';');
                for (let i = 0; i < norm.count; i++) {
                    const sep = (i < norm.count - 1) ? ',' : ';';
                    lines.push('    ' + norm.getX(i).toFixed(6) + ';' + norm.getY(i).toFixed(6) + ';' + norm.getZ(i).toFixed(6) + ';' + sep);
                }
                lines.push('    ' + faceCount + ';');
                for (let f = 0; f < faceCount; f++) {
                    const i0 = indices.getX(f * 3);
                    const i1 = indices.getX(f * 3 + 1);
                    const i2 = indices.getX(f * 3 + 2);
                    const sep = (f < faceCount - 1) ? ',' : ';';
                    lines.push('    3;' + i0 + ',' + i1 + ',' + i2 + ';' + sep);
                }
                lines.push('  }');
            }

            // MeshTextureCoords
            if (uv) {
                lines.push('  MeshTextureCoords {');
                lines.push('    ' + uv.count + ';');
                for (let i = 0; i < uv.count; i++) {
                    const sep = (i < uv.count - 1) ? ',' : ';';
                    lines.push('    ' + uv.getX(i).toFixed(6) + ';' + uv.getY(i).toFixed(6) + ';' + sep);
                }
                lines.push('  }');
            }

            lines.push('}');
            lines.push('');

            meshIdx++;
            geom.dispose();
        });

        return lines.join('\n');
    }

    /**
     * Save the current model as a .x file download.
     */
    function saveXFile() {
        const model = scene ? scene.getObjectByName('__xmodel__') : null;
        if (!model) { alert('No model loaded to save.'); return; }

        const content = serializeModelToXFile();
        if (!content) { alert('Failed to serialize model.'); return; }

        const fileName = (state.loadedFileName || 'model').replace(/\.[^.]+$/, '') + '.x';
        const blob = new Blob([content], { type: 'text/plain' });
        downloadBlob(blob, fileName);
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

    function saveScreenshot(format, opts) {
        if (!renderer || !scene || !camera) return;

        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        // Temporarily toggle grid visibility
        const grid = scene.getObjectByName('__grid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && state.gridVisible;

        // Temporarily toggle background
        const origBg = scene.background;
        if (!showBg) {
            scene.background = null;
            renderer.setClearColor(0x000000, 0);
        }

        renderer.render(scene, camera);

        const canvas = renderer.domElement;
        const fileName = (state.loadedFileName || 'screenshot').replace(/\.[^.]+$/, '');

        if (format === 'svg') {
            const svgContent = exportVectorSVG();
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            downloadBlob(blob, fileName + '.svg');
        } else if (format === 'jpg') {
            canvas.toBlob(function(blob) {
                if (blob) downloadBlob(blob, fileName + '.jpg');
            }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function(blob) {
                if (blob) downloadBlob(blob, fileName + '.png');
            }, 'image/png');
        }

        // Restore originals
        if (grid) grid.visible = origGridVis;
        scene.background = origBg;
        if (!showBg) renderer.setClearColor(state.isDark ? DARK_BG : LIGHT_BG, 1);
        renderer.render(scene, camera);
    }

    /** Render a preview dataURL for the screenshot modal */
    function screenshotPreviewDataURL(opts) {
        if (!renderer || !scene || !camera) return '';

        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = scene.getObjectByName('__grid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && state.gridVisible;

        const origBg = scene.background;
        if (!showBg) {
            scene.background = null;
            renderer.setClearColor(0x000000, 0);
        }

        renderer.render(scene, camera);
        const dataURL = renderer.domElement.toDataURL('image/png');

        // Restore
        if (grid) grid.visible = origGridVis;
        scene.background = origBg;
        if (!showBg) renderer.setClearColor(state.isDark ? DARK_BG : LIGHT_BG, 1);
        renderer.render(scene, camera);

        return dataURL;
    }

    // ── Screenshot modal ─────────────────────────────────────
    let ssModalSource = null; // tracks which viewer opened the modal

    function openScreenshotModal(source) {
        ssModalSource = source;
        const overlay = $('#ss-overlay');
        const img     = $('#ss-preview-img');
        const optGrid = $('#ss-opt-grid');
        const optBg   = $('#ss-opt-bg');
        if (!overlay || !img) return;

        // Reset toggles
        optGrid.checked = true;
        optBg.checked   = true;

        // Generate preview
        updateScreenshotPreview();

        overlay.classList.add('is-open');
    }

    function closeScreenshotModal() {
        const overlay = $('#ss-overlay');
        if (overlay) overlay.classList.remove('is-open');
        ssModalSource = null;
    }

    function updateScreenshotPreview() {
        const img     = $('#ss-preview-img');
        const optGrid = $('#ss-opt-grid');
        const optBg   = $('#ss-opt-bg');
        if (!img) return;

        const opts = {
            showGrid: optGrid ? optGrid.checked : true,
            showBg:   optBg   ? optBg.checked   : true,
        };

        img.src = screenshotPreviewDataURL(opts);
    }

    function ssModalSave(format) {
        const optGrid = $('#ss-opt-grid');
        const optBg   = $('#ss-opt-bg');
        const opts = {
            showGrid: optGrid ? optGrid.checked : true,
            showBg:   optBg   ? optBg.checked   : true,
        };

        saveScreenshot(format, opts);
        closeScreenshotModal();
    }

    // Wire screenshot modal controls (called once in init)
    function initScreenshotModal() {
        const overlay = $('#ss-overlay');
        const closeBtn = $('#ss-close');
        const optGrid = $('#ss-opt-grid');
        const optBg   = $('#ss-opt-bg');

        if (closeBtn) closeBtn.addEventListener('click', closeScreenshotModal);
        if (overlay) overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeScreenshotModal();
        });

        // Toggle changes → live preview update
        if (optGrid) optGrid.addEventListener('change', updateScreenshotPreview);
        if (optBg)   optBg.addEventListener('change', updateScreenshotPreview);

        // Save buttons
        document.querySelectorAll('.ss-save-btn').forEach(btn => {
            btn.addEventListener('click', () => ssModalSave(btn.dataset.format));
        });
    }

    window.openScreenshotModal = openScreenshotModal;
    window.downloadBlob = downloadBlob;

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

        if (typeof THREE.GLTFExporter === 'undefined') {
            alert('GLTFExporter library not loaded.');
            return;
        }

        const exporter = new THREE.GLTFExporter();
        exporter.parse(model, function (glb) {
            downloadBlob(new Blob([glb], { type: 'model/gltf-binary' }), viewerFileName() + '.glb');
        }, function (error) {
            console.error('GLB export error:', error);
            alert('GLB export error: ' + (error.message || error));
        }, { binary: true });
    }

    // ── HXX ──────────────────────────────────────────────────────
    function exportViewerHXX() {
        const model = getViewerModel();
        if (!model) return;
        if (!state.rawXFileContent) {
            alert('No .x file content available — HXX export requires a loaded .x file.');
            return;
        }
        if (!window.HXXLoader || !window.HXXLoader.composeHXX) {
            alert('HXXLoader.composeHXX not available.');
            return;
        }
        try {
            HXXLoader.composeHXX(state.rawXFileContent).then(function (hxxBuffer) {
                downloadBlob(
                    new Blob([hxxBuffer], { type: 'application/octet-stream' }),
                    viewerFileName() + '.hxx'
                );
            }).catch(function (err) {
                console.error('HXX compose error:', err);
                alert('HXX export error: ' + (err.message || err));
            });
        } catch (err) {
            console.error('HXX export error:', err);
            alert('HXX export error: ' + err.message);
        }
    }

    // ── Export dispatcher ────────────────────────────────────────
    function doViewerExport(fmt) {
        const model = getViewerModel();
        if (!model) { alert('No model loaded.'); return; }
        try {
            switch (fmt) {
                case 'x':   saveXFile(); break;
                case 'obj': exportViewerOBJ(); break;
                case 'stl': exportViewerSTL(); break;
                case 'glb': exportViewerGLB(); break;
                case 'hxx': exportViewerHXX(); break;
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
    /* ── Draggable Panels ──────────────────────────────────── */
    function makeDraggable(panel, handleSelector, snapContainer) {
        const handle = handleSelector ? panel.querySelector(handleSelector) : panel;
        if (!handle) return;
        let isDragging = false, startX, startY, origLeft, origTop, panelW, panelH;
        const SNAP_THRESHOLD = 24; // px from edge to snap

        handle.classList.add('draggable-handle');

        function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

        function onPointerDown(e) {
            // ignore interactions on inputs, buttons, etc.
            if (e.target.closest('input, button, select, textarea')) return;
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            origLeft = rect.left;
            origTop = rect.top;
            // Capture panel size once at drag-start (content+padding+border)
            panelW = panel.offsetWidth;
            panelH = panel.offsetHeight;
            // switch to fixed positioning so it can move freely
            panel.style.position = 'fixed';
            panel.style.left = origLeft + 'px';
            panel.style.top = origTop + 'px';
            panel.style.bottom = 'auto';
            panel.style.right = 'auto';
            panel.style.margin = '0';
            handle.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
            panel.classList.remove('pp-snapped-left', 'pp-snapped-right');
            e.preventDefault();
        }

        function onPointerMove(e) {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            // Clamp so the ENTIRE panel stays within the viewport
            panel.style.left = clamp(origLeft + dx, 0, vw - panelW) + 'px';
            panel.style.top  = clamp(origTop  + dy, 0, vh - panelH) + 'px';
        }

        function onPointerUp() {
            if (!isDragging) return;
            isDragging = false;
            handle.style.cursor = '';
            document.body.style.userSelect = '';

            // Re-measure in case content changed size during drag
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const pw = panel.offsetWidth;
            const ph = panel.offsetHeight;
            const r  = panel.getBoundingClientRect();

            // Final clamp
            panel.style.left = clamp(r.left, 0, vw - pw) + 'px';
            panel.style.top  = clamp(r.top,  0, vh - ph) + 'px';

            // Edge-snap: if within SNAP_THRESHOLD of the host's left/right edge,
            // stick flush to that edge — but always clamped to viewport.
            const host = snapContainer || panel.parentElement;
            if (host) {
                const hr = host.getBoundingClientRect();
                const pr = panel.getBoundingClientRect();

                const distLeft  = pr.left - hr.left;
                const distRight = hr.right - pr.right;

                if (distLeft <= SNAP_THRESHOLD) {
                    panel.style.left = clamp(hr.left, 0, vw - pw) + 'px';
                    panel.classList.add('pp-snapped-left');
                    panel.classList.remove('pp-snapped-right');
                } else if (distRight <= SNAP_THRESHOLD) {
                    panel.style.left = clamp(hr.right - pw, 0, vw - pw) + 'px';
                    panel.classList.add('pp-snapped-right');
                    panel.classList.remove('pp-snapped-left');
                } else {
                    panel.classList.remove('pp-snapped-left', 'pp-snapped-right');
                }
            }
        }

        handle.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }

    function initDraggablePanels() {
        // Helper: wire drag + double-click reset for a toolbar vt-body
        function wireToolbarDrag(bodyId, handleId, hostEl) {
            const body = document.getElementById(bodyId);
            if (!body) return;
            makeDraggable(body, '#' + handleId, hostEl);
            const handle = body.querySelector('#' + handleId);
            if (handle) {
                handle.addEventListener('dblclick', () => {
                    body.style.position = '';
                    body.style.left = '';
                    body.style.top = '';
                    body.style.bottom = '';
                    body.style.right = '';
                    body.style.margin = '';
                    body.classList.remove('pp-snapped-left', 'pp-snapped-right');
                });
            }
        }

        // Main viewer toolbar
        const viewerHost = document.getElementById('viewer-host');
        wireToolbarDrag('vt-body', 'vt-grab-handle', viewerHost);

        // Debug panels
        document.querySelectorAll('.debug-panel').forEach(panel => {
            makeDraggable(panel, '.debug-panel-header');
        });
    }

    function init() {
        try {
            state.isDark = localStorage.getItem('dilution-dark-mode') === '1';
        } catch(e) {}
        applyTheme();

        if (dom.btnTheme) dom.btnTheme.addEventListener('click', toggleTheme);
        if (dom.btnGrid) dom.btnGrid.addEventListener('click', toggleGrid);

        // About modal
        dom.aboutLogo = document.querySelector('.about-logo');
        if (dom.aboutLogo) dom.aboutLogo.addEventListener('click', handleTeapotClick);

        if (dom.btnAbout) dom.btnAbout.addEventListener('click', () => {
            if (dom.aboutOverlay) dom.aboutOverlay.classList.add('is-open');
        });
        if (dom.aboutClose) dom.aboutClose.addEventListener('click', () => {
            if (dom.aboutOverlay) dom.aboutOverlay.classList.remove('is-open');
            resetTeapot();
        });
        if (dom.aboutOverlay) dom.aboutOverlay.addEventListener('click', (e) => {
            if (e.target === dom.aboutOverlay) {
                dom.aboutOverlay.classList.remove('is-open');
                resetTeapot();
            }
        });

        dom.fileInput.addEventListener('change', handleFileSelected);

        // Floating toolbar events
        if (dom.vtToggle) dom.vtToggle.addEventListener('click', toggleToolbar);
        if (dom.vtOpen) dom.vtOpen.addEventListener('click', openFileDialog);
        if (dom.vtResetCam) dom.vtResetCam.addEventListener('click', resetCamera);
        if (dom.vtZoomFit) dom.vtZoomFit.addEventListener('click', zoomToFit);
        if (dom.vtWireframe) dom.vtWireframe.addEventListener('click', toggleWireframe);
        if (dom.vtZoomIn) dom.vtZoomIn.addEventListener('click', () => doZoom(0.75));
        if (dom.vtZoomOut) dom.vtZoomOut.addEventListener('click', () => doZoom(1.35));
        if (dom.vtPan) dom.vtPan.addEventListener('click', togglePanMode);

        // Save button
        if (dom.vtSave) dom.vtSave.addEventListener('click', saveXFile);

        // Helper: position a flyout to the LEFT of its trigger button (fixed)
        function positionFlyout(flyout, trigger) {
            const r = trigger.getBoundingClientRect();
            flyout.style.visibility = 'hidden';
            flyout.classList.add('is-open');
            const fw = flyout.offsetWidth;
            const fh = flyout.offsetHeight;
            let left = r.left - fw - 10;
            if (left < 8) left = r.right + 10;
            let top = r.top;
            if (top + fh > window.innerHeight - 8) top = window.innerHeight - fh - 8;
            if (top < 8) top = 8;
            flyout.style.left = left + 'px';
            flyout.style.top = top + 'px';
            flyout.style.visibility = '';
        }

        function closeAllToolbarFlyouts() {
            if (dom.projFlyout) dom.projFlyout.classList.remove('is-open');
            if (dom.appearanceFlyout) dom.appearanceFlyout.classList.remove('is-open');
            if (dom.tfFlyout) dom.tfFlyout.classList.remove('is-open');
            if (dom.vtProjection) dom.vtProjection.classList.remove('is-active');
            if (dom.vtAppearance) dom.vtAppearance.classList.remove('is-active');
            if (dom.vtTransformToggle) dom.vtTransformToggle.classList.remove('is-active');
        }

        // Projection flyout
        if (dom.vtProjection && dom.projFlyout) {
            dom.vtProjection.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !dom.projFlyout.classList.contains('is-open');
                closeAllToolbarFlyouts();
                if (willOpen) {
                    positionFlyout(dom.projFlyout, dom.vtProjection);
                    dom.vtProjection.classList.add('is-active');
                }
            });
            dom.projFlyout.addEventListener('click', (e) => e.stopPropagation());
            dom.projFlyout.querySelectorAll('input[name="proj-mode"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    setProjection(radio.value === 'perspective');
                });
            });
        }

        // Appearance flyout
        if (dom.vtAppearance && dom.appearanceFlyout) {
            dom.vtAppearance.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !dom.appearanceFlyout.classList.contains('is-open');
                closeAllToolbarFlyouts();
                if (willOpen) {
                    // Sync radios to current state before showing
                    const look = state.bgTransparent ? '2' : (state.isDark ? '1' : '0');
                    dom.appearanceFlyout.querySelectorAll('input[name="look-mode"]').forEach(r => {
                        r.checked = (r.value === look);
                    });
                    positionFlyout(dom.appearanceFlyout, dom.vtAppearance);
                    dom.vtAppearance.classList.add('is-active');
                }
            });
            dom.appearanceFlyout.addEventListener('click', (e) => e.stopPropagation());
            dom.appearanceFlyout.querySelectorAll('input[name="look-mode"]').forEach(radio => {
                radio.addEventListener('change', () => {
                    applyLook(parseInt(radio.value, 10));
                });
            });
        }

        // Help dialog
        if (dom.vtHelp && dom.helpOverlay) {
            const closeHelp = () => dom.helpOverlay.classList.remove('is-open');
            dom.vtHelp.addEventListener('click', () => dom.helpOverlay.classList.add('is-open'));
            const helpCloseX = $('#help-close');
            const helpCloseBtn = $('#help-close-btn');
            if (helpCloseX) helpCloseX.addEventListener('click', closeHelp);
            if (helpCloseBtn) helpCloseBtn.addEventListener('click', closeHelp);
            dom.helpOverlay.addEventListener('click', (e) => {
                if (e.target === dom.helpOverlay) closeHelp();
            });
        }

        // About button (in toolbar)
        if (dom.vtAbout && dom.aboutOverlay) {
            dom.vtAbout.addEventListener('click', () => dom.aboutOverlay.classList.add('is-open'));
        }

        // Transform flyout toggle
        if (dom.vtTransformToggle && dom.tfFlyout) {
            dom.vtTransformToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const willOpen = !dom.tfFlyout.classList.contains('is-open');
                closeAllToolbarFlyouts();
                if (willOpen) {
                    positionFlyout(dom.tfFlyout, dom.vtTransformToggle);
                    dom.vtTransformToggle.classList.add('is-active');
                }
            });
            dom.tfFlyout.addEventListener('click', (e) => e.stopPropagation());
        }

        // Rotation buttons
        if (dom.vtRotXPos) dom.vtRotXPos.addEventListener('click', () => rotateModel('x', +1));
        if (dom.vtRotXNeg) dom.vtRotXNeg.addEventListener('click', () => rotateModel('x', -1));
        if (dom.vtRotYPos) dom.vtRotYPos.addEventListener('click', () => rotateModel('y', +1));
        if (dom.vtRotYNeg) dom.vtRotYNeg.addEventListener('click', () => rotateModel('y', -1));
        if (dom.vtRotZPos) dom.vtRotZPos.addEventListener('click', () => rotateModel('z', +1));
        if (dom.vtRotZNeg) dom.vtRotZNeg.addEventListener('click', () => rotateModel('z', -1));

        // Mirror/reflect buttons
        if (dom.vtMirrorX) dom.vtMirrorX.addEventListener('click', () => mirrorModel('x'));
        if (dom.vtMirrorY) dom.vtMirrorY.addEventListener('click', () => mirrorModel('y'));
        if (dom.vtMirrorZ) dom.vtMirrorZ.addEventListener('click', () => mirrorModel('z'));

        // Screenshot button → open modal
        const ssBtn = $('#vt-screenshot');
        if (ssBtn) {
            ssBtn.addEventListener('click', () => {
                openScreenshotModal('viewer');
            });
        }

        // Export button & dropdown
        const exBtn = $('#vt-export');
        const exDrop = $('#export-dropdown');
        if (exBtn && exDrop) {
            exBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exDrop.classList.toggle('is-open');
            });
            exDrop.addEventListener('click', (e) => e.stopPropagation());
            exDrop.querySelectorAll('.export-option').forEach(btn => {
                btn.addEventListener('click', () => {
                    doViewerExport(btn.dataset.format);
                    exDrop.classList.remove('is-open');
                });
            });
        }

        // Close dropdowns / flyouts on outside click
        document.addEventListener('click', () => {
            if (exDrop) exDrop.classList.remove('is-open');
            if (dom.tfFlyout) dom.tfFlyout.classList.remove('is-open');
            if (dom.vtTransformToggle) dom.vtTransformToggle.classList.remove('is-active');
            if (dom.projFlyout) dom.projFlyout.classList.remove('is-open');
            if (dom.appearanceFlyout) dom.appearanceFlyout.classList.remove('is-open');
            if (dom.vtProjection) dom.vtProjection.classList.remove('is-active');
            if (dom.vtAppearance) dom.vtAppearance.classList.remove('is-active');
        });

        initScreenshotModal();
        initSplash();
        initDraggablePanels();

        // Electron file association: open file passed from main process
        if (window.electronAPI && window.electronAPI.onOpenFile) {
            window.electronAPI.onOpenFile(function (filePath) {
                const name = filePath.replace(/\\/g, '/').split('/').pop();
                const ext = name.split('.').pop().toLowerCase();
                // Skip the splash if a file is being opened directly
                const splash = document.getElementById('splash-screen');
                if (splash) splash.style.display = 'none';
                const appEl = document.getElementById('app');
                if (appEl) appEl.classList.remove('app-hidden');

                state.loadedFileName = name;
                state.loadedFilePath = filePath;
                clearModel();
                const loading = $('#viewer-loading');
                const errorEl = $('#viewer-error');
                if (loading) {
                    loading.classList.remove('viewer-hidden');
                    const span = loading.querySelector('span');
                    if (span) span.textContent = 'Loading ' + name + '\u2026';
                }
                if (errorEl) errorEl.classList.add('viewer-hidden');

                const fileUrl = 'file:///' + filePath.replace(/\\/g, '/').replace(/ /g, '%20');
                switch (ext) {
                    case 'hxx':
                        fetch(fileUrl).then(r => r.arrayBuffer()).then(buf => {
                            HXXLoader.toXFileBlob(buf).then(blob => {
                                const url = URL.createObjectURL(blob);
                                state.lastLoadedUrl = url;
                                setFilenameDisplay();
                                loadXFile(url, loading, errorEl);
                            });
                        }).catch(err => showError(errorEl, 'Failed to load: ' + err.message));
                        break;
                    case 'x':
                        state.lastLoadedUrl = fileUrl;
                        setFilenameDisplay();
                        loadXFile(fileUrl, loading, errorEl);
                        break;
                    case 'obj':
                        state.lastLoadedUrl = fileUrl;
                        setFilenameDisplay();
                        loadXFile(fileUrl, loading, errorEl);
                        break;
                    case 'stl':
                    case 'glb':
                    case 'gltf':
                        state.lastLoadedUrl = fileUrl;
                        setFilenameDisplay();
                        loadXFile(fileUrl, loading, errorEl);
                        break;
                    default:
                        if (loading) loading.classList.add('viewer-hidden');
                        showError(errorEl, 'Unsupported format: .' + ext);
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
