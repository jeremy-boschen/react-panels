import { describe, expect, it } from 'vitest';
import { findPanelChildren, flattenPanelChildren } from '../childUtils';
import { Panel } from '../Panel';
import { ResizeHandle } from '../ResizeHandle';

describe('childUtils', () => {
  describe('findPanelChildren', () => {
    it('finds direct Panel children', () => {
      const children = [
        <Panel key="1" />,
        <Panel key="2" />,
        <ResizeHandle key="h1" />,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);

      expect(panels).toHaveLength(2);
      expect(panels[0].type).toBe(Panel);
      expect(panels[1].type).toBe(Panel);
    });

    it('finds nested Panel children inside wrapper components', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Panel key="1" />,
        <Wrapper key="w1">
          <Panel key="2" />
          <Panel key="3" />
        </Wrapper>,
        <ResizeHandle key="h1" />,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);

      expect(panels).toHaveLength(3);
      expect(panels[0].type).toBe(Panel);
      expect(panels[1].type).toBe(Panel);
      expect(panels[2].type).toBe(Panel);
    });

    it('finds deeply nested Panel children', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Wrapper key="w1">
          <Wrapper key="w2">
            <Wrapper key="w3">
              <Panel key="1" />
            </Wrapper>
          </Wrapper>
        </Wrapper>,
        <Panel key="2" />,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);

      expect(panels).toHaveLength(2);
      expect(panels[0].type).toBe(Panel);
      expect(panels[1].type).toBe(Panel);
    });

    it('excludes ResizeHandle components', () => {
      const children = [
        <Panel key="1" />,
        <ResizeHandle key="h1" />,
        <Panel key="2" />,
        <ResizeHandle key="h2" />,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);

      expect(panels).toHaveLength(2);
      expect(panels.every(p => p.type === Panel)).toBe(true);
    });

    it('handles empty children', () => {
      const panels = findPanelChildren(null, Panel, ResizeHandle);
      expect(panels).toHaveLength(0);
    });

    it('handles children with no Panels', () => {
      const children = [
        <div key="1">Content</div>,
        <span key="2">More content</span>,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);
      expect(panels).toHaveLength(0);
    });

    it('preserves Panel order from tree traversal', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Panel key="1" defaultSize="100px" />,
        <Wrapper key="w1">
          <Panel key="2" defaultSize="200px" />
        </Wrapper>,
        <Panel key="3" defaultSize="300px" />,
      ];

      const panels = findPanelChildren(children, Panel, ResizeHandle);

      expect(panels).toHaveLength(3);
      expect(panels[0].props.defaultSize).toBe('100px');
      expect(panels[1].props.defaultSize).toBe('200px');
      expect(panels[2].props.defaultSize).toBe('300px');
    });
  });

  describe('flattenPanelChildren', () => {
    it('flattens direct Panel and ResizeHandle children', () => {
      const children = [
        <Panel key="1" />,
        <ResizeHandle key="h1" />,
        <Panel key="2" />,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);

      expect(flattened).toHaveLength(3);
      expect(flattened[0].type).toBe(Panel);
      expect(flattened[1].type).toBe(ResizeHandle);
      expect(flattened[2].type).toBe(Panel);
    });

    it('flattens nested Panel and ResizeHandle children', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Panel key="1" />,
        <Wrapper key="w1">
          <ResizeHandle key="h1" />
          <Panel key="2" />
        </Wrapper>,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);

      expect(flattened).toHaveLength(3);
      expect(flattened[0].type).toBe(Panel);
      expect(flattened[1].type).toBe(ResizeHandle);
      expect(flattened[2].type).toBe(Panel);
    });

    it('flattens deeply nested children', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Wrapper key="w1">
          <Wrapper key="w2">
            <Panel key="1" />
            <ResizeHandle key="h1" />
            <Wrapper key="w3">
              <Panel key="2" />
            </Wrapper>
          </Wrapper>
        </Wrapper>,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);

      expect(flattened).toHaveLength(3);
      expect(flattened[0].type).toBe(Panel);
      expect(flattened[1].type).toBe(ResizeHandle);
      expect(flattened[2].type).toBe(Panel);
    });

    it('handles empty children', () => {
      const flattened = flattenPanelChildren(null, Panel, ResizeHandle);
      expect(flattened).toHaveLength(0);
    });

    it('handles children with no Panels or Handles', () => {
      const children = [
        <div key="1">Content</div>,
        <span key="2">More content</span>,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);
      expect(flattened).toHaveLength(0);
    });

    it('preserves order of Panels and Handles', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Panel key="1" defaultSize="100px" />,
        <ResizeHandle key="h1" />,
        <Wrapper key="w1">
          <Panel key="2" defaultSize="200px" />
          <ResizeHandle key="h2" />,
        </Wrapper>,
        <Panel key="3" defaultSize="300px" />,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);

      expect(flattened).toHaveLength(5);
      expect(flattened[0].type).toBe(Panel);
      expect(flattened[0].props.defaultSize).toBe('100px');
      expect(flattened[1].type).toBe(ResizeHandle);
      expect(flattened[2].type).toBe(Panel);
      expect(flattened[2].props.defaultSize).toBe('200px');
      expect(flattened[3].type).toBe(ResizeHandle);
      expect(flattened[4].type).toBe(Panel);
      expect(flattened[4].props.defaultSize).toBe('300px');
    });

    it('handles mixed valid and invalid elements', () => {
      const Wrapper = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

      const children = [
        <Panel key="1" />,
        'text node',
        <Wrapper key="w1">
          <ResizeHandle key="h1" />
          null,
          <Panel key="2" />,
        </Wrapper>,
        undefined,
      ];

      const flattened = flattenPanelChildren(children, Panel, ResizeHandle);

      expect(flattened).toHaveLength(3);
      expect(flattened[0].type).toBe(Panel);
      expect(flattened[1].type).toBe(ResizeHandle);
      expect(flattened[2].type).toBe(Panel);
    });
  });
});
