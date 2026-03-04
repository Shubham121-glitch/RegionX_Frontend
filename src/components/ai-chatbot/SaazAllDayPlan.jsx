import React, { useState } from 'react';

const SaazAllDayPlan = ({ onClose }) => {
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [interests, setInterests] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const interestOptions = [
    'Nature & Outdoors', 'History & Culture', 'Food & Dining', 
    'Shopping', 'Adventure', 'Relaxation', 'Art & Museums'
  ];

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(item => item !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const generatePlan = () => {
    if (!destination.trim() || !date || interests.length === 0) return;
    
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const mockPlan = {
        destination: destination,
        date: date,
        interests: interests,
        schedule: [
          {
            time: '9:00 AM',
            activity: 'Breakfast at Local Café',
            duration: '1 hour',
            description: 'Start your day with traditional breakfast'
          },
          {
            time: '10:30 AM',
            activity: 'Morning Sightseeing',
            duration: '2 hours',
            description: 'Visit iconic landmarks and attractions'
          },
          {
            time: '1:00 PM',
            activity: 'Lunch Experience',
            duration: '1.5 hours',
            description: 'Try local cuisine at recommended restaurant'
          },
          {
            time: '3:00 PM',
            activity: 'Afternoon Activity',
            duration: '2 hours',
            description: 'Based on your interests: ' + interests.join(', ')
          },
          {
            time: '6:00 PM',
            activity: 'Sunset Viewpoint',
            duration: '1 hour',
            description: 'Perfect spot to watch the sunset'
          },
          {
            time: '7:30 PM',
            activity: 'Dinner & Evening',
            duration: '2 hours',
            description: 'Fine dining experience to end the day'
          }
        ]
      };
      
      setGeneratedPlan(mockPlan);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>🌍 All-Day Plan Generator</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-all-day-plan-content">
          {!generatedPlan ? (
            <div className="saaz-plan-form">
              <div className="saaz-input-group">
                <label htmlFor="destination">Destination:</label>
                <input
                  id="destination"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where would you like to go?"
                  className="saaz-destination-input"
                />
              </div>
              
              <div className="saaz-input-group">
                <label htmlFor="date">Date:</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="saaz-date-input"
                />
              </div>
              
              <div className="saaz-interests-section">
                <label>Select your interests:</label>
                <div className="saaz-interests-grid">
                  {interestOptions.map((interest, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`saaz-interest-btn ${interests.includes(interest) ? 'active' : ''}`}
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
              
              <button 
                className="saaz-generate-btn" 
                onClick={generatePlan}
                disabled={loading || !destination.trim() || !date || interests.length === 0}
              >
                {loading ? 'Generating Plan...' : 'Generate My Plan'}
              </button>
            </div>
          ) : (
            <div className="saaz-generated-plan">
              <div className="saaz-plan-header">
                <h3>Your {generatedPlan.destination} Itinerary for {generatedPlan.date}</h3>
                <p>Interests: {generatedPlan.interests.join(', ')}</p>
              </div>
              
              <div className="saaz-schedule">
                {generatedPlan.schedule.map((item, index) => (
                  <div key={index} className="saaz-schedule-item">
                    <div className="saaz-time">{item.time}</div>
                    <div className="saaz-activity">
                      <h4>{item.activity}</h4>
                      <p>{item.description}</p>
                      <small>Duration: {item.duration}</small>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="saaz-plan-actions">
                <button className="saaz-edit-btn" onClick={() => setGeneratedPlan(null)}>Edit Plan</button>
                <button className="saaz-save-btn">💾 Save Plan</button>
                <button className="saaz-share-btn">📤 Share Plan</button>
              </div>
            </div>
          )}
          
          <div className="saaz-planning-tips">
            <h4>Trip Planning Tips:</h4>
            <ul>
              <li>Research local customs and etiquette</li>
              <li>Check weather forecast and pack accordingly</li>
              <li>Book accommodations in advance</li>
              <li>Inform someone of your travel plans</li>
              <li>Carry emergency contact information</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazAllDayPlan;