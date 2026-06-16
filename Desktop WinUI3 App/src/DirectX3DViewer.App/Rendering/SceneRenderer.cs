using System.Numerics;
using System.Runtime.InteropServices;
using Vortice.D3DCompiler;
using Vortice.Direct3D;
using Vortice.Direct3D11;
using Vortice.DXGI;
using Vortice.Mathematics;
using DirectX3DViewer.Core.Geometry;
using static Vortice.Direct3D11.D3D11;

namespace DirectX3DViewer.App.Rendering;

[StructLayout(LayoutKind.Sequential)]
internal struct VertexPN
{
    public Vector3 Position;
    public Vector3 Normal;
    public VertexPN(Vector3 p, Vector3 n) { Position = p; Normal = n; }
}

[StructLayout(LayoutKind.Sequential)]
internal struct Constants
{
    public Matrix4x4 WorldViewProj;
    public Matrix4x4 World;
    public Vector4 LightDir;   // w = unlit flag
    public Vector4 BaseColor;  // a = opacity
}

/// <summary>A draw range (indices) plus its material colour and world-space bounds for culling.</summary>
internal struct GpuGroup
{
    public int Start;
    public int Count;
    public Vector3 Color;
    public float Opacity;
    public Vector3 BoundsMin;
    public Vector3 BoundsMax;
}

internal sealed class GpuMesh : IDisposable
{
    public ID3D11Buffer VertexBuffer = null!;
    public ID3D11Buffer IndexBuffer = null!;
    public int Stride;
    public Format IndexFormat = Format.R32_UInt;
    public List<GpuGroup> Groups = new();

    public void Dispose()
    {
        VertexBuffer?.Dispose();
        IndexBuffer?.Dispose();
    }
}

/// <summary>
/// A compact Direct3D 11 renderer for a single model plus a ground grid.
/// Renders on demand (no continuous loop) for low idle power. Uses a composition
/// swap chain so it can be hosted by a XAML <c>SwapChainPanel</c>, with optional
/// 4Ã— MSAA resolved into the back buffer for clean edges.
/// </summary>
public sealed class SceneRenderer : IDisposable
{
    private ID3D11Device _device = null!;
    private ID3D11DeviceContext _context = null!;
    private IDXGISwapChain1 _swapChain = null!;

    private ID3D11RenderTargetView? _backBufferRtv;
    private ID3D11Texture2D? _msaaColor;
    private ID3D11RenderTargetView? _msaaRtv;
    private ID3D11Texture2D? _depthTex;
    private ID3D11DepthStencilView? _depthView;

    private ID3D11VertexShader _vs = null!;
    private ID3D11PixelShader _ps = null!;
    private ID3D11InputLayout _inputLayout = null!;
    private ID3D11Buffer _constantBuffer = null!;
    private ID3D11RasterizerState _rasterSolid = null!;     // back-face culled
    private ID3D11RasterizerState _rasterWire = null!;      // back-face culled
    private ID3D11RasterizerState _rasterSolidNoCull = null!; // double-sided
    private ID3D11RasterizerState _rasterWireNoCull = null!;  // double-sided
    private ID3D11DepthStencilState _depthOn = null!;
    private ID3D11BlendState _blendOpaque = null!;
    private ID3D11BlendState _blendAlpha = null!;

    private GpuMesh? _model;
    private GpuMesh? _grid;

    // Retained so the scene/grid can be rebuilt after a device-lost event.
    private SceneModel? _currentScene;
    private bool _hasGrid;
    private float _gridMaxDim, _gridGroundY;

    private int _width = 1, _height = 1;
    private int _sampleCount = 1;
    private bool _resized;

    public OrbitCamera Camera { get; } = new();
    public bool Wireframe { get; set; }
    /// <summary>When true, view-frustum cull off-screen draw ranges (helps large models).</summary>
    public bool FrustumCulling { get; set; } = true;
    public bool GridVisible { get; set; } = true;
    /// <summary>When set, overrides every group's diffuse color for display (object-shading tool).</summary>
    public Vector3? ObjectColorOverride { get; set; }
    public Vector4 BackgroundColor { get; set; } = new(0.94f, 0.94f, 0.94f, 1f);
    public Vector3 GridColor { get; set; } = new(0.8f, 0.8f, 0.8f);

    /// <summary>Raised after the D3D device is recreated following a device-lost event.</summary>
    public event Action? SwapChainRecreated;

    public IntPtr SwapChainPointer => _swapChain?.NativePointer ?? IntPtr.Zero;

    private const string ShaderSource = @"
cbuffer Constants : register(b0)
{
    row_major float4x4 WorldViewProj;
    row_major float4x4 World;
    float4 LightDir;   // w = unlit
    float4 BaseColor;  // a = opacity
};
struct VSIn  { float3 pos : POSITION; float3 nrm : NORMAL; };
struct PSIn  { float4 pos : SV_POSITION; float3 nrm : NORMAL; };
PSIn VSMain(VSIn i)
{
    PSIn o;
    o.pos = mul(float4(i.pos, 1.0), WorldViewProj);
    o.nrm = mul(i.nrm, (float3x3)World);
    return o;
}
float4 PSMain(PSIn i) : SV_TARGET
{
    if (LightDir.w > 0.5) return float4(BaseColor.rgb, BaseColor.a);
    float3 n = normalize(i.nrm);
    float3 key = normalize(-LightDir.xyz);
    float d1 = saturate(dot(n, key));
    float3 fill = normalize(float3(-0.5, -0.2, -0.5));
    float d2 = saturate(dot(n, -fill)) * 0.25;
    float amb = 0.42;
    float3 col = BaseColor.rgb * (amb + d1 * 0.7 + d2);
    return float4(col, BaseColor.a);
}";

    public void Initialize(int width, int height)
    {
        _width = Math.Max(1, width);
        _height = Math.Max(1, height);

        CreateDevice();
        DetectMsaa();
        CreateSwapChain();
        CompileShaders();
        CreateStates();
        CreateSizeResources();
    }

    private void CreateDevice()
    {
        var levels = new[]
        {
            FeatureLevel.Level_11_1, FeatureLevel.Level_11_0,
            FeatureLevel.Level_10_1, FeatureLevel.Level_10_0,
        };
        var flags = DeviceCreationFlags.BgraSupport;

        try
        {
            D3D11CreateDevice(null, DriverType.Hardware, flags, levels, out _device!, out _context!);
        }
        catch
        {
            // Fall back to the WARP software renderer on machines without a GPU.
            D3D11CreateDevice(null, DriverType.Warp, flags, levels, out _device!, out _context!);
        }
    }

    private void DetectMsaa()
    {
        foreach (int s in new[] { 4, 2 })
        {
            uint quality = _device.CheckMultisampleQualityLevels(Format.B8G8R8A8_UNorm, (uint)s);
            if (quality > 0) { _sampleCount = s; return; }
        }
        _sampleCount = 1;
    }

    private void CreateSwapChain()
    {
        using var dxgiDevice = _device.QueryInterface<IDXGIDevice>();
        using var adapter = dxgiDevice.GetAdapter();
        using var factory = adapter.GetParent<IDXGIFactory2>();

        var desc = new SwapChainDescription1
        {
            Width = (uint)_width,
            Height = (uint)_height,
            Format = Format.B8G8R8A8_UNorm,
            Stereo = false,
            SampleDescription = new SampleDescription(1, 0),
            BufferUsage = Usage.RenderTargetOutput,
            BufferCount = 2,
            Scaling = Scaling.Stretch,
            SwapEffect = SwapEffect.FlipSequential,
            AlphaMode = AlphaMode.Premultiplied,
            Flags = SwapChainFlags.None,
        };
        _swapChain = factory.CreateSwapChainForComposition(_device, desc);
    }

    private void CompileShaders()
    {
        Compiler.Compile(ShaderSource, "VSMain", "shader.hlsl", "vs_4_0", out Blob vsBlob, out Blob? vsErr);
        if (vsBlob is null) throw new InvalidOperationException("VS compile failed: " + vsErr?.AsString());
        Compiler.Compile(ShaderSource, "PSMain", "shader.hlsl", "ps_4_0", out Blob psBlob, out Blob? psErr);
        if (psBlob is null) throw new InvalidOperationException("PS compile failed: " + psErr?.AsString());

        _vs = _device.CreateVertexShader(vsBlob.AsSpan());
        _ps = _device.CreatePixelShader(psBlob.AsSpan());

        var elements = new[]
        {
            new InputElementDescription("POSITION", 0, Format.R32G32B32_Float, 0, 0),
            new InputElementDescription("NORMAL", 0, Format.R32G32B32_Float, 12, 0),
        };
        _inputLayout = _device.CreateInputLayout(elements, vsBlob.AsSpan());

        vsBlob.Dispose(); vsErr?.Dispose(); psBlob.Dispose(); psErr?.Dispose();

        _constantBuffer = _device.CreateBuffer(
            new BufferDescription((uint)Marshal.SizeOf<Constants>(), BindFlags.ConstantBuffer, ResourceUsage.Default));
    }

    private void CreateStates()
    {
        // Back-face culled (default) — halves fill cost on closed meshes.
        var solid = new RasterizerDescription(CullMode.Back, FillMode.Solid)
        {
            DepthClipEnable = true,
            MultisampleEnable = _sampleCount > 1,
            AntialiasedLineEnable = false,
        };
        _rasterSolid = _device.CreateRasterizerState(solid);

        var wire = new RasterizerDescription(CullMode.Back, FillMode.Wireframe)
        {
            DepthClipEnable = true,
            MultisampleEnable = _sampleCount > 1,
        };
        _rasterWire = _device.CreateRasterizerState(wire);

        // Double-sided variants (no culling) for open/inverted meshes.
        var solidNoCull = new RasterizerDescription(CullMode.None, FillMode.Solid)
        {
            DepthClipEnable = true,
            MultisampleEnable = _sampleCount > 1,
            AntialiasedLineEnable = false,
        };
        _rasterSolidNoCull = _device.CreateRasterizerState(solidNoCull);

        var wireNoCull = new RasterizerDescription(CullMode.None, FillMode.Wireframe)
        {
            DepthClipEnable = true,
            MultisampleEnable = _sampleCount > 1,
        };
        _rasterWireNoCull = _device.CreateRasterizerState(wireNoCull);

        var depth = new DepthStencilDescription(true, DepthWriteMask.All, ComparisonFunction.LessEqual);
        _depthOn = _device.CreateDepthStencilState(depth);

        _blendOpaque = _device.CreateBlendState(BlendDescription.Opaque);
        _blendAlpha = _device.CreateBlendState(BlendDescription.AlphaBlend);
    }

    private void CreateSizeResources()
    {
        using var backBuffer = _swapChain.GetBuffer<ID3D11Texture2D>(0);
        _backBufferRtv = _device.CreateRenderTargetView(backBuffer);

        if (_sampleCount > 1)
        {
            var colorDesc = new Texture2DDescription
            {
                Width = (uint)_width,
                Height = (uint)_height,
                MipLevels = 1,
                ArraySize = 1,
                Format = Format.B8G8R8A8_UNorm,
                SampleDescription = new SampleDescription((uint)_sampleCount, 0),
                Usage = ResourceUsage.Default,
                BindFlags = BindFlags.RenderTarget,
            };
            _msaaColor = _device.CreateTexture2D(colorDesc);
            _msaaRtv = _device.CreateRenderTargetView(_msaaColor);
        }

        var depthDesc = new Texture2DDescription
        {
            Width = (uint)_width,
            Height = (uint)_height,
            MipLevels = 1,
            ArraySize = 1,
            Format = Format.D32_Float,
            SampleDescription = new SampleDescription((uint)_sampleCount, 0),
            Usage = ResourceUsage.Default,
            BindFlags = BindFlags.DepthStencil,
        };
        _depthTex = _device.CreateTexture2D(depthDesc);
        _depthView = _device.CreateDepthStencilView(_depthTex);
    }

    public void Resize(int width, int height)
    {
        if (_device is null) return;
        width = Math.Max(1, width);
        height = Math.Max(1, height);
        if (width == _width && height == _height) return;
        _width = width;
        _height = height;
        _resized = true;
    }

    /// <summary>
    /// Apply the panel's composition scale so the swap chain renders at physical
    /// pixel density (crisp on high-DPI displays).
    /// </summary>
    public void SetCompositionScale(float scaleX, float scaleY)
    {
        if (_swapChain is null) return;
        try
        {
            using var sc2 = _swapChain.QueryInterface<IDXGISwapChain2>();
            sc2.MatrixTransform = new System.Numerics.Matrix3x2(
                1f / MathF.Max(0.01f, scaleX), 0f,
                0f, 1f / MathF.Max(0.01f, scaleY),
                0f, 0f);
        }
        catch { /* DPI scaling is best-effort */ }
    }

    private void ApplyResize()
    {
        _resized = false;
        _context.OMSetRenderTargets((ID3D11RenderTargetView)null!, (ID3D11DepthStencilView)null!);
        _backBufferRtv?.Dispose(); _backBufferRtv = null;
        _msaaRtv?.Dispose(); _msaaRtv = null;
        _msaaColor?.Dispose(); _msaaColor = null;
        _depthView?.Dispose(); _depthView = null;
        _depthTex?.Dispose(); _depthTex = null;

        var result = _swapChain.ResizeBuffers(2, (uint)_width, (uint)_height, Format.B8G8R8A8_UNorm, SwapChainFlags.None);
        if (result.Failure)
        {
            if (result.Code == DXGI_ERROR_DEVICE_REMOVED || result.Code == DXGI_ERROR_DEVICE_RESET)
                RecreateDevice();
            return;
        }
        CreateSizeResources();
    }

    // â”€â”€ Model / grid upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public void SetModel(SceneModel? scene)
    {
        _currentScene = scene;
        UploadModel(scene);
    }

    private void UploadModel(SceneModel? scene)
    {
        _model?.Dispose();
        _model = null;
        if (scene is null || scene.Meshes.Count == 0) return;

        // Guard against models too large to upload in a single buffer.
        long totalVerts = 0, totalIndices = 0;
        foreach (var mesh in scene.Meshes)
        {
            totalVerts += mesh.Positions.Count;
            totalIndices += mesh.Indices.Count;
        }
        if (totalVerts > int.MaxValue || totalIndices > int.MaxValue)
            throw new InvalidOperationException(
                $"Model is too large to display ({totalVerts:N0} vertices, {totalIndices / 3:N0} triangles).");

        var newModel = new GpuMesh { Stride = Marshal.SizeOf<VertexPN>() };
        var verts = new List<VertexPN>((int)Math.Min(totalVerts, 1 << 24));
        var indices = new List<uint>((int)Math.Min(totalIndices, 1 << 24));

        foreach (var mesh in scene.Meshes)
        {
            int baseVertex = verts.Count;
            bool hasN = mesh.HasNormals;
            for (int i = 0; i < mesh.Positions.Count; i++)
                verts.Add(new VertexPN(mesh.Positions[i], hasN ? mesh.Normals[i] : Vector3.UnitY));

            var groups = mesh.Groups.Count > 0
                ? mesh.Groups
                : new List<MaterialGroup> { new(0, mesh.Indices.Count, 0) };

            foreach (var g in groups)
            {
                int start = indices.Count;
                var bmin = new Vector3(float.MaxValue);
                var bmax = new Vector3(float.MinValue);
                for (int k = 0; k < g.Count; k++)
                {
                    int local = mesh.Indices[g.Start + k];
                    var p = mesh.Positions[local];
                    bmin = Vector3.Min(bmin, p);
                    bmax = Vector3.Max(bmax, p);
                    indices.Add((uint)(baseVertex + local));
                }

                var mat = (g.MaterialIndex >= 0 && g.MaterialIndex < mesh.Materials.Count)
                    ? mesh.Materials[g.MaterialIndex]
                    : (mesh.Materials.Count > 0 ? mesh.Materials[0] : new MeshMaterial());
                newModel.Groups.Add(new GpuGroup
                {
                    Start = start,
                    Count = g.Count,
                    Color = mat.Diffuse,
                    Opacity = mat.Opacity,
                    BoundsMin = g.Count > 0 ? bmin : Vector3.Zero,
                    BoundsMax = g.Count > 0 ? bmax : Vector3.Zero,
                });
            }
        }

        if (verts.Count == 0 || indices.Count == 0) { newModel.Dispose(); return; }

        try
        {
            newModel.VertexBuffer = _device.CreateBuffer((ReadOnlySpan<VertexPN>)verts.ToArray(), BindFlags.VertexBuffer);

            // 16-bit indices halve memory/bandwidth when the whole model fits under 64K vertices.
            if (verts.Count <= ushort.MaxValue)
            {
                var u16 = new ushort[indices.Count];
                for (int i = 0; i < indices.Count; i++) u16[i] = (ushort)indices[i];
                newModel.IndexBuffer = _device.CreateBuffer((ReadOnlySpan<ushort>)u16, BindFlags.IndexBuffer);
                newModel.IndexFormat = Format.R16_UInt;
            }
            else
            {
                newModel.IndexBuffer = _device.CreateBuffer((ReadOnlySpan<uint>)indices.ToArray(), BindFlags.IndexBuffer);
                newModel.IndexFormat = Format.R32_UInt;
            }
        }
        catch (Exception ex) when (ex is OutOfMemoryException or SharpGen.Runtime.SharpGenException)
        {
            newModel.Dispose();
            throw new InvalidOperationException(
                $"Not enough graphics memory to display this model ({verts.Count:N0} vertices, {indices.Count / 3:N0} triangles).", ex);
        }

        _model = newModel;
    }

    public void BuildGrid(float maxDim, float groundY)
    {
        _grid?.Dispose();
        _grid = null;
        _hasGrid = true;
        _gridMaxDim = maxDim;
        _gridGroundY = groundY;
        if (maxDim <= 0) maxDim = 100f;

        float extent = MathF.Max(maxDim * 1.5f, 100f);
        float step = MathF.Max(1f, extent / 10f);
        // Snap step to a nice value.
        float mag = MathF.Pow(10f, MathF.Floor(MathF.Log10(step)));
        float res = step / mag;
        step = (res <= 1.5f ? 1f : res <= 3.5f ? 2f : res <= 7.5f ? 5f : 10f) * mag;

        var verts = new List<VertexPN>();
        for (float c = -extent; c <= extent + 0.001f; c += step)
        {
            verts.Add(new VertexPN(new Vector3(c, groundY, -extent), Vector3.UnitY));
            verts.Add(new VertexPN(new Vector3(c, groundY, extent), Vector3.UnitY));
            verts.Add(new VertexPN(new Vector3(-extent, groundY, c), Vector3.UnitY));
            verts.Add(new VertexPN(new Vector3(extent, groundY, c), Vector3.UnitY));
        }

        _grid = new GpuMesh { Stride = Marshal.SizeOf<VertexPN>() };
        var indices = new uint[verts.Count];
        for (uint i = 0; i < indices.Length; i++) indices[i] = i;
        _grid.VertexBuffer = _device.CreateBuffer((ReadOnlySpan<VertexPN>)verts.ToArray(), BindFlags.VertexBuffer);
        _grid.IndexBuffer = _device.CreateBuffer((ReadOnlySpan<uint>)indices, BindFlags.IndexBuffer);
        _grid.IndexFormat = Format.R32_UInt;
        _grid.Groups.Add(new GpuGroup { Start = 0, Count = verts.Count, Color = GridColor, Opacity = 1f });
    }

    // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public void Render()
    {
        if (_device is null || _swapChain is null) return;
        if (!DrawFrame()) return;
        var result = _swapChain.Present(1, PresentFlags.None);
        if (result.Failure) HandlePresentFailure(result);
    }

    // DXGI_ERROR_DEVICE_REMOVED / _RESET — rebuild the device and re-upload content.
    private const int DXGI_ERROR_DEVICE_REMOVED = unchecked((int)0x887A0005);
    private const int DXGI_ERROR_DEVICE_RESET = unchecked((int)0x887A0007);

    private void HandlePresentFailure(SharpGen.Runtime.Result result)
    {
        if (result.Code == DXGI_ERROR_DEVICE_REMOVED || result.Code == DXGI_ERROR_DEVICE_RESET)
            RecreateDevice();
    }

    /// <summary>Rebuilds the D3D device and all resources after a device-lost event.</summary>
    private void RecreateDevice()
    {
        DisposeDeviceResources();
        try
        {
            CreateDevice();
            DetectMsaa();
            CreateSwapChain();
            CompileShaders();
            CreateStates();
            CreateSizeResources();
            if (_currentScene is not null) UploadModel(_currentScene);
            if (_hasGrid) BuildGrid(_gridMaxDim, _gridGroundY);
            SwapChainRecreated?.Invoke();
        }
        catch
        {
            // Leave the device torn down; the next Render() attempt will retry.
        }
    }

    /// <summary>
    /// Renders the current frame and returns it as top-down BGRA8 pixel data
    /// (4 bytes per pixel). Returns <c>null</c> if the device is not ready.
    /// </summary>
    public byte[]? CaptureFrame(out int width, out int height)
    {
        width = _width;
        height = _height;
        if (_device is null || _swapChain is null) return null;
        if (!DrawFrame()) return null;

        using var backBuffer = _swapChain.GetBuffer<ID3D11Texture2D>(0);
        var desc = backBuffer.Description;
        desc.BindFlags = BindFlags.None;
        desc.CPUAccessFlags = CpuAccessFlags.Read;
        desc.Usage = ResourceUsage.Staging;
        desc.MiscFlags = ResourceOptionFlags.None;

        using var staging = _device.CreateTexture2D(desc);
        _context.CopyResource(staging, backBuffer);

        var map = _context.Map(staging, 0, MapMode.Read, Vortice.Direct3D11.MapFlags.None);
        try
        {
            int rowPitch = (int)map.RowPitch;
            int destStride = width * 4;
            var data = new byte[destStride * height];
            for (int y = 0; y < height; y++)
                Marshal.Copy(IntPtr.Add(map.DataPointer, y * rowPitch), data, y * destStride, destStride);

            // Present so the freshly drawn frame stays on screen.
            _swapChain.Present(1, PresentFlags.None);
            return data;
        }
        finally
        {
            _context.Unmap(staging, 0);
        }
    }

    private bool DrawFrame()
    {
        if (_device is null || _swapChain is null) return false;
        if (_resized) ApplyResize();

        var rtv = _sampleCount > 1 ? _msaaRtv : _backBufferRtv;
        if (rtv is null || _depthView is null) return false;

        _context.RSSetViewport(new Viewport(0, 0, _width, _height, 0f, 1f));
        _context.OMSetRenderTargets(rtv, _depthView);
        _context.ClearRenderTargetView(rtv, new Vortice.Mathematics.Color4(
            BackgroundColor.X, BackgroundColor.Y, BackgroundColor.Z, BackgroundColor.W));
        _context.ClearDepthStencilView(_depthView, DepthStencilClearFlags.Depth, 1f, 0);

        _context.IASetInputLayout(_inputLayout);
        _context.VSSetShader(_vs);
        _context.PSSetShader(_ps);
        _context.VSSetConstantBuffer(0, _constantBuffer);
        _context.PSSetConstantBuffer(0, _constantBuffer);
        _context.OMSetDepthStencilState(_depthOn);

        float aspect = (float)_width / _height;
        Matrix4x4 viewProj = Camera.GetView() * Camera.GetProjection(aspect);
        var lightDir = new Vector4(Vector3.Normalize(new Vector3(0.4f, -0.9f, 0.45f)), 0f);

        // Grid (unlit lines).
        if (GridVisible && _grid is not null)
        {
            _context.RSSetState(_rasterSolid);
            _context.OMSetBlendState(_blendOpaque);
            _context.IASetPrimitiveTopology(PrimitiveTopology.LineList);
            _context.IASetVertexBuffer(0, _grid.VertexBuffer, (uint)_grid.Stride, 0);
            _context.IASetIndexBuffer(_grid.IndexBuffer, _grid.IndexFormat, 0);
            var g = _grid.Groups[0];
            UpdateConstants(viewProj, Matrix4x4.Identity, new Vector4(GridColor, 1f), new Vector4(0, 0, 0, 1f));
            _context.DrawIndexed((uint)g.Count, (uint)g.Start, 0);
        }

        // Model (lit triangles). Always double-sided — back-face culling made
        // many real-world models look hollow / inside-out.
        if (_model is not null)
        {
            _context.RSSetState(Wireframe ? _rasterWireNoCull : _rasterSolidNoCull);
            _context.IASetPrimitiveTopology(PrimitiveTopology.TriangleList);
            _context.IASetVertexBuffer(0, _model.VertexBuffer, (uint)_model.Stride, 0);
            _context.IASetIndexBuffer(_model.IndexBuffer, _model.IndexFormat, 0);

            // Build view-frustum planes once for culling off-screen draw ranges.
            Vector4[]? planes = FrustumCulling && _model.Groups.Count > 1 ? ExtractFrustumPlanes(viewProj) : null;

            Vector3? shade = ObjectColorOverride;

            // Opaque first, then transparent.
            foreach (var grp in _model.Groups)
            {
                if (grp.Opacity >= 0.999f)
                {
                    if (planes is not null && AabbOutsideFrustum(planes, grp.BoundsMin, grp.BoundsMax)) continue;
                    _context.OMSetBlendState(_blendOpaque);
                    UpdateConstants(viewProj, Matrix4x4.Identity, new Vector4(shade ?? grp.Color, grp.Opacity), lightDir);
                    _context.DrawIndexed((uint)grp.Count, (uint)grp.Start, 0);
                }
            }
            foreach (var grp in _model.Groups)
            {
                if (grp.Opacity < 0.999f)
                {
                    if (planes is not null && AabbOutsideFrustum(planes, grp.BoundsMin, grp.BoundsMax)) continue;
                    _context.OMSetBlendState(_blendAlpha);
                    UpdateConstants(viewProj, Matrix4x4.Identity, new Vector4(shade ?? grp.Color, grp.Opacity), lightDir);
                    _context.DrawIndexed((uint)grp.Count, (uint)grp.Start, 0);
                }
            }
            _context.OMSetBlendState(_blendOpaque);
        }

        if (_sampleCount > 1 && _msaaColor is not null)
        {
            using var backBuffer = _swapChain.GetBuffer<ID3D11Texture2D>(0);
            _context.ResolveSubresource(backBuffer, 0, _msaaColor, 0, Format.B8G8R8A8_UNorm);
        }

        return true;
    }

    private void UpdateConstants(Matrix4x4 viewProj, Matrix4x4 world, Vector4 color, Vector4 light)
    {
        var c = new Constants
        {
            WorldViewProj = world * viewProj,
            World = world,
            LightDir = light,
            BaseColor = color,
        };
        _context.UpdateSubresource(in c, _constantBuffer);
    }

    // â”€â”€ Frustum culling â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// <summary>
    /// Extracts the six world-space frustum planes (Gribb&amp;ndash;Hartmann) from a
    /// row-major view-projection matrix. Each plane is (a,b,c,d) where points with
    /// a*x+b*y+c*z+d &gt;= 0 are inside.
    /// </summary>
    private static Vector4[] ExtractFrustumPlanes(in Matrix4x4 m)
    {
        // Columns of the row-vector transform (v * m).
        var c1 = new Vector4(m.M11, m.M21, m.M31, m.M41);
        var c2 = new Vector4(m.M12, m.M22, m.M32, m.M42);
        var c3 = new Vector4(m.M13, m.M23, m.M33, m.M43);
        var c4 = new Vector4(m.M14, m.M24, m.M34, m.M44);

        var planes = new[]
        {
            c4 + c1, // left
            c4 - c1, // right
            c4 + c2, // bottom
            c4 - c2, // top
            c3,      // near (D3D depth range [0,1])
            c4 - c3, // far
        };
        for (int i = 0; i < planes.Length; i++)
        {
            float len = new Vector3(planes[i].X, planes[i].Y, planes[i].Z).Length();
            if (len > 1e-6f) planes[i] /= len;
        }
        return planes;
    }

    /// <summary>Returns true when an axis-aligned box lies fully outside the frustum.</summary>
    private static bool AabbOutsideFrustum(Vector4[] planes, Vector3 min, Vector3 max)
    {
        foreach (var p in planes)
        {
            // Positive vertex (farthest along the plane normal).
            float px = p.X >= 0 ? max.X : min.X;
            float py = p.Y >= 0 ? max.Y : min.Y;
            float pz = p.Z >= 0 ? max.Z : min.Z;
            if (p.X * px + p.Y * py + p.Z * pz + p.W < 0)
                return true; // outside this plane => outside frustum
        }
        return false;
    }

    /// <summary>Disposes all GPU/device resources (used for shutdown and device-lost recovery).</summary>
    private void DisposeDeviceResources()
    {
        _model?.Dispose(); _model = null;
        _grid?.Dispose(); _grid = null;
        _backBufferRtv?.Dispose(); _backBufferRtv = null;
        _msaaRtv?.Dispose(); _msaaRtv = null;
        _msaaColor?.Dispose(); _msaaColor = null;
        _depthView?.Dispose(); _depthView = null;
        _depthTex?.Dispose(); _depthTex = null;
        _vs?.Dispose(); _vs = null!;
        _ps?.Dispose(); _ps = null!;
        _inputLayout?.Dispose(); _inputLayout = null!;
        _constantBuffer?.Dispose(); _constantBuffer = null!;
        _rasterSolid?.Dispose(); _rasterSolid = null!;
        _rasterWire?.Dispose(); _rasterWire = null!;
        _rasterSolidNoCull?.Dispose(); _rasterSolidNoCull = null!;
        _rasterWireNoCull?.Dispose(); _rasterWireNoCull = null!;
        _depthOn?.Dispose(); _depthOn = null!;
        _blendOpaque?.Dispose(); _blendOpaque = null!;
        _blendAlpha?.Dispose(); _blendAlpha = null!;
        _swapChain?.Dispose(); _swapChain = null!;
        _context?.Dispose(); _context = null!;
        _device?.Dispose(); _device = null!;
    }

    public void Dispose() => DisposeDeviceResources();
}
