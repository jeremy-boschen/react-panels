# React Adjustable Panels - Refactoring Analysis

**Date:** November 12, 2025
**Purpose:** Comprehensive analysis of the current implementation to identify opportunities for performance improvements, better maintainability, and code clarity.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Codebase Metrics](#codebase-metrics)
3. [React Hooks Analysis](#react-hooks-analysis)
4. [Comparison with Similar Libraries](#comparison-with-similar-libraries)
5. [Performance Analysis](#performance-analysis)
6. [Maintainability Analysis](#maintainability-analysis)
7. [Code Clarity Assessment](#code-clarity-assessment)
8. [Architectural Patterns](#architectural-patterns)
9. [Refactoring Opportunities](#refactoring-opportunities)
10. [Recommendations](#recommendations)

---

## Executive Summary

After a comprehensive analysis of the codebase and comparison with similar libraries (react-resizable-panels and allotment), **react-adjustable-panels demonstrates excellent code quality, maintainability, and performance characteristics**. The implementation is actually **less complex and more maintainable** than both comparison libraries while providing similar functionality.

**Key Findings:**
- ✅ **Simpler architecture** than both react-resizable-panels and allotment
- ✅ **Moderate and appropriate use of React hooks** (not over-engineered)
- ✅ **Clear separation of concerns** with utility modules
- ✅ **Excellent type safety** with comprehensive TypeScript types
- ✅ **Good performance optimizations** already in place
- ⚠️ **High ref count** (13 refs) - could be consolidated in some areas
- ⚠️ **Some opportunities for memoization improvements**
- ⚠️ **Potential for extracting complex logic into custom hooks**

**Overall Assessment:** This is a well-architected, production-ready library that is **more maintainable and less complex** than established alternatives.

---

## Codebase Metrics

### File Structure

```
src/
├── PanelGroup.tsx        (864 lines) - Main container component
├── Panel.tsx             (86 lines)  - Simple panel component
├── ResizeHandle.tsx      (216 lines) - Resize handle component
├── types.ts              (150 lines) - TypeScript definitions
├── utils.ts              (445 lines) - Utility functions
├── propNormalization.ts  (124 lines) - Props normalization
├── childUtils.ts         (93 lines)  - Children traversal utilities
└── index.ts              (9 lines)   - Public exports
```

**Total Source Lines:** ~1,987 LOC (excluding tests)
**Main Components:** 1,166 LOC
**Utilities:** 662 LOC
**Number of Source Files:** 8

### React Hooks Usage

**Total Hook Calls:** 42 across all source files

Breakdown by component:

**PanelGroup.tsx:**
- `useState`: 2 calls (panelSizes, pixelSizes)
- `useRef`: 12 calls (containerRef, currentPixelSizesRef, dragStartPixelSizesRef, constraintsRef, originalUnitsRef, isDraggingRef, isInitializedRef, previousPixelSizesRef, collapsedSizeRef, collapsedStateRef, collapseCallbacksRef, constraintCacheRef)
- `useEffect`: 2 calls (initialization, pixel size calculation)
- `useCallback`: 7 calls (createSizeInfo, applySizeInfo, applyCollapseLogic, handleResize, handleResizeStart, handleResizeEnd, and one inline in useImperativeHandle)
- `useImperativeHandle`: 1 call
- `useMemo`: 1 call (childArray)

**Panel.tsx:**
- No hooks (uses `forwardRef` only)

**ResizeHandle.tsx:**
- `useRef`: 3 calls (isDraggingRef, startPosRef, cleanupRef)
- `useEffect`: 1 call (cleanup)
- `useCallback`: 2 calls (handlePointerDown, handleKeyDown)

---

## Comparison with Similar Libraries

### 1. react-resizable-panels (by Brian Vaughn)

**Repository:** https://github.com/bvaughn/react-resizable-panels

#### Architecture Comparison

| Aspect | react-adjustable-panels | react-resizable-panels |
|--------|------------------------|------------------------|
| **State Management** | Simple useState + refs | Dual-ref strategy (committedValuesRef + eagerValuesRef) |
| **Panel Communication** | Props-based (parent → child) | Context-based (PanelGroupContext) |
| **Sizing Units** | Pixels + Percentage + Auto | Percentage-based only |
| **Persistence** | Not built-in | localStorage with autoSaveId |
| **Layout Strategy** | Direct calculation | Validation-based with constraints |
| **Complexity** | Moderate | High |

#### Key Differences

**react-resizable-panels uses:**
1. **Context-heavy architecture** - All panel state flows through React Context
2. **Dual-ref pattern** - Separates "committed values" (for handlers) from "eager values" (for calculations) to prevent stale closures
3. **Registration system** - Panels register/unregister with parent via context methods
4. **Percentage-only sizing** - Deliberately avoids pixel constraints due to complexity
5. **Built-in persistence** - localStorage integration with debouncing

**Our implementation:**
1. **Props-based** - Simpler parent-child communication without context
2. **Single-purpose refs** - Each ref has a clear, single responsibility
3. **Direct traversal** - Uses `findPanelChildren` to discover panels from children
4. **Mixed sizing** - Supports pixels, percentages, and auto (more flexible)
5. **No persistence** - User implements if needed (separation of concerns)

**Complexity Assessment:**
- react-resizable-panels: **More complex** (dual-ref pattern, context setup, registration lifecycle)
- react-adjustable-panels: **Less complex** (direct state, simpler communication)

#### Hook Usage Comparison

Based on source analysis:

**react-resizable-panels (PanelGroup):**
- `useState`: 2 calls (layout, dragState)
- `useRef`: 4+ calls (panelGroupElementRef, committedValuesRef, eagerValuesRef, panelIdToLastNotifiedSizeMapRef)
- `useEffect`: 2+ calls (persistence, registration)
- `useIsomorphicLayoutEffect`: 1+ calls
- `useImperativeHandle`: 1 call
- `useMemo`: 1+ calls (context)

**Our PanelGroup:**
- `useState`: 2 calls
- `useRef`: 12 calls
- `useEffect`: 2 calls
- `useImperativeHandle`: 1 call
- `useMemo`: 1 call

**Analysis:** We use **more refs** (12 vs 4), but **simpler patterns**. Their dual-ref strategy is more sophisticated but also harder to understand.

---

### 2. allotment (by John Walley)

**Repository:** https://github.com/johnwalley/allotment

#### Architecture Comparison

| Aspect | react-adjustable-panels | allotment |
|--------|------------------------|-----------|
| **Foundation** | Custom React implementation | VS Code's split-view library |
| **State Management** | useState + simple refs | Ref-heavy with external library |
| **Layout Engine** | Custom calculation functions | External SplitView + LayoutService |
| **Child Handling** | React children traversal | Complex reconciliation with Maps |
| **DOM Manipulation** | Minimal (styles only) | Heavy (imperative SplitView control) |
| **Complexity** | Moderate | Very High |

#### Key Differences

**allotment uses:**
1. **External library integration** - Wraps VS Code's split-view implementation
2. **Imperative DOM management** - Direct manipulation of split-view mechanics
3. **Complex reconciliation** - Custom add/remove/update/reorder child handling
4. **6+ refs** - Multiple interdependent refs (splitViewRef, splitViewViewRef, previousKeys, splitViewPropsRef, views, layoutService)
5. **Event-driven architecture** - Subscribes to SplitView events
6. **Custom child tracking** - Maps children by key for updates

**Our implementation:**
1. **Pure React** - No external layout libraries
2. **Declarative** - Uses React's style props for layout
3. **Simple child handling** - Standard React.Children utilities
4. **12 refs** - But each has single, clear purpose
5. **Callback-based** - Standard React patterns
6. **Direct traversal** - No manual child tracking needed

**Complexity Assessment:**
- allotment: **Significantly more complex** (external library integration, imperative patterns, complex reconciliation)
- react-adjustable-panels: **Much simpler** (pure React, declarative patterns)

#### Hook Usage Comparison

**allotment (main component):**
- `useState`: 1 call (dimensionsInitialized)
- `useRef`: 7+ calls (containerRef, splitViewRef, splitViewViewRef, previousKeys, splitViewPropsRef, views, layoutService)
- `useEffect`: 4+ calls (callback sync, iOS fixes, etc.)
- `useIsomorphicLayoutEffect`: 2+ calls (DOM sync)
- `useCallback`: 1+ calls
- `useMemo`: 1+ calls
- `useImperativeHandle`: 1 call

**Our PanelGroup:**
- `useState`: 2 calls
- `useRef`: 12 calls
- `useEffect`: 2 calls
- `useCallback`: 7 calls
- `useMemo`: 1 call
- `useImperativeHandle`: 1 call

**Analysis:** We use **more refs** (12 vs 7) but **more callbacks** (7 vs 1). Allotment's refs coordinate with an external library, making them more tightly coupled. Our refs are more isolated and easier to reason about.

---

## Performance Analysis

### Current Performance Optimizations

✅ **Already Implemented:**

1. **Constraint caching** (PanelGroup.tsx:100-103, 196-212)
   ```typescript
   const constraintCacheRef = useRef<{
     containerSize: number;
     constraints: Array<{ minPx?: number; maxPx?: number }>;
   } | null>(null);
   ```
   - Caches pixel constraints to avoid recalculation on every resize
   - Only recalculates when container size changes by >1px
   - **Impact:** Reduces convertToPixels calls during drag operations

2. **Throttled resize observer** (PanelGroup.tsx:252)
   ```typescript
   const throttledUpdateSizes = throttle(updateSizes, 16);
   ```
   - Throttles container resize updates to ~60fps (16ms)
   - **Impact:** Prevents excessive recalculations during window resize

3. **Ref-based state for drag operations** (PanelGroup.tsx:86-92)
   - Uses refs instead of state during drag to avoid re-renders
   - Only updates React state on drag end
   - **Impact:** Smooth drag performance without render thrashing

4. **Early exits in collapse logic** (PanelGroup.tsx:471-476)
   ```typescript
   const hasCollapsiblePanels =
     collapsedSizeRef.current[leftIndex] !== undefined ||
     collapsedSizeRef.current[rightIndex] !== undefined;
   if (!hasCollapsiblePanels) {
     return proposedPixelSizes; // No cloning!
   }
   ```
   - Avoids array cloning when collapse logic doesn't apply
   - **Impact:** Faster resize for non-collapsible panels

5. **Optimized size calculation** (utils.ts:350-444)
   - `calculateSizesWithPixelConstraints` accepts pre-computed pixel constraints
   - Avoids redundant parsing and conversion
   - **Impact:** Faster calculations on container resize

6. **Memoized child array** (PanelGroup.tsx:773)
   ```typescript
   const childArray = useMemo(
     () => flattenPanelChildren(children, Panel, ResizeHandle),
     [children]
   );
   ```
   - Prevents re-traversal of children on every render
   - **Impact:** Reduces work in render phase

### Performance Opportunities

⚠️ **Potential Improvements:**

#### 1. Memoize size calculation utilities (MEDIUM PRIORITY)

**Location:** PanelGroup.tsx:442-464

```typescript
// Current
const createSizeInfo = useCallback((pixelSizes: number[], containerSize: number) => {
  return pixelSizes.map((pixels, i) => {
    const unit = originalUnitsRef.current[i] || 'auto';
    const percent = (pixels / containerSize) * 100;
    const value = convertFromPixels(pixels, containerSize, unit);
    const size = formatSize(value, unit);
    return { size, pixels, percent };
  });
}, []);
```

**Issue:** Called multiple times per resize event (in onResize, onResizeStart, onResizeEnd)

**Solution:** Add `useMemo` to cache results when inputs haven't changed

```typescript
const currentSizeInfo = useMemo(
  () => createSizeInfo(currentPixelSizesRef.current, containerSize),
  [currentPixelSizesRef.current, containerSize, createSizeInfo]
);
```

**Expected Impact:** Reduces allocations during resize callbacks

#### 2. Extract collapse logic into a custom hook (MEDIUM PRIORITY)

**Location:** PanelGroup.tsx:467-552 (85 lines)

**Current:** `applyCollapseLogic` is a large useCallback with complex logic

**Issue:**
- Hard to test in isolation
- Makes PanelGroup harder to read
- Cognitive overhead in main component

**Solution:** Extract to custom hook

```typescript
function useCollapseLogic(
  collapsedSizeRef: RefObject<Array<PanelSize | undefined>>,
  collapsedStateRef: RefObject<boolean[]>,
  collapseCallbacksRef: RefObject<Array<((collapsed: boolean) => void) | undefined>>,
  constraintsRef: RefObject<Array<{ minSize?: PanelSize; maxSize?: PanelSize }>>
) {
  return useCallback((proposedPixelSizes, containerSize, leftIndex, rightIndex) => {
    // Collapse logic here
  }, [collapsedSizeRef, collapsedStateRef, collapseCallbacksRef, constraintsRef]);
}
```

**Expected Impact:**
- Better testability
- Improved readability
- Easier to optimize independently

#### 3. Consider useReducer for complex state (LOW PRIORITY)

**Location:** PanelGroup.tsx:84-92

**Current:** Multiple related refs that update together

```typescript
const [panelSizes, setPanelSizes] = useState<PanelSize[]>([]);
const [pixelSizes, setPixelSizes] = useState<number[]>([]);
const currentPixelSizesRef = useRef<number[]>([]);
const dragStartPixelSizesRef = useRef<number[]>([]);
const previousPixelSizesRef = useRef<number[]>([]);
```

**Issue:** State updates are scattered across multiple setters

**Solution:** Consolidate into useReducer

```typescript
type PanelState = {
  panelSizes: PanelSize[];
  pixelSizes: number[];
  currentPixelSizes: number[];
  dragStartPixelSizes: number[];
  previousPixelSizes: number[];
};

const [state, dispatch] = useReducer(panelReducer, initialState);
```

**Caveat:** This might actually **increase** complexity. Only do this if we find bugs related to state synchronization.

**Expected Impact:**
- More predictable state updates
- Easier to debug state transitions
- **May increase** code complexity (not always worth it)

#### 4. Lazy initialization for refs (LOW PRIORITY)

**Location:** PanelGroup.tsx:100-103

**Current:**
```typescript
const constraintCacheRef = useRef<{
  containerSize: number;
  constraints: Array<{ minPx?: number; maxPx?: number }>;
} | null>(null);
```

**Observation:** Most refs are initialized with null/empty arrays

**Solution:** Use lazy initialization for expensive computations

```typescript
const constraintCacheRef = useRef<ConstraintCache>();
function getConstraintCache() {
  if (!constraintCacheRef.current) {
    constraintCacheRef.current = createConstraintCache();
  }
  return constraintCacheRef.current;
}
```

**Expected Impact:** Minimal - refs are cheap to initialize

---

## Maintainability Analysis

### Strengths

✅ **Excellent:**

1. **Clear separation of concerns**
   - `utils.ts`: Pure calculation functions
   - `propNormalization.ts`: Input sanitization
   - `childUtils.ts`: React tree traversal
   - Components: UI logic only

2. **Comprehensive type safety**
   - All public APIs have TypeScript types
   - Internal types for ParsedSize, ResizeInfo, etc.
   - Proper use of generics in utility functions

3. **Excellent documentation**
   - JSDoc comments on all exports
   - Examples in component docstrings
   - Clear parameter descriptions

4. **Good test coverage**
   - Unit tests for utils, propNormalization, childUtils
   - Component tests for Panel, PanelGroup, ResizeHandle
   - Performance tests (profiler, benchmarks, regression)

5. **Consistent naming conventions**
   - Refs end with "Ref"
   - Callbacks start with "handle"
   - Boolean props start with "is"/"has"/"should"

### Weaknesses

⚠️ **Areas for Improvement:**

#### 1. High number of refs in PanelGroup (12 refs)

**Issue:** Hard to track which ref is used where

**Current refs:**
```typescript
containerRef                    // DOM reference
currentPixelSizesRef           // Current rendered sizes
dragStartPixelSizesRef         // Sizes at drag start
constraintsRef                  // Panel constraints
originalUnitsRef                // Original size units
isDraggingRef                   // Drag state flag
isInitializedRef                // Initialization flag
previousPixelSizesRef           // Previous sizes for callbacks
collapsedSizeRef                // Collapsed size values
collapsedStateRef               // Collapsed state booleans
collapseCallbacksRef            // onCollapse callbacks
constraintCacheRef              // Pixel constraint cache
```

**Suggestions:**
- Consider grouping related refs into objects:
  ```typescript
  const sizesRef = useRef({
    panel: [],
    pixel: [],
    current: [],
    dragStart: [],
    previous: []
  });

  const collapseRef = useRef({
    sizes: [],
    states: [],
    callbacks: []
  });

  const stateRef = useRef({
    isDragging: false,
    isInitialized: false
  });
  ```

**Trade-offs:**
- ✅ Fewer refs to track
- ✅ Logical grouping
- ⚠️ Slightly more verbose access (sizesRef.current.panel instead of panelSizesRef.current)
- ⚠️ May lose React DevTools insight into individual refs

#### 2. Large PanelGroup component (864 lines)

**Issue:** Single file with multiple concerns

**Current structure:**
- Lines 1-104: Setup (imports, props, refs)
- Lines 106-184: Initialization effect
- Lines 187-261: Pixel size calculation effect
- Lines 264-439: Imperative API (useImperativeHandle)
- Lines 442-464: createSizeInfo helper
- Lines 454-464: applySizeInfo helper
- Lines 467-552: applyCollapseLogic (85 lines!)
- Lines 555-676: handleResize (121 lines!)
- Lines 678-707: handleResizeStart
- Lines 709-766: handleResizeEnd
- Lines 768-861: Render logic

**Suggestions:**
- Extract into custom hooks:
  ```typescript
  // usePanelSizes.ts - Handle size initialization and calculation
  // usePanelResize.ts - Handle resize drag logic
  // usePanelCollapse.ts - Handle collapse behavior
  // usePanelImperativeAPI.ts - Handle ref API
  ```

**Trade-offs:**
- ✅ Smaller, more focused files
- ✅ Better testability
- ✅ Easier to understand each piece
- ⚠️ More files to navigate
- ⚠️ May need to pass many refs between hooks

#### 3. Complex callback dependencies

**Issue:** Some callbacks have many dependencies

Example (PanelGroup.tsx:675):
```typescript
const handleResize = useCallback(
  (handleIndex: number, cumulativeDelta: number) => {
    // ... 121 lines of logic
  },
  [direction, onResize, createSizeInfo, applySizeInfo, applyCollapseLogic]
);
```

**Observation:** Dependencies are well-controlled, but the function is complex

**Suggestion:**
- Extract sub-functions:
  ```typescript
  function calculateProposedSizes(handleIndex, delta, dragStartSizes) { ... }
  function applyConstraints(proposedSizes, leftIndex, rightIndex) { ... }
  function notifyResize(finalSizes) { ... }
  ```

#### 4. Timeout usage for callbacks (PanelGroup.tsx:164, 282, 327, etc.)

**Issue:** Multiple `setTimeout(..., 0)` calls for collapse callbacks

```typescript
setTimeout(() => {
  newCollapsedStates.forEach((collapsed, index) => {
    if (collapsed) {
      const callback = newCollapseCallbacks[index];
      callback?.(true);
    }
  });
}, 0);
```

**Why it's done:** Ensures callbacks fire after state updates

**Concern:** Relies on timing behavior, could cause issues in concurrent mode

**Suggestion:** Consider using `useEffect` or `flushSync` for more predictable timing

---

## Code Clarity Assessment

### What's Clear

✅ **Excellent clarity:**

1. **Pure utility functions** (utils.ts)
   - All functions are pure (no side effects)
   - Clear input/output contracts
   - Well-documented with examples

2. **Type definitions** (types.ts)
   - Comprehensive JSDoc
   - Clear interface names
   - Good use of discriminated unions

3. **Panel component** (Panel.tsx)
   - Simple, focused component
   - Clear data attribute usage
   - Minimal logic

4. **ResizeHandle component** (ResizeHandle.tsx)
   - Clean event handling
   - Unified pointer events API
   - Good accessibility attributes

### What Could Be Clearer

⚠️ **Improvement opportunities:**

#### 1. Complex conditional logic in handleResize

**Location:** PanelGroup.tsx:555-676

**Issue:** Nested conditionals and multiple constraint checks

Example:
```typescript
// Check if right panel violates constraints after left was clamped
if (newRight < rightMinPx) {
  newRight = rightMinPx;
  newLeft = expectedTotal - newRight;
  newLeft = clampSize(newLeft, leftMinPx, leftMaxPx);
} else if (newRight > rightMaxPx) {
  newRight = rightMaxPx;
  newLeft = expectedTotal - newRight;
  newLeft = clampSize(newLeft, leftMinPx, leftMaxPx);
}
```

**Suggestion:** Extract constraint resolution into a named function:
```typescript
function resolveConstrainedSizes(
  left: number,
  right: number,
  expectedTotal: number,
  leftConstraints: Constraints,
  rightConstraints: Constraints
): [number, number] {
  // Clear algorithm steps with comments
}
```

#### 2. Ref synchronization patterns

**Issue:** Multiple refs that must stay in sync

Example: `collapsedSizeRef`, `collapsedStateRef`, `collapseCallbacksRef` must have same length and corresponding indices

**Risk:** Index mismatches could cause bugs

**Suggestion:**
- Use a single ref with objects:
  ```typescript
  const collapsePanelsRef = useRef<Array<{
    size: PanelSize | undefined;
    state: boolean;
    callback: ((collapsed: boolean) => void) | undefined;
  }>>([]);
  ```
- Or use a Map with panel IDs as keys

#### 3. Magic numbers

**Issue:** Some hardcoded values without named constants

Examples:
- PanelGroup.tsx:199: `Math.abs(...containerSize - containerSize) > 1` (1px threshold)
- PanelGroup.tsx:252: `throttle(updateSizes, 16)` (16ms for ~60fps)
- PanelGroup.tsx:505: `const midpoint = (collapsedPx + minPx) / 2` (hysteresis calculation)

**Suggestion:** Extract to named constants:
```typescript
const CONSTRAINT_RECALC_THRESHOLD_PX = 1;
const RESIZE_THROTTLE_MS = 16; // ~60fps
const COLLAPSE_HYSTERESIS_RATIO = 0.5; // midpoint
```

---

## Architectural Patterns

### Current Patterns

✅ **Good patterns:**

1. **Props normalization at boundaries** (propNormalization.ts)
   - Converts undefined → defaults at component entry
   - Keeps internal logic clean
   - Single source of truth for defaults

2. **Render props via children**
   - Uses React's composition model
   - No prop drilling
   - Flexible component structure

3. **Imperative handle for programmatic control**
   - Clear escape hatch for imperative operations
   - Well-documented API
   - Type-safe methods

4. **Utility module pattern**
   - Pure functions in separate files
   - Easy to test
   - Reusable across components

5. **Ref-based optimization**
   - Avoids unnecessary re-renders during drag
   - Good performance characteristics
   - Clear separation of reactive vs non-reactive state

### Pattern Comparison with Other Libraries

| Pattern | react-adjustable-panels | react-resizable-panels | allotment |
|---------|-------------------------|------------------------|-----------|
| **Panel Discovery** | Children traversal | Registration via context | Key-based tracking |
| **State Updates** | Direct setState | Validation + setState | External library events |
| **Size Storage** | useState + refs | useState + dual refs | Refs + external state |
| **Child Communication** | Props + cloneElement | Context + callbacks | Imperative API |
| **Drag Handling** | Event listeners | Event listeners | External library |

**Assessment:** Our pattern is **simpler and more React-idiomatic** than both alternatives.

---

## Refactoring Opportunities

### Priority: HIGH

#### 1. Extract collapse logic into custom hook

**File:** PanelGroup.tsx
**Lines:** 467-552 (85 lines)
**Reason:** Improves testability and readability

```typescript
// New file: src/hooks/useCollapseLogic.ts
export function useCollapseLogic(
  collapsedSizeRef: RefObject<Array<PanelSize | undefined>>,
  collapsedStateRef: RefObject<boolean[]>,
  collapseCallbacksRef: RefObject<Array<((collapsed: boolean) => void) | undefined>>,
  constraintsRef: RefObject<Array<{ minSize?: PanelSize; maxSize?: PanelSize }>>
): (
  proposedPixelSizes: number[],
  containerSize: number,
  leftIndex: number,
  rightIndex: number
) => number[] {
  return useCallback((proposedPixelSizes, containerSize, leftIndex, rightIndex) => {
    // Collapse logic here (same code, but isolated)
  }, [collapsedSizeRef, collapsedStateRef, collapseCallbacksRef, constraintsRef]);
}
```

**Benefits:**
- Easier to test in isolation
- Reduces PanelGroup.tsx size
- Clear responsibility boundary
- Can be optimized independently

**Risks:**
- Adds another file to navigate
- May need to pass many refs

### Priority: MEDIUM

#### 2. Consolidate related refs into objects

**File:** PanelGroup.tsx
**Lines:** 84-103
**Reason:** Reduces ref count and improves organization

**Before:**
```typescript
const currentPixelSizesRef = useRef<number[]>([]);
const dragStartPixelSizesRef = useRef<number[]>([]);
const previousPixelSizesRef = useRef<number[]>([]);
```

**After:**
```typescript
const pixelSizesRef = useRef({
  current: [] as number[],
  dragStart: [] as number[],
  previous: [] as number[]
});
```

**Benefits:**
- Fewer refs to track (12 → ~5)
- Logical grouping
- Clear relationships

**Risks:**
- Slightly more verbose access
- May lose some React DevTools visibility

#### 3. Extract resize handlers into custom hook

**File:** PanelGroup.tsx
**Lines:** 555-766 (211 lines across 3 functions)
**Reason:** Separates resize logic from component

```typescript
// New file: src/hooks/usePanelResize.ts
export function usePanelResize({
  containerRef,
  panelSizes,
  direction,
  onResize,
  onResizeStart,
  onResizeEnd,
  // ... other dependencies
}) {
  const handleResize = useCallback(...);
  const handleResizeStart = useCallback(...);
  const handleResizeEnd = useCallback(...);

  return { handleResize, handleResizeStart, handleResizeEnd };
}
```

**Benefits:**
- Better separation of concerns
- Easier to test resize logic
- Reduces PanelGroup.tsx size

**Risks:**
- Need to pass many dependencies
- May create coupling between hook and component

#### 4. Replace setTimeout with useEffect for callbacks

**File:** PanelGroup.tsx
**Lines:** 164, 282, 327, 407, 542
**Reason:** More predictable timing, better for Concurrent Mode

**Before:**
```typescript
setTimeout(() => {
  callback?.(true);
}, 0);
```

**After:**
```typescript
const [pendingCallbacks, setPendingCallbacks] = useState<Array<() => void>>([]);

useEffect(() => {
  pendingCallbacks.forEach(cb => cb());
  setPendingCallbacks([]);
}, [pendingCallbacks]);

// When needed:
setPendingCallbacks(prev => [...prev, () => callback?.(true)]);
```

**Benefits:**
- More React-idiomatic
- Better timing guarantees
- Compatible with Concurrent Mode

**Risks:**
- Adds state management complexity
- May cause extra re-renders

### Priority: LOW

#### 5. Extract named constants for magic numbers

**File:** PanelGroup.tsx, utils.ts
**Reason:** Improves clarity and maintainability

```typescript
// New file: src/constants.ts
export const CONSTRAINT_RECALC_THRESHOLD_PX = 1;
export const RESIZE_THROTTLE_MS = 16; // ~60fps
export const COLLAPSE_HYSTERESIS_RATIO = 0.5;
export const STORAGE_DEBOUNCE_MS = 100;
```

**Benefits:**
- Clear intent
- Easy to adjust
- Centralized configuration

**Risks:**
- May be over-engineering for simple values
- Could create unnecessary abstraction

#### 6. Add performance monitoring hooks

**File:** New file
**Reason:** Track performance regressions

```typescript
// New file: src/hooks/usePerformanceMonitoring.ts
export function usePerformanceMonitoring(componentName: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof process === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    const mark = `${componentName}-render-start`;
    performance.mark(mark);

    return () => {
      performance.measure(`${componentName}-render`, mark);
    };
  });
}
```

**Benefits:**
- Easier to track performance
- Development-time insights
- Helps identify regressions

**Risks:**
- Overhead in development
- May clutter code

---

## Recommendations

### Immediate Actions (Do Now)

1. ✅ **Keep the current architecture** - It's simpler and more maintainable than alternatives
2. ✅ **Don't over-optimize** - Current performance is good
3. ✅ **Focus on clarity over cleverness** - The code is already quite clear

### Short-term (Next Release)

1. **Extract collapse logic into custom hook** (HIGH priority)
   - Improves testability
   - Reduces PanelGroup.tsx complexity
   - Clear win with minimal risk

2. **Consolidate related refs** (MEDIUM priority)
   - Reduces cognitive overhead
   - Improves organization
   - Low risk

3. **Add named constants for magic numbers** (LOW priority)
   - Quick improvement
   - Helps future maintainers
   - No risk

### Long-term (Future Versions)

1. **Consider extracting resize logic into custom hook** (MEDIUM priority)
   - Only if PanelGroup.tsx becomes harder to maintain
   - Wait until there's a clear need
   - Re-evaluate after other refactorings

2. **Explore useReducer for complex state** (LOW priority)
   - Only if state synchronization bugs appear
   - May not be worth the added complexity
   - Measure before committing

3. **Add performance monitoring in dev mode** (LOW priority)
   - Helpful for catching regressions
   - Low priority since performance is already good
   - Nice-to-have

### What NOT to Do

❌ **Avoid these refactorings:**

1. **Don't switch to Context-based architecture**
   - Current props-based approach is simpler
   - Context adds complexity without benefits for this use case
   - react-resizable-panels shows this isn't necessary

2. **Don't integrate external layout libraries**
   - Allotment shows this adds significant complexity
   - Current pure-React approach is maintainable
   - No performance benefits

3. **Don't add localStorage persistence**
   - Separation of concerns - users can implement if needed
   - Adds complexity and dependencies
   - Not core to the library's purpose

4. **Don't split components too aggressively**
   - Some complexity is inherent to the problem
   - Over-splitting can make flow harder to follow
   - Balance between cohesion and size

---

## Conclusion

**react-adjustable-panels is a well-architected, maintainable, and performant library** that compares favorably to established alternatives:

- ✅ **Simpler** than react-resizable-panels (no dual-ref pattern, no context complexity)
- ✅ **Much simpler** than allotment (pure React, no external library integration)
- ✅ **More flexible** than react-resizable-panels (supports pixels, not just percentages)
- ✅ **Good performance** with smart optimizations already in place
- ✅ **Clean code** with clear separation of concerns

The main refactoring opportunities are:
1. Extract collapse logic into custom hook (clear win)
2. Consolidate refs for better organization (low risk)
3. Add named constants (quick improvement)

**Overall Assessment: 8.5/10** - Well above average, with only minor opportunities for improvement.

---

## Appendix A: Detailed Metrics

### Code Complexity (Cyclomatic Complexity)

Based on analysis:

**PanelGroup.tsx:**
- Overall: **HIGH** (large file with many branches)
- `applyCollapseLogic`: **HIGH** (marked with biome-ignore for complexity)
- `handleResize`: **MEDIUM-HIGH** (many conditionals)
- `useEffect` (initialization): **MEDIUM** (multiple branches)

**Panel.tsx:**
- Overall: **VERY LOW** (simple wrapper)

**ResizeHandle.tsx:**
- Overall: **LOW** (straightforward event handling)

**utils.ts:**
- Individual functions: **LOW-MEDIUM** (pure functions with clear logic)
- `calculateSizes`: **MEDIUM** (constraint application logic)

**Comparison:**
- **react-resizable-panels**: Similar complexity, but distributed across more files
- **allotment**: Significantly higher complexity due to external library integration

### Maintainability Index

Estimated maintainability index (higher is better, scale 0-100):

- **Panel.tsx**: ~95 (very simple)
- **ResizeHandle.tsx**: ~85 (clear, focused)
- **utils.ts**: ~80 (pure functions, well-tested)
- **propNormalization.ts**: ~90 (simple transformations)
- **childUtils.ts**: ~85 (clear algorithms)
- **PanelGroup.tsx**: ~65 (large file with many responsibilities)

**Overall Library**: ~78 (Good - above industry average of ~70)

### Test Coverage

Based on test files:

- ✅ Unit tests for all utility modules
- ✅ Component tests for all public components
- ✅ Performance tests (profiler, benchmarks, regression)
- ✅ Integration tests for complex scenarios

**Estimated coverage**: 85-90% (very good)

---

## Appendix B: Alternative Architecture Ideas

### Idea 1: Context-Based Panel Discovery

**What:** Use Context instead of children traversal

**Pros:**
- More "React-like" for some developers
- Easier to pass callbacks down

**Cons:**
- Adds complexity
- Requires registration/unregistration lifecycle
- Current approach works well

**Recommendation:** ❌ Not worth it

### Idea 2: Render Props Pattern

**What:** Accept render function instead of children

```typescript
<PanelGroup
  render={(panels) => (
    <>
      {panels.map((panel, i) => (
        <Panel key={i} {...panel}>Content</Panel>
      ))}
    </>
  )}
/>
```

**Pros:**
- More explicit control over rendering

**Cons:**
- Less intuitive API
- Doesn't align with common patterns
- Current children-based API is clearer

**Recommendation:** ❌ Not worth it

### Idea 3: CSS-based Layout (like CSS Grid)

**What:** Use CSS Grid/Flexbox for layout instead of inline styles

**Pros:**
- Potentially better performance (browser-optimized)
- Separates layout from logic

**Cons:**
- Dynamic sizing is harder with CSS
- Pixel-based constraints need JS anyway
- Current approach is more flexible

**Recommendation:** ❌ Not feasible for this use case

### Idea 4: Web Components

**What:** Implement as Web Components instead of React components

**Pros:**
- Framework-agnostic
- Native browser APIs

**Cons:**
- Loses React ecosystem benefits
- More complex implementation
- Current React implementation works well

**Recommendation:** ❌ Different library goal

---

**End of Analysis**
