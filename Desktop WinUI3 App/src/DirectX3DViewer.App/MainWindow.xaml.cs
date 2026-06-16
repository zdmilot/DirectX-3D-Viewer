using System;
using System.Collections.Generic;
using System.IO;
using System.Numerics;
using Microsoft.UI;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Microsoft.UI.Xaml.Media;
using Microsoft.UI.Xaml.Media.Animation;
using Windows.Storage.Pickers;
using DirectX3DViewer.Core.Conversion;
using DirectX3DViewer.Core.Formats;
using DirectX3DViewer.Core.Geometry;
using DirectX3DViewer.Core.Services;

namespace DirectX3DViewer.App;

public sealed partial class MainWindow : Window
{
    private readonly SettingsService _settings = new();
    private readonly DispatcherQueueTimer _camTimer;
    private readonly DispatcherQueueTimer _splashTimer;
    private SceneModel? _scene;
    private string? _scenePath;
    private bool _dark;
    private Vector3 _bgColor = new(0.106f, 0.157f, 0.220f);
    private bool _bgTransparent;
    private string? _lastLoadError;
    private Vector3[]? _originalDiffuse;

    public MainWindow()
    {
        InitializeComponent();

        // Custom title bar + Mica backdrop for a modern Windows 11 shell.
        ExtendsContentIntoTitleBar = true;
        SetTitleBar(AppTitleBar);
        try { SystemBackdrop = new MicaBackdrop(); } catch { /* older OS: skip */ }

        _settings.Load();
        _dark = _settings.Settings.DarkMode;
        ApplyTheme(_dark);

        GridButton.IsChecked = _settings.Settings.GridVisible;
        Viewport.Renderer.GridVisible = _settings.Settings.GridVisible;
        Viewport.Renderer.Camera.Perspective = _settings.Settings.Perspective;

        WireframeButton.IsChecked = _settings.Settings.Wireframe;
        Viewport.Renderer.Wireframe = _settings.Settings.Wireframe;

        // Appearance selector: Day / Night / Transparent radio buttons.
        if (_dark)
            LookNight.IsChecked = true;
        else
            LookDay.IsChecked = true;

        // Projection radio buttons.
        if (_settings.Settings.Perspective)
            ProjPerspective.IsChecked = true;
        else
            ProjOrthographic.IsChecked = true;

        // Periodically refresh the camera read-out.
        _camTimer = DispatcherQueue.CreateTimer();
        _camTimer.Interval = TimeSpan.FromMilliseconds(150);
        _camTimer.Tick += (_, _) => UpdateCamDisplay();
        _camTimer.Start();

        // Full-window splash overlay, dismissed shortly after launch (web-app style).
        _splashTimer = DispatcherQueue.CreateTimer();
        _splashTimer.Interval = TimeSpan.FromMilliseconds(1900);
        _splashTimer.IsRepeating = false;
        _splashTimer.Tick += (_, _) => { _splashTimer.Stop(); DismissSplash(); };
        _splashTimer.Start();

        Closed += (_, _) =>
        {
            _settings.Settings.DarkMode = _dark;
            _settings.Settings.GridVisible = GridButton.IsChecked == true;
            _settings.Settings.Perspective = ProjPerspective.IsChecked == true;
            _settings.Settings.Wireframe = WireframeButton.IsChecked == true;
            _settings.Save();
        };
    }

    private IntPtr Hwnd => WinRT.Interop.WindowNative.GetWindowHandle(this);

    /// <summary>Open a file passed via command line or file association.</summary>
    public async void OpenInitialFile(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !System.IO.File.Exists(path) || !ModelImporter.IsSupported(path))
            return;

        // Keep the splash visible (with status) until the startup model is ready.
        _splashTimer.Stop();
        SplashFileName.Text = System.IO.Path.GetFileName(path);
        SplashFileName.Visibility = Visibility.Visible;
        SetSplashStatus("Loading model\u2026");

        bool ok = await LoadFileAsync(path, isStartup: true);
        if (!ok)
        {
            // The background load failed — retry once serially on the UI thread while
            // the splash is still up (handles transient/threading load failures).
            SetSplashStatus("Retrying\u2026");
            ok = LoadFileSync(path);
        }

        DismissSplash();
        if (!ok)
            await ShowMessageAsync("Could not open file", _lastLoadError ?? "Unknown error.");
    }

    private void SetSplashStatus(string text)
    {
        if (SplashOverlay.Visibility == Visibility.Visible) SplashStatus.Text = text;
    }

    // â”€â”€ Theme â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void ApplyTheme(bool dark)
    {
        _dark = dark;
        RootGrid.RequestedTheme = dark ? ElementTheme.Dark : ElementTheme.Light;

        if (AppWindow?.TitleBar is { } tb)
        {
            tb.ButtonForegroundColor = dark ? Colors.White : Colors.Black;
            tb.ButtonHoverForegroundColor = dark ? Colors.White : Colors.Black;
            tb.ButtonBackgroundColor = Colors.Transparent;
            tb.ButtonInactiveBackgroundColor = Colors.Transparent;
        }

        if (dark)
        {
            _bgColor = new Vector3(0.106f, 0.157f, 0.220f);
            Viewport.Renderer.GridColor = new Vector3(0.165f, 0.227f, 0.290f);
        }
        else
        {
            _bgColor = new Vector3(0.914f, 0.933f, 0.949f);
            Viewport.Renderer.GridColor = new Vector3(0.800f, 0.831f, 0.863f);
        }
        ApplyBackground();
    }

    // ── Background color ─────────────────────────────────────────────────────────

    private void ApplyBackground()
    {
        Viewport.Renderer.BackgroundColor = new Vector4(_bgColor, _bgTransparent ? 0f : 1f);
        Viewport.Render();
    }

    private void OnLookOptionChecked(object sender, RoutedEventArgs e)
    {
        if (sender is RadioButton rb && rb.Tag is string tag && int.TryParse(tag, out int val))
            ApplyLook(val);
    }

    // 0 = Day (light), 1 = Night (dark), 2 = Transparent backdrop.
    private void ApplyLook(int look)
    {
        switch (look)
        {
            case 0: _bgTransparent = false; ApplyTheme(false); break;
            case 1: _bgTransparent = false; ApplyTheme(true); break;
            default: _bgTransparent = true; ApplyBackground(); break;
        }
    }

    // â”€â”€ File open / load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async void OnOpen(object sender, RoutedEventArgs e)
    {
        var picker = new FileOpenPicker { SuggestedStartLocation = PickerLocationId.Desktop };
        foreach (var ext in ModelImporter.SupportedExtensions) picker.FileTypeFilter.Add(ext);
        WinRT.Interop.InitializeWithWindow.Initialize(picker, Hwnd);

        var file = await picker.PickSingleFileAsync();
        if (file is not null) await LoadFileAsync(file.Path);
    }

    private async System.Threading.Tasks.Task<bool> LoadFileAsync(string path, bool isStartup = false)
    {
        // At startup the splash shows the progress; in-app loads use the centered overlay.
        if (!isStartup)
        {
            LoadingFileName.Text = Path.GetFileName(path);
            LoadingOverlay.Visibility = Visibility.Visible;
            // Let the overlay (with the file name) paint at least one frame before the
            // synchronous parts of the load begin, so it is always visible.
            await System.Threading.Tasks.Task.Yield();
        }
        try
        {
            var scene = await System.Threading.Tasks.Task.Run(() => ModelImporter.Import(path));
            ApplyLoadedScene(scene, path);
            return true;
        }
        catch (Exception ex)
        {
            _lastLoadError = ex.Message;
            if (!isStartup) await ShowMessageAsync("Could not open file", ex.Message);
            return false;
        }
        finally
        {
            LoadingOverlay.Visibility = Visibility.Collapsed;
        }
    }

    /// <summary>Synchronous (serial) load used as a startup fallback while the splash is up.</summary>
    private bool LoadFileSync(string path)
    {
        try
        {
            var scene = ModelImporter.Import(path);
            ApplyLoadedScene(scene, path);
            return true;
        }
        catch (Exception ex)
        {
            _lastLoadError = ex.Message;
            return false;
        }
    }

    private void ApplyLoadedScene(SceneModel scene, string path)
    {
        _scene = scene;
        _scenePath = path;

        Viewport.LoadModel(scene);
        EmptyState.Visibility = Visibility.Collapsed;
        FilePathText.Text = Path.GetFileName(path);
        ToolTipService.SetToolTip(FilePathText, path);
        SaveButton.IsEnabled = ExportButton.IsEnabled = ScreenshotButton.IsEnabled = true;

        // Reset the object-shading tool for the new model.
        Viewport.Renderer.ObjectColorOverride = null;
        SnapshotColors();
        ShadingButton.IsEnabled = true;
        ResetShadingButton.IsEnabled = false;

        _settings.AddRecentFile(path);
    }

    // ── Object-shading ──────────────────────────────────────────────

    private void OnShadeColor(object sender, TappedRoutedEventArgs e)
    {
        if (_scene is null || sender is not FrameworkElement b || b.Tag is not string hex) return;
        if (!TryParseHexColor(hex, out var color)) return;

        foreach (var mesh in _scene.Meshes)
            foreach (var mat in mesh.Materials)
                mat.Diffuse = color;

        Viewport.Renderer.ObjectColorOverride = color;
        Viewport.Render();
        ResetShadingButton.IsEnabled = true;
    }

    private void OnResetShading(object sender, RoutedEventArgs e)
    {
        if (_scene is null) return;
        RestoreOriginalColors();
        Viewport.Renderer.ObjectColorOverride = null;
        Viewport.Render();
        ResetShadingButton.IsEnabled = false;
    }

    private void SnapshotColors()
    {
        if (_scene is null) { _originalDiffuse = null; return; }
        var list = new System.Collections.Generic.List<Vector3>();
        foreach (var mesh in _scene.Meshes)
            foreach (var mat in mesh.Materials)
                list.Add(mat.Diffuse);
        _originalDiffuse = list.ToArray();
    }

    private void RestoreOriginalColors()
    {
        if (_scene is null || _originalDiffuse is null) return;
        int i = 0;
        foreach (var mesh in _scene.Meshes)
            foreach (var mat in mesh.Materials)
                if (i < _originalDiffuse.Length) mat.Diffuse = _originalDiffuse[i++];
    }

    private static bool TryParseHexColor(string hex, out Vector3 color)
    {
        color = default;
        hex = hex.TrimStart('#');
        if (hex.Length != 6) return false;
        if (!int.TryParse(hex, System.Globalization.NumberStyles.HexNumber,
                System.Globalization.CultureInfo.InvariantCulture, out int rgb))
            return false;
        color = new Vector3(((rgb >> 16) & 0xFF) / 255f, ((rgb >> 8) & 0xFF) / 255f, (rgb & 0xFF) / 255f);
        return true;
    }

    // â”€â”€ Save / export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private async void OnSaveX(object sender, RoutedEventArgs e) => await ExportAsync("x");

    private async void OnExport(object sender, RoutedEventArgs e)
    {
        if (sender is MenuFlyoutItem item && item.Tag is string fmt) await ExportAsync(fmt);
    }

    private async System.Threading.Tasks.Task ExportAsync(string fmt)
    {
        if (_scene is null) return;
        var picker = new FileSavePicker { SuggestedStartLocation = PickerLocationId.Desktop };
        picker.FileTypeChoices.Add(fmt.ToUpperInvariant() + " model", new[] { "." + fmt });
        picker.SuggestedFileName = Path.GetFileNameWithoutExtension(_scenePath ?? "model");
        WinRT.Interop.InitializeWithWindow.Initialize(picker, Hwnd);

        var file = await picker.PickSaveFileAsync();
        if (file is null) return;

        BusyRing.IsActive = true;
        try
        {
            var scene = _scene;
            var dest = file.Path;
            await System.Threading.Tasks.Task.Run(() =>
            {
                switch (fmt)
                {
                    case "x": XFileWriter.Write(scene, dest); break;
                    case "obj": MeshExporters.WriteObj(scene, dest); break;
                    case "stl": MeshExporters.WriteStl(scene, dest); break;
                    case "glb": GlbWriter.Write(scene, dest); break;
                }
            });
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Export failed", ex.Message);
        }
        finally
        {
            BusyRing.IsActive = false;
        }
    }

    private async void OnScreenshot(object sender, RoutedEventArgs e)
    {
        if (_scene is null) return;

        var picker = new FileSavePicker { SuggestedStartLocation = PickerLocationId.PicturesLibrary };
        picker.FileTypeChoices.Add("PNG image", new List<string> { ".png" });
        picker.FileTypeChoices.Add("JPEG image", new List<string> { ".jpg" });
        picker.SuggestedFileName =
            (string.IsNullOrEmpty(_scenePath) ? "model" : System.IO.Path.GetFileNameWithoutExtension(_scenePath)) + "_view";
        WinRT.Interop.InitializeWithWindow.Initialize(picker, Hwnd);

        var file = await picker.PickSaveFileAsync();
        if (file is null) return;

        try
        {
            byte[]? pixels = Viewport.Renderer.CaptureFrame(out int w, out int h);
            if (pixels is null || w <= 0 || h <= 0)
            {
                await ShowMessageAsync("Screenshot failed", "The viewport could not be captured.");
                return;
            }

            using var stream = await file.OpenAsync(Windows.Storage.FileAccessMode.ReadWrite);
            bool png = !file.FileType.Equals(".jpg", StringComparison.OrdinalIgnoreCase);
            var encoderId = png
                ? Windows.Graphics.Imaging.BitmapEncoder.PngEncoderId
                : Windows.Graphics.Imaging.BitmapEncoder.JpegEncoderId;
            // Keep transparency only for PNG output with a transparent background.
            var alphaMode = (png && _bgTransparent)
                ? Windows.Graphics.Imaging.BitmapAlphaMode.Premultiplied
                : Windows.Graphics.Imaging.BitmapAlphaMode.Ignore;
            var encoder = await Windows.Graphics.Imaging.BitmapEncoder.CreateAsync(encoderId, stream);
            encoder.SetPixelData(
                Windows.Graphics.Imaging.BitmapPixelFormat.Bgra8,
                alphaMode,
                (uint)w, (uint)h, 96, 96, pixels);
            await encoder.FlushAsync();
        }
        catch (Exception ex)
        {
            await ShowMessageAsync("Screenshot failed", ex.Message);
        }
    }

    /// <summary>Fades out the full-window splash overlay.</summary>
    private void DismissSplash()
    {
        if (SplashOverlay.Visibility == Visibility.Collapsed) return;

        var fade = new DoubleAnimation
        {
            From = 1,
            To = 0,
            Duration = TimeSpan.FromMilliseconds(450),
        };
        Storyboard.SetTarget(fade, SplashOverlay);
        Storyboard.SetTargetProperty(fade, "Opacity");

        var sb = new Storyboard();
        sb.Children.Add(fade);
        sb.Completed += (_, _) =>
        {
            SplashOverlay.Visibility = Visibility.Collapsed;
            SplashOverlay.IsHitTestVisible = false;
        };
        sb.Begin();
    }

    // â”€â”€ Camera / view toggles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void OnResetCamera(object sender, RoutedEventArgs e) => Viewport.ResetCamera(_scene);
    private void OnZoomFit(object sender, RoutedEventArgs e) => Viewport.ResetCamera(_scene);

    private void OnWireframe(object sender, RoutedEventArgs e)
    {
        Viewport.Renderer.Wireframe = WireframeButton.IsChecked == true;
        Viewport.Render();
    }

    private void OnProjectionChanged(object sender, RoutedEventArgs e)
    {
        Viewport.Renderer.Camera.Perspective = ProjPerspective.IsChecked == true;
        Viewport.Render();
    }

    private void OnGrid(object sender, RoutedEventArgs e)
    {
        Viewport.Renderer.GridVisible = GridButton.IsChecked == true;
        Viewport.Render();
    }

    private void OnZoomIn(object sender, RoutedEventArgs e) { Viewport.Renderer.Camera.Dolly(0.85f); Viewport.Render(); }
    private void OnZoomOut(object sender, RoutedEventArgs e) { Viewport.Renderer.Camera.Dolly(1.18f); Viewport.Render(); }
    private void OnPanMode(object sender, RoutedEventArgs e) => Viewport.PanMode = PanButton.IsChecked == true;

    // â”€â”€ Transforms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void OnRotate(object sender, RoutedEventArgs e)
    {
        if (_scene is null || sender is not Button b || b.Tag is not string tag) return;
        var axis = tag[0] switch { 'X' => Axis.X, 'Y' => Axis.Y, _ => Axis.Z };
        int sign = tag[1] == '+' ? 1 : -1;
        ModelTransforms.Rotate90(_scene, axis, sign);
        Viewport.Renderer.SetModel(_scene);
        Viewport.Render();
    }

    private void OnMirror(object sender, RoutedEventArgs e)
    {
        if (_scene is null || sender is not Button b || b.Tag is not string tag) return;
        var axis = tag[0] switch { 'X' => Axis.X, 'Y' => Axis.Y, _ => Axis.Z };
        ModelTransforms.Mirror(_scene, axis);
        Viewport.Renderer.SetModel(_scene);
        Viewport.Render();
    }

    // â”€â”€ Drag & drop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void OnDragOver(object sender, Microsoft.UI.Xaml.DragEventArgs e)
    {
        if (e.DataView.Contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.StorageItems))
        {
            e.AcceptedOperation = Windows.ApplicationModel.DataTransfer.DataPackageOperation.Copy;
            DropOverlay.Visibility = Visibility.Visible;
            e.Handled = true;
        }
    }

    private void OnDragLeave(object sender, Microsoft.UI.Xaml.DragEventArgs e)
        => DropOverlay.Visibility = Visibility.Collapsed;

    private async void OnDrop(object sender, Microsoft.UI.Xaml.DragEventArgs e)
    {
        DropOverlay.Visibility = Visibility.Collapsed;
        if (!e.DataView.Contains(Windows.ApplicationModel.DataTransfer.StandardDataFormats.StorageItems)) return;
        var items = await e.DataView.GetStorageItemsAsync();
        foreach (var item in items)
        {
            if (item is Windows.Storage.StorageFile file && ModelImporter.IsSupported(file.Path))
            {
                await LoadFileAsync(file.Path);
                break;
            }
        }
    }

    // ── Help & context menu ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private async void OnHelp(object sender, RoutedEventArgs e)
    {
        var dialog = new HelpDialog { XamlRoot = RootGrid.XamlRoot };
        await dialog.ShowAsync();
    }

    private async void OnSettings(object sender, RoutedEventArgs e)
    {
        var dialog = new SettingsDialog(this) { XamlRoot = RootGrid.XamlRoot };
        await dialog.ShowAsync();
    }

    private void OnContextMenuAction(object sender, RoutedEventArgs e)
    {
        if (sender is MenuFlyoutItem item)
        {
            switch (item.Tag as string)
            {
                case "screenshot": OnScreenshot(sender, e); break;
                case "reset":      OnResetCamera(sender, e); break;
                case "fit":        OnZoomFit(sender, e);     break;
            }
        }
    }

    // ── Default preferences (Settings card in the Help dialog) ───────────────────────────────────────────────────────────────────────────────────────────

    // These apply immediately to the live viewport AND persist as the startup default.
    // Setting the toolbar control's IsChecked fires its own handler, which updates the renderer.

    public bool PrefWireframe => WireframeButton.IsChecked == true;
    public bool PrefGrid => GridButton.IsChecked == true;
    public bool PrefPerspective => ProjPerspective.IsChecked == true;
    public bool PrefDark => _dark;

    public void SetPrefWireframe(bool on)
    {
        WireframeButton.IsChecked = on;
        _settings.Settings.Wireframe = on;
        _settings.Save();
    }

    public void SetPrefGrid(bool on)
    {
        GridButton.IsChecked = on;
        _settings.Settings.GridVisible = on;
        _settings.Save();
    }

    public void SetPrefPerspective(bool perspective)
    {
        if (perspective) ProjPerspective.IsChecked = true;
        else ProjOrthographic.IsChecked = true;
        _settings.Settings.Perspective = perspective;
        _settings.Save();
    }

    public void SetPrefDark(bool dark)
    {
        if (dark) LookNight.IsChecked = true;
        else LookDay.IsChecked = true;
        _settings.Settings.DarkMode = dark;
        _settings.Save();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

    private void UpdateCamDisplay()
    {
        var c = Viewport.Renderer.Camera;
        var p = c.Position;
        float yawDeg = c.Yaw * 180f / MathF.PI;
        float pitchDeg = c.Pitch * 180f / MathF.PI;
        CamDisplay.Text = $"X: {p.X,6:0.0}  Y: {p.Y,6:0.0}  Z: {p.Z,6:0.0}  |  Pitch: {pitchDeg,5:0.0}\u00B0  Yaw: {yawDeg,5:0.0}\u00B0";
    }

    private async System.Threading.Tasks.Task ShowMessageAsync(string title, string message)
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = message,
            CloseButtonText = "OK",
            XamlRoot = RootGrid.XamlRoot,
        };
        await dialog.ShowAsync();
    }
}
