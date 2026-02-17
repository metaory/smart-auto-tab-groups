#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
for s in 16 32 48 128; do
  rsvg-convert -w "$s" -h "$s" logo.svg -o "assets/icons/icon-$s.png"
done
