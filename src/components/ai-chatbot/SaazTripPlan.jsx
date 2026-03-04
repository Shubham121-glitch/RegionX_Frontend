import React from 'react';

const SaazTripPlan = ({ tripPlanData, onClose }) => {
  if (!tripPlanData) return null;

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>📅 {tripPlanData.location} Trip Plan</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-trip-plan-content">
          <div className="saaz-trip-summary">
            <p><strong>Duration:</strong> {tripPlanData.days.length} days</p>
            <p><strong>Total Budget:</strong> {tripPlanData.total_estimated_budget}</p>
            <p><strong>Description:</strong> {tripPlanData.description}</p>
          </div>
          
          <div className="saaz-trip-days">
            {tripPlanData.days.map((day, index) => (
              <div key={index} className="saaz-trip-day">
                <h3>Day {day.day}: {day.title}</h3>
                <div className="saaz-day-details">
                  <div className="saaz-day-activities">
                    <h4>📍 Activities</h4>
                    <ul>
                      {day.activities.map((activity, idx) => (
                        <li key={idx}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="saaz-day-food">
                    <h4>🍽️ Food</h4>
                    <ul>
                      {day.food.map((food, idx) => (
                        <li key={idx}>{food}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="saaz-day-budget">
                    <h4>💰 Estimated Budget</h4>
                    <p>{day.budget_estimate}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazTripPlan;