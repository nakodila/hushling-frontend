import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the dev server be reached from other devices on the LAN (e.g.
  // testing the recorder on a phone) via the "Network" URL `next dev` prints.
  allowedDevOrigins: ["192.168.178.77"],
};

export default nextConfig;
