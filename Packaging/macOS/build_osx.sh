#!/bin/bash

BUILD_HISE=$1
BUILD_PROJECT=$2
BUILD_INSTALLER=$3
CODESIGN=$4
NOTARIZE=$5

PROJECT_NAME="Rhapsody"
BUNDLE_ID='com.'${PROJECT_NAME// /}'.pkg'
AAX_GUID=2B367510-55DC-11EF-A821-00505692C25A
PROJECT_DIR="$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PAYLOAD_DIR=$SCRIPT_DIR/payload
HISE_SOURCE="$(dirname "$PROJECT_DIR")"/HISE
HISE_PATH=$HISE_SOURCE"/projects/standalone/Builds/MacOSX/build/Release/HISE.app/Contents/MacOS/HISE"
PROJUCER_PATH=$HISE_SOURCE"/JUCE/projucer/Projucer.app/Contents/MacOS/Projucer"
PACKAGES="/usr/local/bin/packagesbuild"
TEAM_ID_FOR_NOTARIZATION="${TEAM_ID##*(}"; TEAM_ID_FOR_NOTARIZATION="${TEAM_ID_FOR_NOTARIZATION%)}"

# Download HISE
if (( BUILD_HISE == 1 )); then
  echo Building HISE

  cd "$(dirname "$PROJECT_DIR")"
	rm -R -f HISE
	git clone --branch master --recurse-submodules https://github.com/davidhealey/HISE.git

  # Copy AAX SDK to HISE source
  cp -Rf aax-sdk $HISE_SOURCE/tools/SDK/AAX

	cd "$HISE_SOURCE"

  # Extract SDKs
  unzip $HISE_SOURCE/tools/SDK/sdk.zip -d $HISE_SOURCE/tools/SDK

  # Build HISE
  $PROJUCER_PATH --resave $HISE_SOURCE/projects/standalone/HISE\ Standalone.jucer
  cd $HISE_SOURCE/projects/standalone/Builds/MacOSX
  xcodebuild -project "HISE Standalone.xcodeproj" -configuration Release -jobs 6 | xcpretty
fi

# Build Project
PROJECT_VERSION=$(grep "<Version" "$PROJECT_DIR/project_info.xml" | cut -d'"' -f2)

if (( BUILD_PROJECT == 1 )); then
	
  cd $PROJECT_DIR 
  git pull
  
  # Create PAYLOAD_DIR directory
	rm -R -f "$PAYLOAD_DIR"
	mkdir "$PAYLOAD_DIR"

	# Build the binaries
	"$HISE_PATH" set_hise_folder -p:"$HISE_SOURCE"
	"$HISE_PATH" set_project_folder -p:"$PROJECT_DIR"
  "$HISE_PATH" clean -p:$PROJECT_DIR --all

	# Create and enter binaries directory
	mkdir -p "$PROJECT_DIR/Binaries"
	cd "$PROJECT_DIR/Binaries"
  
	echo Building the standalone app
  "$HISE_PATH" export_ci "XmlPresetBackups/${PROJECT_NAME}.xml" -t:standalone -p:""
  chmod +x ./batchCompileOSX
  sh ./batchCompileOSX
  cp -R "./Compiled/$PROJECT_NAME.app" "$PAYLOAD_DIR/${PROJECT_NAME}.app"

	echo Building the plugin
  "$HISE_PATH" export_ci "XmlPresetBackups/${PROJECT_NAME}.xml" -t:instrument -p:ALL
  chmod +x ./batchCompileOSX
	sh ./batchCompileOSX
  cp -R "./Builds/MacOSX/build/Release/${PROJECT_NAME}.vst3" "$PAYLOAD_DIR/${PROJECT_NAME}.vst3"
  cp -R "./Builds/MacOSX/build/Release/${PROJECT_NAME}.component" "$PAYLOAD_DIR/${PROJECT_NAME}.component"
  cp -R "./Builds/MacOSX/build/Release/${PROJECT_NAME}.aaxplugin" "$PAYLOAD_DIR/${PROJECT_NAME}.aaxplugin"
fi

if (( CODESIGN == 1 )); then
  echo Codesigning standalone
  codesign --remove-signature "$PAYLOAD_DIR/${PROJECT_NAME}.app"
  codesign --deep --force --options runtime --sign "Developer ID Application: $TEAM_ID" "$PAYLOAD_DIR/${PROJECT_NAME}.app"
  
  echo Codesigning VST and AU
  codesign --remove-signature "$PAYLOAD_DIR/${PROJECT_NAME}.vst3"
  codesign --remove-signature "$PAYLOAD_DIR/${PROJECT_NAME}.component"
  codesign -s "Developer ID Application: $TEAM_ID" "$PAYLOAD_DIR/${PROJECT_NAME}.vst3" --timestamp
  codesign -s "Developer ID Application: $TEAM_ID" "$PAYLOAD_DIR/${PROJECT_NAME}.component" --timestamp
  
  echo Codesigning AAX
  codesign --remove-signature "$PAYLOAD_DIR/${PROJECT_NAME}.aaxplugin"  
  $WRAPTOOL sign --verbose --account $AAX_ACCOUNT_NAME --signid "Developer ID Application: $TEAM_ID" --wcguid $AAX_GUID --in "$PAYLOAD_DIR/${PROJECT_NAME}.aaxplugin" --out "$PAYLOAD_DIR/${PROJECT_NAME}.aaxplugin" --dsig1-compat off
fi

if (( BUILD_INSTALLER == 1 )); then
  echo Build Installer
  
  cp "$SCRIPT_DIR/License.txt" "$PAYLOAD_DIR/License.txt"
  
  cp "$SCRIPT_DIR/${PROJECT_NAME}_Template.pkgproj" "$SCRIPT_DIR/${PROJECT_NAME}.pkgproj"  
  pkgproj="$SCRIPT_DIR/${PROJECT_NAME}.pkgproj"  
  sed -i '' "s/%VERSION%/$PROJECT_VERSION/g" $pkgproj
  
  $PACKAGES $pkgproj
  
  productsign --sign "Developer ID Installer: $TEAM_ID" "$SCRIPT_DIR/build/${PROJECT_NAME}.pkg" "$SCRIPT_DIR/build/${PROJECT_NAME}_signed.pkg"
  cp -R "$SCRIPT_DIR/build/${PROJECT_NAME}_signed.pkg" "$SCRIPT_DIR/${PROJECT_NAME} Installer ${PROJECT_VERSION}.pkg"
  
  echo Installer Cleanup
  rm -rf "$SCRIPT_DIR/build"
  rm $pkgproj
fi

if (( NOTARIZE == 1 )); then
  echo Notarizing
  
  response=$(xcrun notarytool submit --apple-id "$APPLE_ID" --password "$APP_SPECIFIC_PASSWORD" --team-id "$TEAM_ID_FOR_NOTARIZATION" "$SCRIPT_DIR/${PROJECT_NAME} Installer ${PROJECT_VERSION}.pkg" --wait);

  # Get notarization ID
  job_id_line=$(grep -m 1 '  id:' < <(echo -e "${response}"))
  job_id=$(echo "${job_id_line}" | cut -d ":" -s -f 2 | cut -d " " -f 2)

  # Get the notarization status from the response
  status_line=$(grep -m 1 '  status:' < <(echo -e "${response}"))
  status_result=$(echo "${status_line}" | cut -d ":" -s -f 2 | cut -d " " -f 2)

  echo "${response}"

  if [[ ${status_result} != "Accepted" ]]; then
    exit 1
  fi
  
  # Staple the notarization result
  echo Stapling
  success=$(xcrun stapler staple "$SCRIPT_DIR/${PROJECT_NAME} Installer ${PROJECT_VERSION}.pkg")
  if [[ -z "${success}" ]]; then
    echo "[ERROR] Could not staple notarization to app"
    exit 1
  fi

  # Confirm stapling
  echo "Checking notarization to ${PROJECT_NAME} Installer ${PROJECT_VERSION}.pkg "
  spctl --assess -vvv --type install "$SCRIPT_DIR/${PROJECT_NAME} Installer ${PROJECT_VERSION}.pkg"
fi
