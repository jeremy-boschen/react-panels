import { Panel, PanelGroup } from '../../../src';

export default function NestedPanelsDemo() {
  return (
    <div className="demo-example">
      {/* @demo-code-start */}
      <PanelGroup direction="horizontal">
        <Panel defaultSize="50%" minSize="25%" className="panel-blue">
          <PanelGroup direction="vertical">
            <Panel defaultSize="50%" minSize="20%" className="panel-green">
              <div className="panel-content">
                <div className="panel-header">Top Left</div>
                <div className="panel-body">
                  <p>Nested vertical panel</p>
                </div>
              </div>
            </Panel>
            <Panel defaultSize="50%" minSize="20%" className="panel-purple">
              <div className="panel-content">
                <div className="panel-header">Bottom Left</div>
                <div className="panel-body">
                  <p>Each PanelGroup operates independently</p>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
        <Panel defaultSize="50%" minSize="25%" className="panel-orange">
          <div className="panel-content">
            <div className="panel-header">Right Panel</div>
            <div className="panel-body">
              <p>Single panel on the right side</p>
            </div>
          </div>
        </Panel>
      </PanelGroup>
      {/* @demo-code-end */}
    </div>
  );
}
