module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    "indent": ["error", 2,],
    "linebreak-style": ["error", "windows",],
    "quotes": ["error", "double",],
    "semi": ["error", "always",],
    "max-len": ["error", { "code": 120, "ignoreUrls": true, },],
    "comma-dangle": ["error", "always-multiline",],
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", },],
    "no-console": "off",
  },
  // ... existing code ...
  rules: {
    "linebreak-style": ["error", "unix",], // or 'windows' if you prefer CRLF
    "indent": ["error", 2,], // or 4 if you prefer 4 spaces
    "max-len": ["error", { "code": 120, },], // increase max line length if needed
    "comma-dangle": ["error", "always",],
    "object-curly-spacing": ["error", "always",],
  },
  overrides: [
    {
      files: ["**/*.spec.*",],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
