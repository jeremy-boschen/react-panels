import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';

/**
 * Recursively finds all Panel children (excluding ResizeHandles).
 *
 * @param children - The React children to search through
 * @param PanelType - The Panel component type to find
 * @param ResizeHandleType - The ResizeHandle component type to exclude
 * @returns Array of Panel elements in the order they appear in the tree
 */
export function findPanelChildren<T = any>(
  children: ReactNode,
  PanelType: any,
  ResizeHandleType: any
): ReactElement<T>[] {
  const result: ReactElement<T>[] = [];

  function traverse(node: ReactNode) {
    Children.forEach(node, child => {
      if (!isValidElement(child)) {
        return;
      }

      // Exclude ResizeHandle components
      if (child.type === ResizeHandleType) {
        return;
      }

      // Check if this is a Panel component by type
      const isPanel = child.type === PanelType;

      if (isPanel) {
        // Found a Panel - add it to results
        result.push(child as ReactElement<T>);
      } else {
        // Not a Panel - recursively search its children
        const props = child.props as any;
        if (props && props.children) {
          traverse(props.children);
        }
      }
    });
  }

  traverse(children);
  return result;
}

/**
 * Recursively flattens all Panel and ResizeHandle children, preserving their order.
 * This is used during rendering to process all panels and handles regardless of wrapping.
 *
 * @param children - The React children to flatten
 * @param PanelType - The Panel component type
 * @param ResizeHandleType - The ResizeHandle component type
 * @returns Array of Panel and ResizeHandle elements in order
 */
export function flattenPanelChildren(children: ReactNode, PanelType: any, ResizeHandleType: any): ReactElement[] {
  const result: ReactElement[] = [];

  function traverse(node: ReactNode) {
    Children.forEach(node, child => {
      if (!isValidElement(child)) {
        return;
      }

      const isPanel = child.type === PanelType;
      const isHandle = child.type === ResizeHandleType;

      if (isPanel || isHandle) {
        result.push(child);
      } else {
        // Not a Panel or Handle - recursively search its children
        const props = child.props as any;
        if (props && props.children) {
          traverse(props.children);
        }
      }
    });
  }

  traverse(children);
  return result;
}
