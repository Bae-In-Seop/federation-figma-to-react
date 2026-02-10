import { useState, useEffect } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { FileCode, Trash2, ExternalLink } from 'lucide-react';
import {
  listComponents,
  getComponent,
  deleteComponent,
  type ComponentListItem,
  type ComponentDetail,
} from '../utils/api';
import './LibraryPage.css';

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

export function LibraryPage() {
  const [components, setComponents] = useState<ComponentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadComponents();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadComponentDetail(selectedId);
    } else {
      setSelectedComponent(null);
    }
  }, [selectedId]);

  async function loadComponents() {
    setLoading(true);
    setError('');

    try {
      const data = await listComponents();
      setComponents(data);
      // Auto-select first component if available
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load components');
    } finally {
      setLoading(false);
    }
  }

  async function loadComponentDetail(id: string) {
    setLoadingDetail(true);
    setError('');

    try {
      const detail = await getComponent(id);
      setSelectedComponent(detail);
      setActiveTab('react');
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component');
    } finally {
      setLoadingDetail(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this component?')) {
      return;
    }

    try {
      await deleteComponent(id);
      setComponents((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) {
        const remaining = components.filter((c) => c.id !== id);
        setSelectedId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete component');
    }
  }

  async function handleCopy() {
    if (!selectedComponent) return;
    const file = selectedComponent.files[activeTab];
    await navigator.clipboard.writeText(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="library-page">
        <div className="library-page__loading">Loading components...</div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-split">
        {/* Left Sidebar - Component List */}
        <aside className="library-sidebar">
          <div className="library-sidebar__header">
            <h2 className="library-sidebar__title">Components</h2>
            <span className="library-sidebar__count">{components.length}</span>
          </div>

          {components.length === 0 ? (
            <div className="library-sidebar__empty">
              <FileCode size={32} className="library-sidebar__empty-icon" />
              <p>No components yet</p>
            </div>
          ) : (
            <nav className="library-sidebar__list">
              {components.map((component) => (
                <button
                  key={component.id}
                  className={`library-item ${selectedId === component.id ? 'library-item--active' : ''}`}
                  onClick={() => setSelectedId(component.id)}
                >
                  <div className="library-item__info">
                    <FileCode size={16} className="library-item__icon" />
                    <span className="library-item__name">{component.name}</span>
                  </div>
                  <button
                    className="library-item__delete"
                    onClick={(e) => handleDelete(component.id, e)}
                    title="Delete component"
                  >
                    <Trash2 size={14} />
                  </button>
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Right Main - Component Detail */}
        <main className="library-main">
          {error && (
            <div className="library-main__error">
              <span className="library-main__error-icon">!</span>
              {error}
            </div>
          )}

          {loadingDetail ? (
            <div className="library-main__loading">
              <div className="library-main__spinner"></div>
              Loading component...
            </div>
          ) : !selectedComponent ? (
            <div className="library-main__empty">
              <FileCode size={64} className="library-main__empty-icon" />
              <h2>No component selected</h2>
              <p>Select a component from the list to view its code</p>
            </div>
          ) : (
            <>
              {/* Component Header */}
              <div className="library-main__header">
                <div>
                  <h1 className="library-main__title">{selectedComponent.name}</h1>
                  <a
                    href={selectedComponent.figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="library-main__link"
                  >
                    <ExternalLink size={14} />
                    View in Figma
                  </a>
                </div>
              </div>

              {/* Code Tabs */}
              <div className="library-main__tabs">
                {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    className={`library-main__tab ${activeTab === tab ? 'library-main__tab--active' : ''}`}
                    onClick={() => {
                      setActiveTab(tab);
                      setCopied(false);
                    }}
                  >
                    {TAB_LABELS[tab]}
                    <span className="library-main__tab-filename">
                      {selectedComponent.files[tab].filename}
                    </span>
                  </button>
                ))}
                <button className="library-main__copy" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Code Viewer */}
              <div className="library-main__code">
                <Highlight
                  theme={themes.nightOwl}
                  code={selectedComponent.files[activeTab].content}
                  language={TAB_LANGUAGE[activeTab]}
                >
                  {({ style, tokens, getLineProps, getTokenProps }) => (
                    <pre className="library-main__pre" style={style}>
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })}>
                          <span className="library-main__line-number">{i + 1}</span>
                          {line.map((token, key) => (
                            <span key={key} {...getTokenProps({ token })} />
                          ))}
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
