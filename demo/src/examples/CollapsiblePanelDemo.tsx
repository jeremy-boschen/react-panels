import { useState } from 'react';
import { Panel, PanelGroup } from '../../../src';

export default function CollapsiblePanelDemo() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="demo-example">
      <div
        style={{
          marginBottom: '20px',
          padding: '15px',
          background: 'rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#fff' }}>Collapse State</h3>
        <div style={{ display: 'flex', gap: '20px', color: '#fff' }}>
          <div>
            <strong>Left Panel:</strong> {leftCollapsed ? '🔒 Collapsed' : '📖 Expanded'}
          </div>
          <div>
            <strong>Right Panel:</strong> {rightCollapsed ? '🔒 Collapsed' : '📖 Expanded'}
          </div>
        </div>
      </div>

      {/* @demo-code-start */}
      <PanelGroup direction="horizontal">
        <Panel
          defaultSize="300px"
          minSize="200px"
          collapsedSize="50px"
          onCollapse={setLeftCollapsed}
          className="panel-blue"
        >
          <div className="panel-content">
            {leftCollapsed ? (
              <div
                className="panel-body"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
              >
                <div style={{ writingMode: 'vertical-rl', fontSize: '14px', fontWeight: 'bold' }}>SIDEBAR</div>
              </div>
            ) : (
              <>
                <div className="panel-header">Collapsible Sidebar</div>
                <div className="panel-body">
                  <p>
                    <strong>Drag left</strong> below 200px to collapse to 50px.
                  </p>
                  <p>
                    <strong>Drag right</strong> past 50px to expand to 200px.
                  </p>
                  <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
                    <li>minSize: 200px</li>
                    <li>collapsedSize: 50px</li>
                    <li>Auto-collapses when dragged below minSize</li>
                    <li>Auto-expands when dragged above collapsedSize</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </Panel>

        <Panel defaultSize="auto" className="panel-purple">
          <div className="panel-content">
            <div className="panel-header">Main Content Area</div>
            <div className="panel-body">
              <p>This is the main content area that fills remaining space.</p>
              <p>The sidebar can collapse to give more room for content.</p>
              <div
                style={{ marginTop: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}
              >
                <h4 style={{ marginTop: 0 }}>How it works:</h4>
                <ol style={{ paddingLeft: '20px' }}>
                  <li>
                    Set <code>collapsedSize</code> prop (must be &lt; <code>minSize</code>)
                  </li>
                  <li>
                    Panel collapses when dragged below <code>minSize</code>
                  </li>
                  <li>
                    Panel expands when dragged above <code>collapsedSize</code>
                  </li>
                  <li>
                    <code>onCollapse</code> callback fires on state changes
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          defaultSize="250px"
          minSize="180px"
          collapsedSize="40px"
          defaultCollapsed={false}
          onCollapse={setRightCollapsed}
          className="panel-green"
        >
          <div className="panel-content">
            {rightCollapsed ? (
              <div
                className="panel-body"
                style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
              >
                <div style={{ writingMode: 'vertical-rl', fontSize: '14px', fontWeight: 'bold' }}>TOOLS</div>
              </div>
            ) : (
              <>
                <div className="panel-header">Tool Panel</div>
                <div className="panel-body">
                  <p>
                    <strong>Drag left</strong> to collapse this panel too!
                  </p>
                  <ul style={{ marginTop: '15px', paddingLeft: '20px' }}>
                    <li>minSize: 180px</li>
                    <li>collapsedSize: 40px</li>
                  </ul>
                  <div
                    style={{
                      marginTop: '15px',
                      padding: '10px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    💡 <strong>Tip:</strong> Both sidebars can be collapsed independently!
                  </div>
                </div>
              </>
            )}
          </div>
        </Panel>
      </PanelGroup>
      {/* @demo-code-end */}
    </div>
  );
}
