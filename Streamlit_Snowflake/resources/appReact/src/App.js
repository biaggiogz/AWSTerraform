import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    designArea: 'all',
    fluido: 'all',
    train: 'all'
  });
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    designAreas: [],
    fluidos: [],
    trains: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Use local CSV file instead of API
        const response = await fetch('/data/pipelinedata.csv');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            // Clean and transform data
            const parsedData = results.data
              .filter(row => Object.values(row).some(val => val)) // Remove empty rows
              .map(row => ({
                ...row,
                // Convert string percentages to numbers
                'RATIO DONE DIAINCH (%)': parseFloat(row['RATIO DONE DIAINCH (%)'] || 0),
                'RATIO DONE SHOP DIAINCH (%)': parseFloat(row['RATIO DONE SHOP DIAINCH (%)'] || 0),
                'RATIO DONE FIELD DIAINCH (%)': parseFloat(row['RATIO DONE FIELD DIAINCH (%)'] || 0),
                'PROGRESS SW+FW (%)': parseFloat(row['PROGRESS SW+FW (%)'] || 0),
                '% PROGRESS DELIVERY IN SITE': parseFloat(row['% PROGRESS DELIVERY IN SITE'] || 0),
                '% PROGRESS ERECTED': parseFloat(row['% PROGRESS ERECTED'] || 0),
              }));
            
            setData(parsedData);
            
            // Extract unique values for filters
            setFilterOptions({
              designAreas: ['all', ...new Set(parsedData.map(item => item['Design Area']))],
              fluidos: ['all', ...new Set(parsedData.map(item => item['FLUIDO']))],
              trains: ['all', ...new Set(parsedData.map(item => item['TRAIN']))]
            });
            
            setLoading(false);
          },
          error: (error) => {
            setError('Error parsing CSV: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error fetching data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on selected filters
  const filteredData = data.filter(item => {
    return (filters.designArea === 'all' || item['Design Area'] === filters.designArea) &&
           (filters.fluido === 'all' || item['FLUIDO'] === filters.fluido) &&
           (filters.train === 'all' || item['TRAIN'] === filters.train);
  });

  // Prepare data for progress chart
  const progressData = [
    { name: 'Total Progress', value: filteredData.reduce((sum, item) => sum + parseFloat(item['PROGRESS SW+FW (%)'] || 0), 0) / (filteredData.length || 1) },
    { name: 'Shop Welds', value: filteredData.reduce((sum, item) => sum + parseFloat(item['RATIO DONE SHOP DIAINCH (%)'] || 0), 0) / (filteredData.length || 1) },
    { name: 'Field Welds', value: filteredData.reduce((sum, item) => sum + parseFloat(item['RATIO DONE FIELD DIAINCH (%)'] || 0), 0) / (filteredData.length || 1) },
    { name: 'Support Delivery', value: filteredData.reduce((sum, item) => sum + parseFloat(item['% PROGRESS DELIVERY IN SITE'] || 0), 0) / (filteredData.length || 1) },
    { name: 'Support Erected', value: filteredData.reduce((sum, item) => sum + parseFloat(item['% PROGRESS ERECTED'] || 0), 0) / (filteredData.length || 1) }
  ];

  // Prepare data for fluido distribution
  const fluidoDistribution = filteredData.reduce((acc, item) => {
    const fluido = item['FLUIDO'] || 'Unknown';
    if (!acc[fluido]) acc[fluido] = 0;
    acc[fluido]++;
    return acc;
  }, {});

  const fluidoChartData = Object.keys(fluidoDistribution).map(key => ({
    name: key,
    value: fluidoDistribution[key]
  }));

  // Prepare data for weld counts
  const weldData = [
    { name: 'Shop Welds', value: filteredData.reduce((sum, item) => sum + parseInt(item['QTY Welds Shop (SW)'] || 0), 0) },
    { name: 'Field Welds', value: filteredData.reduce((sum, item) => sum + parseInt(item['QTY Welds Field (FW)'] || 0), 0) }
  ];

  if (loading) return <div>Loading data...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>Pipeline Construction Progress Dashboard</h1>
      
      <div className="filters">
        <div>
          <label>Design Area: </label>
          <select 
            value={filters.designArea} 
            onChange={(e) => setFilters({...filters, designArea: e.target.value})}
          >
            {filterOptions.designAreas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Fluido: </label>
          <select 
            value={filters.fluido} 
            onChange={(e) => setFilters({...filters, fluido: e.target.value})}
          >
            {filterOptions.fluidos.map(fluido => (
              <option key={fluido} value={fluido}>{fluido}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label>Train: </label>
          <select 
            value={filters.train} 
            onChange={(e) => setFilters({...filters, train: e.target.value})}
          >
            {filterOptions.trains.map(train => (
              <option key={train} value={train}>{train}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="chart-container">
        <h2>Overall Progress (%)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={progressData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip formatter={(value) => value.toFixed(2) + '%'} />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" name="Completion %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h2>Fluido Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={fluidoChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {fluidoChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => value} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-container">
        <h2>Weld Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={weldData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              <Cell fill="#0088FE" />
              <Cell fill="#00C49F" />
            </Pie>
            <Tooltip formatter={(value) => value} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default App;