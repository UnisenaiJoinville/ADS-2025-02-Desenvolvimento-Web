const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const prettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier
);
