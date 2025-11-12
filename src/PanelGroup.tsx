import {
  type CSSProperties,
  cloneElement,
  forwardRef,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useLayoutEffect
} from 'react';
import { findPanelChildren, flattenPanelChildren } from './childUtils';
import { Panel } from './Panel';
import { normalizePanelGroupProps, normalizePanelProps } from './propNormalization';
import { ResizeHandle, type ResizeHandleProps } from './ResizeHandle';
import type { PanelGroupHandle, PanelGroupProps, PanelProps, PanelSize, PanelSizeInfo, ResizeInfo } from './types';
import {
  calculateSizes,
  calculateSizesWithPixelConstraints,
  clampSize,
  convertFromPixels,
  convertToPixels,
  formatSize,
  parseSize,
  throttle,
} from './utils';

/**
 * PanelGroup component - Container for resizable panels with drag handles.
 *
 * Manages a group of resizable panels with automatic or manual resize handles.
 * Supports horizontal and vertical layouts, pixel and percentage sizing,
 * collapsible panels, touch/mouse/keyboard input, and provides an imperative
 * API for programmatic control.
 *
 * @example
 * ```tsx
 * // Basic horizontal layout
 * <PanelGroup direction="horizontal">
 *   <Panel defaultSize="30%" minSize="200px">Sidebar</Panel>
 *   <ResizeHandle />
 *   <Panel defaultSize="auto">Main content</Panel>
 * </PanelGroup>
 * ```
 *
 * @example
 * ```tsx
 * // Vertical layout with callbacks
 * <PanelGroup
 *   direction="vertical"
 *   onResize={(sizes) => console.log('Sizes:', sizes)}
 * >
 *   <Panel defaultSize="200px">Header</Panel>
 *   <Panel defaultSize="auto">Content</Panel>
 *   <Panel defaultSize="100px">Footer</Panel>
 * </PanelGroup>
 * ```
 *
 * @example
 * ```tsx
 * // Imperative API for programmatic control
 * const groupRef = useRef<PanelGroupHandle>(null);
 *
 * const resetLayout = () => {
 *   groupRef.current?.setSizes(['30%', 'auto']);
 * };
 *
 * <PanelGroup ref={groupRef}>
 *   <Panel>Left</Panel>
 *   <Panel>Right</Panel>
 * </PanelGroup>
 * ```
 */
export const PanelGroup = forwardRef<PanelGroupHandle, PanelGroupProps>((rawProps, ref) => {
  // Normalize props at component boundary - provides defaults for optional values
  const { children, direction, className, style, onResize, onResizeStart, onResizeEnd } = {
    children: rawProps.children,
    ...normalizePanelGroupProps(rawProps),
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [panelSizes, setPanelSizes] = useState<PanelSize[]>([]);
  const [pixelSizes, setPixelSizes] = useState<number[]>([]);
  const isDraggingRef = useRef(false);
  const isInitializedRef = useRef(false);

  /**
   * Consolidated panel data structure - eliminates synchronization bugs
   * by storing all panel-related data in a single array.
   *
   * Benefits:
   * - Impossible for data to get out of sync (single source of truth)
   * - Automatic bounds checking (array length is always consistent)
   * - Better cache locality (related data stored together)
   * - Easier to maintain and reason about
   *
   * This replaces the previous approach of having 8 separate ref arrays:
   * - currentPixelSizesRef, dragStartPixelSizesRef, previousPixelSizesRef
   * - constraintsRef, originalUnitsRef
   * - collapsedSizeRef, collapsedStateRef, collapseCallbacksRef
   */
  interface PanelData {
    // Size tracking
    currentPixelSize: number;
    dragStartPixelSize: number;
    previousPixelSize: number;
    originalUnit: 'px' | '%' | 'auto';

    // Constraints
    constraints: { minSize?: PanelSize; maxSize?: PanelSize };

    // Collapse support
    collapsedSize?: PanelSize;
    collapsedState: boolean;
    collapseCallback?: (collapsed: boolean) => void;
  }

  const panelDataRef = useRef<PanelData[]>([]);

  // Constraint cache for performance optimization
  const constraintCacheRef = useRef<{
    containerSize: number;
    constraints: Array<{ minPx?: number; maxPx?: number }>;
    constraintHash: string;
  } | null>(null);

  // Initialize panel sizes and constraints
  useEffect(() => {
    // Extract panel children inside useEffect to avoid dependency issues
    // Use recursive discovery to support wrapped Panels
    const panelChildren = findPanelChildren<PanelProps>(children, Panel, ResizeHandle);

    const panelCount = panelChildren.length;
    if (panelCount === 0) return;

    const newPanelData: PanelData[] = [];
    const newSizes: PanelSize[] = [];

    panelChildren.forEach((child, index) => {
      const rawProps = child.props as PanelProps;

      // Normalize Panel props (same normalization that Panel component does internally)
      // We need this because we're reading props from React children, which are still raw
      const { defaultSize, minSize, maxSize, collapsedSize, defaultCollapsed, onCollapse } =
        normalizePanelProps(rawProps);

      // Determine initial size and unit
      let initialSize: PanelSize;
      let initialUnit: 'px' | '%' | 'auto';

      // If panel should start collapsed, use collapsedSize instead of defaultSize
      if (defaultCollapsed && collapsedSize) {
        initialSize = collapsedSize;
        initialUnit = parseSize(collapsedSize).unit;
      } else {
        // Use normalized defaultSize (never undefined)
        initialSize = defaultSize;
        initialUnit = parseSize(defaultSize).unit;
      }

      newSizes.push(initialSize);

      // Preserve existing pixel sizes if panel already exists at this index
      const existingData = panelDataRef.current[index];
      const preservePixelSizes = existingData !== undefined;

      // Create consolidated panel data object
      newPanelData.push({
        // Size tracking - preserve existing pixel sizes if available
        currentPixelSize: preservePixelSizes ? existingData.currentPixelSize : 0,
        dragStartPixelSize: preservePixelSizes ? existingData.dragStartPixelSize : 0,
        previousPixelSize: preservePixelSizes ? existingData.previousPixelSize : 0,
        originalUnit: initialUnit,

        // Constraints (convert 'auto' to undefined for optional constraints)
        constraints: {
          minSize: minSize === 'auto' ? undefined : minSize,
          maxSize: maxSize === 'auto' ? undefined : maxSize,
        },

        // Collapse support
        collapsedSize,
        collapsedState: preservePixelSizes ? existingData.collapsedState : defaultCollapsed,
        collapseCallback: onCollapse,
      });
    });

    // Always update panel data as props might have changed
    panelDataRef.current = newPanelData;

    // Fire initial collapse callbacks for panels that start collapsed (only on first init)
    if (!isInitializedRef.current || panelSizes.length === 0) {
      queueMicrotask(() => {
        newPanelData.forEach((data) => {
          if (data.collapsedState && data.collapseCallback) {
            data.collapseCallback(true);
          }
        });
      });
    }

    // Initialize sizes if not yet initialized OR if state was cleared (e.g., by Strict Mode remount)
    // OR if panel count changed (panels added/removed dynamically)
    if (!isInitializedRef.current || panelSizes.length === 0 || panelSizes.length !== newSizes.length) {
      setPanelSizes(newSizes);
      isInitializedRef.current = true;
    }
  }, [children, panelSizes.length]);

  // Calculate pixel sizes whenever panel sizes or container changes
  // Use useIsomorphicLayoutEffect to ensure synchronous DOM measurements before paint in browser
  // while avoiding SSR/test environment issues
  useLayoutEffect(() => {
    if (!containerRef.current || panelSizes.length === 0) return;

    const updateSizes = () => {
      if (!containerRef.current || isDraggingRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;

      // Check if we need to recalculate constraint cache
      // Recalculate when:
      // 1. No cache exists
      // 2. Container size changes significantly (>1px)
      // 3. Constraint definitions change (detected via hash)
      // Hash only the values that matter for more efficient comparison
      const constraintHash = panelDataRef.current.map(d => `${d.constraints.minSize}:${d.constraints.maxSize}`).join('|');
      const needsConstraintUpdate =
        !constraintCacheRef.current ||
        Math.abs(constraintCacheRef.current.containerSize - containerSize) > 1 ||
        constraintCacheRef.current.constraintHash !== constraintHash;

      if (needsConstraintUpdate) {
        // Convert constraints to pixels once and cache them
        const pixelConstraints = panelDataRef.current.map(d => ({
          minPx: d.constraints.minSize ? convertToPixels(parseSize(d.constraints.minSize), containerSize) : undefined,
          maxPx: d.constraints.maxSize ? convertToPixels(parseSize(d.constraints.maxSize), containerSize) : undefined,
        }));

        constraintCacheRef.current = {
          containerSize,
          constraints: pixelConstraints,
          constraintHash,
        };
      }

      // Use optimized calculation with cached pixel constraints
      // TypeScript: constraintCacheRef.current is guaranteed non-null here because
      // we either just set it in the if block above, or it was already set previously
      const pixels = calculateSizesWithPixelConstraints(
        panelSizes,
        containerSize,
        constraintCacheRef.current!.constraints
      );

      // Override with collapsed sizes for panels that are collapsed
      // This prevents minSize enforcement from breaking collapsed state
      let totalAdjustment = 0;
      for (let i = 0; i < pixels.length; i++) {
        const panelData = panelDataRef.current[i];
        if (panelData?.collapsedState && panelData.collapsedSize) {
          const collapsedPx = convertToPixels(parseSize(panelData.collapsedSize), containerSize);
          const diff = pixels[i] - collapsedPx;
          pixels[i] = collapsedPx;
          totalAdjustment += diff;
        }
      }

      // Redistribute the adjustment to auto-sized panels to maintain total
      if (totalAdjustment !== 0) {
        const autoIndices = panelSizes.map((size, i) => (size === 'auto' ? i : -1)).filter(i => i !== -1);

        if (autoIndices.length > 0) {
          const perPanel = totalAdjustment / autoIndices.length;
          autoIndices.forEach(i => {
            pixels[i] += perPanel;
          });
        }
      }

      // Update consolidated panel data with current pixel sizes
      for (let i = 0; i < pixels.length; i++) {
        if (panelDataRef.current[i]) {
          panelDataRef.current[i].currentPixelSize = pixels[i];
        }
      }

      setPixelSizes(pixels);
    };

    // Throttle resize observer to ~60fps (16ms)
    const throttledUpdateSizes = throttle(updateSizes, 16);

    // Call updateSizes immediately on mount (not throttled)
    updateSizes();

    const resizeObserver = new ResizeObserver(throttledUpdateSizes);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [panelSizes, direction]);

  // Imperative API
  useImperativeHandle(ref, () => {
    // Helper to collapse a panel
    const collapsePanelImpl = (panelIndex: number) => {
      if (!containerRef.current) return;

      const panelData = panelDataRef.current[panelIndex];
      if (!panelData) {
        console.warn(`Panel ${panelIndex} does not exist`);
        return;
      }

      if (!panelData.collapsedSize) {
        console.warn(`Panel ${panelIndex} does not have a collapsedSize configured`);
        return;
      }

      if (panelData.collapsedState) return; // Already collapsed

      // Update collapsed state
      panelData.collapsedState = true;

      // Fire callback
      queueMicrotask(() => {
        panelData.collapseCallback?.(true);
      });

      // Force size update
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;

      // Extract constraints for calculateSizes
      const constraints = panelDataRef.current.map(d => d.constraints);
      const pixels = calculateSizes(panelSizes, containerSize, constraints);

      // Apply collapsed size
      const collapsedPx = convertToPixels(parseSize(panelData.collapsedSize), containerSize);
      const diff = pixels[panelIndex] - collapsedPx;
      pixels[panelIndex] = collapsedPx;

      // Redistribute to auto panels
      const autoIndices = panelSizes.map((size, i) => (size === 'auto' ? i : -1)).filter(i => i !== -1);
      if (autoIndices.length > 0) {
        const perPanel = diff / autoIndices.length;
        autoIndices.forEach(i => {
          pixels[i] += perPanel;
        });
      }

      // Update consolidated data
      for (let i = 0; i < pixels.length; i++) {
        if (panelDataRef.current[i]) {
          panelDataRef.current[i].currentPixelSize = pixels[i];
        }
      }

      setPixelSizes(pixels);
    };

    // Helper to expand a panel
    const expandPanelImpl = (panelIndex: number) => {
      if (!containerRef.current) return;

      const panelData = panelDataRef.current[panelIndex];
      if (!panelData) {
        console.warn(`Panel ${panelIndex} does not exist`);
        return;
      }

      const minSize = panelData.constraints.minSize;
      if (!minSize) {
        console.warn(`Panel ${panelIndex} does not have a minSize configured`);
        return;
      }

      if (!panelData.collapsedState) return; // Already expanded

      // Update collapsed state
      panelData.collapsedState = false;

      // Fire callback
      queueMicrotask(() => {
        panelData.collapseCallback?.(false);
      });

      // Force size update
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;

      // Extract constraints for calculateSizes
      const constraints = panelDataRef.current.map(d => d.constraints);
      const pixels = calculateSizes(panelSizes, containerSize, constraints);

      // Apply minSize
      const minPx = convertToPixels(parseSize(minSize), containerSize);
      const diff = minPx - pixels[panelIndex];
      pixels[panelIndex] = minPx;

      // Take from auto panels
      const autoIndices = panelSizes.map((size, i) => (size === 'auto' ? i : -1)).filter(i => i !== -1);
      if (autoIndices.length > 0) {
        const perPanel = diff / autoIndices.length;
        autoIndices.forEach(i => {
          pixels[i] -= perPanel;
        });
      }

      // Update consolidated data
      for (let i = 0; i < pixels.length; i++) {
        if (panelDataRef.current[i]) {
          panelDataRef.current[i].currentPixelSize = pixels[i];
        }
      }

      setPixelSizes(pixels);
    };

    return {
      setSizes: (sizes: PanelSize[]) => {
        // Use recursive discovery to support wrapped Panels
        const panelChildren = findPanelChildren<PanelProps>(children, Panel, ResizeHandle);
        const panelCount = panelChildren.length;

        if (sizes.length !== panelCount) {
          console.warn(`setSizes: Expected ${panelCount} sizes, got ${sizes.length}. Ignoring.`);
          return;
        }

        // Check if any sizes cross collapse thresholds and update collapsed state
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const containerSize = direction === 'horizontal' ? rect.width : rect.height;

          const collapsedTransitions: Array<{ index: number; collapsed: boolean }> = [];

          sizes.forEach((size, i) => {
            const panelData = panelDataRef.current[i];
            if (!panelData) return;

            const { collapsedSize, constraints, collapsedState: wasCollapsed } = panelData;
            const minSize = constraints.minSize;

            // Skip if panel doesn't support collapsing
            if (!collapsedSize || !minSize) return;

            const sizePx = convertToPixels(parseSize(size), containerSize);
            const minPx = convertToPixels(parseSize(minSize), containerSize);

            let shouldBeCollapsed = wasCollapsed;

            // Use same threshold logic as drag behavior
            if (wasCollapsed) {
              // Only expand when size is above minSize
              if (sizePx > minPx) {
                shouldBeCollapsed = false;
              }
            } else {
              // Collapse when size is below minSize
              if (sizePx < minPx) {
                shouldBeCollapsed = true;
              }
            }

            if (shouldBeCollapsed !== wasCollapsed) {
              panelData.collapsedState = shouldBeCollapsed;
              collapsedTransitions.push({ index: i, collapsed: shouldBeCollapsed });
            }
          });

          // Fire onCollapse callbacks for state changes
          if (collapsedTransitions.length > 0) {
            queueMicrotask(() => {
              collapsedTransitions.forEach(({ index, collapsed }) => {
                const panelData = panelDataRef.current[index];
                panelData?.collapseCallback?.(collapsed);
              });
            });
          }
        }

        setPanelSizes(sizes);

        // Update original units for future resize operations
        sizes.forEach((size, i) => {
          const panelData = panelDataRef.current[i];
          if (panelData) {
            panelData.originalUnit = parseSize(size).unit;
          }
        });
      },
      getSizes: () => panelSizes,

      // Collapse control methods
      collapsePanel: collapsePanelImpl,
      expandPanel: expandPanelImpl,

      setCollapsed: (panelIndex: number, collapsed: boolean) => {
        if (collapsed) {
          collapsePanelImpl(panelIndex);
        } else {
          expandPanelImpl(panelIndex);
        }
      },

      isCollapsed: (panelIndex: number): boolean => {
        return panelDataRef.current[panelIndex]?.collapsedState ?? false;
      },
    };
  }, [panelSizes, children, direction]);

  // Helper to create PanelSizeInfo from pixel sizes
  const createSizeInfo = useCallback((pixelSizes: number[], containerSize: number): PanelSizeInfo[] => {
    return pixelSizes.map((pixels, i) => {
      // Get unit from consolidated panel data, with defensive fallback
      const unit = panelDataRef.current[i]?.originalUnit || 'auto';
      const percent = (pixels / containerSize) * 100;
      const value = convertFromPixels(pixels, containerSize, unit);
      const size = formatSize(value, unit);
      return { size, pixels, percent };
    });
  }, []);

  // Helper to apply custom sizes from callback
  const applySizeInfo = useCallback((sizeInfos: PanelSizeInfo[], containerSize: number): number[] => {
    return sizeInfos.map(info => {
      // User might have mutated pixels directly
      if (info.pixels !== undefined) {
        return info.pixels;
      }
      // Or they might have set a new size
      const parsed = parseSize(info.size);
      return convertToPixels(parsed, containerSize);
    });
  }, []);

  // Apply collapse logic to proposed sizes for the panels being resized
  const applyCollapseLogic = useCallback(
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Collapse logic requires checking multiple conditions
    (proposedPixelSizes: number[], containerSize: number, leftIndex: number, rightIndex: number): number[] => {
      // Performance optimization: Early exit if neither panel has collapse support
      const leftPanel = panelDataRef.current[leftIndex];
      const rightPanel = panelDataRef.current[rightIndex];
      const hasCollapsiblePanels = leftPanel?.collapsedSize !== undefined || rightPanel?.collapsedSize !== undefined;

      if (!hasCollapsiblePanels) {
        return proposedPixelSizes; // Return original array without cloning
      }

      const finalSizes = [...proposedPixelSizes];
      const collapsedTransitions: Array<{ index: number; collapsed: boolean }> = [];

      // Only check collapse for the two panels being resized
      for (const i of [leftIndex, rightIndex]) {
        const panelData = panelDataRef.current[i];
        if (!panelData) continue;

        const { collapsedSize, constraints, collapsedState: wasCollapsed, currentPixelSize } = panelData;
        if (!collapsedSize) continue;

        const minSize = constraints.minSize;
        if (!minSize) continue;

        const collapsedPx = convertToPixels(parseSize(collapsedSize), containerSize);
        const minPx = convertToPixels(parseSize(minSize), containerSize);

        if (collapsedPx >= minPx) {
          console.warn(`Panel ${i}: collapsedSize (${collapsedSize}) must be less than minSize (${minSize})`);
          continue;
        }

        const proposedPx = proposedPixelSizes[i];
        const currentPx = currentPixelSize;

        let shouldBeCollapsed = wasCollapsed;

        // VSCode-style hysteresis: Use midpoint between collapsed and min size as threshold
        // Direction of drag determines action
        const midpoint = (collapsedPx + minPx) / 2;
        const isDraggingSmaller = proposedPx < currentPx;
        const isDraggingLarger = proposedPx > currentPx;

        // Dragging smaller and crossing midpoint → collapse
        if (isDraggingSmaller && proposedPx < midpoint && !wasCollapsed) {
          shouldBeCollapsed = true;
        }
        // Dragging larger and crossing midpoint → expand
        else if (isDraggingLarger && proposedPx > midpoint && wasCollapsed) {
          shouldBeCollapsed = false;
        }

        // Snap to target size when state changes, or maintain snapped size
        if (shouldBeCollapsed) {
          const diff = proposedPx - collapsedPx;
          finalSizes[i] = collapsedPx;
          // Redistribute the difference to the adjacent panel
          const otherIndex = i === leftIndex ? rightIndex : leftIndex;
          finalSizes[otherIndex] += diff;
        } else if (wasCollapsed && !shouldBeCollapsed) {
          // Just transitioned from collapsed to expanded - snap to minSize
          const diff = minPx - proposedPx;
          finalSizes[i] = minPx;
          // Take the difference from the adjacent panel
          const otherIndex = i === leftIndex ? rightIndex : leftIndex;
          finalSizes[otherIndex] -= diff;
        }

        if (shouldBeCollapsed !== wasCollapsed) {
          panelData.collapsedState = shouldBeCollapsed;
          collapsedTransitions.push({ index: i, collapsed: shouldBeCollapsed });
        }
      }

      if (collapsedTransitions.length > 0) {
        queueMicrotask(() => {
          collapsedTransitions.forEach(({ index, collapsed }) => {
            const panelData = panelDataRef.current[index];
            panelData?.collapseCallback?.(collapsed);
          });
        });
      }

      return finalSizes;
    },
    []
  );

  // Handle resize drag
  const handleResize = useCallback(
    (handleIndex: number, cumulativeDelta: number) => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;

      // Update the two panels adjacent to the handle
      const leftIndex = handleIndex;
      const rightIndex = handleIndex + 1;

      // Use drag start sizes as base for proposed sizes (prevents drift)
      const dragStartSizes = panelDataRef.current.map(d => d.dragStartPixelSize);

      // Early exit if not properly initialized (shouldn't happen with robust handleResizeStart)
      if (!dragStartSizes || dragStartSizes.length === 0) {
        console.error('dragStartSizes not initialized - this should not happen');
        return;
      }

      let proposedPixelSizes = [...dragStartSizes];

      const expectedTotal = dragStartSizes[leftIndex] + dragStartSizes[rightIndex];

      // Get panel data for constraints
      const leftData = panelDataRef.current[leftIndex];
      const rightData = panelDataRef.current[rightIndex];

      if (!leftData || !rightData) {
        console.error(`Panel data not found for indices ${leftIndex} or ${rightIndex}`);
        return;
      }

      // When collapsedSize is present, use it as the effective minimum (allow dragging to collapsed size)
      const leftMinPx = leftData.collapsedSize
        ? convertToPixels(parseSize(leftData.collapsedSize), containerSize)
        : leftData.constraints.minSize
          ? convertToPixels(parseSize(leftData.constraints.minSize), containerSize)
          : 0;
      const leftMaxPx = leftData.constraints.maxSize
        ? convertToPixels(parseSize(leftData.constraints.maxSize), containerSize)
        : Infinity;
      const rightMinPx = rightData.collapsedSize
        ? convertToPixels(parseSize(rightData.collapsedSize), containerSize)
        : rightData.constraints.minSize
          ? convertToPixels(parseSize(rightData.constraints.minSize), containerSize)
          : 0;
      const rightMaxPx = rightData.constraints.maxSize
        ? convertToPixels(parseSize(rightData.constraints.maxSize), containerSize)
        : Infinity;

      // Apply cumulative delta from drag start and constraints while maintaining total size
      let newLeft = dragStartSizes[leftIndex] + cumulativeDelta;
      let newRight = expectedTotal - newLeft;

      // Clamp left panel
      newLeft = clampSize(newLeft, leftMinPx, leftMaxPx);
      newRight = expectedTotal - newLeft;

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

      // Final adjustment to guarantee total is maintained
      newRight = expectedTotal - newLeft;

      proposedPixelSizes[leftIndex] = newLeft;
      proposedPixelSizes[rightIndex] = newRight;

      // Apply collapse logic (snaps to collapsedSize/minSize based on thresholds)
      proposedPixelSizes = applyCollapseLogic(proposedPixelSizes, containerSize, leftIndex, rightIndex);

      // Start with proposed sizes, callback can transform them
      let finalPixelSizes = [...proposedPixelSizes];

      // Call onResize callback with full info
      if (onResize) {
        const currentSizes = createSizeInfo(panelDataRef.current.map(d => d.currentPixelSize), containerSize);
        const proposedSizes = createSizeInfo(proposedPixelSizes, containerSize);
        const previousSizes = createSizeInfo(panelDataRef.current.map(d => d.previousPixelSize), containerSize);
        const resizeInfo: ResizeInfo = {
          currentSizes,
          proposedSizes,
          previousSizes,
          containerSize,
          direction,
        };

        // Call callback - it can return new sizes if it wants to override
        const customSizes = onResize(resizeInfo);

        // Use returned sizes if provided, otherwise use proposed sizes
        if (customSizes) {
          finalPixelSizes = applySizeInfo(customSizes, containerSize);
        }
        // If no return value, keep finalPixelSizes as proposedPixelSizes
      }

      // Update consolidated panel data with current pixel sizes
      for (let i = 0; i < finalPixelSizes.length; i++) {
        if (panelDataRef.current[i]) {
          panelDataRef.current[i].currentPixelSize = finalPixelSizes[i];
        }
      }

      // During drag, only update pixel sizes (not panel sizes)
      // This prevents the useEffect from recalculating and causing jumps
      setPixelSizes(finalPixelSizes);
    },
    [direction, onResize, createSizeInfo, applySizeInfo, applyCollapseLogic]
  );

  const handleResizeStart = useCallback(() => {
    if (!containerRef.current) return;

    isDraggingRef.current = true;

    // Capture current sizes as "previous" and "dragStart" for the drag operation
    for (let i = 0; i < panelDataRef.current.length; i++) {
      const data = panelDataRef.current[i];
      data.previousPixelSize = data.currentPixelSize;
      data.dragStartPixelSize = data.currentPixelSize;
    }

    // Call onResizeStart with current state
    if (onResizeStart) {
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;
      const currentPixels = panelDataRef.current.map(d => d.currentPixelSize);
      const previousPixels = panelDataRef.current.map(d => d.previousPixelSize);

      const currentSizes = createSizeInfo(currentPixels, containerSize);
      const proposedSizes = createSizeInfo(currentPixels, containerSize);
      const previousSizes = createSizeInfo(previousPixels, containerSize);

      const resizeInfo: ResizeInfo = {
        currentSizes,
        proposedSizes,
        previousSizes,
        containerSize,
        direction,
      };

      onResizeStart(resizeInfo);
    }
  }, [onResizeStart, direction, createSizeInfo]);

  const handleResizeEnd = useCallback(() => {
    isDraggingRef.current = false;

    // Update panelSizes to match the final pixelSizes
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const containerSize = direction === 'horizontal' ? rect.width : rect.height;

    let finalPixelSizes = panelDataRef.current.map(d => d.currentPixelSize);

    // Call onResizeEnd with full info - it can override final sizes
    if (onResizeEnd) {
      const currentSizes = createSizeInfo(finalPixelSizes, containerSize);
      const proposedSizes = createSizeInfo(finalPixelSizes, containerSize);
      const previousSizes = createSizeInfo(panelDataRef.current.map(d => d.previousPixelSize), containerSize);

      const resizeInfo: ResizeInfo = {
        currentSizes,
        proposedSizes,
        previousSizes,
        containerSize,
        direction,
      };

      // Call callback - it can return new sizes if it wants to override
      const customSizes = onResizeEnd(resizeInfo);

      // Use returned sizes if provided, otherwise keep current sizes
      if (customSizes) {
        finalPixelSizes = applySizeInfo(customSizes, containerSize);
      }
      // If no return value, keep finalPixelSizes as is
    }

    // Update consolidated panel data with final sizes
    for (let i = 0; i < finalPixelSizes.length; i++) {
      if (panelDataRef.current[i]) {
        panelDataRef.current[i].currentPixelSize = finalPixelSizes[i];
      }
    }

    setPixelSizes(finalPixelSizes);

    // Convert final pixel sizes back to panel sizes to maintain proportions when container resizes
    // This prevents panels from reverting to original sizes in nested layouts
    const newPanelSizes = finalPixelSizes.map((pixels, i) => {
      // Get unit from consolidated panel data, with defensive fallback
      const unit = panelDataRef.current[i]?.originalUnit || 'auto';
      const value = convertFromPixels(pixels, containerSize, unit);
      return formatSize(value, unit);
    });
    setPanelSizes(newPanelSizes);
  }, [direction, onResizeEnd, createSizeInfo, applySizeInfo]);

  const flexDirection = direction === 'horizontal' ? 'row' : 'column';

  // Process children to separate panels and handles
  // Use recursive flattening to support wrapped Panels and ResizeHandles
  // Memoize to avoid re-traversal on every render
  const childArray = useMemo(() => flattenPanelChildren(children, Panel, ResizeHandle), [children]);

  const processedChildren: ReactNode[] = [];
  let panelIndex = 0;

  // Count total panels (not including ResizeHandles) for isLastPanel check
  const panelCount = childArray.filter(child => child.type === Panel).length;

  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];

    // Check if this is a ResizeHandle component
    const isHandle = child.type === ResizeHandle;

    if (isHandle) {
      // This is a custom ResizeHandle - clone it with event handlers
      const handleIndex = panelIndex - 1; // The handle affects the panel before it
      const clonedHandle = cloneElement(
        child as ReactElement<ResizeHandleProps>,
        {
          direction,
          onDragStart: handleResizeStart,
          onDrag: (delta: number) => handleResize(handleIndex, delta),
          onDragEnd: handleResizeEnd,
        } as Partial<ResizeHandleProps>
      );
      processedChildren.push(clonedHandle);
    } else {
      // This is a Panel - apply sizing styles
      const props = child.props as PanelProps;
      const panelStyle: CSSProperties = {
        ...props.style,
        flex: 'none',
        overflow: 'auto',
        ...(direction === 'horizontal'
          ? { width: `${pixelSizes[panelIndex] || 0}px`, height: '100%' }
          : { height: `${pixelSizes[panelIndex] || 0}px`, width: '100%' }),
      };

      const panel = cloneElement(child, {
        style: panelStyle,
      } as Partial<PanelProps>);

      processedChildren.push(panel);

      // Check if we need to insert a default ResizeHandle
      const nextChild = childArray[i + 1];
      const nextIsHandle = nextChild && nextChild.type === ResizeHandle;
      const isLastPanel = panelIndex === panelCount - 1;

      if (!isLastPanel && !nextIsHandle) {
        // Insert default ResizeHandle
        // Capture current panelIndex value for closure (avoid stale reference)
        const handleIndexForThisHandle = panelIndex;
        processedChildren.push(
          <ResizeHandle
            key={`handle-${handleIndexForThisHandle}`}
            direction={direction}
            onDragStart={handleResizeStart}
            onDrag={delta => handleResize(handleIndexForThisHandle, delta)}
            onDragEnd={handleResizeEnd}
          />
        );
      }

      panelIndex++;
    }
  }

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: aria-orientation is valid for role=group per ARIA spec
    <div
      ref={containerRef}
      className={className}
      role="group"
      aria-orientation={direction === 'horizontal' ? 'horizontal' : 'vertical'}
      style={{
        display: 'flex',
        flexDirection,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
      data-panel-group={direction}
    >
      {processedChildren}
    </div>
  );
});

PanelGroup.displayName = 'PanelGroup';
