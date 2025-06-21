# Build Scripts Documentation

## Quick Start

```bash
# TypeScript validation for both projects (RECOMMENDED)
npm run typecheck:all

# Build both projects (includes full webpack/production builds)
npm run build:all

# Run all tests
npm run test:all
```

## Available Scripts

### TypeScript Validation
- `npm run typecheck:all` - Check TypeScript compilation for both frontend and backend
- `npm run typecheck:parallel` - Same as above, but runs checks in parallel (faster)
- `npm run typecheck:backend` - Check only backend TypeScript
- `npm run typecheck:frontend` - Check only frontend TypeScript

### Full Builds
- `npm run build:all` - Build both frontend and backend for production
- `npm run build:parallel` - Same as above, but builds in parallel
- `npm run build:backend` - Build only backend
- `npm run build:frontend` - Build only frontend (includes validation steps)

### Development
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only backend development server
- `npm run dev:frontend` - Start only frontend development server

### Testing
- `npm run test:all` - Run tests for both projects
- `npm run test:backend` - Run only backend tests
- `npm run test:frontend` - Run only frontend tests

### Validation
- `npm run validate:types` - TypeScript-only validation (fastest)
- `npm run validate:all` - Full validation: TypeScript + tests

### Maintenance
- `npm run clean` - Clean build artifacts from both projects
- `npm run clean:backend` - Clean only backend build artifacts
- `npm run clean:frontend` - Clean only frontend build artifacts

## Why Use These Scripts?

### Prevent Cross-Project Type Issues
The new scripts catch TypeScript errors that occur when frontend and backend types get out of sync. For example:

```bash
# This catches issues like:
# - Backend adds new fields that frontend doesn't expect
# - Frontend uses types that backend has changed
# - Import path changes that affect both projects
npm run typecheck:all
```

### Pre-Commit Workflow
**IMPORTANT**: Current test suite has critical issues. Follow this workflow:

```bash
# 1. Quick TypeScript check (fastest - WORKS)
npm run typecheck:all

# 2. Production build validation (WORKS with warnings)
npm run build:all

# 3. Development server quick test (MANUAL)
# Start dev server and verify no lodash/dependency errors
npm run dev

# 4. Commit your changes
git commit -m "your changes"
```

### Enhanced Validation (Coming Soon)
Future workflow once test infrastructure is fixed:

```bash
# 1. Development environment validation
npm run validate:dev-ready

# 2. Full pre-commit validation
npm run validate:commit-ready

# 3. Commit with confidence
git commit -m "your changes"
```

### CI/CD Integration
These scripts are designed for CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Validate TypeScript
  run: npm run typecheck:all
  
- name: Build Projects
  run: npm run build:all
  
- name: Run Tests
  run: npm run test:all
```

## Performance Notes

- `typecheck:parallel` is faster than `typecheck:all` (parallel execution)
- `typecheck:all` is faster than `build:all` (no webpack compilation)
- Use `typecheck:*` for quick validation during development
- Use `build:*` for full production builds

## Troubleshooting

### Frontend Build Issues
If `npm run build:frontend` fails with Babel/webpack errors:
```bash
# Try the TypeScript-only check first
npm run typecheck:frontend

# Clean and retry
npm run clean:frontend
npm run build:frontend
```

### Development Server Issues
If `npm start` fails with lodash/dependency errors:
```bash
# Clean reinstall dependencies (common fix)
rm -rf node_modules package-lock.json
npm install

# Then restart development server
npm start
```

### Backend Build Issues
Backend builds are more reliable since they use pure TypeScript:
```bash
npm run typecheck:backend
```

### Cross-Project Issues
If you see import errors between projects:
```bash
# Check both projects for consistency
npm run typecheck:all
```