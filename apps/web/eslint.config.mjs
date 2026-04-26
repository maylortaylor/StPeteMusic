const eslintConfig = [
  {
    ignores: ['.next', 'node_modules', 'dist', 'build', '.turbo', 'suite_e_images'],
  },
  {
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
    },
  },
];

export default eslintConfig;
