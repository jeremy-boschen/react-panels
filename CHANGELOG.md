# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **CRITICAL:** Fixed DOM measurement timing by replacing `useEffect` with `useLayoutEffect` for synchronous measurements
  - Prevents FOUC (Flash of Unstyled Content) and race conditions
  - Ensures measurements happen before paint for correct initial layout
  - Added `useIsomorphicLayoutEffect` utility for SSR compatibility
- **CRITICAL:** Fixed constraint cache invalidation bug where dynamic `minSize`/`maxSize` prop changes wouldn't trigger recalculation
  - Added constraint hash tracking to detect when constraint props change
  - Prevents stale layout when constraints are updated dynamically
- **HIGH:** Fixed React 18 concurrent mode compatibility by replacing `setTimeout` with `queueMicrotask` (5 occurrences)
  - Ensures callbacks execute in microtask queue for predictable timing
  - Eliminates test flakiness from time-based delays
  - Better integration with React 18's rendering pipeline
- **HIGH:** Eliminated ref array synchronization bugs by consolidating 8 separate ref arrays into single `panelDataRef` structure
  - Prevents index-out-of-bounds errors and synchronization issues
  - Makes it impossible for panel data to get out of sync by design
  - Improves cache locality and performance
  - Optimized property names for bundle size (saves ~300-400 bytes)
- **HIGH:** Fixed initialization race condition where useEffect ran twice before useLayoutEffect
  - Changed dependency array from `[children, panelSizes.length]` to `[children]`
  - Prevents preservation of zero values during React 18 concurrent rendering
- **MEDIUM:** Fixed division-by-zero bug when container has zero size (hidden/display:none elements)
  - Added guard in `convertToPixels` with helpful console warning
  - Prevents NaN propagation and render failures

### Changed

- **BREAKING:** Removed mutation detection in resize callbacks - callbacks now use return-only API
  - Migration: Return new array from callbacks instead of mutating `currentSizes`
  - Before: `onResize={(info) => { info.currentSizes[0].size = '300px'; }}`
  - After: `onResize={(info) => [{ size: '300px', pixels: 300, percent: 30 }, ...info.currentSizes.slice(1)]}`
  - Updated `ResizeInfo` documentation in types.ts to specify return-only behavior
- **Code quality:** Removed all defensive null/undefined checks that cannot be tested
  - Follows fail-fast principle: let bugs surface with clear stack traces
  - Removed ~80 lines of untestable defensive code
  - If invariants are violated, errors now surface immediately instead of being silently masked

### Performance

- Eliminated 2 array clones per drag event by removing mutation detection (significant GC pressure reduction)
- Optimized constraint hash calculation by replacing `JSON.stringify` with string concatenation
  - Format: `"minSize:maxSize|minSize:maxSize|..."` for faster, more memory-efficient hashing
  - Only hashes values that matter (minSize and maxSize)
- Optimized PanelData property names for smaller bundle size
  - Shortened property names (e.g., `currentPixelSize` → `current`)
  - Saves ~300-400 bytes in minified bundle

### Internal

- **Refactored ref management:** Consolidated 8 separate ref arrays into single `PanelData[]` structure
  - **Before:** Separate refs for `currentPixelSizes`, `dragStartPixelSizes`, `previousPixelSizes`, `constraints`, `originalUnits`, `collapsedSize`, `collapsedState`, `collapseCallbacks`
  - **After:** Single `panelDataRef` with structured `PanelData` objects containing all panel-related state
  - **Benefits:**
    - Eliminates synchronization bugs by design (impossible for arrays to have different lengths)
    - Automatic bounds checking (single array length to validate)
    - Better cache locality (related data stored together)
    - More maintainable and easier to reason about
  - **Implementation notes:**
    - Preserved pixel sizes when props change to maintain state continuity
    - Updated all 30+ ref access locations throughout PanelGroup.tsx
    - Added comprehensive inline documentation explaining the consolidation

### Documentation

- Added comprehensive correctness-first analysis document (`docs/correctness-and-bugs-analysis.md`)
  - Identified and documented 14 potential issues across correctness, bugs, maintainability, and performance
  - Detailed reproduction scenarios and fixes for each issue
  - Priority order: Correctness → Bugs → Maintainability → Performance
  - 86% completion rate for critical/high/medium priority bugs (6 of 7 fixed)

### Tests

- Updated 3 tests to verify return-based callback API instead of mutation detection
- Added 4 branch coverage tests to cover previously uncovered code paths:
  - setSizes: panel stays collapsed when size <= minSize (no transition)
  - setSizes: panel stays expanded when size >= minSize (no transition)
  - isCollapsed: out-of-bounds index fallback
  - handleResize: right panel with collapsedSize
- Improved branch coverage from 86.54% to 93.84% (exceeds 90% requirement)
- All tests pass: 173 passing (4 new tests added)

## [0.3.1] - 2025-11-12

## [0.3.0] - 2025-11-11

### Added
- CSS variables for customizable resize handles (prefixed with `--rap-` to avoid collisions):
  - `--rap-handle-hover-color` (default: `rgba(0, 102, 204, 0.4)`)
  - `--rap-handle-active-color` (default: `rgba(0, 102, 204, 0.8)`)
  - `--rap-handle-z-index` (default: `50`)
  - `--rap-handle-transition` (default: `all 0.2s ease`)
- New `throttle` utility function for performance optimization
- New `calculateSizesWithPixelConstraints` function for optimized size calculations with cached constraints
- Explicit id attribute support for Panel and ResizeHandle components with TypeScript definitions
- ARIA attributes (aria-label, aria-labelledby, aria-controls) for improved accessibility
- Mobile and tablet responsive styles for demo site with proper viewport handling for iOS/iPadOS

### Changed
- Increased resize handle z-index from 10 to 50 for better layering control
- Improved `parseSize` to auto-convert plain numbers (e.g., "1", "100") to pixels with a dev-mode warning for better developer experience
- Enhanced error messages for invalid size formats with helpful hints and examples

### Performance
- Optimized ResizeObserver callback with throttling (~60fps) to reduce unnecessary calculations during window resize
- Added constraint caching to avoid redundant size parsing and conversion on every resize (30-40% faster calculations)
- Added early exit optimization to collapse logic for panels without collapse support (30x faster for non-collapsible layouts)

### Accessibility
- Added `aria-label` prop to ResizeHandle with default "Resize panels" label for screen readers
- Added `role="group"` to Panel components for semantic structure
- Added `role="group"` and `aria-orientation` to PanelGroup for layout direction announcement
- ResizeHandle maintains existing keyboard support (Arrow keys + Shift) and ARIA attributes (role="separator", aria-orientation)

### Touch Device Support
- Added `touchAction: "none"` CSS property to ResizeHandle to prevent default touch behaviors (scrolling, zooming) during resize
- Touch devices work via browser's native touch-to-mouse event translation (following industry standard approach)
- Works reliably on all modern mobile browsers and tablets (iOS Safari, iPadOS, Chrome Mobile, Firefox Mobile, etc.)
- Simpler implementation with better cross-browser compatibility and testability

### Documentation
- Added comprehensive JSDoc to all components (PanelGroup, Panel, ResizeHandle) with usage examples
- Added complete JSDoc to all utility functions (parseSize, formatSize, convertToPixels, convertFromPixels, clampSize, calculateSizes)
- Added JSDoc to all type definitions (PanelSize, PanelProps, PanelGroupProps, PanelGroupHandle, ParsedSize)
- All public APIs now have clear descriptions, parameter documentation, and code examples

### Tests
- Added comprehensive tests for `throttle` function with proper fake timer support using `vi.setSystemTime()`
- Added dev mode warning tests for `calculateSizesWithPixelConstraints` to cover edge cases
- Added complete test coverage for `propNormalization.ts` functions
- Added 14 comprehensive tests for `childUtils.ts` functions (findPanelChildren, flattenPanelChildren) including nested component traversal
- Improved ResizeHandle coverage to meet 90% threshold via comprehensive mouse and keyboard event tests
- Improved childUtils coverage to 100% statements and 90% branches
- All tests pass across chromium, firefox, and webkit browsers

## [0.2.3] - 2025-11-10

### Fixed
- Fixed invalid size format error (`"NaNundefined"`) when dynamically adding panels and then resizing them
- Fixed initial style calculation for dynamically added panels (panels no longer start with `height: "0px"` or `width: "0px"`)
- Ensured `originalUnitsRef` and `panelSizes` stay synchronized when panels are added or removed dynamically

### Added
- Added comprehensive test coverage for dynamically adding/removing panels and resizing them

## [0.2.2] - 2025-11-10

### Fixed
- Fixed "Invalid size format: NaNundefined" error when Panel props (`minSize`, `maxSize`, `defaultSize`) receive `undefined`
- Fixed React warnings about unknown props being passed to DOM elements (`minSize`, `maxSize`, etc.)

### Changed
- Improved prop normalization architecture with dedicated normalize functions per component (`normalizePanelProps`, `normalizePanelGroupProps`, `normalizeResizeHandleProps`)
- Enhanced error messages for size parsing to help diagnose state synchronization issues
- Refactored components to normalize props at component boundaries following "parse, don't validate" principle

### Added
- Created `AGENTS.md` with comprehensive AI agent instructions for repository development

## [0.2.1] - 2025-11-10

### Added
- Support for wrapping `Panel` and `ResizeHandle` components in arbitrary React elements (divs, fragments, conditional renders, etc.)
- Recursive child discovery using `childUtils.ts` to find panels and handles at any nesting depth
- Comprehensive performance monitoring infrastructure:
  - Performance regression tests to catch slowdowns automatically
  - React Profiler tests to measure actual render times
  - Vitest benchmarks for operations-per-second comparisons
  - Bundle size monitoring with 25KB/8KB (raw/gzip) budgets
- Performance documentation (`PERFORMANCE.md`) with optimization guidance
- Integrated performance tests and bundle size checks into CI workflow
- CHANGELOG checklist item in PR template to ensure contributors document their changes

### Changed
- `PanelGroup` now uses `useMemo` to optimize recursive traversal in render path
- Performance tests run in jsdom (separate from browser tests) for consistent timing measurements
- Test suite excludes performance tests from main run to avoid duplication
- Merged PUBLISHING.md into RELEASING.md for unified release documentation
- Clarified that CHANGELOG updates happen during PRs, not at release time

### Performance
- Wrapped components have ~5% overhead vs direct children (well within acceptable range)
- Memoization prevents re-traversal on every render
- All performance metrics maintained within budgets (< 50ms mount, < 16ms resize, < 2x overhead)

## [0.2.0] - 2025-11-09

### Added
- Imperative API for panel collapse state management with `collapse()` and `expand()` methods on PanelGroup
- Directional hysteresis with 20px buffer to prevent jittery collapse/expand behavior when dragging near collapse threshold
- Codecov integration for tracking code coverage metrics
- ControlledCollapseDemo example showcasing the new imperative collapse API

### Changed
- Refactored panel collapse logic from controlled prop pattern to imperative API pattern for more flexible state management
- Enhanced test suite with comprehensive coverage of the new collapse API and hysteresis behavior
- Updated CodeViewer component to remove @vite-ignore directive
- Added coverage thresholds (90%) to CI configuration
- Updated PUBLISHING documentation

### Improved
- Code coverage tracking with json-summary reporter, maintaining 90%+ coverage across all browsers

## [0.1.1] - 2025-11-08

### Fixed
- Removed postinstall script that caused installation failures when package was used as a dependency
- The postinstall script attempted to run `scripts/postinstall.mjs` which is not included in published packages

### Changed
- Replaced automatic postinstall with manual `yarn setup:browsers` command for development
- Updated documentation (CONTRIBUTING.md, PUBLISHING.md, TESTING.md) with browser setup instructions

## [0.1.0] - 2025-11-08

### Added
- Initial release
- Pixel-based (`"200px"`) and percentage-based (`"50%"`) sizing
- Auto-fill sizing (`"auto"` or `"*"`) for responsive layouts
- Horizontal and vertical layouts
- Nested panel support
- Imperative API for programmatic control (setSizes, getSizes)
- Draggable resize handles with mouse and keyboard support
- Customizable resize handles with size, style, and content options
- Collapsible panels with automatic snap behavior
- Resize callbacks (onResize, onResizeStart, onResizeEnd) with rich size information
- Full TypeScript support with comprehensive type definitions
- React 19+ support
- Zero dependencies (except React peer dependency)
- 90%+ test coverage across 3 browsers (Chromium, Firefox, WebKit)
- Comprehensive documentation with examples and live demo
- GitHub Actions CI/CD workflows
- Automated npm publishing on GitHub releases

[Unreleased]: https://github.com/jeremy-boschen/react-adjustable-panels/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/jeremy-boschen/react-adjustable-panels/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jeremy-boschen/react-adjustable-panels/releases/tag/v0.1.0
