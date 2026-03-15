/* ============================================================
   Hamilton Import — Parse .rck (rack) + .ctr (container) files
   from Hamilton VENUS software and generate 3D .x models
   for SBS-format plates.
   ============================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  State
    // ================================================================
    const hamSt = {
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
        parsedDef: null,
        // Ruler state
        rulerActive: false,
        rulerStart: null,
        rulerEnd: null,
        rulerLine: null,
        rulerMarkers: [],
        rulerAxisLock: null,
        _savedMouseButtons: null,
        // File state
        rckText: null,
        ctrText: null,
        rckName: '',
        ctrName: '',
    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initHamiltonImport() {
        hamSt.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updateHamTheme();
            return;
        }
        initialized = true;

        const canvas = $('#ham-canvas');
        const host   = $('#hamilton-host');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 800;
        const h = host.clientHeight || 600;

        // -- Scene --
        hamSt.scene = new THREE.Scene();
        hamSt.scene.background = new THREE.Color(hamSt.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        hamSt.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        hamSt.camera.position.set(120, 80, 160);
        hamSt.camera.up.set(0, 1, 0);

        // -- Renderer --
        hamSt.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });
        hamSt.renderer.setPixelRatio(window.devicePixelRatio);
        hamSt.renderer.setSize(w, h);

        // -- Controls --
        hamSt.controls = new THREE.OrbitControls(hamSt.camera, hamSt.renderer.domElement);
        hamSt.controls.enableDamping = true;
        hamSt.controls.dampingFactor = 0.12;
        hamSt.controls.target.set(0, 0, 0);
        hamSt.controls.update();

        // -- Lights --
        hamSt.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(50, 100, 50);
        hamSt.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-50, -20, -50);
        hamSt.scene.add(d2);

        // -- Grid --
        const gc = hamSt.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(400, 40, gc, gc);
        grid.name = '__hamgrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        grid.visible = hamSt.gridVisible;
        hamSt.scene.add(grid);

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const previewCol = host.querySelector('.lg-preview-col');
            if (!previewCol) return;
            const cw = previewCol.clientWidth;
            const ch = previewCol.clientHeight;
            if (cw <= 0 || ch <= 0) return;
            hamSt.camera.aspect = cw / ch;
            hamSt.camera.updateProjectionMatrix();
            hamSt.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Render loop --
        function tick() {
            hamSt.animId = requestAnimationFrame(tick);
            hamSt.controls.update();
            hamSt.renderer.render(hamSt.scene, hamSt.camera);
            drawHamGizmo();
            updateHamCamDisplay();
        }
        tick();

        // -- Wire controls --
        wireHamControls();
        wireHamToolbar();
    }

    // ================================================================
    //  Theme sync
    // ================================================================
    function updateHamTheme() {
        hamSt.isDark = document.documentElement.hasAttribute('data-theme');
        if (!hamSt.scene) return;
        hamSt.scene.background = new THREE.Color(hamSt.isDark ? DARK_BG : LIGHT_BG);
        const grid = hamSt.scene.getObjectByName('__hamgrid__');
        if (grid) {
            const c = new THREE.Color(hamSt.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
        }
    }

    // ================================================================
    //  Hamilton .rck / .ctr File Parsers
    // ================================================================

    /** Parse HxCfgFile key-value text into a flat map. */
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

    /** Parse .rck rack file → rack definition. */
    function parseRckFile(text) {
        const cfg = parseHxCfg(text);
        const rck = {
            dimDx:     parseFloat(cfg['Dim.Dx']) || 127,
            dimDy:     parseFloat(cfg['Dim.Dy']) || 86,
            dimDz:     parseFloat(cfg['Dim.Dz']) || 14,
            rows:      parseInt(cfg['Rows']) || 8,
            columns:   parseInt(cfg['Columns']) || 12,
            dx:        parseFloat(cfg['Dx']) || 9,
            dy:        parseFloat(cfg['Dy']) || 9,
            bndryX:    parseFloat(cfg['BndryX']) || 14,
            bndryY:    parseFloat(cfg['BndryY']) || 11.5,
            ctrBase:   parseFloat(cfg['Cntr.1.base']) || 0,
            ctrFile:   cfg['Cntr.1.file'] || '',
            holeShape: parseInt(cfg['Hole.Shape']) || 0,
            holeX:     parseFloat(cfg['Hole.X']) || 0,
            holeY:     parseFloat(cfg['Hole.Y']) || 0,
            holeZ:     parseFloat(cfg['Hole.Z']) || 0,
            shape:     parseInt(cfg['Shape']) || 0,
            stackHt:   parseFloat(cfg['StackHt']) || 0,
            description: cfg['Description'] || cfg['ViewName'] || '',
            segCountX: parseInt(cfg['SegmentCount_x']) || 0,
            segCountY: parseInt(cfg['SegmentCount_y']) || 0,
            segX: [],
            segY: [],
        };
        // Parse outer profile segments
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
        return rck;
    }

    /** Parse .ctr container file → container definition. */
    function parseCtrFile(text) {
        const cfg = parseHxCfg(text);
        const numSegments = parseInt(cfg['Segments']) || 1;
        const segments = [];
        for (let i = 1; i <= numSegments; i++) {
            segments.push({
                dx:    parseFloat(cfg[i + '.DX']) || 0,
                dy:    parseFloat(cfg[i + '.DY']) || 0,
                dz:    parseFloat(cfg[i + '.DZ']) || 0,
                max:   parseFloat(cfg[i + '.Max']) || 0,
                min:   parseFloat(cfg[i + '.Min']) || 0,
                shape: parseInt(cfg[i + '.Shape']) || 0,
            });
        }
        return {
            shape:    parseInt(cfg['Shape']) || 0,
            depth:    parseFloat(cfg['Depth']) || 10,
            dimDx:    parseFloat(cfg['Dim.Dx']) || 7,
            dimDy:    parseFloat(cfg['Dim.Dy']) || 7,
            segments: segments,
            numSegments: numSegments,
        };
    }

    /** Convert .rck + .ctr → unified plate definition for generatePlateModel. */
    function hamiltonToDefinition(rck, ctr, rckName, ctrName) {
        const isSquare = ctr.shape === 1 || rck.holeShape === 1;
        const wellShape = isSquare ? 'Square' : 'Circle';

        const topSeg = ctr.segments[0];
        const botSeg = ctr.segments[ctr.segments.length - 1];

        let wellTopDia;
        if (isSquare) {
            wellTopDia = topSeg.dx || ctr.dimDx;
        } else {
            wellTopDia = topSeg.dz || ctr.dimDx;
        }

        let wellBotDia = wellTopDia;
        let bottomShape = 'Flat';
        let vShapeDepth = 0;

        if (botSeg.shape === 4) {
            bottomShape = 'Circle';
            wellBotDia = botSeg.dz || botSeg.dx || wellTopDia;
        } else if (botSeg.shape === 5) {
            bottomShape = 'VShape';
            wellBotDia = botSeg.dz || botSeg.dx || wellTopDia;
            vShapeDepth = botSeg.max || wellBotDia / 2;
        } else if (botSeg.shape === 3) {
            wellBotDia = botSeg.dx || botSeg.dz || wellTopDia;
        }

        if (ctr.numSegments > 1 && topSeg.dx > 0 && botSeg.dx > 0 && topSeg.dx !== botSeg.dx) {
            wellBotDia = Math.min(topSeg.dx, botSeg.dx);
            wellTopDia = Math.max(topSeg.dx, botSeg.dx);
        }

        if (wellTopDia === 0 && rck.holeX > 0) wellTopDia = rck.holeX;
        if (wellBotDia === 0) wellBotDia = wellTopDia;

        const firstX = rck.bndryX;
        const firstY = rck.bndryY;
        const height = rck.dimDz || (rck.ctrBase + ctr.depth);

        const rawName = (rckName || ctrName || 'Hamilton Plate')
            .replace(/\.(rck|ctr)$/i, '')
            .replace(/[_-]/g, ' ');

        return {
            type: 'plate',
            name: rawName,
            manufacturer: 'Hamilton',
            partNumber: '',
            description: rck.description,
            footprintLength: rck.dimDx,
            footprintWidth:  rck.dimDy,
            height:          height,
            rowCount:        rck.columns,
            colCount:        rck.rows,
            rowGap:          rck.dy,
            colGap:          rck.dx,
            wellDepth:       ctr.depth,
            wellShape:       wellShape,
            wellSize:        wellTopDia,
            wellLength:      isSquare ? (topSeg.dx || ctr.dimDx) : wellTopDia,
            sizeBottom:      wellBotDia,
            bottomShape:     bottomShape,
            vShapeDepth:     vShapeDepth,
            angle:           0,
            nominalVolume:   0,
            firstHolePos:    { x: firstX, y: firstY },
            wellCount:       rck.columns * rck.rows,
        };
    }

    // ================================================================
    //  Form Population & Reading
    // ================================================================
    function populateForm(def) {
        hamSt.parsedDef = def;

        $('#ham-name').value = def.name || '';
        $('#ham-manufacturer').value = def.manufacturer || 'Hamilton';
        $('#ham-description').value = def.description || '';

        $('#ham-fp-length').value = def.footprintLength.toFixed(2);
        $('#ham-fp-width').value = def.footprintWidth.toFixed(2);
        $('#ham-height').value = def.height.toFixed(2);
        $('#ham-rows').value = def.rowCount;
        $('#ham-cols').value = def.colCount;
        $('#ham-row-gap').value = def.rowGap.toFixed(2);
        $('#ham-col-gap').value = def.colGap.toFixed(2);
        $('#ham-well-depth').value = def.wellDepth.toFixed(2);
        $('#ham-well-shape').value = def.wellShape || 'Circle';
        $('#ham-well-size').value = def.wellSize.toFixed(2);
        $('#ham-well-size-bottom').value = def.sizeBottom.toFixed(2);
        $('#ham-bottom-shape').value = def.bottomShape || 'Flat';
        $('#ham-first-x').value = def.firstHolePos.x.toFixed(2);
        $('#ham-first-y').value = def.firstHolePos.y.toFixed(2);

        // SBS compliance check
        var LGM = window.LabwareGenModule;
        if (LGM && LGM.checkSBSCompliance) {
            var sbsOk = LGM.checkSBSCompliance(def);
            var badge = $('#ham-sbs-badge');
            if (badge) {
                badge.textContent = sbsOk ? 'SBS Compliant' : 'Non-Standard';
                badge.className = 'lg-sbs-badge ' + (sbsOk ? 'sbs-ok' : 'sbs-warn');
            }
        }

        // Well count
        var wcEl = $('#ham-well-count');
        if (wcEl) wcEl.textContent = def.wellCount + ' wells (' + def.rowCount + '×' + def.colCount + ')';
    }

    function readFormDef() {
        var LGM = window.LabwareGenModule;
        var SBS = (LGM && LGM.SBS) ? LGM.SBS : {
            footprintLength: 127.76, footprintWidth: 85.48,
            a1OffsetX: 14.38, a1OffsetY: 11.24,
        };
        return {
            type: 'plate',
            name: $('#ham-name').value,
            manufacturer: $('#ham-manufacturer').value,
            partNumber: '',
            footprintLength: parseFloat($('#ham-fp-length').value) || SBS.footprintLength,
            footprintWidth:  parseFloat($('#ham-fp-width').value) || SBS.footprintWidth,
            height:          parseFloat($('#ham-height').value) || 14,
            rowCount:        parseInt($('#ham-rows').value) || 8,
            colCount:        parseInt($('#ham-cols').value) || 12,
            rowGap:          parseFloat($('#ham-row-gap').value) || 9.0,
            colGap:          parseFloat($('#ham-col-gap').value) || 9.0,
            wellDepth:       parseFloat($('#ham-well-depth').value) || 10,
            wellShape:       $('#ham-well-shape').value || 'Circle',
            wellSize:        parseFloat($('#ham-well-size').value) || 7,
            wellLength:      parseFloat($('#ham-well-size').value) || 7,
            sizeBottom:      parseFloat($('#ham-well-size-bottom').value) || 6.5,
            bottomShape:     $('#ham-bottom-shape').value || 'Flat',
            vShapeDepth:     0,
            angle:           0,
            nominalVolume:   0,
            firstHolePos: {
                x: parseFloat($('#ham-first-x').value) || 14,
                y: parseFloat($('#ham-first-y').value) || 11.5,
            },
            wellCount: (parseInt($('#ham-rows').value) || 8) * (parseInt($('#ham-cols').value) || 12),
        };
    }

    // ================================================================
    //  Display / Clear Model
    // ================================================================
    function displayModel(group) {
        clearModel();
        hamSt.model = group;
        hamSt.scene.add(group);

        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        hamSt.controls.target.copy(center);
        const dist = maxDim * 1.8;
        hamSt.camera.position.set(
            center.x + dist * 0.6,
            center.y + dist * 0.5,
            center.z + dist * 0.8
        );
        hamSt.controls.update();
    }

    function clearModel() {
        if (!hamSt.scene) return;
        const old = hamSt.scene.getObjectByName('__lg_labware__');
        if (old) {
            old.traverse(function (child) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(function (m) { m.dispose(); });
                    } else {
                        child.material.dispose();
                    }
                }
            });
            hamSt.scene.remove(old);
        }
        hamSt.model = null;
    }

    // ================================================================
    //  Regenerate 3D Preview from form
    // ================================================================
    function regeneratePreview() {
        var LGM = window.LabwareGenModule;
        if (!LGM || !LGM.generatePlateModel) {
            console.warn('LabwareGenModule not loaded — cannot generate plate model');
            return;
        }
        var def = readFormDef();
        hamSt.parsedDef = def;
        var model = LGM.generatePlateModel(def);
        displayModel(model);
    }

    // ================================================================
    //  Read Hamilton file (UTF-8 or UTF-16LE)
    // ================================================================
    function readHamFile(file, callback) {
        var reader = new FileReader();
        reader.onload = function (ev) {
            var text = ev.target.result;
            if (text.charCodeAt(0) === 0xFFFE || text.charCodeAt(0) === 0xFEFF ||
                (text.length > 4 && text.charCodeAt(1) === 0)) {
                var reader2 = new FileReader();
                reader2.onload = function (ev2) { callback(ev2.target.result); };
                reader2.readAsText(file, 'utf-16le');
            } else {
                callback(text);
            }
        };
        reader.readAsText(file, 'utf-8');
    }

    // ================================================================
    //  Wire UI Controls
    // ================================================================
    function wireHamControls() {
        function updateImportBtn() {
            var btn = $('#ham-import-btn');
            if (btn) btn.disabled = !(hamSt.rckText && hamSt.ctrText);
        }

        // -- Rack file input --
        var rckInput = $('#ham-rck-input');
        var rckBtn = $('#ham-rck-btn');
        if (rckBtn && rckInput) {
            rckBtn.addEventListener('click', function () { rckInput.click(); });
            rckInput.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (!file) return;
                readHamFile(file, function (text) {
                    hamSt.rckText = text;
                    hamSt.rckName = file.name;
                    var label = $('#ham-rck-label');
                    if (label) {
                        label.textContent = '✓ ' + file.name;
                        label.className = 'lg-ham-file-label loaded';
                    }
                    updateImportBtn();
                });
                rckInput.value = '';
            });
        }

        // -- Container file input --
        var ctrInput = $('#ham-ctr-input');
        var ctrBtn = $('#ham-ctr-btn');
        if (ctrBtn && ctrInput) {
            ctrBtn.addEventListener('click', function () { ctrInput.click(); });
            ctrInput.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (!file) return;
                readHamFile(file, function (text) {
                    hamSt.ctrText = text;
                    hamSt.ctrName = file.name;
                    var label = $('#ham-ctr-label');
                    if (label) {
                        label.textContent = '✓ ' + file.name;
                        label.className = 'lg-ham-file-label loaded';
                    }
                    updateImportBtn();
                });
                ctrInput.value = '';
            });
        }

        // -- Import button --
        var importBtn = $('#ham-import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', function () {
                if (!hamSt.rckText || !hamSt.ctrText) return;
                try {
                    var rck = parseRckFile(hamSt.rckText);
                    var ctr = parseCtrFile(hamSt.ctrText);
                    var def = hamiltonToDefinition(rck, ctr, hamSt.rckName, hamSt.ctrName);
                    populateForm(def);
                    regeneratePreview();
                    $('#ham-status').textContent = 'Imported: ' + hamSt.rckName + ' + ' + hamSt.ctrName;
                    $('#ham-status').className = 'lg-status lg-status-ok';
                } catch (err) {
                    $('#ham-status').textContent = 'Error: ' + err.message;
                    $('#ham-status').className = 'lg-status lg-status-err';
                }
            });
        }

        // -- Generate / Refresh button --
        bindClick('#ham-generate-btn', function () { regeneratePreview(); });

        // -- Save .x button --
        bindClick('#ham-save-btn', function () {
            var LGM = window.LabwareGenModule;
            if (!hamSt.model || !LGM) {
                alert('No model generated. Click Generate first.');
                return;
            }
            var def = readFormDef();
            var xContent = LGM.exportToXFile(hamSt.model, def.name);
            if (!xContent) { alert('Failed to export model.'); return; }
            var blob = new Blob([xContent], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            var safeName = (def.name || 'hamilton_labware').replace(/[^a-zA-Z0-9_ -]/g, '_');
            a.href = url;
            a.download = safeName + '.x';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        // -- Load into Viewer button --
        bindClick('#ham-load-viewer-btn', function () {
            var LGM = window.LabwareGenModule;
            if (!hamSt.model || !LGM) {
                alert('No model generated. Click Generate first.');
                return;
            }
            var def = readFormDef();
            var xContent = LGM.exportToXFile(hamSt.model, def.name);
            if (!xContent) return;
            var blob = new Blob([xContent], { type: 'text/plain' });
            var url = URL.createObjectURL(blob);
            if (window._loadGeneratedXFile) {
                window._loadGeneratedXFile(url, (def.name || 'hamilton_labware') + '.x');
            }
        });

        // -- Drag and drop .rck / .ctr onto the viewport --
        var host = $('#hamilton-host');
        if (host) {
            var dragCounter = 0;
            var dropzone = $('#ham-dropzone');

            host.addEventListener('dragenter', function (e) {
                e.preventDefault();
                dragCounter++;
                if (dragCounter === 1 && dropzone) dropzone.classList.remove('viewer-hidden');
            });
            host.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });
            host.addEventListener('dragleave', function (e) {
                e.preventDefault();
                dragCounter--;
                if (dragCounter <= 0) {
                    dragCounter = 0;
                    if (dropzone) dropzone.classList.add('viewer-hidden');
                }
            });
            host.addEventListener('drop', function (e) {
                e.preventDefault();
                dragCounter = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');
                var files = e.dataTransfer.files;
                if (!files.length) return;

                var rckFiles = [];
                var ctrFiles = [];
                for (var i = 0; i < files.length; i++) {
                    var name = files[i].name.toLowerCase();
                    if (name.endsWith('.rck')) rckFiles.push(files[i]);
                    else if (name.endsWith('.ctr')) ctrFiles.push(files[i]);
                }

                if (rckFiles.length === 0 && ctrFiles.length === 0) {
                    $('#ham-status').textContent = 'Please drop .rck and/or .ctr files.';
                    $('#ham-status').className = 'lg-status lg-status-err';
                    return;
                }

                if (rckFiles.length > 0) {
                    readHamFile(rckFiles[0], function (text) {
                        hamSt.rckText = text;
                        hamSt.rckName = rckFiles[0].name;
                        var label = $('#ham-rck-label');
                        if (label) { label.textContent = '✓ ' + rckFiles[0].name; label.className = 'lg-ham-file-label loaded'; }
                        updateImportBtn();
                        if (hamSt.rckText && hamSt.ctrText) {
                            var btn = $('#ham-import-btn');
                            if (btn) btn.click();
                        }
                    });
                }

                if (ctrFiles.length > 0) {
                    readHamFile(ctrFiles[0], function (text) {
                        hamSt.ctrText = text;
                        hamSt.ctrName = ctrFiles[0].name;
                        var label = $('#ham-ctr-label');
                        if (label) { label.textContent = '✓ ' + ctrFiles[0].name; label.className = 'lg-ham-file-label loaded'; }
                        updateImportBtn();
                        if (hamSt.rckText && hamSt.ctrText) {
                            var btn = $('#ham-import-btn');
                            if (btn) btn.click();
                        }
                    });
                }

                if (rckFiles.length > 0 && ctrFiles.length === 0) {
                    $('#ham-status').textContent = 'Rack loaded — also drop or open the matching .ctr container file';
                    $('#ham-status').className = 'lg-status lg-status-ok';
                } else if (ctrFiles.length > 0 && rckFiles.length === 0) {
                    $('#ham-status').textContent = 'Container loaded — also drop or open the matching .rck rack file';
                    $('#ham-status').className = 'lg-status lg-status-ok';
                }
            });
        }

        // Auto-regen when form fields change
        document.querySelectorAll('#ham-param-form input, #ham-param-form select').forEach(function (el) {
            el.addEventListener('change', function () { regeneratePreview(); });
        });
    }

    // ================================================================
    //  Toolbar
    // ================================================================
    function wireHamToolbar() {
        var body = $('#ham-vt-body');
        var toggle = $('#ham-vt-toggle');
        if (toggle && body) {
            toggle.addEventListener('click', function () {
                hamSt.toolbarCollapsed = !hamSt.toolbarCollapsed;
                body.classList.toggle('collapsed', hamSt.toolbarCollapsed);
            });
        }

        // Reset camera
        bindClick('#ham-vt-reset-cam', function () {
            if (!hamSt.model) return;
            var box = new THREE.Box3().setFromObject(hamSt.model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            hamSt.controls.target.copy(center);
            hamSt.camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim);
            hamSt.controls.update();
        });

        // Zoom fit
        bindClick('#ham-vt-zoom-fit', function () {
            if (!hamSt.model) return;
            var box = new THREE.Box3().setFromObject(hamSt.model);
            var center = box.getCenter(new THREE.Vector3());
            var size = box.getSize(new THREE.Vector3());
            var maxDim = Math.max(size.x, size.y, size.z);
            hamSt.controls.target.copy(center);
            var dist = maxDim * 1.5;
            hamSt.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.7);
            hamSt.controls.update();
        });

        // Wireframe
        bindClick('#ham-vt-wireframe', function () {
            hamSt.wireframe = !hamSt.wireframe;
            if (hamSt.model) {
                hamSt.model.traverse(function (c) {
                    if (c.isMesh && c.material) {
                        if (Array.isArray(c.material)) c.material.forEach(function (m) { m.wireframe = hamSt.wireframe; });
                        else c.material.wireframe = hamSt.wireframe;
                    }
                });
            }
            var btn = $('#ham-vt-wireframe');
            if (btn) btn.classList.toggle('is-active', hamSt.wireframe);
        });

        // Perspective toggle
        bindClick('#ham-vt-perspective', function () {
            hamSt.isPerspective = !hamSt.isPerspective;
            var btn = $('#ham-vt-perspective');
            if (btn) btn.classList.toggle('is-active', !hamSt.isPerspective);
        });

        // Grid toggle
        bindClick('#ham-btn-grid', function () {
            hamSt.gridVisible = !hamSt.gridVisible;
            var grid = hamSt.scene ? hamSt.scene.getObjectByName('__hamgrid__') : null;
            if (grid) grid.visible = hamSt.gridVisible;
            var btn = $('#ham-btn-grid');
            if (btn) btn.classList.toggle('grid-off', !hamSt.gridVisible);
        });

        // Zoom in/out
        bindClick('#ham-vt-zoom-in', function () {
            if (hamSt.controls) hamSt.controls.dollyIn(1.3);
            if (hamSt.controls) hamSt.controls.update();
        });
        bindClick('#ham-vt-zoom-out', function () {
            if (hamSt.controls) hamSt.controls.dollyOut(1.3);
            if (hamSt.controls) hamSt.controls.update();
        });

        // Pan mode
        bindClick('#ham-vt-pan', function () {
            hamSt.isPanning = !hamSt.isPanning;
            if (hamSt.controls) {
                hamSt.controls.mouseButtons.LEFT = hamSt.isPanning
                    ? THREE.MOUSE.PAN
                    : THREE.MOUSE.ROTATE;
            }
            var btn = $('#ham-vt-pan');
            if (btn) btn.classList.toggle('is-active', hamSt.isPanning);
        });

        // ── Ruler Tool ──────────────────────────────────────────────
        bindClick('#ham-vt-ruler', function () {
            hamSt.rulerActive = !hamSt.rulerActive;
            var btn = $('#ham-vt-ruler');
            if (btn) btn.classList.toggle('is-active', hamSt.rulerActive);
            var readout = $('#ham-ruler-readout');

            if (hamSt.rulerActive) {
                if (hamSt.controls) {
                    hamSt._savedMouseButtons = {
                        LEFT: hamSt.controls.mouseButtons.LEFT,
                        MIDDLE: hamSt.controls.mouseButtons.MIDDLE,
                        RIGHT: hamSt.controls.mouseButtons.RIGHT,
                    };
                    hamSt.controls.mouseButtons.LEFT = -1;
                }
                if (hamSt.renderer) hamSt.renderer.domElement.style.cursor = 'crosshair';
                var help = $('#ham-ruler-help');
                if (help) help.style.display = 'block';
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = 'Click first point on model…';
                }
            } else {
                if (hamSt.controls && hamSt._savedMouseButtons) {
                    hamSt.controls.mouseButtons.LEFT = hamSt._savedMouseButtons.LEFT;
                    hamSt.controls.mouseButtons.MIDDLE = hamSt._savedMouseButtons.MIDDLE;
                    hamSt.controls.mouseButtons.RIGHT = hamSt._savedMouseButtons.RIGHT;
                    hamSt._savedMouseButtons = null;
                }
                clearRuler();
                hamSt.rulerAxisLock = null;
                if (hamSt.renderer) hamSt.renderer.domElement.style.cursor = '';
                var help2 = $('#ham-ruler-help');
                if (help2) help2.style.display = 'none';
                if (readout) readout.style.display = 'none';
            }
        });

        // Raycast helper
        function rulerRaycast(e) {
            if (!hamSt.renderer || !hamSt.model) return null;
            var cvs = hamSt.renderer.domElement;
            var rect = cvs.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, hamSt.camera);
            var meshes = [];
            hamSt.model.traverse(function (c) { if (c.isMesh) meshes.push(c); });
            var hits = raycaster.intersectObjects(meshes, false);
            return hits.length > 0 ? hits[0].point.clone() : null;
        }

        function applyAxisLock(start, end) {
            if (!hamSt.rulerAxisLock || !start) return end;
            var locked = end.clone();
            if (hamSt.rulerAxisLock === 'x') { locked.y = start.y; locked.z = start.z; }
            else if (hamSt.rulerAxisLock === 'y') { locked.x = start.x; locked.z = start.z; }
            else if (hamSt.rulerAxisLock === 'z') { locked.x = start.x; locked.y = start.y; }
            return locked;
        }

        function axisLabel() {
            return hamSt.rulerAxisLock ? ' [locked ' + hamSt.rulerAxisLock.toUpperCase() + ']' : '';
        }

        // Pointer down on canvas — ruler click
        (function setupRuler() {
            document.addEventListener('pointerdown', function (e) {
                if (!hamSt.rulerActive || !hamSt.renderer) return;
                var cvs = hamSt.renderer.domElement;
                if (e.target !== cvs) return;

                if (e.metaKey || e.ctrlKey) {
                    if (hamSt.controls) hamSt.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
                    var onUp = function () {
                        if (hamSt.rulerActive && hamSt.controls) hamSt.controls.mouseButtons.LEFT = -1;
                        document.removeEventListener('pointerup', onUp);
                    };
                    document.addEventListener('pointerup', onUp);
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                var point = rulerRaycast(e);
                if (!point) return;
                var readout = $('#ham-ruler-readout');

                if (!hamSt.rulerStart) {
                    clearRuler();
                    hamSt.rulerStart = point;
                    hamSt.rulerAxisLock = null;
                    addRulerMarker(point);
                    if (readout) {
                        readout.style.display = 'block';
                        readout.textContent = 'Move to second point… (X/Y/Z to lock axis)';
                    }
                } else {
                    var lockedPt = applyAxisLock(hamSt.rulerStart, point);
                    hamSt.rulerEnd = lockedPt;
                    if (hamSt.rulerMarkers.length > 1) {
                        var lm = hamSt.rulerMarkers.pop();
                        hamSt.scene.remove(lm);
                        lm.geometry.dispose();
                        lm.material.dispose();
                    }
                    addRulerMarker(lockedPt);
                    drawRulerLine(hamSt.rulerStart, lockedPt);
                    var dist = hamSt.rulerStart.distanceTo(lockedPt);
                    if (readout) {
                        readout.style.display = 'block';
                        readout.textContent = '📏 ' + dist.toFixed(2) + ' mm' + axisLabel() +
                            '  — click to start new measurement';
                    }
                    hamSt.rulerStart = null;
                    hamSt.rulerEnd = null;
                    hamSt.rulerAxisLock = null;
                }
            }, true);

            document.addEventListener('pointermove', function (e) {
                if (!hamSt.rulerActive || !hamSt.rulerStart || !hamSt.renderer) return;
                var cvs = hamSt.renderer.domElement;
                if (e.target !== cvs) return;
                var point = rulerRaycast(e);
                if (!point) return;
                var lockedPt = applyAxisLock(hamSt.rulerStart, point);
                drawRulerLine(hamSt.rulerStart, lockedPt);
                if (hamSt.rulerMarkers.length > 1) {
                    hamSt.rulerMarkers[1].position.copy(lockedPt);
                } else {
                    addRulerMarker(lockedPt);
                }
                var dist = hamSt.rulerStart.distanceTo(lockedPt);
                var readout = $('#ham-ruler-readout');
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = '📏 ' + dist.toFixed(2) + ' mm' + axisLabel();
                }
            }, false);

            document.addEventListener('keydown', function (e) {
                if (!hamSt.rulerActive || !hamSt.rulerStart) return;
                var key = e.key.toLowerCase();
                if (key === 'x' || key === 'y' || key === 'z') {
                    hamSt.rulerAxisLock = (hamSt.rulerAxisLock === key) ? null : key;
                    var readout = $('#ham-ruler-readout');
                    if (readout) {
                        readout.textContent = hamSt.rulerAxisLock
                            ? 'Locked to ' + hamSt.rulerAxisLock.toUpperCase() + ' axis'
                            : 'Axis unlocked — free measurement';
                    }
                    e.preventDefault();
                } else if (key === 'escape') {
                    clearRuler();
                    hamSt.rulerAxisLock = null;
                    var rd = $('#ham-ruler-readout');
                    if (rd) rd.textContent = 'Click first point on model…';
                }
            }, false);
        })();

        function clearRuler() {
            if (hamSt.rulerLine && hamSt.scene) {
                hamSt.scene.remove(hamSt.rulerLine);
                if (hamSt.rulerLine.geometry) hamSt.rulerLine.geometry.dispose();
                if (hamSt.rulerLine.material) hamSt.rulerLine.material.dispose();
                hamSt.rulerLine = null;
            }
            hamSt.rulerMarkers.forEach(function (m) {
                if (hamSt.scene) hamSt.scene.remove(m);
                if (m.geometry) m.geometry.dispose();
                if (m.material) m.material.dispose();
            });
            hamSt.rulerMarkers = [];
            hamSt.rulerStart = null;
            hamSt.rulerEnd = null;
        }

        function addRulerMarker(point) {
            var geo = new THREE.SphereGeometry(0.4, 12, 8);
            var mat = new THREE.MeshBasicMaterial({ color: 0xff4444, depthTest: false });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(point);
            mesh.renderOrder = 999;
            hamSt.scene.add(mesh);
            hamSt.rulerMarkers.push(mesh);
        }

        function drawRulerLine(a, b) {
            if (hamSt.rulerLine && hamSt.scene) {
                hamSt.scene.remove(hamSt.rulerLine);
                if (hamSt.rulerLine.geometry) hamSt.rulerLine.geometry.dispose();
                if (hamSt.rulerLine.material) hamSt.rulerLine.material.dispose();
            }
            var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
            var mat = new THREE.LineBasicMaterial({ color: 0xff4444, depthTest: false, linewidth: 2 });
            var line = new THREE.Line(geo, mat);
            line.renderOrder = 999;
            hamSt.scene.add(line);
            hamSt.rulerLine = line;
        }

        // Make toolbar draggable
        makeDraggable($('#ham-toolbar'), $('#ham-vt-grab-handle'));
    }

    // ================================================================
    //  Helpers
    // ================================================================
    function bindClick(sel, fn) {
        var el = $(sel);
        if (el) el.addEventListener('click', fn);
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
    //  Gizmo + Camera Display
    // ================================================================
    function drawHamGizmo() {
        var canvas = $('#ham-gizmo-canvas');
        if (!canvas || !hamSt.camera) return;
        var ctx = canvas.getContext('2d');
        if (!ctx) return;
        var w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        var cam = hamSt.camera;
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

    function updateHamCamDisplay() {
        var el = $('#ham-cam-display');
        if (!el || !hamSt.camera) return;
        var p = hamSt.camera.position;
        el.textContent = 'X: ' + p.x.toFixed(1) + '  Y: ' + p.y.toFixed(1) + '  Z: ' + p.z.toFixed(1);
    }

    // ================================================================
    //  Screenshot
    // ================================================================
    function hamSaveScreenshot(format, opts) {
        if (!hamSt.renderer || !hamSt.scene || !hamSt.camera) return;
        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = hamSt.scene.getObjectByName('__hamgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && hamSt.gridVisible;

        const origBg = hamSt.scene.background;
        if (!showBg) {
            hamSt.scene.background = null;
            hamSt.renderer.setClearColor(0x000000, 0);
        }

        hamSt.renderer.render(hamSt.scene, hamSt.camera);
        const canvas = hamSt.renderer.domElement;
        const fileName = ($('#ham-name') ? $('#ham-name').value : 'hamilton_screenshot').replace(/\.[^.]+$/, '') || 'hamilton_screenshot';

        if (format === 'jpg') {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.jpg'); }, 'image/jpeg', 0.92);
        } else {
            canvas.toBlob(function(blob) { if (blob && window.downloadBlob) window.downloadBlob(blob, fileName + '.png'); }, 'image/png');
        }

        if (grid) grid.visible = origGridVis;
        hamSt.scene.background = origBg;
        if (!showBg) hamSt.renderer.setClearColor(hamSt.isDark ? DARK_BG : LIGHT_BG, 1);
        hamSt.renderer.render(hamSt.scene, hamSt.camera);
    }

    function hamScreenshotPreviewDataURL(opts) {
        if (!hamSt.renderer || !hamSt.scene || !hamSt.camera) return '';
        const showGrid = opts ? opts.showGrid : true;
        const showBg   = opts ? opts.showBg   : true;

        const grid = hamSt.scene.getObjectByName('__hamgrid__');
        const origGridVis = grid ? grid.visible : false;
        if (grid) grid.visible = showGrid && hamSt.gridVisible;

        const origBg = hamSt.scene.background;
        if (!showBg) {
            hamSt.scene.background = null;
            hamSt.renderer.setClearColor(0x000000, 0);
        }

        hamSt.renderer.render(hamSt.scene, hamSt.camera);
        const dataURL = hamSt.renderer.domElement.toDataURL('image/png');

        if (grid) grid.visible = origGridVis;
        hamSt.scene.background = origBg;
        if (!showBg) hamSt.renderer.setClearColor(hamSt.isDark ? DARK_BG : LIGHT_BG, 1);
        hamSt.renderer.render(hamSt.scene, hamSt.camera);

        return dataURL;
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.HamiltonImportModule = {
        init: initHamiltonImport,
        updateTheme: updateHamTheme,
        saveScreenshot: hamSaveScreenshot,
        screenshotPreviewDataURL: hamScreenshotPreviewDataURL,
    };

})();
