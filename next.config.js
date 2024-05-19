"use strict";
/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./env.js");

const ENABLE_STATIC_EXPORT = false;

/** @type {import("next").NextConfig} */
const config = {
    reactStrictMode: true,
    // Disable browser source map generation during the production build
    productionBrowserSourceMaps: false,
 typescript: { ignoreBuildErrors: true },
    eslint: { dirs: ["."], ignoreDuringBuilds: true },
    // On static export builds we want the output directory to be "build"
    distDir: ENABLE_STATIC_EXPORT ? "build" : ".next",
    // On static export builds we want to enable the export feature
    output: ENABLE_STATIC_EXPORT ? "export" : undefined,
};

export default config;
