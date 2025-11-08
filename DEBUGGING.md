# Debugging Guide

## Using React DevTools Profiler

The demo app is configured to work with React DevTools for performance profiling and debugging.

## ⚠️ Known Issue: Microsoft Edge

There is a **known bug in Microsoft Edge** React DevTools extension (as of November 2025):
- Components/Profiler tabs show "This page doesn't have React"
- Sources tab becomes empty or unresponsive
- Issue tracked here: https://github.com/facebook/react/issues/35055

**Workarounds:**
1. **Use Chrome or Firefox** (recommended) - React DevTools works correctly
2. **Use standalone React DevTools** (see below) - works in any browser

### Setup

**Option 1: Browser Extension (Chrome/Firefox only)**
   - [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   - ~~Edge~~ (currently broken, use standalone instead)

**Option 2: Standalone React DevTools (works everywhere)**

1. **Install standalone React DevTools:**
   ```bash
   npm install -g react-devtools
   ```

2. **Start React DevTools (in a separate terminal):**
   ```bash
   react-devtools
   ```
   This opens a desktop app that listens on port 8097.

3. **Run the demo in development mode:**
   ```bash
   yarn dev:demo
   ```
   The demo will open at http://localhost:3000 and connect to standalone DevTools automatically.

### Using the Profiler

**With Browser Extension (Chrome/Firefox):**
1. Open DevTools (F12)
2. Navigate to the "⚛️ Components" or "⚛️ Profiler" tab
3. You should see the component tree

**With Standalone DevTools:**
1. The standalone window should automatically show your app
2. Use the Components or Profiler tabs in the standalone window

**Profile Panel Resizing:**
   - Click the "⏺ Record" button in the Profiler tab
   - Drag resize handles in the demo
   - Click "⏹ Stop" to see the performance data

**Analyze Performance:**
   - **Flame Graph:** Shows component render hierarchy and timing
   - **Ranked Chart:** Lists components by render time
   - **Component Chart:** Shows individual component performance over time

### What to Look For

When profiling panel resizing:

- **ResizeHandle** - Should show minimal renders (only during drag start/end)
- **PanelGroup** - Renders during resize (expected, updates panel sizes)
- **Panel** - Individual panels should re-render during resize (expected)

### Debugging Tips

#### Check if Profiler is Working

If the Profiler shows no data:
1. Make sure you're running `yarn dev:demo` (not a production build)
2. Verify React DevTools extension is installed and enabled
3. Try refreshing the page with DevTools open
4. Check the console for any errors

#### Performance Debugging

```bash
# Run with React strict mode checks
yarn dev:demo:debug

# Check bundle size
yarn build:demo
cd demo/dist-demo && npx vite-bundle-visualizer

# Profile with Chrome Performance tab
# 1. Open Chrome DevTools → Performance tab
# 2. Click Record
# 3. Interact with panels
# 4. Stop recording
# 5. Look for "React" sections in the flame graph
```

#### Common Issues

**Issue:** "This page doesn't have React" in Microsoft Edge
- **Root Cause:** Known bug in Edge React DevTools extension (Nov 2025)
- **Solution 1:** Use Chrome or Firefox instead
- **Solution 2:** Use standalone React DevTools: `npm install -g react-devtools && react-devtools`
- **Tracking:** https://github.com/facebook/react/issues/35055

**Issue:** "This page doesn't have React" in Chrome/Firefox
- **Solution 1:** Hard refresh with `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- **Solution 2:** Open DevTools BEFORE loading the page
- **Solution 3:** Check Console tab for JavaScript errors
- **Solution 4:** Update React DevTools extension to latest version

**Issue:** Profiler shows "No profiling data recorded"
- **Solution:** Make sure you clicked Record BEFORE interacting with the app

**Issue:** Sources tab is empty
- **Solution 1:** This often happens with the Edge bug - switch to Chrome
- **Solution 2:** Hard refresh the page
- **Solution 3:** Clear browser cache

### Source Maps

Source maps are enabled in development mode, so you can:
- Set breakpoints in TypeScript source files
- Debug with original source code (not transpiled)
- See stack traces with original file names

### Environment Variables

The demo runs with these settings in development:

```typescript
{
  __DEV__: true,  // Development mode flag
  server: {
    port: 3000,
    open: true,
    sourcemapIgnoreList: false  // Show all source maps
  }
}
```

## Performance Optimization Tips

When profiling shows performance issues:

1. **Check for unnecessary renders:**
   - Use React.memo() for expensive components
   - Use useMemo() for expensive calculations
   - Use useCallback() for event handlers passed to children

2. **Profile with realistic data:**
   - Test with multiple panels (3-5 panels)
   - Test with nested panel groups
   - Test with larger container sizes

3. **Compare with production build:**
   ```bash
   yarn build:demo
   cd demo && npx serve dist-demo
   ```
   Production builds are significantly faster due to optimizations.

## Related Tools

- **React DevTools:** Component inspection and profiling
- **Chrome Performance Tab:** Low-level performance profiling
- **Lighthouse:** Overall page performance metrics
- **Vite DevTools:** Bundle analysis and optimization

## Troubleshooting

If you encounter issues:

1. Clear browser cache and hard refresh
2. Delete `node_modules` and `yarn.lock`, then run `yarn install`
3. Check that you're using Node 20+: `node --version`
4. Ensure React DevTools extension is up to date

For more help, open an issue on GitHub.
