import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep Turbopack rooted in this project (avoids parent lockfile noise)
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
