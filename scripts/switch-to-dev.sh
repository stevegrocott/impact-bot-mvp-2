#!/bin/bash

# Quick Switch to Development Environment
set -e

echo "🔄 Switching to Development Environment..."

# Stop production
./scripts/prod-down.sh

# Start development
./scripts/dev-up.sh