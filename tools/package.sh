#!/bin/sh
# Packs extension/ into dist/tab-overview.zip, the download attached to each GitHub
# release. The files sit at the top level of the zip (no enclosing folder), so
# unzipping it on macOS or Windows gives one tab-overview folder that Chrome's
# "Load unpacked" accepts as it is.
#
#   tools/package.sh
set -eu

root=$(cd "$(dirname "$0")/.." && pwd)
out="$root/dist/tab-overview.zip"
version=$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$root/extension/manifest.json")

mkdir -p "$root/dist"
rm -f "$out"
cd "$root/extension"
zip -q -r -X "$out" . -x '.*' '*/.*'
echo "dist/tab-overview.zip: Tab Overview $version, $(wc -c < "$out" | tr -d ' ') bytes"
