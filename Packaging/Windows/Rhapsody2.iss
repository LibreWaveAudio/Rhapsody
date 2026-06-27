#define AppPublisher "Libre Wave"
#define AppURL "https://www.LibreWave.com/Rhapsody"
#define AppId "{6901999E-1922-4C05-8BB8-A2F55E6C41692}" ; Generate this from the Tools menu or supply your own

[Setup]
AppId={{#AppId}
AppName={#AppName}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
SetupIconFile=Icon.ico
DefaultDirName={autopf}\{#AppPublisher}
SourceDir=payload
OutputDir=../
DisableDirPage=yes
UninstallDisplayIcon={app}\{#AppName}.exe
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
DisableProgramGroupPage=yes
LicenseFile=License.txt
OutputBaseFilename={#AppName} Installer {#AppVersion}
SolidCompression=yes
WizardStyle=modern dynamic

[Types]
Name: "full"; Description: "Full installation"
Name: "custom"; Description: "Custom installation"; Flags: iscustom

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Components]
Name: "standalone"; Description: "{#AppName} Standalone Application"; Types: full custom;
Name: "vst3"; Description: "{#AppName} 64-bit VST3i Plugin"; Types: full custom;
Name: "aax"; Description: "{#AppName} AAX Plugin"; Types: full custom;

[Files]
; Binaries
Source: "{#AppName}.exe"; DestDir: "{app}"; Flags: ignoreversion; Components: standalone;
Source: "{#AppName}.vst3"; DestDir: "{autocf}\VST3"; Flags: ignoreversion; Components: vst3;
Source: "{#AppName}.aaxplugin\*"; DestDir: "{autocf}\Avid\Audio\Plug-Ins\{#AppName}.aaxplugin"; Flags: ignoreversion recursesubdirs createallsubdirs; Components: aax;

; Icon and License
Source: "Icon.ico"; DestDir: "{app}"; Flags: ignoreversion;
Source: "License.txt"; DestDir: "{app}"; Flags: ignoreversion; Components: standalone;

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppName}.exe"; IconFilename: "{app}\Icon.ico";
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppName}.exe"; Tasks: desktopicon

