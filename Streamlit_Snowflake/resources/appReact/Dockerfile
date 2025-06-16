FROM node:16-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the React app
RUN npm run build

# Expose the port
EXPOSE 80

# Use a simple HTTP server to serve the static files
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "80"]