/* ============================================================
   3D File Converter — Convert OBJ/STL/GLB to .x with orientation
   ============================================================ */

(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const $$ = s => document.querySelectorAll(s);

    // ================================================================
    //  State
    // ================================================================
    const cvState = {
        scene: null,
        mainCamera: null,
        mainRenderer: null,
        mainControls: null,
        model: null,           // THREE.Group holding the loaded model
        modelBox: null,        // bounding box
        modelMaxDim: 1,
        isDark: false,

        // Six orthographic view renderers
        views: {},             // { top, bottom, left, right, front, back }

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
    //  Initialization  (called once when converter panel first shows)
    // ================================================================
    let initialized = false;

    function initConverter() {
        if (initialized) return;
        initialized = true;

        const canvas = $('#cv-main-canvas');
        const host   = $('#converter-main-viewport');
        if (!canvas || !host) return;

        const w = host.clientWidth  || 600;
        const h = host.clientHeight || 400;

        // -- Scene --
        cvState.scene = new THREE.Scene();
        cvState.isDark = document.documentElement.hasAttribute('data-theme');
        cvState.scene.background = new THREE.Color(cvState.isDark ? DARK_BG : LIGHT_BG);

        // -- Camera --
        cvState.mainCamera = new THREE.PerspectiveCamera(45, w / h, 0.01, 50000);
        cvState.mainCamera.position.set(3, 2, 5);

        // -- Renderer --
        cvState.mainRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        cvState.mainRenderer.setPixelRatio(window.devicePixelRatio);
        cvState.mainRenderer.setSize(w, h);

        // -- Controls --
        cvState.mainControls = new THREE.OrbitControls(cvState.mainCamera, cvState.mainRenderer.domElement);
        cvState.mainControls.enableDamping = true;
        cvState.mainControls.dampingFactor = 0.12;

        // -- Lights --
        cvState.scene.add(new THREE.AmbientLight(0x808080));
        const d1 = new THREE.DirectionalLight(0xffffff, 0.9);
        d1.position.set(50, 100, 50);
        cvState.scene.add(d1);
        const d2 = new THREE.DirectionalLight(0x6688aa, 0.5);
        d2.position.set(-50, -20, -50);
        cvState.scene.add(d2);

        // -- Grid --
        const gc = cvState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(10, 20, gc, gc);
        grid.name = '__cvgrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        cvState.scene.add(grid);

        // -- Resize observer --
        const ro = new ResizeObserver(() => {
            const cw = host.clientWidth;
            const ch = host.clientHeight;
            cvState.mainCamera.aspect = cw / ch;
            cvState.mainCamera.updateProjectionMatrix();
            cvState.mainRenderer.setSize(cw, ch);
        });
        ro.observe(host);

        // -- Init six-view panels --
        initSixViews();

        // -- Start render loop --
        function tick() {
            cvState.animId = requestAnimationFrame(tick);
            cvState.mainControls.update();
            cvState.mainRenderer.render(cvState.scene, cvState.mainCamera);
            renderSixViews();
        }
        tick();

        // -- Wire controls --
        wireConverterControls();
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
        Object.keys(VIEW_DEFS).forEach(key => {
            const canvas = $(`#cv-view-${key}`);
            if (!canvas) return;

            const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

            const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 50000);
            cam.up.fromArray(VIEW_DEFS[key].up);

            cvState.views[key] = { renderer, camera: cam, canvas };

            // Resize canvas to fit its container
            const parent = canvas.parentElement;
            const roView = new ResizeObserver(() => {
                const pw = parent.clientWidth;
                const ph = parent.clientHeight;
                renderer.setSize(pw, ph);
            });
            roView.observe(parent);
        });
    }

    function renderSixViews() {
        if (!cvState.model) return;

        const halfSize = cvState.modelMaxDim * 0.75;

        Object.keys(cvState.views).forEach(key => {
            const v = cvState.views[key];
            const def = VIEW_DEFS[key];
            if (!v || !v.renderer) return;

            const c = v.canvas;
            const w = c.clientWidth || 1;
            const h = c.clientHeight || 1;

            const aspect = w / h;
            v.camera.left   = -halfSize * aspect;
            v.camera.right  =  halfSize * aspect;
            v.camera.top    =  halfSize;
            v.camera.bottom = -halfSize;
            v.camera.near   = -cvState.modelMaxDim * 10;
            v.camera.far    =  cvState.modelMaxDim * 10;
            v.camera.updateProjectionMatrix();

            // Position camera along the view axis
            const dist = cvState.modelMaxDim * 2;
            v.camera.position.set(
                def.pos[0] * dist,
                def.pos[1] * dist,
                def.pos[2] * dist
            );
            v.camera.up.fromArray(def.up);
            v.camera.lookAt(0, 0, 0);

            v.renderer.setClearColor(cvState.isDark ? DARK_BG : LIGHT_BG);
            v.renderer.render(cvState.scene, v.camera);
        });
    }

    // ================================================================
    //  File Loading  (OBJ+MTL, STL, GLB/GLTF)
    // ================================================================
    function loadFileIntoConverter(file, companionFiles) {
        const ext = file.name.split('.').pop().toLowerCase();
        cvState.originalFileName = file.name.replace(/\.[^.]+$/, '');
        cvState.fileExtension = ext;

        clearConverterModel();
        showConverterLoading(true, 'Loading ' + file.name + '…');
        updateFormatBadge(ext);

        // Gather companion files map (for MTL lookup)
        const fileMap = {};
        if (companionFiles) {
            for (let i = 0; i < companionFiles.length; i++) {
                fileMap[companionFiles[i].name.toLowerCase()] = companionFiles[i];
            }
        }

        switch (ext) {
            case 'obj': loadOBJ(file, fileMap); break;
            case 'stl': loadSTL(file); break;
            case 'glb':
            case 'gltf': loadGLTF(file); break;
            case 'x':   loadXFileConverter(file); break;
            default:
                showConverterError('Unsupported format: .' + ext);
        }
    }

    function loadOBJ(file, fileMap) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const objText = e.target.result;

            // Parse MTL reference from OBJ text
            const mtlMatch = objText.match(/^mtllib\s+(.+)$/m);
            const mtlFileName = mtlMatch ? mtlMatch[1].trim() : null;

            if (mtlFileName) {
                const mtlKey = mtlFileName.toLowerCase();
                if (fileMap[mtlKey]) {
                    // Read MTL from companion files
                    const mtlReader = new FileReader();
                    mtlReader.onload = function (me) {
                        parseMTLThenOBJ(me.target.result, objText, fileMap);
                    };
                    mtlReader.readAsText(fileMap[mtlKey]);
                    return;
                }
            }

            // No MTL found, load OBJ without materials
            parseOBJText(objText, null);
        };
        reader.readAsText(file);
    }

    function parseMTLThenOBJ(mtlText, objText, fileMap) {
        const mtlLoader = new THREE.MTLLoader();
        const materials = mtlLoader.parse(mtlText, '');

        // Handle texture files if provided
        if (fileMap) {
            Object.keys(materials.materialsInfo).forEach(name => {
                const info = materials.materialsInfo[name];
                if (info.map_kd) {
                    const texKey = info.map_kd.toLowerCase();
                    if (fileMap[texKey]) {
                        const texURL = URL.createObjectURL(fileMap[texKey]);
                        // Update texture path to blob URL
                        info.map_kd = texURL;
                    }
                }
            });
            // Re-create materials with updated paths
            materials.preload();
        } else {
            materials.preload();
        }

        parseOBJText(objText, materials);
    }

    function parseOBJText(objText, materials) {
        const loader = new THREE.OBJLoader();
        if (materials) {
            loader.setMaterials(materials);
        }

        try {
            const object = loader.parse(objText);
            addModelToScene(object);
        } catch (err) {
            showConverterError('OBJ parse error: ' + err.message);
        }
    }

    function loadSTL(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const loader = new THREE.STLLoader();
                const geometry = loader.parse(e.target.result);

                const material = new THREE.MeshPhongMaterial({
                    color: 0x8899aa,
                    specular: 0x333333,
                    shininess: 30,
                    flatShading: false,
                });
                const mesh = new THREE.Mesh(geometry, material);
                const group = new THREE.Group();
                group.add(mesh);
                addModelToScene(group);
            } catch (err) {
                showConverterError('STL parse error: ' + err.message);
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
            showConverterError('GLTF load error: ' + (err.message || err));
        });
    }

    function loadXFileConverter(file) {
        const url = URL.createObjectURL(file);
        const loader = new THREE.XFileLoader();
        loader.load(url, function (object) {
            URL.revokeObjectURL(url);
            if (object.error || !object.models || object.models.length === 0) {
                showConverterError('X file parse error');
                return;
            }
            const group = new THREE.Group();
            object.models.forEach(m => group.add(m));
            addModelToScene(group);
        }, undefined, function (err) {
            URL.revokeObjectURL(url);
            showConverterError('X file load error: ' + (err && err.message || err));
        });
    }

    // ================================================================
    //  Scene Management
    // ================================================================
    function addModelToScene(object) {
        showConverterLoading(false);

        const group = new THREE.Group();
        group.name = '__cvmodel__';
        group.add(object);
        cvState.model = group;
        cvState.scene.add(group);

        // Compute bounding box & fit
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        cvState.modelMaxDim = Math.max(size.x, size.y, size.z) || 1;
        cvState.modelBox = box;

        // Center model at origin
        group.position.sub(center);

        // Fit main camera
        const fitDist = cvState.modelMaxDim * 2.2;
        cvState.mainCamera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
        cvState.mainCamera.near = cvState.modelMaxDim * 0.001;
        cvState.mainCamera.far  = cvState.modelMaxDim * 50;
        cvState.mainCamera.updateProjectionMatrix();

        cvState.mainControls.target.set(0, 0, 0);
        cvState.mainControls.minDistance = cvState.modelMaxDim * 0.05;
        cvState.mainControls.maxDistance = cvState.modelMaxDim * 15;
        cvState.mainControls.update();

        // Resize grid
        const oldGrid = cvState.scene.getObjectByName('__cvgrid__');
        if (oldGrid) cvState.scene.remove(oldGrid);
        const gc = cvState.isDark ? DARK_GRID : LIGHT_GRID;
        const newGrid = new THREE.GridHelper(cvState.modelMaxDim * 3, 20, gc, gc);
        newGrid.name = '__cvgrid__';
        newGrid.renderOrder = -1;
        newGrid.material.depthWrite = false;
        newGrid.position.y = -size.y / 2 - cvState.modelMaxDim * 0.002;
        cvState.scene.add(newGrid);

        // Reset rotation state
        cvState.rotX = 0;
        cvState.rotY = 0;
        cvState.rotZ = 0;
        updateRotationDisplay();

        // Enable export button
        const exportBtn = $('#cv-export-btn');
        if (exportBtn) exportBtn.disabled = false;
    }

    function clearConverterModel() {
        if (!cvState.scene) return;
        const old = cvState.scene.getObjectByName('__cvmodel__');
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
            cvState.scene.remove(old);
        }
        cvState.model = null;
        cvState.rotX = 0; cvState.rotY = 0; cvState.rotZ = 0;
        updateRotationDisplay();

        const exportBtn = $('#cv-export-btn');
        if (exportBtn) exportBtn.disabled = true;
    }

    // ================================================================
    //  Rotation Controls
    // ================================================================
    function rotateModel(axis, degrees) {
        if (!cvState.model) return;

        const rad = THREE.MathUtils.degToRad(degrees);
        switch (axis) {
            case 'x': cvState.model.rotateX(rad); cvState.rotX += degrees; break;
            case 'y': cvState.model.rotateY(rad); cvState.rotY += degrees; break;
            case 'z': cvState.model.rotateZ(rad); cvState.rotZ += degrees; break;
        }

        // Normalize display
        cvState.rotX = ((cvState.rotX % 360) + 360) % 360;
        cvState.rotY = ((cvState.rotY % 360) + 360) % 360;
        cvState.rotZ = ((cvState.rotZ % 360) + 360) % 360;

        updateRotationDisplay();
    }

    function resetRotation() {
        if (!cvState.model) return;
        cvState.model.rotation.set(0, 0, 0);
        cvState.rotX = 0; cvState.rotY = 0; cvState.rotZ = 0;
        updateRotationDisplay();
    }

    function updateRotationDisplay() {
        const el = $('#cv-rotation-display');
        if (el) {
            el.textContent = `X: ${Math.round(cvState.rotX)}°  Y: ${Math.round(cvState.rotY)}°  Z: ${Math.round(cvState.rotZ)}°`;
        }
    }

    // ================================================================
    //  .x File Exporter
    // ================================================================
    function exportToX() {
        if (!cvState.model) return;

        showConverterLoading(true, 'Exporting to .x…');

        // Use requestAnimationFrame to let the loading UI render
        requestAnimationFrame(() => {
            try {
                const xText = generateXFileText(cvState.model);
                downloadTextFile(xText, cvState.originalFileName + '.x');
                showConverterLoading(false);
            } catch (err) {
                showConverterLoading(false);
                showConverterError('Export error: ' + err.message);
                console.error(err);
            }
        });
    }

    function generateXFileText(group) {
        const lines = [];
        lines.push('xof 0303txt 0032');
        lines.push('');

        // Template declarations
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

        // Collect all meshes from the group, applying world transforms
        let meshIndex = 0;
        group.updateMatrixWorld(true);

        group.traverse(function (child) {
            if (!child.isMesh) return;

            const geom = child.geometry.clone();
            // Apply the full world matrix (includes our rotation) to bake transforms into vertices
            geom.applyMatrix4(child.matrixWorld);

            // Ensure we have index/position buffers
            if (!geom.index) {
                // Convert non-indexed to indexed
                const posAttr = geom.attributes.position;
                const indices = [];
                for (let i = 0; i < posAttr.count; i++) indices.push(i);
                geom.setIndex(indices);
            }

            const posArr = geom.attributes.position;
            const normArr = geom.attributes.normal;
            const uvArr = geom.attributes.uv;
            const idxArr = geom.index;

            const vertCount = posArr.count;
            const faceCount = idxArr.count / 3;

            const meshName = 'Mesh_' + meshIndex;
            meshIndex++;

            lines.push('Mesh ' + meshName + ' {');

            // -- Vertices --
            lines.push('  ' + vertCount + ';');
            for (let i = 0; i < vertCount; i++) {
                const sep = (i === vertCount - 1) ? ';' : ',';
                lines.push('  ' + posArr.getX(i).toFixed(6) + ';' +
                                   posArr.getY(i).toFixed(6) + ';' +
                                   posArr.getZ(i).toFixed(6) + ';' + sep);
            }

            // -- Faces --
            lines.push('  ' + faceCount + ';');
            for (let f = 0; f < faceCount; f++) {
                const i0 = idxArr.getX(f * 3);
                const i1 = idxArr.getX(f * 3 + 1);
                const i2 = idxArr.getX(f * 3 + 2);
                const sep = (f === faceCount - 1) ? ';' : ',';
                lines.push('  3;' + i0 + ',' + i1 + ',' + i2 + ';' + sep);
            }

            // -- Materials --
            const mats = child.material
                ? (Array.isArray(child.material) ? child.material : [child.material])
                : [];

            if (mats.length > 0) {
                // Check for material groups
                const groups = geom.groups && geom.groups.length > 0 ? geom.groups : null;

                if (groups && mats.length > 1) {
                    // Multi-material mesh
                    const faceMatIdx = new Array(faceCount).fill(0);
                    groups.forEach(g => {
                        const startFace = g.start / 3;
                        const numFaces = g.count / 3;
                        for (let fi = startFace; fi < startFace + numFaces && fi < faceCount; fi++) {
                            faceMatIdx[fi] = g.materialIndex || 0;
                        }
                    });

                    lines.push('  MeshMaterialList {');
                    lines.push('    ' + mats.length + ';');
                    lines.push('    ' + faceCount + ';');
                    for (let f = 0; f < faceCount; f++) {
                        const sep = (f === faceCount - 1) ? ';' : ',';
                        lines.push('    ' + faceMatIdx[f] + sep);
                    }
                    mats.forEach((m, mi) => {
                        writeMaterial(lines, m, mi);
                    });
                    lines.push('  }');
                } else {
                    // Single material for all faces
                    lines.push('  MeshMaterialList {');
                    lines.push('    1;');
                    lines.push('    ' + faceCount + ';');
                    for (let f = 0; f < faceCount; f++) {
                        const sep = (f === faceCount - 1) ? ';' : ',';
                        lines.push('    0' + sep);
                    }
                    writeMaterial(lines, mats[0], 0);
                    lines.push('  }');
                }
            }

            // -- Normals --
            if (normArr) {
                lines.push('  MeshNormals {');
                lines.push('    ' + vertCount + ';');
                for (let i = 0; i < vertCount; i++) {
                    const sep = (i === vertCount - 1) ? ';' : ',';
                    lines.push('    ' + normArr.getX(i).toFixed(6) + ';' +
                                       normArr.getY(i).toFixed(6) + ';' +
                                       normArr.getZ(i).toFixed(6) + ';' + sep);
                }
                lines.push('    ' + faceCount + ';');
                for (let f = 0; f < faceCount; f++) {
                    const i0 = idxArr.getX(f * 3);
                    const i1 = idxArr.getX(f * 3 + 1);
                    const i2 = idxArr.getX(f * 3 + 2);
                    const sep = (f === faceCount - 1) ? ';' : ',';
                    lines.push('    3;' + i0 + ',' + i1 + ',' + i2 + ';' + sep);
                }
                lines.push('  }');
            }

            // -- Texture Coordinates --
            if (uvArr) {
                lines.push('  MeshTextureCoords {');
                lines.push('    ' + vertCount + ';');
                for (let i = 0; i < vertCount; i++) {
                    const sep = (i === vertCount - 1) ? ';' : ',';
                    lines.push('    ' + uvArr.getX(i).toFixed(6) + ';' +
                                       uvArr.getY(i).toFixed(6) + ';' + sep);
                }
                lines.push('  }');
            }

            lines.push('}');
            lines.push('');

            geom.dispose();
        });

        return lines.join('\n');
    }

    function writeMaterial(lines, mat, idx) {
        // Extract color components from Three.js material
        let r = 0.7, g = 0.7, b = 0.7, a = 1.0;
        let sr = 0, sg = 0, sb = 0;  // specular
        let er = 0, eg = 0, eb = 0;  // emissive
        let power = 1.0;

        if (mat.color) {
            r = mat.color.r;
            g = mat.color.g;
            b = mat.color.b;
        }
        if (mat.opacity !== undefined) a = mat.opacity;
        if (mat.specular) {
            sr = mat.specular.r;
            sg = mat.specular.g;
            sb = mat.specular.b;
        }
        if (mat.emissive) {
            er = mat.emissive.r;
            eg = mat.emissive.g;
            eb = mat.emissive.b;
        }
        if (mat.shininess !== undefined) power = mat.shininess;

        lines.push('    Material Material_' + idx + ' {');
        lines.push('      ' + r.toFixed(6) + ';' + g.toFixed(6) + ';' + b.toFixed(6) + ';' + a.toFixed(6) + ';;');
        lines.push('      ' + power.toFixed(6) + ';');
        lines.push('      ' + sr.toFixed(6) + ';' + sg.toFixed(6) + ';' + sb.toFixed(6) + ';;');
        lines.push('      ' + er.toFixed(6) + ';' + eg.toFixed(6) + ';' + eb.toFixed(6) + ';;');
        lines.push('    }');
    }

    function downloadTextFile(text, filename) {
        const blob = new Blob([text], { type: 'text/plain' });
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
    function showConverterLoading(show, msg) {
        const el = $('#cv-loading');
        if (!el) return;
        if (show) {
            el.classList.remove('viewer-hidden');
            const span = el.querySelector('span');
            if (span && msg) span.textContent = msg;
        } else {
            el.classList.add('viewer-hidden');
        }
    }

    function showConverterError(msg) {
        showConverterLoading(false);
        const el = $('#cv-error');
        if (!el) return;
        el.classList.remove('viewer-hidden');
        const span = el.querySelector('#cv-error-msg');
        if (span) span.textContent = msg;
        setTimeout(() => el.classList.add('viewer-hidden'), 6000);
    }

    function updateFormatBadge(ext) {
        const badge = $('#cv-format-badge');
        if (badge) {
            badge.textContent = '.' + ext.toUpperCase();
            badge.style.display = 'block';
        }
    }

    // ================================================================
    //  Wire Controls
    // ================================================================
    function wireConverterControls() {
        // File input
        const fileInput = $('#cv-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                // Find the primary 3D file
                let primary = null;
                const companions = [];
                for (let i = 0; i < files.length; i++) {
                    const ext = files[i].name.split('.').pop().toLowerCase();
                    if (['obj', 'stl', 'glb', 'gltf', 'x'].includes(ext)) {
                        primary = files[i];
                    } else {
                        companions.push(files[i]);
                    }
                }
                if (!primary && files.length > 0) {
                    primary = files[0]; // fallback
                }
                if (primary) {
                    loadFileIntoConverter(primary, files); // pass all files for companion lookup
                }
                fileInput.value = '';
            });
        }

        // Open button
        const openBtn = $('#cv-open-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        // Rotation buttons
        $$('.cv-rot-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const axis = this.dataset.axis;
                const deg = parseInt(this.dataset.deg, 10);
                rotateModel(axis, deg);
            });
        });

        // Reset rotation
        const resetBtn = $('#cv-reset-rot');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetRotation);
        }

        // Export button
        const exportBtn = $('#cv-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportToX);
        }

        // Drag & drop on main viewport
        const viewport = $('#converter-main-viewport');
        if (viewport) {
            let dragCtr = 0;
            const dropzone = $('#cv-dropzone');

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
                    if (['obj', 'stl', 'glb', 'gltf', 'x'].includes(ext)) {
                        primary = files[i];
                        break;
                    }
                }
                if (primary) {
                    loadFileIntoConverter(primary, files);
                }
            });
        }
    }

    // ================================================================
    //  Theme sync
    // ================================================================
    function updateConverterTheme() {
        cvState.isDark = document.documentElement.hasAttribute('data-theme');
        if (cvState.scene) {
            cvState.scene.background = new THREE.Color(cvState.isDark ? DARK_BG : LIGHT_BG);
            const grid = cvState.scene.getObjectByName('__cvgrid__');
            if (grid) {
                const c = new THREE.Color(cvState.isDark ? DARK_GRID : LIGHT_GRID);
                grid.material.color.copy(c);
            }
        }
    }

    // ================================================================
    //  Public API  (attaches to window for app.js to call)
    // ================================================================
    window.ConverterModule = {
        init: initConverter,
        updateTheme: updateConverterTheme,
    };

})();
