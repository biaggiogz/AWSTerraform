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
    
    // Enhanced progress messages based on stage
    let enhancedMessage = progressData.message || 'Processing...';
    const progress = progressData.progress || 0;
    
    if (progress >= 0 && progress < 15) {
      enhancedMessage = 'Initializing Excel processing...';
    } else if (progress >= 15 && progress < 55) {
      enhancedMessage = progressData.message || 'Processing Excel sheets with type inference...';
    } else if (progress >= 55 && progress < 65) {
      enhancedMessage = 'Creating master tables and joining data...';
    } else if (progress >= 65 && progress < 75) {
      enhancedMessage = 'Generating SSM analysis...';
    } else if (progress >= 75 && progress < 98) {
      enhancedMessage = 'Saving processed files to S3...';
    } else if (progress >= 98) {
      enhancedMessage = 'Finalizing processing...';
    }
    
    return {
      progress: progress,
      message: enhancedMessage,
      timestamp: progressData.timestamp,
      stage: getProcessingStage(progress)
    };
  } catch (error) {
    if (error.code === 'NoSuchKey') {
      return {
        progress: 0,
        message: 'Waiting for Python preprocessing to start...',
        timestamp: new Date().toISOString(),
        stage: 'initializing'
      };
    }
    console.error('Error fetching progress:', error);
    throw error;
  }
};

/**
 * Get processing stage based on progress percentage
 * @param {number} progress - Progress percentage
 * @returns {string} Processing stage
 */
const getProcessingStage = (progress) => {
  if (progress < 15) return 'initializing';
  if (progress < 55) return 'processing_sheets';
  if (progress < 65) return 'creating_master';
  if (progress < 75) return 'ssm_analysis';
  if (progress < 98) return 'saving_files';
  if (progress >= 100) return 'completed';
  return 'finalizing';
};



// Processing stage descriptions for better UX
export const PROCESSING_STAGES = {
  initializing: 'Initializing processing pipeline...',
  processing_sheets: 'Processing Excel sheets with intelligent type inference...',
  creating_master: 'Creating master tables and joining datasets...',
  ssm_analysis: 'Generating SSM analysis and progress calculations...',
  saving_files: 'Saving processed data to cloud storage...',
  finalizing: 'Finalizing and preparing results...',
  completed: 'Processing completed successfully!'
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
  let lastProgress = 0;

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
        
        // Update last progress for comparison
        if (progressData.progress > lastProgress) {
          lastProgress = progressData.progress;
        }
        
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
    
    // Dynamic polling interval based on progress stage
    const getPollingInterval = () => {
      if (lastProgress < 20) return 3000; // 3s during initial processing
      if (lastProgress < 60) return 2000; // 2s during sheet processing
      if (lastProgress < 80) return 1500; // 1.5s during master table creation
      return 1000; // 1s during final stages
    };
    
    // Set up interval polling with dynamic timing
    const scheduleNextPoll = () => {
      if (isMonitoring) {
        pollingInterval = setTimeout(() => {
          poll().then(scheduleNextPoll);
        }, getPollingInterval());
      }
    };
    
    scheduleNextPoll();
    console.log('⏰ Dynamic polling started');
  };

  const stopMonitoring = () => {
    isMonitoring = false;
    if (pollingInterval) {
      clearTimeout(pollingInterval);
      pollingInterval = null;
    }
    lastProgress = 0;
  };

  return {
    start: startMonitoring,
    stop: stopMonitoring,
    isMonitoring: () => isMonitoring,
    getLastProgress: () => lastProgress
  };
};