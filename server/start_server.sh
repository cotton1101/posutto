#!/bin/bash

# Configuration
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NODE_BIN="$DIR/bin/bin/node"
APP_JS="$DIR/dist/index.js"
LOG_FILE="$DIR/server.log"

export PORT=3001

# Add local node to PATH for tsx
export PATH="$DIR/bin/bin:$PATH"
export OPENSSL_CONF=/dev/null

# Check if process is running on port 3001
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Server is already running."
else
    echo "Starting server..."
    cd "$DIR"
    # Run node directly
    nohup "$NODE_BIN" "$APP_JS" >> "$LOG_FILE" 2>&1 &
    echo "Server started with PID $!"
fi
