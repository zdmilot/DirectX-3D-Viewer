# Publishes DirectX 3D Viewer (Release, self-contained, x64) and compiles the
# Inno Setup installer. Run from anywhere:
#     powershell -ExecutionPolicy Bypass -File installer\build_installer.ps1
#
# Requirements:
#   - .NET 8 SDK (dotnet on PATH or under Program Files)
#   - Inno Setup 6 (iscc.exe on PATH or installed in the default location)
#   - signtool.exe (Windows SDK) + a code-signing certificate in the store,
#     unless -Sign:$false is passed for an unsigned structure-only build.
#
# The installer EXE and the generated Inno Setup uninstaller (unins000.exe) are
# both signed via a command-line "sslcom" SignTool definition handed to ISCC,
# which matches the SignTool=sslcom / SignedUninstaller=yes directives in the
# .iss. The sign command is equivalent to:
#     signtool sign /fd SHA256 /tr http://ts.ssl.com /td SHA256 /a /d "DirectX 3D Viewer" $f

[CmdletBinding()]
param(
    [string]$Configuration = 'Release',
    [bool]$Sign = $true
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

# Build the "sslcom" SignTool definition passed to ISCC. $q -> quote and $f ->
# the file(s) Inno wants signed are Inno Setup tokens, so they must reach ISCC
# literally (hence single-quoted assembly below).
function Resolve-SignTool {
    $cmd = Get-Command signtool.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    $roots = @("${env:ProgramFiles(x86)}\Windows Kits\10\bin", "$env:ProgramFiles\Windows Kits\10\bin")
    foreach ($root in $roots) {
        if (Test-Path $root) {
            $found = Get-ChildItem $root -Recurse -Filter signtool.exe -ErrorAction SilentlyContinue |
                Where-Object { $_.FullName -match '\\x64\\' } |
                Sort-Object FullName -Descending | Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }
    throw "Could not locate signtool.exe. Install the Windows SDK or pass -Sign:`$false."
}

if ($Sign) {
    $signtool = Resolve-SignTool
    # /Ssslcom="<signtool>" sign /fd SHA256 /tr http://ts.ssl.com /td SHA256 /a /d "DirectX 3D Viewer" <file>
    $isccArgs = @('/Ssslcom=$q' + $signtool + '$q sign /fd SHA256 /tr http://ts.ssl.com /td SHA256 /a /d $qDirectX 3D Viewer$q $f')
}
else {
    # Skip the SignedUninstaller / SignTool directives in the .iss entirely so a
    # structure-only build does not require a certificate (-Sign:$false).
    $isccArgs = @('/DUnsigned')
    Write-Host '==> -Sign:$false : building UNSIGNED (signing directives skipped).' -ForegroundColor Yellow
}

Write-Host '==> Regenerating wizard images' -ForegroundColor Cyan
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $here 'make_wizard_images.ps1')

Write-Host '==> Publishing app (Release, self-contained, UNPACKAGED, win-x64)' -ForegroundColor Cyan
if (Test-Path $publishDir) { Remove-Item $publishDir -Recurse -Force }
# -p:Unpackaged=true switches the project to an unpackaged (WindowsPackageType=None),
# self-contained WinUI 3 build so the published EXE launches outside an MSIX
# container. See DirectX3DViewer.App.csproj for the matching property switch.
& $dotnet publish $proj `
    -c $Configuration `
    -r win-x64 `
    --self-contained true `
    -p:Platform=x64 `
    -p:Unpackaged=true `
    -p:WindowsPackageType=None `
    -p:WindowsAppSDKSelfContained=true `
    -o $publishDir
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)." }

Write-Host '==> Compiling installer' -ForegroundColor Cyan
& $iscc @isccArgs "/DPublishDir=$publishDir" (Join-Path $here 'DirectX3DViewer.iss')
if ($LASTEXITCODE -ne 0) { throw "ISCC failed ($LASTEXITCODE)." }

$out = Join-Path $here 'Output'
Write-Host "==> Done. Installer written to: $out" -ForegroundColor Green
Get-ChildItem $out -Filter '*.exe' | Select-Object Name, Length, LastWriteTime

if ($Sign) {
    $setupExe = Get-ChildItem $out -Filter '*.exe' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($setupExe) {
        Write-Host "==> Verifying installer signature: $($setupExe.Name)" -ForegroundColor Cyan
        & (Resolve-SignTool) verify /pa /v $setupExe.FullName
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "signtool verify reported a problem on the installer (exit $LASTEXITCODE). If you are using a self-signed test certificate this is expected until the cert chain is trusted."
        }
    }
}
