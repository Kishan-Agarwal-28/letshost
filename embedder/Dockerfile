FROM python:3.11-slim

# Install required packages
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-venv \
    curl \
    vim \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create writable cache dir to prevent uv errors
RUN mkdir -p /tmp/.cache/uv && chmod -R 777 /tmp/.cache
ENV XDG_CACHE_HOME=/tmp/.cache

# Copy app code
COPY . .

# Install uv and install dependencies without using cache
RUN pip install uv && uv sync --locked --python /usr/local/bin/python3 --no-cache


EXPOSE 7860

# Start your app
CMD ["uv", "run", "main.py", "--host", "0.0.0.0", "--port", "7860"]
