# CI/CD Documentation

## GitHub Actions Workflows

### CI Workflow

The CI workflow runs automatically on:
- Push to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

**Jobs:**

1. **Test** - Runs integration tests
   - Timeout: 15 minutes
   - Uses pnpm cache for faster installs

2. **Lint** - Runs ESLint across all packages
   - Timeout: 10 minutes
   - Checks code quality and style

3. **TypeCheck** - Runs TypeScript compiler checks
   - Timeout: 10 minutes
   - Ensures type safety across monorepo

4. **Build** - Builds all packages and the web app
   - Timeout: 20 minutes
   - Runs only after test, lint, and typecheck pass
   - Uploads build artifacts for 7 days

**Features:**
- Parallel job execution for faster feedback
- Automatic cancellation of outdated runs
- Dependency caching for faster installs
- Build artifact storage

### Cache Strategy

The workflow caches the pnpm store directory using the lockfile hash as the cache key. This significantly speeds up dependency installation:
- First run: ~2-3 minutes
- Cached runs: ~30 seconds

## Local Development

### Build Scripts

```bash
# Build everything in correct order
pnpm build

# Build only packages
pnpm build:packages

# Build only the web app
pnpm build:app

# Build shared contracts only
pnpm build:shared
```

### Testing

```bash
# Run all tests
pnpm test

# Run integration tests
pnpm test:integration

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Type check all packages
pnpm typecheck

# Format code with Prettier
pnpm format

# Check formatting
pnpm format:check
```

### Cleanup

```bash
# Clean build artifacts
pnpm clean

# Clean everything including node_modules
pnpm clean:all
```

### Full CI Run Locally

```bash
# Run the same checks as CI
pnpm ci
```

## Pre-commit Hooks

Husky is configured to run checks before each commit:

### Pre-commit
- ✓ Linting
- ✓ TypeScript type checking

If either check fails, the commit is blocked. Fix the errors and try again.

### Commit Message
Enforces conventional commit format:

```
<type>(<scope>): <subject>

Types:
  feat:     New feature
  fix:      Bug fix
  docs:     Documentation changes
  style:    Code style changes (formatting, etc)
  refactor: Code refactoring
  test:     Adding or updating tests
  chore:    Maintenance tasks
  perf:     Performance improvements
  ci:       CI/CD changes
  build:    Build system changes
  revert:   Revert a previous commit
```

**Examples:**
```bash
git commit -m "feat(customers): add customer search functionality"
git commit -m "fix(estimating): correct tax calculation rounding"
git commit -m "docs: update README with setup instructions"
```

## Build Order

The build script respects package dependencies:

1. **@hooomz/shared-contracts** - Foundation types
2. **@hooomz/db** - Database layer
3. **@hooomz/ui** - UI components
4. **Feature packages** (parallel):
   - @hooomz/customers
   - @hooomz/projects
   - @hooomz/estimating
   - @hoomomz/scheduling
   - @hooomz/field-docs
   - @hooomz/reporting
5. **web** - Next.js application

## Setting Up Husky

After cloning the repository:

```bash
# Install dependencies
pnpm install

# Setup git hooks
pnpm prepare
```

Husky will automatically be configured.

## Troubleshooting

### CI Failing on Dependency Installation

```bash
# Locally, update the lockfile
pnpm install

# Commit the updated pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### Pre-commit Hook Not Running

```bash
# Reinstall hooks
rm -rf .husky
pnpm prepare
```

### Cache Issues in CI

If the CI cache becomes corrupted, you can:
1. Clear the cache manually from GitHub Actions UI
2. Update the cache key in `.github/workflows/ci.yml`

### Build Failures

```bash
# Clean everything and rebuild
pnpm clean:all
pnpm install
pnpm build
```

## Best Practices

1. **Always run tests before pushing:**
   ```bash
   pnpm test
   ```

2. **Keep commits small and focused:**
   - One feature/fix per commit
   - Use conventional commit format

3. **Run full CI check before creating PR:**
   ```bash
   pnpm ci
   ```

4. **Fix linting issues immediately:**
   ```bash
   pnpm lint:fix
   ```

5. **Keep dependencies up to date:**
   - Review Dependabot PRs
   - Test thoroughly before merging

## Adding New Packages

When adding a new package:

1. Update `scripts/build.js` if it has special dependencies
2. Ensure it has `build`, `lint`, and `typecheck` scripts
3. Add to appropriate build phase
4. Test locally: `pnpm build`

## Performance Tips

**Local Development:**
- Use `pnpm dev` for hot reloading
- Use `pnpm test:watch` for test-driven development
- Build only what changed with `pnpm --filter <package> build`

**CI Performance:**
- Keep pnpm-lock.yaml up to date for cache hits
- Minimize dependencies to reduce install time
- Use concurrency for independent jobs
