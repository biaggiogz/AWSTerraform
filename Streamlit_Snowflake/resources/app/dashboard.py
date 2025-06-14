import streamlit as st
import pandas as pd
import numpy as np
from PIL import Image
import datetime

# Load favicon
favicon = Image.open('assets/favicon/aws-custom-favicon-kdm.ico')

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
</style>
""", unsafe_allow_html=True)

# Header
st.markdown('<p class="main-header">Analytics Dashboard</p>', unsafe_allow_html=True)

# Sidebar
with st.sidebar:
    st.image("assets/AWS_logo_RGB_REV.png", width=100)
    st.image("assets/tf-logo.png", width=100)
    
    st.markdown("### Dashboard Settings")
    date_range = st.date_input(
        "Select Date Range",
        value=(datetime.date.today() - datetime.timedelta(days=30), datetime.date.today())
    )
    
    data_source = st.selectbox(
        "Data Source",
        ["Sales Data", "Website Traffic", "User Engagement"]
    )
    
    region = st.multiselect(
        "Region",
        ["North America", "Europe", "Asia Pacific", "South America", "Africa"],
        default=["North America", "Europe"]
    )
    
    st.button("Refresh Data")

# Generate sample data
def generate_sample_data(data_type):
    dates = pd.date_range(date_range[0], date_range[1], freq='D')
    
    if data_type == "Sales Data":
        data = {
            'Date': dates,
            'Revenue': np.random.randint(5000, 15000, size=len(dates)),
            'Orders': np.random.randint(100, 500, size=len(dates)),
            'Average Order Value': np.random.randint(50, 150, size=len(dates))
        }
    elif data_type == "Website Traffic":
        data = {
            'Date': dates,
            'Visitors': np.random.randint(1000, 5000, size=len(dates)),
            'Page Views': np.random.randint(3000, 15000, size=len(dates)),
            'Bounce Rate': np.random.uniform(0.2, 0.6, size=len(dates))
        }
    else:  # User Engagement
        data = {
            'Date': dates,
            'Active Users': np.random.randint(500, 2000, size=len(dates)),
            'Session Duration': np.random.uniform(2, 10, size=len(dates)),
            'Conversion Rate': np.random.uniform(0.01, 0.1, size=len(dates))
        }
    
    return pd.DataFrame(data)

# Generate data based on selection
df = generate_sample_data(data_source)

# Main dashboard
# Key metrics
st.markdown('<p class="sub-header">Key Metrics</p>', unsafe_allow_html=True)
col1, col2, col3, col4 = st.columns(4)

if data_source == "Sales Data":
    with col1:
        st.metric("Total Revenue", f"${df['Revenue'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Total Orders", f"{df['Orders'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Avg Order Value", f"${df['Average Order Value'].mean():.2f}", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Conversion Rate", f"{np.random.uniform(1, 5):.2f}%", f"{np.random.randint(-10, 20)}%")
elif data_source == "Website Traffic":
    with col1:
        st.metric("Total Visitors", f"{df['Visitors'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Total Page Views", f"{df['Page Views'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Avg Bounce Rate", f"{df['Bounce Rate'].mean()*100:.2f}%", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Avg Pages/Session", f"{df['Page Views'].sum() / df['Visitors'].sum():.2f}", f"{np.random.randint(-10, 20)}%")
else:  # User Engagement
    with col1:
        st.metric("Active Users", f"{df['Active Users'].sum():,}", f"{np.random.randint(-10, 20)}%")
    with col2:
        st.metric("Avg Session Duration", f"{df['Session Duration'].mean():.2f} min", f"{np.random.randint(-10, 20)}%")
    with col3:
        st.metric("Conversion Rate", f"{df['Conversion Rate'].mean()*100:.2f}%", f"{np.random.randint(-10, 20)}%")
    with col4:
        st.metric("Retention Rate", f"{np.random.uniform(20, 80):.2f}%", f"{np.random.randint(-10, 20)}%")

# Charts
st.markdown('<p class="sub-header">Trend Analysis</p>', unsafe_allow_html=True)
tab1, tab2 = st.tabs(["Time Series", "Distribution"])

with tab1:
    # Time series chart
    if data_source == "Sales Data":
        chart_data = df.set_index('Date')[['Revenue', 'Orders']]
        st.line_chart(chart_data)
    elif data_source == "Website Traffic":
        chart_data = df.set_index('Date')[['Visitors', 'Page Views']]
        st.line_chart(chart_data)
    else:  # User Engagement
        chart_data = df.set_index('Date')[['Active Users', 'Session Duration']]
        st.line_chart(chart_data)

with tab2:
    # Distribution chart
    if data_source == "Sales Data":
        st.bar_chart(df['Revenue'])
    elif data_source == "Website Traffic":
        st.bar_chart(df['Visitors'])
    else:  # User Engagement
        st.bar_chart(df['Active Users'])

# Data table
st.markdown('<p class="sub-header">Detailed Data</p>', unsafe_allow_html=True)
st.dataframe(df, use_container_width=True)

# Footer
st.markdown("---")
st.markdown("Dashboard created with Streamlit and deployed with Terraform on AWS")