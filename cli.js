#!/usr/bin/env node
/* ================================================================
   Hamilton .hxx / .x File CLI Tool  — Full-Parity Edition
   ================================================================
   Complete command-line interface providing 1:1 feature parity
   with the browser GUI: load/inspect .hxx/.x files, convert 3D
   formats to .x, export .x to OBJ/STL/GLB, and generate .x
   labware models from XML definitions.

   NON-INTERACTIVE (one-shot) USAGE
   ─────────────────────────────────
   node cli.js --help
   node cli.js <file>                        view info
   node cli.js <file> --validate             deep parse
   node cli.js <file> --export [out.x]       export decompressed .x

   node cli.js convert <in> <out.x> [opts]  convert OBJ/STL/GLB/X → .x
       --rotate-x <deg>   rotate around X axis
       --rotate-y <deg>   rotate around Y axis
       --rotate-z <deg>   rotate around Z axis
       --mirror-x         mirror on X axis
       --mirror-y         mirror on Y axis
       --mirror-z         mirror on Z axis

   node cli.js export-x <in.x|hxx> <out> [--format obj|stl|glb]
                                           export .x/.hxx → OBJ/STL/GLB

   node cli.js generate <labware.xml> [out.x] [--sbs]
                                           XML labware definition → .x
   node cli.js generate-default [out.x] [opts]
       --rows <n>         number of rows      (default 8)
       --cols <n>         number of columns   (default 12)
       --name <name>      labware name
       --well-shape circle|rect
       --bottom-shape flat|circle|vshape
       --height <mm>
       --well-depth <mm>
       --well-size <mm>
       --row-gap <mm>
       --col-gap <mm>
       --first-x <mm>
       --first-y <mm>
       --sbs              snap footprint/spacing to SBS/ANSI standard

   node cli.js --batch <dir> [--recursive]  batch validate all files
   node cli.js <file> --quiet               load without interactive

   INTERACTIVE MODE
   ─────────────────
   node cli.js                  start interactive prompt

   Inspection commands:
     load <file>          load .hxx or .x
     info                 file information
     sections             archive sections in .hxx
     tree                 frame hierarchy tree
     meshes               mesh list with vertex/face counts
     materials            material list
     animations           animation list
     deep                 deep parse via XFileLoader

   Export/conversion commands:
     export [out.x]            export decompressed .x text
     export-textures [dir]     extract embedded textures from .hxx
     export-x <out> [format]   export loaded file to OBJ/STL/GLB
                               format: obj (default), stl, glb
     convert <in> <out.x>      convert OBJ/STL/GLB/X → .x
       Options (append to command):
         --rotate-x <deg>  --rotate-y <deg>  --rotate-z <deg>
         --mirror-x  --mirror-y  --mirror-z
     generate <xml> [out.x]    generate .x from labware XML
     generate-default [out.x]  generate .x with default/SBS plate
       (interactive prompts for parameters)

   Validation:
     validate [file]      validate + deep parse
     batch <dir>          batch-validate directory
     stats                aggregate batch stats

   Other:
     help  clear  exit/quit
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

// ── OBJ Parser (Node.js, no THREE dependency) ──────────────────

/**
 * Parse an OBJ text file and optional MTL text.
 * Returns an array of mesh objects: { name, vertices[], faces[], normals[], uvs[], material }
 * where vertices = [{x,y,z}], faces = [{v:[i,i,i], vn:[i,i,i], vt:[i,i,i]}],
 * normals = [{x,y,z}], uvs = [{u,v}], material = {name,r,g,b,a,sr,sg,sb,power}
 */
function parseOBJ(objText, mtlText) {
    const positions = [];   // 1-indexed
    const normals = [];
    const uvs = [];
    const materials = {};   // name → {r,g,b,a,sr,sg,sb,power}
    const groups = [];      // [{name, materialName, faces:[{vi,ni,ti}[]]}]

    // Parse MTL first
    if (mtlText) {
        let curMat = null;
        for (const rawLine of mtlText.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const parts = line.split(/\s+/);
            const tok = parts[0].toLowerCase();
            if (tok === 'newmtl') {
                curMat = parts.slice(1).join(' ');
                materials[curMat] = { r: 0.7, g: 0.7, b: 0.7, a: 1.0, sr: 0, sg: 0, sb: 0, power: 1 };
            } else if (curMat) {
                if (tok === 'kd' && parts.length >= 4) {
                    materials[curMat].r = parseFloat(parts[1]) || 0;
                    materials[curMat].g = parseFloat(parts[2]) || 0;
                    materials[curMat].b = parseFloat(parts[3]) || 0;
                } else if (tok === 'ks' && parts.length >= 4) {
                    materials[curMat].sr = parseFloat(parts[1]) || 0;
                    materials[curMat].sg = parseFloat(parts[2]) || 0;
                    materials[curMat].sb = parseFloat(parts[3]) || 0;
                } else if (tok === 'd') {
                    materials[curMat].a = parseFloat(parts[1]) || 1;
                } else if (tok === 'ns') {
                    materials[curMat].power = parseFloat(parts[1]) || 1;
                }
            }
        }
    }

    let currentGroup = { name: 'default', materialName: null, faces: [] };
    groups.push(currentGroup);

    for (const rawLine of objText.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const parts = line.split(/\s+/);
        const tok = parts[0].toLowerCase();

        if (tok === 'v') {
            positions.push({ x: parseFloat(parts[1]) || 0, y: parseFloat(parts[2]) || 0, z: parseFloat(parts[3]) || 0 });
        } else if (tok === 'vn') {
            normals.push({ x: parseFloat(parts[1]) || 0, y: parseFloat(parts[2]) || 0, z: parseFloat(parts[3]) || 0 });
        } else if (tok === 'vt') {
            uvs.push({ u: parseFloat(parts[1]) || 0, v: parseFloat(parts[2]) || 0 });
        } else if (tok === 'g' || tok === 'o') {
            const name = parts.slice(1).join(' ') || 'group';
            if (currentGroup.faces.length > 0) {
                currentGroup = { name, materialName: currentGroup.materialName, faces: [] };
                groups.push(currentGroup);
            } else {
                currentGroup.name = name;
            }
        } else if (tok === 'usemtl') {
            const matName = parts.slice(1).join(' ');
            if (currentGroup.faces.length > 0) {
                currentGroup = { name: currentGroup.name + '_' + matName, materialName: matName, faces: [] };
                groups.push(currentGroup);
            } else {
                currentGroup.materialName = matName;
            }
        } else if (tok === 'f') {
            // Triangulate fan
            const verts = parts.slice(1).map(token => {
                const sub = token.split('/');
                return {
                    vi: parseInt(sub[0]) || 0,
                    vt: parseInt(sub[1]) || 0,
                    vn: parseInt(sub[2]) || 0,
                };
            });
            for (let i = 1; i < verts.length - 1; i++) {
                currentGroup.faces.push([verts[0], verts[i], verts[i + 1]]);
            }
        }
    }

    // Convert groups to mesh objects with resolved, zero-indexed buffers
    return groups.filter(g => g.faces.length > 0).map(g => {
        const mat = g.materialName && materials[g.materialName]
            ? { ...materials[g.materialName], name: g.materialName }
            : { name: 'default', r: 0.7, g: 0.7, b: 0.7, a: 1.0, sr: 0, sg: 0, sb: 0, power: 1 };

        const vBuf = [], nBuf = [], uvBuf = [];
        const fBuf = []; // face index triples into vBuf

        for (const tri of g.faces) {
            const base = vBuf.length;
            for (const v of tri) {
                const vi = v.vi > 0 ? v.vi - 1 : (v.vi < 0 ? positions.length + v.vi : 0);
                const ni = v.vn > 0 ? v.vn - 1 : (v.vn < 0 ? normals.length + v.vn : -1);
                const ti = v.vt > 0 ? v.vt - 1 : (v.vt < 0 ? uvs.length + v.vt : -1);
                vBuf.push(positions[vi] || { x: 0, y: 0, z: 0 });
                nBuf.push(ni >= 0 ? normals[ni] : null);
                uvBuf.push(ti >= 0 ? uvs[ti] : null);
            }
            fBuf.push([base, base + 1, base + 2]);
        }

        return { name: g.name, vertices: vBuf, faces: fBuf, normals: nBuf, uvs: uvBuf, material: mat };
    });
}

// ── STL Parser (binary + ASCII, Node.js) ───────────────────────

function parseSTL(buf) {
    const header = buf.toString('ascii', 0, 80);
    const isBinary = !header.trimStart().toLowerCase().startsWith('solid') ||
                     buf.length > 84 && buf.readUInt32LE(80) * 50 + 84 === buf.length;

    const vertices = [], normals = [], faces = [];

    if (isBinary) {
        const triCount = buf.readUInt32LE(80);
        let off = 84;
        for (let i = 0; i < triCount; i++) {
            const nx = buf.readFloatLE(off);     const ny = buf.readFloatLE(off + 4);  const nz = buf.readFloatLE(off + 8);
            const ax = buf.readFloatLE(off + 12); const ay = buf.readFloatLE(off + 16); const az = buf.readFloatLE(off + 20);
            const bx = buf.readFloatLE(off + 24); const by = buf.readFloatLE(off + 28); const bz = buf.readFloatLE(off + 32);
            const cx = buf.readFloatLE(off + 36); const cy = buf.readFloatLE(off + 40); const cz = buf.readFloatLE(off + 44);
            off += 50;
            const base = vertices.length;
            vertices.push({ x: ax, y: ay, z: az });
            vertices.push({ x: bx, y: by, z: bz });
            vertices.push({ x: cx, y: cy, z: cz });
            normals.push({ x: nx, y: ny, z: nz }, { x: nx, y: ny, z: nz }, { x: nx, y: ny, z: nz });
            faces.push([base, base + 1, base + 2]);
        }
    } else {
        // ASCII STL
        const text = buf.toString('utf-8');
        const facetRe = /facet\s+normal\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)[\s\S]*?vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s*vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s*vertex\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)\s+([\d.eE+\-]+)/gi;
        let m;
        while ((m = facetRe.exec(text)) !== null) {
            const nx = parseFloat(m[1]), ny = parseFloat(m[2]), nz = parseFloat(m[3]);
            const base = vertices.length;
            vertices.push({ x: parseFloat(m[4]), y: parseFloat(m[5]), z: parseFloat(m[6]) });
            vertices.push({ x: parseFloat(m[7]), y: parseFloat(m[8]), z: parseFloat(m[9]) });
            vertices.push({ x: parseFloat(m[10]), y: parseFloat(m[11]), z: parseFloat(m[12]) });
            normals.push({ x: nx, y: ny, z: nz }, { x: nx, y: ny, z: nz }, { x: nx, y: ny, z: nz });
            faces.push([base, base + 1, base + 2]);
        }
    }

    const mat = { name: 'default', r: 0.7, g: 0.7, b: 0.7, a: 1.0, sr: 0.3, sg: 0.3, sb: 0.3, power: 30 };
    return [{ name: 'STLMesh', vertices, faces, normals, uvs: [], material: mat }];
}

// ── GLB/GLTF Parser (Node.js, extracts geometry only) ──────────

function parseGLB(buf) {
    if (buf.readUInt32LE(0) !== 0x46546C67) throw new Error('Not a valid GLB file');
    const jsonLen = buf.readUInt32LE(12);
    const jsonStr = buf.toString('utf-8', 20, 20 + jsonLen);
    const gltf = JSON.parse(jsonStr);
    const binStart = 20 + jsonLen + 8; // skip chunk header
    const binData = buf.slice(binStart);
    return extractGLTFMeshes(gltf, binData);
}

function parseGLTF(jsonText, binBuf) {
    const gltf = JSON.parse(jsonText);
    return extractGLTFMeshes(gltf, binBuf);
}

function extractGLTFMeshes(gltf, binData) {
    const meshes = [];

    function getAccessorData(accIdx) {
        if (accIdx === undefined || accIdx === null) return null;
        const acc = gltf.accessors[accIdx];
        const bv = gltf.bufferViews[acc.bufferView];
        const byteOffset = (bv.byteOffset || 0) + (acc.byteOffset || 0);
        const count = acc.count;
        const itemSize = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }[acc.type] || 1;
        const TypedArray = {
            5120: Int8Array, 5121: Uint8Array, 5122: Int16Array, 5123: Uint16Array,
            5125: Uint32Array, 5126: Float32Array,
        }[acc.componentType] || Float32Array;
        const ab = binData.buffer.slice(
            binData.byteOffset + byteOffset,
            binData.byteOffset + byteOffset + count * itemSize * TypedArray.BYTES_PER_ELEMENT
        );
        return { array: new TypedArray(ab), count, itemSize };
    }

    const materials = gltf.materials || [];

    (gltf.meshes || []).forEach((gMesh, mi) => {
        (gMesh.primitives || []).forEach((prim, pi) => {
            const posAcc = getAccessorData(prim.attributes && prim.attributes.POSITION);
            const normAcc = getAccessorData(prim.attributes && prim.attributes.NORMAL);
            const idxAcc = getAccessorData(prim.indices);
            if (!posAcc) return;

            const vertices = [];
            for (let i = 0; i < posAcc.count; i++) {
                vertices.push({ x: posAcc.array[i * 3], y: posAcc.array[i * 3 + 1], z: posAcc.array[i * 3 + 2] });
            }

            const normals = normAcc
                ? Array.from({ length: normAcc.count }, (_, i) => ({
                    x: normAcc.array[i * 3], y: normAcc.array[i * 3 + 1], z: normAcc.array[i * 3 + 2],
                }))
                : [];

            const faces = [];
            if (idxAcc) {
                for (let i = 0; i < idxAcc.count; i += 3) {
                    faces.push([idxAcc.array[i], idxAcc.array[i + 1], idxAcc.array[i + 2]]);
                }
            } else {
                for (let i = 0; i < posAcc.count; i += 3) {
                    faces.push([i, i + 1, i + 2]);
                }
            }

            let mat = { name: 'default', r: 0.7, g: 0.7, b: 0.7, a: 1, sr: 0, sg: 0, sb: 0, power: 1 };
            if (prim.material !== undefined && materials[prim.material]) {
                const gm = materials[prim.material];
                const pbr = gm.pbrMetallicRoughness || {};
                const bc = pbr.baseColorFactor || [0.7, 0.7, 0.7, 1];
                mat = { name: gm.name || 'mat' + prim.material, r: bc[0], g: bc[1], b: bc[2], a: bc[3], sr: 0, sg: 0, sb: 0, power: 1 };
            }

            meshes.push({ name: (gMesh.name || 'Mesh' + mi) + '_' + pi, vertices, faces, normals, uvs: [], material: mat });
        });
    });

    return meshes;
}

// ── Mesh Transform ──────────────────────────────────────────────

/**
 * Apply rotation (degrees) and/or mirror transform to mesh list in-place.
 * rotX/rotY/rotZ: degrees; mirrorX/mirrorY/mirrorZ: booleans
 */
function applyMeshTransforms(meshes, { rotX = 0, rotY = 0, rotZ = 0, mirrorX = false, mirrorY = false, mirrorZ = false } = {}) {
    const rx = rotX * Math.PI / 180;
    const ry = rotY * Math.PI / 180;
    const rz = rotZ * Math.PI / 180;

    function rotate(v, axis, angle) {
        const c = Math.cos(angle), s = Math.sin(angle);
        if (axis === 'x') return { x: v.x, y: v.y * c - v.z * s, z: v.y * s + v.z * c };
        if (axis === 'y') return { x: v.x * c + v.z * s, y: v.y, z: -v.x * s + v.z * c };
        return { x: v.x * c - v.y * s, y: v.x * s + v.y * c, z: v.z };
    }

    function transformVec(v) {
        let u = v;
        if (rx) u = rotate(u, 'x', rx);
        if (ry) u = rotate(u, 'y', ry);
        if (rz) u = rotate(u, 'z', rz);
        if (mirrorX) u = { x: -u.x, y: u.y, z: u.z };
        if (mirrorY) u = { x: u.x, y: -u.y, z: u.z };
        if (mirrorZ) u = { x: u.x, y: u.y, z: -u.z };
        return u;
    }

    const mirrorCount = [mirrorX, mirrorY, mirrorZ].filter(Boolean).length;
    const flipWinding = mirrorCount % 2 !== 0;

    for (const mesh of meshes) {
        mesh.vertices = mesh.vertices.map(transformVec);
        mesh.normals = mesh.normals.map(n => n ? transformVec(n) : n);
        if (flipWinding) {
            mesh.faces = mesh.faces.map(([a, b, c]) => [a, c, b]);
        }
    }
}

// ── X File Writer (from mesh list) ─────────────────────────────

const X_TEMPLATES = `template ColorRGBA {
  <35ff44e0-6c7c-11cf-8f52-0040333594a3>
  FLOAT red; FLOAT green; FLOAT blue; FLOAT alpha;
}

template ColorRGB {
  <d3e16e81-7835-11cf-8f52-0040333594a3>
  FLOAT red; FLOAT green; FLOAT blue;
}

template Material {
  <3d82ab4d-62da-11cf-ab39-0020af71e433>
  ColorRGBA faceColor; FLOAT power; ColorRGB specularColor; ColorRGB emissiveColor; [...]
}

template MeshMaterialList {
  <f6f23f42-7686-11cf-8f52-0040333594a3>
  DWORD nMaterials; DWORD nFaceIndexes; array DWORD faceIndexes[nFaceIndexes]; [Material <3d82ab4d-62da-11cf-ab39-0020af71e433>]
}

template Vector {
  <3d82ab5e-62da-11cf-ab39-0020af71e433>
  FLOAT x; FLOAT y; FLOAT z;
}

template MeshFace {
  <3d82ab5f-62da-11cf-ab39-0020af71e433>
  DWORD nFaceVertexIndices; array DWORD faceVertexIndices[nFaceVertexIndices];
}

template Mesh {
  <3d82ab44-62da-11cf-ab39-0020af71e433>
  DWORD nVertices; array Vector vertices[nVertices]; DWORD nFaces; array MeshFace faces[nFaces]; [...]
}

template MeshNormals {
  <f6f23f43-7686-11cf-8f52-0040333594a3>
  DWORD nNormals; array Vector normals[nNormals]; DWORD nFaceNormals; array MeshFace faceNormals[nFaceNormals];
}

template Coords2d {
  <f6f23f44-7686-11cf-8f52-0040333594a3>
  FLOAT u; FLOAT v;
}

template MeshTextureCoords {
  <f6f23f40-7686-11cf-8f52-0040333594a3>
  DWORD nTextureCoords; array Coords2d textureCoords[nTextureCoords];
}
`;

/**
 * Generate .x file text from an array of mesh objects.
 * Each mesh: { name, vertices:[{x,y,z}], faces:[[i,i,i]], normals:[{x,y,z}|null], uvs:[{u,v}|null], material }
 */
function meshesToXFile(meshes) {
    const lines = ['xof 0303txt 0032', '', X_TEMPLATES];

    meshes.forEach((mesh, mi) => {
        const meshName = (mesh.name || 'Mesh_' + mi).replace(/[^a-zA-Z0-9_]/g, '_');
        const verts = mesh.vertices;
        const faces = mesh.faces;
        const norms = mesh.normals;
        const uvs = mesh.uvs;
        const mat = mesh.material || { r: 0.7, g: 0.7, b: 0.7, a: 1.0, sr: 0, sg: 0, sb: 0, power: 1 };

        lines.push('Mesh ' + meshName + ' {');
        lines.push('  ' + verts.length + ';');
        verts.forEach((v, i) => {
            const sep = i < verts.length - 1 ? ',' : ';';
            lines.push('  ' + v.x.toFixed(6) + ';' + v.y.toFixed(6) + ';' + v.z.toFixed(6) + ';' + sep);
        });

        lines.push('  ' + faces.length + ';');
        faces.forEach((f, i) => {
            const sep = i < faces.length - 1 ? ',' : ';';
            lines.push('  3;' + f[0] + ',' + f[1] + ',' + f[2] + ';' + sep);
        });

        // Material list
        lines.push('  MeshMaterialList {');
        lines.push('    1;');
        lines.push('    ' + faces.length + ';');
        faces.forEach((_, i) => { lines.push('    0' + (i < faces.length - 1 ? ',' : ';')); });
        lines.push('    Material Material_' + mi + ' {');
        lines.push('      ' + mat.r.toFixed(6) + ';' + mat.g.toFixed(6) + ';' + mat.b.toFixed(6) + ';' + mat.a.toFixed(6) + ';;');
        lines.push('      ' + (mat.power || 1).toFixed(6) + ';');
        lines.push('      ' + (mat.sr || 0).toFixed(6) + ';' + (mat.sg || 0).toFixed(6) + ';' + (mat.sb || 0).toFixed(6) + ';;');
        lines.push('      0.000000;0.000000;0.000000;;');
        lines.push('    }');
        lines.push('  }');

        // Normals
        const validNorms = norms && norms.length === verts.length && norms.some(n => n);
        if (validNorms) {
            lines.push('  MeshNormals {');
            lines.push('    ' + norms.length + ';');
            norms.forEach((n, i) => {
                const nn = n || { x: 0, y: 1, z: 0 };
                lines.push('    ' + nn.x.toFixed(6) + ';' + nn.y.toFixed(6) + ';' + nn.z.toFixed(6) + ';' + (i < norms.length - 1 ? ',' : ';'));
            });
            lines.push('    ' + faces.length + ';');
            faces.forEach((f, i) => {
                lines.push('    3;' + f[0] + ',' + f[1] + ',' + f[2] + ';' + (i < faces.length - 1 ? ',' : ';'));
            });
            lines.push('  }');
        }

        // UVs
        const validUVs = uvs && uvs.length === verts.length && uvs.some(u => u);
        if (validUVs) {
            lines.push('  MeshTextureCoords {');
            lines.push('    ' + uvs.length + ';');
            uvs.forEach((uv, i) => {
                const u = uv || { u: 0, v: 0 };
                lines.push('    ' + u.u.toFixed(6) + ';' + u.v.toFixed(6) + ';' + (i < uvs.length - 1 ? ',' : ';'));
            });
            lines.push('  }');
        }

        lines.push('}');
        lines.push('');
    });

    return lines.join('\n');
}

// ── 3D Format → Mesh List loader ───────────────────────────────

/**
 * Load a 3D file (OBJ/STL/GLB/GLTF/.x/.hxx) and return a mesh list.
 * For .x/.hxx, uses the deep parser (XFileLoader shim) to get geometry.
 */
async function loadMeshesFromFile(filePath) {
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.stl') {
        return parseSTL(buf);
    }

    if (ext === '.glb') {
        return parseGLB(buf);
    }

    if (ext === '.gltf') {
        const text = buf.toString('utf-8');
        let binBuf = Buffer.alloc(0);
        const gltf = JSON.parse(text);
        // If external binary, try to load it from same dir
        if (gltf.buffers && gltf.buffers[0] && gltf.buffers[0].uri) {
            const binPath = path.join(path.dirname(filePath), gltf.buffers[0].uri);
            if (fs.existsSync(binPath)) binBuf = fs.readFileSync(binPath);
        }
        return parseGLTF(text, binBuf);
    }

    if (ext === '.obj') {
        const objText = buf.toString('utf-8');
        // Try to load companion .mtl
        const mtlMatch = objText.match(/^mtllib\s+(.+)$/m);
        let mtlText = null;
        if (mtlMatch) {
            const mtlPath = path.join(path.dirname(filePath), mtlMatch[1].trim());
            if (fs.existsSync(mtlPath)) mtlText = fs.readFileSync(mtlPath, 'utf-8');
        }
        return parseOBJ(objText, mtlText);
    }

    if (ext === '.x' || ext === '.hxx') {
        // Use deep parser to get THREE-like geometry, convert to mesh list
        let dataForParse;
        if (ext === '.hxx') {
            if (isRawXFile(buf)) {
                dataForParse = buf.toString('utf-8');
            } else if (isHXX(buf)) {
                const hxx = parseHXX(buf);
                dataForParse = hxx.xFileText;
            } else {
                throw new Error('Not a valid .hxx or .x file');
            }
        } else {
            if (isCompressedXFile(buf)) {
                const decompText = decompressXFileToText(buf);
                dataForParse = decompText !== null ? decompText : buf;
            } else {
                dataForParse = buf.toString('utf-8');
            }
        }

        const result = await deepParseXFile(dataForParse);
        if (result.error) throw new Error(result.error);

        return (result.models || []).map((m, i) => {
            const geo = m.geometry;
            const posAttr = geo && geo.attributes && geo.attributes.position;
            const normAttr = geo && geo.attributes && geo.attributes.normal;
            const uvAttr = geo && geo.attributes && geo.attributes.uv;
            if (!posAttr) return null;

            const vCount = posAttr.count;
            const vertices = Array.from({ length: vCount }, (_, vi) => ({
                x: posAttr.array[vi * 3], y: posAttr.array[vi * 3 + 1], z: posAttr.array[vi * 3 + 2],
            }));

            const normals = normAttr
                ? Array.from({ length: normAttr.count }, (_, vi) => ({
                    x: normAttr.array[vi * 3], y: normAttr.array[vi * 3 + 1], z: normAttr.array[vi * 3 + 2],
                }))
                : [];

            const uvs = uvAttr
                ? Array.from({ length: uvAttr.count }, (_, vi) => ({
                    u: uvAttr.array[vi * 2], v: uvAttr.array[vi * 2 + 1],
                }))
                : [];

            const faces = [];
            if (geo.index) {
                for (let f = 0; f < geo.index.array.length; f += 3) {
                    faces.push([geo.index.array[f], geo.index.array[f + 1], geo.index.array[f + 2]]);
                }
            } else {
                for (let f = 0; f < vCount; f += 3) {
                    faces.push([f, f + 1, f + 2]);
                }
            }

            // Extract material colour
            let mat = { name: 'default', r: 0.7, g: 0.7, b: 0.7, a: 1, sr: 0, sg: 0, sb: 0, power: 1 };
            if (m.material) {
                const src = Array.isArray(m.material) ? m.material[0] : m.material;
                if (src && src.color) {
                    mat = { name: src.name || 'mat', r: src.color.r || 0, g: src.color.g || 0, b: src.color.b || 0,
                            a: src.opacity !== undefined ? src.opacity : 1,
                            sr: src.specular ? src.specular.r : 0,
                            sg: src.specular ? src.specular.g : 0,
                            sb: src.specular ? src.specular.b : 0,
                            power: src.shininess || 1 };
                }
            }

            return { name: m.name || 'Mesh_' + i, vertices, faces, normals, uvs, material: mat };
        }).filter(Boolean);
    }

    throw new Error('Unsupported format: ' + ext);
}

// ── OBJ Exporter (from mesh list) ──────────────────────────────

function meshesToOBJ(meshes, baseName) {
    const lines = ['# Exported from Hamilton Direct3D Tools CLI', 'mtllib ' + baseName + '.mtl', ''];
    const mtlLines = ['# Material Library', ''];
    let vOff = 1, nOff = 1;

    meshes.forEach((mesh, mi) => {
        const matName = (mesh.material && mesh.material.name) ? mesh.material.name : 'Material_' + mi;
        const mat = mesh.material || { r: 0.7, g: 0.7, b: 0.7, a: 1, sr: 0, sg: 0, sb: 0, power: 1 };

        mtlLines.push('newmtl ' + matName);
        mtlLines.push('Kd ' + mat.r.toFixed(6) + ' ' + mat.g.toFixed(6) + ' ' + mat.b.toFixed(6));
        if (mat.sr || mat.sg || mat.sb) {
            mtlLines.push('Ks ' + (mat.sr || 0).toFixed(6) + ' ' + (mat.sg || 0).toFixed(6) + ' ' + (mat.sb || 0).toFixed(6));
        }
        mtlLines.push('d ' + (mat.a !== undefined ? mat.a : 1).toFixed(6));
        mtlLines.push('Ns ' + (mat.power !== undefined ? mat.power : 1).toFixed(6));
        mtlLines.push('');

        lines.push('g ' + (mesh.name || 'Mesh_' + mi));
        lines.push('usemtl ' + matName);
        mesh.vertices.forEach(v => { lines.push('v ' + v.x.toFixed(6) + ' ' + v.y.toFixed(6) + ' ' + v.z.toFixed(6)); });
        const hasNormals = mesh.normals && mesh.normals.length === mesh.vertices.length && mesh.normals.some(n => n);
        if (hasNormals) {
            mesh.normals.forEach(n => { const nn = n || { x: 0, y: 1, z: 0 }; lines.push('vn ' + nn.x.toFixed(6) + ' ' + nn.y.toFixed(6) + ' ' + nn.z.toFixed(6)); });
        }
        mesh.faces.forEach(f => {
            const i0 = f[0] + vOff, i1 = f[1] + vOff, i2 = f[2] + vOff;
            if (hasNormals) {
                const n0 = f[0] + nOff, n1 = f[1] + nOff, n2 = f[2] + nOff;
                lines.push('f ' + i0 + '//' + n0 + ' ' + i1 + '//' + n1 + ' ' + i2 + '//' + n2);
            } else {
                lines.push('f ' + i0 + ' ' + i1 + ' ' + i2);
            }
        });
        lines.push('');
        vOff += mesh.vertices.length;
        if (hasNormals) nOff += mesh.normals.length;
    });

    return { obj: lines.join('\n'), mtl: mtlLines.join('\n') };
}

// ── STL Exporter (binary, from mesh list) ─────────────────────

function meshesToSTL(meshes) {
    let totalTris = 0;
    meshes.forEach(m => { totalTris += m.faces.length; });

    const bufLen = 80 + 4 + totalTris * 50;
    const buffer = Buffer.alloc(bufLen);
    const headerStr = 'Exported from Hamilton Direct3D Tools CLI';
    Buffer.from(headerStr).copy(buffer, 0, 0, Math.min(headerStr.length, 80));
    buffer.writeUInt32LE(totalTris, 80);
    let off = 84;

    meshes.forEach(mesh => {
        mesh.faces.forEach(f => {
            const v0 = mesh.vertices[f[0]], v1 = mesh.vertices[f[1]], v2 = mesh.vertices[f[2]];
            const n = (mesh.normals && mesh.normals[f[0]]) || { x: 0, y: 1, z: 0 };
            buffer.writeFloatLE(n.x, off);     buffer.writeFloatLE(n.y, off + 4);  buffer.writeFloatLE(n.z, off + 8);
            buffer.writeFloatLE(v0.x, off + 12); buffer.writeFloatLE(v0.y, off + 16); buffer.writeFloatLE(v0.z, off + 20);
            buffer.writeFloatLE(v1.x, off + 24); buffer.writeFloatLE(v1.y, off + 28); buffer.writeFloatLE(v1.z, off + 32);
            buffer.writeFloatLE(v2.x, off + 36); buffer.writeFloatLE(v2.y, off + 40); buffer.writeFloatLE(v2.z, off + 44);
            off += 50;
        });
    });

    return buffer;
}

// ── GLB Exporter (from mesh list) ─────────────────────────────

function meshesToGLB(meshes) {
    function padTo4(arrayBuffer) {
        const rem = arrayBuffer.byteLength % 4;
        if (rem === 0) return arrayBuffer;
        const padded = new ArrayBuffer(arrayBuffer.byteLength + (4 - rem));
        new Uint8Array(padded).set(new Uint8Array(arrayBuffer));
        return padded;
    }

    const bufferParts = [];
    let totalBufSize = 0;
    const accessors = [], bufferViews = [], gltfMeshes = [], gltfNodes = [], materials = [];

    meshes.forEach((mesh, mi) => {
        const mat = mesh.material || { r: 0.7, g: 0.7, b: 0.7, a: 1 };
        materials.push({
            pbrMetallicRoughness: { baseColorFactor: [mat.r, mat.g, mat.b, mat.a], metallicFactor: 0, roughnessFactor: 0.8 },
            name: mat.name || 'Material_' + mi,
        });

        // Indices
        const idxArr = new Uint32Array(mesh.faces.length * 3);
        let ii = 0;
        mesh.faces.forEach(f => { idxArr[ii++] = f[0]; idxArr[ii++] = f[1]; idxArr[ii++] = f[2]; });
        const idxBuf = padTo4(idxArr.buffer);
        const idxBvIdx = bufferViews.length;
        bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: idxArr.byteLength, target: 34963 });
        accessors.push({ bufferView: idxBvIdx, componentType: 5125, count: idxArr.length, type: 'SCALAR', max: [mesh.vertices.length - 1], min: [0] });
        const idxAccIdx = accessors.length - 1;
        bufferParts.push(idxBuf); totalBufSize += idxBuf.byteLength;

        // Positions
        const posArr = new Float32Array(mesh.vertices.length * 3);
        let pMin = [1e9, 1e9, 1e9], pMax = [-1e9, -1e9, -1e9];
        mesh.vertices.forEach((v, i) => {
            posArr[i * 3] = v.x; posArr[i * 3 + 1] = v.y; posArr[i * 3 + 2] = v.z;
            pMin[0] = Math.min(pMin[0], v.x); pMin[1] = Math.min(pMin[1], v.y); pMin[2] = Math.min(pMin[2], v.z);
            pMax[0] = Math.max(pMax[0], v.x); pMax[1] = Math.max(pMax[1], v.y); pMax[2] = Math.max(pMax[2], v.z);
        });
        const posBuf = padTo4(posArr.buffer);
        const posBvIdx = bufferViews.length;
        bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: posArr.byteLength, target: 34962, byteStride: 12 });
        accessors.push({ bufferView: posBvIdx, componentType: 5126, count: mesh.vertices.length, type: 'VEC3', min: pMin, max: pMax });
        const posAccIdx = accessors.length - 1;
        bufferParts.push(posBuf); totalBufSize += posBuf.byteLength;

        // Normals
        let normAccIdx;
        const hasNorms = mesh.normals && mesh.normals.length === mesh.vertices.length && mesh.normals.some(n => n);
        if (hasNorms) {
            const normArr = new Float32Array(mesh.normals.length * 3);
            mesh.normals.forEach((n, i) => { const nn = n || { x: 0, y: 1, z: 0 }; normArr[i * 3] = nn.x; normArr[i * 3 + 1] = nn.y; normArr[i * 3 + 2] = nn.z; });
            const normBuf = padTo4(normArr.buffer);
            const normBvIdx = bufferViews.length;
            bufferViews.push({ buffer: 0, byteOffset: totalBufSize, byteLength: normArr.byteLength, target: 34962, byteStride: 12 });
            accessors.push({ bufferView: normBvIdx, componentType: 5126, count: mesh.normals.length, type: 'VEC3' });
            normAccIdx = accessors.length - 1;
            bufferParts.push(normBuf); totalBufSize += normBuf.byteLength;
        }

        const attributes = { POSITION: posAccIdx };
        if (normAccIdx !== undefined) attributes.NORMAL = normAccIdx;
        gltfMeshes.push({ primitives: [{ attributes, indices: idxAccIdx, material: mi }], name: mesh.name || 'Mesh_' + mi });
        gltfNodes.push({ mesh: mi, name: 'Node_' + mi });
    });

    const gltfJson = {
        asset: { version: '2.0', generator: 'Hamilton Direct3D Tools CLI' },
        scene: 0,
        scenes: [{ nodes: gltfNodes.map((_, i) => i) }],
        nodes: gltfNodes, meshes: gltfMeshes, accessors, bufferViews,
        buffers: [{ byteLength: totalBufSize }], materials,
    };

    const jsonBytes = Buffer.from(JSON.stringify(gltfJson));
    const jsonPad = Buffer.alloc((jsonBytes.length + 3) & ~3, 0x20);
    jsonBytes.copy(jsonPad);

    const binBuf = Buffer.alloc(totalBufSize);
    let off = 0;
    bufferParts.forEach(part => { Buffer.from(part).copy(binBuf, off); off += Buffer.from(part).byteLength; });
    const binPad = Buffer.alloc((totalBufSize + 3) & ~3);
    binBuf.copy(binPad);

    const glbLen = 12 + 8 + jsonPad.length + 8 + binPad.length;
    const glb = Buffer.alloc(glbLen);
    let p = 0;
    glb.writeUInt32LE(0x46546C67, p); p += 4; // magic "glTF"
    glb.writeUInt32LE(2, p); p += 4;           // version
    glb.writeUInt32LE(glbLen, p); p += 4;      // total length
    glb.writeUInt32LE(jsonPad.length, p); p += 4;
    glb.writeUInt32LE(0x4E4F534A, p); p += 4;  // "JSON"
    jsonPad.copy(glb, p); p += jsonPad.length;
    glb.writeUInt32LE(binPad.length, p); p += 4;
    glb.writeUInt32LE(0x004E4942, p); p += 4;  // "BIN\0"
    binPad.copy(glb, p);
    return glb;
}

// ── XML Labware Parser (Node.js port from labwareGenerator.js) ──

// SBS ANSI standard dimensions (mm)
const SBS = {
    footprintLength: 127.76,
    footprintWidth:  85.48,
    wellSpacing96:   9.0,
    wellSpacing384:  4.5,
    wellSpacing1536: 2.25,
    a1OffsetX:       14.38,
    a1OffsetY:       11.24,
    cornerRadius:    3.18,
    wallThickness:   1.27,
    flangeHeight:    2.41,
};

function parseLabwareXML(xmlString) {
    // Minimal XML parser — extracts element text content by tag name
    function getEl(src, tag) {
        const re = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>', 'i');
        const m = re.exec(src);
        return m ? m[1].trim() : '';
    }
    function getNum(src, tag, divisor) {
        const raw = getEl(src, tag);
        return raw === '' ? 0 : (parseFloat(raw) || 0) / (divisor || 1);
    }

    const DIV = 100;

    const measMatch = xmlString.match(/<Measurements[^>]*>([\s\S]*?)<\/Measurements>/i);
    const wellsMatch = xmlString.match(/<Wells[^>]*>([\s\S]*?)<\/Wells>/i);
    const meas = measMatch ? measMatch[1] : '';
    const wells = wellsMatch ? wellsMatch[1] : '';

    const def = {
        type: 'plate',
        name: getEl(xmlString, 'Name') || 'Plate',
        manufacturer: getEl(xmlString, 'Manufacturer') || '',
        partNumber: getEl(xmlString, 'PartNumber') || '',
        footprintLength: meas ? getNum(meas, 'FootprintLengthMM', DIV) || SBS.footprintLength : SBS.footprintLength,
        footprintWidth:  meas ? getNum(meas, 'FootprintWidthMM', DIV) || SBS.footprintWidth  : SBS.footprintWidth,
        height:          meas ? getNum(meas, 'HeightMM', DIV) || 14.35 : 14.35,
        rowCount:    wells ? getNum(wells, 'RowCount', 1) || 8  : 8,
        colCount:    wells ? getNum(wells, 'CollumnCount', 1) || 12 : 12,
        rowGap:      wells ? getNum(wells, 'RowGap', DIV) || 9.0  : 9.0,
        colGap:      wells ? getNum(wells, 'CollumnGap', DIV) || 9.0 : 9.0,
        wellDepth:   wells ? getNum(wells, 'Depth', DIV) || 10.67 : 10.67,
        wellShape:   wells ? getEl(wells, 'Shape') || 'Circle' : 'Circle',
        wellSize:    wells ? getNum(wells, 'Size', DIV) || 6.86   : 6.86,
        wellLength:  wells ? getNum(wells, 'Length', DIV) || 6.86 : 6.86,
        sizeBottom:  wells ? getNum(wells, 'SizeBottom', DIV)     : 0,
        bottomShape: wells ? getEl(wells, 'BottomShape') || 'Flat' : 'Flat',
        vShapeDepth: wells ? getNum(wells, 'VShapeDepth', DIV)    : 0,
        angle:       0,
        nominalVolume: wells ? getNum(wells, 'NominalWellVolume', DIV) : 0,
        firstHolePos: { x: SBS.a1OffsetX, y: SBS.a1OffsetY },
    };

    if (!def.sizeBottom) def.sizeBottom = def.wellSize;

    // FirstHolePositionText: "x;y" in hundredths of mm
    const fhpMatch = (wells || xmlString).match(/<FirstHolePositionText[^>]*>([^<]*)<\/FirstHolePositionText>/i);
    if (fhpMatch) {
        const parts = fhpMatch[1].trim().split(';');
        if (parts.length >= 2) {
            def.firstHolePos.x = parseFloat(parts[0]) / DIV;
            def.firstHolePos.y = parseFloat(parts[1]) / DIV;
        }
    }

    def.wellCount = def.rowCount * def.colCount;
    return def;
}

function checkSBSCompliance(def) {
    const tolMM = 0.5;
    const fpOk = Math.abs(def.footprintLength - SBS.footprintLength) < tolMM &&
                 Math.abs(def.footprintWidth - SBS.footprintWidth) < tolMM;
    let spacingOk = true;
    if (def.wellCount === 96)   spacingOk = Math.abs(def.rowGap - SBS.wellSpacing96) < 0.2 && Math.abs(def.colGap - SBS.wellSpacing96) < 0.2;
    if (def.wellCount === 384)  spacingOk = Math.abs(def.rowGap - SBS.wellSpacing384) < 0.2 && Math.abs(def.colGap - SBS.wellSpacing384) < 0.2;
    return fpOk && spacingOk;
}

// ── Labware 3D Geometry Generator (plate only, Node.js) ─────────
// Produces a flat mesh list (exact port of labwareGenerator.js geometry,
// minus the canvas-based etched labels which require a browser).

const WELL_SEGMENTS = 16;

function generatePlateGeometry(def) {
    // All geometry described as flat triangle lists: [[{x,y,z}...], ...]
    // Each entry is a named mesh with face list.
    const meshes = [];

    const L = def.footprintLength;
    const W = def.footprintWidth;
    const H = def.height;
    const wallT = SBS.wallThickness;
    const flangeOverhang = 0.5;

    const depth = Math.min(def.wellDepth, H - wallT);
    const wellFloorY = H - depth;
    const flangeH = Math.min(SBS.flangeHeight, H * 0.2, wellFloorY);

    // -- Helper: box → triangles (12 tris per box)
    function boxTriangles(cx, cy, cz, sx, sy, sz) {
        const x0 = cx - sx / 2, x1 = cx + sx / 2;
        const y0 = cy - sy / 2, y1 = cy + sy / 2;
        const z0 = cz - sz / 2, z1 = cz + sz / 2;
        return [
            // front face Z=z0
            [x0,y0,z0],[x0,y1,z0],[x1,y1,z0], [x0,y0,z0],[x1,y1,z0],[x1,y0,z0],
            // back face Z=z1
            [x1,y0,z1],[x1,y1,z1],[x0,y1,z1], [x1,y0,z1],[x0,y1,z1],[x0,y0,z1],
            // left face X=x0
            [x0,y0,z1],[x0,y1,z1],[x0,y1,z0], [x0,y0,z1],[x0,y1,z0],[x0,y0,z0],
            // right face X=x1
            [x1,y0,z0],[x1,y1,z0],[x1,y1,z1], [x1,y0,z0],[x1,y1,z1],[x1,y0,z1],
            // top face Y=y1
            [x0,y1,z0],[x0,y1,z1],[x1,y1,z1], [x0,y1,z0],[x1,y1,z1],[x1,y1,z0],
            // bottom face Y=y0
            [x0,y0,z1],[x0,y0,z0],[x1,y0,z0], [x0,y0,z1],[x1,y0,z0],[x1,y0,z1],
        ];
    }

    function addBox(name, cx, cy, cz, sx, sy, sz) {
        const tris = boxTriangles(cx, cy, cz, sx, sy, sz);
        const vertices = [], faces = [];
        for (let i = 0; i < tris.length; i += 3) {
            const base = vertices.length;
            vertices.push({ x: tris[i][0], y: tris[i][1], z: tris[i][2] });
            vertices.push({ x: tris[i+1][0], y: tris[i+1][1], z: tris[i+1][2] });
            vertices.push({ x: tris[i+2][0], y: tris[i+2][1], z: tris[i+2][2] });
            faces.push([base, base+1, base+2]);
        }
        // Compute flat normals
        const normals = [];
        faces.forEach(f => {
            const v0 = vertices[f[0]], v1 = vertices[f[1]], v2 = vertices[f[2]];
            const ax = v1.x-v0.x, ay = v1.y-v0.y, az = v1.z-v0.z;
            const bx = v2.x-v0.x, by = v2.y-v0.y, bz = v2.z-v0.z;
            const nx = ay*bz-az*by, ny = az*bx-ax*bz, nz = ax*by-ay*bx;
            const len = Math.sqrt(nx*nx+ny*ny+nz*nz) || 1;
            const n = { x: nx/len, y: ny/len, z: nz/len };
            normals.push(n, n, n);
        });
        const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };
        meshes.push({ name, vertices, faces, normals, uvs: [], material: mat });
    }

    // Circular geometry builder (cylinder / cone / disk)
    function addCylinder(name, cx, cy, cz, radiusTop, radiusBot, height, open) {
        const segs = WELL_SEGMENTS;
        const vertices = [], faces = [], normals = [];
        const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };

        for (let i = 0; i < segs; i++) {
            const a0 = (i / segs) * Math.PI * 2;
            const a1 = ((i + 1) / segs) * Math.PI * 2;
            const x0t = cx + Math.cos(a0) * radiusTop, z0t = cz + Math.sin(a0) * radiusTop;
            const x1t = cx + Math.cos(a1) * radiusTop, z1t = cz + Math.sin(a1) * radiusTop;
            const x0b = cx + Math.cos(a0) * radiusBot, z0b = cz + Math.sin(a0) * radiusBot;
            const x1b = cx + Math.cos(a1) * radiusBot, z1b = cz + Math.sin(a1) * radiusBot;
            const yTop = cy + height / 2, yBot = cy - height / 2;

            const base = vertices.length;
            vertices.push({ x: x0b, y: yBot, z: z0b }, { x: x1b, y: yBot, z: z1b },
                          { x: x1t, y: yTop, z: z1t }, { x: x0t, y: yTop, z: z0t });

            // Outward normal (avg between edge normals)
            const nx = Math.cos((a0 + a1) / 2), nz = Math.sin((a0 + a1) / 2);
            const n = { x: nx, y: 0, z: nz };
            normals.push(n, n, n, n);

            faces.push([base, base+1, base+2], [base, base+2, base+3]);

            if (!open) {
                // Top cap
                const tc = vertices.length;
                vertices.push({ x: cx, y: yTop, z: cz }, { x: x0t, y: yTop, z: z0t }, { x: x1t, y: yTop, z: z1t });
                normals.push({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 });
                faces.push([tc, tc+1, tc+2]);

                // Bottom cap
                const bc = vertices.length;
                vertices.push({ x: cx, y: yBot, z: cz }, { x: x1b, y: yBot, z: z1b }, { x: x0b, y: yBot, z: z0b });
                normals.push({ x: 0, y: -1, z: 0 }, { x: 0, y: -1, z: 0 }, { x: 0, y: -1, z: 0 });
                faces.push([bc, bc+1, bc+2]);
            }
        }
        meshes.push({ name, vertices, faces, normals, uvs: [], material: mat });
    }

    function addDisk(name, cx, cy, cz, radius) {
        const segs = WELL_SEGMENTS;
        const vertices = [], faces = [], normals = [];
        const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };
        vertices.push({ x: cx, y: cy, z: cz });
        normals.push({ x: 0, y: 1, z: 0 });
        for (let i = 0; i < segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            vertices.push({ x: cx + Math.cos(a) * radius, y: cy, z: cz + Math.sin(a) * radius });
            normals.push({ x: 0, y: 1, z: 0 });
        }
        for (let i = 0; i < segs; i++) {
            faces.push([0, i + 1, ((i + 1) % segs) + 1]);
        }
        meshes.push({ name, vertices, faces, normals, uvs: [], material: mat });
    }

    function addBowl(name, cx, bottomY, cz, radius) {
        // Lathe-like bowl: quarter-circle profile revolved around Y
        const segs = WELL_SEGMENTS, bsegs = 12;
        const vertices = [], faces = [], normals = [];
        const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };

        for (let i = 0; i <= segs; i++) {
            const phi = (i / segs) * Math.PI * 2;
            for (let j = 0; j <= bsegs; j++) {
                const ba = (j / bsegs) * (Math.PI / 2);
                const r = Math.sin(ba) * radius;
                const y = (1 - Math.cos(ba)) * radius;
                vertices.push({ x: cx + Math.cos(phi) * r, y: bottomY + y, z: cz + Math.sin(phi) * r });
                normals.push({ x: Math.cos(phi) * Math.sin(ba), y: -Math.cos(ba), z: Math.sin(phi) * Math.sin(ba) });
            }
        }
        for (let i = 0; i < segs; i++) {
            for (let j = 0; j < bsegs; j++) {
                const a = i * (bsegs + 1) + j;
                const b = a + 1;
                const c = a + (bsegs + 1);
                const d = c + 1;
                faces.push([a, c, b], [b, c, d]);
            }
        }
        meshes.push({ name, vertices, faces, normals, uvs: [], material: mat });
    }

    // ─── Skirt / flange ────────────────────────────────────────
    const flangeOuterL = L + flangeOverhang * 2;
    addBox('Flange_Front', L / 2, flangeH / 2, -flangeOverhang / 2 + wallT / 2, flangeOuterL, flangeH, wallT + flangeOverhang);
    addBox('Flange_Back',  L / 2, flangeH / 2, W + flangeOverhang / 2 - wallT / 2, flangeOuterL, flangeH, wallT + flangeOverhang);
    const lrSpan = W - wallT * 2;
    addBox('Flange_Left',  -flangeOverhang / 2 + wallT / 2, flangeH / 2, W / 2, wallT + flangeOverhang, flangeH, lrSpan);
    addBox('Flange_Right', L + flangeOverhang / 2 - wallT / 2, flangeH / 2, W / 2, wallT + flangeOverhang, flangeH, lrSpan);

    // ─── Base slab ─────────────────────────────────────────────
    const slabH = wellFloorY - flangeH;
    if (slabH > 0.01) addBox('Slab', L / 2, flangeH + slabH / 2, W / 2, L, slabH, W);

    // ─── Outer walls ───────────────────────────────────────────
    const wallH = H - wellFloorY;
    addBox('Wall_Front', L / 2, wellFloorY + wallH / 2, wallT / 2, L, wallH, wallT);
    addBox('Wall_Back',  L / 2, wellFloorY + wallH / 2, W - wallT / 2, L, wallH, wallT);
    const sideInnerW = W - wallT * 2;
    addBox('Wall_Left',  wallT / 2, wellFloorY + wallH / 2, W / 2, wallT, wallH, sideInnerW);
    addBox('Wall_Right', L - wallT / 2, wellFloorY + wallH / 2, W / 2, wallT, wallH, sideInnerW);

    // ─── Wells ─────────────────────────────────────────────────
    const rows = def.rowCount, cols = def.colCount;
    const wellTopR = def.wellSize / 2, wellBotR = def.sizeBottom / 2;
    const firstX = def.firstHolePos.x, firstZ = def.firstHolePos.y;
    const gapX = def.colGap, gapZ = def.rowGap;
    const isCircle = (def.wellShape || '').toLowerCase() === 'circle';
    const bsLo = (def.bottomShape || '').toLowerCase();
    const isRound = bsLo === 'circle';
    const isV = bsLo === 'vshape' || bsLo === 'v' || def.vShapeDepth > 0;

    let btmShapeH = 0;
    if (isRound) btmShapeH = wellBotR;
    else if (isV) btmShapeH = def.vShapeDepth > 0 ? def.vShapeDepth : wellBotR;
    btmShapeH = Math.min(btmShapeH, depth);
    const straightDepth = depth - btmShapeH;
    const straightBotY = wellFloorY + btmShapeH;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cx = firstX + col * gapX;
            const cz = firstZ + row * gapZ;
            const wTag = 'W' + row + '_' + col;

            if (isCircle) {
                if (straightDepth > 0.01) {
                    addCylinder(wTag + '_wall', cx, straightBotY + straightDepth / 2, cz, wellTopR, wellBotR, straightDepth, true);
                }
                if (isRound) {
                    addBowl(wTag + '_bowl', cx, wellFloorY, cz, btmShapeH);
                } else if (isV) {
                    addCylinder(wTag + '_cone', cx, wellFloorY + btmShapeH / 2, cz, wellBotR, 0, btmShapeH, false);
                } else {
                    addDisk(wTag + '_disk', cx, wellFloorY, cz, wellBotR);
                }
            } else {
                // Rectangular well — four walls as box strips
                const wLen = def.wellLength, wSz = def.wellSize, wt = 0.3;
                if (straightDepth > 0.01) {
                    const wallCY = straightBotY + straightDepth / 2;
                    addBox(wTag + '_wF', cx, wallCY, cz - wSz / 2 + wt / 2, wLen, straightDepth, wt);
                    addBox(wTag + '_wB', cx, wallCY, cz + wSz / 2 - wt / 2, wLen, straightDepth, wt);
                    addBox(wTag + '_wL', cx - wLen / 2 + wt / 2, wallCY, cz, wt, straightDepth, wSz - wt * 2);
                    addBox(wTag + '_wR', cx + wLen / 2 - wt / 2, wallCY, cz, wt, straightDepth, wSz - wt * 2);
                }
                if (isRound) {
                    addBowl(wTag + '_bowl', cx, wellFloorY, cz, Math.min(wLen / 2, wSz / 2, btmShapeH));
                } else if (isV) {
                    // 4-sided pyramid — reuse addBox bottom-cap approach via raw verts
                    const vD = btmShapeH, hL = wLen / 2, hW = wSz / 2;
                    const pyrVerts = [
                        { x: cx-hL, y: wellFloorY+vD, z: cz-hW }, { x: cx, y: wellFloorY, z: cz }, { x: cx+hL, y: wellFloorY+vD, z: cz-hW },
                        { x: cx+hL, y: wellFloorY+vD, z: cz-hW }, { x: cx, y: wellFloorY, z: cz }, { x: cx+hL, y: wellFloorY+vD, z: cz+hW },
                        { x: cx+hL, y: wellFloorY+vD, z: cz+hW }, { x: cx, y: wellFloorY, z: cz }, { x: cx-hL, y: wellFloorY+vD, z: cz+hW },
                        { x: cx-hL, y: wellFloorY+vD, z: cz+hW }, { x: cx, y: wellFloorY, z: cz }, { x: cx-hL, y: wellFloorY+vD, z: cz-hW },
                    ];
                    const pyrFaces = [[0,1,2],[3,4,5],[6,7,8],[9,10,11]];
                    const pyrNorms = pyrVerts.map(() => ({ x: 0, y: 1, z: 0 }));
                    const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };
                    meshes.push({ name: wTag + '_pyr', vertices: pyrVerts, faces: pyrFaces, normals: pyrNorms, uvs: [], material: mat });
                } else {
                    // Flat rect bottom
                    const bV = [
                        { x: cx - wLen/2, y: wellFloorY, z: cz - wSz/2 },
                        { x: cx + wLen/2, y: wellFloorY, z: cz - wSz/2 },
                        { x: cx + wLen/2, y: wellFloorY, z: cz + wSz/2 },
                        { x: cx - wLen/2, y: wellFloorY, z: cz + wSz/2 },
                    ];
                    const bN = bV.map(() => ({ x: 0, y: 1, z: 0 }));
                    const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };
                    meshes.push({ name: wTag + '_btm', vertices: bV, faces: [[0,1,2],[0,2,3]], normals: bN, uvs: [], material: mat });
                }
            }
        }
    }

    // ─── Top surface (simple rectangle, no hole-punching for CLI) ─
    // Represented as two large triangles
    const topVerts = [
        { x: 0, y: H, z: 0 }, { x: L, y: H, z: 0 },
        { x: L, y: H, z: W }, { x: 0, y: H, z: W },
    ];
    const topNorms = topVerts.map(() => ({ x: 0, y: 1, z: 0 }));
    const mat = { name: 'LabwareMaterial', r: 0.847, g: 0.863, b: 0.886, a: 0.32, sr: 0.267, sg: 0.267, sb: 0.267, power: 90 };
    meshes.push({ name: 'TopSurface', vertices: topVerts, faces: [[0,1,2],[0,2,3]], normals: topNorms, uvs: [], material: mat });

    return meshes;
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
    const xInfo = xText ? parseXFileText(xText) : { header: getXFileFormat(buf) + ' (compressed binary)', version: null, format: null, floatSize: null, templates: [], frames: [], meshes: [], materials: [], animations: [], totalVertices: 0, totalFaces: 0 };

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

            const xInfo = xText ? parseXFileText(xText) : { header: getXFileFormat(buf) + ' (compressed binary)', version: null, format: null, floatSize: null, templates: [], frames: [], meshes: [], materials: [], animations: [], totalVertices: 0, totalFaces: 0 };
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

// ── Convert command: OBJ/STL/GLB/X → .x ───────────────────────

async function cmdConvert(args) {
    // Usage: convert <input> <output.x> [--rotate-x <deg>] [--rotate-y <deg>] [--rotate-z <deg>] [--mirror-x] [--mirror-y] [--mirror-z]
    const positional = args.filter(a => !a.startsWith('--') && !isFlag(args, a));
    const inputFile = positional[0];
    const outputFile = positional[1];

    if (!inputFile) {
        console.log(colorize(C.red, '  Usage: convert <input> <output.x> [--rotate-x <deg>] [--rotate-y <deg>] [--rotate-z <deg>] [--mirror-x] [--mirror-y] [--mirror-z]'));
        return;
    }

    const inResolved = path.resolve(inputFile);
    if (!fs.existsSync(inResolved)) { console.log(colorize(C.red, '  File not found: ' + inResolved)); return; }

    const rotX = parseArgValue(args, '--rotate-x') || 0;
    const rotY = parseArgValue(args, '--rotate-y') || 0;
    const rotZ = parseArgValue(args, '--rotate-z') || 0;
    const mirrorX = args.includes('--mirror-x');
    const mirrorY = args.includes('--mirror-y');
    const mirrorZ = args.includes('--mirror-z');

    const outFile = outputFile
        ? path.resolve(outputFile)
        : inResolved.replace(/\.[^.]+$/, '') + '.x';

    console.log('  Loading ' + colorize(C.cyan, path.basename(inResolved)) + '…');
    const startTime = Date.now();

    let meshes;
    try {
        meshes = await loadMeshesFromFile(inResolved);
    } catch (e) {
        console.log(colorize(C.red, '  Load error: ' + e.message));
        return;
    }

    if (!meshes || meshes.length === 0) {
        console.log(colorize(C.red, '  No geometry found in file.'));
        return;
    }

    console.log('  ' + meshes.length + ' mesh(es) loaded (' + meshes.reduce((s, m) => s + m.vertices.length, 0).toLocaleString() + ' vertices)');

    if (rotX || rotY || rotZ || mirrorX || mirrorY || mirrorZ) {
        console.log('  Applying transforms: ' +
            (rotX ? 'rotX=' + rotX + '° ' : '') + (rotY ? 'rotY=' + rotY + '° ' : '') + (rotZ ? 'rotZ=' + rotZ + '° ' : '') +
            (mirrorX ? 'mirrorX ' : '') + (mirrorY ? 'mirrorY ' : '') + (mirrorZ ? 'mirrorZ ' : ''));
        applyMeshTransforms(meshes, { rotX, rotY, rotZ, mirrorX, mirrorY, mirrorZ });
    }

    console.log('  Generating .x file…');
    const xText = meshesToXFile(meshes);
    fs.writeFileSync(outFile, xText, 'utf-8');
    const elapsed = Date.now() - startTime;

    console.log(colorize(C.green, '  ✓ Converted') + ' → ' + outFile);
    console.log('    ' + formatBytes(xText.length) + ' written (' + elapsed + 'ms)');
}

function isFlag(args, a) {
    // Check if the string 'a' is the value after a flag like --rotate-x
    const idx = args.indexOf(a);
    if (idx <= 0) return false;
    return args[idx - 1].startsWith('--') && !args[idx - 1].includes('mirror');
}

function parseArgValue(args, flag) {
    const idx = args.indexOf(flag);
    if (idx < 0 || idx >= args.length - 1) return null;
    return parseFloat(args[idx + 1]) || 0;
}

// ── Export-X command: .x/.hxx → OBJ/STL/GLB ──────────────────

async function cmdExportX(args) {
    // Usage: export-x <output> [format]  (or pass inline as args after interactive command)
    // Can also be called on the currently loaded file.
    const positional = args.filter(a => !a.startsWith('--'));
    let inputFile = null;
    let outputFile = positional[0];
    let format = positional[1] || 'obj';

    // Detect format from output extension
    if (outputFile) {
        const ext = path.extname(outputFile).toLowerCase();
        if (ext === '.obj') format = 'obj';
        else if (ext === '.stl') format = 'stl';
        else if (ext === '.glb') format = 'glb';
        else if (ext === '.gltf') format = 'glb'; // write as glb
    }

    // If a file was explicitly given as the first positional and it looks like an input
    if (outputFile && /\.(x|hxx)$/i.test(outputFile)) {
        inputFile = outputFile;
        outputFile = positional[1];
        format = positional[2] || 'obj';
        if (outputFile) {
            const ext = path.extname(outputFile).toLowerCase();
            if (['.obj', '.stl', '.glb'].includes(ext)) format = ext.slice(1);
        }
    }

    // Fall back to loaded file
    if (!inputFile) {
        if (!state.loaded) {
            console.log(colorize(C.red, '  No file loaded. Usage: export-x [input.x] <output> [format|obj|stl|glb]'));
            return;
        }
        inputFile = state.loaded.filePath;
    }

    const inResolved = path.resolve(inputFile);
    if (!fs.existsSync(inResolved)) { console.log(colorize(C.red, '  File not found: ' + inResolved)); return; }

    const baseName = path.basename(inResolved, path.extname(inResolved));
    const outDir   = outputFile ? path.dirname(path.resolve(outputFile)) : path.dirname(inResolved);

    if (!['obj', 'stl', 'glb'].includes(format)) {
        console.log(colorize(C.yellow, '  Unknown format: ' + format + '. Defaulting to obj.'));
        format = 'obj';
    }

    const outExt = '.' + format;
    const outFile = outputFile
        ? path.resolve(outputFile.replace(/\.[^.]+$/, '') + outExt)
        : path.join(outDir, baseName + outExt);

    console.log('  Loading ' + colorize(C.cyan, path.basename(inResolved)) + '…');
    const startTime = Date.now();

    let meshes;
    try {
        meshes = await loadMeshesFromFile(inResolved);
    } catch (e) {
        console.log(colorize(C.red, '  Load error: ' + e.message));
        return;
    }
    if (!meshes || meshes.length === 0) { console.log(colorize(C.red, '  No geometry found.')); return; }
    console.log('  ' + meshes.length + ' mesh(es) loaded');

    const elapsed = Date.now() - startTime;

    if (format === 'obj') {
        const { obj, mtl } = meshesToOBJ(meshes, baseName);
        fs.writeFileSync(outFile, obj, 'utf-8');
        const mtlFile = outFile.replace(/\.obj$/i, '.mtl');
        fs.writeFileSync(mtlFile, mtl, 'utf-8');
        console.log(colorize(C.green, '  ✓ Exported OBJ') + ' → ' + outFile + ' + ' + path.basename(mtlFile));
    } else if (format === 'stl') {
        const buf = meshesToSTL(meshes);
        fs.writeFileSync(outFile, buf);
        console.log(colorize(C.green, '  ✓ Exported STL') + ' → ' + outFile);
    } else if (format === 'glb') {
        const buf = meshesToGLB(meshes);
        fs.writeFileSync(outFile, buf);
        console.log(colorize(C.green, '  ✓ Exported GLB') + ' → ' + outFile);
    }

    console.log('    ' + formatBytes(fs.statSync(outFile).size) + ' written (' + elapsed + 'ms)');
}

// ── Generate command: XML labware definition → .x ─────────────

function cmdGenerate(args) {
    const positional = args.filter(a => !a.startsWith('--'));
    const xmlFile = positional[0];
    const outputFile = positional[1];
    const snapSBS = args.includes('--sbs');

    if (!xmlFile) {
        console.log(colorize(C.red, '  Usage: generate <labware.xml> [output.x] [--sbs]'));
        return;
    }

    const xmlResolved = path.resolve(xmlFile);
    if (!fs.existsSync(xmlResolved)) { console.log(colorize(C.red, '  File not found: ' + xmlResolved)); return; }

    const xmlText = fs.readFileSync(xmlResolved, 'utf-8');
    let def;
    try {
        def = parseLabwareXML(xmlText);
    } catch (e) {
        console.log(colorize(C.red, '  XML parse error: ' + e.message));
        return;
    }

    if (snapSBS) {
        def.footprintLength = SBS.footprintLength;
        def.footprintWidth  = SBS.footprintWidth;
        def.firstHolePos.x  = SBS.a1OffsetX;
        def.firstHolePos.y  = SBS.a1OffsetY;
        if (def.wellCount === 96)  { def.rowGap = SBS.wellSpacing96;   def.colGap = SBS.wellSpacing96;   }
        if (def.wellCount === 384) { def.rowGap = SBS.wellSpacing384;  def.colGap = SBS.wellSpacing384;  }
    }

    renderLabwareDef(def, outputFile, xmlResolved);
}

function cmdGenerateDefault(args) {
    // Build a def from CLI flags, using SBS defaults
    const rows     = parseInt(parseArgValueStr(args, '--rows'))   || 8;
    const cols     = parseInt(parseArgValueStr(args, '--cols'))   || 12;
    const name     = parseArgValueStr(args, '--name')       || 'Labware';
    const wellShape  = parseArgValueStr(args, '--well-shape')   || 'Circle';
    const bottomShape = parseArgValueStr(args, '--bottom-shape') || 'Flat';
    const height   = parseFloat(parseArgValueStr(args, '--height'))    || 14.35;
    const wellDepth = parseFloat(parseArgValueStr(args, '--well-depth')) || 10.67;
    const wellSize  = parseFloat(parseArgValueStr(args, '--well-size'))  || (rows * cols >= 384 ? 3.3 : 6.86);
    const rowGap = parseFloat(parseArgValueStr(args, '--row-gap')) || (rows * cols >= 384 ? SBS.wellSpacing384 : SBS.wellSpacing96);
    const colGap = parseFloat(parseArgValueStr(args, '--col-gap')) || (rows * cols >= 384 ? SBS.wellSpacing384 : SBS.wellSpacing96);
    const firstX = parseFloat(parseArgValueStr(args, '--first-x')) || SBS.a1OffsetX;
    const firstY = parseFloat(parseArgValueStr(args, '--first-y')) || SBS.a1OffsetY;
    const snapSBS = args.includes('--sbs');
    const positional = args.filter(a => !a.startsWith('--'));
    const outputFile = positional[0];

    let def = {
        type: 'plate', name, manufacturer: '', partNumber: '',
        footprintLength: SBS.footprintLength, footprintWidth: SBS.footprintWidth,
        height, rowCount: rows, colCount: cols, rowGap, colGap,
        wellDepth, wellShape, wellSize, wellLength: wellSize,
        sizeBottom: wellSize, bottomShape, vShapeDepth: 0, angle: 0, nominalVolume: 0,
        firstHolePos: { x: firstX, y: firstY }, wellCount: rows * cols,
    };

    if (snapSBS) {
        def.footprintLength = SBS.footprintLength;
        def.footprintWidth  = SBS.footprintWidth;
        def.firstHolePos.x  = SBS.a1OffsetX;
        def.firstHolePos.y  = SBS.a1OffsetY;
        if (def.wellCount === 96)  { def.rowGap = SBS.wellSpacing96;  def.colGap = SBS.wellSpacing96;  }
        if (def.wellCount === 384) { def.rowGap = SBS.wellSpacing384; def.colGap = SBS.wellSpacing384; }
    }

    renderLabwareDef(def, outputFile, null);
}

function parseArgValueStr(args, flag) {
    const idx = args.indexOf(flag);
    if (idx < 0 || idx >= args.length - 1) return null;
    return args[idx + 1];
}

function renderLabwareDef(def, outputFile, sourceFile) {
    const sbsOk = checkSBSCompliance(def);
    console.log(colorize(C.bright, '\n  Labware Definition'));
    console.log('  ─────────────────────────────────────');
    console.log('  Name:         ' + def.name);
    if (def.manufacturer) console.log('  Manufacturer: ' + def.manufacturer);
    if (def.partNumber)   console.log('  Part number:  ' + def.partNumber);
    console.log('  Type:         ' + def.type);
    console.log('  Footprint:    ' + def.footprintLength.toFixed(2) + ' × ' + def.footprintWidth.toFixed(2) + ' mm');
    console.log('  Height:       ' + def.height.toFixed(2) + ' mm');
    console.log('  Wells:        ' + def.wellCount + ' (' + def.rowCount + '×' + def.colCount + ')');
    console.log('  Well shape:   ' + def.wellShape + ' (bottom: ' + def.bottomShape + ')');
    console.log('  Well size:    ' + def.wellSize.toFixed(2) + ' mm (top)  ' + def.sizeBottom.toFixed(2) + ' mm (bottom)');
    console.log('  Well depth:   ' + def.wellDepth.toFixed(2) + ' mm');
    console.log('  Row gap:      ' + def.rowGap.toFixed(2) + ' mm');
    console.log('  Col gap:      ' + def.colGap.toFixed(2) + ' mm');
    console.log('  A1 offset:    X=' + def.firstHolePos.x.toFixed(2) + ' Y=' + def.firstHolePos.y.toFixed(2));
    console.log('  SBS comply:   ' + (sbsOk ? colorize(C.green, 'YES') : colorize(C.yellow, 'NO (non-standard)')));
    console.log('');
    console.log('  Generating 3D geometry…');

    const startTime = Date.now();
    const meshes = generatePlateGeometry(def);
    const xText = meshesToXFile(meshes);

    const safeName = (def.name || 'labware').replace(/[^a-zA-Z0-9_ -]/g, '_');
    const outFile = outputFile
        ? path.resolve(outputFile)
        : path.join(sourceFile ? path.dirname(sourceFile) : process.cwd(), safeName + '.x');

    fs.writeFileSync(outFile, xText, 'utf-8');
    const elapsed = Date.now() - startTime;

    const totalVerts = meshes.reduce((s, m) => s + m.vertices.length, 0);
    const totalFaces = meshes.reduce((s, m) => s + m.faces.length, 0);

    console.log(colorize(C.green, '  ✓ Generated') + ' ' + meshes.length + ' meshes — ' +
        totalVerts.toLocaleString() + ' vertices, ' + totalFaces.toLocaleString() + ' faces');
    console.log('  Written → ' + outFile + ' (' + formatBytes(xText.length) + ', ' + elapsed + 'ms)');
    console.log('');
}

function cmdHelp() {
    console.log(`
  ${colorize(C.bright, 'Hamilton .hxx / .x File CLI  —  Full-Parity Edition')}
  ═══════════════════════════════════════════════════════════════

  ${colorize(C.cyan, 'Viewer / Inspection')}
    load <file>              Load a .hxx or .x file
    info                     Show detailed file information
    sections                 List .hxx archive sections
    tree                     Show frame hierarchy tree
    meshes                   List all meshes (vertex/face counts)
    materials                List all materials
    animations               List animations
    deep                     Deep parse with full XFileLoader

  ${colorize(C.cyan, 'Export / Extraction')}
    export [out.x]           Export decompressed .x text to file
    export-textures [dir]    Extract embedded textures from .hxx
    export-x [in.x] <out> [format]
                             Export .x/.hxx → OBJ / STL / GLB
                             format: obj (default), stl, glb
                             (uses currently loaded file if no input given)

  ${colorize(C.cyan, 'Conversion  (3D formats → .x)')}
    convert <input> <out.x> [options]
                             Convert OBJ / STL / GLB / GLTF / .x → .x
                             Input formats: .obj .stl .glb .gltf .x .hxx
      --rotate-x <deg>       Rotate around X axis
      --rotate-y <deg>       Rotate around Y axis
      --rotate-z <deg>       Rotate around Z axis
      --mirror-x             Mirror on X axis
      --mirror-y             Mirror on Y axis
      --mirror-z             Mirror on Z axis

  ${colorize(C.cyan, 'Labware Generation  (XML definition → .x)')}
    generate <xml> [out.x] [--sbs]
                             Parse Integra/Hamilton labware XML, generate .x
                             --sbs  Snap footprint & spacing to SBS/ANSI standard
    generate-default [out.x] [options]
                             Generate .x with built-in defaults (no XML required)
      --rows <n>             Number of rows       (default: 8)
      --cols <n>             Number of columns    (default: 12)
      --name <name>          Labware name
      --height <mm>          Total plate height   (default: 14.35)
      --well-depth <mm>      Well depth           (default: 10.67)
      --well-size <mm>       Well diameter/size   (default: 6.86 for 96-well)
      --well-shape circle|rect
      --bottom-shape flat|circle|vshape
      --row-gap <mm>         Row spacing          (default: SBS 9.0)
      --col-gap <mm>         Column spacing       (default: SBS 9.0)
      --first-x <mm>         A1 X offset          (default: SBS 14.38)
      --first-y <mm>         A1 Y offset          (default: SBS 11.24)
      --sbs                  Snap to SBS/ANSI standard footprint & spacing

  ${colorize(C.cyan, 'Validation')}
    validate [file]          Validate a file can be fully parsed
    batch <dir>              Batch-validate all .hxx/.x files in directory
    stats                    Show aggregate stats from last batch run

  ${colorize(C.cyan, 'SBS / ANSI Standard Reference')}
    sbs                      Print SBS/ANSI standard plate dimensions

  ${colorize(C.cyan, 'Other')}
    help                     Show this help
    clear                    Clear screen
    exit / quit              Exit

  ${colorize(C.dim, 'Non-interactive one-shot usage:')}
    ${colorize(C.dim, 'node cli.js <file> [--validate] [--export [out.x]] [--quiet]')}
    ${colorize(C.dim, 'node cli.js convert <in> <out.x> [--rotate-x 90] [--mirror-x]')}
    ${colorize(C.dim, 'node cli.js export-x <in.x> <out.obj>')}
    ${colorize(C.dim, 'node cli.js generate <xml> [out.x] [--sbs]')}
    ${colorize(C.dim, 'node cli.js generate-default [out.x] --rows 8 --cols 12 --sbs')}
    ${colorize(C.dim, 'node cli.js --batch <dir> [--recursive]')}
`);
}

// ── SBS Reference ─────────────────────────────────────────────

function cmdSBS() {
    console.log(colorize(C.bright, '\n  SBS / ANSI Standard Plate Dimensions'));
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Footprint length:      ' + SBS.footprintLength + ' mm  (ANSI/SLAS 1-2004)');
    console.log('  Footprint width:       ' + SBS.footprintWidth + ' mm  (ANSI/SLAS 1-2004)');
    console.log('  Well spacing 96-well:  ' + SBS.wellSpacing96 + ' mm');
    console.log('  Well spacing 384-well: ' + SBS.wellSpacing384 + ' mm');
    console.log('  Well spacing 1536-well:' + SBS.wellSpacing1536 + ' mm');
    console.log('  A1 offset X:           ' + SBS.a1OffsetX + ' mm');
    console.log('  A1 offset Y:           ' + SBS.a1OffsetY + ' mm');
    console.log('  Corner radius:         ' + SBS.cornerRadius + ' mm');
    console.log('  Wall thickness:        ' + SBS.wallThickness + ' mm');
    console.log('  Flange height:         ' + SBS.flangeHeight + ' mm');
    console.log('');
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

    // --help / -h
    if (args.includes('--help') || args.includes('-h')) {
        cmdHelp();
        return;
    }

    // ── Non-interactive sub-commands ─────────────────────────
    // node cli.js convert <in> <out.x> [opts]
    if (args[0] === 'convert') {
        await cmdConvert(args.slice(1));
        return;
    }

    // node cli.js export-x <in.x> <out> [format]
    if (args[0] === 'export-x') {
        await cmdExportX(args.slice(1));
        return;
    }

    // node cli.js generate <xml> [out.x] [--sbs]
    if (args[0] === 'generate') {
        cmdGenerate(args.slice(1));
        return;
    }

    // node cli.js generate-default [out.x] [opts]
    if (args[0] === 'generate-default') {
        cmdGenerateDefault(args.slice(1));
        return;
    }

    // node cli.js sbs
    if (args[0] === 'sbs') {
        cmdSBS();
        return;
    }

    // node cli.js --batch <dir> [--recursive] [--no-recursive]
    if (args.includes('--batch') || args.includes('-b')) {
        const idx = args.indexOf('--batch') !== -1 ? args.indexOf('--batch') : args.indexOf('-b');
        const dir = args[idx + 1];
        const recursive = !args.includes('--no-recursive');
        await cmdBatch(dir, recursive);
        cmdStats();
        return;
    }

    // node cli.js <file> [--validate] [--export [out.x]] [--quiet]
    if (args.length > 0 && !args[0].startsWith('-')) {
        cmdLoad(args[0]);
        if (state.loaded) cmdInfo();

        if (args.includes('--validate') || args.includes('-v')) {
            await cmdValidate();
        }

        if (args.includes('--export') || args.includes('-e')) {
            const eIdx = args.indexOf('--export') !== -1 ? args.indexOf('--export') : args.indexOf('-e');
            cmdExport(args[eIdx + 1]);
        }

        if (args.includes('--export-x')) {
            const xi = args.indexOf('--export-x');
            const fmt = args[xi + 1] && !args[xi + 1].startsWith('--') ? args[xi + 1] : 'obj';
            await cmdExportX([fmt]);
        }

        if (args.includes('--quiet') || args.includes('-q')) return;
    }

    // ── Interactive mode ──────────────────────────────────────
    console.log('');
    console.log('  ' + colorize(C.bright + C.cyan, '╔══════════════════════════════════════════════╗'));
    console.log('  ' + colorize(C.bright + C.cyan, '║') + colorize(C.bright, '  Hamilton .hxx / .x CLI  — Full-Parity    ') + colorize(C.bright + C.cyan, '║'));
    console.log('  ' + colorize(C.bright + C.cyan, '╚══════════════════════════════════════════════╝'));
    console.log('');
    console.log('  Type ' + colorize(C.cyan, 'help') + ' for all commands, ' +
        colorize(C.cyan, 'exit') + ' to quit.');
    if (!state.loaded) {
        console.log('  Load a file: ' + colorize(C.cyan, 'load <path>') +
            '  |  Convert: ' + colorize(C.cyan, 'convert <in> <out.x>') +
            '  |  Generate: ' + colorize(C.cyan, 'generate <xml>'));
    }
    console.log('');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colorize(C.cyan, '  d3d') + colorize(C.bright, '> '),
        terminal: true,
    });

    rl.on('line', async (line) => {
        const input = line.trim();
        if (!input) { rl.prompt(); return; }

        // Split but preserve quoted strings for file paths with spaces
        const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const unquoted = parts.map(p => p.replace(/^"|"$/g, ''));
        const cmd = unquoted[0].toLowerCase();
        const restArgs = unquoted.slice(1);
        const arg = restArgs.join(' ');

        try {
            switch (cmd) {
                // ── Inspection ──────────────────────────────────
                case 'load': case 'open':
                    cmdLoad(arg);
                    break;
                case 'info': case 'i':
                    cmdInfo();
                    break;
                case 'sections': case 'sec':
                    cmdSections();
                    break;
                case 'tree': case 't':
                    cmdTree();
                    break;
                case 'meshes': case 'm':
                    cmdMeshes();
                    break;
                case 'materials': case 'mat':
                    cmdMaterials();
                    break;
                case 'animations': case 'anim': case 'a':
                    cmdAnimations();
                    break;
                case 'deep': case 'd':
                    await cmdDeepInfo();
                    break;

                // ── Export / Extraction ─────────────────────────
                case 'export': case 'e':
                    cmdExport(arg || undefined);
                    break;
                case 'export-textures': case 'et':
                    cmdExportTextures(arg || undefined);
                    break;
                case 'export-x': case 'ex':
                    // export-x [input.x] <output> [format]
                    await cmdExportX(restArgs);
                    break;

                // ── Conversion ──────────────────────────────────
                case 'convert': case 'cv':
                    // convert <input> <output.x> [--rotate-x <deg>] ...
                    await cmdConvert(restArgs);
                    break;

                // ── Labware Generation ───────────────────────────
                case 'generate': case 'gen': case 'g':
                    cmdGenerate(restArgs);
                    break;
                case 'generate-default': case 'gend': case 'gd':
                    cmdGenerateDefault(restArgs);
                    break;

                // ── Validation ──────────────────────────────────
                case 'validate': case 'v':
                    await cmdValidate(arg || undefined);
                    break;
                case 'batch': case 'b':
                    await cmdBatch(arg || undefined);
                    break;
                case 'stats': case 's':
                    cmdStats();
                    break;

                // ── Reference ───────────────────────────────────
                case 'sbs':
                    cmdSBS();
                    break;

                // ── Other ───────────────────────────────────────
                case 'help': case 'h': case '?':
                    cmdHelp();
                    break;
                case 'clear': case 'cls':
                    console.clear();
                    break;
                case 'exit': case 'quit': case 'q':
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

    rl.on('close', () => { process.exit(0); });
    rl.prompt();
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
