import type { CSSProperties, ReactNode } from 'react';

/**
 * Supported size formats for panels.
 *
 * - Pixels: `"200px"` - Fixed size in pixels
 * - Percentage: `"50%"` - Percentage of container size
 * - Auto: `"auto"` or `"*"` - Flexible size that fills remaining space
 *
 * Note: Plain numbers (e.g., "100") are auto-converted to pixels with a dev warning.
 */
export type PanelSize = `${number}px` | `${number}%` | 'auto' | '*';

/**
 * Layout direction for panels and resize handles.
 */
export type Direction = 'horizontal' | 'vertical';

/**
 * Detailed information about a panel's size in multiple formats
 */
export interface PanelSizeInfo {
  /** Original size format as set by user (e.g., "50%", "200px", or "auto") */
  size: PanelSize;
  /** Actual rendered size in pixels */
  pixels: number;
  /** Size as percentage of container (0-100) */
  percent: number;
}

/**
 * Complete information passed to resize callbacks.
 *
 * To customize resize behavior, return a new array of PanelSizeInfo from your callback.
 * If you return nothing (void), the proposed sizes will be used.
 *
 * Note: Mutating the arrays is not supported. Always return a new array if you want to override.
 */
export interface ResizeInfo {
  /** Current panel sizes (after any previous transformations/snapping) */
  currentSizes: PanelSizeInfo[];
  /** Proposed panel sizes (before callback transformation, based on raw mouse position) */
  proposedSizes: PanelSizeInfo[];
  /** Previous panel sizes before this resize operation */
  previousSizes: ReadonlyArray<Readonly<PanelSizeInfo>>;
  /** Total size of the container in pixels */
  containerSize: number;
  /** Layout direction of the panel group */
  direction: Direction;
}

/**
 * Props for the Panel component.
 *
 * Panels can have fixed sizes or flexible auto-fill behavior. They support
 * min/max constraints and collapsible behavior with automatic snap logic.
 */
export interface PanelProps {
  children?: ReactNode;
  /** Initial size of the panel (default: "auto") */
  defaultSize?: PanelSize;
  /** Minimum size constraint */
  minSize?: PanelSize;
  /** Maximum size constraint */
  maxSize?: PanelSize;
  /** When set, panel can collapse to this size (must be < minSize) */
  collapsedSize?: PanelSize;
  /** Initial collapsed state (uncontrolled) */
  defaultCollapsed?: boolean;
  /** Called when panel collapse state changes */
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
  style?: CSSProperties;
  /** DOM id attribute for the panel element (useful for aria-controls, aria-labelledby) */
  id?: string;
  /** ARIA label for the panel */
  'aria-label'?: string;
  /** ARIA labelledby reference for the panel */
  'aria-labelledby'?: string;
}

/**
 * Props for the PanelGroup component.
 *
 * PanelGroup manages a collection of resizable panels with automatic or manual
 * resize handles. Supports both controlled and uncontrolled patterns via callbacks
 * and ref-based imperative API.
 */
export interface PanelGroupProps {
  children: ReactNode;
  /** Layout direction (default: "horizontal") */
  direction?: Direction;
  className?: string;
  style?: CSSProperties;
  /**
   * Called during resize drag operations. Can return new sizes to override,
   * or mutate info.currentSizes directly. If nothing is returned or mutated,
   * the proposed sizes are accepted.
   */
  onResize?: (info: ResizeInfo) => PanelSizeInfo[] | undefined;
  /** Called when resize drag starts */
  onResizeStart?: (info: ResizeInfo) => void;
  /**
   * Called when resize drag ends. Can return new sizes to override,
   * or mutate info.currentSizes directly.
   */
  onResizeEnd?: (info: ResizeInfo) => PanelSizeInfo[] | undefined;
}

/**
 * Imperative API handle for PanelGroup ref.
 *
 * Provides programmatic control over panel sizing and collapse state.
 * Access via `const groupRef = useRef<PanelGroupHandle>(null)`.
 *
 * @example
 * ```tsx
 * const groupRef = useRef<PanelGroupHandle>(null);
 *
 * // Programmatically set sizes
 * groupRef.current?.setSizes(['30%', 'auto']);
 *
 * // Collapse/expand panels
 * groupRef.current?.collapsePanel(0);
 * ```
 */
export interface PanelGroupHandle {
  /** Set sizes for all panels */
  setSizes: (sizes: PanelSize[]) => void;
  /** Get current sizes of all panels */
  getSizes: () => PanelSize[];
  /** Collapse a panel to its collapsedSize */
  collapsePanel: (panelIndex: number) => void;
  /** Expand a panel to its minSize */
  expandPanel: (panelIndex: number) => void;
  /** Set collapsed state of a panel */
  setCollapsed: (panelIndex: number, collapsed: boolean) => void;
  /** Check if a panel is currently collapsed */
  isCollapsed: (panelIndex: number) => boolean;
}

/**
 * Internal representation of a parsed size value.
 *
 * Used internally to separate the numeric value from its unit for calculations.
 */
export interface ParsedSize {
  /** Numeric value extracted from size string */
  value: number;
  /** Unit type (px, %, or auto) */
  unit: 'px' | '%' | 'auto';
  /** Original PanelSize string */
  original: PanelSize;
}
