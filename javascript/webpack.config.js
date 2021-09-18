const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/picker.js',
  output: {
    path: path.resolve(__dirname, '../inst/htmlwidgets/lib/widget'),
    filename: 'picker.min.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg/,
        loader: 'raw-loader'
      }
    ],
  }
};
