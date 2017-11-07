const fs = require('fs');
const path = require('path');

module.exports = fs
  .readdirSync(__dirname)
  .filter(file => path.extname(file) === '.js' && file !== __filename)
  .reduce((module, file) => {
    module[path.basename(file, '.js')] = require(path.join(__dirname, file))
    return module;
  }, {});
