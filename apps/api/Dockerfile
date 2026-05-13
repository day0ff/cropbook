# Use Node.js 18 on Debian Bullseye as base image
FROM node:18-bullseye

# Install Python3, pip3, and required system libraries for PaddleOCR
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install PaddlePaddle (CPU version) and PaddleOCR
RUN pip3 install --no-cache-dir paddlepaddle paddleocr

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]