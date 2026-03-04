import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer" aria-label="Footer">
      <div className="container footer-container">
        <div className="footer-left">
          <p>© 2024 RegionX. All rights reserved.</p>
        </div>
        <nav className="footer-nav" aria-label="Footer navigation">
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;