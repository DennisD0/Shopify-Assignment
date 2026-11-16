import type { NextConfig } from "next";

const config: NextConfig = {
  devIndicators: false,
  agentRules: false,
  async headers() {
    return [{ source: "/.well-known/ucp", headers: [{ key: "Content-Type", value: "application/json" }] }];
  },
};
export default config;
