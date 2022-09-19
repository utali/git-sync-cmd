const chalk = require('chalk');
const fs = require('fs');
const { exec } = require('child_process');

let cacheJson, cachePath = __dirname + '/.cache.json';
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
// 创建/切换分支
const createNewBranch = (branch, lastBranch) => {
  return new Promise((resolve, reject) => {
    let cmd1 = '';
    if (lastBranch) cmd1 += `git checkout ${lastBranch} && `;
    cmd1 += `git checkout -b ${branch}`;
    const cmd2 = `git checkout ${branch}`;
    console.log(chalk.blue(cmd1));
    exec(cmd1, (error) => {
      if (error) {
        if (error.code == 128) {
          console.log(chalk.yellow(error));
          console.log(chalk.blue(cmd2));
          exec(cmd2, (err) => {
            if (err) return reject(err);
            return resolve();
          })
        }
      }
      resolve();
    })
  })
}

exports.cache = cache;
exports.createNewBranch = createNewBranch;