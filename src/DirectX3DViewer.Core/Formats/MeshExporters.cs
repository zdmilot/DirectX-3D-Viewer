using System.Globalization;
using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>Writes OBJ (+ MTL) and binary STL exports.</summary>
public static class MeshExporters
{
    // â”€â”€ OBJ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public static void WriteObj(SceneModel scene, string path)
    {
        string mtlName = Path.GetFileNameWithoutExtension(path) + ".mtl";
        var obj = new StringBuilder();
        var mtl = new StringBuilder("# Material Library\n\n");
        obj.Append("# Exported from 3D File Tools\n");
        obj.Append("mtllib ").Append(mtlName).Append("\n\n");

        int vOffset = 1, nOffset = 1;
        int meshIndex = 0;
        var writtenMaterials = new HashSet<string>();

        foreach (var mesh in scene.Meshes)
        {
            if (mesh.VertexCount == 0) continue;
            string group = string.IsNullOrEmpty(mesh.Name) ? $"mesh_{meshIndex}" : mesh.Name;
            obj.Append("g ").Append(Sanitize(group)).Append('\n');

            foreach (var p in mesh.Positions)
                obj.Append("v ").Append(F(p.X)).Append(' ').Append(F(p.Y)).Append(' ').Append(F(p.Z)).Append('\n');
            foreach (var n in mesh.Normals)
                obj.Append("vn ").Append(F(n.X)).Append(' ').Append(F(n.Y)).Append(' ').Append(F(n.Z)).Append('\n');

            string matName = $"mat_{meshIndex}";
            var mat = mesh.Materials.Count > 0 ? mesh.Materials[0] : new MeshMaterial();
            if (writtenMaterials.Add(matName))
            {
                mtl.Append("newmtl ").Append(matName).Append('\n');
                mtl.Append("Kd ").Append(F(mat.Diffuse.X)).Append(' ').Append(F(mat.Diffuse.Y)).Append(' ').Append(F(mat.Diffuse.Z)).Append('\n');
                mtl.Append("Ks ").Append(F(mat.Specular.X)).Append(' ').Append(F(mat.Specular.Y)).Append(' ').Append(F(mat.Specular.Z)).Append('\n');
                mtl.Append("d ").Append(F(mat.Opacity)).Append('\n');
                mtl.Append("Ns ").Append(F(mat.Shininess)).Append("\n\n");
            }
            obj.Append("usemtl ").Append(matName).Append('\n');

            bool hasN = mesh.Normals.Count == mesh.Positions.Count;
            for (int t = 0; t + 2 < mesh.Indices.Count; t += 3)
            {
                int a = mesh.Indices[t], b = mesh.Indices[t + 1], c = mesh.Indices[t + 2];
                if (hasN)
                    obj.Append("f ")
                       .Append(a + vOffset).Append("//").Append(a + nOffset).Append(' ')
                       .Append(b + vOffset).Append("//").Append(b + nOffset).Append(' ')
                       .Append(c + vOffset).Append("//").Append(c + nOffset).Append('\n');
                else
                    obj.Append("f ").Append(a + vOffset).Append(' ').Append(b + vOffset).Append(' ').Append(c + vOffset).Append('\n');
            }

            vOffset += mesh.Positions.Count;
            nOffset += mesh.Normals.Count;
            meshIndex++;
            obj.Append('\n');
        }

        File.WriteAllText(path, obj.ToString(), new UTF8Encoding(false));
        string mtlPath = Path.Combine(Path.GetDirectoryName(path) ?? ".", mtlName);
        File.WriteAllText(mtlPath, mtl.ToString(), new UTF8Encoding(false));
    }

    // â”€â”€ STL (binary) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    public static void WriteStl(SceneModel scene, string path)
    {
        int triCount = scene.TotalTriangles;
        using var fs = File.Create(path);
        using var bw = new BinaryWriter(fs);

        var header = new byte[80];
        byte[] tag = Encoding.ASCII.GetBytes("Exported from 3D File Tools");
        Array.Copy(tag, header, Math.Min(tag.Length, 80));
        bw.Write(header);
        bw.Write((uint)triCount);

        foreach (var mesh in scene.Meshes)
        {
            for (int t = 0; t + 2 < mesh.Indices.Count; t += 3)
            {
                var a = mesh.Positions[mesh.Indices[t]];
                var b = mesh.Positions[mesh.Indices[t + 1]];
                var c = mesh.Positions[mesh.Indices[t + 2]];
                var n = Vector3.Cross(b - a, c - a);
                n = n.LengthSquared() > 1e-12f ? Vector3.Normalize(n) : Vector3.UnitZ;
                Write(bw, n); Write(bw, a); Write(bw, b); Write(bw, c);
                bw.Write((ushort)0);
            }
        }
    }

    private static void Write(BinaryWriter bw, Vector3 v)
    {
        bw.Write(v.X); bw.Write(v.Y); bw.Write(v.Z);
    }

    private static string F(float v) => v.ToString("0.000000", CultureInfo.InvariantCulture);

    private static string Sanitize(string s)
    {
        var sb = new StringBuilder(s.Length);
        foreach (char c in s) sb.Append(char.IsWhiteSpace(c) ? '_' : c);
        return sb.Length == 0 ? "mesh" : sb.ToString();
    }
}
