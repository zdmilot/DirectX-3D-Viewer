using System.Numerics;

namespace DirectX3DViewer.App.Rendering;

/// <summary>
/// A right-handed Y-up orbit camera. Supports orbit, pan and dolly, plus
/// perspective/orthographic projection and model-aware framing.
/// </summary>
public sealed class OrbitCamera
{
    public Vector3 Target { get; set; } = Vector3.Zero;
    public float Distance { get; set; } = 200f;
    public float Yaw { get; set; } = 0.6f;
    public float Pitch { get; set; } = 0.4f;
    public float NearPlane { get; set; } = 0.1f;
    public float FarPlane { get; set; } = 10000f;
    public float FieldOfView { get; set; } = MathF.PI / 4f; // 45Â°
    public bool Perspective { get; set; } = true;

    private const float MinPitch = -1.5533f; // Â±89Â°
    private const float MaxPitch = 1.5533f;

    public Vector3 Position
    {
        get
        {
            float cp = MathF.Cos(Pitch), sp = MathF.Sin(Pitch);
            float cy = MathF.Cos(Yaw), sy = MathF.Sin(Yaw);
            var dir = new Vector3(cp * sy, sp, cp * cy);
            return Target + dir * Distance;
        }
    }

    public void Orbit(float deltaYaw, float deltaPitch)
    {
        Yaw -= deltaYaw;
        Pitch = Math.Clamp(Pitch + deltaPitch, MinPitch, MaxPitch);
    }

    public void Dolly(float factor)
    {
        Distance = Math.Clamp(Distance * factor, NearPlane * 1.5f, FarPlane * 0.9f);
    }

    public void Pan(float dx, float dy, float viewportHeight)
    {
        // Screen-space pan scaled to world units at the target plane.
        var forward = Vector3.Normalize(Target - Position);
        var right = Vector3.Normalize(Vector3.Cross(forward, Vector3.UnitY));
        var up = Vector3.Cross(right, forward);
        float worldPerPixel = (2f * Distance * MathF.Tan(FieldOfView * 0.5f)) / MathF.Max(1f, viewportHeight);
        Target += (-right * dx + up * dy) * worldPerPixel;
    }

    public Matrix4x4 GetView() => Matrix4x4.CreateLookAt(Position, Target, Vector3.UnitY);

    public Matrix4x4 GetProjection(float aspect)
    {
        if (Perspective)
            return Matrix4x4.CreatePerspectiveFieldOfView(FieldOfView, MathF.Max(0.01f, aspect), NearPlane, FarPlane);

        float halfH = Distance * MathF.Tan(FieldOfView * 0.5f);
        float halfW = halfH * aspect;
        return Matrix4x4.CreateOrthographicOffCenter(-halfW, halfW, -halfH, halfH, NearPlane, FarPlane);
    }

    /// <summary>Frame a model of the given centre and largest dimension.</summary>
    public void Frame(Vector3 center, float maxDim, float fitMultiplier = 1.8f)
    {
        if (maxDim <= 0) maxDim = 100f;
        Target = center;
        Distance = maxDim * fitMultiplier;
        NearPlane = MathF.Max(maxDim * 0.001f, 0.01f);
        FarPlane = maxDim * 100f;
    }
}
