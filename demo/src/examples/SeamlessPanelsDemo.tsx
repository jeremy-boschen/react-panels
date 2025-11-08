import { Panel, PanelGroup, ResizeHandle } from '../../../src';

export default function SeamlessPanelsDemo() {
  return (
    <div className="demo-example">
      <h3>Custom Resize Handles</h3>
      <p>
        Customize resize handles using the <code>&lt;ResizeHandle&gt;</code> component with custom sizes, styles, and
        content.
      </p>

      {/* @demo-code-start */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
        {/* Example 1: Larger handle */}
        <div style={{ flex: 1 }}>
          <h4>Larger Handle (8px)</h4>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" className="panel-blue">
              <div className="panel-content">
                <div className="panel-header">Left Panel</div>
                <div className="panel-body">
                  <p>Custom 8px resize handle</p>
                </div>
              </div>
            </Panel>
            <ResizeHandle size={8} />
            <Panel defaultSize="50%" className="panel-green">
              <div className="panel-content">
                <div className="panel-header">Right Panel</div>
                <div className="panel-body">
                  <p>Easy to grab!</p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Example 2: Seamless with thin visual indicator */}
        <div style={{ flex: 1 }}>
          <h4>Seamless Panels (Large hit area, thin visual)</h4>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="33%" className="panel-purple">
              <div className="panel-content">
                <div className="panel-header">Panel 1</div>
                <div className="panel-body">
                  <p>No visible gap</p>
                </div>
              </div>
            </Panel>
            <ResizeHandle size={12} className="seamless-handle" />
            <Panel defaultSize="33%" className="panel-orange">
              <div className="panel-content">
                <div className="panel-header">Panel 2</div>
                <div className="panel-body">
                  <p>12px hit area</p>
                </div>
              </div>
            </Panel>
            <ResizeHandle size={12} className="seamless-handle" />
            <Panel defaultSize="34%" className="panel-blue">
              <div className="panel-content">
                <div className="panel-header">Panel 3</div>
                <div className="panel-body">
                  <p>1px visual indicator</p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Example 3: Custom styled handle with content */}
        <div style={{ flex: 1 }}>
          <h4>Custom Styled Handle</h4>
          <PanelGroup direction="horizontal">
            <Panel defaultSize="50%" className="panel-green">
              <div className="panel-content">
                <div className="panel-header">Left Panel</div>
                <div className="panel-body">
                  <p>Custom handle with icon</p>
                </div>
              </div>
            </Panel>
            <ResizeHandle size={16} className="custom-styled-handle">
              <div className="handle-grip">⋮</div>
            </ResizeHandle>
            <Panel defaultSize="50%" className="panel-purple">
              <div className="panel-content">
                <div className="panel-header">Right Panel</div>
                <div className="panel-body">
                  <p>Hover to see effect</p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
      {/* @demo-code-end */}

      <style>{`
        /* Seamless handle: large hit area, thin visual indicator */
        .seamless-handle {
          background: transparent !important;
          position: relative;
        }

        .seamless-handle::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: #ddd;
          transform: translateX(-50%);
          transition: all 0.2s ease;
        }

        .seamless-handle:hover::before {
          width: 3px;
          background: #0066cc;
        }

        .seamless-handle:active::before {
          background: #0052a3;
        }

        /* Custom styled handle with gradient */
        .custom-styled-handle {
          background: linear-gradient(to right, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s ease;
        }

        .custom-styled-handle:hover {
          background: linear-gradient(to right, #e0e0e0 0%, #0066cc 50%, #e0e0e0 100%) !important;
        }

        .handle-grip {
          font-size: 18px;
          color: #999;
          user-select: none;
          transition: color 0.2s ease;
        }

        .custom-styled-handle:hover .handle-grip {
          color: #fff;
        }
      `}</style>
    </div>
  );
}
