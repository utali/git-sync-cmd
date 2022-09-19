#!/usr/bin/env node
const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const { execSync, exec } = require("child_process");
const inquirerPrompt = require('inquirer-autocomplete-prompt');

const { cache } = require("./utils");

const cacheJson = cache.get();
const { originPath = [], originBranch = [] } = cacheJson;

inquirer.registerPrompt("autocomplete", inquirerPrompt);

const localPath = process.cwd();

const questions1 = [
  {
    type: "autocomplete",
    message: "远程仓库的本地绝对路径：",
    name: "originPath",
    validate: (val) => {
      if (!val) {
        return "请输入正确的远程仓库地址";
      }
      return true;
    },
    source: (answer, input) => {
      if (!input) return originPath;
      const filters = originPath.filter((item) => item.includes(input));
      if (filters.length > 0) return filters;
      return [input];
    },
  },
  {
    type: "autocomplete",
    message: "请输入要同步的远程分支：",
    name: "originBranch",
    default: "master",
    source: (answer, input) => {
      if (!input) return originBranch;
      const filters = originBranch.filter((item) => item.includes(input));
      if (filters.length > 0) return filters;
      return [input];
    },
  },
  {
    type: "confirm",
    message: "是否要在本地新建分支？",
    name: "isCreateNew",
    default: false,
  },
  {
    type: "input",
    message: "请输入新建分支名称：",
    name: "localNewBranch",
    validate: (val) => {
      if (!val) return "新建分支名称不能为空";
      return true;
    },
    when: (answer) => answer.isCreateNew,
  },
  {
    type: "input",
    message: "请输入迁出分支名称（为空则默认为当前分支）：",
    name: "lastBranch",
    when: (answer) => answer.isCreateNew,
  },
];

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

// 提交本地代码
const commit = (answer) => {
  return new Promise((resolve, reject) => {
    // 提交本地代码
    const cmd1 = `git fetch && git add . && git commit -m 'feat(同步): 同步远端${answer.originBranch}分支'`;
    console.log(chalk.blue(cmd1));
    exec(cmd1, (error) => {
      if (error) {
        return reject(error)
      }
      console.log(chalk.green(`========== 已完成本地同步代码提交 ==========`));
      resolve();
    })
  })
}

const sync1 = (answer) => {
  return new Promise(async (resolve, reject) => {
    try {
      // 在当前文件夹下执行命令
      // 本地新建分支并切换
      if (answer.isCreateNew && answer.localNewBranch) {
        await createNewBranch(answer.localNewBranch, answer.lastBranch);
      }
      // 打开仓库路径 并切换到“远程分支” 拉取代码
      const cmd2 = `cd ${answer.originPath} && git pull origin && git checkout ${answer.originBranch}`;
      console.log(chalk.blue(cmd2));
      execSync(cmd2);
      // 复制仓库路径下所有文件
      fs.copySync(
        answer.originPath,
        localPath,
        {
          filter: (src, dest) => {
            var result = !(/\.git(\/.*)?$|node_modules/g.test(dest) || /\.git(\/.*)?$|node_modules/g.test(src));
            console.log(result ? "copied" : "skipped", dest);
            return result;
          },
          overwrite: true,
        },
        function (err) {
          if (err) {
            return console.log(chalk.red(err));
          }
          console.log(chalk.green("复制完成"));
        }
      );
      console.log(chalk.green(`========== 已成功将远程分支同步至本地${answer.localNewBranch || ''} ==========`));
      await commit(answer);
      resolve();
    } catch (error) {
      console.log(chalk.red(error));
      reject(error);
    }   
  })
};

const copy = () => {
  return new Promise(resolve => {
    inquirer.prompt(questions1).then(async (answer) => {
      if (originPath.indexOf(answer.originPath) < 0) originPath.unshift(answer.originPath);
      if (originBranch.indexOf(answer.originBranch) < 0) originBranch.unshift(answer.originBranch);
      cache.set({...cacheJson, originPath, originBranch});
      resolve(await sync1(answer));
    });
  })

}

module.exports = copy;