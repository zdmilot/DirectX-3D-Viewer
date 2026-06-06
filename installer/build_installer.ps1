# Publishes DirectX 3D Viewer (Release, self-contained, x64) and compiles the
# Inno Setup installer. Run from anywhere:
#     powershell -ExecutionPolicy Bypass -File installer\build_installer.ps1
#
# Requirements:
#   - .NET 8 SDK (dotnet on PATH or under Program Files)
#   - Inno Setup 6 (iscc.exe on PATH or installed in the default location)

[CmdletBinding()]
param(
    [string]$Configuration = 'Release'
)

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $here
$proj = Join-Path $repo 'src\DirectX3DViewer.App\DirectX3DViewer.App.csproj'
$publishDir = Join-Path $repo 'src\DirectX3DViewer.App\bin\x64\publish'

function Resolve-Tool([string]$name, [string[]]$candidates) {
    $cmd = Get-Command $name -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    throw "Could not locate '$name'. Install it or add it to PATH."
}

$dotnet = Resolve-Tool 'dotnet' @(
    "$env:ProgramFiles\dotnet\dotnet.exe",
    "$env:ProgramW6432\dotnet\dotnet.exe",
    "$env:LOCALAPPDATA\Microsoft\dotnet\dotnet.exe")

$iscc = Resolve-Tool 'iscc' @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "$env:ProgramFiles\Inno Setup 6\ISCC.exe")

Write-Host '==> Regenerating wizard images' -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here 'make_wizard_images.ps1')

Write-Host '==> Publishing app (Release, self-contained, win-x64)' -ForegroundColor Cyan
if (Test-Path $publishDir) { Remove-Item $publishDir -Recurse -Force }
& $dotnet publish $proj `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:Platform=x64 `
    -p:WindowsAppSDKSelfContained=true `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)." }

Write-Host '==> Compiling installer' -ForegroundColor Cyan
& $iscc "/DPublishDir=$publishDir" (Join-Path $here 'DirectX3DViewer.iss')
if ($LASTEXITCODE -ne 0) { throw "ISCC failed ($LASTEXITCODE)." }

$out = Join-Path $here 'Output'
Write-Host "==> Done. Installer written to: $out" -ForegroundColor Green
Get-ChildItem $out -Filter '*.exe' | Select-Object Name, Length, LastWriteTime
