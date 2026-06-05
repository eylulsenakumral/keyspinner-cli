/**
 * Config command - Show configuration and setup info
 */

import chalk from 'chalk';
import os from 'os';
import path from 'path';
import { promises as fs } from 'fs';

const CONFIG_DIR = path.join(os.homedir(), '.keyspinner');
const CONFIG_FILE = path.join(CONFIG_DIR, 'auth.json');

export async function config(): Promise<void> {
  console.log('');
  console.log(chalk.cyan.bold('KeySpinner CLI Configuration'));
  console.log('');

  // Check stored token
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(content);
    console.log(chalk.green('✓ Authenticated'));
    console.log(chalk.gray(`  Token stored: ${new Date(config.storedAt).toLocaleString()}`));
  } catch {
    console.log(chalk.yellow('○ No stored token'));
    console.log(chalk.gray('  Run: keyspinner auth save <token>'));
  }

  console.log('');
  console.log(chalk.gray('Environment:'));
  console.log(`  ${chalk.gray('•')} Platform: ${os.platform()}`);
  console.log(`  ${chalk.gray('•')} Node: ${process.version}`);
  console.log(`  ${chalk.gray('•')} Home: ${CONFIG_DIR}`);
  console.log('');

  console.log(chalk.gray('Usage:'));
  console.log(`  ${chalk.cyan('keyspinner scan <repo>')}    Scan a repository`);
  console.log(`  ${chalk.cyan('keyspinner auth save')}      Save GitHub token`);
  console.log(`  ${chalk.cyan('keyspinner auth verify')}    Verify stored token`);
  console.log(`  ${chalk.cyan('keyspinner auth remove')}    Remove stored token`);
  console.log('');
}
