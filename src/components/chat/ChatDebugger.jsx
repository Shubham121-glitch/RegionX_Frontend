import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ChatDebugger() {
  const [debugInfo, setDebugInfo] = useState({
    businessId: '',
    userId: 'test-user-id',
    status: 'idle',
    results: null,
    error: null
  });

  const testChatFetch = async () => {
    setDebugInfo(prev => ({ ...prev, status: 'loading', error: null, results: null }));
    
    try {
      // Test 1: Validate business ID format
      if (!/^[0-9a-fA-F]{24}$/.test(debugInfo.businessId)) {
        throw new Error('Invalid business ID format. Must be a 24-character hex string.');
      }

      // Test 2: Try to fetch business
      let businessData = null;
      try {
        const businessRes = await axios.get(`${API_URL}/business/${debugInfo.businessId}`);
        businessData = businessRes.data;
      } catch (businessError) {
        console.log('Business fetch result:', businessError.response?.status, businessError.message);
        if (businessError.response?.status === 404) {
          throw new Error(`Business not found (404). The business ID ${debugInfo.businessId} doesn't exist in the database.`);
        }
        throw new Error(`Business fetch failed: ${businessError.message}`);
      }

      // Test 3: Try to fetch/create chat
      const chatRes = await axios.get(`${API_URL}/chat/${debugInfo.businessId}`, {
        params: { userId: debugInfo.userId }
      });

      setDebugInfo(prev => ({
        ...prev,
        status: 'success',
        results: {
          business: businessData,
          chat: chatRes.data.chat,
          messageCount: chatRes.data.messages?.length || 0,
          messages: chatRes.data.messages || []
        },
        error: null
      }));

    } catch (error) {
      setDebugInfo(prev => ({
        ...prev,
        status: 'error',
        error: error.message,
        results: null
      }));
    }
  };

  return (
    <div style={{
      padding: '2rem',
      background: '#f8fafc',
      borderRadius: '0.75rem',
      margin: '1rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2>🔍 Chat Fetching Debugger</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Business ID (24-character hex):
        </label>
        <input
          type="text"
          value={debugInfo.businessId}
          onChange={(e) => setDebugInfo(prev => ({ ...prev, businessId: e.target.value }))}
          placeholder="e.g., 507f1f77bcf86cd799439011"
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #cbd5e1',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          User ID:
        </label>
        <input
          type="text"
          value={debugInfo.userId}
          onChange={(e) => setDebugInfo(prev => ({ ...prev, userId: e.target.value }))}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: '1px solid #cbd5e1',
            fontSize: '1rem'
          }}
        />
      </div>

      <button
        onClick={testChatFetch}
        disabled={debugInfo.status === 'loading' || !debugInfo.businessId}
        style={{
          padding: '0.75rem 1.5rem',
          backgroundColor: '#0891b2',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: debugInfo.status === 'loading' ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          opacity: debugInfo.status === 'loading' ? 0.7 : 1
        }}
      >
        {debugInfo.status === 'loading' ? 'Testing...' : 'Test Chat Fetch'}
      </button>

      {/* Results Display */}
      {debugInfo.status === 'success' && debugInfo.results && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#dcfce7',
          border: '1px solid #86efac',
          borderRadius: '0.5rem'
        }}>
          <h3 style={{ color: '#166534', margin: '0 0 1rem 0' }}>✅ Success!</h3>
          <div>
            <p><strong>Business Found:</strong> {debugInfo.results.business ? 'Yes' : 'No'}</p>
            <p><strong>Chat ID:</strong> {debugInfo.results.chat?._id}</p>
            <p><strong>Business Name:</strong> {debugInfo.results.chat?.businessName}</p>
            <p><strong>Messages:</strong> {debugInfo.results.messageCount}</p>
          </div>
        </div>
      )}

      {debugInfo.status === 'error' && debugInfo.error && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '0.5rem'
        }}>
          <h3 style={{ color: '#b91c1c', margin: '0 0 1rem 0' }}>❌ Error</h3>
          <p style={{ color: '#b91c1c', margin: 0 }}>{debugInfo.error}</p>
        </div>
      )}

      {/* Help Section */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '0.5rem'
      }}>
        <h3 style={{ color: '#1d4ed8', margin: '0 0 1rem 0' }}>💡 Help</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li style={{ marginBottom: '0.5rem' }}>Business ID must be a 24-character hex string</li>
          <li style={{ marginBottom: '0.5rem' }}>Make sure your backend is running on port 5000</li>
          <li style={{ marginBottom: '0.5rem' }}>Check that the business exists in your database</li>
          <li>Open browser console (F12) to see detailed logs</li>
        </ul>
      </div>
    </div>
  );
}

export default ChatDebugger;