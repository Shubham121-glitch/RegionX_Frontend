import { useState, useEffect, useCallback, useRef } from 'react';
import voiceProcessor from '../components/ai-services/voiceProcessor';
import intentMapper from '../components/ai-services/intentMapper';

const useSaazVoice = (onWakeWordDetected) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const onWakeWordDetectedRef = useRef(onWakeWordDetected);

  // Update the ref when onWakeWordDetected changes
  useEffect(() => {
    onWakeWordDetectedRef.current = onWakeWordDetected;
  }, [onWakeWordDetected]);

  // Detect wake word "Hey Saaz"
  const detectWakeWord = useCallback((text) => {
    if (!text) return false;
    
    const lowerText = text.toLowerCase().trim();
    
    // More flexible wake word detection with common variations
    const wakeWords = [
      'hey saaz',
      'hi saaz', 
      'hai saaz',
      'hay saaz',
      'he saaz',
      'hello saaz',
      'hey sa az',
      'hi sa az'
    ];
    
    return wakeWords.some(wakeWord => lowerText.includes(wakeWord));
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech Recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognitionInstance;
    
    try {
      recognitionInstance = new SpeechRecognition();
    } catch (err) {
      console.error('Error creating speech recognition instance:', err);
      setError('Failed to initialize speech recognition. Your browser may not fully support this feature.');
      return;
    }
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event) => {
      console.log('Speech recognition result received:', event); // Debug log
      
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log('Speech transcript:', transcript, 'isFinal:', event.results[i].isFinal); // Debug log
        
        if (event.results[i].isFinal) {
          setFinalTranscript(prev => prev + transcript + ' ');
          setTranscript('');
          console.log('Final transcript set:', transcript); // Debug log
        } else {
          interimTranscript += transcript;
        }
      }
      setTranscript(interimTranscript);
      console.log('Current interim transcript:', interimTranscript); // Debug log
      
      // Also check for wake word in the interim transcript
      if (interimTranscript) {
        const detected = detectWakeWord(interimTranscript);
        if (detected) {
          console.log('Wake word detected in interim transcript:', interimTranscript); // Debug log
          // Call the callback if provided
          if (onWakeWordDetectedRef.current && typeof onWakeWordDetectedRef.current === 'function') {
            onWakeWordDetectedRef.current(interimTranscript);
          }
        }
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event); // Debug log
      
      // Handle different types of errors
      let errorMessage = '';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone found or microphone access blocked. Please check your device settings.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone permission in your browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
        case 'other':
          errorMessage = 'An unknown error occurred with speech recognition.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error || 'Unknown error'}`;
      }
      
      setError(errorMessage);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      console.log('Speech recognition ended'); // Debug log
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    // Cleanup function
    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.stop();
        } catch (err) {
          console.error('Error stopping recognition:', err);
        }
      }
    };
  }, [detectWakeWord]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognition) {
      setError('Speech recognition not supported in this browser');
      setIsListening(false);
      return;
    }
  
    try {
      recognition.start();
      setIsListening(true);
      setError(null);
      console.log('Speech recognition started successfully'); 
    } catch (err) {
      console.error('Microphone access error:', err);
      // If it's already started, recognition.start() throws an InvalidStateError
      if (err.name === 'InvalidStateError') {
        setIsListening(true);
        setError(null);
      } else if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        setError('Microphone access denied. Please allow microphone permission in your browser settings.');
        setIsListening(false);
      } else {
        setError('Could not access microphone. Please check your device settings.');
        setIsListening(false);
      }
    }
  }, [recognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.stop();
        setIsListening(false);
        console.log('Speech recognition stopped'); // Debug log
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  }, [recognition]);

  // Toggle listening state
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Process voice command
  const processVoiceCommand = useCallback(async (command, onResult) => {
    if (!command) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Process the command using voice processor
      voiceProcessor.processCommand(command, (parsedCommand) => {
        // Map the intent to an action
        try {
          const mappedAction = intentMapper.mapIntent(parsedCommand);
          
          // Execute the action
          mappedAction.execute();
          
          // Call the result handler
          if (onResult && typeof onResult === 'function') {
            onResult({
              success: true,
              command: parsedCommand,
              action: mappedAction,
              message: `Executed: ${mappedAction.action}`
            });
          }
        } catch (mappingError) {
          console.error('Intent mapping error:', mappingError);
          if (onResult && typeof onResult === 'function') {
            onResult({
              success: false,
              error: mappingError.message,
              command: parsedCommand
            });
          }
        }
      });
    } catch (error) {
      console.error('Voice command processing error:', error);
      setError(error.message);
      if (onResult && typeof onResult === 'function') {
        onResult({
          success: false,
          error: error.message
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Get current speech state
  const getSpeechState = useCallback(() => {
    return {
      isListening,
      isProcessing,
      transcript: finalTranscript + transcript,
      interimTranscript: transcript,
      finalTranscript: finalTranscript,
      hasError: !!error,
      error
    };
  }, [isListening, isProcessing, transcript, finalTranscript, error]);

  // Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
  }, []);

  return {
    isListening,
    isProcessing,
    transcript: finalTranscript + transcript,
    interimTranscript: transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    toggleListening,
    processVoiceCommand,
    detectWakeWord,
    getSpeechState,
    clearTranscript
  };
};

export default useSaazVoice;