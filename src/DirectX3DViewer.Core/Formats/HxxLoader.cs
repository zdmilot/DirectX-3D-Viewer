using System.IO.Compression;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Reads Hamilton <c>.hxx</c> archives: a <c>Hamilton3dData</c> container of
/// gzip-compressed sections. The <c>__Main3dData__</c> section holds a DirectX
/// <c>.x</c> model which is decompressed and handed to <see cref="XFileParser"/>.
/// </summary>
public static class HxxLoader
{
    private const string Magic = "Hamilton3dData";
    private const string MainSection = "__Main3dData__";

    public static SceneModel Parse(byte[] data, string? sourcePath = null)
    {
        // Some files carry a .hxx extension but contain raw .x text.
        if (data.Length >= 4 && data[0] == 'x' && data[1] == 'o' && data[2] == 'f' && data[3] == ' ')
            return XFileParser.Parse(data, sourcePath);

        if (data.Length < Magic.Length ||
            Encoding.ASCII.GetString(data, 0, Magic.Length) != Magic)
            throw new InvalidDataException("Not a Hamilton3dData (.hxx) file.");

        int pos = Magic.Length + 2; // skip 2 version bytes
        int sectionCount = ReadUInt32BE(data, pos); pos += 4;

        var sections = new List<(int nameOffset, int nameLen, int decompSize)>();
        for (int i = 0; i < sectionCount; i++)
        {
            int nameOffset = ReadUInt32BE(data, pos);
            int nameLen = ReadUInt32BE(data, pos + 4);
            int decompSize = ReadUInt32BE(data, pos + 8);
            pos += 12;
            sections.Add((nameOffset, nameLen, decompSize));
        }

        byte[]? mainX = null;
        var warnings = new List<string>();
        for (int i = 0; i < sections.Count; i++)
        {
            var (nameOffset, nameLen, decompSize) = sections[i];
            if (nameOffset + nameLen > data.Length) continue;
            string name = Encoding.ASCII.GetString(data, nameOffset, nameLen);

            int dataStart = nameOffset + nameLen;
            int dataEnd = (i + 1 < sections.Count) ? sections[i + 1].nameOffset : data.Length;
            int compLen = Math.Max(0, dataEnd - dataStart);

            if (name == MainSection)
            {
                mainX = Gunzip(data, dataStart, compLen, decompSize, warnings);
                break;
            }
        }

        if (mainX is null || mainX.Length == 0)
            throw new InvalidDataException("No __Main3dData__ section found in .hxx file.");

        var scene = XFileParser.Parse(mainX, sourcePath);
        scene.Warnings.AddRange(warnings);
        return scene;
    }

    private static byte[] Gunzip(byte[] data, int start, int length, int expected, List<string> warnings)
    {
        // Strategy 1: standard gzip over the section slice.
        try
        {
            using var ms = new MemoryStream(data, start, length);
            using var gz = new GZipStream(ms, CompressionMode.Decompress);
            using var outMs = new MemoryStream(expected > 0 ? expected : 0);
            gz.CopyTo(outMs);
            if (outMs.Length > 0) return outMs.ToArray();
        }
        catch { /* fall through */ }

        // Strategy 2: raw DEFLATE, skipping a standard 10-byte gzip header.
        try
        {
            int rawStart = start + 10;
            int rawLen = length - 10;
            if (rawLen > 0)
            {
                using var ms = new MemoryStream(data, rawStart, rawLen);
                using var df = new DeflateStream(ms, CompressionMode.Decompress);
                using var outMs = new MemoryStream();
                df.CopyTo(outMs);
                if (outMs.Length > 0) return outMs.ToArray();
            }
        }
        catch { /* fall through */ }

        warnings.Add("Failed to decompress __Main3dData__ section.");
        return Array.Empty<byte>();
    }

    private static int ReadUInt32BE(byte[] d, int i)
    {
        if (i + 4 > d.Length) return 0;
        return (d[i] << 24) | (d[i + 1] << 16) | (d[i + 2] << 8) | d[i + 3];
    }
}
