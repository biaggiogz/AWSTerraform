# Pipeline Construction Dashboard

A modular React application for visualizing pipeline construction data with interactive charts and filtering capabilities. This application has been optimized for performance to handle large datasets and provide a smooth user experience.

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
│   │   ├── LoopTestProgressChart.js        # Chart for loop test progress
│   │   ├── LoopTestProgressChart.optimized.js # Optimized version
│   │   ├── SubsystemComparisonChart.js     # Chart for support vs welding by subsystem
│   │   ├── SubsystemComparisonChart.optimized.js # Optimized version
│   │   ├── TestPackProgressChart.js        # Chart for test pack progress with status icons
│   │   └── TestPackProgressChart.optimized.js # Optimized version
│   ├── components/         # UI components
│   │   ├── FilterPanel.js  # Left-side filter panel
│   │   ├── FilterPanel.optimized.js # Optimized version
│   │   ├── ChartSelector.js # Tab-based chart selector
│   │   └── ChartSelector.optimized.js # Optimized version
│   ├── hooks/              # Custom React hooks
│   │   ├── useDashboardConfig.js # Hook for dashboard configuration
│   │   ├── useDataLoader.js # Hook for loading and processing CSV data
│   │   └── useDataLoader.optimized.js # Optimized version
│   ├── utils/              # Utility functions
│   │   ├── dataProcessor.js # Data processing utilities
│   │   └── dataProcessor.optimized.js # Optimized version
│   ├── App.js              # Main application component
│   ├── App.optimized.js    # Optimized version with code splitting
│   └── index.js            # Application entry point
├── Dockerfile              # Docker configuration for containerization
├── nginx.conf              # Nginx configuration for Docker deployment
├── optimization-guide.md   # Guide for performance optimizations
├── implementation-plan.md  # Plan for implementing optimizations
└── package.json            # Project dependencies and scripts
```

## Module Purposes

### Data Layer

- **useDataLoader.js**: Custom hook that handles loading the CSV data, processing it into a usable format, and extracting unique values for filters.
- **dataProcessor.js**: Utility functions for processing, filtering, and calculating metrics from the raw data.

### UI Components

- **FilterPanel.js**: Left-side panel with dropdown filters for Design Area and Subsystem, implementing intelligent cross-filtering where selecting one filter affects available options in the other.
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
4. **Intelligent Filter Relationships**: The FilterPanel component shows relationships between areas and subsystems, highlighting and disabling options based on selections.
5. **Tab-based Chart Selection**: Users can switch between charts using tabs, showing one chart at a time as required.
6. **Responsive Design**: Charts adapt to container size for better viewing experience.
7. **Status Indicators**: Test pack progress chart includes visual indicators for progress status.
8. **Performance Optimizations**: Implemented code splitting, lazy loading, memoization, and efficient data processing for improved performance.

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

## Deployment Pipeline

The application is deployed using AWS infrastructure provisioned with Terraform:

1. **Build Process**:
   - The React application is built using `npm run build`
   - Build artifacts are generated in the `build/` directory

2. **AWS Infrastructure**:
   - **S3 Bucket**: Hosts the static React application files
   - **CloudFront Distribution**: Provides CDN capabilities and HTTPS
   - **Bucket Policy**: Configured to allow public read access for web hosting

3. **Deployment Flow**:
   - Terraform creates necessary AWS resources
   - A null_resource provisioner builds the React app and syncs it to S3
   - CloudFront distribution is configured to serve the S3 website content
   - SPA routing is handled by custom error responses redirecting to index.html

4. **CI/CD Integration**:
   - The deployment is triggered by changes to the application source code
   - Source code changes are detected using an MD5 hash of the archived application

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

### Data File Configuration
The Dockerfile automatically copies the CSV data files from the `data/` directory to all necessary locations:
- `/app/public/data/` (for development)
- `/app/build/` (for production root access)
- `/app/build/data/` (for production with path)

The application is configured to find the data files in the appropriate location based on the environment.

## Performance Optimizations

The application has been optimized for performance in several ways:

### 1. Code Splitting and Lazy Loading
- Components are loaded only when needed using React.lazy and Suspense
- Reduces initial bundle size and improves time-to-interactive
- See `App.optimized.js` and `ChartSelector.optimized.js`

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

### 5. Z-Index Management
- Proper z-index management for dropdown menus and overlays
- Ensures UI elements appear in the correct order

For more details on the optimizations and how to implement them, see the `optimization-guide.md` file.