# Use Node.js 18 Alpine Linux base image for smaller size
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Debug: Show current directory and files to troubleshoot Railway builds
RUN pwd && ls -la

# Copy public directory (static assets)
COPY public/ ./public/

# Copy all frontend source files
COPY . .

# Build the React application for production
RUN npm run build

# Expose port 3000 for the application
EXPOSE 3000

# Start the application (Note: This runs dev server, should be overridden in Railway)
CMD ["npm", "start"]