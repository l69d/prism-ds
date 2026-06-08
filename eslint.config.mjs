import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Apostrophes in prose are valid HTML and render fine; this stylistic rule is noisy.
      "react/no-unescaped-entities": "off",
      // Reading localStorage / DOM on mount and syncing to state is the correct,
      // hydration-safe pattern here; the rule over-fires on it. Keep as a warning.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
