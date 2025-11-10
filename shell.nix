{pkgs ? (import ./nixpkgs.nix) {}}: {
  default = pkgs.mkShell {
    NIX_CONFIG = "experimental-features = nix-command flakes"; # Enable nix command and flake support.
    nativeBuildInputs = with pkgs; [
      nodejs
    ];
  };
}
