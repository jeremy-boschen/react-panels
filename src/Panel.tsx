import { forwardRef } from 'react';
import { normalizePanelProps } from './propNormalization';
import type { PanelProps } from './types';

export const Panel = forwardRef<HTMLDivElement, PanelProps>((rawProps, ref) => {
  // Normalize props at component boundary - converts undefined → defaults
  const {
    defaultSize,
    minSize,
    maxSize,
    collapsedSize,
    defaultCollapsed,
    className,
    style,
  } = normalizePanelProps(rawProps);

  // Extract Panel-specific props to avoid passing them to DOM
  const {
    children,
    defaultSize: _defaultSize,
    minSize: _minSize,
    maxSize: _maxSize,
    collapsedSize: _collapsedSize,
    defaultCollapsed: _defaultCollapsed,
    onCollapse: _onCollapse,
    ...restProps
  } = rawProps;

  // Store normalized constraints as data attributes for PanelGroup to read
  return (
    <div
      ref={ref}
      className={className}
      style={style}
      data-panel="true"
      data-default-size={defaultSize}
      data-min-size={minSize}
      data-max-size={maxSize}
      data-collapsed-size={collapsedSize}
      data-default-collapsed={defaultCollapsed}
      {...restProps}
    >
      {children}
    </div>
  );
});

Panel.displayName = 'Panel';
