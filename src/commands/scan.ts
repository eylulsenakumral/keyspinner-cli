import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { GitHubService } from '../lib/github.js';
import { SECRET_PATTERNS, type SecretMatch } from '../lib/secrets.js';

export const scanCommand = program
  .createCommand('scan')
  .description('Scan a GitHub repository for secrets')
  .argument('<repo>', 'Repository in format owner/repo or full URL')
  .option('-b, --branch <branch>', 'Branch to scan', 'main')
  .option('-c, --commits <n>', 'Number of commits to scan', '10')
  .option('-o, --output <format>', 'Output format (table|json)', 'table')
  .option('-v, --verbose', 'Verbose output')
  .action(async (repo: string, options) => {
    const spinner = ora('Initializing scan...').start();

    try {
      const match = repo.match(/(?:github\.com\/)?([^/]+)\/([^/]+)/);
      if (!match) {
        spinner.fail('Invalid repository format. Use: owner/repo');
        process.exit(1);
      }

      const [, owner, name] = match;
      const repoId = `${owner}/${name}`;

      spinner.text = `Scanning ${repoId}...`;

      const github = new GitHubService();
      const isAuthenticated = await github.isAuthenticated();

      if (!isAuthenticated) {
        spinner.warn('Not authenticated. Run: keyspinner auth set <token>');
        process.exit(1);
      }

      const repository = await github.getRepository(owner, name);
      if (!repository) {
        spinner.fail(`Repository not found: ${repoId}`);
        process.exit(1);
      }

      spinner.succeed(`Found repository: ${repository.full_name}`);
      console.log();

      const commitSpinner = ora('Scanning commits...').start();
      const commits = await github.getCommits(owner, name, options.branch, parseInt(options.commits));
      commitSpinner.succeed(`Scanned ${commits.length} commits`);
      console.log();

      const scanSpinner = ora('Analyzing commit history...').start();
      const matches: SecretMatch[] = [];

      for (const commit of commits) {
        if (options.verbose) {
          scanSpinner.text = `Checking: ${commit.sha.substring(0, 7)}`;
        }

        const diff = await github.getCommitDiff(owner, name, commit.sha);

        for (const pattern of SECRET_PATTERNS) {
          const regex = new RegExp(pattern.regex, 'gi');
          const found = diff.match(regex);

          if (found) {
            matches.push({
              type: pattern.name,
              severity: pattern.severity,
              value: found[0],
              commit: commit.sha,
              author: commit.author,
              date: commit.date,
              file: commit.files?.[0] || 'unknown'
            });
          }
        }
      }

      scanSpinner.succeed(`Analysis complete: ${matches.length} secrets found`);
      console.log();

      if (matches.length === 0) {
        console.log(chalk.green.bold('✓ No secrets detected!'));
      } else {
        if (options.output === 'json') {
          console.log(JSON.stringify(matches, null, 2));
        } else {
          const table = new Table({
            head: [chalk.cyan('Type'), chalk.cyan('Severity'), chalk.cyan('Found'), chalk.cyan('Commit')],
            colWidths: [20, 10, 40, 10]
          });

          for (const match of matches) {
            const severity = match.severity === 'critical' ? chalk.red.bold(match.severity) :
                            match.severity === 'high' ? chalk.red(match.severity) :
                            match.severity === 'medium' ? chalk.yellow(match.severity) :
                            chalk.gray(match.severity);

            table.push([
              match.type,
              severity,
              match.value.substring(0, 37) + '...',
              match.commit.substring(0, 7)
            ]);
          }

          console.log(table.toString());
        }

        console.log();
        console.log(chalk.yellow.bold('⚠ Remediation needed!'));
        console.log(chalk.gray('Rotate these secrets immediately.'));
      }

      process.exit(matches.length > 0 ? 1 : 0);

    } catch (error) {
      spinner.fail('Scan failed');
      console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      process.exit(1);
    }
  });
