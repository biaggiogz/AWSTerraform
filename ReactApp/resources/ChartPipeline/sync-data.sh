#!/bin/bash
set -e

# Script to sync data from /data to /public/data
SOURCE_DIR="data"
TARGET_DIR="public/data"

echo "Syncing data from $SOURCE_DIR to $TARGET_DIR..."

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Sync all files from source to target
rsync -av --delete "$SOURCE_DIR/" "$TARGET_DIR/"

echo "Data sync completed successfully!"
echo "Files synced:"
ls -la "$TARGET_DIR"