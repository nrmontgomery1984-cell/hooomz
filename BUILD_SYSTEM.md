# Build System Documentation

This document explains the build system setup for the Hooomz monorepo.

## Overview

The Hooomz project uses a custom build script that respects package dependencies to ensure correct build order in the monorepo. The build system is designed to:

1. Build packages in dependency order
2. Support parallel builds where possible
3. Provide clear feedback during builds
4. Integrate with CI/CD pipelines

## Build Order

The build process follows this order:

```
1. @hooomz/shared-contracts  (foundation types)
   ↓
2. @hooomz/db, @hooomz/ui    (infrastructure - parallel)
   ↓
3. Feature packages           (parallel)
   - @hooomz/customers
   - @hooomz/projects
   - @hooomz/estimating
   - @hooomz/scheduling
   - @hooomz/field-docs
   - @hooomz/reporting
   ↓
4. web app                    (depends on all packages)
```

### Why This Order?

1. **shared-contracts** must be built first because all other packages import types from it
2. **db** and **ui** depend on shared-contracts but not on each other, so they build in parallel
3. **Feature packages** all depend on shared-contracts, db, and ui, but not on each other, so they build in parallel
4. **web app** imports from all packages, so it builds last

## Build Scripts

### Root package.json Scripts

```json
{
  "build": "node scripts/build.js",
  "build:packages": "pnpm --filter './packages/*' build",
  "build:app": "pnpm --filter web build",
  "build:shared": "pnpm --filter @hooomz/shared-contracts build"
}
```

### Usage

```bash
# Build everything in correct order
pnpm build

# Build only packages (not web app)
pnpm build:packages

# Build only web app (assumes packages are built)
pnpm build:app

# Build only shared contracts
pnpm build:shared
```

## The Build Script

Located at [scripts/build.js](scripts/build.js), this script:

1. Provides colored terminal output for better visibility
2. Builds packages in the correct dependency order
3. Exits immediately on failure
4. Shows total build time

### Features

- ✅ Dependency-aware build order
- ✅ Colored output for readability
- ✅ Error handling with immediate exit
- ✅ Build time tracking
- ✅ Clear progress indicators

### Example Output

```
┌─────────────────────────────────────┐
│  Building Hooomz Monorepo           │
└─────────────────────────────────────┘

📦 Step 1: Building foundation packages
Building @hooomz/shared-contracts...
✓ Building @hooomz/shared-contracts completed

📦 Step 2: Building core infrastructure
Building @hooomz/db...
✓ Building @hooomz/db completed
Building @hooomz/ui...
✓ Building @hooomz/ui completed

📦 Step 3: Building feature packages
Building feature packages (parallel)...
✓ Building feature packages (parallel) completed

📦 Step 4: Building web application
Building web app...
✓ Building web app completed

┌─────────────────────────────────────┐
│  ✓ Build completed in 45.32s        │
└─────────────────────────────────────┘
```

## Clean Scripts

### clean

Removes build artifacts and cache:

```bash
pnpm clean
```

This runs:
```bash
pnpm -r clean && rimraf node_modules/.cache
```

Each package's `clean` script typically removes:
- `dist/` directory
- `.next/` directory (for web app)
- TypeScript build cache

### clean:all

Nuclear option - removes everything including node_modules:

```bash
pnpm clean:all
```

⚠️ **Warning**: This will require running `pnpm install` again.

## Verification Script

Located at [scripts/verify-setup.js](scripts/verify-setup.js), this script checks:

- ✓ Core configuration files exist
- ✓ Test configuration is present
- ✓ All packages have required scripts (build, lint, typecheck)
- ✓ Git hooks are configured
- ✓ CI/CD workflows are present

### Usage

```bash
node scripts/verify-setup.js
```

Run this after cloning to ensure your environment is correctly set up.

## Package Requirements

Each package must have these scripts in its package.json:

```json
{
  "scripts": {
    "build": "tsc -b",
    "clean": "rm -rf dist",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit"
  }
}
```

### Why?

The root scripts use `pnpm -r` (recursive) to run these scripts across all packages. Missing scripts will cause the build to fail.

## Adding a New Package

When adding a new package:

1. **Create package structure:**
   ```
   packages/my-package/
   ├── src/
   │   └── index.ts
   ├── package.json
   └── tsconfig.json
   ```

2. **Add required scripts to package.json:**
   ```json
   {
     "name": "@hooomz/my-package",
     "scripts": {
       "build": "tsc -b",
       "clean": "rm -rf dist",
       "lint": "eslint .",
       "typecheck": "tsc --noEmit"
     }
   }
   ```

3. **Update build script if needed:**
   - If it depends on shared-contracts only: Add to parallel build in Step 3
   - If it has special dependencies: Add a new step in `scripts/build.js`

4. **Test the build:**
   ```bash
   pnpm build
   ```

## CI/CD Integration

The build system integrates with GitHub Actions CI:

### CI Workflow

Location: [.github/workflows/ci.yml](.github/workflows/ci.yml)

Jobs run in parallel:
- **Test**: Runs integration tests
- **Lint**: Checks code quality
- **TypeCheck**: Validates TypeScript

Then sequentially:
- **Build**: Builds all packages (requires other jobs to pass)

### Local CI Simulation

Run the same checks as CI locally:

```bash
pnpm ci
```

This runs:
1. `pnpm install --frozen-lockfile`
2. `pnpm build`
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`

## Performance Tips

### Development Builds

When working on a specific package:

```bash
# Build only the package you're working on
pnpm --filter @hooomz/customers build

# Build with dependencies
pnpm --filter @hooomz/customers... build
```

### Watch Mode

For active development:

```bash
# In the package directory
cd packages/customers
pnpm build --watch
```

### Incremental Builds

TypeScript is configured for incremental builds. Subsequent builds are faster because TypeScript caches type information.

Keep these files (don't clean):
- `tsconfig.tsbuildinfo`

## Troubleshooting

### Build Fails with "Cannot find module"

**Cause**: Package dependencies not built yet.

**Solution**:
```bash
# Clean and rebuild from scratch
pnpm clean
pnpm build
```

### Build Succeeds but Types Don't Update

**Cause**: TypeScript cache is stale.

**Solution**:
```bash
# Clean TypeScript cache
find . -name "tsconfig.tsbuildinfo" -delete
pnpm build
```

### Build is Very Slow

**Check**:
1. Are you building everything when you only changed one package?
   - Use: `pnpm --filter <package> build`
2. Is your node_modules cache corrupted?
   - Run: `pnpm clean:all && pnpm install`

### Package Build Order Issues

If you see errors about missing types:

1. Check package.json dependencies
2. Ensure shared-contracts is listed as a dependency
3. Verify the build script builds in correct order

## Advanced Usage

### Parallel Builds

Use pnpm's `--parallel` flag for faster builds:

```bash
# Build all packages in parallel (ignores dependencies)
pnpm --filter './packages/*' --parallel build
```

⚠️ **Warning**: Only use this if you know dependencies are already built.

### Filter Patterns

```bash
# Build all packages in packages/ directory
pnpm --filter './packages/*' build

# Build a specific package
pnpm --filter @hooomz/customers build

# Build a package and its dependencies
pnpm --filter '@hooomz/customers...' build

# Build a package and its dependents
pnpm --filter '...@hooomz/customers' build
```

### Building in Docker

The build script works in Docker containers:

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm build

CMD ["pnpm", "start"]
```

## Related Documentation

- 📘 [Getting Started](GETTING_STARTED.md) - Setup instructions
- 🔄 [CI/CD Guide](.github/README.md) - Continuous integration
- 🧪 [Testing Guide](tests/README.md) - Running tests
- 📦 [README](README.md) - Project overview

## Summary

The Hooomz build system:
- ✅ Respects package dependencies
- ✅ Provides clear feedback
- ✅ Integrates with CI/CD
- ✅ Supports parallel builds where safe
- ✅ Includes verification tools
- ✅ Has comprehensive documentation

For questions or issues with the build system, see the troubleshooting section above or check the related documentation.
