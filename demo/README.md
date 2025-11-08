# React Adjustable Panels Demo

This is the interactive demo site for [@jeremy-boschen/react-adjustable-panels](https://www.npmjs.com/package/@jeremy-boschen/react-adjustable-panels).

## Live Demo

Visit the live demo at: https://jeremy-boschen.github.io/react-adjustable-panels/

## Running Locally

```bash
# Install dependencies
npm install

# Build the library first
npm run build

# Start the demo in development mode
npm run dev:demo
```

The demo will be available at `http://localhost:5173`

## Building for Production

```bash
# Build the demo
npm run build:demo

# Preview the production build
npm run preview:demo
```

## Features Demonstrated

The demo showcases all the key features of the react-adjustable-panels library:

1. **Basic Horizontal Layout** - Simple two-panel horizontal layout with percentage sizing
2. **Basic Vertical Layout** - Vertical layout demonstrating pixel-based sizing
3. **Nested Panels** - Complex layouts with panels nested inside other panels
4. **Imperative API** - Programmatic control of panel sizes with buttons
5. **Complex Layout** - Realistic IDE-like layout with multiple nested panels
6. **Resize Callbacks** - Event handling with onResize, onResizeStart, and onResizeEnd

## Technology Stack

- React 19
- TypeScript
- Vite
- CSS with modern features

## Deployment

The demo is automatically deployed to GitHub Pages via GitHub Actions whenever changes are pushed to the main branch.
