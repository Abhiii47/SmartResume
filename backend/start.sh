#!/usr/bin/env bash
set -e

echo "Starting FastAPI server..."

uvicorn main:app \
  --host 0.0.0.0 \
  --port ${PORT:-8000}

