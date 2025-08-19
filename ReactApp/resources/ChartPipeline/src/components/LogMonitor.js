import React, { useState, useEffect } from 'react';
import { CloudWatchLogsClient, GetLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';

const LogMonitor = ({ fileId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cloudWatchClient = new CloudWatchLogsClient({
    region: process.env.REACT_APP_AWS_REGION,
    credentials: fromCognitoIdentityPool({
      client: new CognitoIdentityClient({ region: process.env.REACT_APP_AWS_REGION }),
      identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
    }),
  });

  const fetchLogs = async () => {
    if (!fileId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const command = new GetLogEventsCommand({
        logGroupName: `/aws/lambda/${process.env.REACT_APP_LAMBDA_PREFIX}-python-preprocessor`,
        logStreamName: 'processing-stream',
        startTime: Date.now() - 3600000, // Last hour
        filterPattern: fileId
      });
      
      const response = await cloudWatchClient.send(command);
      setLogs(response.events || []);
    } catch (err) {
      setError(`Failed to fetch logs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fileId) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [fileId]);

  const getLogLevel = (message) => {
    if (message.includes('ERROR') || message.includes('❌')) return 'error';
    if (message.includes('WARNING') || message.includes('⚠️')) return 'warning';
    if (message.includes('INFO') || message.includes('🚀') || message.includes('📊')) return 'info';
    return 'default';
  };

  return (
    <div className="log-monitor">
      <h3>Processing Logs {fileId && `for ${fileId}`}</h3>
      
      {loading && <div>Loading logs...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      <div className="logs-container" style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {logs.length === 0 && !loading && (
          <div>No logs found for this file.</div>
        )}
        
        {logs.map((log, index) => (
          <div 
            key={index} 
            className={`log-entry ${getLogLevel(log.message)}`}
            style={{
              padding: '5px',
              marginBottom: '5px',
              backgroundColor: getLogLevel(log.message) === 'error' ? '#ffebee' : 
                             getLogLevel(log.message) === 'warning' ? '#fff3e0' : 
                             getLogLevel(log.message) === 'info' ? '#e8f5e8' : '#f5f5f5',
              borderLeft: `4px solid ${getLogLevel(log.message) === 'error' ? '#f44336' : 
                                     getLogLevel(log.message) === 'warning' ? '#ff9800' : 
                                     getLogLevel(log.message) === 'info' ? '#4caf50' : '#9e9e9e'}`
            }}
          >
            <small>{new Date(log.timestamp).toLocaleString()}</small>
            <div>{log.message}</div>
          </div>
        ))}
      </div>
      
      <button onClick={fetchLogs} disabled={loading} style={{ marginTop: '10px' }}>
        Refresh Logs
      </button>
    </div>
  );
};

export default LogMonitor;