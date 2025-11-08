import { Panel, PanelGroup } from '../../../src';

export default function BasicHorizontalDemo() {
  return (
    <div className="demo-example">
      {/* @demo-code-start */}
      <PanelGroup direction="horizontal">
        <Panel defaultSize="300px" minSize="200px" maxSize="600px" className="panel-blue">
          <div className="panel-content">
            <div className="panel-header">Fixed Size Panel (300px)</div>
            <div className="panel-body">
              <p>
                This panel has a <strong>fixed size of 300px</strong>.
              </p>
              <p>Minimum size: 200px</p>
              <p>Maximum size: 600px</p>
              <p>
                <strong>Drag the resize handle</strong> to adjust panel sizes.
              </p>
            </div>
          </div>
        </Panel>
        <Panel defaultSize="auto" minSize="200px" className="panel-purple">
          <div className="panel-content">
            <div className="panel-header">Auto-Fill Panel</div>
            <div className="panel-body">
              <p>
                This panel uses <code>defaultSize="auto"</code>.
              </p>
              <p>It automatically fills the remaining space.</p>
              <p>Minimum size: 200px</p>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      {/* @demo-code-end */}
    </div>
  );
}
