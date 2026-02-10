import { Plus, FileCode, Package as PackageIcon, Sparkles } from 'lucide-react';
import './HomePage.css';

export function HomePage() {
  return (
    <div className="home-page">
      <div className="home-page__content">
        <div className="home-page__icon">
          <Sparkles size={64} />
        </div>

        <h1 className="home-page__title">Welcome to Figma → React</h1>
        <p className="home-page__subtitle">
          Transform your Figma designs into production-ready React components
        </p>

        <div className="home-page__features">
          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <Plus size={24} />
            </div>
            <h3 className="home-page__feature-title">Add Component</h3>
            <p className="home-page__feature-text">
              Click the "Add Component" button in the sidebar to generate a new component from a Figma URL
            </p>
          </div>

          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <FileCode size={24} />
            </div>
            <h3 className="home-page__feature-title">Manage Components</h3>
            <p className="home-page__feature-text">
              View and edit your generated components in the sidebar. All components are saved automatically
            </p>
          </div>

          <div className="home-page__feature">
            <div className="home-page__feature-icon">
              <PackageIcon size={24} />
            </div>
            <h3 className="home-page__feature-title">Build Package</h3>
            <p className="home-page__feature-text">
              Generate an npm package with all your components ready to install in any project
            </p>
          </div>
        </div>

        <div className="home-page__cta">
          <p className="home-page__cta-text">Ready to get started?</p>
          <p className="home-page__cta-hint">
            Click <strong>Add Component</strong> in the sidebar to create your first component
          </p>
        </div>
      </div>
    </div>
  );
}
