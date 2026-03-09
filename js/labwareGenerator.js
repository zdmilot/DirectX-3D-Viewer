/* ============================================================
   Labware Generator — Parse XML labware definitions and generate
   3D .x models for SBS-format plates, tubes, and reservoirs
   ============================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);

    // ================================================================
    //  SBS / ANSI Standard Dimensions (mm) — from shared DeckUnits
    // ================================================================
    const SBS = DeckUnits.SBS;

    // ================================================================
    //  State
    // ================================================================
    const lgState = {
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
        parsedDef: null,   // parsed labware definition
        // Ruler state
        rulerActive: false,
        rulerStart: null,   // THREE.Vector3
        rulerEnd: null,
        rulerLine: null,    // THREE.Line
        rulerMarkers: [],   // start/end spheres
        rulerAxisLock: null, // 'x', 'y', or 'z' — or null for free
        _savedMouseButtons: null,
    };

    const LIGHT_BG   = 0xf0f0f0;
    const DARK_BG    = 0x1b2838;
    const LIGHT_GRID = 0xcccccc;
    const DARK_GRID  = 0x2a3a4a;

    const WELL_SEGMENTS = 16; // circle approximation segments for wells

    // ================================================================
    //  Initialization
    // ================================================================
    let initialized = false;

    function initLabwareGenerator() {
        lgState.isDark = document.documentElement.hasAttribute('data-theme');

        if (initialized) {
            updateLgTheme();
            return;
        }
        initialized = true;

        const canvas = $('#lg-canvas');
        const host   = $('#labware-host');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 800;
        const h = host.clientHeight || 600;

        // -- Scene --
        lgState.scene = new THREE.Scene();
        lgState.scene.background = new THREE.Color(lgState.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        lgState.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 10000);
        lgState.camera.position.set(120, 80, 160);
        lgState.camera.up.set(0, 1, 0);

        // -- Renderer --
        lgState.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });
        lgState.renderer.setPixelRatio(window.devicePixelRatio);
        lgState.renderer.setSize(w, h);

        // -- Controls --
        lgState.controls = new THREE.OrbitControls(lgState.camera, lgState.renderer.domElement);
        lgState.controls.enableDamping = true;
        lgState.controls.dampingFactor = 0.12;
        lgState.controls.target.set(0, 0, 0);
        lgState.controls.update();

        // -- Lights --
        lgState.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(50, 100, 50);
        lgState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-50, -20, -50);
        lgState.scene.add(d2);

        // -- Grid (mm-based via DeckUnits) --
        const gc = lgState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = DeckUnits.createGrid(400, 10, gc, { name: '__lggrid__', visible: lgState.gridVisible });
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        lgState.scene.add(grid);

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const cw = host.clientWidth;
            const ch = host.clientHeight;
            lgState.camera.aspect = cw / ch;
            lgState.camera.updateProjectionMatrix();
            lgState.renderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Render loop --
        function tick() {
            lgState.animId = requestAnimationFrame(tick);
            lgState.controls.update();
            lgState.renderer.render(lgState.scene, lgState.camera);
            drawLgGizmo();
            updateLgCamDisplay();
        }
        tick();

        // -- Wire controls --
        wireLgControls();
        wireLgToolbar();
    }

    // ================================================================
    //  Theme sync
    // ================================================================
    function updateLgTheme() {
        lgState.isDark = document.documentElement.hasAttribute('data-theme');
        if (!lgState.scene) return;
        lgState.scene.background = new THREE.Color(lgState.isDark ? DARK_BG : LIGHT_BG);
        const grid = lgState.scene.getObjectByName('__lggrid__');
        if (grid) {
            const c = new THREE.Color(lgState.isDark ? DARK_GRID : LIGHT_GRID);
            grid.material.color.copy(c);
        }
    }

    // ================================================================
    //  XML Parser — Parse Integra-format labware XML
    // ================================================================
    function parseLabwareXML(xmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlString, 'application/xml');

        // Check for parse errors
        const parseError = doc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid XML: ' + parseError.textContent);
        }

        const root = doc.documentElement;
        const tagName = root.tagName;

        // Detect labware type
        if (tagName === 'Plate') {
            return parsePlateXML(doc);
        }

        // Try generic — look for Measurements and Wells children
        if (doc.querySelector('Measurements') && doc.querySelector('Wells')) {
            return parsePlateXML(doc);
        }

        throw new Error('Unrecognized labware XML format (root: <' + tagName + '>');
    }

    function getTextContent(parent, tagName) {
        const el = parent.querySelector(tagName);
        return el ? el.textContent.trim() : '';
    }

    function getNum(parent, tagName, divisor) {
        const raw = getTextContent(parent, tagName);
        if (raw === '') return 0;
        const val = parseFloat(raw);
        return isNaN(val) ? 0 : val / (divisor || 1);
    }

    function parsePlateXML(doc) {
        const meas = doc.querySelector('Measurements');
        const wells = doc.querySelector('Wells');

        // Integra XML stores dimensions in hundredths of mm
        const DIV = 100;

        const def = {
            type: 'plate',
            name: getTextContent(doc, 'Name') || 'Plate',
            manufacturer: getTextContent(doc, 'Manufacturer') || '',
            partNumber: getTextContent(doc, 'PartNumber') || '',
            // Measurements in mm (converted from hundredths)
            footprintLength: meas ? getNum(meas, 'FootprintLengthMM', DIV) : SBS.footprintLength,
            footprintWidth:  meas ? getNum(meas, 'FootprintWidthMM', DIV) : SBS.footprintWidth,
            height:          meas ? getNum(meas, 'HeightMM', DIV) : 14.35,
            // Wells
            rowCount:    wells ? getNum(wells, 'RowCount', 1) : 8,
            colCount:    wells ? getNum(wells, 'CollumnCount', 1) : 12,
            rowGap:      wells ? getNum(wells, 'RowGap', DIV) : 9.0,
            colGap:      wells ? getNum(wells, 'CollumnGap', DIV) : 9.0,
            wellDepth:   wells ? getNum(wells, 'Depth', DIV) : 10.67,
            wellShape:   wells ? getTextContent(wells, 'Shape') : 'Circle',
            wellSize:    wells ? getNum(wells, 'Size', DIV) : 6.86,
            wellLength:  wells ? getNum(wells, 'Length', DIV) : 6.86,
            sizeBottom:  wells ? getNum(wells, 'SizeBottom', DIV) : 0,
            bottomShape: wells ? getTextContent(wells, 'BottomShape') : 'Flat',
            vShapeDepth: wells ? getNum(wells, 'VShapeDepth', DIV) : 0,
            angle:       wells ? getNum(wells, 'Angle', 1) : 0,
            nominalVolume: wells ? getNum(wells, 'NominalWellVolume', DIV) : 360,
            firstHolePos: { x: 0, y: 0 },
        };

        // If SizeBottom is 0 or missing, wells have straight walls — use top size
        if (!def.sizeBottom) {
            def.sizeBottom = def.wellSize;
        }

        // Parse first hole position "x;y" format
        if (wells) {
            const fhp = getTextContent(wells, 'FirstHolePositionText');
            if (fhp && fhp.includes(';')) {
                const parts = fhp.split(';');
                def.firstHolePos.x = parseFloat(parts[0]) / DIV;
                def.firstHolePos.y = parseFloat(parts[1]) / DIV;
            }
        }

        // Derive well count
        def.wellCount = def.rowCount * def.colCount;

        return def;
    }



    // ================================================================
    //  Hamilton .rck / .ctr File Parser
    //
    //  Hamilton labware uses two paired files:
    //    .rck (rack)      — plate footprint, grid layout, well spacing,
    //                       A1 offset, outer profile segments
    //    .ctr (container) — individual well geometry: shape, depth,
    //                       diameter segments, bottom type
    //
    //  Both use the same HxCfgFile key-value text format.
    // ================================================================

    /**
     * Parse a Hamilton HxCfgFile config block into a flat key→value map.
     * Handles the `DataDef,TYPE,version,name, { ... };` structure.
     */
    function parseHxCfg(text) {
        const map = {};
        // Find content inside first { ... }
        const openIdx = text.indexOf('{');
        const closeIdx = text.lastIndexOf('}');
        if (openIdx < 0 || closeIdx < 0) return map;

        const body = text.substring(openIdx + 1, closeIdx);
        // Each line is:  Key, "Value",  or  Key, "Value"
        const lineRe = /^\s*([A-Za-z0-9_.]+)\s*,\s*"([^"]*)"/gm;
        let m;
        while ((m = lineRe.exec(body)) !== null) {
            map[m[1]] = m[2];
        }
        return map;
    }

    /**
     * Parse a Hamilton .rck (rack) file text → rack definition object.
     */
    function parseRckFile(text) {
        const cfg = parseHxCfg(text);
        return {
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
            holeShape: parseInt(cfg['Hole.Shape']) || 0,  // 0=circle, 1=square
            holeX:     parseFloat(cfg['Hole.X']) || 0,
            holeY:     parseFloat(cfg['Hole.Y']) || 0,
            holeZ:     parseFloat(cfg['Hole.Z']) || 0,
            shape:     parseInt(cfg['Shape']) || 0,       // 0=round plate, 1=rectangular
            stackHt:   parseFloat(cfg['StackHt']) || 0,
            description: cfg['Description'] || cfg['ViewName'] || '',
            // Outer profile segments (trapezoidal cross-section from bottom up)
            segCountX: parseInt(cfg['SegmentCount_x']) || 0,
            segCountY: parseInt(cfg['SegmentCount_y']) || 0,
            segX: [],  // populated below
            segY: [],
        };
    }

    /**
     * Parse outer profile segments from a rack config.
     * Segments define the trapezoidal cross-section of the plate body
     * from bottom to top (segment 0 = bottom, segment N = top/flange).
     */
    function parseRckSegments(text, rck) {
        const cfg = parseHxCfg(text);
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
    }

    /**
     * Parse a Hamilton .ctr (container) file text → container definition object.
     */
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
                // Shape codes: 0=cylinder, 1=square, 3=tapered rect,
                //              4=hemisphere/round bottom, 5=V-bottom/cone
            });
        }
        return {
            shape:    parseInt(cfg['Shape']) || 0,       // 0=cylindrical, 1=square
            depth:    parseFloat(cfg['Depth']) || 10,
            dimDx:    parseFloat(cfg['Dim.Dx']) || 7,
            dimDy:    parseFloat(cfg['Dim.Dy']) || 7,
            segments: segments,
            numSegments: numSegments,
        };
    }

    /**
     * Convert parsed Hamilton .rck + .ctr → unified plate definition
     * (same format as the Integra XML parser output, so generatePlateModel works)
     */
    function hamiltonToDefinition(rck, ctr, rckName, ctrName) {
        // Determine well shape
        const isSquare = ctr.shape === 1 || rck.holeShape === 1;
        const wellShape = isSquare ? 'Square' : 'Circle';

        // Top-most segment gives the well opening diameter,
        // bottom-most gives bottom diameter for tapered wells
        const topSeg = ctr.segments[0]; // segment 1 in file = top portion
        const botSeg = ctr.segments[ctr.segments.length - 1]; // last = bottom

        // Well top diameter: prefer segment DZ (inscribed circle), fall back to Dim.Dx
        let wellTopDia;
        if (isSquare) {
            wellTopDia = topSeg.dx || ctr.dimDx;
        } else {
            // For circular wells, DZ in the segment is the diameter
            wellTopDia = topSeg.dz || ctr.dimDx;
        }

        // Well bottom diameter
        let wellBotDia = wellTopDia; // default: straight walls
        // Detect bottom shape from last segment's shape code
        let bottomShape = 'Flat';
        let vShapeDepth = 0;

        if (botSeg.shape === 4) {
            // Hemisphere / round bottom
            bottomShape = 'Circle';
            wellBotDia = botSeg.dz || botSeg.dx || wellTopDia;
        } else if (botSeg.shape === 5) {
            // V-bottom / cone
            bottomShape = 'VShape';
            wellBotDia = botSeg.dz || botSeg.dx || wellTopDia;
            vShapeDepth = botSeg.max || wellBotDia / 2;
        } else if (botSeg.shape === 3) {
            // Tapered
            wellBotDia = botSeg.dx || botSeg.dz || wellTopDia;
        }

        // Also check for multi-segment tapered: if top segment has different dx than container dimDx
        if (ctr.numSegments > 1 && topSeg.dx > 0 && botSeg.dx > 0 && topSeg.dx !== botSeg.dx) {
            // The top is wider than bottom — tapered walls
            wellBotDia = Math.min(topSeg.dx, botSeg.dx);
            wellTopDia = Math.max(topSeg.dx, botSeg.dx);
        }

        // Use rack hole dimensions if container dims are zero
        if (wellTopDia === 0 && rck.holeX > 0) {
            wellTopDia = rck.holeX;
        }
        if (wellBotDia === 0) {
            wellBotDia = wellTopDia;
        }

        // A1 position: BndryX/BndryY define the offset from plate corner to center of A1
        const firstX = rck.bndryX;
        const firstY = rck.bndryY;

        // Plate height: use Dim.Dz from rack
        const height = rck.dimDz || (rck.ctrBase + ctr.depth);

        // Clean up the name from filename
        const rawName = (rckName || ctrName || 'Hamilton Plate')
            .replace(/\.(rck|ctr)$/i, '')
            .replace(/[_-]/g, ' ');

        const def = {
            type: 'plate',
            name: rawName,
            manufacturer: 'Hamilton',
            partNumber: '',
            footprintLength: rck.dimDx,
            footprintWidth:  rck.dimDy,
            height:          height,
            rowCount:        rck.rows,
            colCount:        rck.columns,
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
            wellCount:       rck.rows * rck.columns,
        };

        return def;
    }

    // ================================================================
    //  3D Geometry Generation — SBS Plate
    //
    //  Real-world SBS plate anatomy (bottom → top):
    //    Y = 0           : bottom of skirt / flange (sits on deck)
    //    Y = flangeH     : top of skirt; base of outer walls begins
    //    Y = H - depth   : well floor (bottoms of wells)
    //    Y = H           : top rim — wells are open here
    //
    //  The skirt/flange is the bottom lip that extends slightly outward.
    //  Wells are open cavities accessible from the top.
    // ================================================================
    function generatePlateModel(def) {
        const group = new THREE.Group();
        group.name = '__lg_labware__';

        const L = def.footprintLength;   // X dimension (mm)
        const W = def.footprintWidth;    // Z dimension (mm)
        const H = def.height;            // total Y dimension (mm)
        const wallT = SBS.wallThickness;
        const flangeOverhang = 0.5;      // mm overhang on each side

        // The well floor Y position — wells extend from (H - depth) up to H
        const depth = Math.min(def.wellDepth, H - wallT); // clamp so floor stays above bottom
        const wellFloorY = H - depth;

        // Flange must not exceed the well floor — otherwise slab would be negative
        const flangeH = Math.min(SBS.flangeHeight, H * 0.2, wellFloorY);
        const bottomT = Math.max(wallT, wellFloorY - flangeH); // solid between skirt top and well floor

        // Colors — unified translucent glass look for entire plate
        const glassColor  = 0xd8dce2;
        const glassMat = new THREE.MeshPhongMaterial({
            color: glassColor,
            transparent: true,
            opacity: 0.32,
            side: THREE.DoubleSide,
            depthWrite: false,
            shininess: 90,
            specular: 0x444444,
        });
        const wellMat  = glassMat;
        const flangeMat = glassMat;
        const bodyMat = glassMat;

        // ─── Skirt / flange at the BOTTOM (Y = 0 → flangeH) ──────
        // Four flange strips that sit at the bottom and overhang outward
        const flangeOuterL = L + flangeOverhang * 2;

        // Front & back flange strips (full outer length)
        const flangeFBGeo = new THREE.BoxGeometry(flangeOuterL, flangeH, wallT + flangeOverhang);
        const flangeFront = new THREE.Mesh(flangeFBGeo, flangeMat);
        flangeFront.position.set(L / 2, flangeH / 2, -flangeOverhang / 2 + wallT / 2);
        group.add(flangeFront);

        const flangeBack = new THREE.Mesh(flangeFBGeo, flangeMat);
        flangeBack.position.set(L / 2, flangeH / 2, W + flangeOverhang / 2 - wallT / 2);
        group.add(flangeBack);

        // Left & right flange strips (inner span to avoid corner overlap)
        const flangeLRSpan = W - wallT * 2;
        const flangeLRGeo = new THREE.BoxGeometry(wallT + flangeOverhang, flangeH, flangeLRSpan);
        const flangeLeft = new THREE.Mesh(flangeLRGeo, flangeMat);
        flangeLeft.position.set(-flangeOverhang / 2 + wallT / 2, flangeH / 2, W / 2);
        group.add(flangeLeft);

        const flangeRight = new THREE.Mesh(flangeLRGeo, flangeMat);
        flangeRight.position.set(L + flangeOverhang / 2 - wallT / 2, flangeH / 2, W / 2);
        group.add(flangeRight);

        // ─── Solid base slab (Y = flangeH → wellFloorY) ──────────
        // This is what the well bottoms rest on
        const slabH = wellFloorY - flangeH;
        if (slabH > 0.01) {
            const slabGeo = new THREE.BoxGeometry(L, slabH, W);
            const slabMesh = new THREE.Mesh(slabGeo, bodyMat);
            slabMesh.position.set(L / 2, flangeH + slabH / 2, W / 2);
            group.add(slabMesh);
        }

        // ─── Four outer walls above the slab (Y = wellFloorY → H) ─
        const wallH = H - wellFloorY;  // height of walls in the well region

        // Front wall (Z = 0 side)
        const frontGeo = new THREE.BoxGeometry(L, wallH, wallT);
        const frontMesh = new THREE.Mesh(frontGeo, bodyMat);
        frontMesh.position.set(L / 2, wellFloorY + wallH / 2, wallT / 2);
        group.add(frontMesh);

        // Back wall (Z = W side)
        const backMesh = new THREE.Mesh(frontGeo, bodyMat);
        backMesh.position.set(L / 2, wellFloorY + wallH / 2, W - wallT / 2);
        group.add(backMesh);

        // Left wall (X = 0 side), inner span so no corner overlap
        const sideInnerW = W - wallT * 2;
        const sideGeo = new THREE.BoxGeometry(wallT, wallH, sideInnerW);
        const leftMesh = new THREE.Mesh(sideGeo, bodyMat);
        leftMesh.position.set(wallT / 2, wellFloorY + wallH / 2, W / 2);
        group.add(leftMesh);

        // Right wall (X = L side)
        const rightMesh = new THREE.Mesh(sideGeo, bodyMat);
        rightMesh.position.set(L - wallT / 2, wellFloorY + wallH / 2, W / 2);
        group.add(rightMesh);

        // ─── Wells (open at TOP, Y = H) ─────────────────────────
        const rows = def.rowCount;
        const cols = def.colCount;
        const wellTopR = def.wellSize / 2;
        const wellBotR = def.sizeBottom / 2;
        const firstX = def.firstHolePos.x;
        const firstZ = def.firstHolePos.y;
        const gapX = def.colGap;
        const gapZ = def.rowGap;

        const isCircle = (def.wellShape || '').toLowerCase() === 'circle';
        const bsLower = (def.bottomShape || '').toLowerCase();
        const isRoundBottom = bsLower === 'circle';
        const isVBottom = bsLower === 'vshape' || bsLower === 'v' || def.vShapeDepth > 0;

        // Shaped-bottom height — the dome/cone is INSIDE the well depth,
        // so the straight wall is shortened and the lowest point = wellFloorY.
        // Hemisphere radius always equals the well bottom radius (no nipples).
        var btmShapeH = 0; // height consumed by the shaped bottom
        if (isRoundBottom) {
            btmShapeH = wellBotR;               // full hemisphere, radius = well bottom
        } else if (isVBottom) {
            // Use explicit VShapeDepth if given, otherwise default to well bottom radius
            btmShapeH = def.vShapeDepth > 0 ? def.vShapeDepth : wellBotR;
        }
        // Clamp so the shaped bottom doesn't exceed the well depth
        btmShapeH = Math.min(btmShapeH, depth);

        // Straight-wall portion sits above the shaped bottom
        const straightDepth = depth - btmShapeH; // may be 0 if bottom fills the well
        const straightBotY = wellFloorY + btmShapeH;  // bottom of straight walls

        // Wells: open at Y = H (top), lowest point at Y = wellFloorY
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cx = firstX + col * gapX;
                const cz = firstZ + row * gapZ;

                if (isCircle) {
                    // ── Straight cylinder wall (above shaped bottom) ──
                    if (straightDepth > 0.01) {
                        const cylGeo = new THREE.CylinderGeometry(
                            wellTopR, wellBotR, straightDepth, WELL_SEGMENTS, 1, true
                        );
                        const cylMesh = new THREE.Mesh(cylGeo, wellMat);
                        cylMesh.position.set(cx, straightBotY + straightDepth / 2, cz);
                        group.add(cylMesh);
                    }

                    // Top rim ring at Y = H
                    const rimGeo = new THREE.RingGeometry(wellTopR, wellTopR + 0.3, WELL_SEGMENTS);
                    const rimMesh = new THREE.Mesh(rimGeo, glassMat);
                    rimMesh.rotation.x = -Math.PI / 2;
                    rimMesh.position.set(cx, H, cz);
                    group.add(rimMesh);

                    // ── Bottom cap ──
                    if (isRoundBottom) {
                        // Concave bowl using LatheGeometry — quarter-circle profile
                        // revolved around Y.  Normals point inward/upward into the well
                        // so the bowl looks concave from above (no convex dome artifact).
                        var hemiR = btmShapeH;
                        var bowlSegs = 12;
                        var bowlPts = [];
                        for (var bi = 0; bi <= bowlSegs; bi++) {
                            var ba = (Math.PI / 2) * bi / bowlSegs;
                            bowlPts.push(new THREE.Vector2(
                                Math.sin(ba) * hemiR,
                                (1 - Math.cos(ba)) * hemiR
                            ));
                        }
                        var bowlGeo = new THREE.LatheGeometry(bowlPts, WELL_SEGMENTS);
                        var bowlMesh = new THREE.Mesh(bowlGeo, wellMat);
                        bowlMesh.position.set(cx, wellFloorY, cz);
                        group.add(bowlMesh);
                    } else if (isVBottom) {
                        // Cone with point at bottom, base at top (closed surface)
                        var vDepth = btmShapeH;
                        var coneGeo = new THREE.CylinderGeometry(
                            wellBotR, 0, vDepth, WELL_SEGMENTS, 1, false
                        );
                        var coneMesh = new THREE.Mesh(coneGeo, wellMat);
                        coneMesh.position.set(cx, wellFloorY + vDepth / 2, cz);
                        group.add(coneMesh);
                    } else {
                        // Flat bottom disk
                        const diskGeo = new THREE.CircleGeometry(wellBotR, WELL_SEGMENTS);
                        const diskMesh = new THREE.Mesh(diskGeo, wellMat);
                        diskMesh.rotation.x = -Math.PI / 2;
                        diskMesh.position.set(cx, wellFloorY, cz);
                        group.add(diskMesh);
                    }
                } else {
                    // ── Rectangular / square well (open at top) ──
                    const wLen = def.wellLength;
                    const wSize = def.wellSize;
                    const wt = 0.3;

                    // Straight wall portion (above shaped bottom)
                    if (straightDepth > 0.01) {
                        const rwFBGeo = new THREE.BoxGeometry(wLen, straightDepth, wt);
                        const rwLRGeo = new THREE.BoxGeometry(wt, straightDepth, wSize - wt * 2);
                        const wallCY = straightBotY + straightDepth / 2;

                        var rwF = new THREE.Mesh(rwFBGeo, wellMat);
                        rwF.position.set(cx, wallCY, cz - wSize / 2 + wt / 2);
                        group.add(rwF);
                        var rwB = new THREE.Mesh(rwFBGeo, wellMat);
                        rwB.position.set(cx, wallCY, cz + wSize / 2 - wt / 2);
                        group.add(rwB);
                        var rwL = new THREE.Mesh(rwLRGeo, wellMat);
                        rwL.position.set(cx - wLen / 2 + wt / 2, wallCY, cz);
                        group.add(rwL);
                        var rwR = new THREE.Mesh(rwLRGeo, wellMat);
                        rwR.position.set(cx + wLen / 2 - wt / 2, wallCY, cz);
                        group.add(rwR);
                    }

                    // Bottom shape
                    if (isRoundBottom) {
                        // Concave bowl at the bottom of a rectangular well.
                        // Uses the same LatheGeometry approach — a round bowl that
                        // fits inside the rectangular footprint.
                        var bowlR = Math.min(wLen / 2, wSize / 2, btmShapeH);
                        var rBowlSegs = 12;
                        var rBowlPts = [];
                        for (var rbi = 0; rbi <= rBowlSegs; rbi++) {
                            var rba = (Math.PI / 2) * rbi / rBowlSegs;
                            rBowlPts.push(new THREE.Vector2(
                                Math.sin(rba) * bowlR,
                                (1 - Math.cos(rba)) * bowlR
                            ));
                        }
                        var rBowlGeo = new THREE.LatheGeometry(rBowlPts, WELL_SEGMENTS);
                        var rBowlMesh = new THREE.Mesh(rBowlGeo, wellMat);
                        rBowlMesh.position.set(cx, wellFloorY, cz);
                        group.add(rBowlMesh);
                    } else if (isVBottom) {
                        // 4-sided pyramid: apex at bottom, base rectangle at top
                        var vD = btmShapeH;
                        var hL = wLen / 2;
                        var hW = wSize / 2;
                        // Apex (bottom point)
                        var ax = 0, ay = 0, az = 0;
                        // Base corners (top of pyramid) — relative coords
                        var c0 = [-hL, vD, -hW];  // front-left
                        var c1 = [ hL, vD, -hW];  // front-right
                        var c2 = [ hL, vD,  hW];  // back-right
                        var c3 = [-hL, vD,  hW];  // back-left
                        // 4 triangular faces (winding for outward normals)
                        var pyrVerts = new Float32Array([
                            c0[0],c0[1],c0[2], ax,ay,az, c1[0],c1[1],c1[2], // front
                            c1[0],c1[1],c1[2], ax,ay,az, c2[0],c2[1],c2[2], // right
                            c2[0],c2[1],c2[2], ax,ay,az, c3[0],c3[1],c3[2], // back
                            c3[0],c3[1],c3[2], ax,ay,az, c0[0],c0[1],c0[2]  // left
                        ]);
                        var pyrGeo = new THREE.BufferGeometry();
                        pyrGeo.setAttribute('position',
                            new THREE.BufferAttribute(pyrVerts, 3));
                        pyrGeo.computeVertexNormals();
                        var pyrMesh = new THREE.Mesh(pyrGeo, wellMat);
                        pyrMesh.position.set(cx, wellFloorY, cz);
                        group.add(pyrMesh);
                    } else {
                        // Flat bottom
                        var btmGeo = new THREE.PlaneGeometry(wLen, wSize);
                        var btmMesh = new THREE.Mesh(btmGeo, wellMat);
                        btmMesh.rotation.x = -Math.PI / 2;
                        btmMesh.position.set(cx, wellFloorY, cz);
                        group.add(btmMesh);
                    }
                }
            }
        }

        // ─── Top surface plane with well holes (Y = H) ──────────
        // A solid surface at the top of the plate between the wells
        const topSurfaceY = H;  // flush with the plate top / well rim
        const topShape = new THREE.Shape();
        // Outer rectangle — full plate extent so labels sit on the surface
        topShape.moveTo(0, 0);
        topShape.lineTo(L, 0);
        topShape.lineTo(L, W);
        topShape.lineTo(0, W);
        topShape.closePath();

        // Punch holes for each well
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cx = firstX + col * gapX;
                const cz = firstZ + row * gapZ;
                const holeR = wellTopR + 0.01;  // tiny clearance to avoid z-fighting with well wall
                const hole = new THREE.Path();
                if (isCircle) {
                    hole.absarc(cx, cz, holeR, 0, Math.PI * 2, true);
                } else {
                    const hw = (def.wellLength / 2) + 0.01;
                    const hh = (def.wellSize / 2) + 0.01;
                    hole.moveTo(cx - hw, cz - hh);
                    hole.lineTo(cx + hw, cz - hh);
                    hole.lineTo(cx + hw, cz + hh);
                    hole.lineTo(cx - hw, cz + hh);
                    hole.closePath();
                }
                topShape.holes.push(hole);
            }
        }

        const topGeo = new THREE.ShapeGeometry(topShape);
        const topMesh = new THREE.Mesh(topGeo, glassMat);
        // ShapeGeometry is in XY plane — rotate +PI/2 around X so shape-Y maps to +world-Z
        topMesh.rotation.x = Math.PI / 2;
        topMesh.position.set(0, topSurfaceY, 0);
        group.add(topMesh);

        // ─── 3D recessed alphanumeric labels in top surface ───────
        // Each label is a subdivided plane whose vertices are displaced
        // downward in the shape of the character — same glass material,
        // no color difference, just a physical divot.
        var etchDepth = 0.35;  // mm recess depth

        function makeRecessedLabel(text, labelW, labelH) {
            var res = 128;
            var canvas = document.createElement('canvas');
            canvas.width = res;
            canvas.height = res;
            var ctx = canvas.getContext('2d');
            // Black background = surface level, white text = recessed
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, res, res);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold ' + Math.round(res * 0.72) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, res / 2, res / 2);

            var imageData = ctx.getImageData(0, 0, res, res);
            var pixels = imageData.data;

            // Subdivided plane — enough segments to capture letter detail
            var segs = 80;
            var geo = new THREE.PlaneGeometry(labelW, labelH, segs, segs);
            var pos = geo.attributes.position.array;

            // Displace each vertex Z based on canvas brightness
            for (var i = 0; i < pos.length; i += 3) {
                var vx = pos[i];
                var vy = pos[i + 1];
                // Map vertex position to canvas UV
                var u = (vx / labelW + 0.5);
                var v = 1.0 - (vy / labelH + 0.5);
                var px = Math.floor(u * (res - 1));
                var py = Math.floor(v * (res - 1));
                px = Math.max(0, Math.min(res - 1, px));
                py = Math.max(0, Math.min(res - 1, py));
                var idx = (py * res + px) * 4;
                var brightness = pixels[idx] / 255;
                // Push down where text is (brightness > 0)
                pos[i + 2] = -brightness * etchDepth;
            }

            geo.attributes.position.needsUpdate = true;
            geo.computeVertexNormals();

            var mesh = new THREE.Mesh(geo, glassMat);
            mesh.frustumCulled = false;
            return mesh;
        }

        // Margins: gap between plate edge and first well center
        var marginLeft = firstX;
        var marginFront = firstZ;

        // Row labels (A, B, C…) — centered in left margin
        var rowLabelX = marginLeft / 2;
        var rowLabelSz = Math.min(marginLeft - wallT * 2, gapZ * 0.65);
        for (var r = 0; r < rows; r++) {
            var letter = String.fromCharCode(65 + r);
            var rz = firstZ + r * gapZ;
            var lbl = makeRecessedLabel(letter, rowLabelSz, rowLabelSz);
            lbl.rotation.x = -Math.PI / 2;
            lbl.position.set(rowLabelX, H + 0.01, rz);
            group.add(lbl);
        }

        // Column labels (1, 2, 3…) — centered in front margin
        var colLabelZ = marginFront / 2;
        var colLabelSz = Math.min(gapX * 0.65, marginFront - wallT * 2);
        for (var c = 0; c < cols; c++) {
            var numStr = String(c + 1);
            var cx2 = firstX + c * gapX;
            var lbl2 = makeRecessedLabel(numStr, colLabelSz, colLabelSz);
            lbl2.rotation.x = -Math.PI / 2;
            lbl2.position.set(cx2, H + 0.01, colLabelZ);
            group.add(lbl2);
        }

        return group;
    }



    // ================================================================
    //  Display the generated model
    // ================================================================
    function displayModel(group) {
        // Clear existing model
        clearLgModel();

        lgState.model = group;
        lgState.scene.add(group);

        // Fit camera
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        lgState.controls.target.copy(center);
        const dist = maxDim * 1.8;
        lgState.camera.position.set(
            center.x + dist * 0.6,
            center.y + dist * 0.5,
            center.z + dist * 0.8
        );
        lgState.controls.update();
    }

    function clearLgModel() {
        if (!lgState.scene) return;
        const old = lgState.scene.getObjectByName('__lg_labware__');
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
            lgState.scene.remove(old);
        }
        lgState.model = null;
    }

    // ================================================================
    //  Export to .x (DirectX) file format
    // ================================================================
    function exportToXFile(group, name) {
        if (!group) return null;

        // Collect all mesh geometry into a single vertex/face buffer
        const allVerts = [];
        const allFaces = [];
        const allNormals = [];
        const allNormalFaces = [];
        let vertOffset = 0;
        let normalOffset = 0;

        group.traverse(function (child) {
            if (!child.isMesh || !child.geometry) return;

            // Ensure geometry is non-indexed for simplicity, or handle indexed
            let geo = child.geometry;
            if (geo.index) {
                geo = geo.toNonIndexed();
            }

            // Get world matrix
            child.updateWorldMatrix(true, false);
            const matrix = child.matrixWorld;
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(matrix);

            const pos = geo.getAttribute('position');
            const norm = geo.getAttribute('normal');

            if (!pos) return;

            // Compute normals if not present
            if (!norm) {
                geo.computeVertexNormals();
            }
            const normals = geo.getAttribute('normal');

            const vStart = vertOffset;
            const nStart = normalOffset;

            // Add vertices (transformed to world space)
            for (let i = 0; i < pos.count; i++) {
                const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
                v.applyMatrix4(matrix);
                allVerts.push(v);
            }
            vertOffset += pos.count;

            // Add normals
            if (normals) {
                for (let i = 0; i < normals.count; i++) {
                    const n = new THREE.Vector3(normals.getX(i), normals.getY(i), normals.getZ(i));
                    n.applyMatrix3(normalMatrix).normalize();
                    allNormals.push(n);
                }
                normalOffset += normals.count;
            }

            // Add faces (triangles)
            const faceCount = pos.count / 3;
            for (let f = 0; f < faceCount; f++) {
                const i0 = vStart + f * 3;
                const i1 = vStart + f * 3 + 1;
                const i2 = vStart + f * 3 + 2;
                allFaces.push([i0, i1, i2]);
                allNormalFaces.push([nStart + f * 3, nStart + f * 3 + 1, nStart + f * 3 + 2]);
            }
        });

        if (allVerts.length === 0) return null;

        // Build .x file text
        const lines = [];
        lines.push('xof 0303txt 0032');
        lines.push('');

        // Templates
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
        lines.push('template Coords2d {');
        lines.push('  <f6f23f44-7686-11cf-8f52-0040333594a3>');
        lines.push('  FLOAT u; FLOAT v;');
        lines.push('}');
        lines.push('');
        lines.push('template MeshTextureCoords {');
        lines.push('  <f6f23f40-7686-11cf-8f52-0040333594a3>');
        lines.push('  DWORD nTextureCoords; array Coords2d textureCoords[nTextureCoords];');
        lines.push('}');
        lines.push('');

        // Mesh data
        const meshName = (name || 'Labware').replace(/[^a-zA-Z0-9_]/g, '_');
        lines.push('Mesh ' + meshName + ' {');
        lines.push('  ' + allVerts.length + ';');

        // Vertices
        for (let i = 0; i < allVerts.length; i++) {
            const v = allVerts[i];
            const sep = (i < allVerts.length - 1) ? ',' : ';';
            lines.push('  ' + v.x.toFixed(6) + ';' + v.y.toFixed(6) + ';' + v.z.toFixed(6) + ';' + sep);
        }

        // Faces
        lines.push('  ' + allFaces.length + ';');
        for (let i = 0; i < allFaces.length; i++) {
            const f = allFaces[i];
            const sep = (i < allFaces.length - 1) ? ',' : ';';
            lines.push('  3;' + f[0] + ',' + f[1] + ',' + f[2] + ';' + sep);
        }

        // Material list
        lines.push('  MeshMaterialList {');
        lines.push('    1;');
        lines.push('    ' + allFaces.length + ';');
        for (let i = 0; i < allFaces.length; i++) {
            const sep = (i < allFaces.length - 1) ? ',' : ';';
            lines.push('    0' + sep);
        }
        lines.push('    Material {');
        lines.push('      0.847059;0.862745;0.886275;0.320000;;');
        lines.push('      90.000000;');
        lines.push('      0.266667;0.266667;0.266667;;');
        lines.push('      0.100000;0.100000;0.100000;;');
        lines.push('    }');
        lines.push('  }');

        // Normals
        if (allNormals.length > 0) {
            lines.push('  MeshNormals {');
            lines.push('    ' + allNormals.length + ';');
            for (let i = 0; i < allNormals.length; i++) {
                const n = allNormals[i];
                const sep = (i < allNormals.length - 1) ? ',' : ';';
                lines.push('    ' + n.x.toFixed(6) + ';' + n.y.toFixed(6) + ';' + n.z.toFixed(6) + ';' + sep);
            }
            lines.push('    ' + allNormalFaces.length + ';');
            for (let i = 0; i < allNormalFaces.length; i++) {
                const f = allNormalFaces[i];
                const sep = (i < allNormalFaces.length - 1) ? ',' : ';';
                lines.push('    3;' + f[0] + ',' + f[1] + ',' + f[2] + ';' + sep);
            }
            lines.push('  }');
        }

        lines.push('}');
        lines.push('');

        return lines.join('\n');
    }

    // ================================================================
    //  Populate the form from parsed definition
    // ================================================================
    function populateForm(def) {
        lgState.parsedDef = def;

        $('#lg-name').value = def.name || '';
        $('#lg-manufacturer').value = def.manufacturer || '';
        $('#lg-part-number').value = def.partNumber || '';
        $('#lg-type').value = def.type || 'plate';

        if (def.type === 'plate') {
            // Show plate fields
            $('#lg-plate-fields').style.display = '';
            $('#lg-fp-length').value = def.footprintLength.toFixed(2);
            $('#lg-fp-width').value = def.footprintWidth.toFixed(2);
            $('#lg-height').value = def.height.toFixed(2);
            $('#lg-rows').value = def.rowCount;
            $('#lg-cols').value = def.colCount;
            $('#lg-row-gap').value = def.rowGap.toFixed(2);
            $('#lg-col-gap').value = def.colGap.toFixed(2);
            $('#lg-well-depth').value = def.wellDepth.toFixed(2);
            $('#lg-well-shape').value = def.wellShape || 'Circle';
            $('#lg-well-size').value = def.wellSize.toFixed(2);
            $('#lg-well-size-bottom').value = def.sizeBottom.toFixed(2);
            $('#lg-bottom-shape').value = def.bottomShape || 'Flat';
            $('#lg-first-x').value = def.firstHolePos.x.toFixed(2);
            $('#lg-first-y').value = def.firstHolePos.y.toFixed(2);

            // SBS compliance check
            const sbsOk = checkSBSCompliance(def);
            const badge = $('#lg-sbs-badge');
            if (badge) {
                badge.textContent = sbsOk ? 'SBS Compliant' : 'Non-Standard';
                badge.className = 'lg-sbs-badge ' + (sbsOk ? 'sbs-ok' : 'sbs-warn');
            }

            // Well count
            const wcEl = $('#lg-well-count');
            if (wcEl) wcEl.textContent = def.wellCount + ' wells (' + def.rowCount + '×' + def.colCount + ')';
        }
    }

    function readFormDef() {
        const type = $('#lg-type').value;
        if (type === 'plate') {
            return {
                type: 'plate',
                name: $('#lg-name').value,
                manufacturer: $('#lg-manufacturer').value,
                partNumber: $('#lg-part-number').value,
                footprintLength: parseFloat($('#lg-fp-length').value) || SBS.footprintLength,
                footprintWidth:  parseFloat($('#lg-fp-width').value) || SBS.footprintWidth,
                height:          parseFloat($('#lg-height').value) || 14.35,
                rowCount:        parseInt($('#lg-rows').value) || 8,
                colCount:        parseInt($('#lg-cols').value) || 12,
                rowGap:          parseFloat($('#lg-row-gap').value) || 9.0,
                colGap:          parseFloat($('#lg-col-gap').value) || 9.0,
                wellDepth:       parseFloat($('#lg-well-depth').value) || 10.67,
                wellShape:       $('#lg-well-shape').value || 'Circle',
                wellSize:        parseFloat($('#lg-well-size').value) || 6.86,
                wellLength:      parseFloat($('#lg-well-size').value) || 6.86,
                sizeBottom:      parseFloat($('#lg-well-size-bottom').value) || 6.35,
                bottomShape:     $('#lg-bottom-shape').value || 'Flat',
                vShapeDepth:     parseFloat($('#lg-v-depth')?.value) || 0,
                angle:           0,
                nominalVolume:   0,
                firstHolePos: {
                    x: parseFloat($('#lg-first-x').value) || SBS.a1OffsetX,
                    y: parseFloat($('#lg-first-y').value) || SBS.a1OffsetY,
                },
                wellCount: (parseInt($('#lg-rows').value) || 8) * (parseInt($('#lg-cols').value) || 12),
            };
        }
        // Default plate definition when form is empty
        return {
            type: 'plate',
            name: $('#lg-name').value,
            manufacturer: $('#lg-manufacturer').value,
            footprintLength: SBS.footprintLength,
            footprintWidth: SBS.footprintWidth,
            height: 14.35,
            rowCount: 8,
            colCount: 12,
            rowGap: 9,
            colGap: 9,
            wellDepth: 10.67,
            wellShape: 'Circle',
            wellSize: 6.86,
            wellLength: 6.86,
            sizeBottom: 6.35,
            bottomShape: 'Flat',
            vShapeDepth: 0,
            angle: 0,
            nominalVolume: 0,
            firstHolePos: { x: SBS.a1OffsetX, y: SBS.a1OffsetY },
            wellCount: 96,
        };
    }

    // ================================================================
    //  SBS Compliance Check
    // ================================================================
    function checkSBSCompliance(def) {
        const tolMM = 0.5;  // tolerance in mm
        const fpLenOk = Math.abs(def.footprintLength - SBS.footprintLength) < tolMM;
        const fpWidOk = Math.abs(def.footprintWidth - SBS.footprintWidth) < tolMM;

        // Check well spacing matches standard for well count
        let spacingOk = true;
        if (def.wellCount === 96) {
            spacingOk = Math.abs(def.rowGap - SBS.wellSpacing96) < 0.2 &&
                        Math.abs(def.colGap - SBS.wellSpacing96) < 0.2;
        } else if (def.wellCount === 384) {
            spacingOk = Math.abs(def.rowGap - SBS.wellSpacing384) < 0.2 &&
                        Math.abs(def.colGap - SBS.wellSpacing384) < 0.2;
        }

        return fpLenOk && fpWidOk && spacingOk;
    }

    // ================================================================
    //  Apply SBS defaults (snap to standard)
    // ================================================================
    function applySBSDefaults() {
        const def = readFormDef();
        def.footprintLength = SBS.footprintLength;
        def.footprintWidth = SBS.footprintWidth;
        def.firstHolePos.x = SBS.a1OffsetX;
        def.firstHolePos.y = SBS.a1OffsetY;

        if (def.wellCount === 96) {
            def.rowGap = SBS.wellSpacing96;
            def.colGap = SBS.wellSpacing96;
        } else if (def.wellCount === 384) {
            def.rowGap = SBS.wellSpacing384;
            def.colGap = SBS.wellSpacing384;
        }

        populateForm(def);
        regeneratePreview();
    }

    // ================================================================
    //  Regenerate 3D preview from form values
    // ================================================================
    function regeneratePreview() {
        const def = readFormDef();
        lgState.parsedDef = def;

        const model = generatePlateModel(def);
        displayModel(model);
    }

    // ================================================================
    //  Wire UI Controls
    // ================================================================
    function wireLgControls() {
        // Open XML file
        const fileInput = $('#lg-file-input');
        const openBtn = $('#lg-open-btn');
        if (openBtn && fileInput) {
            openBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const xml = ev.target.result;
                        const def = parseLabwareXML(xml);
                        populateForm(def);
                        regeneratePreview();
                        $('#lg-status').textContent = 'Loaded: ' + file.name;
                        $('#lg-status').className = 'lg-status lg-status-ok';
                    } catch (err) {
                        $('#lg-status').textContent = 'Error: ' + err.message;
                        $('#lg-status').className = 'lg-status lg-status-err';
                    }
                };
                reader.readAsText(file);
                fileInput.value = '';
            });
        }

        // Generate / Refresh button
        const genBtn = $('#lg-generate-btn');
        if (genBtn) {
            genBtn.addEventListener('click', () => {
                regeneratePreview();
            });
        }

        // SBS Defaults button
        const sbsBtn = $('#lg-sbs-defaults');
        if (sbsBtn) {
            sbsBtn.addEventListener('click', () => {
                applySBSDefaults();
            });
        }

        // Save .x button
        const saveBtn = $('#lg-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (!lgState.model) {
                    alert('No model generated. Click Generate first.');
                    return;
                }
                const def = readFormDef();
                const xContent = exportToXFile(lgState.model, def.name);
                if (!xContent) {
                    alert('Failed to export model.');
                    return;
                }
                const blob = new Blob([xContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const safeName = (def.name || 'labware').replace(/[^a-zA-Z0-9_ -]/g, '_');
                a.href = url;
                a.download = safeName + '.x';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }

        // Load into Viewer button
        const loadBtn = $('#lg-load-viewer-btn');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                if (!lgState.model) {
                    alert('No model generated. Click Generate first.');
                    return;
                }
                const def = readFormDef();
                const xContent = exportToXFile(lgState.model, def.name);
                if (!xContent) return;
                const blob = new Blob([xContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                // Signal the main viewer to load this
                if (window._loadGeneratedXFile) {
                    window._loadGeneratedXFile(url, (def.name || 'labware') + '.x');
                }
            });
        }

        // Drag and drop XML onto the viewer
        const host = $('#labware-host');
        if (host) {
            let dragCounter = 0;
            const dropzone = $('#lg-dropzone');

            host.addEventListener('dragenter', (e) => {
                e.preventDefault();
                dragCounter++;
                if (dragCounter === 1 && dropzone) dropzone.classList.remove('viewer-hidden');
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
                    if (dropzone) dropzone.classList.add('viewer-hidden');
                }
            });
            host.addEventListener('drop', (e) => {
                e.preventDefault();
                dragCounter = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');
                const file = e.dataTransfer.files[0];
                if (!file) return;
                if (!file.name.toLowerCase().endsWith('.xml')) {
                    $('#lg-status').textContent = 'Please drop an XML labware definition file.';
                    $('#lg-status').className = 'lg-status lg-status-err';
                    return;
                }
                const reader = new FileReader();
                reader.onload = function (ev) {
                    try {
                        const def = parseLabwareXML(ev.target.result);
                        populateForm(def);
                        regeneratePreview();
                        $('#lg-status').textContent = 'Loaded: ' + file.name;
                        $('#lg-status').className = 'lg-status lg-status-ok';
                    } catch (err) {
                        $('#lg-status').textContent = 'Error: ' + err.message;
                        $('#lg-status').className = 'lg-status lg-status-err';
                    }
                };
                reader.readAsText(file);
            });
        }

        // Auto-regen when form fields change
        document.querySelectorAll('#lg-param-form input, #lg-param-form select').forEach(el => {
            el.addEventListener('change', () => regeneratePreview());
        });
    }

    // ================================================================
    //  Toolbar (mirrors other views)
    // ================================================================
    function wireLgToolbar() {
        const body = $('#lg-vt-body');
        const toggle = $('#lg-vt-toggle');
        if (toggle && body) {
            toggle.addEventListener('click', () => {
                lgState.toolbarCollapsed = !lgState.toolbarCollapsed;
                body.classList.toggle('collapsed', lgState.toolbarCollapsed);
            });
        }

        // Reset camera
        bindClick('#lg-vt-reset-cam', () => {
            if (!lgState.model) return;
            const box = new THREE.Box3().setFromObject(lgState.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            lgState.controls.target.copy(center);
            lgState.camera.position.set(center.x + maxDim, center.y + maxDim * 0.7, center.z + maxDim);
            lgState.controls.update();
        });

        // Zoom fit
        bindClick('#lg-vt-zoom-fit', () => {
            if (!lgState.model) return;
            const box = new THREE.Box3().setFromObject(lgState.model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            lgState.controls.target.copy(center);
            const dist = maxDim * 1.5;
            lgState.camera.position.set(center.x + dist * 0.6, center.y + dist * 0.4, center.z + dist * 0.7);
            lgState.controls.update();
        });

        // Wireframe
        bindClick('#lg-vt-wireframe', () => {
            lgState.wireframe = !lgState.wireframe;
            if (lgState.model) {
                lgState.model.traverse(c => {
                    if (c.isMesh && c.material) {
                        if (Array.isArray(c.material)) c.material.forEach(m => { m.wireframe = lgState.wireframe; });
                        else c.material.wireframe = lgState.wireframe;
                    }
                });
            }
            const btn = $('#lg-vt-wireframe');
            if (btn) btn.classList.toggle('is-active', lgState.wireframe);
        });

        // Perspective toggle
        bindClick('#lg-vt-perspective', () => {
            lgState.isPerspective = !lgState.isPerspective;
            // Simplified: just log for now. Full impl would switch camera type.
            const btn = $('#lg-vt-perspective');
            if (btn) btn.classList.toggle('is-active', !lgState.isPerspective);
        });

        // Grid toggle
        bindClick('#lg-btn-grid', () => {
            lgState.gridVisible = !lgState.gridVisible;
            const grid = lgState.scene ? lgState.scene.getObjectByName('__lggrid__') : null;
            if (grid) grid.visible = lgState.gridVisible;
            const btn = $('#lg-btn-grid');
            if (btn) btn.classList.toggle('grid-off', !lgState.gridVisible);
        });

        // Zoom in/out
        bindClick('#lg-vt-zoom-in', () => {
            if (lgState.controls) lgState.controls.dollyIn(1.3);
            if (lgState.controls) lgState.controls.update();
        });
        bindClick('#lg-vt-zoom-out', () => {
            if (lgState.controls) lgState.controls.dollyOut(1.3);
            if (lgState.controls) lgState.controls.update();
        });

        // Pan mode
        bindClick('#lg-vt-pan', () => {
            lgState.isPanning = !lgState.isPanning;
            if (lgState.controls) {
                lgState.controls.mouseButtons.LEFT = lgState.isPanning
                    ? THREE.MOUSE.PAN
                    : THREE.MOUSE.ROTATE;
            }
            const btn = $('#lg-vt-pan');
            if (btn) btn.classList.toggle('is-active', lgState.isPanning);
        });

        // ── Ruler Tool ──────────────────────────────────────────────
        // When active: normal click = measure, Cmd/Ctrl+drag = orbit
        // First click sets start, mousemove draws live line, second click finalizes
        // Press X, Y, or Z to lock measurement to that axis
        bindClick('#lg-vt-ruler', () => {
            lgState.rulerActive = !lgState.rulerActive;
            const btn = $('#lg-vt-ruler');
            if (btn) btn.classList.toggle('is-active', lgState.rulerActive);
            const readout = $('#lg-ruler-readout');

            if (lgState.rulerActive) {
                // Disable orbit on left-click; only Cmd/Ctrl will orbit
                if (lgState.controls) {
                    lgState._savedMouseButtons = {
                        LEFT: lgState.controls.mouseButtons.LEFT,
                        MIDDLE: lgState.controls.mouseButtons.MIDDLE,
                        RIGHT: lgState.controls.mouseButtons.RIGHT,
                    };
                    lgState.controls.mouseButtons.LEFT = -1; // disable
                }
                if (lgState.renderer) lgState.renderer.domElement.style.cursor = 'crosshair';
                var help = $('#lg-ruler-help');
                if (help) help.style.display = 'block';
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = 'Click first point on model…';
                }
            } else {
                // Restore orbit controls
                if (lgState.controls && lgState._savedMouseButtons) {
                    lgState.controls.mouseButtons.LEFT = lgState._savedMouseButtons.LEFT;
                    lgState.controls.mouseButtons.MIDDLE = lgState._savedMouseButtons.MIDDLE;
                    lgState.controls.mouseButtons.RIGHT = lgState._savedMouseButtons.RIGHT;
                    lgState._savedMouseButtons = null;
                }
                clearRuler();
                lgState.rulerAxisLock = null;
                if (lgState.renderer) lgState.renderer.domElement.style.cursor = '';
                var help2 = $('#lg-ruler-help');
                if (help2) help2.style.display = 'none';
                if (readout) readout.style.display = 'none';
            }
        });

        // Raycast helper
        function rulerRaycast(e) {
            if (!lgState.renderer || !lgState.model) return null;
            var cvs = lgState.renderer.domElement;
            var rect = cvs.getBoundingClientRect();
            var mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            var raycaster = new THREE.Raycaster();
            raycaster.setFromCamera(mouse, lgState.camera);
            var meshes = [];
            lgState.model.traverse(function (c) { if (c.isMesh) meshes.push(c); });
            var hits = raycaster.intersectObjects(meshes, false);
            return hits.length > 0 ? hits[0].point.clone() : null;
        }

        // Apply axis lock: constrain endpoint to match start on locked axes
        function applyAxisLock(start, end) {
            if (!lgState.rulerAxisLock || !start) return end;
            var locked = end.clone();
            if (lgState.rulerAxisLock === 'x') {
                locked.y = start.y;
                locked.z = start.z;
            } else if (lgState.rulerAxisLock === 'y') {
                locked.x = start.x;
                locked.z = start.z;
            } else if (lgState.rulerAxisLock === 'z') {
                locked.x = start.x;
                locked.y = start.y;
            }
            return locked;
        }

        // Axis lock label
        function axisLabel() {
            if (!lgState.rulerAxisLock) return '';
            return ' [locked ' + lgState.rulerAxisLock.toUpperCase() + ']';
        }

        // Pointer down on canvas — ruler click handler
        (function setupRuler() {
            document.addEventListener('pointerdown', function (e) {
                if (!lgState.rulerActive || !lgState.renderer) return;
                var cvs = lgState.renderer.domElement;
                if (e.target !== cvs) return;

                // Cmd/Ctrl held → let orbit controls handle it
                if (e.metaKey || e.ctrlKey) {
                    // Temporarily re-enable orbit for this gesture
                    if (lgState.controls) {
                        lgState.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
                    }
                    // Restore disable after mouseup
                    var onUp = function () {
                        if (lgState.rulerActive && lgState.controls) {
                            lgState.controls.mouseButtons.LEFT = -1;
                        }
                        document.removeEventListener('pointerup', onUp);
                    };
                    document.addEventListener('pointerup', onUp);
                    return;
                }

                e.preventDefault();
                e.stopPropagation();

                var point = rulerRaycast(e);
                if (!point) return;
                var readout = $('#lg-ruler-readout');

                if (!lgState.rulerStart) {
                    // First point
                    clearRuler();
                    lgState.rulerStart = point;
                    lgState.rulerAxisLock = null;
                    addRulerMarker(point);
                    if (readout) {
                        readout.style.display = 'block';
                        readout.textContent = 'Move to second point… (X/Y/Z to lock axis)';
                    }
                } else {
                    // Second point — finalize
                    var lockedPt = applyAxisLock(lgState.rulerStart, point);
                    lgState.rulerEnd = lockedPt;
                    // Clear live line, draw final
                    if (lgState.rulerMarkers.length > 1) {
                        // Remove the live-tracking marker
                        var liveMarker = lgState.rulerMarkers.pop();
                        lgState.scene.remove(liveMarker);
                        liveMarker.geometry.dispose();
                        liveMarker.material.dispose();
                    }
                    addRulerMarker(lockedPt);
                    drawRulerLine(lgState.rulerStart, lockedPt);
                    var dist = lgState.rulerStart.distanceTo(lockedPt);
                    if (readout) {
                        readout.style.display = 'block';
                        readout.textContent = '📏 ' + dist.toFixed(2) + ' mm' + axisLabel() +
                            '  — click to start new measurement';
                    }
                    // Ready for next measurement
                    lgState.rulerStart = null;
                    lgState.rulerEnd = null;
                    lgState.rulerAxisLock = null;
                }
            }, true);  // capture phase so we intercept before orbit controls

            // Live line on mousemove after first point is set
            document.addEventListener('pointermove', function (e) {
                if (!lgState.rulerActive || !lgState.rulerStart || !lgState.renderer) return;
                var cvs = lgState.renderer.domElement;
                if (e.target !== cvs) return;

                var point = rulerRaycast(e);
                if (!point) return;
                var lockedPt = applyAxisLock(lgState.rulerStart, point);

                // Update live line
                drawRulerLine(lgState.rulerStart, lockedPt);

                // Update or add live end marker
                if (lgState.rulerMarkers.length > 1) {
                    lgState.rulerMarkers[1].position.copy(lockedPt);
                } else {
                    addRulerMarker(lockedPt);
                }

                // Update live distance readout
                var dist = lgState.rulerStart.distanceTo(lockedPt);
                var readout = $('#lg-ruler-readout');
                if (readout) {
                    readout.style.display = 'block';
                    readout.textContent = '📏 ' + dist.toFixed(2) + ' mm' + axisLabel();
                }
            }, false);

            // Axis lock keys
            document.addEventListener('keydown', function (e) {
                if (!lgState.rulerActive || !lgState.rulerStart) return;
                var key = e.key.toLowerCase();
                if (key === 'x' || key === 'y' || key === 'z') {
                    // Toggle: pressing same key again unlocks
                    lgState.rulerAxisLock = (lgState.rulerAxisLock === key) ? null : key;
                    var readout = $('#lg-ruler-readout');
                    if (readout) {
                        var lockText = lgState.rulerAxisLock
                            ? 'Locked to ' + lgState.rulerAxisLock.toUpperCase() + ' axis'
                            : 'Axis unlocked — free measurement';
                        readout.textContent = lockText;
                    }
                    e.preventDefault();
                } else if (key === 'escape') {
                    // Cancel current measurement
                    clearRuler();
                    lgState.rulerAxisLock = null;
                    var readout = $('#lg-ruler-readout');
                    if (readout) readout.textContent = 'Click first point on model…';
                }
            }, false);
        })();

        function clearRuler() {
            if (lgState.rulerLine && lgState.scene) {
                lgState.scene.remove(lgState.rulerLine);
                if (lgState.rulerLine.geometry) lgState.rulerLine.geometry.dispose();
                if (lgState.rulerLine.material) lgState.rulerLine.material.dispose();
                lgState.rulerLine = null;
            }
            lgState.rulerMarkers.forEach(function (m) {
                if (lgState.scene) lgState.scene.remove(m);
                if (m.geometry) m.geometry.dispose();
                if (m.material) m.material.dispose();
            });
            lgState.rulerMarkers = [];
            lgState.rulerStart = null;
            lgState.rulerEnd = null;
        }

        function addRulerMarker(point) {
            var geo = new THREE.SphereGeometry(0.4, 12, 8);
            var mat = new THREE.MeshBasicMaterial({ color: 0xff4444, depthTest: false });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.copy(point);
            mesh.renderOrder = 999;
            lgState.scene.add(mesh);
            lgState.rulerMarkers.push(mesh);
        }

        function drawRulerLine(a, b) {
            if (lgState.rulerLine && lgState.scene) {
                lgState.scene.remove(lgState.rulerLine);
                if (lgState.rulerLine.geometry) lgState.rulerLine.geometry.dispose();
                if (lgState.rulerLine.material) lgState.rulerLine.material.dispose();
            }
            var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
            var mat = new THREE.LineBasicMaterial({ color: 0xff4444, depthTest: false, linewidth: 2 });
            var line = new THREE.Line(geo, mat);
            line.renderOrder = 999;
            lgState.scene.add(line);
            lgState.rulerLine = line;
        }

        // Make toolbar draggable
        makeDraggable($('#lg-toolbar'), $('#lg-vt-grab-handle'));
    }

    function bindClick(sel, fn) {
        const el = $(sel);
        if (el) el.addEventListener('click', fn);
    }

    function makeDraggable(panel, handle) {
        if (!panel || !handle) return;
        let dragging = false, startX, startY, origX, origY;

        handle.addEventListener('pointerdown', (e) => {
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const rect = panel.getBoundingClientRect();
            origX = rect.left;
            origY = rect.top;
            handle.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        handle.addEventListener('pointermove', (e) => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            panel.style.position = 'fixed';
            panel.style.left = (origX + dx) + 'px';
            panel.style.top = (origY + dy) + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';
        });
        handle.addEventListener('pointerup', () => { dragging = false; });
        handle.addEventListener('pointercancel', () => { dragging = false; });
    }

    // ================================================================
    //  Gizmo + Camera Display (lightweight versions)
    // ================================================================
    function drawLgGizmo() {
        const canvas = $('#lg-gizmo-canvas');
        if (!canvas || !lgState.camera) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cam = lgState.camera;
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);

        const right = new THREE.Vector3();
        right.crossVectors(cam.up, dir).normalize();
        const up = new THREE.Vector3();
        up.crossVectors(dir, right).normalize();

        const cx = w / 2;
        const cy = h / 2;
        const len = Math.min(w, h) * 0.35;

        const axes = [
            { label: 'X', color: '#e74c3c', v: new THREE.Vector3(1, 0, 0) },
            { label: 'Y', color: '#2ecc71', v: new THREE.Vector3(0, 1, 0) },
            { label: 'Z', color: '#3498db', v: new THREE.Vector3(0, 0, 1) },
        ];

        axes.forEach(a => {
            const px = a.v.dot(right) * len;
            const py = -a.v.dot(up) * len;
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

    function updateLgCamDisplay() {
        const el = $('#lg-cam-display');
        if (!el || !lgState.camera) return;
        const p = lgState.camera.position;
        el.textContent = 'X: ' + p.x.toFixed(1) + '  Y: ' + p.y.toFixed(1) + '  Z: ' + p.z.toFixed(1);
    }

    // ================================================================
    //  Public API
    // ================================================================
    window.LabwareGenModule = {
        init: initLabwareGenerator,
        updateTheme: updateLgTheme,
        // Shared geometry/export functions used by Hamilton import module
        generatePlateModel: generatePlateModel,
        exportToXFile: exportToXFile,
        checkSBSCompliance: checkSBSCompliance,
        SBS: SBS,
    };

})();
