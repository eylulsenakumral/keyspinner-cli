/**
 * Auth command - Manage GitHub PAT authentication
 */

import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import path from 'path';
import os from 'os';
import { verifyTokenScopes } from '../lib/github';
import type { AuthConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.keyspinner');
const CONFIG_FILE = path.join(CONFIG_DIR, 'auth.json');

export async function auth(command: 'save' | 'verify' | 'remove', token?: string): Promise<void> {
  ensureConfigDir();

  switch (command) {
    case 'save':
      await saveToken(token);
      break;
    case 'verify':
      await verifyStoredToken();
      break;
    case 'remove':
      await removeStoredToken();
      break;
  }
}

async function saveToken(token?: string): Promise<void> {
  const spinner = ora('Verifying token...').start();

  const pat = token ?? process.env.GITHUB_TOKEN;
  if (!pat) {
    spinner.fail('No token provided. Use: keyspinner auth save <token>');
    process.exit(1);
  }

  const verification = await verifyTokenScopes(pat);
  if (!verification.valid) {
    spinner.fail('Invalid GitHub token.');
    process.exit(1);
  }

  spinner.succeed(`Authenticated as ${chalk.cyan(verification.login)}`);

  // Check scopes
  const requiredScopes = ['repo', 'public_repo'];
  const hasScope = requiredScopes.some((s) => verification.scopes.includes(s));

  if (!hasScope) {
    console.log('');
    console.log(chalk.yellow('⚠️  Warning: Token may lack required scopes.'));
    console.log(chalk.gray(`Current scopes: ${verification.scopes.join(', ') || 'none'}`));
    console.log(chalk.gray('Recommended scopes: repo, public_repo'));
    console.log('');
  }

  // Save token
  const config: AuthConfig = {
    token: pat,
    storedAt: Date.now(),
  };

  await fs.promises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  console.log(chalk.green('✓ Token saved to ~/.keyspinner/auth.json'));
}

async function verifyStoredToken(): Promise<void> {
  const spinner = ora('Reading stored token...').start();

  try {
    const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
    const config: AuthConfig = JSON.parse(content);

    spinner.text = 'Verifying token...';

    const verification = await verifyTokenScopes(config.token);
    if (!verification.valid) {
      spinner.fail('Stored token is invalid or expired.');
      console.log(chalk.gray('Run: keyspinner auth remove && keyspinner auth save <token>'));
      process.exit(1);
    }

    spinner.succeed(`Authenticated as ${chalk.cyan(verification.login)}`);
    console.log('');
    console.log(chalk.gray('Token scopes:'));
    for (const scope of verification.scopes) {
      console.log(`  ${chalk.gray('•')} ${scope}`);
    }
    if (verification.scopes.length === 0) {
      console.log(`  ${chalk.gray('•')} (no scopes)`);
    }
    console.log('');
    console.log(chalk.gray(`Stored: ${new Date(config.storedAt!).toLocaleString()}`));
  } catch (error) {
    spinner.fail('No stored token found.');
    console.log(chalk.gray('Save one first: keyspinner auth save <token>'));
    process.exit(1);
  }
}

async function removeStoredToken(): Promise<void> {
  const spinner = ora('Removing stored token...').start();

  try {
    await fs.promises.unlink(CONFIG_FILE);
    spinner.succeed('Token removed from ~/.keyspinner/auth.json');
  } catch (error) {
    spinner.fail('No stored token found.');
  }
}

export async function getStoredToken(): Promise<string | null> {
  try {
    const content = await fs.promises.readFile(CONFIG_FILE, 'utf-8');
    const config: AuthConfig = JSON.parse(content);
    return config.token;
  } catch {
    return null;
  }
}

function ensureConfigDir(): void {
  try {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  } catch {
    // Ignore
  }
}
