# syntax=docker/dockerfile:1.4
FROM --platform=$BUILDPLATFORM public.ecr.aws/docker/library/python:3.11.13-slim AS builder
WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

FROM --platform=$TARGETPLATFORM public.ecr.aws/docker/library/python:3.11.13-slim
WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy the application
COPY . .

# Expose the port Streamlit runs on
EXPOSE 8501

# Run Streamlit
ENTRYPOINT ["streamlit", "run", "dashboard.py", "--server.port=8501", "--server.address=0.0.0.0"]