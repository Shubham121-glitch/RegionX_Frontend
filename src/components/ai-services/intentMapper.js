// Intent Mapper Service for Saaz AI Chatbot
class IntentMapper {
  constructor() {
    this.allowedSelectors = [
      '[data-saaz-action]',
      '[role="button"]',
      '[role="link"]',
      'button',
      'a',
      'input',
      'textarea',
      '.nav-link',
      '.menu-item',
      '.btn',
      '.link'
    ];
    
    this.allowedActions = [
      'navigate',
      'click',
      'search',
      'scroll',
      'open_modal',
      'fill_input',
      'trip_plan',
      'budget_calc',
      'emergency',
      'translate',
      'religious'
    ];
  }

  // Map the parsed intent to a safe DOM action
  mapIntent(parsedCommand) {
    if (!parsedCommand || !parsedCommand.intent) {
      throw new Error('Invalid command: no intent found');
    }

    const intent = parsedCommand.intent;
    
    // Validate the intent is allowed
    if (!this.allowedActions.includes(intent)) {
      throw new Error(`Unsupported action: ${intent}`);
    }

    switch (intent) {
      case 'navigate':
        return this.handleNavigate(parsedCommand);
      case 'click':
        return this.handleClick(parsedCommand);
      case 'search':
        return this.handleSearch(parsedCommand);
      case 'scroll':
        return this.handleScroll(parsedCommand);
      case 'open_modal':
        return this.handleOpenModal(parsedCommand);
      case 'fill_input':
        return this.handleFillInput(parsedCommand);
      case 'trip_plan':
        return this.handleTripPlan(parsedCommand);
      case 'budget_calc':
        return this.handleBudgetCalc(parsedCommand);
      case 'emergency':
        return this.handleEmergency(parsedCommand);
      case 'translate':
        return this.handleTranslate(parsedCommand);
      case 'religious':
        return this.handleReligious(parsedCommand);
      default:
        throw new Error(`Unknown intent: ${intent}`);
    }
  }

  // Handle navigation intent
  handleNavigate(parsedCommand) {
    const target = parsedCommand.entities.find(e => e.type === 'location');
    if (!target) {
      throw new Error('Navigation intent requires a target location');
    }

    // In a real app, this would navigate to a route
    console.log(`Navigating to: ${target.value}`);
    
    // Security: Only allow navigation to whitelisted routes
    const allowedRoutes = ['/home', '/about', '/contact', '/services', '/travel'];
    const route = `/${(target.value || '').toLowerCase().replace(/\s+/g, '-')}`;
    
    if (allowedRoutes.includes(route)) {
      // Return action object for execution
      return {
        action: 'navigate',
        target: route,
        execute: () => {
          // In a real app: window.location.hash = route;
          console.log(`Navigated to ${route}`);
        }
      };
    } else {
      throw new Error(`Navigation to ${route} is not allowed`);
    }
  }

  // Handle click intent
  handleClick(parsedCommand) {
    // Look for entity that specifies what to click
    const targetEntity = parsedCommand.entities.find(e => e.type === 'location' || e.type === 'text');
    let selector = null;

    if (targetEntity) {
      // Try to find element by text content or other attributes
      selector = this.findElementByDescription(targetEntity.value);
    }

    if (!selector) {
      throw new Error('Could not determine element to click');
    }

    return {
      action: 'click',
      target: selector,
      execute: () => {
        const element = document.querySelector(selector);
        if (element && this.isAllowedElement(element)) {
          element.click();
        } else {
          console.warn(`Element ${selector} not found or not allowed`);
        }
      }
    };
  }

  // Handle search intent
  handleSearch(parsedCommand) {
    const targetEntity = parsedCommand.entities.find(e => e.type === 'location' || e.type === 'text');
    
    if (!targetEntity) {
      throw new Error('Search intent requires a search term');
    }

    return {
      action: 'search',
      target: targetEntity.value,
      execute: () => {
        // In a real app, this would trigger a search
        console.log(`Searching for: ${targetEntity.value}`);
      }
    };
  }

  // Handle scroll intent
  handleScroll(parsedCommand) {
    let position = 0;
    
    const numberEntity = parsedCommand.entities.find(e => e.type === 'number');
    if (numberEntity) {
      position = numberEntity.value * 100; // Convert percentage to pixels
    } else if (parsedCommand.command.includes('top')) {
      position = 0;
    } else if (parsedCommand.command.includes('bottom')) {
      position = document.body.scrollHeight;
    } else if (parsedCommand.command.includes('up')) {
      position = window.pageYOffset - 300;
    } else {
      position = window.pageYOffset + 300; // Default scroll down
    }

    // Ensure position is within bounds
    position = Math.max(0, Math.min(position, document.body.scrollHeight - window.innerHeight));

    return {
      action: 'scroll',
      target: position,
      execute: () => {
        window.scrollTo({ top: position, behavior: 'smooth' });
      }
    };
  }

  // Handle open modal intent
  handleOpenModal(parsedCommand) {
    const targetEntity = parsedCommand.entities.find(e => e.type === 'location' || e.type === 'text');
    let modalName = 'default';

    if (targetEntity) {
      modalName = targetEntity.value.toLowerCase();
    }

    return {
      action: 'open_modal',
      target: modalName,
      execute: () => {
        // Dispatch a custom event to open the modal
        const event = new CustomEvent('saaz-open-modal', { detail: { modal: modalName } });
        document.dispatchEvent(event);
      }
    };
  }

  // Handle fill input intent
  handleFillInput(parsedCommand) {
    const textEntity = parsedCommand.entities.find(e => e.type === 'text');
    const locationEntity = parsedCommand.entities.find(e => e.type === 'location');
    
    if (!textEntity && !locationEntity) {
      throw new Error('Fill input intent requires text to fill');
    }

    const value = textEntity ? textEntity.value : locationEntity.value;
    
    // Find the most recently focused input or a general input field
    let targetSelector = 'input[type="text"]:focus, textarea:focus';
    if (!document.querySelector(targetSelector)) {
      targetSelector = 'input[type="text"], textarea';
    }

    return {
      action: 'fill_input',
      target: { selector: targetSelector, value: value },
      execute: () => {
        const element = document.querySelector(targetSelector);
        if (element && this.isAllowedInputElement(element)) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    };
  }

  // Handle trip plan intent
  handleTripPlan(parsedCommand) {
    const locationEntity = parsedCommand.entities.find(e => e.type === 'location');
    
    return {
      action: 'trip_plan',
      target: locationEntity ? locationEntity.value : 'destination',
      execute: () => {
        // Dispatch event to open trip planner
        const event = new CustomEvent('saaz-open-trip-planner', { 
          detail: { destination: locationEntity ? locationEntity.value : 'anywhere' } 
        });
        document.dispatchEvent(event);
      }
    };
  }

  // Handle budget calculation intent
  handleBudgetCalc(parsedCommand) {
    return {
      action: 'budget_calc',
      target: 'calculator',
      execute: () => {
        // Dispatch event to open budget calculator
        const event = new CustomEvent('saaz-open-budget-calculator');
        document.dispatchEvent(event);
      }
    };
  }

  // Handle emergency services intent
  handleEmergency(parsedCommand) {
    return {
      action: 'emergency',
      target: 'services',
      execute: () => {
        // Dispatch event to open emergency services
        const event = new CustomEvent('saaz-open-emergency-services');
        document.dispatchEvent(event);
      }
    };
  }

  // Handle translation intent
  handleTranslate(parsedCommand) {
    return {
      action: 'translate',
      target: 'translator',
      execute: () => {
        // Dispatch event to open translator
        const event = new CustomEvent('saaz-open-translator');
        document.dispatchEvent(event);
      }
    };
  }

  // Handle religious places intent
  handleReligious(parsedCommand) {
    const locationEntity = parsedCommand.entities.find(e => e.type === 'location');
    
    return {
      action: 'religious',
      target: locationEntity ? locationEntity.value : 'nearby',
      execute: () => {
        // Dispatch event to open religious places finder
        const event = new CustomEvent('saaz-open-religious-places', { 
          detail: { location: locationEntity ? locationEntity.value : 'current' } 
        });
        document.dispatchEvent(event);
      }
    };
  }

  // Helper to find element by description
  findElementByDescription(description) {
    // Try to find by aria-label, title, or text content
    const selectors = [
      `[aria-label*="${description}" i]`,
      `[title*="${description}" i]`,
      `button:contains("${description}")`,
      `a:contains("${description}")`,
      `.btn:contains("${description}")`
    ];

    for (const selector of selectors) {
      if (document.querySelector(selector)) {
        return selector;
      }
    }

    // Fallback: search for common navigation elements
    const commonElements = {
      'home': 'a[href="/"], .nav-home, .home-link',
      'about': 'a[href="/about"], .nav-about, .about-link',
      'contact': 'a[href="/contact"], .nav-contact, .contact-link',
      'menu': '.menu-toggle, .nav-toggle, [data-menu]',
      'search': '.search-btn, .search-icon, [role="search"] button'
    };

    const lowerDesc = description.toLowerCase();
    for (const [key, selector] of Object.entries(commonElements)) {
      if (lowerDesc.includes(key)) {
        return selector;
      }
    }

    return null;
  }

  // Check if element is allowed to be interacted with
  isAllowedElement(element) {
    return this.allowedSelectors.some(allowed => {
      return element.matches(allowed);
    });
  }

  // Check if input element is allowed to be filled
  isAllowedInputElement(element) {
    const tagName = element.tagName.toLowerCase();
    const inputType = element.type ? element.type.toLowerCase() : 'text';
    
    // Allow text inputs, textareas, and some other input types
    const allowedTypes = ['text', 'email', 'password', 'search', 'tel', 'url'];
    return tagName === 'textarea' || (tagName === 'input' && allowedTypes.includes(inputType));
  }

  // Validate and sanitize command before execution
  validateAndSanitize(command) {
    // Add validation logic here
    return command;
  }
}

// Export singleton instance
const intentMapper = new IntentMapper();
export default intentMapper;