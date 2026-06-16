using System.Globalization;
using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Loads Wavefront OBJ geometry (positions, normals, UVs) plus referenced
/// <c>.mtl</c> materials resolved from the same directory as the source file (or
/// from a supplied companion resolver, e.g. for in-memory/CLI loading).
/// </summary>
public static class ObjLoader
{
    /// <summary>
    /// Parses an OBJ model. <paramref name="companionResolver"/> is used to fetch
    /// sibling files (e.g. <c>.mtl</c>) by name; when null, files are read from the
    /// directory of <paramref name="sourcePath"/> if it exists on disk.
    /// </summary>
    public static SceneModel Parse(byte[] data, string? sourcePath = null, Func<string, byte[]?>? companionResolver = null)
    {
        var scene = new SceneModel { SourcePath = sourcePath };
        string text = Encoding.UTF8.GetString(data);

        companionResolver ??= MakeDiskResolver(sourcePath);

        var positions = new List<Vector3>();
        var normals = new List<Vector3>();
        var uvs = new List<Vector2>();

        var mesh = new MeshData { Name = "OBJ" };
        var vertexCache = new Dictionary<(int, int, int), int>();
        var triMaterial = new List<int>();

        // Material library (name -> material) gathered from any mtllib files.
        var library = new Dictionary<string, MeshMaterial>(StringComparer.OrdinalIgnoreCase);
        // Materials actually referenced by the geometry (index 0 is the default).
        var matIndex = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        mesh.Materials.Add(new MeshMaterial { Name = "default" });
        int currentMat = 0;

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
                case "mtllib":
                    for (int i = 1; i < parts.Length; i++)
                        LoadMtl(parts[i], companionResolver, library, scene);
                    break;
                case "usemtl":
                {
                    string name = line.Length > 7 ? line[7..].Trim() : string.Empty;
                    currentMat = ResolveMaterial(name, library, matIndex, mesh);
                    break;
                }
                case "f":
                {
                    int corners = parts.Length - 1;
                    if (corners < 3) break;
                    var idx = new int[corners];
                    for (int c = 0; c < corners; c++)
                        idx[c] = GetVertex(parts[c + 1], positions, normals, uvs, mesh, vertexCache);
                    for (int k = 1; k + 1 < corners; k++)
                    {
                        mesh.Indices.Add(idx[0]);
                        mesh.Indices.Add(idx[k]);
                        mesh.Indices.Add(idx[k + 1]);
                        triMaterial.Add(currentMat);
                    }
                    break;
                }
            }
        }

        if (mesh.Normals.Count != mesh.Positions.Count)
            mesh.ComputeNormals();

        BuildGroups(mesh, triMaterial);
        if (mesh.VertexCount > 0) scene.Meshes.Add(mesh);
        return scene;
    }

    /// <summary>Builds contiguous material groups over the index buffer, preserving face order.</summary>
    private static void BuildGroups(MeshData mesh, List<int> triMaterial)
    {
        mesh.Groups.Clear();
        if (triMaterial.Count == 0)
        {
            mesh.Groups.Add(new MaterialGroup(0, mesh.Indices.Count, 0));
            return;
        }

        int runMat = triMaterial[0];
        int runStartTri = 0;
        for (int t = 1; t <= triMaterial.Count; t++)
        {
            if (t == triMaterial.Count || triMaterial[t] != runMat)
            {
                int start = runStartTri * 3;
                int count = (t - runStartTri) * 3;
                mesh.Groups.Add(new MaterialGroup(start, count, runMat));
                if (t < triMaterial.Count) { runMat = triMaterial[t]; runStartTri = t; }
            }
        }
    }

    private static int ResolveMaterial(string name, Dictionary<string, MeshMaterial> library,
        Dictionary<string, int> matIndex, MeshData mesh)
    {
        if (string.IsNullOrEmpty(name)) return 0;
        if (matIndex.TryGetValue(name, out int existing)) return existing;

        var mat = library.TryGetValue(name, out var libMat)
            ? libMat
            : new MeshMaterial { Name = name };
        int index = mesh.Materials.Count;
        mesh.Materials.Add(mat);
        matIndex[name] = index;
        return index;
    }

    private static void LoadMtl(string fileName, Func<string, byte[]?> resolver,
        Dictionary<string, MeshMaterial> library, SceneModel scene)
    {
        byte[]? bytes;
        try { bytes = resolver(fileName); }
        catch { bytes = null; }
        if (bytes is null)
        {
            scene.Warnings.Add($"Material library not found: {fileName}");
            return;
        }
        ParseMtl(Encoding.UTF8.GetString(bytes), library);
    }

    /// <summary>Parses an MTL document into the shared material library.</summary>
    private static void ParseMtl(string text, Dictionary<string, MeshMaterial> library)
    {
        MeshMaterial? current = null;
        foreach (var rawLine in text.Split('\n'))
        {
            string line = rawLine.Trim();
            if (line.Length == 0 || line[0] == '#') continue;
            var p = line.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries);
            if (p.Length == 0) continue;

            switch (p[0].ToLowerInvariant())
            {
                case "newmtl":
                    current = new MeshMaterial { Name = p.Length > 1 ? line[6..].Trim() : "material" };
                    library[current.Name] = current;
                    break;
                case "kd":
                    if (current is not null) current.Diffuse = new Vector3(F(p, 1), F(p, 2), F(p, 3));
                    break;
                case "ks":
                    if (current is not null) current.Specular = new Vector3(F(p, 1), F(p, 2), F(p, 3));
                    break;
                case "ke":
                    if (current is not null) current.Emissive = new Vector3(F(p, 1), F(p, 2), F(p, 3));
                    break;
                case "ns":
                    if (current is not null) current.Shininess = F(p, 1);
                    break;
                case "d":
                    if (current is not null) current.Opacity = Math.Clamp(F(p, 1), 0f, 1f);
                    break;
                case "tr":
                    if (current is not null) current.Opacity = Math.Clamp(1f - F(p, 1), 0f, 1f);
                    break;
                case "map_kd":
                    if (current is not null && p.Length > 1)
                        current.TextureFile = Path.GetFileName(line[6..].Trim());
                    break;
            }
        }
    }

    private static Func<string, byte[]?> MakeDiskResolver(string? sourcePath)
    {
        string? dir = string.IsNullOrEmpty(sourcePath) ? null : Path.GetDirectoryName(sourcePath);
        return name =>
        {
            if (string.IsNullOrEmpty(name)) return null;
            // Try the path as given, then resolved against the source directory.
            string candidate = name;
            if (!File.Exists(candidate) && dir is not null)
                candidate = Path.Combine(dir, Path.GetFileName(name));
            return File.Exists(candidate) ? File.ReadAllBytes(candidate) : null;
        };
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
