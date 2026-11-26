module.exports = [
  ...require('eslint-config-expo/flat'),
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*']
  },
  {
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off'
    }
  }
];
