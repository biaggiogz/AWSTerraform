module.exports = {
  extends: ['react-app', 'react-app/jest'],
  globals: {
    FinalizationRegistry: 'readonly',
    BigInt: 'readonly'
  },
  rules: {
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['src/wasm/wasm-modules/*.js'],
      rules: {
        'no-undef': 'off'
      }
    }
  ]
};