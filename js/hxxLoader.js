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
     * Decompress gzip data using the browser's DecompressionStream API.
     * Falls back to manual inflate if DecompressionStream is unavailable.
     * @param {Uint8Array} compressedBytes
     * @returns {Promise<Uint8Array>}
     */
    async function decompressGzip(compressedBytes) {
        // Modern browsers support DecompressionStream
        if (typeof DecompressionStream !== 'undefined') {
            const ds = new DecompressionStream('gzip');
            const writer = ds.writable.getWriter();
            const reader = ds.readable.getReader();

            // Write compressed data
            writer.write(compressedBytes);
            writer.close();

            // Read all decompressed chunks
            const chunks = [];
            let totalLen = 0;
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                totalLen += value.byteLength;
            }

            // Combine chunks into a single Uint8Array
            const result = new Uint8Array(totalLen);
            let pos = 0;
            for (const chunk of chunks) {
                result.set(chunk, pos);
                pos += chunk.byteLength;
            }
            return result;
        }

        // Fallback: try using Response + ReadableStream with gzip
        // (works in Chrome, Edge, Firefox with Blob trick)
        const blob = new Blob([compressedBytes]);
        const resp = new Response(blob.stream().pipeThrough(new DecompressionStream('gzip')));
        const ab = await resp.arrayBuffer();
        return new Uint8Array(ab);
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
     * Parse a .hxx file and extract all sections.
     * @param {ArrayBuffer} buffer - The raw .hxx file bytes.
     * @returns {Promise<{xFileText: string, textures: Array<{name: string, blob: Blob}>}>}
     */
    async function parse(buffer) {
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
        const mainDecompressed = await decompressGzip(mainCompressed);

        // Decode as text (it's a standard .x text file)
        const xFileText = new TextDecoder('utf-8').decode(mainDecompressed);

        // Extract texture sections (all non-main sections, typically PNGs)
        const textures = [];
        for (const s of sections) {
            if (s.name === MAIN_SECTION) continue;

            try {
                const compressed = allBytes.slice(
                    s.dataOffset,
                    s.dataOffset + s.compressedSize
                );
                const decompressed = await decompressGzip(compressed);

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

        return { xFileText, textures };
    }

    /**
     * Convenience: extract just the .x file text content as a Blob.
     * @param {ArrayBuffer} buffer
     * @returns {Promise<Blob>}
     */
    async function toXFileBlob(buffer) {
        const result = await parse(buffer);
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

    // ── Public API ───────────────────────────────────────────────
    window.HXXLoader = {
        isHXX: isHXX,
        isHXXFilename: isHXXFilename,
        isXOrHXX: isXOrHXX,
        parse: parse,
        toXFileBlob: toXFileBlob,
    };
})();
