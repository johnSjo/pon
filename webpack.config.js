/* eslint-env node */

module.exports = {
  context: `${__dirname}/src`,
  entry: {
    index: './index.ts',
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
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
