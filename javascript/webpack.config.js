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
  },
  externals: {
    'deck.gl': 'deck',
    '@deck.gl/core': 'deck',
    '@deck.gl/extensions': 'deck',
    '@deck.gl/geo-layers': 'deck',
    '@deck.gl/layers': 'deck',
    '@deck.gl/mesh-layers': 'deck',
    '@luma.gl/core': 'luma',
    '@luma.gl/constants': 'luma',
    '@loaders.gl/core': 'loaders',
  }
};
