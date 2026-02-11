import { useState } from 'react';
import { X, Wand2, Loader2, AlertCircle } from 'lucide-react';
import { generateCode } from '../../utils/api';
import './AddComponentModal.css';

interface AddComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (componentId: string) => void;
}

export function AddComponentModal({ isOpen, onClose, onSuccess }: AddComponentModalProps) {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleGenerate() {
    if (!figmaUrl.trim()) {
      setError('Please enter a Figma URL');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Generate code from Figma
      const result = await generateCode(figmaUrl);

      // TODO: DB 연동 후 save 복원
      // const { id } = await saveComponent({
      //   componentName: result.componentName,
      //   figmaUrl,
      //   files: result.files,
      // });

      // Close modal and notify parent with component name as temp ID
      setFigmaUrl('');
      onClose();
      onSuccess(result.componentName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate component');
    } finally {
      setGenerating(false);
    }
  }

  function handleClose() {
    if (generating) return;
    setFigmaUrl('');
    setError('');
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && !generating) {
      handleClose();
    } else if (e.key === 'Enter' && !generating) {
      handleGenerate();
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Component</h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={generating}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Enter the Figma URL of the component you want to generate.
            The component will be analyzed and converted to React code automatically.
          </p>

          {error && (
            <div className="modal-error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <div className="modal-form">
            <label htmlFor="figma-url" className="modal-label">
              Figma URL
            </label>
            <input
              id="figma-url"
              type="text"
              className="modal-input"
              placeholder="https://www.figma.com/design/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              disabled={generating}
              autoFocus
            />
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="modal-button modal-button--secondary"
            onClick={handleClose}
            disabled={generating}
          >
            Cancel
          </button>
          <button
            className="modal-button modal-button--primary"
            onClick={handleGenerate}
            disabled={generating || !figmaUrl.trim()}
          >
            {generating ? (
              <>
                <Loader2 size={20} className="modal-spinner" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 size={20} />
                Generate Component
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
