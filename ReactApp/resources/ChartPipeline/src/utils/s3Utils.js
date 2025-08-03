import AWS from 'aws-sdk';

// Configure AWS SDK with temporary credentials
const configureAWS = () => {
  AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID
    })
  });
};

export const uploadFileToS3 = async (file, fileName) => {
  try {
    configureAWS();
    const s3 = new AWS.S3();
    const bucketName = process.env.REACT_APP_S3_BUCKET;
    
    if (!bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const key = `rawDataset/${fileName}`;
    
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: file.type
    };

    const result = await s3.upload(uploadParams).promise();
    
    return {
      success: true,
      key: result.Key,
      url: result.Location
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

export const deleteFileFromS3 = async (fileName) => {
  try {
    configureAWS();
    const s3 = new AWS.S3();
    const bucketName = process.env.REACT_APP_S3_BUCKET;
    
    if (!bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const key = `rawDataset/${fileName}`;
    
    const deleteParams = {
      Bucket: bucketName,
      Key: key
    };

    await s3.deleteObject(deleteParams).promise();
    
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

export const downloadFileFromS3 = async (key) => {
  try {
    configureAWS();
    const s3 = new AWS.S3();
    const bucketName = process.env.REACT_APP_S3_BUCKET;
    
    if (!bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const params = {
      Bucket: bucketName,
      Key: key
    };

    const result = await s3.getObject(params).promise();
    return result.Body.toString('utf-8');
  } catch (error) {
    console.error('S3 download error:', error);
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

export const listS3Objects = async (prefix) => {
  try {
    configureAWS();
    const s3 = new AWS.S3();
    const bucketName = process.env.REACT_APP_S3_BUCKET;
    
    if (!bucketName) {
      throw new Error('S3 bucket not configured');
    }

    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      MaxKeys: 100
    };

    const result = await s3.listObjectsV2(params).promise();
    return result.Contents || [];
  } catch (error) {
    console.error('S3 list error:', error);
    throw new Error(`Failed to list files: ${error.message}`);
  }
};