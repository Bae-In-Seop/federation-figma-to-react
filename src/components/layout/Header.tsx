import { NavLink } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header__container">
        <h1 className="header__title">Figma → React</h1>
        <nav className="header__nav">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
            }
          >
            Generator
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
            }
          >
            Library
          </NavLink>
          <NavLink
            to="/package"
            className={({ isActive }) =>
              `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
            }
          >
            Package
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
