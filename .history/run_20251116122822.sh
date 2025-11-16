#!/bin/bash

echo "Setting up CrossPay..."

# -----------------------------
# 1. BACKEND SETUP
# -----------------------------
echo "Setting up backend..."

cd backend

# Create virtual environment if missing
if [ ! -d "venv" ]; then
    echo "Creating Python venv..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt > /dev/null

# Ensure .env exists
if [ ! -f ".env" ]; then
    echo "📝 No .env found — copying .env.example..."
    cp .env.example .env
fi

# Start backend (in background)
echo "⚡ Starting backend on 127.0.0.1:8000..."
uvicorn app.main:app --reload &
BACKEND_PID=$!

cd ..

# -----------------------------
# 2. FRONTEND SETUP
# -----------------------------
echo "Setting up frontend..."

cd frontend

# Install npm packages only if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install > /dev/null
fi

echo "Starting frontend on http://localhost:5173 ..."
npm run dev

# Kill backend when frontend exits
kill $BACKEND_PID
