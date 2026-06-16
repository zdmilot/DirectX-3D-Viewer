using System.IO.Compression;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Minimal MSZIP decompressor for compressed DirectX <c>.x</c> files
/// (<c>tzip</c>/<c>bzip</c>). Handles the common single-block case; multi-block
/// streams that rely on a cross-block LZ77 dictionary are decoded best-effort.
/// </summary>
internal static class MsZip
{
    public static byte[] Decompress(byte[] data, int headerLen)
    {
        // Layout: [16-byte .x header][uint32 total decompressed size][MSZIP blocks]
        int pos = headerLen;
        if (pos + 4 > data.Length) return Array.Empty<byte>();
        pos += 4; // skip declared total size

        using var output = new MemoryStream();
        while (pos + 4 <= data.Length)
        {
            int uncompSize = data[pos] | (data[pos + 1] << 8);
            int compSize = data[pos + 2] | (data[pos + 3] << 8);
            pos += 4;
            if (compSize <= 0 || pos + compSize > data.Length) break;

            int blockStart = pos;
            // Each MSZIP block begins with the signature "CK".
            if (compSize >= 2 && data[blockStart] == 0x43 && data[blockStart + 1] == 0x4B)
                blockStart += 2;

            int deflateLen = compSize - (blockStart - pos);
            try
            {
                using var ms = new MemoryStream(data, blockStart, deflateLen);
                using var deflate = new DeflateStream(ms, CompressionMode.Decompress);
                deflate.CopyTo(output);
            }
            catch
            {
                break; // best-effort: stop at the first undecodable block
            }
            pos += compSize;
            if (uncompSize < 0x8000) break; // last block (less than a full 32 KB window)
        }
        return output.ToArray();
    }
}
