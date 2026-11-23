import type { NextConfig } from "next";

// Site entièrement statique : `next build` écrit dans out/ des fichiers à héberger tels quels.
// Sous-chemin du site fixé au build (GitHub Pages : /latynnaxplorer) ; vide par défaut.
const config: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export default config;
