FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for Pillow on ARM
RUN apt-get update && apt-get install -y \
    gcc \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create directories for uploads and QR codes
RUN mkdir -p static/uploads static/qrcodes

# Expose port
EXPOSE 5000

# Run application
CMD ["python", "app.py"]
