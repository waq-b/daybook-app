import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

// No colour outside design/ (DESIGN.md §1, plan D14). Stylelint covers CSS.
const HEX = "/#[0-9a-fA-F]{3,8}\\b/";
const noHex = [
  { selector: `Literal[value=${HEX}]`, message: "Colours come from design/tokens.css, not hex." },
  {
    selector: `TemplateElement[value.raw=${HEX}]`,
    message: "Colours come from design/tokens.css, not hex.",
  },
];

// User-facing attributes that must come from src/copy.ts, never a literal.
const COPY_ATTRIBUTES = ["aria-label", "title", "placeholder", "alt", "label", "hint"];

export default tseslint.config(
  { ignores: ["dist", "dist-server", "design", "coverage", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      // `const { dropped, ...rest } = row` is how a field is left out.
      "@typescript-eslint/no-unused-vars": ["error", { ignoreRestSiblings: true }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "server/**/*.ts"],
    rules: { "no-restricted-syntax": ["error", ...noHex] },
  },
  {
    files: ["src/**/*.tsx"],
    plugins: { react, "react-hooks": reactHooks },
    settings: { react: { version: "18" } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Copy lives in src/copy.ts.
      "react/jsx-no-literals": ["error", { noStrings: true, ignoreProps: true }],
      "no-restricted-syntax": [
        "error",
        ...noHex,
        {
          selector: `JSXAttribute[name.name=/^(${COPY_ATTRIBUTES.join("|")})$/] > Literal`,
          message: "User-facing text comes from src/copy.ts.",
        },
      ],
    },
  },
  {
    // Node scripts; some also run code in a browser page (check-update.mjs).
    files: ["scripts/**/*.mjs"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
);
