FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Debug: Show current directory and files
RUN pwd && ls -la

# Copy public directory first
COPY public/ ./public/

# Copy source code
COPY src/ ./src/

# Copy other necessary files
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]