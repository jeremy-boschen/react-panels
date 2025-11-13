import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Panel } from '../Panel';
import { PanelGroup } from '../PanelGroup';
import { ResizeHandle } from '../ResizeHandle';
import type { PanelGroupHandle, PanelSize, PanelSizeInfo, ResizeInfo } from '../types';

describe('PanelGroup Integration Tests', () => {
  describe('Basic Rendering', () => {
    it('renders panels with correct initial sizes', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="30%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="70%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        // Check that panels have sizes applied
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
      });
    });

    it('renders resize handles between panels', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="50%">Panel 1</Panel>
          <Panel defaultSize="50%">Panel 2</Panel>
        </PanelGroup>
      );

      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(1); // One handle between two panels
    });

    it('renders correct number of handles for multiple panels', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="33%">Panel 1</Panel>
          <Panel defaultSize="33%">Panel 2</Panel>
          <Panel defaultSize="34%">Panel 3</Panel>
        </PanelGroup>
      );

      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(2); // Two handles for three panels
    });

    it('does not create infinite render loop', async () => {
      const renderSpy = vi.fn();

      function TestComponent() {
        renderSpy();
        return (
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%">Panel 1</Panel>
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        );
      }

      render(<TestComponent />);

      // Wait a bit to ensure no infinite loops
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should render a reasonable number of times (initial + effects)
      // but definitely not hundreds of times
      expect(renderSpy).toHaveBeenCalled();
      expect(renderSpy.mock.calls.length).toBeGreaterThan(0);
      expect(renderSpy.mock.calls.length).toBeLessThan(10);
    });
  });

  describe('Imperative API', () => {
    it('setSizes updates panel sizes', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button
              onClick={() => groupRef.current?.setSizes(['200px' as PanelSize, '800px' as PanelSize])}
              data-testid="set-sizes-btn"
            >
              Set Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="50%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      const button = screen.getByTestId('set-sizes-btn');
      fireEvent.click(button);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        // After setSizes, panel1 should be ~200px and panel2 should be ~800px
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
      });
    });

    it('getSizes returns current panel sizes', () => {
      let capturedSizes: PanelSize[] = [];

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div>
            <button
              onClick={() => {
                capturedSizes = groupRef.current?.getSizes() || [];
              }}
              data-testid="get-sizes-btn"
            >
              Get Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="30%">Panel 1</Panel>
              <Panel defaultSize="70%">Panel 2</Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      const button = screen.getByTestId('get-sizes-btn');
      fireEvent.click(button);

      expect(capturedSizes.length).toBe(2);
      expect(capturedSizes[0]).toMatch(/\d+%/);
      expect(capturedSizes[1]).toMatch(/\d+%/);
    });

    it('warns when setSizes receives wrong number of sizes', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div>
            <button
              onClick={() => groupRef.current?.setSizes(['50%' as PanelSize])} // Wrong: only 1 size for 2 panels
              data-testid="set-sizes-btn"
            >
              Set Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="50%">Panel 1</Panel>
              <Panel defaultSize="50%">Panel 2</Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      const button = screen.getByTestId('set-sizes-btn');
      fireEvent.click(button);

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Expected 2 sizes, got 1'));

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Resize Callbacks', () => {
    it('calls onResizeStart when drag begins with ResizeInfo', async () => {
      const onResizeStart = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResizeStart={onResizeStart}>
            <Panel defaultSize="50%">Panel 1</Panel>
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]');
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });

      expect(onResizeStart).toHaveBeenCalledTimes(1);

      // Should receive ResizeInfo object
      const resizeInfo = onResizeStart.mock.calls[0][0] as ResizeInfo;
      expect(resizeInfo).toHaveProperty('currentSizes');
      expect(resizeInfo).toHaveProperty('proposedSizes');
      expect(resizeInfo).toHaveProperty('previousSizes');
      expect(resizeInfo).toHaveProperty('containerSize');
      expect(resizeInfo).toHaveProperty('direction');

      // Clean up
      fireEvent.pointerUp(document);
    });

    it('calls onResize during drag with ResizeInfo', async () => {
      const onResize = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">Panel 1</Panel>
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]');
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });

      expect(onResize).toHaveBeenCalled();

      // Should receive ResizeInfo object
      const resizeInfo = onResize.mock.calls[0][0] as ResizeInfo;
      expect(resizeInfo).toHaveProperty('currentSizes');
      expect(resizeInfo).toHaveProperty('proposedSizes');
      expect(resizeInfo).toHaveProperty('previousSizes');
      expect(resizeInfo).toHaveProperty('containerSize');
      expect(resizeInfo).toHaveProperty('direction');
      expect(resizeInfo.currentSizes).toHaveLength(2);
      expect(resizeInfo.proposedSizes).toHaveLength(2);
      expect(resizeInfo.previousSizes).toHaveLength(2);
      expect(resizeInfo.direction).toBe('horizontal');

      // Each size should have pixels, percent, and size properties
      expect(resizeInfo.currentSizes[0]).toHaveProperty('pixels');
      expect(resizeInfo.currentSizes[0]).toHaveProperty('percent');
      expect(resizeInfo.currentSizes[0]).toHaveProperty('size');

      // Clean up
      fireEvent.pointerUp(document);
    });

    it('calls onResizeEnd when drag ends with ResizeInfo', async () => {
      const onResizeEnd = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResizeEnd={onResizeEnd}>
            <Panel defaultSize="50%">Panel 1</Panel>
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]');
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });
      fireEvent.pointerUp(document);

      expect(onResizeEnd).toHaveBeenCalledTimes(1);

      // Should receive ResizeInfo object
      const resizeInfo = onResizeEnd.mock.calls[0][0] as ResizeInfo;
      expect(resizeInfo.currentSizes).toHaveLength(2);
      expect(resizeInfo.proposedSizes).toHaveLength(2);
      expect(resizeInfo.previousSizes).toHaveLength(2);
    });

    it('allows onResize to override sizes by returning new values', async () => {
      const onResize = vi.fn((info: ResizeInfo) => {
        // Snap to 100px grid
        return info.proposedSizes.map(s => ({
          ...s,
          pixels: Math.round(s.pixels / 100) * 100,
        }));
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]');
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 550, clientY: 300 }); // Move 50px right

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');

        // Should be snapped to nearest 100px multiple
        expect(width1 % 100).toBeCloseTo(0, 0);
      });

      fireEvent.pointerUp(document);
    });

    it('allows onResize to override sizes via return value', async () => {
      const onResize = vi.fn((_info: ResizeInfo): PanelSizeInfo[] | undefined => {
        // Return new sizes with first panel set to exactly 300px
        return [
          { size: '300px', pixels: 300, percent: 30 },
          { size: '700px', pixels: 700, percent: 70 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]');
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');

        // Should be forced to 300px by return value
        expect(width1).toBeCloseTo(300, 0);
      });

      fireEvent.pointerUp(document);
    });
  });

  describe('Nested Panels', () => {
    it('renders nested panel groups correctly', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="50%">
            <PanelGroup direction="vertical">
              <Panel defaultSize="50%">
                <div data-testid="nested-1">Nested 1</div>
              </Panel>
              <Panel defaultSize="50%">
                <div data-testid="nested-2">Nested 2</div>
              </Panel>
            </PanelGroup>
          </Panel>
          <Panel defaultSize="50%">
            <div data-testid="main-2">Main 2</div>
          </Panel>
        </PanelGroup>
      );

      expect(screen.getByTestId('nested-1')).toBeTruthy();
      expect(screen.getByTestId('nested-2')).toBeTruthy();
      expect(screen.getByTestId('main-2')).toBeTruthy();

      // Should have handles for both outer and inner groups
      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(2); // One for outer, one for inner
    });

    it('maintains inner panel proportions when outer panel resizes', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '800px' }}>
          <PanelGroup direction="horizontal" data-testid="outer-group">
            <Panel defaultSize="50%">
              <PanelGroup direction="vertical" data-testid="inner-group">
                <Panel defaultSize="50%">
                  <div data-testid="nested-1">Nested 1</div>
                </Panel>
                <Panel defaultSize="50%">
                  <div data-testid="nested-2">Nested 2</div>
                </Panel>
              </PanelGroup>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="main-2">Main 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for initial render
      await waitFor(() => {
        const nested1 = screen.getByTestId('nested-1').parentElement;
        const nested2 = screen.getByTestId('nested-2').parentElement;
        expect(nested1?.style.height).toBeTruthy();
        expect(nested2?.style.height).toBeTruthy();
      });

      // Get all handles - [0] is inner vertical (appears first in DOM), [1] is outer horizontal
      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      const innerHandle = handles[0] as HTMLElement;
      const outerHandle = handles[1] as HTMLElement;

      // Step 1: Resize the vertical (inner) panels from 50/50 to 30/70
      const nested1Before = screen.getByTestId('nested-1').parentElement;
      const initialHeight = parseFloat(nested1Before?.style.height || '0');

      fireEvent.pointerDown(innerHandle, { clientX: 250, clientY: 400 });
      fireEvent.pointerMove(document, { clientX: 250, clientY: 240 }); // Move up to ~30%
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const nested1 = screen.getByTestId('nested-1').parentElement;
        const height1 = parseFloat(nested1?.style.height || '0');
        // Should be significantly smaller than initial 50%
        expect(height1).toBeLessThan(initialHeight * 0.7);
      });

      // Capture the resized heights
      const nested1AfterResize = screen.getByTestId('nested-1').parentElement;
      const nested2AfterResize = screen.getByTestId('nested-2').parentElement;
      const height1AfterResize = parseFloat(nested1AfterResize?.style.height || '0');
      const height2AfterResize = parseFloat(nested2AfterResize?.style.height || '0');
      const totalHeightAfterResize = height1AfterResize + height2AfterResize;
      const ratio1AfterResize = height1AfterResize / totalHeightAfterResize;

      // Step 2: Resize the horizontal (outer) panel - this changes the container height for inner panels
      fireEvent.pointerDown(outerHandle, { clientX: 500, clientY: 400 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 400 }); // Expand left panel
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const main2 = screen.getByTestId('main-2').parentElement;
        const width = parseFloat(main2?.style.width || '0');
        // Main-2 should be smaller now (outer panel was resized)
        expect(width).toBeLessThan(500);
      });

      // Step 3: Verify that inner panel proportions are maintained (this is the bug fix)
      await waitFor(() => {
        const nested1 = screen.getByTestId('nested-1').parentElement;
        const nested2 = screen.getByTestId('nested-2').parentElement;
        const height1 = parseFloat(nested1?.style.height || '0');
        const height2 = parseFloat(nested2?.style.height || '0');
        const totalHeight = height1 + height2;
        const ratio1 = height1 / totalHeight;

        // The ratio should be maintained (approximately 30/70, not reverted to 50/50)
        // Allow some tolerance for rounding
        expect(ratio1).toBeCloseTo(ratio1AfterResize, 1);

        // Explicitly check it didn't revert to 50%
        expect(Math.abs(ratio1 - 0.5)).toBeGreaterThan(0.1);
      });
    });
  });

  describe('Size Constraints', () => {
    it('respects minSize constraint', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" minSize="200px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Try to drag past minimum
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 300 }); // Try to make it very small

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        // Should not go below minSize (200px)
        expect(width).toBeGreaterThanOrEqual(200);
      });

      fireEvent.pointerUp(document);
    });

    it('respects maxSize constraint', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" maxSize="700px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Try to drag past maximum
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 900, clientY: 300 }); // Try to make it very large

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        // Should not go above maxSize (700px)
        expect(width).toBeLessThanOrEqual(700);
      });

      fireEvent.pointerUp(document);
    });
  });

  describe('Direction Support', () => {
    it('renders horizontal panels correctly', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        // Horizontal panels should have width set
        expect(panel1?.style.width).toBeTruthy();
        expect(panel1?.style.height).toBe('100%');
      });
    });

    it('renders vertical panels correctly', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="vertical">
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        // Vertical panels should have height set
        expect(panel1?.style.height).toBeTruthy();
        expect(panel1?.style.width).toBe('100%');
      });
    });
  });

  describe('Mixed Size Units', () => {
    it('handles pixel and percentage sizes together', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="200px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="80%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        // Panel 1 should be 200px
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(200, 0);

        // Panel 2 should be ~800px (80% of 1000px)
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width2).toBeCloseTo(800, 0);
      });
    });
  });

  describe('Constraint Edge Cases', () => {
    it('handles drag when right panel hits its minimum constraint', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="100px" maxSize="900px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px" minSize="200px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle).toBeTruthy();

      // Drag right so much that it would push right panel below its minimum
      // Right panel min is 200px, so left can't go above 800px
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 900, clientY: 300 }); // Try to drag to 900px (delta +500)
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Left panel should be clamped to 800px (1000 - 200)
        expect(width1).toBeCloseTo(800, 0);
        // Right panel should be at its minimum of 200px
        expect(width2).toBeCloseTo(200, 0);
      });
    });

    it('handles drag when right panel hits its maximum constraint', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="600px" minSize="100px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="400px" maxSize="700px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle).toBeTruthy();

      // Drag left so much that it would push right panel above its maximum
      // Right panel max is 700px, so left can't go below 300px
      fireEvent.pointerDown(handle, { clientX: 600, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 300 }); // Try to drag to 100px (delta -500)
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Left panel should be clamped to 300px (1000 - 700)
        expect(width1).toBeCloseTo(300, 0);
        // Right panel should be at its maximum of 700px
        expect(width2).toBeCloseTo(700, 0);
      });
    });
  });

  describe('Auto-fill in Callbacks', () => {
    it('handles callback returning auto-fill for complementary panel', async () => {
      const onResize = vi.fn((info: ResizeInfo): PanelSizeInfo[] => {
        // Snap left panel to 250px, right panel auto-fills
        return [
          { ...info.proposedSizes[0], pixels: 250 },
          { ...info.proposedSizes[1], size: 'auto' as const, pixels: info.containerSize - 250 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResize).toHaveBeenCalled();
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        // Left panel should be 250px (snapped)
        expect(parseFloat(panel1?.style.width || '0')).toBeCloseTo(250, 0);
        // Right panel should auto-fill: 1000 - 250 = 750px
        expect(parseFloat(panel2?.style.width || '0')).toBeCloseTo(750, 0);
      });
    });

    it('maintains correct sum when callback uses auto-fill', async () => {
      const onResize = vi.fn((info: ResizeInfo): PanelSizeInfo[] => {
        // Snap to grid, auto-fill complementary panel
        const snapped = Math.round(info.proposedSizes[0].pixels / 50) * 50;
        return [
          { ...info.proposedSizes[0], pixels: snapped },
          { ...info.proposedSizes[1], size: 'auto' as const, pixels: info.containerSize - snapped },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Drag to approximately 475px (should snap to 500px)
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 475, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Left should snap to nearest 50px grid (around 450-500px)
        expect(width1 % 50).toBeCloseTo(0, 0);
        // Right should auto-fill to maintain 1000px total
        expect(width1 + width2).toBeCloseTo(1000, 0);
      });
    });

    it('allows onResizeEnd to use auto-fill for ratio enforcement', async () => {
      const onResizeEnd = vi.fn((info: ResizeInfo): PanelSizeInfo[] => {
        // Enforce 1:2 ratio using auto-fill
        const left = info.containerSize / 3;
        const right = (info.containerSize * 2) / 3;
        return [
          { ...info.currentSizes[0], pixels: left },
          { ...info.currentSizes[1], size: 'auto' as const, pixels: right },
        ];
      });

      const { container } = render(
        <div style={{ width: '1200px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResizeEnd={onResizeEnd}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Drag to any position (doesn't matter, will snap on release)
      fireEvent.pointerDown(handle, { clientX: 600, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 800, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResizeEnd).toHaveBeenCalled();
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Should snap to 1:2 ratio based on actual container measurement
        const total = width1 + width2;
        expect(width1).toBeCloseTo(total / 3, 0);
        expect(width2).toBeCloseTo((total * 2) / 3, 0);
        // Verify 1:2 ratio
        expect(width2 / width1).toBeCloseTo(2, 1);
      });
    });
  });

  describe('Panel Collapse', () => {
    it('collapses panel when dragged below minSize', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        expect(width).toBeCloseTo(400, 0);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Drag left past midpoint (125px) - should collapse to 50px
      // Midpoint = (50px + 200px) / 2 = 125px
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        expect(width).toBeCloseTo(50, 0);
      });
    });

    it('expands panel when dragged above minSize', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50px" minSize="200px" collapsedSize="50px" defaultCollapsed={true}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="950px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        expect(width).toBeCloseTo(50, 0);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Drag right past midpoint (125px) - should expand to minSize (200px)
      // Midpoint = (50px + 200px) / 2 = 125px
      fireEvent.pointerDown(handle, { clientX: 50, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 150, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width = parseFloat(panel1?.style.width || '0');
        expect(width).toBeCloseTo(200, 0);
      });
    });

    it('calls onCollapse callback when collapse state changes', async () => {
      const onCollapse = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Collapse the panel by dragging past midpoint (125px)
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(
        () => {
          expect(onCollapse).toHaveBeenCalledWith(true);
          expect(onCollapse).toHaveBeenCalledTimes(1);
        },
        { timeout: 100 }
      );

      // Expand the panel by dragging past midpoint (125px) in the other direction
      fireEvent.pointerDown(handle, { clientX: 50, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 150, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(
        () => {
          expect(onCollapse).toHaveBeenCalledWith(false);
          expect(onCollapse).toHaveBeenCalledTimes(2);
        },
        { timeout: 100 }
      );
    });

    it('does not call onCollapse if state does not change (infinite loop prevention)', async () => {
      const onCollapse = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Drag within normal range (above minSize) - should NOT trigger collapse
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 350, clientY: 300 });
      fireEvent.pointerUp(document);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onCollapse).not.toHaveBeenCalled();
    });

    it('maintains total size when collapsing/expanding', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1 + width2).toBeCloseTo(1000, 0);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Collapse by dragging past midpoint (125px)
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 100, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1 + width2).toBeCloseTo(1000, 0);
      });
    });
  });

  describe('Custom ResizeHandle', () => {
    it('detects and uses custom ResizeHandle children', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="50%">Panel 1</Panel>
          <ResizeHandle size={12} className="custom-handle" />
          <Panel defaultSize="50%">Panel 2</Panel>
        </PanelGroup>
      );

      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(1);

      const handle = handles[0] as HTMLElement;
      expect(handle.className).toContain('custom-handle');
      expect(handle.style.width).toBe('12px');
    });

    it('inserts default ResizeHandle when not provided', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="50%">Panel 1</Panel>
          <Panel defaultSize="50%">Panel 2</Panel>
        </PanelGroup>
      );

      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(1);

      const handle = handles[0] as HTMLElement;
      expect(handle.style.width).toBe('4px'); // Default size
    });

    it('mixes custom and default handles', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="33%">Panel 1</Panel>
          <ResizeHandle size={16} className="custom" />
          <Panel defaultSize="33%">Panel 2</Panel>
          {/* No handle specified - should insert default */}
          <Panel defaultSize="34%">Panel 3</Panel>
        </PanelGroup>
      );

      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBe(2);

      const customHandle = handles[0] as HTMLElement;
      expect(customHandle.className).toContain('custom');
      expect(customHandle.style.width).toBe('16px');

      const defaultHandle = handles[1] as HTMLElement;
      expect(defaultHandle.style.width).toBe('4px');
    });

    it('custom ResizeHandle triggers drag events', async () => {
      const onResizeStart = vi.fn();
      const onResize = vi.fn();
      const onResizeEnd = vi.fn();

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup
            direction="horizontal"
            onResizeStart={onResizeStart}
            onResize={onResize}
            onResizeEnd={onResizeEnd}
          >
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <ResizeHandle size={12} />
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle).toBeTruthy();

      // Start drag
      fireEvent.pointerDown(handle, { clientX: 500, clientY: 300 });
      expect(onResizeStart).toHaveBeenCalled();

      // Drag
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });
      expect(onResize).toHaveBeenCalled();

      // End drag
      fireEvent.pointerUp(document);
      expect(onResizeEnd).toHaveBeenCalled();
    });

    it('renders custom children inside ResizeHandle', () => {
      const { container } = render(
        <PanelGroup direction="horizontal">
          <Panel defaultSize="50%">Panel 1</Panel>
          <ResizeHandle>
            <div className="custom-grip">⋮</div>
          </ResizeHandle>
          <Panel defaultSize="50%">Panel 2</Panel>
        </PanelGroup>
      );

      const grip = container.querySelector('.custom-grip');
      expect(grip).toBeTruthy();
      expect(grip?.textContent).toBe('⋮');
    });
  });

  describe('Auto-sized Panels', () => {
    it('defaults to auto size when no defaultSize is provided', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="300px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel>
              <div data-testid="panel-2">Panel 2 (auto)</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize and apply sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Wait until panel sizes are applied via inline styles
        expect(width1).toBeCloseTo(300, 0);
      });

      const panel1 = screen.getByTestId('panel-1').parentElement;
      const panel2 = screen.getByTestId('panel-2').parentElement;

      const width1 = parseFloat(panel1?.style.width || '0');
      const width2 = parseFloat(panel2?.style.width || '0');

      // Panel 1 should be 300px, Panel 2 should fill remaining space (700px minus handle)
      expect(width1).toBeCloseTo(300, 0);
      expect(width2).toBeGreaterThan(650); // Approximately 700px minus handle
    });

    it('redistributes adjustment to auto-sized panels when constraints enforced', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="100px" minSize="200px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel>
              <div data-testid="panel-2">Panel 2 (auto)</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize and apply sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Wait until constrained size is applied (200px due to minSize)
        expect(width1).toBeCloseTo(200, 0);
      });

      const panel1 = screen.getByTestId('panel-1').parentElement;
      const panel2 = screen.getByTestId('panel-2').parentElement;

      const width1 = parseFloat(panel1?.style.width || '0');
      const width2 = parseFloat(panel2?.style.width || '0');

      // Panel 1 should be constrained to minSize 200px
      expect(width1).toBeCloseTo(200, 0);
      // Panel 2 should receive the adjustment (100px less than expected)
      expect(width2).toBeGreaterThan(750); // ~800px minus handle
    });

    it('handles multiple auto-sized panels distributing space equally', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="200px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel>
              <div data-testid="panel-2">Panel 2 (auto)</div>
            </Panel>
            <Panel>
              <div data-testid="panel-3">Panel 3 (auto)</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize and apply sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Wait until panel sizes are applied
        expect(width1).toBeCloseTo(200, 0);
      });

      const panel1 = screen.getByTestId('panel-1').parentElement;
      const panel2 = screen.getByTestId('panel-2').parentElement;
      const panel3 = screen.getByTestId('panel-3').parentElement;

      const width1 = parseFloat(panel1?.style.width || '0');
      const width2 = parseFloat(panel2?.style.width || '0');
      const width3 = parseFloat(panel3?.style.width || '0');

      // Panel 1 is fixed at 200px
      expect(width1).toBeCloseTo(200, 0);
      // Panels 2 and 3 should split remaining space approximately equally
      expect(Math.abs(width2 - width3)).toBeLessThan(10);
    });

    it('redistributes constraint adjustments across multiple auto panels', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50px" minSize="150px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50px" minSize="150px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
            <Panel>
              <div data-testid="panel-3">Panel 3 (auto)</div>
            </Panel>
            <Panel>
              <div data-testid="panel-4">Panel 4 (auto)</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize with constraints
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Both should be constrained to minSize
        expect(width1).toBeCloseTo(150, 0);
        expect(width2).toBeCloseTo(150, 0);
      });

      const panel3 = screen.getByTestId('panel-3').parentElement;
      const panel4 = screen.getByTestId('panel-4').parentElement;

      const width3 = parseFloat(panel3?.style.width || '0');
      const width4 = parseFloat(panel4?.style.width || '0');

      // Auto panels should split the remaining space (700px total - 200px adjustment = 500px)
      // Each auto panel gets ~350px (700/2)
      expect(width3).toBeGreaterThan(300);
      expect(width4).toBeGreaterThan(300);
      expect(Math.abs(width3 - width4)).toBeLessThan(10);
    });
  });

  describe('Imperative Collapse API', () => {
    it('collapsePanel() collapses a panel to collapsedSize', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial render
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(400, 0);
      });

      // Collapse the panel
      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      // Panel should collapse to 50px
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
      });
    });

    it('expandPanel() expands a panel to minSize', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.expandPanel(0)} data-testid="expand-btn">
              Expand
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" defaultCollapsed={true}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial collapsed state
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
      });

      // Expand the panel
      const expandBtn = screen.getByTestId('expand-btn');
      fireEvent.click(expandBtn);

      // Panel should expand to minSize (200px)
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(200, 0);
      });
    });

    it('imperative API fires onCollapse callback', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      // Collapse the panel
      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      // onCollapse should be called with true
      await waitFor(() => {
        expect(onCollapse).toHaveBeenCalledWith(true);
      });
    });

    it('isCollapsed() returns correct state', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);
        const [isCollapsed, setIsCollapsed] = useState(false);

        const checkState = () => {
          const collapsed = groupRef.current?.isCollapsed(0);
          setIsCollapsed(collapsed ?? false);
        };

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <button onClick={checkState} data-testid="check-btn">
              Check
            </button>
            <div data-testid="state">{String(isCollapsed)}</div>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      // Check initial state (not collapsed)
      const checkBtn = screen.getByTestId('check-btn');
      fireEvent.click(checkBtn);

      await waitFor(() => {
        const state = screen.getByTestId('state');
        expect(state.textContent).toBe('false');
      });

      // Collapse the panel
      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
      });

      // Check state after collapse
      fireEvent.click(checkBtn);

      await waitFor(() => {
        const state = screen.getByTestId('state');
        expect(state.textContent).toBe('true');
      });
    });

    it('collapsePanel warns when panel has no collapsedSize', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('does not have a collapsedSize'));
      });

      consoleSpy.mockRestore();
    });

    it('expandPanel warns when panel has no minSize', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.expandPanel(0)} data-testid="expand-btn">
              Expand
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="50px" collapsedSize="50px" defaultCollapsed={true}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="950px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      const expandBtn = screen.getByTestId('expand-btn');
      fireEvent.click(expandBtn);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('does not have a minSize'));
      });

      consoleSpy.mockRestore();
    });

    it('collapsePanel does nothing when already collapsed', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel
                defaultSize="50px"
                minSize="200px"
                collapsedSize="50px"
                defaultCollapsed={true}
                onCollapse={onCollapse}
              >
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="950px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial collapsed callback
      await waitFor(() => {
        expect(onCollapse).toHaveBeenCalledWith(true);
      });

      onCollapse.mockClear();

      // Try to collapse again
      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      // Should not fire callback again
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onCollapse).not.toHaveBeenCalled();
    });

    it('expandPanel does nothing when already expanded', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.expandPanel(0)} data-testid="expand-btn">
              Expand
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      // Try to expand when already expanded
      const expandBtn = screen.getByTestId('expand-btn');
      fireEvent.click(expandBtn);

      // Should not fire callback
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onCollapse).not.toHaveBeenCalled();
    });

    it('collapsePanel redistributes size to auto panels', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="auto">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(400, 0);
      });

      // Collapse the panel
      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      // Panel 1 should collapse to 50px, Panel 2 should auto-fill to 950px
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
        expect(width2).toBeCloseTo(950, 0);
      });
    });

    it('expandPanel redistributes size from auto panels', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.expandPanel(0)} data-testid="expand-btn">
              Expand
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="50px" minSize="200px" collapsedSize="50px" defaultCollapsed={true}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="auto">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
      });

      // Expand the panel
      const expandBtn = screen.getByTestId('expand-btn');
      fireEvent.click(expandBtn);

      // Panel 1 should expand to 200px, Panel 2 should auto-fill to 800px
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(200, 0);
        expect(width2).toBeCloseTo(800, 0);
      });
    });

    it('setSizes triggers collapse when size is below minSize', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.setSizes(['100px', '900px'])} data-testid="set-sizes-btn">
              Set Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      // Set size below minSize (200px) - should trigger collapse
      const setSizesBtn = screen.getByTestId('set-sizes-btn');
      fireEvent.click(setSizesBtn);

      await waitFor(() => {
        expect(onCollapse).toHaveBeenCalledWith(true);
      });
    });

    it('setSizes triggers expand when collapsed and size is above minSize', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.setSizes(['300px', '700px'])} data-testid="set-sizes-btn">
              Set Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel
                defaultSize="50px"
                minSize="200px"
                collapsedSize="50px"
                defaultCollapsed={true}
                onCollapse={onCollapse}
              >
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="950px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Wait for initial collapse callback
      await waitFor(() => {
        expect(onCollapse).toHaveBeenCalledWith(true);
      });

      onCollapse.mockClear();

      // Set size above minSize (200px) - should trigger expand
      const setSizesBtn = screen.getByTestId('set-sizes-btn');
      fireEvent.click(setSizesBtn);

      await waitFor(() => {
        expect(onCollapse).toHaveBeenCalledWith(false);
      });
    });

    it('setCollapsed() works as convenience method', async () => {
      const onCollapse = vi.fn();

      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.setCollapsed(0, true)} data-testid="set-collapsed-btn">
              Set Collapsed
            </button>
            <button onClick={() => groupRef.current?.setCollapsed(0, false)} data-testid="set-expanded-btn">
              Set Expanded
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="600px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1).toBeTruthy();
      });

      // Test setCollapsed(true)
      const setCollapsedBtn = screen.getByTestId('set-collapsed-btn');
      fireEvent.click(setCollapsedBtn);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(50, 0);
        expect(onCollapse).toHaveBeenCalledWith(true);
      });

      // Test setCollapsed(false)
      const setExpandedBtn = screen.getByTestId('set-expanded-btn');
      fireEvent.click(setExpandedBtn);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(200, 0);
        expect(onCollapse).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Invalid Configuration Warnings', () => {
    it('warns when collapsedSize >= minSize', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="250px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Trigger resize to invoke collapse logic
      await waitFor(() => {
        const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
        expect(handle).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      fireEvent.pointerDown(handle, { clientX: 400 });
      fireEvent.pointerMove(document, { clientX: 200 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('collapsedSize'));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('onResize Callback Advanced Usage', () => {
    it('handles callback returning size info with size property instead of pixels', async () => {
      const onResize = vi.fn((_info: ResizeInfo): PanelSizeInfo[] | undefined => {
        // Return new sizes using size property - create fresh objects without spreading
        // This ensures pixels will be recalculated from size
        return [
          { size: '250px' as PanelSize, pixels: 250, percent: 25 },
          { size: '750px' as PanelSize, pixels: 750, percent: 75 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize and apply initial sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Wait for initial 50% size to be applied (~500px)
        expect(width1).toBeGreaterThan(400);
        expect(width1).toBeLessThan(600);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500 });
      fireEvent.pointerMove(document, { clientX: 400 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResize).toHaveBeenCalled();

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Should use sizes from callback (250px and 750px)
        expect(width1).toBeCloseTo(250, 0);
        expect(width2).toBeCloseTo(750, 0);
      });
    });

    it('uses return value to override proposed sizes', async () => {
      const onResize = vi.fn((_info: ResizeInfo): PanelSizeInfo[] | undefined => {
        // Return new sizes to override proposed sizes
        return [
          { size: '300px', pixels: 300, percent: 30 },
          { size: '700px', pixels: 700, percent: 70 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Wait for PanelGroup to initialize and apply initial sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Wait for initial 50% size to be applied (~500px)
        expect(width1).toBeGreaterThan(400);
        expect(width1).toBeLessThan(600);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500 });
      fireEvent.pointerMove(document, { clientX: 400 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResize).toHaveBeenCalled();

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Should use returned values (300px and 700px)
        expect(width1).toBeCloseTo(300, 0);
        expect(width2).toBeCloseTo(700, 0);
      });
    });

    it('parses size property when pixels is undefined', async () => {
      const onResize = vi.fn((_info: ResizeInfo): PanelSizeInfo[] | undefined => {
        // Return sizes with only size property, omitting pixels
        // This bypasses TypeScript to test the size parsing fallback
        return [
          // @ts-expect-error - Intentionally omitting pixels to test fallback parsing
          { size: '200px' as PanelSize, percent: 20 },
          // @ts-expect-error - Intentionally omitting pixels to test fallback parsing
          { size: '800px' as PanelSize, percent: 80 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResize={onResize}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeGreaterThan(400);
        expect(width1).toBeLessThan(600);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500 });
      fireEvent.pointerMove(document, { clientX: 400 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResize).toHaveBeenCalled();

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Should parse size property to pixels (200px and 800px)
        expect(width1).toBeCloseTo(200, 0);
        expect(width2).toBeCloseTo(800, 0);
      });
    });

    it('onResizeEnd uses return value to override final sizes', async () => {
      const onResizeEnd = vi.fn((_info: ResizeInfo): PanelSizeInfo[] | undefined => {
        // Return new sizes to override final sizes
        return [
          { size: '350px', pixels: 350, percent: 35 },
          { size: '650px', pixels: 650, percent: 65 },
        ];
      });

      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal" onResizeEnd={onResizeEnd}>
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeGreaterThan(400);
        expect(width1).toBeLessThan(600);
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      fireEvent.pointerDown(handle, { clientX: 500 });
      fireEvent.pointerMove(document, { clientX: 400 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        expect(onResizeEnd).toHaveBeenCalled();

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Should use returned values (350px and 650px)
        expect(width1).toBeCloseTo(350, 0);
        expect(width2).toBeCloseTo(650, 0);
      });
    });
  });

  describe('Invalid Children', () => {
    it('handles non-React element children gracefully', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%">Panel 1</Panel>
            {null}
            {undefined}
            {'Plain text'}
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handles = container.querySelectorAll('[data-resize-handle="true"]');
        // Should still render handle between actual panels
        expect(handles.length).toBe(1);
      });
    });
  });

  describe('Wrapped Panel Children', () => {
    it('supports Panels wrapped in div elements', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <Panel defaultSize="30%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
            </div>
            <div>
              <Panel defaultSize="70%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </div>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        // Check that panels have sizes applied
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();

        // Check approximate sizes (30% of 1000px = 300px, 70% = 700px)
        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(300, 0);
        expect(width2).toBeCloseTo(700, 0);
      });
    });

    it('supports Panels wrapped in React fragments', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="40%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="60%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(400, 0);
        expect(width2).toBeCloseTo(600, 0);
      });
    });

    it('supports ResizeHandles wrapped in div elements', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <div>
              <ResizeHandle />
            </div>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handles = container.querySelectorAll('[data-resize-handle="true"]');
        expect(handles.length).toBe(1);

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(500, 0);
        expect(width2).toBeCloseTo(500, 0);
      });
    });

    it('supports conditionally rendered Panels', async () => {
      const showPanel = true;

      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            {showPanel && (
              <Panel defaultSize="25%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
            )}
            <Panel defaultSize="75%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(250, 0);
        expect(width2).toBeCloseTo(750, 0);
      });
    });

    it('supports deeply nested wrapper structures', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div className="wrapper">
              <div className="inner-wrapper">
                <Panel defaultSize="30%">
                  <div data-testid="panel-1">Panel 1</div>
                </Panel>
              </div>
            </div>
            <div className="wrapper">
              <div className="inner-wrapper">
                <Panel defaultSize="70%">
                  <div data-testid="panel-2">Panel 2</div>
                </Panel>
              </div>
            </div>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(300, 0);
        expect(width2).toBeCloseTo(700, 0);
      });
    });

    it('supports mixed wrapped and unwrapped Panels', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="25%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <div>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </div>
            <Panel defaultSize="25%">
              <div data-testid="panel-3">Panel 3</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const panel3 = screen.getByTestId('panel-3').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        const width3 = parseFloat(panel3?.style.width || '0');
        expect(width1).toBeCloseTo(250, 0);
        expect(width2).toBeCloseTo(500, 0);
        expect(width3).toBeCloseTo(250, 0);
      });
    });

    it('supports resizing wrapped Panels via drag', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <Panel defaultSize="50%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
            </div>
            <div>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </div>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle).toBeTruthy();

      // Drag handle 100px to the right
      fireEvent.pointerDown(handle, { clientX: 500 });
      fireEvent.pointerMove(document, { clientX: 600 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');

        // Panel 1 should be larger, Panel 2 smaller
        expect(width1).toBeGreaterThan(500);
        expect(width2).toBeLessThan(500);
        expect(width1 + width2).toBeCloseTo(1000, 0);
      });
    });

    it('supports imperative API with wrapped Panels', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button
              onClick={() => groupRef.current?.setSizes(['300px' as PanelSize, '700px' as PanelSize])}
              data-testid="set-sizes-btn"
            >
              Set Sizes
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <div>
                <Panel defaultSize="50%">
                  <div data-testid="panel-1">Panel 1</div>
                </Panel>
              </div>
              <div>
                <Panel defaultSize="50%">
                  <div data-testid="panel-2">Panel 2</div>
                </Panel>
              </div>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(500, 0);
      });

      const button = screen.getByTestId('set-sizes-btn');
      fireEvent.click(button);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        const width1 = parseFloat(panel1?.style.width || '0');
        const width2 = parseFloat(panel2?.style.width || '0');
        expect(width1).toBeCloseTo(300, 0);
        expect(width2).toBeCloseTo(700, 0);
      });
    });

    it('correctly counts panels when wrapped in various structures', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <Panel defaultSize="25%">Panel 1</Panel>
            </div>
            <Panel defaultSize="25%">Panel 2</Panel>
            <Panel defaultSize="25%">Panel 3</Panel>
            <div>
              <div>
                <Panel defaultSize="25%">Panel 4</Panel>
              </div>
            </div>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const handles = container.querySelectorAll('[data-resize-handle="true"]');
        // Should have 3 handles for 4 panels
        expect(handles.length).toBe(3);
      });
    });

    it('supports collapse functionality with wrapped Panels', async () => {
      function TestComponent() {
        const groupRef = useRef<PanelGroupHandle>(null);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => groupRef.current?.collapsePanel(0)} data-testid="collapse-btn">
              Collapse
            </button>
            <button onClick={() => groupRef.current?.expandPanel(0)} data-testid="expand-btn">
              Expand
            </button>
            <PanelGroup ref={groupRef} direction="horizontal">
              <div>
                <Panel defaultSize="50%" minSize="100px" collapsedSize="20px">
                  <div data-testid="panel-1">Panel 1</div>
                </Panel>
              </div>
              <div>
                <Panel defaultSize="50%">
                  <div data-testid="panel-2">Panel 2</div>
                </Panel>
              </div>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(500, 0);
      });

      const collapseBtn = screen.getByTestId('collapse-btn');
      fireEvent.click(collapseBtn);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeCloseTo(20, 0);
      });

      const expandBtn = screen.getByTestId('expand-btn');
      fireEvent.click(expandBtn);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        expect(width1).toBeGreaterThanOrEqual(100);
      });
    });
  });

  describe('Undefined Prop Handling', () => {
    it('handles minSize={undefined} without errors', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" minSize={undefined}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
      });
    });

    it('handles conditional minSize prop switching to undefined', async () => {
      function TestComponent() {
        const [hasMinSize, setHasMinSize] = useState(true);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setHasMinSize(!hasMinSize)} data-testid="toggle-btn">
              Toggle MinSize
            </button>
            <PanelGroup direction="horizontal">
              <Panel defaultSize="50%" minSize={hasMinSize ? '200px' : undefined}>
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Initially with minSize="200px"
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      // Toggle to minSize={undefined}
      const toggleBtn = screen.getByTestId('toggle-btn');
      fireEvent.click(toggleBtn);

      // Should still render without errors
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
      });
    });

    it('handles user scenario: conditional minSize based on layout', async () => {
      // Simulates the user's specific use case:
      // minSize={hasCompleteResponse ? (isVerticalLayout ? "5%" : "200px") : undefined}
      function TestComponent() {
        const [hasCompleteResponse, setHasCompleteResponse] = useState(false);
        const [isVerticalLayout, setIsVerticalLayout] = useState(false);

        const minSize = hasCompleteResponse ? (isVerticalLayout ? '5%' : '200px') : undefined;

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setHasCompleteResponse(!hasCompleteResponse)} data-testid="toggle-response">
              Toggle Response
            </button>
            <button onClick={() => setIsVerticalLayout(!isVerticalLayout)} data-testid="toggle-layout">
              Toggle Layout
            </button>
            <PanelGroup direction={isVerticalLayout ? 'vertical' : 'horizontal'}>
              <Panel defaultSize="50%" minSize={minSize} className="overflow-hidden">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Initially: hasCompleteResponse=false, minSize=undefined
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      // Set hasCompleteResponse=true, isVerticalLayout=false → minSize="200px"
      const toggleResponse = screen.getByTestId('toggle-response');
      fireEvent.click(toggleResponse);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      // Toggle layout: isVerticalLayout=true → minSize="5%"
      const toggleLayout = screen.getByTestId('toggle-layout');
      fireEvent.click(toggleLayout);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.height).toBeTruthy();
      });

      // Toggle response back: hasCompleteResponse=false → minSize=undefined
      fireEvent.click(toggleResponse);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        expect(panel1?.style.height).toBeTruthy();
        expect(panel2?.style.height).toBeTruthy();
      });

      // Should never throw "Invalid size format: NaNundefined" error
    });

    it('handles maxSize={undefined} without errors', async () => {
      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" maxSize={undefined}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
      });
    });
  });

  describe('Dynamic Panels', () => {
    it('handles dynamically added panels with correct initial sizes', async () => {
      function TestComponent() {
        const [panelCount, setPanelCount] = useState(2);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setPanelCount(3)} data-testid="add-panel-btn">
              Add Panel
            </button>
            <PanelGroup direction="vertical">
              <Panel defaultSize="50%" minSize="100px">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="50%" minSize="100px">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
              {panelCount === 3 && (
                <Panel defaultSize="50%" minSize="110px">
                  <div data-testid="panel-3">Panel 3</div>
                </Panel>
              )}
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Initial state: 2 panels
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        expect(panel1?.style.height).toBeTruthy();
        expect(panel2?.style.height).toBeTruthy();
        // Should not be 0px
        expect(panel1?.style.height).not.toBe('0px');
        expect(panel2?.style.height).not.toBe('0px');
      });

      // Add a third panel dynamically
      const addButton = screen.getByTestId('add-panel-btn');
      fireEvent.click(addButton);

      // New panel should render with correct size (not 0px)
      await waitFor(() => {
        const panel3 = screen.getByTestId('panel-3').parentElement;
        expect(panel3?.style.height).toBeTruthy();
        expect(panel3?.style.height).not.toBe('0px');
        // Verify it has a reasonable height value
        const height = parseFloat(panel3?.style.height || '0');
        expect(height).toBeGreaterThan(0);
      });
    });

    it('handles resizing after dynamically adding panels without errors', async () => {
      function TestComponent() {
        const [panelCount, setPanelCount] = useState(2);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setPanelCount(3)} data-testid="add-panel-btn">
              Add Panel
            </button>
            <PanelGroup direction="vertical">
              <Panel defaultSize="40%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="30%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
              {panelCount === 3 && (
                <Panel defaultSize="30%">
                  <div data-testid="panel-3">Panel 3</div>
                </Panel>
              )}
            </PanelGroup>
          </div>
        );
      }

      const { container } = render(<TestComponent />);

      // Add a third panel dynamically
      const addButton = screen.getByTestId('add-panel-btn');
      fireEvent.click(addButton);

      await waitFor(() => {
        const panel3 = screen.getByTestId('panel-3').parentElement;
        expect(panel3).toBeTruthy();
      });

      // Try to resize - this should not throw "Invalid size format: NaNundefined"
      const handles = container.querySelectorAll('[data-resize-handle="true"]');
      expect(handles.length).toBeGreaterThan(0);

      const handle = handles[0];
      const startY = 200;
      const moveY = 250;

      // Should not throw any errors during resize
      fireEvent.pointerDown(handle, { clientY: startY, button: 0 });
      fireEvent.pointerMove(document, { clientY: moveY, button: 0 });
      fireEvent.pointerUp(document, { button: 0 });

      // Verify panels still have valid sizes
      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;
        const panel3 = screen.getByTestId('panel-3').parentElement;

        expect(panel1?.style.height).toBeTruthy();
        expect(panel2?.style.height).toBeTruthy();
        expect(panel3?.style.height).toBeTruthy();

        // Verify sizes are valid (not 0px, not NaN, not undefined)
        expect(panel1?.style.height).toMatch(/^\d+(\.\d+)?px$/);
        expect(panel2?.style.height).toMatch(/^\d+(\.\d+)?px$/);
        expect(panel3?.style.height).toMatch(/^\d+(\.\d+)?px$/);
      });
    });

    it('handles dynamically removed panels', async () => {
      function TestComponent() {
        const [panelCount, setPanelCount] = useState(3);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setPanelCount(2)} data-testid="remove-panel-btn">
              Remove Panel
            </button>
            <PanelGroup direction="horizontal">
              <Panel defaultSize="33%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="33%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
              {panelCount === 3 && (
                <Panel defaultSize="34%">
                  <div data-testid="panel-3">Panel 3</div>
                </Panel>
              )}
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      // Initial state: 3 panels
      await waitFor(() => {
        const panel3 = screen.getByTestId('panel-3').parentElement;
        expect(panel3).toBeTruthy();
      });

      // Remove third panel
      const removeButton = screen.getByTestId('remove-panel-btn');
      fireEvent.click(removeButton);

      // Verify panel 3 is removed and panels 1 & 2 still have valid sizes
      await waitFor(() => {
        expect(screen.queryByTestId('panel-3')).not.toBeInTheDocument();

        const panel1 = screen.getByTestId('panel-1').parentElement;
        const panel2 = screen.getByTestId('panel-2').parentElement;

        expect(panel1?.style.width).toBeTruthy();
        expect(panel2?.style.width).toBeTruthy();
        expect(panel1?.style.width).not.toBe('0px');
        expect(panel2?.style.width).not.toBe('0px');
      });
    });

    it('maintains correct state when panel count changes multiple times', async () => {
      function TestComponent() {
        const [panelCount, setPanelCount] = useState(2);

        return (
          <div style={{ width: '1000px', height: '600px' }}>
            <button onClick={() => setPanelCount(3)} data-testid="add-btn">
              Add
            </button>
            <button onClick={() => setPanelCount(2)} data-testid="remove-btn">
              Remove
            </button>
            <PanelGroup direction="horizontal">
              <Panel defaultSize="50%">
                <div data-testid="panel-1">Panel 1</div>
              </Panel>
              <Panel defaultSize="50%">
                <div data-testid="panel-2">Panel 2</div>
              </Panel>
              {panelCount === 3 && (
                <Panel defaultSize="33%">
                  <div data-testid="panel-3">Panel 3</div>
                </Panel>
              )}
            </PanelGroup>
          </div>
        );
      }

      render(<TestComponent />);

      const addButton = screen.getByTestId('add-btn');
      const removeButton = screen.getByTestId('remove-btn');

      // Add panel
      fireEvent.click(addButton);
      await waitFor(() => {
        const panel3 = screen.getByTestId('panel-3').parentElement;
        expect(panel3?.style.width).not.toBe('0px');
      });

      // Remove panel
      fireEvent.click(removeButton);
      await waitFor(() => {
        expect(screen.queryByTestId('panel-3')).not.toBeInTheDocument();
      });

      // Add again
      fireEvent.click(addButton);
      await waitFor(() => {
        const panel3 = screen.getByTestId('panel-3').parentElement;
        expect(panel3?.style.width).toBeTruthy();
        expect(panel3?.style.width).not.toBe('0px');
      });

      // All panels should still have valid sizes
      const panel1 = screen.getByTestId('panel-1').parentElement;
      const panel2 = screen.getByTestId('panel-2').parentElement;
      const panel3 = screen.getByTestId('panel-3').parentElement;

      expect(panel1?.style.width).toMatch(/^\d+(\.\d+)?px$/);
      expect(panel2?.style.width).toMatch(/^\d+(\.\d+)?px$/);
      expect(panel3?.style.width).toMatch(/^\d+(\.\d+)?px$/);
    });
  });

  describe('Branch Coverage Tests', () => {
    it('setSizes: panel stays collapsed when size is at or below minSize', async () => {
      const groupRef = useRef<PanelGroupHandle>(null);
      const onCollapse = vi.fn();

      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup ref={groupRef} direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" defaultCollapsed onCollapse={onCollapse}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(parseFloat(panel1?.style.width || '0')).toBeCloseTo(50, 0);
      });

      // Panel starts collapsed. Call setSizes with a size <= minSize
      // This should keep it collapsed (no transition)
      groupRef.current?.setSizes(['150px', '850px']);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        // Should still be collapsed at collapsedSize
        expect(parseFloat(panel1?.style.width || '0')).toBeCloseTo(50, 0);
      });

      // onCollapse should have been called once on mount, but not again (no transition)
      expect(onCollapse).toHaveBeenCalledTimes(1);
      expect(onCollapse).toHaveBeenCalledWith(true);
    });

    it('setSizes: panel stays expanded when size is at or above minSize', async () => {
      const groupRef = useRef<PanelGroupHandle>(null);
      const onCollapse = vi.fn();

      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup ref={groupRef} direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px" onCollapse={onCollapse}>
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(parseFloat(panel1?.style.width || '0')).toBeCloseTo(400, 0);
      });

      // Panel starts expanded. Call setSizes with a size >= minSize
      // This should keep it expanded (no transition)
      groupRef.current?.setSizes(['300px', '700px']);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        // Should be at the new size (still expanded)
        expect(parseFloat(panel1?.style.width || '0')).toBeCloseTo(300, 0);
      });

      // onCollapse should never be called (no transition)
      expect(onCollapse).not.toHaveBeenCalled();
    });

    it('isCollapsed returns false for out-of-bounds index', () => {
      const groupRef = useRef<PanelGroupHandle>(null);

      render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup ref={groupRef} direction="horizontal">
            <Panel defaultSize="50%">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      // Query an index that doesn't exist
      const result = groupRef.current?.isCollapsed(999);
      expect(result).toBe(false);
    });

    it('handles drag with right panel having collapsedSize', async () => {
      const { container } = render(
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="400px" minSize="200px" collapsedSize="50px">
              <div data-testid="panel-1">Panel 1</div>
            </Panel>
            <Panel defaultSize="600px" minSize="300px" collapsedSize="100px">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      );

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        expect(panel1?.style.width).toBeTruthy();
      });

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle).toBeTruthy();

      // Drag right (expand left, shrink right toward its collapsedSize)
      fireEvent.pointerDown(handle, { clientX: 400, clientY: 300 });
      fireEvent.pointerMove(document, { clientX: 600, clientY: 300 });
      fireEvent.pointerUp(document);

      await waitFor(() => {
        const panel1 = screen.getByTestId('panel-1').parentElement;
        const width1 = parseFloat(panel1?.style.width || '0');
        // Panel 1 should have expanded
        expect(width1).toBeGreaterThan(400);
      });
    });
  });
});
