/**
 * Core types for KeySpinner CLI
 */

export interface SecretFinding {
  type: string;
  file: string;
  line: number;
  column: number;
  masked: string;
  severity: 'high' | 'medium' | 'low';
  entropy?: number;
}

export interface ScanResult {
  repo: string;
  owner: string;
  branch: string;
  commitSha: string;
  filesScanned: number;
  secretsFound: number;
  findings: SecretFinding[];
  durationMs: number;
}

export interface AuthConfig {
  token: string;
  storedAt?: number;
}

export interface ScanOptions {
  format: 'console' | 'json' | 'markdown';
  branch?: string;
  createPR?: boolean;
  verbose?: boolean;
}

export interface PreCommitHookOptions {
  branch?: string;
  allowList?: string[];
}
