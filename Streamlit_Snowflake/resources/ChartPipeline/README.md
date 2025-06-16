# Pipeline Construction Dashboard

A modular React application for visualizing pipeline construction data with interactive charts and filtering capabilities.

## Project Structure

```
ChartPipeline/
├── data/                   # Data files
│   └── pipelinedata.csv    # Pipeline construction data
├── public/                 # Static files
│   ├── index.html          # HTML template
│   └── manifest.json       # Web app manifest
├── src/                    # Source code
│   ├── charts/             # Chart components
│   │   ├── WeldingProgressChart.js        # Chart A: Welding progress by area
│   │   ├── SubsystemComparisonChart.js    # Chart B: Support vs welding by subsystem
│   │   └── TestPackProgressChart.js       # Chart C: Test pack progress with status icons
│   ├── components/         # UI components
│   │   ├── FilterPanel.js  # Left-side filter panel
│   │   └── ChartSelector.js # Tab-based chart selector
│   ├── hooks/              # Custom React hooks
│   │   └── useDataLoader.js # Hook for loading and processing CSV data
│   ├── utils/              # Utility functions
│   │   └── dataProcessor.js # Data processing utilities
│   ├── App.js              # Main application component
│   └── index.js            # Application entry point
├── Dockerfile              # Docker configuration for containerization
└── package.json            # Project dependencies and scripts
```

## Module Purposes

### Data Layer

- **useDataLoader.js**: Custom hook that handles loading the CSV data, processing it into a usable format, and extracting unique values for filters.
- **dataProcessor.js**: Utility functions for processing, filtering, and calculating metrics from the raw data.

### UI Components

- **FilterPanel.js**: Left-side panel with dropdown filters for Design Area, Subsystem, and Test Pack, implementing requirement A.
- **ChartSelector.js**: Tab-based interface allowing users to switch between different charts, implementing requirement C.

### Chart Components

- **WeldingProgressChart.js**: Bar chart showing welding progress by design area.
- **SubsystemComparisonChart.js**: Side-by-side bar chart comparing support installation and welding progress by subsystem.
- **TestPackProgressChart.js**: Horizontal bar chart showing construction progress for each test pack with color-coded status indicators.

### Main Application

- **App.js**: Main component that integrates all parts, manages state, and implements the layout with filters on the left and charts on the right.
- **index.js**: Application entry point that renders the App component and configures Chart.js.

## Features

1. **Modular Architecture**: Each component has a single responsibility, making the code maintainable and extensible.
2. **Left-side Filtering**: Filters are positioned on the left side of the layout as required.
3. **Cross-filtering**: All charts respond to the same filter selections, implementing requirement B.
4. **Tab-based Chart Selection**: Users can switch between charts using tabs, showing one chart at a time as required.
5. **Responsive Design**: Charts adapt to container size for better viewing experience.
6. **Status Indicators**: Test pack progress chart includes visual indicators for progress status.

## Data Processing

The application processes the pipeline data to calculate the following metrics:

1. **By Design Area**:
   - Total Welding Scope
   - Welding Completed
   - Welding Progress Ratio
   - Support Installation Progress
   - Construction Progress

2. **By Subsystem**:
   - Support Installation Progress vs Welding Progress

3. **By Test Pack**:
   - Construction Coordination Progress with status indicators

## Getting Started

### Local Development
1. Place the CSV data file in the `data/pipelinedata.csv` directory
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Build for production: `npm run build`

### Docker Deployment
1. Ensure your CSV data file is in the `data/pipelinedata.csv` location
2. Build the Docker image: `docker build -t pipeline-dashboard .`
3. Run the container: `docker run -p 80:80 pipeline-dashboard`
4. Access the application at http://localhost:80

### Data File Configuration
The Dockerfile automatically copies the CSV data file from `data/pipelinedata.csv` to all necessary locations:
- `/app/public/data/pipelinedata.csv` (for development)
- `/app/build/pipelinedata.csv` (for production root access)
- `/app/build/data/pipelinedata.csv` (for production with path)

The application is configured to find the data file in the appropriate location based on the environment.