# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
