import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fail the build on a type or lint error. A career recommendation that is
  // wrong because of a type slip is worse than a build that does not ship.
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  // The Prisma engine and the Anthropic SDK must never be traced into a
  // client bundle. Keeping them external also keeps the server bundle small.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon", "@anthropic-ai/sdk"],
  poweredByHeader: false,
};

export default nextConfig;
