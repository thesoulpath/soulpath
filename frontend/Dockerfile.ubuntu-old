# Use Ubuntu base image for better compatibility
FROM ubuntu:20.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies and Node.js with retry logic
RUN apt-get update --fix-missing && \
    apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    python3.8 \
    python3.8-dev \
    python3-pip \
    ca-certificates \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /tmp/* \
    && rm -rf /var/tmp/*

# Create symlinks for python
RUN ln -s /usr/bin/python3.8 /usr/bin/python
RUN ln -s /usr/bin/pip3 /usr/bin/pip

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY rasa/requirements.txt ./rasa/

# Install Node.js dependencies
RUN npm install

# Install Python dependencies
RUN pip install --no-cache-dir -r rasa/requirements.txt
RUN pip install --no-cache-dir rasa==3.6.21 tensorflow spacy
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Train Rasa model
RUN cd rasa && rasa train

# Make startup script executable
RUN chmod +x start-servers.sh

# Expose ports
EXPOSE 3000 5005

# Start both servers
CMD ["./start-servers.sh"]
