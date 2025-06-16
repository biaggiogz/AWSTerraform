# Pipeline Construction Progress Dashboard

This React application displays interactive charts for pipeline construction progress data fetched from an S3 bucket.

## Features

- Interactive charts using Recharts
- Data fetched from S3 bucket (react-pipelinetechnip-2025/datasource/pipelinedata.csv)
- Filtering by Design Area, Fluido, and Train
- Responsive design

## Charts

1. Overall Progress Bar Chart
2. Fluido Distribution Pie Chart
3. Weld Distribution Pie Chart

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start
```

## Production Build

```bash
# Build the app
npm run build

# Run with Docker
docker-compose up --build
```