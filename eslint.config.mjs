import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Next 16: `next lint` removed — use ESLint CLI + flat config.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Hard ban — use proper types or `unknown` + narrowing (see CODING_STANDARDS.md).
      "@typescript-eslint/no-explicit-any": "error",
      // Pre-existing shadcn / tooling noise; tighten in a follow-up cleanup.
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
