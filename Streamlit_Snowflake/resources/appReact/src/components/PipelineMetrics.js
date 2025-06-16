import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PipelineMetrics = ({ data, onStatusClick, activeFilters }) => {
  // Calculate completion metrics
  const completionData = [
    { name: 'Total Progress', value: data.reduce((sum, item) => sum + parseFloat(item['PROGRESS SW+FW (%)'] || 0), 0) / (data.length || 1) },
    { name: 'Shop Welds', value: data.reduce((sum, item) => sum + parseFloat(item['RATIO DONE SHOP DIAINCH (%)'] || 0), 0) / (data.length || 1) },
    { name: 'Field Welds', value: data.reduce((sum, item) => sum + parseFloat(item['RATIO DONE FIELD DIAINCH (%)'] || 0), 0) / (data.length || 1) },
    { name: 'Support Delivery', value: data.reduce((sum, item) => sum + parseFloat(item['% PROGRESS DELIVERY IN SITE'] || 0), 0) / (data.length || 1) },
    { name: 'Support Erected', value: data.reduce((sum, item) => sum + parseFloat(item['% PROGRESS ERECTED'] || 0), 0) / (data.length || 1) }
  ];

  // Calculate weld distribution
  const weldData = [
    { name: 'Shop Welds', value: data.reduce((sum, item) => sum + parseInt(item['QTY Welds Shop (SW)'] || 0), 0) },
    { name: 'Field Welds', value: data.reduce((sum, item) => sum + parseInt(item['QTY Welds Field (FW)'] || 0), 0) }
  ];

  // Calculate PROGRESS distribution
  const statusDistribution = data.reduce((acc, item) => {
    const status = item['CONSTRUC COORD PROGRESS'] || 'Unknown';
    if (!acc[status]) acc[status] = 0;
    acc[status]++;
    return acc;
  }, {});

  const statusChartData = Object.keys(statusDistribution).map(key => ({
    name: key,
    value: statusDistribution[key]
  }));

  // Handle status click for cross-filtering
  const handleStatusClick = (entry) => {
    if (onStatusClick) {
      onStatusClick(entry.name === 'Unknown' ? null : entry.name);
    }
  };

  return (
    <div className="metrics-container">
      <div className="chart-row">
        <div className="chart-container">
          <h3>Completion Percentages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
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
          <h3>Weld Distribution</h3>
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

      <div className="chart-row">
        <div className="chart-container">
          <h3>Progress Distribution {activeFilters && activeFilters.status !== 'all' && `(Filtered: ${activeFilters.status || 'None'})`}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                onClick={handleStatusClick}
              >
                {statusChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeFilters && entry.name === activeFilters.status ? '#FF5733' : COLORS[index % COLORS.length]} 
                    stroke={activeFilters && entry.name === activeFilters.status ? '#000' : 'none'}
                    strokeWidth={activeFilters && entry.name === activeFilters.status ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value} />
              <Legend onClick={(data) => handleStatusClick({name: data.value})} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PipelineMetrics;