import React from 'react';
import './HeroSection.css';

function HeroSection() {
  return (
    <section className="hero-section" id="home" aria-label="Hero section">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-headline">Explore the World with RegionX</h1>
          <p className="hero-subheadline">Your premium tourism and AI-powered travel companion.</p>
          <div className="hero-cta-group">
            <button className="btn btn-primary" type="button">Get Started</button>
            <button className="btn btn-secondary" type="button">Learn More</button>
          </div>
        </div>
        <div className="hero-image" aria-hidden="true">
          {/* Placeholder for hero image or illustration */}
          <div className="image-placeholder">Image/Illustration</div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;