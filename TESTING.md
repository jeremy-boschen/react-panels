# Testing Guide

## Browser Mode Testing

This project uses **Vitest browser mode** with Playwright for testing in real browser environments across **3 browsers simultaneously**.

## Running Tests

### All Browsers (Default)
```bash
npm test
```

Runs all tests across **3 browsers**:
- **Chromium** - Chrome, Edge, Brave, Opera (Chromium-based)
- **Firefox** - Firefox (Gecko engine)
- **WebKit** - Safari (WebKit engine)

Each test runs in all 3 browsers to ensure cross-browser compatibility.

### Watch Mode
```bash
npm run test:watch
```

Tests will re-run automatically when files change across all 3 browsers.

## Browser Installation

Before running tests, you need to install the Playwright browsers (one-time setup):

```bash
yarn setup:browsers
```

This downloads Chromium, Firefox, and WebKit (~500MB). You only need to run this once.

### System Dependencies (Linux)

On Linux, you may need system dependencies:

```bash
yarn dlx playwright install-deps
```

## Coverage

*Coming soon*

## Test Structure

- `src/__tests__/utils.test.ts` - Utility functions (size calculations, parsing)
- `src/__tests__/Panel.test.tsx` - Panel component
- `src/__tests__/PanelGroup.test.tsx` - PanelGroup integration tests
- `src/__tests__/ResizeHandle.test.tsx` - ResizeHandle component

## Why 3 Browsers?

Testing across all major browser engines ensures compatibility for all users:

- **Chromium** (~80% market share) - Chrome, Edge, Brave, Opera
- **Firefox** (~5% market share) - Catches Gecko-specific rendering bugs
- **WebKit** (~15% market share) - Safari on Mac/iOS devices

## Troubleshooting

### Firefox Permission Errors (Docker/CI)
Firefox may fail in Docker with "Running as root" errors. This is a Docker limitation and tests will work on local machines.

### Slow Test Execution
Browser mode tests are slower than jsdom (~5-10x). This is expected - we're testing in real browsers for accuracy.
