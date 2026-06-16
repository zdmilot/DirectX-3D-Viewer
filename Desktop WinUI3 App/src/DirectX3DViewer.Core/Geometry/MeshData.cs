using System.Numerics;

namespace DirectX3DViewer.Core.Geometry;

/// <summary>
/// Maps a contiguous run of triangle indices to a material. Equivalent to a
/// Three.js geometry "group" (start, count, materialIndex).
/// </summary>
public readonly record struct MaterialGroup(int Start, int Count, int MaterialIndex);

/// <summary>
/// A renderer-friendly indexed triangle mesh. Parsers expand any N-gon faces and
/// per-face normal/UV indexing from the source format into parallel per-vertex
/// arrays plus a flat triangle index buffer, so this maps directly onto a GPU
/// vertex/index buffer and onto the <c>.x</c>/OBJ/STL/GLB writers.
/// </summary>
public sealed class MeshData
{
    public string Name { get; set; } = string.Empty;

    public List<Vector3> Positions { get; } = new();
    public List<Vector3> Normals { get; } = new();
    public List<Vector2> TexCoords { get; } = new();

    /// <summary>Flat list of triangle vertex indices (length is a multiple of 3).</summary>
    public List<int> Indices { get; } = new();

    public List<MeshMaterial> Materials { get; } = new();

    /// <summary>Material assignment ranges over <see cref="Indices"/>.</summary>
    public List<MaterialGroup> Groups { get; } = new();

    public int VertexCount => Positions.Count;
    public int TriangleCount => Indices.Count / 3;
    public bool HasNormals => Normals.Count == Positions.Count && Positions.Count > 0;
    public bool HasTexCoords => TexCoords.Count == Positions.Count && Positions.Count > 0;

    /// <summary>Compute the axis-aligned bounds of this mesh.</summary>
    public bool TryGetBounds(out Vector3 min, out Vector3 max)
    {
        if (Positions.Count == 0)
        {
            min = max = Vector3.Zero;
            return false;
        }

        min = new Vector3(float.MaxValue);
        max = new Vector3(float.MinValue);
        foreach (var p in Positions)
        {
            min = Vector3.Min(min, p);
            max = Vector3.Max(max, p);
        }
        return true;
    }

    /// <summary>Generate per-vertex smooth normals from the triangle topology.</summary>
    public void ComputeNormals()
    {
        Normals.Clear();
        var accum = new Vector3[Positions.Count];
        for (int i = 0; i + 2 < Indices.Count; i += 3)
        {
            int ia = Indices[i], ib = Indices[i + 1], ic = Indices[i + 2];
            var a = Positions[ia];
            var b = Positions[ib];
            var c = Positions[ic];
            var n = Vector3.Cross(b - a, c - a);
            accum[ia] += n;
            accum[ib] += n;
            accum[ic] += n;
        }
        for (int i = 0; i < accum.Length; i++)
        {
            var n = accum[i];
            Normals.Add(n.LengthSquared() > 1e-12f ? Vector3.Normalize(n) : Vector3.UnitY);
        }
    }

    /// <summary>
    /// Apply an affine transform to positions (and normals via the inverse
    /// transpose). When the transform has negative determinant the triangle
    /// winding is flipped to keep faces outward-facing.
    /// </summary>
    public void ApplyTransform(Matrix4x4 m)
    {
        for (int i = 0; i < Positions.Count; i++)
            Positions[i] = Vector3.Transform(Positions[i], m);

        if (Normals.Count > 0 && Matrix4x4.Invert(m, out var inv))
        {
            var nm = Matrix4x4.Transpose(inv);
            for (int i = 0; i < Normals.Count; i++)
            {
                var n = Vector3.TransformNormal(Normals[i], nm);
                Normals[i] = n.LengthSquared() > 1e-12f ? Vector3.Normalize(n) : n;
            }
        }

        if (m.GetDeterminant() < 0)
            FlipWinding();
    }

    public void FlipWinding()
    {
        for (int i = 0; i + 2 < Indices.Count; i += 3)
            (Indices[i + 1], Indices[i + 2]) = (Indices[i + 2], Indices[i + 1]);
    }
}
