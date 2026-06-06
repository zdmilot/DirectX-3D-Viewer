; ============================================================================
;  DirectX 3D Viewer - Inno Setup installer script
;
;  Build with Inno Setup 6 (https://jrsoftware.org/isinfo.php):
;      iscc DirectX3DViewer.iss
;
;  By default this compiles against a Release, self-contained publish output
;  at ..\src\DirectX3DViewer.App\bin\x64\publish. Override the publish folder
;  on the command line if needed:
;      iscc /DPublishDir="C:\path\to\publish" DirectX3DViewer.iss
;
;  The helper script build_installer.ps1 publishes the app and runs iscc for
;  you in one step.
; ============================================================================

#define AppName "DirectX 3D Viewer"
#define AppVersion "1.0.0"
#define AppPublisher "Zachary Milot"
#define AppExeName "DirectX3DViewer.exe"
#define AppId "{{8F3C5A21-7B4E-4D6A-9C2F-1E0B7A9D4C58}"

#ifndef PublishDir
  #define PublishDir "..\src\DirectX3DViewer.App\bin\x64\publish"
#endif

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoProductName={#AppName}
VersionInfoDescription={#AppName} Setup

DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
UninstallDisplayName={#AppName}
UninstallDisplayIcon={app}\{#AppExeName}

; Install per-machine into Program Files and write associations to HKLM.
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Output
OutputDir=Output
OutputBaseFilename=DirectX3DViewer-{#AppVersion}-Setup
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ChangesAssociations=yes

; Re-running setup acts as an "edit associations" tool: previous task choices
; (incl. each file association) are restored on the Tasks page so the user can
; tick/untick them. Unticking actually removes the association (see [Code]).
UsePreviousTasks=yes

; Branding - matches the app's navy/teal visual identity.
SetupIconFile=..\src\DirectX3DViewer.App\Assets\icon.ico
WizardImageFile=wizard-large.bmp,wizard-large-192x386.bmp,wizard-large-246x494.bmp,wizard-large-273x556.bmp,wizard-large-328x628.bmp
WizardSmallImageFile=wizard-small.bmp,wizard-small-64x68.bmp,wizard-small-83x86.bmp,wizard-small-92x97.bmp,wizard-small-110x116.bmp
WizardImageStretch=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
; Desktop shortcut (asked during setup).
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

; File associations - one independent checkbox per supported format. These can
; be changed later by simply running this installer again (it restores the
; current choices, and unticking removes an association).
Name: "assoc_x";   Description: "Associate &.x DirectX model files";   GroupDescription: "Associate file types with {#AppName} (you can re-run setup later to change these):"
Name: "assoc_hxx"; Description: "Associate .&hxx Hamilton model files"; GroupDescription: "Associate file types with {#AppName} (you can re-run setup later to change these):"
Name: "assoc_obj"; Description: "Associate .&obj model files";          GroupDescription: "Associate file types with {#AppName} (you can re-run setup later to change these):"
Name: "assoc_stl"; Description: "Associate .&stl model files";          GroupDescription: "Associate file types with {#AppName} (you can re-run setup later to change these):"

[Files]
; Self-contained publish output (exe + Windows App SDK + runtime + assets).
Source: "{#PublishDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}";        Filename: "{app}\{#AppExeName}"
Name: "{group}\Uninstall {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}";  Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Registry]
; --- App Paths: lets Windows find the exe (Run dialog, ShellExecute) ---
Root: HKA; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#AppExeName}"; ValueType: string; ValueData: "{app}\{#AppExeName}"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Microsoft\Windows\CurrentVersion\App Paths\{#AppExeName}"; ValueName: "Path"; ValueType: string; ValueData: "{app}"

; --- Application registration + supported-types capability ---
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}"; ValueType: string; ValueName: "FriendlyAppName"; ValueData: "{#AppName}"; Flags: uninsdeletekey
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\DefaultIcon"; ValueType: string; ValueData: "{app}\{#AppExeName},0"
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\shell\open\command"; ValueType: string; ValueData: """{app}\{#AppExeName}"" ""%1"""
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\SupportedTypes"; ValueType: string; ValueName: ".x";   ValueData: ""
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\SupportedTypes"; ValueType: string; ValueName: ".hxx"; ValueData: ""
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\SupportedTypes"; ValueType: string; ValueName: ".obj"; ValueData: ""
Root: HKA; Subkey: "Software\Classes\Applications\{#AppExeName}\SupportedTypes"; ValueType: string; ValueName: ".stl"; ValueData: ""

; ====================== .x association ======================
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.x"; ValueType: string; ValueData: "DirectX .x Model"; Flags: uninsdeletekey; Tasks: assoc_x
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.x\DefaultIcon"; ValueType: string; ValueData: "{app}\{#AppExeName},0"; Tasks: assoc_x
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.x\shell\open\command"; ValueType: string; ValueData: """{app}\{#AppExeName}"" ""%1"""; Tasks: assoc_x
Root: HKA; Subkey: "Software\Classes\.x"; ValueType: string; ValueData: "DirectX3DViewer.x"; Flags: uninsdeletevalue; Tasks: assoc_x
Root: HKA; Subkey: "Software\Classes\.x\OpenWithProgids"; ValueType: string; ValueName: "DirectX3DViewer.x"; ValueData: ""; Flags: uninsdeletevalue; Tasks: assoc_x

; ====================== .hxx association ======================
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.hxx"; ValueType: string; ValueData: "Hamilton .hxx Model"; Flags: uninsdeletekey; Tasks: assoc_hxx
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.hxx\DefaultIcon"; ValueType: string; ValueData: "{app}\{#AppExeName},0"; Tasks: assoc_hxx
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.hxx\shell\open\command"; ValueType: string; ValueData: """{app}\{#AppExeName}"" ""%1"""; Tasks: assoc_hxx
Root: HKA; Subkey: "Software\Classes\.hxx"; ValueType: string; ValueData: "DirectX3DViewer.hxx"; Flags: uninsdeletevalue; Tasks: assoc_hxx
Root: HKA; Subkey: "Software\Classes\.hxx\OpenWithProgids"; ValueType: string; ValueName: "DirectX3DViewer.hxx"; ValueData: ""; Flags: uninsdeletevalue; Tasks: assoc_hxx

; ====================== .obj association ======================
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.obj"; ValueType: string; ValueData: "Wavefront .obj Model"; Flags: uninsdeletekey; Tasks: assoc_obj
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.obj\DefaultIcon"; ValueType: string; ValueData: "{app}\{#AppExeName},0"; Tasks: assoc_obj
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.obj\shell\open\command"; ValueType: string; ValueData: """{app}\{#AppExeName}"" ""%1"""; Tasks: assoc_obj
Root: HKA; Subkey: "Software\Classes\.obj"; ValueType: string; ValueData: "DirectX3DViewer.obj"; Flags: uninsdeletevalue; Tasks: assoc_obj
Root: HKA; Subkey: "Software\Classes\.obj\OpenWithProgids"; ValueType: string; ValueName: "DirectX3DViewer.obj"; ValueData: ""; Flags: uninsdeletevalue; Tasks: assoc_obj

; ====================== .stl association ======================
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.stl"; ValueType: string; ValueData: "Stereolithography .stl Model"; Flags: uninsdeletekey; Tasks: assoc_stl
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.stl\DefaultIcon"; ValueType: string; ValueData: "{app}\{#AppExeName},0"; Tasks: assoc_stl
Root: HKA; Subkey: "Software\Classes\DirectX3DViewer.stl\shell\open\command"; ValueType: string; ValueData: """{app}\{#AppExeName}"" ""%1"""; Tasks: assoc_stl
Root: HKA; Subkey: "Software\Classes\.stl"; ValueType: string; ValueData: "DirectX3DViewer.stl"; Flags: uninsdeletevalue; Tasks: assoc_stl
Root: HKA; Subkey: "Software\Classes\.stl\OpenWithProgids"; ValueType: string; ValueName: "DirectX3DViewer.stl"; ValueData: ""; Flags: uninsdeletevalue; Tasks: assoc_stl

[Run]
; Offer to launch the app on the final wizard page (checkbox).
Filename: "{app}\{#AppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(AppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
{ ---------------------------------------------------------------------------
  Association editing support.

  The [Registry] section only *adds* keys for the file types whose task is
  checked. When the user re-runs setup and *unchecks* a previously associated
  type, Inno would otherwise leave the old keys behind. The code below removes
  the association keys for every unticked type so re-running setup behaves like
  a proper "change associations" dialog.
  --------------------------------------------------------------------------- }

function AssocRootKey(): Integer;
begin
  { Mirror the root that the [Registry] HKA entries resolve to: HKLM for an
    admin (per-machine) install, HKCU for a per-user install. }
  if IsAdminInstallMode then
    Result := HKEY_LOCAL_MACHINE
  else
    Result := HKEY_CURRENT_USER;
end;

procedure RemoveAssociation(Ext, ProgId: String);
var
  Root: Integer;
  CurDefault: String;
begin
  Root := AssocRootKey();

  { Drop our entry from the extension's OpenWithProgids list. }
  RegDeleteValue(Root, 'Software\Classes\' + Ext + '\OpenWithProgids', ProgId);

  { Only clear the extension's default handler if it currently points at us,
    so we never disturb an association owned by another application. }
  if RegQueryStringValue(Root, 'Software\Classes\' + Ext, '', CurDefault) and (CurDefault = ProgId) then
    RegDeleteValue(Root, 'Software\Classes\' + Ext, '');

  { Remove our ProgID class definition entirely. }
  RegDeleteKeyIncludingSubkeys(Root, 'Software\Classes\' + ProgId);
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  { Runs after files + [Registry] have been written, so checked types are
    already associated; here we strip the ones the user left unchecked. }
  if CurStep = ssPostInstall then
  begin
    if not WizardIsTaskSelected('assoc_x')   then RemoveAssociation('.x',   'DirectX3DViewer.x');
    if not WizardIsTaskSelected('assoc_hxx') then RemoveAssociation('.hxx', 'DirectX3DViewer.hxx');
    if not WizardIsTaskSelected('assoc_obj') then RemoveAssociation('.obj', 'DirectX3DViewer.obj');
    if not WizardIsTaskSelected('assoc_stl') then RemoveAssociation('.stl', 'DirectX3DViewer.stl');
  end;
end;
