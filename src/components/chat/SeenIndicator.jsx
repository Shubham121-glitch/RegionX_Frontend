import './seenIndicator.css';

function SeenIndicator({ seen, seenAt }) {
  if (!seen) {
    return <div className="seen-indicator pending">✓</div>;
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'seen';
    const date = new Date(timestamp);
    return `seen ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;
  };

  return (
    <div className="seen-indicator seen" title={formatTime(seenAt)}>
      ✓✓
    </div>
  );
}

export default SeenIndicator;
