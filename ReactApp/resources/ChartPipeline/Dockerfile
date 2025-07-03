FROM node:16-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Make sure the data directory exists and copy CSV file to both locations
RUN mkdir -p /app/public/data
RUN cp -f /app/data/pipelinedata.csv /app/public/data/pipelinedata.csv
RUN mkdir -p /app/build
RUN mkdir -p /app/build/data

# Build the React app
RUN npm run build

# Copy CSV file to build directory for production access
RUN cp -f /app/data/pipelinedata.csv /app/build/pipelinedata.csv
RUN cp -f /app/data/pipelinedata.csv /app/build/data/pipelinedata.csv

# Use a simple HTTP server to serve the static files
RUN npm install -g serve
EXPOSE 80
CMD ["serve", "-s", "build", "-l", "80"]