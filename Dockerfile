# Root Dockerfile for Render deployment
# This file points to the backend directory for the Rasa server

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Set environment variables for optimization
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV TF_CPP_MIN_LOG_LEVEL=2
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1

# Copy backend requirements first for better caching
COPY backend/rasa/requirements.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir tensorflow-cpu==2.13.0 && \
    pip cache purge

# Download spaCy model
RUN python -c "import spacy.cli; spacy.cli.download('es_core_news_sm')" || \
    python -c "import spacy.cli; spacy.cli.download('en_core_web_sm')"

# Copy backend Rasa project
COPY backend/rasa/ ./

# Create necessary directories
RUN mkdir -p models logs

# Copy startup script
COPY backend/start-rasa.sh /app/start-rasa.sh
RUN chmod +x /app/start-rasa.sh

# Create non-root user for security
RUN useradd -m -u 1000 rasa && \
    chown -R rasa:rasa /app
USER rasa

# Expose port (Render will override with PORT env var)
EXPOSE 5005

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:5005/webhooks/rest/ || exit 1

# Start Rasa server
CMD ["/app/start-rasa.sh"]
