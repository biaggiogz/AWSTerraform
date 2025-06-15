// Interactive dashboard implementation
document.addEventListener('DOMContentLoaded', function() {
  // Create app structure
  const root = document.getElementById('root');
  
  const appDiv = document.createElement('div');
  appDiv.className = 'app';
  
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  
  const mainContent = document.createElement('div');
  mainContent.className = 'main-content';
  
  // Add sidebar content
  sidebar.innerHTML = `
    <div style="text-align: center; margin-bottom: 20px">
      <img src="assets/AWS_logo_RGB_REV.png" alt="AWS Logo" style="width: 100px; margin-bottom: 10px" />
      <img src="assets/tf-logo.png" alt="Terraform Logo" style="width: 100px" />
    </div>
    
    <h3>Dashboard Settings</h3>
    
    <div style="margin-bottom: 15px">
      <label>Select Date Range</label>
      <div style="display: flex; flex-direction: column; gap: 5px">
        <input type="date" id="startDate" value="${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}" />
        <input type="date" id="endDate" value="${new Date().toISOString().split('T')[0]}" />
      </div>
    </div>
    
    <div style="margin-bottom: 15px">
      <label>Data Source</label>
      <select id="dataSource" style="width: 100%; padding: 5px">
        <option>Sales Data</option>
        <option>Website Traffic</option>
        <option>User Engagement</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px">
      <label>Region</label>
      <div id="regions">
        <div>
          <input type="checkbox" id="northAmerica" checked />
          <label for="northAmerica">North America</label>
        </div>
        <div>
          <input type="checkbox" id="europe" checked />
          <label for="europe">Europe</label>
        </div>
        <div>
          <input type="checkbox" id="asiaPacific" />
          <label for="asiaPacific">Asia Pacific</label>
        </div>
        <div>
          <input type="checkbox" id="southAmerica" />
          <label for="southAmerica">South America</label>
        </div>
        <div>
          <input type="checkbox" id="africa" />
          <label for="africa">Africa</label>
        </div>
      </div>
    </div>
    
    <button id="refreshBtn" style="width: 100%; padding: 8px; background-color: #FF9900; border: none; border-radius: 4px; color: white; cursor: pointer">
      Refresh Data
    </button>
  `;
  
  // Add main content header
  mainContent.innerHTML = `
    <h1 class="main-header">Analytics Dashboard</h1>
    
    <h2 class="sub-header">Key Metrics</h2>
    <div id="metrics" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px"></div>
    
    <h2 class="sub-header">Trend Analysis</h2>
    <div style="margin-bottom: 30px">
      <h3>Time Series</h3>
      <div style="height: 300px">
        <canvas id="timeSeriesChart"></canvas>
      </div>
    </div>
    
    <div style="margin-bottom: 30px">
      <h3>Distribution</h3>
      <div style="height: 300px">
        <canvas id="distributionChart"></canvas>
      </div>
    </div>
    
    <h2 class="sub-header">Detailed Data</h2>
    <div id="dataTable" style="overflow-x: auto"></div>
    
    <div class="footer">
      <hr />
      <p>Dashboard created with vanilla JavaScript and Chart.js, deployed with Terraform on AWS</p>
    </div>
  `;
  
  // Append elements to DOM
  appDiv.appendChild(sidebar);
  appDiv.appendChild(mainContent);
  root.appendChild(appDiv);
  
  // Chart instances
  let timeSeriesChart;
  let distributionChart;
  
  // Generate sample data
  function generateSampleData() {
    const dataSource = document.getElementById('dataSource').value;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const date = currentDate.toISOString().split('T')[0];
      
      if (dataSource === 'Sales Data') {
        data.push({
          date,
          Revenue: Math.floor(Math.random() * 10000) + 5000,
          Orders: Math.floor(Math.random() * 400) + 100,
          AverageOrderValue: Math.floor(Math.random() * 100) + 50
        });
      } else if (dataSource === 'Website Traffic') {
        data.push({
          date,
          Visitors: Math.floor(Math.random() * 4000) + 1000,
          PageViews: Math.floor(Math.random() * 12000) + 3000,
          BounceRate: (Math.random() * 0.4) + 0.2
        });
      } else { // User Engagement
        data.push({
          date,
          ActiveUsers: Math.floor(Math.random() * 1500) + 500,
          SessionDuration: (Math.random() * 8) + 2,
          ConversionRate: (Math.random() * 0.09) + 0.01
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return data;
  }
  
  // Update metrics
  function updateMetrics(data) {
    const metricsDiv = document.getElementById('metrics');
    metricsDiv.innerHTML = '';
    
    const dataSource = document.getElementById('dataSource').value;
    let metrics = [];
    
    if (dataSource === 'Sales Data') {
      const totalRevenue = data.reduce((sum, item) => sum + item.Revenue, 0);
      const totalOrders = data.reduce((sum, item) => sum + item.Orders, 0);
      const avgOrderValue = totalRevenue / totalOrders;
      const conversionRate = (Math.random() * 4) + 1;
      
      metrics = [
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
      
      metrics = [
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
      
      metrics = [
        { label: 'Active Users', value: totalActiveUsers.toLocaleString(), change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Avg Session Duration', value: `${avgSessionDuration.toFixed(2)} min`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Conversion Rate', value: `${(avgConversionRate * 100).toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` },
        { label: 'Retention Rate', value: `${retentionRate.toFixed(2)}%`, change: `${Math.floor(Math.random() * 30) - 10}%` }
      ];
    }
    
    metrics.forEach(metric => {
      const metricCard = document.createElement('div');
      metricCard.className = 'metric-card';
      
      const isPositive = parseInt(metric.change) >= 0;
      
      metricCard.innerHTML = `
        <div class="metric-label">${metric.label}</div>
        <div class="metric-value">${metric.value}</div>
        <div class="metric-change ${isPositive ? 'positive-change' : 'negative-change'}">
          ${isPositive ? '↑' : '↓'} ${metric.change}
        </div>
      `;
      
      metricsDiv.appendChild(metricCard);
    });
  }
  
  // Update charts
  function updateCharts(data) {
    const dataSource = document.getElementById('dataSource').value;
    const dates = data.map(item => item.date);
    
    // Time Series Chart
    let timeSeriesDatasets = [];
    if (dataSource === 'Sales Data') {
      timeSeriesDatasets = [
        {
          label: 'Revenue',
          data: data.map(item => item.Revenue),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Orders',
          data: data.map(item => item.Orders),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    } else if (dataSource === 'Website Traffic') {
      timeSeriesDatasets = [
        {
          label: 'Visitors',
          data: data.map(item => item.Visitors),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Page Views',
          data: data.map(item => item.PageViews),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    } else { // User Engagement
      timeSeriesDatasets = [
        {
          label: 'Active Users',
          data: data.map(item => item.ActiveUsers),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Session Duration',
          data: data.map(item => item.SessionDuration),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    }
    
    // Distribution Chart
    let distributionData;
    let distributionLabel;
    if (dataSource === 'Sales Data') {
      distributionData = data.map(item => item.Revenue);
      distributionLabel = 'Revenue';
    } else if (dataSource === 'Website Traffic') {
      distributionData = data.map(item => item.Visitors);
      distributionLabel = 'Visitors';
    } else { // User Engagement
      distributionData = data.map(item => item.ActiveUsers);
      distributionLabel = 'Active Users';
    }
    
    // Update or create time series chart
    if (timeSeriesChart) {
      timeSeriesChart.data.labels = dates;
      timeSeriesChart.data.datasets = timeSeriesDatasets;
      timeSeriesChart.update();
    } else {
      const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
      timeSeriesChart = new Chart(timeSeriesCtx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: timeSeriesDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            title: {
              display: true,
              text: 'Time Series Analysis'
            }
          }
        }
      });
    }
    
    // Update or create distribution chart
    if (distributionChart) {
      distributionChart.data.labels = dates;
      distributionChart.data.datasets[0].data = distributionData;
      distributionChart.data.datasets[0].label = distributionLabel;
      distributionChart.update();
    } else {
      const distributionCtx = document.getElementById('distributionChart').getContext('2d');
      distributionChart = new Chart(distributionCtx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: distributionLabel,
            data: distributionData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Distribution Analysis'
            }
          }
        }
      });
    }
  }
  
  // Update data table
  function updateDataTable(data) {
    const tableDiv = document.getElementById('dataTable');
    
    let tableHTML = '<table style="width: 100%; border-collapse: collapse">';
    
    // Table header
    tableHTML += '<thead><tr>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left">Date</th>';
    
    // Get all keys except date
    const keys = Object.keys(data[0]).filter(key => key !== 'date');
    
    keys.forEach(key => {
      tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left">${key}</th>`;
    });
    
    tableHTML += '</tr></thead>';
    
    // Table body
    tableHTML += '<tbody>';
    
    data.forEach((row, index) => {
      tableHTML += `<tr style="background-color: ${index % 2 === 0 ? '#f2f2f2' : 'white'}">`;
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px">${row.date}</td>`;
      
      keys.forEach(key => {
        let value = row[key];
        
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('rate')) {
            value = `${(value * 100).toFixed(2)}%`;
          } else {
            value = value.toLocaleString();
          }
        }
        
        tableHTML += `<td style="border: 1px solid #ddd; padding: 8px">${value}</td>`;
      });
      
      tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table>';
    
    tableDiv.innerHTML = tableHTML;
  }
  
  // Update dashboard
  function updateDashboard() {
    const data = generateSampleData();
    updateMetrics(data);
    updateCharts(data);
    updateDataTable(data);
  }
  
  // Initialize dashboard
  updateDashboard();
  
  // Add event listeners
  document.getElementById('refreshBtn').addEventListener('click', updateDashboard);
  document.getElementById('dataSource').addEventListener('change', updateDashboard);
  document.getElementById('startDate').addEventListener('change', updateDashboard);
  document.getElementById('endDate').addEventListener('change', updateDashboard);
});