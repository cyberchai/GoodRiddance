FROM python:3.12-slim-bookworm
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN if [ -f /app/vendor/dd-cli ]; then chmod 755 /app/vendor/dd-cli; fi
ENV DD_CLI_PATH=/app/vendor/dd-cli
ENV PYTHONUNBUFFERED=1
CMD ["sh", "-c", "exec uvicorn server:app --host 0.0.0.0 --port ${PORT:-8080}"]
