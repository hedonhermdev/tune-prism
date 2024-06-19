{
  description = "stem-split";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
    crane = {
      url = "github:ipetkov/crane";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    npmPackageSerokell = {
      url = "github:serokell/nix-npm-buildpackage";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay, crane, npmPackageSerokell, ... }:
    let
      supportedSystems = [ "aarch64-darwin" ];
    in
    flake-utils.lib.eachSystem supportedSystems (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ (import rust-overlay) ];
          config = {
            allowUnfree = true;
          };
        };

        lib = pkgs.lib;

        rustNightly = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer-preview" ];
          targets = [ "x86_64-unknown-linux-gnu" ];
        };

        rustPlatform = pkgs.makeRustPlatform {
          inherit (rustNightly) cargo rustc;
        };

        craneLib = (crane.mkLib pkgs).overrideToolchain rustNightly;

        libtorch = pkgs.callPackage (import ./nix/torch-bin.nix) { };

        tauriConfFilter = path: _type: builtins.match ".*tauri\.conf\.json$" path != null;
        othersFilter = path: _type: builtins.match ".*(json|ico|icns|png|toml)$" path != null;
        srcFilter = path: type: (craneLib.filterCargoSources path type) || (tauriConfFilter path type) || (othersFilter path type);

        cargoVendorDir = craneLib.vendorCargoDeps {
          src = craneLib.cleanCargoSource (craneLib.path ./src-tauri);
        };

        npmPackage = pkgs.callPackage npmPackageSerokell { };

        stemsplit-bin = craneLib.buildPackage {
          src = lib.cleanSourceWith {
            src = craneLib.path ./src-tauri; # The original, unfiltered source
            filter = srcFilter;
          };

          doInstallCargoArtifacts = true;
          cargoExtraArgs = "--config target.aarch64-apple-darwin.linker=\\'c++\\'";

          LIBTORCH = "${libtorch}";
          DYLD_LIBRARY_PATH = "${libtorch}/lib";

          nativeBuildInputs = with pkgs; [
            rustNightly
            llvmPackages.libcxxStdenv
            curl
            protobuf
            fftw
            nodejs
            pkg-config
            cmake
            fftw
          ];

          buildInputs = pkgs.lib.optionals pkgs.stdenv.isDarwin
            (with pkgs; [
              darwin.libobjc
            ]) ++ (with pkgs.darwin.apple_sdk.frameworks; [
            Carbon
            AudioUnit
            WebKit
          ]);
        };

        stemsplit-models = pkgs.stdenv.mkDerivation {
          name = "stemsplit-models";
          src = pkgs.fetchzip {
            url = "https://pub-20137d58397b4f8f8c86ff1a178685ff.r2.dev/models.zip";
            hash = "sha256-xxOUkxHCNLjFKvsp6KphQ6AC1fghk4/AdkwRuxPJGrs=";
            stripRoot = false;
          };

          installPhase = ''
            cp -r $src $out
          '';

        };


        stemsplit-dmg = npmPackage.buildNpmPackage {
          src = lib.cleanSource ./.;

          nativeBuildInputs = with pkgs; [
            rustNightly
            llvmPackages.libcxxStdenv
            curl
            protobuf
            pkg-config
            cmake
            fftw
          ];

          buildInputs = pkgs.lib.optionals pkgs.stdenv.isDarwin
            (with pkgs; [
              darwin.libobjc
            ]) ++ (with pkgs.darwin.apple_sdk.frameworks; [
            Carbon
            AudioUnit
            WebKit
          ]);

          postConfigure = ''
                        ${pkgs.zstd}/bin/zstd -d ${stemsplit-bin}/target.tar.zst --stdout | tar -xvf - -C ./src-tauri/
                        directory_line=$(grep "directory" ${cargoVendorDir}/config.toml)
                        vendor_dir=$(echo "$directory_line" | awk -F'=' '{print $2}' | tr -d '[:space:]' | tr -d '"')
                        echo $vendor_dir

                        cat <<DONE >> src-tauri/.cargo/config.toml
                        [source.crates-io]
                        replace-with = "vendored-sources"

                        [source.vendored-sources]
                        directory = "''$vendor_dir"
DONE
                        rm -rf src-tauri/models/
                        cp -r ${stemsplit-models}/models src-tauri/models
                      # '';

          npmBuild = ''
            export LIBTORCH="${libtorch}";
            export DYLD_LIBRARY_PATH="${libtorch}/lib:$";
            export STEMSPLIT_RESOURCES_PATH='../Resources/'
            npm run tauri build -- --ci -- --offline || true
          '';

          installPhase = ''
            mkdir -p $out/target
            cp -r ./src-tauri/target/ $out/.
          '';
        };

      in
      {
        devShell = pkgs.mkShell {
          LIBTORCH = "${libtorch}";

          nativeBuildInputs = with pkgs; [
            rustNightly
            llvmPackages.libcxxStdenv
            llvmPackages.openmp
            libtorch
            curl
            protobuf
            pkg-config
            cmake
            fftw
          ];

          buildInputs = pkgs.lib.optionals pkgs.stdenv.isDarwin
            (with pkgs; [
              darwin.libobjc
            ]) ++ (with pkgs.darwin.apple_sdk.frameworks; [
            Carbon
            AudioUnit
            WebKit
          ]);
        };

        defaultPackage = stemsplit-bin;

        packages = {
          inherit stemsplit-bin stemsplit-dmg stemsplit-models;
        };

        libtorch = libtorch;
      });
}
