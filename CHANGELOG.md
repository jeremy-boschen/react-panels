# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
