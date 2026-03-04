import './typingIndicator.css';

function TypingIndicator() {
  return (
    <div className="typing-indicator-wrapper other">
      <div className="typing-indicator">
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
        <div className="typing-dot"></div>
      </div>
      <span className="typing-text">is typing...</span>
    </div>
  );
}

export default TypingIndicator;
