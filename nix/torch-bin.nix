{stdenv, fetchzip}:
let 
  version = "2.2.0";
in stdenv.mkDerivation {
  inherit version;
  name = "libtorch-bin";
  pname = "libtorch-bin";

  src = fetchzip {
    url = "https://download.pytorch.org/libtorch/cpu/libtorch-macos-arm64-2.2.0.zip";
    hash = "sha256-09pRH2CSLgKAxB1CnqYEhRrSHLPFRBjTmiuXnhDN+a8=";
  };

  installPhase = ''
    cp -r $src $out
  '';
}
