import "./env/client";
import "./env/server";

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;
