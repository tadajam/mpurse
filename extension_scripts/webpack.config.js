const webpack = require("webpack");
const path = require("path");
const glob = require("glob");

const entries = {};

glob.sync("./extension_scripts/**/*.ts", {}).map(file => {
  console.log(file);
  let key = file.replace(new RegExp(`^./extension_scripts/`), '');
  key = key.replace(new RegExp(`.ts$`), '');
  entries[key] = file;
});


module.exports = {
  mode: 'production',
  entry: entries,
  output: {
    path: path.join(__dirname, '../dist/mpurse/extension_scripts'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname, "app")
    ],
    extensions: [
      '.ts', '.js'
    ]
  }
};
