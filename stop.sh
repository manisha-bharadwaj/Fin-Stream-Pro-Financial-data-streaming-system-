#!/bin/bash

if [ -f .pids ]; then
    echo "🛑 Stopping FinStream Pro..."
    while read PID; do
        kill $PID 2>/dev/null
    done < .pids
    rm .pids
    echo "🛑 FinStream Pro stopped"
else
    echo "⚠️  No .pids file found. Is the app running?"
fi
