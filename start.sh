#!/bin/bash

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "⚠️  Warning: $1 is not installed."
        return 1
    fi
    return 0
}

# Check for Python and Node
check_command python || check_command python3
check_command node

# Check for .venv and use it if it exists
if [ -d ".venv" ]; then
    echo "🐍 Using virtual environment (.venv)..."
    export PATH="$(pwd)/.venv/Scripts:$(pwd)/.venv/bin:$PATH"
fi

# Create data directory
mkdir -p backend/data

echo "📦 Installing backend dependencies..."
python -m pip install -r backend/requirements.txt

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Start Backend
echo "🚀 Starting Backend on Port 8000..."
cd backend
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "🚀 Starting Frontend on Port 5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Save PIDs
echo "$BACKEND_PID" > .pids
echo "$FRONTEND_PID" >> .pids

echo ""
echo "✅ FinStream Pro is starting..."
echo "📡 Backend API: http://localhost:8000"
echo "🖥️  Frontend:    http://localhost:5173"
echo "📋 API Docs:    http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

# Handle Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm .pids; exit" SIGINT

# Wait for background processes
wait
