# AI Agent Instructions for react-adjustable-panels

This file contains important instructions for AI agents (like Claude Code, GitHub Copilot, etc.) working on this repository.

## Package Manager

**Always use Yarn, never npm!**

This project uses **Yarn 4.11.0** managed via Corepack.

```bash
# Enable Corepack first (one-time setup)
corepack enable

# Then install dependencies
yarn install
```

## Running Tests

### Quick Testing (No Playwright Dependencies)

**Use this for fast iteration and CI environments without browser dependencies:**

```bash
yarn vitest run --browser.enabled=false --environment jsdom --exclude '**/*.profiler.test.{ts,tsx}' --exclude '**/performance-regression.test.{ts,tsx}'
```

This runs tests in jsdom instead of real browsers and skips performance tests.

### Full Browser Testing (Requires Playwright)

The full test suite runs in 3 browsers (Chromium, Firefox, WebKit) simultaneously:

```bash
# First-time setup: Install Playwright browsers (~500MB)
yarn setup:browsers

# Then run full tests
yarn test

# Watch mode
yarn test:watch
```

### Test Coverage

```bash
yarn test:coverage
```

Coverage thresholds: **90%+** for branches, functions, lines, and statements.

## Code Quality

### Type Checking

```bash
yarn typecheck
```

### Linting and Formatting

This project uses **Biome** (not ESLint/Prettier):

```bash
# Check code
yarn lint

# Auto-fix issues
yarn lint:fix

# Format code
yarn format
```

## Building

```bash
yarn build
```

Builds to `dist/` directory. The build includes:
- Transpiled JavaScript (ESM)
- TypeScript declaration files (.d.ts)
- Bundled CSS (style.css)

## CHANGELOG Updates

**CRITICAL: Update CHANGELOG.md in every PR that makes user-facing changes!**

Add entries under the `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- New feature description

### Changed
- Changed behavior description

### Fixed
- Bug fix description

### Breaking Changes
- Breaking change description
```

The release automation will automatically move these to a versioned section when a release is created.

## Commit Guidelines

- Use clear, descriptive commit messages
- Follow conventional commit format when possible: `fix:`, `feat:`, `docs:`, `test:`, `refactor:`
- Reference issues when applicable: `fix: Handle undefined minSize prop (#123)`
- Keep commits focused and atomic

## Pull Request Checklist

Before creating a PR, ensure:

- [ ] Tests added for new features
- [ ] All tests pass: `yarn test` (or use jsdom variant for quick iteration)
- [ ] Type checking passes: `yarn typecheck`
- [ ] Linting passes: `yarn lint`
- [ ] Build succeeds: `yarn build`
- [ ] CHANGELOG.md updated in `[Unreleased]` section
- [ ] Test coverage maintained at 90%+

## Creating a Pull Request

### PR Title Format

Use conventional commit format:
- `fix: Brief description` - Bug fixes
- `feat: Brief description` - New features
- `refactor: Brief description` - Code refactoring
- `test: Brief description` - Test additions/improvements
- `docs: Brief description` - Documentation changes

### PR Description Template

Include these sections in your PR description:

```markdown
## Summary
Brief overview of what this PR does and why

Fixes #[issue-number]

## Changes
- Bullet list of changes
- Be specific about what was modified

## Testing
- [ ] All existing tests pass
- [ ] Added X new test cases covering:
  - Specific test scenario 1
  - Specific test scenario 2

## Example Usage (if applicable)
\`\`\`tsx
// Code example showing the change
\`\`\`

## Checklist
- [ ] Tests added for new features
- [ ] All tests pass
- [ ] Type checking passes
- [ ] Linting passes
- [ ] Build succeeds
- [ ] CHANGELOG.md updated
- [ ] Test coverage maintained at 90%+
```

### Creating the PR

**Using GitHub CLI (recommended):**

```bash
# Ensure all changes are committed and pushed
git push -u origin your-branch-name

# Create PR with title and body
gh pr create \
  --title "fix: Handle undefined minSize prop" \
  --body "$(cat PR_DESCRIPTION.md)" \
  --base main

# Or create PR interactively
gh pr create
```

**Using GitHub Web UI:**

1. Go to repository on GitHub
2. Click "Pull requests" tab
3. Click "New pull request"
4. Select your branch
5. Fill in title and description
6. Click "Create pull request"

### After Creating PR

- Watch for CI checks to complete
- Address any review feedback
- Keep PR updated with main if needed:
  ```bash
  git checkout main
  git pull origin main
  git checkout your-branch-name
  git rebase main
  git push --force-with-lease
  ```

## Testing Best Practices

### Writing Tests

1. **Add tests for all new features** - Every new feature needs test coverage
2. **Test edge cases** - Include tests for undefined props, invalid inputs, boundary conditions
3. **Use meaningful test names** - Describe what the test does: `it('handles minSize={undefined} without errors')`
4. **Follow existing patterns** - Look at existing tests in `src/__tests__/` for examples

### Test Files

- `src/__tests__/utils.test.ts` - Utility functions (size calculations, parsing)
- `src/__tests__/Panel.test.tsx` - Panel component tests
- `src/__tests__/PanelGroup.test.tsx` - PanelGroup integration tests
- `src/__tests__/ResizeHandle.test.tsx` - ResizeHandle component tests
- `src/__tests__/PanelGroup.profiler.test.tsx` - Performance profiling tests
- `src/__tests__/performance-regression.test.tsx` - Performance regression tests

## Common Tasks

### Running Specific Tests

```bash
# Run only one test file
yarn vitest run --browser.enabled=false src/__tests__/utils.test.ts

# Run tests matching a pattern
yarn vitest run --browser.enabled=false -t "handles undefined"

# Run in watch mode for specific file
yarn vitest --browser.enabled=false src/__tests__/utils.test.ts
```

### Debugging Tests

See [DEBUGGING.md](./DEBUGGING.md) for detailed debugging instructions.

### Performance Testing

```bash
# Run performance tests (not run by default)
yarn test:perf

# Run benchmarks
yarn bench
```

## Project Structure

```
src/
├── Panel.tsx              # Panel component
├── PanelGroup.tsx         # PanelGroup component (main logic)
├── ResizeHandle.tsx       # ResizeHandle component
├── utils.ts               # Utility functions (parseSize, formatSize, calculateSizes)
├── types.ts               # TypeScript type definitions
├── childUtils.ts          # React children traversal utilities
├── index.ts               # Public API exports
└── __tests__/             # Test files
    ├── Panel.test.tsx
    ├── PanelGroup.test.tsx
    ├── ResizeHandle.test.tsx
    └── utils.test.ts
```

## Important Patterns

### Size Handling

This library supports multiple size formats:
- `"200px"` - Absolute pixels
- `"50%"` - Percentage of container
- `"auto"` or `"*"` - Auto-fill remaining space
- `undefined` - Treated as `"auto"`

### Defensive Programming

When working with size props, always handle `undefined`:

```typescript
// Good
const validSize = size ?? 'auto';

// Bad
const pixels = parseSize(size); // May fail if size is undefined from state sync issues
```

### State Synchronization

Panel sizes are stored in multiple places (state, refs). Always ensure synchronization:
- `panelSizes` (state) - User-facing sizes
- `originalUnitsRef` - Original units for each panel
- `currentPixelSizesRef` - Current pixel sizes
- `constraintsRef` - Min/max size constraints

## Release Process (For Maintainers)

**Contributors:** Update CHANGELOG.md in your PRs.

**Maintainers:** Push a version tag to trigger automated release:

```bash
# Create and push tag
git tag v1.2.3
git push origin v1.2.3
```

The release workflow automatically:
1. Updates package.json version
2. Moves CHANGELOG [Unreleased] to versioned section
3. Runs tests and builds
4. Publishes to npm
5. Creates GitHub Release

See [RELEASING.md](./RELEASING.md) for full details.

## Troubleshooting

### "vitest: not found" or "playwright: not found"

Run `yarn install` to ensure all dependencies are installed.

### "Executable doesn't exist" (Playwright browsers)

Run `yarn setup:browsers` to download browser binaries.

### Tests failing in CI but passing locally

- CI uses full browser testing - run `yarn test` locally to reproduce
- Or use the quick jsdom variant to debug faster

### "Package manager should be yarn but found npm"

This project is configured for Yarn via `packageManager` in package.json. Always use `yarn` commands, not `npm`.

## Additional Resources

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [TESTING.md](./TESTING.md) - Detailed testing guide
- [RELEASING.md](./RELEASING.md) - Release process
- [DEBUGGING.md](./DEBUGGING.md) - Debugging guide
- [PERFORMANCE.md](./PERFORMANCE.md) - Performance optimization guide

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `corepack enable && yarn install` |
| Quick tests | `yarn vitest run --browser.enabled=false --environment jsdom --exclude '**/*.profiler.test.{ts,tsx}' --exclude '**/performance-regression.test.{ts,tsx}'` |
| Full tests | `yarn test` |
| Watch mode | `yarn test:watch` |
| Type check | `yarn typecheck` |
| Lint | `yarn lint` |
| Format | `yarn format` |
| Build | `yarn build` |
| Setup browsers | `yarn setup:browsers` |

## Questions or Issues?

- Check existing documentation in this repository
- Open an issue: https://github.com/jeremy-boschen/react-adjustable-panels/issues
- Start a discussion: https://github.com/jeremy-boschen/react-adjustable-panels/discussions
