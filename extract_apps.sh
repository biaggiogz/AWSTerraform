#!/bin/bash

# Extract all installed applications for Ubuntu migration
echo "Extracting installed applications..."

# Create output directory
mkdir -p app_backup

# 1. APT packages (system packages)
echo "Extracting APT packages..."
dpkg --get-selections > app_backup/apt_packages.txt

# 2. Snap packages
echo "Extracting Snap packages..."
snap list > app_backup/snap_packages.txt 2>/dev/null || echo "No snap packages found" > app_backup/snap_packages.txt

# 3. Flatpak packages
echo "Extracting Flatpak packages..."
flatpak list > app_backup/flatpak_packages.txt 2>/dev/null || echo "No flatpak packages found" > app_backup/flatpak_packages.txt

# 4. PIP packages (Python)
echo "Extracting Python packages..."
pip list > app_backup/pip_packages.txt 2>/dev/null || echo "No pip packages found" > app_backup/pip_packages.txt

# 5. NPM packages (Node.js global)
echo "Extracting NPM global packages..."
npm list -g --depth=0 > app_backup/npm_packages.txt 2>/dev/null || echo "No npm packages found" > app_backup/npm_packages.txt

echo "Extraction complete! Check the app_backup folder."