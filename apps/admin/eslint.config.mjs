const eslintConfig = [
  {
    ignores: ['.next', 'node_modules', 'dist', 'build'],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
];

export default eslintConfig;
