#!/bin/bash

# Git Hooks Setup Script
# Configures Git to use our validation hooks

echo "🔧 Setting up Git hooks for mandatory validation..."

# Configure Git to use our hooks directory
git config core.hooksPath .githooks

# Make sure hooks are executable
chmod +x .githooks/*

echo "✅ Git hooks configured successfully"
echo "🛡️  All commits will now be validated automatically"
echo "💡 To bypass validation (NOT RECOMMENDED): git commit --no-verify"