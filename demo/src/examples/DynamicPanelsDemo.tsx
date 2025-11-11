import { useState } from 'react';
import { Panel, PanelGroup } from '../../../src';

interface PanelItem {
  id: string;
  color: string;
  defaultSize: string;
}

const PANEL_COLORS = [
  'panel-blue',
  'panel-purple',
  'panel-teal',
  'panel-indigo',
  'panel-pink',
  'panel-orange',
  'panel-green',
  'panel-red',
];

export default function DynamicPanelsDemo() {
  // Horizontal panels state
  const [horizontalPanels, setHorizontalPanels] = useState<PanelItem[]>([
    { id: 'h-1', color: 'panel-blue', defaultSize: 'auto' },
    { id: 'h-2', color: 'panel-purple', defaultSize: 'auto' },
  ]);

  // Vertical panels state
  const [verticalPanels, setVerticalPanels] = useState<PanelItem[]>([
    { id: 'v-1', color: 'panel-teal', defaultSize: 'auto' },
    { id: 'v-2', color: 'panel-indigo', defaultSize: 'auto' },
  ]);

  // Counter for unique IDs
  const [nextId, setNextId] = useState(3);

  // Add horizontal panel
  const addHorizontalPanel = () => {
    const newPanel: PanelItem = {
      id: `h-${nextId}`,
      color: PANEL_COLORS[horizontalPanels.length % PANEL_COLORS.length],
      defaultSize: 'auto',
    };
    setHorizontalPanels([...horizontalPanels, newPanel]);
    setNextId(nextId + 1);
  };

  // Remove horizontal panel
  const removeHorizontalPanel = (id: string) => {
    if (horizontalPanels.length > 1) {
      setHorizontalPanels(horizontalPanels.filter(p => p.id !== id));
    }
  };

  // Add vertical panel
  const addVerticalPanel = () => {
    const newPanel: PanelItem = {
      id: `v-${nextId}`,
      color: PANEL_COLORS[verticalPanels.length % PANEL_COLORS.length],
      defaultSize: 'auto',
    };
    setVerticalPanels([...verticalPanels, newPanel]);
    setNextId(nextId + 1);
  };

  // Remove vertical panel
  const removeVerticalPanel = (id: string) => {
    if (verticalPanels.length > 1) {
      setVerticalPanels(verticalPanels.filter(p => p.id !== id));
    }
  };

  // Reset to default state
  const resetAll = () => {
    setHorizontalPanels([
      { id: 'h-1', color: 'panel-blue', defaultSize: 'auto' },
      { id: 'h-2', color: 'panel-purple', defaultSize: 'auto' },
    ]);
    setVerticalPanels([
      { id: 'v-1', color: 'panel-teal', defaultSize: 'auto' },
      { id: 'v-2', color: 'panel-indigo', defaultSize: 'auto' },
    ]);
    setNextId(3);
  };

  return (
    <div className="demo-example">
      <div className="control-panel">
        <div className="control-group">
          <div className="control-label">Horizontal Panels ({horizontalPanels.length}):</div>
          <div className="button-group">
            <button className="btn" onClick={addHorizontalPanel}>
              ➕ Add Panel
            </button>
            <button className="btn btn-secondary" onClick={() => setHorizontalPanels([horizontalPanels[0]])}>
              🗑️ Remove All But First
            </button>
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">Vertical Panels ({verticalPanels.length}):</div>
          <div className="button-group">
            <button className="btn" onClick={addVerticalPanel}>
              ➕ Add Panel
            </button>
            <button className="btn btn-secondary" onClick={() => setVerticalPanels([verticalPanels[0]])}>
              🗑️ Remove All But First
            </button>
          </div>
        </div>

        <div className="control-group">
          <button className="btn btn-secondary" onClick={resetAll}>
            🔄 Reset All
          </button>
        </div>

        <div className="control-group">
          <div style={{ fontSize: '0.85em', color: '#8b949e', marginTop: '0.5rem' }}>
            💡 <strong>Tip:</strong> Add or remove panels dynamically. Each panel automatically adjusts its size using{' '}
            <code>defaultSize="auto"</code>. Try adding 5+ panels and resizing them!
          </div>
        </div>
      </div>

      {/* Horizontal Layout */}
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9em', color: '#8b949e' }}>Horizontal Layout</h3>
        <div style={{ height: '250px', border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
          {/* @demo-code-start */}
          <PanelGroup direction="horizontal" key={`h-${horizontalPanels.map(p => p.id).join('-')}`}>
            {horizontalPanels.map((panel, index) => (
              <Panel key={panel.id} defaultSize={panel.defaultSize} minSize="80px" className={panel.color}>
                <div className="panel-content">
                  <div className="panel-header">Panel {index + 1}</div>
                  <div className="panel-body">
                    <p>
                      <strong>ID:</strong> {panel.id}
                    </p>
                    <p>
                      <strong>Size:</strong> auto
                    </p>
                    <p>
                      <strong>Min:</strong> 80px
                    </p>
                    {horizontalPanels.length > 1 && (
                      <button
                        className="btn btn-small"
                        onClick={() => removeHorizontalPanel(panel.id)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        ❌ Remove
                      </button>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </PanelGroup>
          {/* @demo-code-end */}
        </div>
      </div>

      {/* Vertical Layout */}
      <div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9em', color: '#8b949e' }}>Vertical Layout</h3>
        <div style={{ height: '250px', border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
          <PanelGroup direction="vertical" key={`v-${verticalPanels.map(p => p.id).join('-')}`}>
            {verticalPanels.map((panel, index) => (
              <Panel key={panel.id} defaultSize={panel.defaultSize} minSize="60px" className={panel.color}>
                <div className="panel-content">
                  <div className="panel-header">Panel {index + 1}</div>
                  <div className="panel-body">
                    <p>
                      <strong>ID:</strong> {panel.id}
                    </p>
                    <p>
                      <strong>Size:</strong> auto
                    </p>
                    <p>
                      <strong>Min:</strong> 60px
                    </p>
                    {verticalPanels.length > 1 && (
                      <button
                        className="btn btn-small"
                        onClick={() => removeVerticalPanel(panel.id)}
                        style={{ marginTop: '0.5rem' }}
                      >
                        ❌ Remove
                      </button>
                    )}
                  </div>
                </div>
              </Panel>
            ))}
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}
