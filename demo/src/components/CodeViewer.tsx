import { useState } from 'react';
import './CodeViewer.css';

interface CodeViewerProps {
  demoKey: string;
  title?: string;
}

export function CodeViewer({ demoKey, title }: CodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Dynamically import the generated code
  const [code, setCode] = useState<string>('');

  const loadCode = async () => {
    try {
      // Force fresh import to avoid caching issues
      const module = await import(/* @vite-ignore */ `../generated/demoCode.ts?t=${Date.now()}`);
      const { demoCode } = module;
      const extractedCode = demoCode[demoKey];

      console.log('[CodeViewer] Loading code for:', demoKey);
      console.log('[CodeViewer] Available keys:', Object.keys(demoCode));
      console.log('[CodeViewer] Extracted code length:', extractedCode?.length);

      if (!extractedCode) {
        setCode(`// Code for '${demoKey}' not found\n// Available keys: ${Object.keys(demoCode).join(', ')}`);
        return;
      }

      // Detect if this is JSX code by checking the trimmed content
      const trimmed = extractedCode.trim();
      const isJSX = trimmed.startsWith('<') || trimmed.startsWith('{/*');

      console.log('[CodeViewer] Is JSX:', isJSX, '| First 50 chars:', trimmed.substring(0, 50));

      let fullCode: string;

      if (isJSX) {
        // Pure JSX - wrap in component with return
        fullCode = `import { Panel, PanelGroup } from '@jeremy-boschen/react-adjustable-panels';
import '@jeremy-boschen/react-adjustable-panels/style.css';

export default function Example() {
  return (
${extractedCode}
  );
}`;
      } else {
        // Hooks/handlers code - needs more imports and JSX placeholder
        fullCode = `import { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelGroupHandle, ResizeInfo, PanelSizeInfo } from '@jeremy-boschen/react-adjustable-panels';
import '@jeremy-boschen/react-adjustable-panels/style.css';

export default function Example() {
${extractedCode}

  return (
    <PanelGroup
      ref={panelGroupRef}
      direction="horizontal"
      onResize={handleResize}
      onResizeEnd={handleResizeEnd}
    >
      <Panel defaultSize="50%" minSize="100px">
        Left Panel Content
      </Panel>
      <Panel defaultSize="50%" minSize="100px">
        Right Panel Content
      </Panel>
    </PanelGroup>
  );
}`;
      }

      setCode(fullCode);
    } catch (err) {
      console.error('[CodeViewer] Failed to load demo code:', err);
      setCode(`// Failed to load code\n// Error: ${err}`);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    // Always reload code when opening to ensure we have the right demo
    loadCode();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (!isOpen) {
    return (
      <button className="code-viewer-button" onClick={handleOpen}>
        View Code
      </button>
    );
  }

  return (
    <div className="code-viewer-modal" onClick={() => setIsOpen(false)}>
      <div className="code-viewer-content" onClick={e => e.stopPropagation()}>
        <div className="code-viewer-header">
          <h3>{title || 'Example Code'}</h3>
          <div className="code-viewer-actions">
            <button className="code-viewer-copy-btn" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="code-viewer-close-btn" onClick={() => setIsOpen(false)}>
              Close
            </button>
          </div>
        </div>
        <pre className="code-viewer-pre">
          <code>{code || 'Loading...'}</code>
        </pre>
      </div>
    </div>
  );
}
