using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Reads DirectX <c>.x</c> models (text format) into a <see cref="SceneModel"/>.
/// Frame transforms are baked into vertices and the geometry is converted from
/// DirectX's left-handed space to the renderer's right-handed Y-up space
/// (negate Z, flip winding) â€” matching the original viewer's pipeline so saved
/// files round-trip identically.
/// </summary>
public static class XFileParser
{
    public static SceneModel Parse(byte[] data, string? sourcePath = null)
    {
        var scene = new SceneModel { SourcePath = sourcePath };

        string format = DetectFormat(data, out int headerLen);
        string text;
        switch (format)
        {
            case "txt":
                text = DecodeText(data, headerLen);
                break;
            case "tzip":
            case "bzip":
                byte[] inflated = MsZip.Decompress(data, headerLen);
                text = format == "tzip"
                    ? Encoding.Latin1.GetString(inflated)
                    : XBinary.ToText(inflated, 0, scene.Warnings);
                break;
            case "bin":
                text = XBinary.ToText(data, headerLen, scene.Warnings);
                break;
            default:
                // No recognisable header: assume raw text.
                text = DecodeText(data, 0);
                break;
        }

        ParseText(text, scene);
        ConvertLeftHandedToRight(scene);
        return scene;
    }

    /// <summary>Returns "txt", "bin", "tzip", "bzip", or "" if no header.</summary>
    private static string DetectFormat(byte[] data, out int headerLen)
    {
        headerLen = 0;
        if (data.Length >= 16 &&
            data[0] == 'x' && data[1] == 'o' && data[2] == 'f' && data[3] == ' ')
        {
            headerLen = 16;
            string code = Encoding.ASCII.GetString(data, 8, 4).Trim();
            return code switch
            {
                "txt" => "txt",
                "bin" => "bin",
                "tzip" => "tzip",
                "bzip" => "bzip",
                _ => "txt",
            };
        }
        return string.Empty;
    }

    private static string DecodeText(byte[] data, int offset)
    {
        // Latin1 preserves every byte 1:1; .x text is ASCII so this is lossless.
        return Encoding.Latin1.GetString(data, offset, data.Length - offset);
    }

    // â”€â”€ Text parsing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private static void ParseText(string text, SceneModel scene)
    {
        var reader = new XReader(text);
        var globalMaterials = new Dictionary<string, MeshMaterial>(StringComparer.OrdinalIgnoreCase);

        while (!reader.Eof)
        {
            string? type = reader.Next();
            if (type is null) break;
            if (type == "}") continue; // stray
            if (type == "{") { reader.SkipBlockBody(); continue; }

            // Optional node name precedes the opening brace.
            string name = string.Empty;
            string nextTok = reader.Peek();
            if (nextTok != "{")
            {
                name = reader.Next() ?? string.Empty;
                nextTok = reader.Peek();
            }
            if (nextTok != "{")
            {
                // Not a block (e.g. header leftover); skip token.
                continue;
            }
            reader.ExpectOpen();

            switch (type)
            {
                case "template":
                    reader.SkipBlockBody();
                    break;
                case "Frame":
                    ParseFrame(reader, scene, globalMaterials, Matrix4x4.Identity, name);
                    break;
                case "Mesh":
                    var mesh = ParseMesh(reader, name, globalMaterials, scene.Warnings);
                    if (mesh.VertexCount > 0) scene.Meshes.Add(mesh);
                    break;
                case "Material":
                    var mat = ParseMaterial(reader);
                    if (!string.IsNullOrEmpty(name)) globalMaterials[name] = mat;
                    break;
                default:
                    reader.SkipBlockBody();
                    break;
            }
        }
    }

    private static void ParseFrame(
        XReader reader, SceneModel scene,
        Dictionary<string, MeshMaterial> globalMaterials,
        Matrix4x4 parent, string frameName)
    {
        var local = Matrix4x4.Identity;
        var collected = new List<MeshData>();

        while (true)
        {
            string? type = reader.Next();
            if (type is null || type == "}") break;
            if (type == "{") { reader.SkipBlockBody(); continue; }

            string name = string.Empty;
            string nextTok = reader.Peek();
            if (nextTok != "{")
            {
                name = reader.Next() ?? string.Empty;
                nextTok = reader.Peek();
            }
            if (nextTok != "{") continue;
            reader.ExpectOpen();

            switch (type)
            {
                case "FrameTransformMatrix":
                    local = ReadMatrix(reader);
                    reader.SkipBlockBody();
                    break;
                case "Frame":
                    ParseFrameInto(reader, collected, globalMaterials, name, scene.Warnings);
                    break;
                case "Mesh":
                    var mesh = ParseMesh(reader, name, globalMaterials, scene.Warnings);
                    if (mesh.VertexCount > 0) collected.Add(mesh);
                    break;
                default:
                    reader.SkipBlockBody();
                    break;
            }
        }

        // Apply this frame's local transform, lifting meshes into parent space.
        foreach (var m in collected)
        {
            if (local != Matrix4x4.Identity) m.ApplyTransform(local);
            scene.Meshes.Add(m);
        }
    }

    /// <summary>Parse a nested frame, returning its meshes in this frame's local space.</summary>
    private static void ParseFrameInto(
        XReader reader, List<MeshData> output,
        Dictionary<string, MeshMaterial> globalMaterials,
        string frameName, List<string> warnings)
    {
        var local = Matrix4x4.Identity;
        var collected = new List<MeshData>();

        while (true)
        {
            string? type = reader.Next();
            if (type is null || type == "}") break;
            if (type == "{") { reader.SkipBlockBody(); continue; }

            string name = string.Empty;
            string nextTok = reader.Peek();
            if (nextTok != "{")
            {
                name = reader.Next() ?? string.Empty;
                nextTok = reader.Peek();
            }
            if (nextTok != "{") continue;
            reader.ExpectOpen();

            switch (type)
            {
                case "FrameTransformMatrix":
                    local = ReadMatrix(reader);
                    reader.SkipBlockBody();
                    break;
                case "Frame":
                    ParseFrameInto(reader, collected, globalMaterials, name, warnings);
                    break;
                case "Mesh":
                    var mesh = ParseMesh(reader, name, globalMaterials, warnings);
                    if (mesh.VertexCount > 0) collected.Add(mesh);
                    break;
                default:
                    reader.SkipBlockBody();
                    break;
            }
        }

        foreach (var m in collected)
        {
            if (local != Matrix4x4.Identity) m.ApplyTransform(local);
            output.Add(m);
        }
    }

    private static Matrix4x4 ReadMatrix(XReader reader)
    {
        Span<float> m = stackalloc float[16];
        for (int i = 0; i < 16; i++) m[i] = reader.ReadFloat();
        return new Matrix4x4(
            m[0], m[1], m[2], m[3],
            m[4], m[5], m[6], m[7],
            m[8], m[9], m[10], m[11],
            m[12], m[13], m[14], m[15]);
    }

    private static MeshData ParseMesh(
        XReader reader, string name,
        Dictionary<string, MeshMaterial> globalMaterials,
        List<string> warnings)
    {
        var mesh = new MeshData { Name = name };

        int vertCount = reader.ReadInt();
        var positions = new Vector3[vertCount];
        for (int i = 0; i < vertCount; i++)
            positions[i] = new Vector3(reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat());

        int faceCount = reader.ReadInt();
        var faces = new int[faceCount][];
        for (int f = 0; f < faceCount; f++)
        {
            int n = reader.ReadInt();
            var idx = new int[n];
            for (int k = 0; k < n; k++) idx[k] = reader.ReadInt();
            faces[f] = idx;
        }

        // Optional sub-blocks.
        Vector3[]? normals = null;
        int[][]? normalFaces = null;
        Vector2[]? texCoords = null;
        var meshMaterials = new List<MeshMaterial>();
        int[]? faceMaterialIndex = null;

        while (true)
        {
            string? type = reader.Next();
            if (type is null || type == "}") break;
            if (type == "{") { reader.SkipBlockBody(); continue; }

            string subName = string.Empty;
            string nextTok = reader.Peek();
            if (nextTok != "{")
            {
                subName = reader.Next() ?? string.Empty;
                nextTok = reader.Peek();
            }
            if (nextTok != "{")
            {
                // A bare material reference: `{ name }` handled above; otherwise skip.
                continue;
            }
            reader.ExpectOpen();

            switch (type)
            {
                case "MeshNormals":
                {
                    int nc = reader.ReadInt();
                    normals = new Vector3[nc];
                    for (int i = 0; i < nc; i++)
                        normals[i] = new Vector3(reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat());
                    int nfc = reader.ReadInt();
                    normalFaces = new int[nfc][];
                    for (int f = 0; f < nfc; f++)
                    {
                        int n = reader.ReadInt();
                        var idx = new int[n];
                        for (int k = 0; k < n; k++) idx[k] = reader.ReadInt();
                        normalFaces[f] = idx;
                    }
                    reader.SkipBlockBody();
                    break;
                }
                case "MeshTextureCoords":
                {
                    int tc = reader.ReadInt();
                    texCoords = new Vector2[tc];
                    for (int i = 0; i < tc; i++)
                        texCoords[i] = new Vector2(reader.ReadFloat(), reader.ReadFloat());
                    reader.SkipBlockBody();
                    break;
                }
                case "MeshMaterialList":
                {
                    int nMat = reader.ReadInt();
                    int nFaceIdx = reader.ReadInt();
                    faceMaterialIndex = new int[nFaceIdx];
                    for (int i = 0; i < nFaceIdx; i++) faceMaterialIndex[i] = reader.ReadInt();

                    // Inline Material nodes / references follow.
                    while (true)
                    {
                        string? mt = reader.Next();
                        if (mt is null || mt == "}") break;
                        if (mt == "{") { reader.SkipBlockBody(); continue; }
                        string mName = string.Empty;
                        string mNext = reader.Peek();
                        if (mNext != "{")
                        {
                            mName = reader.Next() ?? string.Empty;
                            mNext = reader.Peek();
                        }
                        if (mNext != "{")
                        {
                            // Reference by name `{ MaterialName }` form already consumed name.
                            if (!string.IsNullOrEmpty(mName) && globalMaterials.TryGetValue(mName, out var gref))
                                meshMaterials.Add(gref.Clone());
                            continue;
                        }
                        reader.ExpectOpen();
                        if (mt == "Material")
                        {
                            var m = ParseMaterial(reader);
                            if (!string.IsNullOrEmpty(mName))
                            {
                                m.Name = mName;
                                globalMaterials[mName] = m;
                            }
                            meshMaterials.Add(m);
                        }
                        else if (mt == "{" && !string.IsNullOrEmpty(mName) &&
                                 globalMaterials.TryGetValue(mName, out var gref2))
                        {
                            meshMaterials.Add(gref2.Clone());
                            reader.SkipBlockBody();
                        }
                        else
                        {
                            reader.SkipBlockBody();
                        }
                    }
                    break;
                }
                default:
                    reader.SkipBlockBody();
                    break;
            }
        }

        BuildMesh(mesh, positions, faces, normals, normalFaces, texCoords, meshMaterials, faceMaterialIndex);
        return mesh;
    }

    private static MeshMaterial ParseMaterial(XReader reader)
    {
        var mat = new MeshMaterial();
        // ColorRGBA diffuse
        float r = reader.ReadFloat(), g = reader.ReadFloat(), b = reader.ReadFloat(), a = reader.ReadFloat();
        mat.Diffuse = new Vector3(r, g, b);
        mat.Opacity = a;
        // power
        mat.Shininess = reader.ReadFloat();
        // specular RGB
        mat.Specular = new Vector3(reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat());
        // emissive RGB
        mat.Emissive = new Vector3(reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat());

        // Optional texture sub-nodes.
        while (true)
        {
            string? type = reader.Next();
            if (type is null || type == "}") break;
            if (type == "{") { reader.SkipBlockBody(); continue; }

            string nextTok = reader.Peek();
            if (nextTok != "{")
            {
                // a stray token
                continue;
            }
            reader.ExpectOpen();
            if (type.StartsWith("TextureFile", StringComparison.OrdinalIgnoreCase))
            {
                string file = reader.Next() ?? string.Empty;
                if (!string.IsNullOrEmpty(file) && file != "}") mat.TextureFile = file;
                reader.SkipBlockBody();
            }
            else
            {
                reader.SkipBlockBody();
            }
        }
        return mat;
    }

    /// <summary>
    /// Expand parsed faces into a flat indexed triangle mesh. When the file
    /// supplies normals they are used (with their own face indexing); otherwise
    /// smooth normals are computed. Per-face material assignments become groups.
    /// </summary>
    private static void BuildMesh(
        MeshData mesh,
        Vector3[] positions, int[][] faces,
        Vector3[]? normals, int[][]? normalFaces,
        Vector2[]? texCoords,
        List<MeshMaterial> materials,
        int[]? faceMaterialIndex)
    {
        bool useFileNormals = normals is { Length: > 0 } && normalFaces is { Length: > 0 };

        if (materials.Count == 0)
            materials.Add(new MeshMaterial());
        mesh.Materials.AddRange(materials);

        // Triangle list with a parallel material index per triangle.
        var triMaterial = new List<int>();

        if (useFileNormals)
        {
            // Flat (expanded) build using file normals.
            for (int f = 0; f < faces.Length; f++)
            {
                int[] vf = faces[f];
                int[] nf = (f < normalFaces!.Length) ? normalFaces[f] : vf;
                int matIdx = ResolveFaceMaterial(faceMaterialIndex, f, materials.Count);
                for (int k = 1; k + 1 < vf.Length; k++)
                {
                    AddCorner(mesh, positions, normals!, texCoords, vf[0], NIdx(nf, 0));
                    AddCorner(mesh, positions, normals!, texCoords, vf[k], NIdx(nf, k));
                    AddCorner(mesh, positions, normals!, texCoords, vf[k + 1], NIdx(nf, k + 1));
                    triMaterial.Add(matIdx);
                }
            }
        }
        else
        {
            // Indexed build sharing vertices by position index; smooth normals.
            for (int i = 0; i < positions.Length; i++)
            {
                mesh.Positions.Add(positions[i]);
                if (texCoords is { Length: > 0 })
                    mesh.TexCoords.Add(i < texCoords.Length ? texCoords[i] : Vector2.Zero);
            }
            for (int f = 0; f < faces.Length; f++)
            {
                int[] vf = faces[f];
                int matIdx = ResolveFaceMaterial(faceMaterialIndex, f, materials.Count);
                for (int k = 1; k + 1 < vf.Length; k++)
                {
                    mesh.Indices.Add(vf[0]);
                    mesh.Indices.Add(vf[k]);
                    mesh.Indices.Add(vf[k + 1]);
                    triMaterial.Add(matIdx);
                }
            }
            mesh.ComputeNormals();
        }

        BuildGroups(mesh, triMaterial);
    }

    private static int NIdx(int[] nf, int k) => k < nf.Length ? nf[k] : (nf.Length > 0 ? nf[^1] : 0);

    private static void AddCorner(
        MeshData mesh, Vector3[] positions, Vector3[] normals, Vector2[]? texCoords,
        int posIdx, int nrmIdx)
    {
        mesh.Indices.Add(mesh.Positions.Count);
        mesh.Positions.Add(posIdx >= 0 && posIdx < positions.Length ? positions[posIdx] : Vector3.Zero);
        mesh.Normals.Add(nrmIdx >= 0 && nrmIdx < normals.Length ? normals[nrmIdx] : Vector3.UnitY);
        if (texCoords is { Length: > 0 })
            mesh.TexCoords.Add(posIdx >= 0 && posIdx < texCoords.Length ? texCoords[posIdx] : Vector2.Zero);
    }

    private static int ResolveFaceMaterial(int[]? faceMaterialIndex, int face, int materialCount)
    {
        if (faceMaterialIndex is null || faceMaterialIndex.Length == 0) return 0;
        int idx = faceMaterialIndex.Length == 1 ? faceMaterialIndex[0]
                 : (face < faceMaterialIndex.Length ? faceMaterialIndex[face] : faceMaterialIndex[^1]);
        return Math.Clamp(idx, 0, Math.Max(0, materialCount - 1));
    }

    private static void BuildGroups(MeshData mesh, List<int> triMaterial)
    {
        mesh.Groups.Clear();
        if (triMaterial.Count == 0)
        {
            if (mesh.TriangleCount > 0)
                mesh.Groups.Add(new MaterialGroup(0, mesh.Indices.Count, 0));
            return;
        }

        int runStart = 0;
        int current = triMaterial[0];
        for (int t = 1; t < triMaterial.Count; t++)
        {
            if (triMaterial[t] != current)
            {
                mesh.Groups.Add(new MaterialGroup(runStart * 3, (t - runStart) * 3, current));
                runStart = t;
                current = triMaterial[t];
            }
        }
        mesh.Groups.Add(new MaterialGroup(runStart * 3, (triMaterial.Count - runStart) * 3, current));
    }

    /// <summary>
    /// Convert from DirectX left-handed to right-handed Y-up: negate Z on
    /// positions and normals and flip triangle winding.
    /// </summary>
    private static void ConvertLeftHandedToRight(SceneModel scene)
    {
        foreach (var mesh in scene.Meshes)
        {
            for (int i = 0; i < mesh.Positions.Count; i++)
            {
                var p = mesh.Positions[i];
                mesh.Positions[i] = new Vector3(p.X, p.Y, -p.Z);
            }
            for (int i = 0; i < mesh.Normals.Count; i++)
            {
                var n = mesh.Normals[i];
                mesh.Normals[i] = new Vector3(n.X, n.Y, -n.Z);
            }
            mesh.FlipWinding();
        }
    }
}
