using System.Text.Json;
using System.Text.Json.Serialization;

namespace DirectX3DViewer.Core.Services;

/// <summary>Persisted user settings, serialised to JSON in the app data folder.</summary>
public sealed class AppSettings
{
    public bool DarkMode { get; set; }
    public bool GridVisible { get; set; } = true;
    public bool Perspective { get; set; } = true;
    public bool Wireframe { get; set; }
    public List<string> RecentFiles { get; set; } = new();

    [JsonIgnore]
    public const int MaxRecentFiles = 10;
}

/// <summary>Loads and saves <see cref="AppSettings"/> and manages recent files.</summary>
public sealed class SettingsService
{
    private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = true };

    private readonly string _path;
    public AppSettings Settings { get; private set; } = new();

    public SettingsService(string? overridePath = null)
    {
        string dir = overridePath ?? Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "DirectX3DViewer");
        Directory.CreateDirectory(dir);
        _path = Path.Combine(dir, "settings.json");
        Load();
    }

    public void Load()
    {
        try
        {
            if (File.Exists(_path))
                Settings = JsonSerializer.Deserialize<AppSettings>(File.ReadAllText(_path)) ?? new AppSettings();
        }
        catch
        {
            Settings = new AppSettings();
        }
    }

    public void Save()
    {
        try
        {
            File.WriteAllText(_path, JsonSerializer.Serialize(Settings, JsonOptions));
        }
        catch { /* settings are best-effort */ }
    }

    public void AddRecentFile(string path)
    {
        if (string.IsNullOrWhiteSpace(path)) return;
        Settings.RecentFiles.RemoveAll(p => string.Equals(p, path, StringComparison.OrdinalIgnoreCase));
        Settings.RecentFiles.Insert(0, path);
        if (Settings.RecentFiles.Count > AppSettings.MaxRecentFiles)
            Settings.RecentFiles.RemoveRange(AppSettings.MaxRecentFiles,
                Settings.RecentFiles.Count - AppSettings.MaxRecentFiles);
        Save();
    }

    public void ClearRecentFiles()
    {
        Settings.RecentFiles.Clear();
        Save();
    }
}
