import './messageBubble.css';

function MessageBubble({ message, isOwn, userType }) {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'} ${userType}`}>
      <div className="message-content">
        <p className="message-text">{message.message}</p>
        <span className="message-time">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}

export default MessageBubble;
