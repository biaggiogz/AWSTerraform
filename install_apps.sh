#!/bin/bash

# Install applications on new Ubuntu system
echo "Installing applications from backup..."

# 1. Install APT packages
if [ -f "app_backup/apt_packages.txt" ]; then
    echo "Installing APT packages..."
    sudo dpkg --set-selections < app_backup/apt_packages.txt
    sudo apt-get dselect-upgrade -y
fi

# 2. Install Snap packages
if [ -f "app_backup/snap_packages.txt" ]; then
    echo "Installing Snap packages..."
    while read -r line; do
        if [[ $line != "Name"* ]] && [[ $line != "-"* ]] && [[ ! -z "$line" ]]; then
            app=$(echo $line | awk '{print $1}')
            if [[ $app != "core"* ]] && [[ $app != "snapd" ]]; then
                sudo snap install $app
            fi
        fi
    done < app_backup/snap_packages.txt
fi

# 3. Install Flatpak packages
if [ -f "app_backup/flatpak_packages.txt" ]; then
    echo "Installing Flatpak packages..."
    while read -r line; do
        if [[ $line == *"/"* ]]; then
            app=$(echo $line | awk '{print $1}')
            flatpak install -y $app
        fi
    done < app_backup/flatpak_packages.txt
fi

echo "Installation complete!"