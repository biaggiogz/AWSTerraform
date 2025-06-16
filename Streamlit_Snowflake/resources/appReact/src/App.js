import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { CrossFilterProvider } from './components/context/CrossFilterContext';
import Dashboard from './components/layout/Dashboard';
import { parseData } from './components/utils/dataUtils';
import './styles.css';

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/pipelinedata.csv');
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
          header: true,
          complete: (results) => {
            // Clean and transform data
            const parsedData = parseData(results.data);
            setData(parsedData);
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

  if (loading) return <div className="loading">Loading data...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <CrossFilterProvider>
      <Dashboard data={data} />
    </CrossFilterProvider>
  );
}

export default App;