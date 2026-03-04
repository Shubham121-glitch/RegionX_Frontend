import React from 'react';

const SaazEmergencyServices = ({ onClose }) => {
  const emergencyContacts = [
    { name: 'Police', number: '911', icon: '👮' },
    { name: 'Ambulance', number: '911', icon: '🚑' },
    { name: 'Fire Department', number: '911', icon: '🚒' },
    { name: 'Local Emergency', number: '112', icon: '🆘' }
  ];

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>🚨 Emergency Services</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-emergency-content">
          <div className="saaz-emergency-contacts">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="saaz-emergency-contact">
                <div className="saaz-emergency-icon">{contact.icon}</div>
                <div className="saaz-emergency-info">
                  <h3>{contact.name}</h3>
                  <p>{contact.number}</p>
                </div>
                <button className="saaz-call-btn">📞 Call</button>
              </div>
            ))}
          </div>
          
          <div className="saaz-emergency-tips">
            <h3>Emergency Tips:</h3>
            <ul>
              <li>Stay calm and assess the situation</li>
              <li>Call emergency services immediately</li>
              <li>Provide your exact location</li>
              <li>Follow instructions from emergency personnel</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazEmergencyServices;