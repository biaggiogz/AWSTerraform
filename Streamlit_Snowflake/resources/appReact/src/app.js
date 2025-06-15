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
    
    <!-- Tab navigation for charts -->
    <div class="chart-tabs">
      <button id="timeSeriesTab" class="tab-button active">Time Series</button>
      <button id="distributionTab" class="tab-button">Distribution</button>
      <button id="regionBreakdownTab" class="tab-button">Breakdown by Region</button>
    </div>
    
    <div id="chartContainer" style="margin-bottom: 30px">
      <div id="timeSeriesPanel" class="chart-panel active" style="height: 300px">
        <canvas id="timeSeriesChart"></canvas>
      </div>
      
      <div id="distributionPanel" class="chart-panel" style="height: 300px; display: none">
        <canvas id="distributionChart"></canvas>
      </div>
      
      <div id="regionBreakdownPanel" class="chart-panel" style="height: 300px; display: none">
        <canvas id="regionBreakdownChart"></canvas>
      </div>
    </div>
    
    <h2 class="sub-header">Detailed Data</h2>
    
    <!-- Search and pagination controls -->
    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center">
      <div style="display: flex; align-items: center">
        <input type="text" id="searchInput" placeholder="Search data..." style="padding: 6px; margin-right: 10px; width: 200px" />
        <button id="searchBtn" style="padding: 6px 12px; background-color: #FF9900; border: none; border-radius: 4px; color: white; cursor: pointer">
          Search
        </button>
      </div>
      
      <div style="display: flex; align-items: center">
        <label style="margin-right: 10px">Rows per page:</label>
        <input type="number" id="rowsPerPage" class="rows-input" value="10" min="1" max="100" />
      </div>
    </div>
    
    <div id="dataTable" style="overflow-x: auto"></div>
    
    <!-- Pagination controls -->
    <div style="margin-top: 15px; display: flex; justify-content: center; align-items: center">
      <button id="prevPageBtn" style="padding: 6px 12px; margin-right: 10px; background-color: #f0f2f6; border: none; border-radius: 4px; cursor: pointer">
        Previous
      </button>
      <span id="pageInfo">Page 1 of 1</span>
      <button id="nextPageBtn" style="padding: 6px 12px; margin-left: 10px; background-color: #f0f2f6; border: none; border-radius: 4px; cursor: pointer">
        Next
      </button>
    </div>
    
    <div class="footer">
      <hr />
      <p>Dashboard created with vanilla JavaScript and Chart.js, deployed with Terraform on AWS</p>
    </div>
  `;
  
  // Append elements to DOM
  appDiv.appendChild(sidebar);
  appDiv.appendChild(mainContent);
  root.appendChild(appDiv);
  
  // Add CSS for tabs
  const style = document.createElement('style');
  style.textContent = `
    .chart-tabs {
      display: flex;
      margin-bottom: 15px;
    }
    .tab-button {
      padding: 8px 16px;
      background-color: #f0f2f6;
      border: none;
      cursor: pointer;
      margin-right: 5px;
    }
    .tab-button.active {
      background-color: #FF9900;
      color: white;
    }
    .chart-panel {
      display: none;
    }
    .chart-panel.active {
      display: block;
    }
  `;
  document.head.appendChild(style);
  
  // Chart instances
  let timeSeriesChart;
  let distributionChart;
  let regionBreakdownChart;
  
  // Pagination state
  let currentPage = 1;
  let rowsPerPage = 10;
  let filteredData = [];
  
  // Generate sample data
  function generateSampleData() {
    const dataSource = document.getElementById('dataSource').value;
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    
    const data = [];
    const currentDate = new Date(startDate);
    
    // Get selected regions
    const selectedRegions = [];
    if (document.getElementById('northAmerica').checked) selectedRegions.push('North America');
    if (document.getElementById('europe').checked) selectedRegions.push('Europe');
    if (document.getElementById('asiaPacific').checked) selectedRegions.push('Asia Pacific');
    if (document.getElementById('southAmerica').checked) selectedRegions.push('South America');
    if (document.getElementById('africa').checked) selectedRegions.push('Africa');
    
    while (currentDate <= endDate) {
      const date = currentDate.toISOString().split('T')[0];
      
      // Generate data for each selected region
      selectedRegions.forEach(region => {
        if (dataSource === 'Sales Data') {
          data.push({
            date,
            region,
            Revenue: Math.floor(Math.random() * 10000) + 5000,
            Orders: Math.floor(Math.random() * 400) + 100,
            AverageOrderValue: Math.floor(Math.random() * 100) + 50
          });
        } else if (dataSource === 'Website Traffic') {
          data.push({
            date,
            region,
            Visitors: Math.floor(Math.random() * 4000) + 1000,
            PageViews: Math.floor(Math.random() * 12000) + 3000,
            BounceRate: (Math.random() * 0.4) + 0.2
          });
        } else { // User Engagement
          data.push({
            date,
            region,
            ActiveUsers: Math.floor(Math.random() * 1500) + 500,
            SessionDuration: (Math.random() * 8) + 2,
            ConversionRate: (Math.random() * 0.09) + 0.01
          });
        }
      });
      
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
    
    // Get unique dates for x-axis
    const uniqueDates = [...new Set(data.map(item => item.date))];
    
    // Time Series Chart
    let timeSeriesDatasets = [];
    if (dataSource === 'Sales Data') {
      timeSeriesDatasets = [
        {
          label: 'Revenue',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.Revenue, 0);
          }),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Orders',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.Orders, 0);
          }),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    } else if (dataSource === 'Website Traffic') {
      timeSeriesDatasets = [
        {
          label: 'Visitors',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.Visitors, 0);
          }),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Page Views',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.PageViews, 0);
          }),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    } else { // User Engagement
      timeSeriesDatasets = [
        {
          label: 'Active Users',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.ActiveUsers, 0);
          }),
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Session Duration',
          data: uniqueDates.map(date => {
            const dayData = data.filter(item => item.date === date);
            return dayData.reduce((sum, item) => sum + item.SessionDuration, 0) / dayData.length;
          }),
          borderColor: 'rgb(153, 102, 255)',
          tension: 0.1
        }
      ];
    }
    
    // Distribution Chart
    let distributionData;
    let distributionLabel;
    if (dataSource === 'Sales Data') {
      distributionData = uniqueDates.map(date => {
        const dayData = data.filter(item => item.date === date);
        return dayData.reduce((sum, item) => sum + item.Revenue, 0);
      });
      distributionLabel = 'Revenue';
    } else if (dataSource === 'Website Traffic') {
      distributionData = uniqueDates.map(date => {
        const dayData = data.filter(item => item.date === date);
        return dayData.reduce((sum, item) => sum + item.Visitors, 0);
      });
      distributionLabel = 'Visitors';
    } else { // User Engagement
      distributionData = uniqueDates.map(date => {
        const dayData = data.filter(item => item.date === date);
        return dayData.reduce((sum, item) => sum + item.ActiveUsers, 0);
      });
      distributionLabel = 'Active Users';
    }
    
    // Region Breakdown Chart
    const regions = [...new Set(data.map(item => item.region))];
    let regionBreakdownDatasets = [];
    
    if (dataSource === 'Sales Data') {
      regionBreakdownDatasets = regions.map(region => {
        return {
          label: region,
          data: uniqueDates.map(date => {
            const filteredData = data.filter(item => item.date === date && item.region === region);
            return filteredData.reduce((sum, item) => sum + item.Revenue, 0);
          }),
          backgroundColor: getRandomColor(),
        };
      });
    } else if (dataSource === 'Website Traffic') {
      regionBreakdownDatasets = regions.map(region => {
        return {
          label: region,
          data: uniqueDates.map(date => {
            const filteredData = data.filter(item => item.date === date && item.region === region);
            return filteredData.reduce((sum, item) => sum + item.Visitors, 0);
          }),
          backgroundColor: getRandomColor(),
        };
      });
    } else { // User Engagement
      regionBreakdownDatasets = regions.map(region => {
        return {
          label: region,
          data: uniqueDates.map(date => {
            const filteredData = data.filter(item => item.date === date && item.region === region);
            return filteredData.reduce((sum, item) => sum + item.ActiveUsers, 0);
          }),
          backgroundColor: getRandomColor(),
        };
      });
    }
    
    // Update or create time series chart
    if (timeSeriesChart) {
      timeSeriesChart.data.labels = uniqueDates;
      timeSeriesChart.data.datasets = timeSeriesDatasets;
      timeSeriesChart.update();
    } else {
      const timeSeriesCtx = document.getElementById('timeSeriesChart').getContext('2d');
      timeSeriesChart = new Chart(timeSeriesCtx, {
        type: 'line',
        data: {
          labels: uniqueDates,
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
      distributionChart.data.labels = uniqueDates;
      distributionChart.data.datasets[0].data = distributionData;
      distributionChart.data.datasets[0].label = distributionLabel;
      distributionChart.update();
    } else {
      const distributionCtx = document.getElementById('distributionChart').getContext('2d');
      distributionChart = new Chart(distributionCtx, {
        type: 'bar',
        data: {
          labels: uniqueDates,
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
    
    // Update or create region breakdown chart
    if (regionBreakdownChart) {
      regionBreakdownChart.data.labels = uniqueDates;
      regionBreakdownChart.data.datasets = regionBreakdownDatasets;
      regionBreakdownChart.update();
    } else {
      const regionBreakdownCtx = document.getElementById('regionBreakdownChart').getContext('2d');
      regionBreakdownChart = new Chart(regionBreakdownCtx, {
        type: 'bar',
        data: {
          labels: uniqueDates,
          datasets: regionBreakdownDatasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Breakdown by Region'
            }
          },
          scales: {
            x: {
              stacked: true,
            },
            y: {
              stacked: true
            }
          }
        }
      });
    }
  }
  
  // Helper function to generate random colors for chart
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  
  // Filter data based on search input
  function filterData(data) {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
      return data;
    }
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (value === null || value === undefined) return false;
        return value.toString().toLowerCase().includes(searchTerm);
      });
    });
  }
  
  // Update data table with pagination
  function updateDataTable(data) {
    // Filter data based on search
    filteredData = filterData(data);
    
    // Get pagination settings
    rowsPerPage = parseInt(document.getElementById('rowsPerPage').value) || 10;
    if (rowsPerPage < 1) rowsPerPage = 10;
    
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    
    // Adjust current page if needed
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
    
    // Calculate slice indices
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length);
    
    // Get current page data
    const currentPageData = filteredData.slice(startIndex, endIndex);
    
    // Update page info
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    
    // Enable/disable pagination buttons
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage === totalPages;
    
    // Render table
    const tableDiv = document.getElementById('dataTable');
    
    if (currentPageData.length === 0) {
      tableDiv.innerHTML = '<p>No data found matching your search criteria.</p>';
      return;
    }
    
    let tableHTML = '<table style="width: 100%; border-collapse: collapse">';
    
    // Table header
    tableHTML += '<thead><tr>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left">Date</th>';
    tableHTML += '<th style="border: 1px solid #ddd; padding: 8px; text-align: left">Region</th>';
    
    // Get all keys except date and region
    const keys = Object.keys(currentPageData[0]).filter(key => key !== 'date' && key !== 'region');
    
    keys.forEach(key => {
      tableHTML += `<th style="border: 1px solid #ddd; padding: 8px; text-align: left">${key}</th>`;
    });
    
    tableHTML += '</tr></thead>';
    
    // Table body
    tableHTML += '<tbody>';
    
    currentPageData.forEach((row, index) => {
      tableHTML += `<tr style="background-color: ${index % 2 === 0 ? '#f2f2f2' : 'white'}">`;
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px">${row.date}</td>`;
      tableHTML += `<td style="border: 1px solid #ddd; padding: 8px">${row.region}</td>`;
      
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
    
    // Reset pagination when data changes
    currentPage = 1;
    updateDataTable(data);
  }
  
  // Initialize dashboard
  updateDashboard();
  
  // Add event listeners for dashboard controls
  document.getElementById('refreshBtn').addEventListener('click', updateDashboard);
  document.getElementById('dataSource').addEventListener('change', updateDashboard);
  document.getElementById('startDate').addEventListener('change', updateDashboard);
  document.getElementById('endDate').addEventListener('change', updateDashboard);
  
  // Add event listeners for region checkboxes
  document.getElementById('northAmerica').addEventListener('change', updateDashboard);
  document.getElementById('europe').addEventListener('change', updateDashboard);
  document.getElementById('asiaPacific').addEventListener('change', updateDashboard);
  document.getElementById('southAmerica').addEventListener('change', updateDashboard);
  document.getElementById('africa').addEventListener('change', updateDashboard);
  
  // Add event listeners for search and pagination
  document.getElementById('searchBtn').addEventListener('click', () => updateDataTable(generateSampleData()));
  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      updateDataTable(generateSampleData());
    }
  });
  
  document.getElementById('rowsPerPage').addEventListener('change', () => {
    currentPage = 1; // Reset to first page when changing rows per page
    updateDataTable(generateSampleData());
  });
  
  document.getElementById('prevPageBtn').addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updateDataTable(generateSampleData());
    }
  });
  
  document.getElementById('nextPageBtn').addEventListener('click', () => {
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      updateDataTable(generateSampleData());
    }
  });
  
  // Add event listeners for chart tabs
  document.getElementById('timeSeriesTab').addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.chart-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('timeSeriesTab').classList.add('active');
    document.getElementById('timeSeriesPanel').classList.add('active');
    document.getElementById('timeSeriesPanel').style.display = 'block';
    document.getElementById('distributionPanel').style.display = 'none';
    document.getElementById('regionBreakdownPanel').style.display = 'none';
  });
  
  document.getElementById('distributionTab').addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.chart-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('distributionTab').classList.add('active');
    document.getElementById('distributionPanel').classList.add('active');
    document.getElementById('timeSeriesPanel').style.display = 'none';
    document.getElementById('distributionPanel').style.display = 'block';
    document.getElementById('regionBreakdownPanel').style.display = 'none';
  });
  
  document.getElementById('regionBreakdownTab').addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.chart-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById('regionBreakdownTab').classList.add('active');
    document.getElementById('regionBreakdownPanel').classList.add('active');
    document.getElementById('timeSeriesPanel').style.display = 'none';
    document.getElementById('distributionPanel').style.display = 'none';
    document.getElementById('regionBreakdownPanel').style.display = 'block';
  });
});