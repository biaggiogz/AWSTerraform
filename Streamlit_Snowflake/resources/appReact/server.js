const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS
app.use(cors());

// Serve static files from the React build
app.use(express.static(path.join(__dirname, 'build')));

// S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Route to get CSV data
app.get('/api/pipelinedata', async (req, res) => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'react-pipelinetechnip',
      Key: 'datasource/pipelinedata.csv'
    });
    
    const response = await s3Client.send(command);
    const streamToString = async (stream) => {
      const chunks = [];
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks).toString('utf-8');
    };
    
    const csvData = await streamToString(response.Body);
    res.set('Content-Type', 'text/csv');
    res.send(csvData);
  } catch (error) {
    console.error('Error fetching from S3:', error);
    res.status(500).send('Error fetching data');
  }
});

// All other GET requests not handled before will return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});