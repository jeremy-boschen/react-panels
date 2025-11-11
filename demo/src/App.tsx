import { type ComponentType, useState } from 'react';
import { Panel, PanelGroup } from '../../src';
import '../../src/style.css';
import { CodeViewer } from './components/CodeViewer';
import BasicHorizontalDemo from './examples/BasicHorizontalDemo';
import BasicVerticalDemo from './examples/BasicVerticalDemo';
import CollapsiblePanelDemo from './examples/CollapsiblePanelDemo';
import ComplexLayoutDemo from './examples/ComplexLayoutDemo';
import ControlledCollapseDemo from './examples/ControlledCollapseDemo';
import DynamicPanelsDemo from './examples/DynamicPanelsDemo';
import ImperativeAPIDemo from './examples/ImperativeAPIDemo';
import NestedPanelsDemo from './examples/NestedPanelsDemo';
import ResizeCallbacksDemo from './examples/ResizeCallbacksDemo';
import SeamlessPanelsDemo from './examples/SeamlessPanelsDemo';

type DemoType =
  | 'horizontal'
  | 'vertical'
  | 'nested'
  | 'imperative'
  | 'complex'
  | 'callbacks'
  | 'collapsible'
  | 'controlled-collapse'
  | 'seamless'
  | 'dynamic';

interface DemoConfig {
  id: DemoType;
  title: string;
  description: string;
  component: ComponentType;
  codeKey?: string;
}

const demos: DemoConfig[] = [
  {
    id: 'horizontal',
    title: 'Basic Horizontal Layout',
    description: 'Two resizable panels arranged horizontally with percentage-based sizing',
    component: BasicHorizontalDemo,
    codeKey: 'BasicHorizontalDemo',
  },
  {
    id: 'vertical',
    title: 'Basic Vertical Layout',
    description: 'Two resizable panels arranged vertically with pixel and percentage sizing',
    component: BasicVerticalDemo,
    codeKey: 'BasicVerticalDemo',
  },
  {
    id: 'nested',
    title: 'Nested Panels',
    description: 'Complex layouts with panels nested inside other panels',
    component: NestedPanelsDemo,
    codeKey: 'NestedPanelsDemo',
  },
  {
    id: 'imperative',
    title: 'Imperative API',
    description: 'Programmatically control panel sizes using the imperative API',
    component: ImperativeAPIDemo,
    codeKey: 'ImperativeAPIDemo',
  },
  {
    id: 'complex',
    title: 'Complex Layout',
    description: 'A realistic IDE-like layout with multiple nested panels',
    component: ComplexLayoutDemo,
    codeKey: 'ComplexLayoutDemo',
  },
  {
    id: 'callbacks',
    title: 'Resize Callbacks',
    description: 'Monitor resize events with onResize, onResizeStart, and onResizeEnd callbacks',
    component: ResizeCallbacksDemo,
    codeKey: 'ResizeCallbacksDemo-callbacks',
  },
  {
    id: 'collapsible',
    title: 'Collapsible Panels',
    description: 'Panels that automatically collapse/expand when dragged past thresholds',
    component: CollapsiblePanelDemo,
    codeKey: 'CollapsiblePanelDemo',
  },
  {
    id: 'controlled-collapse',
    title: 'Imperative Collapse API',
    description: 'Programmatically control panel collapse with collapsePanel/expandPanel methods',
    component: ControlledCollapseDemo,
    codeKey: 'ControlledCollapseDemo',
  },
  {
    id: 'seamless',
    title: 'Custom Resize Handles',
    description: 'Customize resize handles with sizes, styles, and seamless layouts',
    component: SeamlessPanelsDemo,
    codeKey: 'SeamlessPanelsDemo',
  },
  {
    id: 'dynamic',
    title: 'Dynamic Panels',
    description: 'Add and remove panels dynamically in both horizontal and vertical layouts',
    component: DynamicPanelsDemo,
    codeKey: 'DynamicPanelsDemo',
  },
];

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('horizontal');
  const ActiveComponent = demos.find(d => d.id === activeDemo)?.component || BasicHorizontalDemo;
  const activeDemoConfig = demos.find(d => d.id === activeDemo);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>@jeremy-boschen/react-adjustable-panels</h1>
          <p className="subtitle">Interactive Demo - A lightweight React panel library</p>
          <div className="header-links">
            <a
              href="https://github.com/jeremy-boschen/react-adjustable-panels"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <a
              href="https://www.npmjs.com/package/@jeremy-boschen/react-adjustable-panels"
              target="_blank"
              rel="noopener noreferrer"
            >
              npm
            </a>
          </div>
        </div>
      </header>

      <div className="main-content">
        <PanelGroup direction="horizontal" className="demo-container">
          <Panel defaultSize="300px" minSize="200px" maxSize="400px" className="sidebar-panel">
            <div className="sidebar">
              <h2>Examples</h2>
              <nav className="demo-nav">
                {demos.map(demo => (
                  <button
                    key={demo.id}
                    className={`demo-nav-item ${activeDemo === demo.id ? 'active' : ''}`}
                    onClick={() => setActiveDemo(demo.id)}
                  >
                    <div className="demo-nav-title">{demo.title}</div>
                    <div className="demo-nav-description">{demo.description}</div>
                  </button>
                ))}
              </nav>
            </div>
          </Panel>

          <Panel className="demo-panel">
            <div className="demo-content">
              <div className="demo-header">
                <div>
                  <h2>{activeDemoConfig?.title}</h2>
                  <p>{activeDemoConfig?.description}</p>
                </div>
                {activeDemoConfig?.codeKey && (
                  <CodeViewer demoKey={activeDemoConfig.codeKey} title={activeDemoConfig.title} />
                )}
              </div>
              <div className="demo-viewer">
                <ActiveComponent />
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <footer className="app-footer">
        <p>Built with React 19 | Licensed under Apache-2.0</p>
      </footer>
    </div>
  );
}

App.displayName = 'App';

export default App;
