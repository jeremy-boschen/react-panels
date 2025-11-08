import { Panel, PanelGroup } from '../../../src';

export default function BasicVerticalDemo() {
  return (
    <div className="demo-example">
      {/* @demo-code-start */}
      <PanelGroup direction="vertical">
        <Panel defaultSize="200px" minSize="100px" maxSize="400px" className="panel-green">
          <div className="panel-content">
            <div className="panel-header">Top Panel (Pixel-based)</div>
            <div className="panel-body">
              <p>This panel uses pixel-based sizing.</p>
              <p>Default size: 200px</p>
              <p>Min: 100px | Max: 400px</p>
            </div>
          </div>
        </Panel>
        <Panel defaultSize="100%" minSize="100px" className="panel-orange">
          <div className="panel-content">
            <div className="panel-header">Bottom Panel (Auto-fill)</div>
            <div className="panel-body">
              <p>This panel fills the remaining space (100%).</p>
              <p>Minimum size: 100px</p>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      {/* @demo-code-end */}
    </div>
  );
}
