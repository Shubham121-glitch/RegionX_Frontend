import React, { useState } from 'react';

const SaazTranslator = ({ onClose }) => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ];

  const mockTranslate = () => {
    // In a real implementation, this would call a translation API
    // For demo purposes, we'll just reverse the text
    setTranslatedText(sourceText.split('').reverse().join(''));
  };

  const swapLanguages = () => {
    const tempLang = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const clearText = () => {
    setSourceText('');
    setTranslatedText('');
  };

  return (
    <div className="saaz-modal-overlay" onClick={onClose}>
      <div className="saaz-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="saaz-modal-header">
          <h2>🌐 AI Translator</h2>
          <button className="saaz-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="saaz-translator-content">
          <div className="saaz-language-selectors">
            <div className="saaz-lang-selector">
              <label>From:</label>
              <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
            
            <button className="saaz-swap-btn" onClick={swapLanguages}>🔄</button>
            
            <div className="saaz-lang-selector">
              <label>To:</label>
              <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>{lang.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="saaz-translation-inputs">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
              className="saaz-source-textarea"
            />
            
            <div className="saaz-translation-controls">
              <button className="saaz-translate-btn" onClick={mockTranslate}>Translate</button>
              <button className="saaz-clear-btn" onClick={clearText}>Clear</button>
            </div>
            
            <textarea
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
              className="saaz-target-textarea"
            />
          </div>
          
          <div className="saaz-translation-tips">
            <h4>Translation Tips:</h4>
            <ul>
              <li>Speak clearly and at a moderate pace</li>
              <li>Use simple sentences for better accuracy</li>
              <li>Consider cultural context in translations</li>
              <li>Verify important information with native speakers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaazTranslator;