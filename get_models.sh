#!/bin/bash
set -euxo pipefail
nix build .#stemsplit-models
rm -rf src-tauri/models/
cp -r ./result/models/ src-tauri/models
# chmod 644 src-tauri/models/*
# chmod 755 src-tauri/models
