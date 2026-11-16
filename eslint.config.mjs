import webVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...webVitals,
  ...nextTypescript,
  { ignores: [".next/**", "next-env.d.ts"] },
  { rules: { "@next/next/no-img-element": "off" } },
];
export default config;
