import js from "@eslint/js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: [".next/**", "node_modules/**"],
  },
  {
    ...js.configs.recommended,
    files: ["*.js", "*.mjs"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
