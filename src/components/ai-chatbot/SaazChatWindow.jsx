import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import SaazVoiceActivation from './SaazVoiceActivation';
import textToSpeechService from '../ai-services/textToSpeech';
import SaazUIComponents from './SaazUIComponents';
import useSaazVoice from '../../hooks/useSaazVoice';
import './SaazChatWindow.css';

const SaazChatWindow = ({ isOpen, onClose }) => {
  // Callback for when wake word is detected
  const handleWakeWordDetected = (transcript) => {
    console.log('Wake word detected in chat window:', transcript); // Debug log
    // Optionally trigger some UI feedback or action
  };
  
  const {
    isListening,
    isProcessing,
    transcript,
    error: recognitionError,
    toggleListening,
    detectWakeWord,
    clearTranscript
  } = useSaazVoice(handleWakeWordDetected);
  
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', content: 'Hello! I\'m Saaz, your AI travel assistant. How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [currentTheme, setCurrentTheme] = useState('dark');
  const [showEmergency, setShowEmergency] = useState(false);
  const [showBudgetCalc, setShowBudgetCalc] = useState(false);
  const [showTranslator, setShowTranslator] = useState(false);
  const [showReligiousPlaces, setShowReligiousPlaces] = useState(false);
  const [showAllDayPlan, setShowAllDayPlan] = useState(false);
  const [showTripPlan, setShowTripPlan] = useState(false);
  const [tripPlanData, setTripPlanData] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, content) => {
    const newMessage = {
      id: Date.now(),
      type,
      content
    };
    setMessages(prev => [...prev, newMessage]);
    
    // If it's an AI message and TTS is enabled, speak it
    if (type === 'ai' && isTTSEnabled) {
      console.log('Attempting to speak AI message:', content); // Debug log
      setIsSpeaking(true);
      textToSpeechService.speak(content).finally(() => {
        console.log('Finished speaking, setting isSpeaking to false'); // Debug log
        setIsSpeaking(false);
      });
    }
  };

  useEffect(() => {
    // Initialize TTS service when component mounts
    textToSpeechService.initialize();
    scrollToBottom();
  }, [messages]);

  // Effect to update UI when speaking state changes
  useEffect(() => {
    // Update the last AI message to reflect speaking state if needed
    if (isSpeaking && messages.length > 0) {
      const lastAIMessage = [...messages].reverse().find(msg => msg.type === 'ai');
      if (lastAIMessage) {
        // We could potentially update the message with a speaking class here
        // but for now we'll just rely on the CSS class applied to the message div
      }
    }
  }, [isSpeaking, messages]);

  // Effect to handle speech recognition errors
  useEffect(() => {
    if (recognitionError) {
      console.error('Speech recognition error in chat window:', recognitionError); // Debug log
      // Add the error as a message to inform the user
      addMessage('ai', `Voice recognition issue: ${recognitionError}. Please check your microphone settings.`);
    }
  }, [recognitionError, addMessage]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    addMessage('user', userMessage);
    
    setIsLoading(true);
    
    try {
      // Initialize text-to-speech after user interaction (needed for some browsers)
      textToSpeechService.initialize();
      
      // Get user ID from Clerk or generate temporary one
      const userId = localStorage.getItem('saaz_user_id') || `temp_${Date.now()}`;
      localStorage.setItem('saaz_user_id', userId);

      const response = await axios.post(`${API_URL}/ai/chat`, {
        message: userMessage,
        userId: userId
      }).catch(error => {
        console.error('API call failed:', error);
        throw error;
      });

      if (response.data.success) {
        const aiResponse = response.data.data;
        
        if (aiResponse.type === 'response') {
          addMessage('ai', aiResponse.response);
        } else if (aiResponse.type === 'action') {
          addMessage('ai', aiResponse.response || 'I can help you with that action.');
          // Handle app control actions here
          handleAppAction(aiResponse);
        } else if (aiResponse.type === 'trip_plan') {
          // Show trip plan in a special component and display summary
          setTripPlanData(aiResponse);
          displayTripPlan(aiResponse);
          setShowTripPlan(true);
        } else if (aiResponse.type === 'quick_action') {
          addMessage('ai', aiResponse.response);
          // Trigger quick action
          triggerQuickAction(aiResponse);
        }
      } else {
        addMessage('ai', 'Sorry, I encountered an error. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage('ai', 'Sorry, I\'m having trouble connecting. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Initialize text-to-speech after user interaction
      textToSpeechService.initialize();
      handleSend();
    }
  };
  
  // Test TTS functionality manually
  const testTTS = async () => {
    console.log('Testing TTS with sample text');
    textToSpeechService.initialize();
    await textToSpeechService.speak("Hello, this is a test of the text to speech functionality.");
  };

  const handleAppAction = (actionData) => {
    // Safely handle app control actions
    try {
      switch (actionData.action) {
        case 'navigate':
          // In a real app, this would navigate to a route
          console.log('Navigating to:', actionData.target);
          break;
        case 'click':
          // Find and click an element by selector
          const element = document.querySelector(actionData.target);
          if (element) {
            element.click();
          }
          break;
        case 'search':
          // Perform search action
          console.log('Searching for:', actionData.target);
          break;
        case 'scroll':
          // Scroll to position
          window.scrollTo(0, parseInt(actionData.target));
          break;
        case 'open_modal':
          // Open modal by name
          console.log('Opening modal:', actionData.target);
          break;
        case 'fill_input':
          // Fill input field
          const inputElement = document.querySelector(actionData.target.selector);
          if (inputElement) {
            inputElement.value = actionData.target.value;
          }
          break;
        default:
          console.log('Unknown action:', actionData.action);
      }
    } catch (error) {
      console.error('App action error:', error);
    }
  };

  const displayTripPlan = (tripData) => {
    // Show trip plan in a special format
    const tripMessage = `Here's your ${tripData.days.length}-day plan for ${tripData.location}:\n\n`;
    const daysSummary = tripData.days.map(day => 
      `Day ${day.day}: ${day.title}\n  Activities: ${day.activities.join(', ')}\n  Food: ${day.food.join(', ')}\n  Est. Budget: ${day.budget_estimate}\n`
    ).join('\n');
    
    addMessage('ai', tripMessage + daysSummary + `\n\nTotal Estimated Budget: ${tripData.total_estimated_budget}`);
  };

  const triggerQuickAction = (actionData) => {
    // Handle quick actions like budget calculator, translator, etc.
    switch (actionData.action) {
      case 'budget_calculator':
        addMessage('ai', 'Opening budget calculator...');
        setShowBudgetCalc(true);
        break;
      case 'religious_places':
        addMessage('ai', 'Showing religious places nearby...');
        setShowReligiousPlaces(true);
        break;
      case 'emergency_services':
        addMessage('ai', 'Displaying emergency services...');
        setShowEmergency(true);
        break;
      case 'ai_translator':
        addMessage('ai', 'Opening AI translator...');
        setShowTranslator(true);
        break;
      case 'all_day_plan':
        addMessage('ai', 'Creating all-day itinerary...');
        setShowAllDayPlan(true);
        break;
      default:
        console.log('Unknown quick action:', actionData.action);
    }
  };

  const handleVoiceCommand = (command) => {
    if (command) {
      setInputValue(command);
      setTimeout(() => {
        // Initialize text-to-speech after user interaction
        textToSpeechService.initialize();
        handleSend();
      }, 300);
    }
  };

  const toggleVoice = () => {
    // Toggle the dedicated voice activation modal
    setIsVoiceActive(!isVoiceActive);
  };

  // Quick action options
  const quickActions = [
    { id: 'all_day_plan', label: '🌍 All Day Plan', action: 'all_day_plan' },
    { id: 'budget_calc', label: '💰 Budget Calculation', action: 'budget_calculator' },
    { id: 'religious', label: '🛐 Religious Places', action: 'religious_places' },
    { id: 'emergency', label: '🚑 Emergency Services', action: 'emergency_services' },
    { id: 'translate', label: '🌐 AI Translator', action: 'ai_translator' }
  ];

  const handleQuickAction = (action) => {
    const label = action.label || '';
    setInputValue(`I need help with ${label.toLowerCase().replace(/[^\w\s]/g, '')}`);
    setTimeout(() => {
      // Initialize text-to-speech after user interaction
      textToSpeechService.initialize();
      handleSend();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`saaz-chat-window ${isOpen ? 'open' : ''}`} data-theme={currentTheme}>
      <div className="saaz-voice-activation" style={{ display: isVoiceActive ? 'flex' : 'none' }}>
        <SaazVoiceActivation 
          onCommand={handleVoiceCommand} 
          onClose={() => {
            setIsVoiceActive(false);
            // Stop listening when closing the modal
            if (isListening) {
              toggleListening();
            }
          }} 
        />
      </div>
      
      <div className="saaz-chat-header">
        <div className="saaz-chat-title">
          <span>🤖</span>
          <span>Saaz AI Assistant</span>
        </div>
        <div className="saaz-chat-controls">
          <button className="saaz-chat-btn" onClick={() => setCurrentTheme(currentTheme === 'dark' ? 'light' : 'dark')}>
            {currentTheme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button 
            className="saaz-chat-btn" 
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            title={isTTSEnabled ? 'Disable voice' : 'Enable voice'}
            style={{ opacity: isTTSEnabled ? 1 : 0.6 }}
          >
            {isTTSEnabled ? '🔊' : '🔇'}
          </button>
          <button className="saaz-chat-btn" onClick={testTTS} title="Test voice">
            🧪
          </button>
          <button 
            className="saaz-chat-btn" 
            onClick={toggleListening}
            title={isListening ? 'Stop listening for wake word' : 'Start listening for wake word'}
          >
            {isListening ? '🔴' : '👂'}
          </button>
          <button className="saaz-chat-btn" onClick={onClose}>✕</button>
        </div>
      </div>
      
      <div className="saaz-quick-actions">
        {quickActions.map(action => (
          <div 
            key={action.id}
            className="saaz-quick-action"
            onClick={() => handleQuickAction(action)}
          >
            {action.label}
          </div>
        ))}
      </div>
      
      <div className="saaz-chat-body">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`saaz-message ${message.type} ${message.type === 'ai' && isSpeaking ? 'speaking' : ''}`}
          >
            {message.content}
          </div>
        ))}
        
        {isLoading && (
          <div className="saaz-typing-indicator">
            <div className="saaz-typing-dot"></div>
            <div className="saaz-typing-dot"></div>
            <div className="saaz-typing-dot"></div>
            <span style={{ marginLeft: '10px', color: '#94a3b8' }}>Saaz is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="saaz-chat-input-area">
        <input
          ref={inputRef}
          type="text"
          className="saaz-chat-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Saaz anything..."
          disabled={isLoading}
        />
        <button 
          className={`saaz-voice-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleVoice}
          title={isListening ? 'Listening...' : 'Voice command'}
        >
          {isListening ? '🔴' : '🎤'}
        </button>
        <button 
          className="saaz-send-btn" 
          onClick={handleSend} 
          disabled={!inputValue.trim() || isLoading}
          title="Send message"
        >
          ➤
        </button>
      </div>
      
      <SaazUIComponents 
        showEmergency={showEmergency}
        setShowEmergency={setShowEmergency}
        showBudgetCalc={showBudgetCalc}
        setShowBudgetCalc={setShowBudgetCalc}
        showTranslator={showTranslator}
        setShowTranslator={setShowTranslator}
        showReligiousPlaces={showReligiousPlaces}
        setShowReligiousPlaces={setShowReligiousPlaces}
        showAllDayPlan={showAllDayPlan}
        setShowAllDayPlan={setShowAllDayPlan}
        showTripPlan={showTripPlan}
        setShowTripPlan={setShowTripPlan}
        tripPlanData={tripPlanData}
      />
    </div>
  );
};

export default SaazChatWindow;