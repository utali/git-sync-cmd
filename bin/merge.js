#!/usr/bin/env node
const chalk = require("chalk");
const inquirer = require("inquirer");
const { execSync } = require("child_process");
const {createNewBranch} = require('./utils');

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
    type: "input",
    message: "请输入合并后的分支名称（为空则默认为当前分支）：",
    name: "mergeBranch",
    when: (answer) => answer.isNeedMerge,
  },
];

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
  return new Promise((resolve, reject) => {
    inquirer.prompt(questions2).then((answer) => {
      console.log('answer', answer);
      sync2(answer);
      resolve();
    }) .catch((error) => {
      console.log('error', error);
      reject(error)
    });
  })
}

module.exports = merge;