/**
 * Hook command - Generate pre-commit hook configuration
 */

import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export async function hook(options: { install?: boolean }): Promise<void> {
  const hookScript = `#!/bin/sh
# KeySpinner pre-commit hook
# Prevents committing secrets to your repository

echo "Running KeySpinner secret scan..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Create temp directory for scan
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# Copy staged files to temp dir
for file in $STAGED_FILES; do
    if [ -f "$file" ]; then
        mkdir -p "$TMP_DIR/$(dirname "$file")"
        cp "$file" "$TMP_DIR/$file"
    fi
done

# Run KeySpinner scan on staged files
npx keyspinner-scan scan "$TMP_DIR" --format console

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Secrets detected! Commit blocked."
    echo "Remove the secrets and try again."
    exit 1
fi

echo "✓ No secrets detected. Proceeding with commit."
exit 0
`;

  if (options.install) {
    await installHook(hookScript);
  } else {
    console.log('');
    console.log(chalk.cyan.bold('Pre-commit Hook Script'));
    console.log('');
    console.log(chalk.gray('Add this to your .git/hooks/pre-commit file:'));
    console.log('');
    console.log(chalk.dim(hookScript));
    console.log('');
    console.log(chalk.gray('Or run: keyspinner hook --install'));
    console.log('');
  }
}

async function installHook(script: string): Promise<void> {
  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');

  try {
    await fs.mkdir(path.dirname(hookPath), { recursive: true });
    await fs.writeFile(hookPath, script, { mode: 0o755 });
    console.log(chalk.green('✓ Pre-commit hook installed'));
    console.log(chalk.gray(`  Location: ${hookPath}`));
  } catch (error) {
    console.log(chalk.yellow('○ Could not install hook'));
    console.log(chalk.gray('  Make sure you are in a git repository'));
  }
}
