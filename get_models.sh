#!/bin/bash
set -euxo pipefail

wget https://pub-20137d58397b4f8f8c86ff1a178685ff.r2.dev/models.zip

rm -rf src-tauri/models/

unzip models.zip -d src-tauri/

rm -rf models.zip
