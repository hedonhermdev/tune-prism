# Stem split
Split a song to it's stems, all offline at zero server cost.

# Steps to run
## Tensorflow setup
You need to setup tensorflow for this. The following steps work on Apple Silicon devices (you need homebrew).
1. Run `brew install libtensorflow`
2. Run `brew install pkg-config`
3. Run `export PKG_CONFIG_PATH=/opt/homebrew/lib/pkgconfig/`

## Running in dev mode
Just run `npm run tauri dev` from the root of the project. Drag an mp3 file into the window to start using. Hehe.