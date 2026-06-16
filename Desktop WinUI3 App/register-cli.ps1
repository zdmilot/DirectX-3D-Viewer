<#
.SYNOPSIS
    Registers the built DirectX 3D Viewer so it can be launched from the
    command line without a full path, and (optionally) makes it the program
    that opens 3D model files when you double-click them.

.DESCRIPTION
    All changes are per-user (HKCU + user PATH) and require NO administrator
    rights. Run -Unregister to cleanly remove everything this script adds.

    What it does:
      * Adds the folder containing DirectX3DViewer.exe to your user PATH, so
        'DirectX3DViewer' works from any terminal.
      * Creates a short 'x3d.cmd' launcher next to the exe, so you can just
        type 'x3d model.stl' or 'x3d convert in.obj out.x'.
      * Registers the exe under "App Paths" so 'start DirectX3DViewer' and the
        Run dialog can find it.
      * (Optional, -Associate) Registers .x .hxx .obj .stl .glb .gltf so that
        double-clicking those files opens THIS build.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\register-cli.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\register-cli.ps1 -Associate

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\register-cli.ps1 -Unregister
#>

[CmdletBinding()]
param(
    # Path to DirectX3DViewer.exe. Defaults to the Release x64 build output.
    [string] $ExePath,

    # Also register file-type associations (double-click opens this build).
    [switch] $Associate,

    # Remove everything this script previously added.
    [switch] $Unregister
)

$ErrorActionPreference = 'Stop'

$AppName      = 'DirectX3DViewer'
$ShortName    = 'x3d'
$ProgId       = 'DirectX3DViewer.Model'
$Extensions   = @('.x', '.hxx', '.obj', '.stl', '.glb', '.gltf')
$AppPathsKey  = "HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\$AppName.exe"

function Resolve-ExePath {
    if ($ExePath) {
        if (-not (Test-Path $ExePath)) { throw "Exe not found: $ExePath" }
        return (Resolve-Path $ExePath).Path
    }
    # Default: relative to this script -> src\DirectX3DViewer.App\bin\x64\Release\<tfm>\DirectX3DViewer.exe
    $root = $PSScriptRoot
    $candidate = Get-ChildItem -Path $root -Recurse -Filter 'DirectX3DViewer.exe' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\bin\\x64\\Release\\' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $candidate) {
        $candidate = Get-ChildItem -Path $root -Recurse -Filter 'DirectX3DViewer.exe' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1
    }
    if (-not $candidate) {
        throw "Could not locate DirectX3DViewer.exe under '$root'. Build the app first, or pass -ExePath."
    }
    return $candidate.FullName
}

function Get-UserPath {
    [Environment]::GetEnvironmentVariable('Path', 'User')
}

function Set-UserPath([string] $value) {
    [Environment]::SetEnvironmentVariable('Path', $value, 'User')
}

function Add-ToUserPath([string] $dir) {
    $current = Get-UserPath
    $parts = @()
    if ($current) { $parts = $current -split ';' | Where-Object { $_ -ne '' } }
    if ($parts -contains $dir) {
        Write-Host "  PATH already contains: $dir"
        return
    }
    $newPath = (@($parts) + $dir) -join ';'
    Set-UserPath $newPath
    Write-Host "  Added to user PATH: $dir"
}

function Remove-FromUserPath([string] $dir) {
    $current = Get-UserPath
    if (-not $current) { return }
    $parts = $current -split ';' | Where-Object { $_ -ne '' -and $_ -ne $dir }
    Set-UserPath ($parts -join ';')
    Write-Host "  Removed from user PATH: $dir"
}

function Register-All {
    $exe = Resolve-ExePath
    $dir = Split-Path -Parent $exe
    Write-Host "Registering '$AppName'" -ForegroundColor Cyan
    Write-Host "  Exe: $exe"

    # 1) user PATH
    Add-ToUserPath $dir

    # 2) short launcher: x3d.cmd  ->  forwards all args to the exe
    $shim = Join-Path $dir "$ShortName.cmd"
    @(
        '@echo off'
        "start """" ""$exe"" %*"
    ) | Set-Content -Path $shim -Encoding ASCII
    Write-Host "  Created short launcher: $shim   (use '$ShortName <file>' or '$ShortName convert ...')"

    # 3) App Paths (Run dialog / 'start')
    New-Item -Path $AppPathsKey -Force | Out-Null
    Set-ItemProperty -Path $AppPathsKey -Name '(default)' -Value $exe
    Set-ItemProperty -Path $AppPathsKey -Name 'Path'      -Value $dir
    Write-Host "  Registered App Paths key."

    # 4) optional file associations
    if ($Associate) {
        $progKey = "HKCU:\Software\Classes\$ProgId"
        New-Item -Path "$progKey\shell\open\command" -Force | Out-Null
        Set-ItemProperty -Path $progKey -Name '(default)' -Value 'DirectX 3D Model'
        Set-ItemProperty -Path "$progKey\DefaultIcon" -Name '(default)' -Value "$exe,0" -ErrorAction SilentlyContinue
        New-Item -Path "$progKey\DefaultIcon" -Force | Out-Null
        Set-ItemProperty -Path "$progKey\DefaultIcon" -Name '(default)' -Value "$exe,0"
        Set-ItemProperty -Path "$progKey\shell\open\command" -Name '(default)' -Value ('"' + $exe + '" "%1"')

        foreach ($ext in $Extensions) {
            $extKey = "HKCU:\Software\Classes\$ext"
            New-Item -Path $extKey -Force | Out-Null
            Set-ItemProperty -Path $extKey -Name '(default)' -Value $ProgId

            # OpenWithProgids lets the file show this build under "Open with".
            $owp = "$extKey\OpenWithProgids"
            New-Item -Path $owp -Force | Out-Null
            Set-ItemProperty -Path $owp -Name $ProgId -Value ([byte[]]@()) -Type Binary -ErrorAction SilentlyContinue
        }
        Write-Host "  Associated: $($Extensions -join ', ')  ->  this build."
        Notify-ShellChange
    }

    Write-Host ""
    Write-Host "Done. Open a NEW terminal, then try:" -ForegroundColor Green
    Write-Host "    $AppName --help"
    Write-Host "    $ShortName convert model.obj model.x"
}

function Unregister-All {
    Write-Host "Unregistering '$AppName'" -ForegroundColor Cyan

    # Best effort: find a previously-registered exe dir from App Paths to clean PATH/shim.
    $dir = $null
    if (Test-Path $AppPathsKey) {
        $dir = (Get-ItemProperty -Path $AppPathsKey).Path
        Remove-Item -Path $AppPathsKey -Recurse -Force
        Write-Host "  Removed App Paths key."
    }
    if (-not $dir -and $ExePath) { $dir = Split-Path -Parent $ExePath }

    if ($dir) {
        Remove-FromUserPath $dir
        $shim = Join-Path $dir "$ShortName.cmd"
        if (Test-Path $shim) { Remove-Item $shim -Force; Write-Host "  Removed $shim" }
    }

    # Remove associations / ProgId.
    foreach ($ext in $Extensions) {
        $extKey = "HKCU:\Software\Classes\$ext"
        if (Test-Path $extKey) {
            $val = (Get-ItemProperty -Path $extKey -ErrorAction SilentlyContinue).'(default)'
            if ($val -eq $ProgId) { Remove-ItemProperty -Path $extKey -Name '(default)' -ErrorAction SilentlyContinue }
            $owp = "$extKey\OpenWithProgids"
            if (Test-Path $owp) { Remove-ItemProperty -Path $owp -Name $ProgId -ErrorAction SilentlyContinue }
        }
    }
    $progKey = "HKCU:\Software\Classes\$ProgId"
    if (Test-Path $progKey) { Remove-Item -Path $progKey -Recurse -Force; Write-Host "  Removed ProgId." }

    Notify-ShellChange
    Write-Host "Done. Removed CLI registration (restart terminals to refresh PATH)." -ForegroundColor Green
}

function Notify-ShellChange {
    # Tell Explorer that file associations changed.
    $sig = @'
[System.Runtime.InteropServices.DllImport("shell32.dll")]
public static extern void SHChangeNotify(int eventId, int flags, System.IntPtr item1, System.IntPtr item2);
'@
    try {
        $t = Add-Type -MemberDefinition $sig -Name 'ShellNotify' -Namespace 'Win32' -PassThru -ErrorAction SilentlyContinue
        $t::SHChangeNotify(0x08000000, 0x0000, [System.IntPtr]::Zero, [System.IntPtr]::Zero)
    } catch { }
}

if ($Unregister) { Unregister-All } else { Register-All }
