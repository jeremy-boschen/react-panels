import { useEffect, useLayoutEffect } from 'react';

/**
 * useIsomorphicLayoutEffect
 *
 * Uses useLayoutEffect on the client (for synchronous DOM measurements)
 * and useEffect on the server/test environment (to avoid warnings).
 *
 * This ensures DOM measurements happen before paint in the browser
 * while avoiding SSR/test environment issues.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined'
    ? useLayoutEffect
    : useEffect;
