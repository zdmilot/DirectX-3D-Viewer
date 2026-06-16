using System.Numerics;
using System.Text;
using System.Text.Json;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>Writes a binary glTF (<c>.glb</c>) file (positions, normals, indices, base colours).</summary>
public static class GlbWriter
{
    public static void Write(SceneModel scene, string path)
    {
        using var bin = new MemoryStream();
        var accessors = new List<object>();
        var bufferViews = new List<object>();
        var meshes = new List<object>();
        var nodes = new List<object>();
        var materials = new List<object>();
        var sceneNodes = new List<int>();

        int nodeIndex = 0;
        foreach (var mesh in scene.Meshes)
        {
            if (mesh.VertexCount == 0) continue;

            int posAccessor = AddVec3Accessor(bin, bufferViews, accessors, mesh.Positions, computeMinMax: true);
            int nrmAccessor = mesh.HasNormals
                ? AddVec3Accessor(bin, bufferViews, accessors, mesh.Normals, computeMinMax: false)
                : -1;
            int idxAccessor = AddIndexAccessor(bin, bufferViews, accessors, mesh.Indices);

            var mat = mesh.Materials.Count > 0 ? mesh.Materials[0] : new MeshMaterial();
            int matIndex = materials.Count;
            materials.Add(new
            {
                name = string.IsNullOrEmpty(mat.Name) ? $"material_{matIndex}" : mat.Name,
                pbrMetallicRoughness = new
                {
                    baseColorFactor = new[] { mat.Diffuse.X, mat.Diffuse.Y, mat.Diffuse.Z, mat.Opacity },
                    metallicFactor = 0.0,
                    roughnessFactor = 0.8,
                },
                doubleSided = true,
            });

            var attributes = nrmAccessor >= 0
                ? (object)new { POSITION = posAccessor, NORMAL = nrmAccessor }
                : new { POSITION = posAccessor };

            meshes.Add(new
            {
                name = string.IsNullOrEmpty(mesh.Name) ? $"mesh_{nodeIndex}" : mesh.Name,
                primitives = new[]
                {
                    new { attributes, indices = idxAccessor, material = matIndex },
                },
            });
            nodes.Add(new { mesh = nodeIndex, name = $"node_{nodeIndex}" });
            sceneNodes.Add(nodeIndex);
            nodeIndex++;
        }

        byte[] binBytes = bin.ToArray();
        var gltf = new
        {
            asset = new { version = "2.0", generator = "DirectX 3D Viewer" },
            scene = 0,
            scenes = new[] { new { nodes = sceneNodes.ToArray() } },
            nodes = nodes.ToArray(),
            meshes = meshes.ToArray(),
            materials = materials.ToArray(),
            accessors = accessors.ToArray(),
            bufferViews = bufferViews.ToArray(),
            buffers = new[] { new { byteLength = binBytes.Length } },
        };

        string json = JsonSerializer.Serialize(gltf, new JsonSerializerOptions { DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.Never });
        byte[] jsonBytes = Encoding.UTF8.GetBytes(json);
        jsonBytes = Pad(jsonBytes, 0x20);
        binBytes = Pad(binBytes, 0x00);

        using var fs = File.Create(path);
        using var bw = new BinaryWriter(fs);
        uint total = 12u + 8u + (uint)jsonBytes.Length + 8u + (uint)binBytes.Length;
        bw.Write(0x46546C67u);      // "glTF"
        bw.Write(2u);               // version
        bw.Write(total);
        bw.Write((uint)jsonBytes.Length);
        bw.Write(0x4E4F534Au);      // "JSON"
        bw.Write(jsonBytes);
        bw.Write((uint)binBytes.Length);
        bw.Write(0x004E4942u);      // "BIN\0"
        bw.Write(binBytes);
    }

    private static int AddVec3Accessor(
        MemoryStream bin, List<object> bufferViews, List<object> accessors,
        List<Vector3> values, bool computeMinMax)
    {
        AlignTo(bin, 4);
        int byteOffset = (int)bin.Position;
        var min = new Vector3(float.MaxValue);
        var max = new Vector3(float.MinValue);
        Span<byte> buf = stackalloc byte[12];
        foreach (var v in values)
        {
            BitConverter.TryWriteBytes(buf[..4], v.X);
            BitConverter.TryWriteBytes(buf.Slice(4, 4), v.Y);
            BitConverter.TryWriteBytes(buf.Slice(8, 4), v.Z);
            bin.Write(buf);
            min = Vector3.Min(min, v);
            max = Vector3.Max(max, v);
        }
        int byteLength = values.Count * 12;
        int viewIndex = bufferViews.Count;
        bufferViews.Add(new { buffer = 0, byteOffset, byteLength, target = 34962 });
        int accessorIndex = accessors.Count;
        if (computeMinMax && values.Count > 0)
            accessors.Add(new { bufferView = viewIndex, componentType = 5126, count = values.Count, type = "VEC3", min = new[] { min.X, min.Y, min.Z }, max = new[] { max.X, max.Y, max.Z } });
        else
            accessors.Add(new { bufferView = viewIndex, componentType = 5126, count = values.Count, type = "VEC3" });
        return accessorIndex;
    }

    private static int AddIndexAccessor(
        MemoryStream bin, List<object> bufferViews, List<object> accessors, List<int> indices)
    {
        AlignTo(bin, 4);
        int byteOffset = (int)bin.Position;
        foreach (int i in indices)
            bin.Write(BitConverter.GetBytes((uint)i));
        int byteLength = indices.Count * 4;
        int viewIndex = bufferViews.Count;
        bufferViews.Add(new { buffer = 0, byteOffset, byteLength, target = 34963 });
        int accessorIndex = accessors.Count;
        accessors.Add(new { bufferView = viewIndex, componentType = 5125, count = indices.Count, type = "SCALAR" });
        return accessorIndex;
    }

    private static void AlignTo(MemoryStream ms, int alignment)
    {
        while (ms.Position % alignment != 0) ms.WriteByte(0);
    }

    private static byte[] Pad(byte[] data, byte fill)
    {
        int rem = data.Length % 4;
        if (rem == 0) return data;
        var padded = new byte[data.Length + (4 - rem)];
        Array.Copy(data, padded, data.Length);
        for (int i = data.Length; i < padded.Length; i++) padded[i] = fill;
        return padded;
    }
}
