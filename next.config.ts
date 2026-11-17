import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  agentRules: false,
  async redirects() {
    return [{ source: "/explore", destination: "/", permanent: true }];
  },
  async headers() {
    return [{ source: "/.well-known/ucp", headers: [{ key: "Content-Type", value: "application/json" }] }];
  },
};
export default config;
