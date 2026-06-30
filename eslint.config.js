const js = require("@eslint/js");

module.exports = [
  {
    ignores: ["build/**", "coverage/**"],
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
    rules: {
      indent: ["error", 2],
      quotes: 0,
      semi: 0,
      eqeqeq: "error",
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      "arrow-spacing": ["error", { before: true, after: true }],
      "no-console": 0,
    },
  },
];