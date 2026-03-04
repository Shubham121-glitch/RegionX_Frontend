import './chatNotificationBadge.css';

function ChatNotificationBadge({ count = 0, isVisible = true }) {
  if (!isVisible || count === 0) return null;

  return (
    <div className="chat-notification-badge">
      {count > 99 ? '99+' : count}
    </div>
  );
}

export default ChatNotificationBadge;
