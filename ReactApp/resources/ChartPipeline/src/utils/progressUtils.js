import AWS from 'aws-sdk';

// Configure AWS SDK with Cognito credentials
AWS.config.update({
  region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID
  })
});

const s3 = new AWS.S3();

/**
 * Get processing progress from S3
 * @param {string} fileId - The file ID to check progress for
 * @returns {Promise<Object>} Progress data
 */
export const getProcessingProgress = async (fileId) => {
  try {
    const bucket = process.env.REACT_APP_S3_BUCKET;
    console.log('🔍 Checking progress for fileId:', fileId, 'in bucket:', bucket);
    
    const params = {
      Bucket: bucket,
      Key: `progress/${fileId}.json`
    };

    const result = await s3.getObject(params).promise();
    const progressData = JSON.parse(result.Body.toString());
    console.log('📊 S3 progress result:', progressData);
    
    return {
      progress: progressData.progress || 0,
      message: progressData.message || 'Processing...',
      timestamp: progressData.timestamp,
      error_details: progressData.error_details || null
    };
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      return {
        progress: 0,
        message: 'Waiting for processing to start...',
        timestamp: new Date().toISOString()
      };
    }
    console.error('Error fetching progress:', error);
    throw error;
  }
};



/**
 * Progress monitoring hook-like function
 * @param {string} fileId - File ID to monitor
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onError - Callback for errors
 * @returns {Object} Control functions
 */
export const createProgressMonitor = (fileId, onProgress, onError) => {
  let pollingInterval = null;
  let isMonitoring = false;

  const startMonitoring = () => {
    if (isMonitoring) return;
    isMonitoring = true;
    startPolling();
  };

  const startPolling = () => {
    console.log('📊 Starting polling for fileId:', fileId);
    
    const poll = async () => {
      try {
        const progressData = await getProcessingProgress(fileId);
        console.log('📈 Polling result:', progressData);
        onProgress(progressData);

        // Stop polling if complete or error
        if (progressData.progress >= 100 || progressData.progress < 0) {
          console.log('✅ Stopping polling - progress complete or error');
          stopMonitoring();
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
        if (onError) {
          onError(error);
        }
      }
    };

    // Initial poll
    poll();
    
    // Set up interval polling
    pollingInterval = setInterval(poll, 2000); // Poll every 2 seconds
    console.log('⏰ Polling interval started');
  };

  const stopMonitoring = () => {
    isMonitoring = false;
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