#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import { scanCommand } from './commands/scan.js';
import { authCommand } from './commands/auth.js';
import { configCommand } from './commands/config.js';
import { hookCommand } from './commands/hook.js';

const VERSION = '1.0.0';

program
  .name('keyspinner')
  .description(chalk.cyan.bold(`
  ██╗  ██╗██╗███╗   ██╗ █████╗
  ██║ ██╔╝██║████╗  ██║██╔══██╗
  █████╔╝ ██║██╔██╗ ██║███████║
  ██╔═██╗ ██║██║╚██╗██║██╔══██║
  ██║  ██╗██║██║ ╚████║██║  ██║
  ╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
        Secret Scanner for GitHub`))
  .version(VERSION)
  .option('-v, --verbose', 'Verbose output');

program.addCommand(scanCommand);
program.addCommand(authCommand);
program.addCommand(configCommand);
program.addCommand(hookCommand);

program.parse();
