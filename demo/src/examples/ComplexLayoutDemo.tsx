import { Panel, PanelGroup } from '../../../src';

export default function ComplexLayoutDemo() {
  return (
    <div className="demo-example">
      {/* @demo-code-start */}
      <PanelGroup direction="vertical">
        {/* Header */}
        <Panel defaultSize="60px" minSize="40px" maxSize="100px" className="panel-blue">
          <div className="panel-content">
            <div className="panel-header">Header / Toolbar</div>
          </div>
        </Panel>

        {/* Main Content Area */}
        <Panel defaultSize="100%" minSize="200px">
          <PanelGroup direction="horizontal">
            {/* Sidebar */}
            <Panel defaultSize="200px" minSize="150px" maxSize="400px" className="panel-green">
              <div className="panel-content">
                <div className="panel-header">Sidebar</div>
                <div className="panel-body">
                  <p>File Explorer</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    📁 src/
                    <br />📁 components/
                    <br />📁 utils/
                    <br />📄 index.ts
                  </p>
                </div>
              </div>
            </Panel>

            {/* Editor + Terminal */}
            <Panel defaultSize="100%" minSize="300px">
              <PanelGroup direction="vertical">
                {/* Editor */}
                <Panel defaultSize="70%" minSize="200px" className="panel-purple">
                  <div className="panel-content">
                    <div className="panel-header">Editor</div>
                    <div className="panel-body">
                      <code style={{ display: 'block', whiteSpace: 'pre', lineHeight: '1.6' }}>
                        {`import { Panel, PanelGroup } from 'react-adjustable-panels';

function App() {
  return (
    <PanelGroup direction="horizontal">
      <Panel defaultSize="50%">
        Left Panel
      </Panel>
      <Panel defaultSize="50%">
        Right Panel
      </Panel>
    </PanelGroup>
  );
}`}
                      </code>
                    </div>
                  </div>
                </Panel>

                {/* Terminal */}
                <Panel defaultSize="30%" minSize="100px" className="panel-red">
                  <div className="panel-content">
                    <div className="panel-header">Terminal</div>
                    <div className="panel-body">
                      <code style={{ display: 'block' }}>
                        $ npm run dev
                        <br />
                        <span style={{ color: '#56d364' }}>✓ Server running on http://localhost:3000</span>
                      </code>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            </Panel>

            {/* Properties Panel */}
            <Panel defaultSize="250px" minSize="200px" maxSize="400px" className="panel-orange">
              <div className="panel-content">
                <div className="panel-header">Properties</div>
                <div className="panel-body">
                  <p>Inspector</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    <strong>Component:</strong> PanelGroup
                    <br />
                    <strong>Props:</strong>
                    <br />• direction: "horizontal"
                    <br />• children: 2 panels
                  </p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>

        {/* Footer */}
        <Panel defaultSize="30px" minSize="25px" maxSize="50px" className="panel-teal">
          <div className="panel-content">
            <div style={{ fontSize: '0.75rem', color: '#8b949e' }}>Status Bar | Ready</div>
          </div>
        </Panel>
      </PanelGroup>
      {/* @demo-code-end */}
    </div>
  );
}
