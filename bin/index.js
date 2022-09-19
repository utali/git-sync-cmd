#!/usr/bin/env node
const inquirer = require("inquirer");
const inquirerPrompt = require('inquirer-autocomplete-prompt');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers')

const merge = require('./merge');
const copy = require('./copy');

const arg = hideBin(process.argv);

inquirer.registerPrompt("autocomplete", inquirerPrompt);


const run = async () => {
  const error = await copy();
  if (error) return;
  merge();
}

const cli = yargs(arg);
cli.usage('Usage: git-sync-cmd [command] <options>')
  .strict()
  .alias('h', 'help')
  .alias('v', 'version')
  .command(
    'run',
    'copy files for sync & git merge',
    function (argv) {
      run()
    }
  )
  .command(
    'copy',
    'copy files for sync',
    function (argv) {
      copy()
    }
  )
  .command(
    'merge',
    'git merge',
    function (argv) {
      merge()
    }
  )
  .argv
