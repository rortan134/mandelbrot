const ENABLE_STATIC_EXPORT = true;

/** @type {import("next").NextConfig} */
const config = {
  productionBrowserSourceMaps: false,
  typescript: { ignoreBuildErrors: true },
  eslint: { dirs: ["."], ignoreDuringBuilds: true },
  distDir: ENABLE_STATIC_EXPORT ? "build" : ".next",
  output: ENABLE_STATIC_EXPORT ? "export" : undefined,
  swcMinify: true,
};

export default config;
