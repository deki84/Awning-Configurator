import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @markise/shared exportiert unkompiliertes TypeScript, Next.js soll es mitkompilieren
  transpilePackages: ["@markise/shared"],
};

export default nextConfig;
