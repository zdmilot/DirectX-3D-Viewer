using System.Numerics;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Conversion;

/// <summary>Axis for rotate/mirror operations.</summary>
public enum Axis { X, Y, Z }

/// <summary>
/// In-place model transforms (rotate Â±90Â°, mirror) matching the original
/// viewer's transform tools. Operates on the renderer's right-handed space.
/// </summary>
public static class ModelTransforms
{
    public static void Rotate90(SceneModel scene, Axis axis, int sign)
    {
        float angle = Math.Sign(sign) * MathF.PI / 2f;
        Matrix4x4 m = axis switch
        {
            Axis.X => Matrix4x4.CreateRotationX(angle),
            Axis.Y => Matrix4x4.CreateRotationY(angle),
            _ => Matrix4x4.CreateRotationZ(angle),
        };
        Apply(scene, m);
    }

    public static void Mirror(SceneModel scene, Axis axis)
    {
        var s = new Vector3(
            axis == Axis.X ? -1 : 1,
            axis == Axis.Y ? -1 : 1,
            axis == Axis.Z ? -1 : 1);
        Apply(scene, Matrix4x4.CreateScale(s));
    }

    public static void Apply(SceneModel scene, Matrix4x4 m)
    {
        foreach (var mesh in scene.Meshes)
            mesh.ApplyTransform(m);
    }
}
