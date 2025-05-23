import React, { useState, useEffect, useCallback } from 'react';
import { createStreamingParser } from 'llm-json-validator';

// Example React component for streaming LLM responses
function StreamingChatComponent() {
  const [response, setResponse] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [parser] = useState(() => createStreamingParser({ 
    returnParsedJson: true,
    balanceQuotes: true 
  }));

  // Simulate streaming from an LLM API
  const simulateStreaming = useCallback(() => {
    setIsStreaming(true);
    parser.reset(); // Reset parser for new stream

    // Simulate chunks coming from an LLM API
    const chunks = [
      '{"message": "',
      'Hello! I can help you with ',
      'various tasks like coding, ',
      'writing, and analysis.",',
      ' "suggestions": [',
      '"Ask me a question",',
      ' "Share some code",',
      ' "Get writing help"',
      '], "timestamp": "',
      new Date().toISOString(),
      '", "ready": true}'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < chunks.length) {
        const chunk = chunks[index];
        const currentData = parser.appendChunk(chunk);
        
        // Update state with the current parsed data
        if (typeof currentData === 'object') {
          setResponse(currentData);
        }
        
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 200); // Send a chunk every 200ms

    return () => clearInterval(interval);
  }, [parser]);

  // Simulate error handling and recovery
  const handleErrorRecovery = useCallback(() => {
    setIsStreaming(true);
    parser.reset();

    // Simulate a malformed stream that gets corrected
    const chunks = [
      '{"status": "processing',  // Missing quote
      '", "data": {',
      '"progress": 0.5,',
      ' "message": "Working on it...',  // Another missing quote
      '", "eta": "2 minutes"',
      '}}'
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < chunks.length) {
        const chunk = chunks[index];
        const currentData = parser.appendChunk(chunk);
        
        if (typeof currentData === 'object') {
          setResponse(currentData);
        }
        
        index++;
      } else {
        clearInterval(interval);
        setIsStreaming(false);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [parser]);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>LLM Streaming JSON Parser Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={simulateStreaming} 
          disabled={isStreaming}
          style={{ 
            marginRight: '10px', 
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isStreaming ? 'not-allowed' : 'pointer'
          }}
        >
          {isStreaming ? 'Streaming...' : 'Start Normal Stream'}
        </button>
        
        <button 
          onClick={handleErrorRecovery} 
          disabled={isStreaming}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isStreaming ? 'not-allowed' : 'pointer'
          }}
        >
          {isStreaming ? 'Streaming...' : 'Test Error Recovery'}
        </button>
      </div>

      {isStreaming && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <strong>Status:</strong> Receiving streaming data...
        </div>
      )}

      {response && (
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '5px', 
          padding: '15px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3>Current Response:</h3>
          
          {response.message && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Message:</strong> {response.message}
            </div>
          )}
          
          {response.suggestions && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Suggestions:</strong>
              <ul>
                {response.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          {response.data && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Data:</strong>
              <div style={{ 
                backgroundColor: '#e9ecef', 
                padding: '10px', 
                borderRadius: '3px',
                marginTop: '5px'
              }}>
                <div>Progress: {Math.round((response.data.progress || 0) * 100)}%</div>
                {response.data.message && <div>Message: {response.data.message}</div>}
                {response.data.eta && <div>ETA: {response.data.eta}</div>}
              </div>
            </div>
          )}
          
          {response.timestamp && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Timestamp:</strong> {new Date(response.timestamp).toLocaleString()}
            </div>
          )}
          
          {response.ready !== undefined && (
            <div style={{ marginBottom: '15px' }}>
              <strong>Ready:</strong> {response.ready ? '✅' : '⏳'}
            </div>
          )}

          <details style={{ marginTop: '20px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Raw JSON (click to expand)
            </summary>
            <pre style={{ 
              backgroundColor: '#f1f1f1', 
              padding: '10px', 
              borderRadius: '3px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        backgroundColor: '#f0f8ff', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>How it works:</h4>
        <ul>
          <li>The parser receives streaming chunks from an LLM API</li>
          <li>Each chunk is automatically balanced and parsed</li>
          <li>React state is updated with valid JSON objects in real-time</li>
          <li>Missing quotes and brackets are automatically handled</li>
          <li>No need to manually call JSON.parse() - you get ready-to-use objects!</li>
        </ul>
      </div>
    </div>
  );
}

export default StreamingChatComponent;

// Example usage in your app:
// 
// import StreamingChatComponent from './StreamingChatComponent';
// 
// function App() {
//   return (
//     <div className="App">
//       <StreamingChatComponent />
//     </div>
//   );
// } 