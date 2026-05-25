#!/bin/bash

BUILD_HISE=$1
BUILD_PROJECT=$2
BUILD_INSTALLER=$3

PROJECT_NAME="Rhapsody"
SCRIPT_DIR="$(dirname "${BASH_SOURCE[0]}")"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR=$SCRIPT_DIR/$PROJECT_NAME
PAYLOAD_DIR=$SCRIPT_DIR/payload
HISE_SOURCE=$PARENT_DIR/HISE
HISE_PATH=$HISE_SOURCE"/projects/standalone/Builds/LinuxMakefile/build/HISE"
PROJUCER_PATH=$HISE_SOURCE"/JUCE/extras/Projucer/Builds/LinuxMakefile/build/Projucer"

# Download HISE
if [ "$BUILD_HISE" -eq 1 ]; then
	cd $PARENT_DIR
	rm -R -f HISE
	git clone --branch master --recurse-submodules https://github.com/davidhealey/HISE.git
	cd $HISE_SOURCE

	# Extract SDKs
	unzip $HISE_SOURCE/tools/SDK/sdk.zip -d $HISE_SOURCE/tools/SDK

	# Build HISE
	$PROJUCER_PATH --resave $HISE_SOURCE/projects/standalone/HISE\ Standalone.jucer
	cd $HISE_SOURCE/projects/standalone/Builds/LinuxMakefile
	make CONFIG=Release -j`nproc --ignore=2`
fi

# Download Project
if [ "$BUILD_PROJECT" -eq 1 ]; then
	cd $SCRIPT_DIR
	rm -R -f $PROJECT_NAME
	git clone --recurse-submodules https://codeberg.org/LibreWave/$PROJECT_NAME.git
fi

# Build Project
PROJECT_VERSION=$(grep "<Version" "$PROJECT_DIR/project_info.xml" | cut -d'"' -f2)

if [ "$BUILD_PROJECT" -eq 1 ]; then
	# Create PAYLOAD_DIR directories
	rm -R -f $PAYLOAD_DIR/vst3
	mkdir $PAYLOAD_DIR/vst3

	rm -R -f $PAYLOAD_DIR/standalone
	mkdir $PAYLOAD_DIR/standalone

	# Build the binaries
	"$HISE_PATH" set_hise_folder -p:"$HISE_SOURCE"
	"$HISE_PATH" set_project_folder -p:"$PROJECT_DIR"

	# Create and enter binaries directory
	mkdir -p "$PROJECT_DIR/Binaries"
	cd "$PROJECT_DIR/Binaries"

	echo Building the standalone app
	"$HISE_PATH" export_ci "XmlPresetBackups/$PROJECT_NAME.xml" -t:standalone -a:x64 -p:""
	sh "./batchCompileLinux.sh"
	cp "./Builds/LinuxMakefile/build/$PROJECT_NAME" "$PAYLOAD_DIR/standalone"

	echo Building the plugin
	"$HISE_PATH" export_ci "XmlPresetBackups/$PROJECT_NAME.xml" -t:instrument -p:VST3 -a:x64
	sh "./batchCompileLinux.sh"
	cp -R "./Builds/LinuxMakefile/build/$PROJECT_NAME.vst3" "$PAYLOAD_DIR/vst3"
fi

if [ "$BUILD_INSTALLER" -eq 1 ]; then

	ARCHIVE_NAME="${PRODUCT_NAME}-${PROJECT_VERSION}-installer.run"

	echo
	echo "Building installer: $ARCHIVE_NAME"
	echo

	rm "$PAYLOAD_DIR/$PROJECT_NAME $PROJECT_VERSION.run"
	
	makeself --license "$PAYLOAD_DIR/License.txt" "$PAYLOAD_DIR" "$ARCHIVE_NAME" "$PRODUCT_NAME" ./installer.sh
fi
