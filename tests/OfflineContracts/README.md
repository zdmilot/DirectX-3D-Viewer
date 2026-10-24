# Standalone Core offline contracts

This console harness references the actual `Desktop WinUI3 App/src/DirectX3DViewer.Core/DirectX3DViewer.Core.csproj`, targeting .NET 8 with SharpGLTF.Core 1.0.6. It does not reference the WinUI application, load a fake engine, or borrow the Layout converter's different Core sources. No renderer, device, registry, installed configuration, or existing model files are used.

The synthetic cases exercise triangle normals and bounds; a positive 90-degree Z rotation; mirror winding and two-mirror identity; inverse-transpose normals under nonuniform scaling; literal text X material values and handedness conversion; OBJ negative indices, texture coordinates and an in-memory MTL callback; literal ASCII and independently constructed binary STL; GLB header/chunk framing and decoded geometry; a separate SharpGLTF semantic roundtrip; and the public importer's unsupported-format and empty-geometry rejection.

Expected coordinates and material values are literals. The scaled normal is independently derived as `(-6,-4,3)/sqrt(61)`. GLB framing expectations follow the Khronos specification's [Header and Chunks sections](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#glb-file-format-specification): little-endian header fields, version 2, exact total length, JSON before BIN, and four-byte chunk alignment. Tests decode those fields with BCL binary readers instead of calling the library under test. This is a finite contract suite, not comprehensive format conformance or rendering validation.

MSZIP, binary X, HXX, multi-material GLB export, external glTF buffers and malformed-format fuzzing remain unqualified. Temporary GLBs are new synthetic fixtures retained beside the result JSON for evidence; existing methods, libraries and models are never copied. Geometry work is CPU-only; GPU metrics are null.

Every case saves expected and actual observations, fixture and source SHA256 values, revision, timestamp, elapsed milliseconds, process CPU delta and process lifetime peak working set. Missing metrics are null. The final provenance case checks the source hashes again. Assembly hashes identify the loaded Core, SharpGLTF and harness. All case results persist even when a case fails; a failed suite exits 1. Results cannot overwrite an existing evidence JSON. The baseline revision identifies the unchanged production implementation; the new harness is identified by its own source hash until committed.

Run from this repository using the already installed audit SDK and package cache. Keep generated build outputs outside the repository. Use a distinct output filename for every run, and use the actual current Git revision.

```powershell
$env:PYTHONPATH = 'C:\Program Files (x86)\Hamilton\Tools and Utilities\Hamilton-Agent-Toolkit'
$env:DOTNET_GENERATE_ASPNET_CERTIFICATE = 'false'
$env:DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
$env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
$env:DOTNET_NOLOGO = '1'
$env:DOTNET_MULTILEVEL_LOOKUP = '0'
$env:DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = '1'
$env:MSBUILDDISABLENODEREUSE = '1'
$auditEvidence = Join-Path $env:LOCALAPPDATA 'hamtk\audit-workers\directx-contracts-20261024'
$env:DOTNET_CLI_HOME = Join-Path $auditEvidence 'dotnet-home'
$auditSdk = 'C:\Users\User\AppData\Local\hamtk\audit\offline-20261023\dependencies\dotnet-8.0\dotnet.exe'
$auditPackages = 'C:\Users\User\AppData\Local\hamtk\audit\offline-20261023\dependencies\nuget'
$auditArtifacts = Join-Path $auditEvidence 'build'
py -3 -B -m hamtk watchdog run --timeout 180 --idle 45 -- $auditSdk restore tests/OfflineContracts/OfflineContracts.csproj --disable-build-servers --disable-parallel --source (Join-Path $auditPackages 'sharpgltf.core\1.0.6') --packages $auditPackages --artifacts-path $auditArtifacts -p:NuGetAudit=false
py -3 -B -m hamtk watchdog run --timeout 180 --idle 45 -- $auditSdk build tests/OfflineContracts/OfflineContracts.csproj --no-restore --no-incremental --configuration Release --disable-build-servers --artifacts-path $auditArtifacts -p:NuGetAudit=false
py -3 -B -m hamtk watchdog run --timeout 120 --idle 30 -- $auditSdk (Join-Path $auditArtifacts 'bin\OfflineContracts\release\OfflineContracts.dll') --source-root (Get-Location).Path --output '<absolute new result JSON>' --revision '<full verified Git SHA>'
```

Add `--case-prefix obj_` to the harness command for the focused OBJ cases plus the source-provenance check. A filter matching no behavioral cases cannot produce PASS.

The first measured baseline at `77face0d2bc68e84ef74f4fa59a90dfb89bf44de` produced 16 PASS and 1 FAIL. The failing valid OBJ triangle has no `vn` references and imports with zero normals. `GetVertex` appends zero placeholders, so the count-only condition never invokes its `ComputeNormals` fallback. The failing baseline is retained outside the repository. The approved correction tracks missing normals alongside newly cached vertices, computes topology normals, and restores every explicitly supplied vector unchanged, including non-unit and intentional zero vectors. Regressions cover all-missing, mixed, all-supplied, shared cached vertices, and degenerate geometry. For degenerate geometry, the test checks the existing `ComputeNormals` UnitY fallback, not an invented replacement. The corrected focused suite initially passed all eight checks. No performance improvement is claimed.
