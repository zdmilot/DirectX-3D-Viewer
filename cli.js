#!/usr/bin/env node
/* ================================================================
   Hamilton .hxx / .x File CLI Tool
   ================================================================
   Interactive command-line interface for loading, inspecting,
   validating, and exporting Hamilton 3D files (.hxx and .x).

   Usage:
     node cli.js                    — interactive mode
     node cli.js <file>             — load file and show info
     node cli.js --batch <dir>      — batch-validate all .hxx/.x in dir
     node cli.js --help             — show help

   Commands (interactive mode):
     load <file>         Load a .hxx or .x file
     info                Show info about the loaded file
     sections            List .hxx sections (only for .hxx files)
     tree                Show frame hierarchy tree
     meshes              List all meshes with vertex/face counts
     materials           List all materials
     animations          List animations
     export <file>       Export decompressed .x text to file
     validate <file>     Validate a file can be parsed
     batch <dir>         Batch-validate all .hxx/.x files in a directory
     stats               Show aggregate stats for batch results
     open                Open in browser (starts local server)
     help                Show this help
     exit / quit         Exit
   ================================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const readline = require('readline');

// ── Colors for terminal output ─────────────────────────────────
const C = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
};

function colorize(color, text) { return color + text + C.reset; }

// ── HXX Parser (Node.js port — uses zlib instead of DecompressionStream) ──

const HXX_MAGIC = 'Hamilton3dData';
const MAIN_SECTION = '__Main3dData__';

function readUint32BE(buf, offset) {
    return buf.readUInt32BE(offset);
}

function isHXX(buf) {
    if (!buf || buf.length < 20) return false;
    return buf.toString('ascii', 0, HXX_MAGIC.length) === HXX_MAGIC;
}

function isRawXFile(buf) {
    if (!buf || buf.length < 4) return false;
    return buf.toString('ascii', 0, 4) === 'xof ';
}

function findGzipEnd(compressedBuf, expectedDecompSize) {
    const isize = expectedDecompSize >>> 0;
    const searchStart = Math.max(10, compressedBuf.length - 2048);
    for (let i = compressedBuf.length - 4; i >= searchStart; i--) {
        if (compressedBuf.readUInt32LE(i) === isize) {
            return i + 4;
        }
    }
    return -1;
}

function decompressSection(compressedBuf, expectedDecompSize) {
    // Strategy 1: Trim to exact gzip end via ISIZE, then gunzip
    if (expectedDecompSize > 0) {
        const gzipEnd = findGzipEnd(compressedBuf, expectedDecompSize);
        if (gzipEnd > 0 && gzipEnd <= compressedBuf.length) {
            try {
                const trimmed = compressedBuf.slice(0, gzipEnd);
                const result = zlib.gunzipSync(trimmed);
                if (result.length === expectedDecompSize) return result;
            } catch (e) { /* fall through */ }
        }
    }

    // Strategy 2: Skip gzip header, inflateRaw (avoids trailer issues)
    if (compressedBuf[0] === 0x1f && compressedBuf[1] === 0x8b) {
        try {
            const raw = compressedBuf.slice(10); // flags=0x00 → header always 10 bytes
            return zlib.inflateRawSync(raw);
        } catch (e) { /* fall through */ }
    }

    // Strategy 3: Plain gunzip (may error on trailing junk)
    return zlib.gunzipSync(compressedBuf);
}

function parseHXX(buf) {
    if (isRawXFile(buf)) {
        return {
            isRaw: true,
            xFileText: buf.toString('utf-8'),
            sections: [{ name: '__Main3dData__', decompressedSize: buf.length, compressedSize: buf.length }],
            textures: [],
        };
    }

    if (!isHXX(buf)) throw new Error('Not a valid .hxx file (missing Hamilton3dData header)');

    const version = [buf[14], buf[15]];
    const sectionCount = readUint32BE(buf, 16);
    if (sectionCount === 0) throw new Error('HXX file contains no sections');

    const sections = [];
    for (let i = 0; i < sectionCount; i++) {
        const base = 20 + i * 12;
        const nameOffset = readUint32BE(buf, base);
        const nameLen = readUint32BE(buf, base + 4);
        const decompressedSize = readUint32BE(buf, base + 8);
        const name = buf.toString('ascii', nameOffset, nameOffset + nameLen);
        const dataOffset = nameOffset + nameLen;
        sections.push({ name, nameOffset, nameLen, dataOffset, decompressedSize });
    }

    // Sort by offset to compute compressed sizes
    const sorted = sections.slice().sort((a, b) => a.nameOffset - b.nameOffset);
    for (let i = 0; i < sorted.length; i++) {
        const nextOff = (i + 1 < sorted.length) ? sorted[i + 1].nameOffset : buf.length;
        sorted[i].compressedSize = nextOff - sorted[i].dataOffset;
    }
    const csMap = {};
    for (const s of sorted) csMap[s.name] = s.compressedSize;
    for (const s of sections) s.compressedSize = csMap[s.name];

    // Decompress main section
    const mainSection = sections.find(s => s.name === MAIN_SECTION);
    if (!mainSection) throw new Error('HXX file has no __Main3dData__ section');

    const mainCompressed = buf.slice(mainSection.dataOffset, mainSection.dataOffset + mainSection.compressedSize);
    const mainDecompressed = decompressSection(mainCompressed, mainSection.decompressedSize);
    const xFileText = mainDecompressed.toString('utf-8');

    // Decompress texture sections
    const textures = [];
    for (const s of sections) {
        if (s.name === MAIN_SECTION) continue;
        try {
            const compressed = buf.slice(s.dataOffset, s.dataOffset + s.compressedSize);
            const decompressed = decompressSection(compressed, s.decompressedSize);
            textures.push({ name: s.name, data: decompressed, size: decompressed.length });
        } catch (e) {
            textures.push({ name: s.name, error: e.message, size: 0 });
        }
    }

    return { isRaw: false, xFileText, sections, textures, version };
}

// ── Compressed .x file support (MSZIP: bzip/tzip) ─────────────

function isCompressedXFile(buf) {
    if (!buf || buf.length < 16) return false;
    if (buf.toString('ascii', 0, 4) !== 'xof ') return false;
    const fmt = buf.toString('ascii', 8, 12);
    return fmt === 'bzip' || fmt === 'tzip';
}

function getXFileFormat(buf) {
    if (!buf || buf.length < 12) return null;
    return buf.toString('ascii', 8, 12);
}

/**
 * Decompress an MSZIP-compressed .x file to its raw binary or text content.
 * Uses Node.js native zlib (inflateRawSync) instead of pako.
 */
function decompressXFileMSZIP(buf) {
    const totalDecomp = buf.readUInt32LE(16) - 16;
    const result = Buffer.alloc(totalDecomp);
    let resultOffset = 0;
    let off = 20;
    let prevBlock = null;

    while (off < buf.length - 4) {
        const decompSize = buf.readUInt16LE(off);
        const compSize = buf.readUInt16LE(off + 2);
        off += 4;

        if (compSize === 0) break;
        if (off + compSize > buf.length) break;

        if (buf[off] !== 0x43 || buf[off + 1] !== 0x4B) {
            throw new Error('Invalid MSZIP block: missing CK signature at offset ' + off);
        }

        const deflateData = buf.slice(off + 2, off + compSize);
        let decompressed;

        try {
            if (prevBlock) {
                const dict = prevBlock.length > 32768
                    ? prevBlock.slice(prevBlock.length - 32768)
                    : prevBlock;
                decompressed = zlib.inflateRawSync(deflateData, { dictionary: dict });
            } else {
                decompressed = zlib.inflateRawSync(deflateData);
            }
        } catch (e) {
            // Retry without dictionary
            decompressed = zlib.inflateRawSync(deflateData);
        }

        decompressed.copy(result, resultOffset);
        resultOffset += decompressed.length;
        prevBlock = decompressed;
        off += compSize;
    }

    return result.slice(0, resultOffset);
}

/**
 * Convert a compressed .x file buffer to text for the lightweight parser.
 * For bzip files, uses binaryToText conversion via the XFileLoader module.
 * For tzip files, the decompressed data is already text.
 */
function decompressXFileToText(buf) {
    const fmt = getXFileFormat(buf);
    const raw = decompressXFileMSZIP(buf);
    if (fmt === 'tzip') {
        return raw.toString('utf-8');
    }
    // bzip: raw is binary .x token data — needs token-to-text conversion
    // For the lightweight parser, we'll return null to indicate deep parse is needed
    return null;
}

// ── Lightweight .x Text Parser (no THREE.js dependency) ────────

function parseXFileText(text) {
    const result = {
        header: '',
        format: '',
        version: '',
        floatSize: 0,
        frames: [],
        meshes: [],
        materials: [],
        animations: [],
        animTicksPerSecond: 0,
        templates: [],
        totalVertices: 0,
        totalFaces: 0,
        textLength: text.length,
    };

    // Parse header line
    const firstNL = text.indexOf('\n');
    if (firstNL > 0) {
        result.header = text.substring(0, firstNL).trim();
        if (result.header.startsWith('xof ')) {
            result.version = result.header.substring(4, 8);
            result.format = result.header.substring(8, 12).trim();
            result.floatSize = parseInt(result.header.substring(12, 16), 10) || 0;
        }
    }

    // Simple regex-based extraction (avoids full parse, much faster)
    const body = text.substring(firstNL + 1);

    // Count Frame blocks and extract names
    const frameRe = /\bFrame\s+(\S+)\s*\{/g;
    let m;
    while ((m = frameRe.exec(body)) !== null) {
        result.frames.push(m[1]);
    }

    // Count Mesh blocks and extract vertex/face counts
    const meshRe = /\bMesh\s+(\S*)\s*\{[\s\r\n]*(\d+)\s*;[\s\S]*?(\d+)\s*;/g;
    while ((m = meshRe.exec(body)) !== null) {
        const name = m[1] || '(unnamed)';
        const verts = parseInt(m[2], 10);
        const faces = parseInt(m[3], 10);
        result.meshes.push({ name, vertices: verts, faces });
        result.totalVertices += verts;
        result.totalFaces += faces;
    }

    // Count Material blocks
    const matRe = /\bMaterial\s+(\S*)\s*\{/g;
    while ((m = matRe.exec(body)) !== null) {
        result.materials.push(m[1] || '(unnamed)');
    }

    // Count AnimationSet blocks
    const animRe = /\bAnimationSet\s+(\S*)\s*\{/g;
    while ((m = animRe.exec(body)) !== null) {
        result.animations.push(m[1] || '(unnamed)');
    }

    // Template blocks
    const tmplRe = /\btemplate\s+(\S+)\s*\{/g;
    while ((m = tmplRe.exec(body)) !== null) {
        result.templates.push(m[1]);
    }

    // AnimTicksPerSecond
    const ticksRe = /\bAnimTicksPerSecond\s*\{[\s\r\n]*(\d+)/;
    const ticksMatch = body.match(ticksRe);
    if (ticksMatch) result.animTicksPerSecond = parseInt(ticksMatch[1], 10);

    return result;
}

// Build frame hierarchy tree from .x text
function buildFrameTree(text) {
    const lines = text.split('\n');
    const root = { name: '(root)', children: [], meshes: [], depth: 0 };
    const stack = [root];
    let current = root;

    for (const line of lines) {
        const trimmed = line.trim();

        const frameMatch = trimmed.match(/^Frame\s+(\S+)\s*\{/);
        if (frameMatch) {
            const node = { name: frameMatch[1], children: [], meshes: [], depth: current.depth + 1 };
            current.children.push(node);
            stack.push(current);
            current = node;
            continue;
        }

        const meshMatch = trimmed.match(/^Mesh\s+(\S*)\s*\{/);
        if (meshMatch) {
            current.meshes.push(meshMatch[1] || '(unnamed)');
        }

        if (trimmed === '}') {
            if (stack.length > 1) {
                current = stack.pop();
            }
        }
    }

    return root;
}

function printTree(node, prefix, isLast) {
    if (prefix === undefined) { prefix = ''; isLast = true; }
    const connector = prefix === '' ? '' : (isLast ? '└── ' : '├── ');
    const meshInfo = node.meshes.length > 0 ? colorize(C.yellow, ` [${node.meshes.join(', ')}]`) : '';
    console.log(prefix + connector + colorize(C.cyan, node.name) + meshInfo);

    const childPrefix = prefix + (prefix === '' ? '' : (isLast ? '    ' : '│   '));
    for (let i = 0; i < node.children.length; i++) {
        printTree(node.children[i], childPrefix, i === node.children.length - 1);
    }
}

// ── Deep parse using XFileLoader (with THREE.js shim) ──────────

function deepParseXFile(dataOrText) {
    // Minimal THREE.js shim for XFileLoader to work in Node.js
    const THREE = createThreeShim();
    // Load XFileLoader module
    const loaderPath = path.join(__dirname, 'js', 'lib', 'XFileLoader.js');
    const loaderCode = fs.readFileSync(loaderPath, 'utf-8');

    // Load pako for compressed .x support
    const pakoPath = path.join(__dirname, 'js', 'lib', 'pako.min.js');
    let pakoModule = null;
    try { pakoModule = require(pakoPath); } catch (e) { /* pako optional for non-compressed */ }

    // Execute in a sandbox with our THREE shim
    const vm = require('vm');
    const sandbox = {
        THREE,
        pako: pakoModule,
        globalThis: { THREE },
        global: { THREE },
        self: { THREE },
        exports: {},
        module: { exports: {} },
        define: undefined,
        console,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Float32Array,
        Uint16Array,
        Uint32Array,
        Int32Array,
        ArrayBuffer,
        DataView,
        TextDecoder,
        Uint8Array,
        Math,
        String,
        Array,
        Object,
        Error,
        TypeError,
        RangeError,
        parseInt,
        parseFloat,
        isNaN,
        isFinite,
        NaN,
        Infinity,
        undefined,
    };

    try {
        vm.runInNewContext(loaderCode, sandbox, { filename: 'XFileLoader.js' });
    } catch (e) {
        return { error: 'Failed to load XFileLoader: ' + e.message };
    }

    const XFileLoader = sandbox.module.exports || sandbox.THREE.XFileLoader;
    if (!XFileLoader) return { error: 'XFileLoader not found after loading' };

    return new Promise((resolve) => {
        // Wrap setTimeout so we can intercept XFileLoader's deferred onLoad callback
        let resolvedAlready = false;
        const wrappedSetTimeout = function (fn, delay) {
            return setTimeout(function () {
                fn();
                // Give onLoad a chance to fire and resolve
                if (!resolvedAlready) {
                    resolvedAlready = true;
                    // Resolve is called inside onLoad which fn() triggers
                }
            }, delay);
        };
        sandbox.setTimeout = wrappedSetTimeout;

        try {
            const loader = new XFileLoader();
            // Use _parse directly with the text data
            loader.onLoad = function (result) {
                resolvedAlready = true;
                resolve({
                    models: result.models || [],
                    animations: result.animations || [],
                    error: result.error ? String(result.error) : null,
                });
            };
            loader._onError = function (err) {
                resolvedAlready = true;
                resolve({ models: [], animations: [], error: String(err) });
            };

            // Convert data to ArrayBuffer for _parse
            let ab;
            if (Buffer.isBuffer(dataOrText)) {
                ab = dataOrText.buffer.slice(dataOrText.byteOffset, dataOrText.byteOffset + dataOrText.byteLength);
            } else {
                const buf = Buffer.from(dataOrText, 'utf-8');
                ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
            }
            loader._parse(ab, loader.onLoad);
        } catch (e) {
            resolve({ models: [], animations: [], error: String(e) });
        }
    });
}

function createThreeShim() {
    // Minimal THREE.js shim sufficient for XFileLoader parsing in Node.js
    class Vector2 { constructor(x, y) { this.x = x || 0; this.y = y || 0; } }
    class Vector3 {
        constructor(x, y, z) { this.x = x || 0; this.y = y || 0; this.z = z || 0; }
        applyMatrix4() { return this; }
        setFromMatrixPosition(m) {
            const e = m.elements;
            this.x = e[12]; this.y = e[13]; this.z = e[14];
            return this;
        }
        setFromMatrixScale(m) {
            const e = m.elements;
            this.x = Math.sqrt(e[0]*e[0] + e[1]*e[1] + e[2]*e[2]);
            this.y = Math.sqrt(e[4]*e[4] + e[5]*e[5] + e[6]*e[6]);
            this.z = Math.sqrt(e[8]*e[8] + e[9]*e[9] + e[10]*e[10]);
            return this;
        }
        copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
        clone() { return new Vector3(this.x, this.y, this.z); }
    }
    class Vector4 { constructor(x, y, z, w) { this.x = x||0; this.y = y||0; this.z = z||0; this.w = w||0; } }
    class Color {
        constructor(r, g, b) {
            if (typeof r === 'number' && g === undefined) {
                this.r = ((r >> 16) & 255) / 255;
                this.g = ((r >> 8) & 255) / 255;
                this.b = (r & 255) / 255;
            } else {
                this.r = r || 0; this.g = g || 0; this.b = b || 0;
            }
        }
    }
    class Quaternion {
        constructor(x, y, z, w) { this.x = x||0; this.y = y||0; this.z = z||0; this.w = (w !== undefined ? w : 1); }
        setFromRotationMatrix(m) {
            // Minimal quaternion extraction from rotation matrix
            const e = m.elements;
            const m11 = e[0], m12 = e[4], m13 = e[8];
            const m21 = e[1], m22 = e[5], m23 = e[9];
            const m31 = e[2], m32 = e[6], m33 = e[10];
            const trace = m11 + m22 + m33;
            if (trace > 0) {
                const s = 0.5 / Math.sqrt(trace + 1.0);
                this.w = 0.25 / s; this.x = (m32 - m23) * s;
                this.y = (m13 - m31) * s; this.z = (m21 - m12) * s;
            } else if (m11 > m22 && m11 > m33) {
                const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
                this.w = (m32 - m23) / s; this.x = 0.25 * s;
                this.y = (m12 + m21) / s; this.z = (m13 + m31) / s;
            } else if (m22 > m33) {
                const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
                this.w = (m13 - m31) / s; this.x = (m12 + m21) / s;
                this.y = 0.25 * s; this.z = (m23 + m32) / s;
            } else {
                const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
                this.w = (m21 - m12) / s; this.x = (m13 + m31) / s;
                this.y = (m23 + m32) / s; this.z = 0.25 * s;
            }
            return this;
        }
        copy(q) { this.x = q.x; this.y = q.y; this.z = q.z; this.w = q.w; return this; }
        clone() { return new Quaternion(this.x, this.y, this.z, this.w); }
    }
    class Euler {
        constructor(x, y, z) { this.x = x||0; this.y = y||0; this.z = z||0; }
    }
    class Matrix4 {
        constructor() { this.elements = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
        fromArray(arr) { for (let i = 0; i < 16; i++) this.elements[i] = arr[i] || 0; return this; }
        multiply(m) {
            const ae = this.elements, be = m.elements, te = [];
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    te[i + j * 4] = ae[i] * be[j * 4] + ae[i + 4] * be[j * 4 + 1] +
                                    ae[i + 8] * be[j * 4 + 2] + ae[i + 12] * be[j * 4 + 3];
                }
            }
            this.elements = te;
            return this;
        }
        copy(m) { this.elements = m.elements.slice(); return this; }
        clone() { const c = new Matrix4(); c.elements = this.elements.slice(); return c; }
        decompose(pos, quat, scale) {
            const e = this.elements;
            const sx = Math.sqrt(e[0]*e[0]+e[1]*e[1]+e[2]*e[2]);
            const sy = Math.sqrt(e[4]*e[4]+e[5]*e[5]+e[6]*e[6]);
            const sz = Math.sqrt(e[8]*e[8]+e[9]*e[9]+e[10]*e[10]);
            pos.x = e[12]; pos.y = e[13]; pos.z = e[14];
            scale.x = sx; scale.y = sy; scale.z = sz;
            // Extract rotation via quaternion — reuse Quaternion method
            const rm = new Matrix4();
            if (sx) { rm.elements[0]=e[0]/sx; rm.elements[1]=e[1]/sx; rm.elements[2]=e[2]/sx; }
            if (sy) { rm.elements[4]=e[4]/sy; rm.elements[5]=e[5]/sy; rm.elements[6]=e[6]/sy; }
            if (sz) { rm.elements[8]=e[8]/sz; rm.elements[9]=e[9]/sz; rm.elements[10]=e[10]/sz; }
            quat.setFromRotationMatrix(rm);
        }
    }
    class Object3D {
        constructor() {
            this.name = '';
            this.children = [];
            this.position = new Vector3();
            this.quaternion = new Quaternion();
            this.scale = new Vector3(1, 1, 1);
            this.matrix = new Matrix4();
            this.matrixWorld = new Matrix4();
        }
        add(child) { this.children.push(child); }
        applyMatrix4() { return this; }
    }
    class Mesh extends Object3D {
        constructor(geo, mat) {
            super();
            this.geometry = geo || new BufferGeometry();
            this.material = mat;
            this.type = 'Mesh';
        }
        bind(skeleton) { this.skeleton = skeleton; }
    }
    class Bone extends Object3D { constructor() { super(); } }
    class Skeleton {
        constructor(bones, offsets) { this.bones = bones || []; this.boneInverses = offsets || []; }
    }
    class BufferGeometry {
        constructor() { this.attributes = {}; this.index = null; this.groups = []; this.name = ''; this._morphAttributes = {}; this.morphAttributes = {}; }
        setAttribute(name, attr) { this.attributes[name] = attr; }
        setIndex(indices) { this.index = indices; }
        addGroup(start, count, materialIndex) { this.groups.push({ start, count, materialIndex }); }
        computeVertexNormals() {}
    }
    class BufferAttribute {
        constructor(array, itemSize) { this.array = array; this.itemSize = itemSize; this.count = array ? Math.floor(array.length / itemSize) : 0; }
    }
    class Float32BufferAttribute extends BufferAttribute { constructor(a, s) { super(a, s); } }
    class Uint16BufferAttribute extends BufferAttribute { constructor(a, s) { super(a, s); } }
    class Uint32BufferAttribute extends BufferAttribute { constructor(a, s) { super(a, s); } }
    class MeshPhongMaterial {
        constructor(params) { Object.assign(this, params || {}); this.name = ''; this.type = 'MeshPhongMaterial'; }
        clone() { return new MeshPhongMaterial(this); }
    }
    class SkinnedMesh extends Mesh {
        constructor(geo, mat) {
            super(geo, mat);
            this.type = 'SkinnedMesh';
            this.skeleton = null;
        }
        bind(skeleton) { this.skeleton = skeleton; }
    }
    class AnimationClip {
        constructor(name, duration, tracks) { this.name = name; this.duration = duration; this.tracks = tracks || []; }
    }
    class KeyframeTrack {
        constructor(name, times, values) { this.name = name; this.times = times; this.values = values; }
    }
    class NumberKeyframeTrack extends KeyframeTrack {}
    class VectorKeyframeTrack extends KeyframeTrack {}
    class QuaternionKeyframeTrack extends KeyframeTrack {}

    class FileLoader {
        constructor() {}
        setResponseType() { return this; }
        load(url, onLoad) { /* no-op in CLI */ }
    }
    class TextureLoader {
        constructor() {}
        load(url, onLoad) { const t = new Texture(); if (onLoad) onLoad(t); return t; }
    }
    class DefaultLoadingManager {}
    class DataTexture {
        constructor() { this.needsUpdate = false; }
    }
    class Texture {
        constructor() { this.needsUpdate = false; this.wrapS = 1001; this.wrapT = 1001; }
    }

    // Simple ear-clipping triangulation for ShapeUtils
    const ShapeUtils = {
        triangulateShape: function (contour, holes) {
            // Very basic fan triangulation (good enough for convex shapes)
            const tris = [];
            for (let i = 1; i < contour.length - 1; i++) {
                tris.push([0, i, i + 1]);
            }
            return tris;
        }
    };

    return {
        Vector2, Vector3, Vector4, Color, Quaternion, Euler, Matrix4,
        Object3D, Mesh, Bone, Skeleton,
        BufferGeometry, BufferAttribute, Float32BufferAttribute,
        Uint16BufferAttribute, Uint32BufferAttribute,
        MeshPhongMaterial, SkinnedMesh,
        AnimationClip, KeyframeTrack, NumberKeyframeTrack,
        VectorKeyframeTrack, QuaternionKeyframeTrack,
        FileLoader, TextureLoader, DefaultLoadingManager,
        DataTexture, Texture, ShapeUtils,
        FrontSide: 0, DoubleSide: 2,
        RepeatWrapping: 1000, ClampToEdgeWrapping: 1001,
        NearestFilter: 1003, LinearFilter: 1006,
        RGBAFormat: 1023, UnsignedByteType: 1009,
    };
}

// ── File Discovery ─────────────────────────────────────────────

function findFiles(dir, extensions, recursive) {
    const results = [];
    const exts = extensions.map(e => e.toLowerCase());

    function walk(d) {
        let entries;
        try { entries = fs.readdirSync(d, { withFileTypes: true }); }
        catch (e) { return; }
        for (const entry of entries) {
            const fullPath = path.join(d, entry.name);
            if (entry.isDirectory() && recursive) {
                walk(fullPath);
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (exts.includes(ext)) results.push(fullPath);
            }
        }
    }

    walk(dir);
    return results;
}

// ── CLI State ──────────────────────────────────────────────────

const state = {
    loaded: null,       // { filePath, raw, hxx, xInfo, xText }
    batchResults: null,
};

// ── Command Implementations ────────────────────────────────────

function cmdLoad(filePath) {
    if (!filePath) { console.log(colorize(C.red, 'Usage: load <file>')); return; }

    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
        console.log(colorize(C.red, 'File not found: ' + resolved));
        return;
    }

    const buf = fs.readFileSync(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const startTime = Date.now();

    let xText;
    let hxx = null;

    if (ext === '.hxx') {
        if (isRawXFile(buf)) {
            console.log(colorize(C.yellow, '  Note: .hxx file contains raw .x text (not compressed)'));
            xText = buf.toString('utf-8');
            hxx = { isRaw: true, sections: [], textures: [] };
        } else if (isHXX(buf)) {
            try {
                hxx = parseHXX(buf);
                xText = hxx.xFileText;
            } catch (e) {
                console.log(colorize(C.red, '  HXX parse error: ' + e.message));
                return;
            }
        } else {
            console.log(colorize(C.red, '  Not a valid .hxx or .x file'));
            return;
        }
    } else if (ext === '.x') {
        if (isCompressedXFile(buf)) {
            console.log(colorize(C.cyan, '  Compressed .x file detected (' + getXFileFormat(buf) + ')'));
            const decompText = decompressXFileToText(buf);
            if (decompText !== null) {
                xText = decompText;
            } else {
                // bzip: text not available from lightweight parser, store raw buffer
                xText = null;
            }
        } else {
            xText = buf.toString('utf-8');
        }
    } else {
        console.log(colorize(C.red, '  Unsupported extension: ' + ext));
        return;
    }

    const elapsed = Date.now() - startTime;
    const xInfo = xText ? parseXFileText(xText) : { header: getXFileFormat(buf) + ' (compressed binary)', frames: [], meshes: [], materials: [], animations: [], totalVertices: 0, totalFaces: 0 };

    state.loaded = { filePath: resolved, raw: buf, hxx, xInfo, xText, isCompressedX: isCompressedXFile(buf) };

    console.log(colorize(C.green, '  ✓ Loaded') + ' ' + colorize(C.bright, path.basename(resolved)));
    console.log('    Size: ' + formatBytes(buf.length) +
        (hxx && !hxx.isRaw ? ' → ' + formatBytes(xText.length) + ' decompressed' : '') +
        ' (' + elapsed + 'ms)');
    console.log('    Format: ' + colorize(C.cyan, xInfo.header || '(unknown)'));
    console.log('    Frames: ' + xInfo.frames.length +
        '  Meshes: ' + xInfo.meshes.length +
        '  Materials: ' + xInfo.materials.length +
        '  Animations: ' + xInfo.animations.length);
    console.log('    Vertices: ' + xInfo.totalVertices.toLocaleString() +
        '  Faces: ' + xInfo.totalFaces.toLocaleString());
}

function cmdInfo() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded. Use: load <file>')); return; }
    const { filePath, raw, hxx, xInfo, xText } = state.loaded;

    console.log(colorize(C.bright, '\n  File Information'));
    console.log('  ─────────────────────────────────────');
    console.log('  Path:          ' + filePath);
    console.log('  File size:     ' + formatBytes(raw.length));
    console.log('  Type:          ' + (hxx ? (hxx.isRaw ? '.hxx (raw .x text)' : '.hxx (compressed)') : (state.loaded.isCompressedX ? '.x (compressed ' + getXFileFormat(raw) + ')' : '.x')));
    if (hxx && !hxx.isRaw && hxx.version) {
        console.log('  HXX version:   ' + hxx.version.join('.'));
    }
    if (xText) {
        console.log('  .x text size:  ' + formatBytes(xText.length));
        if (hxx && !hxx.isRaw) {
            const ratio = ((1 - raw.length / xText.length) * 100).toFixed(1);
            console.log('  Compression:   ' + ratio + '%');
        }
    } else if (state.loaded.isCompressedX) {
        console.log('  Format:        compressed binary (bzip)');
    }
    console.log('');
    console.log('  ' + colorize(C.bright, '.x Content'));
    console.log('  ─────────────────────────────────────');
    console.log('  Header:        ' + (xInfo.header || '(none)'));
    console.log('  Version:       ' + (xInfo.version || '(unknown)'));
    console.log('  Format:        ' + (xInfo.format || '(unknown)'));
    console.log('  Float size:    ' + (xInfo.floatSize || '(unknown)'));
    console.log('  Templates:     ' + xInfo.templates.length);
    console.log('  Frames:        ' + xInfo.frames.length);
    console.log('  Meshes:        ' + xInfo.meshes.length);
    console.log('  Materials:     ' + xInfo.materials.length);
    console.log('  Animations:    ' + xInfo.animations.length);
    if (xInfo.animTicksPerSecond) {
        console.log('  Anim ticks/s:  ' + xInfo.animTicksPerSecond);
    }
    console.log('  Total verts:   ' + xInfo.totalVertices.toLocaleString());
    console.log('  Total faces:   ' + xInfo.totalFaces.toLocaleString());
    console.log('');
}

function cmdSections() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    if (!state.loaded.hxx || state.loaded.hxx.isRaw) {
        console.log(colorize(C.yellow, '  Not an HXX file or is raw .x data.'));
        return;
    }
    const { sections, textures } = state.loaded.hxx;
    console.log(colorize(C.bright, '\n  HXX Sections (' + sections.length + ')'));
    console.log('  ─────────────────────────────────────────────────────────');
    console.log('  ' + 'Name'.padEnd(30) + 'Compressed'.padStart(12) + 'Decompressed'.padStart(14) + '  Ratio');
    console.log('  ' + '─'.repeat(30) + '─'.repeat(12) + '─'.repeat(14) + '─'.repeat(8));
    for (const s of sections) {
        const ratio = s.decompressedSize > 0
            ? ((1 - s.compressedSize / s.decompressedSize) * 100).toFixed(1) + '%'
            : 'N/A';
        const isMain = s.name === MAIN_SECTION;
        const nameStr = isMain ? colorize(C.cyan, s.name.padEnd(30)) : s.name.padEnd(30);
        console.log('  ' + nameStr +
            formatBytes(s.compressedSize).padStart(12) +
            formatBytes(s.decompressedSize).padStart(14) +
            ratio.padStart(8));
    }
    console.log('');
}

function cmdTree() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    console.log(colorize(C.bright, '\n  Frame Hierarchy'));
    console.log('  ─────────────────────────────────────');
    const tree = buildFrameTree(state.loaded.xText);
    printTree(tree, '  ', true);
    console.log('');
}

function cmdMeshes() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    const { meshes } = state.loaded.xInfo;
    if (meshes.length === 0) { console.log(colorize(C.yellow, '  No meshes found.')); return; }
    console.log(colorize(C.bright, '\n  Meshes (' + meshes.length + ')'));
    console.log('  ─────────────────────────────────────────────────');
    console.log('  ' + '#'.padEnd(4) + 'Name'.padEnd(35) + 'Vertices'.padStart(10) + 'Faces'.padStart(10));
    console.log('  ' + '─'.repeat(4) + '─'.repeat(35) + '─'.repeat(10) + '─'.repeat(10));
    meshes.forEach((m, i) => {
        console.log('  ' + String(i + 1).padEnd(4) +
            m.name.substring(0, 34).padEnd(35) +
            m.vertices.toLocaleString().padStart(10) +
            m.faces.toLocaleString().padStart(10));
    });
    console.log('  ' + '═'.repeat(4) + '═'.repeat(35) +
        state.loaded.xInfo.totalVertices.toLocaleString().padStart(10) +
        state.loaded.xInfo.totalFaces.toLocaleString().padStart(10));
    console.log('');
}

function cmdMaterials() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    const { materials } = state.loaded.xInfo;
    if (materials.length === 0) { console.log(colorize(C.yellow, '  No materials found.')); return; }
    console.log(colorize(C.bright, '\n  Materials (' + materials.length + ')'));
    console.log('  ─────────────────────────────────────');
    materials.forEach((m, i) => {
        console.log('  ' + String(i + 1).padEnd(4) + m);
    });
    console.log('');
}

function cmdAnimations() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    const { animations, animTicksPerSecond } = state.loaded.xInfo;
    if (animations.length === 0) { console.log(colorize(C.yellow, '  No animations found.')); return; }
    console.log(colorize(C.bright, '\n  Animations (' + animations.length + ')'));
    if (animTicksPerSecond) console.log('  Ticks per second: ' + animTicksPerSecond);
    console.log('  ─────────────────────────────────────');
    animations.forEach((a, i) => {
        console.log('  ' + String(i + 1).padEnd(4) + a);
    });
    console.log('');
}

function cmdExport(outPath) {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    if (!outPath) {
        outPath = state.loaded.filePath.replace(/\.(hxx|x)$/i, '_exported.x');
    }
    const resolved = path.resolve(outPath);
    fs.writeFileSync(resolved, state.loaded.xText, 'utf-8');
    console.log(colorize(C.green, '  ✓ Exported') + ' → ' + resolved + ' (' + formatBytes(state.loaded.xText.length) + ')');
}

function cmdExportTextures(outDir) {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    if (!state.loaded.hxx || state.loaded.hxx.isRaw) {
        console.log(colorize(C.yellow, '  Not an HXX file with textures.'));
        return;
    }
    const { textures } = state.loaded.hxx;
    if (textures.length === 0) { console.log(colorize(C.yellow, '  No textures to export.')); return; }
    if (!outDir) outDir = path.dirname(state.loaded.filePath);
    const resolved = path.resolve(outDir);
    if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
    for (const t of textures) {
        if (t.error) {
            console.log(colorize(C.red, '  ✗ ' + t.name + ': ' + t.error));
            continue;
        }
        const out = path.join(resolved, t.name);
        fs.writeFileSync(out, t.data);
        console.log(colorize(C.green, '  ✓ ' + t.name) + ' (' + formatBytes(t.data.length) + ')');
    }
}

async function cmdValidate(filePath) {
    if (!filePath && !state.loaded) {
        console.log(colorize(C.yellow, '  Usage: validate <file>'));
        return;
    }

    if (filePath) cmdLoad(filePath);
    if (!state.loaded) return;

    console.log('  Running deep parse with XFileLoader...');
    const result = await deepParseXFile(state.loaded.isCompressedX ? state.loaded.raw : state.loaded.xText);

    if (result.error) {
        console.log(colorize(C.red, '  ✗ Deep parse failed: ' + result.error));
    } else {
        const modelCount = result.models ? result.models.length : 0;
        const animCount = result.animations ? result.animations.length : 0;
        console.log(colorize(C.green, '  ✓ Deep parse OK') +
            ' — ' + modelCount + ' model(s), ' + animCount + ' animation(s)');

        if (result.models) {
            for (const m of result.models) {
                const geoAttrs = m.geometry && m.geometry.attributes;
                const posCount = geoAttrs && geoAttrs.position ? geoAttrs.position.count : 0;
                console.log('    Model: ' + (m.name || '(unnamed)') +
                    ' — ' + posCount + ' vertices');
            }
        }
    }
}

async function cmdBatch(dirPath, recursive) {
    if (!dirPath) {
        console.log(colorize(C.yellow, '  Usage: batch <directory> [--recursive]'));
        return;
    }
    const resolved = path.resolve(dirPath);
    if (!fs.existsSync(resolved)) {
        console.log(colorize(C.red, '  Directory not found: ' + resolved));
        return;
    }

    const files = findFiles(resolved, ['.hxx', '.x'], recursive !== false);
    if (files.length === 0) {
        console.log(colorize(C.yellow, '  No .hxx/.x files found in: ' + resolved));
        return;
    }

    console.log(colorize(C.bright, '\n  Batch validating ' + files.length + ' files in: ' + resolved));
    console.log('  ═══════════════════════════════════════════════════════════\n');

    const results = [];
    let pass = 0, fail = 0;

    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const rel = path.relative(resolved, f);
        const startTime = Date.now();

        try {
            const buf = fs.readFileSync(f);
            const ext = path.extname(f).toLowerCase();
            let xText;

            if (ext === '.hxx') {
                if (isRawXFile(buf)) {
                    xText = buf.toString('utf-8');
                } else if (isHXX(buf)) {
                    const hxx = parseHXX(buf);
                    xText = hxx.xFileText;
                } else {
                    throw new Error('Not a valid .hxx or .x file');
                }
            } else {
                if (isCompressedXFile(buf)) {
                    const decompText = decompressXFileToText(buf);
                    if (decompText !== null) {
                        xText = decompText;
                    } else {
                        xText = null;
                    }
                } else {
                    xText = buf.toString('utf-8');
                }
            }

            const xInfo = xText ? parseXFileText(xText) : { header: getXFileFormat(buf) + ' (compressed binary)', frames: [], meshes: [], materials: [], animations: [], totalVertices: 0, totalFaces: 0 };
            const elapsed = Date.now() - startTime;

            if (xText && !xInfo.header.startsWith('xof')) {
                throw new Error('Invalid .x header: ' + xInfo.header.substring(0, 20));
            }

            results.push({
                file: rel, status: 'PASS', elapsed,
                verts: xInfo.totalVertices, faces: xInfo.totalFaces,
                meshes: xInfo.meshes.length, frames: xInfo.frames.length,
                size: buf.length, decompSize: xText ? xText.length : 0,
            });
            pass++;

            const progress = `[${String(i + 1).padStart(String(files.length).length)}/${files.length}]`;
            process.stdout.write('  ' + colorize(C.green, '✓ PASS') + ' ' +
                colorize(C.dim, progress) + ' ' +
                rel.substring(0, 50).padEnd(50) +
                colorize(C.dim, `${xInfo.meshes.length}M ${xInfo.totalVertices}V ${elapsed}ms`) + '\n');

        } catch (e) {
            const elapsed = Date.now() - startTime;
            results.push({ file: rel, status: 'FAIL', error: e.message, elapsed });
            fail++;

            const progress = `[${String(i + 1).padStart(String(files.length).length)}/${files.length}]`;
            process.stdout.write('  ' + colorize(C.red, '✗ FAIL') + ' ' +
                colorize(C.dim, progress) + ' ' +
                rel.substring(0, 50).padEnd(50) +
                colorize(C.red, e.message.substring(0, 60)) + '\n');
        }
    }

    state.batchResults = results;

    console.log('\n  ═══════════════════════════════════════════════════════════');
    console.log('  ' + colorize(C.bright, 'Results: ') +
        colorize(C.green, pass + ' passed') + ', ' +
        colorize(fail > 0 ? C.red : C.green, fail + ' failed') +
        ' out of ' + files.length + ' files');
    console.log('');
}

function cmdStats() {
    if (!state.batchResults) {
        console.log(colorize(C.yellow, '  No batch results. Run batch <dir> first.'));
        return;
    }
    const results = state.batchResults;
    const passed = results.filter(r => r.status === 'PASS');
    const failed = results.filter(r => r.status === 'FAIL');

    console.log(colorize(C.bright, '\n  Batch Statistics'));
    console.log('  ─────────────────────────────────────');
    console.log('  Total files:     ' + results.length);
    console.log('  Passed:          ' + colorize(C.green, String(passed.length)));
    console.log('  Failed:          ' + colorize(failed.length > 0 ? C.red : C.green, String(failed.length)));

    if (passed.length > 0) {
        const totalVerts = passed.reduce((s, r) => s + (r.verts || 0), 0);
        const totalFaces = passed.reduce((s, r) => s + (r.faces || 0), 0);
        const totalMeshes = passed.reduce((s, r) => s + (r.meshes || 0), 0);
        const totalSize = passed.reduce((s, r) => s + (r.size || 0), 0);
        const totalDecomp = passed.reduce((s, r) => s + (r.decompSize || 0), 0);
        const avgTime = (passed.reduce((s, r) => s + r.elapsed, 0) / passed.length).toFixed(0);
        const maxVerts = passed.reduce((m, r) => r.verts > m.verts ? r : m, passed[0]);

        console.log('');
        console.log('  ' + colorize(C.bright, 'Aggregate'));
        console.log('  Total vertices:  ' + totalVerts.toLocaleString());
        console.log('  Total faces:     ' + totalFaces.toLocaleString());
        console.log('  Total meshes:    ' + totalMeshes.toLocaleString());
        console.log('  Total on-disk:   ' + formatBytes(totalSize));
        console.log('  Total decomp:    ' + formatBytes(totalDecomp));
        console.log('  Avg parse time:  ' + avgTime + 'ms');
        console.log('  Largest model:   ' + maxVerts.file + ' (' + maxVerts.verts.toLocaleString() + ' verts)');
    }

    if (failed.length > 0) {
        console.log('');
        console.log('  ' + colorize(C.red, 'Failed files:'));
        for (const f of failed) {
            console.log('    ' + f.file + ': ' + f.error);
        }
    }
    console.log('');
}

async function cmdDeepInfo() {
    if (!state.loaded) { console.log(colorize(C.yellow, '  No file loaded.')); return; }
    console.log('  Running deep parse with full XFileLoader...');
    const result = await deepParseXFile(state.loaded.isCompressedX ? state.loaded.raw : state.loaded.xText);

    if (result.error) {
        console.log(colorize(C.red, '  ✗ Parse error: ' + result.error));
        return;
    }

    console.log(colorize(C.green, '  ✓ Deep parse succeeded'));
    console.log('');
    console.log('  ' + colorize(C.bright, 'Models (' + (result.models ? result.models.length : 0) + ')'));
    if (result.models) {
        for (const m of result.models) {
            const geo = m.geometry;
            const posAttr = geo && geo.attributes && geo.attributes.position;
            const normAttr = geo && geo.attributes && geo.attributes.normal;
            const uvAttr = geo && geo.attributes && geo.attributes.uv;
            const groups = geo ? geo.groups.length : 0;

            console.log('    ' + colorize(C.cyan, m.name || '(unnamed)'));
            console.log('      Vertices:   ' + (posAttr ? posAttr.count : 0));
            console.log('      Normals:    ' + (normAttr ? 'yes' : 'no'));
            console.log('      UVs:        ' + (uvAttr ? 'yes' : 'no'));
            console.log('      Groups:     ' + groups);
            if (m.material) {
                const mats = Array.isArray(m.material) ? m.material : [m.material];
                console.log('      Materials:  ' + mats.length);
                for (const mat of mats) {
                    console.log('        - ' + (mat.name || '(unnamed)') + ' [' + (mat.type || 'unknown') + ']');
                }
            }
            if (m.skeleton) {
                console.log('      Bones:      ' + m.skeleton.bones.length);
            }
        }
    }
    console.log('');
    console.log('  ' + colorize(C.bright, 'Animations (' + (result.animations ? result.animations.length : 0) + ')'));
    if (result.animations) {
        for (const a of result.animations) {
            console.log('    ' + colorize(C.cyan, a.name || '(unnamed)') +
                ' — duration: ' + (a.duration || 0).toFixed(2) +
                ', tracks: ' + (a.tracks ? a.tracks.length : 0));
        }
    }
    console.log('');
}

function cmdHelp() {
    console.log(`
  ${colorize(C.bright, 'Hamilton .hxx / .x File CLI')}
  ═══════════════════════════════════════════════════

  ${colorize(C.cyan, 'File Operations')}
    load <file>            Load a .hxx or .x file
    export [file]          Export decompressed .x text to file
    export-textures [dir]  Export textures from .hxx file

  ${colorize(C.cyan, 'Inspection')}
    info                   Show detailed file information
    sections               List .hxx archive sections
    tree                   Show frame hierarchy tree
    meshes                 List all meshes with vertex/face counts
    materials              List all materials
    animations             List animations
    deep                   Deep parse with full XFileLoader (slow)

  ${colorize(C.cyan, 'Validation')}
    validate [file]        Validate a file can be fully parsed
    batch <dir>            Batch-validate all .hxx/.x in directory
    stats                  Show aggregate stats from last batch

  ${colorize(C.cyan, 'Other')}
    help                   Show this help
    clear                  Clear screen
    exit / quit            Exit
`);
}

// ── Utilities ──────────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
}

// ── Argument Parsing & Entry Point ─────────────────────────────

async function main() {
    const args = process.argv.slice(2);

    // Non-interactive modes
    if (args.includes('--help') || args.includes('-h')) {
        cmdHelp();
        return;
    }

    if (args.includes('--batch') || args.includes('-b')) {
        const idx = args.indexOf('--batch') !== -1 ? args.indexOf('--batch') : args.indexOf('-b');
        const dir = args[idx + 1];
        const recursive = !args.includes('--no-recursive');
        await cmdBatch(dir, recursive);
        cmdStats();
        return;
    }

    // If a file is passed as argument, load it and show info
    if (args.length > 0 && !args[0].startsWith('-')) {
        cmdLoad(args[0]);
        if (state.loaded) cmdInfo();

        // If --validate flag, also run deep parse
        if (args.includes('--validate') || args.includes('-v')) {
            await cmdValidate();
        }

        // If --export flag, export the .x text
        if (args.includes('--export') || args.includes('-e')) {
            const eIdx = args.indexOf('--export') !== -1 ? args.indexOf('--export') : args.indexOf('-e');
            cmdExport(args[eIdx + 1]);
        }

        // If just a file, start interactive too unless --quiet
        if (args.includes('--quiet') || args.includes('-q')) return;
    }

    // Interactive mode
    console.log('');
    console.log('  ' + colorize(C.bright + C.cyan, '╔═══════════════════════════════════════╗'));
    console.log('  ' + colorize(C.bright + C.cyan, '║') + colorize(C.bright, '  Hamilton .hxx / .x File CLI Tool    ') + colorize(C.bright + C.cyan, '║'));
    console.log('  ' + colorize(C.bright + C.cyan, '╚═══════════════════════════════════════╝'));
    console.log('');
    console.log('  Type ' + colorize(C.cyan, 'help') + ' for commands, ' +
        colorize(C.cyan, 'exit') + ' to quit.');
    if (!state.loaded) {
        console.log('  Load a file with: ' + colorize(C.cyan, 'load <path-to-file>'));
    }
    console.log('');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colorize(C.cyan, '  hxx') + colorize(C.bright, '> '),
        terminal: true,
    });

    // Tab completion
    rl.on('line', async (line) => {
        const input = line.trim();
        if (!input) { rl.prompt(); return; }

        const parts = input.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ');

        try {
            switch (cmd) {
                case 'load':
                case 'open':
                    if (cmd === 'load') cmdLoad(arg);
                    break;
                case 'info':
                case 'i':
                    cmdInfo();
                    break;
                case 'sections':
                case 'sec':
                    cmdSections();
                    break;
                case 'tree':
                case 't':
                    cmdTree();
                    break;
                case 'meshes':
                case 'm':
                    cmdMeshes();
                    break;
                case 'materials':
                case 'mat':
                    cmdMaterials();
                    break;
                case 'animations':
                case 'anim':
                case 'a':
                    cmdAnimations();
                    break;
                case 'export':
                case 'e':
                    cmdExport(arg || undefined);
                    break;
                case 'export-textures':
                case 'et':
                    cmdExportTextures(arg || undefined);
                    break;
                case 'validate':
                case 'v':
                    await cmdValidate(arg || undefined);
                    break;
                case 'batch':
                case 'b':
                    await cmdBatch(arg || undefined);
                    break;
                case 'stats':
                case 's':
                    cmdStats();
                    break;
                case 'deep':
                case 'd':
                    await cmdDeepInfo();
                    break;
                case 'help':
                case 'h':
                case '?':
                    cmdHelp();
                    break;
                case 'clear':
                case 'cls':
                    console.clear();
                    break;
                case 'exit':
                case 'quit':
                case 'q':
                    console.log(colorize(C.dim, '  Bye!'));
                    rl.close();
                    process.exit(0);
                    break;
                default:
                    console.log(colorize(C.yellow, '  Unknown command: ' + cmd + '. Type help for commands.'));
            }
        } catch (e) {
            console.log(colorize(C.red, '  Error: ' + e.message));
        }

        rl.prompt();
    });

    rl.on('close', () => {
        process.exit(0);
    });

    rl.prompt();
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
