export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "dist-firefox/**",
      "outputs/**"
    ]
  },
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script"
    },
    linterOptions: {
      reportUnusedDisableDirectives: true
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn"
    }
  },
  {
    files: ["e2e-tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "script"
    }
  }
];
