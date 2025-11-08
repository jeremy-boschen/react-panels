import type { CSSProperties, ReactNode } from 'react';

export type PanelSize = `${number}px` | `${number}%` | 'auto' | '*';

export type Direction = 'horizontal' | 'vertical';

/**
 * Detailed information about a panel's size in multiple formats
 */
export interface PanelSizeInfo {
  /** Original size format as set by user (e.g., "50%", "200px", or "auto") - mutable */
  size: PanelSize;
  /** Actual rendered size in pixels - mutable */
  pixels: number;
  /** Size as percentage of container (0-100) - mutable */
  percent: number;
}

/**
 * Complete information passed to resize callbacks
 */
export interface ResizeInfo {
  /** Current panel sizes (after any previous transformations/snapping) - mutable */
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

export interface PanelProps {
  children?: ReactNode;
  defaultSize?: PanelSize;
  minSize?: PanelSize;
  maxSize?: PanelSize;
  /** When set, panel can collapse to this size (must be < minSize) */
  collapsedSize?: PanelSize;
  /** Controlled collapsed state */
  collapsed?: boolean;
  /** Initial collapsed state (uncontrolled) */
  defaultCollapsed?: boolean;
  /** Called when panel collapse state changes */
  onCollapse?: (collapsed: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export interface PanelGroupProps {
  children: ReactNode;
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

export interface PanelGroupHandle {
  setSizes: (sizes: PanelSize[]) => void;
  getSizes: () => PanelSize[];
}

export interface ParsedSize {
  value: number;
  unit: 'px' | '%' | 'auto';
  original: PanelSize;
}
