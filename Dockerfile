# Use a minimal Node image with Debian
FROM node:18-slim

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy dependencies and install
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose your desired port (e.g., 8080)
EXPOSE 5000

# Start the app
CMD ["node", "index.js"]
