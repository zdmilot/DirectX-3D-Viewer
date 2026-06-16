using System.Runtime.InteropServices;

namespace DirectX3DViewer.App.Rendering;

/// <summary>
/// COM interop for binding a Direct3D swap chain to a XAML
/// <c>SwapChainPanel</c>. The panel exposes <c>ISwapChainPanelNative</c> whose
/// <c>SetSwapChain</c> attaches a composition swap chain for native rendering.
/// </summary>
[ComImport]
[Guid("63aad0b8-7c24-40ff-85a8-640d944cc325")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface ISwapChainPanelNative
{
    [PreserveSig]
    int SetSwapChain(IntPtr swapChain);
}
