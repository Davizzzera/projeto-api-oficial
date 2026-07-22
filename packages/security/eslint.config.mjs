import js from "@eslint/js";

export default [
  { ignores: ["dist/**"] },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": "off"
    }
  }
];
