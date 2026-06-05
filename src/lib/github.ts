/**
 * GitHub API client helper functions (PAT authentication)
 */

import { Octokit } from '@octokit/rest';

export interface GitHubFileContent {
  path: string;
  sha: string;
  content: string;
  encoding: string;
}

export interface GitHubCommit {
  sha: string;
  url: string;
  message: string;
}

export interface RemediationCommit {
  path: string;
  content: string;
  message: string;
}

/**
 * Get an authenticated Octokit instance using PAT
 */
export function getPATClient(token: string): Octokit {
  return new Octokit({ auth: token });
}

/**
 * Fetch file content from a GitHub repository
 */
export async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<GitHubFileContent | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if ('content' in data && data.type === 'file') {
      return {
        path: data.path,
        sha: data.sha,
        content: Buffer.from(data.content, 'base64').toString('utf-8'),
        encoding: data.encoding,
      };
    }

    return null;
  } catch (error) {
    // File not found or no access
    return null;
  }
}

/**
 * List all files in a repository tree
 */
export async function listRepositoryFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch?: string,
  path?: string
): Promise<string[]> {
  const files: string[] = [];

  try {
    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: branch ?? 'HEAD',
      recursive: 'true',
    });

    for (const item of data.tree) {
      if (item.type === 'blob' && item.path) {
        // Skip common non-code directories
        if (
          !item.path.startsWith('node_modules/') &&
          !item.path.startsWith('.git/') &&
          !item.path.startsWith('dist/') &&
          !item.path.startsWith('build/') &&
          !item.path.endsWith('.lock') &&
          !item.path.endsWith('.sum')
        ) {
          files.push(item.path);
        }
      }
    }
  } catch (error) {
    console.error('Failed to list repository files:', error);
  }

  return files;
}

/**
 * Get the latest commit SHA from a branch
 */
export async function getBranchHead(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    });
    return data.commit.sha;
  } catch (error) {
    return null;
  }
}

/**
 * Create a pull request for secret remediation
 */
export async function createRemediationPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  baseBranch: string,
  title: string,
  body: string,
  remediationCommits: RemediationCommit[]
): Promise<{ number: number; url: string } | null> {
  const remediationBranch = `keyspinner/remediate-${Date.now()}`;

  try {
    // Get the default branch reference
    const { data: ref } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    // Create remediation branch
    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${remediationBranch}`,
      sha: ref.object.sha,
    });

    // Get the current commit
    const { data: baseCommit } = await octokit.rest.git.getCommit({
      owner,
      repo,
      commit_sha: ref.object.sha,
    });

    let treeSha = baseCommit.tree.sha;

    // Create blobs and tree for remediation
    const treeEntries = [];

    for (const commit of remediationCommits) {
      // Create blob for remediated content
      const { data: blob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: Buffer.from(commit.content).toString('base64'),
        encoding: 'base64',
      });

      treeEntries.push({
        path: commit.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blob.sha,
      });
    }

    // Create tree with all remediated files
    if (treeEntries.length > 0) {
      const { data: newTree } = await octokit.rest.git.createTree({
        owner,
        repo,
        tree: treeEntries,
        base_tree: treeSha,
      });

      treeSha = newTree.sha;
    }

    // Create commit
    const { data: newCommit } = await octokit.rest.git.createCommit({
      owner,
      repo,
      message: `🔒 Security: Remove detected secrets\n\n${remediationCommits.length} file(s) remediated by KeySpinner`,
      tree: treeSha,
      parents: [baseCommit.sha],
    });

    // Update branch reference
    await octokit.rest.git.updateRef({
      owner,
      repo,
      ref: `heads/${remediationBranch}`,
      sha: newCommit.sha,
    });

    // Create the PR
    const { data: pr } = await octokit.rest.pulls.create({
      owner,
      repo,
      title,
      body,
      head: remediationBranch,
      base: baseBranch,
    });

    return {
      number: pr.number,
      url: pr.html_url,
    };
  } catch (error) {
    console.error('Failed to create remediation PR:', error);
    return null;
  }
}

/**
 * Get repository default branch
 */
export async function getDefaultBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });
    return data.default_branch;
  } catch (error) {
    return null;
  }
}

/**
 * Verify PAT has required scopes
 */
export async function verifyTokenScopes(token: string): Promise<{
  valid: boolean;
  scopes: string[];
  login?: string;
}> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    });

    if (!response.ok) {
      return { valid: false, scopes: [] };
    }

    const scopes = (response.headers.get('X-OAuth-Scopes') ?? '').split(',').filter(Boolean);
    const data = await response.json();

    return {
      valid: true,
      scopes,
      login: data.login,
    };
  } catch (error) {
    return { valid: false, scopes: [] };
  }
}
