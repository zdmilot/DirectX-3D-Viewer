/* ================================================================
   HXX Loader — Parse Hamilton .hxx binary 3D archive files
   ================================================================
   .hxx files are Hamilton3dData containers with gzip-compressed
   sections.  The "__Main3dData__" section holds a standard
   DirectX .x text file.  Other sections are typically PNG textures.

   Format layout:
     [0..13]   Magic: "Hamilton3dData" (14 bytes ASCII)
     [14..15]  Version bytes (2 bytes)
     [16..19]  Section count N (4 bytes, big-endian uint32)
     [20..]    Section table: N entries × 12 bytes each
               - bytes 0-3:  file offset to section name (big-endian uint32)
               - bytes 4-7:  name length in bytes (big-endian uint32)
               - bytes 8-11: decompressed data size (big-endian uint32)
     After table: section data blocks laid out sequentially.
       Each block = name (nameLen bytes) + gzip-compressed data.
       Compressed size is implied: from (offset+nameLen) to next
       section's offset (or end of file for the last section).

   Usage:
     HXXLoader.parse(arrayBuffer)
       → Promise<{ xFileText, textures: [{name, blob}] }>

     HXXLoader.isHXX(arrayBuffer)
       → boolean (checks magic header)

     HXXLoader.toXFileBlob(arrayBuffer)
       → Promise<Blob> (convenience: returns the .x data as a Blob URL-ready object)
   ================================================================ */

(function () {
    'use strict';

    const HXX_MAGIC = 'Hamilton3dData';
    const MAIN_SECTION = '__Main3dData__';

    /**
     * Read a big-endian uint32 from a DataView.
     */
    function readUint32BE(dv, offset) {
        return dv.getUint32(offset, false); // false = big-endian
    }

    /**
     * Find the exact end of a gzip stream by locating the ISIZE trailer field.
     * ISIZE is the last 4 bytes of a valid gzip stream (little-endian uint32)
     * and equals decompressedSize mod 2^32.
     * @param {Uint8Array} compressedBytes
     * @param {number} expectedDecompSize - the expected decompressed size
     * @returns {number} byte offset of the gzip stream end, or -1 if not found
     */
    function findGzipEnd(compressedBytes, expectedDecompSize) {
        const isize = expectedDecompSize >>> 0; // unsigned 32-bit
        // Scan backward from the end — ISIZE is at the tail of the gzip stream
        // CRC32 (4 bytes) + ISIZE (4 bytes) = last 8 bytes of gzip
        const searchStart = Math.max(10, compressedBytes.length - 2048);
        for (let i = compressedBytes.length - 4; i >= searchStart; i--) {
            const val = (compressedBytes[i]) |
                        (compressedBytes[i + 1] << 8) |
                        (compressedBytes[i + 2] << 16) |
                        ((compressedBytes[i + 3] << 24) >>> 0);
            if ((val >>> 0) === isize) {
                return i + 4; // gzip stream ends right after ISIZE
            }
        }
        return -1;
    }

    /**
     * Parse gzip header and return offset where raw DEFLATE data starts.
     * Standard gzip header is at least 10 bytes; extra fields follow flags.
     * @param {Uint8Array} data
     * @returns {number} offset of raw DEFLATE payload
     */
    function gzipHeaderSize(data) {
        if (data.length < 10 || data[0] !== 0x1f || data[1] !== 0x8b) return -1;
        const flags = data[3];
        let pos = 10;
        if (flags & 0x04) { // FEXTRA
            if (pos + 2 > data.length) return -1;
            const xlen = data[pos] | (data[pos + 1] << 8);
            pos += 2 + xlen;
        }
        if (flags & 0x08) { // FNAME
            while (pos < data.length && data[pos] !== 0) pos++;
            pos++;
        }
        if (flags & 0x10) { // FCOMMENT
            while (pos < data.length && data[pos] !== 0) pos++;
            pos++;
        }
        if (flags & 0x02) { // FHCRC
            pos += 2;
        }
        return pos;
    }

    /**
     * Decompress a clean gzip buffer (no trailing junk).
     * @param {Uint8Array} cleanBytes
     * @returns {Promise<Uint8Array>}
     */
    async function decompressGzipClean(cleanBytes) {
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();

        writer.write(cleanBytes).then(function () { return writer.close(); }).catch(function () {});

        const chunks = [];
        let totalLen = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLen += value.byteLength;
        }

        const result = new Uint8Array(totalLen);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.byteLength;
        }
        return result;
    }

    /**
     * Decompress raw DEFLATE data (no gzip header/trailer).
     * @param {Uint8Array} deflateBytes
     * @returns {Promise<Uint8Array>}
     */
    async function decompressDeflateRaw(deflateBytes) {
        const ds = new DecompressionStream('deflate-raw');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();

        writer.write(deflateBytes).catch(function () {});
        writer.close().catch(function () {});

        const chunks = [];
        let totalLen = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                totalLen += value.byteLength;
            }
        } catch (e) {
            // deflate-raw might still complain about trailing bytes
            if (totalLen === 0) throw e;
        }

        const result = new Uint8Array(totalLen);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.byteLength;
        }
        return result;
    }

    /**
     * Decompress gzip data using the browser's DecompressionStream API.
     * Uses multiple strategies to handle trailing junk bytes after the
     * gzip stream (common in .hxx files where compressed size is estimated).
     *
     * Strategy 1: Find exact gzip end via ISIZE trailer field, trim, decompress clean.
     * Strategy 2: Skip gzip header, decompress raw DEFLATE payload.
     * Strategy 3: Tolerant gzip decompress (catch errors, keep partial data).
     *
     * @param {Uint8Array} compressedBytes
     * @param {number} [expectedDecompSize] - decompressed size from section table
     * @returns {Promise<Uint8Array>}
     */
    async function decompressGzip(compressedBytes, expectedDecompSize) {
        if (typeof DecompressionStream === 'undefined') {
            throw new Error('DecompressionStream API not available');
        }

        // Strategy 1: Trim to exact gzip boundary using ISIZE
        if (expectedDecompSize && expectedDecompSize > 0) {
            const gzipEnd = findGzipEnd(compressedBytes, expectedDecompSize);
            if (gzipEnd > 0 && gzipEnd <= compressedBytes.length) {
                try {
                    const trimmed = compressedBytes.slice(0, gzipEnd);
                    const result = await decompressGzipClean(trimmed);
                    if (result.length === expectedDecompSize) {
                        return result;
                    }
                    console.warn('[HXXLoader] ISIZE trim: size mismatch (got ' +
                        result.length + ', expected ' + expectedDecompSize + ')');
                } catch (e) {
                    console.warn('[HXXLoader] ISIZE trim failed, trying fallback:', e.message);
                }
            }
        }

        // Strategy 2: Skip gzip header, use deflate-raw (avoids trailer validation)
        if (typeof DecompressionStream !== 'undefined') {
            const hdrSize = gzipHeaderSize(compressedBytes);
            if (hdrSize > 0) {
                try {
                    const deflatePayload = compressedBytes.slice(hdrSize);
                    const result = await decompressDeflateRaw(deflatePayload);
                    if (result.length > 0) {
                        return result;
                    }
                } catch (e) {
                    console.warn('[HXXLoader] deflate-raw fallback failed:', e.message);
                }
            }
        }

        // Strategy 3: Tolerant gzip decompress (original approach)
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();

        writer.write(compressedBytes).catch(function () {});
        writer.close().catch(function () {});

        const chunks = [];
        let totalLen = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                totalLen += value.byteLength;
            }
        } catch (e) {
            if (totalLen === 0) throw e;
            console.warn('[HXXLoader] Tolerant decompress — partial data collected:', e.message);
        }

        const result = new Uint8Array(totalLen);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.byteLength;
        }
        return result;
    }

    /**
     * Check if an ArrayBuffer starts with the Hamilton3dData magic.
     * @param {ArrayBuffer} buffer
     * @returns {boolean}
     */
    function isHXX(buffer) {
        if (!buffer || buffer.byteLength < 20) return false;
        const bytes = new Uint8Array(buffer, 0, HXX_MAGIC.length);
        let magic = '';
        for (let i = 0; i < HXX_MAGIC.length; i++) {
            magic += String.fromCharCode(bytes[i]);
        }
        return magic === HXX_MAGIC;
    }

    /**
     * Check if an ArrayBuffer starts with 'xof ' (a raw .x text file).
     * Some files have .hxx extension but contain raw DirectX .x data.
     * @param {ArrayBuffer} buffer
     * @returns {boolean}
     */
    function isRawXFile(buffer) {
        if (!buffer || buffer.byteLength < 4) return false;
        const bytes = new Uint8Array(buffer, 0, 4);
        return bytes[0] === 0x78 && bytes[1] === 0x6F &&
               bytes[2] === 0x66 && bytes[3] === 0x20; // 'xof '
    }

    /**
     * Parse a .hxx file and extract all sections.
     * @param {ArrayBuffer} buffer - The raw .hxx file bytes.
     * @returns {Promise<{xFileText: string, textures: Array<{name: string, blob: Blob}>}>}
     */
    async function parse(buffer) {
        // Some .hxx files are actually raw .x text — handle gracefully
        if (isRawXFile(buffer)) {
            const xFileText = new TextDecoder('utf-8').decode(new Uint8Array(buffer));
            return { xFileText: xFileText, textures: [] };
        }

        if (!isHXX(buffer)) {
            throw new Error('Not a valid .hxx file (missing Hamilton3dData header)');
        }

        const dv = new DataView(buffer);
        const allBytes = new Uint8Array(buffer);

        // Read section count at offset 16
        const sectionCount = readUint32BE(dv, 16);

        if (sectionCount === 0) {
            throw new Error('HXX file contains no sections');
        }

        // Parse section table (starts at offset 20, 12 bytes per entry)
        const sections = [];
        for (let i = 0; i < sectionCount; i++) {
            const base = 20 + i * 12;
            const nameOffset = readUint32BE(dv, base);
            const nameLen = readUint32BE(dv, base + 4);
            const decompressedSize = readUint32BE(dv, base + 8);

            // Read the section name
            let name = '';
            for (let c = 0; c < nameLen; c++) {
                name += String.fromCharCode(allBytes[nameOffset + c]);
            }

            const dataOffset = nameOffset + nameLen;

            sections.push({
                name: name,
                nameOffset: nameOffset,
                nameLen: nameLen,
                dataOffset: dataOffset,
                decompressedSize: decompressedSize,
            });
        }

        // Sort sections by their file offset to compute compressed sizes
        const sorted = sections.slice().sort((a, b) => a.nameOffset - b.nameOffset);

        // Compute compressed data size for each section
        for (let i = 0; i < sorted.length; i++) {
            const nextOffset = (i + 1 < sorted.length)
                ? sorted[i + 1].nameOffset
                : buffer.byteLength;
            sorted[i].compressedSize = nextOffset - sorted[i].dataOffset;
        }

        // Copy compressedSize back to original sections array
        const compSizeMap = {};
        for (const s of sorted) {
            compSizeMap[s.name] = s.compressedSize;
        }
        for (const s of sections) {
            s.compressedSize = compSizeMap[s.name];
        }

        // Find and decompress the main 3D data section
        const mainSection = sections.find(s => s.name === MAIN_SECTION);
        if (!mainSection) {
            throw new Error('HXX file has no __Main3dData__ section');
        }

        const mainCompressed = allBytes.slice(
            mainSection.dataOffset,
            mainSection.dataOffset + mainSection.compressedSize
        );
        const mainDecompressed = await decompressGzip(mainCompressed, mainSection.decompressedSize);

        // Check if the decompressed .x content is text or binary format.
        // Binary .x files start with "xof 0303bin" — these must stay as raw bytes.
        let xFileText;
        let xFileBinary = null;
        const headerStr = new TextDecoder('ascii').decode(mainDecompressed.slice(0, 16));
        if (headerStr.indexOf('bin ') !== -1 || headerStr.indexOf('bin\x00') !== -1) {
            // Binary .x format — cannot safely decode as UTF-8
            xFileBinary = mainDecompressed.buffer.byteLength === mainDecompressed.length
                ? mainDecompressed.buffer
                : mainDecompressed.slice().buffer;
            xFileText = null;
        } else {
            xFileText = new TextDecoder('utf-8').decode(mainDecompressed);
        }

        // Extract texture sections (all non-main sections, typically PNGs)
        const textures = [];
        for (const s of sections) {
            if (s.name === MAIN_SECTION) continue;

            try {
                const compressed = allBytes.slice(
                    s.dataOffset,
                    s.dataOffset + s.compressedSize
                );
                const decompressed = await decompressGzip(compressed, s.decompressedSize);

                // Determine MIME type from the section name
                let mimeType = 'application/octet-stream';
                const lower = s.name.toLowerCase();
                if (lower.endsWith('.png')) mimeType = 'image/png';
                else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) mimeType = 'image/jpeg';
                else if (lower.endsWith('.bmp')) mimeType = 'image/bmp';

                textures.push({
                    name: s.name,
                    blob: new Blob([decompressed], { type: mimeType }),
                });
            } catch (e) {
                console.warn('[HXXLoader] Failed to decompress texture section:', s.name, e);
            }
        }

        return { xFileText, xFileBinary, textures };
    }

    /**
     * Convenience: extract just the .x file text content as a Blob.
     * @param {ArrayBuffer} buffer
     * @returns {Promise<Blob>}
     */
    async function toXFileBlob(buffer) {
        const result = await parse(buffer);
        if (result.xFileBinary) {
            return new Blob([result.xFileBinary], { type: 'application/octet-stream' });
        }
        return new Blob([result.xFileText], { type: 'text/plain' });
    }

    /**
     * Convenience: check file extension.
     * @param {string} filename
     * @returns {boolean}
     */
    function isHXXFilename(filename) {
        return /\.hxx$/i.test(filename);
    }

    /**
     * Check if a filename is either .x or .hxx
     * @param {string} filename
     * @returns {boolean}
     */
    function isXOrHXX(filename) {
        return /\.(x|hxx)$/i.test(filename);
    }

    // ================================================================
    //  Compose — build a .hxx container from .x text (+ textures)
    // ================================================================

    /**
     * Compress data using browser CompressionStream('gzip').
     * @param {Uint8Array} data
     * @returns {Promise<Uint8Array>}
     */
    async function compressGzip(data) {
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        const reader = cs.readable.getReader();

        writer.write(data);
        writer.close();

        const chunks = [];
        let totalLen = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLen += value.byteLength;
        }

        const result = new Uint8Array(totalLen);
        let pos = 0;
        for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.byteLength;
        }
        return result;
    }

    /**
     * Build a Hamilton .hxx binary container from .x text and optional textures.
     *
     * @param {string} xFileText - The DirectX .x file content as a string.
     * @param {Array<{name: string, data: Uint8Array}>} [textures] - Optional texture sections.
     * @returns {Promise<ArrayBuffer>} The complete .hxx file as an ArrayBuffer.
     */
    async function composeHXX(xFileText, textures) {
        textures = textures || [];

        // Prepare sections array
        const sections = [];

        // Main 3D data section
        const xFileBytes = new TextEncoder().encode(xFileText);
        const xFileCompressed = await compressGzip(xFileBytes);
        sections.push({
            name: MAIN_SECTION,
            decompressedSize: xFileBytes.byteLength,
            compressedData: xFileCompressed,
        });

        // Texture sections
        for (const tex of textures) {
            const texCompressed = await compressGzip(tex.data);
            sections.push({
                name: tex.name,
                decompressedSize: tex.data.byteLength,
                compressedData: texCompressed,
            });
        }

        // Calculate binary layout
        const sectionCount = sections.length;
        const headerSize = 20; // 14 magic + 2 version + 4 sectionCount
        const tableSize = sectionCount * 12;
        let dataOffset = headerSize + tableSize;

        // Assign positions for each section's data
        for (const s of sections) {
            const nameBytes = new TextEncoder().encode(s.name);
            s.nameBytes = nameBytes;
            s.nameOffset = dataOffset;
            s.nameLen = nameBytes.byteLength;
            dataOffset += s.nameLen + s.compressedData.byteLength;
        }

        const totalSize = dataOffset;

        // Build the binary container
        const buffer = new ArrayBuffer(totalSize);
        const dv = new DataView(buffer);
        const allBytes = new Uint8Array(buffer);

        // [0..13] Magic: "Hamilton3dData"
        for (let i = 0; i < HXX_MAGIC.length; i++) {
            allBytes[i] = HXX_MAGIC.charCodeAt(i);
        }

        // [14..15] Version bytes
        allBytes[14] = 0x00;
        allBytes[15] = 0x01;

        // [16..19] Section count (big-endian uint32)
        dv.setUint32(16, sectionCount, false);

        // [20..] Section table: N entries × 12 bytes each
        for (let i = 0; i < sectionCount; i++) {
            const base = 20 + i * 12;
            dv.setUint32(base, sections[i].nameOffset, false);
            dv.setUint32(base + 4, sections[i].nameLen, false);
            dv.setUint32(base + 8, sections[i].decompressedSize, false);
        }

        // Section data blocks: name bytes + compressed data
        for (const s of sections) {
            allBytes.set(s.nameBytes, s.nameOffset);
            allBytes.set(s.compressedData, s.nameOffset + s.nameLen);
        }

        return buffer;
    }

    // ── Public API ───────────────────────────────────────────────
    window.HXXLoader = {
        isHXX: isHXX,
        isRawXFile: isRawXFile,
        isHXXFilename: isHXXFilename,
        isXOrHXX: isXOrHXX,
        parse: parse,
        toXFileBlob: toXFileBlob,
        composeHXX: composeHXX,
    };
})();
