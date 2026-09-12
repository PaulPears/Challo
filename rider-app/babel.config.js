module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  // Strip console.log statements in production builds if available
  if (process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production') {
    try {
      require.resolve('babel-plugin-transform-remove-console');
      plugins.push('transform-remove-console');
    } catch (_) {
      // plugin not installed, continue safely
    }
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
