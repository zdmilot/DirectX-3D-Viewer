# Regenerates icon.png and icon.ico from the teapot path with the teapot
# centered in the canvas. Uses System.Drawing (Windows PowerShell / .NET Framework).
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

# Teapot outline (DirectX teapot silhouette): all straight line segments.
$body = "50.5 32.8 73.8 33.2 79.8 33.9 81.4 34.5 82.0 35.0 82.1 35.7 82.6 36.3 85.0 38.1 87.8 40.9 89.9 44.3 90.8 44.4 95.0 46.5 98.2 49.2 100.0 51.4 101.4 54.3 104.4 64.1 105.6 67.1 107.3 70.0 109.8 72.4 115.4 75.5 104.9 75.2 103.1 74.5 100.9 72.4 100.1 71.2 99.3 69.6 97.4 63.9 95.3 60.6 93.6 59.2 91.5 58.1 89.4 57.7 88.9 58.0 85.2 67.7 81.7 74.9 80.4 75.9 73.9 75.9 70.4 76.6 68.3 76.8 62.3 77.9 59.6 79.1 59.1 79.9 59.1 80.6 62.3 85.0 62.2 85.9 60.9 86.6 56.1 87.0 53.2 86.8 51.3 86.6 50.3 86.1 49.9 85.7 49.9 85.0 50.5 83.9 52.7 81.4 53.2 80.6 53.2 79.9 52.6 79.1 49.9 77.9 38.3 75.9 31.9 75.9 30.6 74.9 28.9 71.6 15.9 71.4 10.9 70.7 7.0 69.3 5.6 68.0 4.7 66.2 4.3 64.7 4.5 61.5 5.4 58.2 6.6 56.0 8.6 53.2 11.1 50.6 17.0 46.4 22.9 43.5 24.5 40.9 26.8 38.6 29.5 36.4 30.1 35.7 30.4 34.9 31.5 34.1 38.6 33.2 50.5 32.8"
$handle = "21.6 48.5 21.6 50.9 22.1 54.3 23.0 57.3 24.8 62.7 27.0 67.6 16.4 67.5 13.1 67.0 10.9 66.1 10.2 65.5 9.8 64.8 9.7 62.8 10.3 60.4 12.4 56.1 14.8 53.2 16.2 51.9 19.7 49.3 21.6 48.5"

function Parse-Points([string]$s) {
    $n = $s -split '\s+' | Where-Object { $_ -ne '' }
    $pts = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
    for ($i = 0; $i -lt $n.Count; $i += 2) {
        # Flip to upright orientation (the original web transform used scale(-1,-1)).
        $x = -[double]$n[$i]
        $y = -[double]$n[$i + 1]
        $pts.Add([System.Drawing.PointF]::new([single]$x, [single]$y)) | Out-Null
    }
    return , $pts.ToArray()
}

function New-IconBitmap([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    $scale = $size / 256.0
    $g.ScaleTransform([single]$scale, [single]$scale)

    # Rounded-rect background gradient. Inset a couple of logical px on every
    # side so the rounded corners stay fully inside the bitmap (drawing right up
    # to x/y = 256 clips the right/bottom corners after antialiasing/scaling).
    $inset = 2.0
    $x0 = $inset; $y0 = $inset; $x1 = 256.0 - $inset; $y1 = 256.0 - $inset
    $rect = [System.Drawing.RectangleF]::new($x0, $y0, $x1 - $x0, $y1 - $y0)
    $radius = 32.0
    $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $gp.AddArc($x0, $y0, $d, $d, 180, 90)
    $gp.AddArc($x1 - $d, $y0, $d, $d, 270, 90)
    $gp.AddArc($x1 - $d, $y1 - $d, $d, $d, 0, 90)
    $gp.AddArc($x0, $y1 - $d, $d, $d, 90, 90)
    $gp.CloseFigure()
    $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 0x1a, 0x2a, 0x3a),
        [System.Drawing.Color]::FromArgb(255, 0x0f, 0x19, 0x22),
        45.0)
    $g.FillPath($bgBrush, $gp)

    # Parse both outlines, then auto-fit them into the canvas with even margins
    # so the teapot is never clipped on any edge.
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

    $pad = 44.0                          # logical-px margin inside the 256 canvas
    $avail = 256.0 - 2.0 * $pad
    $fit = $avail / [Math]::Max($srcW, $srcH)
    $drawW = $srcW * $fit
    $drawH = $srcH * $fit
    $ox = (256.0 - $drawW) / 2.0
    $oy = (256.0 - $drawH) / 2.0

    $map = {
        param($pts)
        $out = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
        foreach ($p in $pts) {
            $x = ($p.X - $minX) * $fit + $ox
            $y = ($p.Y - $minY) * $fit + $oy
            $out.Add([System.Drawing.PointF]::new([single]$x, [single]$y)) | Out-Null
        }
        return , $out.ToArray()
    }

    # Teapot (even-odd fill so the handle hole shows through).
    $teapot = New-Object System.Drawing.Drawing2D.GraphicsPath
    $teapot.FillMode = [System.Drawing.Drawing2D.FillMode]::Alternate
    $teapot.AddPolygon((& $map $bodyPts))
    $teapot.AddPolygon((& $map $handlePts))

    $teapotBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.RectangleF]::new([single]$ox, [single]$oy, [single][Math]::Max(1, $drawW), [single][Math]::Max(1, $drawH)),
        [System.Drawing.Color]::FromArgb(255, 0x5d, 0xb8, 0xf5),
        [System.Drawing.Color]::FromArgb(255, 0x02, 0x75, 0xd8),
        90.0)
    $g.FillPath($teapotBrush, $teapot)

    $bgBrush.Dispose(); $teapotBrush.Dispose(); $gp.Dispose(); $teapot.Dispose(); $g.Dispose()
    return $bmp
}

# 256px PNG.
$png = New-IconBitmap 256
$png.Save((Join-Path $here 'icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# Multi-resolution ICO with PNG-compressed entries.
$sizes = 16, 24, 32, 48, 64, 128, 256
$pngStreams = @()
foreach ($s in $sizes) {
    $b = New-IconBitmap $s
    $ms = New-Object System.IO.MemoryStream
    $b.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngStreams += , @{ Size = $s; Bytes = $ms.ToArray() }
    $b.Dispose(); $ms.Dispose()
}

$icoPath = Join-Path $here 'icon.ico'
$fs = [System.IO.File]::Create($icoPath)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([uint16]0)            # reserved
$bw.Write([uint16]1)            # type = icon
$bw.Write([uint16]$pngStreams.Count)

$offset = 6 + 16 * $pngStreams.Count
foreach ($e in $pngStreams) {
    $dim = if ($e.Size -ge 256) { 0 } else { $e.Size }
    $bw.Write([byte]$dim)       # width
    $bw.Write([byte]$dim)       # height
    $bw.Write([byte]0)          # palette
    $bw.Write([byte]0)          # reserved
    $bw.Write([uint16]1)        # planes
    $bw.Write([uint16]32)       # bit count
    $bw.Write([uint32]$e.Bytes.Length)
    $bw.Write([uint32]$offset)
    $offset += $e.Bytes.Length
}
foreach ($e in $pngStreams) { $bw.Write($e.Bytes) }
$bw.Flush(); $bw.Close(); $fs.Close()
$png.Dispose()

Write-Output "icon.png and icon.ico regenerated (teapot centered)."
