import js from "@eslint/js";

export default [
  {
    ignores: ["src/generated/**", "dist/**"]
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "off"
    }
  }
];
