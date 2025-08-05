import AWS from 'aws-sdk';

// Configure AWS SDK
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
});

/**
 * Get processing progress from DynamoDB
 * @param {string} fileId - The file ID to check progress for
 * @returns {Promise<Object>} Progress data
 */
export const getProcessingProgress = async (fileId) => {
  try {
    const params = {
      TableName: process.env.REACT_APP_PROGRESS_TABLE || 'file-processing-progress',
      Key: {
        file_id: fileId
      }
    };

    const result = await dynamodb.get(params).promise();
    
    if (result.Item) {
      return {
        progress: result.Item.progress || 0,
        message: result.Item.message || 'Processing...',
        timestamp: result.Item.timestamp
      };
    }
    
    return {
      progress: 0,
      message: 'Waiting for processing to start...',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching progress:', error);
    throw error;
  }
};

/**
 * WebSocket connection for real-time progress updates
 */
export class ProgressWebSocket {
  constructor(fileId, onProgress, onError) {
    this.fileId = fileId;
    this.onProgress = onProgress;
    this.onError = onError;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    try {
      const wsEndpoint = process.env.REACT_APP_WEBSOCKET_ENDPOINT;
      if (!wsEndpoint) {
        console.warn('WebSocket endpoint not configured, falling back to polling');
        return false;
      }

      this.ws = new WebSocket(wsEndpoint);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected for file:', this.fileId);
        this.reconnectAttempts = 0;
        
        // Send subscription message
        this.ws.send(JSON.stringify({
          action: 'subscribe',
          file_id: this.fileId
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress' && data.file_id === this.fileId) {
            this.onProgress({
              progress: data.progress,
              message: data.message,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onError) {
          this.onError(error);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      return false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect();
      }, 2000 * this.reconnectAttempts); // Exponential backoff
    } else {
      console.log('Max WebSocket reconnect attempts reached');
      if (this.onError) {
        this.onError(new Error('WebSocket connection failed'));
      }
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

/**
 * Progress monitoring hook-like function
 * @param {string} fileId - File ID to monitor
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onError - Callback for errors
 * @returns {Object} Control functions
 */
export const createProgressMonitor = (fileId, onProgress, onError) => {
  let wsConnection = null;
  let pollingInterval = null;
  let isMonitoring = false;

  const startMonitoring = () => {
    if (isMonitoring) return;
    isMonitoring = true;

    // Try WebSocket first
    wsConnection = new ProgressWebSocket(fileId, onProgress, onError);
    const wsConnected = wsConnection.connect();

    // Fallback to polling if WebSocket fails
    if (!wsConnected) {
      console.log('Falling back to polling for progress updates');
      startPolling();
    }
  };

  const startPolling = () => {
    const poll = async () => {
      try {
        const progressData = await getProcessingProgress(fileId);
        onProgress(progressData);

        // Stop polling if complete or error
        if (progressData.progress >= 100 || progressData.progress < 0) {
          stopMonitoring();
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    // Initial poll
    poll();
    
    // Set up interval polling
    pollingInterval = setInterval(poll, 2000); // Poll every 2 seconds
  };

  const stopMonitoring = () => {
    isMonitoring = false;
    
    if (wsConnection) {
      wsConnection.disconnect();
      wsConnection = null;
    }
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  return {
    start: startMonitoring,
    stop: stopMonitoring,
    isMonitoring: () => isMonitoring
  };
};