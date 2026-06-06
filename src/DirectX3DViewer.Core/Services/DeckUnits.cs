using System.Numerics;

namespace DirectX3DViewer.Core.Services;

/// <summary>
/// Hamilton deck / SBS labware constants and viewer helpers ported from the
/// original <c>deckUnits.js</c>. One scene unit equals one millimetre.
/// </summary>
public static class DeckUnits
{
    public const float MmPerUnit = 1.0f;
    public const string UnitLabel = "mm";

    // SBS / ANSI microtiter plate constants (mm).
    public const float FootprintLength = 127.76f;
    public const float FootprintWidth = 85.48f;
    public const float WellSpacing96 = 9.0f;
    public const float WellSpacing384 = 4.5f;
    public const float WellSpacing1536 = 2.25f;
    public const float A1OffsetX = 14.38f;
    public const float A1OffsetY = 11.24f;
    public const float CornerRadius = 3.18f;
    public const float WallThickness = 1.27f;
    public const float FlangeHeight = 2.41f;

    /// <summary>Round a raw step to a "nice" value (1, 2, 5 Ã— 10â¿).</summary>
    public static float NiceStep(float raw)
    {
        if (raw <= 0) return 1f;
        float magnitude = MathF.Pow(10f, MathF.Floor(MathF.Log10(raw)));
        float residual = raw / magnitude;
        if (residual <= 1.5f) return magnitude;
        if (residual <= 3.5f) return 2f * magnitude;
        if (residual <= 7.5f) return 5f * magnitude;
        return 10f * magnitude;
    }

    /// <summary>
    /// Compute a fitting camera distance and near/far planes for a model whose
    /// largest dimension is <paramref name="maxDim"/> mm.
    /// </summary>
    public static (float distance, float near, float far) FitCamera(float maxDim, float fitMultiplier = 1.8f)
    {
        if (maxDim <= 0) maxDim = 100f;
        float distance = maxDim * fitMultiplier;
        float near = MathF.Max(maxDim * 0.001f, 0.01f);
        float far = maxDim * 100f;
        return (distance, near, far);
    }

    public static string FormatPosition(Vector3 p, int dp = 1)
    {
        string f = "F" + dp;
        return $"X: {p.X.ToString(f)}  Y: {p.Y.ToString(f)}  Z: {p.Z.ToString(f)}";
    }
}
