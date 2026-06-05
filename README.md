# 🔒 KeySpinner CLI

GitHub repository secret scanner - detect leaked API keys, tokens, and credentials before attackers find them.

## Features

- 🔍 **15+ secret patterns** - GitHub PATs, AWS keys, Stripe tokens, Slack webhooks, and more
- 🚀 **Fast scanning** - Parallel file fetching for quick results
- 📊 **Multiple output formats** - Console tables, JSON, Markdown
- 🔄 **PAT authentication** - Use your own GitHub token
- 🪝 **Pre-commit hooks** - Prevent committing secrets
- 📦 **Zero dependencies** - Works with `npx` immediately

## Installation

```bash
# Run directly with npx (recommended)
npx keyspinner-scan scan <repo>

# Or install globally
npm install -g keyspinner-scan
keyspinner scan <repo>
```

## GitHub Token Setup

KeySpinner requires a GitHub Personal Access Token (PAT) to scan repositories.

**Get a token:**
1. Go to https://github.com/settings/tokens
2. Generate a new token (classic)
3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
4. Save the token

**Use the token:**
```bash
# Option 1: Save token (stored in ~/.keyspinner/auth.json)
npx keyspinner-scan auth save <your-token>

# Option 2: Environment variable
export GITHUB_TOKEN=<your-token>
npx keyspinner-scan scan <repo>

# Option 3: Pass directly
npx keyspinner-scan scan <repo> --token <your-token>
```

## Usage Examples

### Scan a public repository

```bash
npx keyspinner-scan scan facebook/react
```

### Scan with different output formats

```bash
# Console table (default)
npx keyspinner-scan scan facebook/react --format console

# JSON output
npx keyspinner-scan scan facebook/react --format json

# Markdown report
npx keyspinner-scan scan facebook/react --format markdown
```

### Scan a specific branch

```bash
npx keyspinner-scan scan facebook/react --branch main
```

### Scan a private repository

```bash
# Requires repo scope on your token
npx keyspinner-scan scan your-org/private-repo
```

### Scan with verbose output

```bash
npx keyspinner-scan scan facebook/react --verbose
```

### Create remediation PR

```bash
npx keyspinner-scan scan myrepo --create-pr
```

## Commands

| Command | Description |
|---------|-------------|
| `scan <repo>` | Scan a repository for secrets |
| `auth save <token>` | Save GitHub token to config |
| `auth verify` | Verify stored token |
| `auth remove` | Remove stored token |
| `config` | Show configuration |
| `hook` | Show pre-commit hook script |
| `hook --install` | Install pre-commit hook |

## Pre-commit Hook

Install a pre-commit hook to prevent committing secrets:

```bash
npx keyspinner-scan hook --install
```

Or manually add to `.git/hooks/pre-commit`:
```bash
npx keyspinner-scan hook
```

## Detected Secret Types

- GitHub Personal Access Tokens (PAT)
- GitHub OAuth/App Tokens
- AWS Access Keys & Secret Keys
- Stripe API Keys (live & test)
- Slack Bot Tokens & Webhooks
- Docker Hub Tokens
- NPM Access Tokens
- Google API Keys
- Heroku API Keys

## Output Example

```
✔ Found 3 secrets in 142 files

┌────────────────────────────────┬─────────────────────────────────┬────────┬─────────────────┐
│ Type                           │ File                            │ Line   │ Secret          │
├────────────────────────────────┼─────────────────────────────────┼────────┼─────────────────┤
│ AWS Access Key ID              │ src/config.ts                   │ 12     │ AKIA...4F3A     │
│ Stripe API Key                 │ .env                            │ 5      │ pk_live_...9X2Y  │
│ Slack Token                    │ src/bot.ts                      │ 8      │ xoxb-...7Z8A     │
└────────────────────────────────┴─────────────────────────────────┴────────┴─────────────────┘

🚨 HIGH Severity (2)
⚠️  MEDIUM Severity (1)

⚠️  These secrets are now compromised!
Immediately rotate all affected credentials.
```

## License

MIT

## Links

- [GitHub](https://github.com/eylulsenakumral/keyspinner)
- [Security](https://github.com/eylulsenakumral/keyspinner/security)
# Pipeline Test
