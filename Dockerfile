FROM python:3.11-slim

WORKDIR /app

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
