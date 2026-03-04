// Text-to-Speech Service for Saaz AI Chatbot
class TextToSpeechService {
  constructor() {
    this.isSupported = 'speechSynthesis' in window;
    this.isPlaying = false;
    this.queue = [];
    this.voice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 1.0;
    
    if (this.isSupported) {
      // Initial load of voices
      this.loadVoices();
      
      // Listen for voices changed event (may fire multiple times)
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
      
      // As a backup, try to load voices after a brief delay
      setTimeout(() => {
        if (!this.voice) {
          this.loadVoices();
        }
      }, 500);
    }
  }

  // Load available voices
  loadVoices() {
    if (!this.isSupported) return;
    
    // In some browsers, voices might not be available immediately
    const voices = speechSynthesis.getVoices();
    
    if (voices.length === 0) {
      // If no voices are available, we'll try to populate them by calling speak() with a dummy utterance
      // This is a workaround for Chrome's restriction
      const dummyUtterance = new SpeechSynthesisUtterance('');
      speechSynthesis.speak(dummyUtterance);
      return;
    }
    
    // Prefer English voices
    const englishVoices = voices.filter(voice => 
      voice.lang.startsWith('en') || voice.lang.startsWith('hi') // English or Hindi for India
    );
    
    // Set the first English voice as default, or first available
    this.voice = englishVoices[0] || voices[0];
  }

  // Speak the given text
  async speak(text) {
    console.log('TTS speak called with text:', text); // Debug log
    
    if (!this.isSupported) {
      console.warn('Text-to-speech not supported in this browser');
      return Promise.resolve();
    }

    if (!text) {
      console.warn('Empty text provided to speak function');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        // Cancel any ongoing speech
        if (this.isPlaying) {
          speechSynthesis.cancel();
          this.isPlaying = false;
          console.log('Cancelled ongoing speech'); // Debug log
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Configure utterance properties
        // If voice is not available, try to load it again
        if (!this.voice) {
          console.log('No voice available, attempting to load voices'); // Debug log
          this.loadVoices();
        }
        // Set voice only if it's available, otherwise use default
        if (this.voice) {
          utterance.voice = this.voice;
          console.log('Using voice:', this.voice.name); // Debug log
        } else {
          console.log('No voice available, proceeding without voice setting'); // Debug log
        }
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.volume = this.volume;
        
        // Event handlers
        utterance.onstart = () => {
          console.log('Speech started'); // Debug log
          this.isPlaying = true;
        };
        
        utterance.onend = () => {
          console.log('Speech ended'); // Debug log
          this.isPlaying = false;
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error('Speech error:', event); // Debug log
          this.isPlaying = false;
          // Some browsers may not allow speech synthesis without user interaction
          // In such cases, we'll resolve anyway to avoid hanging
          resolve();
        };
        
        // Speak the text
        console.log('About to speak text:', text); // Debug log
        speechSynthesis.speak(utterance);
        
        // Check if speech was actually queued
        if (speechSynthesis.speaking) {
          console.log('Speech successfully queued'); // Debug log
        } else {
          console.warn('Speech was not queued - this may indicate a browser security restriction'); // Debug log
        }
      } catch (error) {
        console.error('Error in speech synthesis:', error);
        // Even if there's an error, resolve to prevent hanging
        resolve();
      }
    });
  }

  // Stop current speech
  stop() {
    if (this.isSupported) {
      speechSynthesis.cancel();
      this.isPlaying = false;
    }
  }

  // Pause current speech (not universally supported)
  pause() {
    if (this.isSupported) {
      speechSynthesis.pause();
    }
  }

  // Resume paused speech (not universally supported)
  resume() {
    if (this.isSupported) {
      speechSynthesis.resume();
    }
  }

  // Queue text to be spoken after current speech ends
  queueSpeak(text) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        text,
        resolve,
        reject
      });
      
      // Process the queue if not already processing
      if (!this.isPlaying && this.queue.length === 1) {
        this.processQueue();
      }
    });
  }

  // Process the speech queue
  async processQueue() {
    if (this.queue.length === 0) return;
    
    const { text, resolve, reject } = this.queue.shift();
    
    try {
      await this.speak(text);
      resolve();
    } catch (error) {
      reject(error);
    }
    
    // Process next item in queue
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  // Set speech parameters
  setParameters(rate = 1.0, pitch = 1.0, volume = 1.0) {
    this.rate = Math.max(0.1, Math.min(10, rate)); // Clamp between 0.1 and 10
    this.pitch = Math.max(0, Math.min(2, pitch)); // Clamp between 0 and 2
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
  }

  // Set voice by language or name
  setVoice(langOrName) {
    if (!this.isSupported) return false;
    
    const voices = speechSynthesis.getVoices();
    const selectedVoice = voices.find(voice => 
      voice.lang.includes(langOrName) || voice.name.includes(langOrName)
    );
    
    if (selectedVoice) {
      this.voice = selectedVoice;
      return true;
    }
    
    return false;
  }

  // Get available voices
  getAvailableVoices() {
    if (!this.isSupported) return [];
    return speechSynthesis.getVoices();
  }

  // Check if currently speaking
  isCurrentlySpeaking() {
    return this.isPlaying;
  }

  // Get the current speech state
  getSpeechState() {
    return {
      isSupported: this.isSupported,
      isPlaying: this.isPlaying,
      queueLength: this.queue.length,
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume
    };
  }

  // Speak with interruption (stop current speech and speak new text)
  speakWithInterruption(text) {
    this.stop();
    return this.speak(text);
  }
  
  // Initialize speech synthesis - may be needed after user interaction
  initialize() {
    if (this.isSupported) {
      // Trigger voices to load by creating a dummy utterance
      const dummyUtterance = new SpeechSynthesisUtterance('');
      speechSynthesis.speak(dummyUtterance);
      this.loadVoices();
    }
  }
}

// Export singleton instance
const textToSpeechService = new TextToSpeechService();
export default textToSpeechService;