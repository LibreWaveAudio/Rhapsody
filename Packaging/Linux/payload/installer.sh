#!/bin/bash

COMPANY_NAME="Libre Wave"
PROJECT_NAME="Rhapsody"
INSTALL_DATA=false

# Check available plugin formats
HAS_VST3=false
HAS_LV2=false
HAS_CLAP=false

[ -d "vst3" ] && HAS_VST3=true
[ -d "lv2" ]  && HAS_LV2=true
[ -d "clap" ] && HAS_CLAP=true

# Install plugins
if $HAS_VST3; then
    read -r -p "Would you like to install the VST3 plugin(s)? [y/N] " INSTALL_VST3

    if [[ "$INSTALL_VST3" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        mkdir -p "$HOME/.vst3"
        cp -a vst3/* "$HOME/.vst3/"
        INSTALL_DATA=true
    else
        echo "The VST3 plugin(s) will not be installed."
    fi
fi

if $HAS_LV2; then
    read -r -p "Would you like to install the LV2 plugin(s)? [y/N] " INSTALL_LV2

    if [[ "$INSTALL_LV2" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        mkdir -p "$HOME/.lv2"
        cp -a lv2/* "$HOME/.lv2/"
        INSTALL_DATA=true
    else
        echo "The LV2 plugin(s) will not be installed."
    fi
fi

if $HAS_CLAP; then
    read -r -p "Would you like to install the CLAP plugin(s)? [y/N] " INSTALL_CLAP

    if [[ "$INSTALL_CLAP" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        mkdir -p "$HOME/.clap"
        cp -a clap/* "$HOME/.clap/"
        INSTALL_DATA=true
    else
        echo "The CLAP plugin(s) will not be installed."
    fi
fi

# Standalone
HAS_STANDALONE=false
[ -d "standalone" ] && HAS_STANDALONE=true

if $HAS_STANDALONE; then
    read -r -p "Would you like to install the standalone application(s)? [y/N] " INSTALL_STANDALONE

    if [[ "$INSTALL_STANDALONE" =~ ^([yY][eE][sS]|[yY])$ ]]; then

        INSTALL_DATA=true

        # Install standalone application
        STANDALONE_PATH="$HOME/.local/bin"

        mkdir -p "$STANDALONE_PATH"
        cp -i "standalone/$PROJECT_NAME" "$STANDALONE_PATH/"

        # Desktop integration
        read -r -p "Would you like to add a shortcut to the standalone application in your desktop menu? [y/N] " INSTALL_DESKTOP

        if [[ "$INSTALL_DESKTOP" =~ ^([yY][eE][sS]|[yY])$ ]]; then

            LOCAL_SHARE="$HOME/.local/share"
            ICONS_BASE="$LOCAL_SHARE/icons/hicolor"
            APPLICATIONS_BASE="$LOCAL_SHARE/applications"
            ICON_NAME="$(printf '%s' "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')"
            EXEC_PATH="$STANDALONE_PATH/$PROJECT_NAME"

            # Install SVG icon
            mkdir -p "$ICONS_BASE/scalable/apps"
            cp "icons/icon.svg" \
                "$ICONS_BASE/scalable/apps/$ICON_NAME.svg"

            # Install PNG icons
            for size in 16 32 48 64 128 256; do
                mkdir -p "$ICONS_BASE/${size}x${size}/apps"
                cp "icons/${size}.png" \
                    "$ICONS_BASE/${size}x${size}/apps/$ICON_NAME.png"
            done

            # Create desktop entry
            mkdir -p "$APPLICATIONS_BASE"

            cat > "$APPLICATIONS_BASE/$ICON_NAME.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=$PROJECT_NAME
Comment=$PROJECT_NAME Standalone
Exec=$EXEC_PATH
Icon=$ICON_NAME
Categories=AudioVideo;Audio;Music;
Terminal=false
EOF

            echo "Desktop integration complete."
        else
            echo "Desktop integration will not be included."
        fi

    else
        echo "The standalone application(s) will not be installed."
    fi
fi

CONFIG_ROOT="$HOME/.config/$COMPANY_NAME/$PROJECT_NAME"

if $INSTALL_DATA && [ -d "data" ]; then
    mkdir -p "$CONFIG_ROOT"
    cp -a data/. "$CONFIG_ROOT/"
fi

echo
echo "Installation complete."