// Voice Processor Service for Saaz AI Chatbot
class VoiceProcessor {
  constructor() {
    this.isProcessing = false;
    this.debounceTimer = null;
    this.callbacks = [];
  }

  // Process voice command with debouncing
  processCommand(command, callback) {
    // Clear any existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set a new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.executeCommand(command, callback);
    }, 300); // 300ms debounce
  }

  // Execute the actual command processing
  executeCommand(command, callback) {
    if (this.isProcessing) {
      console.log('Voice processor busy, skipping command');
      return;
    }

    this.isProcessing = true;

    try {
      // Normalize the command
      const normalizedCommand = this.normalizeCommand(command);
      
      // Parse the command to extract intent
      const parsedCommand = this.parseCommand(normalizedCommand);
      
      // Validate the command
      if (this.validateCommand(parsedCommand)) {
        // Execute callback with parsed command
        if (callback && typeof callback === 'function') {
          callback(parsedCommand);
        }
      } else {
        console.warn('Invalid command:', command);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Normalize the voice command
  normalizeCommand(command) {
    if (!command) return '';
    
    return command
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/gi, ''); // Remove punctuation
  }

  // Parse the command to extract intent and entities
  parseCommand(command) {
    const intents = {
      'navigate': ['go to', 'take me to', 'navigate to', 'show me'],
      'click': ['click on', 'select', 'press', 'choose'],
      'search': ['search for', 'find', 'look for', 'google'],
      'scroll': ['scroll to', 'go down', 'go up', 'scroll down', 'scroll up'],
      'open_modal': ['open', 'show', 'display', 'launch'],
      'fill_input': ['fill', 'enter', 'type', 'put'],
      'trip_plan': ['plan trip', 'travel plan', 'itinerary', 'trip planner'],
      'budget_calc': ['budget', 'calculate cost', 'expense', 'money'],
      'emergency': ['emergency', 'help', 'call', 'urgent'],
      'translate': ['translate', 'language', 'speak'],
      'religious': ['temple', 'church', 'mosque', 'pray', 'worship']
    };

    let detectedIntent = null;
    let entities = [];

    // Find the intent
    for (const [intent, keywords] of Object.entries(intents)) {
      for (const keyword of keywords) {
        if (command.includes(keyword)) {
          detectedIntent = intent;
          break;
        }
      }
      if (detectedIntent) break;
    }

    // Extract entities (objects, locations, etc.)
    entities = this.extractEntities(command);

    return {
      intent: detectedIntent,
      command: command,
      entities: entities,
      raw: command
    };
  }

  // Extract entities from the command
  extractEntities(command) {
    const entities = [];
    
    // Extract locations (simple pattern matching)
    const locationPattern = /to\s+([a-zA-Z\s]+)/g;
    const locationMatches = command.match(locationPattern);
    if (locationMatches) {
      locationMatches.forEach(match => {
        const location = match.replace('to ', '').trim();
        entities.push({ type: 'location', value: location });
      });
    }

    // Extract numbers (could be for budgets, dates, etc.)
    const numberPattern = /\b\d+\b/g;
    const numberMatches = command.match(numberPattern);
    if (numberMatches) {
      numberMatches.forEach(num => {
        entities.push({ type: 'number', value: parseInt(num) });
      });
    }

    return entities;
  }

  // Validate the parsed command
  validateCommand(parsedCommand) {
    if (!parsedCommand.intent) {
      return false;
    }

    // Add more validation rules as needed
    return true;
  }

  // Register callback for command processing
  registerCallback(callback) {
    if (typeof callback === 'function') {
      this.callbacks.push(callback);
    }
  }

  // Remove callback
  removeCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  // Process and distribute command to all registered callbacks
  processWithCallbacks(command) {
    this.processCommand(command, (parsedCommand) => {
      this.callbacks.forEach(callback => {
        callback(parsedCommand);
      });
    });
  }
}

// Export singleton instance
const voiceProcessor = new VoiceProcessor();
export default voiceProcessor;