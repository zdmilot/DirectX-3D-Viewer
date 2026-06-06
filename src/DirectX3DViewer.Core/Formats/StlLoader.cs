using System.Globalization;
using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>Loads binary and ASCII STL files.</summary>
public static class StlLoader
{
    public static SceneModel Parse(byte[] data, string? sourcePath = null)
    {
        var scene = new SceneModel { SourcePath = sourcePath };
        var mesh = IsAscii(data) ? ParseAscii(data) : ParseBinary(data);
        mesh.Materials.Add(new MeshMaterial { Diffuse = new Vector3(0.53f, 0.60f, 0.67f), Shininess = 30f });
        mesh.Groups.Add(new MaterialGroup(0, mesh.Indices.Count, 0));
        scene.Meshes.Add(mesh);
        return scene;
    }

    private static bool IsAscii(byte[] data)
    {
        if (data.Length < 84) return true;
        // Binary STL: 80-byte header + uint32 count; verify the size matches.
        uint count = BitConverter.ToUInt32(data, 80);
        long expected = 84L + count * 50L;
        if (expected == data.Length) return false;
        // Heuristic: starts with "solid" and contains "facet".
        string head = Encoding.ASCII.GetString(data, 0, Math.Min(256, data.Length));
        return head.TrimStart().StartsWith("solid", StringComparison.OrdinalIgnoreCase) &&
               head.Contains("facet", StringComparison.OrdinalIgnoreCase);
    }

    private static MeshData ParseBinary(byte[] data)
    {
        var mesh = new MeshData { Name = "STL" };
        uint count = BitConverter.ToUInt32(data, 80);
        int pos = 84;
        for (uint t = 0; t < count && pos + 50 <= data.Length; t++, pos += 50)
        {
            var nrm = new Vector3(
                BitConverter.ToSingle(data, pos),
                BitConverter.ToSingle(data, pos + 4),
                BitConverter.ToSingle(data, pos + 8));
            for (int v = 0; v < 3; v++)
            {
                int o = pos + 12 + v * 12;
                mesh.Indices.Add(mesh.Positions.Count);
                mesh.Positions.Add(new Vector3(
                    BitConverter.ToSingle(data, o),
                    BitConverter.ToSingle(data, o + 4),
                    BitConverter.ToSingle(data, o + 8)));
                mesh.Normals.Add(nrm);
            }
        }
        FixNormals(mesh);
        return mesh;
    }

    private static MeshData ParseAscii(byte[] data)
    {
        var mesh = new MeshData { Name = "STL" };
        string text = Encoding.ASCII.GetString(data);
        var tokens = text.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
        Vector3 normal = Vector3.UnitY;
        for (int i = 0; i < tokens.Length; i++)
        {
            if (tokens[i] == "facet" && i + 4 < tokens.Length && tokens[i + 1] == "normal")
            {
                normal = new Vector3(F(tokens[i + 2]), F(tokens[i + 3]), F(tokens[i + 4]));
                i += 4;
            }
            else if (tokens[i] == "vertex" && i + 3 < tokens.Length)
            {
                mesh.Indices.Add(mesh.Positions.Count);
                mesh.Positions.Add(new Vector3(F(tokens[i + 1]), F(tokens[i + 2]), F(tokens[i + 3])));
                mesh.Normals.Add(normal);
                i += 3;
            }
        }
        FixNormals(mesh);
        return mesh;
    }

    private static void FixNormals(MeshData mesh)
    {
        bool zero = true;
        foreach (var n in mesh.Normals)
            if (n.LengthSquared() > 1e-10f) { zero = false; break; }
        if (zero) mesh.ComputeNormals();
    }

    private static float F(string s) =>
        float.TryParse(s, NumberStyles.Float, CultureInfo.InvariantCulture, out float v) ? v : 0f;
}
