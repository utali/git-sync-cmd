const chalk = require('chalk');
const fs = require('fs');

let cacheJson, cachePath = './.cache.json';
const cache = {
  get: () => {
    try {
      cacheJson = require(cachePath);
      return cacheJson;
    } catch(err) {
      if (err.code === 'MODULE_NOT_FOUND') {
        fs.writeFileSync(cachePath, JSON.stringify({}, '', '\t'));
      }
      return {}
    }
  },
  set: (answers) => {
    fs.writeFileSync(cachePath, JSON.stringify(answers, '', '\t'))
  },
}

exports.cache = cache;