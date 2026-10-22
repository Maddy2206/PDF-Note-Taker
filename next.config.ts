import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Checks and test servers run with their own output folder (NEXT_DIST_DIR=.next-check)
  // so they never overwrite the files of a dev server that is already running.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
