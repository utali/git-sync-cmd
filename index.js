#!/usr/bin/env node
const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");

let options = {};
const localPath = process.cwd();

const questions = [
  {
    type: "input",
    message: "要同步仓库的本地绝对路径：",
    name: "originPath",
    validate: (val) => {
      if (!val) {
        return "请输入正确的远程仓库地址";
      }
      return true;
    },
  },
  {
    type: "input",
    message: "请输入需要同步的远程分支：",
    name: "originBranch",
    default: "master",
  },
  {
    type: "input",
    message: "请输入需要合并到本地的哪个分支：",
    name: "mergeBranch",
    validate: (val) => {
      if (!val) return "合并分支不能为空";
      return true;
    },
  },
];

inquirer.prompt(questions).then((answer) => {
  options = answer;
  sync(answer);
});

const sync = (answer) => {
  // 在当前文件夹下执行命令
  // 当前路径新建并切换到“远程分支”
  // const cmd1 = `git checkout -b ${answer.originBranch}`; // 涉及到升级 手动执行为好
  // 打开仓库路径 并切换到“远程分支” 拉取代码
  const cmd2 = `cd ${answer.originPath} & git pull origin & git checkout ${answer.originBranch}`;
  console.log(cmd2);
  execSync(cmd2, (error, stdout) => {
    if (error) {
      return console.error(error);
    }
    console.log(stdout);
  });
  // 复制仓库路径下所有文件
  fs.copy(
    answer.originPath,
    localPath,
    {
      clobber: true,
      filter: (n) => {
        var result = !/(\.git|node_modules)/.test(n);
        console.log(result ? "copied" : "skipped", n);
        return result;
      },
      overwrite: true,
    },
    function (err) {
      if (err) {
        return console.error(err);
      }
      console.log("复制成功");
    }
  );
  // 提交本地代码
  const cmd7 = `git add .& git commit -m "git sycn ${answer.originBranch}" & git push origin ${answer.originBranch}`;
  // 切换到合并分支
  const cmd8 = `git checkout ${answer.mergeBranch}`;
  // 合并“远程分支”
  const cmd9 = `git merge ${answer.originBranch}`;
};
