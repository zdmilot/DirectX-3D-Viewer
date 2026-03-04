/* ================================================================
   Export from .x  –  Loads .x files and exports to OBJ / STL / GLB
   ================================================================ */
(function () {
    'use strict';

    const $ = s => document.querySelector(s);
    const DARK_BG  = 0x1a1d23;
    const LIGHT_BG = 0xf0f2f5;
    const DARK_GRID  = 0x2a2d35;
    const LIGHT_GRID = 0xd4d7dc;

    // ── State ────────────────────────────────────────────────────
    const exState = {
        scene: null,
        mainCamera: null,
        mainRenderer: null,
        mainControls: null,
        model: null,
        modelMaxDim: 1,
        modelBox: null,
        originalFileName: 'model',
        isDark: document.documentElement.getAttribute('data-theme') === 'dark',
        inited: false,
        animId: null,
    };

    // ── Initialise ───────────────────────────────────────────────
    function initExporter() {
        // Always refresh dark-mode from the live DOM (user may have toggled
        // the theme while in a different applet).
        exState.isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (exState.inited) {
            // Re-fire resize + sync colours with current theme
            handleResize();
            updateExporterTheme();
            return;
        }
        exState.inited = true;

        // Scene
        const scene = new THREE.Scene();
        exState.scene = scene;

        // Lights
        const amb = new THREE.AmbientLight(0xffffff, 0.65);
        scene.add(amb);
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(5, 10, 7);
        scene.add(dir);
        const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
        dir2.position.set(-5, -3, -5);
        scene.add(dir2);

        // Grid
        const gridColor = exState.isDark ? DARK_GRID : LIGHT_GRID;
        const grid = new THREE.GridHelper(200, 20, gridColor, gridColor);
        grid.name = '__exgrid__';
        grid.renderOrder = -1;
        grid.material.depthWrite = false;
        scene.add(grid);

        // Camera
        const canvas = $('#ex-main-canvas');
        const w = canvas.parentElement.clientWidth || 1;
        const h = canvas.parentElement.clientHeight || 1;
        const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 100000);
        cam.position.set(80, 60, 120);
        exState.mainCamera = cam;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.setClearColor(exState.isDark ? DARK_BG : LIGHT_BG);
        exState.mainRenderer = renderer;

        // Controls
        const controls = new THREE.OrbitControls(cam, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.12;
        exState.mainControls = controls;

        // Resize observer
        const ro = new ResizeObserver(() => handleResize());
        ro.observe(canvas.parentElement);

        // Render loop
        function animate() {
            exState.animId = requestAnimationFrame(animate);
            controls.update();
            renderer.setClearColor(exState.isDark ? DARK_BG : LIGHT_BG);
            renderer.render(scene, cam);
        }
        animate();

        wireExporterControls();
    }

    function handleResize() {
        const canvas = $('#ex-main-canvas');
        if (!canvas || !exState.mainRenderer) return;
        const parent = canvas.parentElement;
        const w = parent.clientWidth || 1;
        const h = parent.clientHeight || 1;
        exState.mainRenderer.setSize(w, h);
        exState.mainCamera.aspect = w / h;
        exState.mainCamera.updateProjectionMatrix();
    }

    // ── File Loading (.x only) ───────────────────────────────────
    function loadXFileExporter(file) {
        exState.originalFileName = file.name.replace(/\.[^.]+$/, '');
        clearExporterModel();
        showExporterLoading(true, 'Loading ' + file.name + '…');

        const url = URL.createObjectURL(file);
        const loader = new THREE.XFileLoader();
        loader.load(url, function (object) {
            URL.revokeObjectURL(url);
            if (object.error || !object.models || object.models.length === 0) {
                showExporterError('X file parse error');
                return;
            }
            const group = new THREE.Group();
            object.models.forEach(m => group.add(m));
            addModelToExporter(group);
        }, undefined, function (err) {
            URL.revokeObjectURL(url);
            showExporterError('X file load error: ' + (err && err.message || err));
        });
    }

    // ── Scene Management ─────────────────────────────────────────
    function addModelToExporter(object) {
        showExporterLoading(false);

        const group = new THREE.Group();
        group.name = '__exmodel__';
        group.add(object);
        exState.model = group;
        exState.scene.add(group);

        // Compute bounds & fit camera
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        exState.modelMaxDim = Math.max(size.x, size.y, size.z) || 1;
        exState.modelBox = box;

        group.position.sub(center);

        const fitDist = exState.modelMaxDim * 2.2;
        exState.mainCamera.position.set(fitDist * 0.6, fitDist * 0.4, fitDist);
        exState.mainCamera.near = exState.modelMaxDim * 0.001;
        exState.mainCamera.far  = exState.modelMaxDim * 50;
        exState.mainCamera.updateProjectionMatrix();

        exState.mainControls.target.set(0, 0, 0);
        exState.mainControls.minDistance = exState.modelMaxDim * 0.05;
        exState.mainControls.maxDistance = exState.modelMaxDim * 15;
        exState.mainControls.update();

        // Resize grid
        const oldGrid = exState.scene.getObjectByName('__exgrid__');
        if (oldGrid) exState.scene.remove(oldGrid);
        const gc = exState.isDark ? DARK_GRID : LIGHT_GRID;
        const newGrid = new THREE.GridHelper(exState.modelMaxDim * 3, 20, gc, gc);
        newGrid.name = '__exgrid__';
        newGrid.renderOrder = -1;
        newGrid.material.depthWrite = false;
        newGrid.position.y = -size.y / 2 - exState.modelMaxDim * 0.002;
        exState.scene.add(newGrid);

        // Update format badge
        const badge = $('#ex-format-badge');
        if (badge) { badge.textContent = '.X'; badge.style.display = 'block'; }

        // Enable export
        const exportBtn = $('#ex-export-btn');
        if (exportBtn) exportBtn.disabled = false;
    }

    function clearExporterModel() {
        if (!exState.scene) return;
        const old = exState.scene.getObjectByName('__exmodel__');
        if (old) {
            old.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
                }
            });
            exState.scene.remove(old);
        }
        exState.model = null;
        const exportBtn = $('#ex-export-btn');
        if (exportBtn) exportBtn.disabled = true;
    }

    // ================================================================
    //  Exporters  –  OBJ / STL / GLB
    // ================================================================

    // ── OBJ ──────────────────────────────────────────────────────
    function exportOBJ() {
        if (!exState.model) return;
        const lines = [];
        const mtlLines = [];
        const mtlName = exState.originalFileName + '.mtl';
        lines.push('# Exported from Direct3D Tools');
        lines.push('mtllib ' + mtlName);
        lines.push('');

        let vertOffset = 1;   // OBJ is 1-indexed
        let normOffset = 1;
        let uvOffset = 1;
        let meshIdx = 0;

        exState.model.updateMatrixWorld(true);

        exState.model.traverse(function (child) {
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

            // write material
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

            // vertices
            for (let i = 0; i < pos.count; i++) {
                lines.push('v ' + pos.getX(i).toFixed(6) + ' ' + pos.getY(i).toFixed(6) + ' ' + pos.getZ(i).toFixed(6));
            }

            // normals
            if (norm) {
                for (let i = 0; i < norm.count; i++) {
                    lines.push('vn ' + norm.getX(i).toFixed(6) + ' ' + norm.getY(i).toFixed(6) + ' ' + norm.getZ(i).toFixed(6));
                }
            }

            // uvs
            if (uv) {
                for (let i = 0; i < uv.count; i++) {
                    lines.push('vt ' + uv.getX(i).toFixed(6) + ' ' + uv.getY(i).toFixed(6));
                }
            }

            // faces
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

        // Download OBJ + MTL
        downloadText(lines.join('\n'), exState.originalFileName + '.obj');
        if (mtlLines.length > 0) {
            downloadText(mtlLines.join('\n'), exState.originalFileName + '.mtl');
        }
    }

    // ── STL (binary) ─────────────────────────────────────────────
    function exportSTL() {
        if (!exState.model) return;

        exState.model.updateMatrixWorld(true);

        // Count total triangles first
        let totalTris = 0;
        exState.model.traverse(child => {
            if (!child.isMesh) return;
            const g = child.geometry;
            const count = g.index ? g.index.count : g.attributes.position.count;
            totalTris += Math.floor(count / 3);
        });

        // STL binary: 80-byte header + 4 bytes tri count + 50 bytes per triangle
        const bufLen = 80 + 4 + totalTris * 50;
        const buffer = new ArrayBuffer(bufLen);
        const dv = new DataView(buffer);

        // Header (80 bytes, zeros is fine)
        const headerStr = 'Exported from Direct3D Tools';
        for (let i = 0; i < headerStr.length && i < 80; i++) {
            dv.setUint8(i, headerStr.charCodeAt(i));
        }

        // Triangle count
        dv.setUint32(80, totalTris, true);

        let offset = 84;

        exState.model.traverse(child => {
            if (!child.isMesh) return;
            const geom = child.geometry.clone();
            geom.applyMatrix4(child.matrixWorld);

            if (!geom.index) {
                const indices = [];
                for (let i = 0; i < geom.attributes.position.count; i++) indices.push(i);
                geom.setIndex(indices);
            }

            // Ensure normals
            if (!geom.attributes.normal) geom.computeVertexNormals();

            const pos = geom.attributes.position;
            const norm = geom.attributes.normal;
            const idx = geom.index;
            const faceCount = idx.count / 3;

            for (let f = 0; f < faceCount; f++) {
                const i0 = idx.getX(f * 3);
                const i1 = idx.getX(f * 3 + 1);
                const i2 = idx.getX(f * 3 + 2);

                // Face normal (average of vertex normals)
                const nx = (norm.getX(i0) + norm.getX(i1) + norm.getX(i2)) / 3;
                const ny = (norm.getY(i0) + norm.getY(i1) + norm.getY(i2)) / 3;
                const nz = (norm.getZ(i0) + norm.getZ(i1) + norm.getZ(i2)) / 3;

                dv.setFloat32(offset,      nx, true); offset += 4;
                dv.setFloat32(offset,      ny, true); offset += 4;
                dv.setFloat32(offset,      nz, true); offset += 4;

                dv.setFloat32(offset, pos.getX(i0), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i0), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i0), true); offset += 4;

                dv.setFloat32(offset, pos.getX(i1), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i1), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i1), true); offset += 4;

                dv.setFloat32(offset, pos.getX(i2), true); offset += 4;
                dv.setFloat32(offset, pos.getY(i2), true); offset += 4;
                dv.setFloat32(offset, pos.getZ(i2), true); offset += 4;

                // Attribute byte count (unused)
                dv.setUint16(offset, 0, true); offset += 2;
            }

            geom.dispose();
        });

        downloadBlob(new Blob([buffer], { type: 'application/octet-stream' }), exState.originalFileName + '.stl');
    }

    // ── GLB ──────────────────────────────────────────────────────
    function exportGLB() {
        if (!exState.model) return;

        exState.model.updateMatrixWorld(true);

        // Collect meshes
        const meshes = [];
        exState.model.traverse(child => { if (child.isMesh) meshes.push(child); });
        if (meshes.length === 0) { showExporterError('No meshes to export'); return; }

        // Build buffer views & accessors
        const bufferParts = [];       // ArrayBuffer chunks
        let totalBufSize = 0;
        const accessors = [];
        const bufferViews = [];
        const gltfMeshes = [];
        const gltfNodes = [];
        const materials = [];

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

            // Material
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

            // === Indices ===
            const idxArr = new Uint32Array(idx.count);
            for (let i = 0; i < idx.count; i++) idxArr[i] = idx.getX(i);
            const idxBuf = padTo4(idxArr.buffer);
            const idxBvIdx = bufferViews.length;
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: idxArr.byteLength, target: 34963 });
            accessors.push({ bufferView: idxBvIdx, componentType: 5125, count: idx.count, type: 'SCALAR', max: [pos.count - 1], min: [0] });
            const idxAccIdx = accessors.length - 1;
            bufferParts.push(idxBuf);
            totalBufSize += idxBuf.byteLength;

            // === Positions ===
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

            // === Normals ===
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

            // Primitive
            const attributes = { POSITION: posAccIdx };
            if (normAccIdx !== undefined) attributes.NORMAL = normAccIdx;

            gltfMeshes.push({ primitives: [{ attributes: attributes, indices: idxAccIdx, material: matIdx }], name: 'Mesh_' + mi });
            gltfNodes.push({ mesh: mi, name: 'Node_' + mi });

            geom.dispose();
        });

        // Build JSON
        const gltfJson = {
            asset: { version: '2.0', generator: 'Direct3D Tools Exporter' },
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

        // Combine binary chunks
        const binBuf = new ArrayBuffer(totalBufSize);
        const binView = new Uint8Array(binBuf);
        let off = 0;
        bufferParts.forEach(part => {
            binView.set(new Uint8Array(part), off);
            off += part.byteLength;
        });
        const binPadded = padTo4(binBuf);

        // GLB header: magic + version + length
        const glbLen = 12 + 8 + jsonBuf.byteLength + 8 + binPadded.byteLength;
        const glb = new ArrayBuffer(glbLen);
        const glbDV = new DataView(glb);

        // GLB header
        glbDV.setUint32(0, 0x46546C67, true);   // magic "glTF"
        glbDV.setUint32(4, 2, true);              // version
        glbDV.setUint32(8, glbLen, true);          // total length

        // JSON chunk
        let p = 12;
        glbDV.setUint32(p, jsonBuf.byteLength, true); p += 4;
        glbDV.setUint32(p, 0x4E4F534A, true); p += 4;   // "JSON"
        new Uint8Array(glb, p, jsonBuf.byteLength).set(new Uint8Array(jsonBuf));
        p += jsonBuf.byteLength;

        // BIN chunk
        glbDV.setUint32(p, binPadded.byteLength, true); p += 4;
        glbDV.setUint32(p, 0x004E4942, true); p += 4;   // "BIN\0"
        new Uint8Array(glb, p, binPadded.byteLength).set(new Uint8Array(binPadded));

        downloadBlob(new Blob([glb], { type: 'model/gltf-binary' }), exState.originalFileName + '.glb');
    }

    /** Pad an ArrayBuffer to a multiple of 4 bytes (GLB requirement) */
    function padTo4(buf) {
        const rem = buf.byteLength % 4;
        if (rem === 0) return buf;
        const padded = new ArrayBuffer(buf.byteLength + (4 - rem));
        new Uint8Array(padded).set(new Uint8Array(buf));
        return padded;
    }

    // ── Export dispatcher ────────────────────────────────────────
    function doExport() {
        if (!exState.model) return;
        const fmt = $('#ex-format-select').value;
        showExporterLoading(true, 'Exporting to .' + fmt.toUpperCase() + '…');

        requestAnimationFrame(() => {
            try {
                switch (fmt) {
                    case 'obj': exportOBJ(); break;
                    case 'stl': exportSTL(); break;
                    case 'glb': exportGLB(); break;
                    default: showExporterError('Unknown format: ' + fmt); return;
                }
                showExporterLoading(false);
            } catch (err) {
                showExporterLoading(false);
                showExporterError('Export error: ' + err.message);
                console.error(err);
            }
        });
    }

    // ── Download helpers ─────────────────────────────────────────
    function downloadText(text, filename) {
        downloadBlob(new Blob([text], { type: 'text/plain' }), filename);
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

    // ── UI helpers ───────────────────────────────────────────────
    function showExporterLoading(show, msg) {
        const el = $('#ex-loading');
        if (!el) return;
        if (show) {
            el.classList.remove('viewer-hidden');
            const span = el.querySelector('span');
            if (span && msg) span.textContent = msg;
        } else {
            el.classList.add('viewer-hidden');
        }
    }

    function showExporterError(msg) {
        showExporterLoading(false);
        const el = $('#ex-error');
        if (!el) return;
        el.classList.remove('viewer-hidden');
        const span = el.querySelector('#ex-error-msg');
        if (span) span.textContent = msg;
        setTimeout(() => el.classList.add('viewer-hidden'), 6000);
    }

    // ── Wire controls ────────────────────────────────────────────
    function wireExporterControls() {
        const fileInput = $('#ex-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', function (e) {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                loadXFileExporter(files[0]);
                fileInput.value = '';
            });
        }

        const openBtn = $('#ex-open-btn');
        if (openBtn) {
            openBtn.addEventListener('click', () => { if (fileInput) fileInput.click(); });
        }

        const exportBtn = $('#ex-export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', doExport);
        }

        // Drag & drop
        const viewport = $('#exporter-main-viewport');
        if (viewport) {
            let dragCtr = 0;
            const dropzone = $('#ex-dropzone');

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
                if (dragCtr <= 0) { dragCtr = 0; if (dropzone) dropzone.classList.add('viewer-hidden'); }
            });
            viewport.addEventListener('drop', e => {
                e.preventDefault();
                dragCtr = 0;
                if (dropzone) dropzone.classList.add('viewer-hidden');

                const files = e.dataTransfer.files;
                if (!files || files.length === 0) return;

                // Find the .x file
                let xFile = null;
                for (let i = 0; i < files.length; i++) {
                    if (files[i].name.toLowerCase().endsWith('.x')) { xFile = files[i]; break; }
                }
                if (xFile) {
                    loadXFileExporter(xFile);
                } else {
                    showExporterError('Please drop a .x file');
                }
            });
        }
    }

    // ── Theme sync ───────────────────────────────────────────────
    function updateExporterTheme() {
        exState.isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (exState.mainRenderer) {
            exState.mainRenderer.setClearColor(exState.isDark ? DARK_BG : LIGHT_BG);
        }
        // Update grid
        const grid = exState.scene ? exState.scene.getObjectByName('__exgrid__') : null;
        if (grid) {
            const gc = exState.isDark ? DARK_GRID : LIGHT_GRID;
            grid.material.color.setHex(gc);
        }
    }

    // ── Public API ───────────────────────────────────────────────
    window.ExporterModule = {
        init: initExporter,
        updateTheme: updateExporterTheme,
    };
})();
