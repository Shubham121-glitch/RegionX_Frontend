import React, { useState } from 'react';

const SaazBudgetCalculator = ({ onClose }) => {
  const [budgetInputs, setBudgetInputs] = useState({
    accommodation: '',
    food: '',
    transport: '',
    activities: '',
    shopping: '',
    misc: ''
  });

  const [currency, setCurrency] = useState('USD');
  const [total, setTotal] = useState(0);

  const handleInputChange = (field, value) => {
    setBudgetInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateTotal = () => {
    const sum = Object.values(budgetInputs).reduce((acc, val) => acc + parseFloat(val || 0), 0);
    setTotal(sum);
  };

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'CAD'];

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>💰 Budget Calculator</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-budget-calculator-content">
          <div className="saaz-budget-controls">
            <div className="saaz-currency-selector">
              <label>Currency: </label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
            
            <button className="saaz-calculate-btn" onClick={calculateTotal}>Calculate Total</button>
          </div>
          
          <div className="saaz-budget-inputs">
            {Object.keys(budgetInputs).map(field => (
              <div key={field} className="saaz-budget-item">
                <label>
                  {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}:
                </label>
                <input
                  type="number"
                  value={budgetInputs[field]}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  placeholder={`Amount in ${currency}`}
                  className="saaz-budget-input"
                />
              </div>
            ))}
          </div>
          
          <div className="saaz-budget-total">
            <h3>Total Budget: <span className="saaz-total-amount">{total.toFixed(2)} {currency}</span></h3>
          </div>
          
          <div className="saaz-budget-tips">
            <h4>Budgeting Tips:</h4>
            <ul>
              <li>Allocate 30-40% for accommodation</li>
              <li>Reserve 20-25% for food and drinks</li>
              <li>Set aside 15-20% for transportation</li>
              <li>Keep 10-15% for activities and entertainment</li>
              <li>Maintain 5-10% as emergency buffer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazBudgetCalculator;