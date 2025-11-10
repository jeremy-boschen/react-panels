import { describe, expect, it } from 'vitest';
import type { PanelSize } from '../types';
import {
  calculateSizes,
  convertFromPixels,
  convertToPixels,
  formatSize,
  normalizePanelSize,
  parseSize,
} from '../utils';

describe('utils', () => {
  describe('parseSize', () => {
    it('parses pixel values correctly', () => {
      const result = parseSize('100px' as PanelSize);
      expect(result.value).toBe(100);
      expect(result.unit).toBe('px');
      expect(result.original).toBe('100px');
    });

    it('parses percentage values correctly', () => {
      const result = parseSize('50%' as PanelSize);
      expect(result.value).toBe(50);
      expect(result.unit).toBe('%');
      expect(result.original).toBe('50%');
    });

    it('parses auto size correctly', () => {
      const result = parseSize('auto');
      expect(result.value).toBe(0);
      expect(result.unit).toBe('auto');
      expect(result.original).toBe('auto');
    });

    it('parses * size correctly', () => {
      const result = parseSize('*');
      expect(result.value).toBe(0);
      expect(result.unit).toBe('auto');
      expect(result.original).toBe('*');
    });

    it('parses undefined as auto', () => {
      const result = parseSize(undefined);
      expect(result.value).toBe(0);
      expect(result.unit).toBe('auto');
      expect(result.original).toBe('auto');
    });

    it('throws on invalid format', () => {
      expect(() => parseSize('invalid' as PanelSize)).toThrow();
    });

    it('provides detailed error message for invalid format', () => {
      expect(() => parseSize('invalid' as PanelSize)).toThrow(/Invalid size format: invalid \(type: string\)/);
    });

    it('provides helpful error message for NaNundefined case', () => {
      // This simulates the error that would occur if formatSize returned "NaNundefined"
      expect(() => parseSize('NaNundefined' as PanelSize)).toThrow(
        /If you're seeing "NaNundefined", this may indicate an internal state synchronization issue/
      );
    });
  });

  describe('formatSize', () => {
    it('formats pixel values correctly', () => {
      expect(formatSize(100, 'px')).toBe('100px');
    });

    it('formats percentage values correctly', () => {
      expect(formatSize(50, '%')).toBe('50%');
    });

    it('formats auto size correctly', () => {
      expect(formatSize(0, 'auto')).toBe('auto');
    });

    it('handles NaN value gracefully (state sync safety)', () => {
      // This can occur during state synchronization issues where refs get out of sync
      expect(formatSize(NaN, 'px')).toBe('auto');
    });
  });

  describe('normalizePanelSize', () => {
    it('returns size unchanged if already defined', () => {
      expect(normalizePanelSize('100px' as PanelSize)).toBe('100px');
      expect(normalizePanelSize('50%' as PanelSize)).toBe('50%');
      expect(normalizePanelSize('auto')).toBe('auto');
    });

    it('converts undefined to auto', () => {
      expect(normalizePanelSize(undefined)).toBe('auto');
    });
  });

  describe('convertToPixels', () => {
    it('returns pixel value unchanged', () => {
      const size = parseSize('100px' as PanelSize);
      expect(convertToPixels(size, 1000)).toBe(100);
    });

    it('converts percentage to pixels', () => {
      const size = parseSize('50%' as PanelSize);
      expect(convertToPixels(size, 1000)).toBe(500);
    });

    it('returns 0 for auto size', () => {
      const size = parseSize('auto');
      expect(convertToPixels(size, 1000)).toBe(0);
    });
  });

  describe('convertFromPixels', () => {
    it('returns pixel value unchanged', () => {
      expect(convertFromPixels(100, 1000, 'px')).toBe(100);
    });

    it('converts pixels to percentage', () => {
      expect(convertFromPixels(500, 1000, '%')).toBe(50);
    });

    it('returns pixel value for auto unit', () => {
      expect(convertFromPixels(300, 1000, 'auto')).toBe(300);
    });
  });

  describe('calculateSizes', () => {
    it('calculates sizes correctly for percentages', () => {
      const sizes: PanelSize[] = ['50%' as PanelSize, '50%' as PanelSize];
      const result = calculateSizes(sizes, 1000, [{}, {}]);
      expect(result).toEqual([500, 500]);
    });

    it('calculates sizes correctly for pixels', () => {
      const sizes: PanelSize[] = ['200px' as PanelSize, '800px' as PanelSize];
      const result = calculateSizes(sizes, 1000, [{}, {}]);
      expect(result).toEqual([200, 800]);
    });

    it('handles mixed units correctly', () => {
      const sizes: PanelSize[] = ['200px' as PanelSize, '80%' as PanelSize];
      const result = calculateSizes(sizes, 1000, [{}, {}]);
      expect(result[0]).toBe(200);
      expect(result[1]).toBe(800);
    });

    it('applies min constraints', () => {
      const sizes: PanelSize[] = ['10px' as PanelSize, '990px' as PanelSize];
      const constraints = [{ minSize: '50px' as PanelSize }, {}];
      const result = calculateSizes(sizes, 1000, constraints);
      expect(result[0]).toBeGreaterThanOrEqual(50);
    });

    it('applies max constraints', () => {
      const sizes: PanelSize[] = ['900px' as PanelSize, '100px' as PanelSize];
      const constraints = [{ maxSize: '700px' as PanelSize }, {}];
      const result = calculateSizes(sizes, 1000, constraints);
      expect(result[0]).toBeLessThanOrEqual(700);
    });

    describe('auto-size behavior', () => {
      it('handles two auto panels splitting space equally', () => {
        const sizes: (PanelSize | undefined)[] = [undefined, undefined];
        const result = calculateSizes(sizes, 1000, [{}, {}]);
        expect(result).toEqual([500, 500]);
      });

      it('handles one auto panel filling remaining space', () => {
        const sizes: (PanelSize | undefined)[] = ['200px' as PanelSize, undefined];
        const result = calculateSizes(sizes, 1000, [{}, {}]);
        expect(result).toEqual([200, 800]);
      });

      it('handles auto panel with "auto" keyword', () => {
        const sizes: PanelSize[] = ['200px' as PanelSize, 'auto'];
        const result = calculateSizes(sizes, 1000, [{}, {}]);
        expect(result).toEqual([200, 800]);
      });

      it('handles auto panel with "*" keyword', () => {
        const sizes: PanelSize[] = ['200px' as PanelSize, '*'];
        const result = calculateSizes(sizes, 1000, [{}, {}]);
        expect(result).toEqual([200, 800]);
      });

      it('distributes space among multiple auto panels', () => {
        const sizes: PanelSize[] = ['200px' as PanelSize, 'auto', 'auto', 'auto'];
        const result = calculateSizes(sizes, 1000, [{}, {}, {}, {}]);
        expect(result[0]).toBe(200);
        // Remaining 800px split among 3 auto panels
        expect(result[1]).toBeCloseTo(266.67, 1);
        expect(result[2]).toBeCloseTo(266.67, 1);
        expect(result[3]).toBeCloseTo(266.67, 1);
        // Sum should equal container
        const sum = result.reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1000, 0);
      });

      it('applies constraints to auto panels', () => {
        const sizes: PanelSize[] = ['200px' as PanelSize, 'auto'];
        const constraints = [{}, { minSize: '900px' as PanelSize }];
        const result = calculateSizes(sizes, 1000, constraints);
        expect(result[0]).toBe(200);
        expect(result[1]).toBeGreaterThanOrEqual(900);
      });

      it('handles auto panel with max constraint', () => {
        const sizes: PanelSize[] = ['200px' as PanelSize, 'auto'];
        const constraints = [{}, { maxSize: '600px' as PanelSize }];
        const result = calculateSizes(sizes, 1000, constraints);
        expect(result[0]).toBe(200);
        expect(result[1]).toBeLessThanOrEqual(600);
      });

      it('handles mixed fixed and auto panels', () => {
        const sizes: PanelSize[] = ['100px' as PanelSize, '20%' as PanelSize, 'auto', '150px' as PanelSize];
        const result = calculateSizes(sizes, 1000, [{}, {}, {}, {}]);
        expect(result[0]).toBe(100);
        expect(result[1]).toBe(200);
        expect(result[3]).toBe(150);
        // Auto panel fills remaining: 1000 - 100 - 200 - 150 = 550
        expect(result[2]).toBe(550);
      });
    });
  });

  describe('dev mode warnings', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('warns when fixed panels do not sum to container size', () => {
      // Mock process.env for browser mode
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'development' },
      });

      const sizes: PanelSize[] = ['300px' as PanelSize, '400px' as PanelSize];
      calculateSizes(sizes, 1000, [{}, {}]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[react-adjustable-panels] Panel sizes sum to 700.0px but container is 1000.0px')
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Consider using size="auto"'));
    });

    it('warns when fixed panels exceed container size with auto panels', () => {
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'development' },
      });

      const sizes: PanelSize[] = ['600px' as PanelSize, '500px' as PanelSize, 'auto'];
      calculateSizes(sizes, 1000, [{}, {}, {}]);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          '[react-adjustable-panels] Fixed panel sizes sum to 1100.0px but container is only 1000.0px'
        )
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auto panels have -100.0px of space (negative)')
      );
    });

    it('does not warn when sizes correctly sum to container', () => {
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'development' },
      });

      const sizes: PanelSize[] = ['500px' as PanelSize, '500px' as PanelSize];
      calculateSizes(sizes, 1000, [{}, {}]);

      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('does not warn when auto panels are used', () => {
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'development' },
      });

      const sizes: PanelSize[] = ['300px' as PanelSize, 'auto'];
      calculateSizes(sizes, 1000, [{}, {}]);

      // Should not warn because auto panel fills the gap
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('does not warn in production mode', () => {
      vi.stubGlobal('process', {
        env: { NODE_ENV: 'production' },
      });

      const sizes: PanelSize[] = ['300px' as PanelSize, '400px' as PanelSize];
      calculateSizes(sizes, 1000, [{}, {}]);

      // Should not warn in production
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });
});
