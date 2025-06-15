import streamlit as st
import pandas as pd
import numpy as np
from PIL import Image
import datetime
import plotly.express as px
import json
from streamlit.components.v1 import html

# Load favicon with error handling
try:
    favicon = Image.open('assets/favicon/aws-custom-favicon-kdm.ico')
except FileNotFoundError:
    favicon = None

# Streamlit configuration
st.set_page_config(
    page_title="Analytics Dashboard", 
    page_icon=favicon, 
    layout="wide", 
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #FF9900;
        text-align: center;
    }
    .sub-header {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 1rem;
        text-align: center;
    }
    .filter-badge {
        background-color: #FF9900;
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 1rem;
        font-size: 0.8rem;
        margin-right: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<p class="main-header">Analytics Dashboard</p>', unsafe_allow_html=True)

# Add JavaScript for handling chart click events
st.markdown("""
<script>
document.addEventListener('DOMContentLoaded', function() {
    const handlePlotlyClick = (e) => {
        const curveNumber = e.points[0].curveNumber;
        const pointNumber = e.points[0].pointNumber;
        const customdata = e.points[0].customdata;
        
        // Send data to Streamlit
        const data = {
            curveNumber: curveNumber,
            pointNumber: pointNumber,
            customdata: customdata
        };
        
        // Use the chart key to identify which chart was clicked
        const chartId = e.target.id;
        const callbackKey = 'callback_' + chartId.split('_')[1];
        
        // Store in session state
        window.parent.postMessage({
            type: 'streamlit:setComponentValue',
            value: {
                [callbackKey]: [data]
            }
        }, '*');
    };
    
    // Wait for Plotly charts to be rendered
    setTimeout(() => {
        const charts = document.querySelectorAll('.js-plotly-plot');
        charts.forEach(chart => {
            chart.on('plotly_click', handlePlotlyClick);
        });
    }, 1000);
});
</script>
""", unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    try:
        st.image("assets/AWS_logo_RGB_REV.png", width=100)
    except:
        st.write("AWS Logo")
    
    try:
        st.image("assets/tf-logo.png", width=100)
    except:
        st.write("Terraform Logo")
    
    st.markdown("### Dashboard Settings")
    date_range = st.date_input(
        "Select Date Range",
        value=(datetime.date.today() - datetime.timedelta(days=30), datetime.date.today())
    )
    
    data_source = st.selectbox(
        "Data Source",
        ["Sales Data", "Website Traffic", "User Engagement"],
        key="data_source_selector"
    )
    
    regions = st.multiselect(
        "Region",
        ["North America", "Europe", "Asia Pacific", "South America", "Africa"],
        default=["North America", "Europe"],
        key="region_selector"
    )
    
    # Add additional filters based on data source
    if data_source == "Sales Data":
        product_categories = st.multiselect(
            "Product Category",
            ["Electronics", "Clothing", "Home Goods", "Books"],
            default=["Electronics", "Clothing"],
            key="product_category_selector"
        )
    elif data_source == "Website Traffic":
        traffic_sources = st.multiselect(
            "Traffic Source",
            ["Organic", "Direct", "Social", "Referral"],
            default=["Organic", "Direct"],
            key="traffic_source_selector"
        )
    else:  # User Engagement
        user_types = st.multiselect(
            "User Type",
            ["New", "Returning", "Loyal"],
            default=["New", "Returning"],
            key="user_type_selector"
        )
    
    # Add time granularity option
    time_granularity = st.selectbox(
        "Time Granularity",
        ["Daily", "Weekly", "Monthly"],
        key="time_granularity_selector"
    )
    
    refresh_button = st.button("Refresh Data", key="refresh_button")

# Generate sample data
def generate_sample_data(data_type, selected_regions=None):
    dates = pd.date_range(date_range[0], date_range[1], freq='D')
    regions_list = selected_regions if selected_regions else ["North America", "Europe", "Asia Pacific", "South America", "Africa"]
    
    # Create empty dataframe to store all data
    all_data = pd.DataFrame()
    
    for region in regions_list:
        # Add some variation based on region
        region_factor = {
            "North America": 1.2,
            "Europe": 1.0,
            "Asia Pacific": 0.9,
            "South America": 0.7,
            "Africa": 0.5
        }.get(region, 1.0)
        
        if data_type == "Sales Data":
            data = {
                'Date': dates,
                'Revenue': np.random.randint(5000, 15000, size=len(dates)) * region_factor,
                'Orders': np.random.randint(100, 500, size=len(dates)) * region_factor,
                'Average Order Value': np.random.randint(50, 150, size=len(dates)),
                'Region': region,
                'Product Category': np.random.choice(['Electronics', 'Clothing', 'Home Goods', 'Books'], size=len(dates))
            }
        elif data_type == "Website Traffic":
            data = {
                'Date': dates,
                'Visitors': np.random.randint(1000, 5000, size=len(dates)) * region_factor,
                'Page Views': np.random.randint(3000, 15000, size=len(dates)) * region_factor,
                'Bounce Rate': np.random.uniform(0.2, 0.6, size=len(dates)),
                'Region': region,
                'Traffic Source': np.random.choice(['Organic', 'Direct', 'Social', 'Referral'], size=len(dates))
            }
        else:  # User Engagement
            data = {
                'Date': dates,
                'Active Users': np.random.randint(500, 2000, size=len(dates)) * region_factor,
                'Session Duration': np.random.uniform(2, 10, size=len(dates)),
                'Conversion Rate': np.random.uniform(0.01, 0.1, size=len(dates)),
                'Region': region,
                'User Type': np.random.choice(['New', 'Returning', 'Loyal'], size=len(dates))
            }
        
        # Append to the all_data dataframe
        region_df = pd.DataFrame(data)
        all_data = pd.concat([all_data, region_df], ignore_index=True)
    
    return all_data

# Apply additional filters based on data source
def filter_dataframe(df, data_source):
    filtered_df = df.copy()
    
    # Apply region filter
    if regions:
        filtered_df = filtered_df[filtered_df['Region'].isin(regions)]
    
    # Apply data source specific filters
    if data_source == "Sales Data" and 'product_categories' in st.session_state:
        categories = st.session_state.get('product_category_selector', [])
        if categories:
            filtered_df = filtered_df[filtered_df['Product Category'].isin(categories)]
    elif data_source == "Website Traffic" and 'traffic_source_selector' in st.session_state:
        sources = st.session_state.get('traffic_source_selector', [])
        if sources:
            filtered_df = filtered_df[filtered_df['Traffic Source'].isin(sources)]
    elif data_source == "User Engagement" and 'user_type_selector' in st.session_state:
        types = st.session_state.get('user_type_selector', [])
        if types:
            filtered_df = filtered_df[filtered_df['User Type'].isin(types)]
    
    return filtered_df

# Apply time granularity
def resample_data(df, granularity):
    df_copy = df.copy()
    if granularity == "Weekly":
        return df_copy.groupby([pd.Grouper(key='Date', freq='W'), 'Region']).mean().reset_index()
    elif granularity == "Monthly":
        return df_copy.groupby([pd.Grouper(key='Date', freq='M'), 'Region']).mean().reset_index()
    else:  # Daily
        return df_copy

# Helper function for plotly chart with click callback
def plotly_chart_with_callback(fig, key=None):
    # Create a unique key for the chart
    chart_key = f"chart_{key}" if key else "chart"
    callback_key = f"callback_{key}" if key else "callback"
    
    # Add a container for the chart
    chart_container = st.empty()
    
    # Add the chart to the container
    chart_container.plotly_chart(fig, use_container_width=True, key=chart_key)
    
    # Check if there's a callback in session state
    if callback_key in st.session_state and st.session_state[callback_key]:
        selected_points = st.session_state[callback_key]
        # Clear the callback to avoid repeated triggers
        st.session_state[callback_key] = None
        return selected_points
    
    return None

# Initialize session state for cross-filtering if not exists
if 'chart_filter' not in st.session_state:
    st.session_state['chart_filter'] = None

# Generate data based on selection
df = generate_sample_data(data_source, regions)

# Apply filters
filtered_df = filter_dataframe(df, data_source)

# Apply chart filter from cross-filtering
if st.session_state['chart_filter'] is not None:
    filter_col, filter_val = st.session_state['chart_filter']
    if filter_col in filtered_df.columns:
        filtered_df = filtered_df[filtered_df[filter_col] == filter_val]
        st.sidebar.markdown(f"**Active Filter:** {filter_col} = {filter_val}")
        st.sidebar.button("Clear Filter", on_click=lambda: st.session_state.update({'chart_filter': None}))

# Apply time granularity
resampled_df = resample_data(filtered_df, time_granularity)

# Main dashboard
# Key metrics
st.markdown('<p class="sub-header">Key Metrics</p>', unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns(4)

if data_source == "Sales Data":
    with col1:
        st.metric("Total Revenue", f"${filtered_df['Revenue'].sum():,.2f}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Total Orders", f"{filtered_df['Orders'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Avg Order Value", f"${filtered_df['Average Order Value'].mean():.2f}", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Conversion Rate", f"{np.random.uniform(1, 5):.2f}%", f"{np.random.randint(-10, 20)}%")
elif data_source == "Website Traffic":
    with col1:
        st.metric("Total Visitors", f"{filtered_df['Visitors'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Total Page Views", f"{filtered_df['Page Views'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Avg Bounce Rate", f"{filtered_df['Bounce Rate'].mean()*100:.2f}%", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Avg Pages/Session", f"{filtered_df['Page Views'].sum() / filtered_df['Visitors'].sum():.2f}", f"{np.random.randint(-10, 20)}%")
else:  # User Engagement
    with col1:
        st.metric("Active Users", f"{filtered_df['Active Users'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Avg Session Duration", f"{filtered_df['Session Duration'].mean():.2f} min", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Conversion Rate", f"{filtered_df['Conversion Rate'].mean()*100:.2f}%", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Retention Rate", f"{np.random.uniform(20, 80):.2f}%", f"{np.random.randint(-10, 20)}%")

# Charts
st.markdown('<p class="sub-header">Trend Analysis</p>', unsafe_allow_html=True)
tab1, tab2, tab3 = st.tabs(["Time Series", "Distribution", "Breakdown by Region"])

with tab1:
    # Interactive time series chart with plotly
    if data_source == "Sales Data":
        # Create interactive time series chart
        fig = px.line(resampled_df, x='Date', y=['Revenue', 'Orders'], color='Region',
                     title='Revenue and Orders Over Time',
                     labels={'value': 'Value', 'variable': 'Metric'})
        
        # Add range slider
        fig.update_layout(
            xaxis=dict(
                rangeslider=dict(visible=True),
                type="date"
            )
        )
        
        # Enable click events for cross-filtering
        fig.update_traces(
            customdata=resampled_df['Region'],
            hovertemplate="<b>Date:</b> %{x}<br><b>Value:</b> %{y}<br><b>Region:</b> %{customdata}<extra></extra>"
        )
        
        # Use custom callback for handling click events
        selected_points = plotly_chart_with_callback(fig, key="timeseries_sales")
        if selected_points:
            region = selected_points[0]['customdata']
            st.session_state['chart_filter'] = ('Region', region)
            st.rerun()
        
    elif data_source == "Website Traffic":
        fig = px.line(resampled_df, x='Date', y=['Visitors', 'Page Views'], color='Region',
                     title='Website Traffic Over Time',
                     labels={'value': 'Count', 'variable': 'Metric'})
        
        # Add range slider
        fig.update_layout(
            xaxis=dict(
                rangeslider=dict(visible=True),
                type="date"
            )
        )
        
        # Enable click events for cross-filtering
        fig.update_traces(
            customdata=resampled_df['Region'],
            hovertemplate="<b>Date:</b> %{x}<br><b>Value:</b> %{y}<br><b>Region:</b> %{customdata}<extra></extra>"
        )
        
        # Use custom callback for handling click events
        selected_points = plotly_chart_with_callback(fig, key="timeseries_traffic")
        if selected_points:
            region = selected_points[0]['customdata']
            st.session_state['chart_filter'] = ('Region', region)
            st.rerun()
        
    else:  # User Engagement
        fig = px.line(resampled_df, x='Date', y=['Active Users', 'Session Duration'], color='Region',
                     title='User Engagement Over Time',
                     labels={'value': 'Value', 'variable': 'Metric'})
        
        # Add range slider
        fig.update_layout(
            xaxis=dict(
                rangeslider=dict(visible=True),
                type="date"
            )
        )
        
        # Enable click events for cross-filtering
        fig.update_traces(
            customdata=resampled_df['Region'],
            hovertemplate="<b>Date:</b> %{x}<br><b>Value:</b> %{y}<br><b>Region:</b> %{customdata}<extra></extra>"
        )
        
        # Use custom callback for handling click events
        selected_points = plotly_chart_with_callback(fig, key="timeseries_engagement")
        if selected_points:
            region = selected_points[0]['customdata']
            st.session_state['chart_filter'] = ('Region', region)
            st.rerun()

with tab2:
    # Interactive distribution chart
    if data_source == "Sales Data":
        # Create a histogram with plotly
        metric_to_show = st.selectbox("Select Metric", ["Revenue", "Orders", "Average Order Value"], key="sales_metric")
        fig = px.histogram(filtered_df, x=metric_to_show, color="Region", 
                          title=f"Distribution of {metric_to_show}")
        st.plotly_chart(fig, use_container_width=True)
        
    elif data_source == "Website Traffic":
        metric_to_show = st.selectbox("Select Metric", ["Visitors", "Page Views", "Bounce Rate"], key="traffic_metric")
        fig = px.histogram(filtered_df, x=metric_to_show, color="Region", 
                          title=f"Distribution of {metric_to_show}")
        st.plotly_chart(fig, use_container_width=True)
        
    else:  # User Engagement
        metric_to_show = st.selectbox("Select Metric", ["Active Users", "Session Duration", "Conversion Rate"], key="engagement_metric")
        fig = px.histogram(filtered_df, x=metric_to_show, color="Region", 
                          title=f"Distribution of {metric_to_show}")
        st.plotly_chart(fig, use_container_width=True)

with tab3:
    # Interactive breakdown by region
    if data_source == "Sales Data":
        breakdown_metric = st.selectbox("Select Metric for Regional Breakdown", 
                                      ["Revenue", "Orders", "Average Order Value"], 
                                      key="sales_breakdown")
        
        # Create a pie chart for region breakdown
        fig_pie = px.pie(filtered_df, values=breakdown_metric, names='Region', 
                        title=f'{breakdown_metric} by Region')
        fig_pie.update_traces(textposition='inside', textinfo='percent+label')
        st.plotly_chart(fig_pie, use_container_width=True)
        
        # Create a bar chart for product category breakdown
        fig_bar = px.bar(filtered_df.groupby(['Region', 'Product Category'])[breakdown_metric].sum().reset_index(), 
                        x='Region', y=breakdown_metric, color='Product Category',
                        title=f'{breakdown_metric} by Region and Product Category',
                        barmode='group')
        st.plotly_chart(fig_bar, use_container_width=True)
        
    elif data_source == "Website Traffic":
        breakdown_metric = st.selectbox("Select Metric for Regional Breakdown", 
                                      ["Visitors", "Page Views", "Bounce Rate"], 
                                      key="traffic_breakdown")
        
        fig_pie = px.pie(filtered_df, values=breakdown_metric, names='Region', 
                        title=f'{breakdown_metric} by Region')
        fig_pie.update_traces(textposition='inside', textinfo='percent+label')
        st.plotly_chart(fig_pie, use_container_width=True)
        
        fig_bar = px.bar(filtered_df.groupby(['Region', 'Traffic Source'])[breakdown_metric].sum().reset_index(), 
                        x='Region', y=breakdown_metric, color='Traffic Source',
                        title=f'{breakdown_metric} by Region and Traffic Source',
                        barmode='group')
        st.plotly_chart(fig_bar, use_container_width=True)
        
    else:  # User Engagement
        breakdown_metric = st.selectbox("Select Metric for Regional Breakdown", 
                                      ["Active Users", "Session Duration", "Conversion Rate"], 
                                      key="engagement_breakdown")
        
        fig_pie = px.pie(filtered_df, values=breakdown_metric, names='Region', 
                        title=f'{breakdown_metric} by Region')
        fig_pie.update_traces(textposition='inside', textinfo='percent+label')
        st.plotly_chart(fig_pie, use_container_width=True)
        
        fig_bar = px.bar(filtered_df.groupby(['Region', 'User Type'])[breakdown_metric].sum().reset_index(), 
                        x='Region', y=breakdown_metric, color='User Type',
                        title=f'{breakdown_metric} by Region and User Type',
                        barmode='group')
        st.plotly_chart(fig_bar, use_container_width=True)

# Interactive data table with filtering
st.markdown('<p class="sub-header">Detailed Data</p>', unsafe_allow_html=True)

# Add search functionality
search_term = st.text_input("Search in data", key="search_box")
if search_term:
    # Search across all string columns
    string_columns = filtered_df.select_dtypes(include=['object']).columns
    mask = False
    for col in string_columns:
        mask = mask | filtered_df[col].str.contains(search_term, case=False, na=False)
    search_results = filtered_df[mask]
    
    # Display interactive dataframe with selection
    selected_rows = st.data_editor(
        search_results,
        use_container_width=True,
        hide_index=True,
        disabled=True,
        key="search_results_table"
    )
    
    # Handle row selection for cross-filtering
    if st.button("Filter by Selected Row"):
        if isinstance(selected_rows, dict) and len(selected_rows) > 0:
            # Get the first selected row index
            try:
                row_index = next(iter(selected_rows))
                # Use the row index to get the corresponding data
                selected_row = search_results.iloc[int(row_index) if isinstance(row_index, str) and row_index.isdigit() else 0]
                # Use Region as the filter column
                st.session_state['chart_filter'] = ('Region', selected_row['Region'])
                st.rerun()
            except (ValueError, IndexError, KeyError):
                st.error("Please select a valid row first")
                pass
else:
    # Add column sorting and pagination
    page_size = st.selectbox("Rows per page", [10, 25, 50, 100], key="page_size")
    page_number = st.number_input("Page", min_value=1, max_value=max(1, len(filtered_df) // page_size + 1), value=1, key="page_number")
    
    start_idx = (page_number - 1) * page_size
    end_idx = min(start_idx + page_size, len(filtered_df))
    
    # Display interactive dataframe with selection
    selected_rows = st.data_editor(
        filtered_df.iloc[start_idx:end_idx],
        use_container_width=True,
        hide_index=True,
        disabled=True,
        key="data_table"
    )
    
    # Handle row selection for cross-filtering
    if st.button("Filter by Selected Row"):
        if isinstance(selected_rows, dict) and len(selected_rows) > 0:
            # Get the first selected row index
            try:
                row_index = next(iter(selected_rows))
                # Use the row index to get the corresponding data
                selected_row = filtered_df.iloc[start_idx + (int(row_index) if isinstance(row_index, str) and row_index.isdigit() else 0)]
                # Use Region as the filter column
                st.session_state['chart_filter'] = ('Region', selected_row['Region'])
                st.rerun()
            except (ValueError, IndexError, KeyError):
                st.error("Please select a valid row first")
                pass
            
    st.text(f"Showing {start_idx+1} to {end_idx} of {len(filtered_df)} entries")

# Download data option
csv = filtered_df.to_csv(index=False)
st.download_button(
    label="Download data as CSV",
    data=csv,
    file_name=f"{data_source.replace(' ', '_').lower()}_data.csv",
    mime="text/csv",
    key="download_button"
)

# Footer
st.markdown("---")
st.markdown("Dashboard created with Streamlit and deployed with Terraform on AWS")

# Add session state to maintain filters between interactions
if 'last_refresh' not in st.session_state:
    st.session_state['last_refresh'] = datetime.datetime.now()

# Display last refresh time
st.sidebar.markdown(f"Last refreshed: {st.session_state['last_refresh'].strftime('%Y-%m-%d %H:%M:%S')}")

# Update last refresh time when button is clicked
if refresh_button:
    st.session_state['last_refresh'] = datetime.datetime.now()
    st.rerun()