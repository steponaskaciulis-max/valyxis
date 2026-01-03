#!/bin/bash

# Simple local server for Valyxis
# This ensures CSS and JS load properly when testing locally

echo "🚀 Starting Valyxis local server..."
echo ""
echo "Open your browser and go to:"
echo "   http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Try Python 3 first, then Python 2, then PHP
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    php -S localhost:8000
else
    echo "❌ No server found. Please install Python or PHP."
    echo ""
    echo "Or use:"
    echo "  npx serve"
    echo "  npm install -g serve && serve"
    exit 1
fi

