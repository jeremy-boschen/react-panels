import type { PanelSize, ParsedSize } from './types';

// Declare process for Node/bundler environments
declare const process: { env?: { NODE_ENV?: string } } | undefined;

/**
 * Throttles a function to execute at most once per specified wait time.
 * Uses leading edge execution (fires immediately, then throttles subsequent calls).
 *
 * @param func - The function to throttle
 * @param wait - Minimum time in milliseconds between function executions
 * @returns Throttled function
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function type requires any for maximum flexibility
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  return function executedFunction(...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func(...args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func(...args);
      }, remaining);
    }
  };
}

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

/**
 * Parses a size string into its numeric value and unit components.
 *
 * Supports pixels ("123px"), percentages ("45%"), auto sizing ("auto" or "*"),
 * and plain numbers (auto-converted to pixels with dev warning).
 *
 * @param size - The size string to parse (e.g., "200px", "50%", "auto")
 * @returns Parsed size object with value, unit, and original string
 * @throws Error if size format is invalid
 *
 * @example
 * parseSize("200px")  // { value: 200, unit: "px", original: "200px" }
 * parseSize("50%")    // { value: 50, unit: "%", original: "50%" }
 * parseSize("auto")   // { value: 0, unit: "auto", original: "auto" }
 * parseSize("100")    // { value: 100, unit: "px", original: "100px" } (with dev warning)
 */
export function parseSize(size: PanelSize | undefined): ParsedSize {
  // Handle undefined (default to auto)
  if (size === undefined) {
    return { value: 0, unit: 'auto', original: 'auto' };
  }

  // Handle auto sizes
  if (size === 'auto' || size === '*') {
    return { value: 0, unit: 'auto', original: size };
  }

  // Try to match with unit (px or %)
  let match = size.match(/^(\d+(?:\.\d+)?)(px|%)$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2] as 'px' | '%';
    return { value, unit, original: size };
  }

  // Try to match plain number (without unit) - default to px for better DX
  match = size.match(/^(\d+(?:\.\d+)?)$/);
  if (match) {
    const value = parseFloat(match[1]);
    // Auto-convert plain numbers to pixels for better developer experience
    if (
      typeof process !== 'undefined' &&
      (process.env?.NODE_ENV === 'development' || process.env?.NODE_ENV === 'dev')
    ) {
      console.warn(
        `[react-adjustable-panels] Size value "${size}" is missing a unit. Automatically treating it as "${size}px". ` +
          `Please use explicit units: "123px", "45%", "auto", or "*" to avoid this warning.`
      );
    }
    return { value, unit: 'px', original: `${value}px` as PanelSize };
  }

  // Invalid format - throw helpful error
  const sizeType = typeof size;
  const sizeValue = sizeType === 'object' ? JSON.stringify(size) : String(size);
  throw new Error(
    `[react-adjustable-panels] Invalid size format: "${sizeValue}" (type: ${sizeType}).\n` +
      `Expected formats:\n` +
      `  - Pixels: "123px" or "123"\n` +
      `  - Percentage: "45%"\n` +
      `  - Auto: "auto" or "*"\n` +
      `\n` +
      `Hint: If you used minSize="1", change it to minSize="1px" (or just leave off the quotes in JSX for TypeScript checking).\n` +
      `\n` +
      `If you're seeing "NaNundefined", this may indicate an internal state synchronization issue.`
  );
}

/**
 * Formats a numeric value and unit into a PanelSize string.
 *
 * Handles NaN values gracefully by defaulting to "auto" to prevent invalid size formats.
 *
 * @param value - Numeric value for the size
 * @param unit - Unit type (px, %, or auto)
 * @returns Formatted size string (e.g., "200px", "50%", "auto")
 *
 * @example
 * formatSize(200, "px")   // "200px"
 * formatSize(50, "%")     // "50%"
 * formatSize(0, "auto")   // "auto"
 * formatSize(NaN, "px")   // "auto" (safety fallback)
 */
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

/**
 * Converts a parsed size to pixels based on container size.
 *
 * @param size - Parsed size object with value and unit
 * @param containerSize - Container size in pixels (for percentage calculations)
 * @returns Size in pixels (0 for auto sizes, which are calculated later)
 *
 * @example
 * convertToPixels({ value: 200, unit: "px" }, 1000)   // 200
 * convertToPixels({ value: 50, unit: "%" }, 1000)     // 500
 * convertToPixels({ value: 0, unit: "auto" }, 1000)   // 0 (calculated later)
 */
export function convertToPixels(size: ParsedSize, containerSize: number): number {
  if (size.unit === 'auto') {
    // Auto size will be calculated later based on remaining space
    return 0;
  }
  if (size.unit === 'px') {
    return size.value;
  }

  // Guard against zero/invalid container size
  if (containerSize <= 0) {
    if (typeof console !== 'undefined') {
      console.warn(
        `[react-adjustable-panels] Container size is ${containerSize}. ` +
          `Percentage sizes cannot be calculated. Defaulting to 0.`
      );
    }
    return 0;
  }

  return (size.value / 100) * containerSize;
}

/**
 * Converts pixels back to the target unit type.
 *
 * @param pixels - Size in pixels to convert
 * @param containerSize - Container size in pixels (for percentage calculations)
 * @param targetUnit - Target unit type (px, %, or auto)
 * @returns Converted value in target unit
 *
 * @example
 * convertFromPixels(200, 1000, "px")   // 200
 * convertFromPixels(500, 1000, "%")    // 50
 * convertFromPixels(300, 1000, "auto") // 300 (no conversion for auto)
 */
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

/**
 * Clamps a size value between optional min and max bounds.
 *
 * @param size - Value to clamp
 * @param min - Minimum value (optional)
 * @param max - Maximum value (optional)
 * @returns Clamped value
 *
 * @example
 * clampSize(150, 100, 200)      // 150 (within bounds)
 * clampSize(50, 100, 200)       // 100 (clamped to min)
 * clampSize(250, 100, 200)      // 200 (clamped to max)
 * clampSize(150, undefined, 200) // 150 (no min constraint)
 */
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

/**
 * Calculates panel sizes in pixels, applying constraints and distributing available space.
 *
 * This is the core sizing algorithm that:
 * 1. Parses all size strings and converts to pixels
 * 2. Separates auto panels from fixed-size panels
 * 3. Distributes remaining space among auto panels
 * 4. Applies min/max constraints with redistribution
 * 5. Re-distributes space if constraints cause adjustments
 *
 * @param requestedSizes - Array of requested sizes for each panel
 * @param containerSize - Total container size in pixels
 * @param panelConstraints - Array of min/max constraints for each panel
 * @returns Array of calculated pixel sizes for each panel
 *
 * @example
 * calculateSizes(
 *   ["200px", "auto", "30%"],
 *   1000,
 *   [{ minSize: "100px" }, {}, { maxSize: "400px" }]
 * )
 * // Returns approximate: [200, 500, 300] (depending on constraints)
 */
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

/**
 * Calculates panel sizes in pixels with pre-computed pixel constraints.
 * This is an optimized version of calculateSizes that accepts pixel constraints
 * directly, avoiding redundant parsing and conversion on each call.
 *
 * @param requestedSizes - Array of panel sizes (can include undefined)
 * @param containerSize - Container dimension in pixels
 * @param pixelConstraints - Pre-computed constraints with minPx/maxPx in pixels
 * @returns Array of panel sizes in pixels
 */
export function calculateSizesWithPixelConstraints(
  requestedSizes: (PanelSize | undefined)[],
  containerSize: number,
  pixelConstraints: Array<{ minPx?: number; maxPx?: number }>
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

  // Calculate fixed panel sizes with constraints (using pre-computed pixel constraints)
  let fixedTotal = 0;
  fixedIndices.forEach(i => {
    const constraints = pixelConstraints[i];
    const minPx = constraints?.minPx;
    const maxPx = constraints?.maxPx;

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
      const constraints = pixelConstraints[i];
      const minPx = constraints?.minPx;
      const maxPx = constraints?.maxPx;

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
      const constraints = pixelConstraints[lastAutoIndex];
      const minPx = constraints?.minPx;
      const maxPx = constraints?.maxPx;
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
