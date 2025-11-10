{
  # Todo: Write description
  description = "";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = {nixpkgs, ...}: let
    forAllSystems = nixpkgs.lib.genAttrs [
      "aarch64-linux"
      "i686-linux"
      "x86_64-linux"
      "aarch64-darwin"
      "x86_64-darwin"
    ];
  in {
    # Imports `shell.nix` to avoid maintaining two seperate nix development shells.
    devShells = forAllSystems (
      system: let
        pkgs = nixpkgs.legacyPackages."${system}";
      in
        import ./shell.nix {inherit pkgs;}
    );
  };
}
