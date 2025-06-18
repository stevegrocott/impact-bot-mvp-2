#!/bin/bash

# Script to fix common TypeScript patterns that cause errors

echo "🔧 Fixing common TypeScript patterns..."

# Fix 1: Replace req.user! with proper type checking
echo "Fixing req.user! patterns..."
find src -name "*.ts" -type f | while read file; do
  if grep -q "req\.user!" "$file"; then
    echo "  Fixing: $file"
    # Add import if not present
    if ! grep -q "getUserContext" "$file"; then
      sed -i '' '1a\
import { getUserContext } from "@/utils/routeHelpers";
' "$file"
    fi
    # Replace patterns
    sed -i '' 's/req\.user!/getUserContext(req)/g' "$file"
  fi
done

# Fix 2: Replace loose comparisons with strict ones
echo "Fixing loose comparisons..."
find src -name "*.ts" -type f | while read file; do
  sed -i '' 's/== /=== /g' "$file"
  sed -i '' 's/!= /!== /g' "$file"
done

# Fix 3: Add proper type annotations to route handlers
echo "Fixing route handler types..."
find src/routes -name "*.ts" -type f | while read file; do
  # Add Request, Response imports if not present
  if ! grep -q "Request, Response" "$file"; then
    sed -i '' 's/import { Router }/import { Router, Request, Response }/g' "$file"
  fi
done

# Fix 4: Replace optional property assignments
echo "Fixing optional property assignments..."
find src -name "*.ts" -type f | while read file; do
  # Fix patterns like: this.field = value || undefined
  sed -i '' 's/= \(.*\) || undefined/= \1 !== undefined ? \1 : undefined/g' "$file"
done

echo "✅ Common patterns fixed!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run build' to check remaining errors"
echo "2. Manually review and fix complex type issues"
echo "3. Run tests to ensure functionality"