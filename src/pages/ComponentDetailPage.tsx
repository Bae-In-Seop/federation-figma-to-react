import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Highlight, themes } from 'prism-react-renderer';
import { ExternalLink, Trash2, AlertCircle } from 'lucide-react';
import {
  getComponent,
  deleteComponent,
  type ComponentDetail,
} from '../utils/api';
import './ComponentDetailPage.css';

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

export function ComponentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [component, setComponent] = useState<ComponentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (id) {
      loadComponent(id);
    }
  }, [id]);

  async function loadComponent(componentId: string) {
    setLoading(true);
    setError('');

    try {
      const detail = await getComponent(componentId);
      setComponent(detail);
      setActiveTab('react');
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id || !component) return;

    if (!confirm(`Are you sure you want to delete "${component.name}"?`)) {
      return;
    }

    try {
      await deleteComponent(id);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete component');
    }
  }

  async function handleCopy() {
    if (!component) return;
    const file = component.files[activeTab];
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="component-detail">
        <div className="component-detail__loading">
          <div className="component-detail__spinner"></div>
          Loading component...
        </div>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="component-detail">
        <div className="component-detail__error">
          <AlertCircle size={20} />
          {error || 'Component not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="component-detail">
      {/* Component Header */}
      <div className="component-detail__header">
        <div className="component-detail__header-content">
          <h1 className="component-detail__title">{component.name}</h1>
          <a
            href={component.figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="component-detail__link"
          >
            <ExternalLink size={14} />
            View in Figma
          </a>
        </div>
        <button
          className="component-detail__delete"
          onClick={handleDelete}
          title="Delete component"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>

      {/* Code Tabs */}
      <div className="component-detail__tabs">
        {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`component-detail__tab ${activeTab === tab ? 'component-detail__tab--active' : ''}`}
            onClick={() => {
              setActiveTab(tab);
              setCopied(false);
            }}
          >
            {TAB_LABELS[tab]}
            <span className="component-detail__tab-filename">
              {component.files[tab].filename}
            </span>
          </button>
        ))}
        <button className="component-detail__copy" onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code Viewer */}
      <div className="component-detail__code">
        <Highlight
          theme={themes.nightOwl}
          code={component.files[activeTab].content}
          language={TAB_LANGUAGE[activeTab]}
        >
          {({ style, tokens, getLineProps, getTokenProps }) => (
            <pre className="component-detail__pre" style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span className="component-detail__line-number">{i + 1}</span>
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
  );
}
