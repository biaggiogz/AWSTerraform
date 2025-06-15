import React, { useState } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

function App() {
  // State for dashboard settings
  const [dateRange, setDateRange] = useState([
    subDays(new Date(), 30).toISOString().split('T')[0],
    new Date().toISOString().split('T')[0]
  ]);
  
  const [dataSource, setDataSource] = useState('Sales Data');
  const [regions, setRegions] = useState(['North America', 'Europe']);

  // Generate sample data
  const generateSampleData = () => {
    const startDate = new Date(dateRange[0]);
    const endDate = new Date(dateRange[1]);
    
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    
    if (dataSource === 'Sales Data') {
      return dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        Revenue: Math.floor(Math.random() * 10000) + 5000,
        Orders: Math.floor(Math.random() * 400) + 100,
        AverageOrderValue: Math.floor(Math.random() * 100) + 50
      }));
    } else if (dataSource === 'Website Traffic') {
      return dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        Visitors: Math.floor(Math.random() * 4000) + 1000,
        PageViews: Math.floor(Math.random() * 12000) + 3000,
        BounceRate: (Math.random() * 0.4) + 0.2
      }));
    } else { // User Engagement
      return dates.map(date => ({
        date: format(date, 'yyyy-MM-dd'),
        ActiveUsers: Math.floor(Math.random() * 1500) + 500,
        SessionDuration: (Math.random() * 8) + 2,
        ConversionRate: (Math.random() * 0.09) + 0.01
      }));
    }
  };

  const data = generateSampleData();
  
  // Calculate metrics
  const calculateMetrics = () => {
    if (dataSource === 'Sales Data') {
      const totalRevenue = data.reduce((sum, item) => sum + item.Revenue, 0);
      const totalOrders = data.reduce((sum, item) => sum + item.Orders, 0);
      const avgOrderValue = totalRevenue / totalOrders;
      const conversionRate = (Math.random() * 4) + 1;
      
      return [
        { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Total Orders', value: totalOrders.toLocaleString(), change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Avg Order Value', value: `$${avgOrderValue.toFixed(2)}`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Conversion Rate', value: `${conversionRate.toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` }
      ];
    } else if (dataSource === 'Website Traffic') {
      const totalVisitors = data.reduce((sum, item) => sum + item.Visitors, 0);
      const totalPageViews = data.reduce((sum, item) => sum + item.PageViews, 0);
      const avgBounceRate = data.reduce((sum, item) => sum + item.BounceRate, 0) / data.length;
      const avgPagesPerSession = totalPageViews / totalVisitors;
      
      return [
        { label: 'Total Visitors', value: totalVisitors.toLocaleString(), change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Total Page Views', value: totalPageViews.toLocaleString(), change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Avg Bounce Rate', value: `${(avgBounceRate * 100).toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Avg Pages/Session', value: avgPagesPerSession.toFixed(2), change: `${Math.floor(Math.random() * 30) - 10}%` }
      ];
    } else { // User Engagement
      const totalActiveUsers = data.reduce((sum, item) => sum + item.ActiveUsers, 0);
      const avgSessionDuration = data.reduce((sum, item) => sum + item.SessionDuration, 0) / data.length;
      const avgConversionRate = data.reduce((sum, item) => sum + item.ConversionRate, 0) / data.length;
      const retentionRate = (Math.random() * 60) + 20;
      
      return [
        { label: 'Active Users', value: totalActiveUsers.toLocaleString(), change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Avg Session Duration', value: `${avgSessionDuration.toFixed(2)} min`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Conversion Rate', value: `${(avgConversionRate * 100).toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Retention Rate', value: `${retentionRate.toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` }
      ];
    }
  };

  const metrics = calculateMetrics();

  // Handle refresh data
  const handleRefreshData = () => {
    // In a real app, this would fetch new data
    // For this demo, we'll just force a re-render
    setDataSource(prev => prev);
  };

  // Determine which chart data to show based on data source
  const getChartData = () => {
    if (dataSource === 'Sales Data') {
      return [
        { dataKey: 'Revenue', color: '#8884d8' },
        { dataKey: 'Orders', color: '#82ca9d' }
      ];
    } else if (dataSource === 'Website Traffic') {
      return [
        { dataKey: 'Visitors', color: '#8884d8' },
        { dataKey: 'PageViews', color: '#82ca9d' }
      ];
    } else { // User Engagement
      return [
        { dataKey: 'ActiveUsers', color: '#8884d8' },
        { dataKey: 'SessionDuration', color: '#82ca9d' }
      ];
    }
  };

  const chartData = getChartData();
  
  // Determine which data to show in bar chart
  const getBarChartData = () => {
    if (dataSource === 'Sales Data') {
      return 'Revenue';
    } else if (dataSource === 'Website Traffic') {
      return 'Visitors';
    } else { // User Engagement
      return 'ActiveUsers';
    }
  };

  const barChartDataKey = getBarChartData();

  return (
    <div className="app">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/assets/AWS_logo_RGB_REV.png" alt="AWS Logo" style={{ width: '100px', marginBottom: '10px' }} />
          <img src="/assets/tf-logo.png" alt="Terraform Logo" style={{ width: '100px' }} />
        </div>
        
        <h3>Dashboard Settings</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Select Date Range</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <input 
              type="date" 
              value={dateRange[0]} 
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
            />
            <input 
              type="date" 
              value={dateRange[1]} 
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Data Source</label>
          <select 
            value={dataSource} 
            onChange={(e) => setDataSource(e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option>Sales Data</option>
            <option>Website Traffic</option>
            <option>User Engagement</option>
          </select>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Region</label>
          <div>
            {['North America', 'Europe', 'Asia Pacific', 'South America', 'Africa'].map(region => (
              <div key={region}>
                <input 
                  type="checkbox" 
                  id={region} 
                  checked={regions.includes(region)} 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setRegions([...regions, region]);
                    } else {
                      setRegions(regions.filter(r => r !== region));
                    }
                  }}
                />
                <label htmlFor={region}>{region}</label>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={handleRefreshData}
          style={{ 
            width: '100%', 
            padding: '8px', 
            backgroundColor: '#FF9900', 
            border: 'none', 
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1 className="main-header">Analytics Dashboard</h1>
        
        {/* Key Metrics */}
        <h2 className="sub-header">Key Metrics</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          {metrics.map((metric, index) => (
            <div key={index} className="metric-card">
              <div className="metric-label">{metric.label}</div>
              <div className="metric-value">{metric.value}</div>
              <div className={`metric-change ${parseInt(metric.change) >= 0 ? 'positive-change' : 'negative-change'}`}>
                {parseInt(metric.change) >= 0 ? '↑' : '↓'} {metric.change}
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts */}
        <h2 className="sub-header">Trend Analysis</h2>
        <div style={{ marginBottom: '30px' }}>
          <h3>Time Series</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chartData.map((item, index) => (
                  <Line 
                    key={index}
                    type="monotone" 
                    dataKey={item.dataKey} 
                    stroke={item.color} 
                    activeDot={{ r: 8 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <h3>Distribution</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={barChartDataKey} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Data Table */}
        <h2 className="sub-header">Detailed Data</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Date</th>
                {Object.keys(data[0]).filter(key => key !== 'date').map(key => (
                  <th key={key} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f2f2f2' : 'white' }}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row.date}</td>
                  {Object.keys(row).filter(key => key !== 'date').map(key => (
                    <td key={key} style={{ border: '1px solid #ddd', padding: '8px' }}>
                      {typeof row[key] === 'number' && key.toLowerCase().includes('rate') 
                        ? `${(row[key] * 100).toFixed(2)}%` 
                        : typeof row[key] === 'number' 
                          ? row[key].toLocaleString() 
                          : row[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="footer">
          <hr />
          <p>Dashboard created with React and deployed with Terraform on AWS</p>
        </div>
      </div>
    </div>
  );
}

export default App;