Done: inspected the standalone Core project at revision 77face0d2bc68e84ef74f4fa59a90dfb89bf44de. The new harness will reference that unchanged net8.0 project and its SharpGLTF.Core 1.0.6 dependency directly. No WinUI project, renderer, device, or installed configuration will execute.

Measured: the new harness builds with zero warnings/errors. Baseline 17 cases: 16 PASS / 1 FAIL, 162.2837 ms summed test elapsed, 171.875 ms process CPU, 41357312 B peak working set; watchdog 2.0 seconds, exit 1. The OBJ triangle without vn imports with zero normals because placeholders satisfy the count-only fallback condition. All other planned finite cases passed. Evidence is in LOCALAPPDATA/hamtk/audit-workers/directx-contracts-20261024/baseline-77face0d2bc6.json. Raw failure and build outputs are retained.

Done: parent approved the exact ObjLoader correction. Missing-normal flags are stored per new cached vertex; generated topology normals fill missing entries while explicit vectors, including zeros, remain unchanged. The focused eight-check suite passes after a non-incremental build. Added preservation, shared-cache and degenerate UnitY fallback regressions. No other production source changed and no performance improvement is claimed.

Next: path-limited commit, fresh non-incremental rebuild, focused and full postcommit measured runs, and source/binary-bound manifest. Parent owns main-ledger integration and independent review.

Blockers: none identified. MSZIP, binary X, HXX, UI rendering and complete import/export interoperability remain unqualified without independent fixtures.
