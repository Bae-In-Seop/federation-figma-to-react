import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { Plus, Package, FileCode, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { listComponents, type ComponentListItem } from '../../utils/api';
import { AddComponentModal } from '../generator/AddComponentModal';
import './Sidebar.css';

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [components, setComponents] = useState<ComponentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    loadComponents();
  }, []);

  async function loadComponents() {
    setLoading(true);
    try {
      const data = await listComponents();
      setComponents(data);
    } catch (err) {
      console.error('Failed to load components:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleComponentAdded(componentId: string) {
    loadComponents();
    navigate(`/components/${componentId}`);
  }

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
        <div className="sidebar__header">
          {!isCollapsed && (
            <>
              <div className="sidebar__logo">
                <div className="sidebar__logo-icon">🎨</div>
                <span className="sidebar__logo-text">Figma → React</span>
              </div>
            </>
          )}
          <button
            className="sidebar__toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="sidebar__actions">
          <button
            className="sidebar__add-button"
            onClick={() => setShowModal(true)}
            title="Add new component"
          >
            <Plus size={20} />
            {!isCollapsed && <span>Add Component</span>}
          </button>
        </div>

        <nav className="sidebar__nav">
          {!isCollapsed && (
            <div className="sidebar__section-title">Components</div>
          )}

          <div className="sidebar__components">
            {loading && !isCollapsed && (
              <div className="sidebar__loading">Loading...</div>
            )}

            {!loading && components.length === 0 && !isCollapsed && (
              <div className="sidebar__empty">No components yet</div>
            )}

            {components.map((component) => (
              <NavLink
                key={component.id}
                to={`/components/${component.id}`}
                className={({ isActive }) =>
                  `sidebar__component ${isActive || id === component.id ? 'sidebar__component--active' : ''}`
                }
              >
                <FileCode size={16} className="sidebar__component-icon" />
                {!isCollapsed && (
                  <span className="sidebar__component-name">{component.name}</span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="sidebar__divider"></div>

          <NavLink
            to="/package"
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            <Package size={20} className="sidebar__link-icon" />
            {!isCollapsed && <span className="sidebar__link-text">Build Package</span>}
          </NavLink>
        </nav>

        <div className="sidebar__footer">
          {!isCollapsed && (
            <div className="sidebar__info">
              <div className="sidebar__version">v1.0.0</div>
            </div>
          )}
        </div>
      </aside>

      <AddComponentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleComponentAdded}
      />
    </>
  );
}
