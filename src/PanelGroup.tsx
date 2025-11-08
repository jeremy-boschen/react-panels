import {
  Children,
  type CSSProperties,
  cloneElement,
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ResizeHandle, type ResizeHandleProps } from './ResizeHandle';
import type { PanelGroupHandle, PanelGroupProps, PanelProps, PanelSize, PanelSizeInfo, ResizeInfo } from './types';
import { calculateSizes, clampSize, convertFromPixels, convertToPixels, formatSize, parseSize } from './utils';

export const PanelGroup = forwardRef<PanelGroupHandle, PanelGroupProps>(
  ({ children, direction = 'horizontal', className, style, onResize, onResizeStart, onResizeEnd }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [panelSizes, setPanelSizes] = useState<PanelSize[]>([]);
    const [pixelSizes, setPixelSizes] = useState<number[]>([]);
    const currentPixelSizesRef = useRef<number[]>([]);
    const dragStartPixelSizesRef = useRef<number[]>([]);
    const constraintsRef = useRef<Array<{ minSize?: PanelSize; maxSize?: PanelSize }>>([]);
    const originalUnitsRef = useRef<Array<'px' | '%' | 'auto'>>([]);
    const isDraggingRef = useRef(false);
    const isInitializedRef = useRef(false);
    const previousPixelSizesRef = useRef<number[]>([]);

    // Collapse-related refs
    const collapsedSizeRef = useRef<Array<PanelSize | undefined>>([]);
    const collapsedStateRef = useRef<boolean[]>([]);
    const collapseCallbacksRef = useRef<Array<((collapsed: boolean) => void) | undefined>>([]);
    const controlledCollapsedRef = useRef<Array<boolean | undefined>>([]);

    // Initialize panel sizes and constraints
    useEffect(() => {
      // Extract panel children inside useEffect to avoid dependency issues
      const panelChildren = Children.toArray(children).filter(
        (child): child is ReactElement<PanelProps> => isValidElement(child) && child.type !== ResizeHandle
      );

      const panelCount = panelChildren.length;
      if (panelCount === 0) return;

      const newConstraints: Array<{ minSize?: PanelSize; maxSize?: PanelSize }> = [];
      const newSizes: PanelSize[] = [];
      const newUnits: Array<'px' | '%' | 'auto'> = [];

      const newCollapsedSizes: Array<PanelSize | undefined> = [];
      const newCollapsedStates: boolean[] = [];
      const newCollapseCallbacks: Array<((collapsed: boolean) => void) | undefined> = [];
      const newControlledCollapsed: Array<boolean | undefined> = [];

      panelChildren.forEach(child => {
        const props = child.props as PanelProps;
        const defaultSize = props.defaultSize;
        const minSize = props.minSize;
        const maxSize = props.maxSize;

        newConstraints.push({ minSize, maxSize });

        const collapsedSize = props.collapsedSize;
        const collapsed = props.collapsed;
        const defaultCollapsed = props.defaultCollapsed;
        const onCollapse = props.onCollapse;

        newCollapsedSizes.push(collapsedSize);
        newCollapseCallbacks.push(onCollapse);
        newControlledCollapsed.push(collapsed);

        // Initialize collapsed state
        const initialCollapsed = collapsed !== undefined ? collapsed : (defaultCollapsed ?? false);
        newCollapsedStates.push(initialCollapsed);

        // If panel should start collapsed, use collapsedSize instead of defaultSize
        if (initialCollapsed && collapsedSize) {
          newSizes.push(collapsedSize);
          newUnits.push(parseSize(collapsedSize).unit);
        } else if (defaultSize) {
          newSizes.push(defaultSize);
          newUnits.push(parseSize(defaultSize).unit);
        } else {
          // Default to auto (fills remaining space)
          newSizes.push('auto');
          newUnits.push('auto');
        }
      });

      // Always update constraints as they might have changed
      constraintsRef.current = newConstraints;

      collapsedSizeRef.current = newCollapsedSizes;
      collapseCallbacksRef.current = newCollapseCallbacks;
      controlledCollapsedRef.current = newControlledCollapsed;

      // Initialize collapsed state if not yet initialized
      if (!isInitializedRef.current || collapsedStateRef.current.length === 0) {
        collapsedStateRef.current = newCollapsedStates;

        // Fire initial collapse callbacks for panels that start collapsed
        setTimeout(() => {
          newCollapsedStates.forEach((collapsed, index) => {
            if (collapsed) {
              const callback = newCollapseCallbacks[index];
              callback?.(true);
            }
          });
        }, 0);
      }

      // Initialize sizes if not yet initialized OR if state was cleared (e.g., by Strict Mode remount)
      if (!isInitializedRef.current || panelSizes.length === 0) {
        originalUnitsRef.current = newUnits;
        setPanelSizes(newSizes);
        isInitializedRef.current = true;
      }
    }, [children, panelSizes.length]);

    // Calculate pixel sizes whenever panel sizes or container changes
    useEffect(() => {
      if (!containerRef.current || panelSizes.length === 0) return;

      const updateSizes = () => {
        if (!containerRef.current || isDraggingRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = direction === 'horizontal' ? rect.width : rect.height;

        const pixels = calculateSizes(panelSizes, containerSize, constraintsRef.current);

        // Override with collapsed sizes for panels that are collapsed
        // This prevents minSize enforcement from breaking collapsed state
        let totalAdjustment = 0;
        for (let i = 0; i < pixels.length; i++) {
          if (collapsedStateRef.current[i] && collapsedSizeRef.current[i]) {
            const collapsedPx = convertToPixels(parseSize(collapsedSizeRef.current[i]!), containerSize);
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

        currentPixelSizesRef.current = pixels;
        setPixelSizes(pixels);
      };

      updateSizes();

      const resizeObserver = new ResizeObserver(updateSizes);
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }, [panelSizes, direction]);

    // Imperative API
    useImperativeHandle(
      ref,
      () => ({
        setSizes: (sizes: PanelSize[]) => {
          const panelChildren = Children.toArray(children).filter(
            (child): child is ReactElement<PanelProps> => isValidElement(child) && child.type !== ResizeHandle
          );
          const panelCount = panelChildren.length;

          if (sizes.length !== panelCount) {
            console.warn(`setSizes: Expected ${panelCount} sizes, got ${sizes.length}. Ignoring.`);
            return;
          }

          setPanelSizes(sizes);

          // Update original units for future resize operations
          originalUnitsRef.current = sizes.map(size => parseSize(size).unit);
        },
        getSizes: () => panelSizes,
      }),
      [panelSizes, children]
    );

    // Helper to create PanelSizeInfo from pixel sizes
    const createSizeInfo = useCallback((pixelSizes: number[], containerSize: number): PanelSizeInfo[] => {
      return pixelSizes.map((pixels, i) => {
        const unit = originalUnitsRef.current[i];
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
      (proposedPixelSizes: number[], containerSize: number, leftIndex: number, rightIndex: number): number[] => {
        const finalSizes = [...proposedPixelSizes];
        const collapsedTransitions: Array<{ index: number; collapsed: boolean }> = [];

        // Only check collapse for the two panels being resized
        for (const i of [leftIndex, rightIndex]) {
          const collapsedSize = collapsedSizeRef.current[i];
          if (!collapsedSize) continue;

          const minSize = constraintsRef.current[i]?.minSize;
          if (!minSize) continue;

          const collapsedPx = convertToPixels(parseSize(collapsedSize), containerSize);
          const minPx = convertToPixels(parseSize(minSize), containerSize);

          if (collapsedPx >= minPx) {
            console.warn(`Panel ${i}: collapsedSize (${collapsedSize}) must be less than minSize (${minSize})`);
            continue;
          }

          const proposedPx = proposedPixelSizes[i];
          const wasCollapsed = collapsedStateRef.current[i];
          const controlledCollapsed = controlledCollapsedRef.current[i];

          let shouldBeCollapsed = wasCollapsed;

          if (controlledCollapsed !== undefined) {
            shouldBeCollapsed = controlledCollapsed;
          } else {
            // Use minSize as threshold for both collapse and expand to avoid toggling
            if (wasCollapsed) {
              // Only expand when dragged above minSize
              if (proposedPx > minPx) {
                shouldBeCollapsed = false;
              }
            } else {
              // Collapse when dragged below minSize
              if (proposedPx < minPx) {
                shouldBeCollapsed = true;
              }
            }
          }

          if (shouldBeCollapsed) {
            const diff = proposedPx - collapsedPx;
            finalSizes[i] = collapsedPx;
            // Redistribute the difference to the adjacent panel
            const otherIndex = i === leftIndex ? rightIndex : leftIndex;
            finalSizes[otherIndex] += diff;
          } else if (wasCollapsed && !shouldBeCollapsed) {
            const diff = minPx - proposedPx;
            finalSizes[i] = minPx;
            // Take the difference from the adjacent panel
            const otherIndex = i === leftIndex ? rightIndex : leftIndex;
            finalSizes[otherIndex] -= diff;
          }

          if (shouldBeCollapsed !== wasCollapsed) {
            collapsedStateRef.current[i] = shouldBeCollapsed;
            collapsedTransitions.push({ index: i, collapsed: shouldBeCollapsed });
          }
        }

        if (collapsedTransitions.length > 0) {
          setTimeout(() => {
            collapsedTransitions.forEach(({ index, collapsed }) => {
              const callback = collapseCallbacksRef.current[index];
              callback?.(collapsed);
            });
          }, 0);
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
        const dragStartSizes = dragStartPixelSizesRef.current;

        // Early exit if not properly initialized (shouldn't happen with robust handleResizeStart)
        if (!dragStartSizes || dragStartSizes.length === 0) {
          console.error('dragStartSizes not initialized - this should not happen');
          return;
        }

        let proposedPixelSizes = [...dragStartSizes];

        const expectedTotal = dragStartSizes[leftIndex] + dragStartSizes[rightIndex];

        // Calculate constraints in pixels
        const leftConstraints = constraintsRef.current[leftIndex];
        const rightConstraints = constraintsRef.current[rightIndex];

        // When collapsedSize is present, use it as the effective minimum (allow dragging to collapsed size)
        const leftCollapsedSize = collapsedSizeRef.current[leftIndex];
        const rightCollapsedSize = collapsedSizeRef.current[rightIndex];

        const leftMinPx = leftCollapsedSize
          ? convertToPixels(parseSize(leftCollapsedSize), containerSize)
          : leftConstraints?.minSize
            ? convertToPixels(parseSize(leftConstraints.minSize), containerSize)
            : 0;
        const leftMaxPx = leftConstraints?.maxSize
          ? convertToPixels(parseSize(leftConstraints.maxSize), containerSize)
          : Infinity;
        const rightMinPx = rightCollapsedSize
          ? convertToPixels(parseSize(rightCollapsedSize), containerSize)
          : rightConstraints?.minSize
            ? convertToPixels(parseSize(rightConstraints.minSize), containerSize)
            : 0;
        const rightMaxPx = rightConstraints?.maxSize
          ? convertToPixels(parseSize(rightConstraints.maxSize), containerSize)
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
          const currentSizes = createSizeInfo(currentPixelSizesRef.current, containerSize);
          const proposedSizes = createSizeInfo(proposedPixelSizes, containerSize);
          const previousSizes = createSizeInfo(previousPixelSizesRef.current, containerSize);
          const resizeInfo: ResizeInfo = {
            currentSizes,
            proposedSizes,
            previousSizes,
            containerSize,
            direction,
          };

          // Save original current sizes to detect mutation
          const originalCurrentPixels = [...currentPixelSizesRef.current];

          // Call callback - it can return new sizes or mutate currentSizes
          const customSizes = onResize(resizeInfo);

          // Check if callback returned custom sizes
          if (customSizes) {
            finalPixelSizes = applySizeInfo(customSizes, containerSize);
          } else {
            // Check if callback mutated the currentSizes array
            const mutatedPixels = applySizeInfo(resizeInfo.currentSizes, containerSize);
            const wasMutated = mutatedPixels.some((px, i) => Math.abs(px - originalCurrentPixels[i]) > 0.01);
            if (wasMutated) {
              finalPixelSizes = mutatedPixels;
            }
            // Otherwise keep finalPixelSizes as proposedPixelSizes
          }
        }

        // Update ref immediately for next drag event
        currentPixelSizesRef.current = finalPixelSizes;

        // During drag, only update pixel sizes (not panel sizes)
        // This prevents the useEffect from recalculating and causing jumps
        setPixelSizes(finalPixelSizes);
      },
      [direction, onResize, createSizeInfo, applySizeInfo, applyCollapseLogic]
    );

    const handleResizeStart = useCallback(() => {
      if (!containerRef.current) return;

      isDraggingRef.current = true;

      // Ensure current sizes are set before we start
      if (currentPixelSizesRef.current.length === 0) {
        // Force initialization if somehow not ready
        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = direction === 'horizontal' ? rect.width : rect.height;
        const pixels = calculateSizes(panelSizes, containerSize, constraintsRef.current);
        currentPixelSizesRef.current = pixels;
        setPixelSizes(pixels);
      }

      // Capture current sizes as "previous" for the drag operation
      previousPixelSizesRef.current = [...currentPixelSizesRef.current];

      // Capture drag start sizes for cumulative delta tracking
      dragStartPixelSizesRef.current = [...currentPixelSizesRef.current];

      // Call onResizeStart with current state
      if (onResizeStart) {
        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = direction === 'horizontal' ? rect.width : rect.height;
        const currentSizes = createSizeInfo(currentPixelSizesRef.current, containerSize);
        const proposedSizes = createSizeInfo(currentPixelSizesRef.current, containerSize);
        const previousSizes = createSizeInfo(previousPixelSizesRef.current, containerSize);

        const resizeInfo: ResizeInfo = {
          currentSizes,
          proposedSizes,
          previousSizes,
          containerSize,
          direction,
        };

        onResizeStart(resizeInfo);
      }
    }, [onResizeStart, direction, createSizeInfo, panelSizes]);

    const handleResizeEnd = useCallback(() => {
      isDraggingRef.current = false;

      // Update panelSizes to match the final pixelSizes
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = direction === 'horizontal' ? rect.width : rect.height;

      let finalPixelSizes = [...currentPixelSizesRef.current];

      // Call onResizeEnd with full info - it can override final sizes
      if (onResizeEnd) {
        const currentSizes = createSizeInfo(finalPixelSizes, containerSize);
        const proposedSizes = createSizeInfo(finalPixelSizes, containerSize);
        const previousSizes = createSizeInfo(previousPixelSizesRef.current, containerSize);

        const resizeInfo: ResizeInfo = {
          currentSizes,
          proposedSizes,
          previousSizes,
          containerSize,
          direction,
        };

        // Save original to detect mutation
        const originalFinalPixels = [...finalPixelSizes];

        // Call callback - it can return new sizes or mutate currentSizes
        const customSizes = onResizeEnd(resizeInfo);

        // Check if callback returned custom sizes
        if (customSizes) {
          finalPixelSizes = applySizeInfo(customSizes, containerSize);
        } else {
          // Check if callback mutated the currentSizes array
          const mutatedPixels = applySizeInfo(resizeInfo.currentSizes, containerSize);
          const wasMutated = mutatedPixels.some((px, i) => Math.abs(px - originalFinalPixels[i]) > 0.01);
          if (wasMutated) {
            finalPixelSizes = mutatedPixels;
          }
        }
      }

      // Update refs and state with final sizes
      currentPixelSizesRef.current = finalPixelSizes;
      setPixelSizes(finalPixelSizes);

      // Convert final pixel sizes back to panel sizes to maintain proportions when container resizes
      // This prevents panels from reverting to original sizes in nested layouts
      const newPanelSizes = finalPixelSizes.map((pixels, i) => {
        const unit = originalUnitsRef.current[i];
        const value = convertFromPixels(pixels, containerSize, unit);
        return formatSize(value, unit);
      });
      setPanelSizes(newPanelSizes);
    }, [direction, onResizeEnd, createSizeInfo, applySizeInfo]);

    const flexDirection = direction === 'horizontal' ? 'row' : 'column';

    // Process children to separate panels and handles
    const processedChildren: ReactNode[] = [];
    const childArray = Children.toArray(children);
    let panelIndex = 0;

    // Count total panels (not including ResizeHandles) for isLastPanel check
    const panelCount = childArray.filter(child => isValidElement(child) && child.type !== ResizeHandle).length;

    for (let i = 0; i < childArray.length; i++) {
      const child = childArray[i];

      if (!isValidElement(child)) {
        processedChildren.push(child);
        continue;
      }

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
        const nextIsHandle = isValidElement(nextChild) && nextChild.type === ResizeHandle;
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
      <div
        ref={containerRef}
        className={className}
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
  }
);

PanelGroup.displayName = 'PanelGroup';
