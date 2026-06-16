using System.Numerics;

namespace DirectX3DViewer.Core.Geometry;

/// <summary>
/// A surface material as parsed from a DirectX <c>.x</c> / <c>.hxx</c> file or
/// imported from OBJ/STL/GLTF. Mirrors the DirectX <c>Material</c> template:
/// RGBA diffuse (alpha kept separately as <see cref="Opacity"/>), a specular
/// power, an RGB specular colour and an RGB emissive colour.
/// </summary>
public sealed class MeshMaterial
{
    public string Name { get; set; } = "Material";

    /// <summary>Diffuse colour, components in 0..1.</summary>
    public Vector3 Diffuse { get; set; } = new(0.7f, 0.7f, 0.7f);

    /// <summary>Diffuse alpha (DirectX RGBA.a). 1 = opaque.</summary>
    public float Opacity { get; set; } = 1f;

    /// <summary>Specular power (DirectX <c>power</c>).</summary>
    public float Shininess { get; set; } = 20f;

    public Vector3 Specular { get; set; } = Vector3.Zero;

    public Vector3 Emissive { get; set; } = Vector3.Zero;

    /// <summary>Optional diffuse texture file name referenced by the material.</summary>
    public string? TextureFile { get; set; }

    public MeshMaterial Clone() => new()
    {
        Name = Name,
        Diffuse = Diffuse,
        Opacity = Opacity,
        Shininess = Shininess,
        Specular = Specular,
        Emissive = Emissive,
        TextureFile = TextureFile,
    };
}
