import React, { useState } from 'react';

const TripPlanner = ({ tripData, onClose }) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [expandedDay, setExpandedDay] = useState(null);

  const toggleDay = (dayIndex) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  const TripDayCard = ({ day, index, isActive, onClick }) => {
    return (
      <div 
        className={`trip-day-card ${isActive ? 'active' : ''}`}
        onClick={() => onClick(index)}
        style={{
          background: 'rgba(30, 41, 59, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          padding: '15px',
          margin: '10px 0',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          transform: isActive ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isActive ? '0 5px 15px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff' }}>
            Day {day.day}: {day.title}
          </h3>
          <span style={{ color: '#94a3b8' }}>
            {isActive ? '▼' : '►'}
          </span>
        </div>
        
        {isActive && (
          <div style={{ 
            marginTop: '15px', 
            paddingTop: '15px', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#3b82f6' }}>Activities:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1' }}>
                {day.activities.map((activity, idx) => (
                  <li key={idx}>{activity}</li>
                ))}
              </ul>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Food:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1' }}>
                {day.food.map((food, idx) => (
                  <li key={idx}>{food}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b' }}>Estimated Budget:</h4>
              <p style={{ margin: 0, color: '#f8fafc', fontWeight: 'bold' }}>{day.budget_estimate}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const BudgetBreakdown = ({ totalBudget }) => {
    // Mock budget breakdown for demonstration
    const budgetItems = [
      { category: 'Travel', percentage: 30, amount: '$300' },
      { category: 'Stay', percentage: 40, amount: '$400' },
      { category: 'Food', percentage: 20, amount: '$200' },
      { category: 'Activities', percentage: 10, amount: '$100' }
    ];

    return (
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.6)', 
        border: '1px solid rgba(255, 255, 255, 0.1)', 
        borderRadius: '15px', 
        padding: '20px', 
        margin: '20px 0'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#fff', textAlign: 'center' }}>Budget Breakdown</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ color: '#cbd5e1' }}>Total Estimated Budget:</span>
            <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>{totalBudget}</span>
          </div>
        </div>
        
        {budgetItems.map((item, index) => (
          <div key={index} style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ color: '#cbd5e1' }}>{item.category}:</span>
              <span style={{ color: '#f8fafc' }}>{item.amount} ({item.percentage}%)</span>
            </div>
            <div style={{
              height: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div 
                style={{
                  height: '100%',
                  width: `${item.percentage}%`,
                  background: `linear-gradient(90deg, 
                    ${index === 0 ? '#3b82f6' : 
                     index === 1 ? '#8b5cf6' : 
                     index === 2 ? '#10b981' : '#f59e0b'}, 
                    ${index === 0 ? '#2563eb' : 
                     index === 1 ? '#7c3aed' : 
                     index === 2 ? '#059669' : '#d97706'})`,
                  transition: 'width 1s ease-in-out',
                  animation: 'fillBar 1s ease-out'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)', 
      width: '90%', 
      maxWidth: '800px', 
      maxHeight: '90vh', 
      background: 'rgba(15, 23, 42, 0.95)', 
      backdropFilter: 'blur(20px)', 
      border: '1px solid rgba(255, 255, 255, 0.1)', 
      borderRadius: '20px', 
      padding: '20px', 
      zIndex: 10002,
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#fff' }}>
          🗺️ {tripData.location} Trip Plan
        </h2>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>
      
      <BudgetBreakdown totalBudget={tripData.total_estimated_budget} />
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#fff' }}>Trip Itinerary</h3>
        {tripData.days.map((day, index) => (
          <TripDayCard 
            key={index} 
            day={day} 
            index={index} 
            isActive={expandedDay === index} 
            onClick={toggleDay} 
          />
        ))}
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={onClose}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Close Plan
        </button>
      </div>
    </div>
  );
};

// Add CSS animations
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fillBar {
    from { width: 0; }
    to { width: var(--target-width); }
  }
  
  .trip-day-card {
    animation: slideIn 0.3s ease-out;
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(styleSheet);

export default TripPlanner;