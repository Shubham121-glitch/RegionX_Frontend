import React, { useState, useEffect } from 'react';
import SaazChatWindow from './SaazChatWindow';
import './sazWidget.css';

const SaazWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  // Simulate AI activity
  useEffect(() => {
    const interval = setInterval(() => {
      setIsActive(prev => !prev);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className={`saaz-widget ${isOpen ? 'minimized' : ''}`}>
        <div 
          className={`saaz-orb ${isActive ? 'active' : ''}`}
          onClick={toggleChat}
          title="Talk to Saaz AI Assistant"
        >
          <span className="saaz-orb-icon">
            {/* 🔥 Modern SVG AI Icon */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path 
                d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3h1V6a4 4 0 0 1 4-4z" 
                stroke="white" 
                strokeWidth="1.5"
              />
              <circle cx="9" cy="12" r="1" fill="white"/>
              <circle cx="15" cy="12" r="1" fill="white"/>
            </svg>
          </span>
        </div>
      </div>
      
      <SaazChatWindow 
        isOpen={isOpen} 
        onClose={closeChat} 
      />
    </>
  );
};

export default SaazWidget;