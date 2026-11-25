import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  {
    ignores: [
      "dist/",
      "node_modules/",
      "coverage/",
      "playwright-report/",
      "test-results/",
      ".vite/",
      "vite.config.ts.timestamp-*",
    ],
  },
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "no-console": "warn",
    },
  },
];
