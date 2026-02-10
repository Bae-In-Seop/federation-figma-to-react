import { useState, useRef } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import './App.css';

interface FileInfo {
  filename: string;
  content: string;
}

interface CodegenResult {
  componentName: string;
  files: {
    react: FileInfo;
    css: FileInfo;
    story: FileInfo;
  };
}

type Phase = 'idle' | 'parsing' | 'fetching' | 'generating' | 'done' | 'error';
type Tab = 'react' | 'css' | 'story';

const PHASE_LABELS: Record<Exclude<Phase, 'idle' | 'error'>, string> = {
  parsing: 'Parsing URL',
  fetching: 'Fetching Figma data',
  generating: 'Generating code',
  done: 'Complete',
};

const PHASE_ORDER: Array<Exclude<Phase, 'idle' | 'error'>> = [
  'parsing',
  'fetching',
  'generating',
  'done',
];

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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function PhaseIndicator({ phase }: { phase: Phase }) {
  return (
    <div className="phase-indicator">
      {PHASE_ORDER.map((p) => {
        const idx = PHASE_ORDER.indexOf(p);
        const currentIdx = phase === 'error' ? -1 : PHASE_ORDER.indexOf(phase as typeof p);
        let status: 'done' | 'active' | 'pending';
        if (phase === 'error') {
          status = 'pending';
        } else if (idx < currentIdx || phase === 'done') {
          status = 'done';
        } else if (idx === currentIdx) {
          status = 'active';
        } else {
          status = 'pending';
        }

        return (
          <div key={p} className={`phase-step phase-step--${status}`}>
            <span className="phase-step__icon">
              {status === 'done' ? '\u2713' : status === 'active' ? '\u25CF' : '\u25CB'}
            </span>
            <span className="phase-step__label">{PHASE_LABELS[p]}</span>
          </div>
        );
      })}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <Highlight theme={themes.nightOwl} code={code} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre className="code-block__pre" style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })}>
              <span className="code-block__line-number">{i + 1}</span>
              {line.map((token, key) => (
                <span key={key} {...getTokenProps({ token })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function App() {
  const [url, setUrl] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<CodegenResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('react');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = phase === 'parsing' || phase === 'fetching' || phase === 'generating';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setError('');
    setResult(null);
    setCopied(false);

    // Phase 1: parsing (visual delay)
    setPhase('parsing');
    await delay(400);

    // Phase 2: fetching (actual API call)
    setPhase('fetching');
    let data: CodegenResult;
    try {
      const res = await fetch('/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl: url.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      data = await res.json();
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
      return;
    }

    // Phase 3: generating (visual delay)
    setPhase('generating');
    await delay(600);

    // Phase 4: done
    setResult(data);
    setActiveTab('react');
    setPhase('done');
  }

  function getActiveCode(): { code: string; language: string } {
    if (!result) return { code: '', language: 'text' };
    const file = result.files[activeTab];
    return { code: file.content, language: TAB_LANGUAGE[activeTab] };
  }

  async function handleCopy() {
    const { code } = getActiveCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const { code, language } = getActiveCode();

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Figma &rarr; React Code Generator</h1>
        <p className="app__subtitle">
          Paste a Figma component URL to generate React component, CSS module, and Storybook story.
        </p>
      </header>

      <form className="app__form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="app__input"
          type="url"
          placeholder="https://www.figma.com/design/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="app__button"
          type="submit"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {phase !== 'idle' && <PhaseIndicator phase={phase} />}

      {phase === 'error' && (
        <div className="app__error">
          <span className="app__error-icon">!</span>
          {error}
        </div>
      )}

      {result && phase === 'done' && (
        <div className="code-panel">
          <div className="code-panel__header">
            <div className="code-panel__tabs">
              {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
                <button
                  key={tab}
                  className={`code-panel__tab ${activeTab === tab ? 'code-panel__tab--active' : ''}`}
                  onClick={() => { setActiveTab(tab); setCopied(false); }}
                >
                  {TAB_LABELS[tab]}
                  <span className="code-panel__tab-filename">
                    {result.files[tab].filename}
                  </span>
                </button>
              ))}
            </div>
            <button className="code-panel__copy" onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="code-block">
            <CodeBlock code={code} language={language} />
          </div>
        </div>
      )}

      <footer className="app__footer">
        Built with Figma API + React + Vite
      </footer>
    </div>
  );
}

export default App;
