# DirectX 3D Viewer

DirectX 3D Viewer is a **native Windows desktop application** for viewing, converting, and inspecting 3D files used in Hamilton automation workflows and general 3D pipelines. It is built with **WinUI 3 / Windows App SDK** and renders models with a hardware-accelerated **Direct3D 11** viewport.

## Why this project exists

Hamilton VENUS relies on `.x` and `.hxx` model formats. Support for these formats has been dropped or is no longer maintained in many mainstream 3D tools (including newer Blender workflows and other common tooling).

This project aims to change that by giving the power back to the people:

- Open and inspect legacy Hamilton 3D assets
- Generate and convert `.x` models
- Switch between `.x` and common 3D formats without vendor lock-in

## Download

Download the latest signed installer from the [Releases page](https://github.com/zdmilot/DirectX-3D-Viewer/releases).

## Features

- Load and view `.x`, `.hxx`, `.obj`, and `.stl`
- Native Direct3D 11 viewport with orbit / pan / dolly camera controls
- Drag-and-drop file loading
- Wireframe, grid, and perspective/orthographic toggles
- Apply transform operations (rotate Â±90Â° and mirror on X/Y/Z)
- Export to `.x`, `.obj`, `.stl`, and `.glb`
- Light / dark theme with Windows 11 Fluent styling (Mica backdrop, rounded cards, native command bars)
- Native splash screen and About dialog

## Supported format workflows

- Input: `.x`, `.hxx`, `.obj`, `.stl`
- Export: `.x`, `.obj`, `.stl`, `.glb`

## Architecture

The solution (`DirectX3DViewer.slnx`) contains two projects:

| Project | Target | Purpose |
| --- | --- | --- |
| `src/DirectX3DViewer.Core` | `net8.0` | UI-independent geometry, format loaders/writers, and conversion logic |
| `src/DirectX3DViewer.App` | `net8.0-windows` (WinUI 3) | Native UI shell, Direct3D 11 renderer, file I/O |

- **Rendering:** Direct3D 11 via [Vortice.Windows](https://github.com/amerkoleci/Vortice.Windows), hosted in a `SwapChainPanel` through a composition swap chain.
- **UI:** WinUI 3 / Windows App SDK with Fluent Design styling.

## Requirements

- Windows 10 version 1809 (10.0.17763) or later
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Windows App SDK runtime (restored automatically as a NuGet dependency)

## Build and run from source

```powershell
# Build (Platform must be specified)
dotnet build src\DirectX3DViewer.App\DirectX3DViewer.App.csproj -p:Platform=x64

# Run
.\src\DirectX3DViewer.App\bin\x64\Debug\net8.0-windows10.0.19041.0\DirectX3DViewer.exe
```

You can also open `DirectX3DViewer.slnx` in Visual Studio 2022 and run the `DirectX3DViewer.App` project (set the platform to **x64**).

To open a file directly on launch, pass its path as a command-line argument:

```powershell
DirectX3DViewer.exe path\to\model.x
```

## Tech stack

- WinUI 3 / Windows App SDK
- Direct3D 11 (Vortice.Windows)
- .NET 8
- Custom loaders and conversion pipeline for Hamilton and DirectX-oriented assets

## License

MIT
