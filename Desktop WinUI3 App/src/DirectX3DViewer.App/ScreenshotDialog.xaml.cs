using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media.Imaging;

namespace DirectX3DViewer.App;

/// <summary>
/// Screenshot preview dialog modelled on the web app's "Screenshot Preview"
/// modal: a gradient header, a live preview, Show Grid / Show Background
/// toggles, and PNG / JPG save buttons.
/// </summary>
public sealed partial class ScreenshotDialog : ContentDialog
{
    private readonly Func<bool, bool, WriteableBitmap?> _capture;
    private bool _ready;

    /// <summary>True when the grid should appear in the saved image.</summary>
    public bool ShowGrid => GridToggle.IsOn;

    /// <summary>True when the scene background should appear (false = transparent).</summary>
    public bool ShowBackground => BgToggle.IsOn;

    /// <summary>"png", "jpg", or null when the user cancelled.</summary>
    public string? ChosenFormat { get; private set; }

    /// <param name="capture">
    /// Renders a preview bitmap for the given (showGrid, showBackground) options.
    /// </param>
    public ScreenshotDialog(Func<bool, bool, WriteableBitmap?> capture)
    {
        InitializeComponent();
        this.EnableLightDismiss();
        _capture = capture;
        Opened += (_, _) => { _ready = true; UpdatePreview(); };
    }

    private void UpdatePreview()
    {
        if (!_ready) return;
        PreviewImage.Source = _capture(GridToggle.IsOn, BgToggle.IsOn);
    }

    private void OnOptionChanged(object sender, RoutedEventArgs e) => UpdatePreview();

    private void OnCancel(object sender, RoutedEventArgs e)
    {
        ChosenFormat = null;
        Hide();
    }

    private void OnSavePng(object sender, RoutedEventArgs e)
    {
        ChosenFormat = "png";
        Hide();
    }

    private void OnSaveJpg(object sender, RoutedEventArgs e)
    {
        ChosenFormat = "jpg";
        Hide();
    }
}
