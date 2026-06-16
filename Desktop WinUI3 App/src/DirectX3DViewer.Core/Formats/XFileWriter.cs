using System.Globalization;
using System.Numerics;
using System.Text;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Serialises a <see cref="SceneModel"/> back to a DirectX <c>.x</c> text file,
/// emitting the standard template header and converting from the renderer's
/// right-handed space back to DirectX's left-handed space (negate Z, flip
/// winding). Floats use 6-decimal fixed precision to match the original tool.
/// </summary>
public static class XFileWriter
{
    public static void Write(SceneModel scene, string path)
    {
        File.WriteAllText(path, Serialize(scene), new UTF8Encoding(false));
    }

    public static string Serialize(SceneModel scene)
    {
        var sb = new StringBuilder();
        sb.Append("xof 0303txt 0032\n\n");
        AppendTemplates(sb);

        int meshIndex = 0;
        foreach (var mesh in scene.Meshes)
        {
            if (mesh.VertexCount == 0) continue;
            AppendMesh(sb, mesh, meshIndex++);
        }
        return sb.ToString();
    }

    private static void AppendMesh(StringBuilder sb, MeshData mesh, int meshIndex)
    {
        // Convert right-handed â†’ left-handed in local copies.
        int vc = mesh.VertexCount;
        var pos = new Vector3[vc];
        var nrm = new Vector3[mesh.Normals.Count];
        for (int i = 0; i < vc; i++)
        {
            var p = mesh.Positions[i];
            pos[i] = new Vector3(p.X, p.Y, -p.Z);
        }
        for (int i = 0; i < nrm.Length; i++)
        {
            var nn = mesh.Normals[i];
            nrm[i] = new Vector3(nn.X, nn.Y, -nn.Z);
        }

        int triCount = mesh.TriangleCount;
        // Flip winding to left-handed.
        var tris = new (int a, int b, int c)[triCount];
        for (int t = 0; t < triCount; t++)
        {
            int a = mesh.Indices[t * 3];
            int b = mesh.Indices[t * 3 + 1];
            int c = mesh.Indices[t * 3 + 2];
            tris[t] = (a, c, b);
        }

        sb.Append("Mesh Mesh_").Append(meshIndex).Append(" {\n");
        sb.Append("  ").Append(vc).Append(";\n");
        for (int i = 0; i < vc; i++)
        {
            sb.Append("  ").Append(F(pos[i].X)).Append(';').Append(F(pos[i].Y)).Append(';')
              .Append(F(pos[i].Z)).Append(';').Append(i < vc - 1 ? "," : ";").Append('\n');
        }

        sb.Append("  ").Append(triCount).Append(";\n");
        for (int t = 0; t < triCount; t++)
        {
            sb.Append("  3;").Append(tris[t].a).Append(',').Append(tris[t].b).Append(',')
              .Append(tris[t].c).Append(';').Append(t < triCount - 1 ? "," : ";").Append('\n');
        }

        AppendMaterialList(sb, mesh, tris.Length);

        if (nrm.Length == vc && vc > 0)
        {
            sb.Append("  MeshNormals {\n");
            sb.Append("    ").Append(vc).Append(";\n");
            for (int i = 0; i < vc; i++)
            {
                sb.Append("    ").Append(F(nrm[i].X)).Append(';').Append(F(nrm[i].Y)).Append(';')
                  .Append(F(nrm[i].Z)).Append(';').Append(i < vc - 1 ? "," : ";").Append('\n');
            }
            sb.Append("    ").Append(triCount).Append(";\n");
            for (int t = 0; t < triCount; t++)
            {
                sb.Append("    3;").Append(tris[t].a).Append(',').Append(tris[t].b).Append(',')
                  .Append(tris[t].c).Append(';').Append(t < triCount - 1 ? "," : ";").Append('\n');
            }
            sb.Append("  }\n");
        }

        if (mesh.HasTexCoords)
        {
            sb.Append("  MeshTextureCoords {\n");
            sb.Append("    ").Append(vc).Append(";\n");
            for (int i = 0; i < vc; i++)
            {
                var uv = mesh.TexCoords[i];
                sb.Append("    ").Append(F(uv.X)).Append(';').Append(F(uv.Y)).Append(';')
                  .Append(i < vc - 1 ? "," : ";").Append('\n');
            }
            sb.Append("  }\n");
        }

        sb.Append("}\n\n");
    }

    private static void AppendMaterialList(StringBuilder sb, MeshData mesh, int triCount)
    {
        var materials = mesh.Materials.Count > 0 ? mesh.Materials : new List<MeshMaterial> { new() };

        // Build per-triangle material index from groups.
        var perTri = new int[triCount];
        if (mesh.Groups.Count > 0)
        {
            foreach (var g in mesh.Groups)
            {
                int firstTri = g.Start / 3;
                int triLen = g.Count / 3;
                for (int t = firstTri; t < firstTri + triLen && t < triCount; t++)
                    perTri[t] = Math.Clamp(g.MaterialIndex, 0, materials.Count - 1);
            }
        }

        sb.Append("  MeshMaterialList {\n");
        sb.Append("    ").Append(materials.Count).Append(";\n");
        sb.Append("    ").Append(triCount).Append(";\n");
        for (int t = 0; t < triCount; t++)
            sb.Append("    ").Append(perTri[t]).Append(t < triCount - 1 ? "," : ";;").Append('\n');

        foreach (var m in materials)
        {
            sb.Append("    Material {\n");
            sb.Append("      ").Append(F(m.Diffuse.X)).Append(';').Append(F(m.Diffuse.Y)).Append(';')
              .Append(F(m.Diffuse.Z)).Append(';').Append(F(m.Opacity)).Append(";;\n");
            sb.Append("      ").Append(F(m.Shininess)).Append(";\n");
            sb.Append("      ").Append(F(m.Specular.X)).Append(';').Append(F(m.Specular.Y)).Append(';')
              .Append(F(m.Specular.Z)).Append(";;\n");
            sb.Append("      ").Append(F(m.Emissive.X)).Append(';').Append(F(m.Emissive.Y)).Append(';')
              .Append(F(m.Emissive.Z)).Append(";;\n");
            sb.Append("    }\n");
        }
        sb.Append("  }\n");
    }

    private static string F(float v) => v.ToString("0.000000", CultureInfo.InvariantCulture);

    private static void AppendTemplates(StringBuilder sb)
    {
        sb.Append(
            "template ColorRGBA {\n <35ff44e0-6c7c-11cf-8f52-0040333594a3>\n FLOAT red; FLOAT green; FLOAT blue; FLOAT alpha;\n}\n\n" +
            "template ColorRGB {\n <d3e16e81-7835-11cf-8f52-0040333594a3>\n FLOAT red; FLOAT green; FLOAT blue;\n}\n\n" +
            "template Material {\n <3d82ab4d-62da-11cf-ab39-0020af71e433>\n ColorRGBA faceColor; FLOAT power; ColorRGB specularColor; ColorRGB emissiveColor;\n [...]\n}\n\n" +
            "template Vector {\n <3d82ab5e-62da-11cf-ab39-0020af71e433>\n FLOAT x; FLOAT y; FLOAT z;\n}\n\n" +
            "template MeshFace {\n <3d82ab5f-62da-11cf-ab39-0020af71e433>\n DWORD nFaceVertexIndices; array DWORD faceVertexIndices[nFaceVertexIndices];\n}\n\n" +
            "template Mesh {\n <3d82ab44-62da-11cf-ab39-0020af71e433>\n DWORD nVertices; array Vector vertices[nVertices]; DWORD nFaces; array MeshFace faces[nFaces];\n [...]\n}\n\n" +
            "template MeshNormals {\n <f6f23f43-7686-11cf-8f52-0040333594a3>\n DWORD nNormals; array Vector normals[nNormals]; DWORD nFaceNormals; array MeshFace faceNormals[nFaceNormals];\n}\n\n" +
            "template MeshMaterialList {\n <f6f23f42-7686-11cf-8f52-0040333594a3>\n DWORD nMaterials; DWORD nFaceIndexes; array DWORD faceIndexes[nFaceIndexes]; [Material]\n}\n\n" +
            "template Coords2d {\n <f6f23f44-7686-11cf-8f52-0040333594a3>\n FLOAT u; FLOAT v;\n}\n\n" +
            "template MeshTextureCoords {\n <f6f23f40-7686-11cf-8f52-0040333594a3>\n DWORD nTextureCoords; array Coords2d textureCoords[nTextureCoords];\n}\n\n");
    }
}
