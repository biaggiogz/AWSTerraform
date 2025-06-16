# Pipeline Construction Dashboard React App

This React application visualizes pipeline construction progress data with interactive charts and cross-filtering capabilities.

## Project Structure

```
appReact/
├── public/                  # Static files
│   ├── data/                # CSV data files
│   └── index.html           # HTML entry point
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── charts/          # Chart components
│   │   │   ├── BarChart.js  # Bar chart visualization
│   │   │   ├── BoxPlot.js   # Box plot visualization
│   │   │   ├── ScatterPlot.js # Scatter plot visualization
│   │   │   └── StackedBarChart.js # Stacked bar chart visualization
│   │   ├── context/         # React context providers
│   │   │   └── CrossFilterContext.js # Cross-filtering state management
│   │   ├── hooks/           # Custom React hooks
│   │   │   └── useDataProcessor.js # Data processing hook
│   │   ├── layout/          # Layout components
│   │   │   ├── Dashboard.js # Main dashboard layout
│   │   │   └── FilterControls.js # Filter UI controls
│   │   └── utils/           # Utility functions
│   │       └── dataUtils.js # Data manipulation utilities
│   ├── App.js               # Main application component
│   ├── index.js             # JavaScript entry point
│   ├── index.css            # Global styles
│   └── styles.css           # Component styles
├── .dockerignore            # Docker ignore file
├── .env                     # Environment variables
├── docker-compose.yml       # Docker Compose configuration
├── Dockerfile               # Docker configuration
├── nginx.conf               # Nginx configuration for production
├── package.json             # NPM package configuration
├── package-lock.json        # NPM package lock
└── server.js                # Optional server for production
```

## Module Descriptions

### Components

#### Charts
- **BarChart.js**: Renders bar charts for categorical data comparisons. Used for visualizing average progress percentages by design area.
- **StackedBarChart.js**: Displays stacked bar charts for comparing multiple values across categories. Used for comparing shop vs. field welds by line ID.
- **ScatterPlot.js**: Creates scatter plots to show relationships between two numerical variables. Used for comparing total vs. completed diameter inches.
- **BoxPlot.js**: Generates box plots to display statistical distributions. Used for showing progress erected percentages by train.

#### Context
- **CrossFilterContext.js**: Provides cross-filtering functionality across all charts. Manages filter state and provides methods to update filters.

#### Hooks
- **useDataProcessor.js**: Custom hook that processes raw data for different chart types. Handles filtering, grouping, and aggregation of data.

#### Layout
- **Dashboard.js**: Main dashboard component that arranges all charts and controls. Coordinates the overall layout and data flow.
- **FilterControls.js**: UI component for displaying active filters and providing controls to clear them.

#### Utils
- **dataUtils.js**: Utility functions for data parsing, transformation, and color generation.

### Core Files
- **App.js**: Main application component that fetches data and initializes the CrossFilterProvider.
- **styles.css**: Global styles for the application.
- **index.js**: Entry point for the React application.

## Features

- Interactive data visualization with D3.js
- Cross-filtering capabilities across all charts
- Responsive design for different screen sizes
- Data parsing and transformation
- Multiple chart types (bar, stacked bar, scatter, box plot)

## Technologies Used

- React.js
- D3.js for visualizations
- PapaParse for CSV parsing
- Docker for containerization
- Nginx for production serving