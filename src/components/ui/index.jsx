import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import Footer from './Footer';
import './index.css';

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
    </>
  );
}

export default Home;