import React, { useState, useEffect } from 'react';
import SaazChatWindow from './SaazChatWindow';

const SaazWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  // Simulate AI being active/working
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
          <span className="saaz-orb-icon">🤖</span>
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