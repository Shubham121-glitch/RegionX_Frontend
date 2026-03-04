// Trip Planner Service for Saaz AI Chatbot
class TripPlanner {
  constructor() {
    this.currentPlan = null;
    this.history = [];
  }

  // Create a new trip plan based on user input
  async createTripPlan(destination, duration, interests, budget) {
    // Validate inputs
    if (!destination || !duration) {
      throw new Error('Destination and duration are required');
    }

    // Create the trip plan
    const plan = {
      id: Date.now(),
      location: destination,
      duration: duration,
      interests: interests || [],
      budget: budget || 'medium',
      description: `A personalized trip plan for ${destination}`,
      days: [],
      total_estimated_budget: budget,
      created_at: new Date().toISOString()
    };

    // Generate day-by-day itinerary
    plan.days = this.generateDailyItinerary(plan);

    // Calculate estimated budget
    plan.total_estimated_budget = this.calculateEstimatedBudget(plan);

    // Store the plan
    this.currentPlan = plan;
    this.history.push(plan);

    return plan;
  }

  // Generate daily itinerary based on the trip plan
  generateDailyItinerary(plan) {
    const days = [];
    const activitiesPerDay = 3; // Average number of activities per day

    // Define possible activities based on interests
    const activityBank = {
      nature: [
        'Hiking trail exploration', 'National park visit', 'Botanical garden tour',
        'Waterfall hunting', 'Scenic viewpoint visit', 'Bird watching',
        'Kayaking/canoeing', 'Mountain biking', 'Rock climbing'
      ],
      culture: [
        'Museum visit', 'Historical site tour', 'Art gallery exploration',
        'Local market visit', 'Traditional craft workshop', 'Heritage walk',
        'Architectural tour', 'Cultural performance', 'Local festival attendance'
      ],
      food: [
        'Local cuisine tasting', 'Cooking class', 'Food tour',
        'Street food exploration', 'Wine tasting', 'Farm visit',
        'Traditional restaurant', 'Local delicacies', 'Specialty coffee shop'
      ],
      adventure: [
        'Zip-lining', 'Paragliding', 'White water rafting', 'Safari',
        'Snorkeling/diving', 'Rock climbing', 'Bungee jumping',
        'ATV riding', 'Surfing lesson', 'Hot air balloon ride'
      ],
      relaxation: [
        'Spa treatment', 'Beach relaxation', 'Wellness retreat',
        'Meditation session', 'Yoga class', 'Thermal springs visit',
        'Park relaxation', 'Sunset watching', 'Leisurely stroll'
      ]
    };

    // Generate activities for each day
    for (let day = 1; day <= plan.duration; day++) {
      const dayActivities = [];
      const dayFood = [];
      
      // Select activities based on interests
      const selectedInterests = plan.interests.length > 0 ? plan.interests : ['culture', 'food'];
      
      selectedInterests.forEach(interest => {
        const interestKey = this.mapInterestToActivity(interest);
        if (activityBank[interestKey]) {
          const randomActivity = this.getRandomItem(activityBank[interestKey]);
          dayActivities.push(randomActivity);
        }
      });
      
      // Add generic activities if needed
      while (dayActivities.length < activitiesPerDay) {
        const randomCategory = this.getRandomItem(Object.keys(activityBank));
        const randomActivity = this.getRandomItem(activityBank[randomCategory]);
        if (!dayActivities.includes(randomActivity)) {
          dayActivities.push(randomActivity);
        }
      }
      
      // Add food activities
      dayFood.push(
        this.getRandomItem(['Local breakfast', 'Regional specialty', 'Street food']),
        this.getRandomItem(['Traditional lunch', 'Local cuisine', 'Market food']),
        this.getRandomItem(['Regional dinner', 'Local restaurant', 'Specialty dining'])
      );
      
      // Create day object
      days.push({
        day: day,
        title: this.generateDayTitle(day, plan.location),
        activities: dayActivities.slice(0, activitiesPerDay),
        food: dayFood,
        budget_estimate: this.estimateDailyBudget(plan.budget),
        notes: []
      });
    }

    return days;
  }

  // Map user interests to activity categories
  mapInterestToActivity(interest) {
    const interestMap = {
      'nature': 'nature',
      'outdoors': 'nature',
      'hiking': 'nature',
      'camping': 'nature',
      'history': 'culture',
      'culture': 'culture',
      'museum': 'culture',
      'art': 'culture',
      'food': 'food',
      'cuisine': 'food',
      'cooking': 'food',
      'adventure': 'adventure',
      'thrill': 'adventure',
      'extreme': 'adventure',
      'relax': 'relaxation',
      'spa': 'relaxation',
      'beach': 'relaxation',
      'leisure': 'relaxation'
    };
    
    const lowerInterest = (interest || '').toLowerCase();
    return interestMap[lowerInterest] || 'culture';
  }

  // Generate a descriptive title for the day
  generateDayTitle(day, location) {
    const descriptors = [
      'Exploration', 'Discovery', 'Adventure', 'Cultural Immersion', 
      'Nature Experience', 'Culinary Journey', 'Historical Tour', 'Relaxation Day'
    ];
    
    const descriptor = this.getRandomItem(descriptors);
    return `${descriptor} in ${location} - Day ${day}`;
  }

  // Estimate daily budget based on overall budget level
  estimateDailyBudget(budgetLevel) {
    const budgetEstimates = {
      'low': '₹1,000-2,000',
      'medium': '₹2,000-5,000', 
      'high': '₹5,000-10,000',
      'luxury': '₹10,000+'
    };
    
    return budgetEstimates[budgetLevel] || '₹2,000-5,000';
  }

  // Calculate total estimated budget for the trip
  calculateEstimatedBudget(plan) {
    const dailyBudget = this.parseBudgetEstimate(plan.budget);
    return `₹${(dailyBudget * plan.duration).toLocaleString()} total`;
  }

  // Parse budget level to a numeric value for calculations
  parseBudgetEstimate(budgetLevel) {
    const budgetValues = {
      'low': 1500,
      'medium': 3500,
      'high': 7500,
      'luxury': 12000
    };
    
    return budgetValues[budgetLevel] || 3500;
  }

  // Get a random item from an array
  getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Get the current trip plan
  getCurrentPlan() {
    return this.currentPlan;
  }

  // Get trip plan history
  getHistory() {
    return this.history;
  }

  // Format the trip plan for AI response
  formatForAIResponse(plan) {
    return {
      type: 'trip_plan',
      response: `I've created a detailed ${plan.duration}-day trip plan for ${plan.location}. Here's your itinerary:`,
      location: plan.location,
      days: plan.days,
      total_estimated_budget: plan.total_estimated_budget,
      description: plan.description
    };
  }

  // Load a trip plan from data
  loadPlan(data) {
    this.currentPlan = data;
    this.history.push(data);
    return data;
  }

  // Reset current plan
  resetPlan() {
    this.currentPlan = null;
  }

  // Update an existing plan with new information
  updatePlan(updates) {
    if (!this.currentPlan) {
      throw new Error('No current plan to update');
    }

    this.currentPlan = {
      ...this.currentPlan,
      ...updates,
      days: updates.days || this.currentPlan.days,
      updated_at: new Date().toISOString()
    };

    return this.currentPlan;
  }
}

// Export singleton instance
const tripPlanner = new TripPlanner();
export default tripPlanner;