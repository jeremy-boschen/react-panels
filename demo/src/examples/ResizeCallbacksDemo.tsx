import { useState } from 'react';
import { Panel, PanelGroup, type PanelSizeInfo, type ResizeInfo } from '../../../src';

interface LogEntry {
  timestamp: string;
  type: 'start' | 'resize' | 'end';
  info: string;
}

type BehaviorMode = 'none' | 'snap-10' | 'snap-50' | 'proportional';

export default function ResizeCallbacksDemo() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [mode, setMode] = useState<BehaviorMode>('none');

  const formatSizeInfo = (info: ResizeInfo): string => {
    return info.currentSizes
      .map((s, i) => {
        const prev = info.previousSizes[i];
        const delta = s.pixels - prev.pixels;
        const sign = delta >= 0 ? '+' : '';
        return `Panel ${i}: ${Math.round(s.pixels)}px (${s.percent.toFixed(1)}%) [${sign}${Math.round(delta)}px]`;
      })
      .join(' | ');
  };

  const addLogEntry = (type: LogEntry['type'], info: ResizeInfo) => {
    const timestamp = new Date().toLocaleTimeString();
    const infoStr = formatSizeInfo(info);
    setLog(prev => [...prev.slice(-15), { timestamp, type, info: infoStr }]);
  };

  // @demo-code-start callbacks
  const handleResizeStart = (info: ResizeInfo) => {
    setIsResizing(true);
    addLogEntry('start', info);
  };

  const handleResize = (info: ResizeInfo): PanelSizeInfo[] | undefined => {
    let resultSizes: PanelSizeInfo[] | undefined;

    // Apply behavior based on mode
    switch (mode) {
      case 'snap-10': {
        // Snap left panel to 10px grid, right panel auto-fills
        // This ensures sum always equals container size!
        const snapped10 = Math.round(info.proposedSizes[0].pixels / 10) * 10;
        resultSizes = [
          { ...info.proposedSizes[0], pixels: snapped10 },
          { ...info.proposedSizes[1], size: 'auto', pixels: info.containerSize - snapped10 },
        ];
        break;
      }

      case 'snap-50': {
        // Snap left panel to 50px grid, right panel auto-fills
        // This ensures sum always equals container size!
        const snapped50 = Math.round(info.proposedSizes[0].pixels / 50) * 50;
        resultSizes = [
          { ...info.proposedSizes[0], pixels: snapped50 },
          { ...info.proposedSizes[1], size: 'auto', pixels: info.containerSize - snapped50 },
        ];
        break;
      }

      case 'proportional':
        // Don't enforce during drag - let user see what they're doing
        // Will snap to 1:2 ratio on resize end
        break;

      default:
        // No special behavior
        break;
    }

    // Log the result (after transformation)
    const logInfo = resultSizes ? { ...info, currentSizes: resultSizes } : info;
    addLogEntry('resize', logInfo);

    return resultSizes;
  };

  const handleResizeEnd = (info: ResizeInfo): PanelSizeInfo[] | undefined => {
    setIsResizing(false);
    addLogEntry('end', info);

    // Apply proportional ratio enforcement on resize end (not during drag)
    if (mode === 'proportional') {
      // Snap to strict 1:2 ratio when drag ends
      const total = info.containerSize;
      const strictLeft = total / 3;
      const strictRight = (total * 2) / 3;

      return [
        {
          ...info.currentSizes[0],
          pixels: strictLeft,
        },
        {
          ...info.currentSizes[1],
          size: 'auto',
          pixels: strictRight,
        },
      ];
    }
  };
  // @demo-code-end

  const clearLog = () => {
    setLog([]);
  };

  const behaviorDescriptions: Record<BehaviorMode, { title: string; description: string }> = {
    none: {
      title: 'None (Default)',
      description: 'No special behavior. Panels resize freely within their constraints.',
    },
    'snap-10': {
      title: 'Snap to 10px Grid',
      description: 'Left panel snaps to 10px increments, right panel auto-fills remaining space. No gaps or overlaps!',
    },
    'snap-50': {
      title: 'Snap to 50px Grid',
      description: 'Left panel snaps to 50px increments, right panel auto-fills remaining space. Perfect alignment!',
    },
    proportional: {
      title: 'Proportional 1:2 Ratio (Snap on Release)',
      description:
        'Drag freely during resize, then snap to strict 1:2 ratio when you release (left 1/3, right 2/3). Uses onResizeEnd to enforce ratio.',
    },
  };

  return (
    <div className="demo-example">
      <div className="control-panel">
        <div className="control-group">
          <div className="control-label">Resize Status: {isResizing ? '🟢 Resizing...' : '⚫ Idle'}</div>
        </div>

        <div className="control-group">
          <div className="control-label">Resize Behavior:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {(Object.keys(behaviorDescriptions) as BehaviorMode[]).map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'start', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="behavior"
                  value={m}
                  checked={mode === m}
                  onChange={e => setMode(e.target.value as BehaviorMode)}
                  style={{ marginRight: '0.5rem', marginTop: '0.2rem' }}
                />
                <div>
                  <div style={{ fontWeight: mode === m ? '600' : '400', color: mode === m ? '#58a6ff' : '#c9d1d9' }}>
                    {behaviorDescriptions[m].title}
                  </div>
                  <div style={{ fontSize: '0.85em', color: '#8b949e', marginTop: '0.1rem' }}>
                    {behaviorDescriptions[m].description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="control-group">
          <div className="control-label">Event Log:</div>
          <button className="btn btn-secondary" onClick={clearLog}>
            Clear Log
          </button>
        </div>
        <div className="event-log">
          {log.length === 0 ? (
            <div className="event-log-item">Drag the resize handle to see detailed events...</div>
          ) : (
            log.map((entry, idx) => (
              <div key={`${entry.timestamp}-${idx}`} className="event-log-item">
                <span className="timestamp">{entry.timestamp}</span>
                <span className="event-type">
                  {entry.type === 'start' && 'START'}
                  {entry.type === 'resize' && 'RESIZE'}
                  {entry.type === 'end' && 'END'}
                </span>
                <span style={{ fontSize: '0.85em' }}>→ {entry.info}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* @demo-code-start jsx */}
        <PanelGroup
          direction="horizontal"
          onResizeStart={handleResizeStart}
          onResize={handleResize}
          onResizeEnd={handleResizeEnd}
        >
          <Panel defaultSize="50%" minSize="0px" maxSize="90%" className="panel-blue">
            <div className="panel-content">
              <div className="panel-header">Left Panel</div>
              <div className="panel-body">
                <p>
                  <strong>Interactive Callback Demo</strong>
                </p>
                <p style={{ marginTop: '1rem' }}>Try different behaviors above:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.9em', lineHeight: '1.6' }}>
                  <li>
                    <strong>Snap to Grid:</strong> Rounds pixels during drag
                  </li>
                  <li>
                    <strong>Proportional:</strong> Enforces ratio constraints on release
                  </li>
                </ul>
                <p style={{ marginTop: '1rem', fontSize: '0.85em', color: '#8b949e' }}>
                  All implemented by simply returning modified PanelSizeInfo objects from onResize!
                </p>
              </div>
            </div>
          </Panel>
          <Panel defaultSize="50%" minSize="10%" maxSize="100%" className="panel-purple">
            <div className="panel-content">
              <div className="panel-header">Right Panel</div>
              <div className="panel-body">
                <p style={{ fontSize: '0.9em' }}>The callback receives:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.85em', lineHeight: '1.6' }}>
                  <li>
                    <code>currentSizes</code> - Current rendered sizes
                  </li>
                  <li>
                    <code>proposedSizes</code> - Proposed sizes (pre-callback)
                  </li>
                  <li>
                    <code>previousSizes</code> - Sizes before drag
                  </li>
                  <li>
                    <code>containerSize</code> - Total available space
                  </li>
                  <li>
                    <code>direction</code> - Layout direction
                  </li>
                </ul>
                <p style={{ marginTop: '1rem', fontSize: '0.85em' }}>Each PanelSizeInfo contains:</p>
                <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.85em', lineHeight: '1.6' }}>
                  <li>
                    <code>pixels</code> - Absolute size
                  </li>
                  <li>
                    <code>percent</code> - Relative size (0-100)
                  </li>
                  <li>
                    <code>size</code> - Original format ("50%" or "200px")
                  </li>
                </ul>
                <p style={{ marginTop: '1rem', fontSize: '0.8em', color: '#56d364' }}>
                  ✨ Unlike other libraries that only give you percentages, you get complete control with both pixels
                  and percentages! Plus, drift-free snapping!
                </p>
              </div>
            </div>
          </Panel>
        </PanelGroup>
        {/* @demo-code-end */}
      </div>
    </div>
  );
}
