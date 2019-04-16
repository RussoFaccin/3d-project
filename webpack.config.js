const path = require('path');
module.exports = {
  entry: "./dev/js/app.js",
  devServer: {
    contentBase: path.resolve(__dirname, "dev/"),
    watchContentBase: true,
    compress: true,
    port: 9000
  }
};
