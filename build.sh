#!/usr/bin/env bash

set -euxo pipefail

nix build .#stemsplit-dmg

./result/target/release/bundle/dmg/bundle_dmg.sh stem-split.dmg ./result/target/release/bundle/macos/stem-split.app/
