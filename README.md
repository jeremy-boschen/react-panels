# @jeremy-boschen/react-adjustable-panels

[![NPM Version](https://img.shields.io/npm/v/%40jeremy-boschen%2Freact-adjustable-panels)](https://www.npmjs.com/package/@jeremy-boschen/react-adjustable-panels)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![CI](https://github.com/jeremy-boschen/react-adjustable-panels/actions/workflows/ci.yml/badge.svg)](https://github.com/jeremy-boschen/react-adjustable-panels/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jeremy-boschen/react-adjustable-panels/graph/badge.svg?token=BJK8RH5684)](https://codecov.io/gh/jeremy-boschen/react-adjustable-panels)

A lightweight, zero-dependency React panel library with flexible sizing options including pixel, percentage, and
auto-fill support.

**🚀 [Live Demo](https://jeremy-boschen.github.io/react-adjustable-panels/)** | Try it out and see all features in action!

## Features

- 🎯 Flexible sizing: pixel (`"200px"`), percentage (`"50%"`), or auto-fill (`"auto"`)
- 🔄 Horizontal and vertical layouts
- 🪆 Nested panel support
- 📁 Collapsible panels with automatic snap behavior
- 🎮 Imperative API for programmatic control
- 🖱️ Draggable resize handles with rich callback information
- ⚛️ React 19+ and modern browsers only
- 📦 Zero dependencies (except React)
- 📘 Full TypeScript support
- ✅ Comprehensive test coverage

## Built with AI

This entire library was built collaboratively with **Claude** (Anthropic's AI assistant). From initial architecture and
API design to implementation, testing, documentation, and the interactive demo site - every line of code, test, and doc
was written through an AI-assisted development process.

This project demonstrates how AI can be a powerful pair-programming partner for building production-quality software
libraries with:
- Clean, well-tested code with 90%+ coverage
- Comprehensive documentation and examples
- Thoughtful API design and user experience
- Multi-browser testing and CI/CD setup

## Inspiration

This library was inspired by [react-resizable-panels](https://github.com/bvaughn/react-resizable-panels), an excellent panel resizing library by Brian Vaughn.

## Installation

```bash
yarn add @jeremy-boschen/react-adjustable-panels
# or
npm install @jeremy-boschen/react-adjustable-panels
```

## Usage

### Basic Example

```tsx
import {Panel, PanelGroup} from '@jeremy-boschen/react-adjustable-panels';
import '@jeremy-boschen/react-adjustable-panels/style.css';

function App() {
    return (
        <PanelGroup direction="horizontal">
            {/* Fixed-width sidebar */}
            <Panel defaultSize="250px" minSize="200px" maxSize="400px">
                Sidebar
            </Panel>
            {/* Auto-fill main content (omit defaultSize or use "auto") */}
            <Panel minSize="300px">
                Main Content
            </Panel>
        </PanelGroup>
    );
}
```

### Imperative API

```tsx
import {useRef} from 'react';
import {Panel, PanelGroup, PanelGroupHandle} from '@jeremy-boschen/react-adjustable-panels';

function App() {
    const panelGroupRef = useRef<PanelGroupHandle>(null);

    const handleCollapseSidebar = () => {
        // Collapse sidebar, main content auto-fills
        panelGroupRef.current?.setSizes(['0px', 'auto']);
    };

    const handleFixedSidebar = () => {
        // Fixed 250px sidebar, auto-fill main content
        panelGroupRef.current?.setSizes(['250px', 'auto']);
    };

    const handleSplit = () => {
        panelGroupRef.current?.setSizes(['50%', '50%']);
    };

    return (
        <div>
            <button onClick={handleCollapseSidebar}>Collapse Sidebar</button>
            <button onClick={handleFixedSidebar}>250px Sidebar</button>
            <button onClick={handleSplit}>50/50 Split</button>
            <PanelGroup ref={panelGroupRef} direction="horizontal">
                <Panel defaultSize="250px">Sidebar</Panel>
                <Panel>Main Content</Panel>
            </PanelGroup>
        </div>
    );
}
```

### Nested Panels

```tsx
<PanelGroup direction="horizontal">
    <Panel defaultSize="50%">
        <PanelGroup direction="vertical">
            <Panel defaultSize="50%">Top</Panel>
            <Panel defaultSize="50%">Bottom</Panel>
        </PanelGroup>
    </Panel>
    <Panel defaultSize="50%">Right Side</Panel>
</PanelGroup>
```

### Custom Resize Handles

Customize resize handles with custom sizes, styles, and content using the `<ResizeHandle>` component:

```tsx
import {Panel, PanelGroup, ResizeHandle} from '@jeremy-boschen/react-adjustable-panels';

// Larger handle for easier dragging
<PanelGroup direction="horizontal">
    <Panel defaultSize="50%">Left</Panel>
    <ResizeHandle size={8} />  {/* 8px instead of default 4px */}
    <Panel defaultSize="50%">Right</Panel>
</PanelGroup>

// Seamless layout: large hit area with thin visual indicator
<PanelGroup direction="horizontal">
    <Panel defaultSize="50%">Left</Panel>
    <ResizeHandle size={12} className="seamless-handle" />
    <Panel defaultSize="50%">Right</Panel>
</PanelGroup>

// Custom styled handle with content
<PanelGroup direction="horizontal">
    <Panel defaultSize="50%">Left</Panel>
    <ResizeHandle size={16} className="custom-handle">
        <div className="handle-grip">⋮</div>
    </ResizeHandle>
    <Panel defaultSize="50%">Right</Panel>
</PanelGroup>
```

**Seamless Layouts (No Gaps):**

By default, resize handles overlay the boundary between panels with no visual gap. For a completely seamless appearance:

**Horizontal layouts** (panels side-by-side):
```css
/* Remove left/right borders - handles overlay these edges */
.my-panel {
  border-top: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  /* No left/right borders */
}
```

**Vertical layouts** (panels stacked):
```css
/* Remove top/bottom borders - handles overlay these edges */
.my-panel {
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
  /* No top/bottom borders */
}
```

The resize handles:
- Are **transparent by default** with no visible gap
- Use **negative margins** to overlay panel boundaries
- Show a **subtle blue indicator** only on hover
- Have a **4px hit area** for easy dragging
- Work seamlessly in both horizontal and vertical layouts

**Custom seamless handles:**

```css
/* Customize the hover indicator */
.seamless-handle {
  background: transparent !important;
  position: relative;
}

.seamless-handle::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: #ddd;
  transform: translateX(-50%);
  transition: all 0.2s ease;
}

.seamless-handle:hover::before {
  width: 3px;
  background: #0066cc;
}
```

**Note:** If you don't specify a `<ResizeHandle>`, a default 4px seamless handle is automatically inserted between panels.

### Resize Callbacks

The resize callbacks provide rich information about the resize operation:

```tsx
import {ResizeInfo, PanelSizeInfo} from '@jeremy-boschen/react-adjustable-panels';

<PanelGroup
    direction="horizontal"
    onResizeStart={(info: ResizeInfo) => {
        console.log('Resize started at:', info.currentSizes);
    }}
    onResize={(info: ResizeInfo) => {
        // Optionally modify sizes during resize (e.g., snap to grid)
        if (shouldSnapToGrid) {
            const snapped = Math.round(info.proposedSizes[0].pixels / 50) * 50;
            return [
                {...info.proposedSizes[0], pixels: snapped},
                {...info.proposedSizes[1], size: 'auto', pixels: info.containerSize - snapped}
            ];
        }
    }}
    onResizeEnd={(info: ResizeInfo) => {
        console.log('Resize ended:', info.currentSizes);
        // Optionally enforce constraints on release
    }}
>
    <Panel defaultSize="300px">Left</Panel>
    <Panel>Right (auto-fill)</Panel>
</PanelGroup>
```

**ResizeInfo** provides:

- `currentSizes` - Current panel sizes with pixels, percent, and original size string
- `proposedSizes` - Proposed new sizes (during onResize)
- `previousSizes` - Previous panel sizes
- `containerSize` - Total container size in pixels
- `direction` - Layout direction ('horizontal' | 'vertical')

### Collapsible Panels

Panels can automatically collapse when dragged below a threshold, perfect for sidebars and tool panels:

```tsx
import {useState} from 'react';
import {Panel, PanelGroup} from '@jeremy-boschen/react-adjustable-panels';

function App() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <PanelGroup direction="horizontal">
            {/* Collapsible sidebar */}
            <Panel
                defaultSize="300px"
                minSize="200px"         // Normal minimum size when expanded
                collapsedSize="50px"    // Size when collapsed
                onCollapse={setIsCollapsed}  // Track collapse state
            >
                {isCollapsed ? <IconView/> : <FullView/>}
            </Panel>

            {/* Main content auto-fills */}
            <Panel>Main Content</Panel>
        </PanelGroup>
    );
}
```

**How it works:**

- Drag the panel **below `minSize`** → automatically snaps to `collapsedSize`
- Drag the panel **above `minSize`** → automatically expands back to `minSize`
- `onCollapse` callback fires when collapse state changes
- Use `collapsed` prop for controlled mode
- Use `defaultCollapsed` to start in collapsed state

**Controlled mode:**

```tsx
const [collapsed, setCollapsed] = useState(false);

<Panel
    defaultSize="300px"
    minSize="200px"
    collapsedSize="50px"
    collapsed={collapsed}        // Control collapsed state
    onCollapse={setCollapsed}    // Sync state changes
>
    Sidebar Content
</Panel>

// Programmatically toggle
<button onClick={() => setCollapsed(!collapsed)}>
    Toggle Sidebar
</button>
```

## API

### `<PanelGroup>`

Container for panels with resize functionality.

#### Props

- `direction?: 'horizontal' | 'vertical'` - Layout direction (default: `'horizontal'`)
- `className?: string` - CSS class name
- `style?: React.CSSProperties` - Inline styles
- `onResizeStart?: (info: ResizeInfo) => void` - Called when resize starts
- `onResize?: (info: ResizeInfo) => PanelSizeInfo[] | void` - Called during resize. Can return modified sizes.
- `onResizeEnd?: (info: ResizeInfo) => PanelSizeInfo[] | void` - Called when resize ends. Can return final sizes.

#### Imperative Handle

Access via ref:

- `setSizes(sizes: PanelSize[])` - Set panel sizes programmatically
- `getSizes(): PanelSize[]` - Get current panel sizes

### `<Panel>`

Individual panel component.

#### Props

- `defaultSize?: PanelSize` - Initial size (e.g., `"50%"`, `"200px"`, `"auto"`). Defaults to `"auto"` if omitted.
- `minSize?: PanelSize` - Minimum size constraint
- `maxSize?: PanelSize` - Maximum size constraint
- `collapsedSize?: PanelSize` - Size when collapsed (must be < `minSize`). Enables collapse behavior.
- `collapsed?: boolean` - Controlled collapsed state
- `defaultCollapsed?: boolean` - Initial collapsed state (uncontrolled mode)
- `onCollapse?: (collapsed: boolean) => void` - Called when collapse state changes
- `className?: string` - CSS class name
- `style?: React.CSSProperties` - Inline styles
- `children?: ReactNode` - Panel content

### `<ResizeHandle>`

Customizable resize handle component for controlling panel resizing.

#### Props

- `size?: number` - Size of the handle in pixels (width for horizontal, height for vertical). Default: `4`
- `className?: string` - CSS class name for styling
- `style?: React.CSSProperties` - Inline styles
- `children?: ReactNode` - Custom content to render inside the handle (e.g., visual indicators, icons)

#### Usage

```tsx
// Default handle (4px) - automatically inserted if not specified
<PanelGroup>
    <Panel>...</Panel>
    <Panel>...</Panel>
</PanelGroup>

// Custom handle with larger hit area
<PanelGroup>
    <Panel>...</Panel>
    <ResizeHandle size={12} className="custom-handle" />
    <Panel>...</Panel>
</PanelGroup>

// Handle with custom content
<PanelGroup>
    <Panel>...</Panel>
    <ResizeHandle>
        <div className="handle-icon">⋮</div>
    </ResizeHandle>
    <Panel>...</Panel>
</PanelGroup>
```

**Note:** You don't need to specify `direction`, `onDragStart`, `onDrag`, or `onDragEnd` - these are automatically provided by the parent `PanelGroup`.

### Types

```typescript
type PanelSize = `${number}px` | `${number}%` | 'auto' | '*';
type Direction = 'horizontal' | 'vertical';

interface PanelGroupHandle {
    setSizes: (sizes: PanelSize[]) => void;
    getSizes: () => PanelSize[];
}

interface PanelSizeInfo {
    /** Original size format (e.g., "50%", "200px", "auto") - mutable */
    size: PanelSize;
    /** Current size in pixels */
    pixels: number;
    /** Current size as percentage of container */
    percent: number;
}

interface ResizeInfo {
    /** Current panel sizes */
    currentSizes: PanelSizeInfo[];
    /** Proposed new sizes (during resize) */
    proposedSizes: PanelSizeInfo[];
    /** Previous panel sizes */
    previousSizes: PanelSizeInfo[];
    /** Container size in pixels */
    containerSize: number;
    /** Layout direction */
    direction: Direction;
}
```

## Size Calculation

The library intelligently handles different sizing strategies:

### Auto-Fill Sizing

Panels with `'auto'` or `'*'` (or omitted `defaultSize`) automatically fill remaining space after fixed-size panels:

```tsx
// Fixed 200px sidebar, main content auto-fills
<Panel defaultSize="200px">Sidebar</Panel>
<Panel>Main Content</Panel>  // Defaults to 'auto'

// Programmatically with setSizes
setSizes(['200px', 'auto']);  // Sidebar fixed, main fills remaining space
```

### Mixed Units

You can mix pixel, percentage, and auto sizing:

```tsx
// 250px fixed + 30% + remaining auto-fill
setSizes(['250px', '30%', 'auto']);
```

### Size Warnings (Development Mode)

In development, the library warns about potential sizing conflicts:

- When fixed panels don't sum to container size
- When fixed panels exceed available space

These warnings help catch layout issues early but won't appear in production builds.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and
development process.

## Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project
- [Release Guide](RELEASING.md) - How to publish new versions
- [Changelog](CHANGELOG.md) - Version history and changes
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines
- [Security Policy](SECURITY.md) - How to report security vulnerabilities

## Support

- 🐛 [Report a bug](https://github.com/jeremy-boschen/react-adjustable-panels/issues/new?template=bug_report.yml)
- ✨ [Request a feature](https://github.com/jeremy-boschen/react-adjustable-panels/issues/new?template=feature_request.yml)
- 💬 [Start a discussion](https://github.com/jeremy-boschen/react-adjustable-panels/discussions)
- 📖 [Read the docs](https://github.com/jeremy-boschen/react-adjustable-panels#readme)

## License

Apache-2.0
