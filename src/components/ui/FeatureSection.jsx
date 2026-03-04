import React from 'react';
import './FeatureSection.css';

function FeatureSection() {
  const features = [
    {
      title: 'AI-Powered Recommendations',
      description: 'Get personalized travel suggestions based on your preferences and trends.',
    },
    {
      title: 'Explore Regions',
      description: 'Discover detailed information about various travel regions worldwide.',
    },
    {
      title: 'Connect with Businesses',
      description: 'Find verified local businesses and services to enhance your travel experience.',
    },
  ];

  return (
    <section className="feature-section" id="features" aria-label="Features">
      <div className="container">
        <h2 className="section-title">Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card" tabIndex={0} role="article" aria-label={feature.title}>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;