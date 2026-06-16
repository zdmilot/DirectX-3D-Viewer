using System.Globalization;
using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>Loads Wavefront OBJ geometry (positions, normals, UVs, groups).</summary>
public static class ObjLoader
{
    public static SceneModel Parse(byte[] data, string? sourcePath = null)
    {
        var scene = new SceneModel { SourcePath = sourcePath };
        string text = Encoding.UTF8.GetString(data);

        var positions = new List<Vector3>();
        var normals = new List<Vector3>();
        var uvs = new List<Vector2>();

        var mesh = new MeshData { Name = "OBJ" };
        var vertexCache = new Dictionary<(int, int, int), int>();
        var triMaterial = new List<int>();

        foreach (var rawLine in text.Split('\n'))
        {
            string line = rawLine.Trim();
            if (line.Length == 0 || line[0] == '#') continue;
            var parts = line.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0) continue;

            switch (parts[0])
            {
                case "v":
                    positions.Add(new Vector3(F(parts, 1), F(parts, 2), F(parts, 3)));
                    break;
                case "vn":
                    normals.Add(new Vector3(F(parts, 1), F(parts, 2), F(parts, 3)));
                    break;
                case "vt":
                    uvs.Add(new Vector2(F(parts, 1), parts.Length > 2 ? F(parts, 2) : 0f));
                    break;
                case "f":
                {
                    int corners = parts.Length - 1;
                    var idx = new int[corners];
                    for (int c = 0; c < corners; c++)
                        idx[c] = GetVertex(parts[c + 1], positions, normals, uvs, mesh, vertexCache);
                    for (int k = 1; k + 1 < corners; k++)
                    {
                        mesh.Indices.Add(idx[0]);
                        mesh.Indices.Add(idx[k]);
                        mesh.Indices.Add(idx[k + 1]);
                        triMaterial.Add(0);
                    }
                    break;
                }
            }
        }

        if (mesh.Normals.Count != mesh.Positions.Count)
            mesh.ComputeNormals();

        mesh.Materials.Add(new MeshMaterial());
        mesh.Groups.Add(new MaterialGroup(0, mesh.Indices.Count, 0));
        if (mesh.VertexCount > 0) scene.Meshes.Add(mesh);
        return scene;
    }

    private static int GetVertex(
        string token, List<Vector3> positions, List<Vector3> normals, List<Vector2> uvs,
        MeshData mesh, Dictionary<(int, int, int), int> cache)
    {
        var f = token.Split('/');
        int vi = ParseRef(f, 0, positions.Count);
        int ti = f.Length > 1 ? ParseRef(f, 1, uvs.Count) : -1;
        int ni = f.Length > 2 ? ParseRef(f, 2, normals.Count) : -1;

        var key = (vi, ti, ni);
        if (cache.TryGetValue(key, out int existing)) return existing;

        int index = mesh.Positions.Count;
        mesh.Positions.Add(vi >= 0 && vi < positions.Count ? positions[vi] : Vector3.Zero);
        if (ni >= 0 && ni < normals.Count) mesh.Normals.Add(normals[ni]);
        else mesh.Normals.Add(Vector3.Zero);
        mesh.TexCoords.Add(ti >= 0 && ti < uvs.Count ? uvs[ti] : Vector2.Zero);

        cache[key] = index;
        return index;
    }

    private static int ParseRef(string[] f, int slot, int count)
    {
        if (slot >= f.Length || f[slot].Length == 0) return -1;
        if (!int.TryParse(f[slot], NumberStyles.Integer, CultureInfo.InvariantCulture, out int v)) return -1;
        return v < 0 ? count + v : v - 1; // OBJ is 1-based; negatives are relative
    }

    private static float F(string[] p, int i) =>
        i < p.Length && float.TryParse(p[i], NumberStyles.Float, CultureInfo.InvariantCulture, out float v) ? v : 0f;
}
