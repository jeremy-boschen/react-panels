import { useRef, useState } from 'react';
import { Panel, PanelGroup, type PanelGroupHandle, type ResizeInfo } from '../../../src';

export default function ImperativeAPIDemo() {
  // @demo-code-start
  const panelGroupRef = useRef<PanelGroupHandle>(null);
  const [currentInfo, setCurrentInfo] = useState<string>('50% | 50%');

  // Update display when panels resize
  const handleResize = (info: ResizeInfo) => {
    const display = info.currentSizes.map(s => `${s.percent.toFixed(1)}% (${Math.round(s.pixels)}px)`).join(' | ');
    setCurrentInfo(display);
  };

  // Programmatically set panel sizes
  const handleSetSizes = (sizes: [string, string]) => {
    panelGroupRef.current?.setSizes(sizes);
  };
  // @demo-code-end

  const containerRef = useRef<HTMLDivElement>(null);

  // Extended handler for display updates
  const handleSetSizesWithDisplay = (sizes: [string, string]) => {
    handleSetSizes(sizes);

    // Update display after a brief delay to allow layout to settle
    setTimeout(() => {
      const actualSizes = panelGroupRef.current?.getSizes();
      if (actualSizes && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const containerSize = rect.width;

        const display = actualSizes
          .map(size => {
            if (size === 'auto' || size === '*') {
              return 'auto';
            }
            const match = size.match(/^(\d+(?:\.\d+)?)(px|%)$/);
            if (match) {
              const value = parseFloat(match[1]);
              const unit = match[2];
              if (unit === 'px') {
                const percent = (value / containerSize) * 100;
                return `${percent.toFixed(1)}% (${Math.round(value)}px)`;
              } else {
                const pixels = (value / 100) * containerSize;
                return `${value.toFixed(1)}% (${Math.round(pixels)}px)`;
              }
            }
            return size;
          })
          .join(' | ');

        setCurrentInfo(display);
      }
    }, 50);
  };

  return (
    <div className="demo-example">
      <div className="control-panel">
        <div className="control-group">
          <div className="control-label">Current Sizes: {currentInfo}</div>
        </div>
        <div className="control-group">
          <div className="control-label">Preset Layouts:</div>
          <div className="button-group">
            <button className="btn" onClick={() => handleSetSizesWithDisplay(['50%', '50%'])}>
              50/50 Split
            </button>
            <button className="btn" onClick={() => handleSetSizesWithDisplay(['30%', '70%'])}>
              30/70 Split
            </button>
            <button className="btn" onClick={() => handleSetSizesWithDisplay(['70%', '30%'])}>
              70/30 Split
            </button>
            <button className="btn" onClick={() => handleSetSizesWithDisplay(['200px', 'auto'])}>
              200px Sidebar | Auto
            </button>
            <button className="btn" onClick={() => handleSetSizesWithDisplay(['300px', '400px'])}>
              300px | 400px (Fixed)
            </button>
          </div>
        </div>
        <div className="control-group">
          <div style={{ fontSize: '0.85em', color: '#8b949e', marginTop: '0.5rem' }}>
            💡 <strong>Tip:</strong> "Auto" panels fill remaining space after fixed panels. Try the "200px Sidebar |
            Auto" example to see a fixed sidebar with auto-fill main content!
          </div>
        </div>
      </div>

      <div ref={containerRef} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <PanelGroup ref={panelGroupRef} direction="horizontal" onResize={handleResize} onResizeEnd={handleResize}>
          <Panel defaultSize="50%" minSize="100px" className="panel-teal">
            <div className="panel-content">
              <div className="panel-header">Left Panel</div>
              <div className="panel-body">
                <p>Use the buttons above to programmatically adjust panel sizes.</p>
              </div>
            </div>
          </Panel>
          <Panel defaultSize="50%" minSize="100px" className="panel-indigo">
            <div className="panel-content">
              <div className="panel-header">Right Panel</div>
              <div className="panel-body">
                <p>Control panels programmatically with setSizes() and getSizes()</p>
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}
