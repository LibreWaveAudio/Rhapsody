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

        echo "Please enter the installation directory for the standalone application:"
        read -r STANDALONE_PATH

        until [ -d "$STANDALONE_PATH" ]; do
            echo "That directory does not exist. Please enter a valid directory:"
            read -r STANDALONE_PATH
        done

        # Remove any trailing slash
        STANDALONE_PATH="${STANDALONE_PATH%/}"

        cp -i "standalone/$PROJECT_NAME" "$STANDALONE_PATH"

        read -r -p "Would you like to add a shortcut to the standalone application in your desktop menu? [y/N] " INSTALL_DESKTOP

        if [[ "$INSTALL_DESKTOP" =~ ^([yY][eE][sS]|[yY])$ ]]; then

            ICONS_BASE="/usr/share/icons/hicolor"
            ICON_NAME="$(printf '%s' "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')"

            # Install SVG icon
            sudo mkdir -p "$ICONS_BASE/scalable/apps"
            sudo cp "icons/icon.svg" \
                "$ICONS_BASE/scalable/apps/$ICON_NAME.svg"

            # Install PNG icons
            for size in 16 32 48 64 128 256; do
                sudo mkdir -p "$ICONS_BASE/${size}x${size}/apps"
                sudo cp "icons/${size}.png" \
                    "$ICONS_BASE/${size}x${size}/apps/$ICON_NAME.png"
            done

            # Ensure icons are readable
            sudo chmod 644 /usr/share/icons/hicolor/*/apps/$ICON_NAME.*

            # Create desktop entry
            sudo tee "/usr/share/applications/$ICON_NAME.desktop" >/dev/null <<EOF
[Desktop Entry]
Type=Application
Name=$PROJECT_NAME
Comment=$PROJECT_NAME Standalone
Exec=$STANDALONE_PATH/$PROJECT_NAME
Icon=$ICON_NAME
Categories=AudioVideo;Audio;Music;
Terminal=false
EOF

            sudo chmod 644 "/usr/share/applications/$ICON_NAME.desktop"
            sudo gtk-update-icon-cache /usr/share/icons/hicolor

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