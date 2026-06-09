param(
    [string]$IconPath = "..\src\DirectX3DViewer.App\Assets\icon.png",
    [string]$OutRoot = "."
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$brandNavy = [System.Drawing.Color]::FromArgb(0x00, 0x2E, 0x48)
$brandBlue = [System.Drawing.Color]::FromArgb(0x03, 0x66, 0xA0)
$brandCyan = [System.Drawing.Color]::FromArgb(0x00, 0xBC, 0xD7)
$textColor = [System.Drawing.Color]::FromArgb(0xF0, 0xF6, 0xFA)
$mutedText = [System.Drawing.Color]::FromArgb(0xD1, 0xE5, 0xEE)

$resolvedIcon = Resolve-Path (Join-Path $PSScriptRoot $IconPath)
$icon = [System.Drawing.Image]::FromFile($resolvedIcon)

function New-GradientBackground {
    param(
        [int]$Width,
        [int]$Height,
        [System.Drawing.Graphics]$Graphics
    )

    $rect = New-Object System.Drawing.Rectangle 0,0,$Width,$Height
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $brandNavy, $brandBlue, 35)
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend
    $blend.Colors = @($brandNavy, $brandBlue, $brandCyan)
    $blend.Positions = @(0.0, 0.62, 1.0)
    $brush.InterpolationColors = $blend
    $Graphics.FillRectangle($brush, $rect)
    $brush.Dispose()
}

function Draw-IconCentered {
    param(
        [System.Drawing.Graphics]$Graphics,
        [int]$CanvasW,
        [int]$CanvasH,
        [double]$Scale
    )

    $drawW = [int]([Math]::Min($CanvasW, $CanvasH) * $Scale)
    $drawH = $drawW
    $x = [int](($CanvasW - $drawW) / 2)
    $y = [int](($CanvasH - $drawH) / 2)

    $Graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $Graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $Graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $Graphics.DrawImage($icon, $x, $y, $drawW, $drawH)
}

function Save-BrandTile {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [double]$IconScale = 0.7
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    New-GradientBackground -Width $Width -Height $Height -Graphics $g
    Draw-IconCentered -Graphics $g -CanvasW $Width -CanvasH $Height -Scale $IconScale
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Save-HeroImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [string]$Title,
        [string]$Subtitle
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    New-GradientBackground -Width $Width -Height $Height -Graphics $g

    $circleBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(35,255,255,255))
    $g.FillEllipse($circleBrush, [int]($Width*0.56), [int]($Height*0.08), [int]($Width*0.62), [int]($Width*0.62))
    $g.FillEllipse($circleBrush, [int](-$Width*0.18), [int]($Height*0.52), [int]($Width*0.72), [int]($Width*0.72))
    $circleBrush.Dispose()

    $iconW = [int]($Height * 0.56)
    $iconX = [int]($Width * 0.70)
    $iconY = [int](($Height - $iconW) / 2)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($icon, $iconX, $iconY, $iconW, $iconW)

    $titleFont = New-Object System.Drawing.Font('Segoe UI Semibold', [float]($Height*0.072), [System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI', [float]($Height*0.032), [System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush($textColor)
    $subtitleBrush = New-Object System.Drawing.SolidBrush($mutedText)

    $left = [int]($Width * 0.08)
    $g.DrawString($Title, $titleFont, $titleBrush, $left, [int]($Height*0.30))
    $g.DrawString($Subtitle, $subtitleFont, $subtitleBrush, $left, [int]($Height*0.49))

    $subtitleBrush.Dispose()
    $titleBrush.Dispose()
    $subtitleFont.Dispose()
    $titleFont.Dispose()
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Save-SafeLandscapeImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [string]$Title,
        [string]$Subtitle
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    New-GradientBackground -Width $Width -Height $Height -Graphics $g

    # Safe zones to keep content fully visible in constrained Store layouts.
    $outerPad = [int]([Math]::Round($Width * 0.055))
    $gap = [int]([Math]::Round($Width * 0.035))
    $contentH = $Height - (2 * $outerPad)

    $textW = [int]([Math]::Round($Width * 0.58))
    $textRect = [System.Drawing.RectangleF]::new([float]$outerPad, [float]$outerPad, [float]$textW, [float]$contentH)

    $iconAreaX = $outerPad + $textW + $gap
    $iconAreaW = $Width - $iconAreaX - $outerPad
    $iconSize = [int]([Math]::Min($iconAreaW, $contentH) * 0.92)
    $iconX = $iconAreaX + [int](($iconAreaW - $iconSize) / 2)
    $iconY = $outerPad + [int](($contentH - $iconSize) / 2)

    $overlayBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(150, 7, 31, 49))
    $overlayRect = New-Object System.Drawing.Rectangle($outerPad, $outerPad, [int]($textW + $gap * 0.35), $contentH)
    $g.FillRectangle($overlayBrush, $overlayRect)
    $overlayBrush.Dispose()

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)

    $titleFont = New-Object System.Drawing.Font('Segoe UI Semibold', [float]([Math]::Round($Height * 0.105)), [System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI', [float]([Math]::Round($Height * 0.048)), [System.Drawing.FontStyle]::Regular)
    $titleBrush = New-Object System.Drawing.SolidBrush($textColor)
    $subtitleBrush = New-Object System.Drawing.SolidBrush($mutedText)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Near
    $format.LineAlignment = [System.Drawing.StringAlignment]::Near
    $format.Trimming = [System.Drawing.StringTrimming]::EllipsisWord

    $titleRect = [System.Drawing.RectangleF]::new([float]$textRect.X, [float]($textRect.Y + [int]($contentH * 0.20)), [float]$textRect.Width, [float]([int]($contentH * 0.28)))
    $subtitleRect = [System.Drawing.RectangleF]::new([float]$textRect.X, [float]($textRect.Y + [int]($contentH * 0.53)), [float]$textRect.Width, [float]([int]($contentH * 0.22)))

    $g.DrawString($Title, $titleFont, $titleBrush, $titleRect, $format)
    $g.DrawString($Subtitle, $subtitleFont, $subtitleBrush, $subtitleRect, $format)

    $format.Dispose()
    $subtitleBrush.Dispose()
    $titleBrush.Dispose()
    $subtitleFont.Dispose()
    $titleFont.Dispose()
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Save-BackgroundOnlyImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    New-GradientBackground -Width $Width -Height $Height -Graphics $g
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

function Save-ScreenshotPlaceholder {
    param(
        [string]$Path,
        [string]$Heading,
        [string]$Line1,
        [string]$Line2,
        [int]$Width = 1366,
        [int]$Height = 768
    )

    $bmp = New-Object System.Drawing.Bitmap $Width, $Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    New-GradientBackground -Width $Width -Height $Height -Graphics $g

    $panelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 7, 31, 49))
    $panelRect = New-Object System.Drawing.Rectangle ([int]($Width*0.06)), ([int]($Height*0.11)), ([int]($Width*0.52)), ([int]($Height*0.78))
    $g.FillRectangle($panelBrush, $panelRect)

    $iconW = [int]($Height * 0.52)
    $iconX = [int]($Width * 0.66)
    $iconY = [int](($Height - $iconW) / 2)
    $g.DrawImage($icon, $iconX, $iconY, $iconW, $iconW)

    $hFont = New-Object System.Drawing.Font('Segoe UI Semibold', 50, [System.Drawing.FontStyle]::Bold)
    $lFont = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Regular)
    $hBrush = New-Object System.Drawing.SolidBrush($textColor)
    $lBrush = New-Object System.Drawing.SolidBrush($mutedText)

    $tx = [int]($Width*0.09)
    $g.DrawString($Heading, $hFont, $hBrush, $tx, [int]($Height*0.24))
    $g.DrawString($Line1, $lFont, $lBrush, $tx, [int]($Height*0.42))
    $g.DrawString($Line2, $lFont, $lBrush, $tx, [int]($Height*0.50))

    $lBrush.Dispose(); $hBrush.Dispose()
    $lFont.Dispose(); $hFont.Dispose()
    $panelBrush.Dispose()
    $g.Dispose()
    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

$iconsOut = Join-Path $PSScriptRoot (Join-Path $OutRoot 'assets/icons')
$heroOut = Join-Path $PSScriptRoot (Join-Path $OutRoot 'assets/hero')
$shotsOut = Join-Path $PSScriptRoot (Join-Path $OutRoot 'assets/screenshots')
$layoutOut = Join-Path $PSScriptRoot (Join-Path $OutRoot 'assets/layout')

New-Item -ItemType Directory -Force -Path $iconsOut, $heroOut, $shotsOut, $layoutOut | Out-Null

$iconSizes = @(300,150,71,50,44)
foreach ($size in $iconSizes) {
    Save-BrandTile -Path (Join-Path $iconsOut ("app-icon-{0}x{0}.png" -f $size)) -Width $size -Height $size -IconScale 0.70
}

Save-HeroImage -Path (Join-Path $heroOut 'hero-2400x1200.png') -Width 2400 -Height 1200 -Title 'DirectX 3D Viewer' -Subtitle 'Load, inspect, and convert .x, .hxx, .obj, and .stl models.'
Save-HeroImage -Path (Join-Path $heroOut 'promo-tile-732x412.png') -Width 732 -Height 412 -Title 'DirectX 3D Viewer' -Subtitle 'WinUI 3 model viewer and converter'
Save-HeroImage -Path (Join-Path $heroOut 'spotlight-1920x1080.png') -Width 1920 -Height 1080 -Title 'DirectX 3D Viewer' -Subtitle 'Direct3D viewport with export workflows'

# Microsoft Store layout-specific branding images.
Save-BrandTile -Path (Join-Path $layoutOut 'box-art-1080x1080.png') -Width 1080 -Height 1080 -IconScale 0.64
Save-BrandTile -Path (Join-Path $layoutOut 'box-art-2160x2160.png') -Width 2160 -Height 2160 -IconScale 0.64
Save-HeroImage -Path (Join-Path $layoutOut 'poster-art-720x1080.png') -Width 720 -Height 1080 -Title 'DirectX 3D Viewer' -Subtitle 'View and convert technical 3D model formats'
Save-HeroImage -Path (Join-Path $layoutOut 'poster-art-1440x2160.png') -Width 1440 -Height 2160 -Title 'DirectX 3D Viewer' -Subtitle 'View and convert technical 3D model formats'
Save-BackgroundOnlyImage -Path (Join-Path $layoutOut 'poster-art-1080x720.png') -Width 1080 -Height 720

Save-ScreenshotPlaceholder -Path (Join-Path $shotsOut '01-main-viewport.png') -Heading 'Inspect 3D Models' -Line1 'Open and orbit DirectX, OBJ, and STL files.' -Line2 'Analyze geometry with a native Direct3D viewport.'
Save-ScreenshotPlaceholder -Path (Join-Path $shotsOut '02-conversion-workflow.png') -Heading 'Convert and Export' -Line1 'Convert between supported model formats quickly.' -Line2 'Use practical conversion options in one desktop app.'
Save-ScreenshotPlaceholder -Path (Join-Path $shotsOut '03-light-dark-themes.png') -Heading 'Professional UI' -Line1 'Polished WinUI 3 experience with brand theming.' -Line2 'Readable controls for daily engineering workflows.'
Save-ScreenshotPlaceholder -Path (Join-Path $shotsOut '04-file-associations.png') -Heading 'Fast File Launch' -Line1 'Optional file associations for supported formats.' -Line2 'Open project files directly from Windows Explorer.'

$icon.Dispose()
Write-Host 'Store assets generated successfully.'
