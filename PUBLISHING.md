# Publishing to NPM with Yarn

This project uses **Yarn 4** (Modern/Berry) for development and publishing because it handles optional dependencies more reliably on Windows.

## Setup (One-time)

### 1. Create an NPM Access Token

1. Log in to [npmjs.com](https://www.npmjs.com/)
2. Go to your account settings → Access Tokens
3. Click "Generate New Token" → "Classic Token"
4. Select "Automation" type (for CI/CD) or "Publish" (for manual publishing)
5. Copy the token (it starts with `npm_...`)

### 2. Configure Authentication

You have three options:

#### Option A: Environment Variable (Recommended)

Add to your shell profile (`.bashrc`, `.zshrc`, or PowerShell profile):

**Windows (PowerShell):**
```powershell
$env:NPM_TOKEN = "your-token-here"
# Or add to your PowerShell profile permanently:
[System.Environment]::SetEnvironmentVariable('NPM_TOKEN', 'your-token-here', 'User')
```

**macOS/Linux:**
```bash
export NPM_TOKEN=your-token-here
# Add to ~/.bashrc or ~/.zshrc for persistence
```

Then uncomment this line in `.npmrc`:
```
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

#### Option B: Direct Token in .npmrc (Not Recommended for Public Repos)

Add directly to `.npmrc`:
```
//registry.npmjs.org/:_authToken=npm_your-token-here
```

**⚠️ Warning:** Never commit your `.npmrc` with a real token to a public repository!

#### Option C: Use `yarn npm login`

If using Yarn v2+:
```bash
yarn npm login
```

This will prompt for your npm credentials and store them securely.

## Publishing Process

### Using Yarn Modern (v4) - Recommended

This project uses **Yarn 4** (Modern/Berry) which provides excellent Windows support and handles optional dependencies reliably.

#### First-time Setup

1. **Enable Corepack** (manages Yarn versions automatically):
   ```bash
   corepack enable
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```

   This will automatically:
   - Install all npm packages
   - Download Playwright browser binaries (Chromium, Firefox, WebKit)

   **Note:** You may see a harmless rollup postinstall warning about `patch-package`. This doesn't affect functionality. To eliminate the warning:
   ```bash
   npm install -g patch-package
   ```

3. **Verify tests pass:**
   ```bash
   yarn test
   ```

   This runs all tests across 3 browsers (Chromium, Firefox, WebKit) to ensure cross-browser compatibility.

#### Publishing Workflow

1. **Update version:**
   ```bash
   yarn version patch   # 0.1.0 -> 0.1.1
   yarn version minor   # 0.1.0 -> 0.2.0
   yarn version major   # 0.1.0 -> 1.0.0
   ```

2. **Publish:**
   ```bash
   yarn npm publish --access public
   ```

   Or use the convenient script:
   ```bash
   yarn publish:npm
   ```

#### Yarn Modern Features

- ✅ **Zero-Install ready** (optional - can commit .yarn/cache for faster CI)
- ✅ **Built-in patching** (no need for patch-package)
- ✅ **Excellent Windows support**
- ✅ **Faster installs** with better caching
- ✅ **Workspace support** for monorepos

## Pre-publish Checklist

The `prepublishOnly` script automatically runs before publishing:
- ✅ Runs all tests (`yarn test`) across all 3 browsers
- ✅ Builds the package (`yarn build`)

If either fails, publishing is aborted.

## Verify Published Package

After publishing:
```bash
# Check the published version
yarn info @jeremy-boschen/react-adjustable-panels

# Install in a test project
yarn add @jeremy-boschen/react-adjustable-panels
```

## Troubleshooting

### "Unable to authenticate"

1. Verify your token is correct: `echo $NPM_TOKEN` (Unix) or `$env:NPM_TOKEN` (Windows)
2. Check `.npmrc` has the correct registry URL
3. Try `yarn npm whoami` to verify authentication

### "Package already exists"

You forgot to bump the version. Run:
```bash
yarn version --patch
```

### "Package not found" after publishing

- It can take a few minutes for npm to index your package
- Check npmjs.com/package/@jeremy-boschen/react-adjustable-panels
- Verify the package name in `package.json` is correct

## CI/CD Publishing (GitHub Actions)

Add your NPM token to GitHub repository secrets:
1. Go to repository Settings → Secrets and variables → Actions
2. Add new secret: `NPM_TOKEN` with your token value

Example workflow:
```yaml
name: Publish to NPM

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: corepack enable
      - run: yarn install
      - run: yarn test
      - run: yarn build
      - run: yarn npm publish --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Package Manager Compatibility

This project works with:
- ✅ **yarn** (recommended for development on Windows)
- ✅ npm
- ✅ pnpm

All package managers can consume the published package. We use yarn for development because it handles rollup's optional dependencies more reliably on Windows.

## Testing on Windows

The browser-based tests use Playwright. Browser binaries are automatically downloaded during `yarn install` via the postinstall script.

```bash
# Windows - install dependencies and browsers
yarn install

# Run tests (all 3 browsers: Chromium, Firefox, WebKit)
yarn test
```

The `postinstall` script runs `playwright install chromium firefox webkit` automatically, so you don't need any manual steps.

Tests run in headless mode by default across all 3 browsers to ensure cross-browser compatibility.
