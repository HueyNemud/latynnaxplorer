import type { NextConfig } from "next";

// Site entièrement statique : `next build` écrit dans out/ des fichiers à héberger tels quels.
const config: NextConfig = { output: "export" };

export default config;
