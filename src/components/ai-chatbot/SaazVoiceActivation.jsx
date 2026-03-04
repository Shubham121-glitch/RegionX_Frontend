import React, { useState, useEffect, useRef } from 'react';
import useSaazVoice from '../../hooks/useSaazVoice';

const SaazVoiceActivation = ({ onCommand, onClose }) => {
  const handleWakeWordDetected = (transcript) => {
    console.log('Wake word detected in voice activation component:', transcript);
  };

  const {
    isListening,
    isProcessing,
    transcript,
    error,
    toggleListening,
    detectWakeWord,
    clearTranscript
  } = useSaazVoice(handleWakeWordDetected);

  const [isWaitingForCommand, setIsWaitingForCommand] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [commandTimeout, setCommandTimeout] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversationState, setConversationState] = useState('waiting'); // waiting, active, processing

  // Effect to handle wake word detection
  useEffect(() => {
    if (transcript) {
      const detected = detectWakeWord(transcript);
      
      if (detected && !wakeWordDetected) {
        // Wake word detected for the first time
        setWakeWordDetected(true);
        setIsWaitingForCommand(true);
        setConversationState('active');
        
        // Clear the transcript after detecting wake word
        clearTranscript();
        
        // Set timeout to close if no command comes
        const timeout = setTimeout(() => {
          setIsWaitingForCommand(false);
          setWakeWordDetected(false);
          setConversationState('waiting');
          onClose(); // Close if no command after wake word
        }, 5000); // Wait 5 seconds for command
        
        setCommandTimeout(timeout);
      } else if (wakeWordDetected && transcript && transcript.trim() !== '') {
        // We're in command mode, send the command
        if (commandTimeout) {
          clearTimeout(commandTimeout);
        }
        
        // Send the command to parent component
        if (onCommand && transcript.trim()) {
          setConversationState('processing');
          onCommand(transcript.trim());
          
          // Reset after sending command
          setTimeout(() => {
            setIsWaitingForCommand(false);
            setWakeWordDetected(false);
            setConversationState('waiting');
            clearTranscript();
            onClose(); // Close after command is sent
          }, 1000);
        }
      }
    }
  }, [transcript, detectWakeWord, wakeWordDetected, onCommand, clearTranscript, onClose]);

  // Simulate audio level for visualization (in a real app, this would come from the microphone)
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        // Random audio level simulation
        setAudioLevel(Math.random() * 100);
      }, 200);
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      if (commandTimeout) {
        clearTimeout(commandTimeout);
      }
    };
  }, [commandTimeout]);

  const handleToggleListening = () => {
    if (isListening) {
      // If currently listening, stop and reset
      toggleListening();
      setIsWaitingForCommand(false);
      setWakeWordDetected(false);
      setConversationState('waiting');
      clearTranscript();
    } else {
      // Start listening
      toggleListening();
      setConversationState('waiting');
    }
  };

  const renderVisualizer = () => {
    if (!isListening) return null;
    
    const bars = Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className="saaz-voice-bar"
        style={{
          height: `${Math.max(20, (audioLevel / 100) * (i + 1) * 15)}px`,
          backgroundColor: wakeWordDetected 
            ? `linear-gradient(to top, #ff6b6b, #ffa500)` 
            : `linear-gradient(to top, #667eea, #764ba2)`
        }}
      />
    ));
    
    return <div className="saaz-voice-visualizer">{bars}</div>;
  };

  return (
    <div className="saaz-voice-activation">
      <div className="saaz-voice-header">
        <h2>🎤 Saaz Voice Assistant</h2>
        <button className="saaz-voice-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="saaz-voice-status">
        {conversationState === 'waiting' && (
          <div className="saaz-waiting-state">
            <p>Waiting for wake word...</p>
            <p className="saaz-wake-instruction">Say "Hey Saaz" to activate</p>
          </div>
        )}
        
        {wakeWordDetected && (
          <div className="saaz-active-state">
            <p>Listening for your command...</p>
            <div className="saaz-visual-indicator">●</div>
          </div>
        )}
        
        {isProcessing && (
          <div className="saaz-processing-state">
            <p>Processing your command...</p>
            <div className="saaz-spinner"></div>
          </div>
        )}
        
        {error && (
          <div className="saaz-error-state">
            <p>⚠️ {error}</p>
            {error.includes('Microphone') && (
              <div className="saaz-permission-help">
                <p>Please:</p>
                <ol>
                  <li>Click the lock icon in the address bar</li>
                  <li>Select "Site Settings"</li>
                  <li>Enable microphone access</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
      
      {renderVisualizer()}
      
      {transcript && (
        <div className="saaz-transcript">
          <p>{transcript}</p>
        </div>
      )}
      
      <div className="saaz-voice-controls">
        <button 
          className={`saaz-listen-btn ${isListening ? 'listening' : ''}`}
          onClick={handleToggleListening}
        >
          {isListening ? '🔴 Listening...' : '▶️ Start Listening'}
        </button>
        
        <button 
          className="saaz-close-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      
      <div className="saaz-voice-tips">
        <h4>Voice Commands:</h4>
        <ul>
          <li>Say "Hey Saaz" to activate</li>
          <li>Ask about destinations, budgets, etc.</li>
          <li>Request to open maps, calculators</li>
          <li>Ask for translations</li>
        </ul>
      </div>
    </div>
  );
};

export default SaazVoiceActivation;