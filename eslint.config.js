import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// User-facing attributes that must come from src/copy.ts, never a literal.
const COPY_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt", "label", "hint"];

export default tseslint.config(
  { ignores: ["dist", "dist-server", "design", "coverage", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "18" } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Copy lives in src/copy.ts (CLAUDE.md protocol 5).
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true }],
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/^(${COPY_ATTRIBUTES.join("|")})$/] > Literal`,
          message: "User-facing text comes from src/copy.ts.",
        },
      ],
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: globals.node },
  },
);
