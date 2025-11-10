# Release Guide

This document describes how to publish a new version of @jeremy-boschen/react-adjustable-panels to npm.

## Prerequisites

Before you can publish, ensure you have:

1. **npm account** - https://www.npmjs.com/signup
2. **npm token** added to GitHub Secrets (one-time setup - see below)
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

✅ **That's it!** You only need to do this once. The GitHub Actions workflow will now be able to publish to npm automatically.

## Publishing a New Version

### Step 1: Update CHANGELOG.md

Add your changes to the `[Unreleased]` section of `CHANGELOG.md`:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description
```

Commit and push this to main:

```bash
git add CHANGELOG.md
git commit -m "docs: Update changelog for vX.Y.Z"
git push origin main
```

### Step 2: Create and Push Version Tag

```bash
# For a patch release (bug fixes): 0.1.0 → 0.1.1
git tag v0.1.1

# For a minor release (new features): 0.1.0 → 0.2.0
git tag v0.2.0

# For a major release (breaking changes): 0.1.0 → 1.0.0
git tag v1.0.0

# Push the tag
git push origin v0.1.1  # (use your version)
```

### Step 3: Watch the Magic Happen! ✨

Once you push the tag, the release workflow (`.github/workflows/release.yml`) will automatically:

1. ✅ Update `package.json` to match the tag version
2. ✅ Move CHANGELOG `[Unreleased]` section to `[X.Y.Z] - YYYY-MM-DD`
3. ✅ Commit these changes back to main
4. ✅ Create GitHub Release with changelog content as release notes
5. ✅ Trigger npm publish workflow which:
   - Runs all tests
   - Builds the package
   - Publishes to npm with `--access public`

**Monitor the workflows:**
- Go to https://github.com/jeremy-boschen/react-adjustable-panels/actions
- You'll see "Release" workflow running first
- Followed by "Publish to npm" workflow
- Takes about 3-5 minutes total

**When it completes:**
- Check GitHub Releases: https://github.com/jeremy-boschen/react-adjustable-panels/releases
- Check npm: https://www.npmjs.com/package/@jeremy-boschen/react-adjustable-panels
- Your new version should be live!

### Step 4: Verify Publication

```bash
# Check the latest version on npm
npm view @jeremy-boschen/react-adjustable-panels version

# Test installation
npm install @jeremy-boschen/react-adjustable-panels@latest
```

## Versioning Guidelines

Follow [Semantic Versioning](https://semver.org/):

- **Patch (0.1.0 → 0.1.1)**: Bug fixes, documentation updates, internal changes
- **Minor (0.1.0 → 0.2.0)**: New features, non-breaking API additions
- **Major (0.1.0 → 1.0.0)**: Breaking changes, API removals

## If Something Goes Wrong

### Unpublish a Version (within 72 hours)

```bash
# Unpublish a specific version (use sparingly!)
npm unpublish @jeremy-boschen/react-adjustable-panels@0.1.1

# Note: npm only allows unpublishing within 72 hours
```

### Deprecate a Version (preferred)

```bash
# Deprecate a version (better than unpublishing)
npm deprecate @jeremy-boschen/react-adjustable-panels@0.1.1 "This version has a critical bug. Please upgrade to 0.1.2"
```

### Delete a GitHub Release

1. Go to https://github.com/jeremy-boschen/react-adjustable-panels/releases
2. Click the release
3. Click **"Delete"**
4. Note: This doesn't unpublish from npm!

## Troubleshooting

### "npm publish failed with 403"

- Check that `NPM_TOKEN` secret is set correctly
- Verify your npm account has permission to publish to `@jeremy-boschen` scope

### "Tests failed"

- The workflow will not publish if tests fail
- Fix the tests and create a new release

### "Package already exists"

- You tried to publish a version that already exists
- Bump the version number and try again

## Best Practices

✅ **DO:**
- Test locally before releasing (`yarn test && yarn build`)
- Write clear release notes
- Follow semantic versioning
- Keep a changelog up to date

❌ **DON'T:**
- Rush releases without testing
- Skip version bumps
- Publish directly via `npm publish` (use GitHub releases instead)
- Unpublish versions if possible (use deprecate instead)

## Questions?

- Open an issue: https://github.com/jeremy-boschen/react-adjustable-panels/issues
- Start a discussion: https://github.com/jeremy-boschen/react-adjustable-panels/discussions
