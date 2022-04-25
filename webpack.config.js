/* eslint-env node */

module.exports = {
  context: `${__dirname}/src`,
  entry: {
    index: './index.js',
  },
  output: {
    filename: '[name].js',
    path: `${__dirname}/dist`,
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: `${__dirname}/src`,
    },
    compress: true,
    port: 9001,
  },
  mode: 'development',
  devtool: 'source-map',
};
