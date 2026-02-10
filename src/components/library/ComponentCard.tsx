import type { ComponentListItem } from '../../utils/api';
import './ComponentCard.css';

interface ComponentCardProps {
  component: ComponentListItem;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ComponentCard({ component, onView, onDelete }: ComponentCardProps) {
  const formattedDate = new Date(component.updatedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="component-card">
      <div className="component-card__header">
        <h3 className="component-card__name">{component.name}</h3>
        <span className="component-card__date">{formattedDate}</span>
      </div>

      <div className="component-card__url">
        <a
          href={component.figmaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="component-card__link"
          onClick={(e) => e.stopPropagation()}
        >
          View in Figma →
        </a>
      </div>

      <div className="component-card__actions">
        <button
          className="component-card__button component-card__button--view"
          onClick={() => onView(component.id)}
        >
          View Code
        </button>
        <button
          className="component-card__button component-card__button--delete"
          onClick={() => onDelete(component.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
