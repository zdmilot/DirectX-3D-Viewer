# Generates the Inno Setup wizard images (left banner + small header badge)
# using the same brand gradient and teapot silhouette as the application icon,
# so the installer matches the app's visual identity.
# Uses System.Drawing (Windows PowerShell / .NET Framework).
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

# Teapot outline (DirectX teapot silhouette) shared with Assets\make_icon.ps1.
$body = "50.5 32.8 73.8 33.2 79.8 33.9 81.4 34.5 82.0 35.0 82.1 35.7 82.6 36.3 85.0 38.1 87.8 40.9 89.9 44.3 90.8 44.4 95.0 46.5 98.2 49.2 100.0 51.4 101.4 54.3 104.4 64.1 105.6 67.1 107.3 70.0 109.8 72.4 115.4 75.5 104.9 75.2 103.1 74.5 100.9 72.4 100.1 71.2 99.3 69.6 97.4 63.9 95.3 60.6 93.6 59.2 91.5 58.1 89.4 57.7 88.9 58.0 85.2 67.7 81.7 74.9 80.4 75.9 73.9 75.9 70.4 76.6 68.3 76.8 62.3 77.9 59.6 79.1 59.1 79.9 59.1 80.6 62.3 85.0 62.2 85.9 60.9 86.6 56.1 87.0 53.2 86.8 51.3 86.6 50.3 86.1 49.9 85.7 49.9 85.0 50.5 83.9 52.7 81.4 53.2 80.6 53.2 79.9 52.6 79.1 49.9 77.9 38.3 75.9 31.9 75.9 30.6 74.9 28.9 71.6 15.9 71.4 10.9 70.7 7.0 69.3 5.6 68.0 4.7 66.2 4.3 64.7 4.5 61.5 5.4 58.2 6.6 56.0 8.6 53.2 11.1 50.6 17.0 46.4 22.9 43.5 24.5 40.9 26.8 38.6 29.5 36.4 30.1 35.7 30.4 34.9 31.5 34.1 38.6 33.2 50.5 32.8"
$handle = "21.6 48.5 21.6 50.9 22.1 54.3 23.0 57.3 24.8 62.7 27.0 67.6 16.4 67.5 13.1 67.0 10.9 66.1 10.2 65.5 9.8 64.8 9.7 62.8 10.3 60.4 12.4 56.1 14.8 53.2 16.2 51.9 19.7 49.3 21.6 48.5"

function Parse-Points([string]$s) {
    $n = $s -split '\s+' | Where-Object { $_ -ne '' }
    $pts = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
    for ($i = 0; $i -lt $n.Count; $i += 2) {
        # Flip to upright orientation (the original web transform used scale(-1,-1)).
        $pts.Add([System.Drawing.PointF]::new([single](-[double]$n[$i]), [single](-[double]$n[$i + 1]))) | Out-Null
    }
    return , $pts.ToArray()
}

function New-TeapotPath([double]$x, [double]$y, [double]$w, [double]$h) {
    $bodyPts = Parse-Points $body
    $handlePts = Parse-Points $handle

    $minX = [double]::PositiveInfinity; $minY = [double]::PositiveInfinity
    $maxX = [double]::NegativeInfinity; $maxY = [double]::NegativeInfinity
    foreach ($p in ($bodyPts + $handlePts)) {
        if ($p.X -lt $minX) { $minX = $p.X }
        if ($p.X -gt $maxX) { $maxX = $p.X }
        if ($p.Y -lt $minY) { $minY = $p.Y }
        if ($p.Y -gt $maxY) { $maxY = $p.Y }
    }
    $srcW = [Math]::Max(1e-3, $maxX - $minX)
    $srcH = [Math]::Max(1e-3, $maxY - $minY)
    $fit = [Math]::Min($w / $srcW, $h / $srcH)
    $drawW = $srcW * $fit
    $drawH = $srcH * $fit
    $ox = $x + ($w - $drawW) / 2.0
    $oy = $y + ($h - $drawH) / 2.0

    $map = {
        param($pts)
        $out = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
        foreach ($p in $pts) {
            $out.Add([System.Drawing.PointF]::new(
                    [single](($p.X - $minX) * $fit + $ox),
                    [single](($p.Y - $minY) * $fit + $oy))) | Out-Null
        }
        return , $out.ToArray()
    }

    $tp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $tp.FillMode = [System.Drawing.Drawing2D.FillMode]::Alternate
    $tp.AddPolygon((& $map $bodyPts))
    $tp.AddPolygon((& $map $handlePts))
    return @{ Path = $tp; X = $ox; Y = $oy; W = $drawW; H = $drawH }
}

function Save-Bmp([System.Drawing.Bitmap]$bmp, [string]$path) {
    # Inno Setup requires 24-bit BMP. Re-wrap to Format24bppRgb to be safe.
    $flat = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $gg = [System.Drawing.Graphics]::FromImage($flat)
    $gg.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
    $gg.Dispose()
    $flat.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $flat.Dispose()
}

function New-BrandGraphics([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

    # Brand gradient: #002E48 -> #0A4A6E -> #255A85 (matches BrandGradientBrush).
    $rect = [System.Drawing.RectangleF]::new(0, 0, $w, $h)
    $grad = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0x00, 0x2E, 0x48),
        [System.Drawing.Color]::FromArgb(255, 0x25, 0x5A, 0x85),
        60.0)
    $blend = New-Object System.Drawing.Drawing2D.ColorBlend(3)
    $blend.Colors = @(
        [System.Drawing.Color]::FromArgb(255, 0x00, 0x2E, 0x48),
        [System.Drawing.Color]::FromArgb(255, 0x0A, 0x4A, 0x6E),
        [System.Drawing.Color]::FromArgb(255, 0x25, 0x5A, 0x85))
    $blend.Positions = @(0.0, 0.45, 1.0)
    $grad.InterpolationColors = $blend
    $g.FillRectangle($grad, $rect)
    $grad.Dispose()
    return @{ Bmp = $bmp; G = $g }
}

# ---- Left wizard banner (default 164x314) at several DPI scales ----
$bannerSizes = @(
    @{ W = 164; H = 314 },
    @{ W = 192; H = 386 },
    @{ W = 246; H = 494 },
    @{ W = 273; H = 556 },
    @{ W = 328; H = 628 })

$bannerFiles = @()
foreach ($s in $bannerSizes) {
    $r = New-BrandGraphics $s.W $s.H
    $bmp = $r.Bmp; $g = $r.G
    $sx = $s.W / 164.0; $sy = $s.H / 314.0

    # Tube accent stripe near the bottom (#0366A0 -> #00BCD7).
    $stripeY = [single](250 * $sy)
    $stripeH = [single](4 * $sy)
    $stripeRect = [System.Drawing.RectangleF]::new(0, $stripeY, $s.W, $stripeH)
    $tube = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $stripeRect,
        [System.Drawing.Color]::FromArgb(255, 0x03, 0x66, 0xA0),
        [System.Drawing.Color]::FromArgb(255, 0x00, 0xBC, 0xD7),
        0.0)
    $g.FillRectangle($tube, $stripeRect)
    $tube.Dispose()

    # Teapot watermark, large and centered in the upper area.
    $tpW = 150 * $sx; $tpH = 150 * $sy
    $tp = New-TeapotPath (($s.W - $tpW) / 2.0) (60 * $sy) $tpW $tpH
    $tpBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.RectangleF]::new([single]$tp.X, [single]$tp.Y, [single][Math]::Max(1, $tp.W), [single][Math]::Max(1, $tp.H)),
        [System.Drawing.Color]::FromArgb(255, 0x9A, 0xD2, 0xFF),
        [System.Drawing.Color]::FromArgb(255, 0x3B, 0x9B, 0xE8),
        90.0)
    $g.FillPath($tpBrush, $tp.Path)
    $tpBrush.Dispose(); $tp.Path.Dispose()

    # Wordmark.
    $titleFont = New-Object System.Drawing.Font('Segoe UI Semibold', [single](15 * $sx), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $subFont = New-Object System.Drawing.Font('Segoe UI', [single](8 * $sx), [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
    $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(170, 0xFF, 0xFF, 0xFF))
    $fmt = New-Object System.Drawing.StringFormat
    $fmt.Alignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString('DirectX 3D Viewer', $titleFont, $white, [System.Drawing.RectangleF]::new(0, [single](214 * $sy), [single]$s.W, [single](26 * $sy)), $fmt)
    $g.DrawString('MODEL VIEWER & CONVERTER', $subFont, $muted, [System.Drawing.RectangleF]::new(0, [single](236 * $sy), [single]$s.W, [single](16 * $sy)), $fmt)
    $titleFont.Dispose(); $subFont.Dispose(); $white.Dispose(); $muted.Dispose(); $fmt.Dispose()

    $name = if ($s.W -eq 164) { 'wizard-large.bmp' } else { "wizard-large-$($s.W)x$($s.H).bmp" }
    $path = Join-Path $here $name
    Save-Bmp $bmp $path
    $bannerFiles += $name
    $g.Dispose(); $bmp.Dispose()
}

# ---- Small header badge (default 55x58) at several DPI scales ----
$smallSizes = @(
    @{ W = 55; H = 58 },
    @{ W = 64; H = 68 },
    @{ W = 83; H = 86 },
    @{ W = 92; H = 97 },
    @{ W = 110; H = 116 })

foreach ($s in $smallSizes) {
    $r = New-BrandGraphics $s.W $s.H
    $bmp = $r.Bmp; $g = $r.G
    $pad = [Math]::Round($s.W * 0.16)
    $tp = New-TeapotPath $pad $pad ($s.W - 2 * $pad) ($s.H - 2 * $pad)
    $tpBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.RectangleF]::new([single]$tp.X, [single]$tp.Y, [single][Math]::Max(1, $tp.W), [single][Math]::Max(1, $tp.H)),
        [System.Drawing.Color]::FromArgb(255, 0x9A, 0xD2, 0xFF),
        [System.Drawing.Color]::FromArgb(255, 0x3B, 0x9B, 0xE8),
        90.0)
    $g.FillPath($tpBrush, $tp.Path)
    $tpBrush.Dispose(); $tp.Path.Dispose()

    $name = if ($s.W -eq 55) { 'wizard-small.bmp' } else { "wizard-small-$($s.W)x$($s.H).bmp" }
    Save-Bmp $bmp (Join-Path $here $name)
    $g.Dispose(); $bmp.Dispose()
}

Write-Output "Wizard images generated in $here"
