# Analytics Dashboard React App

This is a React version of the Streamlit Analytics Dashboard application.

## Features

- Interactive analytics dashboard with key metrics
- Time series and distribution charts
- Detailed data table
- Configurable date range, data source, and regions

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Building for Production

```
npm run build
```

### Docker

To build and run the Docker container:

```
docker build -t analytics-dashboard .
docker run -p 80:80 analytics-dashboard
```

## Deployment

This application can be deployed to AWS using Terraform and ECS.