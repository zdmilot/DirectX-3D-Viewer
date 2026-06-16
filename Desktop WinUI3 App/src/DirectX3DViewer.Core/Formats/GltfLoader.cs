using System.Numerics;
using DirectX3DViewer.Core.Geometry;
using SharpGLTF.Schema2;

namespace DirectX3DViewer.Core.Formats;

/// <summary>
/// Imports glTF 2.0 models (<c>.glb</c> / <c>.gltf</c>) including per-material
/// base colour. Node transforms are baked into vertex positions so the result
/// matches the right-handed, Y-up convention used by the other loaders.
/// </summary>
public static class GltfLoader
{
    public static SceneModel Parse(byte[] data, string? sourcePath = null)
    {
        var scene = new SceneModel { SourcePath = sourcePath };

        ModelRoot model;
        try
        {
            // Loading from disk resolves external .bin/.gltf buffers; fall back to
            // parsing an in-memory binary (.glb) when no path is available.
            model = !string.IsNullOrEmpty(sourcePath) && File.Exists(sourcePath)
                ? ModelRoot.Load(sourcePath, new ReadSettings { Validation = SharpGLTF.Validation.ValidationMode.TryFix })
                : ModelRoot.ParseGLB(new ArraySegment<byte>(data));
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("Could not read glTF/GLB file: " + ex.Message, ex);
        }

        bool sawVertexColors = false;

        foreach (var node in model.LogicalNodes)
        {
            var srcMesh = node.Mesh;
            if (srcMesh is null) continue;
            Matrix4x4 world = node.WorldMatrix;

            foreach (var prim in srcMesh.Primitives)
            {
                if (prim.DrawPrimitiveType is not (PrimitiveType.TRIANGLES
                    or PrimitiveType.TRIANGLE_STRIP or PrimitiveType.TRIANGLE_FAN))
                    continue;

                var positions = prim.GetVertexAccessor("POSITION")?.AsVector3Array();
                if (positions is null || positions.Count == 0) continue;

                var mesh = new MeshData { Name = srcMesh.Name ?? "glTF" };
                foreach (var p in positions) mesh.Positions.Add(p);

                var normals = prim.GetVertexAccessor("NORMAL")?.AsVector3Array();
                if (normals is not null && normals.Count == positions.Count)
                    foreach (var n in normals) mesh.Normals.Add(n);

                var uvs = prim.GetVertexAccessor("TEXCOORD_0")?.AsVector2Array();
                if (uvs is not null && uvs.Count == positions.Count)
                    foreach (var uv in uvs) mesh.TexCoords.Add(uv);

                if (prim.GetVertexAccessor("COLOR_0") is not null) sawVertexColors = true;

                foreach (var (a, b, c) in prim.GetTriangleIndices())
                {
                    mesh.Indices.Add(a);
                    mesh.Indices.Add(b);
                    mesh.Indices.Add(c);
                }
                if (mesh.Indices.Count == 0) continue;

                mesh.Materials.Add(ConvertMaterial(prim.Material));
                mesh.Groups.Add(new MaterialGroup(0, mesh.Indices.Count, 0));

                if (mesh.Normals.Count != mesh.Positions.Count) mesh.ComputeNormals();
                mesh.ApplyTransform(world);

                scene.Meshes.Add(mesh);
            }
        }

        if (sawVertexColors)
            scene.Warnings.Add("Per-vertex colors were simplified to per-material colors.");
        if (scene.Meshes.Count == 0)
            scene.Warnings.Add("No triangle geometry found in the glTF/GLB file.");

        return scene;
    }

    private static MeshMaterial ConvertMaterial(Material? mat)
    {
        var result = new MeshMaterial { Name = mat?.Name ?? "glTF" };
        if (mat is null) return result;

        var baseColor = mat.FindChannel("BaseColor");
        if (baseColor is not null)
        {
            Vector4 c = baseColor.Value.Color;
            result.Diffuse = new Vector3(c.X, c.Y, c.Z);
            result.Opacity = Math.Clamp(c.W, 0f, 1f);
        }

        var emissive = mat.FindChannel("Emissive");
        if (emissive is not null)
        {
            Vector4 e = emissive.Value.Color;
            result.Emissive = new Vector3(e.X, e.Y, e.Z);
        }

        return result;
    }
}
