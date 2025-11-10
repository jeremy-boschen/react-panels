# Release Guide

This document describes how to publish a new version of @jeremy-boschen/react-adjustable-panels to npm.

## Overview

**For contributors:** Update CHANGELOG.md `[Unreleased]` section in your PRs (it's in the PR checklist).

**For maintainers:** When ready to release, just push a version tag. Automation handles everything else.

## Prerequisites

One-time setup for maintainers:

1. **npm account** - https://www.npmjs.com/signup
2. **npm token** added to GitHub Secrets (see below)
3. **Write access** to the repository

## One-Time Setup: npm Token

### 1. Generate npm Automation Token

```bash
# Login to npm
npm login

# Generate an automation token
npm token create --type=automation
```

Copy the token that's displayed (starts with `npm_...`).

### 2. Add Token to GitHub Secrets

1. Go to https://github.com/jeremy-boschen/react-adjustable-panels/settings/secrets/actions
2. Click **"New repository secret"**
3. **Name:** `NPM_TOKEN`
4. **Value:** Paste your npm token (the one starting with `npm_...`)
5. Click **"Add secret"**

✅ **That's it!** The GitHub Actions workflow can now publish to npm automatically.

## Publishing a New Version

### The Simple Version

**CHANGELOG updates happen during PRs, not at release time!**

When you're ready to release:

```bash
# Create and push a version tag
git tag v1.2.3
git push origin v1.2.3

# Done! Automation handles the rest.
```

### What Happens Automatically

Once you push the tag, `.github/workflows/release.yml` automatically:

1. ✅ Updates `package.json` to match tag version
2. ✅ Moves CHANGELOG `[Unreleased]` → `[1.2.3] - 2025-11-10`
3. ✅ Creates new empty `[Unreleased]` section
4. ✅ Commits changes back to main
5. ✅ Installs dependencies and runs all tests
6. ✅ Builds the package
7. ✅ Publishes to npm with `--access public`
8. ✅ Creates GitHub Release with changelog as release notes

**Monitor progress:**
- Go to https://github.com/jeremy-boschen/react-adjustable-panels/actions
- Single "Release" workflow runs (~5-7 minutes)
- Everything happens in one workflow

**Verify success:**
- Check GitHub Releases: https://github.com/jeremy-boschen/react-adjustable-panels/releases
- Check npm: https://www.npmjs.com/package/@jeremy-boschen/react-adjustable-panels

## Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch (0.1.0 → 0.1.1)**: Bug fixes, documentation updates, internal changes
- **Minor (0.1.0 → 0.2.0)**: New features, non-breaking API additions
- **Major (0.1.0 → 1.0.0)**: Breaking changes, API removals

Examples:
```bash
git tag v0.1.1  # Patch: bug fixes
git tag v0.2.0  # Minor: new features
git tag v1.0.0  # Major: breaking changes
git push origin v0.1.1  # Push the tag
```

## Manual Publishing (Emergency Fallback)

If automation fails, you can publish manually using Yarn:

### Setup

```bash
# Enable corepack (manages Yarn versions)
corepack enable

# Install dependencies
yarn install

# Install Playwright browsers for tests
yarn setup:browsers
```

### Publish

```bash
# Update version in package.json
yarn version 0.1.2

# Run pre-publish checks
yarn publish:check  # Runs tests + build

# Publish to npm
yarn npm publish --access public
```

**Authentication options:**

1. **Environment variable (recommended):**
   ```bash
   export NPM_TOKEN=npm_your-token-here
   ```

2. **Yarn login:**
   ```bash
   yarn npm login
   ```

3. **Direct in .npmrc (never commit!):**
   ```
   //registry.npmjs.org/:_authToken=npm_your-token-here
   ```

## If Something Goes Wrong

### Unpublish a Version (within 72 hours)

```bash
# Use sparingly - breaks dependent projects!
npm unpublish @jeremy-boschen/react-adjustable-panels@0.1.1
```

### Deprecate a Version (preferred)

```bash
# Better than unpublishing
npm deprecate @jeremy-boschen/react-adjustable-panels@0.1.1 "Critical bug. Please upgrade to 0.1.2"
```

### Delete a GitHub Release

1. Go to https://github.com/jeremy-boschen/react-adjustable-panels/releases
2. Click the release → **"Delete"**
3. Note: This doesn't unpublish from npm!

### Fix a Failed Release

If automation fails mid-release:

1. Check Actions tab for error details
2. Fix the issue (usually a failing test)
3. Delete the tag locally and remotely:
   ```bash
   git tag -d v1.2.3
   git push origin :refs/tags/v1.2.3
   ```
4. Push a new tag once fixed

## Troubleshooting

### "npm publish failed with 403"

- Check `NPM_TOKEN` secret is set correctly in GitHub
- Verify your npm account has permission to publish to `@jeremy-boschen` scope
- Token may have expired - generate a new one

### "Tests failed"

- Workflow won't publish if tests fail (by design)
- Fix the tests locally: `yarn test`
- Push fixes to main
- Create new release tag

### "Package already exists"

- You tried to publish a version that already exists
- Delete the tag and create a new one with incremented version

### "Tag already exists"

```bash
# Delete local tag
git tag -d v1.2.3

# Delete remote tag
git push origin :refs/tags/v1.2.3

# Create new tag
git tag v1.2.4
git push origin v1.2.4
```

## Best Practices

✅ **DO:**
- Update CHANGELOG.md in every PR that makes user-facing changes
- Test locally before releasing: `yarn test && yarn build`
- Follow semantic versioning strictly
- Use descriptive changelog entries
- Double-check the tag version before pushing

❌ **DON'T:**
- Push tags for unreleased work
- Skip CHANGELOG updates in PRs
- Publish directly via `yarn npm publish` (use tags instead)
- Unpublish versions unless absolutely necessary (use deprecate)
- Rush releases without testing

## Why This Workflow?

**Security:** Only maintainers with push access can create tags (same as manual releases).

**Reliability:** Automation eliminates human error in version bumps, changelog updates, and release notes.

**Consistency:** CHANGELOG, package.json, GitHub Releases, and npm always stay in sync.

**Speed:** Push a tag and walk away. No manual steps.

## Questions?

- Open an issue: https://github.com/jeremy-boschen/react-adjustable-panels/issues
- Start a discussion: https://github.com/jeremy-boschen/react-adjustable-panels/discussions
