#!/bin/bash

# Quick Switch to Production Environment
set -e

echo "🔄 Switching to Production Environment..."

# Stop development
./scripts/dev-down.sh

# Start production
./scripts/prod-up.sh