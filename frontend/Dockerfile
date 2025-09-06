# Rasa-only Dockerfile for Render.com deployment
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir spacy==3.6.1 && \
    pip install --no-cache-dir rasa==3.6.21 && \
    python -m spacy download en_core_web_sm

# Copy Rasa project
COPY rasa/ ./rasa/

# Copy startup script
COPY start-rasa.sh ./start-rasa.sh

# Set working directory to rasa
WORKDIR /app/rasa

# Make startup script executable
RUN chmod +x /app/start-rasa.sh

# Train Rasa model
RUN rasa train

# Expose port (will be overridden by Render's PORT env var)
EXPOSE 5005

# Health check for Rasa (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-5005}/health || exit 1

# Start Rasa server using startup script
CMD ["/app/start-rasa.sh"]
