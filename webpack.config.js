const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (options) => {
  return {
    ...options,
    externals: [],
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            keep_classnames: true,
          },
        }),
      ],
    },
    output: {
      ...options.output,
      libraryTarget: 'commonjs2',
    },
    resolve: {
      extensions: ['.ts', '.js'],
      modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    },
    plugins: [
      ...(options.plugins || []),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/**/*.ts',
            to: '[path][name][ext]',
            context: '.',
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
  };
};
