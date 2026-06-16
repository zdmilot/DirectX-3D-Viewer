using Microsoft.UI.Input;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.Foundation;
using Windows.System;
using DirectX3DViewer.App.Rendering;
using DirectX3DViewer.Core.Geometry;

namespace DirectX3DViewer.App.Controls;

/// <summary>
/// A native Direct3D viewport hosted in a <see cref="SwapChainPanel"/>. Owns a
/// <see cref="SceneRenderer"/> and translates pointer input into orbit/pan/zoom
/// camera moves, rendering on demand.
/// </summary>
public sealed class D3DViewport : SwapChainPanel, IDisposable
{
    private readonly SceneRenderer _renderer = new();
    private bool _initialized;
    private bool _disposed;

    private Point _lastPointer;
    private bool _dragging;
    private bool _rightDragging;

    /// <summary>When true, left-drag pans instead of orbiting.</summary>
    public bool PanMode { get; set; }

    public SceneRenderer Renderer => _renderer;

    public D3DViewport()
    {
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
        SizeChanged += OnSizeChanged;
        CompositionScaleChanged += OnCompositionScaleChanged;

        PointerPressed += OnPointerPressed;
        PointerReleased += OnPointerReleased;
        PointerMoved += OnPointerMoved;
        PointerWheelChanged += OnPointerWheel;
        PointerCanceled += (_, _) => { _dragging = _rightDragging = false; };
        PointerCaptureLost += (_, _) => { _dragging = _rightDragging = false; };

        // Re-attach the swap chain to this panel after a device-lost recovery.
        _renderer.SwapChainRecreated += OnSwapChainRecreated;
    }

    private void OnSwapChainRecreated()
    {
        if (_disposed) return;
        if (DispatcherQueue.HasThreadAccess) BindSwapChain();
        else DispatcherQueue.TryEnqueue(BindSwapChain);
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        if (_initialized) return;
        int w = PixelWidth();
        int h = PixelHeight();
        if (w <= 0 || h <= 0) return;

        _renderer.Initialize(w, h);
        BindSwapChain();
        _renderer.SetCompositionScale(CompositionScaleX, CompositionScaleY);
        _initialized = true;
        Render();
    }

    private void BindSwapChain()
    {
        var native = WinRT.CastExtensions.As<ISwapChainPanelNative>(this);
        native.SetSwapChain(_renderer.SwapChainPointer);
    }

    private void OnUnloaded(object sender, RoutedEventArgs e) => Dispose();

    private void OnSizeChanged(object sender, SizeChangedEventArgs e)
    {
        if (!_initialized) { OnLoaded(sender, e); return; }
        _renderer.Resize(PixelWidth(), PixelHeight());
        _renderer.SetCompositionScale(CompositionScaleX, CompositionScaleY);
        Render();
    }

    private void OnCompositionScaleChanged(SwapChainPanel sender, object args)
    {
        if (!_initialized) return;
        _renderer.Resize(PixelWidth(), PixelHeight());
        _renderer.SetCompositionScale(CompositionScaleX, CompositionScaleY);
        Render();
    }

    private int PixelWidth() => Math.Max(1, (int)Math.Round(ActualWidth * CompositionScaleX));
    private int PixelHeight() => Math.Max(1, (int)Math.Round(ActualHeight * CompositionScaleY));

    // â”€â”€ Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    private void OnPointerPressed(object sender, PointerRoutedEventArgs e)
    {
        var pt = e.GetCurrentPoint(this);
        _lastPointer = pt.Position;
        if (pt.Properties.IsRightButtonPressed || pt.Properties.IsMiddleButtonPressed)
            _rightDragging = true;
        else if (pt.Properties.IsLeftButtonPressed)
            _dragging = true;
        CapturePointer(e.Pointer);
    }

    private void OnPointerReleased(object sender, PointerRoutedEventArgs e)
    {
        _dragging = _rightDragging = false;
        ReleasePointerCapture(e.Pointer);
    }

    private void OnPointerMoved(object sender, PointerRoutedEventArgs e)
    {
        if (!_initialized || (!_dragging && !_rightDragging)) return;
        var pos = e.GetCurrentPoint(this).Position;
        float dx = (float)(pos.X - _lastPointer.X);
        float dy = (float)(pos.Y - _lastPointer.Y);
        _lastPointer = pos;

        bool pan = _rightDragging || (PanMode && _dragging);
        if (pan)
            _renderer.Camera.Pan(dx, dy, (float)ActualHeight);
        else
            _renderer.Camera.Orbit(dx * 0.01f, dy * 0.01f);

        Render();
    }

    private void OnPointerWheel(object sender, PointerRoutedEventArgs e)
    {
        if (!_initialized) return;
        int delta = e.GetCurrentPoint(this).Properties.MouseWheelDelta;
        float factor = delta > 0 ? 0.9f : 1.1f;
        _renderer.Camera.Dolly(factor);
        Render();
    }

    // â”€â”€ Public operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public void LoadModel(SceneModel? scene)
    {
        if (!_initialized) return;
        _renderer.SetModel(scene);
        if (scene is not null && scene.TryGetBounds(out var min, out var max))
        {
            var center = (min + max) * 0.5f;
            float maxDim = scene.MaxDimension;
            _renderer.Camera.Frame(center, maxDim);
            _renderer.BuildGrid(maxDim, min.Y - maxDim * 0.002f);
        }
        Render();
    }

    public void ResetCamera(SceneModel? scene)
    {
        if (scene is not null && scene.TryGetBounds(out var min, out var max))
            _renderer.Camera.Frame((min + max) * 0.5f, scene.MaxDimension);
        Render();
    }

    public void Render()
    {
        if (_initialized && !_disposed) _renderer.Render();
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _renderer.Dispose();
    }
}
