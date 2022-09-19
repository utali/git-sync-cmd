#!/usr/bin/env node
const chalk = require("chalk");
const inquirer = require("inquirer");
const { execSync, exec } = require("child_process");
const inquirerPrompt = require('inquirer-autocomplete-prompt');

inquirer.registerPrompt("autocomplete", inquirerPrompt);

const questions2 = [
  {
    type: "confirm",
    message: "是否需要将同步内容与本地其他分支内容合并？",
    name: "isNeedMerge",
    default: false,
  },
  {
    type: "input",
    message: "请输入需要合并本地的哪个分支（请确保分支已存在）：",
    name: "oldBranch",
    validate: (val) => {
      if (!val) return "分支名称不能为空";
      return true;
    },
    when: (answer) => answer.isNeedMerge,
  },
  {
    type: "autocomplete",
    message: "请输入合并后的分支名称（为空则默认为当前分支）：",
    name: "mergeBranch",
    when: (answer) => answer.isNeedMerge,
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

const sync2 = async (answer) => {
  if (answer.isNeedMerge && answer.oldBranch) {
    if (answer.mergeBranch) {
      await createNewBranch(answer.mergeBranch)
    }
    const cmd = `git merge ${answer.oldBranch}`;
    console.log(chalk.blue(cmd));
    execSync(cmd);
  }
}

const merge = () => {
  inquirer.prompt(questions2).then((answer) => {
    console.log('answer', answer);
    sync2(answer);
  }) .catch((error) => {
    console.log('error', error)
  });
}

module.exports = merge;