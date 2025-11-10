import type { CSSProperties, ReactNode } from 'react';
import type { Direction, PanelGroupProps, PanelProps, PanelSize } from './types';

/**
 * Normalizes PanelSize values, converting undefined to 'auto'.
 * Use this at component boundaries to sanitize user input.
 */
function normalizePanelSize(size: PanelSize | undefined): PanelSize {
  return size ?? 'auto';
}

/**
 * Normalized Panel props with all undefined values converted to defaults.
 */
export interface NormalizedPanelProps {
  defaultSize: PanelSize;
  minSize: PanelSize;
  maxSize: PanelSize;
  collapsedSize: PanelSize | undefined;
  defaultCollapsed: boolean;
  className?: string;
  style?: React.CSSProperties;
  onCollapse?: (collapsed: boolean) => void;
}

/**
 * Normalizes Panel component props at the component boundary.
 * Converts all undefined size props to 'auto' and provides sensible defaults.
 *
 * @param props - Raw Panel props from user
 * @returns Normalized props with no undefined size values
 */
export function normalizePanelProps(props: PanelProps): NormalizedPanelProps {
  return {
    defaultSize: normalizePanelSize(props.defaultSize),
    minSize: normalizePanelSize(props.minSize),
    maxSize: normalizePanelSize(props.maxSize),
    // collapsedSize stays undefined if not provided (it's optional)
    collapsedSize: props.collapsedSize ? normalizePanelSize(props.collapsedSize) : undefined,
    defaultCollapsed: props.defaultCollapsed ?? false,
    className: props.className,
    style: props.style,
    onCollapse: props.onCollapse,
  };
}

/**
 * Normalized PanelGroup props with all undefined values converted to defaults.
 */
export interface NormalizedPanelGroupProps {
  direction: Direction;
  className?: string;
  style?: React.CSSProperties;
  onResize?: PanelGroupProps['onResize'];
  onResizeStart?: PanelGroupProps['onResizeStart'];
  onResizeEnd?: PanelGroupProps['onResizeEnd'];
}

/**
 * Normalizes PanelGroup component props at the component boundary.
 * Provides sensible defaults for optional props.
 *
 * @param props - Raw PanelGroup props from user
 * @returns Normalized props with defaults applied
 */
export function normalizePanelGroupProps(props: PanelGroupProps): NormalizedPanelGroupProps {
  return {
    direction: props.direction ?? 'horizontal',
    className: props.className,
    style: props.style,
    onResize: props.onResize,
    onResizeStart: props.onResizeStart,
    onResizeEnd: props.onResizeEnd,
  };
}

/**
 * Normalized ResizeHandle props with all undefined values converted to defaults.
 */
export interface NormalizedResizeHandleProps {
  direction: Direction;
  onDragStart?: () => void;
  onDrag?: (delta: number) => void;
  onDragEnd?: () => void;
  className?: string;
  style?: CSSProperties;
  size: number;
  children?: ReactNode;
}

/**
 * ResizeHandleProps interface (avoiding circular dependency)
 */
export interface ResizeHandlePropsInput {
  direction?: Direction;
  onDragStart?: () => void;
  onDrag?: (delta: number) => void;
  onDragEnd?: () => void;
  className?: string;
  style?: CSSProperties;
  size?: number;
  children?: ReactNode;
}

/**
 * Normalizes ResizeHandle component props at the component boundary.
 * Provides sensible defaults for optional props.
 *
 * @param props - Raw ResizeHandle props from user
 * @returns Normalized props with defaults applied
 */
export function normalizeResizeHandleProps(props: ResizeHandlePropsInput): NormalizedResizeHandleProps {
  return {
    direction: props.direction ?? 'horizontal',
    onDragStart: props.onDragStart,
    onDrag: props.onDrag,
    onDragEnd: props.onDragEnd,
    className: props.className,
    style: props.style,
    size: props.size ?? 4,
    children: props.children,
  };
}
