import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { normalizeResizeHandleProps } from './propNormalization';
import type { Direction } from './types';

/**
 * Props for the ResizeHandle component.
 */
export interface ResizeHandleProps {
  /** Layout direction - automatically provided by PanelGroup */
  direction?: Direction;
  /** Drag start callback - automatically provided by PanelGroup */
  onDragStart?: () => void;
  /** Drag callback - automatically provided by PanelGroup */
  onDrag?: (delta: number) => void;
  /** Drag end callback - automatically provided by PanelGroup */
  onDragEnd?: () => void;
  /** Custom class name for styling */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
  /** Size of the handle in pixels (width for horizontal, height for vertical). Default: 4 */
  size?: number;
  /** Custom content to render inside the handle (e.g., visual indicator) */
  children?: ReactNode;
  /** Accessible label for screen readers. Default: "Resize panels" */
  'aria-label'?: string;
  /** DOM id attribute for the handle element (useful for aria-controls references) */
  id?: string;
  /** ARIA controls - references to panel IDs that this handle controls */
  'aria-controls'?: string;
}

/**
 * ResizeHandle component - Draggable handle for resizing panels.
 *
 * Handles can be explicitly placed between panels or automatically inserted by PanelGroup.
 * Supports mouse and keyboard interactions (Arrow keys with Shift for larger steps).
 * Touch devices work automatically via browser's touch-to-mouse event translation.
 * Fully accessible with ARIA attributes and screen reader support.
 *
 * @example
 * ```tsx
 * // Explicit resize handle with custom size
 * <PanelGroup direction="horizontal">
 *   <Panel>Left</Panel>
 *   <ResizeHandle size={8} />
 *   <Panel>Right</Panel>
 * </PanelGroup>
 * ```
 *
 * @example
 * ```tsx
 * // Custom resize handle with visual indicator
 * <ResizeHandle>
 *   <div style={{
 *     width: '100%',
 *     height: '100%',
 *     display: 'flex',
 *     alignItems: 'center',
 *     justifyContent: 'center'
 *   }}>
 *     ⋮
 *   </div>
 * </ResizeHandle>
 * ```
 *
 * @example
 * ```tsx
 * // Automatic handles (PanelGroup inserts them between panels)
 * <PanelGroup>
 *   <Panel>Panel 1</Panel>
 *   <Panel>Panel 2</Panel>
 *   <Panel>Panel 3</Panel>
 * </PanelGroup>
 * ```
 */
export function ResizeHandle(rawProps: ResizeHandleProps) {
  // Normalize props at component boundary - provides defaults for optional values
  const { direction, onDragStart, onDrag, onDragEnd, className, style, size, children } =
    normalizeResizeHandleProps(rawProps);
  const ariaLabel = rawProps['aria-label'] ?? 'Resize panels';
  const id = rawProps.id;
  const ariaControls = rawProps['aria-controls'];
  const isDraggingRef = useRef(false);
  const startPosRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup on unmount to restore body styles if drag was interrupted
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();

      // Clean up any previous drag that might have been interrupted
      cleanupRef.current?.();

      isDraggingRef.current = true;
      startPosRef.current = direction === 'horizontal' ? e.clientX : e.clientY;

      // Set cursor globally during drag to prevent cursor drift
      const cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;

      document.body.style.cursor = cursor;
      document.body.style.userSelect = 'none';

      // Store cleanup function
      const cleanup = () => {
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        cleanupRef.current = null;
      };
      cleanupRef.current = cleanup;

      onDragStart?.();

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isDraggingRef.current) return;

        const currentPos = direction === 'horizontal' ? moveEvent.clientX : moveEvent.clientY;
        const cumulativeDelta = currentPos - startPosRef.current;
        // Don't update startPosRef - keep it at drag start position
        // This allows PanelGroup to track cumulative delta without drift

        onDrag?.(cumulativeDelta);
      };

      const handleMouseUp = () => {
        if (isDraggingRef.current) {
          isDraggingRef.current = false;

          // Restore previous cursor and user-select
          cleanup();

          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);

          onDragEnd?.();
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [direction, onDragStart, onDrag, onDragEnd]
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const isHorizontal = direction === 'horizontal';
      const step = e.shiftKey ? 50 : 10; // Larger step with Shift key

      let delta = 0;
      if ((isHorizontal && e.key === 'ArrowLeft') || (!isHorizontal && e.key === 'ArrowUp')) {
        delta = -step;
      } else if ((isHorizontal && e.key === 'ArrowRight') || (!isHorizontal && e.key === 'ArrowDown')) {
        delta = step;
      }

      if (delta !== 0) {
        e.preventDefault();
        onDragStart?.();
        onDrag?.(delta);
        onDragEnd?.();
      }
    },
    [direction, onDragStart, onDrag, onDragEnd]
  );

  const cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';

  return (
    <div
      id={id}
      className={className}
      role="separator"
      aria-label={ariaLabel}
      aria-controls={ariaControls}
      aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
      tabIndex={0}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      style={{
        cursor,
        userSelect: 'none',
        touchAction: 'none', // Prevent default touch behaviors (scrolling, zooming) during resize
        ...(direction === 'horizontal'
          ? { width: `${size}px`, height: '100%' }
          : { width: '100%', height: `${size}px` }),
        ...style,
      }}
      data-resize-handle="true"
      data-direction={direction}
    >
      {children}
    </div>
  );
}

ResizeHandle.displayName = 'ResizeHandle';
