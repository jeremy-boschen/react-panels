import type { PanelSize, ParsedSize } from './types';

// Declare process for Node/bundler environments
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/**
 * Normalizes a potentially undefined PanelSize to a valid PanelSize.
 * This should be used at component boundaries to sanitize user input.
 *
 * @param size - The size prop value (may be undefined)
 * @returns A valid PanelSize (defaults to 'auto' if undefined)
 */
export function normalizePanelSize(size: PanelSize | undefined): PanelSize {
  return size ?? 'auto';
}

export function parseSize(size: PanelSize | undefined): ParsedSize {
  // Handle undefined (default to auto)
  if (size === undefined) {
    return { value: 0, unit: 'auto', original: 'auto' };
  }

  // Handle auto sizes
  if (size === 'auto' || size === '*') {
    return { value: 0, unit: 'auto', original: size };
  }

  const match = size.match(/^(\d+(?:\.\d+)?)(px|%)$/);
  if (!match) {
    const sizeType = typeof size;
    const sizeValue = sizeType === 'object' ? JSON.stringify(size) : String(size);
    throw new Error(
      `Invalid size format: ${sizeValue} (type: ${sizeType}). Expected format: "123px", "45%", "auto", or "*". ` +
        `If you're seeing "NaNundefined", this may indicate an internal state synchronization issue.`
    );
  }

  const value = parseFloat(match[1]);
  const unit = match[2] as 'px' | '%';

  return { value, unit, original: size };
}

export function formatSize(value: number, unit: 'px' | '%' | 'auto'): PanelSize {
  if (unit === 'auto') {
    return 'auto';
  }
  // Defensive check: handle NaN values that can occur during state synchronization issues
  // This is a safety net for the edge case where refs get out of sync with state
  if (Number.isNaN(value)) {
    return 'auto';
  }
  return `${value}${unit}` as PanelSize;
}

export function convertToPixels(size: ParsedSize, containerSize: number): number {
  if (size.unit === 'auto') {
    // Auto size will be calculated later based on remaining space
    return 0;
  }
  if (size.unit === 'px') {
    return size.value;
  }
  return (size.value / 100) * containerSize;
}

export function convertFromPixels(pixels: number, containerSize: number, targetUnit: 'px' | '%' | 'auto'): number {
  if (targetUnit === 'auto') {
    // For auto, we don't convert - the pixel value is what was calculated
    return pixels;
  }
  if (targetUnit === 'px') {
    return pixels;
  }
  return (pixels / containerSize) * 100;
}

export function clampSize(size: number, min: number | undefined, max: number | undefined): number {
  let clamped = size;
  if (min !== undefined) {
    clamped = Math.max(clamped, min);
  }
  if (max !== undefined) {
    clamped = Math.min(clamped, max);
  }
  return clamped;
}

export function calculateSizes(
  requestedSizes: (PanelSize | undefined)[],
  containerSize: number,
  panelConstraints: Array<{
    minSize?: PanelSize;
    maxSize?: PanelSize;
  }>
): number[] {
  // Parse all sizes
  const parsed = requestedSizes.map(parseSize);

  // Identify auto and fixed panels
  const autoIndices: number[] = [];
  const fixedIndices: number[] = [];

  parsed.forEach((p, i) => {
    if (p.unit === 'auto') {
      autoIndices.push(i);
    } else {
      fixedIndices.push(i);
    }
  });

  // Initialize pixel sizes array
  const pixelSizes: number[] = new Array(parsed.length).fill(0);

  // Calculate fixed panel sizes with constraints
  let fixedTotal = 0;
  fixedIndices.forEach(i => {
    const constraints = panelConstraints[i];
    const minPx = constraints?.minSize ? convertToPixels(parseSize(constraints.minSize), containerSize) : undefined;
    const maxPx = constraints?.maxSize ? convertToPixels(parseSize(constraints.maxSize), containerSize) : undefined;

    let size = convertToPixels(parsed[i], containerSize);
    size = clampSize(size, minPx, maxPx);

    pixelSizes[i] = size;
    fixedTotal += size;
  });

  // Calculate remaining space for auto panels
  const remainingSpace = containerSize - fixedTotal;
  const autoCount = autoIndices.length;

  if (autoCount > 0) {
    // Distribute remaining space equally among auto panels
    const baseAutoSize = remainingSpace / autoCount;

    autoIndices.forEach(i => {
      const constraints = panelConstraints[i];
      const minPx = constraints?.minSize ? convertToPixels(parseSize(constraints.minSize), containerSize) : undefined;
      const maxPx = constraints?.maxSize ? convertToPixels(parseSize(constraints.maxSize), containerSize) : undefined;

      let size = baseAutoSize;
      size = clampSize(size, minPx, maxPx);

      pixelSizes[i] = size;
    });

    // Adjust for any constraint violations
    // If an auto panel was clamped, redistribute the difference
    const autoTotal = autoIndices.reduce((sum, i) => sum + pixelSizes[i], 0);
    const autoDiff = remainingSpace - autoTotal;

    if (Math.abs(autoDiff) > 0.1 && autoCount > 0) {
      // Add the difference to the last auto panel
      const lastAutoIndex = autoIndices[autoIndices.length - 1];
      pixelSizes[lastAutoIndex] += autoDiff;

      // Re-apply constraints to last auto panel
      const constraints = panelConstraints[lastAutoIndex];
      const minPx = constraints?.minSize ? convertToPixels(parseSize(constraints.minSize), containerSize) : undefined;
      const maxPx = constraints?.maxSize ? convertToPixels(parseSize(constraints.maxSize), containerSize) : undefined;
      pixelSizes[lastAutoIndex] = clampSize(pixelSizes[lastAutoIndex], minPx, maxPx);
    }
  }

  // Dev mode warnings
  if (typeof process !== 'undefined' && (process.env?.NODE_ENV === 'development' || process.env?.NODE_ENV === 'dev')) {
    const total = pixelSizes.reduce((sum, size) => sum + size, 0);

    if (autoCount === 0 && Math.abs(total - containerSize) > 1) {
      console.warn(
        `[react-adjustable-panels] Panel sizes sum to ${total.toFixed(1)}px but container is ${containerSize.toFixed(1)}px (diff: ${(total - containerSize).toFixed(1)}px). ` +
          `Consider using size="auto" on at least one panel to fill remaining space automatically.`
      );
    }

    if (autoCount > 0 && remainingSpace < 0) {
      console.warn(
        `[react-adjustable-panels] Fixed panel sizes sum to ${fixedTotal.toFixed(1)}px but container is only ${containerSize.toFixed(1)}px. ` +
          `Auto panels have ${remainingSpace.toFixed(1)}px of space (negative). Consider reducing fixed panel sizes.`
      );
    }
  }

  return pixelSizes;
}
