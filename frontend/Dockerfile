# Use Node.js 18 Alpine Linux base image for smaller size
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy public directory (static assets)
COPY public/ ./public/

# Copy all source files
COPY . .

# Build the React application for production
RUN npm run build

# Install serve for production static file serving
RUN npm install -g serve

# Expose port 3000 for the application
EXPOSE 3000
# deploy 
# Serve the production build
CMD ["serve", "-s", "build", "-l", "3000"]