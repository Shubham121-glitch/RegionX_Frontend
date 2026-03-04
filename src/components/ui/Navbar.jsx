import { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo" tabIndex={0} aria-label="RegionX logo">
          RegionX
        </div>

        <ul className={`navbar-links ${menuOpen ? 'active' : ''}`} role="menu">
          <li role="none">
            <a href="#home" role="menuitem" tabIndex={menuOpen ? 0 : -1}>Home</a>
          </li>
          <li role="none">
            <a href="#features" role="menuitem" tabIndex={menuOpen ? 0 : -1}>Features</a>
          </li>
          <li role="none">
            <a href="#about" role="menuitem" tabIndex={menuOpen ? 0 : -1}>About</a>
          </li>
          <li role="none">
            <a href="#contact" role="menuitem" tabIndex={menuOpen ? 0 : -1}>Contact</a>
          </li>
        </ul>

        <button className="navbar-cta" tabIndex={0} aria-label="Get Started">
          Get Started
        </button>

        <button
          className="navbar-hamburger"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={toggleMenu}
        >
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;