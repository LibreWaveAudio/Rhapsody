#!/bin/bash

BUILD_HISE=$1
BUILD_PROJECT=$2
BUILD_INSTALLER=$3

PROJECT_NAME="Rhapsody"
PROJECT_DIR="$(dirname "$(dirname "$(dirname "${BASH_SOURCE[0]}")")")"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PAYLOAD_DIR=$SCRIPT_DIR/payload
HISE_SOURCE="$(dirname "$PROJECT_DIR")"/HISE
HISE_PATH=$HISE_SOURCE"/projects/standalone/Builds/LinuxMakefile/build/HISE"
PROJUCER_PATH=$HISE_SOURCE"/JUCE/projucer/Projucer"

# Download HISE
if [ "$BUILD_HISE" -eq 1 ]; then
	cd "$(dirname "$PROJECT_DIR")"
	rm -R -f HISE
	git clone --branch rhapsody2 --recurse-submodules https://github.com/davidhealey/HISE.git
	cd "$HISE_SOURCE"

	# Extract SDKs
	unzip $HISE_SOURCE/tools/SDK/sdk.zip -d $HISE_SOURCE/tools/SDK

	# Build Projucer
	cd $HISE_SOURCE"/JUCE/extras/Projucer/Builds/LinuxMakefile"
	make CONFIG=Debug -j"$(nproc --ignore=2)"
	cp $HISE_SOURCE"/JUCE/extras/Projucer/Builds/LinuxMakefile/build/Projucer" $HISE_SOURCE"/JUCE/projucer"

	# Build HISE
	$PROJUCER_PATH --resave $HISE_SOURCE/projects/standalone/HISE\ Standalone.jucer
	cd $HISE_SOURCE/projects/standalone/Builds/LinuxMakefile
	make CONFIG=Release -j"$(nproc --ignore=2)"
fi

# Build Project
PROJECT_VERSION=$(grep "<Version" "$PROJECT_DIR/project_info.xml" | cut -d'"' -f2)

if [ "$BUILD_PROJECT" -eq 1 ]; then
	
	cd $PROJECT_DIR 
	git pull
	
	# Create PAYLOAD_DIR directories
	rm -R -f "$PAYLOAD_DIR/vst3"
	mkdir "$PAYLOAD_DIR/vst3"

	rm -R -f "$PAYLOAD_DIR/standalone"
	mkdir "$PAYLOAD_DIR/standalone"

	# Build the binaries
	"$HISE_PATH" set_hise_folder -p:"$HISE_SOURCE"
	"$HISE_PATH" set_project_folder -p:"$PROJECT_DIR"

	# Create and enter binaries directory
	mkdir -p "$PROJECT_DIR/Binaries"
	cd "$PROJECT_DIR/Binaries"

	"$HISE_PATH" clean -p:$PROJECT_DIR --all

	echo Building the standalone app
	"$HISE_PATH" export_ci "XmlPresetBackups/${PROJECT_NAME}.xml" -t:standalone -a:x64 -p:""
	sh "./batchCompileLinux.sh"
	cp "./Builds/LinuxMakefile/build/$PROJECT_NAME" "$PAYLOAD_DIR/standalone"

	echo Building the plugin
	"$HISE_PATH" export_ci "XmlPresetBackups/${PROJECT_NAME}.xml" -t:instrument -p:VST3 -a:x64
	sh "./batchCompileLinux.sh"
	cp -R "./Builds/LinuxMakefile/build/${PROJECT_NAME}.vst3" "$PAYLOAD_DIR/vst3"
fi

if [ "$BUILD_INSTALLER" -eq 1 ]; then

	cd "$SCRIPT_DIR"

	ARCHIVE_NAME="${PROJECT_NAME}-Installer-${PROJECT_VERSION}.run"

	echo
	echo "Building installer: $ARCHIVE_NAME"
	echo

	chmod +x "$PAYLOAD_DIR/installer.sh"

	rm -f "$SCRIPT_DIR/$ARCHIVE_NAME"
	
	makeself --license "$PAYLOAD_DIR/License.txt" "$PAYLOAD_DIR" "$ARCHIVE_NAME" "$PROJECT_NAME" ./installer.sh
fi
