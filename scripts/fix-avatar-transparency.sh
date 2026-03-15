#!/usr/bin/env bash
# Make avatar images that have a black background render with transparency.
# The newer character assets were exported as JPEG (no alpha), so the black
# background is opaque. This script uses ImageMagick to convert black pixels
# to transparent and overwrite the files with proper PNGs.
#
# Requires: ImageMagick (e.g. brew install imagemagick)
# Usage: from repo root: ./scripts/fix-avatar-transparency.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if ! command -v convert &>/dev/null && ! command -v magick &>/dev/null; then
  echo "ImageMagick is required. Install with: brew install imagemagick"
  exit 1
fi
CONVERT=$(command -v convert 2>/dev/null || command -v magick 2>/dev/null)

# Avatars that are JPEG-with-black-bg (new characters). Original roster (cat, fox, etc.) are already RGBA PNGs.
AVATARS="panda orangetabby collie redpanda panther sloth sheep cheetah whiteferret"

for dir in "$REPO_ROOT/apps/landing/avatars" "$REPO_ROOT/apps/desktop/public/avatars"; do
  if [[ ! -d "$dir" ]]; then
    continue
  fi
  for name in $AVATARS; do
    src="$dir/$name.png"
    if [[ ! -f "$src" ]]; then
      continue
    fi
    # Only process if file is actually JPEG (no alpha). Skip already-RGBA PNGs.
    if file "$src" | grep -q "JPEG"; then
      echo "Fixing $src"
      tmp="$dir/${name}.tmp.png"
      $CONVERT "$src" -alpha set -fuzz 10% -transparent black "$tmp" && mv "$tmp" "$src"
    fi
  done
done
echo "Done."
