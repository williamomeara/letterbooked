FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy public directory first
COPY frontend/public/ ./public/

# Copy source code
COPY frontend/src/ ./src/

# Copy other necessary files
COPY frontend/ .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]