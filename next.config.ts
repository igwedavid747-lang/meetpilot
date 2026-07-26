import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const nextConfig: NextConfig = {
  // Keep file tracing inside this repository even when a parent folder has a lockfile.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
};

export default nextConfig;
