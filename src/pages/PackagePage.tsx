import { useState, useEffect } from 'react';
import { Package as PackageIcon, Hammer, Download, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import {
  getPackageInfo,
  buildPackage,
  type PackageInfo,
  type BuildResult,
} from '../utils/api';
import './PackagePage.css';

export function PackagePage() {
  const [info, setInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [showBuildLog, setShowBuildLog] = useState(false);

  useEffect(() => {
    loadPackageInfo();
  }, []);

  async function loadPackageInfo() {
    setLoading(true);
    setError('');

    try {
      const data = await getPackageInfo();
      setInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load package info');
    } finally {
      setLoading(false);
    }
  }

  async function handleBuild() {
    if (!info?.hasComponents) return;

    setBuilding(true);
    setError('');
    setBuildResult(null);

    try {
      const result = await buildPackage();
      setBuildResult(result);
      setShowBuildLog(false);
      // Refresh info to get updated lastBuiltAt
      await loadPackageInfo();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build package');
    } finally {
      setBuilding(false);
    }
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="package-page">
        <div className="package-page__loading">
          <div className="package-page__spinner"></div>
          Loading package information...
        </div>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="package-page">
        <div className="package-page__error">
          <AlertCircle size={20} />
          Failed to load package info
        </div>
      </div>
    );
  }

  return (
    <div className="package-page">
      <header className="package-page__header">
        <div className="package-page__header-icon">
          <PackageIcon size={32} />
        </div>
        <div>
          <h1 className="package-page__title">npm Package Builder</h1>
          <p className="package-page__subtitle">
            Build and download an npm package with all your components
          </p>
        </div>
      </header>

      {error && (
        <div className="package-page__error-banner">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="package-page__info-card">
        <div className="package-page__info-row">
          <span className="package-page__info-label">Package Name:</span>
          <code className="package-page__info-value">{info.packageName}</code>
        </div>
        <div className="package-page__info-row">
          <span className="package-page__info-label">Version:</span>
          <code className="package-page__info-value">{info.version}</code>
        </div>
        <div className="package-page__info-row">
          <span className="package-page__info-label">Components:</span>
          <span className="package-page__info-value">{info.componentCount}</span>
        </div>
        <div className="package-page__info-row">
          <span className="package-page__info-label">Last Built:</span>
          <span className="package-page__info-value">{formatDate(info.lastBuiltAt)}</span>
        </div>
      </div>

      <div className="package-page__actions">
        <button
          className="package-page__build-button"
          onClick={handleBuild}
          disabled={building || !info.hasComponents}
        >
          <Hammer size={20} />
          {building ? 'Building...' : 'Build Package'}
        </button>

        {!info.hasComponents && (
          <p className="package-page__help-text">
            No components available. Generate and save components from the Generator page first.
          </p>
        )}
      </div>

      {buildResult && (
        <div className="package-page__result">
          <div className="package-page__result-header">
            <h2 className="package-page__result-title">
              <CheckCircle size={24} />
              Build Successful!
            </h2>
            <button
              className="package-page__log-toggle"
              onClick={() => setShowBuildLog(!showBuildLog)}
            >
              <FileText size={16} />
              {showBuildLog ? 'Hide' : 'Show'} Build Log
            </button>
          </div>

          {showBuildLog && (
            <div className="package-page__build-log">
              {buildResult.buildLog.map((line, i) => (
                <div key={i} className="package-page__log-line">
                  {line}
                </div>
              ))}
            </div>
          )}

          <div className="package-page__download-section">
            <h3 className="package-page__download-title">Download Package</h3>
            <p className="package-page__download-text">
              Your package is ready! Click the button below to download the tarball.
            </p>

            <a
              href={buildResult.tarballUrl}
              download={buildResult.tarballFilename}
              className="package-page__download-button"
            >
              <Download size={20} />
              Download {buildResult.tarballFilename}
            </a>

            <div className="package-page__install-instructions">
              <h4>Installation:</h4>
              <pre className="package-page__code-block">
npm install ./{buildResult.tarballFilename}
              </pre>

              <h4>Usage:</h4>
              <pre className="package-page__code-block">
{`import { Button, Card } from '${buildResult.packageName}';

function App() {
  return <Button />;
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
