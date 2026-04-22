#!/bin/bash
# Builds a clean WordPress-ready zip from suite-e-wordpress-theme/
# Usage: ./build-wp-theme.sh

set -e

THEME_DIR="suite-e-wordpress-theme"
ZIP_NAME="suite-e-wordpress-theme.zip"

# Remove old zip if it exists
rm -f "$ZIP_NAME"

# Build zip using zip CLI (avoids macOS __MACOSX metadata that Compress creates)
zip -r "$ZIP_NAME" "$THEME_DIR/" \
  --exclude "*.DS_Store" \
  --exclude "__MACOSX/*" \
  --exclude "*.git*"

echo "✓ Built $ZIP_NAME ($(du -sh "$ZIP_NAME" | cut -f1))"
echo ""
echo "Upload steps:"
echo "  1. WP Admin → Appearance → Themes → Add New → Upload Theme"
echo "  2. Choose $ZIP_NAME → Install Now → Activate"
echo "  3. Site Editor → Templates → Front Page → ⋮ → Clear customizations"
echo "     (skip step 3 if this is a first install)"
