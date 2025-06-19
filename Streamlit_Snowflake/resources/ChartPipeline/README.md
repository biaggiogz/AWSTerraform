# Pipeline Construction Dashboard

A modular React application for visualizing pipeline construction data with interactive charts and filtering capabilities. This application has been optimized for performance to handle large datasets and provide a smooth user experience without locking the browser.

## Project Structure

```
ChartPipeline/
├── data/                   # Data files
│   ├── pipelinedata.csv    # Pipeline construction data
│   └── test_of_lazos_updated.csv # Loop test progress data
├── public/                 # Static files
│   ├── index.html          # HTML template
│   └── manifest.json       # Web app manifest
├── src/                    # Source code
│   ├── charts/             # Chart components
│   │   ├── LoopTestProgressChart.optimized.js # Optimized chart for loop test progress
│   │   ├── SubsystemComparisonChart.optimized.js # Optimized chart for support vs welding
│   │   └── TestPackProgressChart.optimized.js # Optimized chart for test pack progress
│   ├── components/         # UI components
│   │   ├── FilterPanel.optimized.js # Optimized left-side filter panel
│   │   └── ChartSelector.optimized.js # Optimized tab-based chart selector
│   ├── hooks/              # Custom React hooks
│   │   ├── useDashboardConfig.optimized.js # Hook for dashboard configuration
│   │   └── useDataLoader.optimized.js # Optimized hook for loading data
│   ├── utils/              # Utility functions
│   │   └── dataProcessor.optimized.js # Optimized data processing utilities
│   ├── App.optimized.js    # Optimized main application component
│   └── index.js            # Application entry point with lazy loading
├── Dockerfile              # Docker configuration for containerization
├── nginx.conf              # Nginx configuration for Docker deployment
├── optimization-guide.md   # Guide for performance optimizations
├── optimization-summary.md # Summary of implemented optimizations
└── package.json            # Project dependencies and scripts
```

## Module Purposes

### Data Layer

- **useDataLoader.optimized.js**: Custom hook that handles loading the CSV data, processing it into a usable format, and extracting unique values for filters with optimized performance.
- **dataProcessor.optimized.js**: Optimized utility functions for processing, filtering, and calculating metrics from the raw data.

### UI Components

- **FilterPanel.optimized.js**: Left-side panel with dropdown filters for Design Area and Subsystem, implementing intelligent cross-filtering where selecting one filter affects available options in the other.
- **ChartSelector.optimized.js**: Tab-based interface allowing users to switch between different charts with lazy loading.

### Chart Components

- **SubsystemComparisonChart.optimized.js**: Side-by-side bar chart comparing support installation and welding progress by subsystem.
- **TestPackProgressChart.optimized.js**: Horizontal bar chart showing construction progress for each test pack with color-coded status indicators.
- **LoopTestProgressChart.optimized.js**: Stacked bar chart showing loop test progress by subsystem.

### Main Application

- **App.optimized.js**: Main component that integrates all parts, manages state, and implements the layout with filters on the left and charts on the right.
- **index.js**: Application entry point that renders the App component with lazy loading and configures Chart.js.

## Features

1. **Modular Architecture**: Each component has a single responsibility, making the code maintainable and extensible.
2. **Left-side Filtering**: Filters are positioned on the left side of the layout as required.
3. **Cross-filtering**: All charts respond to the same filter selections.
4. **Intelligent Filter Relationships**: The FilterPanel component shows relationships between areas and subsystems, highlighting and disabling options based on selections.
5. **Tab-based Chart Selection**: Users can switch between charts using tabs, showing one chart at a time as required.
6. **Responsive Design**: Charts adapt to container size for better viewing experience.
7. **Status Indicators**: Test pack progress chart includes visual indicators for progress status.
8. **Performance Optimizations**: Implemented code splitting, lazy loading, memoization, and efficient data processing for improved performance.
9. **Browser Lock Prevention**: Optimized to prevent browser locking with large datasets.

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

## Technologies Used

- **React**: Frontend library for building the user interface
- **Chakra UI**: Component library for consistent styling and UI elements
- **Chart.js & react-chartjs-2**: For creating interactive data visualizations
- **React Select**: For enhanced dropdown components with filtering capabilities
- **React.lazy & Suspense**: For code splitting and lazy loading components
- **useMemo & useCallback**: For memoization and performance optimization

## Performance Optimizations

The application has been optimized for performance in several ways:

### 1. Code Splitting and Lazy Loading
- Components are loaded only when needed using React.lazy and Suspense
- Reduces initial bundle size and improves time-to-interactive
- See `index.js` and `App.optimized.js`

### 2. Memoization
- Expensive calculations are memoized using useMemo and useCallback
- Prevents unnecessary recalculations and reduces re-renders
- Implemented throughout the application in optimized components

### 3. Efficient Data Processing
- Optimized algorithms for data processing
- Reduced unnecessary iterations and improved lookup performance
- See `dataProcessor.optimized.js`

### 4. React Component Optimization
- Used React.memo for pure components
- Optimized rendering cycles
- Implemented proper cleanup functions

### 5. Browser Lock Prevention
- Disabled tooltips by default (enabled on demand)
- Reduced animation duration or disabled for small datasets
- Implemented dynamic chart heights based on data size
- Added virtualization for large lists
- Optimized event handlers with debouncing
- Reduced unnecessary re-renders

For more details on the optimizations and how they were implemented, see the `optimization-summary.md` file.

## Getting Started

### Local Development
1. Place the CSV data files in the `data/` directory:
   - `pipelinedata.csv` for pipeline construction data
   - `test_of_lazos_updated.csv` for loop test progress data
2. Install dependencies: `npm install`
3. Start the development server: `npm start`
4. Build for production: `npm run build`

### Performance Analysis
1. Install development dependencies: `npm install --save-dev webpack-bundle-analyzer source-map-explorer`
2. Add to package.json scripts:
   ```json
   "analyze": "source-map-explorer 'build/static/js/*.js'",
   "profile": "react-scripts start --profile"
   ```
3. Build the app: `npm run build`
4. Analyze bundle size: `npm run analyze`
5. Profile performance: `npm run profile`

### Docker Deployment
1. Ensure your CSV data file is in the `data/pipelinedata.csv` location
2. Build the Docker image: `docker build -t pipeline-dashboard .`
3. Run the container: `docker run -p 80:80 pipeline-dashboard`
4. Access the application at http://localhost:80

### AWS Deployment
1. Navigate to the Terraform directory: `cd /path/to/Terraform/ECS/Streamlit_Snowflake/resources/Infra`
2. Initialize Terraform: `terraform init`
3. Apply the configuration: `terraform apply`
4. Access the application using the CloudFront URL provided in the outputs