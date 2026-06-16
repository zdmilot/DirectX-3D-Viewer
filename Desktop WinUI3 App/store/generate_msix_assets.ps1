param(
    [string]$ProjectRoot = (Join-Path $PSScriptRoot "..\src\DirectX3DViewer.App")
)
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
try { Add-Type -AssemblyName System.Drawing } catch { }
$iconsDir  = Join-Path $PSScriptRoot "assets\icons"
$assetsOut = Join-Path $ProjectRoot  "Assets"
$masterSrc = Join-Path $iconsDir "app-icon-300x300.png"
if (-not (Test-Path $masterSrc)) { Write-Error "Master icon not found: $masterSrc"; exit 1 }
if (-not (Test-Path $assetsOut)) { New-Item -ItemType Directory -Path $assetsOut | Out-Null }
$brandDark = [System.Drawing.ColorTranslator]::FromHtml("#0D1B2A")
function Render-Tile {
    param([int]$W, [int]$H, [string]$OutName,
          [System.Drawing.Color]$Background = $brandDark, [float]$IconFraction = 0.72)
    $bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear($Background)
    $shorter  = [Math]::Min($W, $H)
    $iconSize = [int]($shorter * $IconFraction)
    $x = [int](($W - $iconSize) / 2)
    $y = [int](($H - $iconSize) / 2)
    $g.DrawImage($src, $x, $y, $iconSize, $iconSize)
    $outPath = Join-Path $assetsOut $OutName
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    Write-Host ("  {0,-32} {1} x {2}" -f $OutName, $W, $H)
}
Write-Host "Generating MSIX tile assets from $masterSrc"
$src = [System.Drawing.Image]::FromFile((Resolve-Path $masterSrc).Path)
Render-Tile -W 310 -H 150 -OutName "Wide310x150Logo.png" -IconFraction 0.68
Render-Tile -W 310 -H 310 -OutName "LargeTile.png"       -IconFraction 0.75
Render-Tile -W 620 -H 300 -OutName "SplashScreen.png"    -IconFraction 0.42
Render-Tile -W  24 -H  24 -OutName "BadgeLogo.png"       -IconFraction 0.90
$src.Dispose()
Write-Host "Done."