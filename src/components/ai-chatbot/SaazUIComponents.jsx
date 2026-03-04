import React from 'react';
import SaazEmergencyServices from './SaazEmergencyServices';
import SaazBudgetCalculator from './SaazBudgetCalculator';
import SaazTranslator from './SaazTranslator';
import SaazReligiousPlaces from './SaazReligiousPlaces';
import SaazAllDayPlan from './SaazAllDayPlan';
import SaazTripPlan from './SaazTripPlan'; // Import the new trip plan component

const SaazUIComponents = ({ 
  showEmergency, 
  setShowEmergency, 
  showBudgetCalc, 
  setShowBudgetCalc, 
  showTranslator, 
  setShowTranslator,
  showReligiousPlaces,
  setShowReligiousPlaces,
  showAllDayPlan,
  setShowAllDayPlan,
  showTripPlan,           // Add trip plan props
  setShowTripPlan,
  tripPlanData           // Add trip plan data prop
}) => {
  return (
    <>
      {showEmergency && (
        <SaazEmergencyServices onClose={() => setShowEmergency(false)} />
      )}
      
      {showBudgetCalc && (
        <SaazBudgetCalculator onClose={() => setShowBudgetCalc(false)} />
      )}
      
      {showTranslator && (
        <SaazTranslator onClose={() => setShowTranslator(false)} />
      )}
      
      {showReligiousPlaces && (
        <SaazReligiousPlaces onClose={() => setShowReligiousPlaces(false)} />
      )}
      
      {showAllDayPlan && (
        <SaazAllDayPlan onClose={() => setShowAllDayPlan(false)} />
      )}
      
      {/* Trip Plan Modal */}
      {showTripPlan && tripPlanData && (
        <SaazTripPlan 
          tripPlanData={tripPlanData} 
          onClose={() => setShowTripPlan(false)} 
        />
      )}
    </>
  );
};

export default SaazUIComponents;