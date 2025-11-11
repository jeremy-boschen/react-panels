import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ResizeHandle } from '../ResizeHandle';

describe('ResizeHandle', () => {
  it('sets cursor on document.body during drag', () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    // Store original body cursor
    const originalCursor = document.body.style.cursor;
    const originalUserSelect = document.body.style.userSelect;

    const { container } = render(
      <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
    );

    const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
    expect(handle).toBeTruthy();

    // Before drag, body should have original cursor
    expect(document.body.style.cursor).toBe(originalCursor);

    // Start drag
    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 });

    // During drag, body should have col-resize cursor
    expect(document.body.style.cursor).toBe('col-resize');
    expect(document.body.style.userSelect).toBe('none');

    // Drag should be called
    fireEvent.mouseMove(document, { clientX: 150, clientY: 100 });
    expect(onDrag).toHaveBeenCalled();

    // End drag
    fireEvent.mouseUp(document);

    // After drag, body cursor should be restored
    expect(document.body.style.cursor).toBe(originalCursor);
    expect(document.body.style.userSelect).toBe(originalUserSelect);
  });

  it('sets row-resize cursor for vertical direction', () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    const { container } = render(
      <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
    );

    const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
    expect(handle).toBeTruthy();

    // Start drag
    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 });

    // During drag, body should have row-resize cursor
    expect(document.body.style.cursor).toBe('row-resize');

    // End drag
    fireEvent.mouseUp(document);
  });

  it('restores previous cursor when ending drag', () => {
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    // Set a custom cursor before drag
    document.body.style.cursor = 'pointer';
    document.body.style.userSelect = 'text';

    const { container } = render(
      <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
    );

    const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

    // Start drag
    fireEvent.mouseDown(handle, { clientX: 100, clientY: 100 });
    expect(document.body.style.cursor).toBe('col-resize');

    // End drag
    fireEvent.mouseUp(document);

    // Should restore to 'pointer', not empty string
    expect(document.body.style.cursor).toBe('pointer');
    expect(document.body.style.userSelect).toBe('text');

    // Clean up
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  describe('Customization', () => {
    it('applies custom size prop', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle
          direction="horizontal"
          size={12}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle.style.width).toBe('12px');
    });

    it('applies default size when not specified', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle.style.width).toBe('4px');
    });

    it('applies custom className', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle
          direction="horizontal"
          className="custom-handle"
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle.className).toContain('custom-handle');
    });

    it('applies custom style prop', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle
          direction="horizontal"
          style={{ backgroundColor: 'red', opacity: 0.5 }}
          onDragStart={onDragStart}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle.style.backgroundColor).toBe('red');
      expect(handle.style.opacity).toBe('0.5');
    });

    it('renders custom children content', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd}>
          <div className="handle-grip">⋮</div>
        </ResizeHandle>
      );

      const grip = container.querySelector('.handle-grip');
      expect(grip).toBeTruthy();
      expect(grip?.textContent).toBe('⋮');
    });

    it('applies size correctly for vertical direction', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" size={8} onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;
      expect(handle.style.height).toBe('8px');
      expect(handle.style.width).toBe('100%');
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles ArrowLeft key for horizontal layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowLeft key
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });

      // Should call all callbacks with negative delta (10px step)
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(-10);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('handles ArrowRight key for horizontal layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowRight key
      fireEvent.keyDown(handle, { key: 'ArrowRight' });

      // Should call all callbacks with positive delta (10px step)
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(10);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('handles ArrowUp key for vertical layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowUp key
      fireEvent.keyDown(handle, { key: 'ArrowUp' });

      // Should call all callbacks with negative delta (10px step)
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(-10);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('handles ArrowDown key for vertical layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowDown key
      fireEvent.keyDown(handle, { key: 'ArrowDown' });

      // Should call all callbacks with positive delta (10px step)
      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(10);
      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('uses larger step size with Shift key for horizontal layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowLeft with Shift key
      fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true });

      // Should use 50px step instead of 10px
      expect(onDrag).toHaveBeenCalledWith(-50);

      // Reset mocks
      onDrag.mockClear();

      // Press ArrowRight with Shift key
      fireEvent.keyDown(handle, { key: 'ArrowRight', shiftKey: true });

      // Should use 50px step
      expect(onDrag).toHaveBeenCalledWith(50);
    });

    it('uses larger step size with Shift key for vertical layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowUp with Shift key
      fireEvent.keyDown(handle, { key: 'ArrowUp', shiftKey: true });

      // Should use 50px step instead of 10px
      expect(onDrag).toHaveBeenCalledWith(-50);

      // Reset mocks
      onDrag.mockClear();

      // Press ArrowDown with Shift key
      fireEvent.keyDown(handle, { key: 'ArrowDown', shiftKey: true });

      // Should use 50px step
      expect(onDrag).toHaveBeenCalledWith(50);
    });

    it('ignores non-arrow keys', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press various non-arrow keys
      fireEvent.keyDown(handle, { key: 'Enter' });
      fireEvent.keyDown(handle, { key: 'Space' });
      fireEvent.keyDown(handle, { key: 'a' });

      // Should not call any callbacks
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('ignores wrong arrow keys for horizontal layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowUp and ArrowDown (should be ignored for horizontal)
      fireEvent.keyDown(handle, { key: 'ArrowUp' });
      fireEvent.keyDown(handle, { key: 'ArrowDown' });

      // Should not call any callbacks
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('ignores wrong arrow keys for vertical layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Press ArrowLeft and ArrowRight (should be ignored for vertical)
      fireEvent.keyDown(handle, { key: 'ArrowLeft' });
      fireEvent.keyDown(handle, { key: 'ArrowRight' });

      // Should not call any callbacks
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();
      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('has proper ARIA attributes for horizontal layout', () => {
      const { container } = render(<ResizeHandle direction="horizontal" />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      expect(handle.getAttribute('role')).toBe('separator');
      expect(handle.getAttribute('aria-orientation')).toBe('vertical');
      expect(handle.getAttribute('tabIndex')).toBe('0');
    });

    it('has proper ARIA attributes for vertical layout', () => {
      const { container } = render(<ResizeHandle direction="vertical" />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      expect(handle.getAttribute('role')).toBe('separator');
      expect(handle.getAttribute('aria-orientation')).toBe('horizontal');
      expect(handle.getAttribute('tabIndex')).toBe('0');
    });
  });

  describe('Touch Support', () => {
    // Helper to create Touch object
    const createTouch = (id: number, x: number, y: number) => {
      return new Touch({
        identifier: id,
        target: document.body,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y,
      });
    };

    it('handles touch start and touch move for horizontal layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(document.body.style.cursor).toBe('col-resize');

      // Move touch
      const touch2 = createTouch(0, 150, 100);
      fireEvent.touchMove(document, {
        touches: [touch2],
      });

      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(50);

      // End touch
      fireEvent.touchEnd(document, {
        touches: [],
      });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(document.body.style.cursor).toBe('');
    });

    it('handles touch start and touch move for vertical layout', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="vertical" onDragStart={onDragStart} onDrag={onDrag} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);
      expect(document.body.style.cursor).toBe('row-resize');

      // Move touch
      const touch2 = createTouch(0, 100, 150);
      fireEvent.touchMove(document, {
        touches: [touch2],
      });

      expect(onDrag).toHaveBeenCalledTimes(1);
      expect(onDrag).toHaveBeenCalledWith(50);

      // End touch
      fireEvent.touchEnd(document, {
        touches: [],
      });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
    });

    it('ignores multi-touch events', () => {
      const onDragStart = vi.fn();
      const onDrag = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDrag={onDrag} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start with multi-touch (2 fingers)
      const touch1 = createTouch(0, 100, 100);
      const touch2 = createTouch(1, 200, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1, touch2],
      });

      // Should ignore multi-touch
      expect(onDragStart).not.toHaveBeenCalled();
      expect(onDrag).not.toHaveBeenCalled();
    });

    it('tracks touch identifier correctly', () => {
      const onDrag = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDrag={onDrag} />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch with identifier 0
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      // Move with correct identifier
      const touch2 = createTouch(0, 150, 100);
      fireEvent.touchMove(document, {
        touches: [touch2],
      });

      expect(onDrag).toHaveBeenCalledWith(50);
      onDrag.mockClear();

      // Try to move with different identifier (should be ignored)
      const touch3 = createTouch(1, 200, 100);
      fireEvent.touchMove(document, {
        touches: [touch3],
      });

      expect(onDrag).not.toHaveBeenCalled();
    });

    it('handles touch cancel event', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);

      // Cancel touch
      fireEvent.touchCancel(document, {
        touches: [],
      });

      expect(onDragEnd).toHaveBeenCalledTimes(1);
      expect(document.body.style.cursor).toBe('');
    });

    it('ignores touch events when already dragging', () => {
      const onDragStart = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDragStart={onDragStart} />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start first touch
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      expect(onDragStart).toHaveBeenCalledTimes(1);
      onDragStart.mockClear();

      // Try to start second touch while first is active
      const touch2 = createTouch(1, 200, 100);
      fireEvent.touchStart(handle, {
        touches: [touch2],
      });

      // Should ignore the second touch
      expect(onDragStart).not.toHaveBeenCalled();
    });

    it('restores previous cursor and userSelect after touch', () => {
      const onDragStart = vi.fn();
      const onDragEnd = vi.fn();

      // Set custom cursor before touch
      document.body.style.cursor = 'pointer';
      document.body.style.userSelect = 'text';

      const { container } = render(
        <ResizeHandle direction="horizontal" onDragStart={onDragStart} onDragEnd={onDragEnd} />
      );

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      expect(document.body.style.cursor).toBe('col-resize');
      expect(document.body.style.userSelect).toBe('none');

      // End touch
      fireEvent.touchEnd(document, {
        touches: [],
      });

      // Should restore previous values
      expect(document.body.style.cursor).toBe('pointer');
      expect(document.body.style.userSelect).toBe('text');

      // Clean up
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    });

    it('tracks cumulative delta during touch move', () => {
      const onDrag = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDrag={onDrag} />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch at 100
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      // Move to 150 (delta +50)
      const touch2 = createTouch(0, 150, 100);
      fireEvent.touchMove(document, {
        touches: [touch2],
      });

      expect(onDrag).toHaveBeenCalledWith(50);
      onDrag.mockClear();

      // Move to 180 (cumulative delta +80 from start)
      const touch3 = createTouch(0, 180, 100);
      fireEvent.touchMove(document, {
        touches: [touch3],
      });

      expect(onDrag).toHaveBeenCalledWith(80);
      onDrag.mockClear();

      // Move back to 120 (cumulative delta +20 from start)
      const touch4 = createTouch(0, 120, 100);
      fireEvent.touchMove(document, {
        touches: [touch4],
      });

      expect(onDrag).toHaveBeenCalledWith(20);
    });

    it('ignores touch move when touch is not being tracked', () => {
      const onDrag = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDrag={onDrag} />);

      // Try to move without starting touch first
      const touch1 = createTouch(0, 150, 100);
      fireEvent.touchMove(document, {
        touches: [touch1],
      });

      expect(onDrag).not.toHaveBeenCalled();
    });

    it('ignores touch end when touch is not being tracked', () => {
      const onDragEnd = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDragEnd={onDragEnd} />);

      // Try to end without starting touch first
      fireEvent.touchEnd(document, {
        touches: [],
      });

      expect(onDragEnd).not.toHaveBeenCalled();
    });

    it('does not end drag if tracked touch is still active', () => {
      const onDragEnd = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDragEnd={onDragEnd} />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start touch with identifier 0
      const touch1 = createTouch(0, 100, 100);
      fireEvent.touchStart(handle, {
        touches: [touch1],
      });

      // Fire touchEnd but keep identifier 0 in touches array (shouldn't happen in real world, but edge case)
      const touch2 = createTouch(0, 100, 100);
      fireEvent.touchEnd(document, {
        touches: [touch2],
      });

      // Should not call onDragEnd since touch 0 is still in touches
      expect(onDragEnd).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('uses default horizontal direction when not specified', () => {
      const { container } = render(<ResizeHandle />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Should default to horizontal (aria-orientation is vertical for horizontal resizers)
      expect(handle.getAttribute('aria-orientation')).toBe('vertical');
    });

    it('ignores mouseMove events after drag has ended', () => {
      const onDrag = vi.fn();

      const { container } = render(<ResizeHandle direction="horizontal" onDrag={onDrag} />);

      const handle = container.querySelector('[data-resize-handle="true"]') as HTMLElement;

      // Start drag
      fireEvent.mouseDown(handle, { clientX: 100 });
      expect(onDrag).toHaveBeenCalledTimes(0); // Not called on mouseDown

      // Move during drag
      fireEvent.mouseMove(document, { clientX: 150 });
      expect(onDrag).toHaveBeenCalledTimes(1);

      // End drag
      fireEvent.mouseUp(document);

      // Try to move after drag ended - should be ignored
      onDrag.mockClear();
      fireEvent.mouseMove(document, { clientX: 200 });
      expect(onDrag).not.toHaveBeenCalled();
    });
  });
});
