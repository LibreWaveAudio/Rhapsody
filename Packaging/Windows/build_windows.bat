@echo off

set BUILD_HISE=%1
set BUILD_PROJECT=%2
set BUILD_INSTALLER=%3
set CODESIGN=%4

set PROJECT_NAME=Rhapsody
set SCRIPT_DIR=%~dp0
for %%i in ("%SCRIPT_DIR%\..\..") do set PROJECT_DIR=%%~fi
for %%i in ("%PROJECT_DIR%\..") do set PARENT_DIR=%%~fi
set PAYLOAD_DIR=%SCRIPT_DIR%payload
set HISE_SOURCE=%PARENT_DIR%\HISE
set HISE_PATH=%HISE_SOURCE%\projects\standalone\Builds\VisualStudio2026\x64\Release\App\HISE.exe
set PROJUCER_PATH=%HISE_SOURCE%\JUCE\projucer\Projucer.exe
set AAX_GUID=2B367510-55DC-11EF-A821-00505692C25A

if %BUILD_HISE%==1 (
  echo Downloading HISE
  cd %PARENT_DIR%
  if exist HISE rd /q /s HISE
  git clone --branch master --recurse-submodules https://github.com/davidhealey/HISE.git
  
  echo Extracting SDKs
  cd "%HISE_SOURCE%\tools\SDK"
  tar -xf "%HISE_SOURCE%\tools\SDK\sdk.zip"

  xcopy %PARENT_DIR%\aax-sdk %HISE_SOURCE%\tools\SDK\AAX /E /I /Y

  echo Building HISE
  %PROJUCER_PATH% --resave "%HISE_SOURCE%\projects\standalone\HISE Standalone.jucer"
  MSBuild.exe "%HISE_SOURCE%\projects\standalone\Builds\VisualStudio2026\HISE Standalone.sln" /p:Configuration=Release /p:Platform=x64 /p:PreferredToolArchitecture=x64 /verbosity:minimal
)

REM Get project version
FOR /f delims^=^"^ tokens^=2 %%a IN ('findstr "Version" "%PROJECT_DIR%\project_info.xml"') DO (set PROJECT_VERSION=%%a)

if %BUILD_PROJECT%==1 (

  cd %PROJECT_DIR%
  git pull

  REM Clean payload directory
  for %%i in ("%PAYLOAD_DIR%\*.vst3" "%PAYLOAD_DIR%\*.aaxplugin" "%PAYLOAD_DIR%\%PROJECT_NAME%.exe") do (
      if exist "%%i\" (
          rmdir /s /q "%%i"
      ) else (
          del /q "%%i"
      )
  )

  echo Building project
  %HISE_PATH% set_hise_folder -p:%HISE_SOURCE%
  %HISE_PATH% set_project_folder -p:%PROJECT_DIR%
  %HISE_PATH% clean -p:%PROJECT_DIR% --all
  
  echo Exporting "%PROJECT_NAME%" Standalone
  %HISE_PATH% export_ci "%PROJECT_DIR%\XmlPresetBackups\%PROJECT_NAME%.xml" -t:standalone -a:x64 -p:""
  call %PROJECT_DIR%\Binaries\batchCompile.bat

  echo Exporting "%PROJECT_NAME%" Plugin
  %HISE_PATH% export_ci "%PROJECT_DIR%\XmlPresetBackups\%PROJECT_NAME%.xml" -t:instrument -p:ALL -a:x64
  call %PROJECT_DIR%\Binaries\batchCompile.bat

  echo Copying files
  xcopy /E /Y "%PROJECT_DIR%\Binaries\Compiled\App\*.exe*" "%PAYLOAD_DIR%"
  xcopy /E /Y "%PROJECT_DIR%\Binaries\Compiled\VST3\*.vst3*" "%PAYLOAD_DIR%"
  xcopy /E /Y "%PROJECT_DIR%\Binaries\Compiled\AAX\*.aaxplugin*" "%PAYLOAD_DIR%"
)

if %CODESIGN%==1 (
  echo Signing standalone
  signtool.exe sign /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /a "%PAYLOAD_DIR%\%PROJECT_NAME%.exe"

  echo Signing AAX
  wraptool sign --verbose --account "%AAX_ACCOUNT_NAME%" --signid "%AAX_SIGN_ID%" --wcguid "%AAX_GUID%" --signtool "%SIGNTOOL%" --in "%PAYLOAD_DIR%\%PROJECT_NAME%.aaxplugin" --out "%PAYLOAD_DIR%\%PROJECT_NAME%.aaxplugin" --extrasigningoptions "digest_sha256"
)

if %BUILD_INSTALLER%==1 (
  echo Building installer

  ISCC.exe /dAppName="%PROJECT_NAME%" /dAppVersion="%PROJECT_VERSION%" "%SCRIPT_DIR%%PROJECT_NAME%.iss"
  
  if %CODESIGN%==1 (
    echo Signing Installer
    signtool.exe sign /tr http://timestamp.sectigo.com /td sha256 /fd sha256 /a "%SCRIPT_DIR%%PROJECT_NAME% Installer %PROJECT_VERSION%.exe"
  )
)
pause
