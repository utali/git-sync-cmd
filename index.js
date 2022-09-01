#!/usr/bin/env node
const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const { execSync } = require("child_process");
const { cache } = require("./utils");
const inquirerPrompt = require('inquirer-autocomplete-prompt');

const cacheJson = cache.get();
const { originPath = [], originBranch = [], mergeBranch = [] } = cacheJson;

inquirer.registerPrompt("autocomplete", inquirerPrompt);

const localPath = process.cwd();

const questions = [
  {
    type: "autocomplete",
    message: "要同步仓库的本地绝对路径：",
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
    message: "请输入需要同步的远程分支：",
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
    default: true,
  },
  {
    type: "input",
    message: "请输入新建分支名称：",
    name: "localNewBranch",
    validate: (val) => {
      if (!val) return "新建分支名称不能为空";
      return true;
    },
    when: (answer) => {
      return answer.isCreateNew;
    },
  },
  {
    type: "confirm",
    message: "是否需要合并同步内容至本地的其它分支？",
    name: "isNeedMerge",
    default: true,
  },
  {
    type: "autocomplete",
    message: "请输入合并分支的名称（请确保分支已存在）：",
    name: "mergeBranch",
    validate: (val) => {
      if (!val) return "合并分支名称不能为空";
      return true;
    },
    when: (answer) => {
      return answer.isNeedMerge;
    },
    source: (answer, input) => {
      if (!input) return mergeBranch;
      const filters = mergeBranch.filter((item) => item.includes(input));
      if (filters.length > 0) return filters;
      return [input];
    },
  },
];

inquirer.prompt(questions).then((answer) => {
  if (originPath.indexOf(answer.originPath) < 0) originPath.unshift(answer.originPath);
  if (originBranch.indexOf(answer.originBranch) < 0) originBranch.unshift(answer.originBranch);
  if (answer.mergeBranch && mergeBranch.indexOf(answer.mergeBranch) < 0) mergeBranch.unshift(answer.mergeBranch);
  cache.set({...cacheJson, originPath, originBranch, mergeBranch});
  sync(answer);
});

const sync = (answer) => {
  // 在当前文件夹下执行命令
  // 本地新建分支并切换
  if (answer.isCreateNew && answer.localNewBranch) {
    const cmd1 = `git checkout -b ${answer.localNewBranch}`;
    execSync(cmd1, (error) => {
      if (error) {
        return console.log(chalk.red(error));
      }
    });
  }
  // 打开仓库路径 并切换到“远程分支” 拉取代码
  const cmd2 = `cd ${answer.originPath} && git pull origin && git checkout ${answer.originBranch}`;
  console.log(cmd2);
  execSync(cmd2, (error, stdout) => {
    if (error) {
      return console.log(chalk.red(error));
    }
  });
  // 复制仓库路径下所有文件
  fs.copySync(
    answer.originPath,
    localPath,
    {
      clobber: true,
      filter: (n) => {
        var result = !/\.git(\/.*)?$|node_modules/g.test(n);
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
  const cmd7 = `git add . && git commit -m 'feat(同步): git-sync同步${answer.originBranch}分支'`;
  console.log(cmd7);
  execSync(cmd7, (error) => {
    if (error) {
      return console.log(chalk.red(error));
    }
  });
  if (answer.isNeedMerge && answer.mergeBranch) {
    // 切换到合并分支 需要新建分支还是已有分支？
    const cmd8 = `git checkout ${answer.mergeBranch} && git merge ${answer.localNewBranch}`;
    console.log(cmd8);
    execSync(cmd8, (error) => {
      if (error) {
        return console.log(chalk.red(error));
      }
    });
  }
};
