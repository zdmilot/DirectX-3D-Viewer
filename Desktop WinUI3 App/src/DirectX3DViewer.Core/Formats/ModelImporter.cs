using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.Core.Formats;

/// <summary>Central entry point for importing any supported 3D file.</summary>
public static class ModelImporter
{
    public static readonly string[] SupportedExtensions =
        { ".x", ".hxx", ".obj", ".stl" };

    public static bool IsSupported(string path)
    {
        string ext = Path.GetExtension(path).ToLowerInvariant();
        return Array.IndexOf(SupportedExtensions, ext) >= 0;
    }

    public static SceneModel Import(string path)
    {
        byte[] data = File.ReadAllBytes(path);
        return Import(data, path);
    }

    public static SceneModel Import(byte[] data, string path)
    {
        string ext = Path.GetExtension(path).ToLowerInvariant();
        return ext switch
        {
            ".x" => XFileParser.Parse(data, path),
            ".hxx" => HxxLoader.Parse(data, path),
            ".obj" => ObjLoader.Parse(data, path),
            ".stl" => StlLoader.Parse(data, path),
            _ => throw new NotSupportedException($"Unsupported file format: {ext}"),
        };
    }
}
