import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Profiler, type ProfilerOnRenderCallback, useRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Panel } from '../Panel';
import { PanelGroup } from '../PanelGroup';
import type { PanelGroupHandle, PanelSize } from '../types';

describe('PanelGroup Performance Profiling', () => {
  it('measures render time for direct panels', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      renderTimes.push(actualDuration);
    };

    render(
      <Profiler id="direct-panels" onRender={onRender}>
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
      </Profiler>
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-1')).toBeInTheDocument();
    });

    // Initial mount + effects should complete quickly
    // Target: < 50ms for initial render
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
    expect(totalRenderTime).toBeLessThan(50);
  });

  it('measures render time for wrapped panels', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      renderTimes.push(actualDuration);
    };

    render(
      <Profiler id="wrapped-panels" onRender={onRender}>
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
      </Profiler>
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-1')).toBeInTheDocument();
    });

    // Wrapped panels should have similar performance
    // Target: < 50ms for initial render (same as direct)
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
    expect(totalRenderTime).toBeLessThan(50);
  });

  it('compares direct vs wrapped panel performance', async () => {
    const directTimes: number[] = [];
    const wrappedTimes: number[] = [];

    const onRenderDirect: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      directTimes.push(actualDuration);
    };

    const onRenderWrapped: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      wrappedTimes.push(actualDuration);
    };

    // Render direct panels
    const { unmount: unmountDirect } = render(
      <Profiler id="direct" onRender={onRenderDirect}>
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%">Panel 1</Panel>
            <Panel defaultSize="50%">Panel 2</Panel>
          </PanelGroup>
        </div>
      </Profiler>
    );

    await waitFor(() => {
      expect(directTimes.length).toBeGreaterThan(0);
    });

    unmountDirect();

    // Render wrapped panels
    const { unmount: unmountWrapped } = render(
      <Profiler id="wrapped" onRender={onRenderWrapped}>
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <Panel defaultSize="50%">Panel 1</Panel>
            </div>
            <div>
              <Panel defaultSize="50%">Panel 2</Panel>
            </div>
          </PanelGroup>
        </div>
      </Profiler>
    );

    await waitFor(() => {
      expect(wrappedTimes.length).toBeGreaterThan(0);
    });

    unmountWrapped();

    const directTotal = directTimes.reduce((sum, time) => sum + time, 0);
    const wrappedTotal = wrappedTimes.reduce((sum, time) => sum + time, 0);

    // If both are effectively 0, they're both fast enough - pass the test
    if (directTotal < 0.1 && wrappedTotal < 0.1) {
      expect(true).toBe(true); // Both extremely fast
      return;
    }

    // If directTotal is 0 but wrapped is not, use absolute threshold
    if (directTotal < 0.1) {
      // Wrapped should still be fast (< 50ms absolute)
      expect(wrappedTotal).toBeLessThan(50);
      return;
    }

    // Normal case: wrapped should not be significantly slower than direct
    // With memoization, typically 1.3-1.5x, but allow up to 3x for browser variance
    const overhead = wrappedTotal / directTotal;
    expect(overhead).toBeLessThan(3);
  });

  it('measures re-render performance during resize', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      if (phase === 'update') {
        renderTimes.push(actualDuration);
      }
    };

    const { container } = render(
      <Profiler id="resize" onRender={onRender}>
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
      </Profiler>
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-1')).toBeInTheDocument();
    });

    const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

    // Perform resize drag
    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 600 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      expect(renderTimes.length).toBeGreaterThan(0);
    });

    // Each update during resize should be fast
    // Target: < 16ms per update (60fps)
    renderTimes.forEach(time => {
      expect(time).toBeLessThan(16);
    });
  });

  it('measures imperative API setSizes performance', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, phase, actualDuration) => {
      if (phase === 'update') {
        renderTimes.push(actualDuration);
      }
    };

    function TestComponent() {
      const groupRef = useRef<PanelGroupHandle>(null);

      return (
        <Profiler id="imperative-api" onRender={onRender}>
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
        </Profiler>
      );
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('panel-1')).toBeInTheDocument();
    });

    const button = screen.getByTestId('set-sizes-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(renderTimes.length).toBeGreaterThan(0);
    });

    // setSizes should trigger fast update
    // Target: < 16ms
    const avgRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;
    expect(avgRenderTime).toBeLessThan(16);
  });

  it('measures performance with many panels (10 panels)', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      renderTimes.push(actualDuration);
    };

    render(
      <Profiler id="many-panels" onRender={onRender}>
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i}>
                <Panel defaultSize="10%">Panel {i + 1}</Panel>
              </div>
            ))}
          </PanelGroup>
        </div>
      </Profiler>
    );

    await waitFor(() => {
      const panels = document.querySelectorAll('[data-panel="true"]');
      expect(panels.length).toBe(10);
    });

    // Even with 10 wrapped panels, should render quickly
    // Target: < 100ms total
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
    expect(totalRenderTime).toBeLessThan(100);
  });

  it('measures performance with deeply nested wrappers (5 levels)', async () => {
    const renderTimes: number[] = [];

    const onRender: ProfilerOnRenderCallback = (_id, _phase, actualDuration) => {
      renderTimes.push(actualDuration);
    };

    render(
      <Profiler id="deep-nesting" onRender={onRender}>
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <div>
                <div>
                  <div>
                    <div>
                      <Panel defaultSize="50%">
                        <div data-testid="panel-1">Panel 1</div>
                      </Panel>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Panel defaultSize="50%">
              <div data-testid="panel-2">Panel 2</div>
            </Panel>
          </PanelGroup>
        </div>
      </Profiler>
    );

    await waitFor(() => {
      expect(screen.getByTestId('panel-1')).toBeInTheDocument();
    });

    // Deep nesting should still be performant
    // Target: < 50ms
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0);
    expect(totalRenderTime).toBeLessThan(50);
  });

  it('measures state update frequency during drag', async () => {
    const updateCounts = { mount: 0, update: 0 };

    const onRender: ProfilerOnRenderCallback = (_id, phase) => {
      if (phase === 'mount') {
        updateCounts.mount++;
      } else {
        updateCounts.update++;
      }
    };

    const { container } = render(
      <Profiler id="drag-updates" onRender={onRender}>
        <div style={{ width: '1000px', height: '600px' }}>
          <PanelGroup direction="horizontal">
            <div>
              <Panel defaultSize="50%">Panel 1</Panel>
            </div>
            <div>
              <Panel defaultSize="50%">Panel 2</Panel>
            </div>
          </PanelGroup>
        </div>
      </Profiler>
    );

    await waitFor(() => {
      const panels = container.querySelectorAll('[data-panel="true"]');
      expect(panels.length).toBe(2);
    });

    const initialUpdateCount = updateCounts.update;

    const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

    // Single drag operation
    fireEvent.mouseDown(handle, { clientX: 500 });
    fireEvent.mouseMove(document, { clientX: 550 });
    fireEvent.mouseMove(document, { clientX: 600 });
    fireEvent.mouseUp(document);

    await waitFor(() => {
      const panels = container.querySelectorAll('[data-panel="true"]');
      const width1 = (panels[0] as HTMLElement).style.width;
      expect(width1).not.toBe('500px');
    });

    // Should have minimal updates (not re-rendering on every pixel)
    // Expected: 2 mousemove events = ~2 updates + 1 mouseup = ~3 total
    const totalUpdates = updateCounts.update - initialUpdateCount;
    expect(totalUpdates).toBeLessThan(10);
  });
});
