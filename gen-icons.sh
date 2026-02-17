#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
for s in 16 32 48 128; do
  rsvg-convert -w "$s" -h "$s" assets/logo.svg -o "assets/icons/icon-$s.png"
done
rsvg-convert -w 640 -h 320 assets/banner.svg -o "assets/banner.png"
