using System.Numerics;

namespace DirectX3DViewer.Core.Geometry;

/// <summary>
/// The top-level result of importing a 3D file: a flat list of meshes plus
/// provenance/diagnostic information. Frame hierarchies and transforms from the
/// source format are baked into mesh vertices during import, matching the
/// behaviour of the original Three.js viewer.
/// </summary>
public sealed class SceneModel
{
    public List<MeshData> Meshes { get; } = new();

    /// <summary>Original file the model was loaded from (for display/save naming).</summary>
    public string? SourcePath { get; set; }

    /// <summary>Non-fatal diagnostics collected while parsing.</summary>
    public List<string> Warnings { get; } = new();

    public int TotalVertices => Meshes.Sum(m => m.VertexCount);
    public int TotalTriangles => Meshes.Sum(m => m.TriangleCount);

    public bool TryGetBounds(out Vector3 min, out Vector3 max)
    {
        min = new Vector3(float.MaxValue);
        max = new Vector3(float.MinValue);
        bool any = false;
        foreach (var mesh in Meshes)
        {
            if (mesh.TryGetBounds(out var mn, out var mx))
            {
                min = Vector3.Min(min, mn);
                max = Vector3.Max(max, mx);
                any = true;
            }
        }
        if (!any) min = max = Vector3.Zero;
        return any;
    }

    /// <summary>Largest bounding-box dimension; used for camera fitting and grid sizing.</summary>
    public float MaxDimension
    {
        get
        {
            if (!TryGetBounds(out var min, out var max)) return 0f;
            var size = max - min;
            return MathF.Max(size.X, MathF.Max(size.Y, size.Z));
        }
    }

    public Vector3 Center
    {
        get
        {
            if (!TryGetBounds(out var min, out var max)) return Vector3.Zero;
            return (min + max) * 0.5f;
        }
    }
}
