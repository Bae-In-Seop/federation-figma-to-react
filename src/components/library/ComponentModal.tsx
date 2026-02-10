import { useState } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import type { ComponentDetail } from '../../utils/api';
import './ComponentModal.css';

interface ComponentModalProps {
  component: ComponentDetail;
  onClose: () => void;
}

type Tab = 'react' | 'css' | 'story';

const TAB_LANGUAGE: Record<Tab, string> = {
  react: 'tsx',
  css: 'css',
  story: 'typescript',
};

const TAB_LABELS: Record<Tab, string> = {
  react: 'React',
  css: 'CSS',
  story: 'Story',
};

export function ComponentModal({ component, onClose }: ComponentModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  const file = component.files[activeTab];
  const code = file.content;
  const language = TAB_LANGUAGE[activeTab];

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal">
        <div className="modal__header">
          <div>
            <h2 className="modal__title">{component.name}</h2>
            <a
              href={component.figmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="modal__link"
            >
              View in Figma →
            </a>
          </div>
          <button className="modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal__tabs">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`modal__tab ${activeTab === tab ? 'modal__tab--active' : ''}`}
              onClick={() => {
                setActiveTab(tab);
                setCopied(false);
              }}
            >
              {TAB_LABELS[tab]}
              <span className="modal__tab-filename">
                {component.files[tab].filename}
              </span>
            </button>
          ))}
          <button className="modal__copy" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="modal__content">
          <Highlight theme={themes.nightOwl} code={code} language={language}>
            {({ style, tokens, getLineProps, getTokenProps }) => (
              <pre className="modal__pre" style={style}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    <span className="modal__line-number">{i + 1}</span>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
