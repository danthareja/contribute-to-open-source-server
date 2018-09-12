const fs = require('fs');
const path = require('path');
const Mustache = require('mustache');

module.exports = fs
  .readdirSync(__dirname)
  .filter(file => path.extname(file) == '.md')
  .reduce((module, file) => {
    module[path.basename(file, '.md')] = (() => {
      const template = fs.readFileSync(path.join(__dirname, file), 'utf-8');
      return data => Mustache.render(template, data);
    })();
    return module;
  }, {});
